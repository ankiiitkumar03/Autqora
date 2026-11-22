# AUTQORA Existing Project Audit

**Audit date:** 20 November 2026  
**Scope:** Read-only static inspection before the project workspace implementation. The follow-up below records subsequent changes.  
**Recommendation:** **GO with conditions** — keep this codebase as the product website and prototype base, but treat it as pre-MVP. Do not represent the long-term platform as available or production-ready.

## Executive summary

This is a Next.js App Router application with a carefully built marketing site, brand guide, strategy memo, component previews, one deterministic debugging helper, and now a small project workspace backed by local SQLite. It is not yet the full Automation Implementation Platform: there is no authenticated user, model integration, workflow generation, connected automation platform, evidence store, or deployment system.

**Implementation follow-up:** `/projects` and `/api/projects` provide brief CRUD and structured requirements. Local account routes at `/api/auth/{register,login,logout,me}` use Node scrypt password hashes and opaque HttpOnly sessions; registration links the current anonymous workspace to the account. This supports signing in to the same AUTQORA server, but has no email verification/recovery, MFA, cloud sync, or production security review. Plans can be edited, saved as historical snapshots and restored as a new revision. Project routes also provide deterministic recommendations, persistent setup progress, versioned workflow exports, local structural verification, user-reported manual test history, project-aware redacted debugging, and a downloadable deployment runbook. Instagram briefs can download an inactive scheduled photo-post workflow; webhook/API-intake briefs can download an inactive HTTP POST endpoint that returns an acknowledgement or forwards request JSON to a configurable destination API. This generic forwarder does not implement app-specific field mapping or upsert behavior. Other briefs receive a metadata scaffold. Neither generated workflow has been imported or executed in n8n.

The current debugging helper accepts a platform, error string, and optional expected outcome, checks a small list of regular-expression rules, and returns suggested steps. It is useful as an early interaction prototype, but it does not inspect logs beyond pasted text, workflow files, screenshots, source code, or platform state, and it cannot verify whether a fix worked.

**Recommended next milestone:** implement one complete, bounded automation-project vertical slice while preserving the broader product vision: requirement intake → structured project/implementation plan → generated exportable n8n artifact → user-reviewed test checklist. Persist project and artifact state, but defer live deployment and broad OAuth integrations. This advances the Architect, Generator, Assistant, and Verification parts of AUTQORA instead of making debugging the whole product.

## Project structure and architecture

| Area | Evidence | Finding |
|---|---|---|
| Framework and runtime | `package.json:5-10,49,52,54` | Next.js `16.3.3`, React and React DOM `19.2.8`; Node `>=24` is required for built-in `node:sqlite`. Bun runs scripts and `bun.lock` is present. |
| Routing | `src/app/projects/page.tsx`, `src/app/api/projects/route.ts`, `src/app/api/projects/[projectId]/route.ts` | App Router pages include `/`, `/projects`, `/debug`, `/brand`, `/strategy`, project collection/item APIs, and `POST /api/debug`. Login, billing and connector routes remain absent. |
| Components | `src/components/site/`, `src/components/brand/`, `src/components/ui/` | Site sections and brand assets are separated cleanly. `src/components/ui/` contains a large shadcn/Radix-style primitive library; it is UI infrastructure, not evidence of product workflows. |
| Styling | `src/app/globals.css:1`, `tailwind.config.ts`, `postcss.config.mjs` | Tailwind CSS v4/PostCSS styling with a custom dark AUTQORA design system and motion utilities. |
| Server/client split | `src/app/page.tsx:29`, `src/components/site/nav.tsx:1`, `src/components/site/pricing.tsx:1`, `src/components/site/example-project.tsx:1`, `src/components/site/debug-workbench.tsx:1` | Pages are server rendered by default; interactive navigation, billing toggle, example tabs, and debug form are client components. The API route and diagnosis engine run server-side. |
| Product data | `src/components/site/capabilities.tsx:54`, `src/lib/project-domain.ts`, `src/lib/project-store.ts` | Marketing/demo data remains hardcoded; project briefs use shared Zod schemas and a SQLite repository. |

## Feature classification against the AUTQORA vision

| Vision capability | Status | Evidence and assessment |
|---|---|---|
| Automation Architect | **Partially working** | Users can capture structured requirements, edit a rule-based starter plan, regenerate after confirmation, and review/restore plan revisions in `src/components/site/project-plan-editor.tsx`, `src/lib/project-planning.ts`, and the project plan version APIs. No clarification flow, AI plan generation or risk scoring. |
| Tool Recommendation Engine | **Partially working** | `src/app/api/projects/[projectId]/recommendations/route.ts`, `src/lib/tool-recommendations.ts`, and `src/components/site/tool-recommendation-panel.tsx` provide explainable project-based recommendations. | Heuristic catalogue only; no live pricing, AI, or comprehensive integration coverage. |
| Workflow Generator | **Partially working** | `src/app/api/projects/[projectId]/workflow/route.ts` downloads structurally validated, versioned, inactive Instagram photo-post, webhook intake and webhook-to-HTTP-API workflows. Instagram still needs credentials/account/media configuration; webhook forwarding needs an endpoint and n8n credentials and passes JSON through unchanged. Neither workflow was imported or run in n8n. Other briefs receive a metadata scaffold. Marketing previews remain static in `src/components/site/capabilities.tsx:141-174` and `src/components/site/example-project.tsx:232-315`. |
| Step-by-Step Implementation Assistant | **Partially working** | Project-specific setup checklist state persists through `/api/projects/[projectId]/setup` and SQLite; the project guide is in `src/components/site/project-plan-editor.tsx`. Steps remain a fixed template with user-confirmed completion; there are no blockers, evidence, reminders, or collaboration. |
| Debugging Copilot | **Partially working** | `/debug` has an interactive form and `POST /api/debug` returns deterministic diagnoses. Project debugging at `src/app/api/projects/[projectId]/debug/route.ts` also accepts optional n8n workflow JSON for a structural/credential/auth review and attaches the latest saved artifact version and local verification findings. It stores only the review summary, not the submitted workflow. It does not use AI, inspect screenshots, access a platform, or confirm a fix. Runtime behavior was not exercised as part of this static audit. |
| Implementation Verification | **Partially working** | `src/app/api/projects/[projectId]/verification/route.ts` performs structural, placeholder, scenario-node and credential-reference checks on saved JSON, and stores user-reported manual test results against an artifact version; the deployment runbook includes them. | Manual results are not independently verified; AUTQORA does not import/execute n8n, validate provider credentials, or verify business outcomes. |
| Deployment Companion | **Partially working** | `src/app/api/projects/[projectId]/runbook/route.ts` creates a project-specific Markdown runbook from requirements, plan and setup progress. | Guidance only; no environment management, alerts, production approval or rollback execution. |
| Persistent project state / collaboration | **Partially working** | Brief and structured requirements, revisioned plan snapshots, setup checklist, workflow versions, verification reports, user-reported test history and sanitized debug reports persist in SQLite. | Local accounts and workspace sessions exist; no email recovery/verification, cloud sync, teams or collaboration. |
| Workflow-platform integrations | **Missing** | n8n, Make, Zapier and other tools appear as names and sample text (`src/components/site/platforms.tsx:3-17`). No OAuth flow, SDK client, webhook receiver, connector service, or provider credential handling exists. |

## Pages, interactions, and calls to action

| Surface | Status | Evidence |
|---|---|---|
| Homepage sections | **Working as a rendered marketing page** | `src/app/page.tsx:29-49` composes navigation, hero, problem, process, capabilities, example, debugging, platform, pricing, FAQ, CTA and footer. Product capability sections mostly explain or illustrate future product behavior. |
| Navigation | **Partially working** | `src/components/site/nav.tsx` includes `/account`; account state appears on that page rather than through global auth-aware navigation. |
| Example project tabs | **Partially working** | `src/components/site/example-project.tsx:101-380` uses interactive Radix tabs; changing tabs works as a UI interaction, but content and “Project 014” status are fabricated static copy, not user project data. |
| Product console actions | **UI only / mock** | `src/components/site/product-console.tsx:35-64` shows “Preview” and a non-interactive “Run test” span. The “Review evidence” button at lines 235-241 has no handler. Project/check/log arrays at lines 15-29 are constants. |
| Pricing selector | **Partially working** | `src/components/site/pricing.tsx:58-90` switches monthly/annual values locally. Plan figures/features at lines 11-55 are hardcoded. CTAs at lines 157-168 open `mailto:` rather than checkout, account creation, or trial enrollment. |
| FAQ | **Working as an accordion; informational claims are not product functionality** | `src/components/site/faq.tsx:59-105` uses an accordion. Current copy does disclose that major capabilities are planned; the actual account/security answers should be checked against future implementation before launch. |
| Final CTA | **Partially working** | `src/components/site/final-cta.tsx:5-50` links to project intake and the debugging helper. It does not lead to account onboarding or a generated implementation. |
| Brand guide | **Working as static documentation** | `src/app/brand/page.tsx:145-900` displays brand rules and downloadable SVG assets. It is not product functionality. |
| Strategy memo | **Working as static documentation; exposure risk** | `src/app/strategy/page.tsx:268-1082` renders a long internal working draft, including competitor, commercial, domain and preliminary trademark screening content. It is linked from the public nav/footer (`src/components/site/nav.tsx:70,110`; `src/components/site/footer.tsx:95`). |
| Beta/contact links | **Partially working** | Email links can open the visitor’s mail client (`src/components/site/pricing.tsx:157-168,202-208`, `src/components/site/faq.tsx:78-83`). They do not submit to a tracked form or confirm receipt. |
| Search/offer metadata | **Partially working** | Page metadata is defined in `src/app/layout.tsx:26-64`; the zero-price structured offer was removed from `src/app/page.tsx` because plans remain indicative. |

## API, backend, authentication, database, and AI

- Project collection and item handlers in `src/app/api/projects/route.ts` and `src/app/api/projects/[projectId]/route.ts` implement list/create/read/update/delete with Zod validation, bounded bodies, no-store responses, workspace filtering and UUID IDs.
- `src/lib/project-store.ts` uses Node built-in SQLite at `AUTQORA_DB_PATH` or `./data/autqora.sqlite`; `aq_workspace` scopes anonymous projects and `aq_session` resolves registered accounts to their workspaces. This is local single-server persistence, not a managed production database.
- `src/app/api/debug/route.ts:1-65` accepts POST JSON, applies Zod validation, imposes an 8,000-character error limit and a 16,384-character raw body limit, returns JSON, and sets `Cache-Control: no-store`.
- `src/lib/debug-diagnostics.ts:23-107` performs deterministic keyword/regex classification. No model SDK, provider API call, prompt/template, queue, or AI configuration appears in source or `package.json`.
- **Authentication: Partially working.** `/api/auth/` provides local registration/login/logout/session lookup. Passwords are scrypt-hashed and opaque session tokens are stored as SHA-256 hashes; email verification/recovery and an external identity provider are absent.
- **Database: Partially working.** Local SQLite schema/repository exists for project briefs and status. No migrations framework, managed database, backup/restore, or shared durable deployment storage is configured.
- **Live automation connectors: Missing.** No OAuth callback, stored provider tokens, API clients, or execution by AUTQORA. A safe setup artifact now exists for authenticated incoming webhooks: one-time secret generation, hash-only persistence, Header Auth workflow configuration, and manual n8n credential binding. The n8n credential ID is instance-assigned and not yet connected to AUTQORA.
- **Billing: Missing.** Pricing presentation does not integrate checkout, subscription state, invoices, or entitlements.
- **Email delivery/lead management: Missing.** Contact CTAs are `mailto:` links only.

## Validation, errors, and security observations

### Good foundations

- The debug API uses strict object validation (`src/app/api/debug/route.ts:4-10,50-56`) and bounds request size (`:14-38`).
- The UI has loading, request-error, empty, and result states (`src/components/site/debug-workbench.tsx:14-45,140-197`) and warns users not to include secrets (`:119-126`).
- APIs set `no-store`; project briefs are written to local SQLite, while the debugging route does not persist submitted logs.
- TypeScript strict mode is enabled (`tsconfig.json:14-24`). In the preceding implementation turn, `bun run typecheck` completed successfully. No tests, lint run, or production build were executed for this audit.

### Risks and limitations

1. **Build checks can be bypassed.** `next.config.ts:20-25` sets `ignoreBuildErrors: true` and `ignoreDuringBuilds: true`, so a production build will not be a reliable quality gate. Run explicit typecheck/lint in CI and remove these suppressions before release.
2. **Secret redaction is incomplete.** `src/lib/debug-diagnostics.ts:110-118` redacts a handful of token-like patterns from the `error` string. It does not comprehensively recognize provider credential formats or redact the optional `expected` field. That field is interpolated back into the response at lines 138, 153, and 163-164. The page warns users (`src/app/debug/page.tsx:34-36`, workbench `:119-126`), but this should be fixed before promoting the tool with strong privacy assurances.
3. **No abuse controls.** The public API has body-size validation but no rate limit, bot control, or request budget (`src/app/api/debug/route.ts:14-65`). Its current computation is cheap, but a public deployment should have edge/platform-level limits.
4. **External script dependency.** `src/app/layout.tsx:93` loads a third-party script from jsDelivr using a floating `@latest` version. Its behavior, update control, and production necessity are not established by this codebase.
5. **Broad image host policy.** `next.config.ts:8-18` allows HTTP and HTTPS images from any hostname. No remote image use was found in the inspected app pages; narrow this policy if remote images are not required.
6. **No explicit privacy/terms/security/support documentation.** The footer offers only email and brand/strategy links (`src/components/site/footer.tsx:11-31,92-96`). This is inadequate once users are invited to submit automation logs or connect accounts.
7. **Status copy remains aspirational.** Numerous marketing cards and demo panels show generated artifacts, passed tests, deployment states and integrations. The site discloses preview status in some places, but labels should remain explicit anywhere sample outputs could be read as real results.

## Environment and configuration

- No `.env*` file was found. `AUTQORA_DB_PATH` optionally selects the SQLite path (`src/lib/project-store.ts:31`); otherwise the app uses `./data/autqora.sqlite`. `NODE_ENV` controls development behavior.
- `.gitignore:50-57` excludes `.env` and common local environment files, which is good. There are no required secrets for the current rule-based debugging flow.
- `package.json:5-9` provides `dev`, `build`, `start`, and `typecheck`; no test or lint scripts are declared there.
- `next.config.ts:4-6` enables the React Compiler and sets `cacheComponents:false`; `:30-34` configures the Ideavo webpack tagger for Turbopack.
- `proxy.ts:4-15` is a no-op pass-through. It does not implement authentication, authorization, rate limiting, or security headers.
- No custom `error.tsx`, `not-found.tsx`, or `loading.tsx` files were found; product routes currently rely on Next.js defaults for route-level failure/loading states.

## Deployment readiness and technical risks

**Status: Not production-ready as an implementation platform.** Project data currently depends on a local SQLite file and a single compatible Node runtime; multi-instance/serverless deployment needs managed database migration. This audit did not exercise a deployed environment. There is no deployment manifest, CI workflow, observability/error reporting, health check, managed database, secret management, privacy policy, or integration credential lifecycle. `next.config.ts` suppresses build type/lint errors. The floating external script and broad image policy also merit review.

For the debugging prototype specifically, deployment is technically simple because the endpoint is stateless and has no external service dependency. Before public promotion, confirm runtime behavior in the target host, add request limits, clarify data handling at the infrastructure/logging layer, and redact all user-controlled fields consistently.

## Audit limits

This report is based on source inspection, dependency manifests, and configuration in the current workspace. No Git repository metadata is present at the workspace root, so historical changes could not be audited. The UI and API were not browser-tested or load-tested during this audit; any behavior described as implemented is based on code paths, not a production runtime observation. Deployment provider settings, environment secrets, and external service configuration are **Unable to verify** from this repository.
