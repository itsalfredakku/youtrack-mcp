/**
 * Integration Tests for AdminAPIClient Methods
 * Tests admin operations and custom fields management
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AdminAPIClient } from '../../api/domains/admin-api.js';
import type { YouTrackConfig } from '../../api/base/base-client.js';

describe('AdminAPIClient - Method Logic Tests', () => {
  let client: AdminAPIClient;
  let mockGet: any;
  let mockPost: any;

  beforeEach(() => {
    const config: YouTrackConfig = {
      baseURL: 'https://youtrack.test.com',
      token: 'test-token-123',
    };
    
    client = new AdminAPIClient(config);
    mockGet = jest.spyOn((client as any).axios, 'get');
    mockPost = jest.spyOn((client as any).axios, 'post');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createProject', () => {
    test('should create new project', async () => {
      const mockProject = {
        id: 'proj-1',
        name: 'Test Project',
        shortName: 'TEST',
      };

      mockPost.mockResolvedValue({
        data: mockProject,
        status: 200,
      });

      const result = await client.createProject({
        name: 'Test Project',
        shortName: 'TEST',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/admin/projects'),
        expect.objectContaining({
          name: 'Test Project',
          shortName: 'TEST',
        })
      );

      expect(result.content[0].text).toContain('created');
    });

    test('should handle creation errors', async () => {
      mockPost.mockRejectedValue({
        message: 'Project already exists',
        response: { status: 409 },
      });

      await expect(async () => {
        await client.createProject({
          name: 'Duplicate',
          shortName: 'DUP',
        });
      }).rejects.toThrow();
    });
  });

  describe('getAllProjects', () => {
    test('should list all projects', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Project 1' },
        { id: 'proj-2', name: 'Project 2' },
      ];

      mockGet.mockResolvedValue({
        data: mockProjects,
        status: 200,
      });

      const result = await client.getAllProjects();

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('2');
    });

    test('should include archived projects when requested', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.getAllProjects(true);

      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('searchUsers', () => {
    test('should search users', async () => {
      const mockUsers = [
        { id: 'user-1', login: 'john.doe' },
        { id: 'user-2', login: 'jane.smith' },
      ];

      mockGet.mockResolvedValue({
        data: mockUsers,
        status: 200,
      });

      const result = await client.searchUsers('john');

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('2');
    });

    test('should handle search with limit', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.searchUsers('test', 50);

      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    test('should create new user', async () => {
      const mockUser = {
        id: 'user-new',
        login: 'newuser',
        email: 'newuser@example.com',
      };

      mockPost.mockResolvedValue({
        data: mockUser,
        status: 200,
      });

      const result = await client.createUser({
        login: 'newuser',
        email: 'newuser@example.com',
        fullName: 'New User',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users'),
        expect.objectContaining({
          login: 'newuser',
        })
      );

      expect(result.content[0].text).toContain('created');
    });

    test('should handle user creation errors', async () => {
      mockPost.mockRejectedValue({
        message: 'User already exists',
        response: { status: 409 },
      });

      await expect(async () => {
        await client.createUser({
          login: 'duplicate',
          email: 'dup@example.com',
          fullName: 'Duplicate User',
        });
      }).rejects.toThrow();
    });
  });

  describe('getAllUsers', () => {
    test('should list all users', async () => {
      const mockUsers = [
        { id: 'user-1', login: 'user1' },
        { id: 'user-2', login: 'user2' },
      ];

      mockGet.mockResolvedValue({
        data: mockUsers,
        status: 200,
      });

      const result = await client.getAllUsers();

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('2');
    });

    test('should filter users by query', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.getAllUsers('admin');

      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('createGroup', () => {
    test('should create new group', async () => {
      const mockGroup = {
        id: 'group-1',
        name: 'Developers',
      };

      mockPost.mockResolvedValue({
        data: mockGroup,
        status: 200,
      });

      const result = await client.createGroup({
        name: 'Developers',
        description: 'Development team',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/admin/groups'),
        expect.objectContaining({
          name: 'Developers',
        })
      );

      expect(result.content[0].text).toContain('created');
    });
  });

  describe('getAllGroups', () => {
    test('should list all groups', async () => {
      const mockGroups = [
        { id: 'group-1', name: 'Developers' },
        { id: 'group-2', name: 'Testers' },
      ];

      mockGet.mockResolvedValue({
        data: mockGroups,
        status: 200,
      });

      const result = await client.getAllGroups();

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('2');
    });
  });

  describe('addUserToGroup', () => {
    test('should add user to group', async () => {
      mockPost.mockResolvedValue({
        data: { success: true },
        status: 200,
      });

      const result = await client.addUserToGroup('group-1', 'user-1');

      expect(mockPost).toHaveBeenCalled();
      expect(result.content[0].text).toContain('added');
    });
  });

  describe('getAllCustomFields', () => {
    test('should list custom fields', async () => {
      const mockFields = [
        { id: 'field-1', name: 'Priority' },
        { id: 'field-2', name: 'Assignee' },
      ];

      mockGet.mockResolvedValue({
        data: mockFields,
        status: 200,
      });

      const result = await client.getAllCustomFields();

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('2');
    });
  });

  describe('createCustomField', () => {
    test('should create custom field', async () => {
      const mockField = {
        id: 'field-new',
        name: 'Custom Status',
      };

      mockPost.mockResolvedValue({
        data: mockField,
        status: 200,
      });

      const result = await client.createCustomField({
        name: 'Custom Status',
        type: 'enum',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/admin/customFieldSettings/customFields'),
        expect.objectContaining({
          name: 'Custom Status',
        })
      );

      expect(result.content[0].text).toContain('created');
    });
  });

  describe('getSystemSettings', () => {
    test('should get system settings', async () => {
      const mockSettings = {
        baseUrl: 'https://youtrack.example.com',
        version: '2023.1',
      };

      mockGet.mockResolvedValue({
        data: mockSettings,
        status: 200,
      });

      const result = await client.getSystemSettings();

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('youtrack.example.com');
    });
  });

  describe('getSystemHealth', () => {
    test('should get system health', async () => {
      const mockHealth = {
        status: 'healthy',
        uptime: 12345,
      };

      mockGet.mockResolvedValue({
        data: mockHealth,
        status: 200,
      });

      const result = await client.getSystemHealth();

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('healthy');
    });
  });

  describe('getDatabaseStats', () => {
    test('should get database statistics', async () => {
      const mockStats = {
        issuesCount: 1000,
        projectsCount: 10,
        usersCount: 50,
      };

      mockGet.mockResolvedValue({
        data: mockStats,
        status: 200,
      });

      const result = await client.getDatabaseStats();

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('1000');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockGet.mockRejectedValue(new Error('Network failure'));

      await expect(async () => {
        await client.getAllProjects();
      }).rejects.toThrow();
    });

    test('should handle timeout errors', async () => {
      mockGet.mockRejectedValue({
        message: 'timeout',
        code: 'ECONNABORTED',
      });

      await expect(async () => {
        await client.getSystemSettings();
      }).rejects.toThrow();
    });

    test('should handle permission errors', async () => {
      mockGet.mockRejectedValue({
        message: 'Forbidden',
        response: { status: 403 },
      });

      await expect(async () => {
        await client.getDatabaseStats();
      }).rejects.toThrow();
    });
  });
});

