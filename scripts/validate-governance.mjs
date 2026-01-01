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
const CONFIG_SCHEMA_RELATIVE_PATH = path.join('brainwav', 'governance', '90-infra', 'agentic-config.schema.json');
const ALLOWED_PROFILES = new Set(['creative', 'delivery', 'release', 'core', 'full']);
const LEGACY_PROFILES = new Set(['core', 'full']);

/**
 * Read file contents as UTF-8.
 * @param {string} file - File path.
 * @returns {string} File contents.
 */
function read(file) {
	return fs.readFileSync(file, 'utf8');
}

const ROOT_DOCS = new Set(['README.md', 'CODESTYLE.md', 'SECURITY.md']);

/**
 * Resolve a governance doc path to disk.
 * @param {string} rel - Relative doc path.
 * @param {string} govRoot - Governance root.
 * @param {string} rootPath - Repository root.
 * @returns {string|null} Resolved path or null.
 */
function resolvePath(rel, govRoot, rootPath) {
	const rootDocPath = path.join(rootPath, rel);
	if (ROOT_DOCS.has(rel) && fs.existsSync(rootDocPath)) return rootDocPath;
	const govPath = path.join(govRoot, rel);
	if (fs.existsSync(govPath)) return govPath;
	if (fs.existsSync(rootDocPath)) return rootDocPath;
	return null;
}

/**
 * Check required tokens from the governance index.
 * @param {string} indexPath - Governance index path.
 * @param {string} govRoot - Governance root.
 * @param {string} rootPath - Repository root.
 * @returns {string[]} Failure messages.
 */
function checkTokens(indexPath, govRoot, rootPath) {
	const index = JSON.parse(read(indexPath));
	const failures = [];
	Object.entries(index.docs).forEach(([key, entry]) => {
		if (!entry.required_tokens) return;
		const target = resolvePath(entry.path, govRoot, rootPath);
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

/**
 * Check task manifests for Step Budget compliance.
 * @param {string} rootPath - Repository root.
 * @returns {string[]} Failure messages.
 */
function checkTasks(rootPath) {
	const tasksDir = path.join(rootPath, 'tasks');
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

/**
 * Read the governance config file.
 * @param {string|null} configPath - Config path.
 * @returns {Record<string, unknown>|null} Parsed config or null.
 */
function readConfig(configPath) {
	if (!configPath || !fs.existsSync(configPath)) return null;
	try {
		return JSON.parse(read(configPath));
	} catch (error) {
		return { __parseError: error };
	}
}

/**
 * Validate the governance config.
 * @param {string|null} configPath - Config path.
 * @param {string} govRoot - Governance root.
 * @returns {string[]} Failure messages.
 */
function checkConfig(configPath, govRoot) {
	const failures = [];
	const config = readConfig(configPath);
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

/**
 * Run governance validation on a target repository.
 * @param {string} targetRoot - Repository root.
 * @param {string|null} configOverride - Optional config path override.
 * @returns {{ok: boolean, failures: string[], hint: string}} Validation result.
 */
export function runGovernanceValidation(targetRoot = repoRoot, configOverride = null) {
	const { govRoot, indexPath, pointerPath, packageRoot, configPath } =
		resolveGovernancePaths(targetRoot);
	const hint = formatPointerHint(pointerPath, packageRoot);
	const resolvedConfigPath = configOverride ?? configPath;
	const failures = [
		...checkTokens(indexPath, govRoot, targetRoot),
		...checkTasks(targetRoot),
		...checkConfig(resolvedConfigPath, govRoot)
	];
	return { ok: failures.length === 0, failures, hint };
}

/**
 * CLI entry point for validate-governance.
 * @returns {void} No return value.
 */
function main() {
	const result = runGovernanceValidation(repoRoot);
	if (!result.ok) {
		console.error('[brAInwav] validate-governance FAILED:');
		result.failures.forEach((f) => console.error(` - ${f}`));
		process.exitCode = 1;
		return;
	}
	console.log('[brAInwav] validate-governance OK');
	if (result.hint) console.log(`[brAInwav] ${result.hint}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-governance.mjs')) {
	main();
}

export default main;
