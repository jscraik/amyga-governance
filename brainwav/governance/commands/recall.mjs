#!/usr/bin/env node
// brainwav/governance/commands/recall.mjs
// Memory recall with semantic search and provenance
// Full spec: brainwav/governance/commands/recall.md

import fs from 'node:fs';
import path from 'node:path';

const query = process.env.RECALL_QUERY ?? process.argv[2];
if (!query) {
	console.error('[brAInwav] Missing query. Pass via RECALL_QUERY env or argv.');
	console.error('Usage: node recall.mjs "query string" [--limit=5] [--domain=governance]');
	process.exitCode = 1;
	process.exit();
}

// Parse optional flags
const args = process.argv.slice(3);
const limit = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '5', 10);
const domain = args.find((a) => a.startsWith('--domain='))?.split('=')[1] ?? 'governance';
const outputJson = args.includes('--json');

const homeDir = process.env.HOME ?? process.env.USERPROFILE;
if (!homeDir) {
	console.error('[brAInwav] Unable to resolve HOME directory.');
	process.exitCode = 1;
	process.exit();
}

const govHome = process.env.GOV_HOME ?? path.join(homeDir, '.agentic-governance');

// Output directory (task-aware if TASK_SLUG provided)
const slug = process.env.TASK_SLUG;
let outDir;
if (slug) {
	const taskDir = path.join(govHome, 'tasks', slug);
	outDir = path.join(taskDir, 'logs', 'recall');
} else {
	outDir = path.join(govHome, 'logs', 'recall');
}
fs.mkdirSync(outDir, { recursive: true });

// Memory API configuration
const MEMORY_API_BASE = process.env.LOCAL_MEMORY_BASE_URL || 'http://localhost:3002/api/v1';
const MEMORY_API_KEY = process.env.LOCAL_MEMORY_API_KEY;

function now() {
	return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

function generateAccessLogId() {
	return `access-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function searchMemories(searchQuery, searchLimit, searchDomain) {
	const searchParams = new URLSearchParams({
		query: searchQuery,
		limit: searchLimit.toString(),
		domain: searchDomain,
	});

	const response = await fetch(`${MEMORY_API_BASE}/memories/search?${searchParams}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			...(MEMORY_API_KEY ? { Authorization: `Bearer ${MEMORY_API_KEY}` } : {}),
		},
	});

	if (!response.ok) {
		throw new Error(`Memory search failed: ${response.status} ${response.statusText}`);
	}

	return await response.json();
}

async function getMemoryById(memoryId) {
	const response = await fetch(`${MEMORY_API_BASE}/memories/${memoryId}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			...(MEMORY_API_KEY ? { Authorization: `Bearer ${MEMORY_API_KEY}` } : {}),
		},
	});

	if (!response.ok) {
		throw new Error(`Memory fetch failed: ${response.status} ${response.statusText}`);
	}

	return await response.json();
}

function isUUID(str) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function isTag(str) {
	return /^[a-z][a-z0-9_]*$/.test(str) && str.length <= 64;
}

function formatMemoryMarkdown(memory, rank, similarity) {
	const createdAt = memory.created_at ?? memory.createdAt ?? 'unknown';
	const updatedAt = memory.updated_at ?? memory.updatedAt ?? createdAt;
	const isStale = createdAt !== 'unknown' && Date.now() - new Date(createdAt).getTime() > 180 * 24 * 60 * 60 * 1000;

	return `
### Memory ${rank}: ${memory.id}

**Created:** ${createdAt}  
**Updated:** ${updatedAt}  
**Similarity:** ${(similarity * 100).toFixed(1)}%  
${isStale ? '⚠️ **Stale Notice:** This memory is over 180 days old. Verify currency before use.\n' : ''}
**Content:**
${memory.content ?? memory.text ?? '[No content]'}

**Tags:** ${(memory.tags ?? []).join(', ') || 'none'}
`;
}

async function main() {
	const accessLogId = generateAccessLogId();
	const timestamp = now();

	console.log(`[brAInwav] recall — querying: "${query}" (limit=${limit}, domain=${domain})`);

	let retrieval;
	let memories = [];

	try {
		// Determine query type
		if (isUUID(query)) {
			// Direct UUID lookup
			console.log('[brAInwav] Detected UUID — performing direct lookup');
			const result = await getMemoryById(query);
			memories = result.data ? [{ ...result.data, similarity: 1.0 }] : [];
		} else {
			// Semantic search (tag or natural language)
			const searchType = isTag(query) ? 'tag' : 'natural language';
			console.log(`[brAInwav] Detected ${searchType} — performing semantic search`);
			const result = await searchMemories(query, limit, domain);
			memories = (result.data ?? result.memories ?? []).map((m, i) => ({
				...m,
				similarity: m.similarity ?? m.score ?? 1 - i * 0.05,
			}));
		}

		// Build retrieval metadata
		const topSimilarity = memories[0]?.similarity ?? 0;
		let status;
		let heading;

		if (memories.length === 0) {
			status = 'not_found';
			heading = 'Memory Not Found';
		} else if (topSimilarity >= 0.9) {
			status = 'recalled';
			heading = 'Memory Recalled';
			memories = memories.slice(0, 1); // Single best match
		} else if (topSimilarity >= 0.75) {
			status = 'multiple_found';
			heading = 'Multiple Memories Found';
			memories = memories.slice(0, 7); // Top 7
		} else {
			status = 'low_confidence';
			heading = 'Memory Not Found';
			memories = memories.slice(0, 3); // Suggestions only
		}

		retrieval = {
			status,
			context_restored_from: isUUID(query) ? 'uuid' : isTag(query) ? 'tag' : 'natural_language',
			query,
			memory_count: memories.length,
			top_similarity: topSimilarity,
			timestamp,
			provenance: {
				query,
				search_params: {
					limit,
					domain,
					min_similarity: 0.75,
				},
				pipeline: ['semantic_search'],
			},
			governance: {
				data_classification: 'internal',
				redactions_applied: [],
				purpose_of_access: 'engineering_evidence',
				access_log_id: accessLogId,
			},
		};

		// Format output
		let output;
		if (outputJson) {
			output = JSON.stringify({ retrieval, memories }, null, 2);
		} else {
			output = `## ${heading}

**Retrieval Information (JSON)**

\`\`\`json
${JSON.stringify(retrieval, null, 2)}
\`\`\`

${
	memories.length > 0
		? memories.map((m, i) => formatMemoryMarkdown(m, i + 1, m.similarity)).join('\n---\n')
		: `No memories matched query: "${query}"

**Suggestions:**
- Try broader search terms
- Check spelling and tag formats
- Use \`--domain=all\` to search across domains
`
}

---

**VerificationSummary**
- Query: \`${query}\`
- Status: ${status}
- Memories found: ${memories.length}
- Top similarity: ${(topSimilarity * 100).toFixed(1)}%
- Access log: ${accessLogId}
`;
		}

		console.log(output);

		// Write log
		const logFile = path.join(outDir, `recall-${timestamp.replace(/[:.]/g, '-')}.json`);
		fs.writeFileSync(logFile, JSON.stringify({ retrieval, memories, output_path: logFile }, null, 2));
		console.log(`[brAInwav] recall log written: ${logFile}`);

		return { retrieval, memories };
	} catch (error) {
		console.error(`[brAInwav] recall error: ${error.message}`);

		retrieval = {
			status: 'error',
			error: error.message,
			query,
			timestamp,
			governance: {
				access_log_id: accessLogId,
			},
		};

		const errorOutput = `## Memory Retrieval Failed

**Error:** ${error.message}

**Retrieval Information (JSON)**

\`\`\`json
${JSON.stringify(retrieval, null, 2)}
\`\`\`

**Troubleshooting:**
- Verify Local Memory MCP is running on port 3002
- Check LOCAL_MEMORY_BASE_URL environment variable
- Ensure API key is set if required (LOCAL_MEMORY_API_KEY)
`;

		console.log(errorOutput);

		const logFile = path.join(outDir, `recall-error-${timestamp.replace(/[:.]/g, '-')}.json`);
		fs.writeFileSync(logFile, JSON.stringify({ retrieval, error: error.message }, null, 2));

		process.exitCode = 1;
	}
}

main();
