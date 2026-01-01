# Pack: swift-uikit

Applies when the repository ships iOS UIKit software.

Required:
- Configure the Xcode workspace/project in `.agentic-governance/config.json` under `packOptions.swift-uikit.xcode`
  (or rely on `packOptions.swift-appkit.xcode` if you share config with macOS).
- Provide the Xcode scheme and destination for CLI validation.

This pack enforces macOS runner usage for governance checks.
