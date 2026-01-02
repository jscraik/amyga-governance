#!/usr/bin/env node
/**
 * @fileoverview Scaffold a governance task directory with run-manifest and evidence placeholders.
 * @license Apache-2.0
 *
 * Usage:
 *   pnpm task:scaffold --slug my-task [--root tasks]
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/**
 * Parse CLI arguments for task scaffolding.
 * @returns {{slug: string, root: string}|null} Parsed args or null.
 */
function parseArgs() {
	const args = process.argv.slice(2);
	let slug = process.env.TASK_SLUG;
	let root = 'tasks';
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--slug' && args[i + 1]) slug = args[i + 1];
		if (args[i] === '--root' && args[i + 1]) root = args[i + 1];
	}
	if (!slug) {
		console.error('[brAInwav] Missing task slug. Use --slug <id> or set TASK_SLUG.');
		process.exitCode = 1;
		return null;
	}
	return { slug, root };
}

/**
 * Ensure a directory exists.
 * @param {string} dir - Directory path.
 * @returns {void} No return value.
 */
function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

/**
 * Write file contents if missing.
 * @param {string} filePath - File path.
 * @param {string} content - File contents.
 * @returns {void} No return value.
 */
function writeIfMissing(filePath, content) {
	if (fs.existsSync(filePath)) return;
	fs.writeFileSync(filePath, `${content}\n`);
}

/**
 * CLI entry point for task scaffolding.
 * @returns {void} No return value.
 */
function main() {
	const args = parseArgs();
	if (!args) return;
	const { slug, root } = args;
	const defaultChangeClass = 'docs';
	const taskRoot = path.join(repoRoot, root, slug);
	const logDir = path.join(taskRoot, 'logs');
	const testsLogDir = path.join(logDir, 'tests');
	const securityLogDir = path.join(logDir, 'security');
	const jsonDir = path.join(taskRoot, 'json');
	const researchDir = path.join(taskRoot, 'research');
	const verificationDir = path.join(taskRoot, 'verification');
	const wcagDir = path.join(verificationDir, 'wcag');
	const sbomDir = path.join(taskRoot, 'sbom');
	const attestDir = path.join(taskRoot, 'attestations');

	[
		taskRoot,
		logDir,
		testsLogDir,
		securityLogDir,
		jsonDir,
		researchDir,
		verificationDir,
		wcagDir,
		sbomDir,
		attestDir
	].forEach(ensureDir);

	writeIfMissing(
		path.join(taskRoot, 'implementation-plan.md'),
		`# Implementation Plan for ${slug}\n\n- [ ] G0 scope\n- [ ] G1 red test\n`
	);
	writeIfMissing(path.join(taskRoot, 'tdd-plan.md'), `# TDD Plan for ${slug}\n\n- [ ] Red\n- [ ] Green\n- [ ] Refactor\n`);
	writeIfMissing(path.join(taskRoot, 'implementation-checklist.md'), '# Checklist\n- [ ] Evidence Triplet\n');
	writeIfMissing(path.join(taskRoot, 'implementation-log.md'), '# Log\n');
	writeIfMissing(path.join(taskRoot, 'code-review.md'), '# Code Review Notes\n');
	writeIfMissing(path.join(taskRoot, 'lessons-learned.md'), '# Lessons Learned\n');
	writeIfMissing(path.join(taskRoot, 'SUMMARY.md'), '# Summary\n');

	writeIfMissing(
		path.join(jsonDir, 'run-manifest.json'),
		JSON.stringify(
			{
				tier: 'feature',
				change_class: defaultChangeClass,
				arcs: [],
				spec: {
					current_state: '',
					desired_state: ''
				},
				verification: {
					success_criteria: [],
					commands: []
				},
				learn: {
					insights: [],
					followups: []
				},
				decision_hierarchy: {
					deterministic_tools: [],
					cli_invocations: [],
					prompts: [],
					agents_used: []
				},
				evidence_triplet: {
					milestone_test: 'logs/tests/milestone.log',
					contract_snapshot: 'json/contracts-snapshot.json',
					reviewer_pointer: 'json/reviewer.json',
				},
				governance: {
					rules_index: 'brainwav/governance/90-infra/governance-index.json',
				},
			},
			null,
			2
		)
	);
	writeIfMissing(path.join(jsonDir, 'plan-bundle.v1.json'), '{}');
	writeIfMissing(path.join(jsonDir, 'memory-ids.json'), '{}');

	writeIfMissing(path.join(logDir, 'vibe-check/.gitkeep'), '');
	writeIfMissing(path.join(logDir, 'academic-research/.gitkeep'), '');

	console.log(`[brAInwav] Scaffolded task at ${path.relative(repoRoot, taskRoot)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export default main;
