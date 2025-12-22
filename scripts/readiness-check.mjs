#!/usr/bin/env node
/**
 * @fileoverview Composite readiness check: verifies governance files and required tooling.
 * @module scripts/readiness-check
 * @license Apache-2.0
 *
 * Validates that all critical governance files exist and required CLI tools are installed.
 * This is the primary pre-flight check before governance operations.
 *
 * @example
 * // Run via npm script
 * pnpm readiness:check
 *
 * @example
 * // Run directly
 * node scripts/readiness-check.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import ensureTools from './ensure-tools.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/**
 * Verify a required file exists at the specified path.
 * @param {string} relPath - Relative path from repository root.
 * @param {string} label - Human-readable label for error messages.
 * @returns {string} Absolute path to the file.
 * @throws {Error} When the file does not exist.
 */
function requireFile(relPath, label) {
	const p = path.join(repoRoot, relPath);
	if (!fs.existsSync(p)) {
		throw new Error(`${label} missing at ${p}`);
	}
	return p;
}

/**
 * Main entry point. Validates all governance files and tools.
 * Sets process.exitCode = 1 if any check fails.
 * @returns {void}
 */
function main() {
	try {
		requireFile('AGENTS.md', 'AGENTS.md');
		requireFile('brainwav/governance/90-infra/governance-index.json', 'governance-index.json');
		requireFile('brainwav/governance/00-core/AGENT_CHARTER.md', 'AGENT_CHARTER.md');
		requireFile('brainwav/governance/10-flow/agentic-coding-workflow.md', 'agentic-coding-workflow.md');
		requireFile('brainwav/governance/20-checklists/checklists.md', 'checklists.md');
		ensureTools();
		console.log('[brAInwav] readiness:check passed. Governance files present and tools verified.');
	} catch (error) {
		console.error(`[brAInwav] readiness:check failed: ${error.message}`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('readiness-check.mjs')) {
	main();
}

export default main;
