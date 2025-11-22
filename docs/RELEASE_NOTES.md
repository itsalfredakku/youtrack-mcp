# Release Notes - November 2025 Updates

## Version 1.0.0 - Production Ready

### Overview

The YouTrack MCP Server has reached production-ready status with comprehensive API coverage, full OpenAPI compliance, and enterprise-grade code quality. This release represents a major milestone with 80% coverage of YouTrack REST API and complete validation against official specifications.

---

## Recent Updates

### November 22, 2025 - Code Quality & Validation

#### ✅ ESLint Compliance
- **Fixed**: All 26 linting errors resolved
- **Impact**: 100% CI pipeline passing
- **Changes**:
  - Removed emojis from console log messages (CI compliance)
  - Cleaned up unused variables and imports
  - Simplified error handling patterns
  - Fixed lexical declaration scoping
  - Removed unused parameters from deprecated/stub methods

#### ✅ OpenAPI Specification Validation
- **Validated**: All 17 MCP tools against YouTrack 2025.2 OpenAPI 3.0.1 spec
- **Verified**: 
  - Endpoint paths and HTTP methods
  - Request parameters and body schemas
  - Response formats and status codes
  - Bundle types and custom field operations
- **Source**: https://youtrack.devstroop.com/api/openapi.json

---

### November 19, 2025 - Dynamic Configuration Fix

#### 🔧 Three-Tier Field Fetching Strategy
- **Problem**: Dynamic configuration failing to load custom field values
- **Solution**: Implemented fallback strategy:
  1. **Tier 1**: Extract from `fieldDefaults.bundle.values`
  2. **Tier 2**: Enumerate bundles by field type
  3. **Tier 3**: Fallback to project-specific field configuration
- **Results**: 
  - ✅ State: 12 values loaded
  - ✅ Priority: 5 values loaded
  - ✅ Type: 8 values loaded
- **Impact**: AI assistants now receive accurate field values from YOUR instance

---

### November 10, 2025 - Multi-Project Support

#### 🎯 Project Scoping Enhancement
- **Feature**: Optional `PROJECT_ID` environment variable
- **Behavior**:
  - When set: Automatically scopes all queries to specified project
  - When unset: Allows cross-project operations
- **Benefits**:
  - Prevents data leakage between projects
  - Simplifies configuration for single-project teams
  - Maintains flexibility for multi-project workflows

---

## Feature Highlights

### 🚀 Dynamic Configuration System

The server automatically adapts to your YouTrack customization:

```typescript
// On startup, the server fetches:
- Your actual State values (e.g., "Open", "In Progress", "Resolved")
- Your Priority values (e.g., "Critical", "High", "Normal", "Low")
- Your Issue Types (e.g., "Bug", "Feature", "Task", "Epic")
- Your custom field bundles and values

// This eliminates errors like:
❌ AI suggests: state: Open
✅ AI suggests: state: In Progress (your actual state)
```

**Benefits**:
- No configuration needed - works out of the box
- Always accurate suggestions for your instance
- Supports custom fields and workflows
- Updates automatically on server restart

### 📊 API Coverage: ~80%

**Implemented Domains** (12 of 15):
1. ✅ **Issues** - Full CRUD, comments, transitions, links
2. ✅ **Activities** - Complete audit trail and history tracking
3. ✅ **Commands** - Bulk operations on multiple issues
4. ✅ **Search** - Advanced query with auto-completion
5. ✅ **Saved Queries** - Persistent search management
6. ✅ **Projects** - Discovery, metadata, custom fields
7. ✅ **Agile Boards** - Sprints, boards, issue assignment
8. ✅ **Knowledge Base** - Articles, hierarchy, search
9. ✅ **Time Tracking** - Work items, logging, reports
10. ✅ **Users & Groups** - Team management
11. ✅ **Custom Fields** - Field and bundle management
12. ✅ **Analytics** - Gantt charts, critical path

**Not Yet Implemented** (3 of 15):
- ❌ VCS Integration (version control changes)
- ❌ Build Integrations (CI/CD links)
- ❌ Webhooks Management (event subscriptions)

### 🛠️ 17 MCP Tools Available

| Tool | Actions | Primary Use Cases |
|------|---------|-------------------|
| `issues` | 12 | Create, update, search, query, count, state changes |
| `activities` | 6 | Activity tracking, audit trail, history |
| `commands` | 2 | Bulk operations, silent execution |
| `search_assist` | 1 | Query auto-completion |
| `saved_queries` | 5 | Manage saved searches |
| `projects` | 4 | Project discovery and metadata |
| `agile_boards` | 6 | Board and sprint management |
| `knowledge_base` | 6 | Article management and search |
| `time_tracking` | 4 | Work item logging and reports |
| `analytics` | 6 | Gantt, critical path, resources |
| `custom_fields` | 14 | Field and bundle management |
| `users` | 3 | User and group management |
| `comments` | 3 | Issue comment management |
| `subscriptions` | 4 | Notification preferences |
| `admin` | 5 | System administration |
| `auth` | 5 | OAuth2 and token management |
| `query` | 1 | Native YouTrack query syntax |

---

## Configuration

### Recommended Setup

```bash
# .env file
YOUTRACK_URL=https://your-instance.youtrack.cloud
YOUTRACK_TOKEN=perm:your-permanent-token-here
PROJECT_ID=MYPROJECT          # Optional: scope to single project
LOG_LEVEL=info                # debug for troubleshooting
CACHE_ENABLED=true
CACHE_TTL=300000              # 5 minutes
```

### Important Notes

1. **URL Format**: Do NOT include `/api` suffix. The server adds this automatically.
   - ✅ Correct: `https://instance.youtrack.cloud`
   - ❌ Wrong: `https://instance.youtrack.cloud/api`

2. **Token Permissions**: Ensure your token has:
   - Issues: Read/Write
   - Projects: Read
   - Knowledge Base: Read/Write (if using KB features)
   - Agile: Read/Write (if using sprint features)
   - Time Tracking: Read/Write (if logging work)

3. **Project Scoping**: 
   - Set `PROJECT_ID` for single-project teams (recommended for security)
   - Leave unset for multi-project operations

---

## Validation Results

### OpenAPI Compliance Check ✅

**Date**: November 22, 2025  
**Specification**: YouTrack REST API v2025.2 (OpenAPI 3.0.1)  
**Status**: 100% Compliant

**Verified Components**:
- ✅ All endpoint paths match specification
- ✅ HTTP methods (GET, POST, PUT, DELETE) correct
- ✅ Request parameters validated
- ✅ Response schemas match
- ✅ Bundle types align with API
- ✅ Custom field operations correct
- ✅ Query syntax parameters validated

**Test Procedure**:
```bash
# Fetched official OpenAPI spec
curl https://youtrack.devstroop.com/api/openapi.json > spec.json

# Validated all 17 MCP tools against spec
# Confirmed endpoint paths, parameters, and responses
# Verified bundle types and field operations
```

### Code Quality Metrics ✅

**Date**: November 22, 2025  
**Status**: Production Ready

- ✅ **ESLint**: 0 errors, 0 warnings
- ✅ **TypeScript**: Strict mode, 0 compilation errors
- ✅ **Build**: Successful, dist output verified
- ✅ **CI Pipeline**: 100% passing
- ✅ **Test Coverage**: Unit and integration tests passing

---

## Migration Guide

### From Pre-November 2025 Versions

#### 1. Update URL Configuration

**Before**:
```bash
YOUTRACK_URL=https://instance.youtrack.cloud/api
```

**After**:
```bash
YOUTRACK_URL=https://instance.youtrack.cloud
```

The `/api` suffix is now added automatically.

#### 2. Update Client Configurations

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/absolute/path/to/youtrack-mcp/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "perm:your-token-here"
      }
    }
  }
}
```

**Key Changes**:
- Use `dist/index.js` instead of `build/index.js`
- Remove `/api` from URL
- Ensure absolute path to dist folder

#### 3. Rebuild and Restart

```bash
cd youtrack-mcp
npm run build
# Restart your MCP client (e.g., Claude Desktop)
```

---

## Known Issues & Limitations

### Current Limitations

1. **VCS Integration**: Not yet implemented
   - Workaround: Use YouTrack web UI for VCS change viewing

2. **Build Integrations**: Not yet implemented
   - Workaround: Use YouTrack web UI for CI/CD link management

3. **Webhook Management**: Not yet implemented
   - Workaround: Configure webhooks manually in YouTrack settings

### Performance Considerations

- **Large Projects**: For projects with >10,000 issues, use project scoping (`PROJECT_ID`)
- **Cache Settings**: Increase `CACHE_TTL` for read-heavy workloads
- **Rate Limiting**: YouTrack Cloud has rate limits; server implements exponential backoff

---

## Troubleshooting

### Common Issues

#### Issue: "401 Unauthorized"
**Cause**: Invalid or expired token  
**Solution**: 
1. Generate new permanent token in YouTrack
2. Ensure token has required permissions
3. Update `YOUTRACK_TOKEN` in configuration

#### Issue: "404 Not Found" on API calls
**Cause**: Incorrect URL configuration  
**Solution**: 
- Remove `/api` suffix from `YOUTRACK_URL`
- Ensure URL points to instance root

#### Issue: AI suggests wrong field values
**Cause**: Dynamic configuration not loaded  
**Solution**:
1. Check server logs for configuration loading
2. Verify token has read access to projects and custom fields
3. Restart server to reload configuration

#### Issue: Empty search results
**Cause**: Project scoping misconfiguration  
**Solution**:
- Verify `PROJECT_ID` matches actual project short name
- Check user has access to specified project
- Try without `PROJECT_ID` to test cross-project access

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug npm start
```

This will show:
- API request/response details
- Configuration loading process
- Cache hit/miss statistics
- Error stack traces

---

## What's Next

### Planned Features (Q1 2026)

1. **VCS Integration**
   - View commit history linked to issues
   - Browse code changes from MCP tools

2. **Build Integration**
   - Link CI/CD builds to issues
   - View build status in issue context

3. **Webhook Management**
   - Create and manage webhooks via MCP
   - Subscribe to real-time events

4. **Enhanced Analytics**
   - Burndown charts
   - Velocity tracking
   - Custom report generation

5. **Performance Optimizations**
   - Redis-based distributed caching
   - GraphQL support for efficient queries
   - Connection pooling

---

## Support & Community

- **GitHub Issues**: https://github.com/itsalfredakku/youtrack-mcp/issues
- **Documentation**: https://github.com/itsalfredakku/youtrack-mcp/tree/main/docs
- **MCP Documentation**: https://modelcontextprotocol.io

---

## Credits

**Development Team**: itsalfredakku  
**API Specification**: JetBrains YouTrack REST API v2025.2  
**Protocol**: Model Context Protocol (MCP) by Anthropic  
**License**: MIT

---

**Last Updated**: November 22, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
