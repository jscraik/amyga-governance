#!/usr/bin/env node
/**
 * @fileoverview Minimal CLI behavior tests for governance scripts.
 * @license Apache-2.0
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGovernanceUpgrade } from './upgrade-governance.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/**
 * Create a temporary repo directory.
 * @returns {string} Temp directory path.
 */
function makeTempRepo() {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brainwav-governance-'));
	return tempRoot;
}

/**
 * Write a file ensuring parent directory exists.
 * @param {string} target - Target file path.
 * @param {string} content - File content.
 * @returns {void} No return value.
 */
function writeFile(target, content) {
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, content);
}

/**
 * Run upgrade and assert force flag behavior.
 * @returns {void} No return value.
 */
function testUpgradeForceFlag() {
	const tempRoot = makeTempRepo();
	try {
		const agentsPath = path.join(tempRoot, 'AGENTS.md');
		const pkgPath = path.join(tempRoot, 'package.json');
		writeFile(agentsPath, 'LOCAL\n');
		writeFile(
			pkgPath,
			JSON.stringify(
				{
					name: 'cli-test-repo',
					version: '0.0.0',
					private: true
				},
				null,
				2
			) + '\n'
		);

		runGovernanceUpgrade({
			destRoot: tempRoot,
			mode: 'full',
			profile: 'release',
			preserveConfig: true,
			force: false,
			dryRun: false,
			noInstall: true,
			silent: true,
			configPath: path.join(tempRoot, '.agentic-governance', 'config.json'),
			packs: [],
			packOptions: {}
		});

		const afterNoForce = fs.readFileSync(agentsPath, 'utf8');
		assert.equal(afterNoForce, 'LOCAL\n', 'upgrade without --force should not overwrite AGENTS.md');

		const repoAgents = fs.readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8');
		runGovernanceUpgrade({
			destRoot: tempRoot,
			mode: 'full',
			profile: 'release',
			preserveConfig: true,
			force: true,
			dryRun: false,
			noInstall: true,
			silent: true,
			configPath: path.join(tempRoot, '.agentic-governance', 'config.json'),
			packs: [],
			packOptions: {}
		});

		const afterForce = fs.readFileSync(agentsPath, 'utf8');
		assert.equal(afterForce, repoAgents, 'upgrade with --force should overwrite AGENTS.md');
	} finally {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
}

/**
 * Assert config profile is used when flags omit --profile.
 * @returns {void} No return value.
 */
function testProfileFallback() {
	const tempRoot = makeTempRepo();
	try {
		const configPath = path.join(tempRoot, '.agentic-governance', 'config.json');
		writeFile(
			path.join(tempRoot, 'package.json'),
			JSON.stringify(
				{
					name: 'cli-test-repo-profile',
					version: '0.0.0',
					private: true
				},
				null,
				2
			) + '\n'
		);
		writeFile(
			configPath,
			JSON.stringify(
				{
					version: '1.0',
					mode: 'full',
					profile: 'release',
					packs: [],
					overlays: []
				},
				null,
				2
			) + '\n'
		);
		const repoAgents = fs.readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8');
		runGovernanceUpgrade({
			destRoot: tempRoot,
			mode: 'full',
			profile: null,
			preserveConfig: true,
			force: true,
			dryRun: false,
			noInstall: true,
			silent: true,
			configPath,
			packs: [],
			packOptions: {}
		});
		const agentsPath = path.join(tempRoot, 'AGENTS.md');
		const afterUpgrade = fs.readFileSync(agentsPath, 'utf8');
		assert.equal(afterUpgrade, repoAgents, 'upgrade should use config profile when no flag provided');
	} finally {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
}

/**
 * CLI entry point for tests.
 * @returns {void} No return value.
 */
function main() {
	testUpgradeForceFlag();
	testProfileFallback();
	console.log('[brAInwav] cli tests passed.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('cli-tests.mjs')) {
	main();
}

export default main;
