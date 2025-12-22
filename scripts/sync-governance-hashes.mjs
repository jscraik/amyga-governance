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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const govRoot = path.join(repoRoot, 'brainwav', 'governance');
const indexPath = path.join(govRoot, '90-infra', 'governance-index.json');

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
 * Compute SHA-256 hash of a fragment within a file.
 * @param {string} filePath - Absolute path to the file.
 * @param {string} startMarker - The marker indicating fragment start.
 * @param {string} endMarker - The marker indicating fragment end.
 * @returns {string|null} Hexadecimal SHA-256 digest, or null if markers not found.
 */
function fragmentSha256(filePath, startMarker, endMarker) {
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
 * @returns {string|null} Absolute path if file exists, null otherwise.
 */
function resolvePath(docPath) {
	// docs under brainwav/governance/
	const govPath = path.join(govRoot, docPath);
	if (fs.existsSync(govPath)) return govPath;
	// docs at repo root (README.md, CODESTYLE.md, SECURITY.md)
	const rootPath = path.join(repoRoot, docPath);
	if (fs.existsSync(rootPath)) return rootPath;
	return null;
}

/**
 * Main entry point. Updates all hashes in governance-index.json.
 * @returns {void}
 */
function main() {
	const checkMode = process.argv.includes('--check');
	const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
	let updated = 0;
	const changes = [];

	for (const [key, entry] of Object.entries(index.docs)) {
		const filePath = resolvePath(entry.path);
		if (!filePath) {
			console.warn(`[brAInwav] SKIP ${key}: file not found at ${entry.path}`);
			continue;
		}

		let hash;
		if (entry.fragment_markers) {
			hash = fragmentSha256(filePath, entry.fragment_markers[0], entry.fragment_markers[1]);
			if (!hash) {
				console.warn(`[brAInwav] SKIP ${key}: fragment markers not found`);
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

	if (checkMode) {
		if (updated > 0) {
			console.error(
				`[brAInwav] sync-governance-hashes --check failed: ${updated} entries drifted.\n` +
					changes
						.map((c) => ` - ${c.key}: ${c.from.slice(0, 8)}… -> ${c.to.slice(0, 8)}…`)
						.join('\n')
			);
			process.exitCode = 1;
			return;
		}
		console.log('[brAInwav] sync-governance-hashes --check passed (no drift).');
		return;
	}

	index.updated = new Date().toISOString().split('T')[0];
	fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 4)}\n`);
	if (updated === 0) {
		console.log('[brAInwav] sync-governance-hashes: no updates needed.');
	} else {
		changes.forEach((c) =>
			console.log(
				`[brAInwav] UPDATE ${c.key}: ${c.from.slice(0, 8)}… → ${c.to.slice(0, 8)}…`
			)
		);
		console.log(`[brAInwav] sync-governance-hashes: ${updated} entries updated.`);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export default main;
