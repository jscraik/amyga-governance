# Pack: swift-uikit

Swift/UIKit conventions apply to iOS targets:

- UI mutations must run on the main actor (use `@MainActor` or `MainActor.run`).
- Prefer structured concurrency and explicit error handling.
- Keep UI logic separated from model and state management.
- Follow Apple HIG and accessibility guidance for UIKit.
