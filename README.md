# YouTrack MCP TypeScript Server

[![CI](https://github.com/itsalfredakku/youtrack-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/itsalfredakku/youtrack-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for YouTrack integration, providing a standardized interface for LLMs to interact with YouTrack's issue tracking, agile management, and knowledge base features.

## Features

- **Issue Management**
  - Create, read, update, delete issues
  - Add comments and attachments
  - Search issues with advanced filtering
  - Track issue time and estimation

- **Agile & Sprint Management**
  - Create and manage sprints
  - Assign issues to sprints
  - Track sprint progress

- **State Management & Workflows**
  - Transition issues through states
  - Start working on issues with automatic assignment
  - Complete issues with proper resolution

- **Knowledge Base Integration**
  - Create and manage articles
  - Link issues to knowledge base articles
  - Search knowledge base content

- **Project Management**
  - List and filter projects
  - Get project details and customization options

## Installation

```bash
# Clone the repository
git clone https://github.com/itsalfredakku/youtrack-mcp.git
cd youtrack-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Copy the example environment file and configure it with your YouTrack instance details:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration:

```properties
# YouTrack instance URL (without trailing slash)
YOUTRACK_URL=https://your-instance.youtrack.cloud

# YouTrack permanent token
# Generate from: Profile > Account Security > Tokens
YOUTRACK_TOKEN=your-permanent-token-here

# Optional: Default project ID
PROJECT_ID=PROJECT-1

# Optional: Enable webhooks (true/false)
ENABLE_WEBHOOKS=false

# Optional: Webhook server port (default: 3000)
WEBHOOK_PORT=3000

# Optional: Webhook secret for signature verification
WEBHOOK_SECRET=your-webhook-secret

# Optional: Log level (error, warn, info, debug)
LOG_LEVEL=info

# Optional: Cache TTL in milliseconds (default: 300000 = 5 minutes)
CACHE_TTL=300000

# Optional: Enable cache (true/false, default: true)
CACHE_ENABLED=true
```

## Usage

### Starting the Server

```bash
# Start the MCP server
npm start

# Start in development mode with auto-reload
npm run dev
```

### Interacting with the Server

The YouTrack MCP server exposes tools following the Model Context Protocol. LLM applications can discover and use these tools to interact with YouTrack.

#### Example: Creating an Issue

```json
{
  "tool": "create_issue",
  "params": {
    "projectId": "PROJECT-1",
    "summary": "Implement new feature",
    "description": "We need to implement the new feature as described in the specs.",
    "type": "Task",
    "priority": "Normal"
  }
}
```

#### Example: Searching Issues

```json
{
  "tool": "search_issues",
  "params": {
    "query": "project: PROJECT-1 #bug state: Open",
    "limit": 10
  }
}
```

#### Example: Starting Work on an Issue

```json
{
  "tool": "start_working_on_issue",
  "params": {
    "issueId": "PROJECT-1-123",
    "comment": "Starting implementation of this feature",
    "estimatedTime": "2d"
  }
}
```

## Available Tools

The server provides 60+ tools for interacting with YouTrack. Here are some of the most commonly used:

### Issue Management
- `create_issue` - Create a new issue
- `get_issue` - Get issue details
- `update_issue` - Update an issue
- `add_issue_comment` - Add a comment to an issue
- `search_issues` - Search for issues

### Agile & Sprint Management
- `list_sprints` - List all sprints
- `create_sprint` - Create a new sprint
- `assign_issue_to_sprint` - Add an issue to a sprint
- `get_sprint_issues` - Get all issues in a sprint

### State Management
- `start_working_on_issue` - Begin work on an issue
- `change_issue_state` - Change an issue's state
- `complete_issue` - Mark an issue as completed

### Knowledge Base
- `create_article` - Create a knowledge base article
- `update_article` - Update an article
- `get_article` - Get article details
- `search_articles` - Search knowledge base articles

### Project Management
- `list_projects` - List all accessible projects
- `get_project_details` - Get project information

## Development

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- A YouTrack instance with API access

### Development Workflow

```bash
# Install dependencies
npm install

# Start in development mode with auto-reload
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check

# Build the project
npm run build
```

### Project Structure

- `src/index.ts` - Main entry point
- `src/youtrack-client.ts` - YouTrack API client
- `src/tools/` - Individual MCP tool implementations
- `src/utils/` - Utility functions and helpers
- `src/types/` - TypeScript type definitions
- `src/config/` - Configuration management

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:queries
npm run test:issues
```

## Troubleshooting

### Common Issues

1. **Authentication errors**: Verify your YouTrack token has the necessary permissions and hasn't expired.

2. **Project not found**: Ensure the project ID exists and is accessible to your account.

3. **API rate limiting**: YouTrack may impose rate limits. Consider implementing retry logic for critical operations.

4. **State transition errors**: Some state transitions may be prohibited by your YouTrack workflow configuration.

### Logs

Logs are stored in the `logs` directory:

- `combined.log` - All log entries
- `error.log` - Error-level logs only

Set the `LOG_LEVEL` environment variable to control logging verbosity (error, warn, info, debug).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [YouTrack REST API](https://www.jetbrains.com/help/youtrack/standalone/api-reference.html)
- [Model Context Protocol (MCP)](https://github.com/microsoft/mcp)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)
