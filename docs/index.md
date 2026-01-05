---
layout: home

hero:
  name: AMYGA Governance
  text: Agentic Monitoring, Yielding Governance & Assurance
  tagline: Agentic Monitoring, Yielding Governance & Assurance
  image:
    src: /brand-mark.webp
    alt: AMYGA
  actions:
    - theme: brand
      text: 5-Minute Quickstart
      link: /QUICKSTART-5min
    - theme: alt
      text: View Tiers
      link: /TIERED-OFFERING-STRUCTURE
    - theme: alt
      text: GitHub
      link: https://github.com/jscraik/amyga-governance

features:
  - title: 🎯 Progressive Enhancement
    details: Start with Starter tier (zero tools), upgrade to Standard (security basics), or Enterprise (full compliance) when you're ready.
  - title: 🚀 5-Minute Setup
    details: Run one command and you're governing AI work. No 50-page docs, no toolchain drama, no ceremony.
  - title: 🔒 Platform-Agnostic
    details: Works with GitHub, GitLab, CircleCI, or any CI/CD system. Use Claude, ChatGPT, Copilot, or any LLM.
  - title: 📊 Evidence-Based
    details: Every task generates an audit trail: test proof, contract snapshots, review dispositions. Compliance as a byproduct.
  - title: 🎨 Guardrails, Not Gates
    details: Structure the work, don't stop it. AI works within clear bounds; humans review outcomes, not processes.
  - title: 🔧 Automation First
    details: Hash-pinned governance, automated validation, CI integration. Governance runs at CI speed.

---

## What is AMYGA?

AMYGA is a **governance-as-code framework** for teams using AI assistants (Claude, ChatGPT, Copilot) to write software.

### The Problem

AI-assisted development is 10x faster. Your governance hasn't changed.

- Developers push AI-generated code without tests
- Security reviews happen after deployment
- Compliance is a spreadsheet nightmare
- No one knows what the AI actually did

### The Solution

**Structured workflow + automated validation + evidence trails**

```bash
# One command to start
pnpm exec amyga init

# AI now works within governance
- Creates task folders with evidence placeholders
- Generates ≤7-step plans (Step Budget)
- Writes failing tests first (ArcTDD)
- Produces audit trail automatically
```

## Three Tiers, Zero Lock-in

| Tier | What You Get | Tools Required | Who It's For |
|------|--------------|----------------|--------------|
| **Starter** | Workflow structure only | 0 | Solo devs, small teams |
| **Standard** | + Basic security scanning | 3 | Startups, growth teams |
| **Enterprise** | + Full compliance suite | 9+ | Regulated industries |

All tiers are **MIT-licensed**. Pay for support, not for software.

## How It Works

### 1. Initialize

```bash
pnpm dlx amyga init
```

The wizard asks 3 questions and creates:
- `.agentic-governance/config.json` (your governance settings)
- `tasks/my-first-task/` (structured workspace)

### 2. Work with AI

Tell your AI assistant:

> "Use AMYGA governance for this task. Create a ≤7-step plan, write failing tests first, and generate evidence."

The AI now:
- Creates structured plans (not just code)
- Writes tests before implementation
- Documents what it did and why
- Leaves evidence you can review

### 3. Validate

```bash
pnpm exec amyga validate
```

Output:
```
✓ Step Budget within limits (5/7 steps)
✓ Evidence Triplet complete
✓ Tests pass (red → green)
✓ No governance hash drift

Ready for review.
```

## Real-World Impact

### Startup (Team of 4)
- **Before**: AI code shipped without tests, constant post-deploy fires
- **After**: Every task has evidence, tests required, governance is invisible
- **Result**: Higher quality, no overhead, shipped faster

### SaaS Company (Team of 25)
- **Before**: 2-3 security incidents/month, 2-week compliance prep
- **After**: Security incidents → 0, compliance → 5 minutes
- **Result**: Engineering time saved, fewer fires, board happy

### Healthtech (Team of 100)
- **Before**: 6-month SOC 2 prep, AI banned in production
- **After**: 2-week SOC 2 prep, AI governed and unbanned
- **Result**: Audit passed, AI adopted, competitive advantage

## Key Concepts

### Step Budget
Plans must be ≤7 steps. Prevents over-planning paralysis and keeps AI focused.

### Evidence Triplet
Every task requires:
1. **Test proof**: Failing → passing test demonstration
2. **Contract snapshot**: API/feature specification
3. **Review disposition**: Human approval with rationale

### ArcTDD Gates
G0–G10 gates map to Red→Green→Refactor→Review workflow. Evidence required at each gate.

### Hash-Pinned Governance
Every policy file has a SHA-256 hash. CI blocks mismatches. No silent policy changes.

## Next Steps

1. **Try it now** (5 minutes):
   ```bash
   pnpm dlx amyga init
   ```

2. **Read the quickstart**: [5-Minute Quickstart](/QUICKSTART-5min)

3. **Choose your tier**: [Tier Comparison](/TIERED-OFFERING-STRUCTURE)

4. **Join the community**: [GitHub Discussions](https://github.com/jscraik/amyga-governance/discussions)

---

**_from demo to duty_**

<AMYGA /> 2025
