#!/usr/bin/env node
/**
 * @fileoverview Governance CLI entrypoint.
 * @license Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { runGovernanceInstall } from './install-governance.mjs';
import { runGovernanceHashSync } from './sync-governance-hashes.mjs';
import { runGovernanceValidation } from './validate-governance.mjs';
import { runReadinessCheck } from './readiness-check.mjs';
import { runTaskEvidenceValidation } from './validate-task-evidence.mjs';
import { runGovernanceUpgrade } from './upgrade-governance.mjs';
import { resolvePacks, loadPackManifestFromRoot, PRESETS } from './pack-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

const COMMANDS = new Set(['init', 'install', 'upgrade', 'validate', 'doctor', 'packs']);
const COMMON_FLAGS = new Set(['--mode', '--profile', '--packs', '--dry-run', '--yes', '--force']);
const GLOBAL_FLAGS = new Set([
	'-h',
	'--help',
	'--version',
	'--root',
	'--config',
	'-q',
	'--quiet',
	'-v',
	'--verbose',
	'-d',
	'--debug',
	'--json',
	'--plain',
	'--no-color',
	'--no-input',
	'--report',
	'--output'
]);

const CHECK_REGISTRY = new Set([
	'policy.required_tokens',
	'policy.step_budget',
	'policy.config',
	'hash.drift',
	'evidence.task',
	'file.agents',
	'file.index',
	'file.charter',
	'file.workflow',
	'file.checklists',
	'tool.node',
	'tool.pnpm',
	'tool.rg',
	'tool.fd',
	'tool.jq',
	'tool.semgrep',
	'tool.gitleaks',
	'tool.trivy',
	'tool.cosign',
	'tool.osv-scanner',
	'tool.markdownlint-cli2',
	'pack.missing',
	'pack.present'
]);

const HIGH_RISK_ENTITLEMENTS = new Set([
	'com.apple.developer.networking.networkextension',
	'com.apple.developer.system-extension',
	'com.apple.developer.system-extension.install',
	'com.apple.security.cs.allow-unsigned-executable-memory',
	'com.apple.security.cs.disable-library-validation',
	'com.apple.security.device.audio-input',
	'com.apple.security.device.camera',
	'com.apple.security.network.server'
]);

/**
 * Print CLI usage information.
 * @returns {void} No return value.
 */
function usage() {
	console.log(`brainwav-governance

Initialize, install, upgrade, validate, and diagnose Brainwav governance in a repo.

Usage:
  brainwav-governance [global flags] <init|install|upgrade|validate|doctor> [flags]
  brainwav-governance packs list [--json]
`);
}

/**
 * Parse CLI arguments into command and flags.
 * @param {string[]} argv - CLI arguments.
 * @returns {Record<string, unknown>} Parsed arguments.
 */
function parseArgs(argv) {
	const args = [...argv];
	let command = null;
	const global = {
		root: '.',
		config: '.agentic-governance/config.json',
		quiet: false,
		verbose: false,
		debug: false,
		json: false,
		plain: false,
		noColor: false,
		noInput: false,
		report: null,
		output: null
	};
	const flags = {
		mode: 'pointer',
		modeProvided: false,
		profile: 'release',
		profileProvided: false,
		packs: [],
		dryRun: false,
		yes: false,
		force: false,
		strict: false,
		preserve: true
	};
	const unknown = [];
	let positionalOutput = null;

	function takeValue(i) {
		if (i + 1 >= args.length) return null;
		return args[i + 1];
	}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (!command && !arg.startsWith('-')) {
			command = arg;
			continue;
		}
		if (!command && (arg === '-h' || arg === '--help' || arg === '--version')) {
			return { command: arg, global, flags, unknown, positionalOutput };
		}
		if (GLOBAL_FLAGS.has(arg)) {
			switch (arg) {
				case '--root': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --root' };
					global.root = value;
					i++;
					break;
				}
				case '--config': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --config' };
					global.config = value;
					i++;
					break;
				}
				case '--report': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --report' };
					global.report = value;
					i++;
					break;
				}
				case '--output': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --output' };
					global.output = value;
					i++;
					break;
				}
				case '--json':
					global.json = true;
					break;
				case '--plain':
					global.plain = true;
					break;
				case '--no-color':
					global.noColor = true;
					break;
				case '--no-input':
					global.noInput = true;
					break;
				case '--quiet':
				case '-q':
					global.quiet = true;
					break;
				case '--verbose':
				case '-v':
					global.verbose = true;
					break;
				case '--debug':
				case '-d':
					global.debug = true;
					break;
				case '--help':
				case '-h':
					return { command: '--help', global, flags, unknown, positionalOutput };
				case '--version':
					return { command: '--version', global, flags, unknown, positionalOutput };
				default:
					break;
			}
			continue;
		}

		if (COMMON_FLAGS.has(arg) || arg === '--strict' || arg === '--preserve=false' || arg === '--preserve=true') {
			switch (arg) {
				case '--mode': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --mode' };
					flags.mode = value;
					flags.modeProvided = true;
					i++;
					break;
				}
				case '--profile': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --profile' };
					flags.profile = value;
					flags.profileProvided = true;
					i++;
					break;
				}
				case '--packs': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --packs' };
					flags.packs = value.split(',').map((p) => p.trim()).filter(Boolean);
					i++;
					break;
				}
				case '--dry-run':
					flags.dryRun = true;
					break;
				case '--yes':
					flags.yes = true;
					break;
				case '--force':
					flags.force = true;
					break;
				case '--strict':
					flags.strict = true;
					break;
				case '--preserve=false':
					flags.preserve = false;
					break;
				case '--preserve=true':
					flags.preserve = true;
					break;
				default:
					break;
			}
			continue;
		}

		if (!arg.startsWith('-') && !positionalOutput) {
			positionalOutput = arg;
			continue;
		}
		unknown.push(arg);
	}

	return { command, global, flags, unknown, positionalOutput };
}

/**
 * Resolve a value against a root path.
 * @param {string} rootPath - Root directory.
 * @param {string|null} value - Path value.
 * @returns {string|null} Resolved path.
 */
function resolvePathForRoot(rootPath, value) {
	if (!value) return null;
	return path.isAbsolute(value) ? value : path.resolve(rootPath, value);
}

/**
 * Build report output path based on target.
 * @param {string|null} target - Target path or directory.
 * @param {string} command - Command name.
 * @param {boolean} dryRun - Whether this is a dry run.
 * @returns {string|null} Report path.
 */
function buildReportPath(target, command, dryRun) {
	if (!target) return null;
	const resolved = path.resolve(target);
	const isDir = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
	if (!isDir) return resolved;
	if (command === 'validate') return path.join(resolved, 'validate.report.json');
	if (command === 'doctor') return path.join(resolved, 'doctor.report.json');
	if (command === 'upgrade') {
		return path.join(resolved, dryRun ? 'upgrade.plan.json' : 'upgrade.applied.json');
	}
	return path.join(resolved, `${command}.report.json`);
}

/**
 * Return current time as ISO-8601 string.
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date().toISOString();
}

/**
 * Build report metadata payload.
 * @param {Record<string, unknown>} inputs - Input metadata.
 * @returns {Record<string, unknown>} Meta object.
 */
function buildMeta(inputs) {
	return {
		tool: 'brainwav-governance',
		version: pkg.version,
		timestamp: nowIso(),
		inputs
	};
}

/**
 * Collect pack IDs from a packs root.
 * @param {string} packsRoot - Packs directory root.
 * @param {Set<string>} ids - Set to populate.
 * @returns {void}
 */
function collectPackIds(packsRoot, ids) {
	if (!packsRoot || !fs.existsSync(packsRoot)) return;
	const entries = fs.readdirSync(packsRoot, { withFileTypes: true });
	entries.forEach((entry) => {
		if (entry.isDirectory()) {
			ids.add(entry.name);
			return;
		}
		if (entry.isFile() && entry.name.endsWith('.pack.yaml')) {
			ids.add(entry.name.replace('.pack.yaml', ''));
		}
	});
}

/**
 * List available pack IDs from package + local sources.
 * @param {string} rootPath - Repo root.
 * @returns {string[]} Sorted pack IDs.
 */
function listAvailablePackIds(rootPath) {
	const ids = new Set();
	const packagePacksRoot = path.join(repoRoot, 'brainwav', 'governance-pack', 'packs');
	collectPackIds(packagePacksRoot, ids);
	const localPacksRoot = path.join(rootPath, '.agentic-governance', 'packs');
	collectPackIds(localPacksRoot, ids);
	const vendorRoot = path.join(rootPath, '.agentic-governance', 'vendor');
	if (fs.existsSync(vendorRoot)) {
		const versions = fs.readdirSync(vendorRoot, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);
		versions.forEach((version) => {
			const vendorPacksRoot = path.join(vendorRoot, version, 'governance-pack', 'packs');
			collectPackIds(vendorPacksRoot, ids);
		});
	}
	return Array.from(ids).sort((a, b) => a.localeCompare(b));
}

/**
 * Build a normalized pack summary.
 * @param {object|null} manifest - Pack manifest.
 * @param {string} packId - Pack identifier.
 * @returns {Record<string, unknown>} Summary payload.
 */
function buildPackSummary(manifest, packId) {
	if (!manifest) {
		return {
			id: packId,
			missing: true
		};
	}
	return {
		id: manifest.id,
		description: manifest.description ?? '',
		depends_on: manifest.depends_on ?? [],
		runner: manifest.ci?.runner ?? 'ubuntu-latest',
		inputs: {
			required: Array.isArray(manifest.inputs?.required) ? manifest.inputs.required : [],
			optional: manifest.inputs?.optional ?? {}
		},
		checks: {
			validate: Array.isArray(manifest.checks?.validate)
				? manifest.checks.validate.map((entry) => entry?.id ?? entry)
				: [],
			doctor: Array.isArray(manifest.checks?.doctor)
				? manifest.checks.doctor.map((entry) => entry?.id ?? entry)
				: []
		}
	};
}

/**
 * Write JSON report to disk.
 * @param {string|null} pathTarget - Target file path.
 * @param {Record<string, unknown>} report - Report data.
 * @returns {void} No return value.
 */
function writeReport(pathTarget, report) {
	if (!pathTarget) return;
	fs.mkdirSync(path.dirname(pathTarget), { recursive: true });
	fs.writeFileSync(pathTarget, `${JSON.stringify(report, null, 2)}\n`);
}

/**
 * Validate checks against the registry.
 * @param {Array<{id: string}>} checks - Check results.
 * @returns {Array<{id: string}>} Unknown checks.
 */
function checkRegistry(checks) {
	const unknown = checks.filter((check) => {
		if (CHECK_REGISTRY.has(check.id)) return false;
		if (check.id.startsWith('pack:')) return false;
		return true;
	});
	return unknown;
}

/**
 * Build a summary line for checks.
 * @param {Array<{status: string}>} checks - Check results.
 * @param {string} status - Overall status.
 * @returns {string} Summary string.
 */
function formatSummary(checks, status) {
	const total = checks.length;
	const failed = checks.filter((c) => c.status === 'fail').length;
	const warned = checks.filter((c) => c.status === 'warn').length;
	return `${status}: ${total} checks, ${failed} failed, ${warned} warnings`;
}

/**
 * Set process exit code.
 * @param {number} code - Exit code.
 * @returns {void} No return value.
 */
function exitWithCode(code) {
	process.exitCode = code;
}

/**
 * Detect unknown keys in config.
 * @param {string|null} configPath - Config path.
 * @returns {string[]} Warning messages.
 */
function parseConfigWarnings(configPath) {
	if (!configPath || !fs.existsSync(configPath)) return [];
	try {
		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		const allowed = new Set([
			'$schema',
			'version',
			'mode',
			'profile',
			'packs',
			'packOptions',
			'identity',
			'overlays',
			'mergeStrategy'
		]);
		const unknown = Object.keys(config).filter((key) => !allowed.has(key));
		return unknown.map((key) => `unknown config key: ${key}`);
	} catch (error) {
		return [`config parse error: ${error.message}`];
	}
}

/**
 * Read profile from config if present.
 * @param {string|null} configPath - Config path.
 * @returns {string|null} Profile value or null.
 */
function readConfigProfile(configPath) {
	if (!configPath || !fs.existsSync(configPath)) return null;
	try {
		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		return typeof config?.profile === 'string' ? config.profile : null;
	} catch {
		return null;
	}
}

/**
 * Resolve config path relative to root.
 * @param {string} rootPath - Root directory.
 * @param {string|null} configArg - Config path arg.
 * @returns {string|null} Resolved config path.
 */
function resolveConfigPath(rootPath, configArg) {
	return resolvePathForRoot(rootPath, configArg);
}

/**
 * Build a check result object.
 * @param {string} id - Check ID.
 * @param {string} status - Check status.
 * @param {string} severity - Severity label.
 * @param {string} category - Category label.
 * @param {string} message - Check message.
 * @returns {{id: string, severity: string, category: string, status: string, message: string}} Check object.
 */
function buildCheck(id, status, severity, category, message) {
	return {
		id,
		severity,
		category,
		status,
		message
	};
}

/**
 * Read installed packs from config or packs.json.
 * @param {string} rootPath - Repo root.
 * @param {string|null} configPath - Config path.
 * @returns {{packs: string[], source: string|null, packOptions: Record<string, unknown>}} Pack info.
 */
function readInstalledPacks(rootPath, configPath) {
	if (configPath && fs.existsSync(configPath)) {
		try {
			const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
			if (Array.isArray(config?.packs)) {
				return { packs: config.packs, source: configPath, packOptions: config.packOptions ?? {} };
			}
		} catch {
			// fall through
		}
	}
	const packsPath = path.join(rootPath, '.agentic-governance', 'packs.json');
	if (!fs.existsSync(packsPath)) return { packs: [], source: null };
	try {
		const data = JSON.parse(fs.readFileSync(packsPath, 'utf8'));
		return { packs: Array.isArray(data?.packs) ? data.packs : [], source: packsPath, packOptions: {} };
	} catch {
		return { packs: [], source: packsPath, packOptions: {} };
	}
}

/**
 * Load pack manifests for a consumer repo.
 * @param {string} rootPath - Repo root.
 * @param {string[]} packIds - Pack identifiers.
 * @returns {{manifests: object[], missing: string[]}} Manifests and missing IDs.
 */
function loadPackManifestsForRoot(rootPath, packIds) {
	const manifests = [];
	const missing = [];
	packIds.forEach((packId) => {
		const manifest = loadPackManifestFromRoot(rootPath, packId);
		if (!manifest) {
			missing.push(packId);
			return;
		}
		manifests.push(manifest);
	});
	return { manifests, missing };
}

/**
 * Read pack options from config.
 * @param {string|null} configPath - Config path.
 * @param {Record<string, unknown>} fallback - Fallback options.
 * @returns {Record<string, unknown>} Pack options.
 */
function getPackOptions(configPath, fallback = {}) {
	if (!configPath || !fs.existsSync(configPath)) return fallback;
	try {
		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		return config?.packOptions ?? fallback;
	} catch {
		return fallback;
	}
}

/**
 * Read package.json from a repo root.
 * @param {string} rootPath - Repo root.
 * @returns {Record<string, unknown>|null} Parsed package.json or null.
 */
function readPackageJson(rootPath) {
	const pkgPath = path.join(rootPath, 'package.json');
	if (!fs.existsSync(pkgPath)) return null;
	try {
		return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	} catch {
		return null;
	}
}

/**
 * Normalize pack check entries to objects.
 * @param {Array<string|Record<string, unknown>>} entries - Check entries.
 * @returns {Array<{id: string, severity?: string, category?: string, message?: string}>} Normalized checks.
 */
function normalizePackChecks(entries) {
	if (!Array.isArray(entries)) return [];
	return entries
		.map((entry) => (typeof entry === 'string' ? { id: entry } : entry))
		.filter((entry) => entry && typeof entry.id === 'string');
}

/**
 * Build a pack check identifier.
 * @param {string} packId - Pack identifier.
 * @param {string} checkId - Check identifier.
 * @returns {string} Composite check ID.
 */
function buildPackCheckId(packId, checkId) {
	return `pack:${packId}:${checkId}`;
}

/**
 * Resolve status for missing input based on profile.
 * @param {string} profile - Profile name.
 * @param {boolean} required - Whether input is required.
 * @returns {string} Status value.
 */
function statusForMissing(profile, required) {
	if (required) {
		return profile === 'delivery' || profile === 'release' ? 'fail' : 'warn';
	}
	return profile === 'release' ? 'fail' : 'warn';
}

/**
 * Collect missing pack inputs and build checks.
 * @param {{rootPath: string, manifests: object[], packOptions: Record<string, unknown>, profile: string}} args - Inputs.
 * @returns {{checks: Array<object>, missingRequired: Array<{packId: string, requirement: string}>}} Result.
 */
function collectMissingPackInputs({ rootPath, manifests, packOptions, profile }) {
	const checks = [];
	const missingRequired = [];
	const pkg = readPackageJson(rootPath);

	manifests.forEach((manifest) => {
		const options = resolvePackOptionsForPack(packOptions, manifest.id);
		const required = Array.isArray(manifest.inputs?.required) ? manifest.inputs.required : [];
		required.forEach((req) => {
			const tokens = String(req).split('|').map((token) => token.trim()).filter(Boolean);
			const satisfied = tokens.some((token) => {
				const [scope, key] = token.split('.');
				if (!scope || !key) return Boolean(options[token]);
				const value = options?.[scope]?.[key];
				return value !== undefined && value !== null && value !== '';
			});
			if (!satisfied) {
				missingRequired.push({ packId: manifest.id, requirement: req });
				checks.push(
					buildCheck(
						buildPackCheckId(manifest.id, 'inputs.required'),
						statusForMissing(profile, true),
						'high',
						'pack',
						`missing required input: ${req}`
					)
				);
			}
		});

		const optional = manifest.inputs?.optional ?? {};
		Object.entries(optional).forEach(([key, defaultScript]) => {
			const optionValue = getOptionValue(options, key);
			if (optionValue !== undefined && optionValue !== null && optionValue !== '') {
				checks.push(
					buildCheck(
						buildPackCheckId(manifest.id, `inputs.${key}`),
						'pass',
						'info',
						'pack',
						`optional input "${key}" provided`
					)
				);
				return;
			}
			const [scope, scriptKey] = key.split('.');
			if (scope === 'scripts' && pkg?.scripts?.[scriptKey]) {
				checks.push(
					buildCheck(
						buildPackCheckId(manifest.id, `inputs.${scriptKey}`),
						'pass',
						'info',
						'pack',
						`script "${scriptKey}" detected in package.json`
					)
				);
				return;
			}
			if (defaultScript && pkg?.scripts?.[defaultScript]) {
				checks.push(
					buildCheck(
						buildPackCheckId(manifest.id, `inputs.${defaultScript}`),
						'pass',
						'info',
						'pack',
						`script "${defaultScript}" detected in package.json`
					)
				);
				return;
			}
			checks.push(
				buildCheck(
					buildPackCheckId(manifest.id, `inputs.${key}`),
					statusForMissing(profile, false),
					'low',
					'pack',
					`optional input missing: ${key}`
				)
			);
		});
	});

	return { checks, missingRequired };
}

/**
 * Resolve fail or warn status based on profile.
 * @param {string} profile - Profile name.
 * @returns {string} Status value.
 */
function statusFromProfile(profile) {
	return profile === 'delivery' || profile === 'release' ? 'fail' : 'warn';
}

/**
 * Resolve fail or warn status with release-only enforcement.
 * @param {string} profile - Profile name.
 * @returns {string} Status value.
 */
function statusFromRelease(profile) {
	return profile === 'release' ? 'fail' : 'warn';
}

/**
 * Normalize a value into a string array.
 * @param {string|string[]|undefined|null} value - Candidate value.
 * @returns {string[]} Normalized list.
 */
function normalizeStringList(value) {
	if (!value) return [];
	if (Array.isArray(value)) return value.filter(Boolean);
	return [String(value)];
}

/**
 * Read text content from a path if present.
 * @param {string|null} filePath - File path.
 * @returns {string|null} File contents or null.
 */
function readTextFile(filePath) {
	if (!filePath) return null;
	try {
		return fs.readFileSync(filePath, 'utf8');
	} catch {
		return null;
	}
}

/**
 * Resolve pack options with legacy fallbacks.
 * @param {Record<string, unknown>} packOptions - Pack options map.
 * @param {string} packId - Pack identifier.
 * @returns {Record<string, unknown>} Resolved options.
 */
function resolvePackOptionsForPack(packOptions, packId) {
	const direct = packOptions?.[packId];
	if (direct && typeof direct === 'object') return direct;
	if (packId === 'swift-xcode' && packOptions?.['swift-appkit']) return packOptions['swift-appkit'];
	return {};
}

/**
 * Resolve a candidate path against a root.
 * @param {string} rootPath - Repo root.
 * @param {string|null} candidate - Path candidate.
 * @returns {string|null} Resolved path.
 */
function resolveRootPath(rootPath, candidate) {
	if (!candidate) return null;
	return path.isAbsolute(candidate) ? candidate : path.join(rootPath, candidate);
}

/**
 * Evaluate a concrete pack check.
 * @param {{rootPath: string, manifest: object, entry: object, packOptions: Record<string, unknown>, profile: string}} args - Inputs.
 * @returns {{status: string, message: string}} Evaluation result.
 */
function evaluatePackCheck({ rootPath, manifest, entry, packOptions, profile }) {
	const packId = manifest.id;
	const options = resolvePackOptionsForPack(packOptions, packId);
	const checkId = entry.id;

	if (packId === 'swift-core' && checkId === 'swift-format-config') {
		const configPath = path.join(rootPath, '.swift-format');
		if (fs.existsSync(configPath)) {
			return { status: 'pass', message: '.swift-format present' };
		}
		return {
			status: statusFromProfile(profile),
			message: 'missing .swift-format at repo root'
		};
	}

	if (packId === 'swift-core' && checkId === 'swiftlint-config') {
		const configPath = path.join(rootPath, '.swiftlint.yml');
		if (fs.existsSync(configPath)) {
			return { status: 'pass', message: '.swiftlint.yml present' };
		}
		return {
			status: statusFromProfile(profile),
			message: 'missing .swiftlint.yml at repo root'
		};
	}

	if (packId === 'swift-spm' && checkId === 'package-swift') {
		const manifestPath = resolveRootPath(rootPath, options?.spm?.manifest ?? 'Package.swift');
		if (manifestPath && fs.existsSync(manifestPath)) {
			return { status: 'pass', message: 'Package.swift present' };
		}
		return {
			status: statusFromProfile(profile),
			message: 'missing Package.swift for swift-spm pack'
		};
	}

	if (packId === 'swift-spm' && checkId === 'package-resolved') {
		const resolvedPath = resolveRootPath(rootPath, options?.spm?.resolved ?? 'Package.resolved');
		if (resolvedPath && fs.existsSync(resolvedPath)) {
			return { status: 'pass', message: 'Package.resolved present' };
		}
		return {
			status: statusFromRelease(profile),
			message: 'missing Package.resolved for swift-spm pack'
		};
	}

	if (packId === 'ts-base' && checkId === 'tsconfig') {
		const tsconfig = path.join(rootPath, 'tsconfig.json');
		const tsconfigBase = path.join(rootPath, 'tsconfig.base.json');
		const hasConfig = fs.existsSync(tsconfig) || fs.existsSync(tsconfigBase);
		if (hasConfig) {
			return { status: 'pass', message: 'tsconfig present' };
		}
		return {
			status: statusFromProfile(profile),
			message: 'missing tsconfig.json or tsconfig.base.json'
		};
	}

	if (packId === 'ts-base' && checkId === 'typescript-dependency') {
		const pkg = readPackageJson(rootPath);
		const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
		const hasTypescript = Boolean(deps.typescript);
		if (hasTypescript) {
			return { status: 'pass', message: 'typescript dependency present' };
		}
		return {
			status: statusFromProfile(profile),
			message: 'missing typescript dependency in package.json'
		};
	}

	if ((packId === 'swift-xcode' || packId === 'swift-appkit') && checkId === 'xcode-project') {
		const project = options?.xcode?.project;
		const workspace = options?.xcode?.workspace;
		const target = project || workspace;
		if (!target) {
			return {
				status: statusFromProfile(profile),
				message: 'missing xcode project/workspace config'
			};
		}
		const resolved = resolveRootPath(rootPath, target);
		if (!resolved || !fs.existsSync(resolved)) {
			return {
				status: statusFromProfile(profile),
				message: `xcode project/workspace not found: ${target}`
			};
		}
		const ext = path.extname(resolved);
		if (!['.xcodeproj', '.xcworkspace'].includes(ext)) {
			return {
				status: statusFromProfile(profile),
				message: `xcode path must be .xcodeproj or .xcworkspace (got ${ext || 'unknown'})`
			};
		}
		return { status: 'pass', message: 'xcode project/workspace resolved' };
	}

	if ((packId === 'swift-xcode' || packId === 'swift-appkit') && checkId === 'xcode-scheme') {
		if (options?.xcode?.scheme) {
			return { status: 'pass', message: 'xcode scheme configured' };
		}
		return {
			status: statusFromProfile(profile),
			message: 'missing xcode scheme config'
		};
	}

	if ((packId === 'swift-xcode' || packId === 'swift-appkit') && checkId === 'xcode-destination') {
		if (options?.xcode?.destination) {
			return { status: 'pass', message: 'xcode destination configured' };
		}
		return {
			status: statusFromProfile(profile),
			message: 'missing xcode destination config'
		};
	}

	if (packId === 'swift-appkit' && checkId === 'entitlements') {
		const entitlementsPaths = normalizeStringList(options?.entitlements?.paths ?? options?.entitlements?.path);
		if (entitlementsPaths.length === 0) {
			return {
				status: statusFromRelease(profile),
				message: 'missing entitlements paths in packOptions.swift-appkit.entitlements'
			};
		}
		const resolvedPaths = entitlementsPaths.map((entry) => resolveRootPath(rootPath, entry));
		const missing = resolvedPaths.filter((entry) => !entry || !fs.existsSync(entry));
		if (missing.length > 0) {
			return {
				status: statusFromRelease(profile),
				message: `entitlements file(s) not found: ${missing.join(', ')}`
			};
		}
		const allowlist = new Set(
			normalizeStringList(options?.entitlements?.highRiskAllowlist).concat(Array.from(HIGH_RISK_ENTITLEMENTS))
		);
		const highRiskHits = [];
		resolvedPaths.forEach((entry) => {
			const content = readTextFile(entry) ?? '';
			allowlist.forEach((key) => {
				if (content.includes(key)) highRiskHits.push(key);
			});
		});
		if (highRiskHits.length > 0) {
			const justification = options?.entitlements?.justification;
			const justificationPath = resolveRootPath(rootPath, justification);
			if (!justification || !justificationPath || !fs.existsSync(justificationPath)) {
				return {
					status: statusFromRelease(profile),
					message: `high-risk entitlements require justification file (found: ${[...new Set(highRiskHits)].join(', ')})`
				};
			}
		}
		return { status: 'pass', message: 'entitlements declared' };
	}

	if (packId === 'swift-appkit' && checkId === 'privacy-usage') {
		const plistPaths = normalizeStringList(options?.privacy?.plists ?? options?.privacy?.plist);
		const requiredKeys = normalizeStringList(options?.privacy?.requiredKeys ?? options?.privacy?.keys);
		if (plistPaths.length === 0) {
			return {
				status: statusFromRelease(profile),
				message: 'missing privacy plist paths in packOptions.swift-appkit.privacy'
			};
		}
		if (requiredKeys.length === 0) {
			return {
				status: statusFromRelease(profile),
				message: 'missing privacy.requiredKeys in packOptions.swift-appkit.privacy'
			};
		}
		const resolvedPlists = plistPaths.map((entry) => resolveRootPath(rootPath, entry));
		const missingPlists = resolvedPlists.filter((entry) => !entry || !fs.existsSync(entry));
		if (missingPlists.length > 0) {
			return {
				status: statusFromRelease(profile),
				message: `privacy plist(s) not found: ${missingPlists.join(', ')}`
			};
		}
		const contents = resolvedPlists.map((entry) => readTextFile(entry) ?? '');
		const missingKeys = requiredKeys.filter((key) => !contents.some((text) => text.includes(`<key>${key}</key>`)));
		if (missingKeys.length > 0) {
			return {
				status: statusFromRelease(profile),
				message: `missing privacy usage keys: ${missingKeys.join(', ')}`
			};
		}
		return { status: 'pass', message: 'privacy usage descriptions declared' };
	}

	if (packId === 'apple-release' && checkId === 'release-codesign') {
		const codesignPath = resolveRootPath(rootPath, options?.evidence?.codesignLog ?? options?.codesignLog);
		if (codesignPath && fs.existsSync(codesignPath)) {
			return { status: 'pass', message: 'codesign evidence present' };
		}
		return {
			status: statusFromRelease(profile),
			message: 'missing codesign evidence log'
		};
	}

	if (packId === 'apple-release' && checkId === 'release-notarization') {
		const notarizationPath = resolveRootPath(rootPath, options?.evidence?.notarizationLog ?? options?.notarizationLog);
		if (notarizationPath && fs.existsSync(notarizationPath)) {
			return { status: 'pass', message: 'notarization evidence present' };
		}
		return {
			status: statusFromRelease(profile),
			message: 'missing notarization evidence log'
		};
	}

	return {
		status: 'pass',
		message: entry.message ?? `pack check ok: ${checkId}`
	};
}

/**
 * Set a pack option at a nested key path.
 * @param {Record<string, unknown>} packOptions - Pack options.
 * @param {string} packId - Pack identifier.
 * @param {string} keyPath - Dot-separated key path.
 * @param {string} value - Value to set.
 * @returns {void} No return value.
 */
function setPackOption(packOptions, packId, keyPath, value) {
	if (!packOptions[packId]) packOptions[packId] = {};
	const segments = keyPath.split('.');
	if (segments.length === 1) {
		packOptions[packId][segments[0]] = value;
		return;
	}
	let cursor = packOptions[packId];
	for (let i = 0; i < segments.length - 1; i++) {
		const key = segments[i];
		if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
		cursor = cursor[key];
	}
	cursor[segments[segments.length - 1]] = value;
}

/**
 * Read a nested option value by key path.
 * @param {Record<string, unknown>} options - Pack options.
 * @param {string} keyPath - Dot-separated key path.
 * @returns {unknown} Option value.
 */
function getOptionValue(options, keyPath) {
	if (!options || typeof options !== 'object') return undefined;
	const segments = keyPath.split('.');
	let cursor = options;
	for (const segment of segments) {
		if (!cursor || typeof cursor !== 'object') return undefined;
		cursor = cursor[segment];
	}
	return cursor;
}

/**
 * Prompt interactively for missing pack inputs.
 * @param {Array<{packId: string, requirement: string}>} missingRequired - Missing requirements.
 * @param {Record<string, unknown>} packOptions - Pack options.
 * @returns {Promise<void>} Resolves when prompting is complete.
 */
async function promptForMissingInputs(missingRequired, packOptions) {
	if (missingRequired.length === 0) return;
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		for (const missing of missingRequired) {
			const tokens = String(missing.requirement)
				.split('|')
				.map((token) => token.trim())
				.filter(Boolean);
			const prompt =
				tokens.length > 1
					? `Enter value for ${missing.packId} (${tokens.join(' | ')}) [key=value]: `
					: `Enter value for ${missing.packId} (${missing.requirement}): `;
			const answer = (await rl.question(prompt)).trim();
			if (!answer) continue;
			if (answer.includes('=') && tokens.length > 1) {
				const [key, value] = answer.split('=');
				if (key && value) {
					setPackOption(packOptions, missing.packId, key.trim(), value.trim());
					continue;
				}
			}
			const targetKey = tokens[0];
			setPackOption(packOptions, missing.packId, targetKey, answer);
		}
	} finally {
		rl.close();
	}
}

function normalizeChecks(checks) {
	return checks.map((check) => ({
		...check,
		status: check.status ?? 'pass'
	}));
}

function applyWarningsToChecks(checks, warnings, id, category) {
	if (warnings.length === 0) return;
	checks.push(
		buildCheck(
			id,
			'warn',
			'low',
			category,
			warnings.join('; ')
		)
	);
}

/**
 * Output a report to stdout based on flags.
 * @param {Record<string, unknown>} report - Report data.
 * @param {Record<string, unknown>} global - Global flags.
 * @returns {void} No return value.
 */
function outputReport(report, global) {
	if (global.json) {
		console.log(JSON.stringify(report, null, 2));
		return;
	}
	if (global.quiet) return;
	console.log(report.summary);
}

/**
 * Set exit code based on status and warnings.
 * @param {string} status - Overall status.
 * @param {number} warnings - Warning count.
 * @param {boolean} strict - Whether to treat warnings as failures.
 * @param {number} failureCode - Failure exit code.
 * @param {number} warningCode - Warning exit code.
 * @returns {void} No return value.
 */
function enforceExitCode(status, warnings, strict, failureCode, warningCode) {
	if (status === 'error') {
		exitWithCode(failureCode);
		return;
	}
	if (warnings > 0) {
		exitWithCode(strict ? failureCode : warningCode);
		return;
	}
	exitWithCode(0);
}

/**
 * Validate CLI command and flags.
 * @param {string} command - Command name.
 * @param {Record<string, unknown>} flags - Flag values.
 * @returns {string|null} Error message or null.
 */
function validateInputs(command, flags) {
	if (!COMMANDS.has(command)) return `Unknown command "${command}"`;
	if (flags.mode && !['pointer', 'full'].includes(flags.mode)) return 'Invalid --mode';
	if (flags.profile && !['creative', 'core', 'delivery', 'release', 'full'].includes(flags.profile)) {
		return 'Invalid --profile';
	}
	try {
		resolvePacks(flags.packs);
	} catch (error) {
		return error.message;
	}
	return null;
}

/**
 * Normalize legacy profile names to current equivalents.
 * @param {string} profile - Profile name.
 * @returns {{profile: string, warned: boolean}} Normalized profile.
 */
function normalizeProfile(profile) {
	if (profile === 'full') return { profile: 'release', warned: true };
	if (profile === 'core') return { profile: 'delivery', warned: true };
	return { profile, warned: false };
}

/**
 * CLI entry point for governance commands.
 * @returns {Promise<void>} Resolves when done.
 */
async function main() {
	const parsed = parseArgs(process.argv.slice(2));
	if (parsed.error) {
		console.error(`[brAInwav] ${parsed.error}`);
		exitWithCode(2);
		return;
	}
	if (parsed.command === '--help' || !parsed.command) {
		usage();
		exitWithCode(parsed.command ? 0 : 2);
		return;
	}
	if (parsed.command === '--version') {
		console.log(pkg.version);
		exitWithCode(0);
		return;
	}

	const { command, global, flags, unknown, positionalOutput } = parsed;
	const validationError = validateInputs(command, flags);
	if (validationError) {
		console.error(`[brAInwav] ${validationError}`);
		exitWithCode(2);
		return;
	}
	if (unknown.length > 0) {
		console.error(`[brAInwav] Unknown arguments: ${unknown.join(' ')}`);
		exitWithCode(2);
		return;
	}

	const rootPath = path.resolve(global.root);
	const configPath = resolveConfigPath(rootPath, global.config);
	const reportPath = buildReportPath(global.report, command, flags.dryRun);
	const outputPath = buildReportPath(global.output ?? positionalOutput, command, flags.dryRun);
	const configProfile = flags.profileProvided ? null : readConfigProfile(configPath);
	const requestedProfile = flags.profileProvided ? flags.profile : (configProfile ?? flags.profile);
	const normalized = normalizeProfile(requestedProfile);
	if (normalized.warned) {
		console.warn(`[brAInwav] profile "${requestedProfile}" is legacy; using "${normalized.profile}".`);
	}
	const normalizedProfile = normalized.profile;

	if (!fs.existsSync(rootPath)) {
		console.error(`[brAInwav] root path does not exist: ${rootPath}`);
		exitWithCode(2);
		return;
	}

	if (global.noInput && (!command || !COMMANDS.has(command))) {
		exitWithCode(2);
		return;
	}

	if (command === 'packs') {
		const subcommand = positionalOutput ?? 'list';
		if (subcommand !== 'list') {
			console.error(`[brAInwav] Unknown packs subcommand "${subcommand}".`);
			exitWithCode(2);
			return;
		}
		const packIds = listAvailablePackIds(rootPath);
		const packs = packIds.map((packId) => buildPackSummary(loadPackManifestFromRoot(rootPath, packId), packId));
		const report = {
			schema: 'brainwav.governance.packs.v1',
			meta: buildMeta({ root: rootPath }),
			data: {
				packs,
				presets: PRESETS
			}
		};
		if (global.json) {
			console.log(JSON.stringify(report, null, 2));
		} else if (!global.quiet) {
			console.log('Packs:');
			packs.forEach((pack) => {
				const depends = pack.depends_on?.length ? pack.depends_on.join(', ') : '-';
				const required = pack.inputs?.required?.length ? pack.inputs.required.join(', ') : '-';
				const runner = pack.runner ?? '-';
				console.log(`- ${pack.id} | runner: ${runner} | depends: ${depends} | required: ${required}`);
			});
			console.log('Presets:');
			Object.entries(PRESETS).forEach(([presetId, presetPacks]) => {
				console.log(`- preset:${presetId}: ${presetPacks.join(', ')}`);
			});
		}
		if (global.output) {
			writeReport(outputPath, report);
		}
		exitWithCode(0);
		return;
	}

	if (command === 'install' || command === 'init') {
		const selectedPacks = resolvePacks(flags.packs);
		const packOptions = getPackOptions(configPath, {});
		const { manifests, missing } = loadPackManifestsForRoot(rootPath, selectedPacks);
		if (missing.length > 0) {
			console.error(`[brAInwav] Unknown packs: ${missing.join(', ')}`);
			exitWithCode(2);
			return;
		}
			const inputResult = collectMissingPackInputs({
				rootPath,
				manifests,
				packOptions,
				profile: normalizedProfile
			});
		if (global.noInput && inputResult.missingRequired.length > 0) {
			console.error('[brAInwav] missing required pack inputs and --no-input is set.');
			exitWithCode(2);
			return;
		}
		await promptForMissingInputs(inputResult.missingRequired, packOptions);
			const inputs = {
				root: rootPath,
				mode: flags.mode,
				profile: normalizedProfile,
				packs: selectedPacks,
				dry_run: flags.dryRun,
				force: flags.force
			};
		const report = {
			schema: `brainwav.governance.${command}.v1`,
			meta: buildMeta(inputs),
			summary: '',
			status: 'success',
			data: {
				repo_root: rootPath,
				actions: []
			},
			errors: []
		};
		try {
				const result = runGovernanceInstall({
					destRoot: rootPath,
					mode: flags.mode,
					profile: normalizedProfile,
					profileWasProvided: flags.profileProvided,
					preserveConfig: flags.preserve,
				force: flags.force,
				forceConfig: flags.force,
				dryRun: flags.dryRun,
				configPath,
				packs: selectedPacks,
				packOptions
			});
			report.data.actions = result.actions;
			report.summary = `${command} completed (${result.actions.length} actions)`;
			outputReport(report, global);
			writeReport(reportPath, report);
			writeReport(outputPath, report);
			exitWithCode(0);
		} catch (error) {
			report.status = 'error';
			report.errors.push(String(error.message ?? error));
			report.summary = `${command} failed`;
			outputReport(report, global);
			writeReport(reportPath, report);
			writeReport(outputPath, report);
			exitWithCode(1);
		}
		return;
	}

	if (command === 'upgrade') {
		const selectedPacks = resolvePacks(flags.packs);
		const packOptions = getPackOptions(configPath, {});
		const { manifests, missing } = loadPackManifestsForRoot(rootPath, selectedPacks);
		if (missing.length > 0 && selectedPacks.length > 0) {
			console.error(`[brAInwav] Unknown packs: ${missing.join(', ')}`);
			exitWithCode(2);
			return;
		}
			const inputResult = collectMissingPackInputs({
				rootPath,
				manifests,
				packOptions,
				profile: normalizedProfile
			});
		if (global.noInput && inputResult.missingRequired.length > 0) {
			console.error('[brAInwav] missing required pack inputs and --no-input is set.');
			exitWithCode(2);
			return;
		}
		await promptForMissingInputs(inputResult.missingRequired, packOptions);
			const inputs = {
				root: rootPath,
				mode: flags.mode,
				profile: normalizedProfile,
				packs: selectedPacks,
				dry_run: flags.dryRun,
				force: flags.force,
				preserve: flags.preserve
			};
		const report = {
			schema: 'brainwav.governance.upgrade.v1',
			meta: buildMeta(inputs),
			summary: '',
			status: 'success',
			data: {
				repo_root: rootPath,
				actions: []
			},
			errors: []
		};
		try {
				const result = runGovernanceUpgrade({
					destRoot: rootPath,
					mode: flags.modeProvided ? flags.mode : null,
					profile: flags.profileProvided ? normalizedProfile : null,
					preserveConfig: flags.preserve,
				force: flags.force,
				dryRun: flags.dryRun,
				noInstall: false,
				silent: global.json || global.quiet,
				configPath,
				packs: selectedPacks,
				packOptions
			});
			report.data.actions = result.actions ?? [];
			report.summary = `upgrade completed (${report.data.actions.length} actions)`;
			outputReport(report, global);
			writeReport(reportPath, report);
			writeReport(outputPath, report);
			exitWithCode(0);
		} catch (error) {
			report.status = 'error';
			report.errors.push(String(error.message ?? error));
			report.summary = 'upgrade failed';
			outputReport(report, global);
			writeReport(reportPath, report);
			writeReport(outputPath, report);
			exitWithCode(1);
		}
		return;
	}

	if (command === 'doctor') {
		const selectedPacks = resolvePacks(flags.packs);
			const inputs = {
				root: rootPath,
				mode: flags.mode,
				profile: normalizedProfile,
				packs: selectedPacks
			};
		const report = {
			schema: 'brainwav.governance.doctor.v1',
			meta: buildMeta(inputs),
			summary: '',
			status: 'success',
			data: {
				repo_root: rootPath,
				checks: []
			},
			errors: []
		};
		const result = runReadinessCheck(rootPath);
		report.data.checks = normalizeChecks(result.checks);
		const { manifests, missing } = loadPackManifestsForRoot(rootPath, selectedPacks);
		if (missing.length > 0) {
			missing.forEach((packId) => {
				report.data.checks.push(buildCheck('pack.missing', 'fail', 'medium', 'pack', `pack missing: ${packId}`));
			});
		}
		const packOptions = getPackOptions(configPath, {});
			const inputResult = collectMissingPackInputs({
				rootPath,
				manifests,
				packOptions,
				profile: normalizedProfile
			});
		report.data.checks.push(...inputResult.checks);
		if (global.noInput && inputResult.missingRequired.length > 0) {
			console.error('[brAInwav] missing required pack inputs and --no-input is set.');
			exitWithCode(2);
			return;
		}
		manifests.forEach((manifest) => {
			const doctorChecks = normalizePackChecks(manifest.checks?.doctor || []);
			doctorChecks.forEach((entry) => {
				report.data.checks.push(
					buildCheck(
						buildPackCheckId(manifest.id, entry.id),
						'pass',
						entry.severity ?? 'info',
						entry.category ?? 'pack',
						entry.message ?? `pack check scheduled: ${entry.id}`
					)
				);
			});
		});
		const registryMisses = checkRegistry(report.data.checks);
		if (registryMisses.length > 0) {
			report.status = 'error';
			report.errors.push(`unknown check ids: ${registryMisses.map((c) => c.id).join(', ')}`);
		}
		const failed = report.data.checks.filter((c) => c.status === 'fail').length;
		const warned = report.data.checks.filter((c) => c.status === 'warn').length;
		report.status = failed > 0 || report.errors.length > 0 ? 'error' : warned > 0 ? 'warn' : 'success';
		report.summary = formatSummary(report.data.checks, report.status);
		outputReport(report, global);
		writeReport(reportPath, report);
		writeReport(outputPath, report);
		enforceExitCode(report.status, warned, flags.strict, 1, 4);
		return;
	}

	if (command === 'validate') {
		const selectedPacks = resolvePacks(flags.packs);
			const inputs = {
				root: rootPath,
				mode: flags.mode,
				profile: normalizedProfile,
				packs: selectedPacks,
				strict: flags.strict
			};
		const report = {
			schema: 'brainwav.governance.validate.v1',
			meta: buildMeta(inputs),
			summary: '',
			status: 'success',
			data: {
				repo_root: rootPath,
				checks: []
			},
			errors: []
		};

		const configWarnings = parseConfigWarnings(configPath);
		const validation = runGovernanceValidation(rootPath, configPath);
		const hashCheck = runGovernanceHashSync(rootPath, {
			checkOnly: true,
			silent: global.json || global.quiet
		});
		const evidenceCheck = runTaskEvidenceValidation(rootPath);

		const installedPacks = readInstalledPacks(rootPath, configPath);
		const expectedPacks = selectedPacks.length > 0 ? selectedPacks : installedPacks.packs;
		const { manifests, missing } = loadPackManifestsForRoot(rootPath, expectedPacks);
		const packValidateChecks = [];
		manifests.forEach((manifest) => {
			const entries = normalizePackChecks(manifest.checks?.validate || []);
			entries.forEach((entry) => {
				packValidateChecks.push({ ...entry, packId: manifest.id });
			});
		});
		const checks = [];
		if (validation.failures.length > 0) {
			validation.failures.forEach((failure) => {
				const id = failure.includes('token') ? 'policy.required_tokens'
					: failure.includes('Step Budget') ? 'policy.step_budget'
						: 'policy.config';
				checks.push(buildCheck(id, 'fail', 'high', 'policy', failure));
			});
		} else {
			checks.push(buildCheck('policy.required_tokens', 'pass', 'info', 'policy', 'required tokens ok'));
			checks.push(buildCheck('policy.step_budget', 'pass', 'info', 'policy', 'step budget ok'));
			checks.push(buildCheck('policy.config', 'pass', 'info', 'policy', 'config ok'));
		}

		if (!hashCheck.ok) {
			checks.push(
				buildCheck(
					'hash.drift',
					'fail',
					'high',
					'hash',
					`${hashCheck.updated ?? hashCheck.changes?.length ?? 0} entries drifted`
				)
			);
		} else {
			checks.push(buildCheck('hash.drift', 'pass', 'info', 'hash', 'no drift'));
		}

		if (!evidenceCheck.ok) {
			evidenceCheck.failures.forEach((failure) => {
				checks.push(buildCheck('evidence.task', 'fail', 'medium', 'evidence', failure));
			});
		} else if (evidenceCheck.skipped) {
			checks.push(buildCheck('evidence.task', 'warn', 'low', 'evidence', 'no tasks directory; evidence checks skipped'));
		} else {
			checks.push(buildCheck('evidence.task', 'pass', 'info', 'evidence', 'task evidence ok'));
		}

		packValidateChecks.forEach((entry) => {
			const manifest = manifests.find((item) => item.id === entry.packId);
			if (!manifest) return;
				const evaluation = evaluatePackCheck({
					rootPath,
					manifest,
					entry,
					packOptions: installedPacks.packOptions ?? {},
					profile: normalizedProfile
				});
			checks.push(
				buildCheck(
					buildPackCheckId(entry.packId, entry.id),
					evaluation.status,
					entry.severity ?? 'medium',
					entry.category ?? 'pack',
					evaluation.message ?? entry.message ?? `pack check: ${entry.id}`
				)
			);
		});

		if (expectedPacks.length > 0 && missing.length > 0) {
			missing.forEach((packId) => {
				checks.push(buildCheck('pack.missing', 'fail', 'medium', 'pack', `pack missing: ${packId}`));
			});
		} else if (expectedPacks.length > 0) {
			checks.push(buildCheck('pack.present', 'pass', 'info', 'pack', 'packs present'));
		}

		const packOptions = installedPacks.packOptions ?? {};
			const inputResult = collectMissingPackInputs({
				rootPath,
				manifests,
				packOptions,
				profile: normalizedProfile
			});
		checks.push(...inputResult.checks);
		if (global.noInput && inputResult.missingRequired.length > 0) {
			console.error('[brAInwav] missing required pack inputs and --no-input is set.');
			exitWithCode(2);
			return;
		}

		applyWarningsToChecks(checks, configWarnings, 'policy.config', 'policy');
		report.data.checks = normalizeChecks(checks);
		const registryMisses = checkRegistry(report.data.checks);
		if (registryMisses.length > 0) {
			report.status = 'error';
			report.errors.push(`unknown check ids: ${registryMisses.map((c) => c.id).join(', ')}`);
		}

		const failed = report.data.checks.filter((c) => c.status === 'fail').length;
		const warned = report.data.checks.filter((c) => c.status === 'warn').length;
		report.status = failed > 0 || report.errors.length > 0 ? 'error' : warned > 0 ? 'warn' : 'success';
		report.summary = formatSummary(report.data.checks, report.status);
		outputReport(report, global);
		writeReport(reportPath, report);
		writeReport(outputPath, report);
		enforceExitCode(report.status, warned, flags.strict, 3, 4);
		return;
	}
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('governance-cli.mjs')) {
	main().catch((error) => {
		console.error(`[brAInwav] ${error.message ?? error}`);
		exitWithCode(1);
	});
}

export default main;
