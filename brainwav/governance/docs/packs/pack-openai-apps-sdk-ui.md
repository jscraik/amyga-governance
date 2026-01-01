---
summary: "OpenAI Apps SDK UI integration rules and safety constraints."
read_when: "Building ChatGPT Apps SDK UI integrations."
applies_to: ["pack-openai-apps-sdk-ui"]
owner: "Governance Team"
---

# Pack: OpenAI Apps SDK UI

## Standards

- **No secrets in client**; all sensitive operations server-side.
- **Streaming**: handle partial results and cancellation.
- **Tooling**: define tools with explicit schemas; validate inputs.
- **UX**: follow OpenAI Apps SDK UI guidelines; a11y required.

## Evidence

- Integration test logs attached.
- Security review for client/server boundary.
