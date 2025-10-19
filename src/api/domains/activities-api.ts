/**
 * Activities API Client
 * 
 * Provides access to issue activity tracking and history in YouTrack.
 * Activities represent changes made to issues over time.
 * 
 * @module ActivitiesAPI
 */

import { BaseAPIClient } from '../base/base-client.js';
import { logger } from '../../logger.js';

/**
 * Activity query parameters
 */
export interface ActivityQueryParams {
  /** Activity categories to filter by */
  categories?: string;
  /** Whether to return activities in reverse chronological order */
  reverse?: boolean;
  /** Filter by user (database ID, login, Hub ID, or 'me') */
  author?: string;
  /** Issue search query to filter activities */
  issueQuery?: string;
  /** Fields to return in response */
  fields?: string;
  /** Number of items to skip */
  $skip?: number;
  /** Maximum number of items to return */
  $top?: number;
}

/**
 * Paginated activities parameters
 */
export interface ActivitiesPageParams extends ActivityQueryParams {
  /** Cursor for pagination */
  cursor?: string;
  /** ID of specific activity to include in page */
  activityId?: string;
}

/**
 * API client for managing activities
 */
export class ActivitiesAPIClient extends BaseAPIClient {
  /**
   * Get global activities across all issues
   * 
   * @param params - Query parameters for filtering activities
   * @returns List of activity items
   */
  async getActivities(params: ActivityQueryParams = {}) {
    logger.debug('Getting global activities', { params });
    return this.get('/api/activities', { params });
  }

  /**
   * Get single activity by ID
   * 
   * @param activityId - Activity item ID
   * @param fields - Fields to return
   * @returns Single activity item
   */
  async getActivity(activityId: string, fields?: string) {
    logger.debug('Getting activity by ID', { activityId });
    return this.get(`/api/activities/${activityId}`, { 
      params: { fields } 
    });
  }

  /**
   * Get paginated activities with cursor support
   * 
   * @param params - Query parameters including cursor
   * @returns Paginated activity response
   */
  async getActivitiesPage(params: ActivitiesPageParams = {}) {
    logger.debug('Getting activities page', { params });
    return this.get('/api/activitiesPage', { params });
  }

  /**
   * Get activities for specific issue
   * 
   * @param issueId - Issue ID
   * @param params - Query parameters
   * @returns List of activity items for the issue
   */
  async getIssueActivities(issueId: string, params: ActivityQueryParams = {}) {
    logger.debug('Getting issue activities', { issueId, params });
    return this.get(`/api/issues/${issueId}/activities`, { params });
  }

  /**
   * Get single activity for specific issue
   * 
   * @param issueId - Issue ID
   * @param activityItemId - Activity item ID
   * @param fields - Fields to return
   * @returns Single activity item
   */
  async getIssueActivity(issueId: string, activityItemId: string, fields?: string) {
    logger.debug('Getting issue activity by ID', { issueId, activityItemId });
    return this.get(`/api/issues/${issueId}/activities/${activityItemId}`, {
      params: { fields }
    });
  }

  /**
   * Get paginated activities for specific issue
   * 
   * @param issueId - Issue ID
   * @param params - Query parameters including cursor
   * @returns Paginated activity response for the issue
   */
  async getIssueActivitiesPage(issueId: string, params: ActivitiesPageParams = {}) {
    logger.debug('Getting issue activities page', { issueId, params });
    return this.get(`/api/issues/${issueId}/activitiesPage`, { params });
  }
}
