import { Resend } from "resend";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout } from "node:timers/promises";
import { emailDraftCatalog, validateDraftVariables } from "./email-draft-catalog.mjs";

// This command never publishes templates or sends messages. Check is the default.
const write = process.argv.includes("--write-drafts");
if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required");
const resend = new Resend(process.env.RESEND_API_KEY);
const existing = [];
for (const draft of emailDraftCatalog) {
  validateDraftVariables(draft);
  const { data, error } = await resend.templates.get(draft.id);
  if (error || !data) throw new Error(error?.message ?? "Template unavailable");
  if (data.status !== "draft") throw new Error("Refusing to overwrite a published template: " + draft.alias);
  existing.push(data);
  await setTimeout(600);
}
if (write) {
  mkdirSync(".codex", { recursive: true });
  writeFileSync(".codex/email-draft-backup-" + Date.now() + ".json", JSON.stringify(existing, null, 2), { flag: "wx" });
}
for (let index = 0; index < emailDraftCatalog.length; index++) {
  const draft = emailDraftCatalog[index];
  const current = existing[index];
  const variables = current.variables?.map(({ key, type }) => ({ key, type })) ?? [];
  const drift = current.html.trim() !== draft.html.trim() || current.alias !== draft.alias ||
    JSON.stringify(variables.slice().sort((a, b) => a.key.localeCompare(b.key))) !==
      JSON.stringify(draft.variables.slice().sort((a, b) => a.key.localeCompare(b.key)));
  if (write && drift) {
    const { error } = await resend.templates.update(draft.id, {
      html: draft.html, alias: draft.alias, variables: draft.variables,
    });
    if (error) throw new Error(error.message);
    await setTimeout(600);
  }
  console.log(draft.alias + ": " + (drift ? (write ? "draft updated" : "differs from application HTML") : "aligned"));
  if (drift && !write) process.exitCode = 1;
}
