import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Portable snapshot: collects lines that *look like* public/open declarations.
 * This is deterministic and works without Xcode-only tools.
 */
function rg(query: string) {
    return execSync(`rg ${JSON.stringify(query)} --glob '*.swift'`, {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8"
    });
}

const outDir = join(process.cwd(), "etc", "api");
mkdirSync(outDir, { recursive: true });

const raw = rg(
    // capture likely public/open API surfaces; keep simple to reduce false positives
    "^(\\s*)(public|open)\\s+(actor|class|struct|enum|protocol|extension|func|var|let|typealias|init)\\b"
);

const normalized = raw
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean)
    .sort()
    .join("\n");

writeFileSync(join(outDir, "swift-public-api.snapshot.txt"), normalized + "\n", "utf8");
console.log(`Wrote etc/api/swift-public-api.snapshot.txt (${normalized.length} chars)`);
