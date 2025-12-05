#!/usr/bin/env node
// brainwav/governance/commands/task-snapshot.mjs
// Lightweight task snapshot: surfaces presence of key governance artefacts and compact-mode flags.

import fs from 'node:fs';
import path from 'node:path';

const slug = process.env.TASK_SLUG ?? process.argv[2];
if (!slug) {
	console.error('[brAInwav] Missing TASK_SLUG. Pass via env or argv.');
	process.exit(1);
}

const homeDir = process.env.HOME ?? process.env.USERPROFILE;
if (!homeDir) {
	console.error('[brAInwav] Unable to resolve HOME directory.');
	process.exit(1);
}

const govHome = process.env.GOV_HOME ?? path.join(homeDir, '.agentic-governance');
const taskDir = path.join(govHome, 'tasks', slug);

const runManifestPath = path.join(taskDir, 'json', 'run-manifest.json');
const memoryIdsPath = path.join(taskDir, 'json', 'memory-ids.json');
const evidenceSummaryPath = path.join(taskDir, 'evidence', 'summary.md');
const planPath = path.join(taskDir, 'plan', 'PLAN.md');
const vibeDir = path.join(taskDir, 'logs', 'vibe-check');

function exists(filePath) {
	return fs.existsSync(filePath);
}

function readJson(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch {
		return null;
	}
}

const snapshot = {
	taskDir,
	files: {
		runManifest: exists(runManifestPath),
		memoryIds: exists(memoryIdsPath),
		evidenceSummary: exists(evidenceSummaryPath),
		plan: exists(planPath),
	},
	oversightLogs: [],
	warnings: [],
};

if (exists(vibeDir)) {
	snapshot.oversightLogs = fs.readdirSync(vibeDir).filter((file) => file.endsWith('.json'));
}

const manifest = snapshot.files.runManifest ? readJson(runManifestPath) : null;
if (!manifest) {
	snapshot.warnings.push('Missing or unreadable run-manifest.json');
} else {
	snapshot.manifest = {
		compactMode: Boolean(manifest.compactMode || manifest.flow === 'compact' || manifest.mode === 'compact'),
		compactRationale: manifest.compactRationale,
		evidenceTriplet: manifest.evidenceTriplet ?? manifest.evidence_triplet,
	};

	if (snapshot.manifest.compactMode && !snapshot.manifest.compactRationale) {
		snapshot.warnings.push('compactMode set but compactRationale missing');
	}

	if (!snapshot.manifest.evidenceTriplet) {
		snapshot.warnings.push('Evidence Triplet pointer missing in run-manifest.json');
	}
}

if (!snapshot.files.memoryIds) {
	snapshot.warnings.push('json/memory-ids.json missing (memory parity)');
}

if (!snapshot.files.plan) {
	snapshot.warnings.push('plan/PLAN.md missing');
}

if (!snapshot.files.evidenceSummary) {
	snapshot.warnings.push('evidence/summary.md missing');
}

console.log(JSON.stringify(snapshot, null, 2));
