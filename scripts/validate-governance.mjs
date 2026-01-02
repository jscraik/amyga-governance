#!/usr/bin/env node
/**
 * @fileoverview Validate governance tokens and basic task constraints.
 * - Verifies required tokens from governance-index.json are present in referenced docs.
 * - If tasks exist, checks run-manifest arcs length (Step Budget <=7).
 * @license Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { formatPointerHint, resolveGovernancePaths } from './governance-paths.mjs';
import {
	buildAgentsStub,
	buildCliInstructions,
	buildGovernanceIndexStub,
	buildPointerStub,
	POINTER_STUB_MARKER
} from './lib/pointer-stubs.mjs';

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

const ROOT_DOCS = new Set(['README.md', 'CODESTYLE.md', 'SECURITY.md', 'AGENTS.md']);
const POINTER_STUB_FILES = new Map([
	['AGENTS.md', 'AGENTS'],
	['CODESTYLE.md', 'CODESTYLE'],
	['SECURITY.md', 'SECURITY']
]);
const CANONICAL_PATH_SEGMENTS = [
	'00-core',
	'10-flow',
	'20-checklists',
	'30-compliance',
	'90-infra'
];

/**
 * Resolve a governance doc path to disk.
 * @param {string} rel - Relative doc path.
 * @param {string} govRoot - Governance root.
 * @param {string} rootPath - Repository root.
 * @param {boolean} allowRootDocs - Whether root docs can satisfy governance paths.
 * @returns {string|null} Resolved path or null.
 */
function resolvePath(rel, govRoot, rootPath, allowRootDocs) {
	const rootDocPath = path.join(rootPath, rel);
	if (allowRootDocs && ROOT_DOCS.has(rel) && fs.existsSync(rootDocPath)) return rootDocPath;
	const govPath = path.join(govRoot, rel);
	if (fs.existsSync(govPath)) return govPath;
	if (allowRootDocs && fs.existsSync(rootDocPath)) return rootDocPath;
	return null;
}

/**
 * Check required tokens from the governance index.
 * @param {string} indexPath - Governance index path.
 * @param {string} govRoot - Governance root.
 * @param {string} rootPath - Repository root.
 * @param {boolean} allowRootDocs - Whether root docs can satisfy governance paths.
 * @returns {string[]} Failure messages.
 */
function checkTokens(indexPath, govRoot, rootPath, allowRootDocs) {
	const index = JSON.parse(read(indexPath));
	const failures = [];
	const docPaths = new Set(Object.values(index.docs || {}).map((entry) => entry.path));
	['precedence', 'infra', 'reference'].forEach((listKey) => {
		const list = index[listKey];
		if (!Array.isArray(list)) return;
		list.forEach((docPath) => {
			if (!docPaths.has(docPath)) {
				failures.push(`${listKey} entry missing in docs map: ${docPath}`);
			}
		});
	});
	Object.entries(index.docs).forEach(([key, entry]) => {
		if (!entry.required_tokens) return;
		const target = resolvePath(entry.path, govRoot, rootPath, allowRootDocs);
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
			failures.push(`task ${slug}: arcs length ${arcs.length} exceeds Step Budget <=7`);
	}
	});
	return failures;
}

/**
 * Enforce pointer-mode stub validation and canonical-only constraints.
 * @param {Record<string, unknown>|null} pointer - Pointer metadata.
 * @param {string} targetRoot - Repository root.
 * @returns {string[]} Failure messages.
 */
function checkPointerStubs(pointer, targetRoot) {
	if (!pointer || pointer.mode !== 'pointer') return [];
	const failures = [];
	const pointerDir = path.join(targetRoot, '.agentic-governance');
	const overlayDir = path.join(pointerDir, 'overlays');
	const stubPaths = [
		path.join(targetRoot, 'AGENTS.md'),
		path.join(targetRoot, 'CODESTYLE.md'),
		path.join(targetRoot, 'SECURITY.md'),
		path.join(targetRoot, 'docs', 'GOVERNANCE.md')
	];
	const instructionsPath = path.join(pointerDir, 'instructions.md');

	const canonicalVersion = pointer.version || 'unknown';
	const canonicalPackage = pointer.package || '@brainwav/brainwav-agentic-governance';
	const pointerPayload = {
		...pointer,
		package: canonicalPackage,
		version: canonicalVersion,
		profile: pointer.profile || 'unknown'
	};

	const expectedStubs = new Map([
		['AGENTS.md', buildAgentsStub(pointerPayload)],
		[
			'CODESTYLE.md',
			buildPointerStub(
				'CODESTYLE',
				'node_modules/@brainwav/brainwav-agentic-governance/CODESTYLE.md',
				pointerPayload
			)
		],
		[
			'SECURITY.md',
			buildPointerStub(
				'SECURITY',
				'node_modules/@brainwav/brainwav-agentic-governance/SECURITY.md',
				pointerPayload
			)
		],
		['docs/GOVERNANCE.md', buildGovernanceIndexStub(pointerPayload)]
	]);

	stubPaths.forEach((stubPath) => {
		if (!fs.existsSync(stubPath)) {
			const rel = path.relative(targetRoot, stubPath);
			if (POINTER_STUB_FILES.has(rel)) {
				failures.push(`pointer stub missing: ${rel}`);
			}
			return;
		}
		const rel = path.relative(targetRoot, stubPath).replace(/\\/g, '/');
		const expected = expectedStubs.get(rel);
		if (!expected) return;
		const actual = read(stubPath).trimEnd();
		const expectedNormalized = expected.trimEnd();
		if (!actual.includes(POINTER_STUB_MARKER)) {
			failures.push(`pointer stub missing marker in ${rel}`);
			return;
		}
		if (actual !== expectedNormalized) {
			failures.push(`pointer stub mismatch: ${rel}`);
		}
	});

	if (!fs.existsSync(instructionsPath)) {
		failures.push('pointer mode missing .agentic-governance/instructions.md');
	} else {
		const expectedInstructions = buildCliInstructions(pointerPayload).trimEnd();
		const actualInstructions = read(instructionsPath).trimEnd();
		if (actualInstructions !== expectedInstructions) {
			failures.push('pointer instructions mismatch: .agentic-governance/instructions.md');
		}
	}

	const bannedRoots = CANONICAL_PATH_SEGMENTS.map((segment) =>
		path.join(targetRoot, segment)
	);
	const bannedHits = [];
	bannedRoots.forEach((bannedRoot) => {
		if (fs.existsSync(bannedRoot)) {
			bannedHits.push(path.relative(targetRoot, bannedRoot));
		}
	});
	if (bannedHits.length > 0) {
		failures.push(
			`pointer mode forbids canonical governance directories: ${bannedHits.join(', ')}`
		);
	}

	const forbiddenNamePatterns = [/constitution\.md$/i, /agentic-coding-workflow\.md$/i];
	const visit = (dir) => {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		entries.forEach((entry) => {
			const entryPath = path.join(dir, entry.name);
			if (entryPath.startsWith(pointerDir)) return;
			if (entryPath.startsWith(overlayDir)) return;
			if (entry.isDirectory()) {
				visit(entryPath);
				return;
			}
			const relPath = path.relative(targetRoot, entryPath).replace(/\\/g, '/');
			if (POINTER_STUB_FILES.has(relPath)) return;
			const matchesForbidden = forbiddenNamePatterns.some((pattern) => pattern.test(entry.name));
			if (matchesForbidden) {
				failures.push(`pointer mode forbids canonical doc copy at ${relPath}`);
			}
		});
	};
	visit(targetRoot);

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
 * @param {string} targetRoot - Repository root.
 * @returns {string[]} Failure messages.
 */
function checkConfig(configPath, govRoot, targetRoot) {
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
		if (!process.env.BRAINWAV_JSON) {
			console.warn(
				`[brAInwav] config profile "${config.profile}" is legacy; use "delivery" or "release" going forward.`
			);
		}
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
			const target = path.resolve(targetRoot, normalized);
			const relativeTarget = path.relative(targetRoot, target).replace(/\\/g, '/');
			if (relativeTarget.startsWith('..')) {
				failures.push(`overlay[${index}] path must not traverse directories: ${overlayPath}`);
				return;
			}
			if (!fs.existsSync(target)) {
				failures.push(`overlay[${index}] path not found: ${overlayPath}`);
				return;
			}
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
	const pointer = pointerPath && fs.existsSync(pointerPath) ? JSON.parse(read(pointerPath)) : null;
	const allowRootDocs = !pointer || pointer.mode !== 'pointer';
	const resolvedConfigPath = configOverride ?? configPath;
	const failures = [
		...checkTokens(indexPath, govRoot, targetRoot, allowRootDocs),
		...checkTasks(targetRoot),
		...checkConfig(resolvedConfigPath, govRoot, targetRoot),
		...checkPointerStubs(pointer, targetRoot)
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
