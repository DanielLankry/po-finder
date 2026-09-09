import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20260909085248_support_inbox.sql", import.meta.url),
  "utf8",
);
const inboxRoute = await readFile(
  new URL("../app/api/admin/contact/route.ts", import.meta.url),
  "utf8",
);
const replyRoute = await readFile(
  new URL("../app/api/admin/contact/[id]/reply/route.ts", import.meta.url),
  "utf8",
);
const adminLayout = await readFile(new URL("../app/admin/layout.tsx", import.meta.url), "utf8");

test("support correspondence tables are closed to browser roles", () => {
  assert.match(migration, /alter table public\.contact_messages enable row level security/i);
  assert.match(migration, /alter table public\.contact_replies enable row level security/i);
  assert.match(migration, /revoke all on table public\.contact_messages from anon, authenticated/i);
  assert.match(migration, /revoke all on table public\.contact_replies from anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.contact_messages to service_role/i);
});

test("support APIs require the signed administrator session", () => {
  assert.match(inboxRoute, /isAdminRequest\(req\)/);
  assert.match(replyRoute, /isAdminRequest\(req\)/);
  assert.match(replyRoute, /sendSupportReply/);
  assert.match(replyRoute, /delivery_status: "sent"/);
  assert.match(replyRoute, /delivery_status: "failed"/);
});

test("the admin navigation exposes the private support inbox", () => {
  assert.match(adminLayout, /href: "\/admin\/contact", label: "פניות"/);
});
