# Repo Prompt Documentation

> **At a glance:** Install the Repo Prompt app (macOS/Windows), enable MCP, and point it at your repo. Core flows: context building, plan preset, Pro Edit/MCP Pair for implementation, and selection management. Use the TOC to jump; this file is long.

*Complete documentation for Repo Prompt - AI-powered code context management for macOS*

---

## Table of Contents

- **Overview**
  - Introduction
  - vs AI Editors
- **Getting Started**
  - Installation
  - Interface Overview
  - First Prompt
- **Building Context**
  - Overview
  - File Selection
  - Codemaps
  - Token Management
  - Presets & Prompts
- **Workflows**
  - Context Over Convenience
  - Discovery (Context Builder)
  - Architectural Planning
  - XML Pro Edit
  - Pair Programming
  - Model Recommendations
- **AI Providers**
  - API Providers
  - CLI Providers
  - OpenRouter
  - Custom Providers
- **MCP Server**
  - Overview
  - Setup Guide
  - Tools Reference
  - Transport Modes
  - Settings & Presets
  - Connection Management
- **Reference**
  - Settings Reference
  - Keyboard Shortcuts
  - Free vs Pro
- **Changelog**
  - Version 1.5
  - Version 1.4
  - Version 1.3
  - Version 1.2
  - Version 1.1
  - Version 1.0

---


# Overview

What Repo Prompt is, key value props, and how it compares to AI editors.


## Introduction

Repo Prompt helps you build **token-efficient, contextually-rich prompts** that give AI models the deep understanding they need to write better code.
**Talk to These Docs**
Copy all documentation as Markdown for any AI chatbot
Copy All Docs
### The Problem

AI coding assistants are only as good as the context you give them. Too little context and they hallucinate. Too much and you waste tokens on irrelevant code. Most developers either:

- Manually copy-paste files, losing time and missing dependencies
- Let agents explore blindly, burning tokens on discovery
- Pay expensive API costs for every interaction

### The Solution

Repo Prompt gives you precise control over context with three powerful capabilities:

#### 1. Token-Efficient Context Building

Choose exactly how much context each file contributes:

- **Full Content:** Complete file for files you&#x27;re actively editing
- **Slices:** Specific line ranges for targeted context
- **Codemaps:** Just function signatures - 10x token savings for reference files

#### 2. Use Your Existing AI Subscriptions

Already paying for Claude MAX, ChatGPT Plus, or Google AI? Use those same models in Repo Prompt with **CLI Providers** - no additional API costs.

#### 3. MCP Server for Agent Integration

Turn Repo Prompt into an intelligent backend for Claude Code, Cursor, or any MCP-compatible tool. Agents can select files, read code structure, and apply edits through standardized tools.

### Key Features
[**Codemaps**
Extract function/type signatures via tree-sitter. Include 10x more files in your context window while using a fraction of the tokens.
](/docs#s=building-context&ss=codemaps)[**Multi-Root Workspaces**
Analyze monorepos, microservices, and related projects in a single context. All features work seamlessly across roots.
](/docs#s=building-context&ss=file-selection)[**Context Builder**
AI agent that explores your codebase and intelligently selects relevant files with codemaps and line slices.
](/docs#s=building-context&ss=context-builder)[**CLI Providers**
Use your existing Claude MAX, ChatGPT Plus, or Google AI subscriptions. No additional API costs.
](/docs#s=ai-providers&ss=cli-providers)[**MCP Server**
Turn Repo Prompt into an IDE for agents. Claude Code, Cursor, and other tools can control file selection and apply edits.
](/docs#s=mcp-server&ss=mcp-overview)[**XML Edit & Pro Edit**
Apply AI responses as multi-file diffs. Paste XML from web chats or use delegate agents for parallel editing.
](/docs#s=workflows&ss=xml-edit)
### Free vs Pro

| Feature | Free | Pro | 
| Token Limit | 32K | Unlimited | 
| File Selection & Workspaces | ✓ | ✓ | 
| Own API Keys | ✓ | ✓ | 
| CLI Providers | ✓ | ✓ | 
| Codemaps | — | ✓ | 
| MCP Server | — | ✓ | 
| Context Builder | — | ✓ | 
| Custom API Providers | — | ✓ | 

[See full comparison →](/docs#s=reference&ss=free-vs-pro)

### Who Is Repo Prompt For?

- **Developers using AI for coding** who want better results from ChatGPT, Claude, or other AI assistants
- **Teams with large codebases** that need to provide focused context without overwhelming token limits
- **Power users of AI agents** who want to use Claude Code or Cursor with enhanced context capabilities
- **Anyone analyzing code or documents** - Repo Prompt works for any file-based analysis, not just programming

### Two Main Workflows

#### Compose Mode

Build context and copy it to external AI services like ChatGPT, Claude.ai, or any AI chat. Perfect for:

- Using powerful reasoning models (GPT-5.1 Pro, o3, Gemini 2.5 Pro) on their native platforms
- Pro Edit format: paste AI&#x27;s XML response back, Repo Prompt applies the changes
- Getting deep reasoning from models with your full codebase context

#### Chat Mode

Integrated AI conversations directly in Repo Prompt with professional diff editing:

- Use your own API keys or CLI Providers (use existing subscriptions)
- Pro Edit handles XML internally - you just see clean diffs
- Delegate agents: parallel file editing in sandboxes, one agent per file
- Multi-model workflows routing edits by complexity

### Get Started

Ready to build better AI prompts? Here&#x27;s where to go next:

- **New to Repo Prompt?** Start with the Getting Started guide
- **Have an AI subscription?** Set up CLI Providers to use your existing plan
- **Using Claude Code or Cursor?** Check out MCP Server Integration
- **Want smarter file selection?** Learn about the Context Builder

### Learn More
[
Repo Prompt 101

Video walkthroughs of key features and workflows
](https://youtube.com/playlist?list=PLFg9suyZ1OnLh3Tv5bP6jvWXcKKTlI_4m)[
Rate Limited Podcast

AI coding workflows with Eric, Ray Fernando, Adam Larson
](https://www.youtube.com/@ratelimitedpod)**Quick Win:** Download Repo Prompt, open a project, select a few files, and copy your first prompt. You&#x27;ll immediately see how much cleaner the context is compared to manual copy-paste.



## vs AI Editors

Repo Prompt is designed to complement and enhance AI-powered development tools like Cursor, Claude Code, and Windsurf rather than replace them. Through its MCP (Model Context Protocol) Server integration, Repo Prompt becomes a sophisticated backend that supercharges these tools with capabilities they can&#x27;t provide on their own.

### Repo Prompt + Cursor/Claude Code: Better Together

When you connect Repo Prompt to Cursor or Claude Code via MCP, you get the best of both worlds:

- **Your Favorite Editor + Repo Prompt&#x27;s Intelligence:** Keep using Cursor or Claude Code while leveraging Repo Prompt&#x27;s advanced context building through 14 specialized MCP tools
- **Multi-Repository Mastery:** Repo Prompt can analyze and search across multiple repositories in a single workspace
- **Token-Efficient Context:** Use codemaps and slices to include 10x more files without blowing your token budget
- **AI-Powered Discovery:** Use the Context Builder to intelligently select relevant files across your entire project ecosystem
- **Specialized Backend:** Repo Prompt acts as a context server that any MCP-compatible editor can leverage

### MCP Server: The Technical Bridge

Repo Prompt&#x27;s MCP Server provides a standardized way for external editors to access sophisticated capabilities:

- **14 Specialized Tools:** File operations, search, code structure, context management, chat, and discovery
- **Selection Modes:** Full content, slices (line ranges), or codemap-only for token efficiency
- **Secure Architecture:** User-approved connections with granular tool access control
- **One-Click Setup:** Automated Cursor installation, manual setup for other editors

### Unique Capabilities Repo Prompt Brings

#### Cross-Repository Intelligence

Repo Prompt excels at managing complex projects spanning multiple Git repositories. While Cursor and Claude Code work within single project boundaries, Repo Prompt can analyze dependencies, shared libraries, and related codebases as unified context. This intelligence is accessible through MCP tools like `file_search`, `get_file_tree`, and `get_code_structure`.

#### Token-Efficient Context with Codemaps

Through `manage_selection`, agents can add files with different modes:

- **full:** Complete file content for files being edited
- **slices:** Specific line ranges for targeted context
- **codemap_only:** Just function/type signatures - include 10x more reference files

This means agents get broader understanding without wasting tokens on full file content they don&#x27;t need.

#### AI-Powered Context Discovery

The `discover_context` tool lets agents delegate file selection to Repo Prompt&#x27;s Context Builder. It uses tree-sitter parsing and parallel processing to understand code relationships at a deeper level, automatically selecting files relevant to your task.

#### Optimized for Large Reasoning Models

Repo Prompt&#x27;s Chat Mode is ideal for **[large reasoning models](#s=workflows&ss=model-recommendations)**. Pro Mode makes these powerful models cost-effective through:

- **Upfront Context:** No waiting for discovery during expensive model calls
- **Intelligent Routing:** Simple edits use ultra-cheap models (Gemini Flash 2.0), complex ones use specialized models
- **Multi-Turn Excellence:** Extended conversations with reasoning model continuity across file modifications

#### MCP Tool Categories

- **Selection & Context:** `manage_selection`, `workspace_context`, `prompt`, `discover_context`
- **File Operations:** `get_file_tree`, `file_search`, `read_file`, `get_code_structure`, `file_actions`, `apply_edits`
- **Chat & Models:** `chat_send`, `chats`, `list_models`
- **Workspaces:** `manage_workspaces`

### Complementary Strengths
**Example Workflow:** Planning a microservices refactor. Use Repo Prompt&#x27;s MCP tools in Claude Code to search across repositories, analyze code structures with codemaps, and use `chat_send mode="plan"` for architectural guidance. Then apply changes with `apply_edits` and review in Repo Prompt&#x27;s diff view.
### Philosophy: Enhancement, Not Replacement

Repo Prompt&#x27;s MCP approach differs fundamentally from trying to be "another IDE":

- **Transparency:** All system prompts are visible and customizable
- **Provider Freedom:** Bring your own API keys or use CLI Providers with existing subscriptions
- **Workflow Integration:** Works with your existing tools rather than forcing you to change
- **Specialized Focus:** Optimized specifically for prompt engineering, context management, and multi-repository analysis
- **Standard Protocols:** Uses MCP for interoperability rather than proprietary methods

### When to Use What

- **Use Cursor/Claude Code for:** Daily coding, AI completions, file editing - enhanced by Repo Prompt&#x27;s MCP tools
- **Use Repo Prompt Chat Mode for:** [Large reasoning model](#s=workflows&ss=model-recommendations) conversations, complex multi-file refactors, and cost-effective use of expensive models
- **Use Repo Prompt for:** Complex context building, multi-repository analysis, advanced prompt engineering
- **Use Both Together via MCP:** Maximum productivity with specialized tools working in harmony

**One-Click Integration:** Repo Prompt provides automated Cursor setup via deeplinks, and manual configuration support for other MCP-compatible editors. The integration takes minutes to set up.
The result is a development environment where each tool excels at what it does best, connected through standard protocols for seamless collaboration.



# Getting Started

Install Repo Prompt and build your first AI prompt in minutes.


## Installation

Repo Prompt is a native macOS application available for direct download from our website.

### Download

Get the latest version directly from Repo Prompt:
[Download for macOS](https://repoprompt.com/download)
### Installation

- Download the `.dmg` file from the link above
- Open the downloaded file
- Drag Repo Prompt to your Applications folder
- Eject the disk image
- Open Repo Prompt from Applications or Spotlight

### System Requirements

- **macOS 14.0 (Sonoma)** or later
- Apple Silicon (M1/M2/M3) or Intel Mac
- ~50MB disk space

### First Launch

- Open Repo Prompt from Applications or Spotlight
- Grant folder access when prompted (required to read your code)
- Open a workspace: **File → Open** or drag a folder onto the app

**Tip:** You can open Repo Prompt from Terminal with `open -a "Repo Prompt" /path/to/folder` or use the URL scheme `repoprompt://open?path=/path/to/folder`
### Updates

Repo Prompt checks for updates automatically. When an update is available, you&#x27;ll see a notification in the app. You can also manually check via **Settings → License & Updates**.

### Platform Availability

Repo Prompt is built natively with Swift and SwiftUI, which means it&#x27;s currently macOS-only. Multi-platform support is planned but not yet available.



## Interface Overview

Repo Prompt&#x27;s interface is designed around three main views: Compose, Chat, and Apply. Here&#x27;s how they work together.

### Main Views

#### Compose View

The primary workspace where you build context and craft prompts.

**Key elements:**

- **File Tree (left):** Browse and select files from your workspace
- **Selected Files Panel:** View and manage your current selection
- **Instructions Area:** Write your prompt/task description
- **Bottom Bar:** Copy presets, token count, Copy and Chat buttons

#### Chat View

Have AI conversations with your code context automatically included.

**Key elements:**

- **Message Thread:** Conversation history with AI responses
- **Input Bar:** Send messages, toggle Pro Edit mode
- **Model Selector:** Choose which AI model to use
- **Chat History Tabs:** Switch between conversation sessions

#### Apply View

Review and apply code changes from AI responses. Paste Pro Edit XML or use the built-in chat to generate changes.

**Key elements:**

- **Paste Area:** Paste AI responses containing code changes
- **Process Button:** Parse XML and send to chat for parallel edits

#### Review View

After processing, review each file&#x27;s changes before applying.

**Key elements:**

- **File Cards:** Each modified file shown with change preview
- **Diff View:** Line-by-line comparison of changes
- **Apply Controls:** Apply all, apply selected, or reject changes

### Navigation

#### Tab Bar

Switch between views using the tab bar at the top:

- **Compose tabs:** Multiple compose sessions (like browser tabs)
- **Chat:** Access the chat interface
- **Apply:** Review pending changes

#### Toolbar

Quick access to common actions:

- **Settings (gear icon):** Open preferences
- **New Tab:** Create a new compose tab
- **Search:** Find files in your workspace

### Compose View Details

#### File Selection Panel

The left sidebar shows your workspace files:

- **Click** a file to select it (adds to context)
- **Right-click** for options: Full, Slices, Codemap modes
- **Search** to filter files by name
- Files with `+` marker have codemaps available

#### Instructions Area

Where you write your prompt:

- **Prompt dropdown:** Access saved prompts
- **System prompt toggle:** Include/exclude system instructions
- **Edit mode toggle:** Enable Pro Edit XML format

#### Bottom Bar

The control center for your prompt:

- **Copy Preset dropdown:** Choose format (Standard, Pro Edit, Plan, etc.)
- **Token counter:** Shows current context size
- **Copy button:** Copy prompt to clipboard
- **New Chat button:** Send directly to Chat view

**Keyboard Shortcuts:** `⌘+C` to copy, `⌘+N` for new chat, `⌘+F` to search files, `⌘+,` for settings.



## First Prompt

Let&#x27;s build your first AI prompt with rich code context. This takes about 2 minutes.

### Step 1: Open Your Project

- Launch Repo Prompt
- Go to **File → Open** (or `⌘+O`)
- Select your project folder

Your workspace loads with the file tree on the left.

### Step 2: Select Files

Click files in the tree to add them to your context. Selected files appear in the Selected Files panel.

**Tips for good selection:**

- Select files you want the AI to understand or modify
- Include related files (imports, types, tests)
- Watch the token counter - stay within model limits

**Start small:** For your first prompt, select 2-3 related files. You can always add more context later.
### Step 3: Write Your Prompt

In the Instructions area, describe what you want:

```
Add input validation to the login form. Check that:
- Email is a valid format
- Password is at least 8 characters
- Show error messages below each field
```

Be specific about what you want. Good prompts include:

- The task or goal
- Any constraints or requirements
- Expected behavior or output

### Step 4: Copy and Use

#### Option A: Copy to External AI

- Click **Copy** (or `⌘+C`)
- Paste into ChatGPT, Claude.ai, or any AI
- Get your response
- If it contains code changes, paste back into Apply view

#### Option B: Use Built-in Chat

- Click **New AI Chat**
- Select your model and settings
- Send - your context is automatically included
- Review changes in the diff view

### Step 5: Apply Changes

When the AI suggests code changes:

- Review each file&#x27;s changes in the diff view
- Click **Apply All** or select specific files
- Changes are written to your files
- Use **Undo** if needed

### Watch It In Action
[
Rapid Iteration with Repo Prompt

See the complete prompt-building workflow in action
](https://www.youtube.com/watch?v=LSQBi0Vx3Y4)



# Building Context

Master file selection, codemaps, slices, and token-efficient context building.


## Overview

The key to good AI responses is giving the right context - not too much, not too little. Repo Prompt gives you precise control over what context your AI sees.
[
What is Repo Prompt for?

Overview of context building fundamentals
](https://youtu.be/ncY6cqOCd_Y)
### The Anatomy of a Repo Prompt

Every prompt you create in Repo Prompt is assembled from several components:

- **Your instructions:** What you want the AI to do
- **File tree:** Project structure for navigation context
- **Codemaps:** Structural summaries of your code
- **Selected files:** Full content of files you&#x27;re working with
- **Slices:** Specific line ranges from large files

[Try the interactive Prompt Anatomy demo →](/prompt-anatomy)

### Multi-Root Workspaces

Repo Prompt supports opening multiple root folders in a single workspace. All features work across roots:

- **Cross-project context:** Select files from your codebase and a third-party library to evaluate integration
- **Code + docs:** Work with your code and documentation site together to improve docs
- **Monorepos:** Navigate related packages, shared libraries, and services in one view
- **Context Builder:** Discovers relevant files across all roots automatically

Add roots via **File → Add Folder to Workspace** or drag folders onto the app.

### Context Building Workflow

There are two main approaches to building context:

#### Manual Selection

- Browse the file tree and click files to select them
- Use search to find specific files or content
- Adjust selection modes (Full, Codemap, Slices) per file
- Write your prompt and copy to AI

#### AI-Powered Discovery

- Open Context Builder and describe your task
- Let the AI agent explore and select relevant files
- Review and refine the selection
- Proceed to your chosen workflow

**Tip:** For complex tasks, start with Context Builder to discover files, then manually refine the selection before proceeding.



## File Selection

Every file can be included in one of three modes, giving you fine-grained control over token usage.

### Selection Modes

| Mode | What&#x27;s Included | Token Impact | Best For | 
| **Full** | Complete file content | Highest | Files you&#x27;re actively editing | 
| **Slices** | Specific line ranges | Medium | Large files where only part matters | 
| **Codemap** | Function/type signatures only | Lowest (~10x smaller) | Reference files, APIs, dependencies | 

### Switching Modes

- **Click** a file to select it (Full mode by default)
- **Right-click** for mode options: show as Full or Codemap ("Show as API only")
- Files marked with `+` in the tree have codemaps available

### Selected Files Panel

The selected files panel shows your current selection with token counts. Use the controls to manage your context:

- **Sort:** Order by Name (A-Z, Z-A) or Tokens (Low-High, High-Low)
- **Gear menu:** View Mode, Collapse All Folders, Clear All Line Slices, Clear File Selection
- **Per-file actions:** Right-click to switch modes or clear slices on individual files

### Using Slices

Slices let you include only specific line ranges from a file. Slices are created through MCP-connected agents:

- **Context Builder:** Automatically creates slices when curating context—it reads files and extracts only the relevant sections to fit your token budget
- **MCP Agents:** Any agent connected via MCP can use the `manage_selection` tool to create slices with specific line ranges and descriptions

When a file has slices, you&#x27;ll see the line range (e.g., "L1-107") and a scissors icon. You can clear slices via right-click or the gear menu&#x27;s "Clear All Line Slices" option.
**Slice Power:** Context Builder can turn a 2000-line file into a 50-line slice containing just the relevant function—massive token savings while preserving the context AI needs.
### File Tree Options

The file tree helps AI understand your project structure and navigate relationships between files.

| Option | What It Shows | Tokens | 
| **Auto** | Balanced tree, trimmed if needed | Low-Medium | 
| **Full** | Complete directory structure | Higher | 
| **Selected** | Only selected files and parents | Lowest | 
| **None** | No file tree | Zero | 

Files with available codemaps show a `+` marker in the tree. This helps AI know which files have structural information available.

### File Filtering

Repo Prompt respects your `.gitignore` files automatically. If files are missing from the tree, they may be filtered out. Access filter settings via the filter icon in the file tree toolbar.

**Filter options:**

- **Local ignore file:** Create workspace-specific ignore patterns via the UI
- **Global ignores:** Set patterns that apply to all workspaces
- **Negative patterns:** Use `!` prefix to counter gitignore patterns you need to override (e.g., `!dist/important.js`)

**Tip:** If a file you need isn&#x27;t showing up, check your gitignore patterns and use negative patterns to override them.
### Git Integration

Include diffs of changed files in your prompt. Access git controls via the "Git" button in the bottom bar.

**Git controls:**

- **Compare with:** Select which branch or tag to diff against (HEAD, main, etc.)
- **Include diff in prompt:** None, Selected files only, or All changed files
- **Pending changes:** View all modified files with line counts (+/-)
- **Select files:** Check files to include their diffs in context

Both Compose and Chat have separate git settings. The **Review** and **Diff Follow-up** presets auto-configure this to include diffs for selected files.
**Tip:** Use git diffs to give AI context about recent changes when debugging issues or continuing work on a feature.



## Codemaps

Codemaps extract the "shape" of your code - function signatures, class definitions, type declarations - without implementation details. This gives AI structural understanding at 10x fewer tokens.

### What Codemaps Include

- Function and method signatures (names, parameters, return types)
- Class and struct definitions
- Type aliases and interfaces
- Protocol/interface declarations
- Important constants and enums

### Supported Languages

Codemaps are powered by tree-sitter and support:

Swift, JavaScript, TypeScript, Python, C, C++, C#, Rust, Go, Java, Dart, PHP

### Codemap Modes

| Mode | Behavior | When to Use | 
| **None** | No codemaps included | When you don&#x27;t need structural context | 
| **Auto** (Default) | Intelligently selects relevant definitions | Most use cases - balanced and smart | 
| **Complete** | All definitions from scanned files | Architectural understanding, full API overview | 

### Auto-Codemap Management

When you select files in Full or Slices mode, Repo Prompt automatically adds codemaps for related files:

- Dependencies and imports get codemap context
- Related types and protocols are included
- You get structural context without manually selecting every file

Manual codemap operations (promote/demote) disable auto-management for that session.

### Using Codemaps Effectively

#### For Reference Files

When you need to reference APIs or types but don&#x27;t need to edit the file:

- Right-click the file in the tree
- Select "Show as API only"
- The file is included as a codemap (10x fewer tokens)

#### For Architecture Questions

To understand your codebase structure:

- Set Codemap mode to "Complete" in settings
- Don&#x27;t select any files in Full mode
- Get a bird&#x27;s-eye view of your entire codebase at minimal token cost

**Architecture Tip:** For architectural questions, try Complete codemaps with no full files selected. This gives AI a bird&#x27;s-eye view of your entire codebase structure at minimal token cost.
### Codemap Availability

Files with available codemaps show a `+` marker in the file tree. If a file doesn&#x27;t have this marker:

- The language may not be supported
- The file may be too small to benefit from a codemap
- The file type (config files, JSON, etc.) doesn&#x27;t have structural definitions



## Token Management

The token counter shows your current context size. Understanding token limits helps you build effective prompts without hitting model limits.

### Model Context Windows

| Model | Context Window | Notes | 
| GPT-5.1 | 272K tokens | API & Codex CLI. ChatGPT: 30k (Plus) / 60k (Pro) | 
| Claude 4.5 | 200K tokens | Claude Code & Desktop. 1M via API at higher rates | 
| Gemini 3.0 Preview | 200K tokens | Standard pricing. 1M+ at higher pricing tiers | 

**Effective vs Advertised:** Models have an advertised context window and an effective one. Most models perform well in the 64-128k token range, but going beyond that can degrade reasoning ability.
### Token Reduction Strategies

If you&#x27;re hitting token limits:

#### 1. Use Codemaps

Switch reference files from Full to Codemap mode. You get the API surface without implementation details—typically 10x fewer tokens.

#### 2. Use Slices

Let Context Builder create slices, or have MCP agents specify line ranges. Include only the relevant sections of large files.

#### 3. Be Selective

Remove files that aren&#x27;t essential for the task. Ask yourself: "Does the AI need to see this file to answer my question?"

#### 4. Simplify the Tree

Use "Selected" tree mode instead of "Full". The AI doesn&#x27;t always need to see your entire directory structure.

#### 5. Consider Model Choice

For massive contexts, Gemini&#x27;s 1M+ token window or Claude&#x27;s 1M API tier can help when you truly need everything.

### Reading the Token Counter

The token counter in Repo Prompt shows:

- **Total tokens:** Your complete prompt size
- **Breakdown:** Hover to see files, codemaps, tree, and prompt contributions
- **Per-file tokens:** Shown in the selected files panel

### Budgeting for Responses

Remember that the context window includes both your prompt *and* the model&#x27;s response. Leave room:

- **Planning tasks:** Leave 10-20k tokens for detailed plans
- **Code generation:** Leave tokens proportional to expected output
- **Conversations:** Budget for multiple turns

### Free Tier Limit

Free users are limited to 32K tokens per prompt. This is enough for many tasks, but Pro unlocks unlimited context for larger codebases and complex tasks.
**Pro Tip:** The default 60k token budget in Context Builder is calibrated for ChatGPT Pro&#x27;s web interface. Adjust the budget based on your target model and interface.



## Presets & Prompts

Presets save and restore your complete context configuration - file selection, prompt, and app settings - in one click.

### Copy Presets vs Chat Presets

Both copy and chat have their own preset dropdowns. Presets customize the system prompt, file tree inclusion, git diffs, and codemap settings.

Copy Presets

Chat Presets

### Manual Controls

Select "Manual" from either preset dropdown to configure each setting individually:

### What Presets Configure

- **System prompt:** Instructions that guide AI behavior
- **File tree:** Include project structure (Auto, Full, Selected, None)
- **Git diffs:** Include uncommitted changes
- **Codemaps:** Include API signatures for unselected files

### Built-in Presets

| Preset | Purpose | 
| **Standard** | Clean formatting for any AI (ChatGPT, Claude, etc.) | 
| **XML Edit** | XML format for structured changes - paste response back to apply | 
| **Plan** | Optimized for architectural planning and design discussions | 
| **Diff Follow-up** | Include diffs of changed files for review in ongoing chats | 

### MCP Copy Presets

When handing off to external agents (Claude Code, Codex), MCP presets prepare the agent:

| Preset | Purpose | 
| **MCP Pair** | Pair programming workflow—agent drives, chat implements | 
| **MCP Discover** | Same as Context Builder—agent explores and curates context | 
| **MCP Agent** | Primes agent on MCP tooling for autonomous work | 

### Creating Custom Presets

- Configure your selection, prompt, and settings
- Click the preset dropdown → "Save as Preset"
- Name your preset descriptively
- Access it anytime from the preset menu

### Preset Use Cases

- **Feature work:** Preset with relevant files for a specific feature
- **Code review:** Preset with review-focused prompt and diff settings
- **Debugging:** Preset with error handling code and logging utilities
- **Documentation:** Preset with doc-writing prompt and public APIs

### Stored Prompts

Stored prompts are reusable instruction snippets that power both presets and custom workflows. Access via the "Prompts" button in the bottom bar.

#### Built-in Prompt Categories

- **Architect/Engineer/Review:** Role-based prompts used by the Plan preset for architectural discussions
- **MCP Behavior Prompts:** Prime external agents for MCP Discover, Pair, and Agent workflows
- **XML Edit Prompts:** Control response format—Diff (minimal changes), Whole (full file), Pro (parallel edits). Used by Edit and Pro Edit modes in chat

#### Custom Prompts

Create your own stored prompts for frequently-used instructions:

- Click "New" in the stored prompts panel
- Write your instruction text
- Name it descriptively (e.g., "Code Review Guidelines")
- Click + to insert into your current prompt

**Tip:** Combine multiple stored prompts by clicking + on each one. Use stored prompts for reusable instructions and presets for complete workflow configurations.



# Workflows

Discovery, planning, and implementation workflows for different task complexities.


## Context Over Convenience

The key to getting great results from AI models isn&#x27;t convenience—it&#x27;s **context**. Repo Prompt&#x27;s workflow prioritizes giving models the full picture before they act. Read the full philosophy in our blog post: [Context Over Convenience](https://repoprompt.com/blog/context-over-convenience).

### The Repo Prompt Workflow

The diagram below shows how Repo Prompt structures complex coding tasks:
[](https://www.youtube.com/watch?v=qHl116OG2DM&list=PLFg9suyZ1OnLh3Tv5bP6jvWXcKKTlI_4m&index=4)
### Why Context Over Convenience?

Coding agents are convenient but fundamentally limited. When you prompt a coding agent, it must:

- Understand your problem from scratch
- Search through code using grep and other tools
- Read small slivers of files to get a cursory understanding
- Start making changes before fully understanding the codebase

This "agent orientation" phase fills the context window with:

- Tool call parameters and results
- Irrelevant code from broad searches
- System prompts and MCP tool definitions
- Failed attempts and backtracking

By the time the agent understands your problem, it has very likely exceeded the sweet spot of effective context and will solve your problem with degraded intelligence.
**Key Insight:** Models have an advertised context window and an effective one. Most models perform well in the 64-128k token range, but going beyond that degrades reasoning ability significantly.
### The Two-Step Approach

#### Step 1: Discovery

The Context Builder agent researches your codebase to understand what files relate to your task. It produces a "handoff prompt" that is:

- **Non-opinionated:** Facts only, no solution bias
- **Complete:** All relevant files and their relationships
- **Token-optimized:** Fits within your target budget (default 60k)
- **Well-documented:** Explains how files relate to each other and the task

#### Step 2: Plan and Implement
**Recommended Workflow:** For most tasks spanning more than 1-2 files, use **Architectural Planning** with Context Builder. This gives you a solid plan before implementation, leading to better results with fewer iterations.
| Path | When to Use | Best For | 
| **Architectural Planning** | 3+ files, any complexity | Features, refactors, most tasks | 
| **XML Pro Edit** | Complex logic, limited scope | Reasoning models focused on *what* to change | 
| **Pair Programming** | Very large, needs iteration | Major system changes | 

The workflow is simple: **Task → Context Builder → Plan → Implement → Review**. Get a plan first, then hand it off to your coding agent.

### Why Reasoning Models Need Full Context

Reasoning models like GPT-5 Pro work best when they **think first, then act**. When these models use tools mid-reasoning:

- They can&#x27;t fully utilize their reasoning budget
- Tool calls from chain-of-thought may come from one of many model strands, not the consensus
- Context gets filled with discovery instead of reasoning

By providing complete context upfront, reasoning models can spend their entire thinking budget on the solution—not on figuring out what files they need to read.

### MCP Copy Presets

When handing off to an external agent (Claude Code, Codex), the MCP copy presets prepare the agent to work effectively:

| Preset | Purpose | 
| **MCP Pair** | Pair programming workflow—agent drives, chat implements | 
| **MCP Discover** | Same as Context Builder—agent explores and curates context | 
| **MCP Agent** | Primes agent on MCP tooling for autonomous work | 

Each preset includes:

- **Codebase context:** Selected files, codemaps, and file tree to understand your code from the jump
- **Window/tab routing:** Information to help the agent find the correct Repo Prompt tab and window
- **Workflow instructions:** A system prompt that guides the agent through the specific workflow

### Your Role as Engineer

Even with powerful AI workflows, your input matters:

- **Plan features:** Decide what makes sense to work on
- **Scope correctly:** Break large tasks into manageable pieces
- **Review changes:** Validate each step of the process
- **Guide discovery:** Help the Context Builder understand your task

**Read More:** For the full philosophy behind this approach, read the [Context Over Convenience](/blog/context-over-convenience) blog post.



## Discovery (Context Builder)

The Context Builder is an AI agent that researches your codebase and selects relevant files for your task. It&#x27;s the foundation of every Repo Prompt workflow.
[
Context Builder 2.0

AI-powered context selection with CLI Providers
](https://youtu.be/qHl116OG2DM)
### How Context Builder Works

- **Task analysis:** You describe what you&#x27;re trying to accomplish
- **Codebase exploration:** The agent uses MCP tools to search and read your code
- **File selection:** Relevant files and codemaps are identified
- **Token optimization:** Selection is refined to fit your token budget
- **Handoff prompt:** A non-opinionated summary is generated

### The Handoff Prompt

The Context Builder produces a "handoff prompt" that contains:

- **Clarified instructions:** Your task, refined with specifics
- **Open questions:** Ambiguities you may want to address
- **File relationships:** How discovered files relate to each other
- **Selected context:** Files, slices, and codemaps

**Non-Opinionated Discovery:** The Context Builder is explicitly instructed to gather facts, not propose solutions. This prevents bias in the handoff prompt and ensures the implementing model gets complete, unbiased context.
### Token Budget

The Context Builder targets a specific token budget to ensure your prompt fits the effective context window of your target model:

| Target | Budget | Use Case | 
| ChatGPT Pro | 60k tokens (default) | Pasting into ChatGPT web (Pro plan) | 
| ChatGPT Plus | 30k tokens | Pasting into ChatGPT web (Plus plan) | 
| API / Codex CLI | 128-200k tokens | Direct API, Codex CLI, Claude Code | 
| Coding agents | 24-32k tokens | Kickstarting agent sessions with context | 

### File Slicing

One of Context Builder&#x27;s most powerful tools is file slicing. Instead of including entire files, it can extract only the relevant sections:

- Massive files become manageable
- Irrelevant code is excluded
- Token budget is used efficiently
- Slices include line numbers for easy reference

### CLI Provider Integration

Context Builder works best when connected to a CLI provider:

| Provider | Model Used | Subscription | 
| Claude Code | Claude Sonnet 4.5 | Anthropic MAX | 
| Codex CLI | GPT-5.1 | OpenAI Plus/Pro | 
| Gemini CLI | Gemini 2.5 | Google AI | 

### Running Context Builder

- Open your workspace in Repo Prompt
- Click **Context Builder** in the toolbar
- Describe your task clearly and specifically
- Wait for the agent to explore and select files
- Review the selection and handoff prompt
- Proceed to your chosen implementation path

### Tips for Better Results

- **Be specific:** "Add dark mode to the settings page" is better than "add dark mode"
- **Mention key files:** If you know relevant files, mention them in your task
- **Review the selection:** Remove irrelevant files, add missing ones
- **Check open questions:** Address any ambiguities in the handoff prompt
- **Adjust token budget:** Increase for complex tasks, decrease for agent handoffs



## Architectural Planning

For large changes that require design decisions, architectural planning with full context produces dramatically better results than agent-style plan modes.
[
Fitting Repo Prompt into Agent Workflows

Context Builder → Plan → Implementation → Review
](https://youtu.be/060MqOx-Ex0)
### Why Architectural Planning?

Many coding agents ship with "plan modes," but they have fundamental limitations:

- The model drafting the plan doesn&#x27;t have a bird&#x27;s eye view of the codebase
- Plans stem from incomplete information (reading only a few lines at a time)
- Discovery and planning phases are blended, wasting context on orientation
- Important relationships between classes may be missed

With Repo Prompt&#x27;s approach:

- Context Builder gathers all relevant files first (discovery phase)
- The planning model receives complete context upfront
- It can reason about the entire affected codebase at once
- Plans are thorough and architecturally sound

### The Workflow

- **Run Context Builder** with your task description
- **Review the selection:** Ensure all relevant files are included
- **Switch to Plan preset:** Select the "Plan" copy preset
- **Copy and paste to GPT-5.1 Pro:** Use ChatGPT&#x27;s Pro plan for best results
- **Get your architectural plan:** GPT-5.1 Pro excels at breaking down architectures
- **Refine if needed:** Ask follow-up questions in the same chat
- **Implement:** Paste the plan into your favorite coding agent (Claude Code, Codex, Cursor, etc.)

### Why GPT-5.1 Pro?

GPT-5.1 Pro has exceptional abilities for architectural planning:

- **Extended reasoning:** Can think for many minutes on complex problems
- **Thorough analysis:** Considers edge cases and implications
- **Large context:** Can process your entire relevant codebase
- **Clear structure:** Produces well-organized, actionable plans

**Token Budget:** The default 60k token budget is calibrated for GPT-5.1 Pro on ChatGPT&#x27;s Pro plan. This is the upper limit before hitting errors when pasting into the web interface.
### What Good Plans Include

An effective architectural plan should cover:

#### 1. Clear Outcome Specification

- What the final product should do after changes
- Success criteria and expected behavior
- Edge cases to handle

#### 2. Architectural Specification

- How new code should be structured
- Which parts of the codebase are affected
- What each component should do exactly
- Dependencies and relationships

#### 3. Implementation Steps

- Ordered list of changes to make
- Clear, verifiable sub-tasks
- Dependencies between steps

### Why PRDs Aren&#x27;t Enough

Many plan modes focus on PRDs (Product Requirements Documents). The problem:

- PRDs describe *what* but not *how*
- Implementation details are left to the implementing model
- Agent orientation problems return during implementation
- No guidance on code structure or file organization

Architectural plans solve this by specifying implementation details upfront, so the implementing model encounters minimal ambiguity.

### From Plan to Implementation

Once you have your architectural plan, paste it into your coding agent of choice:

- **Claude Code:** Paste the plan and let it implement step by step
- **Codex CLI:** Feed the plan as context for implementation
- **Cursor / Windsurf:** Use the plan to guide agentic edits
- **Repo Prompt Chat:** Use XML Pro Edit mode for direct implementation

The plan provides the architectural guidance that agents typically lack. Instead of discovering your codebase from scratch, the agent receives a complete implementation roadmap.

### Review the Implementation

After the agent implements your plan, review the changes with one of two approaches:

#### Option 1: Agent Self-Review

Prompt your coding agent to review its own work using Repo Prompt&#x27;s chat. Since Context Builder already selected the relevant files, the chat has all the context needed for a thorough review.

- Ask the agent to verify the implementation matches the plan
- Request it check for edge cases or missing error handling
- Have it suggest tests or improvements

#### Option 2: GPT-5.1 Pro Review (Recommended for ChatGPT users)

If you used ChatGPT for planning, use the **Diff Follow-up** copy preset to request a review:

- The preset includes your prompt plus diffs of all changed files
- GPT-5.1 Pro sees exactly what the agent did in response to the plan it proposed
- Efficiently conveys changes without resending the entire codebase
- The planning model can validate implementation against its own architectural recommendations

**Why Review Matters:** The planning model has deep context about your architecture. Having it review the implementation catches misunderstandings and ensures the changes align with the intended design.
### When to Use Architectural Planning

- **New features:** Significant additions to the codebase
- **Major refactors:** Restructuring existing code
- **System redesign:** Changing how components interact
- **Complex bugs:** Issues requiring architectural understanding
- **Performance optimization:** Changes affecting multiple systems

### Example Use Cases

- "Add a caching layer to our API endpoints"
- "Refactor the authentication system to support OAuth"
- "Implement real-time notifications across the app"
- "Migrate from REST to GraphQL"
- "Add comprehensive error handling throughout the codebase"

**Pro Tip:** After getting your plan from GPT-5.1 Pro, review it carefully. If something seems off, ask follow-up questions in the same chat. The model has full context and can refine its recommendations.



## XML Pro Edit

XML-based editing lets you make multi-file changes with full context. Two modes are available: **XML Edit** for rapid iteration and **Pro Edit** for complex changes with delegate agents.
[
Rapid Iteration with Repo Prompt

XML Edit workflow for fast multi-file changes
](https://youtu.be/LSQBi0Vx3Y4)
### XML Edit: Rapid Iteration

XML Edit is perfect for fast, iterative changes directly with the model. The workflow is simple:

- Select files and write your prompt
- Choose the **XML Edit** copy preset
- Paste into your AI (ChatGPT, Claude.ai, etc.)
- Copy the XML response back
- Paste into Repo Prompt&#x27;s **Apply** panel
- Review diffs and apply

This tight loop lets you iterate quickly—make a change, see results, refine, repeat. The model outputs structured XML that Repo Prompt parses into clean diffs.
**Best For:** Bug fixes, quick enhancements, iterating on code with immediate feedback. Works great with Claude Sonnet 4.5, GPT-4.1, and similar models that follow XML formatting well.
### Pro Edit: Delegate Agents

Pro Edit adds parallel execution with sandboxed delegate agents. Use it in Chat mode:

- Select files and start a chat with **Edit** mode
- Enable the **Pro** toggle
- Send your message
- The response is parsed into per-file tasks
- Each file gets a delegate agent in a sandbox
- Changes are applied in parallel and collected for review

Pro Edit is ideal when you want Repo Prompt to handle the XML parsing internally and apply changes through controlled agents.

### Why XML Formats Work

XML Pro Edit separates **what to change** from **how to edit files**. This is critical for deep reasoning models:

- The model receives complete file context upfront
- It focuses reasoning on the *logic* of the change, not file manipulation
- Delegate agents handle the mechanical file edits separately
- More reasoning can actually *interfere* with accurate file edits—XML Pro Edit avoids this

While file editing is second nature for Claude models, it&#x27;s much more challenging for deep reasoning models like o3 and GPT-5.1 Pro. XML Pro Edit lets these models shine at what they do best: complex reasoning about code.

### Best Models

| Model | Best For | 
| **Claude Sonnet 4.5** | Excellent XML formatting, fast iteration | 
| **GPT-4.1** | Reliable diff generation, good speed | 
| **GPT-5.1 Pro** | Deep reasoning for complex changes | 
| **Claude Opus 4.5** | Best instruction following | 

### When to Use

- **XML Edit:** Quick iterations, bug fixes, small features, direct model interaction
- **Pro Edit:** Larger changes, want automated parsing, prefer Chat mode workflow

### When NOT to Use

- Changes span too many files (10+)—consider Pair Programming
- You need architectural planning first
- The scope isn&#x27;t fully understood



## Pair Programming

For complex, multi-step changes, the Pair Programming workflow uses **two context windows** working together—and it does wonders.
[
Giving Composer-1 an Oracle

Better code with Repo Prompt MCP pair programming
](https://youtu.be/hdaOxCE-dbI)
### The Two-Context-Window Advantage

Traditional agents fill their context with tool calls, searches, and navigation. By splitting the work between two systems, each can focus on what it does best:

| Role | Tool | Focus | 
| **Driver Agent** | Claude Code, Codex | Manages context, breaks down tasks, reviews work | 
| **Chat Implementer** | Repo Prompt Chat | Sees full context clearly, writes all the code | 

The chat model is **not agentic**—it doesn&#x27;t navigate or search. Instead, it receives a curated selection of files and can reason deeply about the entire context at once. The driver agent handles all the coordination.

### The Core Loop

The driver agent runs a continuous cycle:

- **Plan:** Break the architectural plan into an achievable task
- **Curate:** Select the right files for this step (via MCP tools)
- **Implement:** Send the task to Repo Prompt Chat (`chat_send` with `mode:"edit"`)
- **Mend:** Review diffs, validate changes, fix any issues
- **Repeat:** Move to the next task until done

**Why This Works:** The chat gets fresh, relevant context for each step—no compaction, no lost details. The driver maintains the big picture while the chat handles deep implementation.
### Setting Up

- Run **Context Builder** to gather relevant files
- Get an **architectural plan** from GPT-5.1 Pro
- Select the **"MCP Pair"** copy preset
- Paste into your driver agent (Claude Code, Codex)
- The driver takes over and runs the Plan → Implement → Mend loop

### When to Use

- Changes span many files (10+)
- Implementation requires multiple phases
- The plan is too large for one context window
- You need iterative validation during implementation



## Model Recommendations

After extensive testing across workflows, here are the current go-to models for each use case as of November 2025. Repo Prompt includes an automatic model recommendation system that suggests optimal models based on your current workflow.

### Best Models by Use Case

| Use Case | Model | Access | 
| **Best Agent** | Claude Code + Opus 4.5 | Anthropic MAX | 
| **Best Planning Model** | GPT-5.1 Pro | ChatGPT Pro | 
| **Best In-App Planning/Review** | GPT-5.1 High | Codex CLI / API | 
| **Best Context Builder** | Codex + GPT-5.1-codex-max (medium) | OpenAI Plus/Pro | 

### Why These Models?

#### Claude Code + Opus 4.5 for Agentic Work

Opus 4.5 excels at:

- Following complex instructions precisely
- Understanding codebase relationships
- Producing clean, well-structured code
- Handling multi-step tool sequences

#### GPT-5.1 Pro for Architectural Planning

GPT-5.1 Pro is unmatched for planning because:

- Extended reasoning time produces thorough analysis
- Can reason about entire codebases at once
- Produces clear, actionable architectural specifications
- Catches edge cases and implications other models miss

#### GPT-5.1 High for In-App Work

For Chat mode planning and code review:

- Strong reasoning without Pro-level cost
- Fast enough for iterative workflows
- Excellent diff generation
- Available via Codex CLI or API

#### Codex + GPT-5.1-codex-max for Context Building

The Context Builder agent benefits from:

- Fast file exploration
- Good judgment on file relevance
- Efficient token budget management
- "Medium" reasoning effort is sufficient for discovery

### Recommended Subscriptions

#### Full Setup (Power Users)

| **Anthropic MAX** | $100/month | Claude Code CLI + Opus 4.5 | 
| **ChatGPT Pro** | $200/month | GPT-5.1 Pro for planning | 
| **Total** | **$300/month** | Best-in-class for every workflow | 

This combination gives you:

- Best-in-class agentic work (Opus 4.5 via Claude Code)
- Best-in-class planning (GPT-5.1 Pro via ChatGPT)
- No per-token API costs for heavy usage

#### Budget Setup (Great Results)

| **ChatGPT Plus** | $20/month | Codex CLI + GPT-5.1 High | 
| **Total** | **$20/month** | Context Builder + In-app chat | 

This gives you:

- Context Builder with GPT-5.1-codex-max
- In-app planning and editing with GPT-5.1 High
- Strong results for most tasks
- Skip GPT-5.1 Pro if High is sufficient for your needs

**Keep Evolving:** Model recommendations change as new releases come out. Check back regularly or follow @repoprompt on X for the latest recommendations.



# AI Providers

Configure API keys, CLI providers, OpenRouter, and custom endpoints.


## API Providers

Connect directly to AI providers using API keys. This gives you full control over model selection and usage.

### Supported Providers

Repo Prompt supports direct API connections to these providers:

| Provider | Models | Context | 
| **Anthropic** | Claude Opus 4.5, Sonnet 4.5, Haiku 3.5 | 200K | 
| **OpenAI** | GPT-5.1, GPT-5.1 Mini, o3, o3-mini | 128K | 
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash | 1M+ | 
| **DeepSeek** | DeepSeek V3, DeepSeek R1 | 128K | 
| **xAI** | Grok 4 | 128K | 
| **Groq** | Llama, Mixtral (fast inference) | Varies | 
| **Fireworks AI** | Qwen3, Kimi K2, DeepSeek | Up to 32K | 
| **Azure OpenAI** | Your Azure deployments | Varies | 

### Adding API Keys

- Open **Settings** (`⌘+,`)
- Go to **API Settings → API Providers**
- Find your provider and enter your API key
- Click **Validate & Save**
- A green checkmark confirms the key is valid

### Getting API Keys

#### Anthropic (Claude)

- Go to [console.anthropic.com](https://console.anthropic.com/settings/keys)
- Create an account or sign in
- Navigate to Settings → API Keys
- Create a new key and copy it

#### OpenAI (GPT)

- Go to [platform.openai.com](https://platform.openai.com/api-keys)
- Create an account or sign in
- Navigate to API Keys
- Create a new secret key and copy it

#### Google (Gemini)

- Go to [aistudio.google.com](https://aistudio.google.com)
- Sign in with your Google account
- Get your API key from the console

### Key Security

Your API keys are stored securely in the macOS Keychain - they never leave your machine and are encrypted at rest.

### Custom Models

For providers that support it, you can add custom model names:

- After validating your API key, look for the "Custom Model" field
- Enter the model identifier (e.g., `claude-3-5-sonnet-latest`)
- Click "Save Model"
- The model appears in your model selection dropdown

### GitHub Models (Free)

GitHub provides free access to select models with an 8K context limit:

- Go to Settings → API Providers
- Click "Sign in with GitHub"
- Authorize Repo Prompt
- GitHub models appear in your model list

**Note:** GitHub models are limited to 8K tokens context, which may be too small for many coding tasks. Consider using other providers for larger contexts.
### Local Models (Ollama)

Run models locally with Ollama:

- Install Ollama from [ollama.com](https://ollama.com)
- Pull a model: `ollama pull llama3.1`
- In Settings → API Providers, find "Local Model Settings"
- The default URL is `http://localhost:11434`
- Click "Validate" to fetch available models
- Select your model from the dropdown



## CLI Providers

**Use Your Existing Subscriptions:** CLI Providers let you use models through your Anthropic MAX, OpenAI Plus/Pro, or Google AI subscriptions instead of paying per-token API costs.
CLI Providers are one of Repo Prompt&#x27;s most powerful features. If you already pay for Claude MAX, ChatGPT Plus/Pro, or a Google AI subscription, you can use those same models in Repo Prompt without additional API costs.

### Why Use CLI Providers?

- **Save Money:** Use your existing subscription instead of paying per-token API fees
- **Latest Models:** Access the newest models through official CLI tools
- **No API Keys:** Authentication is handled by the CLI&#x27;s existing login
- **Full Features:** Works with Chat, Context Builder, and Pro Edit workflows

### Available CLI Providers

#### Claude Code (Anthropic MAX)

Use Claude models through your Anthropic MAX subscription.

- Install Claude Code: `npm install -g @anthropic-ai/claude-code`
- Login: `claude login`
- In Repo Prompt, go to Settings → CLI Providers
- Click "Connect" next to Claude Code
- Test the connection to verify it works

#### Codex CLI (OpenAI Plus/Pro)

Use OpenAI models through your ChatGPT Plus or Pro subscription.

- Install Codex: `npm install -g @openai/codex`
- Login: `codex login`
- In Repo Prompt, go to Settings → CLI Providers
- Click "Connect" next to Codex CLI
- Test the connection to verify it works

#### Gemini CLI (Google AI)

Use Gemini models through your Google AI subscription.

- Install Gemini CLI: `npm install -g @google/gemini-cli`
- Login: `gemini login`
- In Repo Prompt, go to Settings → CLI Providers
- Click "Connect" next to Gemini CLI
- Test the connection to verify it works

### Using CLI Providers

Once connected, CLI providers appear as model options throughout Repo Prompt:

- **Chat Mode:** Select CLI models from the model dropdown
- **Context Builder:** Use CLI providers for AI-powered file discovery
- **Pro Edit:** Route edits through CLI providers for cost-effective workflows

### Troubleshooting

#### Connection Failed

- **CLI not found:** Ensure the CLI tool is installed globally and available in your PATH
- **Not logged in:** Run the login command for the respective CLI tool
- **Subscription inactive:** Verify your subscription is active with the provider

#### Rate Limits

CLI providers are subject to the rate limits of your subscription plan. If you hit rate limits:

- Wait a few minutes before retrying
- Consider using API keys for higher-volume work
- Check your subscription tier&#x27;s limits with the provider

#### Update Required

If you see "update required" errors, update your CLI tool:

- Claude Code: `npm update -g @anthropic-ai/claude-code`
- Codex: `npm update -g @openai/codex`
- Gemini: `npm update -g @google/gemini-cli`

**Pro Tip:** CLI Providers are especially valuable with the Context Builder. Since context building can involve multiple AI calls, using your existing subscription can significantly reduce costs compared to API usage.



## OpenRouter

OpenRouter provides access to multiple AI providers through a single API. It&#x27;s a great way to try different models without managing multiple API keys.

### What is OpenRouter?

OpenRouter is a unified API that routes requests to various AI providers including:

- Anthropic (Claude models)
- OpenAI (GPT models)
- Google (Gemini models)
- Meta (Llama models)
- Mistral AI
- And many more...

### Setup

- Create an account at [openrouter.ai](https://openrouter.ai)
- Add credits to your account
- Go to Keys → Create Key
- Copy your API key
- In Repo Prompt: Settings → API Settings → OpenRouter
- Paste your key and click "Validate & Save"

### Available Models

Once connected, OpenRouter models appear in your model selector with an "openrouter/" prefix. Popular options include:

- `openrouter/anthropic/claude-sonnet-4.5`
- `openrouter/openai/gpt-5.1`
- `openrouter/google/gemini-3.0-preview`
- `openrouter/meta-llama/llama-3.1-70b`
- `openrouter/mistralai/mixtral-8x7b`

### Pricing

OpenRouter uses pay-per-token pricing that varies by model. Check [openrouter.ai/models](https://openrouter.ai/models) for current pricing.

### When to Use OpenRouter

- **Model variety:** Easy access to models from many providers
- **No commitment:** Try models without signing up for each provider
- **Cost comparison:** Compare pricing across providers
- **Fallback routing:** OpenRouter can route to alternatives if a model is unavailable

**Direct vs OpenRouter:** For your primary models, direct API keys often provide better performance and reliability. OpenRouter is great for exploration and accessing models you use occasionally.



## Custom Providers

**Pro Feature:** Custom API providers require a Repo Prompt Pro license.
Connect to any OpenAI-compatible API endpoint - perfect for self-hosted models, company internal APIs, or alternative providers.

### What&#x27;s Supported

Any API that follows the OpenAI API specification works, including:

- **Self-hosted models:** vLLM, text-generation-inference, LocalAI
- **Company APIs:** Internal model deployments
- **Alternative providers:** Services offering OpenAI-compatible endpoints
- **Proxies:** API gateways and load balancers

### Setup

- Open **Settings** (`⌘+,`)
- Go to **API Settings → Custom API**
Enter your configuration:
- **Base URL:** Your API endpoint (e.g., `https://your-api.company.com/v1`)
- **API Key:** Authentication key if required
- **Model Name:** The model identifier your API expects

- Click **Validate & Save**

### Configuration Examples

#### vLLM Server

```
Base URL: http://localhost:8000/v1
API Key: (leave empty for local)
Model: meta-llama/Llama-3.1-70B-Instruct
```

#### Text Generation Inference

```
Base URL: http://localhost:8080/v1
API Key: (leave empty for local)
Model: tgi
```

#### Company Internal API

```
Base URL: https://ai.internal.company.com/api/v1
API Key: your-internal-api-key
Model: company-gpt-4
```

### OpenAI Custom Base URL

You can also customize the OpenAI base URL for proxies without using a full custom provider:

- Go to Settings → API Providers
- Under OpenAI, click "Advanced (Custom Base URL)"
- Enter your custom endpoint
- Your OpenAI API key is used with the custom URL

### Troubleshooting

#### Connection Failed

- Verify the base URL is correct and accessible
- Check that the URL ends with `/v1` if your API expects it
- Ensure any required API key is correct

#### Model Not Found

- Verify the model name matches exactly what your API expects
- Some APIs require just the model name, others need the full path
- Check your API&#x27;s documentation for the correct model identifier

#### Streaming Issues

If responses aren&#x27;t streaming properly:

- Ensure your API supports server-sent events (SSE)
- Check that your proxy/gateway preserves streaming responses



# MCP Server

Connect external tools like Claude Code and Cursor via MCP.


## Overview

## MCP Server: An IDE for AI Agents
**Pro Feature:** The MCP Server transforms Repo Prompt into an intelligent backend that external AI agents can control programmatically - essentially an IDE designed for AI-driven development.
### What is MCP?

MCP (Model Context Protocol) is an open standard for AI tools to communicate with external services. Repo Prompt&#x27;s MCP server exposes its powerful capabilities - file selection, codemaps, chat, editing - as tools that any MCP-compatible agent can use.

### Quick Access: MCP Controls

Click the **MCP Server** indicator in the toolbar for quick access to all MCP settings. This is the primary control panel for MCP - no need to dig through preferences.

**Key settings to configure:**

- **Auto-Start:** Enable this so MCP is always available when you launch Repo Prompt
- **Chat Model Presets:** Choose which model handles `chat_send` requests from external agents
- **Context Builder:** Select the agent (Codex, Claude, Gemini, o3) that powers `discover_context`
- **Quick Setup:** One-click install for Cursor, Claude Code, Codex CLI, and more

**Showing 0 tools?** If you just set up your client and it shows 0 available tools, the client cached the empty tool list before Repo Prompt was ready. Restart your client (Cursor, Claude Code, etc.) to pull the updated list.
### Repo Prompt as an IDE for Agents

Think of Repo Prompt&#x27;s MCP server as providing everything an AI agent needs to work effectively with code:

#### File Navigation

Browse file trees, search by path or content, read files with line ranges - agents can explore codebases just like developers do.

#### Code Intelligence

Access codemaps showing function signatures and type definitions - token-efficient structural understanding without reading entire files.

#### Context Building

Select files with full content, line slices, or codemap-only modes. Auto-codemap management adds dependency context automatically.

#### AI-Powered Discovery

Run Context Builder as an MCP tool - let a headless agent select relevant files within a token budget.

#### Pair Programming

Invoke Repo Prompt&#x27;s built-in chat for planning, reviewing, and implementing changes with your configured models.

#### File Editing

Create, move, delete files. Apply search/replace edits or full rewrites with diff visualization and undo support.

#### Workspace Management

List, switch, and create workspaces. Manage compose tabs for parallel tasks. Full programmatic control.

#### Multi-Window Support

Press `⌘+N` to open additional windows. MCP clients can target specific windows on demand, and agents can bind to specific tabs for isolated context.

### Architecture Overview

The MCP server uses a secure, local-only architecture with two transport options:
**Network Transport (Default):**
External Client → repoprompt-mcp (stdio) → localhost TCP → Repo Prompt App**Filesystem Transport (Zero-Network):**
External Client → repoprompt-mcp (stdio) → ~/Library/.../MCPFS/ → Repo Prompt App
Both transports keep all traffic local. The filesystem transport is ideal for corporate networks with strict firewall policies that block localhost TCP connections.

### Compatible Clients

- **Claude Code** - Anthropic&#x27;s official CLI with full MCP support
- **Cursor** - AI-powered editor with MCP integration
- **Codex CLI** - OpenAI&#x27;s CLI tool
- **Any MCP Client** - The protocol is open and standardized

### Key Benefits

- **Better Context:** Agents get token-efficient codemaps and slices instead of dumping entire files
- **Multi-Repository:** Work across multiple project folders in a single workspace
- **Visual Feedback:** See what agents are doing in Repo Prompt&#x27;s UI
- **Human Oversight:** Approve connections, review edits before applying
- **Undo Support:** File checkpoints let you restore previous states

### Security Model

- All connections require explicit user approval (or allowlist)
- Only connections initiated from the localhost device are accepted
- Uses Bonjour for local network discovery - each MCP CLI instance (spawned per-client) connects back to the main app
- To disable Bonjour entirely, use [Filesystem transport mode](/docs#s=mcp-server&ss=mcp-transport) for zero-network communication
- Individual tools can be enabled/disabled
- Workspace operations show approval dialogs with risk levels
- Only one window owns the MCP server at a time

**Getting Started:** Click the **MCP Server** button in the toolbar to enable the server, configure your models, and install in your preferred client. See the Setup Guide for step-by-step instructions.



## Setup Guide

Get Repo Prompt&#x27;s MCP server connected to your preferred AI tool in minutes. The server enables external agents to use Repo Prompt&#x27;s powerful context building, code intelligence, and editing capabilities.

### Quick Setup

- Open **Settings → MCP Server**
- Enable the **MCP Server** toggle
- Click the install button for your client (or copy configuration)
- Restart your client and approve the connection in Repo Prompt

### Client-Specific Instructions

#### Cursor (One-Click)

- Open **Settings → MCP Server** in Repo Prompt
- Click **"Install in Cursor"**
- Restart Cursor
- When Cursor connects, approve in Repo Prompt (check menu bar for dialog)

#### Claude Code

- Open **Settings → MCP Server** in Repo Prompt
- Click **"Copy Configuration"**
- Open Claude Code&#x27;s MCP settings (`claude mcp add` or edit config file)
- Paste the configuration
- Restart Claude Code
- Approve the connection when prompted in Repo Prompt

#### Codex CLI (One-Click)

- Open **Settings → MCP Server** in Repo Prompt
- Click **"Install for Codex"**
- This automatically configures your `codex.toml` with extended timeouts
- Restart Codex and approve the connection

#### Other MCP Clients

- Open **Settings → MCP Server**
- Click **"Copy Configuration"** to get the JSON config
- Add to your client&#x27;s MCP server configuration
- The client will launch `repoprompt-mcp` automatically via stdio
- Approve the connection in Repo Prompt

### Configuration Format

The copied configuration follows the MCP standard format:

```
{
  "mcpServers": {
    "repoprompt": {
      "command": "/Applications/Repo Prompt.app/.../repoprompt-mcp",
      "args": []
    }
  }
}
```

The exact path varies by installation. Always use the "Copy Configuration" button to get the correct path for your system.

### Connection Approval

When a client first connects, Repo Prompt shows an approval dialog. You can:

- **Allow Once:** Permit this single session
- **Always Allow:** Add to allowlist (recommended for trusted clients)
- **Deny:** Reject the connection

**Tip:** The approval dialog appears in the menu bar area. If you don&#x27;t see it, check that Repo Prompt has focus or look for a notification.
### Verifying the Connection

Once connected, you&#x27;ll see the connection status in Repo Prompt&#x27;s toolbar:

- **Connected: [Client Name]** - Ready to receive tool calls
- **Animated icon** - Tool call in progress

Test the connection by asking your agent to list files or get the workspace context. In Claude Code, try: "Use Repo Prompt to show me the file tree."

### Transport Mode

If you&#x27;re in a corporate environment with strict firewall policies, switch to** Filesystem transport** in Settings. This uses file-based message passing instead of localhost TCP connections.

See **Transport Modes** documentation for details on when and why to use each mode.

### Troubleshooting Setup

#### Client can&#x27;t find repoprompt-mcp

- Re-copy the configuration - paths are system-specific
- Ensure Repo Prompt is installed in /Applications
- Check that the CLI binary exists at the configured path

#### No approval dialog appears

- Ensure MCP Server is enabled in Settings
- Check the menu bar for pending approval notifications
- Try toggling the server off and on

#### Connection keeps dropping

- Try switching to Filesystem transport mode
- Check if antivirus software is interfering
- Ensure no VPN is redirecting localhost traffic

#### Tools not appearing in client

- Check **Settings → MCP Server → Tools** to ensure tools are enabled
- Restart the client after enabling tools
- Verify the connection is active (check status indicator)

**Next Steps:** Once connected, explore the **Tools Reference** to see all available capabilities, or check **Connection Management** to learn about multi-window mode and tab binding.



## Tools Reference

Complete reference for all MCP tools available in Repo Prompt. Tools are organized by category and can be individually enabled/disabled in **Settings → MCP Server → Tools**.

### Selection & Context Tools

#### `manage_selection`

Add, remove, or replace files in the current selection with fine-grained control over representation.

| Parameter | Description | 
| `op` | get | add | remove | set | clear | preview | promote | demote | 
| `paths` | Array of file or folder paths (folders expanded recursively) | 
| `mode` | full | slices | codemap_only | 
| `slices` | Array of {path, ranges: [{start_line, end_line, description}]} | 
| `view` | summary | files | content | codemaps | 

**Selection Modes:**

- **full:** Complete file content (default)
- **slices:** Only specified line ranges
- **codemap_only:** Just function/type signatures (token-efficient)

**Auto-Codemap:** When adding files with full/slices mode, related dependency files automatically get codemaps added. Use promote/demote to manually adjust.

#### `workspace_context`

Get a complete snapshot of the current workspace state.

| Parameter | Description | 
| `include` | Array of: prompt, selection, code, files, tree, tokens | 

Returns prompt text, selected files, codemaps, and token counts in a single call.

#### `prompt`

Get or modify the shared prompt/instructions text.

| Parameter | Description | 
| `op` | get | set | append | clear | 
| `text` | Text for set/append operations | 

#### `discover_context`

Run the AI Context Builder to automatically select relevant files for a task.

| Parameter | Description | 
| `instructions` | Task description for the discovery agent | 

Creates a fresh compose tab, runs a headless Claude Code or Codex agent to explore the codebase, and selects files within a token budget. Can take 30s-5min+ depending on codebase size.

### File Operation Tools

#### `get_file_tree`

Get an ASCII directory tree of the project.

| Parameter | Description | 
| `type` | files | roots | 
| `mode` | auto | full | folders | selected | 
| `path` | Optional starting folder | 
| `max_depth` | Limit tree depth (root = 0) | 

Files with available codemaps are marked with `+` in the tree output.

#### `file_search`

Search by file path and/or content with regex support.

| Parameter | Description | 
| `pattern` | Search pattern (regex by default) | 
| `mode` | auto | path | content | both | 
| `regex` | true (default) | false for literal matching | 
| `context_lines` | Lines of context around matches | 
| `filter` | {extensions, exclude, paths} | 
| `max_results` | Limit results (default: 50) | 

#### `read_file`

Read file contents with optional line ranges.

| Parameter | Description | 
| `path` | File path (relative or absolute) | 
| `start_line` | 1-based start line (negative for tail) | 
| `limit` | Number of lines to read | 

Use `start_line: -N` to read the last N lines (like `tail -n`).

#### `get_code_structure`

Get codemaps (function/type signatures) for files or directories.

| Parameter | Description | 
| `scope` | selected | paths | 
| `paths` | Array of file/folder paths (when scope=paths) | 
| `max_results` | Limit codemaps returned (default: 25) | 

Directories are processed recursively. Files without codemap support are reported.

#### `file_actions`

Create, delete, or move files.

| Parameter | Description | 
| `action` | create | delete | move | 
| `path` | File path (absolute required for delete) | 
| `content` | File content (for create) | 
| `new_path` | Destination path (for move) | 
| `if_exists` | error (default) | overwrite | 

Multi-root workspaces require absolute paths for create to avoid ambiguity.

#### `apply_edits`

Apply search/replace edits or full file rewrites.

| Parameter | Description | 
| `path` | File to edit | 
| `search` | Text to find (single edit) | 
| `replace` | Replacement text (single edit) | 
| `edits` | Array of {search, replace, all} for multiple edits | 
| `rewrite` | Complete file content for full rewrite | 
| `all` | Replace all occurrences (default: false) | 
| `verbose` | Include diff preview in response | 

Handles indentation correction, ambiguous search block validation, and malformed input recovery.

### Chat & Model Tools

#### `chat_send`

Start or continue chat conversations with Repo Prompt&#x27;s built-in chat.

| Parameter | Description | 
| `message` | Your message to send | 
| `new_chat` | true to start new, false to continue | 
| `mode` | chat | plan | edit | 
| `model` | Model preset ID or name | 
| `chat_id` | Specific chat to continue | 
| `chat_name` | Name for the session | 
| `selected_paths` | Override selection for this message | 
| `include_diffs` | Include edit diffs in response | 

**Modes:**

- **chat:** General conversation
- **plan:** Architectural planning without immediate edits
- **edit:** Generate and apply code changes

#### `chats`

List recent chats or view conversation history.

| Parameter | Description | 
| `action` | list | log | 
| `chat_id` | Chat ID for log action | 
| `limit` | Max results (default: 10 for list, 3 for log) | 
| `diffs` | Include diff summaries in log | 

#### `list_models`

List available model presets with descriptions.

Returns preset ID, name, description, and supported modes. Use the ID with `chat_send`.

### Workspace Management Tools

#### `manage_workspaces`

List, switch, create, or modify workspaces and tabs.

| Parameter | Description | 
| `action` | list | switch | create | delete | add_folder | remove_folder | list_tabs | select_tab | 
| `workspace` | Workspace UUID or name | 
| `name` | Name for new workspace | 
| `folder_path` | Absolute path for add/remove_folder | 
| `tab` | Tab UUID or name for select_tab | 
| `window_id` | Target window (multi-window mode) | 
| `focus` | Switch UI to selected tab (default: false) | 

Create, delete, and folder operations require user approval. Tab binding ensures consistent context even if the user switches tabs during your session.
**Tool Availability:** Individual tools can be enabled/disabled in** Settings → MCP Server → Tools**. Disabled tools won&#x27;t appear in the client&#x27;s tool list.



## Transport Modes

Repo Prompt&#x27;s MCP server supports two transport modes for communication between external clients and the main application. Both keep all traffic local to your machine.

### Network Transport (Default)

The default transport uses localhost TCP connections for communication between the CLI bridge and the main Repo Prompt application.

#### How It Works

- External client (Claude Code, Cursor) launches `repoprompt-mcp` via stdio
- CLI bridge connects to Repo Prompt over localhost TCP
- Messages are forwarded bidirectionally
- Connection persists for the session lifetime

#### Advantages

- Lower latency for high-frequency tool calls
- Simpler connection lifecycle management
- Works on all standard macOS configurations

#### Limitations

- May be blocked by corporate firewalls that restrict localhost connections
- Some VPN configurations interfere with local TCP
- Antivirus software occasionally flags localhost servers

### Filesystem Transport (Zero-Network Mode)

For corporate environments with strict firewall policies, filesystem transport uses file-based message passing instead of network connections. No Bonjour, no TCP ports—just local files.

- Works in corporate environments with strict firewall policies
- No network ports required
- Compatible with all VPN and security software

### Configuring Transport Mode

Transport mode is configured in **Settings → MCP Server**:

| Setting | Behavior | 
| **Auto (Default)** | Uses network transport, falls back to filesystem if network unavailable | 
| **Network Only** | Always use localhost TCP - fails if blocked | 
| **Filesystem Only** | Always use file-based transport - recommended for corporate networks | 

### Troubleshooting

#### Network Transport Issues

- **Connection refused:** Ensure MCP Server is enabled in Settings
- **Firewall blocking:** Try switching to Filesystem transport mode
- **VPN interference:** Some VPNs redirect localhost - use Filesystem mode

#### Filesystem Transport Issues

- **Messages not received:** Check that the MCPFS directory exists and is writable
- **Stale connections:** Old connection folders are cleaned up automatically; restart the client if stuck
- **Permission errors:** Ensure Repo Prompt has access to Application Support directory

**Corporate Users:** If you&#x27;re experiencing connection issues in a corporate environment, switch to **Filesystem Only** mode in Settings. This bypasses all network-based communication and works reliably under strict firewall policies.



## Settings & Presets

The MCP toggle menu provides quick access to server configuration, model presets, and Context Builder settings. Access it via the MCP indicator in the toolbar.

## Toggle Menu Overview

Click the MCP indicator in the toolbar to open the settings popover. The indicator shows connection status and the number of available tools. See the [MCP Overview](/docs#s=mcp-server&ss=mcp-overview) for a visual guide to these controls.

## Server Controls

### Enable MCP Tools

The main toggle enables or disables MCP tools for the current window. When enabled, external clients can interact with your workspace through the MCP protocol.

### Auto-Start

When checked, the MCP server starts automatically when RepoPrompt launches. This is useful if you always want MCP available for your AI tools.

### Status Indicator

- **Green dot** - Server active with tools enabled
- **Orange dot** - Tools enabled but waiting for listener
- **Gray dot** - Inactive or tools disabled

## Chat Model Presets

Control which AI models are available to MCP clients when they use the `chat_send`and `list_models` tools.

### Use Model Preset for MCP Chat

When enabled, the `list_models` tool returns your configured Model Presets, allowing AI agents to select from your preferred model configurations. This gives agents access to different models for different tasks (e.g., fast models for simple queries, reasoning models for complex planning).

When disabled, `list_models` only returns the current default chat model.

### Fallback Model

If Model Presets are enabled but none are configured, MCP chat uses this fallback model. Choose a model with strong reasoning capabilities for planning-oriented workflows.
**Tip:** Configure Model Presets in Settings → Chat → Manage Presets to give AI agents a selection of models optimized for different task types.
### How Agents Use Presets

When an AI agent calls `chat_send`, it can specify a `model` parameter that matches a preset ID or name. The agent can first call `list_models` to discover available presets and their descriptions, then choose the most appropriate one.

```
// Agent discovers available models
list_models → returns preset IDs and descriptions

// Agent selects appropriate model for task
chat_send(message: "...", model: "FastChat")
```

## Context Builder Settings

Configure which agent powers the `discover_context` MCP tool, which helps AI agents build relevant file context for their tasks.

### Context Builder Agent

Select the agent type used when MCP clients invoke context discovery. Options include:

- **Codex** - OpenAI&#x27;s Codex models, optimized for code understanding
- **Claude** - Anthropic&#x27;s Claude models
- **Gemini** - Google&#x27;s Gemini models
- **o3** - OpenAI&#x27;s o3 reasoning models

The selected agent determines which AI provider handles context-building requests. Choose based on your API availability and preferred model capabilities.

### How discover_context Works

When an MCP client calls `discover_context` with task instructions, RepoPrompt&#x27;s Context Builder agent:

- Analyzes the task requirements
- Explores the codebase to find relevant files
- Builds an optimized selection within token limits
- Returns the selection for subsequent operations

This enables AI agents to automatically gather context without manual file selection.

## Quick Setup

The toggle menu includes buttons for quick installation in popular AI clients:

### Install Button

Click "Install..." to automatically configure the MCP server in supported clients:

- **Cursor** - Adds to Cursor&#x27;s MCP configuration
- **VS Code** - Configures the VS Code MCP extension
- **Codex CLI** - Sets up OpenAI&#x27;s Codex CLI
- **Gemini CLI** - Configures Google&#x27;s Gemini CLI
- **Claude Desktop** - Adds to Claude&#x27;s MCP servers
- **Claude Code** - Opens documentation for manual setup

### Copy JSON

Copies the MCP server configuration to your clipboard for manual installation in any MCP-compatible client:

```
{
  "mcpServers": {
    "RepoPrompt": {
      "command": "/path/to/repoprompt-mcp",
      "args": []
    }
  }
}
```
**Note:** After installing, restart the client application if the integration isn&#x27;t detected immediately.
## Advanced Settings

For additional configuration options, click "Open Status Dashboard" to access:

- Transport mode selection (Network vs Filesystem)
- Individual tool enablement
- Connection diagnostics and troubleshooting
- Multi-window configuration

See [Transport Modes](/docs#s=mcp-server&ss=mcp-transport) and [Connection Management](/docs#s=mcp-server&ss=mcp-connections) for details.



## Connection Management

Repo Prompt provides comprehensive tools for managing MCP connections, including status monitoring, multi-window support, tab binding, and workspace management - all controllable both through the UI and programmatically via MCP tools.

### Connection Status UI

The MCP connection status is displayed in the toolbar and provides real-time feedback:

| Status | Meaning | 
| Server Off | MCP Server is disabled in Settings | 
| Listening | Server is running, waiting for connections | 
| Connecting... | Client is establishing connection | 
| Connected: [Client Name] | Active connection with named client (e.g., "Claude Code") | 
| Tool Running (animated) | A tool call is currently being processed | 

Click the status indicator to access quick actions: view connection details, copy configuration, or open MCP settings.

### Connection Approval

When a new client attempts to connect, Repo Prompt shows an approval dialog:

- **Client name:** Identifies the connecting application
- **Allow Once:** Permit this single connection
- **Always Allow:** Add to allowlist for automatic approval
- **Deny:** Reject the connection

**New in 1.5.41:** The connection approval dialog now defaults to "Always Allow" to reduce repeated prompts for trusted clients.
### Multi-Window Mode

Repo Prompt supports multiple windows, each potentially showing different workspaces. The MCP server can be configured to work across windows:

#### Single Window Mode (Default)

- One window owns the MCP server
- All tool calls operate on that window&#x27;s workspace
- Simpler mental model for basic use

#### Multi-Window Mode

Enable in **Settings → MCP Server → Multi-Window Mode**

- Agents can query available windows and their workspaces
- Tool calls can target specific windows
- Enables parallel work across multiple projects

When multi-window mode is enabled, the `manage_workspaces` tool gains additional capabilities:

```
// List all workspaces across windows
{ "action": "list" }

// Switch a window to a different workspace
{ "action": "switch", "workspace": "MyProject", "window_id": 2 }

// Create a new workspace (requires approval)
{ "action": "create", "name": "NewProject" }

// Add folder to workspace
{ "action": "add_folder", "workspace": "MyProject", "folder_path": "/path/to/folder" }
```

### Tab Management

Compose tabs allow parallel work contexts within a single window. MCP clients can manage tabs programmatically:

#### Listing Tabs

```
// List tabs in current window
{ "action": "list_tabs" }

// Response includes:
// - Tab ID and name
// - [active] = Currently visible tab
// - [bound] = Tab this MCP connection is pinned to
```

#### Tab Binding

By default, MCP tools operate on whichever tab is currently active. This can cause issues if the user switches tabs during a long operation. Tab binding solves this:

```
// Bind to a specific tab for consistent context
{ "action": "select_tab", "tab": "Feature-Auth", "focus": false }

// focus: true = switch UI to show this tab (can disrupt user)
// focus: false = bind silently, user&#x27;s view unchanged
```

Once bound, all subsequent tool calls from this connection operate on the bound tab, regardless of which tab the user is viewing.

#### Context Builder Discovery Tab

When running Context Builder via MCP (`discover_context`), a fresh compose tab is automatically created for each run. This ensures discovery operations don&#x27;t interfere with your existing work context.

### Workspace Approval System

Certain workspace operations require explicit user approval based on risk level:

| Operation | Risk Level | Approval Required | 
| List workspaces | None | No | 
| Switch workspace | Low | No (existing workspaces) | 
| Create workspace | Medium | Yes | 
| Add folder | Medium | Yes | 
| Delete workspace | High | Yes | 

### Connection Lifecycle

Understanding the connection lifecycle helps troubleshoot issues:

- **Server Start:** Repo Prompt opens listening socket/creates filesystem inbox
- **Client Launch:** External tool spawns `repoprompt-mcp` CLI
- **Handshake:** CLI establishes connection and exchanges capabilities
- **Approval:** User approves (or connection auto-approved from allowlist)
- **Active:** Tool calls flow bidirectionally
- **Disconnect:** Client closes or user stops server
- **Cleanup:** Resources released, filesystem folders deleted

### Reconnection Behavior

Connection management was significantly improved in 1.5.41:

- **App Restart:** Connections automatically rebind when Repo Prompt restarts
- **Client Restart:** New connection inherits previous approval status
- **Tab Context:** Bound tabs are restored across reconnections
- **Multi-Window:** Window routing is preserved through restarts

### Troubleshooting Connections

#### Connection Not Appearing

- Ensure MCP Server is enabled in Settings
- Check the approval queue (look in menu bar for pending approvals)
- Verify the client configuration points to correct `repoprompt-mcp` path

#### Stale Connection State

- Toggle the MCP Server off and on in Settings
- Restart the external client
- Check for orphaned connection folders in `~/Library/Application Support/RepoPrompt/MCPFS/`

#### Wrong Window/Tab Receiving Tools

- Use `list_tabs` to verify which tab is bound
- Use `select_tab` to explicitly bind to the correct tab
- In multi-window mode, use `manage_workspaces` to target the right window

**Pro Tip:** For long-running agent sessions, always bind to a specific tab using`select_tab` early in the session. This prevents context confusion if tabs are switched during operation.



# Reference

Settings, keyboard shortcuts, and Free vs Pro comparison.


## Settings Reference

Complete reference for all Repo Prompt settings. Open Settings with `⌘+,` or from the gear icon.

### General Settings

#### Appearance

- **Theme:** Light, Dark, or System (follows macOS)
- **Font size:** Adjust text size throughout the app
- **Syntax highlighting:** Color scheme for code blocks

#### License & Updates

- **License status:** View and manage your Pro license
- **Auto-update:** Enable automatic update checks
- **Update channel:** Stable or Beta releases

#### Prompt Order

- **Section ordering:** Customize the order of prompt sections (files, instructions, etc.)
- **Include datetime:** Add timestamp to prompts

#### Advanced

- **Path display:** Relative or absolute paths in prompts
- **Gitignore:** Respect .gitignore when scanning files
- **Empty folders:** Show or hide empty directories
- **URL scheme:** Enable `repoprompt://` URLs
- **Saved prompts:** Export/import your stored prompts

### API Settings

#### API Providers

Configure API keys for each provider:

- Anthropic, OpenAI, Google (Gemini)
- DeepSeek, Fireworks AI, Grok (xAI), Groq, Z.AI
- Azure OpenAI (requires base URL + key + API version)
- GitHub Models (OAuth sign-in, 8K context limit)
- Ollama/Local (URL + model selection)

#### CLI Providers

Connect external CLI tools to use existing subscriptions:

- **Claude Code:** Anthropic MAX subscription
- **Codex CLI:** OpenAI Plus/Pro subscription
- **Gemini CLI:** Google AI subscription

Test connections and view status for each provider.

#### OpenRouter

Single API key for access to multiple providers through OpenRouter.

#### Custom API (Pro)

Configure custom OpenAI-compatible endpoints:

- Base URL
- API Key (optional)
- Model name

#### Model Config (Pro)

Override default model parameters:

- Temperature
- Max tokens
- Context window size
- Custom parameters

### Chat Settings

#### Chat Settings

- **Default model:** Model used for new chats
- **Auto-format:** Markdown rendering in chat
- **Code block style:** Syntax highlighting theme

#### Pro Edit (Pro)

Configure delegate agent behavior:

- **Model routing:** How models are selected for tasks
- **Parallel agents:** Maximum concurrent file editors
- **Planning model:** Model used for task decomposition

### MCP Settings

#### MCP Server (Pro)

Configure the Model Context Protocol server:

- **Enable/Disable:** Turn MCP server on or off
- **Connection status:** View connected clients
- **Server settings:** Port and access controls

#### Model Presets

Create and manage model presets for quick switching:

- Save current model configuration as preset
- Edit preset name and parameters
- Delete unused presets

### Workspace Settings

#### Manage Workspaces

- **Recent workspaces:** Quick access to previous projects
- **Add/remove folders:** Manage workspace roots
- **Workspace settings:** Per-workspace configurations

#### Manage Presets

Workspace-specific presets:

- Save current selection and settings as preset
- Load presets to restore context
- Export/import presets

### Prompt Presets

#### Copy Presets

Configure how prompts are formatted when copied:

- **Standard:** Clean format for any AI
- **Pro Edit:** XML format for structured changes
- **Plan:** Optimized for architectural planning
- **Custom presets:** Create your own formats

#### Chat Presets

Preset configurations for chat sessions:

- System prompt templates
- Default mode (chat/plan/edit)
- Model selection

### Benchmark (Pro)

Run model comparisons:

- Select models to benchmark
- Configure test parameters
- View results and history
- Export benchmark data



## Keyboard Shortcuts

Keyboard shortcuts for faster navigation and common actions.

### General

| `⌘+,` | Open Settings | 
| `⌘+O` | Open folder/workspace | 
| `⌘+W` | Close current tab | 
| `⌘+Q` | Quit Repo Prompt | 

### Compose

| `⌘+C` | Copy prompt to clipboard | 
| `⌘+T` | New compose tab | 
| `⌘+F` | Search files | 
| `⌘+Shift+F` | Search file content | 

### Chat

| `⌘+N` | Start new AI chat | 
| `⌘+Return` | Send message | 
| `Escape` | Stop generation | 

### Navigation

| `⌘+1` | Switch to Compose view | 
| `⌘+2` | Switch to Chat view | 
| `⌘+3` | Switch to Apply view | 
| `⌘+[` | Previous tab | 
| `⌘+]` | Next tab | 

### File Selection

| `Click` | Toggle file selection | 
| `⌘+Click` | Add to selection (multi-select) | 
| `Shift+Click` | Select range | 
| `Right-click` | File context menu (modes, slices) | 

**Tip:** Most shortcuts follow standard macOS conventions. If you&#x27;re familiar with other Mac apps, the same patterns work here.



## Free vs Pro

Repo Prompt offers a generous free tier with core functionality, plus Pro features for power users.

### Feature Comparison

| Feature | Free | Pro | 
| Token Limit | 32K | Unlimited | 
| File Selection & Compose | ✓ | ✓ | 
| Chat Mode (with API keys) | ✓ | ✓ | 
| Apply Mode (paste edits back) | ✓ | ✓ | 
| Workspace presets | ✓ | ✓ | 
| CLI Providers | ✓ | ✓ | 
| **Codemaps** | — | ✓ | 
| **MCP Server** | — | ✓ | 
| **Context Builder** | — | ✓ | 
| **Pro Edit (delegate agents)** | — | ✓ | 
| **Custom API Providers** | — | ✓ | 
| **Model Overrides** | — | ✓ | 
| **Benchmarks** | — | ✓ | 

### Free Tier Highlights

The free tier includes powerful features for everyday use:

- **CLI Providers:** Use your existing Claude MAX, ChatGPT Plus, or Google AI subscriptions directly in Repo Prompt - no API costs
- **File Selection:** Select and organize files across your codebase for context building
- **Chat Mode:** Have AI conversations with your own API keys
- **Apply Mode:** Paste AI responses back to apply multi-file edits

### Pro Feature Details

#### Codemaps

Extract function/type signatures from code, giving AI structural understanding at 10x fewer tokens. Essential for large codebases.

#### MCP Server

Turn Repo Prompt into an "IDE for agents" that external tools like Claude Code and Cursor can control.

#### Context Builder

Let AI automatically select relevant files for your task. Analyzes your codebase and builds optimal context.

#### Pro Edit

Parallel multi-file editing with delegate agents. Each file gets a sandboxed helper for faster, safer edits.

#### Custom API Providers

Connect to any OpenAI-compatible endpoint - self-hosted models, company APIs, or alternative providers.

#### Model Overrides

Customize model parameters like temperature, max tokens, and context windows for fine-tuned control.

#### Benchmarks

Run performance comparisons across models to find the best fit for your use case.

### Pricing

| **Monthly** | $14.99/month | 
| **Yearly** | $149.99/year (save 17%) | 
| **Lifetime** | $349 one-time | 

### Managing Your License

- **Purchase:** Visit Settings → License & Updates
- **Activate:** Enter your license key in the same panel
- **Manage subscription:** [polar.sh portal](https://polar.sh/repo-prompt/portal/request)

**7-Day Free Trial:** Both monthly and yearly Pro subscriptions include a 7-day free trial. Cancel anytime during the trial and you won&#x27;t be charged. The free tier also includes all core functionality if you want to explore before starting a trial.



# Changelog

Version history and release notes.


## Version 1.5

### Version 1.5 Series

The 1.5 series introduces Context Builder 2.0 with agentic discovery, compose tabs for parallel workflows, enhanced MCP tooling, and support for new CLI providers.

#### Key Features in 1.5

- **Context Builder 2.0** - Agentic context building using Claude Code or Codex to automatically select files, codemaps, and slices within a token budget
- **Compose Tabs** - Work on multiple tasks in parallel with independent prompts and file selections per tab
- **Pro Edit Agent Mode** - Use Claude Code or Codex with MCP tools to generate edits in parallel with higher accuracy
- **Codex CLI as API Provider** - Use OpenAI models through your Plus or Pro plan via Codex CLI
- **Gemini CLI Support** - Use Gemini CLI for chat, discovery & delegate edits
- **Zero-Network MCP Mode** - Filesystem-based transport for corporate networks and strict firewalls
- **Context Builder as MCP Tool** - Run discovery directly from external agents
- **Tab Management via MCP** - Control tabs and workspaces programmatically
- **Opus 4.5 & Haiku 4.5 Support** - Latest Anthropic models across all providers
- **Chat Message Forking** - Edit user messages to create conversation branches
- **Model Recommendation Engine** - Automatic model suggestions based on your current workflow and configuration

View detailed changelog (1.5 - 1.5.44)
##### 1.5.45 - December 3, 2025

- **New:** Context builder can now automatically generate a plan after completing its exploration
- **New:** Improved MCP context builder tool to add followup chaining for questions or plans
- **New:** Added Recommendation engine for auto model selection based on current configuration
- file_search uses improved regex engine for better performance in large repos
- Many CPU usage optimizations across the app
- Fixed MCP tool routing by using direct window_id and tab_id params to tools
- Improved performance of discovery agent

##### 1.5.44 - November 29, 2025

- Resolved issues with prompts getting reset on tab switches
- Fixed UI issue for pro edit settings
- Discovery MCP tool now shows cancellation info

##### 1.5.42 - November 28, 2025

- Context builder as an MCP tool
- Tab management now possible with MCP tooling
- Workspace tool can create and edit workspaces with permission management

##### 1.5.40 - November 24, 2025

- Added support for Opus 4.5 across the app and providers
- Zero-network MCP mode using filesystem-based transport

##### 1.5.37 - November 17, 2025

- Added support for Gemini CLI for chat, discovery & delegate edits

##### 1.5.28 - November 10, 2025

- Codex CLI as an API provider for OpenAI models via Plus/Pro plan

##### 1.5.21 - November 4, 2025

- File slices now stored in Application Support
- Haiku 4.5 support, deprecated Sonnet 3.5 removed
- Custom provider supports V4+ endpoint versions

##### 1.5.15 - October 29, 2025

- Pro Edit Agent mode with Claude Code or Codex for parallel edits

##### 1.5.5 - October 21, 2025

- Compose Tabs for parallel task workflows
- Prompt enhancement modes: Replace, Augment, or Preserve
- Desktop notifications when context builder completes

##### 1.5 - October 16, 2025

- Context Builder 2.0 with agentic discovery using Claude Code or Codex
- Automatically selects files, codemaps, and slices within token budget
- Overhauled file search and manage_selection MCP tools

##### Other 1.5.x releases

Versions 1.5.1-1.5.4, 1.5.6-1.5.14, 1.5.16-1.5.20, 1.5.22-1.5.27, 1.5.29-1.5.39, 1.5.41, 1.5.43 include MCP connection improvements, tab stashing (limit raised to 25), GPT-5.1 updates, native markdown rendering, auto workspace restore, and numerous stability fixes.



## Version 1.4

### Version 1.4 Series

The 1.4 series introduces the Presets system, Repo Bench for model benchmarking, macOS Tahoe support, git integration, and major performance optimizations.

#### Key Features in 1.4

- **Presets System** - Quickly jump to optimized app configurations for different workflows
- **Repo Bench** - Benchmark any model on complex large context and file editing constraints
- **macOS 26 Tahoe Support** - Revamped visual design with native components
- **Git Diffs in Prompts** - Include git diffs from all files or your selection for code reviews
- **GPT-5 Pro Support** - Full support for OpenAI&#x27;s latest reasoning models
- **z.AI Provider** - Added support for z.AI models
- **MCP Chat Model Presets** - Configure models for chat MCP tools with descriptions
- **Multi-Window MCP Mode** - Access different workspaces in parallel
- **Hierarchical Ignore Files** - Support for .cursorignore and nested gitignore
- **Codex CLI 1-Click Install** - Simplified setup for Codex integration

View detailed changelog (1.4.0 - 1.4.27)
##### 1.4.27 - October 7, 2025

- Added support for GPT-5 Pro
- Performance improvements and benchmark view fixes

##### 1.4.25 - September 29, 2025

- Repo Bench for evaluating models on complex tasks
- Submit results to global rankings

##### 1.4.17 - September 26, 2025

- macOS 26 Tahoe support with native components
- File loading optimization for large binary files

##### 1.4.0 - August 25, 2025

- Presets system for streamlined workflows
- Simplified chat view presentation

##### Other 1.4.x releases

Versions 1.4.1-1.4.16, 1.4.18-1.4.24, 1.4.26 include z.AI provider, GLM 4.6 support, git diffs in prompts, multi-window MCP mode, hierarchical ignore files, Codex CLI 1-click install, improved file tree auto mode, smart caching, and numerous stability fixes.



## Version 1.3

### Version 1.3 Series

The 1.3 series introduced the MCP Server for external tool integration, Claude Code as a provider, and major improvements to chat and editing workflows.

#### Key Features in 1.3

- **MCP Server** - Connect external tools like Claude Code and Cursor to interact with Repo Prompt
- **Claude Code as Provider** - Use your existing Claude Code installation as an API provider with MAX subscription
- **MCP Chat Tools** - External agents can invoke built-in chat for planning, debugging, and engineering
- **MCP File Operations** - Create, delete, move, and edit files via MCP
- **Git Integration** - Select unstaged files and copy diffs for code reviews
- **Groq Provider** - Support for Kimi K2 model
- **Grok 4 Support** - Added xAI&#x27;s latest model
- **PHP Codemaps** - Added PHP language support for code structure
- **Delegate Edits** - Refined approach for more reliable file edits
- **Shift Select** - Faster bulk file selection in file tree

View detailed changelog (1.3 - 1.3.50)
##### 1.3.19 - July 17, 2025

- Improved Claude Code stability for large prompts
- Model parameter selection (opus vs sonnet)
- New built-in prompts: MCP Pair Program and MCP Claude Code
- CodeMap cache reset button

##### 1.3.17 - July 16, 2025

- Claude Code as an API provider
- Groq provider with Kimi K2 support
- New MCP search tool for efficient codebase navigation

##### 1.3.15 - July 11, 2025

- PHP codemap support
- Revamped JavaScript/TypeScript codemaps
- Grok 4 model support

##### 1.3.13 - July 4, 2024

- MCP Chat tools - Claude gets a pair programmer
- Unified diffs for tracking changes

##### 1.3.12 - July 2, 2024

- MCP file operations (create, delete, move, edit)
- Multiple search/replace in single tool call
- Tool call cancellation

##### 1.3 - June 23, 2024

- MCP Server for external tool integration
- Search, codemaps, and planning via Claude Code or Cursor
- UI control: update file selection and instructions

##### Other 1.3.x releases

Versions 1.3.1-1.3.11, 1.3.14, 1.3.16, 1.3.18, 1.3.20-1.3.50 include git diff support, hierarchical ignore files, multi-window MCP mode, improved diff generation, memory optimizations, and numerous stability fixes.



## Version 1.2

### Version 1.2 Series

The 1.2 series introduced XML Architect Mode for complex multi-file edits and enhanced support for reasoning models across providers.

#### Key Features in 1.2

- **XML Architect Mode** - Use external chat model to architect complex multi-file edits, then delegate to pro edit model
- **O3 Pro Support** - Full support for OpenAI&#x27;s o3-pro reasoning model
- **Responses API** - OpenAI reasoning models display reasoning summaries
- **Gemini 2.5 Updates** - Flash 2.5 and Pro 2.5 GA releases, Flash Lite Preview
- **Reasoning Effort Variants** - Configure effort levels for o3 models
- **Chat Message Actions** - Accept all and restore checkpoint buttons
- **Mention Menu** - Experimental @ mentions in chat
- **Model Override UI** - Per-model Responses API configuration

View detailed changelog (1.2.0 - 1.2.29)
##### 1.2.29 - June 18, 2024

- Fixed token usage display for OpenAI reasoning models
- Optimized temperature defaults (0.7 Gemini Pro 2.5, 0.6 Deepseek R1)
- Fixed Azure reasoning model timeouts

##### 1.2.27 - June 16, 2024

- All OpenAI reasoning models use Responses API with summaries
- Enhanced O3 Pro behavior in chat

##### 1.2.26 - June 13, 2024

- Accept all and restore checkpoint buttons on chat messages
- Fixed Model overrides UI

##### 1.2.23 - June 10, 2024

- Full o3-pro API support
- Experimental mention menu (beta)

##### 1.2.0 - May 4, 2024

- XML Architect Mode for complex multi-file edits
- File count badge in selected files view

##### Other 1.2.x releases

Versions 1.2.1-1.2.22, 1.2.24-1.2.25, 1.2.28 include Gemini model updates, reasoning effort variants, preset naming, improved diff generation, conflict detection, and various stability fixes.



## Version 1.1

### Version 1.1 Series

The 1.1 series introduced Context Builder for AI-powered file recommendations, Pro Edit with parallel file changes, and major chat performance improvements.

#### Key Features in 1.1

- **Context Builder** - Combine codemaps and LLMs to produce relevant file recommendations
- **Pro Edit Parallel Changes** - Split changes within a file to tackle complex edits in parallel
- **File Checkpoints** - Capture and restore file states across app reloads
- **File Renaming** - Rename files (treated as create + delete) in chat and apply
- **Fireworks AI Provider** - Built-in support for Fireworks
- **Native File Tree** - Complete rebuild for better large repository scaling
- **Plan/Act Toggle** - Switch between planning and acting modes in chat
- **O3/O4 Mini Support** - OpenAI&#x27;s compact reasoning models
- **Prompt Ordering Menu** - Experiment with element order in prompts
- **Token Usage Display** - Per-message and delegate edit token counts

View detailed changelog (1.1.0 - 1.1.20)
##### 1.1.20 - May 2, 2024

- Fixed state caching issues with empty files or excess deletions
- Improved delegate edit error handling

##### 1.1.16 - April 28, 2024

- Pro edit can split changes within files for parallel processing
- File checkpoints with persistence across reloads
- File renaming support
- Fireworks AI provider
- Per-message token usage display

##### 1.1.11 - April 18, 2024

- Complete native file tree rebuild for large repos
- Fuzzy search with space-as-wildcard
- Font sizing options
- Prompt export/import

##### 1.1.10 - April 16, 2024

- O3 and O4 mini support via OpenAI
- Prompt ordering menu
- User instruction sandwiching

##### 1.1.0 - Major Release

- Context Builder for AI-powered file recommendations
- Parallel AI queries for large codebases
- Save recommendations as presets
- Optimized chat streaming performance

##### Other 1.1.x releases

Versions 1.1.1-1.1.9, 1.1.12-1.1.15, 1.1.17-1.1.19 include Gemini 2.5 Pro Exp, Sonnet Thinking MAX, o1 Pro support, URL scheme improvements, chat rendering optimizations, and stability fixes.



## Version 1.0

### Version 1.0 Series

The 1.0 series marked Repo Prompt&#x27;s official release, leaving beta with stability improvements, presets, and foundational chat features.

#### Key Features in 1.0

- **Official Release** - First production-ready version, leaving beta
- **File Presets** - Save and switch between selected file sets with hotkeys
- **Plan/Act Mode** - Toggle between planning and acting in chat
- **Model Temperature** - Configure temperature settings per model
- **Custom Planning Prompt** - Customize the planning prompt
- **Deepseek V3** - OpenRouter support for Deepseek&#x27;s latest
- **Azure Reasoning Models** - Support for Azure-hosted reasoning models
- **Markdown Rendering** - Chat messages render with markdown
- **Sandbox Removal** - Enables future CLI event handling

View detailed changelog (1.0 - 1.0.26)
##### 1.0.26

- App terminates properly when closing last window
- New chat hotkey (cmd+shift+n) works in chat view
- Fixed slow typing and text selection issues

##### 1.0.24

- Presets for quick file selection switching
- Hotkey support for preset navigation

##### 1.0.19

- Markdown rendering in chat
- Max output token options for custom providers
- Fixed temperature errors for o-series models

##### 1.0.16

- Model temperature configuration
- Prevent diff edit models from using rewrite
- Deepseek V3 via OpenRouter
- Custom planning prompt

##### 1.0 - Official Release

- First official release, leaving beta
- Collapse all folders hotkey (cmd+option+c)
- Workspace restore from sandbox migration
- App sandbox removed for CLI support

##### Other 1.0.x releases

Versions 1.0.1-1.0.15, 1.0.17-1.0.23, 1.0.25 include plan/act toggle, pro edit improvements, Azure reasoning model fixes, path resolution improvements, hotkey fixes, and stability improvements.

