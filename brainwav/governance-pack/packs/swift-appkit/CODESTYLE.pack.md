# Pack: swift-appkit

Swift/AppKit conventions apply to macOS targets (AppKit is macOS-only):

- Prefer structured concurrency and explicit error handling.
- UI mutations must run on the main actor (use `@MainActor` or `MainActor.run`).
- Keep UI logic separated from model and state management.
- Follow Apple HIG and accessibility guidance for AppKit.
