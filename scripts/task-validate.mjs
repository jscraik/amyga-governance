#!/usr/bin/env node
/**
 * @fileoverview Validate a task directory for governance compliance (structure + evidence triplet).
 * @license Apache-2.0
 *
 * Usage: pnpm task:validate --slug my-task [--root tasks]
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const changeClassPath = path.join(repoRoot, 'brainwav', 'governance', '90-infra', 'change-classes.json');

/**
 * Parse CLI arguments for task validation.
 * @returns {{slug: string, root: string}} Parsed args.
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
		throw new Error('Missing task slug. Use --slug <id> or set TASK_SLUG.');
	}
	return { slug, root };
}

/**
 * Assert that a path exists and record missing labels.
 * @param {string} p - Path to check.
 * @param {string} label - Missing label.
 * @param {string[]} missing - Missing list to mutate.
 * @returns {void} No return value.
 */
function mustExist(p, label, missing) {
	if (!fs.existsSync(p)) missing.push(label);
}

/**
 * CLI entry point for task validation.
 * @returns {void} No return value.
 */
function main() {
	try {
		const { slug, root } = parseArgs();
		const taskRoot = path.join(repoRoot, root, slug);
		const missing = [];
		const changeClasses = new Set();
		if (fs.existsSync(changeClassPath)) {
			const raw = JSON.parse(fs.readFileSync(changeClassPath, 'utf8'));
			Object.keys(raw.classes || {}).forEach((key) => changeClasses.add(key));
		}

	mustExist(path.join(taskRoot, 'implementation-plan.md'), 'implementation-plan.md', missing);
	mustExist(path.join(taskRoot, 'tdd-plan.md'), 'tdd-plan.md', missing);
	mustExist(path.join(taskRoot, 'implementation-checklist.md'), 'implementation-checklist.md', missing);
		mustExist(path.join(taskRoot, 'json', 'run-manifest.json'), 'json/run-manifest.json', missing);
		mustExist(path.join(taskRoot, 'json', 'memory-ids.json'), 'json/memory-ids.json', missing);
		mustExist(path.join(taskRoot, 'logs', 'vibe-check'), 'logs/vibe-check/', missing);
		mustExist(path.join(taskRoot, 'logs', 'academic-research'), 'logs/academic-research/', missing);
		mustExist(path.join(taskRoot, 'logs', 'tests'), 'logs/tests/ (evidence)', missing);
		const manifestPath = path.join(taskRoot, 'json', 'run-manifest.json');
		if (fs.existsSync(manifestPath)) {
			const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
			const arcs = manifest.arcs || [];
			if (arcs.length > 7) {
				missing.push('Step Budget exceeded: arcs > 7');
			}
			if (!manifest.spec || typeof manifest.spec !== 'object') {
				missing.push('run-manifest.json missing spec current/desired state');
			}
			if (!manifest.verification || typeof manifest.verification !== 'object') {
				missing.push('run-manifest.json missing verification fields');
			}
			if (!manifest.learn || typeof manifest.learn !== 'object') {
				missing.push('run-manifest.json missing learn fields');
			}
			if (!manifest.decision_hierarchy || typeof manifest.decision_hierarchy !== 'object') {
				missing.push('run-manifest.json missing decision_hierarchy fields');
			}
			const declaredClasses = Array.isArray(manifest.change_classes)
				? manifest.change_classes
				: manifest.change_class
					? [manifest.change_class]
					: [];
			if (declaredClasses.length === 0) {
				missing.push('run-manifest.json missing change_class/change_classes');
			} else if (changeClasses.size > 0) {
				declaredClasses.forEach((value) => {
					if (!changeClasses.has(value)) {
						missing.push(`run-manifest.json unknown change_class: ${value}`);
					}
				});
			}
		}

		if (missing.length > 0) {
			console.error(
				`[brAInwav] task-validate FAILED for ${slug}. Missing:\n - ${missing.join('\n - ')}`
			);
			process.exitCode = 1;
			return;
		}

		console.log(`[brAInwav] task-validate OK for ${slug}.`);
	} catch (error) {
		console.error(`[brAInwav] task-validate error: ${error.message}`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export default main;
