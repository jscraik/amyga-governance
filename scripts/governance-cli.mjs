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
import { execSync } from 'node:child_process';
import { runGovernanceInstall } from './install-governance.mjs';
import { runGovernanceHashSync } from './sync-governance-hashes.mjs';
import { runGovernanceValidation } from './validate-governance.mjs';
import { runReadinessCheck } from './readiness-check.mjs';
import { runTaskEvidenceValidation } from './validate-task-evidence.mjs';
import { runGovernanceUpgrade } from './upgrade-governance.mjs';
import { resolveGovernancePaths } from './governance-paths.mjs';
import { resolveGovernanceDocPath } from './lib/governance-docs.mjs';
import { isPrettyJson } from './lib/json-format.mjs';
import { resolvePacks, loadPackManifestFromRoot, PRESETS } from './pack-utils.mjs';
import { runAgentLoop } from '../brainwav/governance/tools/agent-loop.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

const COMMANDS = new Set(['init', 'install', 'upgrade', 'validate', 'doctor', 'packs', 'task', 'cleanup-plan', 'spec', 'loop']);
const COMMON_FLAGS = new Set(['--mode', '--profile', '--packs', '--dry-run', '--yes', '--force', '--no-install']);
const TASK_FLAGS = new Set(['--slug', '--tier', '--task-root', '--tasks-root']);
const SPEC_FLAGS = new Set(['--slug', '--spec-root', '--compat']);
const LOOP_FLAGS = new Set(['--slug', '--loop-config']);
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
	'--apply',
	'--report',
	'--output'
]);

const CHECK_REGISTRY = new Set([
	'policy.required_tokens',
	'policy.step_budget',
	'policy.config',
	'governance.json.pretty',
	'hash.drift',
	'standards.freshness',
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
	'tool.semgrep.version',
	'tool.gitleaks',
	'tool.gitleaks.version',
	'tool.trivy',
	'tool.trivy.version',
	'tool.cosign',
	'tool.cosign.version',
	'tool.osv-scanner',
	'tool.osv-scanner.version',
	'tool.markdownlint-cli2',
	'tool.markdownlint-cli2.version',
	'portfolio.drift',
	'pack.missing',
	'pack.present',
	'evidence.data_governance',
	'evidence.vendor_governance',
	'spec.layout',
	'spec.memory.constitution',
	'spec.templates.present',
	'spec.templates.claude',
	'spec.scripts.present',
	'spec.claude.present',
	'spec.specs.present',
	'spec.specs.naming',
	'spec.lifecycle',
	'spec.plan.artifacts'
	,
	'spec-chain.present',
	'spec-chain.consistency',
	'verification.criteria.present',
	'learn.fields.present',
	'decision.hierarchy.present',
	'spec.clarify.missing',
	'spec.analyze.consistency',
	'spec.checklist.missing',
	'pack:agent-loop:config-present',
	'pack:agent-loop:prompt-present',
	'pack:agent-loop:runner-command',
	'pack:agent-loop:budgets',
	'pack:agent-loop:verify-commands',
	'pack:agent-loop:verify-commands-exist',
	'pack:agent-loop:allowlist',
	'pack:agent-loop:branch-guard',
	'pack:agent-loop:stop-file',
	'pack:agent-loop:report-dir',
	'pack:agent-loop:prompt-placeholders',
	'pack:agent-loop:allowlist-enforced',
	'pack:agent-loop:no-progress',
	'pack:agent-loop:runner-script',
	'pack:agent-loop:runner-available'
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

Initialize, install, upgrade, validate, diagnose, or scaffold Brainwav governance in a repo.

Usage:
  brainwav-governance [global flags] <init|install|upgrade|validate|doctor|cleanup-plan|spec|loop> [flags]
  brainwav-governance packs list [--json]
  brainwav-governance task init --slug <id> [--tier <feature|fix|refactor|research|update>] [--task-root <dir>]
  brainwav-governance spec init --slug <id> [--spec-root <dir>] [--compat speckit]
  brainwav-governance spec validate [--spec-root <dir>] [--compat speckit]
  brainwav-governance spec clarify [--spec-root <dir>] [--compat speckit]
  brainwav-governance spec analyze [--spec-root <dir>] [--compat speckit]
  brainwav-governance spec checklist [--spec-root <dir>] [--compat speckit]
  brainwav-governance cleanup-plan --root . [--report <path>] [--apply] [--force]
  brainwav-governance loop run --slug <id> [--loop-config <path>]
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
		apply: false,
		report: null,
		output: null
	};
	const flags = {
		mode: 'pointer',
		modeProvided: false,
		profile: 'delivery',
		profileProvided: false,
		packs: [],
		dryRun: false,
		yes: false,
		force: false,
		noInstall: false,
		strict: false,
		preserve: true,
		taskSlug: null,
		taskTier: 'feature',
		taskRoot: 'tasks'
	};
	const specFlags = {
		specRoot: 'specs',
		compat: null
	};
	const loopFlags = {
		loopSlug: null,
		loopConfig: '.agentic-governance/loop/config.json'
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
			return { command: arg, global, flags, specFlags, loopFlags, unknown, positionalOutput };
		}
		if (GLOBAL_FLAGS.has(arg)) {
			switch (arg) {
				case '--apply':
					global.apply = true;
					break;
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
					return { command: '--help', global, flags, specFlags, loopFlags, unknown, positionalOutput };
				case '--version':
					return { command: '--version', global, flags, specFlags, loopFlags, unknown, positionalOutput };
				default:
					break;
			}
			continue;
		}

		if (COMMON_FLAGS.has(arg) || arg === '--strict' || arg === '--preserve=false' || arg === '--preserve=true') {
			switch (arg) {
				case '--no-install':
					flags.noInstall = true;
					break;
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

		if (command === 'task' && TASK_FLAGS.has(arg)) {
			switch (arg) {
				case '--slug': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --slug' };
					flags.taskSlug = value;
					i++;
					break;
				}
				case '--tier': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --tier' };
					flags.taskTier = value;
					i++;
					break;
				}
				case '--task-root':
				case '--tasks-root': {
					const value = takeValue(i);
					if (!value) return { error: `Missing value for ${arg}` };
					flags.taskRoot = value;
					i++;
					break;
				}
				default:
					break;
			}
			continue;
		}
		if (command === 'spec' && SPEC_FLAGS.has(arg)) {
			switch (arg) {
				case '--slug': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --slug' };
					flags.taskSlug = value;
					i++;
					break;
				}
				case '--spec-root': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --spec-root' };
					specFlags.specRoot = value;
					i++;
					break;
				}
				case '--compat': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --compat' };
					specFlags.compat = value;
					i++;
					break;
				}
				default:
					break;
			}
			continue;
		}
		if (command === 'loop' && LOOP_FLAGS.has(arg)) {
			switch (arg) {
				case '--slug': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --slug' };
					loopFlags.loopSlug = value;
					i++;
					break;
				}
				case '--loop-config': {
					const value = takeValue(i);
					if (!value) return { error: 'Missing value for --loop-config' };
					loopFlags.loopConfig = value;
					i++;
					break;
				}
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

	return { command, global, flags, specFlags, loopFlags, unknown, positionalOutput };
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

function checkPrettyJson(indexPath, govRoot, rootPath) {
	const issues = [];
	if (!fs.existsSync(indexPath)) return { ok: true, issues };
	const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
	Object.values(index.docs || {}).forEach((entry) => {
		if (!entry?.path || !entry.path.endsWith('.json')) return;
		const target = resolveGovernanceDocPath(rootPath, govRoot, entry.path);
		if (!target || !fs.existsSync(target)) return;
		const raw = fs.readFileSync(target, 'utf8');
		try {
			const pretty = isPrettyJson(raw, 2);
			if (!pretty.ok) {
				issues.push(entry.path);
			}
		} catch {
			issues.push(`${entry.path} (parse error)`);
		}
	});
	return { ok: issues.length === 0, issues };
}

/**
 * Resolve packs and handle unknown pack errors as usage issues.
 * @param {string[]} packs - Selected pack identifiers.
 * @returns {string[]|null} Resolved pack IDs or null when invalid.
 */
function resolvePacksSafe(packs) {
	try {
		return resolvePacks(packs);
	} catch (error) {
		console.error(`[brAInwav] ${error.message}`);
		exitWithCode(2);
		return null;
	}
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
	const hasTrailingSlash = /[\\/]$/.test(target);
	const ext = path.extname(resolved);
	const exists = fs.existsSync(resolved);
	const isDir = exists && fs.statSync(resolved).isDirectory();
	const dirIntent = hasTrailingSlash || (!exists && !ext);
	if (!isDir && !dirIntent) return resolved;
	if (command === 'validate') return path.join(resolved, 'validate.report.json');
	if (command === 'doctor') return path.join(resolved, 'doctor.report.json');
	if (command === 'cleanup-plan') return path.join(resolved, 'cleanup-plan.json');
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
 * Find dependency version for a package.
 * @param {Record<string, unknown>|null} pkgJson - Parsed package.json.
 * @param {string} packageName - Package name to lookup.
 * @returns {string|null} Version string or null.
 */
function readDependencyVersion(pkgJson, packageName) {
	if (!pkgJson) return null;
	const deps = { ...(pkgJson.dependencies ?? {}), ...(pkgJson.devDependencies ?? {}) };
	const version = deps?.[packageName];
	return typeof version === 'string' ? version.trim() : null;
}

/**
 * Check if a version string is an exact x.y.z pin.
 * @param {string|null} version - Version string.
 * @returns {boolean} True if exact pin.
 */
function isExactVersion(version) {
	return Boolean(version && /^\d+\.\d+\.\d+$/.test(version));
}

/**
 * Extract major.minor from a version string.
 * @param {string|null} version - Version string.
 * @returns {string|null} Major.minor string.
 */
function majorMinor(version) {
	if (!version) return null;
	const parts = version.split('.');
	if (parts.length < 2) return null;
	return `${parts[0]}.${parts[1]}`;
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
	return 'warn';
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
 * Identify missing pnpm script references in verify commands.
 * @param {string[]} commands - Verify commands list.
 * @param {string} rootPath - Repo root.
 * @returns {string[]} Missing script names.
 */
function findMissingVerifyScripts(commands, rootPath) {
	const pkgPath = path.join(rootPath, 'package.json');
	if (!fs.existsSync(pkgPath)) return [];
	const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	const scripts = pkgJson?.scripts ?? {};
	const missing = [];
	commands.forEach((command) => {
		const match = command.trim().match(/^pnpm\s+-s\s+([\\w:-]+)/);
		if (!match) return;
		const scriptName = match[1];
		if (!scripts[scriptName]) {
			missing.push(scriptName);
		}
	});
	return missing;
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
 * Read JSON content from a path if present.
 * @param {string|null} filePath - File path.
 * @returns {Record<string, unknown>|null} JSON data or null.
 */
function readJsonFile(filePath) {
	if (!filePath) return null;
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch {
		return null;
	}
}

/**
 * Evaluate pointer-mode dependency drift rules.
 * @param {string} rootPath - Repo root.
 * @param {Record<string, unknown>|null} pointer - Pointer metadata.
 * @returns {string[]} Failure messages.
 */
function checkPortfolioDrift(rootPath, pointer) {
	if (!pointer || pointer.mode !== 'pointer') return [];
	const packageName = pointer.package || '@brainwav/brainwav-agentic-governance';
	const pointerVersion = typeof pointer.version === 'string' ? pointer.version.trim() : null;
	const pkgJson = readPackageJson(rootPath);
	const depVersion = readDependencyVersion(pkgJson, packageName);
	const failures = [];

	if (!pointerVersion) {
		failures.push('pointer.json missing version');
	}
	if (!depVersion) {
		failures.push(`package.json missing ${packageName} dependency`);
	} else if (!isExactVersion(depVersion)) {
		failures.push(`dependency ${packageName} must be an exact x.y.z pin (got "${depVersion}")`);
	}
	if (pointerVersion && !isExactVersion(pointerVersion)) {
		failures.push(`pointer.json version must be an exact x.y.z pin (got "${pointerVersion}")`);
	}
	if (pointerVersion && depVersion && isExactVersion(pointerVersion) && isExactVersion(depVersion)) {
		const pointerMajorMinor = majorMinor(pointerVersion);
		const depMajorMinor = majorMinor(depVersion);
		if (pointerMajorMinor && depMajorMinor && pointerMajorMinor !== depMajorMinor) {
			failures.push(
				`pointer.json ${pointerVersion} must match dependency ${depVersion} major.minor`
			);
		}
		if (pointerVersion !== depVersion) {
			failures.push(`pointer.json version ${pointerVersion} must match dependency ${depVersion}`);
		}
	}

	return failures;
}

/**
 * Check risk-register evidence for data and vendor governance.
 * @param {string} rootPath - Repo root.
 * @returns {{dataIssues: string[], vendorIssues: string[], skipped: boolean}} Result.
 */
function checkRiskRegisterEvidence(rootPath) {
	const tasksDir = path.join(rootPath, 'tasks');
	if (!fs.existsSync(tasksDir)) {
		return { dataIssues: [], vendorIssues: [], skipped: true };
	}
	const dataIssues = [];
	const vendorIssues = [];
	const slugs = fs.readdirSync(tasksDir);
	const dataTokens = ['data governance', 'data classification', 'retention', 'privacy'];
	const vendorTokens = ['vendor', 'third-party', 'third party', 'dpa', 'license'];

	slugs.forEach((slug) => {
		const riskPath = path.join(tasksDir, slug, 'plan', 'risk-register.md');
		if (!fs.existsSync(riskPath)) {
			dataIssues.push(`task ${slug}: missing plan/risk-register.md`);
			vendorIssues.push(`task ${slug}: missing plan/risk-register.md`);
			return;
		}
		const content = readTextFile(riskPath) ?? '';
		const hasData = dataTokens.some((token) => content.toLowerCase().includes(token));
		const hasVendor = vendorTokens.some((token) => content.toLowerCase().includes(token));
		if (!hasData) {
			dataIssues.push(`task ${slug}: risk-register missing data governance/retention notes`);
		}
		if (!hasVendor) {
			vendorIssues.push(`task ${slug}: risk-register missing vendor/license notes`);
		}
	});

	return { dataIssues, vendorIssues, skipped: false };
}

/**
 * Check standards freshness based on standards.versions.json as_of.
 * @param {string} govRoot - Governance root.
 * @returns {{ok: boolean, ageDays: number|null, maxDays: number, message: string}} Result.
 */
function checkStandardsFreshness(govRoot) {
	const standardsPath = path.join(govRoot, '90-infra', 'standards.versions.json');
	const maxDays = Number.parseInt(process.env.STANDARDS_MAX_AGE_DAYS || '90', 10);
	if (!fs.existsSync(standardsPath)) {
		return { ok: false, ageDays: null, maxDays, message: 'standards.versions.json missing' };
	}
	try {
		const data = JSON.parse(fs.readFileSync(standardsPath, 'utf8'));
		const asOf = new Date(data.as_of);
		if (Number.isNaN(asOf.getTime())) {
			return { ok: false, ageDays: null, maxDays, message: 'standards.versions.json missing valid as_of date' };
		}
		const ageDays = Math.floor(
			Math.abs(new Date().getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24)
		);
		if (ageDays > maxDays) {
			return {
				ok: false,
				ageDays,
				maxDays,
				message: `standards.versions.json is stale by ${ageDays} days (max ${maxDays})`
			};
		}
		return { ok: true, ageDays, maxDays, message: 'standards freshness ok' };
	} catch (error) {
		return { ok: false, ageDays: null, maxDays, message: `standards.versions.json parse error: ${error.message}` };
	}
}

/**
 * Build a cleanup plan for pointer-mode repos.
 * @param {string} rootPath - Repo root.
 * @param {Record<string, unknown>|null} pointer - Pointer metadata.
 * @param {string} indexPath - Governance index path.
 * @returns {{actions: Array<object>, warnings: string[]}} Cleanup plan data.
 */
function buildCleanupPlan(rootPath, pointer, indexPath) {
	const actions = [];
	const warnings = [];
	if (!pointer || pointer.mode !== 'pointer') {
		warnings.push('cleanup-plan requires pointer mode; no actions generated');
		return { actions, warnings };
	}
	const pointerDir = path.join(rootPath, '.agentic-governance');
	const overlayDir = path.join(pointerDir, 'overlays');
	const nodeModulesDir = path.join(rootPath, 'node_modules');
	const localPackDir = path.join(pointerDir, 'packs');
	const vendorDir = path.join(pointerDir, 'vendor');
	const canonicalSegments = ['00-core', '10-flow', '20-checklists', '30-compliance', '90-infra'];
	const canonicalRoots = ['brainwav/governance', 'brainwav/governance-pack'];
	const stubPaths = new Set(['AGENTS.md', 'CODESTYLE.md', 'SECURITY.md', 'docs/GOVERNANCE.md']);
	const scanExtensions = new Set(['.md', '.markdown', '.mdx', '.json', '.yaml', '.yml', '.txt']);
	const scanSkipDirs = new Set([
		'.agentic-governance',
		'.git',
		'.idea',
		'.next',
		'.pnpm',
		'.swiftpm',
		'.turbo',
		'.vscode',
		'Pods',
		'DerivedData',
		'build',
		'coverage',
		'dist',
		'node_modules',
		'out',
		'.build',
		'.cache'
	]);

	if (fs.existsSync(localPackDir)) {
		actions.push({
			action: 'delete',
			path: path.relative(rootPath, localPackDir),
			reason: 'pointer mode forbids local pack manifests'
		});
	}
	if (fs.existsSync(vendorDir)) {
		actions.push({
			action: 'delete',
			path: path.relative(rootPath, vendorDir),
			reason: 'pointer mode forbids vendored governance packs'
		});
	}

	canonicalSegments.forEach((segment) => {
		const target = path.join(rootPath, segment);
		if (fs.existsSync(target)) {
			actions.push({
				action: 'delete',
				path: path.relative(rootPath, target),
				reason: 'pointer mode forbids canonical governance directories'
			});
		}
	});
	canonicalRoots.forEach((segment) => {
		const target = path.join(rootPath, segment);
		if (fs.existsSync(target)) {
			actions.push({
				action: 'delete',
				path: path.relative(rootPath, target),
				reason: 'pointer mode forbids canonical governance directories'
			});
		}
	});

	let canonicalDocPaths = [];
	let canonicalDocNames = new Set();
	try {
		const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
		const prefixes = canonicalSegments.map((segment) => `${segment}/`);
		canonicalDocPaths = Object.values(index.docs || {})
			.map((entry) => entry.path)
			.filter((docPath) => prefixes.some((prefix) => docPath.startsWith(prefix)));
		canonicalDocPaths = canonicalDocPaths.concat(
			canonicalDocPaths.map((docPath) => `brainwav/governance/${docPath}`)
		);
		canonicalDocNames = new Set(
			Object.values(index.docs || {}).map((entry) => path.basename(entry.path))
		);
	} catch (error) {
		warnings.push(`failed to read governance index: ${error.message}`);
	}

	const forbiddenNamePatterns = [/constitution\.md$/i, /agentic-coding-workflow\.md$/i];
	const planned = new Set();
	const visit = (dir) => {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		entries.forEach((entry) => {
			const entryPath = path.join(dir, entry.name);
			if (scanSkipDirs.has(entry.name)) return;
			if (entryPath.startsWith(pointerDir)) return;
			if (entryPath.startsWith(overlayDir)) return;
			if (entryPath.startsWith(nodeModulesDir)) return;
			if (entry.isDirectory()) {
				visit(entryPath);
				return;
			}
			if (!scanExtensions.has(path.extname(entry.name))) return;
			const relPath = path.relative(rootPath, entryPath).replace(/\\/g, '/');
			if (stubPaths.has(relPath)) return;
			const matchesForbidden = forbiddenNamePatterns.some((pattern) => pattern.test(entry.name));
			const matchesCanonicalName = canonicalDocNames.has(entry.name);
			if (!matchesForbidden && !matchesCanonicalName && !canonicalDocPaths.includes(relPath)) return;
			const matchesCanonical = canonicalDocPaths.includes(relPath) || matchesCanonicalName;
			if (!matchesForbidden && !matchesCanonical) return;
			if (planned.has(relPath)) return;
			planned.add(relPath);
			if (relPath.endsWith('.md')) {
				const target = `.agentic-governance/overlays/${relPath}.local.md`;
				actions.push({
					action: 'move',
					path: relPath,
					target,
					reason: 'canonical doc copy detected; move delta into overlays'
				});
			} else {
				actions.push({
					action: 'delete',
					path: relPath,
					reason: 'canonical doc copy detected in pointer mode'
				});
			}
		});
	};
	visit(rootPath);

	return { actions, warnings };
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

	if (packId === 'sdd' && (checkId === 'spec-present' || checkId === 'plan-present' || checkId === 'tasks-present' || checkId === 'traceability')) {
		const specRoot = options?.specRoot || 'specs';
		const root = path.join(rootPath, specRoot);
		if (!fs.existsSync(root)) {
			return {
				status: statusFromProfile(profile),
				message: `missing ${specRoot}/ directory for sdd pack`
			};
		}
		const entries = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory());
		if (entries.length === 0) {
			return {
				status: statusFromProfile(profile),
				message: `no spec directories found under ${specRoot}/`
			};
		}
		const requiredFile = checkId === 'spec-present'
			? 'spec.md'
			: checkId === 'plan-present'
				? 'plan.md'
				: checkId === 'tasks-present'
					? 'tasks.md'
					: null;
		if (requiredFile) {
			const missing = entries.filter((entry) => !fs.existsSync(path.join(root, entry.name, requiredFile)));
			if (missing.length > 0) {
				return {
					status: statusFromProfile(profile),
					message: `${requiredFile} missing in ${missing.map((entry) => path.join(specRoot, entry.name)).join(', ')}`
				};
			}
			return { status: 'pass', message: `${requiredFile} present for sdd pack` };
		}
		const traceFailures = [];
		entries.forEach((entry) => {
			const tasksPath = path.join(root, entry.name, 'tasks.md');
			if (!fs.existsSync(tasksPath)) {
				traceFailures.push(path.join(specRoot, entry.name, 'tasks.md missing'));
				return;
			}
			const content = readTextFile(tasksPath) ?? '';
			if (!content.includes('tasks/')) {
				traceFailures.push(path.join(specRoot, entry.name, 'tasks.md missing tasks/ references'));
			}
		});
		if (traceFailures.length > 0) {
			return {
				status: statusFromProfile(profile),
				message: `traceability missing: ${traceFailures.join(', ')}`
			};
		}
		return { status: 'pass', message: 'sdd traceability ok' };
	}

	if (packId === 'agent-loop') {
		const loopRoot = path.join(rootPath, '.agentic-governance', 'loop');
		const configPath = path.join(loopRoot, 'config.json');
		const config = readJsonFile(configPath);
		const runnerPath = path.join(rootPath, '.agentic-governance', 'tools', 'agent-loop.mjs');
		const promptPath = config?.promptFile
			? resolveRootPath(rootPath, config.promptFile)
			: path.join(loopRoot, 'PROMPT.md');

		if (checkId === 'pack:agent-loop:config-present') {
			if (config) return { status: 'pass', message: 'loop config present' };
			return { status: statusFromProfile(profile), message: 'missing loop config.json' };
		}
		if (checkId === 'pack:agent-loop:prompt-present') {
			if (promptPath && fs.existsSync(promptPath)) {
				return { status: 'pass', message: 'loop prompt present' };
			}
			return { status: statusFromProfile(profile), message: 'missing loop prompt' };
		}
		if (checkId === 'pack:agent-loop:runner-command') {
			if (typeof config?.runner?.command === 'string' && config.runner.command.trim()) {
				return { status: 'pass', message: 'runner command configured' };
			}
			return { status: statusFromProfile(profile), message: 'runner command missing' };
		}
		if (checkId === 'pack:agent-loop:budgets') {
			const budgets = config?.budgets ?? {};
			const maxIterations = Number(budgets.maxIterations);
			const maxMinutes = Number(budgets.maxMinutes);
			const maxFailures = Number(budgets.maxFailures);
			const ok = maxIterations > 0 && maxMinutes > 0 && maxFailures > 0;
			return {
				status: ok ? 'pass' : statusFromProfile(profile),
				message: ok ? 'budgets configured' : 'missing or invalid budget values'
			};
		}
		if (checkId === 'pack:agent-loop:verify-commands') {
			const commands = Array.isArray(config?.verify?.commands) ? config.verify.commands : [];
			return {
				status: commands.length > 0 ? 'pass' : statusFromProfile(profile),
				message: commands.length > 0 ? 'verify.commands configured' : 'verify.commands missing'
			};
		}
		if (checkId === 'pack:agent-loop:verify-commands-exist') {
			const commands = Array.isArray(config?.verify?.commands) ? config.verify.commands : [];
			const missingScripts = findMissingVerifyScripts(commands, rootPath);
			return {
				status: missingScripts.length === 0 ? 'pass' : statusFromProfile(profile),
				message: missingScripts.length === 0
					? 'verify.commands script references ok'
					: `missing scripts: ${missingScripts.join(', ')}`
			};
		}
		if (checkId === 'pack:agent-loop:allowlist') {
			const allowlist = Array.isArray(config?.allowlist) ? config.allowlist : [];
			return {
				status: allowlist.length > 0 ? 'pass' : statusFromProfile(profile),
				message: allowlist.length > 0 ? 'allowlist configured' : 'allowlist missing'
			};
		}
		if (checkId === 'pack:agent-loop:branch-guard') {
			const enforced = config?.branch?.enforced === true;
			const prefix = config?.branch?.prefix;
			const ok = enforced && typeof prefix === 'string' && prefix.startsWith('bw/loop/');
			return {
				status: ok ? 'pass' : statusFromProfile(profile),
				message: ok ? 'branch guard enforced' : 'branch guard must enforce bw/loop/ prefix'
			};
		}
		if (checkId === 'pack:agent-loop:stop-file') {
			const stopFile = config?.stopFile;
			const ok = typeof stopFile === 'string' && stopFile.trim().length > 0;
			return {
				status: ok ? 'pass' : statusFromProfile(profile),
				message: ok ? 'stop file configured' : 'stop file missing'
			};
		}
		if (checkId === 'pack:agent-loop:report-dir') {
			const reportDir = config?.reportDir;
			const ok = typeof reportDir === 'string' && reportDir.trim().length > 0;
			return {
				status: ok ? 'pass' : statusFromProfile(profile),
				message: ok ? 'report dir configured' : 'report dir missing'
			};
		}
		if (checkId === 'pack:agent-loop:prompt-placeholders') {
			if (!promptPath || !fs.existsSync(promptPath)) {
				return { status: statusFromProfile(profile), message: 'prompt missing for placeholder checks' };
			}
			const content = readTextFile(promptPath) ?? '';
			const required = ['{{slug}}', '{{iteration}}', '{{allowlist}}', '{{verifyCommands}}'];
			const missing = required.filter((token) => !content.includes(token));
			return {
				status: missing.length === 0 ? 'pass' : statusFromProfile(profile),
				message: missing.length === 0 ? 'prompt placeholders present' : `missing placeholders: ${missing.join(', ')}`
			};
		}
		if (checkId === 'pack:agent-loop:allowlist-enforced') {
			const enforce = config?.diffPolicy?.enforceAllowlist === true;
			return {
				status: enforce ? 'pass' : statusFromProfile(profile),
				message: enforce ? 'allowlist enforcement enabled' : 'allowlist enforcement not enabled'
			};
		}
		if (checkId === 'pack:agent-loop:no-progress') {
			const noProgress = config?.noProgress ?? {};
			const maxNoDiff = Number(noProgress.maxIterationsWithoutDiff);
			const maxRepeat = Number(noProgress.maxRepeatedFailure);
			const ok = maxNoDiff > 0 && maxRepeat > 0;
			return {
				status: ok ? 'pass' : statusFromProfile(profile),
				message: ok ? 'no-progress thresholds configured' : 'no-progress thresholds missing'
			};
		}
		if (checkId === 'pack:agent-loop:runner-script') {
			if (fs.existsSync(runnerPath)) {
				return { status: 'pass', message: 'agent-loop runner present' };
			}
			return { status: statusFromProfile(profile), message: 'agent-loop runner missing' };
		}
		if (checkId === 'pack:agent-loop:runner-available') {
			const command = config?.runner?.command;
			if (!command || typeof command !== 'string') {
				return { status: statusFromProfile(profile), message: 'runner command missing' };
			}
			try {
				execSync(`command -v ${command}`, { stdio: ['ignore', 'ignore', 'ignore'] });
				return { status: 'pass', message: 'runner command available' };
			} catch {
				return { status: statusFromProfile(profile), message: `runner command not found: ${command}` };
			}
		}
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
 * Ensure task slug is safe for filesystem usage.
 * @param {string} slug - Task slug.
 * @returns {boolean} True when slug is safe.
 */
function isSafeSlug(slug) {
	if (typeof slug !== 'string' || !slug.trim()) return false;
	if (slug === '.' || slug === '..') return false;
	if (slug.includes('/') || slug.includes('\\')) return false;
	if (slug.includes('..')) return false;
	return true;
}

/**
 * Create a directory if missing and record the action.
 * @param {string} dirPath - Directory path.
 * @param {Array<object>} actions - Actions array.
 * @returns {void} No return value.
 */
function ensureDir(dirPath, actions) {
	if (fs.existsSync(dirPath)) return;
	fs.mkdirSync(dirPath, { recursive: true });
	actions.push({ action: 'mkdir', path: dirPath });
}

/**
 * Write a file if missing or when force is true.
 * @param {string} filePath - File path.
 * @param {string} content - File content.
 * @param {Array<object>} actions - Actions array.
 * @param {boolean} force - Overwrite when true.
 * @returns {void} No return value.
 */
function writeFile(filePath, content, actions, force) {
	const existed = fs.existsSync(filePath);
	if (existed && !force) return;
	fs.writeFileSync(filePath, content);
	actions.push({ action: existed ? 'overwrite' : 'write', path: filePath });
}

/**
 * Load a spec template from governance templates.
 * @param {string} govRoot - Governance root path.
 * @param {string} name - Template base name (spec|plan|tasks).
 * @returns {string} Template content.
 */
function loadSpecTemplate(govRoot, name) {
	const templatePath = path.join(govRoot, 'templates', 'sdd', `${name}.md`);
	if (!fs.existsSync(templatePath)) {
		throw new Error(`missing SDD template at ${templatePath}`);
	}
	return readTextFile(templatePath) ?? '';
}

/**
 * Detect spec-kit compatible layout roots.
 * @param {string} rootPath - Repository root.
 * @param {string} specRootFlag - Optional spec root override.
 * @returns {{layout: string, specRootPath: string|null, baseRoot: string|null}} Layout info.
 */
function detectSpecKitLayout(rootPath, specRootFlag) {
	const dotSpecifyRoot = path.join(rootPath, '.specify');
	const dotSpecifySpecs = path.join(dotSpecifyRoot, 'specs');
	const rootSpecs = path.join(rootPath, 'specs');
	const hasDotSpecify = fs.existsSync(dotSpecifySpecs);
	const hasRoot = fs.existsSync(rootSpecs);
	let layout = 'missing';
	let specRootPath = null;
	let baseRoot = null;

	if (specRootFlag) {
		specRootPath = path.resolve(rootPath, specRootFlag);
		if (specRootPath.startsWith(`${dotSpecifyRoot}${path.sep}`)) {
			layout = 'specify';
			baseRoot = dotSpecifyRoot;
		} else {
			layout = 'root';
			baseRoot = rootPath;
		}
		return { layout, specRootPath, baseRoot, hasDotSpecify, hasRoot };
	}

	if (hasDotSpecify) {
		layout = 'specify';
		specRootPath = dotSpecifySpecs;
		baseRoot = dotSpecifyRoot;
		return { layout, specRootPath, baseRoot, hasDotSpecify, hasRoot };
	}

	if (hasRoot) {
		layout = 'root';
		specRootPath = rootSpecs;
		baseRoot = rootPath;
		return { layout, specRootPath, baseRoot, hasDotSpecify, hasRoot };
	}

	return { layout, specRootPath, baseRoot, hasDotSpecify, hasRoot };
}

/**
 * Build spec-kit compatibility checks.
 * @param {string} rootPath - Repository root.
 * @param {string} specRootFlag - Optional spec root override.
 * @param {string|null} compat - Optional compatibility mode.
 * @returns {{checks: Array<object>, specRoot: string|null, layout: string}} Check results.
 */
function runSpecKitValidation(rootPath, specRootFlag, compat) {
	const checks = [];
	const addCheck = ({ id, status, message, severity = 'medium', category = 'spec' }) => {
		checks.push({ id, status, message, severity, category });
	};
	const overrideFlag = compat === 'speckit' ? '.specify/specs' : specRootFlag;
	const { layout, specRootPath, baseRoot, hasDotSpecify, hasRoot } = detectSpecKitLayout(
		rootPath,
		overrideFlag
	);
	if (layout === 'missing') {
		addCheck({
			id: 'spec.layout',
			status: 'fail',
			message: 'missing spec-kit layout (expected .specify/ or root specs/ layout)'
		});
		return { checks, specRoot: null, layout };
	}
	if (hasDotSpecify && hasRoot && !specRootFlag) {
		addCheck({
			id: 'spec.layout',
			status: 'warn',
			message: 'both .specify/ and root specs/ layouts detected; choose one for spec-kit compatibility'
		});
	} else if (layout === 'root') {
		addCheck({
			id: 'spec.layout',
			status: 'pass',
			message: 'spec-kit root layout detected'
		});
	} else {
		addCheck({
			id: 'spec.layout',
			status: 'pass',
			message: 'spec-kit .specify layout detected'
		});
	}

	const memoryDir = path.join(baseRoot, 'memory');
	const templatesDir = path.join(baseRoot, 'templates');
	const scriptsDir = path.join(baseRoot, 'scripts');
	const constitutionPath = path.join(memoryDir, 'constitution.md');
	if (fs.existsSync(constitutionPath)) {
		addCheck({
			id: 'spec.memory.constitution',
			status: 'pass',
			message: 'constitution.md present'
		});
	} else {
		addCheck({
			id: 'spec.memory.constitution',
			status: 'fail',
			message: `missing constitution.md at ${constitutionPath}`
		});
	}

	const requiredTemplates = ['spec-template.md', 'plan-template.md', 'tasks-template.md'];
	const missingTemplates = requiredTemplates.filter(
		(name) => !fs.existsSync(path.join(templatesDir, name))
	);
	if (missingTemplates.length > 0) {
		addCheck({
			id: 'spec.templates.present',
			status: 'fail',
			message: `missing templates: ${missingTemplates.join(', ')}`
		});
	} else {
		addCheck({
			id: 'spec.templates.present',
			status: 'pass',
			message: 'required templates present'
		});
	}

	const claudeTemplatePath = path.join(templatesDir, 'claude-template.md');
	if (fs.existsSync(claudeTemplatePath)) {
		addCheck({
			id: 'spec.templates.claude',
			status: 'pass',
			message: 'claude-template.md present'
		});
	} else {
		addCheck({
			id: 'spec.templates.claude',
			status: 'warn',
			message: 'claude-template.md missing (optional in spec-kit)'
		});
	}

	if (fs.existsSync(scriptsDir)) {
		addCheck({
			id: 'spec.scripts.present',
			status: 'pass',
			message: 'scripts directory present'
		});
	} else {
		addCheck({
			id: 'spec.scripts.present',
			status: 'warn',
			message: 'scripts directory missing (optional in spec-kit)'
		});
	}

	const claudePath = path.join(rootPath, 'CLAUDE.md');
	if (fs.existsSync(claudePath)) {
		addCheck({
			id: 'spec.claude.present',
			status: 'pass',
			message: 'CLAUDE.md present'
		});
	} else {
		addCheck({
			id: 'spec.claude.present',
			status: 'warn',
			message: 'CLAUDE.md missing (optional in spec-kit)'
		});
	}

	if (!specRootPath || !fs.existsSync(specRootPath)) {
		addCheck({
			id: 'spec.specs.present',
			status: 'fail',
			message: `missing specs root at ${specRootPath ?? '(not detected)'}`
		});
		return { checks, specRoot: specRootPath, layout };
	}

	const specDirs = fs
		.readdirSync(specRootPath, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
	const specDirsWithSpec = specDirs.filter((dir) =>
		fs.existsSync(path.join(specRootPath, dir, 'spec.md'))
	);

	if (specDirsWithSpec.length === 0) {
		addCheck({
			id: 'spec.specs.present',
			status: 'fail',
			message: `no specs found under ${specRootPath}`
		});
	} else {
		addCheck({
			id: 'spec.specs.present',
			status: 'pass',
			message: `${specDirsWithSpec.length} spec(s) detected`
		});
	}

	const nonCompliantNames = specDirsWithSpec.filter((dir) => !/^\d{3}-/.test(dir));
	if (nonCompliantNames.length > 0) {
		addCheck({
			id: 'spec.specs.naming',
			status: 'warn',
			message: `spec dirs without numeric prefix: ${nonCompliantNames.join(', ')}`
		});
	} else {
		addCheck({
			id: 'spec.specs.naming',
			status: 'pass',
			message: 'spec dirs follow numeric prefix naming'
		});
	}

	const lifecycleErrors = [];
	const lifecycleWarnings = [];
	const planArtifactMissing = [];
	specDirsWithSpec.forEach((dir) => {
		const planPath = path.join(specRootPath, dir, 'plan.md');
		const tasksPath = path.join(specRootPath, dir, 'tasks.md');
		const contractsPath = path.join(specRootPath, dir, 'contracts');
		const dataModelPath = path.join(specRootPath, dir, 'data-model.md');
		const researchPath = path.join(specRootPath, dir, 'research.md');
		const quickstartPath = path.join(specRootPath, dir, 'quickstart.md');
		const hasPlan = fs.existsSync(planPath);
		const hasTasks = fs.existsSync(tasksPath);
		if (hasTasks && !hasPlan) {
			lifecycleErrors.push(dir);
			return;
		}
		if (hasPlan && !hasTasks) {
			lifecycleWarnings.push(dir);
		}
		if (hasPlan) {
			const missing = [];
			if (!fs.existsSync(contractsPath)) missing.push('contracts/');
			if (!fs.existsSync(dataModelPath)) missing.push('data-model.md');
			if (!fs.existsSync(researchPath)) missing.push('research.md');
			if (!fs.existsSync(quickstartPath)) missing.push('quickstart.md');
			if (missing.length > 0) {
				planArtifactMissing.push(`${dir}: ${missing.join(', ')}`);
			}
		}
	});

	if (lifecycleErrors.length > 0) {
		addCheck({
			id: 'spec.lifecycle',
			status: 'fail',
			message: `tasks.md present without plan.md for: ${lifecycleErrors.join(', ')}`
		});
	} else if (lifecycleWarnings.length > 0) {
		addCheck({
			id: 'spec.lifecycle',
			status: 'warn',
			message: `plan.md present without tasks.md for: ${lifecycleWarnings.join(', ')}`
		});
	} else {
		addCheck({
			id: 'spec.lifecycle',
			status: 'pass',
			message: 'spec lifecycle ordering valid'
		});
	}

	if (planArtifactMissing.length > 0) {
		addCheck({
			id: 'spec.plan.artifacts',
			status: 'warn',
			message: `plan artifacts missing: ${planArtifactMissing.join(' | ')}`
		});
	} else {
		addCheck({
			id: 'spec.plan.artifacts',
			status: 'pass',
			message: 'plan artifacts present when plan.md exists'
		});
	}

	return { checks, specRoot: specRootPath, layout };
}

function listSpecDirs(specRootPath) {
	if (!specRootPath || !fs.existsSync(specRootPath)) return [];
	return fs
		.readdirSync(specRootPath, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
}

function readSpecFile(specRootPath, dir, filename) {
	const filePath = path.join(specRootPath, dir, filename);
	if (!fs.existsSync(filePath)) return null;
	return readTextFile(filePath) ?? '';
}

function checkSpecChain(rootPath, specRoot) {
	const issues = [];
	const missing = [];
	const specRootPath = path.join(rootPath, specRoot);
	const dirs = listSpecDirs(specRootPath);
	if (!fs.existsSync(specRootPath) || dirs.length === 0) {
		return { ok: false, issues: [], missing: [`missing ${specRoot}/ spec directories`] };
	}
	const requiredTokens = [
		'Current state',
		'Desired state',
		'Success criteria',
		'How we will verify'
	];
	dirs.forEach((dir) => {
		const specContent = readSpecFile(specRootPath, dir, 'spec.md');
		const planContent = readSpecFile(specRootPath, dir, 'plan.md');
		const tasksContent = readSpecFile(specRootPath, dir, 'tasks.md');
		if (!specContent) missing.push(`${dir}/spec.md missing`);
		if (!planContent) missing.push(`${dir}/plan.md missing`);
		if (!tasksContent) missing.push(`${dir}/tasks.md missing`);
		if (specContent && !specContent.includes(`specs/${dir}/plan.md`)) {
			issues.push(`${dir}/spec.md missing plan link`);
		}
		if (specContent && !specContent.includes(`specs/${dir}/tasks.md`)) {
			issues.push(`${dir}/spec.md missing tasks link`);
		}
		if (planContent && !planContent.includes(`specs/${dir}/spec.md`)) {
			issues.push(`${dir}/plan.md missing spec link`);
		}
		if (planContent && !planContent.includes(`specs/${dir}/tasks.md`)) {
			issues.push(`${dir}/plan.md missing tasks link`);
		}
		if (tasksContent && !tasksContent.includes(`specs/${dir}/spec.md`)) {
			issues.push(`${dir}/tasks.md missing spec link`);
		}
		if (tasksContent && !tasksContent.includes(`specs/${dir}/plan.md`)) {
			issues.push(`${dir}/tasks.md missing plan link`);
		}
		if (tasksContent && !tasksContent.includes('tasks/')) {
			issues.push(`${dir}/tasks.md missing tasks/ evidence references`);
		}
		if (specContent) {
			requiredTokens.forEach((token) => {
				if (!specContent.includes(token)) {
					issues.push(`${dir}/spec.md missing "${token}"`);
				}
			});
		}
	});
	return { ok: missing.length === 0 && issues.length === 0, issues, missing };
}

function checkRunManifestPAI(rootPath) {
	const issues = [];
	const tasksRoot = path.join(rootPath, 'tasks');
	if (!fs.existsSync(tasksRoot)) {
		return { ok: true, issues: [], skipped: true };
	}
	const slugs = fs
		.readdirSync(tasksRoot, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
	slugs.forEach((slug) => {
		const manifestPath = path.join(tasksRoot, slug, 'json', 'run-manifest.json');
		if (!fs.existsSync(manifestPath)) {
			issues.push(`${slug}: missing json/run-manifest.json`);
			return;
		}
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		if (!manifest.spec || typeof manifest.spec !== 'object') {
			issues.push(`${slug}: missing spec current/desired state`);
		} else {
			if (!String(manifest.spec.current_state || '').trim()) {
				issues.push(`${slug}: spec.current_state missing`);
			}
			if (!String(manifest.spec.desired_state || '').trim()) {
				issues.push(`${slug}: spec.desired_state missing`);
			}
		}
		if (!manifest.verification || typeof manifest.verification !== 'object') {
			issues.push(`${slug}: missing verification fields`);
		} else {
			const criteria = Array.isArray(manifest.verification.success_criteria)
				? manifest.verification.success_criteria
				: [];
			const commands = Array.isArray(manifest.verification.commands)
				? manifest.verification.commands
				: [];
			if (criteria.length === 0) {
				issues.push(`${slug}: verification.success_criteria missing`);
			}
			if (commands.length === 0) {
				issues.push(`${slug}: verification.commands missing`);
			}
		}
		if (!manifest.learn || typeof manifest.learn !== 'object') {
			issues.push(`${slug}: missing learn fields`);
		} else {
			const insights = Array.isArray(manifest.learn.insights) ? manifest.learn.insights : [];
			const followups = Array.isArray(manifest.learn.followups) ? manifest.learn.followups : [];
			if (insights.length === 0) issues.push(`${slug}: learn.insights missing`);
			if (followups.length === 0) issues.push(`${slug}: learn.followups missing`);
		}
		if (!manifest.decision_hierarchy || typeof manifest.decision_hierarchy !== 'object') {
			issues.push(`${slug}: missing decision_hierarchy fields`);
		} else {
			const tools = Array.isArray(manifest.decision_hierarchy.deterministic_tools)
				? manifest.decision_hierarchy.deterministic_tools
				: [];
			if (tools.length === 0) {
				issues.push(`${slug}: decision_hierarchy.deterministic_tools missing`);
			}
		}
	});
	return { ok: issues.length === 0, issues, skipped: false };
}

/**
 * Initialize spec-driven development artifacts.
 * @param {{rootPath: string, govRoot: string, specRoot: string, slug: string, force: boolean}} args - Inputs.
 * @returns {Array<object>} Actions performed.
 */
function initSpec({ rootPath, govRoot, specRoot, slug, force, compat }) {
	const actions = [];
	const effectiveSpecRoot = compat === 'speckit' ? path.join('.specify', 'specs') : specRoot;
	const baseRoot = path.join(rootPath, effectiveSpecRoot, slug);
	ensureDir(baseRoot, actions);
	const replaceSlug = (content) =>
		content
			.replace(/<feature-slug>/g, slug)
			.replace(/<slug>/g, slug)
			.replace(/\{\{SPEC_SLUG\}\}/g, slug)
			.replace(/\$\{SPEC_SLUG\}/g, slug);

	if (compat === 'speckit') {
		const compatRoot = path.join(rootPath, '.specify');
		const templatesRoot = path.join(compatRoot, 'templates');
		const memoryRoot = path.join(compatRoot, 'memory');
		const scriptsRoot = path.join(compatRoot, 'scripts');
		ensureDir(compatRoot, actions);
		ensureDir(templatesRoot, actions);
		ensureDir(memoryRoot, actions);
		ensureDir(scriptsRoot, actions);
		writeFile(
			path.join(memoryRoot, 'constitution.md'),
			'# Constitution (Pointer)\n\nCanonical governance lives under brainwav/governance/00-core/constitution.md.\n',
			actions,
			force
		);
		writeFile(
			path.join(templatesRoot, 'spec-template.md'),
			`${loadSpecTemplate(govRoot, 'spec').trimEnd()}\n`,
			actions,
			force
		);
		writeFile(
			path.join(templatesRoot, 'plan-template.md'),
			`${loadSpecTemplate(govRoot, 'plan').trimEnd()}\n`,
			actions,
			force
		);
		writeFile(
			path.join(templatesRoot, 'tasks-template.md'),
			`${loadSpecTemplate(govRoot, 'tasks').trimEnd()}\n`,
			actions,
			force
		);
		writeFile(
			path.join(templatesRoot, 'claude-template.md'),
			'# Claude Instructions Template\n\nUse AGENTS.md and brainwav-governance CLI instructions.\n',
			actions,
			force
		);
		writeFile(
			path.join(scriptsRoot, 'README.md'),
			'# Spec Scripts\n\nOptional helper scripts for spec workflow automation.\n',
			actions,
			force
		);
	}

	const specContent = replaceSlug(loadSpecTemplate(govRoot, 'spec'));
	const planContent = replaceSlug(loadSpecTemplate(govRoot, 'plan'));
	const tasksContent = replaceSlug(loadSpecTemplate(govRoot, 'tasks'));

	writeFile(path.join(baseRoot, 'spec.md'), `${specContent.trimEnd()}\n`, actions, force);
	writeFile(path.join(baseRoot, 'plan.md'), `${planContent.trimEnd()}\n`, actions, force);
	writeFile(path.join(baseRoot, 'tasks.md'), `${tasksContent.trimEnd()}\n`, actions, force);

	if (compat === 'speckit') {
		const contractsRoot = path.join(baseRoot, 'contracts');
		ensureDir(contractsRoot, actions);
		writeFile(
			path.join(baseRoot, 'data-model.md'),
			'# Data Model\n\nTBD\n',
			actions,
			force
		);
		writeFile(
			path.join(baseRoot, 'research.md'),
			'# Research\n\nTBD\n',
			actions,
			force
		);
		writeFile(
			path.join(baseRoot, 'quickstart.md'),
			'# Quickstart\n\nTBD\n',
			actions,
			force
		);
		writeFile(
			path.join(contractsRoot, 'README.md'),
			'# Contracts\n\nTBD\n',
			actions,
			force
		);
	}

	return actions;
}

/**
 * Initialize a task scaffold.
 * @param {{rootPath: string, taskRoot: string, slug: string, tier: string, force: boolean}} args - Inputs.
 * @returns {Array<object>} Actions performed.
 */
function initTask({ rootPath, taskRoot, slug, tier, force }) {
	const actions = [];
	const baseRoot = path.join(rootPath, taskRoot, slug);
	const jsonRoot = path.join(baseRoot, 'json');
	const logsRoot = path.join(baseRoot, 'logs');
	const vibeRoot = path.join(logsRoot, 'vibe-check');
	const researchRoot = path.join(logsRoot, 'academic-research');
	const testsRoot = path.join(logsRoot, 'tests');
	const verificationRoot = path.join(baseRoot, 'verification');

	ensureDir(baseRoot, actions);
	ensureDir(jsonRoot, actions);
	ensureDir(logsRoot, actions);
	ensureDir(vibeRoot, actions);
	ensureDir(researchRoot, actions);
	ensureDir(testsRoot, actions);
	ensureDir(verificationRoot, actions);

	writeFile(
		path.join(baseRoot, 'implementation-plan.md'),
		'# Implementation Plan\n\nTBD\n',
		actions,
		force
	);
	writeFile(
		path.join(baseRoot, 'tdd-plan.md'),
		'# TDD Plan\n\nTBD\n',
		actions,
		force
	);
	writeFile(
		path.join(baseRoot, 'implementation-checklist.md'),
		'# Implementation Checklist\n\n- [ ] TBD\n',
		actions,
		force
	);
	writeFile(path.join(baseRoot, 'SUMMARY.md'), '# Summary\n\nTBD\n', actions, force);

	const now = new Date().toISOString();
	const manifest = {
		schema: 'brainwav.governance.run-manifest.v1',
		tier,
		arcs: [],
		spec: {
			current_state: '',
			desired_state: ''
		},
		verification: {
			success_criteria: [],
			commands: []
		},
		learn: {
			insights: [],
			followups: []
		},
		decision_hierarchy: {
			deterministic_tools: [],
			cli_invocations: [],
			prompts: [],
			agents_used: []
		},
		evidence_triplet: {
			milestone_test: 'logs/tests/milestone.log',
			contract_snapshot: 'json/contracts-snapshot.json',
			reviewer_pointer: 'json/reviewer.json'
		},
		created_at: now,
		updated_at: now
	};
	writeFile(
		path.join(jsonRoot, 'run-manifest.json'),
		`${JSON.stringify(manifest, null, 2)}\n`,
		actions,
		force
	);
	writeFile(path.join(jsonRoot, 'memory-ids.json'), '[]\n', actions, force);

	writeFile(path.join(testsRoot, 'milestone.log'), '', actions, force);
	writeFile(path.join(jsonRoot, 'contracts-snapshot.json'), '', actions, force);
	writeFile(path.join(jsonRoot, 'reviewer.json'), '', actions, force);
	writeFile(path.join(verificationRoot, 'trace-context.log'), '', actions, force);

	return actions;
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

	const { command, global, flags, specFlags, loopFlags, unknown, positionalOutput } = parsed;
	if (global.json) {
		process.env.BRAINWAV_JSON = '1';
	}
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
	let requestedProfile = flags.profileProvided ? flags.profile : (configProfile ?? flags.profile);
	if (command === 'doctor' && !flags.profileProvided && !configProfile) {
		requestedProfile = 'delivery';
	}
	const normalized = normalizeProfile(requestedProfile);
	if (normalized.warned) {
		if (!global.json && !global.quiet) {
			console.warn(`[brAInwav] profile "${requestedProfile}" is legacy; using "${normalized.profile}".`);
		}
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
		if (global.report) {
			writeReport(reportPath, report);
		}
		exitWithCode(0);
		return;
	}

	if (command === 'task') {
		const subcommand = positionalOutput ?? 'init';
		if (subcommand !== 'init') {
			console.error(`[brAInwav] Unknown task subcommand "${subcommand}".`);
			exitWithCode(2);
			return;
		}
		if (!flags.taskSlug) {
			console.error('[brAInwav] Missing required --slug for task init.');
			exitWithCode(2);
			return;
		}
		if (!isSafeSlug(flags.taskSlug)) {
			console.error(`[brAInwav] Invalid task slug: ${flags.taskSlug}`);
			exitWithCode(2);
			return;
		}
		const report = {
			schema: 'brainwav.governance.task-init.v1',
			meta: buildMeta({
				root: rootPath,
				task_root: flags.taskRoot,
				slug: flags.taskSlug,
				tier: flags.taskTier
			}),
			summary: '',
			status: 'success',
			data: {
				repo_root: rootPath,
				task_root: flags.taskRoot,
				slug: flags.taskSlug,
				tier: flags.taskTier,
				actions: []
			},
			errors: []
		};
		try {
			const actions = initTask({
				rootPath,
				taskRoot: flags.taskRoot,
				slug: flags.taskSlug,
				tier: flags.taskTier,
				force: flags.force
			});
			report.data.actions = actions;
			report.summary = `task init completed (${actions.length} actions)`;
			outputReport(report, global);
			writeReport(reportPath, report);
			writeReport(outputPath, report);
			exitWithCode(0);
		} catch (error) {
			report.status = 'error';
			report.errors.push(String(error.message ?? error));
			report.summary = 'task init failed';
			outputReport(report, global);
			writeReport(reportPath, report);
			writeReport(outputPath, report);
			exitWithCode(1);
		}
		return;
	}

	if (command === 'spec') {
		const subcommand = positionalOutput ?? 'init';
		if (!['init', 'validate', 'clarify', 'analyze', 'checklist'].includes(subcommand)) {
			console.error(`[brAInwav] Unknown spec subcommand "${subcommand}".`);
			exitWithCode(2);
			return;
		}
		const specReportPath = buildReportPath(global.report, `spec-${subcommand}`, flags.dryRun);
		const specOutputPath = buildReportPath(global.output, `spec-${subcommand}`, flags.dryRun);

		if (subcommand === 'validate') {
			const report = {
				schema: 'brainwav.governance.spec-validate.v1',
			meta: buildMeta({
				root: rootPath,
				spec_root: specFlags.specRoot,
				compat: specFlags.compat
			}),
				summary: '',
				status: 'success',
				data: {
					repo_root: rootPath,
					spec_root: specFlags.specRoot,
					compat: specFlags.compat,
					layout: 'unknown',
					checks: []
				},
				errors: []
			};
			try {
				const result = runSpecKitValidation(rootPath, specFlags.specRoot, specFlags.compat);
				report.data.layout = result.layout;
				report.data.checks = normalizeChecks(result.checks);
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
				writeReport(specReportPath, report);
				writeReport(specOutputPath, report);
				enforceExitCode(report.status, warned, flags.strict, 3, 4);
			} catch (error) {
				report.status = 'error';
				report.errors.push(String(error.message ?? error));
				report.summary = 'spec validate failed';
				outputReport(report, global);
				writeReport(specReportPath, report);
				writeReport(specOutputPath, report);
				exitWithCode(1);
			}
			return;
		}

		if (subcommand === 'clarify' || subcommand === 'analyze' || subcommand === 'checklist') {
			const report = {
				schema: `brainwav.governance.spec-${subcommand}.v1`,
				meta: buildMeta({
					root: rootPath,
					spec_root: specFlags.specRoot,
					compat: specFlags.compat
				}),
				summary: '',
				status: 'success',
				data: {
					repo_root: rootPath,
					spec_root: specFlags.specRoot,
					compat: specFlags.compat,
					checks: []
				},
				errors: []
			};
			try {
				const layout = runSpecKitValidation(rootPath, specFlags.specRoot, specFlags.compat);
				const specRoot = layout.specRoot ?? path.join(rootPath, specFlags.specRoot);
				const chain = checkSpecChain(rootPath, path.relative(rootPath, specRoot));
				if (subcommand === 'clarify') {
					const issues = [...chain.missing, ...chain.issues].filter((issue) =>
						issue.includes('Current state') ||
						issue.includes('Desired state') ||
						issue.includes('Success criteria') ||
						issue.includes('How we will verify')
					);
					report.data.checks = normalizeChecks([
						buildCheck(
							'spec.clarify.missing',
							issues.length > 0 ? 'warn' : 'pass',
							'medium',
							'spec',
							issues.length > 0 ? `missing requirements: ${issues.join(', ')}` : 'clarify ok'
						)
					]);
				}
				if (subcommand === 'analyze') {
					const issues = [...chain.missing, ...chain.issues];
					report.data.checks = normalizeChecks([
						buildCheck(
							'spec.analyze.consistency',
							issues.length > 0 ? 'warn' : 'pass',
							'medium',
							'spec',
							issues.length > 0 ? `consistency issues: ${issues.join(', ')}` : 'analysis ok'
						)
					]);
				}
				if (subcommand === 'checklist') {
					const checklistMissing = [];
					const specRootPath = specRoot;
					const dirs = listSpecDirs(specRootPath);
					dirs.forEach((dir) => {
						const specContent = readSpecFile(specRootPath, dir, 'spec.md');
						if (!specContent) {
							checklistMissing.push(`${dir}/spec.md missing`);
							return;
						}
						if (!specContent.includes('Non-goals')) {
							checklistMissing.push(`${dir}/spec.md missing Non-goals`);
						}
						if (!specContent.includes('Risks')) {
							checklistMissing.push(`${dir}/spec.md missing Risks`);
						}
						if (!specContent.includes('Assumptions')) {
							checklistMissing.push(`${dir}/spec.md missing Assumptions`);
						}
						if (!specContent.includes('Requirements')) {
							checklistMissing.push(`${dir}/spec.md missing Requirements`);
						}
					});
					report.data.checks = normalizeChecks([
						buildCheck(
							'spec.checklist.missing',
							checklistMissing.length > 0 ? 'warn' : 'pass',
							'low',
							'spec',
							checklistMissing.length > 0
								? `checklist gaps: ${checklistMissing.join(', ')}`
								: 'checklist ok'
						)
					]);
				}
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
				writeReport(specReportPath, report);
				writeReport(specOutputPath, report);
				enforceExitCode(report.status, warned, flags.strict, 3, 4);
			} catch (error) {
				report.status = 'error';
				report.errors.push(String(error.message ?? error));
				report.summary = `spec ${subcommand} failed`;
				outputReport(report, global);
				writeReport(specReportPath, report);
				writeReport(specOutputPath, report);
				exitWithCode(1);
			}
			return;
		}

		if (!flags.taskSlug) {
			console.error('[brAInwav] Missing required --slug for spec init.');
			exitWithCode(2);
			return;
		}
		if (!isSafeSlug(flags.taskSlug)) {
			console.error(`[brAInwav] Invalid spec slug: ${flags.taskSlug}`);
			exitWithCode(2);
			return;
		}
		if (specFlags.compat === 'speckit') {
			const speckitPattern = /^\d{3}-[a-z0-9][a-z0-9-]*$/;
			if (!speckitPattern.test(flags.taskSlug)) {
				const message =
					`spec-kit slugs must match ^\\d{3}-[a-z0-9][a-z0-9-]*$ (got "${flags.taskSlug}")`;
				if (normalizedProfile === 'delivery' || normalizedProfile === 'release') {
					console.error(`[brAInwav] ${message}`);
					exitWithCode(1);
					return;
				}
				if (!global.json && !global.quiet) {
					console.warn(`[brAInwav] ${message}`);
				}
			}
		}
		const installedPacks = readInstalledPacks(rootPath, configPath);
		const hasSddPack = installedPacks?.packs?.includes('sdd');
		if (!hasSddPack) {
			const message =
				'spec init called without the sdd pack enabled. Add "sdd" to .agentic-governance/config.json packs.';
			if (flags.strict) {
				console.error(`[brAInwav] ${message}`);
				exitWithCode(1);
				return;
			}
			if (!global.json && !global.quiet) {
				console.warn(`[brAInwav] ${message}`);
			}
		}
		const { govRoot } = resolveGovernancePaths(rootPath);
		const report = {
			schema: 'brainwav.governance.spec-init.v1',
			meta: buildMeta({
				root: rootPath,
				spec_root: specFlags.specRoot,
				slug: flags.taskSlug,
				compat: specFlags.compat
			}),
			summary: '',
			status: 'success',
			data: {
				repo_root: rootPath,
				spec_root: specFlags.specRoot,
				compat: specFlags.compat,
				slug: flags.taskSlug,
				actions: []
			},
			errors: []
		};
		try {
			const actions = initSpec({
				rootPath,
				govRoot,
				specRoot: specFlags.specRoot,
				slug: flags.taskSlug,
				force: flags.force,
				compat: specFlags.compat
			});
			report.data.actions = actions;
			report.summary = `spec init completed (${actions.length} actions)`;
			outputReport(report, global);
			writeReport(specReportPath, report);
			writeReport(specOutputPath, report);
			exitWithCode(0);
		} catch (error) {
			report.status = 'error';
			report.errors.push(String(error.message ?? error));
			report.summary = 'spec init failed';
			outputReport(report, global);
			writeReport(specReportPath, report);
			writeReport(specOutputPath, report);
			exitWithCode(1);
		}
		return;
	}

	if (command === 'loop') {
		const subcommand = positionalOutput ?? 'run';
		if (subcommand !== 'run') {
			console.error(`[brAInwav] Unknown loop subcommand "${subcommand}".`);
			exitWithCode(2);
			return;
		}
		if (!loopFlags.loopSlug) {
			console.error('[brAInwav] Missing required --slug for loop run.');
			exitWithCode(2);
			return;
		}
		if (!isSafeSlug(loopFlags.loopSlug)) {
			console.error(`[brAInwav] Invalid loop slug: ${loopFlags.loopSlug}`);
			exitWithCode(2);
			return;
		}
		const resolvedConfig = resolveRootPath(rootPath, loopFlags.loopConfig);
		const exitCode = runAgentLoop({
			slug: loopFlags.loopSlug,
			configPath: resolvedConfig ?? loopFlags.loopConfig,
			cwd: rootPath
		});
		exitWithCode(exitCode);
		return;
	}

	if (command === 'install' || command === 'init') {
		const selectedPacks = resolvePacksSafe(flags.packs);
		if (!selectedPacks) return;
		if (selectedPacks.length === 0 && (normalizedProfile === 'delivery' || normalizedProfile === 'release')) {
			selectedPacks.push('sdd');
		}
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
		const selectedPacks = resolvePacksSafe(flags.packs);
		if (!selectedPacks) return;
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
					noInstall: flags.noInstall,
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
		const selectedPacks = resolvePacksSafe(flags.packs);
		if (!selectedPacks) return;
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
		const result = runReadinessCheck(rootPath, normalizedProfile);
		report.data.checks = normalizeChecks(result.checks);
		const { manifests, missing } = loadPackManifestsForRoot(rootPath, selectedPacks);
		if (flags.packs.length > 0 && missing.length > 0) {
			console.error(`[brAInwav] Unknown packs: ${missing.join(', ')}`);
			exitWithCode(2);
			return;
		}
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
		const profileSummaries = {};
		['creative', 'delivery', 'release'].forEach((profile) => {
			const summaryResult = runReadinessCheck(rootPath, profile);
			if (summaryResult.ok) {
				profileSummaries[profile] = 'pass';
				return;
			}
			profileSummaries[profile] = profile === 'release' ? 'fail' : 'warn';
		});
		report.data.profiles = profileSummaries;
		outputReport(report, global);
		writeReport(reportPath, report);
		writeReport(outputPath, report);
		if (global.plain && !global.json) {
			console.log('Profile readiness:');
			Object.entries(profileSummaries).forEach(([profile, status]) => {
				console.log(`  ${profile.padEnd(8)}: ${status.toUpperCase()}`);
			});
		}
		enforceExitCode(report.status, warned, flags.strict, 1, 4);
		return;
	}

	if (command === 'validate') {
		const selectedPacks = resolvePacksSafe(flags.packs);
		if (!selectedPacks) return;
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
		if (flags.packs.length > 0 && missing.length > 0) {
			console.error(`[brAInwav] Unknown packs: ${missing.join(', ')}`);
			exitWithCode(2);
			return;
		}
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

		const { govRoot, indexPath, pointerPath } = resolveGovernancePaths(rootPath);
		const pointer = pointerPath && fs.existsSync(pointerPath)
			? JSON.parse(fs.readFileSync(pointerPath, 'utf8'))
			: null;
		const jsonPretty = checkPrettyJson(indexPath, govRoot, rootPath);
		if (!jsonPretty.ok) {
			const status = normalizedProfile === 'release' ? 'fail' : 'warn';
			checks.push(
				buildCheck(
					'governance.json.pretty',
					status,
					'medium',
					'policy',
					`JSON formatting not pretty: ${jsonPretty.issues.join(', ')}`
				)
			);
		} else {
			checks.push(buildCheck('governance.json.pretty', 'pass', 'info', 'policy', 'governance JSON formatting ok'));
		}

		const standardsFreshness = checkStandardsFreshness(govRoot);
		if (!standardsFreshness.ok) {
			const status = statusFromRelease(normalizedProfile);
			checks.push(
				buildCheck(
					'standards.freshness',
					status,
					'medium',
					'policy',
					standardsFreshness.message
				)
			);
		} else {
			checks.push(
				buildCheck('standards.freshness', 'pass', 'info', 'policy', standardsFreshness.message)
			);
		}

		if (!evidenceCheck.ok) {
			const status = statusFromRelease(normalizedProfile);
			evidenceCheck.failures.forEach((failure) => {
				checks.push(buildCheck('evidence.task', status, 'medium', 'evidence', failure));
			});
		} else if (evidenceCheck.skipped) {
			const status = normalizedProfile === 'release' ? 'warn' : 'info';
			checks.push(
				buildCheck('evidence.task', status, 'low', 'evidence', 'no tasks directory; evidence checks skipped')
			);
		} else {
			checks.push(buildCheck('evidence.task', 'pass', 'info', 'evidence', 'task evidence ok'));
		}

		const driftFailures = checkPortfolioDrift(rootPath, pointer);
		if (pointer?.mode === 'pointer') {
			if (driftFailures.length > 0) {
				const status = statusFromRelease(normalizedProfile);
				driftFailures.forEach((failure) => {
					checks.push(buildCheck('portfolio.drift', status, 'medium', 'policy', failure));
				});
			} else {
				checks.push(buildCheck('portfolio.drift', 'pass', 'info', 'policy', 'portfolio pinning ok'));
			}
		}

		const riskEvidence = checkRiskRegisterEvidence(rootPath);
		if (riskEvidence.skipped) {
			const status = normalizedProfile === 'release' ? 'warn' : 'info';
			checks.push(
				buildCheck('evidence.data_governance', status, 'low', 'evidence', 'no tasks directory; data governance checks skipped')
			);
			checks.push(
				buildCheck('evidence.vendor_governance', status, 'low', 'evidence', 'no tasks directory; vendor governance checks skipped')
			);
		} else {
			if (riskEvidence.dataIssues.length > 0) {
				const status = statusFromRelease(normalizedProfile);
				riskEvidence.dataIssues.forEach((failure) => {
					checks.push(buildCheck('evidence.data_governance', status, 'medium', 'evidence', failure));
				});
			} else {
				checks.push(buildCheck('evidence.data_governance', 'pass', 'info', 'evidence', 'data governance evidence ok'));
			}
			if (riskEvidence.vendorIssues.length > 0) {
				const status = statusFromRelease(normalizedProfile);
				riskEvidence.vendorIssues.forEach((failure) => {
					checks.push(buildCheck('evidence.vendor_governance', status, 'medium', 'evidence', failure));
				});
			} else {
				checks.push(buildCheck('evidence.vendor_governance', 'pass', 'info', 'evidence', 'vendor governance evidence ok'));
			}
		}

		const specRoot = installedPacks.packOptions?.sdd?.specRoot ?? 'specs';
		if (normalizedProfile === 'delivery' || normalizedProfile === 'release') {
			if (!expectedPacks.includes('sdd')) {
				const status = statusFromProfile(normalizedProfile);
				checks.push(
					buildCheck(
						'spec-chain.present',
						status,
						'medium',
						'spec',
						'sdd pack required for delivery/release profiles'
					)
				);
			}
		}
		if (expectedPacks.includes('sdd')) {
			const chain = checkSpecChain(rootPath, specRoot);
			if (chain.missing.length > 0) {
				checks.push(
					buildCheck(
						'spec-chain.present',
						statusFromProfile(normalizedProfile),
						'medium',
						'spec',
						`spec chain missing: ${chain.missing.join(', ')}`
					)
				);
			} else {
				checks.push(buildCheck('spec-chain.present', 'pass', 'info', 'spec', 'spec chain present'));
			}
			if (chain.issues.length > 0) {
				checks.push(
					buildCheck(
						'spec-chain.consistency',
						statusFromRelease(normalizedProfile),
						'medium',
						'spec',
						`spec chain inconsistencies: ${chain.issues.join(', ')}`
					)
				);
			} else {
				checks.push(
					buildCheck('spec-chain.consistency', 'pass', 'info', 'spec', 'spec chain consistent')
				);
			}
			const verifyIssues = chain.issues.filter((issue) =>
				issue.includes('Success criteria') || issue.includes('How we will verify')
			);
			if (verifyIssues.length > 0) {
				checks.push(
					buildCheck(
						'verification.criteria.present',
						statusFromRelease(normalizedProfile),
						'medium',
						'spec',
						`verification criteria missing: ${verifyIssues.join(', ')}`
					)
				);
			} else {
				checks.push(
					buildCheck('verification.criteria.present', 'pass', 'info', 'spec', 'verification criteria present')
				);
			}
		}

		const runManifestPAI = checkRunManifestPAI(rootPath);
		if (runManifestPAI.skipped) {
			const status = normalizedProfile === 'release' ? 'warn' : 'info';
			checks.push(
				buildCheck(
					'verification.criteria.present',
					status,
					'low',
					'evidence',
					'no tasks directory; verification criteria checks skipped'
				)
			);
			checks.push(
				buildCheck(
					'learn.fields.present',
					status,
					'low',
					'evidence',
					'no tasks directory; learn fields checks skipped'
				)
			);
			checks.push(
				buildCheck(
					'decision.hierarchy.present',
					status,
					'low',
					'evidence',
					'no tasks directory; decision hierarchy checks skipped'
				)
			);
		} else {
			const verificationIssues = runManifestPAI.issues.filter((issue) => issue.includes('verification.'));
			const learnIssues = runManifestPAI.issues.filter((issue) => issue.includes('learn.'));
			const decisionIssues = runManifestPAI.issues.filter((issue) => issue.includes('decision_hierarchy'));
			if (verificationIssues.length > 0) {
				checks.push(
					buildCheck(
						'verification.criteria.present',
						statusFromRelease(normalizedProfile),
						'medium',
						'evidence',
						verificationIssues.join('; ')
					)
				);
			} else {
				checks.push(
					buildCheck('verification.criteria.present', 'pass', 'info', 'evidence', 'verification criteria ok')
				);
			}
			if (learnIssues.length > 0) {
				checks.push(
					buildCheck(
						'learn.fields.present',
						statusFromRelease(normalizedProfile),
						'medium',
						'evidence',
						learnIssues.join('; ')
					)
				);
			} else {
				checks.push(
					buildCheck('learn.fields.present', 'pass', 'info', 'evidence', 'learn fields ok')
				);
			}
			if (decisionIssues.length > 0) {
				checks.push(
					buildCheck(
						'decision.hierarchy.present',
						statusFromRelease(normalizedProfile),
						'medium',
						'evidence',
						decisionIssues.join('; ')
					)
				);
			} else {
				checks.push(
					buildCheck('decision.hierarchy.present', 'pass', 'info', 'evidence', 'decision hierarchy ok')
				);
			}
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

	if (command === 'cleanup-plan') {
		const { indexPath, pointerPath } = resolveGovernancePaths(rootPath);
		const pointer = pointerPath && fs.existsSync(pointerPath)
			? JSON.parse(fs.readFileSync(pointerPath, 'utf8'))
			: null;
		if (!pointer || pointer.mode !== 'pointer') {
			console.error('[brAInwav] cleanup-plan requires pointer mode (missing or non-pointer .agentic-governance/pointer.json).');
			exitWithCode(2);
			return;
		}
		const inputs = {
			root: rootPath,
			mode: pointer.mode,
			profile: normalizedProfile
		};
		const plan = buildCleanupPlan(rootPath, pointer, indexPath);
		const applied = [];
		if (global.apply) {
			const applyActions = [...plan.actions].sort((a, b) => {
				if (a.action === b.action) return 0;
				if (a.action === 'move') return -1;
				if (b.action === 'move') return 1;
				return 0;
			});
			applyActions.forEach((action) => {
				const targetPath = path.join(rootPath, action.path);
				if (action.action === 'delete') {
					try {
						fs.rmSync(targetPath, { recursive: true, force: true });
						applied.push({ ...action, status: 'deleted' });
					} catch (error) {
						applied.push({ ...action, status: 'failed', error: error.message });
					}
					return;
				}
				if (action.action === 'move') {
					const destPath = path.join(rootPath, action.target);
					try {
						const destDir = path.dirname(destPath);
						fs.mkdirSync(destDir, { recursive: true });
						if (fs.existsSync(destPath) && !flags.force) {
							applied.push({
								...action,
								status: 'skipped',
								error: 'target exists (use --force to overwrite)'
							});
							return;
						}
						fs.renameSync(targetPath, destPath);
						applied.push({ ...action, status: 'moved' });
					} catch (error) {
						applied.push({ ...action, status: 'failed', error: error.message });
					}
				}
			});
		}
		const failedApply = applied.some((item) => item.status === 'failed');
		const status = failedApply
			? 'error'
			: global.apply
				? 'success'
				: plan.actions.length > 0
					? 'warn'
					: 'success';
		const report = {
			schema: 'brainwav.governance.cleanup-plan.v1',
			meta: buildMeta(inputs),
			summary: `${status}: ${plan.actions.length} actions`,
			status,
			data: {
				repo_root: rootPath,
				actions: plan.actions,
				warnings: plan.warnings,
				applied: global.apply ? applied : []
			},
			errors: []
		};
		outputReport(report, global);
		writeReport(reportPath, report);
		writeReport(outputPath, report);
		if (global.apply) {
			const appliedReport = {
				schema: 'brainwav.governance.cleanup-apply.v1',
				meta: buildMeta(inputs),
				summary: `${applied.length} actions applied`,
				status: failedApply ? 'error' : 'success',
				data: {
					repo_root: rootPath,
					applied
				},
				errors: []
			};
			const appliedDir = reportPath ? path.dirname(reportPath) : rootPath;
			const appliedPath = path.join(appliedDir, 'cleanup.applied.json');
			writeReport(appliedPath, appliedReport);
		}
		if (failedApply) {
			exitWithCode(1);
			return;
		}
		if (!global.apply && plan.actions.length > 0) {
			exitWithCode(4);
			return;
		}
		exitWithCode(0);
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
