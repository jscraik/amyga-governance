---
trigger: always_on
alwaysApply: true
---
# brAInwav Rules of AI → AGENT_CHARTER.md

**Status**: CONSOLIDATED (stub only; not in governance precedence) - Content moved to canonical location
**New Location**: `governance/00-core/AGENT_CHARTER.md` § AI Behavioral Rules  
**Last Updated**: 2025-12-04

---

## 📋 Document Consolidated

All AI behavioral rules, production standards, and normative requirements have been **merged into** the Agent Charter for single source of truth:

👉 **See**: `governance/00-core/AGENT_CHARTER.md` § "AI BEHAVIORAL RULES"

This consolidation eliminates duplication between charter and rules while maintaining all original content.

### Governance Pack Files (mandatory reading)

- **[Vision](./vision.md)**
- **[Agentic Coding Workflow](../10-flow/agentic-coding-workflow.md)** (includes Task Folder Layout §3)
- **[Assurance System](../10-flow/assurance-system.md)**
- **[Checklists](../20-checklists/checklists.md)**
- **[Constitution](./constitution.md)**
- **[Governance Standards Mapping](../docs/standards-mapping.md)**
- **[EU AI Act Timeline](../docs/eu-ai-act-dates.md)**

---

## 🧭 Governance & Structure Standards

**Root-level files policy**

- **Allowed at root**: AGENTS.md, CODESTYLE.md, README.md, CHANGELOG.md, model guides.
- **Governance enforcement**: Structure Guard validates root entries against `allowedRootEntries`.
- **Branding**: All root docs include brAInwav branding.

**Agent responsibility**: Place specialized rules/config under the correct subdirs (`governance/rules/`, `config/`, `docs/`, etc.).

---

## 🚨 Truthfulness & Production Bars

### Rule 1 — No false implementation claims

Never claim "production-ready/complete/operational" if any prod path contains:

- `Math.random()`-fabricated data, hardcoded mocks, placeholder adapters ("will be wired later")
- `TODO/FIXME/HACK`, `console.warn("not implemented")`
- Fake metrics/telemetry

### Rule 2 — brAInwav truthfulness standard

- Verify claims against actual code & passing gates.
- Distinguish test scaffolding from production.
- Include brAInwav branding in outputs/errors.
- Do not inflate readiness/completion metrics.

### Rule 3 — Production validation requirements

- [ ] Placeholders eliminated  
- [ ] Real integrations in place (no fake data)  
- [ ] Errors/logs branded `[brAInwav]` / `brand:"brAInwav"`  
- [ ] Docs match code  
- [ ] Tests validate real functionality

### Rule 4 — Documentation accuracy

- Status/percentages based on real metrics.
- READMEs reflect current implementation.

### Rule 5 — Commit message standards

- Accurate, evidence-backed messages.
- Add `Co-authored-by: brAInwav Development Team` when appropriate.

---

## 🔄 Mandatory Agentic Workflow (summary)

All agents follow the **7-phase** workflow. Full details: **`governance/10-flow/agentic-coding-workflow.md`** and **AGENTS.md**.

**Task folder (mandatory)** — **`tasks/[feature]/`** per **`governance/10-flow/agentic-coding-workflow.md` §3**.  
**Memory parity (mandatory)** — Persist decisions to `.github/instructions/memories.instructions.md` **and** via Local Memory **MCP/REST dual-mode**; reviewers confirm entries exist.

---

## 🧪 Phase Machine & HITL (constitutional)

**State machine**: **R → G → F → REVIEW**  

- **HITL only at REVIEW**. Any `human_input` before REVIEW is a violation.  
- Agents must persist `governance/run.yaml` with:
  - `phase: "R"|"G"|"F"|"REVIEW"`
  - `agents_sha: <nearest AGENTS.md git-sha>`
  - `task_id`, `run_id`, `started_at`

**Evidence tokens (CI scans logs for):**

- `AGENTS_MD_SHA:<sha>`  
- `PHASE_TRANSITION:<from>-><to>`  
- `brAInwav-vibe-check`  
- `MODELS:LIVE:OK engine=<ollama|frontier>`

**AGENTS.md acknowledgement & Vibe-check**

- At session start: load nearest `AGENTS.md`, compute `agents_sha`, log `AGENTS_MD_SHA:<sha>`.
- After planning and **before** file writes/network calls/long runs: call **Vibe Check MCP** `vibe_check`; include `"brAInwav-vibe-check"` in logs.

---

## 🧱 Integration Surfaces & Auth

**Allowed** (from **vision.md**):

1. **MCP** over HTTP/SSE/optional STDIO: `/mcp`, `/sse`, `/health`, `/metrics`  
   - API key required by default (dev may set `NO_AUTH=true`)  
   - Tools/Resources/Prompts are registered (not embedded)  
   - **Single MCP hub** — no duplicate MCPs per package
2. **A2A** hub (topics/intents) — no direct cross-domain imports
3. **REST API** — authenticated, rate-limited, policy-guarded
4. **Frontier adapters** (OpenAI/Anthropic/Google/etc.)

**MCP OAuth (optional)** — Auth0 scopes: `search.read docs.write memory.read memory.write memory.delete`; RBAC + "Add Permissions in Access Token" enabled.

**Port registry (must align with `.well-known/mcp.json`)**

- `3024` MCP, `3026` Local Memory MCP, `3002` Memory API, `39300` Pieces OS

---

## 🧩 Fast Tools (MANDATORY)

<!-- FAST-TOOLS PROMPT v1 | codex-mastery | watermark:do-not-alter -->

**CRITICAL: Use ripgrep, not grep**

NEVER use grep for project-wide searches (slow, ignores .gitignore). ALWAYS use `rg`.

- `rg "pattern"` — search content
- `rg --files | rg "name"` — find files
- `rg -t python "def"` — language filters

**File finding:** Prefer `fd` (or `fdfind` on Debian/Ubuntu). Respects .gitignore.

**JSON:** Use `jq` for parsing and transformations.

**Install Guidance:**
- macOS: `brew install ripgrep fd jq`
- Debian/Ubuntu: `sudo apt update && sudo apt install -y ripgrep fd-find jq` (alias `fd=fdfind`)

**Agent Instructions:**
- Replace commands: `grep→rg`, `find→rg --files/fd`, `ls -R→rg --files`, `cat|grep→rg pattern file`
- Cap reads at 250 lines; prefer `rg -n -A 3 -B 3` for context
- Use `jq` for JSON instead of regex

<!-- END FAST-TOOLS PROMPT v1 | codex-mastery -->

---

## 💾 Hybrid Model Solution — Live-Only (CONSTITUTIONAL)

**Hard rule**: Embeddings, rerankers, generations must use **live** engines:

- **Ollama** (local server)  
- **Frontier APIs** (OpenAI/Anthropic/Google/etc.)

**Forbidden**: Stubs/recordings/`dry_run` for models. No cached "golden" vectors. No echo rerankers.

**Evidence before merge**: `pnpm models:health && pnpm models:smoke`; attach logs (engine, model IDs, vector norms/shape, latency).

**Fallback chain**: Ollama → Frontier (if live). If unavailable, mark task **blocked**; escalate per Constitution.

---

## ♿ Accessibility (WCAG 2.2 AA · ISO/IEC 40500:2025)

**Non-negotiable**:

- Semantic HTML, correct ARIA roles, keyboard-complete, target ≥ 44×44 CSS px
- Screen-reader testing via `jest-axe`/axe
- No color-only signaling; consistent focus order
- CLI/TUI: support `--plain` output + high-contrast mode

Include brAInwav branding in a11y announcements where appropriate.

---

## 🛡️ Security & Supply Chain

**Scanners (blocking)**:

- **Semgrep** — block on ERROR  
- **gitleaks** — block on ANY secret detection  
- **OSV/audit** — clean lockfiles  
- **SBOM** — CycloneDX 1.6 (ECMA-424) generated for all artifacts

**Environment/config**:

- Use shared loader (`scripts/utils/dotenv-loader.mjs` or `@brainwav/utils`)
- **Never call `dotenv.config()` directly**
- No hardcoded secrets; env/secret managers only; retrieve API keys, SSH keys, and tokens via the 1Password CLI (`op`) at runtime

**Containers**: Minimal base, pinned digests, non-root user, read-only FS, dropped capabilities.
**Provenance**: Target SLSA v1.1 (Approved 2025-04-21); evaluate Source track from SLSA v1.2 RC1 once promoted to GA.
**Signing**: Cosign v3 bundle verification is the default; align release tooling and PolicyController policies accordingly.

---

## 📏 Code Standards (prod paths)

- **Named exports only** (no `export default`)
- **≤ 40 lines per function** (compose via guard clauses)
- **No `any` in TypeScript** (except tests/justified compat shims)
- **No cross-domain imports** — use A2A topics/MCP tools/declared contracts
- **async/await + AbortSignal** — no `.then()` chains
- **Structured logging** — `brand:"brAInwav"`, request/run IDs, OTel traces

---

## 🧪 Quality Gates

**Coverage & mutation**:

- **≥ 90% global coverage**
- **≥ 95% changed lines**
- **≥ 90% mutation** (where enabled)

**Tests**: TDD (Red-Green-Refactor); co-locate tests; property-based for critical paths.

**Performance**: Bundle budgets, latency thresholds enforced in CI.

## ⚡ Performance Standards (constitutional)

**Performance components must meet these non-negotiable standards**:

### Rule 1 — Performance Component Standards

- **No performance regressions**: All performance components must improve or maintain existing performance metrics
- **Real metrics only**: No fake or simulated performance data in production code
- **Comprehensive monitoring**: Every performance component must include structured metrics and health checks
- **Graceful degradation**: Performance failures must not crash the system

### Rule 2 — Auto-Scaling Standards

- **ML model validation**: Auto-scaling ML models must be trained on real data with proven accuracy (>80%)
- **Cost optimization**: Scaling decisions must consider cost implications and optimize for efficiency
- **Emergency handling**: Auto-scaling must include emergency response protocols for critical load conditions
- **Predictive accuracy**: Load forecasting must achieve minimum accuracy thresholds

### Rule 3 — Resource Management Standards

- **Memory efficiency**: GPU and memory management must minimize waste and prevent leaks
- **Fair scheduling**: Resource allocation must be fair and prevent starvation
- **Capacity planning**: Resource management must include forward-looking capacity analysis
- **Resource isolation**: Performance components must not impact core system functionality

### Rule 4 — Monitoring Standards

- **Real-time metrics**: All performance components must emit real-time metrics
- **Alert thresholds**: Performance alerts must have meaningful thresholds with clear escalation paths
- **Performance baselines**: Every component must establish and maintain performance baselines
- **Anomaly detection**: Performance monitoring must include automated anomaly detection

### Rule 5 — Integration Standards

- **Event-driven communication**: Performance components must use A2A events for inter-component communication
- **Circuit breaker patterns**: All external dependencies must include circuit breaker protection
- **Backward compatibility**: Performance improvements must not break existing integrations
- **Configuration-driven**: Performance behavior must be configurable without code changes

---

## 📚 Memory Management & Persistence

**Local Memory (mandatory)**: Store context, decisions, rationale via:

1. **MCP mode**: Local Memory MCP server  
2. **REST mode**: Memory API (dual-mode for parity)  
3. **Oversight log**: `.github/instructions/memories.instructions.md`

**Task artifacts**: `~/tasks/[feature]/` (research, plans, logs, evidence) per **Task Folder Structure**.

---

## 🔍 Code Review (constitutional enforcement)

**Human reviewer (non-author)** completes `governance/rules/code-review-checklist.md`:

- Paste filled checklist as top-level PR comment
- **BLOCKER** items must be PASS
- **MAJOR** items need fixes or Constitution waiver
- **MINOR** items need follow-up task

**Evidence requirements**: file paths+lines, trace IDs, screenshots, URLs.

---

## 🌐 Observability & Telemetry

**Structured logs** — include:

- `brand:"brAInwav"`
- `component:"<package-name>"`
- `trace_id`, `request_id`, `run_id`
- `level`, `msg`, `timestamp` (ISO-8601)

**Metrics/traces**: OpenTelemetry for services; Prometheus `/metrics`; no fake telemetry.

---

## 🔧 Development Environment

**Smart targets** (affected-only):

```bash
pnpm build:smart && pnpm test:smart && pnpm lint:smart
```

**Pre-merge gates**:

```bash
pnpm structure:validate && pnpm security:scan && pnpm models:health
```

**Repo boundaries**: Nx/ESLint enforce dependency graph; no circular deps.

---

## 📝 Evidence & Documentation

**PR requirements**:

- Evidence tokens in logs (`AGENTS_MD_SHA`, `brAInwav-vibe-check`, `MODELS:LIVE:OK`)
- TDD plan + coverage reports attached
- a11y validation (axe reports)
- Security scan results (clean)
- Live model smoke test logs

**Task documentation**: Complete context under `~/tasks/[feature]/` for reproducibility.

**brAInwav attribution**: `Co-authored-by: brAInwav Development Team` in commits where applicable.

---

## ⚖️ Constitutional Compliance

This document is **immutable ethics** (highest precedence in Governance Pack).

**Violations**: Policy violations trigger incident review per Constitution.

**Amendment**: Core principles (truthfulness, branding, accessibility, security) cannot be weakened.

---

**Maintained by**: brAInwav Development Team  
**Co-authored-by**: brAInwav Development Team
