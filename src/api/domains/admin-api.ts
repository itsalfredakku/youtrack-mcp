import { BaseAPIClient, MCPResponse } from '../base/base-client.js';
import { ResponseFormatter } from '../base/response-formatter.js';
import { FieldSelector } from '../../utils/field-selector.js';
import { PerformanceMonitor } from '../../utils/performance-monitor.js';

export interface ProjectCreateParams {
  name: string;
  shortName: string;
  description?: string;
  lead?: string;
  startingNumber?: number;
  template?: string;
}

export interface UserCreateParams {
  login: string;
  fullName: string;
  email: string;
  password?: string;
  groups?: string[];
  banned?: boolean;
}

export interface GroupCreateParams {
  name: string;
  description?: string;
  autoJoin?: boolean;
  teamForProject?: string;
}

export interface CustomFieldParams {
  name: string;
  type: 'string' | 'integer' | 'float' | 'date' | 'period' | 'user' | 'group' | 'enum' | 'state' | 'build' | 'version';
  isPrivate?: boolean;
  defaultValues?: string[];
  canBeEmpty?: boolean;
  emptyFieldText?: string;
}

/**
 * Admin API Client - Handles administrative operations
 * Covers user management, system configuration, and advanced operations
 */
export class AdminAPIClient extends BaseAPIClient {

  // ==================== PROJECT ADMINISTRATION ====================

  /**
   * Create a new project
   */
  async createProject(params: ProjectCreateParams): Promise<MCPResponse> {
    const endpoint = '/admin/projects';
    
    const projectData = {
      name: params.name,
      shortName: params.shortName,
      description: params.description || '',
      leader: params.lead ? { login: params.lead } : undefined,
      startingNumber: params.startingNumber || 1,
      template: params.template ? { name: params.template } : undefined
    };

    const response = await this.post(endpoint, projectData);
    return ResponseFormatter.formatCreated(response.data, 'Project', `Project "${params.name}" (${params.shortName}) created successfully`);
  }

  /**
   * Get all projects with administrative details
   */
  async getAllProjects(includeArchived: boolean = false): Promise<MCPResponse> {
    const endpoint = '/admin/projects';
    const params = {
      fields: 'id,name,shortName,description,archived,leader(login,name),createdBy(login),created,issues,customFields(field(name))',
      archived: includeArchived
    };

    const response = await this.get(endpoint, params);
    const projects = response.data || [];

    return ResponseFormatter.formatList(projects, 'project', {
      totalCount: projects.length,
      filters: { includeArchived }
    });
  }

  /**
   * Update project settings
   */
  async updateProject(projectId: string, updates: Partial<ProjectCreateParams>): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}`;
    
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.lead) updateData.leader = { login: updates.lead };

    const response = await this.post(endpoint, updateData);
    return ResponseFormatter.formatUpdated(response.data, 'Project', updates, `Project ${projectId} updated successfully`);
  }

  /**
   * Delete/archive project
   */
  async deleteProject(projectId: string, archive: boolean = true): Promise<MCPResponse> {
    if (archive) {
      const endpoint = `/admin/projects/${projectId}`;
      const response = await this.post(endpoint, { archived: true });
      return ResponseFormatter.formatUpdated(response.data, 'Project', { archived: true }, `Project ${projectId} archived successfully`);
    } else {
      const endpoint = `/admin/projects/${projectId}`;
      await this.delete(endpoint);
      return ResponseFormatter.formatDeleted(projectId, 'Project');
    }
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Create new user account
   */
  async createUser(params: UserCreateParams): Promise<MCPResponse> {
    const endpoint = '/admin/users';
    
    const userData = {
      login: params.login,
      fullName: params.fullName,
      email: params.email,
      password: params.password,
      banned: params.banned || false,
      groups: params.groups?.map(group => ({ name: group })) || []
    };

    const response = await this.post(endpoint, userData);
    return ResponseFormatter.formatCreated(response.data, 'User', `User "${params.login}" created successfully`);
  }

  /**
   * Get all users with administrative details
   */
  async getAllUsers(query?: string, limit: number = 100): Promise<MCPResponse> {
    const endpoint = '/users';
    const params: any = { $top: limit };
    
    if (query) {
      params.query = query;
    }

    try {
      const response = await this.axios.get(endpoint, { params });
      return ResponseFormatter.formatSuccess(response.data, 
        `Found ${response.data?.length || 0} users`, {
        source: endpoint
      });
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get users: ${error.message}`, error, { 
        source: endpoint 
      });
    }
  }

  /**
   * Search users by query string
   */
  async searchUsers(query: string, limit: number = 100): Promise<MCPResponse> {
    return this.getAllUsers(query, limit);
  }

  /**
   * Update user account
   */
  async updateUser(userId: string, updates: Partial<UserCreateParams>): Promise<MCPResponse> {
    const endpoint = `/admin/users/${userId}`;
    
    const updateData: any = {};
    if (updates.fullName) updateData.fullName = updates.fullName;
    if (updates.email) updateData.email = updates.email;
    if (updates.banned !== undefined) updateData.banned = updates.banned;
    if (updates.groups) updateData.groups = updates.groups.map(group => ({ name: group }));

    const response = await this.post(endpoint, updateData);
    return ResponseFormatter.formatUpdated(response.data, 'User', updates, `User ${userId} updated successfully`);
  }

  /**
   * Ban/unban user
   */
  async banUser(userId: string, banned: boolean = true, reason?: string): Promise<MCPResponse> {
    const endpoint = `/admin/users/${userId}`;
    
    const updateData = {
      banned,
      banReason: reason
    };

    const response = await this.post(endpoint, updateData);
    const action = banned ? 'banned' : 'unbanned';
    return ResponseFormatter.formatUpdated(response.data, 'User', { banned }, `User ${userId} ${action} successfully`);
  }

  // ==================== GROUP MANAGEMENT ====================

  /**
   * Create user group
   */
  async createGroup(params: GroupCreateParams): Promise<MCPResponse> {
    const endpoint = '/admin/groups';
    
    const groupData = {
      name: params.name,
      description: params.description || '',
      autoJoin: params.autoJoin || false,
      teamForProject: params.teamForProject ? { shortName: params.teamForProject } : undefined
    };

    const response = await this.post(endpoint, groupData);
    return ResponseFormatter.formatCreated(response.data, 'Group', `Group "${params.name}" created successfully`);
  }

  /**
   * Get all user groups
   */
  async getAllGroups(): Promise<MCPResponse> {
    const endpoint = '/admin/groups';
    const params = {
      fields: 'id,name,description,autoJoin,userCount,teamForProject(shortName,name)'
    };

    const response = await this.get(endpoint, params);
    const groups = response.data || [];

    return ResponseFormatter.formatList(groups, 'group', {
      totalCount: groups.length
    });
  }

  /**
   * Add user to group
   */
  async addUserToGroup(groupId: string, userId: string): Promise<MCPResponse> {
    const endpoint = `/admin/groups/${groupId}/users`;
    
    const userData = { id: userId };
    await this.post(endpoint, userData);
    
    return ResponseFormatter.formatSuccess({
      groupId,
      userId,
      action: 'added'
    }, `User ${userId} added to group ${groupId}`);
  }

  /**
   * Remove user from group
   */
  async removeUserFromGroup(groupId: string, userId: string): Promise<MCPResponse> {
    const endpoint = `/admin/groups/${groupId}/users/${userId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatSuccess({
      groupId,
      userId,
      action: 'removed'
    }, `User ${userId} removed from group ${groupId}`);
  }

  // ==================== CUSTOM FIELDS MANAGEMENT ====================

  /**
   * Create custom field
   */
  async createCustomField(params: CustomFieldParams): Promise<MCPResponse> {
    const endpoint = '/admin/customFieldSettings/customFields';
    
    const fieldData = {
      name: params.name,
      fieldType: { id: params.type },
      isPrivate: params.isPrivate || false,
      defaultValues: params.defaultValues || [],
      canBeEmpty: params.canBeEmpty !== false,
      emptyFieldText: params.emptyFieldText || null
    };

    const response = await this.post(endpoint, fieldData);
    return ResponseFormatter.formatCreated(response.data, 'Custom Field', `Custom field "${params.name}" created successfully`);
  }

  /**
   * Get all custom fields
   */
  async getAllCustomFields(): Promise<MCPResponse> {
    const endpoint = '/admin/customFieldSettings/customFields';
    const params = {
      fields: 'id,name,fieldType(presentation),isPrivate,canBeEmpty,emptyFieldText,defaultValues'
    };

    const response = await this.get(endpoint, params);
    const fields = response.data || [];

    return ResponseFormatter.formatList(fields, 'custom field', {
      totalCount: fields.length
    });
  }

  /**
   * Update custom field settings
   */
  async updateCustomField(fieldId: string, updates: Partial<CustomFieldParams>): Promise<MCPResponse> {
    const endpoint = `/admin/customFieldSettings/customFields/${fieldId}`;
    
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.isPrivate !== undefined) updateData.isPrivate = updates.isPrivate;
    if (updates.canBeEmpty !== undefined) updateData.canBeEmpty = updates.canBeEmpty;
    if (updates.emptyFieldText !== undefined) updateData.emptyFieldText = updates.emptyFieldText;

    const response = await this.post(endpoint, updateData);
    return ResponseFormatter.formatUpdated(response.data, 'Custom Field', updates, `Custom field ${fieldId} updated successfully`);
  }

  // ==================== SYSTEM CONFIGURATION ====================

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<MCPResponse> {
    const endpoint = '/admin/globalSettings';
    const params = {
      fields: 'id,name,value,description,defaultValue,type'
    };

    const response = await this.get(endpoint, params);
    const settings = response.data || [];

    return ResponseFormatter.formatList(settings, 'system setting', {
      totalCount: settings.length
    });
  }

  /**
   * Update system setting
   */
  async updateSystemSetting(settingId: string, value: any): Promise<MCPResponse> {
    const endpoint = `/admin/globalSettings/${settingId}`;
    
    const updateData = { value };
    const response = await this.post(endpoint, updateData);
    
    return ResponseFormatter.formatUpdated(response.data, 'System Setting', { value }, `System setting ${settingId} updated successfully`);
  }

  // ==================== BACKUP & MAINTENANCE ====================

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<MCPResponse> {
    const endpoint = '/admin/health';
    
    const response = await this.get(endpoint);
    const healthData = response.data || {};

    return ResponseFormatter.formatSuccess({
      ...healthData,
      timestamp: new Date().toISOString()
    }, 'System health status retrieved');
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<MCPResponse> {
    const endpoint = '/admin/database/stats';
    
    const response = await this.get(endpoint);
    const stats = response.data || {};

    return ResponseFormatter.formatAnalytics(
      stats,
      {
        totalSize: stats.totalSize || 'Unknown',
        tableCount: stats.tables?.length || 0,
        indexCount: stats.indexes?.length || 0
      },
      'Database Statistics'
    );
  }

  /**
   * Trigger system backup
   */
  async triggerBackup(includeAttachments: boolean = true): Promise<MCPResponse> {
    const endpoint = '/admin/backup';
    
    const backupData = {
      includeAttachments,
      timestamp: Date.now()
    };

    const response = await this.post(endpoint, backupData);
    return ResponseFormatter.formatSuccess(response.data, 'System backup initiated successfully');
  }

  // ==================== LICENSE & USAGE ====================

  /**
   * Get license information
   */
  async getLicenseInfo(): Promise<MCPResponse> {
    const endpoint = '/admin/license';
    
    const response = await this.get(endpoint);
    const license = response.data || {};

    return ResponseFormatter.formatSuccess({
      ...license,
      retrieved: new Date().toISOString()
    }, 'License information retrieved');
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(period: 'day' | 'week' | 'month' = 'month'): Promise<MCPResponse> {
    const endpoint = '/admin/telemetry/usage';
    const params = { period };

    const response = await this.get(endpoint, params);
    const usage = response.data || {};

    return ResponseFormatter.formatAnalytics(
      usage,
      {
        period,
        activeUsers: usage.activeUsers || 0,
        totalIssues: usage.totalIssues || 0,
        totalProjects: usage.totalProjects || 0
      },
      'Usage Statistics'
    );
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get time tracking report
   */
  async getTimeTrackingReport(
    startDate?: string, 
    endDate?: string, 
    groupBy: string = 'user',
    projectId?: string, 
    userId?: string
  ): Promise<MCPResponse> {
    const endpoint = '/reports/timeTracking';
    const params: any = { groupBy };
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (projectId) params.project = projectId;
    if (userId) params.author = userId;

    try {
      const response = await this.axios.get(endpoint, { params });
      return ResponseFormatter.formatAnalytics(
        response.data,
        { reportType: 'time_tracking', period: `${startDate} to ${endDate}` },
        'Time Tracking Report'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to generate time tracking report: ${error.message}`, error);
    }
  }

  /**
   * Generate Gantt chart data
   */
  /**
   * Detect custom date fields in a project (e.g., "Start Date", "Due Date")
   */
  private async detectCustomDateFields(projectId: string): Promise<{ startDateField?: string; dueDateField?: string }> {
    try {
      const endpoint = `/admin/projects/${projectId}/customFields`;
      const params = { fields: 'field(name,fieldType($type,id))' };
      const response = await this.axios.get(endpoint, { params });
      
      const customFields = Array.isArray(response.data) ? response.data : [];
      const result: { startDateField?: string; dueDateField?: string } = {};
      
      // Look for date-type fields with semantic names
      for (const cf of customFields) {
        const fieldName = cf.field?.name?.toLowerCase();
        const fieldType = cf.field?.fieldType?.$type;
        
        // Only consider date-type fields
        if (fieldType === 'DateIssueCustomField') {
          if (fieldName && (fieldName.includes('start') || fieldName.includes('begin'))) {
            result.startDateField = cf.field.name;
          }
          if (fieldName && (fieldName.includes('due') || fieldName.includes('end') || fieldName.includes('deadline'))) {
            result.dueDateField = cf.field.name;
          }
        }
      }
      
      return result;
    } catch {
      // If we can't detect custom fields, just return empty object
      return {};
    }
  }

  /**
   * Extract date value from custom field
   */
  private extractCustomDateValue(issue: any, fieldName: string): string | null {
    if (!issue.customFields || !Array.isArray(issue.customFields)) {
      return null;
    }
    
    const field = issue.customFields.find((cf: any) => cf.name === fieldName);
    if (!field || !field.value) {
      return null;
    }
    
    // Date fields return timestamp in milliseconds
    if (typeof field.value === 'number') {
      return new Date(field.value).toISOString();
    }
    
    return null;
  }

  /**
   * Fetch issue links (dependencies) for issues
   */
  private async fetchIssueDependencies(issueIds: string[]): Promise<Map<string, any[]>> {
    const dependencyMap = new Map<string, any[]>();
    
    // Fetch links for all issues in parallel (with reasonable batching to avoid overwhelming the API)
    const batchSize = 10;
    for (let i = 0; i < issueIds.length; i += batchSize) {
      const batch = issueIds.slice(i, i + batchSize);
      const promises = batch.map(async (issueId) => {
        try {
          const endpoint = `/issues/${issueId}/links`;
          const params = { fields: 'id,direction,linkType(name,directed,sourceToTarget,targetToSource),issues(id,idReadable)' };
          const response = await this.axios.get(endpoint, { params });
          const links = Array.isArray(response.data) ? response.data : [];
          
          // Process links to extract dependencies
          const dependencies: any[] = [];
          for (const link of links) {
            const linkTypeName = link.linkType?.name?.toLowerCase() || '';
            
            // Only consider dependency-type links
            if (linkTypeName.includes('depend') || linkTypeName.includes('block') || 
                linkTypeName.includes('parent') || linkTypeName.includes('subtask')) {
              
              // Determine the target issue(s)
              if (link.issues && Array.isArray(link.issues)) {
                for (const linkedIssue of link.issues) {
                  dependencies.push({
                    id: linkedIssue.id,
                    idReadable: linkedIssue.idReadable,
                    type: link.linkType?.name || 'depends',
                    direction: link.direction || 'outward'
                  });
                }
              }
            }
          }
          
          if (dependencies.length > 0) {
            dependencyMap.set(issueId, dependencies);
          }
        } catch {
          // If we can't fetch links for an issue, just skip it
        }
      });
      
      await Promise.all(promises);
    }
    
    return dependencyMap;
  }

  /**
   * Fetch sprint data for a project's agile boards
   */
  private async fetchProjectSprints(projectId: string): Promise<any[]> {
    try {
      // First, get all agile boards for this project
      const boardsEndpoint = '/agiles';
      const boardsParams = { 
        fields: 'id,name,projects(id,shortName),sprints(id,name,start,finish,archived,goal)'
      };
      const boardsResponse = await this.axios.get(boardsEndpoint, { params: boardsParams });
      const allBoards = Array.isArray(boardsResponse.data) ? boardsResponse.data : [];
      
      // Filter boards that include this project
      const projectBoards = allBoards.filter((board: any) => 
        board.projects?.some((p: any) => p.id === projectId || p.shortName === projectId)
      );
      
      // Collect all sprints from these boards
      const allSprints: any[] = [];
      for (const board of projectBoards) {
        if (board.sprints && Array.isArray(board.sprints)) {
          for (const sprint of board.sprints) {
            allSprints.push({
              id: sprint.id,
              name: sprint.name,
              start: sprint.start,
              finish: sprint.finish,
              archived: sprint.archived || false,
              goal: sprint.goal,
              boardId: board.id,
              boardName: board.name
            });
          }
        }
      }
      
      return allSprints;
    } catch {
      // If we can't fetch sprints, return empty array
      return [];
    }
  }

  /**
   * Fetch sprint membership for issues
   */
  private async fetchIssueSprintMembership(issueIds: string[]): Promise<Map<string, any[]>> {
    const sprintMap = new Map<string, any[]>();
    
    // Fetch sprints for issues in batches
    const batchSize = 10;
    for (let i = 0; i < issueIds.length; i += batchSize) {
      const batch = issueIds.slice(i, i + batchSize);
      const promises = batch.map(async (issueId) => {
        try {
          // Get issue with sprint information
          const endpoint = `/issues/${issueId}`;
          const params = { 
            fields: 'id,sprints(id,name,start,finish,archived)'
          };
          const response = await this.axios.get(endpoint, { params });
          
          if (response.data?.sprints && Array.isArray(response.data.sprints)) {
            sprintMap.set(issueId, response.data.sprints);
          }
        } catch {
          // If we can't fetch sprint info for an issue, skip it
        }
      });
      
      await Promise.all(promises);
    }
    
    return sprintMap;
  }

  /**
   * Generate sprint milestones for Gantt visualization
   */
  private generateSprintMilestones(sprints: any[]): any[] {
    const milestones: any[] = [];
    
    // Filter out archived sprints and sort by start date
    const activeSprints = sprints
      .filter(s => !s.archived && s.start && s.finish)
      .sort((a, b) => a.start - b.start);
    
    for (const sprint of activeSprints) {
      // Add sprint start milestone
      milestones.push({
        date: sprint.start,
        name: `${sprint.name} - Start`,
        type: 'sprint-start',
        sprintId: sprint.id,
        sprintName: sprint.name
      });
      
      // Add sprint end milestone
      milestones.push({
        date: sprint.finish,
        name: `${sprint.name} - End`,
        type: 'sprint-end',
        sprintId: sprint.id,
        sprintName: sprint.name
      });
    }
    
    return milestones;
  }

  /**
   * Calculate critical path using simplified algorithm
   */
  private calculateCriticalPath(tasks: any[], dependencies: Map<string, any[]>): Set<string> {
    const criticalPath = new Set<string>();
    
    // Build adjacency list
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const taskMap = new Map<string, any>();
    
    // Initialize
    for (const task of tasks) {
      taskMap.set(task.id, task);
      graph.set(task.id, []);
      inDegree.set(task.id, 0);
    }
    
    // Build graph from dependencies
    for (const [sourceId, deps] of dependencies.entries()) {
      for (const dep of deps) {
        if (taskMap.has(dep.id) && taskMap.has(sourceId)) {
          // Add edge from dependency to source (dependency must complete before source)
          const depList = graph.get(dep.id) || [];
          depList.push(sourceId);
          graph.set(dep.id, depList);
          inDegree.set(sourceId, (inDegree.get(sourceId) || 0) + 1);
        }
      }
    }
    
    // Find tasks with longest path (simplified critical path)
    // Start with tasks that have no dependencies (in-degree 0)
    const startTasks: string[] = [];
    for (const [taskId, degree] of inDegree.entries()) {
      if (degree === 0) {
        startTasks.push(taskId);
      }
    }
    
    // Calculate earliest finish times using topological sort
    const earliestFinish = new Map<string, number>();
    const queue = [...startTasks];
    
    for (const taskId of queue) {
      const task = taskMap.get(taskId);
      if (!task) continue;
      
      const taskDuration = task.duration || 0;
      let maxPrereqFinish = 0;
      
      // Check all predecessors
      for (const [predId, successors] of graph.entries()) {
        if (successors.includes(taskId)) {
          const predFinish = earliestFinish.get(predId) || 0;
          maxPrereqFinish = Math.max(maxPrereqFinish, predFinish);
        }
      }
      
      earliestFinish.set(taskId, maxPrereqFinish + taskDuration);
      
      // Add successors to queue
      const successors = graph.get(taskId) || [];
      for (const successor of successors) {
        if (!queue.includes(successor)) {
          queue.push(successor);
        }
      }
    }
    
    // Find longest path (critical path) - simplified approach
    // Mark tasks with longest durations and high dependency count
    let maxFinish = 0;
    for (const finish of earliestFinish.values()) {
      maxFinish = Math.max(maxFinish, finish);
    }
    
    // Tasks on critical path are those with earliest finish == latest finish (no slack)
    // For simplicity, mark tasks with > 2 dependencies or longest durations
    for (const [taskId, finish] of earliestFinish.entries()) {
      const deps = dependencies.get(taskId) || [];
      const task = taskMap.get(taskId);
      
      // Critical if: at the end of the longest path or has many dependencies
      if (finish >= maxFinish * 0.9 || deps.length > 2 || 
          (task && task.duration >= maxFinish * 0.3)) {
        criticalPath.add(taskId);
      }
    }
    
    return criticalPath;
  }

  /**
   * Fetch work items (time tracking) for issues
   */
  private async fetchIssueWorkItems(issueIds: string[]): Promise<Map<string, any>> {
    const workItemsMap = new Map<string, any>();
    
    // Fetch work items for issues in batches
    const batchSize = 10;
    for (let i = 0; i < issueIds.length; i += batchSize) {
      const batch = issueIds.slice(i, i + batchSize);
      const promises = batch.map(async (issueId) => {
        try {
          const endpoint = `/issues/${issueId}/timeTracking/workItems`;
          const params = { 
            fields: 'id,date,duration,description,type(name),author(login,fullName)'
          };
          const response = await this.axios.get(endpoint, { params });
          
          if (response.data && Array.isArray(response.data)) {
            const workItems = response.data;
            
            if (workItems.length > 0) {
              // Calculate aggregated time tracking data
              const totalMinutes = workItems.reduce((sum: number, item: any) => 
                sum + (item.duration?.minutes || 0), 0
              );
              
              const dates = workItems
                .map((item: any) => item.date)
                .filter((date: number) => date != null)
                .sort((a: number, b: number) => a - b);
              
              workItemsMap.set(issueId, {
                workItems,
                totalMinutes,
                totalHours: Math.round((totalMinutes / 60) * 10) / 10,
                actualStart: dates.length > 0 ? dates[0] : null,
                actualEnd: dates.length > 0 ? dates[dates.length - 1] : null,
                workItemCount: workItems.length
              });
            }
          }
        } catch {
          // If we can't fetch work items for an issue, skip it
        }
      });
      
      await Promise.all(promises);
    }
    
    return workItemsMap;
  }

  /**
   * Fetch time estimates for issues
   */
  private async fetchIssueEstimates(issueIds: string[]): Promise<Map<string, number>> {
    const estimatesMap = new Map<string, number>();
    
    // Fetch estimates in batches
    const batchSize = 20;
    for (let i = 0; i < issueIds.length; i += batchSize) {
      const batch = issueIds.slice(i, i + batchSize);
      const promises = batch.map(async (issueId) => {
        try {
          const endpoint = `/issues/${issueId}`;
          const params = { 
            fields: 'id,customFields(name,value(minutes))'
          };
          const response = await this.axios.get(endpoint, { params });
          
          if (response.data?.customFields) {
            // Look for "Estimation" or "Time Estimate" field
            const estimateField = response.data.customFields.find((cf: any) => {
              const name = cf.name?.toLowerCase() || '';
              return name.includes('estimat') || name.includes('time');
            });
            
            if (estimateField?.value?.minutes) {
              estimatesMap.set(issueId, estimateField.value.minutes);
            }
          }
        } catch {
          // If we can't fetch estimate for an issue, skip it
        }
      });
      
      await Promise.all(promises);
    }
    
    return estimatesMap;
  }

  async generateGanttChart(
    projectId: string, 
    includeDependencies: boolean = false,
    includeSprints: boolean = false,
    sprintId?: string,
    includeWorkItems: boolean = false
  ): Promise<MCPResponse> {
    return PerformanceMonitor.measure('gantt_chart_generation', async () => {
      try {
        // First get project shortName
        const projectEndpoint = `/admin/projects/${projectId}`;
        const projectParams = { fields: FieldSelector.PROJECT };
        const projectResponse = await this.axios.get(projectEndpoint, { params: projectParams });
      
      if (!projectResponse.data) {
        throw new Error(`Project ${projectId} not found`);
      }
      
      const shortName = projectResponse.data.shortName;
      
      // Detect custom date fields
      const dateFields = await this.detectCustomDateFields(projectId);
      
      // Build query based on sprint filter
      let query = `project: ${shortName}`;
      if (sprintId) {
        query += ` Sprint: ${sprintId}`;
      }
      
      const endpoint = `/issues`;
      const params: any = {
        query,
        fields: FieldSelector.GANTT, // Optimized field selection
        $top: 1000
      };

      const response = await this.axios.get(endpoint, { params });
      const issues = Array.isArray(response.data) ? response.data : [];

      if (issues.length === 0) {
        return ResponseFormatter.formatAnalytics(
          [],
          { 
            reportType: 'gantt', 
            projectId, 
            totalTasks: 0, 
            completedTasks: 0, 
            note: sprintId ? `No issues found in sprint ${sprintId}` : 'No issues found in this project yet',
            customDateFields: dateFields,
            includeDependencies,
            includeSprints,
            sprintFilter: sprintId
          },
          'Gantt Chart Data'
        );
      }

      // Fetch dependencies if requested
      let dependencyMap = new Map<string, any[]>();
      let criticalPath = new Set<string>();
      
      if (includeDependencies) {
        const issueIds = issues.map((issue: any) => issue.id);
        dependencyMap = await this.fetchIssueDependencies(issueIds);
      }

      // Fetch sprint data if requested
      let projectSprints: any[] = [];
      let sprintMembershipMap = new Map<string, any[]>();
      let sprintMilestones: any[] = [];
      
      if (includeSprints) {
        const issueIds = issues.map((issue: any) => issue.id);
        [projectSprints, sprintMembershipMap] = await Promise.all([
          this.fetchProjectSprints(projectId),
          this.fetchIssueSprintMembership(issueIds)
        ]);
        
        // Generate milestones from sprints
        sprintMilestones = this.generateSprintMilestones(projectSprints);
      }

      // Fetch work items and estimates if requested
      let workItemsMap = new Map<string, any>();
      let estimatesMap = new Map<string, number>();
      
      if (includeWorkItems) {
        const issueIds = issues.map((issue: any) => issue.id);
        [workItemsMap, estimatesMap] = await Promise.all([
          this.fetchIssueWorkItems(issueIds),
          this.fetchIssueEstimates(issueIds)
        ]);
      }

      // Process issues into Gantt chart format with custom date field support
      const ganttData = issues.map((issue: any) => {
        // Try to use custom date fields first, fallback to created/resolved
        let startDate: string;
        let endDate: string;
        let usedCustomFields = false;
        
        // Check for custom Start Date field
        if (dateFields.startDateField) {
          const customStart = this.extractCustomDateValue(issue, dateFields.startDateField);
          if (customStart) {
            startDate = customStart;
            usedCustomFields = true;
          } else {
            startDate = issue.created;
          }
        } else {
          startDate = issue.created;
        }
        
        // Check for custom Due Date field
        if (dateFields.dueDateField) {
          const customDue = this.extractCustomDateValue(issue, dateFields.dueDateField);
          if (customDue) {
            endDate = customDue;
            usedCustomFields = true;
          } else {
            endDate = issue.resolved || new Date().toISOString();
          }
        } else {
          endDate = issue.resolved || new Date().toISOString();
        }
        
        // Calculate duration
        const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
        
        // Determine status
        let status: string;
        if (issue.resolved) {
          status = 'completed';
        } else if (usedCustomFields && new Date(endDate).getTime() < Date.now()) {
          status = 'overdue';
        } else {
          status = 'in-progress';
        }
        
        // Build task object
        const task: any = {
          id: issue.id,
          name: issue.summary,
          start: startDate,
          end: endDate,
          duration,
          status,
          ...(usedCustomFields ? { usedCustomDateFields: true } : {})
        };
        
        // Add dependency information if available
        if (includeDependencies && dependencyMap.has(issue.id)) {
          task.dependencies = dependencyMap.get(issue.id);
        }
        
        // Add sprint information if available
        if (includeSprints && sprintMembershipMap.has(issue.id)) {
          const issueSprints = sprintMembershipMap.get(issue.id) || [];
          if (issueSprints.length > 0) {
            // Include basic sprint info with the task
            task.sprints = issueSprints.map((s: any) => ({
              id: s.id,
              name: s.name,
              start: s.start,
              finish: s.finish,
              archived: s.archived
            }));
            
            // Mark current sprint
            const currentSprint = issueSprints.find((s: any) => {
              if (!s.start || !s.finish) return false;
              const now = Date.now();
              return s.start <= now && now <= s.finish && !s.archived;
            });
            
            if (currentSprint) {
              task.currentSprint = {
                id: currentSprint.id,
                name: currentSprint.name
              };
            }
          }
        }
        
        // Add work items and time tracking information if available
        if (includeWorkItems && workItemsMap.has(issue.id)) {
          const workItemsData = workItemsMap.get(issue.id);
          const estimatedMinutes = estimatesMap.get(issue.id) || 0;
          
          // Add time tracking fields
          task.estimated_hours = estimatedMinutes > 0 ? Math.round((estimatedMinutes / 60) * 10) / 10 : undefined;
          task.actual_hours = workItemsData.totalHours;
          task.work_item_count = workItemsData.workItemCount;
          
          // Add actual timeline from work items
          if (workItemsData.actualStart) {
            task.actual_start = new Date(workItemsData.actualStart).toISOString();
          }
          if (workItemsData.actualEnd) {
            task.actual_end = new Date(workItemsData.actualEnd).toISOString();
          }
          
          // Calculate progress percentage (capped at 100%)
          if (estimatedMinutes > 0) {
            task.progress = Math.min(100, Math.round((workItemsData.totalMinutes / estimatedMinutes) * 100));
          } else if (workItemsData.totalMinutes > 0) {
            // Has work items but no estimate - show time spent but progress unknown
            task.progress = undefined;
          }
          
          // Calculate time variance (actual - estimated)
          if (estimatedMinutes > 0) {
            const estimatedHours = Math.round((estimatedMinutes / 60) * 10) / 10;
            task.time_variance = Math.round((workItemsData.totalHours - estimatedHours) * 10) / 10;
            task.time_variance_percentage = Math.round(((workItemsData.totalHours - estimatedHours) / estimatedHours) * 100);
          }
          
          // Calculate schedule variance if we have actual dates
          if (workItemsData.actualStart && workItemsData.actualEnd) {
            const plannedDuration = new Date(endDate).getTime() - new Date(startDate).getTime();
            const actualDuration = new Date(workItemsData.actualEnd).getTime() - new Date(workItemsData.actualStart).getTime();
            task.schedule_variance_days = Math.round((actualDuration - plannedDuration) / (1000 * 60 * 60 * 24) * 10) / 10;
          }
        }
        
        return task;
      });

      // Calculate critical path if dependencies were fetched
      if (includeDependencies && dependencyMap.size > 0) {
        criticalPath = this.calculateCriticalPath(ganttData, dependencyMap);
        
        // Mark critical path tasks
        for (const task of ganttData) {
          if (criticalPath.has(task.id)) {
            task.criticalPath = true;
          }
        }
      }

      const metadata: any = {
        reportType: 'gantt',
        projectId,
        totalTasks: ganttData.length,
        completedTasks: ganttData.filter((task: any) => task.status === 'completed').length,
        overdueCount: ganttData.filter((task: any) => task.status === 'overdue').length,
        customDateFields: dateFields,
        usingCustomDateFields: !!(dateFields.startDateField || dateFields.dueDateField)
      };
      
      if (includeDependencies) {
        metadata.dependenciesIncluded = true;
        metadata.totalDependencies = Array.from(dependencyMap.values()).reduce((sum, deps) => sum + deps.length, 0);
        metadata.criticalPathTasks = criticalPath.size;
      }
      
      if (includeSprints) {
        metadata.sprintsIncluded = true;
        metadata.totalSprints = projectSprints.length;
        metadata.activeSprints = projectSprints.filter(s => !s.archived).length;
        metadata.tasksWithSprints = ganttData.filter((task: any) => task.sprints && task.sprints.length > 0).length;
        
        // Add current sprint info if filtering by sprint
        if (sprintId) {
          const currentSprint = projectSprints.find(s => s.id === sprintId);
          if (currentSprint) {
            metadata.currentSprint = {
              id: currentSprint.id,
              name: currentSprint.name,
              start: currentSprint.start,
              finish: currentSprint.finish
            };
          }
        }
      }
      
      if (includeWorkItems) {
        metadata.workItemsIncluded = true;
        
        // Calculate time tracking statistics
        const tasksWithWorkItems = ganttData.filter((task: any) => task.work_item_count && task.work_item_count > 0);
        const tasksWithEstimates = ganttData.filter((task: any) => task.estimated_hours !== undefined);
        
        metadata.tasksWithWorkItems = tasksWithWorkItems.length;
        metadata.tasksWithEstimates = tasksWithEstimates.length;
        
        // Calculate totals
        const totalActualHours = tasksWithWorkItems.reduce((sum, task) => sum + (task.actual_hours || 0), 0);
        const totalEstimatedHours = tasksWithEstimates.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
        
        metadata.totalActualHours = Math.round(totalActualHours * 10) / 10;
        metadata.totalEstimatedHours = Math.round(totalEstimatedHours * 10) / 10;
        
        if (totalEstimatedHours > 0) {
          metadata.totalTimeVariance = Math.round((totalActualHours - totalEstimatedHours) * 10) / 10;
          metadata.totalTimeVariancePercentage = Math.round(((totalActualHours - totalEstimatedHours) / totalEstimatedHours) * 100);
          metadata.overallProgress = Math.min(100, Math.round((totalActualHours / totalEstimatedHours) * 100));
        }
        
        // Calculate averages for tasks with both estimates and actuals
        const tasksWithBoth = ganttData.filter((task: any) => 
          task.estimated_hours !== undefined && task.actual_hours !== undefined
        );
        
        if (tasksWithBoth.length > 0) {
          const avgProgress = tasksWithBoth
            .filter((task: any) => task.progress !== undefined)
            .reduce((sum, task) => sum + task.progress, 0) / tasksWithBoth.filter((task: any) => task.progress !== undefined).length;
          
          metadata.averageProgress = Math.round(avgProgress);
          metadata.tasksOnTrack = tasksWithBoth.filter((task: any) => 
            task.time_variance !== undefined && task.time_variance <= 0
          ).length;
          metadata.tasksOverBudget = tasksWithBoth.filter((task: any) => 
            task.time_variance !== undefined && task.time_variance > 0
          ).length;
        }
      }

      // Build response data
      const responseData: any = {
        tasks: ganttData
      };
      
      // Add sprint information if included
      if (includeSprints) {
        responseData.sprints = projectSprints.map(s => ({
          id: s.id,
          name: s.name,
          start: s.start,
          finish: s.finish,
          archived: s.archived,
          goal: s.goal,
          boardName: s.boardName
        }));
        
        responseData.milestones = sprintMilestones;
      }

      return ResponseFormatter.formatAnalytics(
        responseData,
        metadata,
        'Gantt Chart Data'
      );
      } catch (error: any) {
        return ResponseFormatter.formatError(`Failed to generate Gantt chart: ${error.message}`, error);
      }
    });
  }

  /**
   * Get critical path analysis
   */
  async getCriticalPath(projectId: string): Promise<MCPResponse> {
    try {
      // First get project shortName
      const projectEndpoint = `/admin/projects/${projectId}`;
      const projectParams = { fields: 'id,shortName,name' };
      const projectResponse = await this.axios.get(projectEndpoint, { params: projectParams });
      
      if (!projectResponse.data) {
        throw new Error(`Project ${projectId} not found`);
      }
      
      const shortName = projectResponse.data.shortName;
      
      // Simplified critical path - would need dependency information for full implementation
      const endpoint = `/issues`;
      const params = {
        query: `project: ${shortName} -state: Resolved`,
        fields: 'id,summary,priority,created,customFields(name,value)',
        $top: 100
      };

      const response = await this.axios.get(endpoint, { params });
      const issues = Array.isArray(response.data) ? response.data : [];

      if (issues.length === 0) {
        return ResponseFormatter.formatAnalytics(
          [],
          { reportType: 'critical_path', projectId, issueCount: 0, note: 'No open issues to analyze' },
          'Critical Path Analysis'
        );
      }

      // Simple critical path based on priority and age
      const criticalPath = issues
        .map((issue: any) => ({
          id: issue.id,
          summary: issue.summary,
          priority: issue.priority?.name || 'Normal',
          age: Math.floor((Date.now() - new Date(issue.created).getTime()) / (1000 * 60 * 60 * 24)),
          criticality: this.calculateCriticality(issue)
        }))
        .sort((a: any, b: any) => b.criticality - a.criticality)
        .slice(0, 20);

      return ResponseFormatter.formatAnalytics(
        criticalPath,
        { reportType: 'critical_path', projectId, issueCount: criticalPath.length },
        'Critical Path Analysis'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to analyze critical path: ${error.message}`, error);
    }
  }

  /**
   * Get resource allocation report
   * Shows team capacity, workload distribution, and over/under allocation
   */
  async getResourceAllocation(
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<MCPResponse> {
    try {
      // Default capacity (40 hours/week, can be overridden)
      const DEFAULT_WEEKLY_CAPACITY = 40;

      // 1. Get all users who have worked on or are assigned to the project
      const issueQuery = `project: ${projectId}${startDate && endDate ? ` created: ${startDate} .. ${endDate}` : ''}`;
      
      const issuesResponse = await this.axios.get('/issues', {
        params: {
          query: issueQuery,
          fields: 'id,assignee(id,login,fullName,email),reporter(id,login,fullName,email),customFields(id,name,value)'
        }
      });

      const issues = issuesResponse.data;

      // 2. Extract unique users from assignees and reporters
      const userMap = new Map<string, any>();
      
      for (const issue of issues) {
        if (issue.assignee) {
          userMap.set(issue.assignee.login, issue.assignee);
        }
        if (issue.reporter && !userMap.has(issue.reporter.login)) {
          userMap.set(issue.reporter.login, issue.reporter);
        }
      }

      // 3. Calculate allocation for each user
      const userAllocations = await Promise.all(
        Array.from(userMap.values()).map(async (user) => {
          // Get user's assigned issues
          const userIssuesQuery = `project: ${projectId} assignee: ${user.login} state: -Resolved, -Fixed, -Verified${startDate && endDate ? ` created: ${startDate} .. ${endDate}` : ''}`;
          
          const userIssuesResponse = await this.axios.get('/issues', {
            params: {
              query: userIssuesQuery,
              fields: 'id,idReadable,summary,priority(name),customFields(id,name,value),created,resolved'
            }
          });

          const userIssues = userIssuesResponse.data;

          // Get work items for actual hours
          let actualHours = 0;
          try {
            const workItemsQuery = `project: ${projectId} author: ${user.login}${startDate && endDate ? ` date: ${startDate} .. ${endDate}` : ''}`;
            const workItemsResponse = await this.axios.get('/workItems', {
              params: {
                query: workItemsQuery,
                fields: 'duration(minutes)'
              }
            });

            actualHours = workItemsResponse.data.reduce(
              (sum: number, item: any) => sum + (item.duration?.minutes || 0),
              0
            ) / 60;
          } catch {
            // Work items may not be available, skip
          }

          // Calculate estimated hours from custom fields
          let estimatedHours = 0;
          for (const issue of userIssues) {
            const estimateField = issue.customFields?.find((f: any) => 
              f.name?.toLowerCase().includes('estimat') || 
              f.name?.toLowerCase().includes('time')
            );
            if (estimateField?.value?.minutes) {
              estimatedHours += estimateField.value.minutes / 60;
            }
          }

          // Count issues by priority and type
          const priorityCounts = {
            critical: 0,
            high: 0,
            normal: 0,
            low: 0
          };

          const typeCounts: Record<string, number> = {};

          for (const issue of userIssues) {
            const priority = issue.priority?.name?.toLowerCase() || 'normal';
            if (priority.includes('critical')) priorityCounts.critical++;
            else if (priority.includes('high')) priorityCounts.high++;
            else if (priority.includes('low')) priorityCounts.low++;
            else priorityCounts.normal++;

            const typeField = issue.customFields?.find((f: any) => f.name === 'Type');
            const type = typeField?.value?.name || 'Other';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          }

          // Count completed issues
          const completedIssues = userIssues.filter((i: any) => i.resolved).length;
          const activeIssues = userIssues.length - completedIssues;

          // Calculate capacity metrics
          const capacityPercentage = estimatedHours > 0 
            ? Math.round((estimatedHours / DEFAULT_WEEKLY_CAPACITY) * 100)
            : 0;

          const overAllocated = capacityPercentage > 100;
          const underAllocated = capacityPercentage < 50;

          return {
            user: {
              id: user.id,
              login: user.login,
              name: user.fullName,
              email: user.email
            },
            workload: {
              assigned_issues: userIssues.length,
              active_issues: activeIssues,
              completed_issues: completedIssues
            },
            timeAllocation: {
              estimated_hours: Math.round(estimatedHours * 10) / 10,
              actual_hours: Math.round(actualHours * 10) / 10,
              available_hours: DEFAULT_WEEKLY_CAPACITY
            },
            capacity: {
              capacity_percentage: capacityPercentage,
              over_allocated: overAllocated,
              under_allocated: underAllocated,
              status: overAllocated ? 'over-allocated' : underAllocated ? 'under-allocated' : 'optimal'
            },
            breakdown: {
              by_priority: priorityCounts,
              by_type: typeCounts
            }
          };
        })
      );

      // 4. Calculate team-level metrics
      const teamCapacity = userAllocations.length * DEFAULT_WEEKLY_CAPACITY;
      const totalEstimatedHours = userAllocations.reduce(
        (sum, u) => sum + u.timeAllocation.estimated_hours,
        0
      );
      const totalActualHours = userAllocations.reduce(
        (sum, u) => sum + u.timeAllocation.actual_hours,
        0
      );
      const teamUtilization = teamCapacity > 0 
        ? Math.round((totalEstimatedHours / teamCapacity) * 100)
        : 0;

      const overAllocatedCount = userAllocations.filter(u => u.capacity.over_allocated).length;
      const underAllocatedCount = userAllocations.filter(u => u.capacity.under_allocated).length;
      const optimalCount = userAllocations.length - overAllocatedCount - underAllocatedCount;

      // 5. Generate alerts
      const alerts = [];
      for (const user of userAllocations) {
        if (user.capacity.over_allocated) {
          const excess = user.timeAllocation.estimated_hours - user.timeAllocation.available_hours;
          alerts.push({
            severity: 'warning',
            user: user.user.name,
            message: `${user.user.name} is ${user.capacity.capacity_percentage}% allocated. Redistribute or postpone ${Math.round(excess)} hours of work.`
          });
        }
      }

      if (teamUtilization > 95) {
        alerts.push({
          severity: 'critical',
          message: `Team utilization at ${teamUtilization}%. Consider reducing scope or adding resources.`
        });
      }

      // 6. Build response
      const responseData = {
        users: userAllocations,
        teamMetrics: {
          total_members: userAllocations.length,
          team_capacity: teamCapacity,
          team_utilization: teamUtilization,
          total_estimated_hours: Math.round(totalEstimatedHours * 10) / 10,
          total_actual_hours: Math.round(totalActualHours * 10) / 10,
          distribution: {
            over_allocated: overAllocatedCount,
            optimal: optimalCount,
            under_allocated: underAllocatedCount
          }
        },
        alerts
      };

      const metadata = {
        reportType: 'resource_allocation',
        projectId,
        dateRange: startDate && endDate ? { startDate, endDate } : null,
        generatedAt: new Date().toISOString(),
        weeklyCapacityHours: DEFAULT_WEEKLY_CAPACITY
      };

      return ResponseFormatter.formatAnalytics(responseData, metadata, 'Resource allocation report generated');
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to generate resource allocation report: ${error.message}`, error);
    }
  }

  /**
   * Get milestone progress
   */
  async getMilestoneProgress(milestoneId: string): Promise<MCPResponse> {
    // Implementation would depend on how milestones are defined in YouTrack
    try {
      return ResponseFormatter.formatAnalytics(
        { milestoneId, progress: 'Not implemented - requires milestone configuration' },
        { reportType: 'milestone_progress' },
        'Milestone Progress (Placeholder)'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get milestone progress: ${error.message}`, error);
    }
  }

  /**
   * Bulk update issues
   */
  async bulkUpdateIssues(issueIds: string[], updates: any): Promise<MCPResponse> {
    if (!issueIds || issueIds.length === 0) {
      return ResponseFormatter.formatError('No issue IDs provided for bulk update');
    }

    const results: any[] = [];
  const errors: any[] = [];

    for (const issueId of issueIds) {
      try {
        const endpoint = `/issues/${issueId}`;
        await this.axios.post(endpoint, updates);
        results.push({ issueId, status: 'updated' });
      } catch (error: any) {
        errors.push({ issueId, error: error.message });
      }
    }

    return ResponseFormatter.formatSuccess({
      updated: results,
      errors,
      summary: {
        total: issueIds.length,
        successful: results.length,
        failed: errors.length
      }
    }, `Bulk update completed: ${results.length}/${issueIds.length} issues updated`);
  }

  /**
   * Create issue dependency
   */
  async createIssueDependency(sourceIssueId: string, targetIssueId: string): Promise<MCPResponse> {
    const endpoint = `/issues/${sourceIssueId}/links`;
    const linkData = {
      issues: [{ id: targetIssueId }],
      linkType: { name: 'depends' }
    };

    try {
      const response = await this.axios.post(endpoint, linkData);
      return ResponseFormatter.formatSuccess(response.data, 
        `Created dependency: ${sourceIssueId} depends on ${targetIssueId}`);
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to create issue dependency: ${error.message}`, error);
    }
  }

  /**
   * Calculate issue criticality score (helper method)
   */
  private calculateCriticality(issue: any): number {
    let score = 0;
    
    // Priority weighting
    const priority = issue.priority?.name?.toLowerCase() || 'normal';
    if (priority.includes('critical')) score += 100;
    else if (priority.includes('high')) score += 75;
    else if (priority.includes('major')) score += 50;
    else if (priority.includes('medium') || priority.includes('normal')) score += 25;
    
    // Age weighting (older issues get higher scores)
    const age = Math.floor((Date.now() - new Date(issue.created).getTime()) / (1000 * 60 * 60 * 24));
    score += Math.min(age, 365) / 10; // Cap at 1 year
    
    return score;
  }
}
