import { BaseAPIClient, MCPResponse } from '../base/base-client.js';
import { ResponseFormatter } from '../base/response-formatter.js';
import { ProjectFields } from '../field-configurations.js';

export interface ProjectTimeTrackingSettings {
  enabled: boolean;
  estimate?: {
    field: string;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  timeSpent?: {
    field: string;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
}

export interface ProjectFieldSettings {
  field: {
    name: string;
    type: string;
  };
  isPrivate?: boolean;
  defaultValues?: any[];
  canBeEmpty?: boolean;
  bundle?: {
    name: string;
  };
}

/**
 * Projects API Client - Handles all project-related operations
 * Covers 25+ endpoints from OpenAPI specification
 */
export class ProjectsAPIClient extends BaseAPIClient {

  /**
   * List all accessible projects
   */
  async listProjects(fields?: string): Promise<MCPResponse> {
    try {
      // Use the correct endpoint from OpenAPI spec
      const params = {
        fields: fields || ProjectFields.LIST, // Use optimized list fields
        $top: 1000,
        $skip: 0
      } as any;

      const projectsResp = await this.get('/admin/projects', params);
      let projects = Array.isArray(projectsResp.data) ? projectsResp.data : [];

      // Fallback: union with issue-derived discovery if projects endpoint is restricted
      if (!projects.length) {
        try {
          const altParams = { 
            query: 'project: *',
            fields: `project(${fields})`,
            $top: 1000
          };
          const issuesResp = await this.get('/issues', altParams);
          const projectMap = new Map<string, any>();
          if (Array.isArray(issuesResp.data)) {
            for (const issue of issuesResp.data) {
              if (issue.project) projectMap.set(issue.project.id, issue.project);
            }
          }
          projects = Array.from(projectMap.values());
        } catch {
          // ignore fallback failures; we'll proceed with what we have
        }
      }

      return ResponseFormatter.formatSuccess(
        projects,
        `Retrieved ${projects.length} accessible projects`,
      );
    } catch (error) {
      return ResponseFormatter.formatError(
        `Failed to list projects: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Get project details by ID or shortName
   */
  async getProject(projectId: string, fields?: string): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}`;
    const params = {
      fields: fields || ProjectFields.DETAIL // Use detailed fields
    };

    const response = await this.get(endpoint, params);
    return ResponseFormatter.formatSuccess(response.data, `Retrieved project ${projectId}`);
  }

  /**
   * Get project custom fields configuration
   */
  async getProjectCustomFields(projectId: string): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/customFields`;
    const params = {
      fields: 'field(id,name,fieldType(presentation)),bundle(name),canBeEmpty,isPrivate,defaultValues'
    };

    const response = await this.get(endpoint, params);
    const fields = response.data || [];

    // Organize fields by category
    const fieldsByType = fields.reduce((acc: any, field: any) => {
      const type = field.field?.fieldType?.presentation || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(field);
      return acc;
    }, {});

    return ResponseFormatter.formatSuccess({
      fields,
      fieldsByType,
      totalFields: fields.length,
      fieldTypes: Object.keys(fieldsByType)
    }, `Retrieved ${fields.length} custom fields for project ${projectId}`);
  }

  /**
   * Add custom field to project
   */
  async addCustomFieldToProject(projectId: string, fieldSettings: ProjectFieldSettings): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/customFields`;
    
    const fieldData = {
      field: {
        name: fieldSettings.field.name
      },
      canBeEmpty: fieldSettings.canBeEmpty !== false,
      isPrivate: fieldSettings.isPrivate || false,
      defaultValues: fieldSettings.defaultValues || [],
      bundle: fieldSettings.bundle ? { name: fieldSettings.bundle.name } : undefined
    };

    const response = await this.post(endpoint, fieldData);
    return ResponseFormatter.formatCreated(response.data, 'Project Field', 
      `Custom field "${fieldSettings.field.name}" added to project ${projectId}`);
  }

  /**
   * Remove custom field from project
   */
  async removeCustomFieldFromProject(projectId: string, fieldId: string): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/customFields/${fieldId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatDeleted(fieldId, 'Project Field');
  }

  /**
   * Get project time tracking settings
   */
  async getProjectTimeTracking(projectId: string): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/timeTrackingSettings`;
    const params = {
      fields: 'enabled,estimate(field(name),period(presentation)),timeSpent(field(name),period(presentation))'
    };

    const response = await this.get(endpoint, params);
    const settings = response.data || {};

    return ResponseFormatter.formatSuccess(settings, `Retrieved time tracking settings for project ${projectId}`);
  }

  /**
   * Update project time tracking settings
   */
  async updateProjectTimeTracking(projectId: string, settings: ProjectTimeTrackingSettings): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/timeTrackingSettings`;
    
    const updateData = {
      enabled: settings.enabled,
      estimate: settings.estimate ? {
        field: { name: settings.estimate.field },
        period: { presentation: settings.estimate.unit }
      } : undefined,
      timeSpent: settings.timeSpent ? {
        field: { name: settings.timeSpent.field },
        period: { presentation: settings.timeSpent.unit }
      } : undefined
    };

    const response = await this.post(endpoint, updateData);
    return ResponseFormatter.formatUpdated(response.data, 'Time Tracking Settings', settings, 
      `Time tracking settings updated for project ${projectId}`);
  }

  /**
   * Get project team members
   */
  async getProjectTeam(projectId: string): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/team`;
    const params = {
      fields: 'users(id,login,fullName,email,profiles(general(timezone))),groups(name,description,userCount)'
    };

    const response = await this.get(endpoint, params);
    const team = response.data || {};

    const summary = {
      totalUsers: team.users?.length || 0,
      totalGroups: team.groups?.length || 0,
      activeUsers: team.users?.filter((u: any) => !u.banned).length || 0
    };

    return ResponseFormatter.formatSuccess({
      ...team,
      summary
    }, `Retrieved team information for project ${projectId}`);
  }

  /**
   * Add user to project team
   */
  async addUserToProjectTeam(projectId: string, userId: string, role?: string): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/team/users`;
    
    const userData = {
      user: { id: userId },
      role: role ? { name: role } : undefined
    };

    const response = await this.post(endpoint, userData);
    return ResponseFormatter.formatCreated(response.data, 'Team Member', 
      `User ${userId} added to project ${projectId} team`);
  }

  /**
   * Remove user from project team
   */
  async removeUserFromProjectTeam(projectId: string, userId: string): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/team/users/${userId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatDeleted(userId, 'Team Member');
  }

  /**
   * Get project issues summary and statistics
   */
  async getProjectIssuesSummary(projectId: string): Promise<MCPResponse> {
    try {
      // First get project details to get the shortName
      const projectEndpoint = `/admin/projects/${projectId}`;
      const projectParams = { fields: 'id,shortName,name' };
      const projectResponse = await this.get(projectEndpoint, projectParams);
      
      if (!projectResponse.data) {
        throw new Error(`Project ${projectId} not found`);
      }
      
      const shortName = projectResponse.data.shortName;
      
      const endpoint = `/issues`;
      const params = {
        query: `project: ${shortName}`,
        fields: 'id,numberInProject,summary,state(name),priority(name),assignee(login),created,updated',
        $top: 1000 // Get reasonable sample for analysis
      };

      const response = await this.get(endpoint, params);
      const issues = response.data || [];

      // Calculate statistics
      const stats = {
        totalIssues: issues.length,
        byState: this.groupByField(issues, 'state.name'),
        byPriority: this.groupByField(issues, 'priority.name'),
        byAssignee: this.groupByField(issues, 'assignee.login'),
        recentActivity: issues
          .sort((a: any, b: any) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
          .slice(0, 10)
      };

      return ResponseFormatter.formatAnalytics(
        { issues: issues.slice(0, 20), stats }, // Limit issues in response
        stats,
        'Project Issues Summary'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to get project issues summary: ${error.message}`,
        error,
        { source: 'project-issues-summary' }
      );
    }
  }

  /**
   * Get project versions/builds
   */
  async getProjectVersions(projectId: string): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/versions`;
    const params = {
      fields: 'id,name,description,released,releaseDate,archived'
    };

    const response = await this.get(endpoint, params);
    const versions = response.data || [];

    const summary = {
      totalVersions: versions.length,
      releasedVersions: versions.filter((v: any) => v.released).length,
      archivedVersions: versions.filter((v: any) => v.archived).length,
      latestVersion: versions.find((v: any) => v.released && !v.archived)
    };

    return ResponseFormatter.formatSuccess({
      versions,
      summary,
      count: versions.length
    }, `Retrieved ${versions.length} versions for project ${projectId}`);
  }

  /**
   * Create project version/build
   */
  async createProjectVersion(projectId: string, version: {
    name: string;
    description?: string;
    releaseDate?: string;
    released?: boolean;
  }): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/versions`;
    
    const versionData = {
      name: version.name,
      description: version.description || '',
      releaseDate: version.releaseDate ? new Date(version.releaseDate).getTime() : undefined,
      released: version.released || false,
      archived: false
    };

    const response = await this.post(endpoint, versionData);
    return ResponseFormatter.formatCreated(response.data, 'Version', 
      `Version "${version.name}" created for project ${projectId}`);
  }

  /**
   * Archive/unarchive project version
   */
  async archiveProjectVersion(projectId: string, versionId: string, archived: boolean = true): Promise<MCPResponse> {
    const endpoint = `/admin/projects/${projectId}/versions/${versionId}`;
    
    const updateData = { archived };
    const response = await this.post(endpoint, updateData);
    
    const action = archived ? 'archived' : 'unarchived';
    return ResponseFormatter.formatUpdated(response.data, 'Version', { archived }, 
      `Version ${versionId} ${action} successfully`);
  }

  /**
   * Helper method to group array by nested field
   */
  private groupByField(items: any[], fieldPath: string): Record<string, number> {
    return items.reduce((acc: Record<string, number>, item: any) => {
      const value = this.getNestedValue(item, fieldPath) || 'Unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Helper method to get nested object value by path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Validate if a project exists and user has access
   */
  async validateProject(projectId: string): Promise<MCPResponse> {
    try {
      await this.getProject(projectId);
      return ResponseFormatter.formatSuccess(
        { valid: true, accessible: true }, 
        `Project ${projectId} is valid and accessible`
      );
    } catch (error) {
      return ResponseFormatter.formatError(
        error instanceof Error ? error.message : String(error),
        `Project ${projectId} validation failed`,
        { source: 'validation' }
      );
    }
  }

  /**
   * Get project statistics 
   */
  async getProjectStatistics(projectId: string): Promise<MCPResponse> {
    try {
      // Use project summary to get basic stats
      const summary = await this.getProjectIssuesSummary(projectId);
      return summary;
    } catch (error) {
      return ResponseFormatter.formatError(
        error instanceof Error ? error.message : String(error),
        `Failed to get project statistics for ${projectId}`,
        { source: 'statistics' }
      );
    }
  }

  /**
   * Get project field values for a specific field
   */
  async getProjectFieldValues(projectId: string, fieldName: string): Promise<MCPResponse> {
    try {
      // First get the custom field configuration
      const fieldsEndpoint = `/admin/projects/${projectId}/customFields`;
      const fieldsResponse = await this.get(fieldsEndpoint, {
        fields: 'field(name,fieldType(valueType)),bundle(id,name)'
      });
      
      const fields = fieldsResponse.data || [];
      const targetField = fields.find((f: any) => f.field?.name === fieldName);
      
      if (!targetField) {
        return ResponseFormatter.formatError(
          `Field "${fieldName}" not found in project ${projectId}`,
          'Field not found'
        );
      }
      
      // If field has a bundle, get bundle values
      if (targetField.bundle?.id) {
        const bundleType = targetField.field.fieldType?.valueType || 'enum';
        const bundleEndpoint = `/admin/customFieldSettings/bundles/${bundleType}/${targetField.bundle.id}/values`;
        
        const valuesResponse = await this.get(bundleEndpoint, {
          fields: 'id,name,description,ordinal,color(background,foreground)'
        });
        
        const values = valuesResponse.data || [];
        
        return ResponseFormatter.formatSuccess({
          field: fieldName,
          fieldType: targetField.field.fieldType?.valueType,
          bundle: targetField.bundle.name,
          values: values.map((v: any) => ({
            name: v.name,
            description: v.description,
            color: v.color,
            ordinal: v.ordinal
          })),
          totalValues: values.length
        }, `Retrieved ${values.length} values for field "${fieldName}"`);
      }
      
      // For non-bundle fields, return field info
      return ResponseFormatter.formatSuccess({
        field: fieldName,
        fieldType: targetField.field.fieldType?.valueType,
        hasValues: false,
        message: 'This field type does not have predefined values'
      }, `Field "${fieldName}" does not use predefined values`);
      
    } catch (error) {
      return ResponseFormatter.formatError(
        error instanceof Error ? error.message : String(error),
        `Failed to get field values for "${fieldName}"`
      );
    }
  }
}
