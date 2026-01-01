---
summary: "Swift/AppKit rules for concurrency, formatting, and release hygiene."
read_when: "Building macOS apps with Swift/AppKit."
applies_to: ["pack-swift-appkit"]
owner: "Governance Team"
---

# Pack: Swift + AppKit

## Standards

- Use Swift Concurrency with explicit `@MainActor` boundaries.
- Format with SwiftFormat (or agreed formatter) and lint with SwiftLint.
- Avoid blocking the main thread; offload I/O to background tasks.

## Release Hygiene

- Codesign + notarization checklist for releases.
- Privacy manifests updated when collecting data.

## Evidence

- Build/test logs attached.
- Release checklist attached for shipping builds.
