# Packs

This catalog is generated from `brainwav/governance-pack/packs` manifests.
If `AGENTS.pack.md` or `CODESTYLE.pack.md` is absent, the corresponding section
is synthesized from the manifest during install/upgrade.

| Pack ID | Description | Depends on | Runner | Pack docs | Validate checks | Doctor checks |
| --- | --- | --- | --- | --- | --- | --- |
| a11y | Accessibility gates and reporting requirements. | - | ubuntu-latest | - | - | - |
| ai-risk | AI governance and safety controls beyond core defaults. | - | ubuntu-latest | - | - | - |
| apple-release | Apple release evidence for codesign + notarization. | - | macos-latest | - | release-codesign, release-notarization | - |
| cloudflare-workers | Cloudflare Workers runtime constraints and testing. | - | ubuntu-latest | - | - | - |
| compliance-overlays | Regulatory overlays (EU AI Act, ISO/IEC 42001) with evidence mappings. | - | ubuntu-latest | - | - | - |
| core | Mandatory baseline: governance integrity, evidence triplets, step budget, and AI risk controls. | - | ubuntu-latest | - | - | - |
| mcp-server-ts | MCP server schema, auth, and audit logging rules. | - | ubuntu-latest | - | - | - |
| nx | Nx orchestration and affected-only execution. | - | ubuntu-latest | - | - | - |
| openai-apps-sdk-ui | OpenAI Apps SDK UI integration rules. | - | ubuntu-latest | - | - | - |
| python-uv | Python (uv) linting, typing, and packaging. | - | ubuntu-latest | - | - | - |
| react-next | React 19 + Next.js 16 (RSC/App Router) rules. | - | ubuntu-latest | - | - | - |
| react-vite | React 19 + Vite UI conventions. | - | ubuntu-latest | - | - | - |
| rust-cli | Rust CLI/TUI standards and toolchain policy. | - | ubuntu-latest | - | - | - |
| security-appsec | AppSec controls and verification gates for runtime systems. | - | ubuntu-latest | - | - | - |
| storybook | Storybook setup and a11y/interaction policy. | - | ubuntu-latest | - | - | - |
| supply-chain | SBOM, provenance, signing, and supply-chain posture gates. | - | ubuntu-latest | - | - | - |
| swift-appkit | Swift/AppKit conventions for concurrency and macOS release hygiene. | swift-core, swift-xcode | macos-latest | AGENTS.pack.md, CODESTYLE.pack.md | xcode-project, entitlements, privacy-usage | - |
| swift-core | Swift formatting and linting baselines. | - | macos-latest | AGENTS.pack.md, CODESTYLE.pack.md | swift-format-config, swiftlint-config | - |
| swift-spm | Swift Package Manager conventions and dependency hygiene. | - | ubuntu-latest | - | package-swift, package-resolved | - |
| swift-xcode | Xcode workspace/project configuration for Swift targets. | - | macos-latest | - | xcode-project, xcode-scheme, xcode-destination | - |
| tailwind | Tailwind v4 class sorting and composition policy. | - | ubuntu-latest | - | - | - |
| ts-base | TypeScript base standards and strictness. | - | ubuntu-latest | AGENTS.pack.md, CODESTYLE.pack.md | tsconfig, typescript-dependency | - |
