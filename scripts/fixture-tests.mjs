#!/usr/bin/env node
/**
 * @fileoverview Fixture-based CLI idempotence tests.
 * @license Apache-2.0
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const cliPath = path.join(repoRoot, 'scripts', 'governance-cli.mjs');

/**
 * Resolve fixture directory path.
 * @param {string} name - Fixture name.
 * @returns {string} Fixture path.
 */
function fixturePath(name) {
	return path.join(repoRoot, 'fixtures', name);
}

/**
 * Create a temporary working directory.
 * @param {string} name - Directory prefix.
 * @returns {string} Temporary path.
 */
function createTempDir(name) {
	return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

/**
 * Run the governance CLI.
 * @param {string[]} args - CLI arguments.
 * @param {string} cwd - Working directory.
 * @param {number[]} allowedStatuses - Allowed exit codes.
 * @param {string|null} reportPath - Optional report path for failure details.
 * @returns {void} No return value.
 */
function runCli(args, cwd, allowedStatuses = [0], reportPath = null) {
	const result = spawnSync(process.execPath, [cliPath, ...args], {
		cwd,
		encoding: 'utf8'
	});
	if (!allowedStatuses.includes(result.status ?? 0)) {
		let reportPayload = '';
		if (reportPath && fs.existsSync(reportPath)) {
			reportPayload = `\n${fs.readFileSync(reportPath, 'utf8')}`;
		}
		const output = `${result.stdout}\n${result.stderr}${reportPayload}`;
		const hint = output.includes('Node version out of range')
			? '\nHint: switch to Node 24.11.x (policy is >=24.11.0 <25) and rerun pnpm test:fixtures.'
			: '';
		throw new Error(
			`CLI failed (${args.join(' ')}): ${result.status}\n${output}${hint}`
		);
	}
}

/**
 * Install the local governance package into a fixture (pointer mode).
 * @param {string} repoRootPath - Fixture repo root.
 * @returns {void} No return value.
 */
function installLocalGovernancePackage(repoRootPath) {
	const nodeModules = path.join(repoRootPath, 'node_modules');
	const scopeDir = path.join(nodeModules, '@brainwav');
	const target = path.join(scopeDir, 'brainwav-agentic-governance');
	fs.mkdirSync(scopeDir, { recursive: true });
	if (fs.existsSync(target)) {
		fs.rmSync(target, { recursive: true, force: true });
	}
	fs.symlinkSync(repoRoot, target, 'dir');
}

/**
 * Copy fixture into a temp directory.
 * @param {string} name - Fixture name.
 * @returns {string} Temp directory path.
 */
function copyFixture(name) {
	const source = fixturePath(name);
	assert.ok(fs.existsSync(source), `missing fixture: ${name}`);
	const dest = createTempDir(`brainwav-fixture-${name}`);
	const entries = fs.readdirSync(source, { withFileTypes: true });
	entries.forEach((entry) => {
		const srcPath = path.join(source, entry.name);
		const destPath = path.join(dest, entry.name);
		fs.cpSync(srcPath, destPath, { recursive: true });
	});
	return dest;
}

/**
 * Copy canonical root docs needed for hash checks.
 * @param {string} repoRootPath - Target repo root.
 * @returns {void} No return value.
 */
function syncRootDocs(repoRootPath) {
	const docs = ['README.md', 'CODESTYLE.md', 'SECURITY.md'];
	docs.forEach((doc) => {
		const source = path.join(repoRoot, doc);
		const dest = path.join(repoRootPath, doc);
		if (fs.existsSync(source)) {
			fs.copyFileSync(source, dest);
		}
	});
}

/**
 * Update config.json with packOptions.
 * @param {string} repoRootPath - Repo root.
 * @param {Record<string, unknown>} packOptions - Pack options.
 * @returns {void} No return value.
 */
function writePackOptions(repoRootPath, packOptions) {
	const configPath = path.join(repoRootPath, '.agentic-governance', 'config.json');
	const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	config.packOptions = { ...(config.packOptions ?? {}), ...packOptions };
	fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

/**
 * Update config.json with overlays and write overlay files.
 * @param {string} repoRootPath - Repo root.
 * @param {Array<{name: string, paths: string[]}>} overlays - Overlay definitions.
 * @returns {void} No return value.
 */
function writeOverlays(repoRootPath, overlays) {
	if (!Array.isArray(overlays) || overlays.length === 0) return;
	const configPath = path.join(repoRootPath, '.agentic-governance', 'config.json');
	const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	config.overlays = overlays;
	fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
	overlays.forEach((overlay) => {
		(overlay.paths ?? []).forEach((overlayPath) => {
			const targetPath = path.join(repoRootPath, overlayPath);
			fs.mkdirSync(path.dirname(targetPath), { recursive: true });
			if (!fs.existsSync(targetPath)) {
				fs.writeFileSync(targetPath, `# ${overlay.name ?? 'overlay'}\n`);
			}
		});
	});
}

/**
 * Ensure config exists with pack options before install.
 * @param {string} repoRootPath - Repo root.
 * @param {string[]} packs - Pack identifiers.
 * @param {Record<string, unknown>} packOptions - Pack options.
 * @returns {void} No return value.
 */
function ensurePackOptionsConfig(repoRootPath, packs, packOptions) {
	const configDir = path.join(repoRootPath, '.agentic-governance');
	const configPath = path.join(configDir, 'config.json');
	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}
	let config = {
		version: '1.0',
		mode: 'full',
		profile: 'release',
		packs: [...packs],
		packOptions: {},
		overlays: []
	};
	if (fs.existsSync(configPath)) {
		config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	}
	config.packs = Array.from(new Set([...(config.packs ?? []), ...packs]));
	config.packOptions = { ...(config.packOptions ?? {}), ...packOptions };
	fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

/**
 * Run install/upgrade/validate/doctor for a fixture.
 * @param {{name: string, packs: string[], packOptions?: Record<string, unknown>, mode?: string, profile?: string}} fixture - Fixture definition.
 * @returns {void} No return value.
 */
function runFixtureLifecycle(fixture) {
	const tempRoot = copyFixture(fixture.name);
	try {
		const basePacks = Array.isArray(fixture.packs) ? fixture.packs : [];
		const packs =
			fixture.requireSdd === false ? basePacks : Array.from(new Set(['sdd', ...basePacks]));
		const packsArg = packs.join(',');
		const mode = fixture.mode ?? 'full';
		const profile = fixture.profile ?? 'delivery';
		const commonArgs = [
			'--root',
			tempRoot,
			'--mode',
			mode,
			'--profile',
			profile,
			...(packsArg ? ['--packs', packsArg] : []),
			'--no-input',
			'--yes'
		];
		if (mode === 'pointer') {
			installLocalGovernancePackage(tempRoot);
		}
		if (fixture.packOptions) {
			ensurePackOptionsConfig(tempRoot, packs, fixture.packOptions);
		}
		if (mode === 'pointer') {
			runCli(['install', ...commonArgs, '--no-install'], repoRoot);
		} else {
			runCli(['install', ...commonArgs], repoRoot);
		}

		if (fixture.packOptions) {
			writePackOptions(tempRoot, fixture.packOptions);
		}
		if (fixture.overlays) {
			writeOverlays(tempRoot, fixture.overlays);
		}

		if (mode === 'full') {
			syncRootDocs(tempRoot);
		}

		if (mode === 'pointer') {
			runCli(['install', ...commonArgs, '--no-install'], repoRoot);
		} else {
			runCli(['install', ...commonArgs], repoRoot);
		}

		if (mode === 'pointer') {
			runCli(['upgrade', ...commonArgs, '--no-install'], repoRoot);
			if (fixture.upgradeTwice) {
				runCli(['upgrade', ...commonArgs, '--no-install'], repoRoot);
			}
		} else {
			runCli(['upgrade', ...commonArgs], repoRoot);
			if (fixture.upgradeTwice) {
				runCli(['upgrade', ...commonArgs], repoRoot);
			}
		}

		if (fixture.specInit !== false) {
			const specRoot = fixture.specRoot ?? 'specs';
			const compatArg = fixture.specCompat ? ['--compat', fixture.specCompat] : [];
			const slug = fixture.specSlug ?? 'fixture-spec';
			runCli(
				[
					'spec',
					'init',
					'--root',
					tempRoot,
					'--slug',
					slug,
					'--spec-root',
					specRoot,
					...compatArg,
					'--no-input',
					'--yes'
				],
				repoRoot
			);
			if (fixture.specCommands) {
				runCli(
					[
						'spec',
						'validate',
						'--root',
						tempRoot,
						'--spec-root',
						specRoot,
						...compatArg
					],
					repoRoot,
					[0, 4]
				);
				runCli(
					[
						'spec',
						'clarify',
						'--root',
						tempRoot,
						'--spec-root',
						specRoot,
						...compatArg
					],
					repoRoot,
					[0, 4]
				);
				runCli(
					[
						'spec',
						'analyze',
						'--root',
						tempRoot,
						'--spec-root',
						specRoot,
						...compatArg
					],
					repoRoot,
					[0, 4]
				);
				runCli(
					[
						'spec',
						'checklist',
						'--root',
						tempRoot,
						'--spec-root',
						specRoot,
						...compatArg
					],
					repoRoot,
					[0, 4]
				);
			}
		}

		if (fixture.pointerAfterFull) {
			const pointerArgs = [...commonArgs];
			const modeIndex = pointerArgs.indexOf('--mode');
			if (modeIndex !== -1) {
				pointerArgs[modeIndex + 1] = 'pointer';
			}
			const configPath = path.join(tempRoot, '.agentic-governance', 'config.json');
			if (fs.existsSync(configPath)) {
				const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
				config.mode = 'pointer';
				fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
			}
			installLocalGovernancePackage(tempRoot);
			runCli(['install', ...pointerArgs, '--no-install', '--force'], repoRoot);

			const preCleanupReport = path.join(tempRoot, 'validate.pre-cleanup.report.json');
			runCli(
				[
					'validate',
					'--root',
					tempRoot,
					'--config',
					'.agentic-governance/config.json',
					'--report',
					preCleanupReport,
					'--plain'
				],
				repoRoot,
				[3],
				preCleanupReport
			);

			const cleanupReport = path.join(tempRoot, 'cleanup-plan.json');
			runCli(
				[
					'cleanup-plan',
					'--root',
					tempRoot,
					'--report',
					cleanupReport,
					'--apply',
					'--force'
				],
				repoRoot,
				[0],
				cleanupReport
			);

			runCli(['install', ...pointerArgs, '--no-install'], repoRoot);

			const postCleanupReport = path.join(tempRoot, 'validate.post-cleanup.report.json');
			runCli(
				[
					'validate',
					'--root',
					tempRoot,
					'--config',
					'.agentic-governance/config.json',
					'--report',
					postCleanupReport,
					'--plain'
				],
				repoRoot,
				[0, 4],
				postCleanupReport
			);
		}

		const validateReport = path.join(tempRoot, 'validate.report.json');
		runCli(
			[
				'validate',
				'--root',
				tempRoot,
				'--config',
				'.agentic-governance/config.json',
				'--report',
				validateReport,
				'--plain'
			],
			repoRoot,
			[0, 4],
			validateReport
		);

		const doctorReport = path.join(tempRoot, 'doctor.report.json');
		runCli(
			[
				'doctor',
				'--root',
				tempRoot,
				'--config',
				'.agentic-governance/config.json',
				'--report',
				doctorReport,
				'--plain'
			],
			repoRoot,
			[0, 4],
			doctorReport
		);
	} finally {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
}

/**
 * CLI entry point.
 * @returns {void} No return value.
 */
function main() {
	const fixtures = [
		{
			name: 'pointer-minimal',
			packs: [],
			mode: 'pointer',
			profile: 'delivery'
		},
		{
			name: 'full-minimal',
			packs: [],
			mode: 'full',
			profile: 'delivery',
			specCompat: 'speckit',
			specSlug: '001-fixture-spec',
			specCommands: true,
			packOptions: {
				sdd: {
					specRoot: '.specify/specs'
				}
			}
		},
		{
			name: 'full-minimal',
			packs: [],
			mode: 'full',
			profile: 'delivery',
			specCompat: 'speckit',
			specSlug: '001-pointer-after-full',
			pointerAfterFull: true,
			upgradeTwice: true,
			packOptions: {
				sdd: {
					specRoot: '.specify/specs'
				}
			}
		},
		{
			name: 'vite-react-tailwind',
			packs: ['ts-base', 'react-vite', 'tailwind']
		},
		{
			name: 'storybook',
			packs: ['ts-base', 'storybook']
		},
		{
			name: 'cloudflare-workers',
			packs: ['ts-base', 'cloudflare-workers']
		},
		{
			name: 'swift-appkit',
			packs: ['swift-appkit'],
			packOptions: {
				'swift-appkit': {
					xcode: {
						project: 'SampleApp.xcodeproj',
						scheme: 'SampleApp',
						destination: 'platform=macOS,arch=x86_64'
					},
					entitlements: {
						paths: ['SampleApp.entitlements']
					},
					privacy: {
						plists: ['Info.plist'],
						requiredKeys: ['NSCameraUsageDescription']
					}
				}
			},
			overlays: [
				{
					name: 'swift-local',
					paths: ['.agentic-governance/overlays/swift.local.md']
				}
			]
		},
		{
			name: 'pnpm-monorepo',
			packs: ['ts-base']
		}
	];

	fixtures.forEach((fixture) => runFixtureLifecycle(fixture));
	console.log('[brAInwav] fixture tests passed.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('fixture-tests.mjs')) {
	main();
}

export default main;
