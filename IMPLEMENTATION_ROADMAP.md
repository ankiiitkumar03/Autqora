# AUTQORA Implementation Roadmap

This roadmap preserves the full AUTQORA vision. Debugging remains one capability in a project-centered implementation platform, not the sole product direction. Bounded owner-scoped JSON backups omit webhook secret material. Import creates a new project atomically and restores plan history, setup, workflows, verification, user-supplied evidence, and debug reports with remapped workflow references. A webhook secret must be generated again for the imported project.

The project page also presents a consolidated timeline assembled from saved milestones. It is a review aid, not an immutable audit log; project-field changes are not individually versioned.

Project debugging now persists per-recommendation outcomes (tried, resolved, still failing, or not applicable) with optional secret-redacted notes. Users can use that history to inform a later AI diagnosis; the outcomes remain user-reported and are not treated as independent proof that a fix worked. Backup/import and the activity timeline preserve the feedback.

The project debugger accepts bounded PNG/JPEG/WebP screenshots and bounded UTF-8 log/code excerpts. Screenshots are sent in memory only through the explicit **Ask AI** action; text excerpts inform local matching and are also sent only after **Ask AI**. Neither source attachment is saved with the report. Screenshots require the configured vision-capable model; workflow JSON remains a separate local structural review.

Generic projects can now request an optional AI-generated inactive n8n draft. The candidate is checked locally and stays unsaved until the user confirms it. Provider quality, instance-specific node compatibility, credentials, and execution remain unverified; treat this as a draft generator, not a live integration.

## Current state and next milestone: Brief → plan → workflow artifact

The brief → plan → recommendation → setup/debug → export/verification/runbook foundation now exists with a local account/session layer and scenario-specific starter exports for Instagram photos, authenticated webhook/API, Google Sheets → Gmail lead notification, and archived YouTube video → local short clips. The user’s original **clipper** brief asks for live-stream clipping plus automatic Instagram and YouTube publishing. Its export includes separate opt-in switches, configurable YouTube title/description/visibility (private, unlisted, or public; defaults to private), and Meta's Instagram Reels resumable upload path; provider credentials are required. The local worker supports evenly spaced clips or FFmpeg visual scene-change candidates with fallback positions; this does not identify semantic highlights or speech. Local verification checks artifact controls but does not prove provider behavior. Live capture, semantic moment selection and an in-workflow review gate remain missing. The FastAPI/FFmpeg worker container was built and confirmed healthy/reachable in a previous session; the current sandbox cannot inspect Docker or localhost, so current process state is unknown. No authorized video has been processed and the generated workflow has not been imported or executed in the user's n8n. The next milestone is to import-test the worker and both publisher paths, then continue the remaining pipeline in verifiable stages.

### Next milestone scope

Complete the user's live-stream clip and publish scenario in small, verifiable steps:

1. Import the current workflow into n8n, configure the worker and YouTube OAuth credentials, process an authorized archived video, and inspect an upload with the selected visibility. Record any import/runtime issues and fix them.
2. Add authorized live-source ingestion and define whether clips are captured live or generated from the completed replay. Improve moment selection beyond visual scene changes, and verify duplicate prevention.
3. Import-test the current Instagram Reels resumable upload path with a Meta app/account using Facebook Login for Business; confirm the binary upload and publish response. Keep credentials inside n8n ([Meta Content Publishing](https://developers.facebook.com/documentation/instagram-platform/content-publishing)).
4. Add a user approval gate, duplicate-safe retries, and per-platform result tracking to both upload paths; verify YouTube visibility controls using the built-in n8n node and [YouTube upload guidance](https://developers.google.com/youtube/data/guides/uploading_a_video).
5. Import-test and record real execution evidence before describing the full pipeline as end-to-end or enabling scheduled/automatic publication.

This milestone demonstrates the core value proposition—idea to implementation—and establishes the shared project context needed by debugging, verification and deployment later. It does not connect accounts or deploy into production. Keep the current marketing site and design system.

### Suggested scope controls

- Select one repeatable design-partner workflow (for example, form intake → CRM upsert → team notification) after confirming user demand.
- Support one runtime/export format first: n8n JSON. Offer export/import and human setup instructions before any live connector.
- Make recommendations explain constraints, costs and failure modes; avoid unsupported universal rankings.
- Use a single model-backed structured response for the plan only if it adds clear value. Keep generation behind a server-only provider interface, validate outputs with Zod, set a strict token/cost budget, and provide a transparent fallback/error state.
- Persist the project and artifact versions in a simple relational store. Defer team sharing and agency tenancy until single-owner access rules work.
- Add unit tests for schema validation, requirement/plan contracts, output generation, and deterministic n8n validation before enabling user persistence.
- Improve the attached project debugger with stronger verified evidence, safe file/screenshot intake, confidence calibration, and user-confirmed fix tracking; keep AI suggestions advisory.

## Phased plan

| Phase | Outcome | Main scope | Exit criteria |
|---|---|---|---|
| 0. Audit foundations | Safe base to extend | Remove build check suppressions; decide public/internal status of strategy memo; define privacy and support expectations; add CI typecheck/lint/test gates. | CI blocks on type errors/lint failures; public claims/status reviewed; no internal memo exposure by accident. |
| 1. Project workspace and plan | **Prototype slice implemented; production identity/storage remain** | Brief CRUD/status, structured requirements, revisioned plan snapshots/restore, setup checks, local SQLite, local account sessions and anonymous browser cookie. | Account recovery and email verification; production session policy, managed storage, and security review before deployment. |
| 2. Architect + recommendations | **Starter rules implemented** | Fixed rule-based plan and project-aware platform fit/reasons/trade-offs; no AI/live pricing. Next add clarified requirements and maintained integration/pricing evidence. | Representative briefs yield tailored, editable plans; uncertainty and assumptions visible; failures and quotas handled. |
| 3. Workflow Generator | Deliver an artifact users can carry away | n8n JSON generation, schema validation, downloadable export, environment template with no secrets, artifact versioning, one-time webhook secret generation with hash-only persistence and Header Auth configuration. | Generated artifacts import into the supported n8n version; actual n8n credential reference is bound by the user; fixture tests cover representative cases; secrets never appear in workflow output. |
| 4. Implementation Assistant + debugging | Guide a real project from plan to fix | Persistent steps/checkpoints, artifact/log attachment, project-aware debugging, safe secret redaction and user-confirmed changes. | User can resume after refresh; diagnosis ties to project evidence; no automated production mutation. |
| 5. Verification | Provide useful evidence, not a green badge | Deterministic checks cover generated and imported inactive n8n JSON; manual reports are labeled user-reported; bounded n8n execution JSON can be reviewed and its status/node summary stored against a selected artifact version. | The imported execution JSON remains user supplied and is not authenticated by AUTQORA. Add direct n8n execution lookup only after a secure connection flow exists; business outcome stays a separate user confirmation. |
| 6. First connector + deployment companion | Connect to a tool safely | One read/test-limited integration, least-privilege OAuth, credential reference/revoke, runbook generation tied to latest artifact and evidence, approvals, audit events and operational monitoring. | Connector permissions reviewed; retries/idempotency verified; staging test and rollback plan demonstrated; user approval required for prod. |
| 7. Teams, breadth and billing | Scale after use is proven | Workspace membership, roles, more connectors/runtimes, usage metering, checkout, agency reports. | Product usage supports the expansion; tenant isolation, entitlements, support and cost controls tested. |

## Cross-cutting requirements before public MVP

- **Privacy:** publish what is collected, why, retention, deletion, subprocessors/model provider, and infrastructure log handling. Provide redaction before submission and avoid storing raw logs by default.
- **Security:** authenticated ownership checks, tenant isolation, secret vault/reference design, CSRF/origin strategy for state changes, rate limits, upload limits/scanning if file uploads arrive, dependency updates, and production headers.
- **Reliability:** structured error IDs, logs with secrets scrubbed, health checks, timeout/retry budgets, backup/restore and migration rollback procedure.
- **Quality:** unit and API tests, end-to-end critical-path test, accessibility review, mobile layout check, typecheck/lint/build gates and explicit unsupported-state coverage.
- **Trust:** label generated vs user-authored content, planned vs available integrations, machine-verified vs user-confirmed checks, and never claim a workflow was deployed or tested unless there is evidence.
- **Cost:** measure model tokens and per-project usage, set hard budget ceilings, use smaller/cheaper models for simple extraction, and prefer deterministic checks over model calls where possible.

## Preserve, extend, avoid

- **Preserve:** Next.js App Router setup, AUTQORA visual system, marketing/brand pages, useful Radix UI primitives, current debug workbench as a small project tool, and server-side route boundary.
- **Extend:** replace hardcoded preview arrays with typed domain-backed data only when each capability is implemented; introduce shared project context and artifact versioning before integrations multiply.
- **Avoid:** wholesale rewrite, premature microservices, broad platform support before one dependable integration, self-hosting a large model on limited hardware, auto-deploy promises before safe sandbox verification, and treating UI mock states as delivered product.

## GO / NO-GO decision

**GO** to continue with this codebase for the next MVP milestone. It now has a brief CRUD prototype plus a polished visual system. **Conditions:** replace anonymous/local persistence before multi-user deployment, restore reliable build gates, and implement the plan-to-artifact journey before claiming the full platform. **NO-GO** for production launch of the full Automation Implementation Platform on the basis of the current code alone: core product services and operational controls are still missing or mock-only.
