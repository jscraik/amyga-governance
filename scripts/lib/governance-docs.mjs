#!/usr/bin/env node
/**
 * @fileoverview Governance document resolution helpers.
 * @license Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DOCS = new Set(['README.md', 'CODESTYLE.md', 'SECURITY.md']);

/**
 * Resolve a governance document path from either repo root or governance root.
 * @param {string} rootPath - Repository root.
 * @param {string} govRoot - Governance root.
 * @param {string} docPath - Relative document path.
 * @returns {string|null} Resolved path or null when missing.
 */
export function resolveGovernanceDocPath(rootPath, govRoot, docPath) {
	const rootDocPath = path.join(rootPath, docPath);
	if (ROOT_DOCS.has(docPath) && fs.existsSync(rootDocPath)) return rootDocPath;
	const govPath = path.join(govRoot, docPath);
	if (fs.existsSync(govPath)) return govPath;
	if (fs.existsSync(rootDocPath)) return rootDocPath;
	return null;
}
