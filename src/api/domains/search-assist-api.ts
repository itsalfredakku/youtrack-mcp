/**
 * Search Assist API Client
 * 
 * Provides search query suggestions and auto-completion for YouTrack search.
 * 
 * @module SearchAssistAPI
 */

import { BaseAPIClient } from '../base/base-client.js';
import { logger } from '../../logger.js';

/**
 * Search suggestions parameters
 */
export interface SearchSuggestionsParams {
  /** The search query text */
  query: string;
  /** Cursor position in query */
  caret?: number;
  /** Optional project context */
  project?: string;
  /** Fields to return in response */
  fields?: string;
}

/**
 * API client for search assistance
 */
export class SearchAssistAPIClient extends BaseAPIClient {
  /**
   * Get search query suggestions
   * 
   * @param params - Search suggestions parameters
   * @returns Search suggestions response
   */
  async getSuggestions(params: SearchSuggestionsParams) {
    logger.debug('Getting search suggestions', { params });
    
    const requestBody = {
      query: params.query,
      caret: params.caret ?? params.query.length,
      ...(params.project && { folder: { $type: 'Project', shortName: params.project } })
    };
    
    return this.post('/search/assist', requestBody);
  }

  /**
   * Get auto-complete suggestions for current query
   * 
   * @param query - Partial search query
   * @param caret - Cursor position
   * @param project - Optional project context
   * @returns Auto-complete suggestions
   */
  async getAutoComplete(query: string, caret?: number, project?: string) {
    return this.getSuggestions({ query, caret, project });
  }
}
