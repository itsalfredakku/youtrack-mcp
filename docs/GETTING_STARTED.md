# Getting Started with YouTrack MCP Server

## Overview

The YouTrack MCP (Model Context Protocol) Server provides AI assistants with direct access to YouTrack's REST API, enabling intelligent project management, issue tracking, and team collaboration through natural language.

## Prerequisites

- Node.js 18+ and npm
- A YouTrack instance (Cloud or Server)
- YouTrack permanent token with appropriate permissions

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/youtrack-mcp.git
cd youtrack-mcp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Connection

#### Option A: Environment Variables

```bash
export YOUTRACK_URL="https://your-instance.youtrack.cloud"
export YOUTRACK_TOKEN="perm:your-permanent-token-here"
```

**Important**: Do NOT include `/api` suffix in YOUTRACK_URL. The server adds this automatically.

#### Option B: Configuration File

Create `config.json`:

```json
{
  "youtrackUrl": "https://your-instance.youtrack.cloud",
  "youtrackToken": "perm:your-permanent-token-here"
}
```

#### Option C: Claude Desktop Integration

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/path/to/youtrack-mcp/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "perm:your-token-here"
      }
    }
  }
}
```

### 4. Build the Server

```bash
npm run build
```

### 5. Test Connection

```bash
npm start
```

You should see:
```
✓ YouTrack MCP Server running
✓ Connected to: https://your-instance.youtrack.cloud
```

## Getting Your YouTrack Token

1. Log into your YouTrack instance
2. Click your profile icon → **Profile Settings**
3. Navigate to **Authentication** → **Tokens**
4. Click **New Token**
5. Name it (e.g., "MCP Server")
6. Select scope: **YouTrack** (full access)
7. Click **Create**
8. Copy the token (starts with `perm:`)

## Verify Installation

### Check Connection

Start the server and verify it connects to YouTrack:

```bash
npm start
```

**Expected output**:
```
[INFO] YouTrack MCP Server starting...
[INFO] Connected to YouTrack: https://your-instance.youtrack.cloud
[INFO] Dynamic configuration loaded:
  - States: 12 values
  - Priorities: 5 values  
  - Types: 8 values
[INFO] MCP Server ready on stdio
```

### Health Check (Remote Mode)

If using remote/SSE mode:

```bash
npm run start:remote &
curl http://localhost:3001/health
```

**Expected response**:
```json
{
  "status": "ok",
  "youtrack": "connected",
  "version": "1.0.0"
}
```

## First Steps

### Query Projects

Ask your AI assistant:
```
"List all YouTrack projects"
```

Expected output:
- Project names and IDs
- Short names
- Descriptions
- Archive status

### Create an Issue

```
"Create a new issue in project DEMO with summary 'Test Issue'"
```

The AI will:
1. Validate the project exists
2. Create the issue
3. Return the issue ID (e.g., DEMO-123)

### Generate a Gantt Chart

```
"Generate a Gantt chart for project DEMO"
```

Returns:
- Task timeline data
- Start/end dates
- Completion status
- Dependencies (if enabled)
- Custom date fields (if configured)

## Available Tools

The server provides these MCP tools:

### 1. `mcp_youtrack_auth`
Manage authentication and connection

**Actions:**
- `status` - Check connection status
- `login` - OAuth2 login (browser-based)
- `logout` - Sign out
- `test` - Validate token

### 2. `mcp_youtrack_issues`
Create, update, and manage issues

**Actions:**
- `create` - Create new issue
- `update` - Update existing issue
- `get` - Get issue details
- `query` - Advanced search with YouTrack Query Language
- `search` - Simple text search
- `state` - Change issue state
- `complete` - Mark as done
- `start` - Begin work

### 3. `mcp_youtrack_projects`
Project management

**Actions:**
- `list` - List all projects
- `get` - Get project details
- `validate` - Check access
- `fields` - List custom fields
- `status` - Project statistics

### 4. `mcp_youtrack_comments`
Issue comments

**Actions:**
- `get` - List comments
- `add` - Add comment
- `update` - Edit comment
- `delete` - Remove comment

### 5. `mcp_youtrack_agile_boards`
Agile board and sprint management

**Actions:**
- `boards` - List all boards
- `board_details` - Get board details
- `sprints` - List sprints
- `sprint_details` - Get sprint info
- `create_sprint` - Create new sprint
- `assign_issue` - Assign issue to sprint

### 6. `mcp_youtrack_time_tracking`
Time logging and work items

**Actions:**
- `log_time` - Log work time
- `get_time_entries` - List time entries
- `get_work_items` - List work items
- `create_work_item` - Create work item
- `time_reports` - Generate reports

### 7. `mcp_youtrack_analytics`
Reports and analytics

**Report Types:**
- `project_stats` - Project statistics
- `time_tracking` - Time tracking summary
- `gantt` - Gantt chart data
- `critical_path` - Critical path analysis
- `resource_allocation` - Team capacity
- `milestone_progress` - Milestone tracking

### 8. `mcp_youtrack_knowledge_base`
Knowledge base articles

**Actions:**
- `list` - List articles
- `get` - Get article
- `create` - Create article
- `update` - Update article
- `delete` - Delete article
- `search` - Search articles

### 9. `mcp_youtrack_subscriptions`
Notification subscriptions

**Actions:**
- `create` - Create subscription
- `update` - Update subscription
- `delete` - Delete subscription
- `list` - List subscriptions

### 10. `mcp_youtrack_admin`
Administrative operations

**Operations:**
- `search_users` - Find users
- `project_fields` - Project custom fields
- `field_values` - Field value options
- `bulk_update` - Update multiple issues
- `dependencies` - Manage dependencies

## Common Use Cases

### Project Setup

```
1. "Create a new project called 'Mobile App' with key MOBILE"
2. "Add a custom field 'Sprint' to project MOBILE"
3. "Create 10 sample issues in project MOBILE"
```

### Sprint Planning

```
1. "Show all agile boards"
2. "List sprints for board 'Scrum Board'"
3. "Create a new sprint for next week"
4. "Move issue MOBILE-123 to current sprint"
```

### Time Tracking

```
1. "Log 2 hours of development time to MOBILE-123"
2. "Show time tracking report for last week"
3. "Who worked on project MOBILE this month?"
```

### Reporting

```
1. "Generate Gantt chart for MOBILE project"
2. "Show critical path for MOBILE project"
3. "What's the team's capacity this week?"
4. "Show milestone progress for Q1 release"
```

### Issue Management

```
1. "Create a bug in MOBILE: App crashes on login"
2. "Update MOBILE-123 priority to Critical"
3. "Add comment to MOBILE-123: Fixed in branch feature/login"
4. "Move MOBILE-123 to state 'In Review'"
5. "Mark MOBILE-123 as complete"
```

## YouTrack Query Language

The server supports YouTrack's powerful query syntax:

```
# All open issues
"Find issues: state: Open"

# High priority bugs
"Find issues: #Bug priority: High"

# My assigned issues
"Find issues: assignee: me state: -Fixed"

# Created this week
"Find issues: created: {This week}"

# Multiple conditions
"Find issues: project: MOBILE state: Open assignee: John"
```

**Query Operators:**
- `:` - equals
- `-:` or `-` - not equals
- `>`, `<`, `>=`, `<=` - comparison
- `{}` - date ranges (This week, Today, Last month)
- `#` - tags

## Troubleshooting

### Connection Errors

**Problem**: "Cannot connect to YouTrack"

**Solutions:**
1. Check `YOUTRACK_URL` is correct (should end with `/api`)
2. Verify network connectivity: `curl $YOUTRACK_URL`
3. Check firewall/proxy settings
4. Ensure YouTrack instance is running

### Authentication Failures

**Problem**: "401 Unauthorized"

**Solutions:**
1. Verify token is valid: Check YouTrack → Profile → Tokens
2. Ensure token starts with `perm:`
3. Check token hasn't expired
4. Verify token has required permissions
5. Try regenerating token

### Rate Limiting

**Problem**: "429 Too Many Requests"

**Solutions:**
1. Reduce request frequency
2. Enable caching (automatic in most cases)
3. Use batch operations where possible
4. Wait 60 seconds and retry

### Slow Performance

**Problem**: Queries take too long

**Solutions:**
1. Limit query results: Add `top: 100` parameter
2. Use specific field selectors
3. Enable dependency caching for Gantt charts
4. Query specific projects instead of all issues

### Debug Mode

Enable detailed logging:

```bash
DEBUG=youtrack:* npm start
```

Or set environment variable:

```bash
export DEBUG=youtrack:*
```

## Configuration Options

### Advanced Configuration

```json
{
  "youtrackUrl": "https://your-instance.youtrack.cloud/api",
  "youtrackToken": "perm:your-token",
  "cacheEnabled": true,
  "cacheTTL": 300,
  "requestTimeout": 30000,
  "maxRetries": 3,
  "logLevel": "info"
}
```

### Cache Configuration

```typescript
{
  cacheTTL: {
    projects: 3600,      // 1 hour
    customFields: 1800,  // 30 minutes
    users: 600,          // 10 minutes
    issues: 60           // 1 minute
  }
}
```

## Next Steps

1. **Read Tool Documentation**: See `/docs/tools/` for detailed tool references
2. **Explore Examples**: Check `/docs/examples/` for common workflows
3. **API Reference**: See `/docs/api/` for endpoint documentation
4. **Contributing**: Read `CONTRIBUTING.md` to contribute

## Support

- **Issues**: https://github.com/yourusername/youtrack-mcp/issues
- **Discussions**: https://github.com/yourusername/youtrack-mcp/discussions
- **Documentation**: https://github.com/yourusername/youtrack-mcp/docs

## Quick Reference Card

```
# Connection
npm install           # Install dependencies
npm run build         # Build TypeScript
npm start             # Start server
npm test              # Run tests

# Environment
YOUTRACK_URL          # API endpoint
YOUTRACK_TOKEN        # Permanent token
DEBUG                 # Enable debug logs

# Common Commands
"List projects"                  # Query projects
"Create issue in PROJECT"        # Create issue
"Update PROJECT-123"             # Update issue
"Generate Gantt for PROJECT"     # Gantt chart
"Show sprints"                   # List sprints
"Log 2h to PROJECT-123"          # Time tracking
```

## What's Next?

- 📖 Read [Tool Reference](./tools/README.md) for detailed tool documentation
- 🎯 Check [Use Cases](./examples/README.md) for workflow examples
- 🛠️ See [Architecture](./ARCHITECTURE.md) for system design
- 🤝 Read [Contributing](../CONTRIBUTING.md) to contribute

Happy tracking! 🚀
