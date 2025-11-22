import { BaseAPIClient } from '../base/base-client.js';
import { ResponseFormatter, type MCPResponse } from '../base/response-formatter.js';
import { logger } from '../../logger.js';
import { sanitizeDescription, sanitizeComment } from '../../utils/text-sanitizer.js';
import { IssueFields } from '../field-configurations.js';

export interface IssueCreateParams {
  summary: string;
  description?: string;
  type?: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  [key: string]: any;
}

export interface IssueUpdateParams {
  summary?: string;
  description?: string;
  state?: string;
  priority?: string;
  assignee?: string;
  type?: string;
  dueDate?: string;
  estimation?: number;
  subsystem?: string;
  tags?: string[];
  [key: string]: any;
}

export interface IssueQueryParams {
  query: string;
  fields?: string;
  limit?: number;
  skip?: number;
}

/**
 * Issues API Client - Handles all issue-related operations
 * Covers 32 endpoints from OpenAPI specification
 */
export class IssuesAPIClient extends BaseAPIClient {
  
  /**
   * Create a new issue
   */
  async createIssue(projectId: string, params: IssueCreateParams): Promise<MCPResponse> {
    try {
      const endpoint = `/issues`;
      
      // Accept either internal ID (e.g., 0-2) or shortName (e.g., MYDAPI)
      const isInternalId = /^\d+-\d+$/.test(projectId);
      const projectRef: any = { $type: 'Project' };
      if (isInternalId) {
        projectRef.id = projectId;
      } else {
        projectRef.shortName = projectId;
      }

      const issueData = {
        $type: 'Issue',
        project: projectRef,
        summary: params.summary,
        description: sanitizeDescription(params.description),
        ...this.buildCustomFields(params)
      };
      
      const response = await this.post(endpoint, issueData);
      const issueId = response.data.id;
      
      // Apply custom fields via commands after creation (more reliable)
      const commandFailures: string[] = [];
      if (issueId && (params.type || params.priority || params.state || params.assignee || params.subsystem)) {
        try {
          const failures = await this.applyCustomFieldsViaCommands(issueId, params);
          commandFailures.push(...failures);
        } catch (error) {
          logger.warn(`Issue ${issueId} created but failed to apply some custom fields:`, error);
          commandFailures.push(`Unexpected error applying custom fields: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Build response message with warnings if commands failed
      let message = `Issue "${params.summary}" created successfully`;
      if (commandFailures.length > 0) {
        message += `\n\n⚠️ WARNINGS - Some custom fields could not be applied:\n${commandFailures.map(f => `  • ${f}`).join('\n')}`;
        message += `\n\nThe issue was created (${issueId}) but you may need to set these fields manually in YouTrack.`;
        message += `\n\nCommon causes:\n  • Field value doesn't exist in the project (e.g., "Bug" or "Feature" not configured)\n  • Field is not available for this project\n  • Invalid value format`;
      }
      
      return ResponseFormatter.formatCreated(response.data, 'Issue', message);
    } catch (error: any) {
      // Check for common errors
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return ResponseFormatter.formatError(
          `Project ${projectId} not found. Please check the project ID.`,
          { projectId, summary: params.summary }
        );
      }
      
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        return ResponseFormatter.formatError(
          `You don't have permission to create issues in project ${projectId}.`,
          { projectId, action: 'create' }
        );
      }
      
      // Other errors
      return ResponseFormatter.formatError(
        error.message || String(error),
        { projectId, summary: params.summary, action: 'create' }
      );
    }
  }
  
  /**
   * Get issue by ID with full details
   */
  async getIssue(issueId: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/issues/${issueId}`;
      
      // Use detailed fields for single issue fetch
      const response = await this.get(endpoint, {
        fields: fields || IssueFields.DETAIL
      });
      
      return ResponseFormatter.formatSuccess(response.data, `Retrieved issue ${issueId}`);
    } catch (error: any) {
      // Check for 404 - issue not found
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return ResponseFormatter.formatError(
          `Issue ${issueId} does not exist or you don't have access to it.`,
          { 
            issueId, 
            suggestion: 'Check the issue ID or use the query tool to list available issues',
            hint: 'You can run a query like "project: PROJECTNAME" to see all issues in a project'
          }
        );
      }
      
      // Other errors
      return ResponseFormatter.formatError(
        error.message || String(error),
        { issueId, action: 'get' }
      );
    }
  }
  
  /**
   * Update an existing issue
   */
  async updateIssue(issueId: string, updates: IssueUpdateParams): Promise<MCPResponse> {
    // We'll split updates into: basic fields (summary/description), and custom field commands
    const basicFieldPayload: any = {};
    if (updates.summary) basicFieldPayload.summary = updates.summary;
    if (updates.description) basicFieldPayload.description = sanitizeDescription(updates.description);

    const commandParts: string[] = [];
    // Only push commands for fields provided (with colon syntax for enum fields)
    if (updates.state) commandParts.push(`State: ${updates.state}`);
    if (updates.priority) commandParts.push(`Priority: ${updates.priority}`);
    if (updates.type) commandParts.push(`Type: ${updates.type}`);
    if (updates.assignee) commandParts.push(`Assignee: ${updates.assignee}`);
    if (updates.subsystem) commandParts.push(`Subsystem: ${updates.subsystem}`);
    // Estimation is special – YouTrack uses command "Estimation 2h" etc.
    if (typeof updates.estimation === 'number') {
      // Convert minutes to YouTrack time syntax (e.g., 90 -> 1h 30m)
      const hours = Math.floor(updates.estimation / 60);
      const minutes = updates.estimation % 60;
      const estParts = [] as string[];
      if (hours) estParts.push(`${hours}h`);
      if (minutes) estParts.push(`${minutes}m`);
      const estimationStr = estParts.length ? estParts.join(' ') : '0m';
      commandParts.push(`Estimation ${estimationStr}`);
    }

    const commandErrors: string[] = [];
    // Apply each command individually for better error isolation
    for (const cmd of commandParts) {
      try {
        await this.applyCommand(issueId, cmd);
      } catch (err: any) {
        const msg = err?.message || String(err);
        commandErrors.push(`${cmd}: ${msg}`);
        logger.warn(`Failed to apply command to issue ${issueId}: ${cmd} -> ${msg}`);
      }
    }

    // Apply basic field updates via POST (YouTrack doesn't support PATCH for issues)
    if (Object.keys(basicFieldPayload).length > 0) {
      try {
        await this.post(`/issues/${issueId}`, { $type: 'Issue', ...basicFieldPayload });
      } catch (postErr) {
        logger.error(`Failed to update basic fields for issue ${issueId}: ${postErr}`);
        commandErrors.push(`Basic fields: ${(postErr as Error).message}`);
      }
    }

    // Tags handled via existing buildCustomFields logic (direct POST) if provided separately
    if (updates.tags && updates.tags.length > 0) {
      try {
        await this.post(`/issues/${issueId}`, { tags: updates.tags.map(t => ({ name: t })) });
      } catch (tagErr) {
        logger.warn(`Failed to update tags for issue ${issueId}: ${tagErr}`);
        commandErrors.push(`Tags: ${(tagErr as Error).message}`);
      }
    }

    // Fetch updated issue for final response
    let updatedIssue: any = null;
    try {
      const refreshed = await this.get(`/issues/${issueId}`, { fields: 'id,idReadable,summary,description,customFields(name,value(name)),project(shortName),tags(name)' });
      updatedIssue = refreshed.data;
    } catch (fetchErr) {
      logger.warn(`Could not fetch refreshed issue ${issueId}: ${fetchErr}`);
    }

    const meta: any = { appliedCommands: commandParts.length, commandErrorsCount: commandErrors.length };
    if (commandErrors.length) meta.commandErrors = commandErrors;

    return ResponseFormatter.formatUpdated(updatedIssue || { id: issueId }, 'Issue', updates, `Issue ${issueId} updated${commandErrors.length ? ' with partial errors' : ' successfully'}`, meta);
  }
  
  /**
   * Delete an issue
   */
  async deleteIssue(issueId: string): Promise<MCPResponse> {
    const endpoint = `/issues/${issueId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatDeleted(issueId, 'Issue');
  }
  
  /**
   * Query issues with YouTrack search syntax
   */
  async queryIssues(params: IssueQueryParams): Promise<MCPResponse> {
    try {
      const endpoint = `/issues`;
      
      const queryParams = {
        query: params.query,
        fields: params.fields || IssueFields.SEARCH, // Use optimized search fields
        $top: params.limit || 50,
        $skip: params.skip || 0
      };
      
      const response = await this.get(endpoint, queryParams);
      const issues = response.data || [];
      
      return ResponseFormatter.formatList(issues, 'issue', {
        totalCount: issues.length,
        filters: { query: params.query }
      });
    } catch (error: any) {
      // Check for query syntax errors
      if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        return ResponseFormatter.formatError(
          `Invalid query syntax: "${params.query}". Please check your search query.`,
          { 
            query: params.query,
            hint: 'Example queries: "project: MYPROJECT", "state: Open assignee: me", "#Bug"'
          }
        );
      }
      
      // Other errors
      return ResponseFormatter.formatError(
        error.message || String(error),
        { query: params.query, action: 'query' }
      );
    }
  }
  
  /**
   * Get issue comments
   */
  async getIssueComments(issueId: string): Promise<MCPResponse> {
    const endpoint = `/issues/${issueId}/comments`;
    
    const response = await this.get(endpoint, { fields: 'id,text,author(login,name),created,updated' });
    const comments = response.data || [];
    
    return ResponseFormatter.formatList(comments, 'comment', {
      totalCount: comments.length
    });
  }
  
  /**
   * Add comment to issue
   */
  async addComment(issueId: string, text: string): Promise<MCPResponse> {
    const endpoint = `/issues/${issueId}/comments`;
    
    const commentData = { 
      $type: 'IssueComment',
      text: sanitizeComment(text)
    };
    const response = await this.post(endpoint, commentData);
    
    return ResponseFormatter.formatCreated(response.data, 'Comment', 'Comment added successfully');
  }
  
  /**
   * Update existing comment
   */
  async updateComment(issueId: string, commentId: string, text: string): Promise<MCPResponse> {
    const endpoint = `/issues/${issueId}/comments/${commentId}`;
    
    const commentData = { 
      $type: 'IssueComment',
      text: sanitizeComment(text)
    };
    const response = await this.post(endpoint, commentData);
    return ResponseFormatter.formatUpdated(response.data, 'Comment', { text }, 'Comment updated successfully');
  }
  
  /**
   * Delete comment
   */
  async deleteComment(issueId: string, commentId: string): Promise<MCPResponse> {
    const endpoint = `/issues/${issueId}/comments/${commentId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatDeleted(commentId, 'Comment');
  }
  
  /**
   * Get issue links/dependencies
   */
  async getIssueLinks(issueId: string): Promise<MCPResponse> {
    const endpoint = `/issues/${issueId}/links`;
    
    const response = await this.get(endpoint, { 
      fields: 'id,direction,linkType(name,directed),issues(id,summary,state(name))' 
    });
    const links = response.data || [];
    
    return ResponseFormatter.formatList(links, 'link', {
      totalCount: links.length
    });
  }
  
  /**
   * Create issue dependency/link
   */
  async createIssueLink(sourceIssueId: string, targetIssueId: string, linkType: string = 'Depends'): Promise<MCPResponse> {
    const endpoint = `/issues/${sourceIssueId}/links`;
    
    const linkData = {
      $type: 'IssueLink',
      linkType: { 
        $type: 'IssueLinkType',
        name: linkType 
      },
      issues: [{ 
        $type: 'Issue',
        id: targetIssueId 
      }]
    };
    
    const response = await this.post(endpoint, linkData);
    return ResponseFormatter.formatCreated(response.data, 'Issue Link', `Dependency created: ${sourceIssueId} depends on ${targetIssueId}`);
  }

  /**
   * Link issues using command API (recommended approach per YouTrack docs).
   * Accepts natural language link phrases such as "relates to", "subtask of", or "parent for".
   */
  async linkIssues(issueId: string, targetIssueId: string, linkCommand: string = 'relates to'): Promise<MCPResponse> {
    const trimmedCommand = (linkCommand || 'relates to').trim().replace(/\s+/g, ' ');
    const trimmedTarget = targetIssueId.trim();
    const commandQuery = `${trimmedCommand} ${trimmedTarget}`;

    const commandResult = await this.applyCommand(issueId, commandQuery);

    return ResponseFormatter.formatSuccess({
      issueId,
      targetIssueId: trimmedTarget,
      command: commandQuery,
      commandResult
    }, `Linked ${issueId} to ${trimmedTarget} using '${trimmedCommand}'`);
  }
  
  /**
   * Delete issue link
   */
  async deleteIssueLink(issueId: string, linkId: string): Promise<MCPResponse> {
    const endpoint = `/issues/${issueId}/links/${linkId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatDeleted(linkId, 'Issue Link');
  }
  
  /**
   * @deprecated Use WorkItemsAPIClient.getWorkItems() instead
   * Get issue work items (time tracking)
   * NOTE: This endpoint doesn't exist in YouTrack API. Use /workItems with query parameter instead.
   */
  async getIssueWorkItems(issueId: string): Promise<MCPResponse> {
    return ResponseFormatter.formatError(
      'This method is deprecated. Use client.workItems.getWorkItems(issueId) instead.',
      { 
        issueId,
        suggestion: 'Use the time_tracking tool with action "get_work_items" or call client.workItems.getWorkItems(issueId)'
      }
    );
  }
  
  /**
   * @deprecated Use WorkItemsAPIClient.logTimeToIssue() instead
   * Add work item (log time) to issue
   * NOTE: This endpoint doesn't exist in YouTrack API. Use /workItems POST instead.
   */
  async addWorkItem(issueId: string, duration: string): Promise<MCPResponse> {
    return ResponseFormatter.formatError(
      'This method is deprecated. Use client.workItems.logTimeToIssue() instead.',
      { 
        issueId,
        duration,
        suggestion: 'Use the time_tracking tool with action "log_time" or call client.workItems.logTimeToIssue(issueId, duration, description, date, workType)'
      }
    );
  }
  
  /**
   * Get issue attachments
   */
  async getIssueAttachments(issueId: string): Promise<MCPResponse> {
    const endpoint = `/issues/${issueId}/attachments`;
    
    const response = await this.get(endpoint, {
      fields: 'id,name,size,created,author(login,name),mimeType'
    });
    const attachments = response.data || [];
    
    return ResponseFormatter.formatList(attachments, 'attachment', {
      totalCount: attachments.length
    });
  }
  
  /**
   * Get available workflow states for issue
   */
  async getIssueStates(issueId: string): Promise<MCPResponse> {
    try {
      // Get the issue to find its project
      const issueResponse = await this.get(`/issues/${issueId}`, {
        fields: 'id,project(shortName),customFields(name,value(name),$type)'
      });
      
      const issue = issueResponse.data;
      const projectId = issue.project?.shortName;
      const currentState = issue.customFields?.find((f: any) => f.name === 'State')?.value?.name;
      
      if (!projectId) {
        return ResponseFormatter.formatError('Could not determine project for issue', `Issue ${issueId}`);
      }

      // Get project-specific State field values
      const projectResponse = await this.get(`/admin/projects/${projectId}`, {
        fields: 'customFields(field(name),bundle(values(name,isResolved)))'
      });

      const customFields = projectResponse.data.customFields || [];
      const stateField = customFields.find((f: any) => f.field?.name === 'State');
      
      if (!stateField || !stateField.bundle || !stateField.bundle.values) {
        return ResponseFormatter.formatError(`No State field found for project ${projectId}`, `Issue ${issueId}`);
      }

      const availableStates = stateField.bundle.values.map((v: any) => ({
        name: v.name,
        isResolved: v.isResolved || false,
        isCurrent: v.name === currentState
      }));

      return ResponseFormatter.formatSuccess({
        projectId,
        currentState,
        availableStates,
        stateCount: availableStates.length
      }, `Found ${availableStates.length} available states for project ${projectId}`);
      
    } catch (error) {
      logger.error('Failed to get issue states', error);
      return ResponseFormatter.formatError(
        error instanceof Error ? error.message : String(error),
        `Failed to get states for issue ${issueId}`
      );
    }
  }
  
  /**
   * Get available field values for a project (Type, Priority, State, etc.)
   * This helps users/assistants discover what values are valid before creating/updating issues
   * 
   * @param projectId - Project ID or shortName (e.g., "MYPROJECT" or "0-2")
   * @param fieldName - Field name (e.g., "Type", "Priority", "State")
   * @returns MCPResponse with available values (sorted by ordinal, with localization support)
   * 
   * @example
   * // Get available Type values for SoftEtherZig project
   * const types = await client.getProjectFieldValues('SoftEtherZig', 'Type');
   * // Returns: Task, Milestone, Subtask (sorted by ordinal)
   */
  async getProjectFieldValues(projectId: string, fieldName: string = 'Type'): Promise<MCPResponse> {
    try {
      // Get the project's custom fields with comprehensive field projection based on OpenAPI spec
      // Includes: localizedName (i18n), ordinal (ordering), fieldType (type identification), isResolved (for states)
      const fieldsResponse = await this.get(
        `/admin/projects/${projectId}/customFields?fields=field($type,fieldType($type,id,valueType),id,localizedName,name),bundle($type,id,values(name,localizedName,description,color($type,background,foreground,id),ordinal,isResolved))`
      );
      
      // Find the specific field
      const targetField = fieldsResponse.data?.find((f: any) => 
        f.field?.name === fieldName
      );
      
      if (!targetField) {
        return ResponseFormatter.formatError(
          `Field "${fieldName}" not found in project ${projectId}`,
          { projectId, fieldName, availableFields: fieldsResponse.data?.map((f: any) => f.field?.name).filter(Boolean) }
        );
      }
      
      if (!targetField.bundle?.values) {
        return ResponseFormatter.formatError(
          `Field "${fieldName}" has no available values configured`,
          { projectId, fieldName }
        );
      }
      
      // Sort values by ordinal (respects YouTrack's ordering)
      const sortedValues = [...targetField.bundle.values].sort((a: any, b: any) => {
        const ordinalA = a.ordinal ?? Number.MAX_SAFE_INTEGER;
        const ordinalB = b.ordinal ?? Number.MAX_SAFE_INTEGER;
        return ordinalA - ordinalB;
      });
      
      // Extract value information with localization and full metadata
      const values = sortedValues.map((v: any) => ({
        name: v.name,
        localizedName: v.localizedName || null, // For i18n support
        description: v.description || null,
        ordinal: v.ordinal ?? null, // For ordering
        isResolved: v.isResolved ?? null, // For state fields (resolved vs. open)
        color: v.color ? {
          background: v.color.background,
          foreground: v.color.foreground
        } : null
      }));
      
      // Use localizedName when available, fall back to name
      const valueNames = sortedValues.map((v: any) => v.localizedName || v.name).filter(Boolean);
      
      return ResponseFormatter.formatSuccess({
        projectId,
        fieldName: targetField.field?.localizedName || targetField.field?.name,
        fieldType: targetField.field?.fieldType?.valueType || targetField.bundle?.$type,
        bundleType: targetField.bundle?.$type, // EnumBundle, StateBundle, etc.
        values,
        valueCount: values.length,
        // Quick list of just the names (localized when available)
        valueNames
      }, `Found ${values.length} values for ${fieldName} in project ${projectId}: ${valueNames.join(', ')}`);
      
    } catch (error) {
      logger.error(`Failed to get field values for ${fieldName} in project ${projectId}`, error);
      return ResponseFormatter.formatError(
        error instanceof Error ? error.message : String(error),
        { projectId, fieldName }
      );
    }
  }
  
  /**
   * Change issue state with workflow validation
   */
  async changeIssueState(issueId: string, newState: string, comment?: string, resolution?: string): Promise<MCPResponse> {
    try {
      // Use commands API to change state with colon syntax
      const command = `State: ${newState}`;
      
      await this.applyCommand(issueId, command);
      
      // Add comment separately if provided
      if (comment) {
        try {
          await this.addComment(issueId, comment);
        } catch (commentErr) {
          logger.warn(`State changed but failed to add comment: ${commentErr}`);
        }
      }
      
      return ResponseFormatter.formatUpdated(
        { id: issueId }, 
        'Issue', 
        { state: newState, resolution }, 
        `Issue ${issueId} moved to ${newState}${resolution ? ' (' + resolution + ')' : ''}`
      );
    } catch (error) {
      return ResponseFormatter.formatError(
        error instanceof Error ? error.message : String(error),
        `Failed to change state of issue ${issueId}`
      );
    }
  }
  
  /**
   * Get issue history/activities
   */
  async getIssueActivities(issueId: string): Promise<MCPResponse> {
    const endpoint = `/issues/${issueId}/activities`;
    
    const response = await this.get(endpoint, {
      fields: 'id,timestamp,author(login,name),field(name),oldValue,newValue,targetMember'
    });
    const activities = response.data || [];
    
    return ResponseFormatter.formatList(activities, 'activity', {
      totalCount: activities.length
    });
  }
  
  /**
   * Parse duration string to minutes for YouTrack API
   */
  private parseDuration(duration: string): number {
    const durationStr = duration.toLowerCase().trim();
    
    // Handle various formats: "2h 30m", "1d", "45m", "1.5h"
    let totalMinutes = 0;
    
    // Days
    const daysMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*d/);
    if (daysMatch) {
      totalMinutes += parseFloat(daysMatch[1]) * 8 * 60; // 8 hours per day
    }
    
    // Hours
    const hoursMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*h/);
    if (hoursMatch) {
      totalMinutes += parseFloat(hoursMatch[1]) * 60;
    }
    
    // Minutes
    const minutesMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*m/);
    if (minutesMatch) {
      totalMinutes += parseFloat(minutesMatch[1]);
    }
    
    // If no units found, assume minutes
    if (totalMinutes === 0) {
      const numberMatch = durationStr.match(/(\d+(?:\.\d+)?)/);
      if (numberMatch) {
        totalMinutes = parseFloat(numberMatch[1]);
      }
    }
    
    return Math.max(1, Math.round(totalMinutes)); // At least 1 minute
  }
  
  /**
   * Build custom fields object from parameters
   * Using minimal approach to avoid any $type conflicts
   */
  private buildCustomFields(params: any): any {
    const result: any = {};
    
    // Only handle tags with verified structure
    if (params.tags && params.tags.length > 0) {
      result.tags = params.tags.map((tag: string) => ({ 
        name: tag  // Simplified - remove $type for now
      }));
    }
    
    return result;
  }

  /**
   * Apply custom fields to an issue using commands (more reliable than direct API)
   * @returns Array of error messages for failed commands (empty if all succeeded)
   */
  private async applyCustomFieldsViaCommands(issueId: string, params: any): Promise<string[]> {
    const commands: string[] = [];
    
    // YouTrack command syntax: "FieldName: Value" or "FieldName Value" depending on the field
    // For enum fields (Type, Priority, State), use colon syntax
    if (params.type) {
      commands.push(`Type: ${params.type}`);
    }
    
    if (params.priority) {
      commands.push(`Priority: ${params.priority}`);
    }
    
    if (params.state) {
      commands.push(`State: ${params.state}`);
    }
    
    if (params.assignee) {
      commands.push(`Assignee: ${params.assignee}`);
    }
    
    if (params.subsystem) {
      commands.push(`Subsystem: ${params.subsystem}`);
    }
    
    const failures: string[] = [];
    
    // Apply commands one by one
    for (const command of commands) {
      try {
        await this.applyCommand(issueId, command);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to apply command "${command}" to issue ${issueId}: ${errorMsg}`);
        
        // Enhance error message with available values for Type and Priority fields
        let enhancedError = `"${command}" failed: ${errorMsg}`;
        
        // Try to fetch available values to help the user
        try {
          if (command.startsWith('Type:')) {
            const availableTypes = await this.getAvailableFieldValues(issueId, 'Type');
            if (availableTypes.length > 0) {
              enhancedError += `\n    Available Type values: ${availableTypes.join(', ')}`;
            }
          } else if (command.startsWith('Priority:')) {
            const availablePriorities = await this.getAvailableFieldValues(issueId, 'Priority');
            if (availablePriorities.length > 0) {
              enhancedError += `\n    Available Priority values: ${availablePriorities.join(', ')}`;
            }
          }
        } catch (fetchError) {
          // If we can't fetch available values, just use the original error
          logger.debug(`Could not fetch available field values: ${fetchError}`);
        }
        
        failures.push(enhancedError);
      }
    }
    
    return failures;
  }

  /**
   * Get available values for a field (Type, Priority, State, etc.) for a specific issue's project
   * Uses localized names when available and respects field value ordering
   * @private
   */
  private async getAvailableFieldValues(issueId: string, fieldName: string): Promise<string[]> {
    try {
      // First, get the issue to find its project
      const issueResponse = await this.get(`/issues/${issueId}?fields=id,project(id,shortName)`);
      const projectId = issueResponse.data.project?.id || issueResponse.data.project?.shortName;
      
      if (!projectId) {
        return [];
      }
      
      // Get the project's custom fields with localization and ordering support
      const fieldsResponse = await this.get(`/admin/projects/${projectId}/customFields?fields=field(name),bundle(values(name,localizedName,ordinal))`);
      
      // Find the specific field (Type, Priority, etc.)
      const targetField = fieldsResponse.data?.find((f: any) => 
        f.field?.name === fieldName
      );
      
      if (!targetField?.bundle?.values) {
        return [];
      }
      
      // Sort by ordinal if available
      const sortedValues = [...targetField.bundle.values].sort((a: any, b: any) => {
        const ordinalA = a.ordinal ?? Number.MAX_SAFE_INTEGER;
        const ordinalB = b.ordinal ?? Number.MAX_SAFE_INTEGER;
        return ordinalA - ordinalB;
      });
      
      // Use localizedName when available, fall back to name
      return sortedValues.map((v: any) => v.localizedName || v.name).filter(Boolean);
    } catch (error) {
      logger.debug(`Failed to fetch available values for ${fieldName}: ${error}`);
      return [];
    }
  }

  /**
   * Apply a command to an issue
   */
  private async applyCommand(issueId: string, command: string): Promise<any> {
    // YouTrack commands API expects the query and issues array
    const endpoint = `/commands`;
    const response = await this.post(endpoint, {
      query: command,
      issues: [{ idReadable: issueId }]
    });
    return response.data;
  }

  /**
   * Smart search issues with advanced filtering
   */
  async smartSearchIssues(searchQuery: string, options: { projectId?: string } = {}): Promise<MCPResponse> {
    const query = options.projectId 
      ? `project: ${options.projectId} ${searchQuery}` 
      : searchQuery;
    
    return this.queryIssues({ query });
  }

  /**
   * Complete an issue (set to Done state with comment)
   */
  async completeIssue(issueId: string, comment?: string): Promise<MCPResponse> {
    return this.changeIssueState(issueId, 'Fixed', comment, 'Fixed');
  }

  /**
   * Start working on an issue
   */
  async startWorkingOnIssue(issueId: string, comment?: string): Promise<MCPResponse> {
    return this.changeIssueState(issueId, 'In Progress', comment);
  }

  /**
   * Move issue to another project
   */
  async moveIssueToProject(issueId: string, targetProjectId: string, comment?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/issues/${issueId}/project?fields=id,idReadable,summary,project(id,name,shortName)`;
      
      // Determine if targetProjectId is internal ID or shortName
      const isInternalId = /^\d+-\d+$/.test(targetProjectId);
      const projectRef: any = { $type: 'Project' };
      
      if (isInternalId) {
        projectRef.id = targetProjectId;
      } else {
        projectRef.shortName = targetProjectId;
      }

      const response = await this.post(endpoint, projectRef);

      // Optionally add a comment about the move
      if (comment) {
        try {
          await this.post(`/issues/${issueId}/comments`, {
            text: `Moved to project ${targetProjectId}. ${comment}`
          });
        } catch (err) {
          console.warn('Failed to add comment after moving issue:', err);
        }
      }

      return ResponseFormatter.formatSuccess(
        response.data,
        `Issue ${issueId} successfully moved to project ${targetProjectId}`
      );

    } catch (error: any) {
      if (error.response?.status === 404) {
        return ResponseFormatter.formatError(
          `Issue ${issueId} or project ${targetProjectId} not found.`,
          { issueId, targetProjectId }
        );
      }
      
      if (error.response?.status === 403) {
        return ResponseFormatter.formatError(
          `You don't have permission to move issue ${issueId} to project ${targetProjectId}.`,
          { issueId, targetProjectId, action: 'move' }
        );
      }

      return ResponseFormatter.formatError(
        `Failed to move issue: ${error.message}`,
        { issueId, targetProjectId, action: 'move' }
      );
    }
  }

  // ==================== WATCHER OPERATIONS ====================

  /**
   * Get issue watchers
   */
  async getIssueWatchers(issueId: string): Promise<MCPResponse> {
    try {
      const endpoint = `/issues/${issueId}/watchers`;
      const params = {
        fields: 'hasStar,issueWatchers(user(id,login,fullName,email,avatarUrl))'
      };

      const response = await this.get(endpoint, params);
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved watchers for issue ${issueId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to get watchers: ${error.message}`,
        { issueId, action: 'get_watchers' }
      );
    }
  }

  /**
   * Add watcher to issue
   */
  async addWatcher(issueId: string, userId: string): Promise<MCPResponse> {
    try {
      const endpoint = `/issues/${issueId}/watchers`;
      const data = {
        issueWatchers: [
          {
            user: { id: userId }
          }
        ]
      };

      const response = await this.post(endpoint, data);
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Added user ${userId} as watcher to issue ${issueId}`
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        return ResponseFormatter.formatError(
          `Issue ${issueId} or user ${userId} not found.`,
          { issueId, userId, action: 'add_watcher' }
        );
      }

      return ResponseFormatter.formatError(
        `Failed to add watcher: ${error.message}`,
        { issueId, userId, action: 'add_watcher' }
      );
    }
  }

  /**
   * Remove watcher from issue
   */
  async removeWatcher(issueId: string, userId: string): Promise<MCPResponse> {
    try {
      const endpoint = `/issues/${issueId}/watchers/${userId}`;

      await this.delete(endpoint);
      
      return ResponseFormatter.formatSuccess(
        { issueId, userId },
        `Removed user ${userId} from watchers of issue ${issueId}`
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        return ResponseFormatter.formatError(
          `Issue ${issueId}, user ${userId}, or watcher relationship not found.`,
          { issueId, userId, action: 'remove_watcher' }
        );
      }

      return ResponseFormatter.formatError(
        `Failed to remove watcher: ${error.message}`,
        { issueId, userId, action: 'remove_watcher' }
      );
    }
  }

  /**
   * Toggle star (watch) for current user
   */
  async toggleStar(issueId: string): Promise<MCPResponse> {
    try {
      // First, get current star status
      const currentStatus = await this.get(`/issues/${issueId}/watchers`, {
        fields: 'hasStar'
      });

      const hasStar = currentStatus.data?.hasStar || false;
      const endpoint = `/issues/${issueId}/watchers`;

      if (!hasStar) {
        // Add star
        await this.post(endpoint, { hasStar: true });
        return ResponseFormatter.formatSuccess(
          { issueId, hasStar: true },
          `Added star to issue ${issueId}`
        );
      } else {
        // Remove star
        await this.post(endpoint, { hasStar: false });
        return ResponseFormatter.formatSuccess(
          { issueId, hasStar: false },
          `Removed star from issue ${issueId}`
        );
      }
    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to toggle star: ${error.message}`,
        { issueId, action: 'toggle_star' }
      );
    }
  }

  /**
   * Get count of issues matching query
   * 
   * @param query - Issue search query
   * @returns Count of matching issues
   */
  async getIssueCount(query: string): Promise<MCPResponse> {
    try {
      const response = await this.post('/issuesGetter/count', { query });
      const count = response.data?.count ?? 0;
      
      return ResponseFormatter.formatSuccess(
        { count, query },
        `Found ${count} issues matching query`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to get issue count: ${error.message}`,
        { query }
      );
    }
  }
}
