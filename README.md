<div align="center">

# YouTrack MCP Server

[![CI](https://github.com/itsalfredakku/youtrack-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/itsalfredakku/youtrack-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![MCP](https://img.shields.io/badge/Protocol-MCP-blueviolet)

</div>

> Enterprise‑grade MCP server for JetBrains **YouTrack** giving AI assistants (Claude, VSCode MCP extensions, Continue.dev, Cline, Zed, custom connectors) safe, tool-based access to issues, sprints, dependencies (Gantt + critical path), time tracking and knowledge base content.

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Highlights](#highlights)
3. [Environment & Configuration](#environment--configuration)
4. [MCP Client Integration](#mcp-client-integration)
5. [Usage Examples](#usage-examples)
6. [Analytics (Gantt & Critical Path)](#analytics-gantt--critical-path)
7. [Tool Catalog Summary](#tool-catalog-summary)
8. [Architecture](#architecture)
9. [Development](#development)
10. [Troubleshooting](#troubleshooting)
11. [Security & Permissions](#security--permissions)
12. [Roadmap](#roadmap)
13. [Contributing](#contributing)
14. [License](#license)

---

## Quick Start
```bash
git clone https://github.com/itsalfredakku/youtrack-mcp.git
cd youtrack-mcp
npm install
cp .env.example .env      # set YOUTRACK_URL + YOUTRACK_TOKEN
npm run build
npm start                 # stdio MCP server
```
Remote (SSE) for hosted usage / ChatGPT custom connector:
```bash
npm run start:remote      # http://localhost:3001/mcp/sse
```
Health check:
```bash
curl http://localhost:3001/health
```

---

## Highlights
| Domain | Capabilities |
|--------|--------------|
| **Dynamic Configuration** | 🆕 Auto-loads custom field values (State, Priority, Type) from YOUR YouTrack instance on startup - no more hardcoded examples! |
| Issues | CRUD, comments, transitions, dependency links, estimation |
| Agile  | Sprint create/manage, issue assignment, progress metrics |
| Knowledge Base | Article create/update/search, tagging, linkage |
| Projects | Discovery, metadata, field summaries |
| Analytics | Gantt generation, dependency routing, critical path |
| Time Tracking | Log work, time summaries, reporting hooks |
| Performance | TTL caching, structured logging, graceful fallbacks |
| Reliability | Consistent response envelope & error normalization |

### 🌟 New: Dynamic Configuration

The MCP server now automatically adapts to your YouTrack customization! On startup, it:
- ✅ Fetches your actual State values (e.g., "In Progress", "Code Review")
- ✅ Loads your Priority values (e.g., "Critical", "High", "Medium")
- ✅ Discovers your Issue Types (e.g., "Bug", "Feature", "Epic")
- ✅ Generates accurate query examples that work with YOUR setup

**No more errors** from AI assistants suggesting `"state: Open"` when your instance uses `"state: In Progress"`!

See [Dynamic Configuration Documentation](docs/DYNAMIC_CONFIGURATION.md) for details.

---

## Environment & Configuration
Minimal `.env`:
```properties
YOUTRACK_URL=https://your-instance.youtrack.cloud
YOUTRACK_TOKEN=your-permanent-token
PROJECT_ID=PROJECT-1
LOG_LEVEL=info
CACHE_ENABLED=true
CACHE_TTL=300000
ENABLE_WEBHOOKS=false
WEBHOOK_PORT=3000
WEBHOOK_SECRET=
```
| Variable | Required | Description | Default |
|----------|-----|-------------|---------|
| `YOUTRACK_URL` | ✅ | Base URL (no trailing slash) | — |
| `YOUTRACK_TOKEN` | ✅ | Permanent token (Profile → Tokens) | — |
| `PROJECT_ID` | — | Default project shortName | — |
| `LOG_LEVEL` | — | error/warn/info/debug | info |
| `CACHE_ENABLED` | — | Enable in‑memory cache | true |
| `CACHE_TTL` | — | Cache TTL ms | 300000 |
| `ENABLE_WEBHOOKS` | — | Start webhook listener | false |
| `WEBHOOK_PORT` | — | Webhook port | 3000 |
| `WEBHOOK_SECRET` | — | HMAC secret | — |

---

## MCP Client Integration
Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{ 
  "mcpServers": { 
    "youtrack": {
      "command": "node", 
      "args": ["/abs/path/youtrack-mcp/dist/index.js"], 
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
        "YOUTRACK_TOKEN": "token",
        "PROJECT_ID": "PRJ"  // Optional
      } 
    } 
  } 
}
```
VSCode (`.vscode/settings.json`):
```json
{ 
  "servers": { 
    "youtrack": { 
      "command": "node", 
      "args": ["./dist/index.js"], 
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
        "YOUTRACK_TOKEN": "token",
      } 
    } 
  } 
}
```
Github Coding Agent:
```json
 "mcpServers": {
    "youtrack": {      
       "type": "sse",
        "url": "https://youtrack-mcp.you.com/mcp/sse",
        "headers": {
            "Authorization": "Bearer jTJrRDGhhJ!b8rD"
            },
      "tools": [
        "issues",
        "projects",
        "users"        
      ]
    }
}
```
Continue.dev (`continue.json`):
```json
{ 
  "mcp": { 
    "servers": [
      { 
        "name": "youtrack", 
        "command": "node", 
        "args": ["/abs/youtrack-mcp/dist/index.js"], 
        "env": {
          "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
          "YOUTRACK_TOKEN": "token"
        } 
      }
    ] 
  } 
}
```
Cline / Generic:
```json
{ 
  "mcpServers": { 
    "youtrack": { 
      "command": "node", 
      "args": ["/abs/youtrack-mcp/dist/index.js"], 
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
        "YOUTRACK_TOKEN": "token"
      } 
    } 
  } 
}
```
Zed:
```json
{ 
  "context_servers": { 
    "youtrack": { 
      "command": "node", 
      "args": ["/abs/youtrack-mcp/dist/index.js"], 
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
        "YOUTRACK_TOKEN": "token"
      } 
    } 
  } 
}
```
Local test:
```bash
YOUTRACK_URL=https://your-instance.youtrack.cloud \
YOUTRACK_TOKEN=token \
node dist/index.js
```
Pitfalls: absolute path, no trailing slash, full token copy, JSON env values are strings.

---

## Tool Catalog Summary
| Category | Examples |
|----------|----------|
| Issues | `create_issue`, `update_issue`, `add_issue_comment`, `search_issues` |
| State | `start_working_on_issue`, `change_issue_state`, `complete_issue` |
| Agile | `create_sprint`, `list_sprints`, `assign_issue_to_sprint` |
| Knowledge | `create_article`, `update_article`, `search_articles` |
| Projects | `list_projects`, `get_project_details` |
| Analytics | `generate_gantt_chart`, `get_critical_path`, `create_issue_dependency` |
| Time | `log_work_item`, `get_time_report` |

---

## Architecture
```
Clients (Claude / VSCode / Continue / Zed)
          │  MCP (stdio or SSE)
 ┌────────▼────────┐
 │  Orchestrator   │ registry, routing, validation
 └────────┬────────┘
          │ domain calls
 ┌────────▼────────┐
 │ Domain Clients  │ issues / projects / agile / kb / analytics / time
 └────────┬────────┘
          │ REST
 ┌────────▼────────┐
 │  YouTrack API   │
 └─────────────────┘
```
Traits: strong typing, graceful degradation, normalized errors, pluggable caching/logging.

---

## Development
```bash
npm install
npm run dev          # watch
npm run lint         # eslint
npm run type-check   # types
npm test             # tests
npm run build        # dist output
```
Structure: `src/index.ts` (entry), `src/api/domains` (domain clients), `src/tools.ts` (tool registry), `src/utils`, `src/logger.ts`.

---

## Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 Unauthorized | Missing scope / expired token | Regenerate token with required permissions |
| Project not found | Hidden / archived / wrong ID | Use internal ID or verify access |
| Empty analytics | No issues in project | Seed baseline issues |
| SSE disconnects | Proxy idle timeout | Enable keep-alive / tune LB |

Checklist: absolute path, no trailing slash, full token, JSON env strings. Use `LOG_LEVEL=debug` for deep inspection.

---

## Security & Permissions
Recommended token capabilities: Issues (R/W), Projects (Read), Knowledge Base (R/W), Agile/Sprints (R/W), Time Tracking (if applicable). Store tokens as environment secrets; never commit.

---

## Contributing
1. Fork & branch (`feature/x`)
2. Implement + tests
3. `npm run lint && npm run type-check`
4. Open PR with rationale

---

## License
MIT © 2025

## Acknowledgements
JetBrains YouTrack • MCP community • TypeScript ecosystem

> Feedback / ideas? Open an issue or discussion.
