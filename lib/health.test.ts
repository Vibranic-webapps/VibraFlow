import { test } from "node:test";
import assert from "node:assert/strict";
import { checkHealth } from "./health.ts";

const clock = () => {
  let t = 1000;
  return () => (t += 25);
};

test("checkHealth: ping works -> 200, ok, db up", async () => {
  const r = await checkHealth(async () => 1, 50, clock());
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true, db: "up", ms: 25 });
});

test("checkHealth: ping throws -> 503, db down, error text not leaked", async () => {
  const r = await checkHealth(async () => { throw new Error("password authentication failed for user neondb_owner"); }, 50, clock());
  assert.equal(r.status, 503);
  assert.equal(r.body.ok, false);
  assert.equal(r.body.db, "down");
  assert.ok(!JSON.stringify(r).includes("neondb_owner"));
});

test("checkHealth: ping hangs -> times out as 503 instead of hanging", async () => {
  const r = await checkHealth(() => new Promise(() => {}), 20);
  assert.equal(r.status, 503);
  assert.equal(r.body.db, "down");
});
