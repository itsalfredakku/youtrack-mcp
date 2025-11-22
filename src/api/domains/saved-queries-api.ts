/**
 * Saved Queries API Client
 * 
 * Provides full CRUD operations for saved searches in YouTrack.
 * 
 * @module SavedQueriesAPI
 */

import { BaseAPIClient } from '../base/base-client.js';
import { ResponseFormatter } from '../base/response-formatter.js';
import { MCPResponse } from '../base/base-client.js';

/**
 * Saved query data
 */
export interface SavedQueryData {
  /** Query name */
  name: string;
  /** Search query text */
  query: string;
  /** Query owner (optional for updates) */
  owner?: { id: string } | { login: string };
}

/**
 * API client for managing saved queries
 */
export class SavedQueriesAPIClient extends BaseAPIClient {
  /**
   * List all saved queries
   * 
   * @param fields - Fields to return
   * @param skip - Number of items to skip
   * @param top - Maximum number of items
   * @returns List of saved queries
   */
  async listSavedQueries(fields?: string, skip?: number, top?: number): Promise<MCPResponse> {
    const response = await this.get('/savedQueries', {
      fields: fields || 'id,name,query,owner(login,name)',
      $skip: skip,
      $top: top
    });
    
    const queries = response.data || [];
    return ResponseFormatter.formatList(queries, 'saved query', {
      totalCount: queries.length
    });
  }

  /**
   * Get saved query by ID
   * 
   * @param queryId - Saved query ID
   * @param fields - Fields to return
   * @returns Single saved query
   */
  async getSavedQuery(queryId: string, fields?: string): Promise<MCPResponse> {
    const response = await this.get(`/savedQueries/${queryId}`, {
      fields: fields || 'id,name,query,owner(login,name)'
    });
    
    return ResponseFormatter.formatSuccess(response.data, 'Saved query retrieved');
  }

  /**
   * Create new saved query
   * 
   * @param data - Saved query data
   * @returns Created saved query
   */
  async createSavedQuery(data: SavedQueryData): Promise<MCPResponse> {
    try {
      const response = await this.post('/savedQueries', {
        name: data.name,
        query: data.query,
        ...(data.owner && { owner: data.owner })
      });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Saved query "${data.name}" created successfully`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to create saved query: ${error.message}`,
        { data }
      );
    }
  }

  /**
   * Update saved query
   * 
   * @param queryId - Saved query ID
   * @param data - Updated saved query data
   * @returns Updated saved query
   */
  async updateSavedQuery(queryId: string, data: Partial<SavedQueryData>): Promise<MCPResponse> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.query !== undefined) updateData.query = data.query;
      if (data.owner !== undefined) updateData.owner = data.owner;
      
      const response = await this.post(`/savedQueries/${queryId}`, updateData);
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Saved query ${queryId} updated successfully`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to update saved query: ${error.message}`,
        { queryId, data }
      );
    }
  }

  /**
   * Delete saved query
   * 
   * @param queryId - Saved query ID
   * @returns Success response
   */
  async deleteSavedQuery(queryId: string): Promise<MCPResponse> {
    try {
      await this.delete(`/savedQueries/${queryId}`);
      
      return ResponseFormatter.formatSuccess(
        { queryId },
        `Saved query ${queryId} deleted successfully`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to delete saved query: ${error.message}`,
        { queryId }
      );
    }
  }
}
