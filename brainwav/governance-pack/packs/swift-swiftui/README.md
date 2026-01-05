# swift-swiftui pack

This pack applies to Swift 6 and SwiftUI codebases.

## 1) Baseline and language mode (Required)
- New modules MUST use Swift 6 language mode.
- Legacy modules MAY lag temporarily with an explicit migration plan.

## 2) Formatting (Required)
- `swift-format` is the formatter of record.
- Formatting MUST be enforced in CI.
- Repo MUST have a single authoritative swift-format config file.

## 3) Linting (Required)
- SwiftLint is required.
- Lint disables MUST include reason + ticket (+ expiry if temporary).

## 4) Concurrency and actor isolation (Required)
- Prefer structured concurrency (`async/await`, `Task`, `AsyncSequence`).
- Shared mutable state MUST be isolated:
  - `actor` for cross-thread shared state
  - `@MainActor` for UI state
- `@unchecked Sendable` is forbidden unless:
  - ADR exists
  - mitigation is documented
  - a concurrency proof test exists

## 5) SwiftUI rules (Required)
- Views SHOULD be compositional; keep `body` readable.
- No blocking I/O on the main thread.
- Side effects only in explicit lifecycle hooks and MUST respect cancellation.
- Avoid force unwraps and `try!` in production paths.

## 6) Testing (Required)
- Swift Testing is preferred.
- XCTest allowed where required by platform/framework constraints.
- Unit tests MUST be deterministic.

## 7) Performance budgets (Optional but recommended)
- Actor performance budgets MAY be enforced via a deterministic benchmark test.
- Thresholds MUST be stable for the chosen CI runner class.

## 8) Suggested Nx targets (Repo may rename)
- `swift:lint` → swiftlint lint --strict
- `swift:format:check` → swift-format lint/check
- `swift:test` → swift test or xcodebuild test
- `swift:actor:bench` → repo-defined actor throughput/latency budget gate

## 9) Waivers (Uniform model)
Any suppression/exception MUST include reason + ticket + expiry/ADR reference.
