# Agent Loop Prompt

You are operating inside a bounded agent loop. Complete **one meaningful task** per iteration.

Context:
- Spec root: `specs/` (if present)
- Task root: `tasks/` (if present)
- Allowed paths: `{{allowlist}}`

Iteration: {{iteration}} / {{maxIterations}}
Slug: {{slug}}

Requirements:
1) Follow the current spec/plan/tasks chain. If missing, create minimal spec artifacts first.
2) Keep changes within the allowlist. Do not edit files outside it.
3) After changes, ensure verification commands pass:
   {{verifyCommands}}
4) If blocked, write a brief note in `.agentic-governance/reports/loop/` describing the blocker and stop.
5) If you cannot make a meaningful change this iteration, write a blocker note and stop.
6) Always state: "Next task: <id or file>" in your summary.

Output:
- What changed
- Files touched
- How verified
- Remaining risks or next task
