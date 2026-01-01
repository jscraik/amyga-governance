#!/usr/bin/env node
/**
 * @fileoverview List governance docs with summaries/read-when hints.
 * @license Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const docsRoot = path.join(repoRoot, 'brainwav', 'governance', 'docs');
const REQUIRED_FIELDS = ['summary', 'read_when', 'applies_to', 'owner'];

function readFile(filePath) {
	return fs.readFileSync(filePath, 'utf8');
}

function extractFrontmatter(content) {
	if (!content.startsWith('---')) return null;
	const endIndex = content.indexOf('\n---', 3);
	if (endIndex === -1) return null;
	const raw = content.slice(3, endIndex).trim();
	if (!raw) return {};
	const data = {};
	raw.split('\n').forEach((line) => {
		const match = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
		if (!match) return;
		data[match[1]] = match[2].replace(/^"|"$/g, '');
	});
	return data;
}

function extractSummary(content) {
	const lines = content.split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		if (trimmed.startsWith('#')) continue;
		if (trimmed.startsWith('>')) {
			return trimmed.replace(/^>\s?/, '');
		}
		return trimmed;
	}
	return 'No summary available.';
}

function walkDocs(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkDocs(fullPath));
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			files.push(fullPath);
		}
	}
	return files;
}

function listDocs() {
	if (!fs.existsSync(docsRoot)) {
		console.error(`[brAInwav] docs folder not found: ${docsRoot}`);
		process.exitCode = 1;
		return;
	}
	const entries = walkDocs(docsRoot)
		.map((filePath) => path.relative(docsRoot, filePath))
		.sort();

	console.log('[brAInwav] Governance docs index:');
	const missing = [];
	entries.forEach((name) => {
		const filePath = path.join(docsRoot, name);
		const content = readFile(filePath);
		const frontmatter = extractFrontmatter(content);
		if (!frontmatter) {
			missing.push(`${name}: missing frontmatter`);
		} else {
			REQUIRED_FIELDS.forEach((field) => {
				if (!frontmatter[field]) missing.push(`${name}: missing ${field}`);
			});
		}
		const summary = frontmatter?.summary || extractSummary(content);
		const readWhen = frontmatter?.read_when || frontmatter?.readWhen || 'General reference';
		console.log(`- ${name} | ${summary} | read when: ${readWhen}`);
	});
	if (missing.length) {
		console.error('[brAInwav] docs metadata validation failed:');
		missing.forEach((entry) => console.error(` - ${entry}`));
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	listDocs();
}

export default listDocs;
