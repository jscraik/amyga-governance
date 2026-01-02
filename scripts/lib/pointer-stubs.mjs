/**
 * @fileoverview Generate deterministic pointer-mode stubs.
 * @license Apache-2.0
 */

const STUB_MARKER = 'BRAINWAV_GOVERNANCE_STUB';
const INSTRUCTIONS_MARKER = 'BRAINWAV_GOVERNANCE_INSTRUCTIONS';
const REPO_URL = 'https://github.com/jscraik/brainwav-agentic-governance';

function resolveTag(version) {
	if (!version || version === 'unknown') return 'main';
	return /^\d+\.\d+\.\d+$/.test(version) ? `v${version}` : 'main';
}

function canonicalLink(version, relPath) {
	const tag = resolveTag(version);
	return `${REPO_URL}/blob/${tag}/${relPath}`;
}

/**
 * Build an AGENTS pointer stub.
 * @param {Record<string, unknown>} pointer - Pointer metadata.
 * @returns {string} Stub contents.
 */
export function buildAgentsStub(pointer) {
	const profile = pointer?.profile || 'unknown';
	const packageName = pointer?.package || '@brainwav/brainwav-agentic-governance';
	const version = pointer?.version || 'unknown';
	const agentsDoc = canonicalLink(version, 'AGENTS.md');
	const charterDoc = canonicalLink(
		version,
		'brainwav/governance/00-core/AGENT_CHARTER.md'
	);
	const workflowDoc = canonicalLink(
		version,
		'brainwav/governance/10-flow/agentic-coding-workflow.md'
	);
	const checklistsDoc = canonicalLink(
		version,
		'brainwav/governance/20-checklists/checklists.md'
	);
	const securityDoc = canonicalLink(version, 'SECURITY.md');
	const codestyleDoc = canonicalLink(version, 'CODESTYLE.md');

	return (
		`# AGENTS — Governance Runtime\n\n` +
		`${STUB_MARKER}\n` +
		`Package: ${packageName}\n` +
		`Version: ${version}\n` +
		`Profile: ${profile}\n\n` +
		`## Non-negotiables\n` +
		`- Follow the Agent Charter (Step Budget <= 7, Evidence Triplet, Service Identity logs).\n` +
		`- Use pointer mode; do not copy canonical governance docs into the repo.\n` +
		`- Add local deltas only via .agentic-governance/overlays/ and declare them in config.json.\n` +
		`- Use repo-fast tools: rg for search; avoid destructive commands unless requested.\n\n` +
		`## Required evidence\n` +
		`- Task folder under tasks/<slug>/ with PLAN, risk-register, and evidence logs.\n` +
		`- Evidence Triplet: plan anchor, failing→passing test, reviewer proof.\n\n` +
		`## Primary commands\n` +
		`- Install (pointer, pinned): pnpm add -D ${packageName} && pnpm exec brainwav-governance install --root . --mode pointer --profile delivery\n` +
		`- Validate (strict): pnpm exec brainwav-governance validate --root . --strict --report .agentic-governance/reports\n` +
		`- Doctor: pnpm exec brainwav-governance doctor --root . --report .agentic-governance/reports\n` +
		`- Task scaffold: pnpm exec brainwav-governance task init --slug <slug> --tier <feature|fix|refactor|research|update>\n\n` +
		`## Canonical references (versioned)\n` +
		`- AGENTS: ${agentsDoc}\n` +
		`- Charter: ${charterDoc}\n` +
		`- Workflow: ${workflowDoc}\n` +
		`- Checklists: ${checklistsDoc}\n` +
		`- SECURITY: ${securityDoc}\n` +
		`- CODESTYLE: ${codestyleDoc}\n\n` +
		`CLI instructions: .agentic-governance/instructions.md\n`
	);
}

/**
 * Build a CODESTYLE/SECURITY pointer stub.
 * @param {string} title - Document title.
 * @param {string} canonicalPath - Canonical path to the doc.
 * @param {Record<string, unknown>} pointer - Pointer metadata.
 * @returns {string} Stub contents.
 */
export function buildPointerStub(title, canonicalPath, pointer) {
	const packageName = pointer?.package || '@brainwav/brainwav-agentic-governance';
	const version = pointer?.version || 'unknown';
	const relPath = canonicalPath.replace(/^node_modules\/@brainwav\/brainwav-agentic-governance\//, '');
	const canonicalDoc = canonicalLink(version, relPath);

	return (
		`# ${title} — Pointer\n\n` +
		`${STUB_MARKER}\n` +
		`Package: ${packageName}\n` +
		`Version: ${version}\n` +
		`Canonical path: ${canonicalPath}\n` +
		`Canonical link: ${canonicalDoc}\n\n` +
		`Local overrides (additive only):\n` +
		`- Place deltas in .agentic-governance/overlays/\n` +
		`- Declare overlays in .agentic-governance/config.json\n`
	);
}

/**
 * Build a docs/GOVERNANCE pointer stub.
 * @param {Record<string, unknown>} pointer - Pointer metadata.
 * @returns {string} Stub contents.
 */
export function buildGovernanceIndexStub(pointer) {
	const packageName = pointer?.package || '@brainwav/brainwav-agentic-governance';
	const version = pointer?.version || 'unknown';
	const govRoot =
		pointer?.governanceRoot ||
		'node_modules/@brainwav/brainwav-agentic-governance/brainwav/governance';
	const indexDoc = canonicalLink(version, 'brainwav/governance/90-infra/governance-index.json');

	return (
		`# Governance — Pointer\n\n` +
		`${STUB_MARKER}\n` +
		`Package: ${packageName}\n` +
		`Version: ${version}\n` +
		`Canonical governance root: ${govRoot}\n` +
		`Canonical index: ${indexDoc}\n\n` +
		`CLI instructions: .agentic-governance/instructions.md\n\n` +
		`Local overrides (additive only):\n` +
		`- Place deltas in .agentic-governance/overlays/\n` +
		`- Declare overlays in .agentic-governance/config.json\n`
	);
}

/**
 * Build CLI instructions for pointer/full installs.
 * @param {Record<string, unknown>} pointer - Pointer metadata.
 * @returns {string} Instructions markdown.
 */
export function buildCliInstructions(pointer) {
	const packageName = pointer?.package || '@brainwav/brainwav-agentic-governance';
	const version = pointer?.version || 'unknown';
	return (
		`# Governance CLI Instructions\n\n` +
		`${INSTRUCTIONS_MARKER}\n` +
		`Package: ${packageName}\n` +
		`Version: ${version}\n\n` +
		`## Common commands\n` +
		`- Install (recommended path):\n` +
		`  pnpm add -D ${packageName}\n` +
		`  pnpm exec brainwav-governance install --root . --mode pointer --profile delivery --yes\n` +
		`- Upgrade governance:\n` +
		`  pnpm exec brainwav-governance upgrade --root .\n` +
		`- Validate (strict):\n` +
		`  pnpm exec brainwav-governance validate --root . --strict --report .agentic-governance/reports\n` +
		`- Doctor (readiness):\n` +
		`  pnpm exec brainwav-governance doctor --root . --report .agentic-governance/reports\n` +
		`- Scaffold a task folder:\n` +
		`  pnpm exec brainwav-governance task init --slug <slug> --tier <feature|fix|refactor|research|update>\n` +
		`- Spec init (SDD pack):\n` +
		`  pnpm exec brainwav-governance spec init --slug <slug> --spec-root specs\n` +
		`- List packs:\n` +
		`  pnpm exec brainwav-governance packs list --json\n` +
		`- Cleanup plan (pointer mode):\n` +
		`  pnpm exec brainwav-governance cleanup-plan --root . --report .agentic-governance/reports/cleanup-plan.json\n` +
		`  pnpm exec brainwav-governance cleanup-plan --root . --apply --force\n` +
		`  # writes .agentic-governance/reports/cleanup.applied.json\n`
	);
}

export const POINTER_STUB_MARKER = STUB_MARKER;
export const POINTER_INSTRUCTIONS_MARKER = INSTRUCTIONS_MARKER;
