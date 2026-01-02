#!/usr/bin/env node
/**
 * @fileoverview Install governance pack into a target project (files + CI workflow).
 * @license Apache-2.0
 *
 * Usage:
 *   pnpm governance:install --root /path/to/consumer [--mode full|pointer] [--profile creative|delivery|release] [--preserve-config]
 *
 * Copies:
 * - AGENTS.md, CODESTYLE.md, SECURITY.md
 * - brainwav/governance/** (policies, templates, index)
 * - .github/ISSUE_TEMPLATE/* and PR template
 * - governance workflow (.github/workflows/governance.yml) from the bundled template
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { resolvePackSourcePath, groupPacksByRunner, loadPackManifestFromPath, mergePermissions } from './pack-utils.mjs';
import { formatJson } from './lib/json-format.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const COPY_LIST = [
	'AGENTS.md',
	'CODESTYLE.md',
	'SECURITY.md',
	'brainwav/README.md',
	'brainwav/governance',
	'.github/ISSUE_TEMPLATE',
	'.github/pull_request_template.md',
];

function loadCompat() {
	const compatPath = path.join(repoRoot, 'brainwav', 'governance', '90-infra', 'compat.json');
	if (!fs.existsSync(compatPath)) return {};
	try {
		return JSON.parse(fs.readFileSync(compatPath, 'utf8'));
	} catch {
		return {};
	}
}

function getToolVersions() {
	const compat = loadCompat();
	return compat?.gold_standard?.tool_versions ?? {};
}

/**
 * Parse CLI arguments for governance install.
 * @returns {{dest: string, mode: string, profile: string, profileWasProvided: boolean, preserveConfig: boolean, force: boolean, dryRun: boolean}} Parsed args.
 */
function parseArgs() {
	const args = process.argv.slice(2);
	let dest;
	let usedDestFlag = false;
	let mode = 'full';
	let profile = 'release';
	let profileWasProvided = false;
	let preserveConfig = false;
	let force = false;
	let dryRun = false;
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--dest' && args[i + 1]) {
			dest = args[i + 1];
			usedDestFlag = true;
		}
		if (args[i] === '--root' && args[i + 1]) dest = args[i + 1];
		if (args[i] === '--mode' && args[i + 1]) mode = args[i + 1];
		if (args[i] === '--profile' && args[i + 1]) {
			profile = args[i + 1];
			profileWasProvided = true;
		}
		if (args[i] === '--preserve-config') preserveConfig = true;
		if (args[i] === '--force') force = true;
		if (args[i] === '--dry-run') dryRun = true;
	}
	if (!dest) {
		throw new Error('Missing --root <path> for target project');
	}
	if (usedDestFlag) {
		console.warn('[brAInwav] --dest is deprecated; use --root instead.');
	}
	if (!['full', 'pointer'].includes(mode)) {
		throw new Error('Invalid --mode. Use "full" or "pointer".');
	}
	const normalizedProfile = profile === 'core' ? 'delivery' : profile === 'full' ? 'release' : profile;
	if (!['creative', 'delivery', 'release'].includes(normalizedProfile)) {
		throw new Error('Invalid --profile. Use "creative", "delivery", or "release".');
	}
	if (profile !== normalizedProfile) {
		console.warn(
			`[brAInwav] profile "${profile}" is legacy; use "${normalizedProfile}" going forward.`
		);
	}
	return {
		dest: path.resolve(dest),
		mode,
		profile: normalizedProfile,
		profileWasProvided,
		preserveConfig,
		force,
		dryRun
	};
}

/**
 * Determine whether a target path should be written.
 * @param {string} target - Target path.
 * @param {boolean} force - Force overwrite when true.
 * @returns {boolean} True when writing is allowed.
 */
function shouldWrite(target, force) {
	return force || !fs.existsSync(target);
}

/**
 * Record a filesystem action for reporting.
 * @param {Array<object>} actions - Action list.
 * @param {string} type - Action type.
 * @param {string|null} source - Source path.
 * @param {string} target - Target path.
 * @param {string} status - Action status.
 * @param {string|null} note - Optional note.
 * @returns {void} No return value.
 */
function recordAction(actions, type, source, target, status, note) {
	actions.push({
		type,
		source,
		target,
		status,
		note
	});
}

/**
 * Copy a file or directory recursively.
 * @param {string} src - Source path.
 * @param {string} dest - Destination path.
 * @param {{force: boolean, dryRun: boolean, actions: Array<object>}} options - Copy options.
 * @returns {void} No return value.
 */
function copyRecursive(src, dest, { force, dryRun, actions }) {
	if (!shouldWrite(dest, force)) {
		recordAction(actions, 'copy', src, dest, 'skipped', 'exists');
		return;
	}
	if (!dryRun) {
		fs.cpSync(src, dest, { recursive: true, force: true });
	}
	recordAction(actions, 'copy', src, dest, dryRun ? 'planned' : 'written', null);
}

/**
 * Write the governance config file.
 * @param {string} destRoot - Destination root.
 * @param {string} profile - Profile name.
 * @param {string} mode - Install mode.
 * @param {Array<object>} overlays - Overlay definitions.
 * @param {string[]} packs - Pack identifiers.
 * @param {Record<string, unknown>} packOptions - Pack options.
 * @param {{force: boolean, dryRun: boolean, actions: Array<object>}} options - Write options.
 * @param {string|null} configPathOverride - Optional config path override.
 * @returns {void} No return value.
 */
function writeConfigFile(destRoot, profile, mode, overlays = [], packs, packOptions, { force, dryRun, actions }, configPathOverride) {
	const configPath = configPathOverride
		? path.isAbsolute(configPathOverride)
			? configPathOverride
			: path.join(destRoot, configPathOverride)
		: path.join(destRoot, '.agentic-governance', 'config.json');
	const configDir = path.dirname(configPath);
	if (!dryRun) fs.mkdirSync(configDir, { recursive: true });
	const schemaPath = mode === 'pointer'
		? 'node_modules/@brainwav/brainwav-agentic-governance/brainwav/governance/90-infra/agentic-config.schema.json'
		: 'brainwav/governance/90-infra/agentic-config.schema.json';
	const configPayload = {
		$schema: schemaPath,
		version: '1.0',
		mode,
		profile,
		packs,
		packOptions,
		overlays
	};
	if (!shouldWrite(configPath, force)) {
		recordAction(actions, 'write', null, configPath, 'skipped', 'exists');
		return;
	}
	if (!dryRun) {
		fs.writeFileSync(configPath, formatJson(configPayload, 2));
	}
	recordAction(actions, 'write', null, configPath, dryRun ? 'planned' : 'written', null);
}

/**
 * Read an existing config file if present.
 * @param {string} destRoot - Destination root.
 * @param {string|null} configPathOverride - Optional config path override.
 * @returns {Record<string, unknown>|null} Parsed config or null.
 */
function readExistingConfig(destRoot, configPathOverride) {
	const configPath = configPathOverride
		? path.isAbsolute(configPathOverride)
			? configPathOverride
			: path.join(destRoot, configPathOverride)
		: path.join(destRoot, '.agentic-governance', 'config.json');
	if (!fs.existsSync(configPath)) return null;
	try {
		return JSON.parse(fs.readFileSync(configPath, 'utf8'));
	} catch (error) {
		console.warn(`[brAInwav] config.json parse failed; overwriting. ${error.message}`);
		return null;
	}
}

/**
 * Render the GitHub Actions workflow for governance checks.
 * @param {{permissions: Record<string, string>, includeMacos: boolean}} options - Render options.
 * @returns {string} Workflow YAML content.
 */
function renderWorkflow({ permissions, includeMacos }) {
	const header = `name: Brainwav Governance\n\non:\n  pull_request:\n  push:\n    branches: [main]\n\npermissions:\n`;
	const permLines = Object.entries(permissions)
		.map(([key, value]) => `  ${key}: ${value}`)
		.join('\n');
	const env = `\n\nenv:\n  GOVERNANCE_MODE: delivery\n  GOVERNANCE_PROFILE: release\n\n`;
	const versions = getToolVersions();
	const nodeVersion = versions.node ?? '24.11.0';
	const pnpmVersion = versions.pnpm ?? '10.26.0';
	const baseJobs = `jobs:\n  governance-ubuntu:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1\n      - uses: pnpm/action-setup@41ff72655975bd51cab0327fa583b6e92b6d3061 # v4.2.0\n        with:\n          version: ${pnpmVersion}\n      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0\n        with:\n          node-version: '${nodeVersion}'\n          cache: 'pnpm'\n      - run: pnpm install --frozen-lockfile\n      - run: pnpm exec brainwav-governance validate --strict --config .agentic-governance/config.ci.ubuntu.json --report .agentic-governance/reports\n\n`;
	if (!includeMacos) {
		return `${header}${permLines}${env}${baseJobs}`;
	}
	const macosJob = `  governance-macos:\n    runs-on: macos-latest\n    needs: [governance-ubuntu]\n    steps:\n      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1\n      - uses: pnpm/action-setup@41ff72655975bd51cab0327fa583b6e92b6d3061 # v4.2.0\n        with:\n          version: ${pnpmVersion}\n      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0\n        with:\n          node-version: '${nodeVersion}'\n          cache: 'pnpm'\n      - run: pnpm install --frozen-lockfile\n      - run: pnpm exec brainwav-governance validate --strict --config .agentic-governance/config.ci.macos.json --report .agentic-governance/reports\n`;
	return `${header}${permLines}${env}${baseJobs}${macosJob}`;
}

/**
 * Load pack manifests for install-time decisions.
 * @param {string[]} packs - Pack identifiers.
 * @returns {Array<object>} Pack manifests.
 */
function loadPackManifestsForInstall(packs) {
	const manifests = [];
	packs.forEach((packId) => {
		const manifestPath = resolvePackSourcePath(packId);
		const manifest = loadPackManifestFromPath(manifestPath, packId);
		if (manifest) manifests.push(manifest);
	});
	return manifests;
}

/**
 * Write CI-specific config files per runner.
 * @param {string} destRoot - Destination root.
 * @param {string} profile - Profile name.
 * @param {string} mode - Install mode.
 * @param {string[]} packs - Pack identifiers.
 * @param {Record<string, unknown>} packOptions - Pack options.
 * @param {Array<object>} overlays - Overlay definitions.
 * @param {{dryRun: boolean, actions: Array<object>}} options - Write options.
 * @returns {{includeMacos: boolean}} CI config summary.
 */
function writeCiConfigs(destRoot, profile, mode, packs, packOptions, overlays, { dryRun, actions }) {
	const runnerMap = groupPacksByRunner(packs);
	const configDir = path.join(destRoot, '.agentic-governance');
	if (!dryRun) fs.mkdirSync(configDir, { recursive: true });
	const ubuntuPacks = runnerMap.get('ubuntu-latest') ?? [];
	const macosPacks = runnerMap.get('macos-latest') ?? [];
	const baseConfig = {
		version: '1.0',
		mode,
		profile,
		packs: [],
		packOptions,
		overlays
	};
	const ubuntuConfig = { ...baseConfig, packs: ubuntuPacks };
	const ubuntuPath = path.join(configDir, 'config.ci.ubuntu.json');
	if (!dryRun) {
		fs.writeFileSync(ubuntuPath, formatJson(ubuntuConfig, 2));
	}
	recordAction(actions, 'write', null, ubuntuPath, dryRun ? 'planned' : 'written', null);
	let includeMacos = false;
	if (macosPacks.length > 0) {
		includeMacos = true;
		const macosConfig = { ...baseConfig, packs: macosPacks };
		const macosPath = path.join(configDir, 'config.ci.macos.json');
		if (!dryRun) {
			fs.writeFileSync(macosPath, formatJson(macosConfig, 2));
		}
		recordAction(actions, 'write', null, macosPath, dryRun ? 'planned' : 'written', null);
	}
	return { includeMacos };
}

/**
 * Write pointer-mode stubs and pointer.json.
 * @param {string} destRoot - Destination root.
 * @param {string} profile - Profile name.
 * @param {{force: boolean, dryRun: boolean, actions: Array<object>}} options - Write options.
 * @returns {void} No return value.
 */
function writePointerFiles(destRoot, profile, { force, dryRun, actions }) {
	const pointerDir = path.join(destRoot, '.agentic-governance');
	if (!dryRun) fs.mkdirSync(pointerDir, { recursive: true });
	const pointerPayload = {
		mode: 'pointer',
		profile,
		package: '@brainwav/brainwav-agentic-governance',
		packageRoot: 'node_modules/@brainwav/brainwav-agentic-governance',
		governanceRoot: 'node_modules/@brainwav/brainwav-agentic-governance/brainwav/governance',
		governanceIndexPath:
			'node_modules/@brainwav/brainwav-agentic-governance/brainwav/governance/90-infra/governance-index.json',
		agentsPath: 'node_modules/@brainwav/brainwav-agentic-governance/AGENTS.md',
		installedAt: new Date().toISOString()
	};
	const pointerPath = path.join(pointerDir, 'pointer.json');
	if (shouldWrite(pointerPath, force)) {
		if (!dryRun) {
			fs.writeFileSync(pointerPath, formatJson(pointerPayload, 2));
		}
		recordAction(actions, 'write', null, pointerPath, dryRun ? 'planned' : 'written', null);
	} else {
		recordAction(actions, 'write', null, pointerPath, 'skipped', 'exists');
	}

	const agentsPointer = `# AGENTS — Pointer (profile: ${profile})\n\n` +
		`This repository consumes the brAInwav Agentic Governance pack via pointer mode.\n` +
		`Canonical policies live in the pinned npm package release (lockfile-controlled).\n\n` +
		`Canonical source (immutable via lockfile):\n` +
		`- Package: @brainwav/brainwav-agentic-governance (pin exact version in package.json)\n` +
		`- Path: node_modules/@brainwav/brainwav-agentic-governance/AGENTS.md\n` +
		`- Hash index: node_modules/@brainwav/brainwav-agentic-governance/brainwav/governance/90-infra/governance-index.json\n\n` +
		`Local overrides (tighten only):\n` +
		`- Declare overlays in .agentic-governance/config.json and use AGENTS.local.md (optional).\n`;

	const pointerStub = (title, canonicalPath) =>
		`# ${title} — Pointer\n\n` +
		`Canonical source (lockfile-pinned):\n` +
		`- ${canonicalPath}\n\n` +
		`Local overrides (tighten only):\n` +
		`- Declare overlays in .agentic-governance/config.json and use ${title}.local.md (optional).\n`;

	const agentPath = path.join(destRoot, 'AGENTS.md');
	const codeStylePath = path.join(destRoot, 'CODESTYLE.md');
	const securityPath = path.join(destRoot, 'SECURITY.md');

	if (shouldWrite(agentPath, force)) {
		if (!dryRun) fs.writeFileSync(agentPath, `${agentsPointer}\n`);
		recordAction(actions, 'write', null, agentPath, dryRun ? 'planned' : 'written', null);
	} else {
		recordAction(actions, 'write', null, agentPath, 'skipped', 'exists');
	}

	if (shouldWrite(codeStylePath, force)) {
		if (!dryRun) {
			fs.writeFileSync(
				codeStylePath,
				`${pointerStub('CODESTYLE', 'node_modules/@brainwav/brainwav-agentic-governance/CODESTYLE.md')}\n`
			);
		}
		recordAction(actions, 'write', null, codeStylePath, dryRun ? 'planned' : 'written', null);
	} else {
		recordAction(actions, 'write', null, codeStylePath, 'skipped', 'exists');
	}

	if (shouldWrite(securityPath, force)) {
		if (!dryRun) {
			fs.writeFileSync(
				securityPath,
				`${pointerStub('SECURITY', 'node_modules/@brainwav/brainwav-agentic-governance/SECURITY.md')}\n`
			);
		}
		recordAction(actions, 'write', null, securityPath, dryRun ? 'planned' : 'written', null);
	} else {
		recordAction(actions, 'write', null, securityPath, 'skipped', 'exists');
	}
}

/**
 * Read a file if it exists.
 * @param {string} filePath - File path.
 * @returns {string|null} File contents or null.
 */
function readFileIfExists(filePath) {
	if (!filePath || !fs.existsSync(filePath)) return null;
	return fs.readFileSync(filePath, 'utf8');
}

/**
 * Resolve the pack directory for a pack ID.
 * @param {string} packId - Pack identifier.
 * @returns {string|null} Pack directory or null.
 */
function resolvePackDir(packId) {
	const packDir = path.join(repoRoot, 'brainwav', 'governance-pack', 'packs', packId);
	return fs.existsSync(packDir) && fs.statSync(packDir).isDirectory() ? packDir : null;
}

/**
 * Synthesize a minimal pack section from manifest data.
 * @param {Record<string, unknown>} manifest - Pack manifest.
 * @returns {string} Markdown section.
 */
function synthesizePackSection(manifest) {
	const lines = [];
	lines.push(`## Pack: ${manifest.id}`);
	if (manifest.description) {
		lines.push('', manifest.description);
	}
	lines.push('', `Applies when: pack "${manifest.id}" is selected.`);
	const validateChecks = Array.isArray(manifest.checks?.validate) ? manifest.checks.validate : [];
	const doctorChecks = Array.isArray(manifest.checks?.doctor) ? manifest.checks.doctor : [];
	lines.push('', 'Checks:');
	lines.push(`- validate: ${validateChecks.length > 0 ? validateChecks.join(', ') : 'none'}`);
	lines.push(`- doctor: ${doctorChecks.length > 0 ? doctorChecks.join(', ') : 'none'}`);
	const templates = Array.isArray(manifest.render?.templates) ? manifest.render.templates : [];
	if (templates.length > 0) {
		lines.push('', 'Templates:');
		templates.forEach((template) => {
			lines.push(`- ${template.to} (from ${template.from})`);
		});
	}
	return lines.join('\n');
}

/**
 * Build pack section content for docs.
 * @param {string} packId - Pack identifier.
 * @returns {{manifest: object|null, agents: string, codeStyle: string}} Pack section data.
 */
function buildPackSection(packId) {
	const packDir = resolvePackDir(packId);
	if (packDir) {
		const manifestPath = resolvePackSourcePath(packId);
		const manifest = loadPackManifestFromPath(manifestPath, packId);
		const agentsPackPath = path.join(packDir, 'AGENTS.pack.md');
		const codeStylePackPath = path.join(packDir, 'CODESTYLE.pack.md');
		return {
			manifest,
			agents: readFileIfExists(agentsPackPath) ?? (manifest ? synthesizePackSection(manifest) : ''),
			codeStyle: readFileIfExists(codeStylePackPath) ?? (manifest ? synthesizePackSection(manifest) : '')
		};
	}
	const manifestPath = resolvePackSourcePath(packId);
	const manifest = loadPackManifestFromPath(manifestPath, packId);
	if (!manifest) {
		return { manifest: null, agents: '', codeStyle: '' };
	}
	const synthesized = synthesizePackSection(manifest);
	return { manifest, agents: synthesized, codeStyle: synthesized };
}

/**
 * Render AGENTS and CODESTYLE with selected pack sections.
 * @param {{destRoot: string, packs: string[], force: boolean, dryRun: boolean, actions: Array<object>}} options - Render options.
 * @returns {void} No return value.
 */
function renderDocsWithPacks({ destRoot, packs, force, dryRun, actions }) {
	const coreAgents = readFileIfExists(path.join(repoRoot, 'AGENTS.md'));
	const coreCodeStyle = readFileIfExists(path.join(repoRoot, 'CODESTYLE.md'));
	if (!coreAgents || !coreCodeStyle) return;

	const packSections = packs.map((packId) => buildPackSection(packId));
	const agentSections = packSections.map((section) => section.agents).filter(Boolean);
	const codeStyleSections = packSections.map((section) => section.codeStyle).filter(Boolean);

	const renderedAgents = [
		coreAgents.trimEnd(),
		agentSections.length > 0 ? '\n\n' + agentSections.join('\n\n') : ''
	].join('');
	const renderedCodeStyle = [
		coreCodeStyle.trimEnd(),
		codeStyleSections.length > 0 ? '\n\n' + codeStyleSections.join('\n\n') : ''
	].join('');

	const agentsTarget = path.join(destRoot, 'AGENTS.md');
	if (shouldWrite(agentsTarget, force)) {
		if (!dryRun) fs.writeFileSync(agentsTarget, `${renderedAgents.trim()}\n`);
		recordAction(actions, 'write', null, agentsTarget, dryRun ? 'planned' : 'written', null);
	}
	const codeStyleTarget = path.join(destRoot, 'CODESTYLE.md');
	if (shouldWrite(codeStyleTarget, force)) {
		if (!dryRun) fs.writeFileSync(codeStyleTarget, `${renderedCodeStyle.trim()}\n`);
		recordAction(actions, 'write', null, codeStyleTarget, dryRun ? 'planned' : 'written', null);
	}
}

/**
 * Deep merge config values with simple array strategy.
 * @param {Record<string, unknown>} baseConfig - Base config.
 * @param {Record<string, unknown>} overrideConfig - Override config.
 * @returns {Record<string, unknown>} Merged config.
 */
function mergeConfig(baseConfig, overrideConfig) {
	if (!overrideConfig || typeof overrideConfig !== 'object') return baseConfig;
	const mergeStrategy = overrideConfig.mergeStrategy || {};
	const result = { ...baseConfig };
	for (const [key, value] of Object.entries(overrideConfig)) {
		if (key === 'mergeStrategy') continue;
		if (Array.isArray(value)) {
			if (Array.isArray(baseConfig[key]) && mergeStrategy[key] === 'concat') {
				result[key] = [...baseConfig[key], ...value];
			} else {
				result[key] = value;
			}
			continue;
		}
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			const baseValue = baseConfig[key] && typeof baseConfig[key] === 'object' ? baseConfig[key] : {};
			result[key] = mergeConfig(baseValue, value);
			continue;
		}
		result[key] = value;
	}
	return result;
}

/**
 * Install governance files into a target repository.
 * @param {object} options - Install options.
 * @param {string} options.destRoot - Destination root.
 * @param {string} options.mode - Install mode.
 * @param {string} options.profile - Profile name.
 * @param {boolean} options.profileWasProvided - Whether profile was provided.
 * @param {boolean} options.preserveConfig - Preserve config flag.
 * @param {boolean} options.force - Force overwrite flag.
 * @param {boolean} options.forceConfig - Force config overwrite flag.
 * @param {boolean} options.dryRun - Dry run flag.
 * @param {string|null} options.configPath - Config path override.
 * @param {string[]} options.packs - Pack identifiers.
 * @param {Record<string, unknown>|null} options.packOptions - Pack options.
 * @returns {{actions: Array<object>, mode: string, profile: string}} Result summary.
 */
export function runGovernanceInstall({
	destRoot,
	mode,
	profile,
	profileWasProvided,
	preserveConfig,
	force,
	forceConfig,
	dryRun,
	configPath,
	packs = [],
	packOptions = null
}) {
	const actions = [];
	if (!fs.existsSync(destRoot)) {
		throw new Error(`Destination does not exist: ${destRoot}`);
	}
	const normalizedProfile = profile === 'full' ? 'release' : profile;
	if (!['creative', 'core', 'delivery', 'release'].includes(normalizedProfile)) {
		throw new Error('Invalid profile. Use "creative", "core", "delivery", or "release".');
	}

	const resolvedForceConfig = typeof forceConfig === 'boolean' ? forceConfig : force;

	if (mode === 'full') {
		COPY_LIST.forEach((item) => {
			const src = path.join(repoRoot, item);
			const dest = path.join(destRoot, item);
			copyRecursive(src, dest, { force, dryRun, actions });
		});
	} else {
		writePointerFiles(destRoot, profile, { force, dryRun, actions });
		copyRecursive(
			path.join(repoRoot, '.github', 'ISSUE_TEMPLATE'),
			path.join(destRoot, '.github', 'ISSUE_TEMPLATE'),
			{ force, dryRun, actions }
		);
		copyRecursive(
			path.join(repoRoot, '.github', 'pull_request_template.md'),
			path.join(destRoot, '.github', 'pull_request_template.md'),
			{ force, dryRun, actions }
		);
	}

	const existingConfig = preserveConfig ? readExistingConfig(destRoot, configPath) : null;
	const resolvedProfile = (!profileWasProvided && existingConfig?.profile)
		? existingConfig.profile
		: normalizedProfile;
	const existingPackOptions = existingConfig?.packOptions ?? {};
	const resolvedPackOptions = packOptions ? mergeConfig(existingPackOptions, packOptions) : existingPackOptions;
	const baseConfig = {
		version: '1.0',
		mode,
		profile: resolvedProfile,
		packs,
		packOptions: resolvedPackOptions,
		overlays: []
	};
	const overrideConfig = existingConfig ? { ...existingConfig } : {};
	if (packOptions) delete overrideConfig.packOptions;
	const mergedConfig = mergeConfig(baseConfig, overrideConfig);
	writeConfigFile(
		destRoot,
		mergedConfig.profile || resolvedProfile,
		mode,
		Array.isArray(mergedConfig.overlays) ? mergedConfig.overlays : [],
		Array.isArray(mergedConfig.packs) ? mergedConfig.packs : packs,
		mergedConfig.packOptions ?? {},
		{ force: resolvedForceConfig, dryRun, actions },
		configPath
	);

	// Ensure workflows folder + render CI configs
	if (!dryRun) fs.mkdirSync(path.join(destRoot, '.github'), { recursive: true });
	const workflowDest = path.join(destRoot, '.github', 'workflows');
	if (!dryRun) fs.mkdirSync(workflowDest, { recursive: true });
	const ciConfigResult = writeCiConfigs(
		destRoot,
		mergedConfig.profile || resolvedProfile,
		mode,
		Array.isArray(mergedConfig.packs) ? mergedConfig.packs : packs,
		mergedConfig.packOptions ?? {},
		Array.isArray(mergedConfig.overlays) ? mergedConfig.overlays : [],
		{ dryRun, actions }
	);
	const workflowTarget = path.join(workflowDest, 'brainwav-governance.yml');
	const workflowPermissions = mergePermissions(loadPackManifestsForInstall(mergedConfig.packs ?? packs));
	if (!workflowPermissions['pull-requests']) {
		workflowPermissions['pull-requests'] = 'read';
	}
	const workflowContent = renderWorkflow({
		permissions: workflowPermissions,
		includeMacos: ciConfigResult.includeMacos
	});
	if (shouldWrite(workflowTarget, force)) {
		if (!dryRun) fs.writeFileSync(workflowTarget, workflowContent);
		recordAction(actions, 'write', null, workflowTarget, dryRun ? 'planned' : 'written', null);
	} else {
		recordAction(actions, 'write', null, workflowTarget, 'skipped', 'exists');
	}

	const manifest = {
		version: '1.0',
		packs: Array.isArray(mergedConfig.packs) ? mergedConfig.packs : packs,
		installedAt: new Date().toISOString()
	};
	const manifestPath = path.join(destRoot, '.agentic-governance', 'packs.json');
	if (!dryRun) {
		fs.writeFileSync(manifestPath, formatJson(manifest, 2));
	}
	recordAction(actions, 'write', null, manifestPath, dryRun ? 'planned' : 'written', null);

	if (mode === 'full' && packs.length > 0) {
		const version = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).version;
		const vendorRoot = path.join(destRoot, '.agentic-governance', 'vendor', version, 'governance-pack', 'packs');
		if (!dryRun) fs.mkdirSync(vendorRoot, { recursive: true });
		packs.forEach((packId) => {
			const packDir = resolvePackDir(packId);
			if (packDir) {
				const targetDir = path.join(vendorRoot, packId);
				copyRecursive(packDir, targetDir, { force: true, dryRun, actions });
				const sourceManifest = resolvePackSourcePath(packId);
				if (sourceManifest && sourceManifest.endsWith('.pack.yaml')) {
					const manifestTarget = path.join(vendorRoot, `${packId}.pack.yaml`);
					copyRecursive(sourceManifest, manifestTarget, { force: true, dryRun, actions });
				}
				return;
			}
			const source = resolvePackSourcePath(packId);
			if (!source) return;
			const target = path.join(vendorRoot, path.basename(source));
			copyRecursive(source, target, { force: true, dryRun, actions });
		});
	}

	if (mode === 'full') {
		renderDocsWithPacks({
			destRoot,
			packs: Array.isArray(mergedConfig.packs) ? mergedConfig.packs : packs,
			force,
			dryRun,
			actions
		});
	}

	return {
		actions,
		mode,
		profile: resolvedProfile
	};
}

/**
 * CLI entry point for governance install.
 * @returns {void} No return value.
 */
function main() {
	try {
		const { dest: destRoot, mode, profile, profileWasProvided, preserveConfig, force, dryRun } =
			parseArgs();
		runGovernanceInstall({
			destRoot,
			mode,
			profile,
			profileWasProvided,
			preserveConfig,
			force,
			forceConfig: force,
			dryRun
		});
		console.log('[brAInwav] governance install complete.');
		console.log(
			'[brAInwav] Next: ensure Node 24.11.x + pnpm 10.26.x in the consumer CI environment.'
		);
		if (mode === 'pointer') {
			console.log(
				'[brAInwav] Pointer mode: add @brainwav/brainwav-agentic-governance as a dev dependency and pin its version in the lockfile.'
			);
		}
	} catch (error) {
		console.error(`[brAInwav] governance install failed: ${error.message}`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('install-governance.mjs')) {
	main();
}

export default main;
