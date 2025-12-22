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

function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

function writeIfMissing(filePath, content) {
	if (fs.existsSync(filePath)) return;
	fs.writeFileSync(filePath, `${content}\n`);
}

function main() {
	const args = parseArgs();
	if (!args) return;
	const { slug, root } = args;
	const taskRoot = path.join(repoRoot, root, slug);
	const logDir = path.join(taskRoot, 'logs');
	const jsonDir = path.join(taskRoot, 'json');
	const researchDir = path.join(taskRoot, 'research');
	const verificationDir = path.join(taskRoot, 'verification');
	const sbomDir = path.join(taskRoot, 'sbom');
	const attestDir = path.join(taskRoot, 'attestations');

	[taskRoot, logDir, jsonDir, researchDir, verificationDir, sbomDir, attestDir].forEach(ensureDir);

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
				arcs: [],
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

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('task-scaffold.mjs')) {
	main();
}

export default main;
