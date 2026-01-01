---
summary: "Swift/AppKit rules for concurrency, formatting, and macOS release hygiene."
read_when: "Building macOS apps with Swift/AppKit."
applies_to: ["pack-swift-appkit"]
owner: "Governance Team"
---

# Pack: Swift + AppKit

## Standards

- Use Swift Concurrency with explicit `@MainActor` boundaries.
- Format with SwiftFormat and lint with SwiftLint (via `swift-core`).
- Avoid blocking the main thread; offload I/O to background tasks.

## Release Hygiene

- Entitlements and privacy usage descriptions are required for release builds.
- Codesign + notarization evidence should be captured when shipping.

Severity policy:
- creative/delivery: warnings
- release: errors (high-risk entitlements require justification)

## Evidence

- Build/test logs attached.
- Release checklist attached for shipping builds.

## Configuration (packOptions.swift-appkit)

- `xcode.project` or `xcode.workspace` (required)
- `xcode.scheme` (required)
- `xcode.destination` (required)
- `entitlements.paths` (required for release checks)
- `entitlements.highRiskAllowlist` (optional overrides)
- `entitlements.justification` (required when high-risk entitlements are present)
- `privacy.plists` and `privacy.requiredKeys` (required for release checks)
