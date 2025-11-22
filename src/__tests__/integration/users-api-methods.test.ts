/**
 * Integration Tests for UsersAPIClient Methods
 * Tests user management and search operations
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UsersAPIClient } from '../../api/domains/users-api.js';
import type { YouTrackConfig } from '../../api/base/base-client.js';

describe('UsersAPIClient - Method Logic Tests', () => {
  let client: UsersAPIClient;
  let mockGet: any;

  beforeEach(() => {
    const config: YouTrackConfig = {
      baseURL: 'https://youtrack.test.com',
      token: 'test-token-123',
    };
    
    client = new UsersAPIClient(config);
    mockGet = jest.spyOn((client as any).axios, 'get');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('searchUsers', () => {
    test('should search users by query', async () => {
      const mockUsers = [
        { id: 'user-1', login: 'john.doe', fullName: 'John Doe' },
        { id: 'user-2', login: 'jane.smith', fullName: 'Jane Smith' },
      ];

      mockGet.mockResolvedValue({
        data: mockUsers,
        status: 200,
      });

      const result = await client.searchUsers('john');

      expect(mockGet).toHaveBeenCalled();

      expect(result.content[0].text).toContain('2');
    });

    test('should handle empty search results', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.searchUsers('nonexistent');

      expect(result.content[0].text).toContain('0');
    });

    test('should use custom fields parameter', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.searchUsers('test', 'id,login,fullName,email');

      expect(mockGet).toHaveBeenCalled();
    });

    test('should handle search errors', async () => {
      mockGet.mockRejectedValue({
        message: 'Search failed',
        response: { status: 500 },
      });

      const result = await client.searchUsers('test');

      expect(result.content[0].text).toContain('error');
    });
  });

  describe('listUsers', () => {
    test('should list all users', async () => {
      const mockUsers = [
        { id: 'user-1', login: 'john.doe' },
        { id: 'user-2', login: 'jane.smith' },
      ];

      mockGet.mockResolvedValue({
        data: mockUsers,
        status: 200,
      });

      const result = await client.listUsers();

      expect(mockGet).toHaveBeenCalledWith(
        '/users',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('2');
    });

    test('should filter users by query', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.listUsers('john');

      expect(mockGet).toHaveBeenCalled();
    });

    test('should handle empty list', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.listUsers();

      expect(result.content[0].text).toContain('0');
    });
  });

  describe('getUser', () => {
    test('should get user by ID', async () => {
      const mockUser = {
        id: 'user-1',
        login: 'john.doe',
        fullName: 'John Doe',
        email: 'john@example.com',
      };

      mockGet.mockResolvedValue({
        data: mockUser,
        status: 200,
      });

      const result = await client.getUser('user-1');

      expect(mockGet).toHaveBeenCalledWith(
        '/users/user-1',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('john.doe');
    });

    test('should handle user not found', async () => {
      mockGet.mockRejectedValue({
        message: 'User not found',
        response: { status: 404 },
      });

      const result = await client.getUser('nonexistent');

      expect(result.content[0].text).toContain('not found');
    });

    test('should include user profile details', async () => {
      const mockUser = {
        id: 'user-1',
        login: 'john.doe',
        fullName: 'John Doe',
        email: 'john@example.com',
        profiles: { general: { timezone: { id: 'UTC' } } },
      };

      mockGet.mockResolvedValue({
        data: mockUser,
        status: 200,
      });

      const result = await client.getUser('user-1');

      expect(result.content[0].text).toContain('john.doe');
    });
  });

  describe('getCurrentUser', () => {
    test('should get current user', async () => {
      const mockUser = {
        id: 'current-user',
        login: 'me',
        fullName: 'Current User',
      };

      mockGet.mockResolvedValue({
        data: mockUser,
        status: 200,
      });

      const result = await client.getCurrentUser();

      expect(mockGet).toHaveBeenCalledWith(
        '/users/me',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('me');
    });

    test('should handle unauthorized access', async () => {
      mockGet.mockRejectedValue({
        message: 'Unauthorized',
        response: { status: 401 },
      });

      const result = await client.getCurrentUser();

      expect(result.content[0].text).toContain('error');
    });
  });

  describe('listGroups', () => {
    test('should list user groups', async () => {
      const mockGroups = [
        { id: 'group-1', name: 'Developers' },
        { id: 'group-2', name: 'Admins' },
      ];

      mockGet.mockResolvedValue({
        data: mockGroups,
        status: 200,
      });

      const result = await client.listGroups();

      expect(mockGet).toHaveBeenCalledWith(
        '/groups',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('2');
    });

    test('should handle empty groups', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.listGroups();

      expect(result.content[0].text).toContain('0');
    });
  });

  describe('getGroup', () => {
    test('should get group by ID', async () => {
      const mockGroup = {
        id: 'group-1',
        name: 'Developers',
        description: 'Development team',
      };

      mockGet.mockResolvedValue({
        data: mockGroup,
        status: 200,
      });

      const result = await client.getGroup('group-1');

      expect(mockGet).toHaveBeenCalledWith(
        '/groups/group-1',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('Developers');
    });

    test('should handle group not found', async () => {
      mockGet.mockRejectedValue({
        message: 'Group not found',
        response: { status: 404 },
      });

      const result = await client.getGroup('nonexistent');

      expect(result.content[0].text).toContain('not found');
    });
  });

  describe('getGroupMembers', () => {
    test('should get group members', async () => {
      const mockMembers = [
        { id: 'user-1', login: 'john.doe' },
        { id: 'user-2', login: 'jane.smith' },
      ];

      mockGet.mockResolvedValue({
        data: mockMembers,
        status: 200,
      });

      const result = await client.getGroupMembers('group-1');

      expect(mockGet).toHaveBeenCalledWith(
        '/groups/group-1/users',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('2');
    });

    test('should handle group with no members', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.getGroupMembers('group-1');

      expect(result.content[0].text).toContain('0');
    });
  });

  describe('getProjectTeam', () => {
    test('should get project team members', async () => {
      const mockTeam = [
        { id: 'user-1', login: 'john.doe' },
        { id: 'user-2', login: 'jane.smith' },
      ];

      mockGet.mockResolvedValue({
        data: mockTeam,
        status: 200,
      });

      const result = await client.getProjectTeam('TEST');

      expect(mockGet).toHaveBeenCalled();

      expect(result.content[0].text).toContain('2');
    });

    test('should handle project with no team', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.getProjectTeam('TEST');

      expect(result.content[0].text).toContain('0');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockGet.mockRejectedValue(new Error('Network failure'));

      const result = await client.searchUsers('test');

      expect(result.content[0].text).toContain('error');
    });

    test('should handle timeout errors', async () => {
      mockGet.mockRejectedValue({
        message: 'timeout',
        code: 'ECONNABORTED',
      });

      const result = await client.getUser('john.doe');

      expect(result.content[0].text).toContain('error');
    });

    test('should handle permission errors', async () => {
      mockGet.mockRejectedValue({
        message: 'Forbidden',
        response: { status: 403 },
      });

      const result = await client.getGroupMembers('group-1');

      expect(result.content[0].text).toContain('error');
    });
  });
});
