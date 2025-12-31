#!/usr/bin/env node
/**
 * @fileoverview Install governance pack into a target project (files + CI workflow).
 * @license Apache-2.0
 *
 * Usage:
 *   pnpm governance:install --dest /path/to/consumer [--mode full|pointer] [--profile core|creative|full]
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const COPY_LIST = [
	'AGENTS.md',
	'CODESTYLE.md',
	'SECURITY.md',
	'brainwav',
	'.github/ISSUE_TEMPLATE',
	'.github/pull_request_template.md',
];

function parseArgs() {
	const args = process.argv.slice(2);
	let dest;
	let mode = 'full';
	let profile = 'creative';
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--dest' && args[i + 1]) dest = args[i + 1];
		if (args[i] === '--mode' && args[i + 1]) mode = args[i + 1];
		if (args[i] === '--profile' && args[i + 1]) profile = args[i + 1];
	}
	if (!dest) {
		throw new Error('Missing --dest <path> for target project');
	}
	if (!['full', 'pointer'].includes(mode)) {
		throw new Error('Invalid --mode. Use "full" or "pointer".');
	}
	if (!['core', 'creative', 'full'].includes(profile)) {
		throw new Error('Invalid --profile. Use "core", "creative", or "full".');
	}
	return { dest: path.resolve(dest), mode, profile };
}

function copyRecursive(src, dest) {
	fs.cpSync(src, dest, { recursive: true });
	console.log(`[brAInwav] copied ${path.relative(repoRoot, src)} -> ${dest}`);
}

function writeConfigFile(destRoot, profile, mode) {
	const configDir = path.join(destRoot, '.agentic-governance');
	fs.mkdirSync(configDir, { recursive: true });
	const schemaPath = mode === 'pointer'
		? 'node_modules/brainwav-agentic-governance/brainwav/governance/90-infra/agentic-config.schema.json'
		: 'brainwav/governance/90-infra/agentic-config.schema.json';
	const configPayload = {
		$schema: schemaPath,
		version: '1.0',
		profile,
		overlays: []
	};
	fs.writeFileSync(
		path.join(configDir, 'config.json'),
		`${JSON.stringify(configPayload, null, 2)}\n`
	);
}

function writePointerFiles(destRoot, profile) {
	const pointerDir = path.join(destRoot, '.agentic-governance');
	fs.mkdirSync(pointerDir, { recursive: true });
	const pointerPayload = {
		mode: 'pointer',
		profile,
		package: 'brainwav-agentic-governance',
		packageRoot: 'node_modules/brainwav-agentic-governance',
		governanceRoot: 'node_modules/brainwav-agentic-governance/brainwav/governance',
		governanceIndexPath:
			'node_modules/brainwav-agentic-governance/brainwav/governance/90-infra/governance-index.json',
		agentsPath: 'node_modules/brainwav-agentic-governance/AGENTS.md',
		installedAt: new Date().toISOString()
	};
	fs.writeFileSync(
		path.join(pointerDir, 'pointer.json'),
		`${JSON.stringify(pointerPayload, null, 2)}\n`
	);

	const agentsPointer = `# AGENTS — Pointer (profile: ${profile})\n\n` +
		`This repository consumes the brAInwav Agentic Governance pack via pointer mode.\n` +
		`Canonical policies live in the pinned npm package release (lockfile-controlled).\n\n` +
		`Canonical source (immutable via lockfile):\n` +
		`- Package: brainwav-agentic-governance (pin exact version in package.json)\n` +
		`- Path: node_modules/brainwav-agentic-governance/AGENTS.md\n` +
		`- Hash index: node_modules/brainwav-agentic-governance/brainwav/governance/90-infra/governance-index.json\n\n` +
		`Local overrides (tighten only):\n` +
		`- Declare overlays in .agentic-governance/config.json and use AGENTS.local.md (optional).\n`;

	const pointerStub = (title, canonicalPath) =>
		`# ${title} — Pointer\n\n` +
		`Canonical source (lockfile-pinned):\n` +
		`- ${canonicalPath}\n\n` +
		`Local overrides (tighten only):\n` +
		`- Declare overlays in .agentic-governance/config.json and use ${title}.local.md (optional).\n`;

	fs.writeFileSync(path.join(destRoot, 'AGENTS.md'), `${agentsPointer}\n`);
	fs.writeFileSync(
		path.join(destRoot, 'CODESTYLE.md'),
		`${pointerStub('CODESTYLE', 'node_modules/brainwav-agentic-governance/CODESTYLE.md')}\n`
	);
	fs.writeFileSync(
		path.join(destRoot, 'SECURITY.md'),
		`${pointerStub('SECURITY', 'node_modules/brainwav-agentic-governance/SECURITY.md')}\n`
	);
}

function main() {
	try {
		const { dest: destRoot, mode, profile } = parseArgs();
		if (!fs.existsSync(destRoot)) {
			throw new Error(`Destination does not exist: ${destRoot}`);
		}

		if (mode === 'full') {
			COPY_LIST.forEach((item) => {
				const src = path.join(repoRoot, item);
				const dest = path.join(destRoot, item);
				copyRecursive(src, dest);
			});
		} else {
			writePointerFiles(destRoot, profile);
			copyRecursive(path.join(repoRoot, '.github', 'ISSUE_TEMPLATE'), path.join(destRoot, '.github', 'ISSUE_TEMPLATE'));
			copyRecursive(
				path.join(repoRoot, '.github', 'pull_request_template.md'),
				path.join(destRoot, '.github', 'pull_request_template.md')
			);
		}

		writeConfigFile(destRoot, profile, mode);

		// Ensure workflows folder
		fs.mkdirSync(path.join(destRoot, '.github'), { recursive: true });
		const workflowDest = path.join(destRoot, '.github', 'workflows');
		fs.mkdirSync(workflowDest, { recursive: true });
		const workflowTemplate = path.join(
			repoRoot,
			'brainwav',
			'governance',
			'templates',
			'workflows',
			'governance.yml'
		);
		const workflowTarget = path.join(workflowDest, 'governance.yml');
		copyRecursive(workflowTemplate, workflowTarget);

		console.log('[brAInwav] governance install complete.');
		console.log(
			'[brAInwav] Next: ensure Node 24.11.x + pnpm 10.19.x in the consumer CI environment.'
		);
		if (mode === 'pointer') {
			console.log(
				'[brAInwav] Pointer mode: add brainwav-agentic-governance as a dev dependency and pin its version in the lockfile.'
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
