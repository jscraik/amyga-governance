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

function existsNonEmpty(p) {
	return fs.existsSync(p) && fs.statSync(p).size > 0;
}

function validateTask(taskRoot, slug) {
	const failures = [];
	const manifestPath = path.join(taskRoot, 'json', 'run-manifest.json');
	if (!fs.existsSync(manifestPath)) {
		failures.push(`${slug}: missing json/run-manifest.json`);
		return failures;
	}
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
	const triplet = manifest.evidence_triplet || {};
	const milestone = path.join(repoRoot, triplet.milestone_test || '');
	const contract = path.join(repoRoot, triplet.contract_snapshot || '');
	const reviewer = path.join(repoRoot, triplet.reviewer_pointer || '');

	if (!existsNonEmpty(milestone)) failures.push(`${slug}: milestone test log missing/empty (${milestone})`);
	if (!existsNonEmpty(contract)) failures.push(`${slug}: contract snapshot missing/empty (${contract})`);
	if (!existsNonEmpty(reviewer)) failures.push(`${slug}: reviewer pointer missing/empty (${reviewer})`);

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

function main() {
	const tasksRoot = path.join(repoRoot, 'tasks');
	if (!fs.existsSync(tasksRoot)) {
		console.log('[brAInwav] No tasks directory; skipping evidence validation.');
		return;
	}
	const slugs = fs.readdirSync(tasksRoot);
	const failures = slugs.flatMap((slug) =>
		validateTask(path.join(tasksRoot, slug), slug)
	);
	if (failures.length) {
		console.error('[brAInwav] validate-task-evidence FAILED:');
		failures.forEach((f) => console.error(` - ${f}`));
		process.exitCode = 1;
		return;
	}
	console.log('[brAInwav] validate-task-evidence OK');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-task-evidence.mjs')) {
	main();
}

export default main;
