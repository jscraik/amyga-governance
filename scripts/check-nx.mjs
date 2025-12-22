#!/usr/bin/env node
/**
 * @fileoverview Optional Nx graph check. Passes silently if Nx config is absent.
 * Runs `nx graph --file nx-graph.json` when nx.json exists.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const nxConfig = path.join(repoRoot, 'nx.json');

function main() {
	if (!fs.existsSync(nxConfig)) {
		console.log('[brAInwav] Nx config not found; skipping nx graph check.');
		return;
	}
	const result = spawnSync('npx', ['nx', 'graph', '--file', 'nx-graph.json'], {
		cwd: repoRoot,
		stdio: 'inherit',
		env: { ...process.env },
	});
	if (result.status !== 0) {
		process.exitCode = result.status || 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('check-nx.mjs')) {
	main();
}

export default main;
