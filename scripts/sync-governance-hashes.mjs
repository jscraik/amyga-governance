#!/usr/bin/env node
/**
 * @fileoverview Recalculate and update SHA-256 hashes in governance-index.json.
 * @module scripts/sync-governance-hashes
 * @license Apache-2.0
 *
 * This script walks through all documents registered in governance-index.json,
 * computes their current SHA-256 hashes, and updates any stale entries.
 * For documents with fragment markers, only the fragment content is hashed.
 *
 * @example
 * // Update hashes in place
 * pnpm governance:sync-hashes
 *
 * @example
 * // Verify hashes without writing (fails on drift)
 * pnpm governance:sync-hashes --check
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatPointerHint, resolveGovernancePaths } from './governance-paths.mjs';
import { formatJson } from './lib/json-format.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/**
 * Compute SHA-256 hash of a file.
 * @param {string} filePath - Absolute path to the file.
 * @returns {string} Hexadecimal SHA-256 digest.
 */
function sha256(filePath) {
	const data = fs.readFileSync(filePath);
	return createHash('sha256').update(data).digest('hex');
}

/**
 * Compute SHA-256 hash of a string.
 * @param {string} value - Content to hash.
 * @returns {string} Hexadecimal SHA-256 digest.
 */
function sha256String(value) {
	return createHash('sha256').update(value).digest('hex');
}

/**
 * Compute SHA-256 hash of a fragment within a file.
 * @param {string} filePath - Absolute path to the file.
 * @param {string} startMarker - The marker indicating fragment start.
 * @param {string} endMarker - The marker indicating fragment end.
 * @returns {string|null} Hexadecimal SHA-256 digest, or null if markers not found.
 */
function fragmentSha256(filePath, startMarker, endMarker) {
	if (!startMarker?.trim() || !endMarker?.trim()) return null;
	const content = fs.readFileSync(filePath, 'utf8');
	const startIdx = content.indexOf(startMarker);
	const endIdx = content.indexOf(endMarker);
	if (startIdx === -1 || endIdx === -1) return null;
	const fragment = content.slice(startIdx, endIdx + endMarker.length);
	return createHash('sha256').update(fragment).digest('hex');
}

/**
 * Resolve a document path to its absolute filesystem location.
 * Checks both governance directory and repository root.
 * @param {string} docPath - Relative path from the governance docs.
 * @param {string} govRoot - Governance root path.
 * @param {string} rootPath - Repository root.
 * @param {string|null} packageRoot - Package root path (pointer mode).
 * @param {string} mode - Install mode.
 * @returns {string|null} Absolute path if file exists, null otherwise.
 */
function resolvePath(docPath, govRoot, rootPath, packageRoot, mode) {
	// docs at package root (pointer mode) should win
	const rootDocPath = path.join(rootPath, docPath);
	if (['README.md', 'CODESTYLE.md', 'SECURITY.md'].includes(docPath)) {
		if (mode === 'pointer' && packageRoot) {
			const packageDocPath = path.join(packageRoot, docPath);
			if (fs.existsSync(packageDocPath)) return packageDocPath;
		}
		if (fs.existsSync(rootDocPath)) return rootDocPath;
	}
	// docs under brainwav/governance/
	const govPath = path.join(govRoot, docPath);
	if (fs.existsSync(govPath)) return govPath;
	if (mode !== 'pointer' && fs.existsSync(rootDocPath)) return rootDocPath;
	return null;
}

/**
 * Update or check governance index hashes.
 * @param {string} targetRoot - Repository root.
 * @param {{checkOnly?: boolean, silent?: boolean}} options - Execution options.
 * @returns {{ok: boolean, changes: Array<object>, hint: string, updated: number, message?: string}} Result summary.
 */
export function runGovernanceHashSync(targetRoot = repoRoot, { checkOnly = false, silent = false } = {}) {
	const { govRoot, indexPath, pointerPath, packageRoot, mode } = resolveGovernancePaths(targetRoot);
	if (mode === 'pointer' && !checkOnly) {
		const hint = formatPointerHint(pointerPath, packageRoot);
		return {
			ok: false,
			changes: [],
			hint,
			message:
				`sync-governance-hashes is read-only in pointer mode. ${hint} ` +
				'Run --check in consumers or update hashes in the source repo.'
		};
	}
	const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
	let updated = 0;
	const changes = [];
	const errors = [];
	const indexKey = Object.entries(index.docs || {}).find(
		([, entry]) => entry.path === '90-infra/governance-index.json'
	)?.[0];

	for (const [key, entry] of Object.entries(index.docs)) {
		if (key === indexKey) {
			continue;
		}
		const filePath = resolvePath(entry.path, govRoot, targetRoot, packageRoot, mode);
		if (!filePath) {
			if (!silent) {
				console.warn(`[brAInwav] SKIP ${key}: file not found at ${entry.path}`);
			}
			continue;
		}

		let hash;
		if (entry.fragment_markers) {
			if (
				!Array.isArray(entry.fragment_markers) ||
				entry.fragment_markers.length < 2 ||
				!entry.fragment_markers[0]?.trim() ||
				!entry.fragment_markers[1]?.trim()
			) {
				errors.push(`[brAInwav] fragment_markers must be non-empty strings for ${key}`);
				continue;
			}
			hash = fragmentSha256(filePath, entry.fragment_markers[0], entry.fragment_markers[1]);
			if (!hash) {
				errors.push(`[brAInwav] invalid fragment markers for ${key}`);
				continue;
			}
		} else {
			hash = sha256(filePath);
		}

		if (entry.sha256 !== hash) {
			changes.push({
				key,
				from: entry.sha256,
				to: hash,
			});
			entry.sha256 = hash;
			updated++;
		}
	}

	if (!checkOnly) {
		index.updated = new Date().toISOString().split('T')[0];
	}

	if (indexKey) {
		const indexClone = JSON.parse(JSON.stringify(index));
		if (indexClone.docs?.[indexKey]) {
			indexClone.docs[indexKey].sha256 = '';
		}
		const indexHash = sha256String(formatJson(indexClone, 2));
		if (index.docs[indexKey].sha256 !== indexHash) {
			changes.push({
				key: indexKey,
				from: index.docs[indexKey].sha256,
				to: indexHash
			});
			index.docs[indexKey].sha256 = indexHash;
			updated++;
		}
	}

	if (errors.length > 0) {
		const hint = formatPointerHint(pointerPath, packageRoot);
		return { ok: false, changes, hint, updated, message: errors.join('; ') };
	}

	if (checkOnly) {
		const hint = formatPointerHint(pointerPath, packageRoot);
		return { ok: updated === 0, changes, hint, updated };
	}

	fs.writeFileSync(indexPath, formatJson(index, 2));
	const hint = formatPointerHint(pointerPath, packageRoot);
	return { ok: true, changes, hint, updated };
}

/**
 * CLI entry point for governance hash sync.
 * @returns {void} No return value.
 */
function main() {
	const checkMode = process.argv.includes('--check');
	const result = runGovernanceHashSync(repoRoot, { checkOnly: checkMode });
	if (!result.ok) {
		if (result.message) {
			console.error(`[brAInwav] ${result.message}`);
		} else if (checkMode) {
			console.error(
				`[brAInwav] sync-governance-hashes --check failed: ${result.updated} entries drifted.\n` +
					result.changes
						.map((c) => ` - ${c.key}: ${c.from.slice(0, 8)}… -> ${c.to.slice(0, 8)}…`)
						.join('\n')
			);
		}
		process.exitCode = 1;
		return;
	}
	if (checkMode) {
		console.log('[brAInwav] sync-governance-hashes --check passed (no drift).');
		if (result.hint) console.log(`[brAInwav] ${result.hint}`);
		return;
	}
	if (result.changes.length === 0) {
		console.log('[brAInwav] sync-governance-hashes: no updates needed.');
	} else {
		result.changes.forEach((c) =>
			console.log(
				`[brAInwav] UPDATE ${c.key}: ${c.from.slice(0, 8)}… → ${c.to.slice(0, 8)}…`
			)
		);
		console.log(`[brAInwav] sync-governance-hashes: ${result.updated} entries updated.`);
	}
	if (result.hint) console.log(`[brAInwav] ${result.hint}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export default main;
