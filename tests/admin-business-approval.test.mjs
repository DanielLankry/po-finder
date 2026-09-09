import "./utils/source-loader.mjs";
import assert from "node:assert/strict";
import test, { beforeEach, mock } from "node:test";

let calls = [];
let sendFails = false;
mock.module("../lib/email.ts", { namedExports: {
  sendBusinessApprovedEmail: async (...args) => {
    calls.push(args);
    if (sendFails) throw new Error("Resend unavailable");
  },
} });
const { updateAdminBusiness } = await import("../lib/admin-business-update.ts");

function database(overrides = {}) {
  const state = { id: "business-1", owner_id: "owner-1", name: "עסק", is_verified: false,
    is_active: false, expires_at: null, is_legacy_public: false, ...overrides };
  let writes = 0;
  return {
    state,
    get writes() { return writes; },
    from(table) {
      const filters = {};
      let changes;
      const query = {
        select() { return query; },
        eq(key, value) { filters[key] = value; return query; },
        update(value) { changes = value; return query; },
        async maybeSingle() {
          if (table === "users") return { data: { email: "owner@example.test" }, error: null };
          if (Object.entries(filters).some(([k, v]) => state[k] !== v)) return { data: null, error: null };
          if (changes) {
            Object.assign(state, changes);
            writes++;
            // Model the database trigger: the email must read these returned values.
            if (state.promotion_code && !state.promotion_activated_at && changes.is_verified) {
              state.promotion_activated_at = "2026-09-09T10:00:00Z";
              state.expires_at = "2027-03-09T10:00:00Z";
              state.is_active = true;
            }
          }
          return { data: { ...state }, error: null };
        },
        single() { return query.maybeSingle(); },
      };
      return query;
    },
  };
}
beforeEach(() => { calls = []; sendFails = false; });

test("edit approval sends once and ordinary edits do not resend", async () => {
  const db = database();
  const result = await updateAdminBusiness(db, "business-1", { is_verified: true, name: "שם מעודכן" });
  assert.equal(result.notificationStatus, "sent");
  assert.deepEqual(calls, [["owner@example.test", "שם מעודכן", undefined, false]]);
  await updateAdminBusiness(db, "business-1", { name: "שינוי נוסף", is_verified: true });
  assert.equal(calls.length, 1);
});

test("approval of a paid listing uses its expiry, not payment-needed copy", async () => {
  const db = database({ expires_at: "2099-01-01T00:00:00Z" });
  await updateAdminBusiness(db, "business-1", { is_verified: true }, true);
  assert.equal(calls[0][2].toISOString(), new Date(db.state.expires_at).toISOString());
  assert.equal(calls[0][3], true);
});

test("promotion approval uses post-trigger activation and repeat approval is a no-op", async () => {
  const db = database({ promotion_code: "first-20-3m" });
  await updateAdminBusiness(db, "business-1", { is_verified: true }, true);
  assert.equal(calls[0][2].toISOString(), "2027-03-09T10:00:00.000Z");
  assert.equal(calls[0][3], true);
  const repeated = await updateAdminBusiness(db, "business-1", { is_verified: true }, true);
  assert.equal(repeated.notificationStatus, "not_needed");
  assert.equal(db.writes, 1);
  assert.equal(calls.length, 1);
});

test("simultaneous approve controls cannot both notify the owner", async () => {
  const db = database();
  const results = await Promise.all([
    updateAdminBusiness(db, "business-1", { is_verified: true }, true),
    updateAdminBusiness(db, "business-1", { is_verified: true }),
  ]);
  assert.equal(db.writes, 1);
  assert.equal(calls.length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 1);
});

test("email failure is visible while the approval remains saved", async (t) => {
  t.mock.method(console, "error", () => {});
  sendFails = true;
  const db = database();
  const result = await updateAdminBusiness(db, "business-1", { is_verified: true }, true);
  assert.equal(result.notificationStatus, "failed");
  assert.equal(result.business.is_verified, true);
  assert.equal(db.state.is_verified, true);
});
