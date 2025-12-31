#!/usr/bin/env node
/**
 * @fileoverview Resolve governance paths for full or pointer installs.
 * @license Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

const POINTER_RELATIVE_PATH = path.join('.agentic-governance', 'pointer.json');
const CONFIG_RELATIVE_PATH = path.join('.agentic-governance', 'config.json');

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function resolveGovernancePaths(repoRoot) {
	const pointerPath = path.join(repoRoot, POINTER_RELATIVE_PATH);
	const configPath = path.join(repoRoot, CONFIG_RELATIVE_PATH);
	if (!fs.existsSync(pointerPath)) {
		const govRoot = path.join(repoRoot, 'brainwav', 'governance');
		return {
			mode: 'full',
			repoRoot,
			pointerPath: null,
			pointer: null,
			govRoot,
			indexPath: path.join(govRoot, '90-infra', 'governance-index.json'),
			agentsPath: path.join(repoRoot, 'AGENTS.md'),
			packageRoot: null,
			configPath
		};
	}

	const pointer = readJson(pointerPath);
	const packageName = pointer.package || 'brainwav-agentic-governance';
	const packageRoot = pointer.packageRoot || path.join(repoRoot, 'node_modules', packageName);
	const govRoot = pointer.governanceRoot || path.join(packageRoot, 'brainwav', 'governance');
	const agentsPath = pointer.agentsPath || path.join(packageRoot, 'AGENTS.md');
	const indexPath =
		pointer.governanceIndexPath || path.join(govRoot, '90-infra', 'governance-index.json');

	return {
		mode: 'pointer',
		repoRoot,
		pointerPath,
		pointer,
		govRoot,
		indexPath,
		agentsPath,
		packageRoot,
		configPath
	};
}

export function formatPointerHint(pointerPath, packageRoot) {
	if (!pointerPath) return '';
	return `Pointer mode active via ${pointerPath} (package root: ${packageRoot}).`;
}
