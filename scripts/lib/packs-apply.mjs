/**
 * @fileoverview Logic for applying pack commands (targets) to consumer repos.
 * @license Apache-2.0
 */
import Ajv from 'ajv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';
import { loadPackManifestFromRoot, resolvePackManifestPath } from '../pack-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve schema path relative to this script
// Script is in scripts/lib/
// Schema is in brainwav/governance-pack/schemas/
const schemaPath = path.resolve(__dirname, '../../brainwav/governance-pack/schemas/pack-commands.schema.json');

/**
 * Apply valid pack commands to the local repository configuration.
 * @param {string} root - Repository root path.
 * @param {string} packId - Pack identifier to apply.
 * @param {object} options - Options (force, dryRun).
 * @returns {Promise<boolean>} Success status.
 */
export async function applyPackCommands(root, packId, options = {}) {
    console.log(`[Pack] Applying commands for pack: ${packId}`);

    // 1. Load Pack Manifest
    const manifest = loadPackManifestFromRoot(root, packId);
    if (!manifest) {
        throw new Error(`Pack manifest not found for: ${packId}`);
    }

    if (!manifest.commands) {
        console.log(`[Pack] Pack '${packId}' has no 'commands' definition. Skipping target generation.`);
        return true;
    }

    // 2. Resolve commands.yml
    // commands path is relative to the pack manifest file
    const manifestPath = resolvePackManifestPath(root, packId);
    if (!manifestPath) throw new Error(`Could not resolve manifest path for ${packId}`);

    // commands is usually just a filename like "commands.yml"
    const commandsPath = path.resolve(path.dirname(manifestPath), manifest.commands);

    if (!fs.existsSync(commandsPath)) {
        throw new Error(`Commands file not found: ${commandsPath}`);
    }

    // 3. Load and Validate commands.yml
    const commandsRaw = fs.readFileSync(commandsPath, 'utf8');
    const commandsData = yaml.parse(commandsRaw);

    if (!fs.existsSync(schemaPath)) {
        console.warn(`[Pack] Schema verify skipped (schema not found at ${schemaPath})`);
    } else {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const ajv = new Ajv();
        const validate = ajv.compile(schema);
        const valid = validate(commandsData);
        if (!valid) {
            console.error('[Pack] Schema validation failed for commands.yml:');
            console.error(validate.errors);
            throw new Error(`Invalid commands.yml for pack ${packId}`);
        }
    }

    // 4. Determine target config file (project.json or package.json)
    const projectJsonPath = path.join(root, 'project.json');
    const packageJsonPath = path.join(root, 'package.json');
    let targetFile = null;
    let targetType = null; // 'nx' or 'package'

    if (fs.existsSync(projectJsonPath)) {
        targetFile = projectJsonPath;
        targetType = 'nx';
    } else if (fs.existsSync(packageJsonPath)) {
        targetFile = packageJsonPath;
        targetType = 'package';
    } else {
        throw new Error('No project.json or package.json found in root.');
    }

    if (options.dryRun) {
        console.log(`[Pack] Dry run: Would apply ${commandsData.targets.length} targets to ${targetFile}`);
        return true;
    }

    // 5. Apply targets
    let configData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
    let targetsApplied = 0;

    // Helper to get/set targets object
    // If project.json: root.targets
    // If package.json: root.nx.targets (if legacy Nx) or root.targets? 
    // Usually package.json Nx config is in "nx" property, or just "scripts" for simple ones.
    // But since we are stamping "nx:run-commands", we assume an Nx-aware setup.
    // PROPOSAL: If package.json, ensure "nx" object exists or top-level targets?
    // Nx >= 15 creates project.json mostly.
    // If project.json missing, we might be in a root workspace config?
    // We'll support 'project.json' targets mostly. If 'package.json', we try 'nx.targets'.

    let targetsHost;
    if (targetType === 'nx') {
        if (!configData.targets) configData.targets = {};
        targetsHost = configData.targets;
    } else {
        // package.json
        // Check for 'nx' property
        if (!configData.nx) configData.nx = {};
        if (!configData.nx.targets) configData.nx.targets = {};
        targetsHost = configData.nx.targets;
        // Also note: modern Nx might read package.json scripts as targets, but here we want explicit targets.
    }

    for (const targetDef of commandsData.targets) {
        const targetName = targetDef.name;
        const exists = !!targetsHost[targetName];

        // "executor": "nx:run-commands",
        // "options": { "command": ... }
        // The manifest schema has "command", "cwd", etc at top level of targetDef item.
        // We map to Nx format.

        // Manifest:
        // { name, executor, command, cwd, cache, inputs, outputs, env, depends_on, ci }

        // Nx Format (project.json):
        // "name": {
        //   "executor": "nx:run-commands",
        //   "options": { "command": ..., "cwd": ... },
        //   "cache": true/false,
        //   "inputs": [...],
        //   "outputs": [...],
        //   "dependsOn": [...]
        // }

        const nxTarget = {
            executor: targetDef.executor,
            options: {
                command: targetDef.command,
                cwd: targetDef.cwd
            },
            // Metadata
            configurations: {}, // None in manifest yet
        };

        if (targetDef.cache !== undefined) nxTarget.cache = targetDef.cache;
        if (targetDef.inputs) nxTarget.inputs = targetDef.inputs;
        if (targetDef.outputs) nxTarget.outputs = targetDef.outputs;
        if (targetDef.env) nxTarget.options.env = targetDef.env;
        if (targetDef.depends_on) nxTarget.dependsOn = targetDef.depends_on;

        // Description? Nx targets don't strictly have description field in JSON schema usually, 
        // but extra props are allowed.
        if (targetDef.description) nxTarget.description = targetDef.description;

        targetsHost[targetName] = nxTarget;
        targetsApplied++;
        console.log(`[Pack] ${exists ? 'Updated' : 'Created'} target: ${targetName}`);
    }

    // 6. Record Provenance
    if (!configData.governance) configData.governance = {};
    if (!configData.governance.applied_packs) configData.governance.applied_packs = {};

    configData.governance.applied_packs[packId] = {
        version: manifest.version,
        applied_at: new Date().toISOString(),
        targets: commandsData.targets.map(t => t.name)
    };

    // Write back
    fs.writeFileSync(targetFile, JSON.stringify(configData, null, 2) + '\n', 'utf8');
    console.log(`[Pack] Applied ${targetsApplied} targets to ${targetFile}`);

    return true;
}
