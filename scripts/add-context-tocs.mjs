#!/usr/bin/env node
/**
 * @fileoverview Add Table of Contents to markdown files under brainwav/governance/context
 * that exceed 400 words and are missing a TOC heading.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const contextRoot = path.join(repoRoot, 'brainwav', 'governance', 'context');

/**
 * Recursively list markdown files under a directory.
 * @param {string} dir - Directory to scan.
 * @returns {string[]} Markdown file paths.
 */
function listMarkdownFiles(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...listMarkdownFiles(full));
		else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
	}
	return files;
}

/**
 * Determine whether content already includes a TOC.
 * @param {string} content - Markdown content.
 * @returns {boolean} True when a TOC heading exists.
 */
function hasToc(content) {
	return /^## (Table of Contents|Contents|Quick Navigation)/m.test(content);
}

/**
 * Count words in a string.
 * @param {string} content - Text content.
 * @returns {number} Word count.
 */
function wordCount(content) {
	return content.split(/\s+/).filter(Boolean).length;
}

/**
 * Slugify a heading for markdown anchors.
 * @param {string} text - Heading text.
 * @returns {string} Slugified anchor.
 */
function slugify(text) {
	return text
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

/**
 * Build a markdown TOC for headings.
 * @param {{level: number, title: string}[]} headings - Heading metadata.
 * @returns {string} TOC markdown.
 */
function buildToc(headings) {
	const lines = ['## Table of Contents', ''];
	headings.forEach(({ level, title }) => {
		if (level < 2) return; // skip H1
		const anchor = slugify(title);
		const prefix = level === 2 ? '- ' : '  '.repeat(level - 2) + '- ';
		lines.push(`${prefix}[${title}](#${anchor})`);
	});
	lines.push('');
	return lines.join('\n');
}

/**
 * Insert TOC into markdown content.
 * @param {string} content - Markdown content.
 * @param {string} toc - TOC markdown.
 * @returns {string} Updated markdown content.
 */
function insertToc(content, toc) {
	// If frontmatter present, insert after it; else after first blank line following H1.
	if (content.startsWith('---')) {
		const end = content.indexOf('\n---', 3);
		if (end !== -1) {
			const pos = end + '\n---'.length + 1;
			return content.slice(0, pos) + '\n\n' + toc + '\n' + content.slice(pos);
		}
	}
	const h1Match = content.match(/^# .+$/m);
	if (h1Match) {
		const h1End = content.indexOf('\n', h1Match.index);
		const after = content.indexOf('\n\n', h1End);
		const insertPos = after !== -1 ? after + 2 : h1End + 1;
		return content.slice(0, insertPos) + '\n' + toc + '\n' + content.slice(insertPos);
	}
	// fallback: prepend
	return toc + '\n' + content;
}

/**
 * Add TOCs to markdown context documents missing them.
 * @returns {void} No return value.
 */
function main() {
	const files = listMarkdownFiles(contextRoot);
	let updated = 0;
	for (const file of files) {
		const content = fs.readFileSync(file, 'utf8');
		if (wordCount(content) <= 400) continue;
		if (hasToc(content)) continue;
		const headings = Array.from(content.matchAll(/^(#{1,6})\s+(.+)$/gm)).map((m) => ({
			level: m[1].length,
			title: m[2].trim()
		}));
		if (!headings.length) continue;
		const toc = buildToc(headings);
		const updatedContent = insertToc(content, toc);
		fs.writeFileSync(file, updatedContent);
		updated++;
		console.log(`[brAInwav] TOC added: ${file}`);
	}
	console.log(`[brAInwav] Completed. TOCs added: ${updated}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('add-context-tocs.mjs')) {
	main();
}

export default main;
