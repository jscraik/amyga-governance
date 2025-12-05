# brAInwav ArcTDD Charter (Full Specification v2.0.0)

**Status:** MANDATORY - Must be included in ALL agent instruction files  
**Enforcement:** CI validates presence via SHA-256 checksum  
**Last Updated:** 2025-10-29
**Version:** 2.1.1

---

## Table of Contents

- [⚡ OPERATIVE GUARDRAILS (Non-Negotiable)](#-operative-guardrails-non-negotiable)
- [🚨 AI BEHAVIORAL RULES (Production Standards)](#-ai-behavioral-rules-production-standards)
- [🔒 ENFORCEMENT MECHANISMS](#-enforcement-mechanisms)
- [📋 QUICK REFERENCE](#-quick-reference)
- [🔗 CANONICAL REFERENCE](#-canonical-reference)
- [📖 GLOSSARY](#-glossary)
- [⚠️ DEVIATION POLICY](#%EF%B8%8F-deviation-policy)
- [📊 CI ENFORCEMENT MATRIX (Full)](#-ci-enforcement-matrix-full)
- [🚀 QUICKSTART FOR NEW CONTRIBUTORS](#-quickstart-for-new-contributors)
- [📜 VERSION HISTORY](#-version-history)

---

> **Fragment usage:** The canonical charter fragment for agent instruction files is the section of this document wrapped between `<!-- BEGIN CHARTER_FRAGMENT -->` and `<!-- END CHARTER_FRAGMENT -->`. Automation should extract exactly that region when a compact charter is required.

<!-- BEGIN CHARTER_FRAGMENT -->

## ⚡ **OPERATIVE GUARDRAILS** (Non-Negotiable)

All agents executing workstreams MUST obey these rules:

### 1️⃣ **Step Budget ≤ 7** [AGENTS-STP-001]

- Each execution arc MUST complete within **seven discrete plan/act iterations**
- Larger efforts MUST be split into multiple arcs
- **Enforcement**: `run-manifest.json` validation blocks merge if `arc.plan_steps.length > 7`
- **Runtime Check**: Phase machine rejects arcs exceeding budget

**Rationale:** Prevents cognitive overload and ensures atomic, reviewable units of work.

---

### 2️⃣ **Ask-First ≤ 3** [AGENTS-ASK-002]

- Agents MAY ask at most **three clarifying questions** before writing code
- Each question MUST enumerate **concrete options and consequences**
- **Format**: "Choice: (A) option1 [consequence]; (B) option2 [consequence]; (C) option3 [consequence]"
- **Enforcement**: Interaction counter logs violations; coordinator blocks 4th question

**Rationale:** Reduces clarification loops and encourages autonomous decision-making within documented constraints.

---

### 3️⃣ **Explain-While-Doing** [AGENTS-EXP-003]

- Narrate intent alongside actions in commits, diffs, and task logs
- Enable reviewers to audit rationale without context-switching
- **Enforcement**: Narrated diffs required in PR body (CI checks for presence)

**Rationale:** Maintains audit trail and knowledge transfer; prevents "black box" implementations.

---

### 4️⃣ **Proof Required** [AGENTS-PRF-004]

- Every behavioral change MUST ship with **executable proof**:
  - ✅ Failing test first (red)
  - ✅ Passing test after (green)
  - ✅ Mutation or property evidence when applicable
- **Evidence Triplet** mandatory per arc:
  1. Milestone test path (red→green proof)
  2. Contract snapshot (types/schema/route)
  3. Reviewer JSON pointer
- **Enforcement**: CI blocks merge if Evidence Triplet incomplete

**Rationale:** TDD discipline ensures verifiable behavior; mutation testing prevents brittle tests.

---

### 5️⃣ **Recap in ≤ 500 Tokens** [AGENTS-RCP-005]

- Close each arc with structured recap:
  - Scope, decisions, tests, follow-ups
  - Written to `evidence/recaps.log`
- **Enforcement**: Token counter validates; excess triggers warning
- **Format**: Generate recaps after every 400–700 tokens of output, ensuring each recap ≤ 500 tokens

**Rationale:** Maintains context across sessions; prevents drift in long-running tasks.

---

### 6️⃣ **Brand Logs** [AGENTS-BRD-006]

- Runtime and workflow logs MUST emit both: (1) a human-readable prefix `[brAInwav]` and (2) structured JSON payloads containing `brand:"brAInwav"`, ISO-8601 timestamp with timezone offset, a 32-character lowercase `trace_id`, and the HTTP `traceparent` captured at ingress/egress.
- OPA/Conftest policies enforce the following tokens in every charter-governed log line:
  - `MODELS:LIVE:OK` when model health passes
  - Latency markers (e.g., `LATENCY:123ms` or structured JSON `latency_ms` field)
  - `NORTH_STAR:RED_FIRST` for the initial failing acceptance execution
  - `NORTH_STAR:GREEN_AFTER` once the acceptance turns green
- First failing acceptance must log `marker:"NORTH_STAR:RED_FIRST"`; the passing acceptance must log `marker:"NORTH_STAR:GREEN_AFTER"`.
- Emit `model_status:"MODELS:LIVE:OK"` **only** after live model health checks succeed.
- **Enforcement**: Grep validation in CI; missing brand tokens or trace context fails the build.

**Rationale:** Ensures observability and traceability across distributed systems.

#### Example Charter-Compliant Logs

```json
{
  "timestamp": "2025-10-28T19:22:11.402-07:00",
  "brand": "brAInwav",
  "phase": "north_star",
  "marker": "NORTH_STAR:RED_FIRST",
  "latency_ms": 742,
  "model_status": "MODELS:LIVE:OK",
  "trace_id": "c6f2b0d7a9124f6c",
  "traceparent": "00-c6f2b0d7a9124f6c9c1d77cd2a4f6aa1-1234567890abcdef-01",
  "message": "Acceptance failed as expected"
}
```

```text
[brAInwav] 2025-10-28T19:22:11.402-07:00 LATENCY:742ms MODELS:LIVE:OK NORTH_STAR:RED_FIRST traceparent=00-c6f2b0d7a9124f6c9c1d77cd2a4f6aa1-1234567890abcdef-01 Acceptance failed as expected
```

---

## 🚨 **AI BEHAVIORAL RULES** (Production Standards)

> **Source:** Consolidated from RULES_OF_AI.md for single source of truth on AI behavior

### Hierarchy of Authority

When documents overlap or conflict, follow this order (highest → lowest):

1. **Governance Pack** — binding project rules
2. **CODESTYLE.md** (root) — coding & testing conventions enforced by CI
3. **AGENTS.md** (root) — operational rules for agents; repo defaults
4. **Package-level `AGENTS.md`** — may tighten rules; cannot weaken repo standards
5. **Model guides** (`GPT-5-Codex.md`, `CLAUDE.md`, `QWEN.md`, `GEMINI.md`) — adapter specifics only

### Production Truthfulness Standards

#### Rule 1 — No false implementation claims

Never claim "production-ready/complete/operational" if any prod path contains:

- `Math.random()`-fabricated data, hardcoded mocks, placeholder adapters ("will be wired later")
- `TODO/FIXME/HACK`, `console.warn("not implemented")`
- Fake metrics/telemetry

#### Rule 2 — brAInwav truthfulness standard

- Verify claims against actual code & passing gates.
- Distinguish test scaffolding from production.
- Include brAInwav branding in outputs/errors.
- Do not inflate readiness/completion metrics.

#### Rule 3 — Production validation requirements

- [ ] Placeholders eliminated  
- [ ] Real integrations in place (no fake data)  
- [ ] Errors/logs branded `[brAInwav]` / `brand:"brAInwav"`  
- [ ] Docs match code  
- [ ] Tests validate real functionality

#### Rule 4 — Documentation accuracy

- Status/percentages based on real metrics.
- READMEs reflect current implementation.

#### Rule 5 — Commit message standards

- Accurate, evidence-backed messages.
- Add `Co-authored-by: brAInwav Development Team` when appropriate.

### Code Standards (Production Paths)

- **Named exports only** (no `export default`)
- **≤ 40 lines per function** (compose via guard clauses)
- **No `any` in TypeScript** (except tests/justified compat shims)
- **No cross-domain imports** — use A2A topics/MCP tools/declared contracts
- **async/await + AbortSignal** — no `.then()` chains
- **Structured logging** — `brand:"brAInwav"`, request/run IDs, OTel traces

### Security & Supply Chain

**Scanners (blocking)**:

- **Semgrep** — block on ERROR  
- **gitleaks** — block on ANY secret detection  
- **OSV/audit** — clean lockfiles  
- **SBOM** — CycloneDX 1.6 (ECMA-424) generated for all artifacts

**Environment/config**:

- Use shared loader (`scripts/utils/dotenv-loader.mjs` or `@governance/utils`)
- **Never call `dotenv.config()` directly**
- No hardcoded secrets; env/secret managers only; retrieve API keys, SSH keys, and tokens via the 1Password CLI (`op`) at runtime

### Hybrid Model Solution — Live-Only (CONSTITUTIONAL)

**Hard rule**: Embeddings, rerankers, generations must use **live** engines:

- **Ollama** (local server)  
- **Frontier APIs** (OpenAI/Anthropic/Google/etc.)

**Forbidden**: Stubs/recordings/`dry_run` for models. No cached "golden" vectors. No echo rerankers.

**Evidence before merge**: `pnpm models:health && pnpm models:smoke`; attach logs (engine, model IDs, vector norms/shape, latency).

**Fallback chain**: Ollama → Frontier (if live). If unavailable, mark task **blocked**; escalate per Constitution.

### Performance Standards (Constitutional)

**Performance components must meet these non-negotiable standards**:

#### Rule 1 — Performance Component Standards

- **No performance regressions**: All performance components must improve or maintain existing performance metrics
- **Real metrics only**: No fake or simulated performance data in production code
- **Comprehensive monitoring**: Every performance component must include structured metrics and health checks
- **Graceful degradation**: Performance failures must not crash the system

#### Rule 2 — Auto-Scaling Standards

- **ML model validation**: Auto-scaling ML models must be trained on real data with proven accuracy (>80%)
- **Cost optimization**: Scaling decisions must consider cost implications and optimize for efficiency
- **Emergency handling**: Auto-scaling must include emergency response protocols for critical load conditions
- **Predictive accuracy**: Load forecasting must achieve minimum accuracy thresholds

#### Rule 3 — Resource Management Standards

- **Memory efficiency**: GPU and memory management must minimize waste and prevent leaks
- **Fair scheduling**: Resource allocation must be fair and prevent starvation
- **Capacity planning**: Resource management must include forward-looking capacity analysis
- **Resource isolation**: Performance components must not impact core system functionality

#### Rule 4 — Monitoring Standards

- **Real-time metrics**: All performance components must emit real-time metrics
- **Alert thresholds**: Performance alerts must have meaningful thresholds with clear escalation paths
- **Performance baselines**: Every component must establish and maintain performance baselines
- **Anomaly detection**: Performance monitoring must include automated anomaly detection

#### Rule 5 — Integration Standards

- **Event-driven communication**: Performance components must use A2A events for inter-component communication
- **Circuit breaker patterns**: All external dependencies must include circuit breaker protection
- **Backward compatibility**: Performance improvements must not break existing integrations
- **Configuration-driven**: Performance behavior must be configurable without code changes

### Quality Gates & Evidence

**Coverage & mutation**:

- **≥ 90% global coverage**
- **≥ 95% changed lines**
- **≥ 90% mutation** (where enabled)

**Tests**: TDD (Red-Green-Refactor); co-locate tests; property-based for critical paths.

**Performance**: Bundle budgets, latency thresholds enforced in CI.

### Accessibility (WCAG 2.2 AA · ISO/IEC 40500:2025)

**Non-negotiable**:

- Semantic HTML, correct ARIA roles, keyboard-complete, target ≥ 44×44 CSS px
- Screen-reader testing via `jest-axe`/axe
- No color-only signaling; consistent focus order
- CLI/TUI: support `--plain` output + high-contrast mode

Include brAInwav branding in a11y announcements where appropriate.

```text
[brAInwav] 2025-10-28T19:22:11.402-07:00 LATENCY:742ms MODELS:LIVE:OK NORTH_STAR:RED_FIRST Acceptance failed as expected
```

Once the acceptance passes, emit `NORTH_STAR:GREEN_AFTER` with the same envelope. Emit `MODELS:LIVE:OK` only after hybrid model health checks succeed; stale connectors MUST prevent emission.

#### Failure Modes & Incident Response

- **Misconfigured logger wrappers** (missing decorators) → redeploy the last known-good wrapper or roll back the partial change.
- **Partial rollouts** mixing old/new formats → promote a consistent build or gate traffic until all pods emit the enforced tokens.
- **Incident hotfix bypassing middleware** → capture a temporary waiver only when the hotfix blocks execution of the failing acceptance test, then restore the wrapper within 24 hours.

Detection relies on CI Conftest failures, observability counters tracking `NORTH_STAR:`/`LATENCY:` frequency, and reviewer manifest audits. During incidents, run synthetic acceptance tests to re-seed `RED_FIRST` and `GREEN_AFTER` markers, document compensating controls, and preserve sanitized log content to honour privacy guarantees.

---

### 7️⃣ **Arc Protocol** [AGENTS-ARC-007]

- Implementations MUST be organized into discrete **arcs** (vertical slices)
- Each arc MUST:
  - Deliver ≤ 7 steps (see Guardrail #1)
  - Span 2–5 commits and 45–120 minutes end-to-end
  - Produce a **milestone test** (red → green proof)
  - Freeze its contract (types/schema/route) before implementation
  - Include a contract snapshot in `design/contracts/`
- **Enforcement**: `run-manifest.json` schema validates arc structure; CI blocks merge if arc lacks milestone test or contract snapshot

**Rationale:** Vertical slices deliver incremental value; contract freeze prevents mid-arc scope creep.

---

### 8️⃣ **North-Star Acceptance Test** [AGENTS-NST-008]

- Every task MUST define a **North-Star acceptance test** before implementation begins
- Test MUST:
  - Prove the feature is real (Gherkin, HTTP contract, or executable spec)
  - Be written in `tests/acceptance/<slug>.spec.[ts|js|py|http]`
  - Fail initially, pass upon task completion
- **Enforcement**: `run-manifest.json` requires `north_star.acceptance_test_path`; CI blocks merge if path missing or test not executable

**Rationale:** Ensures goal clarity and prevents "almost done" syndrome; provides unambiguous completion criteria.

---

### 9️⃣ **Preflight Guards** [AGENTS-PRV-009]

- Before any file writes, network calls, or long executions, agents MUST execute **preflight guards**:
  1. **Cortex Aegis (Oversight)** – `pnpm oversight:vibe-check` or JSON-RPC to `${CORTEX_AEGIS_HTTP_URL:-http://127.0.0.1:2091}`
     - Required headers: `Accept: application/json, text/event-stream`
     - Log saved to `logs/vibe-check/<task>.json`
  2. **Hybrid Model Health** – `pnpm models:health && pnpm models:smoke` with live Ollama/Frontier engines (no stubs)
  3. **Knowledge Connector Health** – Verify `${WIKIDATA_MCP_URL}/healthz` and `${ARXIV_MCP_URL}/healthz`; log to `research/connectors-health.log`
  4. **Trace Context Verification** – `pnpm tsx scripts/ci/verify-trace-context.ts <logfile>` ensures W3C `trace_id` **and** `traceparent` propagate across every governed log line
  5. **Supply-Chain Evidence** – `pnpm sbom:generate && pnpm attest:sign && pnpm verify:attest && pnpm sbom:scan`; store in `sbom/`
  6. **Identity Gate** – CI/services MUST use GitHub Actions OIDC/WIF (no static credentials)
  7. **Feature Flags** – Only OpenFeature-backed toggles are permitted; ad-hoc env-based toggles are prohibited without a waiver
  8. **HTTP Cancellation** – All HTTP/tool calls must support `AbortSignal` (or SDK equivalent) to guarantee cancelation safety
- **Run Manifest Requirements**: `run-manifest.json` MUST include JSON pointers for each attached log artifact **and** persist the raw text submitted to policy helpers so OPA/Conftest inputs remain reproducible.
- **Enforcement**: PR MUST attach preflight logs (vibe-check, model health, connector health, trace verification, SBOM attestation); missing logs block merge

**Rationale:** Prevents governance bypass and ensures all runtime dependencies are healthy before execution begins.

#### Run Manifest Evidence Structure

```json
{
  "log_evidence": [
    {
      "pointer": "/preflight/logs/0",
      "artifact_path": "logs/vibe-check/arc-17.json",
      "raw_text": "[brAInwav] 2025-10-28T19:22:11.402-07:00 LATENCY:742ms MODELS:LIVE:OK NORTH_STAR:RED_FIRST Acceptance failed as expected",
      "sha256": "d41d8cd98f00b204e9800998ecf8427e"
    },
    {
      "pointer": "/preflight/logs/1",
      "artifact_path": "logs/vibe-check/arc-17.json",
      "raw_text": "[brAInwav] 2025-10-28T19:27:49.115-07:00 LATENCY:285ms MODELS:LIVE:OK NORTH_STAR:GREEN_AFTER Acceptance passed"
    },
    {
      "pointer": "/preflight/logs/connector-health",
      "artifact_path": "research/connectors-health.log",
      "raw_text": "[brAInwav] 2025-10-28T19:20:04.010-07:00 LATENCY:93ms CONNECTOR:WIKIDATA MODELS:LIVE:OK status=200"
    }
  ]
}
```

Pointers MUST align with the manifest schema, artifact paths MUST remain accessible to reviewers, and `raw_text` MUST be byte-identical to the content evaluated by policy helpers. Include hashes when feasible to streamline tamper checks.

#### Automation Reference

- **Conftest Policy**: Extend `log_tokens.rego` to assert the presence of `MODELS:LIVE:OK`, `NORTH_STAR:RED_FIRST`, `NORTH_STAR:GREEN_AFTER`, latency markers (`LATENCY:` or `latency_ms`), and ISO-8601 timestamps across `log_evidence[*].raw_text`.
- **Manifest Validator**: Ship a lightweight Node.js/Python script that parses `run-manifest.json`, ensures every log evidence entry contains `pointer`, `artifact_path`, and `raw_text`, and confirms referenced artifacts exist (stream large files to avoid memory blow-ups).
- **CI Integration**: Run both checks in the `policy-opa` job after unit tests. Cache policy bundles, fail fast with actionable messages, and export metrics (`policy.log_tokens.success`) for observability dashboards.
- **Local Task**: Provide `pnpm policy:validate` mirroring CI behaviour so contributors can lint manifests pre-push.

---

### 🔟 **Session Hygiene** [AGENTS-SHG-010]

- Agents MUST reset session context periodically to prevent drift:
  - **Cadence**: 50 minutes build / 10 minutes reset
  - **Context Diet**: Last 2 plan bullets + current failing test + current file + manifest summary only
  - **Hard Reset Triggers**:
    - 2 off-spec suggestions in a row
    - ≥ 3 speculative edits without tests
    - Proposes renaming core interfaces mid-arc
- Session resets MUST be logged in `run-manifest.json` with ISO-8601 timestamps
- **Enforcement**: CI warns if `session_resets` array empty and task duration > 60 minutes; reviewers verify reset discipline

**Rationale:** Prevents context drift in long sessions; maintains focus on current arc objectives.

---

## 🔒 **ENFORCEMENT MECHANISMS**

| Guardrail | Detection | Prevention | Recovery |
|-----------|-----------|------------|----------|
| Step Budget (#1) | `validate-run-manifest.ts` | Phase machine rejects | Split into new arc |
| Ask-First (#2) | Interaction logs | Coordinator blocks 4th Q | Document assumption |
| Explain-While-Doing (#3) | `narrated-diff.ts` check | PR template requires | Request amendment |
| Proof Required (#4) | CI Evidence Triplet check | Template scaffolds tests | Add retroactive proof |
| Recap Rule (#5) | Token counter | Template auto-generates | Trim to ≤500 tokens |
| Brand Logs (#6) | `grep -r 'brand.*brAInwav'` | Logger wrapper | Patch log calls |
| Arc Protocol (#7) | `validate-run-manifest.ts` (arc structure, milestone test, contract snapshot) | Task scaffolding enforces arc template | Add missing arc artifacts |
| North-Star Test (#8) | `validate-run-manifest.ts` (`north_star.acceptance_test_path` required) | `pnpm changelog:new` generates acceptance test scaffold | Write missing north-star test |
| Preflight Guards (#9) | CI checks for `logs/vibe-check/*.json`, model health logs, trace context, SBOM | PR template checklist requires preflight evidence | Execute missing guards and attach logs |
| Session Hygiene (#10) | `run-manifest.json` `session_resets` timestamps; reviewer audit | 10-minute reset hook calls `pnpm session:reset` | Log retrospective resets with justification |

---

## 📋 **QUICK REFERENCE**

**Before starting any task:**

```bash
pnpm changelog:new --slug my-feature --tier feature  # Scaffolds charter-compliant structure + north-star test
pnpm oversight:vibe-check --goal "<task>" --plan "<steps>" --session <id>  # Preflight guard
pnpm models:health && pnpm models:smoke  # Verify live model engines
```

**During implementation:**

```bash
pnpm arc:new --slug my-feature --title "Arc 1: API boundary"  # Max 7 steps enforced
pnpm session:reset --slug my-feature  # At 50-minute mark
```

**Before committing:**

```bash
pnpm charter:validate  # Runs all charter compliance checks
pnpm tsx scripts/ci/verify-trace-context.ts logs/dev.log  # Verify W3C trace_id
pnpm sbom:generate && pnpm attest:sign && pnpm verify:attest  # Supply-chain evidence
```

**In PR:**

- Attach Evidence Triplet links (milestone test, contract snapshot, reviewer JSON)
- Include narrated diff in body
- Attach preflight logs: `logs/vibe-check/*.json`, model health output, connector health log, SBOM attestation
- Reference `CHARTER_SHA256: faf6254926f327ac182261de41f0f100b4c4ac24f2ca4700949c091a66cda13a` in description

---

## 🔗 **CANONICAL REFERENCE**

This document is authoritative. Any conflicts defer to:

1. `governance/rules/AGENT_CHARTER.md` (this file - full specification)
2. `governance/rules/agentic-coding-workflow.md` (workflow integration and task lifecycle)
3. `governance/rules/code-review-checklist.md` (verification)

**Workflow Integration Notes:**

- The full task lifecycle (gates G0–G10) is governed by `agentic-coding-workflow.md`
- Workflow MAY define task tiers (fix/feature/refactor) with differentiated gate requirements, provided all tiers enforce these core guardrails
- Waivers policy detailed in **DEVIATION POLICY** below

**Fragment Extraction:** Use the region of this file wrapped by `<!-- BEGIN CHARTER_FRAGMENT -->` / `<!-- END CHARTER_FRAGMENT -->` when embedding the condensed charter into agent instruction files. Scripts SHOULD preserve whitespace and Markdown exactly as emitted between those markers.

---

## 📖 **GLOSSARY**

- **Arc**: A vertical slice of work spanning API → logic → store → tests, completed in 2–5 commits and 45–120 minutes.
- **Step Budget**: Maximum of 7 discrete plan/act iterations per arc before splitting into a new arc.
- **Evidence Triplet**: Three required artifacts per arc: (1) milestone test path, (2) contract snapshot, (3) reviewer JSON.
- **North-Star Test**: An acceptance test written before implementation that proves the feature is real (must fail initially, pass upon completion).
- **Preflight Guards**: Six mandatory checks before file writes/network calls: vibe-check, model health, connector health, trace context, SBOM, identity gate.
- **Session Hygiene**: 50-minute work / 10-minute reset cadence with context diet and hard reset triggers.

---

## ⚠️ **DEVIATION POLICY**

Waivers require **Maintainer approval** under `governance/waivers/`. All deviations must:

- Document justification with evidence
- Specify compensation controls
- Set expiration date (max 30 days)
- Link to remediation plan
- **Waiver Activation Rule:** A charter waiver is valid only after the `charter-enforce / danger` job posts ✅ with a link to the `Apply Waiver` workflow run that recorded Maintainer approval.
- **Emergency Waiver Sync:** If `charter-enforce / danger` or the Apply Waiver workflow is offline, treat any waiver as **provisional**—record Maintainer approval + compensating controls in `governance/waivers/<id>.md`, annotate the PR with manual evidence, and hold a merge freeze unless explicitly escalated. When automation returns, re-run the Apply Waiver workflow, re-trigger the Danger job until the comment links to that run, and append a post-incident note referencing the workflow URL and restored automation timestamp.

**Reviewer Guidance:**

- "Red first" waivers (Guardrail #4) are acceptable only when a production incident blocks execution of a failing acceptance test. Waivers MUST capture validated reproduction evidence and include a follow-up task restoring the red-first proof within 24 hours.
- Connector freshness waivers (Preflight Guard #3) MAY be approved during documented upstream outages when cached telemetry and timestamps are attached. These waivers expire within 72 hours and require explicit reviewer sign-off on compensating controls.

Unapproved deviations are **constitutional violations** and will block merge.

#### Connector Freshness Waiver Example

```yaml
waiver_id: WAIVER-2025-10-28-connector-outage
rule_ids: [AGENTS-PRV-009]
approver: @maintainer-handle
requested_by: @oncall-engineer
expiry: 2025-10-30T19:00:00Z
reason: |
  Wikidata upstream outage prevented live freshness probes during incident INC-4721.
  Cached dataset timestamped 2025-10-28T18:55:00Z served read-only traffic while upstream recovered.
compensation_controls:
  - Validated cached telemetry checksum (sha256:3b5d5c3712955042212316173ccf37be)
  - Enabled read-only feature flag `connectors.wikidata.read_only`
  - Added pager alert for upstream recovery polling every 15 minutes
evidence_required:
  - research/connectors/wikidata-cache-2025-10-28.json
  - docs/incidents/INC-4721-status-page.pdf
  - json/run-manifest.json#/log_evidence/2
remediation_plan:
  tasks:
    - task_slug: restore-wikidata-freshness
      deadline: 2025-10-29T19:00:00Z
  follow_up:
    - Close waiver upon successful connector health log with current timestamp and attach proof in PR notes
```

Reviewers MUST validate the outage evidence, confirm compensating controls, and ensure the waiver is closed within 72 hours after freshness is restored.

### Waiver Template

```yaml
waiver_id: WAIVER-<YYYY-MM-DD>-<slug>
rule_ids: [AGENTS-XXX-NNN, ...]
approver: @maintainer-handle
requested_by: @contributor-handle
expiry: 2025-MM-DD
reason: |
  Detailed justification explaining why compliance is infeasible
compensation_controls:
  - Alternative safeguard 1
  - Alternative safeguard 2
remediation_plan:
  tasks:
    - task_slug: fix-xxx
      deadline: 2025-MM-DD
  evidence_required:
    - Link to PR
    - Link to updated tests
```

---

<!-- END CHARTER_FRAGMENT -->

---

## 📊 **CI ENFORCEMENT MATRIX (Full)**

| Rule ID        | Description                            | CI Job               | Script/Check                                     |
| -------------- | -------------------------------------- | -------------------- | ------------------------------------------------ |
| AGENTS-STP-001 | Step Budget ≤ 7                        | `validate-manifest`  | `scripts/governance/validate-run-manifest.ts`    |
| AGENTS-ASK-002 | Ask-First ≤ 3                          | `interaction-guard`  | Interaction counter logs (manual review)         |
| AGENTS-EXP-003 | Explain-While-Doing                    | `narrated-diff`      | `scripts/governance/narrated-diff.ts`            |
| AGENTS-PRF-004 | Proof Required (Evidence Triplet)      | `evidence-check`     | `scripts/governance/validate-evidence-triplet.ts`|
| AGENTS-RCP-005 | Recap ≤ 500 tokens                     | `recap-guard`        | Token counter in `evidence/recaps.log`           |
| AGENTS-BRD-006 | Brand Logs                             | `brand-guard`        | `grep -r 'brand.*brAInwav'` in logs              |
| AGENTS-ARC-007 | Arc Protocol                           | `validate-manifest`  | `validate-run-manifest.ts` (arc structure)       |
| AGENTS-NST-008 | North-Star Test                        | `validate-manifest`  | `validate-run-manifest.ts` (north_star path)     |
| AGENTS-PRV-009 | Preflight Guards                       | `preflight-check`    | Check for logs in `logs/vibe-check/`, SBOM, etc. |
| AGENTS-SHG-010 | Session Hygiene                        | `session-guard`      | `run-manifest.json` session_resets timestamps    |

---

## 🚀 **QUICKSTART FOR NEW CONTRIBUTORS**

1. **Read this Charter** (you're here!)
2. **Run task creation**:

   ```bash
   pnpm changelog:new --slug my-feature --tier feature
   ```

3. **Write North-Star test** in `tests/acceptance/my-feature.spec.ts` (must fail initially)
4. **Execute preflight guards**:

   ```bash
   pnpm oversight:vibe-check --goal "my-feature" --plan "step1, step2, ..." --session $(uuidgen)
   pnpm models:health && pnpm models:smoke
   ```

5. **Create first arc** (≤ 7 steps):

   ```bash
   pnpm arc:new --slug my-feature --title "Arc 1: Core API"
   ```

6. **TDD loop**: Write failing test → make it pass → refactor (≤ 20 min per loop)
7. **Session reset** at 50-minute mark:

   ```bash
   pnpm session:reset --slug my-feature
   ```

8. **Before PR**: Attach Evidence Triplet + preflight logs + narrated diff
9. **Review**: Complete code-review-checklist.md; ensure all BLOCKER items ☑ PASS
10. **Merge** only after CI passes and artifacts signed

---

## 📜 **VERSION HISTORY**

### v2.0.0 (2025-10-20)

- **MAJOR**: Added 4 new guardrails (#7 Arc Protocol, #8 North-Star Test, #9 Preflight Guards, #10 Session Hygiene)
- Updated enforcement matrix with new CI checks
- Added glossary and quickstart section
- Added grepable rule IDs (AGENTS-XXX-NNN format)
- Reconciled recap threshold (≤ 500 tokens consistently)
- Added workflow integration notes
- Expanded deviation policy with waiver template

### v1.0.0 (2025-09-01)

- Initial release with 6 core guardrails
- Basic enforcement matrix
- Quick reference commands

---

**Document Hash (for audit trail):**

```bash
shasum -a 256 governance/rules/AGENT_CHARTER.md
# 70953d4e7433e886150fcab9daa1dc8c7a735e5ec6877499fd8832720a3900f4 (full document / AGENT_CHARTER.md)
```

**Effective Date:** Upon maintainer approval (pending)  
**Review Cycle:** Quarterly or upon major workflow changes
