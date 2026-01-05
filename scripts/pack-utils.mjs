#!/usr/bin/env node
/**
 * @fileoverview Pack manifest utilities.
 * @license Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const packsRoot = path.join(repoRoot, 'brainwav', 'governance-pack', 'packs');

export const PRESETS = {
	'web': ['sdd', 'ts-base', 'react-vite', 'tailwind', 'storybook'],
	'edge': ['sdd', 'ts-base', 'cloudflare-workers'],
	'mcp': ['sdd', 'ts-base', 'mcp-server-ts'],
	'apple': ['sdd', 'swift-core', 'swift-xcode', 'swift-appkit', 'apple-release']
};

/**
 * Read and parse YAML from disk.
 * @param {string} filePath - Path to the YAML file.
 * @returns {Record<string, unknown>} Parsed YAML data.
 */
function readYaml(filePath) {
	return yaml.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Read and parse JSON from disk.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Record<string, unknown>} Parsed JSON data.
 */
function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Expand preset identifiers into concrete pack IDs.
 * @param {string[]} packs - Pack IDs or preset identifiers.
 * @returns {string[]} Expanded pack IDs.
 */
export function resolvePresetPacks(packs) {
	const expanded = [];
	const seen = new Set();
	for (const entry of packs) {
		if (entry.startsWith('preset:')) {
			const presetId = entry.replace('preset:', '');
			const preset = PRESETS[presetId];
			if (preset) {
				preset.forEach((packId) => {
					if (!seen.has(packId)) {
						seen.add(packId);
						expanded.push(packId);
					}
				});
				continue;
			}
		}
		if (!seen.has(entry)) {
			seen.add(entry);
			expanded.push(entry);
		}
	}
	return expanded;
}

/**
 * Load a pack manifest by ID from the repo packs root.
 * @param {string} packId - Pack identifier.
 * @returns {object|null} Normalized manifest or null when missing.
 */
export function loadPackManifest(packId) {
	const jsonPath = path.join(packsRoot, packId, 'pack.json');
	const yamlPath = path.join(packsRoot, `${packId}.pack.yaml`);
	let data = null;
	if (fs.existsSync(jsonPath)) {
		data = readJson(jsonPath);
	} else if (fs.existsSync(yamlPath)) {
		const raw = readYaml(yamlPath);
		data = raw?.pack ?? raw;
	}
	if (!data) return null;
	return {
		id: data.id ?? packId,
		version: data.version ?? '1.0.0',
		description: data.description ?? data.summary ?? '',
		depends_on: data.depends_on ?? data.dependsOn ?? [],
		ci: data.ci ?? { runner: 'ubuntu-latest', permissions: { contents: 'read' } },
		render: data.render ?? {},
		checks: data.checks ?? { validate: [], doctor: [] },
		inputs: data.inputs ?? { required: [], optional: {} }
	};
}

/**
 * Resolve the source manifest path for a pack ID.
 * @param {string} packId - Pack identifier.
 * @returns {string|null} Manifest path if found.
 */
export function resolvePackSourcePath(packId) {
	const jsonPath = path.join(packsRoot, packId, 'pack.json');
	if (fs.existsSync(jsonPath)) return jsonPath;
	const yamlPath = path.join(packsRoot, `${packId}.pack.yaml`);
	if (fs.existsSync(yamlPath)) return yamlPath;
	return null;
}

/**
 * Resolve a pack manifest path based on a consumer repo root.
 * @param {string} rootPath - Consumer repository root.
 * @param {string} packId - Pack identifier.
 * @returns {string|null} Manifest path if found.
 */
export function resolvePackManifestPath(rootPath, packId) {
	if (!rootPath) return resolvePackSourcePath(packId);
	const localPackDir = path.join(rootPath, '.agentic-governance', 'packs', packId);
	const localJson = path.join(localPackDir, 'pack.json');
	const localYaml = path.join(rootPath, '.agentic-governance', 'packs', `${packId}.pack.yaml`);
	if (fs.existsSync(localJson)) return localJson;
	if (fs.existsSync(localYaml)) return localYaml;
	const pointerPath = path.join(rootPath, '.agentic-governance', 'pointer.json');
	if (fs.existsSync(pointerPath)) {
		try {
			const pointer = readJson(pointerPath);
			const packageRoot = pointer?.packageRoot
				? path.resolve(rootPath, pointer.packageRoot)
				: path.join(rootPath, 'node_modules', '@brainwav', 'amyga-governance');
			const pointerJson = path.join(packageRoot, 'brainwav', 'governance-pack', 'packs', packId, 'pack.json');
			const pointerYaml = path.join(packageRoot, 'brainwav', 'governance-pack', 'packs', `${packId}.pack.yaml`);
			if (fs.existsSync(pointerJson)) return pointerJson;
			if (fs.existsSync(pointerYaml)) return pointerYaml;
		} catch {
			// ignore pointer parse errors
		}
	}
	const vendorRoot = path.join(rootPath, '.agentic-governance', 'vendor');
	if (fs.existsSync(vendorRoot)) {
		const versions = fs.readdirSync(vendorRoot, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);
		for (const version of versions) {
			const vendorBase = path.join(vendorRoot, version, 'governance-pack', 'packs');
			const vendorJson = path.join(vendorBase, packId, 'pack.json');
			const vendorYaml = path.join(vendorBase, `${packId}.pack.yaml`);
			if (fs.existsSync(vendorJson)) return vendorJson;
			if (fs.existsSync(vendorYaml)) return vendorYaml;
		}
	}
	const repoJson = path.join(packsRoot, packId, 'pack.json');
	const repoYaml = path.join(packsRoot, `${packId}.pack.yaml`);
	if (fs.existsSync(repoJson)) return repoJson;
	if (fs.existsSync(repoYaml)) return repoYaml;
	return null;
}

/**
 * Load and normalize a pack manifest from a file path.
 * @param {string|null} filePath - Path to a manifest file.
 * @param {string} packId - Pack identifier for fallback.
 * @returns {object|null} Normalized manifest or null when missing.
 */
export function loadPackManifestFromPath(filePath, packId) {
	if (!filePath) return null;
	const raw = filePath.endsWith('.json') ? readJson(filePath) : readYaml(filePath);
	const data = raw?.pack ?? raw;
	if (!data) return null;
	return {
		id: data.id ?? packId,
		version: data.version ?? '1.0.0',
		description: data.description ?? data.summary ?? '',
		depends_on: data.depends_on ?? data.dependsOn ?? [],
		ci: data.ci ?? { runner: 'ubuntu-latest', permissions: { contents: 'read' } },
		render: data.render ?? {},
		checks: data.checks ?? { validate: [], doctor: [] },
		inputs: data.inputs ?? { required: [], optional: {} },
		commands: data.commands
	};
}

/**
 * Load a pack manifest from a consumer repo root.
 * @param {string} rootPath - Consumer repository root.
 * @param {string} packId - Pack identifier.
 * @returns {object|null} Normalized manifest or null.
 */
export function loadPackManifestFromRoot(rootPath, packId) {
	const manifestPath = resolvePackManifestPath(rootPath, packId);
	return loadPackManifestFromPath(manifestPath, packId);
}

/**
 * Resolve full dependency closure for pack IDs.
 * @param {string[]} selected - Selected pack IDs.
 * @returns {string[]} Dependency-closed pack list.
 */
export function resolvePackClosure(selected) {
	const resolved = [];
	const seen = new Set();

	function visit(packId) {
		if (seen.has(packId)) return;
		const manifest = loadPackManifest(packId);
		if (!manifest) {
			throw new Error(`Unknown pack: ${packId}`);
		}
		seen.add(packId);
		(manifest.depends_on || []).forEach((dep) => visit(dep));
		resolved.push(manifest.id);
	}

	selected.forEach((packId) => visit(packId));
	return resolved;
}

/**
 * Resolve packs including presets and dependencies.
 * @param {string[]} selected - Selected pack IDs.
 * @returns {string[]} Resolved pack IDs.
 */
export function resolvePacks(selected) {
	const expanded = resolvePresetPacks(selected);
	return resolvePackClosure(expanded);
}

/**
 * Load pack manifests by ID from repo packs root.
 * @param {string[]} packIds - Pack identifiers.
 * @returns {object[]} Normalized manifests.
 */
export function loadPackManifests(packIds) {
	return packIds
		.map((id) => loadPackManifest(id))
		.filter(Boolean);
}

/**
 * Group packs by CI runner from their manifests.
 * @param {string[]} packIds - Pack identifiers.
 * @returns {Map<string, string[]>} Runner-to-pack map.
 */
export function groupPacksByRunner(packIds) {
	const manifests = loadPackManifests(packIds);
	const runnerMap = new Map();
	manifests.forEach((manifest) => {
		const runner = manifest.ci?.runner ?? 'ubuntu-latest';
		const list = runnerMap.get(runner) ?? [];
		list.push(manifest.id);
		runnerMap.set(runner, list);
	});
	return runnerMap;
}

/**
 * Merge GitHub Actions permissions from pack manifests.
 * @param {object[]} manifests - Pack manifests.
 * @returns {Record<string, string>} Merged permissions.
 */
export function mergePermissions(manifests) {
	const merged = { contents: 'read' };
	manifests.forEach((manifest) => {
		const perms = manifest.ci?.permissions ?? {};
		Object.entries(perms).forEach(([key, value]) => {
			merged[key] = value;
		});
	});
	return merged;
}
