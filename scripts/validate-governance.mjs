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
import { formatPointerHint, resolveGovernancePaths } from './governance-paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const { govRoot, indexPath, pointerPath, packageRoot, configPath } = resolveGovernancePaths(repoRoot);
const CONFIG_SCHEMA_RELATIVE_PATH = path.join('brainwav', 'governance', '90-infra', 'agentic-config.schema.json');
const ALLOWED_PROFILES = new Set(['creative', 'delivery', 'release', 'core', 'full']);
const LEGACY_PROFILES = new Set(['core', 'full']);

function read(file) {
	return fs.readFileSync(file, 'utf8');
}

const ROOT_DOCS = new Set(['README.md', 'CODESTYLE.md', 'SECURITY.md']);

function resolvePath(rel) {
	const rootPath = path.join(repoRoot, rel);
	if (ROOT_DOCS.has(rel) && fs.existsSync(rootPath)) return rootPath;
	const govPath = path.join(govRoot, rel);
	if (fs.existsSync(govPath)) return govPath;
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

function readConfig() {
	if (!configPath || !fs.existsSync(configPath)) return null;
	try {
		return JSON.parse(read(configPath));
	} catch (error) {
		return { __parseError: error };
	}
}

function checkConfig() {
	const failures = [];
	const config = readConfig();
	if (!config) return failures;
	if (config.__parseError) {
		failures.push(`config parse error in ${configPath}: ${config.__parseError.message}`);
		return failures;
	}
	if (config.profile && !ALLOWED_PROFILES.has(config.profile)) {
		failures.push(`config profile must be one of ${Array.from(ALLOWED_PROFILES).join(', ')}`);
	}
	if (config.profile && LEGACY_PROFILES.has(config.profile)) {
		console.warn(
			`[brAInwav] config profile "${config.profile}" is legacy; use "delivery" or "release" going forward.`
		);
	}
	if ('overlays' in config && !Array.isArray(config.overlays)) {
		failures.push('config overlays must be an array when provided');
		return failures;
	}
	if (!Array.isArray(config.overlays)) return failures;
	config.overlays.forEach((overlay, index) => {
		if (!overlay || typeof overlay !== 'object') {
			failures.push(`overlay[${index}] must be an object`);
			return;
		}
		if (!overlay.name) failures.push(`overlay[${index}] missing name`);
		if (!Array.isArray(overlay.paths) || overlay.paths.length === 0) {
			failures.push(`overlay[${index}] paths must be a non-empty array`);
			return;
		}
		const allowWeaken = overlay.allowWeaken === true;
		if (allowWeaken) {
			failures.push(`overlay[${index}] allowWeaken must remain false (weakening is not permitted)`);
		}
		overlay.paths.forEach((overlayPath) => {
			if (typeof overlayPath !== 'string') {
				failures.push(`overlay[${index}] path must be a string`);
				return;
			}
			const normalized = overlayPath.replace(/^\/*/, '');
			const target = path.join(repoRoot, normalized);
			if (!fs.existsSync(target)) {
				failures.push(`overlay[${index}] path not found: ${overlayPath}`);
				return;
			}
			const relativeTarget = path.relative(repoRoot, target).replace(/\\/g, '/');
			const normalizedTarget = relativeTarget.startsWith('.') ? relativeTarget : `./${relativeTarget}`;
			const governanceRoot = govRoot;
			if (target.startsWith(governanceRoot)) {
				failures.push(`overlay[${index}] must not target governance pack files: ${overlayPath}`);
				return;
			}
			const isAllowed = normalized.endsWith('.local.md') || normalized.includes('.agentic-governance/overlays/');
			if (!isAllowed) {
				failures.push(`overlay[${index}] path must be .local.md or under .agentic-governance/overlays/ (got ${overlayPath})`);
				return;
			}
			if (!fs.statSync(target).isFile()) {
				failures.push(`overlay[${index}] path must be a file: ${overlayPath}`);
				return;
			}
			if (normalizedTarget.includes('..')) {
				failures.push(`overlay[${index}] path must not traverse directories: ${overlayPath}`);
			}
		});
	});
	const schemaTarget = path.join(govRoot, '90-infra', 'agentic-config.schema.json');
	if (!fs.existsSync(schemaTarget)) {
		failures.push(`config schema missing at ${CONFIG_SCHEMA_RELATIVE_PATH}`);
	}
	return failures;
}

function main() {
	const failures = [...checkTokens(), ...checkTasks(), ...checkConfig()];
	if (failures.length) {
		console.error('[brAInwav] validate-governance FAILED:');
		failures.forEach((f) => console.error(` - ${f}`));
		process.exitCode = 1;
		return;
	}
	console.log('[brAInwav] validate-governance OK');
	const hint = formatPointerHint(pointerPath, packageRoot);
	if (hint) console.log(`[brAInwav] ${hint}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-governance.mjs')) {
	main();
}

export default main;
