# Contributing to Cortex-OS

[![Contributors Welcome](https://img.shields.io/badge/contributors-welcome-brightgreen.svg)](https://github.com/cortex-os/cortex-os/issues)
[![Good First Issues](https://img.shields.io/badge/good%20first%20issues-available-blue.svg)](https://github.com/cortex-os/cortex-os/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Thank you for your interest in contributing to Cortex-OS!**  
_Your contributions help make AI agent systems more accessible and powerful_

---

## 🎯 Quick Start for Contributors

### 1. Set Up Development Environment

```bash
# Clone the repository
git clone https://github.com/jamiescottcraik/Cortex-OS.git
cd cortex-os

# Install dependencies (requires exact pnpm version)
pnpm install

# Verify installation
pnpm readiness:check

# Run development server
pnpm dev
```

### 2. Choose Your Contribution Type

- **🐛 Bug Fixes** - Fix existing issues or report new ones
- **✨ New Features** - Add functionality following our architecture
- **📚 Documentation** - Improve guides, API docs, or examples
- **🧪 Testing** - Add test coverage or improve test quality
- **🔒 Security** - Security improvements and vulnerability fixes
- **🎨 UI/UX** - Improve user interfaces and experience

### 3. Follow Our Workflow

1. **Fork** the repository and create a feature branch
2. **Code** following our standards and guidelines
3. **Test** thoroughly with our quality gates
4. **Document** your changes and update relevant docs
5. **Submit** a pull request with clear description

### Git Hooks & Node Version

- Git hooks are managed with `husky` and run via `.husky/*` scripts (Husky-only; Python `pre-commit` is not used).
- Supported local Node.js versions for dev tooling: `20.x` or `22.x`. Other versions may work but will print a warning.
- Hooks are installed automatically on `pnpm install` via `core.hooksPath=.husky`.
- **Install pnpm via Corepack before committing:** run `corepack use pnpm@10.19.0` (or `corepack enable && corepack prepare pnpm@10.19.0 --activate`) so git hooks can execute `pnpm exec lint-staged` without being skipped. If pnpm is missing, hooks log a warning and linting is bypassed.

### Release-note changesets (CI gate)

- Every PR must include at least one `.changeset/*.md` entry or carry the `skip-release` label; both the [changeset gate](docs/contributing/changeset-gate.md) job in `ci.yml` **and** the `changeset status` rehearsal in `pr-quality-gates.yml` fail otherwise.
- When either check fails, follow the linked Changesets authoring guide in the step summary (`pnpm changeset`) to generate the missing file; the workflow summary also reiterates the key steps for authoring non-trivial release notes.
- Apply the `skip-release` label **only** when every modified file is documentation or automation/meta tooling and a release would be a no-op. Governance still requires a waiver: document it under `/.agentic-governance/waivers/<waiver_id>.md` with `rule_id: release.changeset.required`, `status: approved`, and an expiry before requesting review. Remove the label and delete the waiver once you add a changeset.

## 📋 Development Guidelines

### 🚨 CRITICAL: CODESTYLE.md ENFORCEMENT

**MANDATORY COMPLIANCE** with [CODESTYLE.md](../CODESTYLE.md) requirements:

### ⚡ Performance Development Guidelines

When working on performance-related features or optimizations, follow these additional guidelines:

#### Performance Component Development

```typescript
// ✅ Good: Performance component with proper error handling
export const createPerformanceOptimizer = (
  config: PerformanceConfig
): PerformanceOptimizer => {
  const optimizer = new PerformanceOptimizer(config);

  // Validate configuration
  validatePerformanceConfig(config);

  return optimizer;
};

// ✅ Good: Metrics collection with proper typing
export const collectPerformanceMetrics = async (
  component: string
): Promise<PerformanceMetrics> => {
  const startTime = performance.now();

  try {
    const metrics = await measureComponentPerformance(component);
    const endTime = performance.now();

    return {
      ...metrics,
      measurementDuration: endTime - startTime,
      timestamp: Date.now()
    };
  } catch (error) {
    throw new PerformanceError(
      `Failed to collect metrics for ${component}`,
      { cause: error }
    );
  }
};
```

#### Performance Testing Requirements

```typescript
// Performance tests are mandatory for all performance components
describe('AutoScaling Performance', () => {
  it('should scale up within performance thresholds', async () => {
    const scaler = new AdvancedAutoScaler(testConfig);
    await scaler.initialize();

    const startTime = performance.now();
    await scaler.scaleUp(5);
    const endTime = performance.now();

    // Scaling should complete within 1 second
    expect(endTime - startTime).toBeLessThan(1000);

    // Verify scaling effectiveness
    const metrics = scaler.getPerformanceMetrics();
    expect(metrics.currentInstances).toBe(5);
  });

  it('should handle high load without performance degradation', async () => {
    const scaler = new AdvancedAutoScaler(testConfig);
    await scaler.initialize();

    // Simulate high load
    const loadPromises = Array.from({ length: 100 }, () =>
      scaler.processLoadEvent(generateLoadEvent())
    );

    const results = await Promise.allSettled(loadPromises);

    // All operations should succeed
    expect(results.every(r => r.status === 'fulfilled')).toBe(true);

    // Performance should not degrade
    const metrics = scaler.getPerformanceMetrics();
    expect(metrics.averageResponseTime).toBeLessThan(100);
  });
});
```

#### Performance Configuration Standards

```typescript
// All performance components must support environment configuration
export const loadPerformanceConfig = (): PerformanceConfig => {
  return {
    // Auto-scaling thresholds
    cpuThreshold: parseFloat(process.env.PERF_CPU_THRESHOLD || '80'),
    memoryThreshold: parseFloat(process.env.PERF_MEMORY_THRESHOLD || '85'),
    latencyThreshold: parseFloat(process.env.PERF_LATENCY_THRESHOLD || '5000'),

    // Resource limits
    maxInstances: parseInt(process.env.PERF_MAX_INSTANCES || '20'),
    minInstances: parseInt(process.env.PERF_MIN_INSTANCES || '1'),

    // Feature flags
    enableMLScaling: process.env.PERF_ENABLE_ML === 'true',
    enableGPUScheduling: process.env.PERF_ENABLE_GPU === 'true',
    enableDistributedCache: process.env.PERF_ENABLE_CACHE === 'true'
  };
};
```

#### Memory and Resource Management

```typescript
// ✅ Good: Proper resource cleanup
export const createResourceManager = (): ResourceManager => {
  const resources = new Map<string, Resource>();
  const cleanupTasks = new Set<() => Promise<void>>();

  const acquireResource = async (id: string): Promise<Resource> => {
    const resource = await allocateResource(id);
    resources.set(id, resource);

    // Register cleanup task
    cleanupTasks.add(() => releaseResource(id));

    return resource;
  };

  const cleanup = async (): Promise<void> => {
    // Run all cleanup tasks concurrently
    await Promise.allSettled(
      Array.from(cleanupTasks).map(task => task())
    );

    resources.clear();
    cleanupTasks.clear();
  };

  return {
    acquireResource,
    cleanup,
    getActiveResources: () => resources.size
  };
};

// ✅ Good: Memory-efficient processing
export const processBatchOptimized = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 100
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );

    results.push(...batchResults);

    // Allow garbage collection between batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return results;
};
```

### Performance Monitoring Integration

All performance components must integrate with the monitoring system:

```typescript
export const createMonitoredComponent = <T>(
  name: string,
  factory: () => T
): T & { getMetrics: () => ComponentMetrics } => {
  const component = factory();
  const metrics = new ComponentMetrics(name);

  return new Proxy(component, {
    get(target, prop) {
      const value = target[prop as keyof T];

      if (typeof value === 'function') {
        return async (...args: any[]) => {
          const startTime = performance.now();
          metrics.incrementOperationCount(String(prop));

          try {
            const result = await value.apply(target, args);
            metrics.recordSuccess(String(prop), performance.now() - startTime);
            return result;
          } catch (error) {
            metrics.recordFailure(String(prop), performance.now() - startTime);
            throw error;
          }
        };
      }

      return value;
    }
  }) as T & { getMetrics: () => ComponentMetrics };
};
```

### Function Length Limits

- **Maximum 40 lines per function** - Split immediately if readability suffers
- **Strictly enforced in CI** - Build failures for violations
- **No exceptions** for any code

### Export Requirements

- **Named exports only** - `export const functionName = ...`
- **Default exports forbidden** - `export default` will cause build failures
- **Required for tree-shaking and debugging**

### Class Usage Restrictions

- **Classes only when framework-required** (React ErrorBoundary, etc.)
- **Prefer functional composition** over OOP patterns
- **Justification required in code review for any class usage**

### Async/Await Requirements

- **Use async/await exclusively** - Never use `.then()` chains
- **Promise chains are forbidden** and caught by linters
- **Violations will block PR merges**

### Project References

- **All packages must set `composite: true`** in tsconfig.json
- **Required for Nx task graph optimization**
- **Missing configuration will cause build failures**

### Mandatory Local Memory Usage

- **Store all architectural decisions** with reasoning and context
- **Document lessons learned** from code reviews and refactoring
- **Track effective development strategies** for future reference
- **Maintain persistent context** across development sessions
- **Use semantic search** to find relevant past decisions

### Code Standards

#### TypeScript/JavaScript

```typescript
// ✅ Good: Clear function with type safety and proper exports
export interface ProcessDataRequest {
  data: unknown;
  options: ProcessingOptions;
}

export const processData = async ({
  data,
  options
}: ProcessDataRequest): Promise<ProcessedData> => {
  const validator = createValidator(options.schema);
  const validatedData = await validator.validate(data);

  return await processor.process(validatedData, options);
};

// ✅ Good: Function split to respect 40-line limit
export const validateData = async (
  data: unknown,
  schema: ValidationSchema
): Promise<ValidatedData> => {
  const validator = createValidator(schema);
  return await validator.validate(data);
};

export const processValidatedData = async (
  data: ValidatedData,
  options: ProcessingOptions
): Promise<ProcessedData> => {
  return await processor.process(data, options);
};

// ❌ Avoid: Default export, unclear types, >40 lines
export default function processData(data: any, opts?: any): any {
  // Long function that should be split
  const validator = createValidator(opts?.schema);
  const validated = validator.validate(data);
  const processed = processor.process(validated, opts);
  return processed;
}
```

#### Rust (TUI Components)

```rust
// ✅ Good: Clear struct with documentation
/// Represents a GitHub dashboard view state
#[derive(Debug, Clone)]
pub struct GitHubDashboard {
    /// Current active tab
    active_tab: DashboardTab,
    /// Pull requests data
    pull_requests: Vec<PullRequest>,
    /// Last refresh timestamp
    last_refresh: Option<SystemTime>,
}

impl GitHubDashboard {
    /// Creates a new GitHub dashboard instance
    pub fn new() -> Self {
        Self {
            active_tab: DashboardTab::Overview,
            pull_requests: Vec::new(),
            last_refresh: None,
        }
    }
}

// ❌ Avoid: Unclear naming and no documentation
pub struct GHDash {
    tab: u8,
    prs: Vec<PR>,
    ts: Option<SystemTime>,
}
```

### Architecture Principles

#### 1. **Governed Boundaries**

```typescript
// ✅ Good: Use A2A events for cross-package communication
await eventBus.emit('task.created', {
  taskId: 'task-123',
  type: 'data-processing',
  data: processedData,
});

// ❌ Avoid: Direct imports between feature packages
import { DataProcessor } from '../../../data-processing/src/processor';
```

#### 2. **Security First**

```typescript
// ✅ Good: Input validation and sanitization
const processRequest = z.object({
  data: z.string().max(10000),
  options: ProcessingOptionsSchema,
});

const validatedRequest = processRequest.parse(request);
const sanitizedData = sanitizeInput(validatedRequest.data);

// ❌ Avoid: Direct use of untrusted input
const result = await processor.process(request.data);
```

#### 3. **Type Safety**

```typescript
// ✅ Good: Strict typing with Zod validation
const AgentConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  capabilities: z.array(z.string()),
  settings: z.record(z.unknown()).optional(),
});

type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ❌ Avoid: Loose typing
interface AgentConfig {
  id: string;
  name?: string;
  capabilities?: any[];
  settings?: any;
}
```

## 🧪 TDD & Testing Requirements

### Test-Driven Development (TDD)

**Mandatory TDD Implementation** for all new code:

1. **Red-Green-Refactor Cycle**: Write failing test first, then implement code
2. **Test-First Approach**: All new features must start with failing tests
3. **TDD Coach Integration**: Use automated TDD validation and coaching

#### TDD Workflow

```bash
# Initialize TDD environment (run once)
make tdd-setup

# During development - continuous validation
make tdd-watch          # Watch mode for real-time feedback

# Before commits - validate TDD compliance
make tdd-validate        # Validate staged files
make tdd-status          # Check overall compliance

# Run comprehensive TDD validation
make tdd-validate-all    # Validate entire codebase
```

#### TDD Coach Usage

```typescript
// TDD Coach provides real-time coaching suggestions
// Install the TDD Coach CLI
pnpm add -D @cortex-os/tdd-coach

// Get coaching for test-first development
tdd-coach coach --file src/services/newService.ts

// Validate TDD compliance
tdd-coach validate --strict

// Generate test scaffolding
tdd-coach scaffold --type service --name newService
```

### Coverage Requirements

- **Minimum Coverage**: 95% for statements, branches, functions, and lines (upgraded from 90%)
- **Mutation Testing**: ≥90% mutation score required
- **Review Tip**: PR summaries list failing/passing packages, threshold deltas, and >5% regressions; confirm waivers and investigate any flagged drops before approval.
- **Per-package Enforcement**: Use `pnpm nx run root:mutation-packages` to refresh per-package scores locally; history output highlights the prior score for context.
- **Security Tests**: All security-related code must have dedicated tests
- **Integration Tests**: Multi-package interactions must be tested
- **TDD Compliance**: ≥90% test-first commits ratio

#### Quality Gate Enforcement

```bash
# Coverage ratcheting - ensures coverage never decreases
pnpm coverage:ratchet     # Enforce coverage improvements

# Mutation testing for test quality
pnpm mutation:test        # Run mutation testing
pnpm mutation:enforce     # Enforce mutation score thresholds
pnpm mutation:packages    # Generate per-package summary (metadata-aware)
pnpm nx run root:mutation-packages  # Nx shortcut for the same per-package check

# Quality gate validation
pnpm quality:gate         # Run all quality gates
make quality:report       # Generate comprehensive quality report
```

### Testing Patterns

#### TDD Test Examples

**Test-First Development Example:**

```typescript
// 1. RED: Write failing test first
describe('ImageProcessor', () => {
  describe('processImage', () => {
    it('should extract text from image using OCR', async () => {
      const mockImage = createMockImage('test-image.png');
      const processor = new ImageProcessor();

      const result = await processor.processImage(mockImage, {
        enableOCR: true
      });

      expect(result.ocrText).toContain('Sample text');
      expect(result.metadata.width).toBe(1920);
      expect(result.metadata.height).toBe(1080);
    });

    it('should handle unsupported image formats', async () => {
      const mockImage = createMockImage('test.xyz');
      const processor = new ImageProcessor();

      await expect(
        processor.processImage(mockImage)
      ).rejects.toThrow('Unsupported file format');
    });
  });
});

// 2. GREEN: Implement minimal code to pass tests
export const processImage = async (
  image: ImageFile,
  options: ProcessingOptions = {}
): Promise<ProcessedImage> => {
  if (!isSupportedFormat(image)) {
    throw new Error('Unsupported file format');
  }

  const metadata = await extractMetadata(image);
  let ocrText = '';

  if (options.enableOCR) {
    ocrText = await performOCR(image);
  }

  return {
    ocrText,
    metadata,
    processedAt: new Date().toISOString()
  };
};

// 3. REFACTOR: Improve code while maintaining test coverage
export const processImage = async (
  image: ImageFile,
  options: ProcessingOptions = {}
): Promise<ProcessedImage> => {
  const validation = validateImageInput(image);
  if (!validation.isValid) {
    throw new UnsupportedFormatError(validation.reason);
  }

  const [metadata, ocrText] = await Promise.all([
    extractImageMetadata(image),
    options.enableOCR ? performOCRWithRetry(image) : Promise.resolve('')
  ]);

  return createProcessedImageResult(metadata, ocrText);
};
```

#### Unit Tests

```typescript
// Example: Agent communication test
describe('AgentCommunication', () => {
  let eventBus: EventBus;
  let agent: TestAgent;

  beforeEach(async () => {
    eventBus = createTestEventBus();
    agent = new TestAgent({ id: 'test-agent', eventBus });
    await agent.start();
  });

  it('should handle task creation events', async () => {
    const handler = jest.fn();
    agent.on('task.created', handler);

    await eventBus.emit('task.created', {
      taskId: 'test-123',
      type: 'data-processing',
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { taskId: 'test-123', type: 'data-processing' },
      }),
    );
  });
});
```

#### Integration Tests

```typescript
// Example: End-to-end workflow test
describe('DataProcessingWorkflow', () => {
  it('should process data from input to output', async () => {
    const workflow = new TestWorkflow();

    const result = await workflow.execute({
      input: testData,
      steps: ['validate', 'transform', 'store'],
    });

    expect(result.status).toBe('completed');
    expect(result.outputs).toHaveLength(3);
    expect(result.outputs[2]).toMatchObject({
      step: 'store',
      status: 'success',
    });
  });
});
```

### Running Tests

```bash
# TDD-first development workflow
make tdd-watch          # Continuous validation during development
make tdd-validate        # Validate TDD compliance before commits
make tdd-status          # Check current TDD status

# Traditional test commands
pnpm test               # Run all tests
pnpm test:coverage      # Run tests with coverage (95% minimum)
pnpm test:integration   # Run integration tests
pnpm test:security      # Run security tests
pnpm test:e2e          # Run end-to-end tests

# Mutation testing for test quality
pnpm mutation:test      # Run mutation testing
pnpm mutation:enforce   # Enforce ≥90% mutation score
pnpm mutation:packages  # Generate per-package summary (metadata-aware)
pnpm nx run root:mutation-packages  # Nx shortcut for the same per-package check

# Quality gate validation
pnpm quality:gate       # Run all quality gates
make quality:report     # Generate comprehensive quality report
```

### Multimodal Testing

```typescript
// Example: Multimodal processing test
describe('MultimodalProcessor', () => {
  describe('processImage', () => {
    it('should extract OCR text and perform vision analysis', async () => {
      const testImage = createTestImage('test-landscape.jpg');
      const processor = new MultimodalProcessor();

      const result = await processor.processImage(testImage, {
        enableOCR: true,
        enableVisionAnalysis: true
      });

      expect(result.ocrText).toBeDefined();
      expect(result.visionAnalysis.objects).toHaveLengthGreaterThan(0);
      expect(result.metadata.format).toBe('JPEG');
    });

    it('should handle audio transcription with speaker diarization', async () => {
      const testAudio = createTestAudio('meeting.mp3');
      const processor = new MultimodalProcessor();

      const result = await processor.processAudio(testAudio, {
        enableTranscription: true,
        enableSpeakerDiarization: true
      });

      expect(result.transcript).toContain('Speaker 1:');
      expect(result.speakers).toHaveLengthGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('crossModalSearch', () => {
    it('should search across text, image, and audio content', async () => {
      const processor = new MultimodalProcessor();

      const results = await processor.search({
        query: 'mountain photography techniques',
        modalities: ['text', 'image', 'audio_transcript'],
        limit: 10
      });

      expect(results).toHaveLengthGreaterThan(0);
      expect(results[0].score).toBeGreaterThan(0.7);
      expect(results.some(r => r.modality === 'image')).toBe(true);
    });
  });
});
```

## 🔒 Security Guidelines

### Security Requirements

- All user inputs must be validated using Zod schemas
- Sensitive data must not appear in logs or error messages
- Network communications must use TLS encryption
- Follow OWASP Top-10 guidelines for web security
- Follow OWASP LLM Top-10 for AI/ML specific security

### Security Testing

```bash
# Run security scans
pnpm security:scan              # OWASP precise rules
pnpm security:scan:llm          # LLM-specific security
pnpm security:scan:comprehensive # All security rulesets
```

### Security Code Examples

#### Input Validation

```typescript
// ✅ Good: Comprehensive validation
const UserInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(1000)
    .regex(/^[a-zA-Z0-9\s\-_.,!?]+$/, 'Invalid characters'),
  options: z
    .object({
      format: z.enum(['json', 'xml', 'yaml']),
      maxResults: z.number().min(1).max(100),
    })
    .optional(),
});

// Validate and sanitize
const validatedInput = UserInputSchema.parse(rawInput);
const sanitizedQuery = sanitizeHtml(validatedInput.query);
```

#### Secret Management

```typescript
// ✅ Good: Secure secret handling
const secrets = new SecretManager({
  provider: 'azure-keyvault',
  vaultUrl: process.env.AZURE_KEYVAULT_URL,
});

const apiKey = await secrets.get('github-api-key');

// ❌ Avoid: Hardcoded secrets
const apiKey = 'ghp_1234567890abcdef'; // Never do this
```

## 📚 Documentation Standards

### Code Documentation

- All public APIs must have JSDoc/TSDoc comments
- Complex algorithms need inline comments explaining the logic
- Security-sensitive code requires additional documentation

### Example Documentation

````typescript
/**
 * Processes agent-to-agent messages with validation and tracing
 *
 * @param envelope - CloudEvents-compliant message envelope
 * @param options - Processing options including validation settings
 * @returns Promise resolving to processing result
 *
 * @throws {ValidationError} When envelope fails schema validation
 * @throws {SecurityError} When source authentication fails
 *
 * @example
 * ```typescript
 * const result = await processMessage(envelope, {
 *   validateSource: true,
 *   enableTracing: true
 * });
 * ```
 *
 * @security This function validates all inputs and sanitizes message data
 * @since v1.0.0
 */
async function processMessage(
  envelope: Envelope,
  options: ProcessingOptions = {},
): Promise<ProcessingResult> {
  // Implementation...
}
````

### README Requirements

- All packages must have comprehensive README files
- Include installation instructions, usage examples, and API documentation
- Add status badges for build, coverage, and security
- Follow GitHub's recommended README structure

### Docs Style (Markdown)

Follow these conventions for all `*.md` files:

| Aspect            | Guideline                                                                     |
| ----------------- | ----------------------------------------------------------------------------- |
| Line Length       | Soft wrap allowed; no hard wraps mid-sentence unless improving diff clarity   |
| Headings          | Use `#` through `####`; never skip levels; one H1 per document                |
| Code Fences       | Always specify language (`bash`, `typescript`, `python`, `json`, etc.)        |
| Tables            | Compact, align with single spaces, keep header row concise                    |
| Links             | Prefer relative links within repo; wrap bare external URLs in angle brackets  |
| Badges            | Group at top (README) or inside centered `<div>`; avoid excessive badges      |
| Admonitions       | Use simple blockquotes (`> Note:` / `> Warning:`) instead of HTML             |
| HTML              | Avoid raw HTML except for necessary alignment wrappers or diagrams            |
| Lint Suppressions | Use `<!-- markdownlint-disable rule -->` sparingly with justification comment |
| File Naming       | Kebab-case: `architecture-overview.md`, `quick-start.md`                      |
| Front Matter      | Only when required by docs tooling; keep minimal                              |
| Diagrams          | Prefer Mermaid fenced blocks (` ```mermaid `)                                 |
| Lists             | Use `-` for unordered, `1.` for ordered; keep items concise                   |

#### Examples

```markdown
> Note: This guide assumes Node.js 20+.

# Show how to run coverage (example)

$ pnpm test:coverage
```

#### Linting Locally

```bash
# Lint all markdown
npx markdownlint-cli2 "**/*.md"

# Lint only changed files (simulation of hook)
git diff --name-only --diff-filter=ACM origin/main | grep -E '\.md$' | xargs npx markdownlint-cli2
```

#### Common Pitfalls

| Issue                 | Fix                                              |
| --------------------- | ------------------------------------------------ |
| Bare URL flagged      | Wrap in `< >` or convert to `[text](url)`        |
| Long code block lines | Acceptable if inside fenced block (rule relaxed) |
| HTML tables           | Replace with pure markdown tables                |
| Multiple H1 headings  | Downshift to `##` for subsequent sections        |

## 🚀 Development Workflow

### Branch Strategy

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/awesome-new-feature

# Or for bug fixes
git checkout -b fix/issue-description

# Or for documentation
git checkout -b docs/improve-contributing-guide
```

### Stacked PRs with Graphite (Recommended)

For incremental, reviewable changes, we recommend stacked PRs using the Graphite CLI:

```bash
# Sync and create a new branch on top of your current stack
pnpm graphite:sync
pnpm graphite:branch -- --name "feature/my-change"

# Commit small focused changes and push
git add -A && git commit -m "feat(xyz): small focused change"

# Restack if base changed
pnpm graphite:restack

# Submit your stack as PRs
pnpm graphite:submit:stack

# One-shot combo when you're confident:
pnpm graphite:auto
```

Notes:

- Keep changes small and independent; prefer many small PRs over one large PR.
- Our Graphite config auto-updates PR descriptions and deletes merged branches.
- Protected branches cannot be rebased (`main`, `develop`, `staging`).

### Commit Message Format

We follow [Conventional Commits](https://conventionalcommits.org/) specification:

```bash
# Format: <type>[optional scope]: <description>
#
# Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore

# Examples:
git commit -m "feat(a2a): add message compression support"
git commit -m "fix(tui): resolve dashboard rendering issue"
git commit -m "docs(mcp): update API documentation"
git commit -m "test(agents): add integration tests for workflow"
git commit -m "security(core): implement input sanitization"
```

### Husky Hook Caching

Git hooks compute cache keys from staged file contents. The helper batches calls through `git hash-object --stdin-paths` when available, then falls back to `shasum`, `sha256sum`, and finally `powershell.exe` (for both file and string hashing). Symlinks or directories are treated as unsafe inputs and bypass caching. Lint commands prefer `pnpm exec lint-staged --concurrent false`, falling back to `npx --no-install lint-staged --concurrent false` only when pnpm is missing.

Set `HOOK_VERBOSE=1` to print which hashing tool ran. If caching reports `no-cache`, install one of the supported hashers (for example `brew install git`, `brew install coreutils`, `apk add busybox`, or ensure Git for Windows exposes its binaries inside Git Bash). Local developers can iterate quickly with `pnpm test:hooks -- --watch`, and CI enforces the harness through `pnpm nx run workspace-root:test:hooks` on every pull request.

### Pull Request Process

#### 1. **Before Creating PR**

```bash
# TDD validation (mandatory)
make tdd-validate        # Validate TDD compliance
make tdd-status          # Check TDD status

# Ensure all tests pass with 95%+ coverage
pnpm test:coverage      # Run tests with coverage validation
pnpm mutation:enforce   # Ensure ≥90% mutation score

# Run linting and formatting
pnpm lint
pnpm format

# Run security scans
pnpm security:scan

# Verify build works
pnpm build

# Check structure compliance
pnpm structure:validate

# Quality gate validation
pnpm quality:gate       # Run all quality gates
```

#### 1.1 **Changesets & Release Waivers**

- Run `pnpm changeset add` for every PR that affects a published package or user-visible behavior. The CI gate fails if no changeset is present.
- For documentation-only or tooling tweaks that intentionally skip a release, add the `skip-release` label and mention the waiver in your PR summary.
- Expect an automated "Changeset release preview" comment summarizing the pending releases; use it to verify the correct packages are covered.

#### 2. **PR Title and Description**

```markdown
# Title Format

feat(package): brief description of changes

# Description Template

## Summary

Brief description of what this PR accomplishes.

## Changes

- List of specific changes made
- New features added
- Bug fixes included

## Testing & Quality

- [ ] TDD-first development followed
- [ ] Unit tests added/updated (95%+ coverage)
- [ ] Integration tests added/updated
- [ ] Mutation testing completed (≥90% score)
- [ ] Manual testing completed
- [ ] Security testing performed
- [ ] Quality gates passing

## Documentation

- [ ] Code documentation updated
- [ ] README files updated
- [ ] API documentation updated

## Breaking Changes

None / List any breaking changes

## Related Issues

Closes #123
Fixes #456
```

#### 3. **Review Process**

- **Automated Checks**: All CI checks must pass
  - `ci.yml` includes the **MCP server portability** job which runs the cwd-migration unit test from a temporary directory,
    enforces the `process.cwd` ban in `packages/mcp-server/src/config/connectors.ts`, and verifies the single-file bundle via
    `pnpm --filter @cortex-os/mcp-server run bundle:single`. Reproduce locally with:

    ```bash
    pnpm --filter @cortex-os/mcp-server test:unit -- --runInBand --testNamePattern "working directory"
    pnpm --filter @cortex-os/mcp-server run bundle:single
    if rg "process\\.cwd" packages/mcp-server/src/config/connectors.ts; then echo "remove process.cwd"; exit 1; fi
    ```
  - `quality-gates.yml` runs `node scripts/ci/check-dead-code.mjs`, which wraps `ts-prune`, refreshes the
    `reports/ts-prune*.txt` artifacts, and emits a machine-consumable `reports/static-analysis/ts-prune.json`. The step fails
    whenever new entries appear beyond the curated baseline at `reports/baselines/ts-prune-baseline.txt`. **Resolve regressions
    by deleting unused exports, wiring them into the intended module, or documenting a tracked follow-up before updating the
    baseline.** Baseline updates require reviewer approval and must ship with rationale in the PR summary plus a link to the
    JSON payload for traceability.
  - `python_quality.yml` executes `node scripts/ci/check-python-dead-code.mjs`, which shells out to `uv run vulture` with
    `--min-confidence 80`, writes `reports/python/vulture.txt`, `reports/python/vulture-actionable.txt`, and
    `reports/static-analysis/vulture.json`, and annotates actionable hits. Entries copied into
    `python/vulture-allowlist.txt` are treated as temporary waivers and **must** cite a tracking issue and expiry window either
    inline or in the PR summary. The JSON report becomes the canonical artifact reviewers reference when auditing allowlists.
  - The PR quality workflow enforces an asset guard via `scripts/ci/asset-size-guard.mjs`, persisting
    `reports/static-analysis/assets.json` alongside a step summary. Thresholds come from `config/asset-guard.json`
    (defaulting to **1&nbsp;MiB** per asset). Oversized assets require compression or refactoring; deliberate exceptions need
    the `asset:allowed` label, a justification in the PR body, and the following evidence bundle:
    1) a link to product/UX sign-off or incident response doc explaining why the raw asset is required, 2) a comparison proving
    that alternatives (compression, CDN, streaming) were evaluated, and 3) an inventory of downstream consumers confirming the
    storage and caching plan. Label applications without that evidence are rejected during review.
  - Static-analysis warnings (ts-prune baseline drifts, actionable vulture hits) are mirrored to the
    `static-analysis-summary` sticky PR comment. Treat that comment as the authoritative checklist before requesting review.
- **Code Review**: At least one maintainer review required
- **Architecture Review**: For architectural changes
- **Security Review**: For security-related changes

#### 4. **Changesets & Release Signaling**

**Automation scope**

- The `Changeset Guard` workflow runs on every pull request **and** on direct pushes to `main` and `release/*`. Direct pushes lack labels, so the guard always evaluates; fix failures by adding a changeset or reverting the push.
- Hotfix pushes should include a follow-up PR (or backfilled changeset) so the guard history remains auditable.

**Using `skip-release` responsibly**

- Apply the `skip-release` label **only** when a change cannot impact consumers—for example:
  - Docs-only edits that do not change public APIs or CLIs.
  - CI/CD or repository hygiene fixes that ship no runtime artifacts.
  - Reverts of patches that never shipped to a release channel.
- When unsure, default to adding a changeset instead of using the label. Maintainers may remove the label if the automation reports a missing changeset.

**Multi-package enforcement**

- If multiple published workspace packages change, `skip-release` is rejected by automation. Create a single multi-package changeset describing the combined change instead of attempting to bypass the release signal.

**Authoring multi-package changesets**

1. Run `pnpm changeset` from the repo root.
2. Select every affected package in the interactive prompt (space bar toggles selection) before pressing enter.
3. Choose the correct bump type for each package (patch/minor/major) and provide a shared summary covering the combined change.
4. Commit the generated file under `.changeset/` alongside your code.

> Tip: If you need to touch the same feature across several packages, create a single multi-package changeset so downstream releases stay in lockstep.

**Local rehearsal**

- Run `pnpm check:changeset` to mirror the guard locally. The helper script auto-detects the default branch (`origin/HEAD`), surfaces each unreleased changeset, and exits non-zero when none are present.
- If the repository lacks a `.changeset/` directory (for example in sparse or docs-only clones), the script exits successfully after emitting a warning so contributors are not blocked.

**Security posture**

- The workflow uses the default `GITHUB_TOKEN` with read-only `contents` and `pull-requests` scopes. Do not grant broader permissions without a security review.
- `changesets/action` is pinned to a specific commit SHA; update only after verifying upstream integrity and recording the new hash in release notes.
- Avoid writing secrets to the workflow logs; the guard itself never needs them.

**Observability & reporting**

- Reviewers must paste a permalink or screenshot of the guard status when completing the review checklist so audits confirm humans inspected the automation result.
- Maintainers aggregate guard outcomes through the GitHub Actions API; recurring misses trigger retro action items and documentation refreshes.
- Track guard failures in release retrospectives to ensure remediation (changeset addition or policy update) was completed.

## Development Patterns to Avoid

### NEVER Continue These Anti-Patterns

1. **Default exports** - `export default class/Function` → Always use named exports
2. **Function length > 40 lines** → Immediately split into smaller functions
3. **`.then()` chains** → Use `async/await` exclusively
4. **Classes without framework requirement** → Use functional composition
5. **Missing `composite: true`** → All packages require this setting
6. **Direct sibling package imports** → Use events/contracts instead
7. **Bypassing local memory** → Store all development insights persistently

### Required Local Memory Usage Patterns

```typescript
// Store architectural decisions
await memory.store({
  content: 'Event-driven architecture prevents tight coupling between features',
  importance: 9,
  tags: ['architecture', 'decision', 'a2a'],
  domain: 'software-design'
});

// Store development lessons
await memory.store({
  content: '40-line function limit significantly improves code maintainability',
  importance: 8,
  tags: ['lesson', 'codestyle', 'maintainability'],
  domain: 'development-patterns'
});

// Store technical decisions
await memory.store({
  content: 'Named exports enable better debugging and tree-shaking',
  importance: 7,
  tags: ['typescript', 'exports', 'optimization'],
  domain: 'frontend-architecture'
});
```

## 🏗️ Package Development

### Creating New Packages

#### 1. **Package Structure**

```bash
packages/new-package/
├── src/
│   ├── index.ts          # Main exports
│   ├── lib/              # Core implementation
│   └── types.ts          # Type definitions
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/
│   └── api.md            # API documentation
├── package.json          # Package configuration
├── project.json          # Nx project configuration
├── vitest.config.ts      # Test configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Package documentation
```

#### 2. **Package Configuration**

```json
// package.json
{
  "name": "@cortex-os/new-package",
  "version": "1.0.0",
  "description": "Brief description of package functionality",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src/**/*.ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@cortex-os/a2a": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

#### 3. **Nx Project Configuration**

```json
// project.json
{
  "name": "new-package",
  "projectType": "library",
  "sourceRoot": "packages/new-package/src",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc",
        "cwd": "packages/new-package"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vitest run",
        "cwd": "packages/new-package"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["packages/new-package/**/*.ts"]
      }
    }
  },
  "tags": ["scope:new-package", "type:library"]
}
```

#### 4. **TypeScript Configuration (REQUIRED)**

```json
// tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "declaration": true,
    "declarationMap": true,
    "composite": true, // MANDATORY for Nx task graph
    "rootDir": "src",
    "baseUrl": "."
  },
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

**Important**: The `composite: true` setting is **required** for all packages to enable proper Nx task graph optimization and build performance.

### Package Integration

- Register package in `pnpm-workspace.yaml`
- Add to Nx workspace configuration
- Update root package.json dependencies if needed
- Add to main exports in root index file

## 🎨 UI/UX Contributions

### TUI Development (Rust)

```rust
// Follow these patterns for TUI components
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, List, ListItem, Paragraph},
};

pub struct ComponentState {
    // State fields
}

impl ComponentState {
    pub fn new() -> Self {
        Self {
            // Initialize state
        }
    }

    pub fn render(&mut self, frame: &mut Frame, area: Rect) {
        // Render implementation
        let block = Block::default()
            .title("Component Title")
            .borders(Borders::ALL);

        frame.render_widget(block, area);
    }

    pub fn handle_key_event(&mut self, key: KeyEvent) -> Result<()> {
        // Key handling implementation
        Ok(())
    }
}
```

### Web UI Development (React)

```typescript
// Follow these patterns for React components
interface ComponentProps {
  data: DataType;
  onAction: (action: ActionType) => void;
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({ data, onAction, className }) => {
  // Use hooks for state management
  const [state, setState] = useState<StateType>(initialState);

  // Event handlers
  const handleAction = useCallback(
    (action: ActionType) => {
      setState((prev) => updateState(prev, action));
      onAction(action);
    },
    [onAction],
  );

  // Render with accessibility
  return (
    <div
      className={cn('component-base', className)}
      role="region"
      aria-label="Component description"
    >
      {/* Component content */}
    </div>
  );
};
```

## 🐛 Bug Reports

### Bug Report Template

When reporting bugs, please include:

```markdown
## Bug Description

Clear description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- OS: [e.g., macOS 14.0]
- Node.js: [e.g., 20.0.0]
- Package Version: [e.g., 1.2.3]
- Browser (if applicable): [e.g., Chrome 118]

## Additional Context

- Error messages
- Screenshots
- Console output
- Related configuration
```

### Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities. Instead:

1. Email <security@cortex-os.dev> with details
2. Include "SECURITY" in the subject line
3. Provide detailed reproduction steps
4. Allow us to respond before public disclosure

## 🎯 Feature Requests

### Feature Request Template

```markdown
## Feature Summary

Brief description of the feature.

## Motivation

Why is this feature needed? What problem does it solve?

## Detailed Description

Comprehensive description of the proposed feature.

## Proposed Solution

How should this feature work?

## Alternatives Considered

What other solutions did you consider?

## Additional Context

- Mockups or diagrams
- Related issues or discussions
- Implementation suggestions
```

## 👥 Community Guidelines

### Code of Conduct

We follow the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). In summary:

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with newcomers and questions
- **Be mindful** of our diverse community

### Communication Channels

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Pull Requests**: For code contributions and reviews
- **Security Email**: <security@cortex-os.dev> for security issues

### Getting Help

- Check existing documentation and issues first
- Provide clear, specific questions with context
- Include relevant code snippets and error messages
- Be patient and respectful when asking for help

## 🏆 Recognition

### Contributor Recognition

We recognize contributions in several ways:

- **Contributors List**: All contributors listed in README
- **Release Notes**: Major contributions mentioned in release notes
- **Special Recognition**: Outstanding contributors may be invited to join the maintainer team

### Types of Contributions We Value

- Code contributions (features, fixes, improvements)
- Documentation improvements
- Bug reports and testing
- Community support and mentoring
- Security research and reporting
- Design and user experience improvements

## 📞 Contact

- **General Questions**: [GitHub Discussions](https://github.com/cortex-os/cortex-os/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/cortex-os/cortex-os/issues)
- **Security Issues**: <security@cortex-os.dev>
- **Maintainer Contact**: <team@cortex-os.dev>

## 📜 License

By contributing to Cortex-OS, you agree that your contributions will be licensed under the same
[Apache-2.0 License](./LICENSE) that covers the project.

---

**Thank you for contributing to Cortex-OS!** 🚀  
_Together, we're building the future of AI agent systems_

[![Contributors](https://img.shields.io/github/contributors/cortex-os/cortex-os)](https://github.com/cortex-os/cortex-os/graphs/contributors)
[![GitHub Stars](https://img.shields.io/github/stars/cortex-os/cortex-os?style=social)](https://github.com/cortex-os/cortex-os)

## Nx project.json guard

To keep Nx `project.json` files consistent across the monorepo, we enforce:

- Replace legacy token `${workspaceRoot}` with `{workspaceRoot}`
- Remove `${args}` from command strings and rely on `options.forwardAllArgs: true`

Usage:

```bash
pnpm nx:project:guard   # check only (fails on issues)
pnpm nx:project:fix     # auto-fix all project.json files
```

Pre-commit automatically runs the fixer for any staged `project.json` via lint-staged.

CI Enforcement: The governance pipeline runs `pnpm nx:project:guard` so PRs that
reintroduce `${workspaceRoot}` or `${args}` patterns will fail fast.
