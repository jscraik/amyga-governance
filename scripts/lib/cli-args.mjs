#!/usr/bin/env node
/**
 * @fileoverview CLI argument parsing and usage documentation.
 * @license Apache-2.0
 */

export const COMMANDS = new Set(['init', 'install', 'upgrade', 'validate', 'doctor', 'packs', 'task', 'cleanup-plan', 'spec', 'loop']);
export const COMMON_FLAGS = new Set(['--mode', '--profile', '--packs', '--dry-run', '--yes', '--force', '--no-install']);
export const TASK_FLAGS = new Set(['--slug', '--tier', '--task-root', '--tasks-root']);
export const SPEC_FLAGS = new Set(['--slug', '--spec-root', '--compat']);
export const LOOP_FLAGS = new Set(['--slug', '--config']);
export const CLEANUP_FLAGS = new Set(['--apply']);

/**
 * Print CLI usage information.
 * @returns {void} No return value.
 */
export function usage() {
    console.log(`
brAInwav Governance CLI

Usage:
  brainwav-governance <command> [flags]

Commands:
  init          Initialize governance (wizard)
  install       Install governance files (full or pointer mode)
  upgrade       Upgrade governance files to latest version
  validate      Validate governance compliance
  doctor        Check development environment readiness
  packs list    List available governance packs
  task init     Scaffold a new task
  spec init     Scaffold a new spec (SDD)
  spec validate Validate spec structure
  spec clarify  Check spec clarification requirements
  spec analyze  Analyze spec consistency
  spec checklist Verify spec checklist items
  loop run      Run agentic governance loop
  cleanup-plan  (Pointer Mode) Plan cleanup of canonical files

Global Flags:
  --root <path>     Target repository root (default: current dir)
  --config <path>   Path to config.json (default: .agentic-governance/config.json)
  --quiet           Suppress output
  --verbose         Enable verbose logging
  --json            Output results as JSON
  --plain           Output plain text summary (minimal)
  --no-color        Disable color output
  --no-input        Fail if interaction is required
  --report <path>   Write JSON report to file
  --output <path>   Write JSON report to file (alias for --report)

Common Flags:
  --mode <mode>       Install mode: 'pointer' (default) or 'full'
  --profile <profile> Governance profile: 'creative', 'delivery', 'release'
  --packs <list>      Comma-separated list of packs to install/check
  --dry-run           Simulate actions without writing
  --yes               Skip confirmation prompts
  --force             Overwrite existing files
  --preserve          Preserve existing config during operations
  --strict            Fail on warnings (exit code 1) from 0.2.46+

Task Flags (task init):
  --slug <slug>       Task identifier (e.g. 'feature-login')
  --tier <tier>       Task tier/type (default: 'feature')
  --task-root <path>  Tasks root directory (default: 'tasks')

Spec Flags (spec *):
  --slug <slug>       Spec identifier
  --spec-root <path>  Specs root directory (default: 'specs')
  --compat <tool>     Compatibility mode (e.g. 'speckit')

Loop Flags (loop *):
  --slug <slug>       Loop identifier
  --config <path>     Loop config path

Examples:
  brainwav-governance init
  brainwav-governance install --mode pointer --profile delivery
  brainwav-governance validate --strict
  brainwav-governance task init --slug my-feature
`);
}

/**
 * Parse CLI arguments into command and flags.
 * @param {string[]} argv - CLI arguments.
 * @returns {Record<string, unknown>} Parsed arguments.
 */
export function parseArgs(argv) {
    const args = [...argv];
    let command = null;
    const global = {
        root: '.',
        config: null,
        quiet: false,
        verbose: false,
        json: process.env.BRAINWAV_JSON === '1',
        plain: false,
        noColor: false,
        noInput: process.env.CI === 'true',
        report: null,
        output: null,
        apply: false
    };
    const flags = {
        mode: 'pointer',
        modeProvided: false,
        profile: process.env.GOVERNANCE_PROFILE || process.env.BRAINWAV_PROFILE || 'delivery',
        profileProvided: false,
        packs: '',
        dryRun: false,
        yes: false,
        force: false,
        preserve: false,
        noInstall: false,
        strict: false,
        // Task specific
        taskSlug: null,
        taskTier: 'feature',
        taskRoot: 'tasks',
        // Cleanup specific
        cleanupApply: false
    };
    const specFlags = {
        specRoot: 'specs',
        compat: 'none' // 'none' | 'speckit'
    };
    const loopFlags = {
        loopSlug: null,
        loopConfig: 'agent-loop.json'
    };
    const positionalOutput = [];
    const unknown = [];

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        // Detect command
        if (!arg.startsWith('-') && !command) {
            if (COMMANDS.has(arg)) {
                command = arg;
            } else if (['--help', '-h'].includes(arg)) {
                command = '--help';
            } else if (['--version', '-v'].includes(arg)) {
                command = '--version';
            } else {
                // Implicit help or unknown command handling could go here
                // For now treat as unknown if it doesn't look like a command
                // But maybe user typed `brainwav-governance task-init`?
                // Logic: if not command yet, check if valid command.
                // If we already have command, subsequent non-flags are positionals
            }
        } else if (!arg.startsWith('-') && command) {
            positionalOutput.push(arg);
        } else {
            // Flags
            const takeValue = () => {
                if (i + 1 >= args.length) return null;
                // If next arg is a flag, return null (unless value can look like flag?)
                // Simple heuristic: if next starts with --, it's a flag, unless we expect a path that might start with --
                return args[++i];
            };

            switch (arg) {
                case '--help':
                case '-h':
                    if (!command) command = '--help';
                    break;
                case '--version':
                case '-v':
                    if (!command) command = '--version';
                    break;
                case '--root':
                    global.root = takeValue() || '.';
                    break;
                case '--config':
                    global.config = takeValue();
                    break;
                case '--quiet':
                case '-q':
                    global.quiet = true;
                    break;
                case '--verbose':
                    global.verbose = true;
                    break;
                case '--debug':
                    process.env.DEBUG = '1';
                    break;
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
                case '--report':
                    global.report = takeValue();
                    break;
                case '--output':
                    global.output = takeValue();
                    break;
                case '--apply': // Global-ish, used for cleanup
                    global.apply = true;
                    break;

                // Common
                case '--mode':
                    flags.mode = takeValue() || 'pointer';
                    flags.modeProvided = true;
                    break;
                case '--profile':
                    flags.profile = takeValue() || 'delivery';
                    flags.profileProvided = true;
                    break;
                case '--packs':
                    flags.packs = takeValue() || '';
                    break;
                case '--dry-run':
                    flags.dryRun = true;
                    break;
                case '--yes':
                case '-y':
                    flags.yes = true;
                    break;
                case '--force':
                case '-f':
                    flags.force = true;
                    break;
                case '--preserve':
                    flags.preserve = true;
                    break;
                case '--no-install':
                    flags.noInstall = true;
                    break;
                case '--strict':
                    flags.strict = true;
                    break;

                // Task
                case '--slug':
                    // Context sensitive
                    if (command === 'spec') {
                        if (flags.taskSlug) { // Conflict if set? Reuse for now.
                            // Reuse taskSlug for spec slug to share logic if compatible
                        }
                    }
                    flags.taskSlug = takeValue();
                    loopFlags.loopSlug = flags.taskSlug; // Share for simplicity
                    break;
                case '--tier':
                    flags.taskTier = takeValue() || 'feature';
                    break;
                case '--task-root':
                case '--tasks-root': // Alias
                    flags.taskRoot = takeValue() || 'tasks';
                    break;

                // Spec
                case '--spec-root':
                    specFlags.specRoot = takeValue() || 'specs';
                    break;
                case '--compat':
                    specFlags.compat = takeValue() || 'none';
                    break;

                // Loop
                // --slug handled above
                // --config handled by global.config BUT loop might want separate config arg
                // Let's assume loop uses specific flag or we check context
                // The original code checked loopFlags.loopConfig
                // If arg was --config, it hit global.config.
                // We need specific loop config flag?
                // Original: `if (parsed.command === 'loop') ... loopFlags`
                // Original parser likely handled this.
                // Let's support specific if needed, or rely on distinct flags.
                // Actually original code had:
                // `if (arg === '--config') { global.config = ... }`
                // AND logic for loopConfig? Code review says loop uses `loopFlags.loopConfig`
                // Let's see if there is loop-config flag.
                // No, loop command used `loopFlags.loopConfig` which seemed to come from... ?
                // In original code: `if (parsed.command === 'loop') ...`
                // Wait, if I use `--config` it sets global config.
                // Loop code: `const resolvedConfig = resolveRootPath(rootPath, loopFlags.loopConfig);`
                // Maybe reuse global.config for loop?
                // Let's stick to globals for now or allow specialized parsing if flags differ.
                // If loop command, --config is loop config.
                // But global config is for governance config.
                // Conflict.
                // Let's assume loop uses positional or separate flag if not global.
                // Checking original code... `loopFlags.loopConfig` default `agent-loop.json`
                // but where is it set?
                // It seems missing from original explicit flags list in snippet provided.
                // I'll add --loop-config
                case '--loop-config':
                    loopFlags.loopConfig = takeValue();
                    break;

                default:
                    unknown.push(arg);
            }
        }
        i++;
    }

    return {
        command,
        global,
        flags,
        specFlags,
        loopFlags,
        loopFlags,
        positionalOutput: positionalOutput.length > 0 ? positionalOutput[0] : null,
        positionals: positionalOutput,
        unknown
    };
}

/**
 * Validate parsed inputs.
 * @param {string|null} command - Command name.
 * @param {Record<string, unknown>} flags - Parsed flags.
 * @returns {string|null} Error message or null.
 */
export function validateInputs(command, flags) {
    if (command === 'install') {
        if (flags.mode !== 'pointer' && flags.mode !== 'full') {
            return `Invalid mode: ${flags.mode}. Must be 'pointer' or 'full'.`;
        }
    }
    return null;
}
