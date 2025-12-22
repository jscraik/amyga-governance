#!/usr/bin/env node
/**
 * @fileoverview Copy governance pack into a target repository safely.
 * @license Apache-2.0
 *
 * Usage: node scripts/bootstrap-consumer.mjs --dest ../my-project
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
	'scripts/cortex-governance-bootstrap.mjs',
	'scripts/readiness-check.mjs',
	'scripts/ensure-tools.mjs',
	'scripts/oversight-vibe-check.mjs',
	'scripts/sync-governance-hashes.mjs',
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
		throw new Error('Missing --dest <path> for consumer repository');
	}
	return path.resolve(dest);
}

function copyItem(itemPath, targetRoot) {
	const source = path.join(repoRoot, itemPath);
	const dest = path.join(targetRoot, itemPath);
	fs.cpSync(source, dest, { recursive: true });
	console.log(`[brAInwav] copied ${itemPath}`);
}

function main() {
	try {
		const targetRoot = parseArgs();
		if (!fs.existsSync(targetRoot)) throw new Error(`Destination does not exist: ${targetRoot}`);
		COPY_LIST.forEach((item) => copyItem(item, targetRoot));
		console.log(`[brAInwav] bootstrap-complete -> ${targetRoot}`);
	} catch (error) {
		console.error(`[brAInwav] bootstrap-consumer failed: ${error.message}`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export default main;
