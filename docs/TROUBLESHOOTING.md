# Troubleshooting Guide

## Quick Diagnostics

### Step 1: Check Server Status

```bash
LOG_LEVEL=debug npm start
```

Look for these key indicators:

✅ **Successful startup**:
```
[INFO] YouTrack MCP Server starting...
[INFO] Connected to YouTrack: https://instance.youtrack.cloud
[INFO] Dynamic configuration loaded:
  - States: 12 values
  - Priorities: 5 values
  - Types: 8 values
[INFO] MCP Server ready on stdio
```

❌ **Failed startup**:
```
[ERROR] Failed to connect to YouTrack
[ERROR] 401 Unauthorized
```

### Step 2: Verify Configuration

```bash
# Check environment variables
echo $YOUTRACK_URL
echo $YOUTRACK_TOKEN

# Verify .env file
cat .env
```

**Checklist**:
- [ ] `YOUTRACK_URL` is set (without `/api` suffix)
- [ ] `YOUTRACK_TOKEN` starts with `perm:`
- [ ] Token has not expired
- [ ] No trailing spaces in values

---

## Common Issues

### 1. Authentication Errors

#### Issue: "401 Unauthorized"

**Symptoms**:
```
[ERROR] 401 Unauthorized
[ERROR] Failed to authenticate with YouTrack
```

**Causes & Solutions**:

| Cause | Check | Solution |
|-------|-------|----------|
| Invalid token | Token format | Regenerate token in YouTrack → Profile → Authentication → Tokens |
| Expired token | Token age | Create new permanent token |
| Insufficient permissions | Token scope | Ensure token has required permissions (see below) |
| Wrong token type | Token prefix | Token must start with `perm:` |

**Required Token Permissions**:
- ✅ **Issues**: Read + Write
- ✅ **Projects**: Read
- ✅ **Knowledge Base**: Read + Write (if using KB features)
- ✅ **Agile**: Read + Write (if using sprint features)
- ✅ **Time Tracking**: Read + Write (if logging work)
- ✅ **Admin**: Read (for analytics features)

**How to Fix**:
1. Go to YouTrack → Profile → Authentication → Tokens
2. Click "New Token"
3. Name: "MCP Server"
4. Scope: Select "YouTrack" (full access)
5. Click "Create" and copy the token
6. Update `YOUTRACK_TOKEN` in `.env`
7. Restart the server

---

### 2. Connection Errors

#### Issue: "404 Not Found"

**Symptoms**:
```
[ERROR] 404 Not Found
[ERROR] GET https://instance.youtrack.cloud/api/api/admin/projects
```

**Notice**: Double `/api/api` in URL

**Cause**: Incorrect URL configuration with `/api` suffix

**Solution**:

❌ **Wrong**:
```bash
YOUTRACK_URL=https://instance.youtrack.cloud/api
```

✅ **Correct**:
```bash
YOUTRACK_URL=https://instance.youtrack.cloud
```

The server automatically adds the `/api` suffix.

#### Issue: "ECONNREFUSED" or "ETIMEDOUT"

**Symptoms**:
```
[ERROR] connect ECONNREFUSED
[ERROR] Cannot reach YouTrack server
```

**Causes & Solutions**:

1. **Network Issues**
   - Check internet connection
   - Verify VPN if required for company network
   - Test with: `curl https://your-instance.youtrack.cloud`

2. **Firewall Blocking**
   - Check corporate firewall rules
   - Verify no proxy settings needed
   - Contact IT if blocked

3. **Wrong URL**
   - Verify URL in browser first
   - Check for typos in domain name
   - Ensure HTTPS (not HTTP)

---

### 3. Dynamic Configuration Issues

#### Issue: AI Suggests Wrong Field Values

**Symptoms**:
- AI suggests `state: Open` but your instance uses `state: In Progress`
- Commands fail with "Invalid field value"
- No auto-completion for custom fields

**Causes & Solutions**:

1. **Configuration Not Loaded**

Check server logs for:
```
[INFO] Dynamic configuration loaded:
  - States: 0 values  ❌
  - Priorities: 0 values  ❌
  - Types: 0 values  ❌
```

**Solution**: Token missing read permissions for custom fields
```bash
# Regenerate token with admin read access
# Restart server to reload configuration
```

2. **Project-Specific Fields Not Visible**

**Solution**: Set `PROJECT_ID` to load project-specific fields
```bash
PROJECT_ID=MYPROJECT
```

3. **Cache Stale Data**

**Solution**: Restart server to reload fresh configuration
```bash
npm start
```

---

### 4. Search & Query Issues

#### Issue: Empty Search Results

**Symptoms**:
- Search returns no issues
- `count` returns 0
- Expected issues don't appear

**Causes & Solutions**:

1. **Project Scoping Too Restrictive**

Check if `PROJECT_ID` is set:
```bash
echo $PROJECT_ID
```

**Solution**: Remove or update `PROJECT_ID`
```bash
# Allow cross-project search
unset PROJECT_ID

# Or set to correct project
PROJECT_ID=CORRECT-PROJECT
```

2. **Query Syntax Error**

Test query in YouTrack web UI first:
```
state: Open assignee: me
```

If it works in UI but not MCP, check:
- Special characters are escaped
- Field names match exactly
- Values are valid for your instance

3. **Insufficient Permissions**

User may not have access to issues. Verify:
- User can see issues in web UI
- Token user has same permissions
- Project visibility settings allow access

#### Issue: Query Auto-Completion Not Working

**Symptoms**:
- No suggestions when typing queries
- Empty suggestion list
- Completion suggestions don't match your fields

**Solution**:
1. Ensure dynamic configuration loaded (check logs)
2. Verify token has read access to projects
3. Use `search_assist` tool explicitly
4. Restart server to reload configuration

---

### 5. MCP Client Integration Issues

#### Issue: Claude Desktop Not Connecting

**Symptoms**:
- Server not listed in Claude
- "Connection refused" errors
- Tools not available in Claude

**Solutions**:

1. **Check Configuration Path**

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Verify Configuration Format**

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/youtrack-mcp/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "perm:your-token"
      }
    }
  }
}
```

**Common mistakes**:
- ❌ Relative path in `args` → ✅ Use absolute path
- ❌ Wrong directory `build/` → ✅ Use `dist/`
- ❌ URL with `/api` → ✅ Remove `/api` suffix
- ❌ Missing token prefix → ✅ Include `perm:`

3. **Restart Claude Desktop**

After config changes:
- Quit Claude completely
- Reopen Claude
- Check Developer Console (if available)

4. **Test Server Directly**

```bash
cd /path/to/youtrack-mcp
YOUTRACK_URL=https://instance.youtrack.cloud \
YOUTRACK_TOKEN=perm:token \
node dist/index.js
```

If this works but Claude doesn't connect:
- Check Claude Developer Console for errors
- Verify Node.js version (18+ required)
- Check file permissions on dist/index.js

#### Issue: VSCode MCP Extension Not Working

**Solutions**:

1. **Check Workspace Settings**

`.vscode/settings.json`:
```json
{
  "mcp.servers": {
    "youtrack": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "perm:token"
      }
    }
  }
}
```

2. **Relative Path from Workspace Root**

Use `./dist/index.js` (relative) or absolute path.

3. **Reload VSCode Window**

Command Palette → "Developer: Reload Window"

---

### 6. Performance Issues

#### Issue: Slow Responses

**Symptoms**:
- Queries take >5 seconds
- Timeout errors
- CPU/memory usage high

**Solutions**:

1. **Enable Caching**

```bash
CACHE_ENABLED=true
CACHE_TTL=300000  # 5 minutes
```

2. **Increase Cache TTL**

For read-heavy workloads:
```bash
CACHE_TTL=900000  # 15 minutes
```

3. **Use Project Scoping**

For large instances:
```bash
PROJECT_ID=MYPROJECT  # Scope queries to one project
```

4. **Optimize Queries**

Instead of:
```
# Broad search returning 10,000 issues
state: Open
```

Use:
```
# Focused search returning 50 issues
state: Open assignee: me created: -7d
```

5. **Use Count Before Fetching**

Check result size first:
```json
{
  "tool": "issues",
  "action": "count",
  "query": "state: Open"
}
```

If count > 1000, refine query before fetching.

#### Issue: Memory Usage High

**Symptoms**:
- Node.js process using >500MB RAM
- System slowing down
- Out of memory errors

**Solutions**:

1. **Reduce Cache Size**

```bash
CACHE_TTL=60000  # 1 minute instead of 5
```

2. **Limit Query Results**

Use `$top` parameter:
```json
{
  "query": "state: Open",
  "limit": 100
}
```

3. **Restart Server Periodically**

For long-running servers, restart daily:
```bash
# In cron or systemd
0 3 * * * systemctl restart youtrack-mcp
```

---

### 7. Build & Development Issues

#### Issue: Build Fails

**Symptoms**:
```
npm run build
ERROR: Cannot find module...
```

**Solutions**:

1. **Clean and Rebuild**

```bash
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

2. **Check Node Version**

```bash
node --version  # Should be 18+
```

If too old:
```bash
nvm install 20
nvm use 20
```

3. **Check TypeScript Errors**

```bash
npm run type-check
```

Fix any type errors before building.

#### Issue: Tests Failing

**Symptoms**:
```
npm test
FAIL  src/__tests__/...
```

**Solutions**:

1. **Update Test Environment**

```bash
# Set test environment variables
export YOUTRACK_URL=https://test.youtrack.cloud
export YOUTRACK_TOKEN=perm:test-token
export NODE_ENV=test

npm test
```

2. **Run Specific Test Suite**

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

3. **Check Mock Data**

Ensure test fixtures match your YouTrack instance structure.

#### Issue: Linting Errors

**Symptoms**:
```
npm run lint
ERROR: ... is not allowed
```

**Solutions**:

1. **Auto-Fix**

```bash
npm run lint -- --fix
```

2. **Check ESLint Config**

Review `.eslintrc.json` for rules.

3. **Format Code**

```bash
npm run format
```

---

## Debug Mode

### Enable Detailed Logging

```bash
LOG_LEVEL=debug npm start
```

**Output includes**:
- HTTP request/response details
- API endpoint URLs
- Request/response bodies
- Cache hit/miss stats
- Full error stack traces
- Configuration loading steps

### Useful Debug Commands

```bash
# Test specific tool
echo '{"tool":"projects","action":"list"}' | npm start

# Check dynamic config loading
LOG_LEVEL=debug npm start 2>&1 | grep "configuration loaded"

# Monitor cache performance
LOG_LEVEL=debug npm start 2>&1 | grep "cache"

# Trace API calls
LOG_LEVEL=debug npm start 2>&1 | grep "GET\|POST\|PUT\|DELETE"
```

---

## Getting Help

### Before Asking for Help

Collect this information:

1. **Environment**:
   ```bash
   node --version
   npm --version
   cat .env | sed 's/TOKEN=.*/TOKEN=***/'
   ```

2. **Logs**:
   ```bash
   LOG_LEVEL=debug npm start 2>&1 | tee debug.log
   ```

3. **Configuration**:
   - MCP client config (with tokens redacted)
   - Build output
   - Test results

### Where to Get Help

1. **GitHub Issues**: https://github.com/itsalfredakku/youtrack-mcp/issues
   - Search existing issues first
   - Include debug logs and configuration
   - Redact sensitive information

2. **Documentation**:
   - [Getting Started Guide](GETTING_STARTED.md)
   - [Tool Reference](TOOL_REFERENCE.md)
   - [Architecture Overview](ARCHITECTURE.md)
   - [Release Notes](RELEASE_NOTES.md)

3. **MCP Community**:
   - Model Context Protocol documentation
   - Anthropic Claude community forums

---

## Preventive Maintenance

### Regular Checks

**Weekly**:
- [ ] Check for YouTrack updates
- [ ] Verify token hasn't expired
- [ ] Review error logs for patterns

**Monthly**:
- [ ] Update npm dependencies: `npm update`
- [ ] Run full test suite: `npm test`
- [ ] Verify all integrations working
- [ ] Review cache performance

**Quarterly**:
- [ ] Audit token permissions
- [ ] Review security best practices
- [ ] Update documentation
- [ ] Benchmark performance

### Health Monitoring

For production deployments:

```bash
# Health check endpoint (remote mode)
*/5 * * * * curl -f http://localhost:3001/health || alert

# Memory monitoring
watch -n 60 'ps aux | grep node.*youtrack-mcp'

# Log rotation
logrotate /var/log/youtrack-mcp.log
```

---

## Still Having Issues?

If you've followed this guide and still have problems:

1. **Create Minimal Reproduction**:
   - Fresh install in new directory
   - Minimal configuration
   - Single failing command

2. **Open GitHub Issue**:
   - Include debug logs
   - Share configuration (redacted)
   - Describe expected vs actual behavior
   - List troubleshooting steps already tried

3. **Include System Info**:
   ```bash
   node --version
   npm --version
   uname -a  # or systeminfo on Windows
   ```

---

**Last Updated**: November 22, 2025  
**Version**: 1.0.0
