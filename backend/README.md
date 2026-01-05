# AMYGA Governance Backend

**Acceleration Layer with Real-time Streaming and Accountability**

This backend provides fast indexing, caching, API access, and real-time event streaming for your existing governance framework without modifying any of your core files.

## Key Differentiators vs MCAF

| Feature | AMYGA Backend | MCAF | Advantage |
|---------|--------------|------|-----------|
| **Real-time Streaming** | ✅ WebSocket server | ❌ None | Live governance dashboard |
| **Four-Perspective Accountability** | ✅ Product/Dev/QA/AI | ❌ None | Multi-stakeholder sign-off |
| **Auto-Reindex** | ✅ File watchers | ❌ Manual | Always up-to-date |
| **Progressive Disclosure Caching** | ✅ LRU + TTL | ⚠️ Basic only | Better performance |
| **AI Mode State Machine** | ✅ 3 modes | ❌ None | Adaptive AI participation |

---

## What It Does

The backend **reads and indexes** your existing framework files:

- **`.claude/skills/`** → SQLite index for O(log n) skill lookups
- **`brainwav/governance/90-infra/governance-index.json`** → Hash cache for instant validation
- **`tasks/<slug>/json/run-manifest.json`** → Accountability overlay (four-perspective sign-offs)

**NEW in v0.2:**
- **LRU Cache** → Hot data caching with automatic eviction
- **File Watchers** → Auto-reindex when framework files change
- **WebSocket Server** → Real-time event streaming on port 3001
- **Accountability System** → Four-perspective sign-off tracking
- **AI Mode State Machine** → Delegated/Collaborative/Consultative modes

Your files remain the source of truth. The backend just makes them faster to access.

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Initialize Database

```bash
pnpm run db:migrate
```

This creates `backend/data/governance.db` with the acceleration layer schema.

### 3. Start Server

```bash
# Development (with hot reload)
pnpm run dev

# Production
pnpm run build
pnpm run start

# With file watchers enabled
ENABLE_FILE_WATCHER=true pnpm run dev
```

Servers:
- **REST API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3001`

### 4. Index Your Framework

```bash
# Index all skills from .claude/skills/
curl -X POST http://localhost:3000/api/v1/index/skills

# Load governance-index.json
curl -X POST http://localhost:3000/api/v1/index/governance
```

---

## API Endpoints

### Health & Status

```bash
# Health check (includes WebSocket status)
GET /health

# Backend statistics (including cache and AI modes)
GET /api/v1/stats
```

### Skills

```bash
# List all skills
GET /api/v1/skills

# Search skills (full-text, cached)
GET /api/v1/skills/search?q=authentication

# Find skill by trigger
GET /api/v1/skills/trigger?phrase=implement

# Get specific skill (cached)
GET /api/v1/skills/{skillId}
```

### Compliance

```bash
# Get compliance status
GET /api/v1/compliance/status

# List all governance documents
GET /api/v1/compliance/documents

# Validate all documents (broadcasts drift via WebSocket)
POST /api/v1/compliance/validate

# Detect hash drift
GET /api/v1/compliance/drift
```

### Accountability (NEW - MCAF lacks this)

```bash
# Create accountability record for a task
POST /api/v1/accountability/create
Body: { slug, tier, arc }

# Get accountability by task ID
GET /api/v1/accountability/:taskId

# Get accountability by slug
GET /api/v1/accountability/slug/:slug

# Record sign-off from a perspective
POST /api/v1/accountability/signoff
Body: { taskId, perspective, decision, signedBy, notes, confidence }

# List pending tasks
GET /api/v1/accountability/pending

# List blocked tasks
GET /api/v1/accountability/blocked

# Get AI mode statistics
GET /api/v1/accountability/modes/stats
```

### Cache Management (NEW)

```bash
# Get cache statistics
GET /api/v1/cache/stats

# Clear caches (broadcasts invalidation via WebSocket)
POST /api/v1/cache/clear
Body: { type: 'skills' | 'governance' | 'search' | 'all' }
```

### Indexing

```bash
# Reindex skills (broadcasts completion via WebSocket)
POST /api/v1/index/skills

# Reload governance index
POST /api/v1/index/governance
```

---

## WebSocket Events (NEW)

Connect to `ws://localhost:3001` for real-time governance updates.

### Event Types

```javascript
// Skill changes
{ type: 'skill:change', data: { skillId, change } }

// Governance changes
{ type: 'governance:change', data: { docName, change } }
{ type: 'governance:drift', data: { count, documents } }

// Task changes
{ type: 'task:change', data: { taskId, change } }

// Accountability events
{ type: 'accountability:signoff', data: { taskId, perspective, decision, canProceed } }
{ type: 'accountability:blocked', data: { taskId, blockedBy, reason } }
{ type: 'accountability:unblocked', data: { taskId } }

// AI mode changes
{ type: 'ai:mode:change', data: { taskId, from, to, reason } }

// Test execution events
{ type: 'test:layer:complete', data: { taskId, layer, passed, failed, duration } }

// Index events
{ type: 'index:complete', data: { indexType, indexed, duration } }

// Cache events
{ type: 'cache:invalidate', data: { cacheType, count, keys } }
```

### Example WebSocket Client

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected to AMYGA governance stream');
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log(`[${event.type}]`, event.data);

  // Handle accountability sign-offs
  if (event.type === 'accountability:signoff') {
    const { taskId, perspective, decision } = event.data;
    updateDashboard(taskId, perspective, decision);
  }

  // Handle governance drift
  if (event.type === 'governance:drift') {
    alertDrift(event.data.documents);
  }
});
```

---

## Four-Perspective Accountability System

### Perspectives

1. **Product** - Business value and user impact
2. **Dev** - Technical implementation and feasibility
3. **QA** - Quality and testing coverage
4. **AI Agent** - Automated analysis with confidence scores

### Sign-Off States

- `pending` - Awaiting review
- `approved` - Approved to proceed
- `deferred` - Deferred for later review
- `vetoed` - Blocks progress (any perspective can veto)

### AI Participation Modes

| Mode | When Used | Requirements |
|------|-----------|--------------|
| **Delegated** | Low risk, low complexity | AI approval only |
| **Collaborative** | Medium risk | AI + ≥1 human perspective |
| **Consultative** | High risk | All perspectives must approve |

Automatic escalation based on:
- Risk score (0-100)
- Perspective disagreements
- Task complexity assessment

### Example Workflow

```bash
# 1. Create accountability record
curl -X POST http://localhost:3000/api/v1/accountability/create \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "user-auth-flow",
    "tier": "critical",
    "arc": "security"
  }'

# Response includes recommended AI mode based on complexity
# {
#   "accountability": { ... },
#   "complexityAssessment": {
#     "complexity": "high",
#     "factors": ["Critical tier", "Security arc"],
#     "estimatedEffort": 18,
#     "uncertainty": 80,
#     "recommendedMode": "consultative"
#   }
# }

# 2. Record sign-offs from each perspective
curl -X POST http://localhost:3000/api/v1/accountability/signoff \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "user-auth-flow-1234567890",
    "perspective": "product",
    "decision": "approved",
    "signedBy": "pm@example.com",
    "notes": "Validates user requirements"
  }'

# 3. Check if task can proceed
curl http://localhost:3000/api/v1/accountability/user-auth-flow-1234567890

# 4. Monitor real-time events via WebSocket
# Events: accountability:signoff, accountability:blocked, ai:mode:change
```

---

## Architecture (v0.2)

```
┌─────────────────────────────────────────────┐
│      YOUR EXISTING FRAMEWORK                 │
│  .claude/skills/                             │
│  brainwav/governance/                        │
│  tasks/                                     │
└─────────────────────────────────────────────┘
           ↓               ↓
    [File Watchers]   [Adapters Read]
           ↓               ↓
┌─────────────────────────────────────────────┐
│         BACKEND ACCELERATION LAYER v0.2      │
│  • SkillAdapter (indexes .claude/skills/)    │
│  • GovernanceAdapter (indexes index.json)   │
│  • AccountabilityAdapter (4-perspective)    │
│  • SQLite (O(log n) lookups)                │
│  • LRU Cache (hot data, TTL)                │
│  • File WatcherService (auto-reindex)       │
│  • AIModeStateMachine (adaptive AI)          │
│  • WebSocketService (real-time streaming)    │
└─────────────────────────────────────────────┘
           ↓               ↓
    [REST API :3000]  [WebSocket :3001]
           ↓               ↓
┌─────────────────────────────────────────────┐
│          CLIENTS & DASHBOARD                 │
│  CLI tools, Web UI, Monitoring systems      │
└─────────────────────────────────────────────┘
```

---

## Performance

> **Note**: Benchmarks are based on local testing with a typical governance framework (50+ skills, 20+ governance documents). Your results may vary based on hardware, dataset size, and system load.

| Operation | Without Backend | With Backend (v0.2) | Improvement |
|-----------|-----------------|---------------------|-------------|
| Find skill by trigger | ~50ms (glob) | ~1ms (indexed + cached) | **50x** |
| Validate governance | ~200ms (files) | ~2ms (cached) | **100x** |
| Search skills | ~500ms (scan) | ~5ms (FTS + cache) | **100x** |
| Accountability check | N/A | ~1ms (indexed) | **∞** (new) |
| Real-time event | N/A | <1ms (WebSocket) | **∞** (new) |

### Cache Statistics

```bash
curl http://localhost:3000/api/v1/cache/stats
```

Response:
```json
{
  "data": {
    "skills": {
      "hits": 850,
      "misses": 120,
      "hitRate": 0.876,
      "currentItems": 45,
      "currentSize": 2048000
    },
    "governance": { ... },
    "search": {
      "entries": 25,
      "maxEntries": 500,
      "ttl": 300000
    }
  }
}
```

---

## Development

### Project Structure

```
backend/
├── src/
│   ├── adapters/
│   │   ├── SkillAdapter.ts           # Skills indexer
│   │   ├── GovernanceAdapter.ts      # Governance validator
│   │   └── TaskAccountabilityAdapter.ts  # 4-perspective tracking
│   ├── cache/
│   │   ├── LRUCache.ts               # LRU cache implementation
│   │   └── CacheManager.ts           # Centralized cache management
│   ├── services/
│   │   ├── FileWatcherService.ts     # Auto-reindex on file changes
│   │   ├── AIModeStateMachine.ts     # AI mode transitions
│   │   └── WebSocketService.ts       # Real-time event streaming
│   ├── db/
│   │   ├── schema.sql                # Database schema
│   │   ├── client.ts                 # Database client
│   │   └── migrate.ts                # Migration script
│   ├── types/
│   │   └── index.ts                  # Type definitions
│   └── server.ts                     # Express + WebSocket server
├── data/
│   └── governance.db                 # SQLite database (created)
├── package.json
└── tsconfig.json
```

### Environment Variables

```bash
# Server configuration
PORT=3000                              # REST API port
WEBSOCKET_PORT=3001                     # WebSocket port

# Feature flags
ENABLE_FILE_WATCHER=true                # Enable auto-reindex

# Cache configuration
SKILLS_CACHE_SIZE=100                   # Max skills in cache (default: 100)
SKILLS_CACHE_BYTES=10485760             # Max bytes for skills cache (default: 10MB)
GOVERNANCE_CACHE_SIZE=50                # Max governance docs (default: 50)
GOVERNANCE_CACHE_BYTES=5242880          # Max bytes for governance cache (default: 5MB)
SEARCH_CACHE_TTL=300000                 # Search result TTL in milliseconds (default: 5 minutes)
```

---

## Troubleshooting

### Database Locked Error

```bash
# Remove write-ahead log file
rm backend/data/governance.db-wal
```

### Skills Not Found

```bash
# Make sure you've indexed them
curl -X POST http://localhost:3000/api/v1/index/skills
```

### Cache Not Working

```bash
# Check cache statistics
curl http://localhost:3000/api/v1/cache/stats

# Clear cache if needed
curl -X POST http://localhost:3000/api/v1/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'
```

### WebSocket Not Connecting

```bash
# Check health endpoint for WebSocket status
curl http://localhost:3000/health

# Should include:
# {
#   "websocket": { "enabled": true, "port": 3001, "clients": N }
# }
```

### Governance Drift Detected

This means a file in `brainwav/governance/` has been modified and no longer matches the hash in `governance-index.json`.

To fix:
1. Review the changes
2. Update `governance-index.json` with new hashes
3. Run: `pnpm governance:sync-hashes`

---

## Comparison with MCAF

| Aspect | AMYGA Backend v0.2 | MCAF |
|--------|-------------------|-----|
| **Access Method** | REST + WebSocket | File-based only |
| **Performance** | O(log n) indexed | O(n) file scan |
| **Real-time Updates** | ✅ WebSocket streaming | ❌ None |
| **Accountability** | ✅ 4-perspective | ❌ None |
| **AI Modes** | ✅ 3 adaptive modes | ❌ None |
| **Auto-refresh** | ✅ File watchers | ❌ Manual |
| **Caching** | ✅ LRU + TTL | ⚠️ Basic |
| **Hash Validation** | ✅ Instant | ✅ Yes |
| **Dashboard Support** | ✅ Native | ❌ Requires build |
| **Progressive Disclosure** | ✅ Advanced | ✅ Basic |

**Key Advantages:**
1. **Real-time governance dashboard** - MCAF has no streaming capability
2. **Multi-stakeholder accountability** - MCAF lacks sign-off workflows
3. **Adaptive AI participation** - MCAF has no mode management
4. **Auto-reindex** - MCAF requires manual refresh

---

## License

Apache-2.0 (same as main AMYGA project)

---

<img
  src="./brand/brand-mark.webp"
  srcset="./brand/brand-mark.webp 1x, ./brand/brand-mark@2x.webp 2x"
  alt="brAInwav"
  height="28"
  align="left"
/>

<br clear="left" />

**brAInwav**
_from demo to duty_
