# DAN-74 — Supabase backup evidence and recovery-drill plan

**Prepared:** 2026-08-02T19:06:45Z  
**Owner:** Scout (research and planning)  
**Approver for any execution:** Daniel, recorded on DAN-74  
**Scope:** Read-only evidence and planning only. This revision authorizes no plan upgrade, PITR add-on, project or branch creation, backup export, restore, production query beyond read-only evidence collection, secret change, spend, or cleanup.

## 1. Decision summary

Po Finder currently has **no managed recovery point**. The Supabase organization is on the **Free** plan, PITR is disabled, and the production project's backup API returned an empty backup list. Therefore the currently defensible managed-backup retention is **none**, the latest available restore point is **none**, and no managed restore drill can be run yet.

Recommendation:

1. Adopt a near-term target of **RPO <= 24 hours** and **RTO <= 4 hours** for database service recovery, with payment reconciliation treated as a mandatory recovery step.
2. After explicit cost approval, upgrade the organization to a paid plan that provides daily physical backups; verify that the first backup appears before relying on the new protection. The current Supabase documentation says Pro retains 7 days, Team 14 days, and Enterprise up to 30 days.
3. Do **not** buy PITR by default at the present footprint. Reconsider it when the business requires RPO <= 2 minutes, because Supabase documents PITR's worst-case RPO as two minutes but requires a paid plan, at least Small compute, and an additional retention-priced add-on.
4. After a physical backup exists and Daniel separately approves the displayed clone cost, perform the drill with **Restore to a New Project** in the source region. Never perform an in-place production restore for a drill.
5. Until managed backup is approved and verified, treat the system as exposed to total database data loss. A separately approved encrypted logical export can be used as an interim measure, but it does not prove Supabase's managed-restore path and must be governed as a sensitive production-data copy.

## 2. Timestamped evidence

### Verified current state

Evidence captured read-only at **2026-08-02T19:06:45Z** using the authenticated Supabase Management API / CLI 2.75.0:

| Item | Verified result | Consequence |
|---|---|---|
| Organization | `djejojqdtvlzohwptzec`, plan `free` | No automatic daily-backup entitlement under current documented policy |
| Production project | `Po Finder` / `ymqlqdhelsocibhnanjy`; `ACTIVE_HEALTHY`; `ap-northeast-1`; Postgres 17.6 | Correct project identified; no current service-health blocker |
| Backup listing | `backups: []`; `physical_backup_data: {}` | No available managed physical backup |
| PITR | `pitr_enabled: false` | No point-in-time recovery window |
| WAL-G service flag | `walg_enabled: true` | Platform component is enabled, but this is not evidence of a retained or restorable backup; the backup list remains empty |
| Latest restore point | None returned | A restore timestamp cannot be selected today |
| Current database footprint | 8 `auth.users`, 8 `public.users`, 21 `payment_attempts`, 21 `plans`, 0 `businesses`; 19 application migrations, latest `20260716091648_move_policy_helpers_private` | Small current footprint makes validation time, not data volume, the likely RTO driver; counts are a point-in-time baseline, not immutable expectations |

Commands/endpoints used were read-only: organization GET, project GET/list, `supabase backups list --project-ref ymqlqdhelsocibhnanjy --output json`, table metadata/list, and migration list. No restore, dump, branch/project creation, plan change, or SQL mutation was performed.

### Authoritative platform facts

- Supabase's current [Database Backups documentation](https://supabase.com/docs/guides/platform/backups) states that automatic daily backups apply to Pro, Team, and Enterprise projects, with 7-, 14-, and up-to-30-day daily retention respectively; it recommends regular CLI exports for Free projects.
- The same documentation states that PITR archives WAL at two-minute intervals by default, has a worst-case RPO of two minutes, replaces daily backups while enabled, requires at least Small compute, and is a paid add-on.
- Supabase's [Restore to a New Project documentation](https://supabase.com/docs/guides/platform/clone-project) states that cloning requires a paid source with physical backups, creates a new billable project in the source region, copies the database/auth/roles and encryption root key, but does not copy Storage objects/settings, Edge Functions, Auth settings/API keys, Realtime settings, or read replicas.
- Supabase's [CLI backup/restore documentation](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) documents separate roles, schema, and data dumps and a single-transaction restore. A manual logical restore needs extra handling for migration history, `auth`/`storage` customizations, Realtime publications, extensions, and encryption keys.
- The [Supabase changelog](https://supabase.com/changelog) was checked on 2026-08-02. No recent backup/PITR breaking change superseding the current backup documentation was identified; the relevant historical changes concern physical-backup thresholds and restore-to-new-project availability.

### Inference and uncertainty

- The Free plan plus empty backup list supports the conclusion that no managed restore point is currently available. `walg_enabled: true` alone does not establish retention or recoverability.
- Supabase does not promise a fixed restore duration; the proposed four-hour RTO is a business target to validate, not a provider SLA.
- The table counts are small today, so a four-hour RTO is plausible, but the first authorized drill must measure it.
- Storage currently reports zero metadata rows, but the runbook still treats Storage as out of scope for database restore because future objects may exist and Supabase explicitly excludes object contents.

## 3. Recovery objectives

### Recommended initial objectives

- **RPO: <= 24 hours.** This matches daily physical backups and is proportionate to the current small/pre-launch footprint. Any successful payment after the chosen recovery point must be reconciled from the HYP/payment-provider record before reopening writes.
- **RTO: <= 4 hours** from incident declaration to a validated database endpoint ready for controlled application cutover. Internal sub-targets: 30 minutes to declare/select recovery point, 2 hours for restore/provisioning, 60 minutes for integrity and application checks, 30 minutes decision buffer.
- **Retention: at least 7 daily restore points** once a paid plan is approved, verified by the API rather than inferred from billing.
- **Review trigger:** revisit RPO when production begins processing regular paid listings, daily change volume materially rises, or losing one business day of users/payments is no longer acceptable. At that point compare PITR's documented two-minute RPO with an approved off-site logical-backup schedule.

### Current-state objectives

No finite current RPO or RTO can be guaranteed because there is no restorable managed backup. Schema can be reconstructed from migrations, but production rows, Auth records, payment state, and encryption-dependent data may be unrecoverable.

## 4. Options and trade-offs

| Option | What it proves | RPO/retention | Cost / risk | Decision |
|---|---|---|---|---|
| A. Stay Free; periodic encrypted logical dumps | PostgreSQL logical export/restore and schema portability | Equals dump cadence; operator-owned retention | No managed restore point; sensitive backup custody; secrets/keys, Storage objects, and platform config need separate handling | Interim only, if paid protection is declined |
| B. Paid daily physical backups + managed clone drill | Provider-managed backup availability and isolated database/auth restore | Daily; documented retention depends on plan | Paid plan plus temporary clone project; clone excludes several platform resources | **Recommended baseline** |
| C. Paid PITR + managed clone drill | Fine-grained timestamp recovery and managed isolated restore | Worst-case two-minute RPO; 7/14/28-day PITR choices in current docs | PITR add-on, minimum Small compute, temporary clone cost; materially higher recurring cost | Defer until business RPO requires it |
| D. In-place production restore | Production restore path | Depends on protection tier | Downtime and destructive rollback of live data | Reject for drills |

No custom backup service should be built before evaluating the maintained Supabase daily-backup and PITR options. If an off-site copy is required, use the documented CLI/`pg_dump` workflow and an existing approved encrypted storage system rather than an application-specific exporter.

## 5. Approval gates

Each gate requires a recorded Daniel approval on DAN-74. Approval of this plan is not approval of later cost or execution details.

| Gate | Approval required | Evidence to bind |
|---|---|---|
| G1 — Protection tier | Plan upgrade and any recurring cost; select daily backup or PITR | Exact Supabase cost preview, chosen retention, compute requirement, billing owner |
| G2 — Backup verification | Read-only verification after first backup | API/dashboard timestamp, backup type, earliest/latest available point, PITR state |
| G3 — Drill creation | Create isolated restore target and incur temporary cost | Source backup/timestamp, region, target name, cost preview, expected deletion deadline |
| G4 — Sensitive-data handling | Copy production database/auth data into target | Named operators, access allowlist, no public client configuration, retention/cleanup plan |
| G5 — Any production cutover/restore | Separate incident-only authorization | Incident commander, chosen point, projected loss, downtime notice, rollback/cutover plan |

## 6. Isolated recovery drill runbook

### Preconditions

- G1–G4 accepted; no production in-place restore authorized.
- A physical backup is visible via API and has a recorded timestamp.
- Target name includes drill date and expiry, for example `po-finder-recovery-drill-YYYYMMDD`.
- Target is in `ap-northeast-1`, has no production custom domain, no production service credentials in application/Vercel, and access is limited to named drill operators.
- Record `T0` immediately before initiating the restore. Capture the cost preview before confirmation.

### Restore

1. Record source project ref, chosen backup/timestamp, earliest/latest recovery point, source region, database version, migration head, and baseline row counts.
2. Use Supabase **Restore to a New Project** from the chosen backup. Do not use the production restore action.
3. Record provisioning events and `T_restore_ready` when the target reports healthy and accepts a database connection.
4. Immediately neutralize external effects in the clone: disable `pg_cron`, `pg_net`, webhooks, Edge Functions, Realtime publications, and any other egress-capable extension/configuration until reviewed. Do not attach production domains, payment callbacks, email/SMS providers, or cron secrets.
5. Keep the application pointed at production. Use only direct administrative/read-only validation against the drill target.

### Integrity checks

All checks compare source evidence captured immediately before the chosen point with the restored target; no raw personal data is pasted into the issue.

1. **Platform health:** project and database `ACTIVE_HEALTHY`; Postgres major version compatible; no restore errors.
2. **Migration completeness:** `supabase_migrations.schema_migrations` count and head equal the source baseline; expected head currently `20260716091648`.
3. **Schema fingerprint:** compare table/view/function/index/constraint inventory and normalized schema dump hash. Review every difference.
4. **Row-count reconciliation:** compare counts for `auth.users`, `public.users`, `businesses`, `payment_attempts`, `plans`, reviews, photos metadata, schedules/events, coupons, favorites, reminder deliveries, and analytics events. Differences must be explainable by the selected restore point.
5. **Relational integrity:** run orphan checks for `public.users -> auth.users`, businesses -> users, payment attempts -> users/businesses/plans, and all business child tables; require zero unexpected orphans.
6. **Payment integrity:** group `payment_attempts` by status; require positive `amount_agorot`/`plan_days`; verify succeeded/refunded rows retain transaction identifiers and completion timestamps where expected; reconcile all post-recovery-point provider transactions before any real cutover.
7. **Catalog invariants:** verify plan codes are unique, active duration catalog matches the application migration, and price/duration checks hold.
8. **Auth smoke test:** using a predesignated non-human drill account only, verify authentication against the isolated target without sending real email/SMS. Do not use a customer's account.
9. **Storage boundary:** verify database bucket/object metadata separately, then record that binary Storage objects were not restored. If objects later exist, test an independently approved object-backup recovery path.
10. **Application smoke test:** against a locally configured build and drill-only credentials, verify public reads and authenticated owner/payment-history reads; disable all writes and outbound providers unless a synthetic, explicitly approved write test is included.

### Timing and pass criteria

- `restore_duration = T_restore_ready - T0`
- `validation_duration = T_validated - T_restore_ready`
- `measured_RTO = T_validated - T0`
- `measured_RPO = incident/recovery target time - latest transaction represented at the restore point`

Pass only if measured RTO is <= 4 hours, the selected point is within the approved <=24-hour RPO, all schema/row/relationship/payment checks pass or have signed explanations, external effects remain disabled, and Storage/platform exclusions are documented. Any unexplained discrepancy is a failed drill.

## 7. Cleanup plan

1. Export only non-sensitive evidence: timestamps, counts, hashes, migration head, check results, and screenshots without secrets or personal data.
2. Confirm no application, DNS, webhook, payment, Auth provider, email/SMS, or cron configuration points to the drill target.
3. Obtain recorded deletion approval if deletion is not already included in G3; delete the isolated project before the approved expiry, preferably within 24 hours of validation.
4. Verify the project no longer appears in the Supabase project list and that no ongoing compute/add-on charge remains.
5. Delete local connection files and any production-derived dumps using the approved secure disposal method. Never commit them.
6. Revoke any temporary credentials/tokens created for the drill without rotating production secrets unless separately approved.
7. Record final cost, deletion timestamp, measured RPO/RTO, discrepancies, owner, and remediation follow-ups.

## 8. Risks and mitigations

| Risk | Impact | Mitigation / owner |
|---|---|---|
| No current backup | Total database data loss | Daniel selects G1; Atlas tracks until first backup is verified |
| Upgrade mistaken for protection | False confidence before first backup | G2 requires API-visible restore point |
| Clone produces outbound effects | Emails, webhooks, charges, analytics pollution | Isolate target; neutralize egress first; no production app linkage |
| Storage assumed restored | Missing images/files | Separate object inventory and recovery plan; clone docs explicitly exclude objects/settings |
| Auth/payment data exposed in drill | Privacy/security incident | Least privilege, no public endpoint configuration, short retention, prompt deletion |
| Restore succeeds but is unusable | Extended outage | Schema, data, FK, payment, Auth, and application checks; measured pass/fail |
| Post-restore payment divergence | Duplicate or missing entitlements/refunds | Freeze writes during real incident, reconcile HYP records, apply approved compensating actions |
| Temporary cost persists | Unplanned spend | Named cleanup owner, expiry timestamp, deletion verification, billing check |
| Four-hour RTO is optimistic | SLA miss | Measure first drill and revise objective or architecture |

## 9. Validation record template

```text
Approval IDs:
Source backup / recovery timestamp:
Earliest / latest available recovery point:
Target project and region:
Cost preview / actual cost:
T0:
T_restore_ready:
T_validated:
Measured RPO:
Measured RTO:
Migration head / count:
Schema fingerprint result:
Row-count result:
Orphan/FK result:
Payment reconciliation result:
Auth smoke result:
Storage exclusion/result:
Application smoke result:
External effects disabled:
Pass / fail:
Discrepancies and owners:
Deletion approval:
Deleted at / verified absent at:
Residual charges checked:
```

## 10. Decision requested

Approve this plan as the recovery design, then choose one protection path before any execution:

- **Recommended:** approve a paid daily-backup tier, require an API-visible first backup, then approve a cost-bounded managed Restore-to-New-Project drill.
- **Cost-minimizing interim:** remain Free and separately approve an encrypted logical dump/restore drill plus an off-site retention owner, accepting that this does not validate managed physical restore and has broader secret/configuration gaps.
- **Low-data-loss:** approve paid tier + Small compute + PITR only if the business requires the documented worst-case two-minute RPO.

Unresolved approval-dependent facts are the exact current cost preview, desired business loss tolerance, operator identities, drill date, and target deletion authority.

