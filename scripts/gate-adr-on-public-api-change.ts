import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

type Waiver = {
    id: string;
    reason: string;
    ticket: string;
    expires: string; // YYYY-MM-DD
};

function sh(cmd: string): string {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

function changedFiles(): string[] {
    // Works in CI if you fetch base; otherwise set GIT_BASE_REF.
    const base = process.env.GIT_BASE_REF ?? "origin/main";
    const head = process.env.GIT_HEAD_REF ?? "HEAD";
    // Handle case where base ref might not exist in shallow clone
    try {
        const out = sh(`git diff --name-only ${base}...${head}`);
        return out ? out.split("\n").filter(Boolean) : [];
    } catch (e) {
        console.warn(`Git diff failed (probably shallow clone or missing ref ${base}). Assuming explicit mode.`);
        return [];
    }
}

function hasAdrChange(files: string[]) {
    return files.some((f) => f.startsWith("docs/adr/") && f.endsWith(".md"));
}

function hasPublicApiChange(files: string[]) {
    // TS: API Extractor reports committed under etc/*.api.md
    const tsApiChanged = files.some((f) => f.includes("/etc/") && f.endsWith(".api.md"));

    // Swift: committed snapshot under etc/api/
    const swiftApiChanged = files.some(f => f.includes("etc/api/swift-public-api.snapshot.txt"));

    return tsApiChanged || swiftApiChanged;
}

function readWaiver(path: string): Waiver | null {
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, "utf8");

    // Minimal YAML parsing to avoid adding deps: strict key: value lines only.
    const m = (key: keyof Waiver) =>
        raw.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?\\s*$`, "m"))?.[1]?.trim();

    const id = m("id");
    const reason = m("reason");
    const ticket = m("ticket");
    const expires = m("expires");

    if (!id || !reason || !ticket || !expires) return null;
    return { id, reason, ticket, expires };
}

function isExpired(yyyyMmDd: string) {
    const today = new Date();
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    const exp = new Date(y, m - 1, d, 23, 59, 59);
    return today > exp;
}

const files = changedFiles();
const apiChanged = hasPublicApiChange(files);

// If no files changed, or no API changed, pass.
if (files.length > 0 && !apiChanged) process.exit(0);
if (files.length === 0) {
    // maybe verify we have API reports at all? For now pass.
    process.exit(0);
}

if (hasAdrChange(files)) process.exit(0);

// waiver: /.agentic-governance/waivers/adr-api-gate.yml
const waiverPath = ".agentic-governance/waivers/adr-api-gate.yml";
const waiver = readWaiver(waiverPath);

if (waiver && !isExpired(waiver.expires)) {
    console.log(`ADR gate waived: ${waiver.id} (${waiver.ticket}) until ${waiver.expires}`);
    process.exit(0);
}

console.error(
    [
        "❌ Public API changed but no ADR was added/updated.",
        "",
        "Fix:",
        "  - Add/update an ADR under docs/adr/ explaining the public API change, OR",
        `  - Add a time-boxed waiver at ${waiverPath} (reason + ticket + expires).`,
        "",
        "Detected public API change via diffs in:",
        "  - etc/*.api.md (TS API Extractor), or",
        "  - etc/api/swift-public-api.snapshot.txt (Swift)."
    ].join("\n")
);

process.exit(1);
