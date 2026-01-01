---
summary: "Xcode workspace/project configuration for Swift targets."
read_when: "Building Swift apps with Xcode."
applies_to: ["pack-swift-xcode"]
owner: "Governance Team"
---

# Pack: Swift Xcode

## Standards

- Configure Xcode workspace/project, scheme, and destination for CLI validation.
- Use `xcodebuild test` with explicit destination.

## Evidence

- Build/test logs attached for CI runs.

## Configuration (packOptions.swift-xcode)

- `xcode.project` or `xcode.workspace`
- `xcode.scheme`
- `xcode.destination`
