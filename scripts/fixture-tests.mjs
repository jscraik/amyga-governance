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
		throw new Error(
			`CLI failed (${args.join(' ')}): ${result.status}\n${result.stdout}\n${result.stderr}${reportPayload}`
		);
	}
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
 * @param {{name: string, packs: string[], packOptions?: Record<string, unknown>}} fixture - Fixture definition.
 * @returns {void} No return value.
 */
function runFixtureLifecycle(fixture) {
	const tempRoot = copyFixture(fixture.name);
	try {
		const packsArg = fixture.packs.join(',');
		if (fixture.packOptions) {
			ensurePackOptionsConfig(tempRoot, fixture.packs, fixture.packOptions);
		}
		runCli(
			[
				'install',
				'--root',
				tempRoot,
				'--mode',
				'full',
				'--profile',
				'release',
				'--packs',
				packsArg,
				'--no-input',
				'--yes'
			],
			repoRoot
		);

		if (fixture.packOptions) {
			writePackOptions(tempRoot, fixture.packOptions);
		}

		syncRootDocs(tempRoot);

		runCli(
			[
				'install',
				'--root',
				tempRoot,
				'--mode',
				'full',
				'--profile',
				'release',
				'--packs',
				packsArg,
				'--no-input',
				'--yes'
			],
			repoRoot
		);

		runCli(
			[
				'upgrade',
				'--root',
				tempRoot,
				'--mode',
				'full',
				'--profile',
				'release',
				'--packs',
				packsArg,
				'--no-input',
				'--yes'
			],
			repoRoot
		);

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
			[0],
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
			}
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
