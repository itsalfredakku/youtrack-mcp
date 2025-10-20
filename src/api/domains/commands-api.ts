/**
 * Commands API Client
 * 
 * Provides access to applying commands to multiple issues in YouTrack.
 * Commands allow bulk operations and state changes across issues.
 * 
 * @module CommandsAPI
 */

import { BaseAPIClient } from '../base/base-client.js';
import { logger } from '../../logger.js';

/**
 * Command execution parameters
 */
export interface CommandParams {
  /** The command text to apply */
  query: string;
  /** Position of caret in command (for suggestions) */
  caret?: number;
  /** Whether to run command silently (no notifications) */
  silent?: boolean;
  /** User to run command as */
  runAs?: string;
  /** Issue IDs to apply command to */
  issues?: Array<{ id: string }>;
  /** Comment to add with command */
  comment?: string;
  /** Fields to return in response */
  fields?: string;
}

/**
 * API client for managing commands
 */
export class CommandsAPIClient extends BaseAPIClient {
  /**
   * Apply command to issues
   * 
   * @param params - Command parameters
   * @param muteNotifications - Whether to mute update notifications
   * @returns Command execution result
   */
  async applyCommand(params: CommandParams, muteNotifications = false) {
    logger.debug('Applying command to issues', { params, muteNotifications });
    
    const endpoint = muteNotifications 
      ? '/commands?muteUpdateNotifications=true'
      : '/commands';
    
    return this.post(endpoint, params);
  }

  /**
   * Get command suggestions for current query
   * 
   * @param query - Partial command text
   * @param caret - Cursor position in command
   * @param issueIds - Issues context for suggestions
   * @returns Command suggestions
   */
  async getCommandSuggestions(query: string, caret?: number, issueIds?: string[]) {
    logger.debug('Getting command suggestions', { query, caret });
    
    const issues = issueIds?.map(id => ({ id }));
    
    return this.post('/commands/assist', {
      query,
      caret: caret ?? query.length,
      issues
    });
  }
}
