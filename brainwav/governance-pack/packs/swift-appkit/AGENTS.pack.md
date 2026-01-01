# Pack: swift-appkit

Applies when the repository ships macOS AppKit software.

Required:
- Configure the Xcode project/workspace in `.agentic-governance/config.json` under `packOptions.swift-appkit.xcode`.
- Provide the Xcode scheme and destination to drive CLI validation.
- Declare entitlements paths and privacy plist locations under `packOptions.swift-appkit` for release checks.

This pack enforces macOS runner usage for governance checks.
