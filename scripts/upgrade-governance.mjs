#!/usr/bin/env node
/**
 * @fileoverview Upgrade governance installation in a target repository.
 * @license Apache-2.0
 *
 * Usage:
 *   pnpm governance:upgrade --root /path/to/consumer [--mode full|pointer] [--profile creative|delivery|release] [--no-install] [--preserve-config] [--force] [--dry-run]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runGovernanceInstall } from './install-governance.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/**
 * Parse CLI arguments for governance upgrade.
 * @returns {{dest: string, mode: string|null, profile: string|null, noInstall: boolean, preserveConfig: boolean, force: boolean, dryRun: boolean}} Parsed args.
 */
function parseArgs() {
	const args = process.argv.slice(2);
	let dest;
	let usedDestFlag = false;
	let mode;
	let profile;
	let noInstall = false;
	let preserveConfig = true;
	let force = false;
	let dryRun = false;
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--dest' && args[i + 1]) {
			dest = args[i + 1];
			usedDestFlag = true;
		}
		if (args[i] === '--root' && args[i + 1]) dest = args[i + 1];
		if (args[i] === '--mode' && args[i + 1]) mode = args[i + 1];
		if (args[i] === '--profile' && args[i + 1]) profile = args[i + 1];
		if (args[i] === '--no-install') noInstall = true;
		if (args[i] === '--preserve-config') preserveConfig = true;
		if (args[i] === '--preserve=false') preserveConfig = false;
		if (args[i] === '--force') force = true;
		if (args[i] === '--dry-run') dryRun = true;
	}
	if (!dest) throw new Error('Missing --root <path> for target project');
	if (usedDestFlag) {
		console.warn('[brAInwav] --dest is deprecated; use --root instead.');
	}
	return { dest: path.resolve(dest), mode, profile, noInstall, preserveConfig, force, dryRun };
}

/**
 * Read JSON from disk.
 * @param {string} filePath - JSON file path.
 * @returns {Record<string, unknown>} Parsed JSON.
 */
function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Detect install mode from pointer.json.
 * @param {string} destRoot - Destination root.
 * @returns {string} Detected mode.
 */
function detectMode(destRoot) {
	const pointerPath = path.join(destRoot, '.agentic-governance', 'pointer.json');
	return fs.existsSync(pointerPath) ? 'pointer' : 'full';
}

/**
 * Read profile from existing config.
 * @param {string} destRoot - Destination root.
 * @returns {string|null} Profile value or null.
 */
function readExistingProfile(destRoot) {
	const configPath = path.join(destRoot, '.agentic-governance', 'config.json');
	if (!fs.existsSync(configPath)) return null;
	try {
		const config = readJson(configPath);
		return config?.profile ?? null;
	} catch {
		return null;
	}
}

/**
 * Normalize legacy profile names.
 * @param {string|null} profile - Profile name.
 * @returns {string|null} Normalized profile.
 */
function normalizeProfile(profile) {
	if (!profile) return profile;
	if (profile === 'full') return 'release';
	return profile;
}

/**
 * Read pointer package name from pointer.json.
 * @param {string} destRoot - Destination root.
 * @returns {string|null} Package name or null.
 */
function readPointerPackage(destRoot) {
	const pointerPath = path.join(destRoot, '.agentic-governance', 'pointer.json');
	if (!fs.existsSync(pointerPath)) return null;
	try {
		const pointer = readJson(pointerPath);
		return pointer?.package ?? null;
	} catch {
		return null;
	}
}

/**
 * Read existing pack list from packs.json.
 * @param {string} destRoot - Destination root.
 * @returns {string[]} Pack IDs.
 */
function readExistingPacks(destRoot) {
	const packsPath = path.join(destRoot, '.agentic-governance', 'packs.json');
	if (!fs.existsSync(packsPath)) return [];
	try {
		const data = readJson(packsPath);
		return Array.isArray(data?.packs) ? data.packs : [];
	} catch {
		return [];
	}
}

/**
 * Resolve current package version from repo.
 * @returns {string} Package version.
 */
function resolvePackageVersion() {
	const pkgPath = path.join(repoRoot, 'package.json');
	return readJson(pkgPath).version;
}

/**
 * Update package.json dependency version.
 * @param {string} destRoot - Destination root.
 * @param {string} packageName - Package name.
 * @param {string} version - Version specifier.
 * @returns {boolean} True if update succeeded.
 */
function updateDependency(destRoot, packageName, version) {
	const packagePath = path.join(destRoot, 'package.json');
	if (!fs.existsSync(packagePath)) {
		console.warn(`[brAInwav] package.json not found in ${destRoot}; skipping dependency update.`);
		return false;
	}
	const pkg = readJson(packagePath);
	pkg.devDependencies = pkg.devDependencies ?? {};
	pkg.devDependencies[packageName] = version;
	if (pkg.dependencies?.[packageName]) {
		delete pkg.dependencies[packageName];
	}
	fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
	return true;
}

/**
 * Invoke install routine with upgrade parameters.
 * @param {string} destRoot - Destination root.
 * @param {string} mode - Install mode.
 * @param {string} profile - Profile name.
 * @param {boolean} preserveConfig - Preserve config flag.
 * @param {boolean} force - Force file overwrite.
 * @param {boolean} dryRun - Dry run flag.
 * @param {boolean} forceConfig - Force config overwrite.
 * @param {string|null} configPath - Config path override.
 * @param {string[]} packs - Pack IDs.
 * @param {Record<string, unknown>} packOptions - Pack options.
 * @returns {Record<string, unknown>} Install result.
 */
function runInstall(destRoot, mode, profile, preserveConfig, force, dryRun, forceConfig, configPath, packs, packOptions) {
	return runGovernanceInstall({
		destRoot,
		mode,
		profile,
		profileWasProvided: Boolean(profile),
		preserveConfig,
		force,
		forceConfig,
		dryRun,
		configPath,
		packs,
		packOptions
	});
}

/**
 * Determine whether pnpm install should run.
 * @param {string} destRoot - Destination root.
 * @returns {boolean} True when pnpm should run.
 */
function shouldRunPnpm(destRoot) {
	const lockPath = path.join(destRoot, 'pnpm-lock.yaml');
	if (fs.existsSync(lockPath)) return true;
	const packagePath = path.join(destRoot, 'package.json');
	if (!fs.existsSync(packagePath)) return false;
	const pkg = readJson(packagePath);
	return typeof pkg.packageManager === 'string' && pkg.packageManager.startsWith('pnpm@');
}

/**
 * Run pnpm install in the target repo.
 * @param {string} destRoot - Destination root.
 * @param {boolean} silent - Silence output.
 * @returns {void} No return value.
 */
function runPnpmInstall(destRoot, silent) {
	const result = spawnSync('pnpm', ['install'], {
		cwd: destRoot,
		stdio: silent ? 'ignore' : 'inherit'
	});
	if (result.status !== 0) {
		throw new Error('pnpm install failed');
	}
}

/**
 * Upgrade governance in a target repository.
 * @param {object} options - Upgrade options.
 * @param {string} options.destRoot - Destination root.
 * @param {string|null} options.mode - Install mode override.
 * @param {string|null} options.profile - Profile override.
 * @param {boolean} options.preserveConfig - Preserve config flag.
 * @param {boolean} options.force - Force overwrite flag.
 * @param {boolean} options.dryRun - Dry run flag.
 * @param {boolean} options.noInstall - Skip pnpm install.
 * @param {boolean} options.silent - Silence output.
 * @param {string|null} options.configPath - Config path override.
 * @param {string[]} options.packs - Pack identifiers.
 * @param {Record<string, unknown>} options.packOptions - Pack options.
 * @returns {{actions: Array<object>, mode: string, profile: string, packageName: string, version: string, installRan: boolean}} Result summary.
 */
export function runGovernanceUpgrade({
	destRoot,
	mode,
	profile,
	preserveConfig,
	force,
	dryRun,
	noInstall = false,
	silent = false,
	configPath,
	packs,
	packOptions
}) {
	if (!fs.existsSync(destRoot)) throw new Error(`Destination does not exist: ${destRoot}`);
	const resolvedMode = mode ?? detectMode(destRoot);
	const existingProfile = readExistingProfile(destRoot);
	const resolvedProfile = normalizeProfile(profile) ?? existingProfile ?? 'release';
	const resolvedPacks = Array.isArray(packs) && packs.length > 0 ? packs : readExistingPacks(destRoot);
	const forceFiles = force;
	const forceConfig = force || !preserveConfig;
	const result = runInstall(
		destRoot,
		resolvedMode,
		resolvedProfile,
		preserveConfig,
		forceFiles,
		dryRun,
		forceConfig,
		configPath,
		resolvedPacks,
		packOptions
	);
	const packageName = readPointerPackage(destRoot) ?? '@brainwav/brainwav-agentic-governance';
	const version = resolvePackageVersion();
	if (!dryRun) {
		updateDependency(destRoot, packageName, version);
	}
	let installRan = false;
	if (!noInstall && !dryRun && shouldRunPnpm(destRoot)) {
		runPnpmInstall(destRoot, silent);
		installRan = true;
	}
	return { ...result, packageName, version, installRan };
}

/**
 * CLI entry point for governance upgrade.
 * @returns {void} No return value.
 */
function main() {
	try {
		const { dest: destRoot, mode, profile, noInstall, preserveConfig, force, dryRun } = parseArgs();
		const result = runGovernanceUpgrade({
			destRoot,
			mode,
			profile,
			preserveConfig,
			force,
			dryRun,
			noInstall
		});
		if (!dryRun) {
			console.log(`[brAInwav] Updated ${result.packageName} to ${result.version}.`);
		}
		if (!result.installRan && !noInstall && !dryRun) {
			console.log('[brAInwav] Skipping pnpm install (pnpm not detected).');
		}
		console.log('[brAInwav] governance upgrade complete.');
	} catch (error) {
		console.error(`[brAInwav] governance upgrade failed: ${error.message}`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('upgrade-governance.mjs')) {
	main();
}

export default main;
