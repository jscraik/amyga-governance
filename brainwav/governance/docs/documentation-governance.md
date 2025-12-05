# Documentation Governance

This policy enforces documentation quality using the OpenAI Cookbook guidance ("What makes documentation good") and mandates JSDoc coverage across all JavaScript/TypeScript code.

## Table of Contents

- [Documentation Governance](#documentation-governance)
  - [Table of Contents](#table-of-contents)
  - [Scope](#scope)
  - [Quality Bar (OpenAI Cookbook-aligned)](#quality-bar-openai-cookbook-aligned)
  - [Documentation Acceptance Checklist](#documentation-acceptance-checklist)
  - [JSDoc Implementation Standard](#jsdoc-implementation-standard)
    - [JSDoc template (TypeScript)](#jsdoc-template-typescript)
    - [Tooling \& Enforcement](#tooling--enforcement)
  - [Author Workflow](#author-workflow)
  - [Reviewer Checklist](#reviewer-checklist)
  - [Traceability](#traceability)

## Scope

- Applies to all documentation in this repository (markdown, READMEs, runbooks, specs) and to all JS/TS source files, tests, scripts, and config code that expose functions/types/classes.
- Complements `AGENTS.md`, `CODESTYLE.md`, and `brainwav/governance/00-core/RULES_OF_AI.md`. Package-level `AGENTS.md` MAY tighten but MUST NOT weaken these rules.

## Quality Bar (OpenAI Cookbook-aligned)

Authors and reviewers MUST apply these rules from [What makes documentation good](https://cookbook.openai.com/articles/what_makes_documentation_good):

- **Make docs easy to skim**: Table of contents for docs > 400 words; headings are sentence-style and informative; paragraphs short; bullets/tables used for lists; bold key takeaways; topic sentences lead each section.
- **Put takeaways up front**: Each doc and section starts with the conclusion or result before process/detail. Avoid slow reveals or Socratic buildup.
- **Write simply and clearly**: Short sentences; avoid left-branching phrasing; cut filler/adverbs; avoid demonstrative pronouns across sentences (e.g., "this" without a noun); prefer active, imperative voice.
- **Be broadly helpful**: Explain jargon on first use; prefer specific, accurate terms; add minimal-setup, exportable examples; avoid bad habits (e.g., keys in code, unsafe patterns); prioritize common tasks/questions.
- **Be consistent**: Follow repository casing, tone, and formatting; keep terminology, heading style, and serial commas consistent.
- **Break rules only with intent**: Deviations MUST be justified in the doc as a note (e.g., "Exception: ... because ...").

## Documentation Acceptance Checklist

A doc is **ready** only if all items are true:

- Has TOC (if > 400 words) and scannable headings; front-loads takeaways.
- Each section opens with a standalone topic sentence; paragraphs stay short.
- Examples are minimal-dependency and runnable; no secrets, no unsafe patterns.
- Glosses jargon on first use; uses precise terms (e.g., "max token limit" vs "context").
- Uses bullets/tables for lists; bolds the key outputs or decisions.
- Includes explicit exceptions when departing from the above rules.

## JSDoc Implementation Standard

- **Coverage**: Every exported function, class, type alias/interface, constant, and module-level factory MUST have a JSDoc block. Internal helpers without exports SHOULD have JSDoc when non-trivial.
- **Content**: Provide a one-line summary, `@param` for each parameter, `@returns` (or `@return`), and `@throws` (or `@throws`-equivalent description) when applicable. For async functions include `@returns Promise<…>`.
- **Types**: TS types remain canonical; JSDoc descriptions clarify intent, side effects, units, preconditions, and error cases. Do not restate obvious types without intent.
- **Examples**: Include `@example` for public APIs and utilities; prefer minimal dependencies.
- **Behavioral contracts**: Document constraints (e.g., idempotency, mutability, abort semantics, timeouts) and input validation expectations.
- **No escapes**: Do not use `@ts-ignore`/`@ts-nocheck`; follow `CODESTYLE.md` for type safety and lint directives.

### JSDoc template (TypeScript)

```ts
/**
 * Parses a governance index file and validates SHA alignment.
 * @param path Absolute path to the index file.
 * @param expectedDigest SHA-256 digest recorded in governance metadata.
 * @returns Parsed index contents when the digest matches.
 * @throws {Error} When the file is missing or the digest mismatches.
 * @example
 * const index = await loadGovernanceIndex(pathToIndex, cachedSha);
 */
export async function loadGovernanceIndex(path: string, expectedDigest: string): Promise<GovernanceIndex> {
  // implementation
}
```

### Tooling & Enforcement

- **ESLint (flat config)**: Enable `eslint-plugin-jsdoc` with `recommended` or stricter; fail on missing params/returns (`require-jsdoc`, `check-tag-names`, `require-param`, `require-returns`, `require-description-complete-sentence`).
- **Biome**: Do not auto-remove JSDoc; configure to preserve block comments.
- **CI gates**: Add/keep lint targets that run ESLint with jsdoc rules and enforce `AGENTS-DOC-005` docs validation. JSDoc coverage gaps on changed files are blockers.
- **Review**: Code review checklist MUST confirm JSDoc presence, correctness, and alignment with behavior.

## Author Workflow

1. Draft with takeaways first; add TOC (>400 words) and section topic sentences.
2. Convert lists to bullets/tables; bold key decisions/outputs.
3. Add runnable, minimal-dependency examples; strip secrets and unsafe patterns.
4. Add JSDoc to all exports and meaningful helpers; include `@example` for public APIs.
5. Run lint (`pnpm lint:smart` or package lint task) to verify jsdoc rules; fix violations.
6. Note any intentional deviations inline with rationale.

## Reviewer Checklist

- TOC (if >400 words), skimmable headings, short paragraphs, topic sentences present.
- Takeaways front-loaded; jargon defined; examples minimal and safe.
- JSDoc present on all exports; describes intent, edge cases, errors, side effects; examples make sense.
- Lint passes with jsdoc rules; no `@ts-ignore`/`@ts-nocheck` escapes.
- Deviations are explicitly justified.

## Traceability

- Link this policy in PR descriptions when documentation or JS/TS code is touched.
- If a package has tighter rules, cite both this file and the package `AGENTS.md`.
- For waivers, follow `AGENTS.md §27` and record the waiver id in the PR.
