#!/usr/bin/env node
/**
 * @fileoverview Validate governance tokens and basic task constraints.
 * - Verifies required tokens from governance-index.json are present in referenced docs.
 * - If tasks exist, checks run-manifest arcs length (Step Budget ≤7).
 * @license Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const govRoot = path.join(repoRoot, 'brainwav', 'governance');
const indexPath = path.join(govRoot, '90-infra', 'governance-index.json');

function read(file) {
	return fs.readFileSync(file, 'utf8');
}

function resolvePath(rel) {
	const govPath = path.join(govRoot, rel);
	if (fs.existsSync(govPath)) return govPath;
	const rootPath = path.join(repoRoot, rel);
	if (fs.existsSync(rootPath)) return rootPath;
	return null;
}

function checkTokens() {
	const index = JSON.parse(read(indexPath));
	const failures = [];
	Object.entries(index.docs).forEach(([key, entry]) => {
		if (!entry.required_tokens) return;
		const target = resolvePath(entry.path);
		if (!target) {
			failures.push(`missing doc for ${key} at ${entry.path}`);
			return;
		}
		const content = read(target);
		entry.required_tokens.forEach((token) => {
			if (!content.includes(token)) {
				failures.push(`token "${token}" missing in ${entry.path}`);
			}
		});
	});
	return failures;
}

function checkTasks() {
	const tasksDir = path.join(repoRoot, 'tasks');
	if (!fs.existsSync(tasksDir)) return [];
	const failures = [];
	const tasks = fs.readdirSync(tasksDir);
	tasks.forEach((slug) => {
		const manifestPath = path.join(tasksDir, slug, 'json', 'run-manifest.json');
		if (!fs.existsSync(manifestPath)) return;
		const manifest = JSON.parse(read(manifestPath));
		const arcs = manifest.arcs || [];
		if (arcs.length > 7) {
			failures.push(`task ${slug}: arcs length ${arcs.length} exceeds Step Budget ≤7`);
		}
	});
	return failures;
}

function main() {
	const failures = [...checkTokens(), ...checkTasks()];
	if (failures.length) {
		console.error('[brAInwav] validate-governance FAILED:');
		failures.forEach((f) => console.error(` - ${f}`));
		process.exitCode = 1;
		return;
	}
	console.log('[brAInwav] validate-governance OK');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-governance.mjs')) {
	main();
}

export default main;
