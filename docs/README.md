# Documentation index

This directory is the source of record for project documentation. Root-level
Markdown is limited to the project overview (`README.md`) and repository
instructions (`AGENTS.md`).

## Active documentation

- [Legal compliance audit](compliance/legal-compliance-audit.md) — engineering
  review of the public legal and consent flows.
- [Design QA](quality/design-qa.md) — visual comparison notes and evidence.
- [Meta ads governance plan](marketing/meta-ads-governance-plan.md) — current
  approval gates, budget limits, and measurement plan for paid acquisition.
- [Task history](project/task-history.md) — historical implementation log and
  remaining-work snapshot.
- [DAN-109 UX audit](review-artifacts/DAN-109/attachments/pokarov-end-to-end-ux-audit-2026-08-03.md)
  — tracked end-to-end customer and owner journey evidence. Other local
  Paperclip exports in `review-artifacts/` are not repository records unless
  they are explicitly committed.

## Archive

Archived documents are retained for decision history, not current operating
instructions. Each archive area explains why its material is stale.

- [Historical implementation plans](archive/implementation/README.md)
- [March 2026 marketing plans](archive/marketing/2026-03/README.md)

Paths written as inline code inside historical documents are repository-root
relative unless the document says otherwise. Current behavior and constraints
are defined by the code, migrations, tests, and `AGENTS.md`.

## Maintenance rules

- Put new material in a descriptive area under `docs/`; do not add planning or
  audit Markdown to the repository root.
- Move superseded material into `docs/archive/` and add a dated status note.
- Merge only byte-identical or genuinely equivalent documents; preserve unique
  decisions and evidence.
- Use relative Markdown links for repository files. Stage newly added documents,
  then run `npm run docs:links` after moving or renaming documentation.
- Do not include credentials, private contact data, customer records, or other
  personal information in documentation or captured evidence.
