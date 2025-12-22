#!/usr/bin/env node
/**
 * @fileoverview Install governance pack into a target project (files + CI workflow).
 * @license Apache-2.0
 *
 * Usage:
 *   pnpm governance:install --dest /path/to/consumer
 *
 * Copies:
 * - AGENTS.md, CODESTYLE.md, SECURITY.md
 * - brainwav/governance/** (policies, templates, index)
 * - .github/ISSUE_TEMPLATE/* and PR template
 * - governance workflow (.github/workflows/governance.yml) from the bundled template
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const COPY_LIST = [
	'AGENTS.md',
	'CODESTYLE.md',
	'SECURITY.md',
	'brainwav',
	'.github/ISSUE_TEMPLATE',
	'.github/pull_request_template.md',
];

function parseArgs() {
	const args = process.argv.slice(2);
	let dest;
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--dest' && args[i + 1]) dest = args[i + 1];
	}
	if (!dest) {
		throw new Error('Missing --dest <path> for target project');
	}
	return path.resolve(dest);
}

function copyRecursive(src, dest) {
	fs.cpSync(src, dest, { recursive: true });
	console.log(`[brAInwav] copied ${path.relative(repoRoot, src)} -> ${dest}`);
}

function main() {
	try {
		const destRoot = parseArgs();
		if (!fs.existsSync(destRoot)) {
			throw new Error(`Destination does not exist: ${destRoot}`);
		}

		// Copy core files
		COPY_LIST.forEach((item) => {
			const src = path.join(repoRoot, item);
			const dest = path.join(destRoot, item);
			copyRecursive(src, dest);
		});

		// Ensure workflows folder
		const workflowDest = path.join(destRoot, '.github', 'workflows');
		fs.mkdirSync(workflowDest, { recursive: true });
		const workflowTemplate = path.join(
			repoRoot,
			'brainwav',
			'governance',
			'templates',
			'workflows',
			'governance.yml'
		);
		const workflowTarget = path.join(workflowDest, 'governance.yml');
		copyRecursive(workflowTemplate, workflowTarget);

		console.log('[brAInwav] governance install complete.');
		console.log(
			'[brAInwav] Next: ensure Node 24.11.x + pnpm 10.19.x in the consumer CI environment.'
		);
	} catch (error) {
		console.error(`[brAInwav] governance install failed: ${error.message}`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('install-governance.mjs')) {
	main();
}

export default main;
