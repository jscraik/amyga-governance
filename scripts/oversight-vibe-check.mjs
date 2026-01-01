#!/usr/bin/env node
/**
 * @fileoverview Lightweight HTTP wrapper to call Cortex Aegis vibe_check endpoint.
 * @module scripts/oversight-vibe-check
 * @license Apache-2.0
 *
 * Sends a vibe check request to the Cortex Aegis oversight server and saves
 * the response to the appropriate task or global logs directory.
 *
 * @example
 * // Run via npm script
 * pnpm oversight:vibe-check --goal "implement auth" --plan "1. Add routes 2. Add tests"
 *
 * @example
 * // Run with task slug
 * pnpm oversight:vibe-check --goal "fix bug" --plan "steps" --slug "fix-auth-bug"
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/**
 * Parse command-line arguments into a key-value object.
 * Supports --key=value and --key value formats.
 * @param {string[]} argv - The process.argv array.
 * @returns {Record<string, string>} Parsed arguments.
 */
function parseArgs(argv) {
	const args = {};
	for (let i = 2; i < argv.length; i++) {
		const part = argv[i];
		if (part.startsWith('--')) {
			const [key, val] = part.replace(/^--/, '').split('=');
			args[key] = val ?? argv[i + 1];
			if (!part.includes('=') && argv[i + 1] && !argv[i + 1].startsWith('--')) i++;
		}
	}
	return args;
}

/**
 * Build the vibe check payload from args and environment.
 * @param {Record<string, string>} args - Parsed CLI arguments.
 * @returns {{goal: string, plan: string, session: string, slug: string|null}|null} Payload or null if required fields missing.
 */
function buildPayload(args) {
	const goal = args.goal ?? process.env.GOAL;
	const plan = args.plan ?? process.env.PLAN;
	const session = args.session ?? process.env.SESSION ?? cryptoRandom();
	const slug = args.slug ?? process.env.TASK_SLUG;

	if (!goal || !plan) {
		console.error('[brAInwav] Missing required --goal and --plan');
		process.exitCode = 1;
		return null;
	}

	return { goal, plan, session, slug: slug || null };
}

/**
 * Generate a random session ID.
 * @returns {string} A random session identifier.
 */
function cryptoRandom() {
	return `session-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

/**
 * Call the Cortex Aegis vibe_check HTTP endpoint.
 * @param {string} url - The endpoint URL.
 * @param {object} payload - The request payload.
 * @returns {Promise<object>} The JSON response from the server.
 * @throws {Error} When the HTTP request fails.
 */
async function callVibeCheck(url, payload) {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`HTTP ${res.status}: ${text}`);
	}
	return res.json();
}

/**
 * Determine the output path for vibe check results.
 * @param {string|undefined} slug - Optional task slug for task-specific logs.
 * @returns {string} Absolute path to the output JSON file.
 */
function outputPath(slug) {
	const base = slug
		? path.join(repoRoot, 'tasks', slug, 'logs', 'vibe-check')
		: path.join(repoRoot, '.agentic-governance', 'logs', 'vibe-check');
	fs.mkdirSync(base, { recursive: true });
	return path.join(base, 'vibe-check.json');
}

/**
 * Main entry point. Parses args, calls vibe check, and saves results.
 * Sets process.exitCode = 1 on failure.
 * @returns {Promise<void>}
 */
async function main() {
	const args = parseArgs(process.argv);
	const payload = buildPayload(args);
	if (!payload) return;

	const url = process.env.CORTEX_AEGIS_HTTP_URL || 'http://127.0.0.1:2091/vibe_check';
	console.log(`[brAInwav] oversight:vibe-check -> ${url}`);

	try {
		const result = await callVibeCheck(url, payload);
		const outFile = outputPath(payload.slug || undefined);
		fs.writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`);
		console.log(`[brAInwav] vibe-check saved to ${outFile}`);
		console.log(JSON.stringify(result, null, 2));
	} catch (error) {
		console.error(`[brAInwav] vibe-check failed: ${error.message}`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('oversight-vibe-check.mjs')) {
	main();
}

export default main;
