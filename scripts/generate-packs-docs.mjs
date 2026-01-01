#!/usr/bin/env node
/**
 * @fileoverview Generate docs/packs.md from governance pack manifests.
 * @license Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPackManifest } from './pack-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const packsRoot = path.join(repoRoot, 'brainwav', 'governance-pack', 'packs');
const outputPath = path.join(repoRoot, 'docs', 'packs.md');

/**
 * Find pack IDs from the packs root (directory + *.pack.yaml).
 * @returns {string[]} Sorted pack IDs.
 */
function listPackIds() {
	const entries = fs.readdirSync(packsRoot, { withFileTypes: true });
	const ids = new Set();
	entries.forEach((entry) => {
		if (entry.isDirectory()) {
			ids.add(entry.name);
			return;
		}
		if (entry.isFile() && entry.name.endsWith('.pack.yaml')) {
			ids.add(entry.name.replace('.pack.yaml', ''));
		}
	});
	return Array.from(ids).sort((a, b) => a.localeCompare(b));
}

/**
 * Check which pack docs are present.
 * @param {string} packId - Pack identifier.
 * @returns {string} Human-readable doc presence list.
 */
function describePackDocs(packId) {
	const packDir = path.join(packsRoot, packId);
	const docs = [];
	if (fs.existsSync(path.join(packDir, 'AGENTS.pack.md'))) {
		docs.push('AGENTS.pack.md');
	}
	if (fs.existsSync(path.join(packDir, 'CODESTYLE.pack.md'))) {
		docs.push('CODESTYLE.pack.md');
	}
	return docs.length > 0 ? docs.join(', ') : '-';
}

/**
 * Format a list for table cells.
 * @param {string[]|undefined|null} values - Value list.
 * @returns {string} Formatted value or "-".
 */
function formatList(values) {
	if (!Array.isArray(values) || values.length === 0) return '-';
	const normalized = values
		.map((value) => {
			if (typeof value === 'string') return value;
			if (value && typeof value === 'object') {
				return value.id || value.name || '-';
			}
			return '-';
		})
		.filter((value) => value && value !== '-');
	return normalized.length > 0 ? normalized.join(', ') : '-';
}

/**
 * Build the markdown table rows for each pack.
 * @param {string[]} packIds - Pack identifiers.
 * @returns {string[]} Markdown row strings.
 */
function buildRows(packIds) {
	return packIds.map((packId) => {
		const manifest = loadPackManifest(packId);
		if (!manifest) {
			return `| ${packId} | - | - | - | - | - | - |`;
		}
		const runner = manifest.ci?.runner ?? 'ubuntu-latest';
		const dependsOn = formatList(manifest.depends_on);
		const validateChecks = formatList(manifest.checks?.validate);
		const doctorChecks = formatList(manifest.checks?.doctor);
		const docs = describePackDocs(packId);
		const description = manifest.description || '-';
		return `| ${packId} | ${description} | ${dependsOn} | ${runner} | ${docs} | ${validateChecks} | ${doctorChecks} |`;
	});
}

/**
 * Generate the docs/packs.md content.
 * @returns {string} Markdown content.
 */
function generateMarkdown() {
	const packIds = listPackIds();
	const rows = buildRows(packIds);
	return [
		'# Packs',
		'',
		'This catalog is generated from `brainwav/governance-pack/packs` manifests.',
		'If `AGENTS.pack.md` or `CODESTYLE.pack.md` is absent, the corresponding section',
		'is synthesized from the manifest during install/upgrade.',
		'',
		'| Pack ID | Description | Depends on | Runner | Pack docs | Validate checks | Doctor checks |',
		'| --- | --- | --- | --- | --- | --- | --- |',
		...rows,
		''
	].join('\n');
}

/**
 * Write the pack docs file.
 */
function writePackDocs() {
	const content = generateMarkdown();
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, content, 'utf8');
}

writePackDocs();
