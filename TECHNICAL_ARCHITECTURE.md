# AUTQORA Technical Architecture Audit

## Current architecture

```text
Browser
  ├─ Next.js App Router pages (marketing, projects, debug, brand, strategy)
  ├─ Client UI state (navigation, project form/list, pricing toggle, sample tabs)
  ├─ /api/auth (local account/session lifecycle) → local SQLite
  ├─ /api/projects (CRUD) → account session or anonymous workspace cookie → local SQLite
  ├─ /api/projects/[id]/plan (editable, revisioned plan) → local SQLite
  ├─ /api/projects/[id]/plan/versions (snapshot history and restore) → local SQLite
  ├─ /api/projects/[id]/setup and /recommendations → SQLite / explainable rules
  ├─ /api/projects/[id]/mapping-preview (bounded, no-store synthetic payload preview; no persistence or outbound call)
  ├─ /api/projects/[id]/webhook-secret (one-time generated secret → SHA-256 hash and safe status metadata in SQLite)
  ├─ /api/projects/[id]/workflow (read-only workflow generation plus explicit validated artifact save/import: Instagram, authenticated webhook/API, Sheets → Gmail, archived-video → local clips with optional private YouTube upload)
  ├─ /api/projects/[id]/workflow/ai (explicit, rate-limited OpenAI n8n draft; redacted inputs, local structural/security checks, unsaved response until user confirms)
  ├─ /api/projects/[id]/verification (local JSON checks, user-reported manual evidence, and bounded user-supplied n8n execution summary import)
  ├─ /api/projects/[id]/activity (owner-scoped, read-only timeline assembled from saved project records; explicitly not an audit log)
  ├─ /api/projects/[id]/export (owner-scoped, bounded JSON project backup; secret values and hashes excluded)
  ├─ /api/projects/import (bounded, versioned backup validation; atomically restores a new project brief, latest plan, checklist, and workflow versions)
  └─ /api/projects/[id]/debug → redacted pattern diagnosis + saved report
  └─ POST /api/debug → Zod request validation → deterministic regex diagnosis
```

| Layer | Current implementation | Evidence |
|---|---|---|
| Web framework | Next.js App Router, `next@16.3.3`, React `19.2.8` | `package.json:49,52,54`; routes in `src/app/`. |
| Presentation | Server-rendered site pages, Tailwind CSS 4, Radix/shadcn-style UI, and a responsive scenario-based workflow preview | `src/app/layout.tsx:1-95`; `src/app/globals.css:1-60`; `src/components/ui/`; `src/components/site/workflow-preview.tsx`. Preview nodes show starter-export, setup-required, pending, and scaffold states; they are not execution evidence. |
| Interactive state | Local React state for menu, billing switch, tabs and debug submission | `src/components/site/nav.tsx:18-40`; `pricing.tsx:58-90`; `example-project.tsx:101-380`; `debug-workbench.tsx:7-45`. |
| Backend | Next Route Handlers for project CRUD, plan, setup, recommendations, workflow exports, and project-aware debugging | `src/app/api/projects/`, `src/app/api/debug/route.ts`. |
| Domain logic | Project/plan/setup Zod schemas; a shared scenario classifier; rule-based tool suggestions; structural n8n JSON validation; local regex debugging plus optional AI-assisted project debugging | `src/lib/project-domain.ts`, `src/lib/project-scenario.ts`, `src/lib/project-planning.ts`, `src/lib/tool-recommendations.ts`, `src/lib/project-workflow.ts`, `src/lib/debug-diagnostics.ts`, `src/lib/ai-debugging.ts`. |
| Storage | Local Node SQLite for briefs/requirements (including a validated destination endpoint, POST/PUT/PATCH method, and none/Header Auth/Basic Auth mode), current plan and historical snapshots, requirement and workflow-source fingerprints, artifact-scoped setup checks, workflow exports, webhook secret hashes and safe credential metadata, local verification, user-reported manual test evidence, imported execution summaries and debug reports | `src/lib/project-store.ts`; `AUTQORA_DB_PATH` or `./data/autqora.sqlite`. Project plus initial requirements and plan plus revision 1 are written atomically; project cap checks run inside the same immediate transaction. Plan saves snapshot a hash of current requirements; generated workflow saves snapshot project, requirement and plan inputs and reject if those inputs changed between generation and save. Setup checklist saves bind to the latest workflow artifact, and a newly generated/imported artifact reports a fresh checklist. Legacy plans/artifacts without snapshots report freshness as unknown. Plan-history GET is read-only. Execution imports store status/node-name summaries only, never raw node input/output data, and remain user supplied rather than independently authenticated. Raw webhook secrets are returned only in the generate/rotate response and are not read back; status exposes only header/credential names and generation time. Plan restore creates a new revision; manual run reports are tied to an artifact version and remain explicitly user-reported. |
| Identity | Local email/password account with scrypt hash, opaque 30-day HttpOnly session cookie, hashed session token, password change/session rotation, plus anonymous workspace fallback | `src/lib/auth-crypto.ts`, `src/app/api/auth/`, `src/lib/project-store.ts`; registration attaches the browser workspace to the account. No email recovery/verification, MFA, teams, cloud database, or production identity provider. |
| AI | Optional OpenAI Responses API plan drafting and debugging | `src/lib/ai-planning.ts`, `src/lib/ai-debugging.ts`, and project API routes; configure `OPENAI_API_KEY` and optional `AUTQORA_OPENAI_MODEL`. Calls are user initiated, rate limited, no-store, time bounded and schema validated; obvious secret patterns are redacted. Live provider behavior remains unverified until a key is configured. |
| Integrations | **Partially working setup artifacts; runtime unverified** | Inactive n8n templates cover Instagram photo posting, webhook/API, Google Sheets → Gmail notification, and archived YouTube video clipping through `tools/video-clip-worker/`. The clip workflow can optionally upload to YouTube privately and upload Instagram Reels through Meta's resumable binary flow; both require n8n credentials and explicit opt-in flags. The worker was confirmed healthy/reachable in a previous session, but this turn's Docker and local-port access checks were denied, so current runtime state is unknown. | No n8n workflow import or real authorized video/upload has been verified. Live-stream capture, meaningful-moment selection, an approval checkpoint, idempotency, and per-platform result tracking remain missing. The original brief is still a partial pipeline. |

## Configuration and dependency findings

- Scripts are `dev`, `build`, `start`, `typecheck` only (`package.json:5-9`). No test, lint, migration, seed, or CI scripts are declared.
- Runtime deps include Next 16.3.3, React 19.2.8, Zod 4, Radix primitives, `react-hook-form`, and general UI packages (`package.json:11-62`). SQLite and password hashing use built-in Node modules; external identity, AI, payments, and provider SDK dependencies remain absent. `package.json:5-8` requires Node >=24.
- `next.config.ts:4-6` enables `reactCompiler` and sets `cacheComponents:false`.
- `next.config.ts:8-18` accepts remote HTTP/HTTPS images from any hostname; no remote `next/image` usage was found in application pages.
- `next.config.ts:20-25` disables build-time TypeScript and ESLint failures. This is the highest priority configuration risk before production.
- `next.config.ts:30-34` adds the Ideavo tagger loader to Turbopack. It is an additional build dependency to retain only if required by the deployed product tooling.
- `proxy.ts:4-15` always returns `NextResponse.next()`. It is currently a no-op and offers no auth/rate/security controls.
- The root layout loads `https://cdn.jsdelivr.net/gh/IdeavoAI/ideavo-scripts@latest/scripts/ideavo.min.js` (`src/app/layout.tsx:93`). The version floats, so deployed behavior can change without an application release.
- `.gitignore:50-57` excludes environment files. No `.env*` file or environment variable contract was found. `NODE_ENV` is the only application config reference to `process.env` found in `next.config.ts:7`.
- Next/font Google families are configured in `src/app/layout.tsx:5-23`; deploy/build environment needs network access or available font caching according to its build setup.

## Existing API contract and security boundary

State-changing account and project routes reject requests marked `Sec-Fetch-Site: cross-site` and reject an `Origin` host that differs from the request host. Requests without browser-origin headers remain usable by local/server-to-server clients. The webhook-secret rotation route applies its own same-origin/fetch-site guard. Read-only GET handlers generate previews without persisting records.

`POST /api/debug` expects a strict JSON object:

```json
{
  "platform": "n8n | Make | Zapier | Python | REST API | Other",
  "error": "5 to 8000 characters",
  "expected": "optional, up to 1000 characters"
}
```

Source: `src/app/api/debug/route.ts:4-10`. The handler limits the raw body to 16,384 characters (`:14-38`), parses/validates JSON (`:40-56`), returns `{ diagnosis }`, and adds `Cache-Control: no-store` (`:58-65`). It performs no database write and makes no outbound request.

The diagnosis process removes a subset of recognizable token formats from the `error` text and applies the first matching regex rule (`src/lib/debug-diagnostics.ts:23-124`). This is heuristic classification, not an AI inference. `expected` is interpolated into the returned `note` without redaction (`:138,153,163-164`). The client visibly warns users to remove sensitive details (`src/components/site/debug-workbench.tsx:119-126`), but UI warnings are not a complete data-safety control. Hosting request-body logging and retention are not controlled in this repository and are **Unable to verify**.

## Architecture for the full AUTQORA product

The current framework can support the product; replacing it is not necessary. Add server-side domain boundaries incrementally rather than turning UI components into direct provider clients.

```text
Web UI (App Router)
  ├─ Project Workspace: brief, plan, artifacts, tasks, evidence, status
  ├─ Server actions / Route Handlers with auth + authorization
  └─ Application services
       ├─ Architect + recommendation service (model behind provider interface)
       ├─ Artifact generator + deterministic validators
       ├─ Debug analysis (rules first; optional model with redaction)
       ├─ Verification runner (fixtures and isolated sandbox boundary)
       └─ Deployment runbook service (human approval before execution)
            ├─ Relational database: users, workspaces, projects, versions, events
            ├─ Object storage: uploaded artifacts/evidence, retention policy
            ├─ Connector registry: OAuth/scopes, encrypted secret references
            └─ Background jobs for slow model/test/connector tasks
```

### Recommended domain model (future; not implemented)

Start with `User`, `Workspace`, `Membership`, `Project`, `Requirement`, `PlanVersion`, `ArtifactVersion`, `Task`, `VerificationCheck`, `Evidence`, and `AuditEvent`. Keep platform credentials out of artifacts and normal project logs. Store credential references with least privilege, tenant ownership, expiry/revocation status, and never send credentials to a model. Use explicit version IDs so generated changes and evidence can be traced to the inputs they validated.

### Integration boundaries

- Keep provider-specific code behind a connector interface with scopes, rate-limit policy, retry semantics, idempotency, and test fixtures.
- Begin with file export and offline validation; they reduce connector and credential risk while delivering user value.
- Add one runtime such as n8n after the project/artifact lifecycle exists. Treat “generate”, “import”, “execute test”, and “deploy” as separate permissions and product states.
- Extend the server-side AI adapter with usage tracking, a hard cost budget, prompt versioning, broader PII protection and a tested fallback. AI planning and debugging are optional and unverified until a server API key is configured.
- Keep verification results append-only and evidence-linked. Separate machine-observed checks from user-confirmed business outcomes.
- Require explicit user approval for production deployment; initial deployment guidance can remain a generated runbook.

### MVP infrastructure principles

- Prefer one relational database and a small number of services; avoid microservices and self-hosted model inference on limited local hardware.
- Use deterministic local generation/validation where possible and call hosted model APIs only from server code, behind cost and privacy limits.
- Pick a low-cost managed database after deployment constraints and data region are known; keep schema/migrations portable rather than coupling core logic to an auth/billing vendor.
- Add durable background jobs only when actual generation, verification, or integrations exceed a request lifecycle.
- Establish a secret-management plan and redact sensitive fields before collecting user logs or connecting providers.

## Technical risks and validation state

| Risk | Priority | Evidence | Impact |
|---|---|---|---|
| Build ignores TypeScript/ESLint errors | High | `next.config.ts:20-25` | Invalid application code can pass the production build gate. |
| Anonymous/local project substrate only | High | `src/lib/project-store.ts`; project routes in `src/app/api/projects/` | No verified identity, cross-device access, managed persistence, project versions, plans, artifacts or evidence. |
| Debug input has limited redaction; expected text is echoed | High before public log intake | `src/lib/debug-diagnostics.ts:110-118,138,153,163-164` | Sensitive user text can be returned in a response; full coverage needs tests and data handling review. |
| No production request throttling | Medium | `src/app/api/debug/route.ts:14-65` | Public endpoint can be spammed; current CPU use is low but origin resources remain finite. |
| Unpinned third-party script | Medium | `src/app/layout.tsx:93` | Remote change/supply-chain and availability exposure. |
| Broad remote image hosts | Low/Medium | `next.config.ts:8-18` | Unnecessarily broad image source policy. |
| No automated tests or CI gates | High before MVP | `package.json:5-9`; no test files/scripts found | Regressions in diagnosis, generation, access controls and verification could ship undetected. |
| Production/hosting configuration unknown | Unable to verify | No deployment config in workspace | Runtime, environment, logging, region, headers, limits and operational readiness remain unknown. |

Typecheck passed in the preceding implementation turn. A production build, end-to-end browser test, API deployment test, and hosting configuration review were not performed for this audit.
