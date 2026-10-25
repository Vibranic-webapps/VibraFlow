/**
 * Task date/time conversion: the ONLY place that knows how a value typed in the
 * browser (wall-clock time) becomes a stored instant and back.
 *
 * Contract
 * - Form values ("local input") are offset-less wall-clock strings in the BROWSER's
 *   timezone: `YYYY-MM-DDTHH:mm` (date + time) or `YYYY-MM-DD` (date only).
 * - The wire format (client -> API, API -> client) for date-times is an unambiguous ISO 8601
 *   instant with `Z` or an offset, e.g. `2026-10-25T17:00:00.000Z`. The server never parses
 *   offset-less date-times, so the server's timezone can never change a stored value.
 * - Date-only fields (`recurrenceEnd`) are calendar dates, not instants. They travel as
 *   `YYYY-MM-DD`, are stored as UTC midnight of that date, and are read back with UTC
 *   getters (see `isoToDateOnly` / `dateOnlyToLocalDate`). No timezone shift is possible.
 *
 * Pure functions, no dependencies, so it runs in the browser, in route handlers and in
 * `node --test` (keep it free of enums/namespaces/parameter properties for type stripping).
 */

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

// Date-time with a mandatory offset: Z or +hh:mm / -hh:mm.
const ISO_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?$/;

/** True when the calendar date (y, m 1-12, d) exists, e.g. rejects 2026-02-30. */
function isRealDate(y: number, m: number, d: number): boolean {
    const probe = new Date(Date.UTC(y, m - 1, d));
    return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

/** Strict parse of an unambiguous ISO instant (offset or Z required). `null` when invalid. */
export function parseInstant(value: unknown): Date | null {
    if (typeof value !== "string") return null;
    const m = ISO_INSTANT.exec(value);
    if (!m) return null;
    const [, y, mo, d, h, mi, s] = m;
    if (!isRealDate(+y, +mo, +d) || +h > 23 || +mi > 59 || (s !== undefined && +s > 59)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** Strict parse of `YYYY-MM-DD` into UTC midnight of that calendar date. `null` when invalid. */
export function parseDateOnly(value: unknown): Date | null {
    if (typeof value !== "string") return null;
    const m = DATE_ONLY.exec(value);
    if (!m || !isRealDate(+m[1], +m[2], +m[3])) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

/** `YYYY-MM-DDTHH:mm` in the runtime's local timezone (the browser's). "" for an invalid date. */
export function isoToLocalInput(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Offset-less local wall-clock string -> full ISO instant (UTC, `...Z`), using the runtime's
 * local timezone. Throws RangeError on malformed input (callers validate the form first).
 *
 * `original` (the currently stored ISO value, when editing): if the user didn't change the
 * field, i.e. `isoToLocalInput(original) === local`, the original is returned untouched. That
 * keeps seconds/milliseconds, and the second 02:xx of the autumn DST hour (which a wall-clock
 * string cannot express), from being rewritten by an unrelated edit like a name change.
 *
 * DST: a time that doesn't exist (spring-forward gap) moves forward; a repeated time
 * (autumn hour) resolves to its first occurrence. Both are JS Date's standard behaviour.
 */
export function localInputToIso(local: string, original?: string | null): string {
    if (original && isoToLocalInput(original) === local) return original;
    const m = LOCAL_INPUT.exec(local);
    if (!m || !isRealDate(+m[1], +m[2], +m[3]) || +m[4] > 23 || +m[5] > 59) {
        throw new RangeError(`Invalid local date-time: "${local}"`);
    }
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0).toISOString();
}

/** Calendar date (`YYYY-MM-DD`) of a stored date-only value. Date-only values are UTC midnight, so read the UTC part. */
export function isoToDateOnly(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Local-midnight Date of the calendar date stored in a date-only value (for comparing with calendar days). */
export function dateOnlyToLocalDate(iso: string): Date {
    const d = new Date(iso);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Result of reading an input at the API boundary. */
export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const isBlank = (v: unknown) => v === undefined || v === null || v === "";

/** API: optional date-time field. Blank -> null; anything not an unambiguous ISO instant -> error. */
export function readInstantField(raw: unknown, field: string): Parsed<Date | null> {
    if (isBlank(raw)) return { ok: true, value: null };
    const date = parseInstant(raw);
    if (!date) {
        return {
            ok: false,
            error: `${field} must be an ISO 8601 date-time with a timezone, e.g. 2026-10-25T17:00:00.000Z or 2026-10-25T18:00:00+01:00. Times without an offset are rejected.`,
        };
    }
    return { ok: true, value: date };
}

/** API: optional date-only field (`YYYY-MM-DD`). Blank -> null. */
export function readDateOnlyField(raw: unknown, field: string): Parsed<Date | null> {
    if (isBlank(raw)) return { ok: true, value: null };
    const date = parseDateOnly(raw);
    if (!date) return { ok: false, error: `${field} must be a calendar date formatted YYYY-MM-DD.` };
    return { ok: true, value: date };
}

const HAS_OFFSET = /(Z|[+-]\d{2}:\d{2})$/;

/**
 * Client: turn the date-time fields of an outgoing task payload into wire format.
 * Offset-less local strings are converted with the browser's timezone; values that already
 * carry an offset, blanks and absent fields pass through untouched. Pass the stored task as
 * `original` on edits so unchanged fields keep their exact stored value.
 */
export function toWireDateTimes<T extends Record<string, unknown>>(
    payload: T,
    original?: { startDateTime?: string | null; endDateTime?: string | null },
): T {
    const out: Record<string, unknown> = { ...payload };
    for (const field of ["startDateTime", "endDateTime"] as const) {
        const v = out[field];
        if (typeof v === "string" && v !== "" && !HAS_OFFSET.test(v)) {
            out[field] = localInputToIso(v, original?.[field]);
        }
    }
    return out as T;
}
