// scripts/nx-affected-projects.ts
import { execFileSync } from "node:child_process";

function sh(cmd: string, args: string[]): string {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function parseLines(out: string): string[] {
    return out
        .split(/\r?\n/g)
        .map((s) => s.trim())
        .filter(Boolean);
}

function tryNxShowProjects(base: string, head: string): string[] | null {
    try {
        const out = sh("pnpm", ["exec", "nx", "show", "projects", "--affected", `--base=${base}`, `--head=${head}`]);
        return parseLines(out);
    } catch {
        return null;
    }
}

function tryNxPrintAffected(base: string, head: string): string[] | null {
    try {
        const out = sh("pnpm", ["exec", "nx", "print-affected", `--base=${base}`, `--head=${head}`, "--select=projects"]);
        // nx print-affected returns "proj1,proj2" sometimes
        const list = out.includes(",") ? out.split(",").map((s) => s.trim()) : parseLines(out);
        return list.filter(Boolean);
    } catch {
        return null;
    }
}

function fallbackNoNx(): string[] {
    // No Nx available — caller can decide what to do. Keep explicit.
    return [];
}

function readArg(name: string): string | undefined {
    const idx = process.argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
    if (idx === -1) return undefined;
    const arg = process.argv[idx];
    if (arg.includes("=")) return arg.split("=").slice(1).join("=");
    return process.argv[idx + 1];
}

const base = readArg("base") ?? process.env.GIT_BASE_REF ?? "origin/main";
const head = readArg("head") ?? process.env.GIT_HEAD_REF ?? "HEAD";

const projs =
    tryNxShowProjects(base, head) ??
    tryNxPrintAffected(base, head) ??
    fallbackNoNx();

// Print one per line (stable, script-friendly)
for (const p of [...new Set(projs)].sort()) console.log(p);
