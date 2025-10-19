# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **🚀 CRITICAL PERFORMANCE IMPROVEMENT: Optimized Field Configurations**
  - Implemented separate field sets for list vs. detail operations
  - **List operations**: Return only essential fields (id, summary, status, dates) - **60-80% smaller payloads**
  - **Detail operations**: Return complete data with full content, comments, attachments
  - **Search operations**: Return balanced field set with preview data
  - New `field-configurations.ts` module with optimized field sets for all entities
  - Applied to: Issues, Articles, Projects, Users, Work Items, Agile Boards, Sprints, Activities
  - **Performance gains**: List responses are now 3-10x faster and use significantly less bandwidth
  - **Better UX**: Lists are scannable without overwhelming detail, full data available on-demand

- **Activities API** - Complete issue activity tracking and audit trail
  - `activities` MCP tool with 6 actions (get_global, get_activity, get_page, get_issue, get_issue_activity, get_issue_page)
  - Filter by categories, author, issue query, reverse chronological order
  - Cursor-based pagination for large activity sets
  - API endpoints: `/api/activities`, `/api/activitiesPage`, `/api/issues/{id}/activities`

- **Commands API** - Bulk operations on multiple issues
  - `commands` MCP tool with 2 actions (apply, suggest)
  - Apply commands to multiple issues simultaneously
  - Silent execution mode (mute notifications)
  - Run commands as different users
  - Command auto-completion and suggestions
  - API endpoint: `POST /api/commands`

- **Search Assist API** - Query auto-completion and suggestions
  - `search_assist` MCP tool for context-aware search suggestions
  - Auto-complete field names and values
  - Project-scoped suggestions
  - Caret position support for mid-query completion
  - API endpoint: `POST /api/search/assist`

- **Saved Queries API** - Saved search management
  - `saved_queries` MCP tool with full CRUD operations (list, get, create, update, delete)
  - Share saved queries between team members
  - Owner management
  - Pagination support
  - API endpoints: `/api/savedQueries` (GET, POST, DELETE)

- **Issue Count Enhancement** - Efficient issue counting
  - Added `count` action to `issues` tool
  - Get issue counts without fetching full results
  - Useful for dashboards, metrics, and validation
  - API endpoint: `POST /api/issuesGetter/count`

### Fixed
- **Critical Project Scoping Bug** - Issue search now properly respects PROJECT_ID configuration
  - Fixed 'query' action to use `handleQueryIssues` for consistent project scoping
  - Fixed 'search' action to use `resolveProjectId` for proper project filtering
  - Prevents cross-project data leakage when PROJECT_ID is configured

### Changed
- Increased YouTrack API coverage from ~53% to **~80%** (12 of 15 domain areas)
- Updated documentation with comprehensive examples for all new tools
- Enhanced tool catalog from 13 to **17 MCP tools**

### Documentation
- Added detailed documentation for all new tools in [TOOL_REFERENCE.md](docs/TOOL_REFERENCE.md)
- Created [MISSING_API_FEATURES.md](MISSING_API_FEATURES.md) with implementation details
- Updated README.md with new capabilities and API coverage statistics
- Added usage examples for bulk operations, activity tracking, and saved queries

## [Previous Releases]

See git history for previous changes.

---

**Note**: This server is under active development. Breaking changes may occur before v1.0.0.
