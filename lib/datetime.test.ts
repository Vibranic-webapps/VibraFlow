// Run with `npm test`. Each timezone runs in its own child process, which sets process.env.TZ
// before any Date exists (on Windows a TZ passed at launch is ignored; assigning it at runtime works).
// Zones: Europe/Brussels (the real user), UTC (Vercel server), America/New_York (no UTC+ assumption).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
    parseInstant, parseDateOnly, isoToLocalInput, localInputToIso, isoToDateOnly,
    dateOnlyToLocalDate, readInstantField, readDateOnlyField, toWireDateTimes,
} from "./datetime.ts";

const ZONES: Record<string, number> = {
    "Europe/Brussels": -60, // getTimezoneOffset() in January
    "UTC": 0,
    "America/New_York": 300,
};

const zone = process.env.DT_ZONE;

if (!zone) {
    for (const z of Object.keys(ZONES)) {
        test(`lib/datetime in TZ=${z}`, () => {
            const r = spawnSync(process.execPath, ["--test", fileURLToPath(import.meta.url)], {
                env: { ...process.env, TZ: z, DT_ZONE: z },
                encoding: "utf8",
            });
            assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
        });
    }
} else {
    process.env.TZ = zone; // must happen before the first Date is created
    const brussels = zone === "Europe/Brussels";

    test("the child really runs in the requested timezone", () => {
        assert.equal(new Date(2026, 0, 15).getTimezoneOffset(), ZONES[zone]);
    });

    test("server-side parse is strict and timezone independent", () => {
        const good: Array<[string, string]> = [
            ["2026-10-25T17:00:00.000Z", "2026-10-25T17:00:00.000Z"],
            ["2026-10-25T17:00Z", "2026-10-25T17:00:00.000Z"],
            ["2026-10-25T18:00:00+01:00", "2026-10-25T17:00:00.000Z"],
            ["2026-07-01T18:00:00+02:00", "2026-07-01T16:00:00.000Z"],
        ];
        for (const [input, expected] of good) assert.equal(parseInstant(input)?.toISOString(), expected, input);
    });

    test("offset-less and malformed date-times are rejected", () => {
        const bad: unknown[] = [
            "2026-10-25T17:00", "2026-10-25T17:00:00", "2026-10-25T17:00:00.000", "2026-10-25",
            "", " ", "17:00", "2026-13-01T00:00:00Z", "2026-02-30T10:00:00Z", "2026-10-25T24:00:00Z",
            "2026-10-25T17:60:00Z", "2026-10-25 17:00:00Z", "yesterday", 1792947600000, {}, [], true,
        ];
        for (const input of bad) assert.equal(parseInstant(input), null, String(input));

        const r = readInstantField("2026-10-25T17:00", "startDateTime");
        assert.equal(r.ok, false);
        if (!r.ok) assert.match(r.error, /startDateTime.*offset/);
    });

    test("blank API values are accepted as null", () => {
        for (const blank of [undefined, null, ""]) {
            assert.deepEqual(readInstantField(blank, "startDateTime"), { ok: true, value: null });
            assert.deepEqual(readDateOnlyField(blank, "recurrenceEnd"), { ok: true, value: null });
        }
    });

    test("date-only values are calendar dates: no shift in any timezone", () => {
        assert.equal(parseDateOnly("2026-10-30")?.toISOString(), "2026-10-30T00:00:00.000Z");
        assert.equal(parseDateOnly("2026-10-30T00:00:00Z"), null);
        assert.equal(parseDateOnly("2026-02-30"), null);
        assert.equal(readDateOnlyField("30-10-2026", "recurrenceEnd").ok, false);
        for (const date of ["2026-03-29", "2026-10-25", "2026-12-31", "2027-01-01"]) {
            const stored = parseDateOnly(date)!.toISOString();
            assert.equal(isoToDateOnly(stored), date);
            const local = dateOnlyToLocalDate(stored);
            assert.deepEqual([local.getFullYear(), local.getMonth() + 1, local.getDate()], date.split("-").map(Number));
            assert.equal(local.getHours(), 0);
        }
    });

    test("round trip ISO -> form -> ISO is identity (reopen + save never moves a task)", () => {
        // Every 15 minutes across the Brussels changeovers and New York's fall-back.
        const windows: Array<[string, string]> = [
            ["2026-03-28T20:00:00.000Z", "2026-03-30T04:00:00.000Z"], // spring forward 2026-03-29
            ["2026-10-24T20:00:00.000Z", "2026-10-26T04:00:00.000Z"], // fall back 2026-10-25
            ["2026-11-01T00:00:00.000Z", "2026-11-02T12:00:00.000Z"], // NY fall back
        ];
        let checked = 0;
        for (const [from, to] of windows) {
            for (let t = Date.parse(from); t <= Date.parse(to); t += 15 * 60_000) {
                const iso = new Date(t).toISOString();
                const local = isoToLocalInput(iso);
                // Editing passes the stored value along: always exactly identity.
                assert.equal(localInputToIso(local, iso), iso, `${iso} (${local})`);
                checked++;
            }
        }
        assert.ok(checked > 400);
    });

    test("without the stored value, only the repeated autumn hour is lossy (first occurrence wins)", () => {
        let lossy = 0;
        for (let t = Date.parse("2026-10-24T20:00:00.000Z"); t <= Date.parse("2026-10-26T04:00:00.000Z"); t += 15 * 60_000) {
            const iso = new Date(t).toISOString();
            if (localInputToIso(isoToLocalInput(iso)) !== iso) lossy++;
        }
        assert.equal(lossy, brussels ? 4 : 0); // 02:00-02:45 CET (01:00Z-01:45Z), Brussels only
    });

    test("name-only edit sends the stored times back untouched", () => {
        const stored = { startDateTime: "2026-10-25T17:00:00.000Z", endDateTime: "2026-10-25T18:00:30.500Z" };
        const form = { name: "renamed", startDateTime: isoToLocalInput(stored.startDateTime), endDateTime: isoToLocalInput(stored.endDateTime) };
        assert.deepEqual(toWireDateTimes(form, stored), { name: "renamed", ...stored });
    });

    test("wire conversion leaves ISO values, blanks and absent fields alone", () => {
        const payload = { startDateTime: "2026-10-25T17:00:00.000Z", endDateTime: "", name: "x" };
        assert.deepEqual(toWireDateTimes(payload), payload);
        assert.deepEqual(toWireDateTimes({ completed: true }), { completed: true });
        assert.deepEqual(toWireDateTimes({ startDateTime: null }), { startDateTime: null });
    });

    test("changed local values convert using the browser's timezone", () => {
        const out = toWireDateTimes({ startDateTime: "2026-10-25T18:00", endDateTime: "2026-10-25T19:30" });
        assert.match(out.startDateTime, /Z$/);
        assert.equal(isoToLocalInput(out.startDateTime), "2026-10-25T18:00");
        assert.equal(isoToLocalInput(out.endDateTime), "2026-10-25T19:30");
        assert.throws(() => toWireDateTimes({ startDateTime: "not a date" }), RangeError);
    });

    test("Brussels wall-clock times map to the right UTC instants (DST included)", { skip: !brussels }, () => {
        const cases: Array<[string, string]> = [
            ["2026-10-25T18:00", "2026-10-25T17:00:00.000Z"], // the reported bug: 18:00 winter = 17:00Z
            ["2026-07-01T18:00", "2026-07-01T16:00:00.000Z"], // summer
            ["2026-03-29T01:59", "2026-03-29T00:59:00.000Z"], // last minute before spring forward
            ["2026-03-29T03:00", "2026-03-29T01:00:00.000Z"], // first minute after
            ["2026-03-29T02:30", "2026-03-29T01:30:00.000Z"], // does not exist: moves forward to 03:30 CEST
            ["2026-10-25T01:59", "2026-10-24T23:59:00.000Z"], // CEST before the repeated hour
            ["2026-10-25T02:30", "2026-10-25T00:30:00.000Z"], // repeated hour: first occurrence (CEST)
            ["2026-10-25T03:00", "2026-10-25T02:00:00.000Z"], // CET after
            ["2026-10-26T00:00", "2026-10-25T23:00:00.000Z"], // midnight, winter
            ["2026-03-30T00:00", "2026-03-29T22:00:00.000Z"], // midnight, summer
            ["2026-10-25T23:59", "2026-10-25T22:59:00.000Z"], // end of the changeover day
        ];
        for (const [local, iso] of cases) assert.equal(localInputToIso(local), iso, local);
        // The edit form shows what the user typed.
        assert.equal(isoToLocalInput("2026-10-25T17:00:00.000Z"), "2026-10-25T18:00");
        assert.equal(isoToLocalInput("2026-10-25T23:00:00.000Z"), "2026-10-26T00:00");
        // The repeated autumn hour: the second 02:30 (CET) keeps its exact instant when the stored value is passed.
        assert.equal(isoToLocalInput("2026-10-25T01:30:00.000Z"), "2026-10-25T02:30");
        assert.equal(localInputToIso("2026-10-25T02:30", "2026-10-25T01:30:00.000Z"), "2026-10-25T01:30:00.000Z");
    });

    test("malformed local input throws instead of guessing", () => {
        for (const bad of ["", "2026-10-25", "2026-10-25T25:00", "2026-02-30T10:00", "x"]) {
            assert.throws(() => localInputToIso(bad), RangeError, bad);
        }
    });
}
