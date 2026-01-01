---
summary: "Apple release evidence for codesign + notarization."
read_when: "Shipping macOS builds with notarization."
applies_to: ["pack-apple-release"]
owner: "Governance Team"
---

# Pack: Apple Release

## Standards

- Capture codesign and notarization evidence for shipping builds.
- Store evidence references alongside release notes.

## Evidence

- Codesign evidence log or bundle reference.
- Notarization log reference.

## Configuration (packOptions.apple-release)

- `evidence.codesignLog`
- `evidence.notarizationLog`
