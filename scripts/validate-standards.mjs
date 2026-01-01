#!/usr/bin/env node
/**
 * @fileoverview Validate standards references and freshness windows.
 * @license Apache-2.0
 *
 * Checks:
 * - standards.versions.json "as_of" not older than max age.
 * - All reference URLs resolve (fail on 404/410 by default).
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const standardsPath = path.join(repoRoot, 'brainwav', 'governance', '90-infra', 'standards.versions.json');

const MAX_AGE_DAYS = Number.parseInt(process.env.STANDARDS_MAX_AGE_DAYS || '90', 10);
const STRICT_LINKS = process.env.STANDARDS_STRICT_LINKS === 'true';
const CONCURRENCY = Number.parseInt(process.env.STANDARDS_LINK_CONCURRENCY || '6', 10);

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function daysBetween(a, b) {
	const ms = Math.abs(b.getTime() - a.getTime());
	return Math.floor(ms / (1000 * 60 * 60 * 24));
}

async function fetchStatus(url) {
	try {
		const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
		if (res.status === 405) {
			const fallback = await fetch(url, { method: 'GET', redirect: 'follow' });
			return fallback.status;
		}
		return res.status;
	} catch (error) {
		return { error };
	}
}

async function runQueue(items, worker, concurrency) {
	const results = [];
	let index = 0;
	const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
		while (index < items.length) {
			const current = items[index++];
			results.push(await worker(current));
		}
	});
	await Promise.all(runners);
	return results;
}

async function main() {
	if (!fs.existsSync(standardsPath)) {
		console.error(`[brAInwav] standards.versions.json not found at ${standardsPath}`);
		process.exitCode = 1;
		return;
	}
	const data = readJson(standardsPath);
	const asOf = new Date(data.as_of);
	if (Number.isNaN(asOf.getTime())) {
		console.error('[brAInwav] standards.versions.json missing valid as_of date');
		process.exitCode = 1;
		return;
	}
	const ageDays = daysBetween(asOf, new Date());
	if (ageDays > MAX_AGE_DAYS) {
		console.error(
			`[brAInwav] standards.versions.json is stale by ${ageDays} days (max ${MAX_AGE_DAYS}). Update as_of.`
		);
		process.exitCode = 1;
	}

	const urls = new Set();
	Object.values(data.standards || {}).forEach((entry) => {
		(entry.references || []).forEach((url) => urls.add(url));
	});

	const failures = [];
	const warnings = [];
	await runQueue(
		Array.from(urls),
		async (url) => {
			const status = await fetchStatus(url);
			if (typeof status === 'object' && status?.error) {
				warnings.push(`${url} error: ${status.error.message}`);
				return;
			}
			if (status >= 400) {
				const message = `${url} returned HTTP ${status}`;
				if (status === 404 || status === 410 || STRICT_LINKS) {
					failures.push(message);
				} else {
					warnings.push(message);
				}
			}
		},
		CONCURRENCY
	);

	if (warnings.length) {
		console.warn('[brAInwav] standards link warnings:');
		warnings.forEach((entry) => console.warn(` - ${entry}`));
	}
	if (failures.length) {
		console.error('[brAInwav] standards link failures:');
		failures.forEach((entry) => console.error(` - ${entry}`));
		process.exitCode = 1;
		return;
	}
	console.log('[brAInwav] standards validation OK');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export default main;
