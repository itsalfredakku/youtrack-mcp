# YouTrack MCP Server

A comprehensive **Model Context Protocol (MCP)** server that provides full YouTrack REST API access to AI agents like GitHub Copilot, Claude, and other MCP-compatible tools. This production-ready server enables complete project management, issue tracking, knowledge base management, and advanced project analytics.

## 🎯 **Enterprise-Ready Project Management**

**71 Professional Tools** for complete YouTrack integration, from basic issue management to advanced project analytics with Gantt charts, dependency management, and critical path analysis.

## ✨ **Key Capabilities**

### 🔧 **Core Issue Management**
- **Advanced Query Engine**: Both structured filters and raw YouTrack syntax
- **Complete CRUD Operations**: Create, read, update, delete issues with full metadata
- **Workflow Management**: State transitions, assignee management, priority handling
- **Bulk Operations**: Efficient batch processing for multiple issues
- **Smart Field Handling**: Dynamic custom field discovery and validation

### 📊 **Advanced Project Analytics** 
- **Gantt Charts**: Comprehensive timeline visualization with dependencies
- **Critical Path Analysis**: Project bottleneck identification and optimization
- **Resource Management**: Team workload analysis and conflict detection
- **Dependency Management**: Complex issue relationships with circular dependency prevention
- **Performance Metrics**: Project health scoring and optimization recommendations

### 📚 **Knowledge Base Management**
- **Article Creation**: Rich Markdown content with hierarchical organization
- **Content Discovery**: Advanced search, tagging, and categorization
- **Team Collaboration**: Article linking, commenting, and version control
- **Documentation Workflows**: Automated content organization and cross-referencing

### 🎯 **Epic & Milestone Tracking**
- **Strategic Planning**: Epic creation and management for large initiatives
- **Progress Monitoring**: Real-time completion tracking with risk assessment
- **Milestone Management**: Goal setting with success criteria and timeline analysis
- **Hierarchical Organization**: Multi-level project structure support

## 🚀 **Quick Start**

### **Prerequisites**
- **Node.js** v18+ and npm
- **YouTrack instance** (Cloud or Server) with API access
- **Permanent Token** with appropriate permissions

### **Installation**
```bash
# Clone the repository
git clone https://github.com/itsalfredakku/youtrack-mcp.git
cd youtrack-mcp-ts

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your YouTrack URL and token

# Build and start
npm run build
npm start
```

### **Quick Validation**
```bash
# Test connection and YouTrack query functionality
npm test

# Test specific query patterns
npm run test:queries
```

## ⚙️ **Configuration**

### **Environment Variables**

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `YOUTRACK_URL` | ✅ | YouTrack instance URL | - |
| `YOUTRACK_TOKEN` | ✅ | Permanent token for API access | - |
| `PROJECT_ID` | ❌ | Default project for simplified operations | - |
| `LOG_LEVEL` | ❌ | Logging verbosity (debug, info, warn, error) | `info` |
| `CACHE_ENABLED` | ❌ | Enable response caching | `true` |
| `CACHE_TTL` | ❌ | Cache time-to-live in milliseconds | `300000` |
| `ENABLE_WEBHOOKS` | ❌ | Enable real-time webhook notifications | `false` |
| `WEBHOOK_PORT` | ❌ | Port for webhook server | `3000` |

### **MCP Client Setup**

Add to your MCP client configuration (e.g., Claude Desktop, Cline):

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["path/to/youtrack-mcp-ts/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "perm:username.tokenname.tokenvalue",
        "PROJECT_ID": "PROJ-1"
      }
    }
  }
}
```

## 🛠️ **Available Tools** (71 Professional Tools)

### **🔍 Core Issue Management** (15 tools)
- `query_issues` - Basic YouTrack query syntax with performance optimization
- `advanced_query_issues` - Structured filtering with validation and caching
- `smart_search_issues` - AI-powered semantic search across content
- `create_issue` - Full-featured issue creation with custom fields
- `update_issue` - Comprehensive issue modification with field validation  
- `change_issue_state` - Workflow-aware state transitions
- `complete_issue` - One-click issue completion with automatic logging
- `start_working_on_issue` - Personal workflow management
- `get_my_active_issues` - Personal task dashboard
- `bulk_update_issues` - Efficient batch operations
- `get_issue_comments` - Comment thread management
- `add_issue_comment` - Rich Markdown comment creation
- `delete_issue_comment` - Comment lifecycle management
- `update_issue_comment` - Comment editing and versioning
- `get_issue_workflow_states` - Available state transitions

### **📊 Project Management & Analytics** (12 tools)
- `list_projects` - Project discovery and enumeration
- `validate_project` - Project access verification
- `get_project_status` - Comprehensive project health metrics
- `get_project_statistics` - Advanced analytics with time series data
- `get_project_issues_summary` - Issue distribution analysis
- `get_project_timeline` - Activity tracking and history
- `get_project_custom_fields` - Dynamic field discovery
- `discover_project_fields` - Automatic field schema detection
- `get_project_field_schema` - Structured field definitions
- `get_project_field_values` - Valid field value enumeration
- `compare_project_fields` - Cross-project field analysis
- `get_all_project_fields_summary` - Global field overview

### **🎯 Epic & Milestone Management** (6 tools)
- `create_epic` - Strategic initiative planning
- `create_milestone` - Goal setting with success criteria
- `assign_issues_to_milestone` - Milestone progress tracking
- `get_milestone_progress` - Timeline analysis with risk assessment
- `create_issue_dependency` - Simple dependency management
- `get_issue_dependencies` - Relationship analysis

### **📈 Advanced Project Analytics** (8 tools)
- `generate_gantt_chart` - Comprehensive timeline visualization
- `create_gantt_dependency` - Complex dependency relationships (FS/SS/FF/SF)
- `route_issue_dependencies` - Advanced dependency routing with impact analysis
- `route_multiple_dependencies` - Batch dependency processing
- `analyze_dependency_network` - Network topology analysis
- `calculate_critical_path` - Project bottleneck identification
- `get_enhanced_critical_path` - Advanced critical path analysis
- `analyze_resource_conflicts` - Team workload optimization

### **📚 Knowledge Base Management** (13 tools)
- `list_articles` - Content discovery and browsing
- `create_article` - Rich content creation with Markdown support
- `get_article` - Detailed article retrieval
- `update_article` - Content editing and versioning
- `delete_article` - Content lifecycle management
- `search_articles` - Advanced content search with filters
- `get_articles_by_tag` - Category-based content organization
- `create_article_group` - Batch content creation
- `get_article_hierarchy` - Content relationship mapping
- `get_sub_articles` - Hierarchical content navigation
- `link_sub_article` - Manual content linking
- `link_articles_with_fallback` - Robust content relationships
- `get_knowledge_base_stats` - Content analytics

### **👥 Team & Agile Management** (12 tools)
- `search_users` - Team member discovery
- `list_agile_boards` - Agile workspace enumeration
- `get_board_details` - Board configuration and metrics
- `list_sprints` - Sprint management and planning
- `get_sprint_details` - Sprint metrics and progress
- `get_sprint_progress` - Burndown analysis and velocity tracking
- `create_sprint` - Sprint planning and setup
- `assign_issue_to_sprint` - Sprint backlog management
- `remove_issue_from_sprint` - Sprint scope adjustment
- `log_work_time` - Time tracking with detailed logging
- `get_time_tracking_report` - Team productivity analysis
- `get_user_timesheet` - Individual time management

### **🔍 Query & Search Enhancement** (7 tools)
- `get_query_suggestions` - Query optimization assistance
- `find_redundant_comments` - Content quality management
- `bulk_delete_comments` - Content cleanup operations
- `get_resource_allocation` - Resource planning and analysis
- `get_critical_path` - Project path optimization
- `get_user_timesheet` - Personal productivity tracking
- Various field discovery and validation tools

## 💼 **Usage Examples**

### **Basic Issue Management**
```typescript
// Create a well-structured issue
create_issue({
  "summary": "Authentication timeout on mobile login",
  "description": "## Problem\nUsers report 30-second timeout...\n\n## Steps to Reproduce\n1. Open mobile app\n2. Enter credentials\n3. Wait 30 seconds",
  "type": "Bug",
  "priority": "High",
  "projectId": "PROJ-1"
})

// Update issue with proper field separation
update_issue({
  "issueId": "PROJ-123",
  "updates": {
    "state": "In Progress",
    "assignee": "john.doe", 
    "priority": "Critical",
    "description": "Updated with new findings..."
  }
})

// Advanced query with filters
advanced_query_issues({
  "projectId": "PROJ-1",
  "filters": [
    {"field": "state", "operator": "in", "value": ["Open", "Done"]},
    {"field": "priority", "operator": "equals", "value": "High"},
    {"field": "assignee", "operator": "equals", "value": "me"}
  ],
  "sorting": [{"field": "priority", "direction": "desc"}],
  "pagination": {"limit": 50}
})
```

### **Advanced Project Analytics**
```typescript
// Generate comprehensive Gantt chart
generate_gantt_chart({
  "projectId": "PROJ-1",
  "includeCriticalPath": true,
  "includeResources": true,
  "hierarchicalView": true,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
})

// Analyze project dependencies
analyze_dependency_network("PROJ-1")

// Track milestone progress
get_milestone_progress("milestone-id-123")
```

### **Knowledge Base Management**
```typescript
// Create structured documentation
create_article({
  "title": "API Integration Guidelines",
  "summary": "Complete guide for REST API integration best practices",
  "content": "## Overview\n\nThis guide covers...\n\n## Authentication\n\n### OAuth 2.0 Setup...",
  "tags": ["api", "documentation", "guidelines"],
  "projectId": "PROJ-1"
})

// Search content with filters
search_articles({
  "searchTerm": "authentication OAuth security",
  "tags": ["api", "security"],
  "includeContent": true
})
```

### **Team & Sprint Management**
```typescript
// Assign issues to sprint
assign_issue_to_sprint({
  "issueId": "PROJ-456",
  "sprintId": "184-21",
  "boardId": "181-20"
})

// Track team workload
get_resource_allocation({
  "projectId": "PROJ-1",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
})

// Log work time
log_work_time({
  "issueId": "PROJ-789",
  "duration": "4h 30m",
  "description": "Implemented OAuth authentication flow",
  "workType": "Development"
})
```

## 🏗️ **Architecture & Performance**

### **Smart Caching System**
- **Query Result Caching**: 60-second TTL with automatic cleanup
- **Field Schema Caching**: Dynamic field discovery with cache invalidation
- **Project Metadata Caching**: Reduces API calls for repeated operations

### **Advanced Query Engine** 
- **Structured Filters**: Type-safe filtering with validation
- **Performance Optimization**: Automatic field selection and pagination
- **Query Suggestions**: Built-in optimization recommendations
- **Error Prevention**: Invalid query detection before execution

### **Robust Error Handling**
- **Retry Logic**: Automatic retry with exponential backoff
- **Graceful Degradation**: Fallback strategies for API limitations
- **Detailed Logging**: Comprehensive operation tracking
- **User-Friendly Messages**: Clear error descriptions and solutions

## 🚀 **Production Features**

### **Enterprise Security**
- **Non-Admin API Access**: Works with standard user permissions
- **Token-Based Authentication**: Secure permanent token management
- **Permission Validation**: Automatic access level verification
- **Error Boundary Protection**: Graceful handling of permission errors

### **Scalability & Performance**
- **Concurrent Processing**: Parallel operations for bulk actions
- **Memory Management**: Intelligent cache cleanup and optimization
- **Connection Pooling**: Efficient HTTP connection reuse
- **Rate Limiting Awareness**: Built-in API throttling compliance

### **Monitoring & Observability**
- **Structured Logging**: JSON-formatted logs with contextual information
- **Performance Metrics**: Operation timing and success rate tracking
- **Health Checks**: Built-in connection and API status monitoring
- **Debug Support**: Comprehensive troubleshooting information

## 🔧 **Development & Testing**

### **Available Scripts**
```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm start              # Start production server

# Testing & Validation
npm run test           # Run query functionality tests
npm run test:queries   # Test YouTrack query patterns
npm run verify-build   # Verify build integrity

# Code Quality
npm run lint           # ESLint code analysis
npm run format         # Prettier code formatting
npm clean             # Clean build artifacts
```

### **Project Structure**
```
src/
├── index.ts              # MCP server entry point
├── youtrack-client.ts    # Core API client with 71 methods
├── tools.ts             # Tool definitions and schemas
├── config.ts            # Environment configuration
├── logger.ts            # Structured logging system
├── utils/
│   ├── advanced-query-engine.ts    # Structured query processing
│   └── gantt-chart-manager.ts      # Project analytics & visualization
├── custom-fields-manager.ts        # Dynamic field handling
├── field-manager.ts                # Project field schemas
└── __tests__/                      # Test suites
```

## 📚 **Documentation**

### **Additional Resources**
- **[Setup Guide](./SETUP.md)** - Detailed installation instructions
- **[Production Status](./docs/PRODUCTION_STATUS.md)** - Current feature status
- **[Enhancement Roadmap](./docs/ENHANCEMENT_ROADMAP.md)** - Future development plans
- **[API References](./docs/api-references.md)** - Technical API documentation

### **Support & Troubleshooting**

#### **Common Issues & Solutions**

**🔴 Invalid Query Errors (400)**
```
Error: YouTrack API Error (400): invalid_query
```
- **Cause**: Invalid YouTrack query syntax or unsupported field references
- **Solutions**:
  - Use `get_query_suggestions` tool to learn proper syntax
  - Avoid queries with states containing spaces (use "Open" not "In Progress") 
  - Validate project IDs with `validate_project` before querying
  - Use `discover_project_fields` to check available fields

**🔴 State Change Errors (400: Bad Request)**
```
Error: YouTrack API Error (400): Bad Request
Context: changeIssueState with newState: 'Fixed'
```
- **Cause**: Invalid state transitions or unavailable states in workflow
- **Solutions**:
  - Use `get_issue_workflow_states` to check available states for the issue
  - Common working states: "Open", "Done", "Resolved", "Closed"
  - Avoid custom states like "Fixed" - use "Done" or "Resolved" instead
  - Check project workflow configuration in YouTrack admin

**🔴 Time Logging Errors (403: Forbidden)**
```
Error: YouTrack API Error (403): Forbidden
Context: logWorkTime
```
- **Cause**: Insufficient permissions for time tracking
- **Solutions**:
  - Verify token has "Time Tracking" permissions in YouTrack
  - Check if time tracking is enabled for the project
  - Use lower-privilege operations or request permission upgrade
  - Time logging failures don't prevent issue completion

**🔴 Sprint Creation Errors (400: invalid_properties)**
```
Error: YouTrack API Error (400): invalid_properties
Context: createSprint
```
- **Cause**: Invalid sprint properties or board configuration
- **Solutions**:
  - Use `get_board_details` to check board configuration
  - Verify board ID exists and is accessible
  - Check date format (YYYY-MM-DD) and ensure start < finish
  - Ensure sprint name doesn't conflict with existing sprints

**🔴 Server Errors (500)**
```
Error: YouTrack API Error (500): server_error
```
- **Cause**: Server-side issues or invalid data submissions
- **Solutions**:
  - Check field values with `get_project_field_values`
  - Ensure required fields are provided for issue creation
  - Verify project permissions with `validate_project`
  - Retry operation after brief delay

**🔴 Project Not Found Errors**
```
Error: Project 'PROJECT-ID' not found
```
- **Cause**: Invalid project ID or insufficient permissions
- **Solutions**:
  - Use `list_projects` to see available projects
  - Check PROJECT_ID environment variable
  - Verify token has access to the project

**🔴 Tool Count Mismatch**
```
Logs show: "Discovered 71 tools" but README claims different number
```
- **Solution**: Tool count is now correctly updated to **71 tools**

#### **Best Practices**
- **Environment Issues**: Check token permissions and YouTrack connectivity
- **Query Failures**: Use `get_query_suggestions` for syntax help
- **Performance**: Enable caching and use pagination for large datasets
- **Field Errors**: Run `discover_project_fields` to validate available fields
- **State Changes**: Always use `get_issue_workflow_states` before changing states
- **Sprint Management**: Verify board access with `get_board_details` before creating sprints
- **Time Logging**: Check time tracking permissions; failures don't block issue completion
- **Issue Creation**: Validate project access and required fields before creation

#### **Workflow Tips**
**✅ Issue Completion Pattern:**
1. Use `change_issue_state` with "Done" instead of "Fixed"
2. If time logging fails (403), issue completion still succeeds
3. Check available states with `get_issue_workflow_states` first

**✅ Sprint Management Pattern:**
1. List boards with `list_agile_boards`
2. Get board details with `get_board_details` 
3. Verify sprint parameters before creation
4. Use standard date format (YYYY-MM-DD)

**✅ Permission Management:**
- Standard user tokens work for most operations
- Time tracking may require additional permissions
- Some advanced features need admin access

#### **Debug Steps**
1. **Connection Test**: `npm test`
2. **Project Validation**: Use `validate_project` tool
3. **Field Discovery**: Use `discover_project_fields` for available fields
4. **Workflow States**: Use `get_issue_workflow_states` to check valid transitions
5. **Board Access**: Use `get_board_details` to verify sprint creation permissions
6. **Permission Check**: Try basic operations before advanced features
7. **Error Pattern Analysis**: Check logs for specific error types (400 vs 403 vs 500)

#### **Common Error Patterns**

**Pattern: State Change Fallback**
```
❌ Failed to change issue to state: Fixed, trying next...
✅ Successfully changed issue to state: Done
```
- **Normal Behavior**: Server automatically tries alternative valid states
- **Solution**: Use standard states like "Done", "Resolved", "Closed"

**Pattern: Permission Escalation**
```
Error: YouTrack API Error (403): Forbidden (time logging)
✅ Successfully changed issue state (continues despite time log failure)
```
- **Normal Behavior**: Issue completion succeeds even if time logging fails
- **Solution**: Request time tracking permissions if needed, or ignore time log failures

**Pattern: Server Validation**
```
Error: YouTrack API Error (400): invalid_properties (sprint creation)
Error: YouTrack API Error (500): server_error (issue creation)
```
- **Solution**: Validate inputs with discovery tools before creation operations

## 🤝 **Contributing**

### **Development Setup**
1. Fork the repository
2. Install dependencies: `npm install`
3. Set up environment: Copy `.env.example` to `.env`
4. Run tests: `npm run test`
5. Submit pull request with comprehensive tests

### **Code Standards**
- **TypeScript**: Strict type checking enabled
- **ESLint**: Enforce code quality standards
- **Prettier**: Consistent code formatting
- **Testing**: Comprehensive test coverage for new features

## 📄 **License**

MIT License - see [LICENSE](./LICENSE) for details.

## 🏆 **Production Ready**

This YouTrack MCP Server is **production-ready** with:
- ✅ **71 Professional Tools** covering all YouTrack functionality
- ✅ **Enterprise Security** with non-admin API access patterns
- ✅ **Advanced Analytics** including Gantt charts and critical path analysis
- ✅ **Comprehensive Testing** with automated validation
- ✅ **Performance Optimization** with intelligent caching
- ✅ **Robust Error Handling** with detailed troubleshooting
- ✅ **Complete Documentation** for development and production use

**Status: 🎯 100% Feature Complete - Ready for Enterprise Deployment**
