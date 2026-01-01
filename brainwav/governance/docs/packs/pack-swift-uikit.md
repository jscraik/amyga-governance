---
summary: "Swift/UIKit rules for iOS apps."
read_when: "Building iOS apps with Swift/UIKit."
applies_to: ["pack-swift-uikit"]
owner: "Governance Team"
---

# Pack: Swift + UIKit

## Standards

- UIKit targets only (iOS).
- Follow Apple HIG + accessibility guidance.
- Use `@MainActor` for UI mutations.

## Evidence

- Build/test logs attached for CI runs.

## Configuration (packOptions.swift-uikit)

- `xcode.project` or `xcode.workspace`
- `xcode.scheme`
- `xcode.destination`
