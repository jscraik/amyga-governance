---
summary: "Swift Package Manager conventions and dependency hygiene."
read_when: "Using SwiftPM (Package.swift/Package.resolved)."
applies_to: ["pack-swift-spm"]
owner: "Governance Team"
---

# Pack: Swift SPM

## Standards

- `Package.swift` is required when SwiftPM is in use.
- `Package.resolved` should be tracked for dependency hygiene.

## Evidence

- Dependency updates noted when `Package.swift` / `Package.resolved` changes.

## Configuration (packOptions.swift-spm)

- `spm.manifest` (optional override for `Package.swift`)
- `spm.resolved` (optional override for `Package.resolved`)
