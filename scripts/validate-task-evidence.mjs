#!/usr/bin/env node
/**
 * @fileoverview Validate task folders for Evidence Triplet + memory/trace parity.
 * Checks for non-empty milestone test log, contract snapshot, reviewer pointer,
 * memory IDs, trace context, and academic research logs.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/**
 * Check whether a path exists and is non-empty.
 * @param {string} p - Path to check.
 * @returns {boolean} True if file exists and has content.
 */
function existsNonEmpty(p) {
	return fs.existsSync(p) && fs.statSync(p).size > 0;
}

/**
 * Validate evidence files for a task.
 * @param {string} taskRoot - Task directory.
 * @param {string} slug - Task slug.
 * @param {string} repoRootPath - Repository root.
 * @param {string} changeClassPath - Change class registry path.
 * @returns {string[]} Failure messages.
 */
function validateTask(taskRoot, slug, repoRootPath, changeClassPath) {
	const failures = [];
	const manifestPath = path.join(taskRoot, 'json', 'run-manifest.json');
	if (!fs.existsSync(manifestPath)) {
		failures.push(`${slug}: missing json/run-manifest.json`);
		return failures;
	}
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
	const triplet = manifest.evidence_triplet || {};
	const milestone = path.join(repoRootPath, triplet.milestone_test || '');
	const contract = path.join(repoRootPath, triplet.contract_snapshot || '');
	const reviewer = path.join(repoRootPath, triplet.reviewer_pointer || '');

	if (!existsNonEmpty(milestone)) failures.push(`${slug}: milestone test log missing/empty (${milestone})`);
	if (!existsNonEmpty(contract)) failures.push(`${slug}: contract snapshot missing/empty (${contract})`);
	if (!existsNonEmpty(reviewer)) failures.push(`${slug}: reviewer pointer missing/empty (${reviewer})`);

	const changeClasses = Array.isArray(manifest.change_classes)
		? manifest.change_classes
		: manifest.change_class
			? [manifest.change_class]
			: [];
	if (changeClasses.length > 0 && fs.existsSync(changeClassPath)) {
		const registry = JSON.parse(fs.readFileSync(changeClassPath, 'utf8'));
		const required = new Set();
		changeClasses.forEach((value) => {
			const entry = registry.classes?.[value];
			(entry?.required_evidence || []).forEach((item) => required.add(item));
		});
		Array.from(required).forEach((relPath) => {
			const target = path.join(taskRoot, relPath);
			if (!existsNonEmpty(target)) {
				failures.push(`${slug}: missing change-class evidence (${relPath})`);
			}
		});
	}

	const memoryIds = path.join(taskRoot, 'json', 'memory-ids.json');
	if (!existsNonEmpty(memoryIds)) failures.push(`${slug}: memory-ids.json missing/empty`);

	const trace = path.join(taskRoot, 'verification', 'trace-context.log');
	if (fs.existsSync(path.dirname(trace)) && !existsNonEmpty(trace)) {
		failures.push(`${slug}: trace-context.log missing/empty`);
	}

	const acadFindings = path.join(taskRoot, 'logs', 'academic-research', 'findings.json');
	const licenseValidation = path.join(taskRoot, 'logs', 'academic-research', 'license-validation.json');
	if (!existsNonEmpty(acadFindings)) failures.push(`${slug}: academic findings missing/empty`);
	if (!existsNonEmpty(licenseValidation)) failures.push(`${slug}: license validation missing/empty`);

	return failures;
}

/**
 * Ensure a task slug is a simple, safe directory name.
 * Disallows path traversal components and path separators.
 * @param {string} slug - Task slug.
 * @returns {boolean} True when slug is safe.
 */
function isSafeSlug(slug) {
	if (typeof slug !== 'string') return false;
	if (slug === '.' || slug === '..') return false;
	// Disallow any path separators or traversal sequences.
	if (slug.includes('/') || slug.includes('\\')) return false;
	if (slug.includes(path.sep)) return false;
	if (slug.includes('..')) return false;
	return true;
}

/**
 * Run evidence validation across tasks.
 * @param {string} targetRoot - Repository root.
 * @returns {{ok: boolean, failures: string[], skipped: boolean}} Result summary.
 */
export function runTaskEvidenceValidation(targetRoot = repoRoot) {
	const tasksRoot = path.join(targetRoot, 'tasks');
	const changeClassPath = path.join(
		targetRoot,
		'brainwav',
		'governance',
		'90-infra',
		'change-classes.json'
	);
	if (!fs.existsSync(tasksRoot)) {
		return { ok: true, failures: [], skipped: true };
	}
	const slugs = fs
		.readdirSync(tasksRoot, { withFileTypes: true })
		.filter(
			(dirent) =>
				dirent.isDirectory() &&
				!dirent.isSymbolicLink() &&
				isSafeSlug(dirent.name)
		)
		.map((dirent) => dirent.name);
	const failures = slugs.flatMap((slug) =>
		validateTask(path.join(tasksRoot, slug), slug, targetRoot, changeClassPath)
	);
	return { ok: failures.length === 0, failures, skipped: false };
}

/**
 * CLI entry point for evidence validation.
 * @returns {void} No return value.
 */
function main() {
	const result = runTaskEvidenceValidation(repoRoot);
	if (result.skipped) {
		console.log('[brAInwav] No tasks directory; skipping evidence validation.');
		return;
	}
	if (!result.ok) {
		console.error('[brAInwav] validate-task-evidence FAILED:');
		result.failures.forEach((f) => console.error(` - ${f}`));
		process.exitCode = 1;
		return;
	}
	console.log('[brAInwav] validate-task-evidence OK');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export default main;
