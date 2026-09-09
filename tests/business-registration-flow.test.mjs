import "./utils/source-loader.mjs";
import assert from "node:assert/strict";
import test, { beforeEach, mock } from "node:test";
import { readFile } from "node:fs/promises";

let inserted;
let rejectInsert = false;
let rejectReceipt = false;
let emailCalls = [];
let authenticated = true;
const client = {
  auth: { getUser: async () => ({ data: { user: authenticated ? { id: "owner", email: "owner@example.test" } : null } }) },
  from: () => ({
    insert(value) {
      return { select: () => ({ single: async () => {
        if (rejectInsert) return { data: null, error: new Error("Insert denied") };
        inserted = { id: "new-business", ...value };
        return { data: { id: inserted.id }, error: null };
      } }) };
    },
  }),
  rpc: async () => ({ data: [{ id: "different-latest-business" }, inserted], error: null }),
};
mock.module("../lib/supabase/server.ts", { namedExports: { createClient: async () => client } });
mock.module("next/cache", { namedExports: { revalidatePath: () => {} } });
mock.module("../lib/storage/photo-urls.ts", { namedExports: { signPhotoRecords: async (_, rows) => rows } });
mock.module("../lib/email.ts", { namedExports: {
  sendBusinessRegistrationReceivedEmail: async (to, name) => {
    assert.ok(inserted, "persist before sending");
    emailCalls.push({ type: "receipt", to, name });
    if (rejectReceipt) throw new Error("Receipt failed");
  },
  sendNewBusinessAlert: async (business) => { emailCalls.push({ type: "admin", ...business }); },
} });
const { createBusiness } = await import("../lib/db/businesses.ts");
const input = {
  name: " עסק חדש ", description: null, category: "coffee", kashrut: "none",
  phone: "0500000000", website: "https://example.test", instagram: null, business_number: null,
  address: "תל אביב", lat: 32.1, lng: 34.8,
};
beforeEach(() => { inserted = null; rejectInsert = false; rejectReceipt = false; emailCalls = []; authenticated = true; });

test("the owner profile submits through the notification server action", async () => {
  const page = await readFile(new URL("../app/dashboard/profile/page.tsx", import.meta.url), "utf8");
  assert.match(page, /await createBusiness\(payload\)/);
  assert.doesNotMatch(page, /\.insert\(/);
});

test("creation preserves location, uses signed-in ownership and emails the exact inserted business", async () => {
  const result = await createBusiness(input);
  assert.equal(result.business.id, "new-business");
  assert.equal(inserted.owner_id, "owner");
  assert.equal(inserted.is_active, false);
  assert.equal(inserted.address, input.address);
  assert.equal(inserted.lat, 32.1);
  assert.equal(inserted.lng, 34.8);
  assert.equal(emailCalls.length, 2);
  assert.equal(emailCalls[0].name, "עסק חדש");
  assert.equal(emailCalls[1].id, "new-business");
  assert.equal(result.notificationWarning, false);
});

test("receipt failure still sends the admin alert and returns the saved draft with a warning", async (t) => {
  t.mock.method(console, "error", () => {});
  rejectReceipt = true;
  const result = await createBusiness(input);
  assert.equal(result.notificationWarning, true);
  assert.equal(result.business.id, "new-business");
  assert.equal(emailCalls.length, 2);
});

test("failed inserts and unauthenticated calls send no email", async () => {
  rejectInsert = true;
  await assert.rejects(() => createBusiness(input), /Insert denied/);
  authenticated = false;
  await assert.rejects(() => createBusiness(input), /Not authenticated/);
  assert.deepEqual(emailCalls, []);
});

test("server rejects forged ownership, privileged fields and unsafe websites", async () => {
  for (const value of [
    { ...input, owner_id: "someone-else" }, { ...input, is_verified: true },
    { ...input, website: "javascript:alert(1)" }, { ...input, lat: 100 }, { ...input, name: " " },
  ]) await assert.rejects(() => createBusiness(value));
  assert.equal(inserted, null);
  assert.deepEqual(emailCalls, []);
});
