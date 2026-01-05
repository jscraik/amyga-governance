// scripts/run-api-extractor-affected.ts
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function sh(cmd: string, args: string[], inherit = false): string {
    const out = execFileSync(cmd, args, {
        encoding: "utf8",
        stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    return typeof out === "string" ? out.trim() : "";
}

function readArg(name: string): string | undefined {
    const idx = process.argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
    if (idx === -1) return undefined;
    const arg = process.argv[idx];
    if (arg.includes("=")) return arg.split("=").slice(1).join("=");
    return process.argv[idx + 1];
}

function listAffectedProjects(base: string, head: string): string[] {
    try {
        const out = sh("pnpm", [
            "exec",
            "tsx",
            "scripts/nx-affected-projects.ts",
            `--base=${base}`,
            `--head=${head}`,
        ]);
        return out ? out.split(/\r?\n/g).map((s) => s.trim()).filter(Boolean) : [];
    } catch {
        return [];
    }
}

type NxProjectJson = { root?: string; targets?: Record<string, unknown> };

function tryNxProjectInfo(name: string): NxProjectJson | null {
    try {
        const out = sh("pnpm", ["exec", "nx", "show", "project", name, "--json"]);
        return out ? (JSON.parse(out) as NxProjectJson) : null;
    } catch {
        return null;
    }
}

function projectRoot(name: string): string | null {
    const info = tryNxProjectInfo(name);
    if (info?.root) return info.root;

    // Reasonable fallback for typical monorepos
    const guess = join("packages", name);
    return existsSync(guess) ? guess : null;
}

function hasTarget(name: string, target: string): boolean {
    const info = tryNxProjectInfo(name);
    return Boolean(info?.targets && Object.prototype.hasOwnProperty.call(info.targets, target));
}

function gitDiffExit(paths: string[]): number {
    try {
        sh("git", ["diff", "--exit-code", "--", ...paths], true);
        return 0;
    } catch {
        return 1;
    }
}

const base = readArg("base") ?? process.env.GIT_BASE_REF ?? "origin/main";
const head = readArg("head") ?? process.env.GIT_HEAD_REF ?? "HEAD";
const verifyClean = process.argv.includes("--verify-clean");
const runBuild = !process.argv.includes("--no-build");

const affected = listAffectedProjects(base, head);

if (affected.length === 0) {
    console.log("No affected Nx projects detected (or Nx not available). Skipping affected API Extractor run.");
    process.exit(0);
}

// Resolve affected package roots with api-extractor.json
const jobs: Array<{ project: string; root: string; config: string }> = [];

for (const proj of [...new Set(affected)].sort()) {
    const root = projectRoot(proj);
    if (!root) continue;

    // Enforce your convention: packages/* only
    if (!root.startsWith("packages/")) continue;

    const cfg = join(root, "api-extractor.json");
    if (!existsSync(cfg)) continue;

    jobs.push({ project: proj, root, config: cfg });
}

if (jobs.length === 0) {
    console.log("No affected packages/* with api-extractor.json. Nothing to do.");
    process.exit(0);
}

for (const j of jobs) {
    console.log(`\n==> API Extractor (affected): ${j.project} (${j.root})`);

    if (runBuild && hasTarget(j.project, "build")) {
        console.log(`--> nx run ${j.project}:build`);
        sh("pnpm", ["exec", "nx", "run", `${j.project}:build`], true);
    } else if (runBuild) {
        console.log(`--> build skipped (no Nx build target found for ${j.project})`);
    }

    console.log(`--> api-extractor run --config ${j.config}`);
    sh("pnpm", ["exec", "api-extractor", "run", "--local", "--config", j.config], true);
}

if (verifyClean) {
    const code = gitDiffExit(["packages/*/etc/*.api.md"]);
    if (code !== 0) {
        console.error(
            [
                "❌ API report drift detected (packages/*/etc/*.api.md changed).",
                "Fix: run the affected API report target locally and commit the updated *.api.md files.",
            ].join("\n")
        );
        process.exit(1);
    }
}

console.log("✅ Affected API Extractor run complete.");
