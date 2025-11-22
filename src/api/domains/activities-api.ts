/**
 * Activities API Client
 * 
 * Provides access to issue activity tracking and history in YouTrack.
 * Activities represent changes made to issues over time.
 * 
 * @module ActivitiesAPI
 */

import { BaseAPIClient } from '../base/base-client.js';

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
   * @returns Promise resolving to formatted response with activities
   */
  async getActivities(params?: ActivityQueryParams) {
    return this.get('/activities', { params });
  }

  /**
   * Get single activity by ID
   * 
   * @param activityId - Activity ID
   * @param fields - Fields to return
   * @returns Promise resolving to formatted response with activity
   */
  async getActivity(activityId: string, fields?: string) {
    return this.get(`/activities/${activityId}`, { params: { fields } });
  }

  /**
   * Get paginated activities with cursor support
   * 
   * @param params - Pagination parameters
   * @returns Promise resolving to formatted response with activity page
   */
  async getActivitiesPage(params?: ActivitiesPageParams) {
    return this.get('/activitiesPage', { params });
  }

  /**
   * Get activities for specific issue
   * 
   * @param issueId - Issue ID (e.g., "TEST-1")
   * @param params - Query parameters for filtering
   * @returns Promise resolving to formatted response with issue activities
   */
  async getIssueActivities(issueId: string, params?: ActivityQueryParams) {
    return this.get(`/issues/${issueId}/activities`, { params });
  }

  /**
   * Get single activity for specific issue
   * 
   * @param issueId - Issue ID
   * @param activityId - Activity ID
   * @param fields - Fields to return
   * @returns Promise resolving to formatted response with issue activity
   */
  async getIssueActivity(issueId: string, activityId: string, fields?: string) {
    return this.get(`/issues/${issueId}/activities/${activityId}`, { params: { fields } });
  }

  /**
   * Get paginated activities for specific issue
   * 
   * @param issueId - Issue ID
   * @param params - Pagination parameters
   * @returns Promise resolving to formatted response with issue activities page
   */
  async getIssueActivitiesPage(issueId: string, params?: ActivitiesPageParams) {
    return this.get(`/issues/${issueId}/activitiesPage`, { params });
  }
}
