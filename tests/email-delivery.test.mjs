import "./utils/source-loader.mjs";
import assert from "node:assert/strict";
import test, { mock } from "node:test";

let calls = [];
let failure = null;
mock.module("resend", { namedExports: { Resend: class {
  emails = { send: async (payload) => {
    calls.push(payload);
    return failure ? { error: { message: failure } } : { data: { id: "test-email" }, error: null };
  } };
} } });
const emails = await import("../lib/email.ts");

test("all email senders surface Resend errors, including approval and internal alerts", async () => {
  failure = "provider rejected message";
  const sends = [
    () => emails.sendBusinessRegistrationReceivedEmail("owner@example.test", "עסק"),
    () => emails.sendNewBusinessAlert({ id: "b", name: "עסק", category: "food", phone: null, owner_email: "owner@example.test" }),
    () => emails.sendBusinessApprovedEmail("owner@example.test", "עסק"),
    () => emails.sendContactAutoReply("owner@example.test", "דני", "שאלה"),
    () => emails.sendSupportReply("owner@example.test", "דני", "שאלה", "מענה"),
    () => emails.sendExpiryReminder("owner@example.test", "עסק", new Date("2027-01-01"), 7),
  ];
  for (const send of sends) await assert.rejects(send, /provider rejected message/);
  failure = null;
});

test("approval copy describes publication, payment, paused and legacy states truthfully", async () => {
  calls = [];
  await emails.sendBusinessApprovedEmail("owner@example.test", "<script>שם</script>");
  await emails.sendBusinessApprovedEmail("owner@example.test", "פעיל", new Date("2027-01-01"));
  await emails.sendBusinessApprovedEmail("owner@example.test", "מושהה", new Date("2027-01-01"), false);
  await emails.sendBusinessApprovedEmail("owner@example.test", "ותיק", undefined, true);
  assert.match(calls[0].html, />העסק שלך אושר<\/h1>/);
  assert.doesNotMatch(calls[0].html, /העסק שלך על המפה|<script>/);
  assert.match(calls[0].html, /dashboard\/billing/);
  assert.match(calls[1].html, /העסק שלך על המפה/);
  assert.doesNotMatch(calls[1].html, /לאחר תשלום/);
  assert.match(calls[2].html, /כרגע אינו מוצג לציבור/);
  assert.doesNotMatch(calls[2].html, /מופיע עכשיו במפה|לאחר תשלום/);
  assert.match(calls[3].html, /מופיע עכשיו במפה/);
  assert.doesNotMatch(calls[3].html, /לבחור עכשיו את משך|null/);
  for (const call of calls) assert.equal(call.replyTo, "support@pokarov.co.il");
});
