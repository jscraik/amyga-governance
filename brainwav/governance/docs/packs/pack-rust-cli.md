---
summary: "Rust CLI/TUI conventions and toolchain requirements."
read_when: "Building Rust CLI or TUI components."
applies_to: ["pack-rust-cli"]
owner: "Governance Team"
---

# Pack: Rust CLI/TUI

## Standards

- **Edition**: Rust 2024.
- **Toolchain**: rustc ≥ 1.85; pin via `rust-toolchain.toml`.
- **Lint/format**: `rustfmt` + `cargo clippy -- -D warnings`.
- **Errors**: `anyhow::Result` for binaries; `thiserror` enums for libs.
- **UI**: ratatui/crossterm; ASCII fallback; no color-only indicators.

## Testing

- Unit tests with modules; integration tests under `tests/`.
