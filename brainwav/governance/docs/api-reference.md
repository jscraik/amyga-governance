# API Reference / SDK Overview

The runtime exposes REST and event APIs.

# brAInwav API Reference

> **⚠️ HISTORICAL DOCUMENT**: This document references example API structures. Content preserved for reference.

- **REST API** – served from apps/cortex-os, default port 3000.

  - Authentication via bearer tokens (`AUTH_TOKEN`).
  - Key endpoints: `/health`, `/agents`, `/events`.
- **SDKs**
  - TypeScript packages in `packages/*` provide typed clients.
  - Python integration in `python/` via `cortex_ml.instructor_client`.
