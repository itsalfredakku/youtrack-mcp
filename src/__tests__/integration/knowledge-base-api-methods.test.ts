/**
 * Integration Tests for KnowledgeBaseAPIClient Methods
 * Tests article CRUD and search operations
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { KnowledgeBaseAPIClient } from '../../api/domains/knowledge-base-api.js';
import type { YouTrackConfig } from '../../api/base/base-client.js';

describe('KnowledgeBaseAPIClient - Method Logic Tests', () => {
  let client: KnowledgeBaseAPIClient;
  let mockGet: any;
  let mockPost: any;
  let mockPatch: any;
  let mockDelete: any;

  beforeEach(() => {
    const config: YouTrackConfig = {
      baseURL: 'https://youtrack.test.com',
      token: 'test-token-123',
    };
    
    client = new KnowledgeBaseAPIClient(config);
    mockGet = jest.spyOn((client as any).axios, 'get');
    mockPost = jest.spyOn((client as any).axios, 'post');
    mockPatch = jest.spyOn((client as any).axios, 'patch');
    mockDelete = jest.spyOn((client as any).axios, 'delete');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createArticle', () => {
    test('should create article with required fields', async () => {
      const mockArticle = {
        id: 'article-1',
        summary: 'Getting Started Guide',
        content: '## Introduction\n\nWelcome to the guide.',
      };

      mockPost.mockResolvedValue({
        data: mockArticle,
        status: 200,
      });

      const result = await client.createArticle({
        title: 'Getting Started Guide',
        content: '## Introduction\n\nWelcome to the guide.',
        project: 'DOCS',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/articles',
        expect.objectContaining({
          summary: 'Getting Started Guide',
          content: '## Introduction\n\nWelcome to the guide.',
          project: expect.objectContaining({
            shortName: 'DOCS',
          }),
        })
      );

      expect(result.content[0].text).toContain('created');
    });

    test('should throw error if project is missing', async () => {
      await expect(async () => {
        await client.createArticle({
          title: 'Test',
          content: '## Content',
          project: '', // Empty project
        });
      }).rejects.toThrow('Project is required');
    });

    test('should reject content starting with single # heading', async () => {
      await expect(async () => {
        await client.createArticle({
          title: 'Test Article',
          content: '# Test Article\n\n## Content',
          project: 'DOCS',
        });
      }).rejects.toThrow('Invalid content format');
    });

    test('should allow content starting with ## heading', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'article-1' },
        status: 200,
      });

      const result = await client.createArticle({
        title: 'Test',
        content: '## Section\n\nContent here',
        project: 'DOCS',
      });

      expect(result.content[0].text).toContain('created');
    });

    test('should allow content starting with body text', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'article-1' },
        status: 200,
      });

      const result = await client.createArticle({
        title: 'Test',
        content: 'This is the content without heading.',
        project: 'DOCS',
      });

      expect(result.content[0].text).toContain('created');
    });

    test('should include summary if provided', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'article-1' },
        status: 200,
      });

      await client.createArticle({
        title: 'Test',
        content: '## Content',
        project: 'DOCS',
        summary: 'This is a brief description',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/articles',
        expect.objectContaining({
          description: 'This is a brief description',
        })
      );
    });

    test('should handle creation errors', async () => {
      mockPost.mockRejectedValue({
        message: 'Permission denied',
        response: { status: 403 },
      });

      await expect(async () => {
        await client.createArticle({
          title: 'Test',
          content: '## Content',
          project: 'DOCS',
        });
      }).rejects.toThrow('Failed to create article');
    });
  });

  describe('getArticle', () => {
    test('should fetch article by ID', async () => {
      const mockArticle = {
        id: 'article-1',
        summary: 'Test Article',
        content: 'Article content',
        author: { login: 'user1' },
      };

      mockGet.mockResolvedValue({
        data: mockArticle,
        status: 200,
      });

      const result = await client.getArticle('article-1');

      expect(mockGet).toHaveBeenCalledWith(
        '/articles/article-1',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('article-1');
    });

    test('should include comments when requested', async () => {
      mockGet.mockResolvedValue({
        data: { 
          id: 'article-1', 
          summary: 'Test',
          content: 'Content',
          comments: [] 
        },
        status: 200,
      });

      await client.getArticle('article-1');

      expect(mockGet).toHaveBeenCalledWith(
        '/articles/article-1',
        expect.any(Object)
      );
    });

    test('should compute word count', async () => {
      const mockArticle = {
        id: 'article-1',
        summary: 'Test',
        content: 'This is a test article with ten words total.',
      };

      mockGet.mockResolvedValue({
        data: mockArticle,
        status: 200,
      });

      const result = await client.getArticle('article-1');

      expect(result.content[0].text).toContain('article-1');
    });

    test('should handle article not found', async () => {
      mockGet.mockRejectedValue({
        message: 'Article not found',
        response: { status: 404 },
      });

      await expect(async () => {
        await client.getArticle('nonexistent');
      }).rejects.toThrow();
    });

    test('should include hierarchy information', async () => {
      const mockArticle = {
        id: 'article-1',
        summary: 'Test',
        content: 'Content',
        parentArticle: { id: 'parent-1' },
        childArticles: [{ id: 'child-1' }, { id: 'child-2' }],
      };

      mockGet.mockResolvedValue({
        data: mockArticle,
        status: 200,
      });

      const result = await client.getArticle('article-1');

      expect(result.content[0].text).toContain('article-1');
    });
  });

  describe('updateArticle', () => {
    test('should update article title', async () => {
      mockPatch.mockResolvedValue({
        data: { id: 'article-1', summary: 'Updated Title' },
        status: 200,
      });

      const result = await client.updateArticle('article-1', {
        title: 'Updated Title',
      });

      expect(mockPatch).toHaveBeenCalledWith(
        '/articles/article-1',
        expect.objectContaining({
          summary: 'Updated Title',
        })
      );

      expect(result.content[0].text).toContain('updated');
    });

    test('should update article content', async () => {
      mockPatch.mockResolvedValue({
        data: { id: 'article-1' },
        status: 200,
      });

      await client.updateArticle('article-1', {
        content: '## New content',
      });

      expect(mockPatch).toHaveBeenCalledWith(
        '/articles/article-1',
        expect.objectContaining({
          content: '## New content',
        })
      );
    });

    test('should update multiple fields', async () => {
      mockPatch.mockResolvedValue({
        data: { id: 'article-1' },
        status: 200,
      });

      await client.updateArticle('article-1', {
        title: 'New Title',
        content: '## New Content',
        summary: 'New summary',
      });

      expect(mockPatch).toHaveBeenCalledWith(
        '/articles/article-1',
        expect.objectContaining({
          summary: 'New Title',
          content: '## New Content',
          description: 'New summary',
        })
      );
    });

    test('should handle update errors', async () => {
      mockPatch.mockRejectedValue({
        message: 'Update failed',
        response: { status: 400 },
      });

      await expect(async () => {
        await client.updateArticle('article-1', {
          title: 'Updated',
        });
      }).rejects.toThrow();
    });
  });

  describe('deleteArticle', () => {
    test('should delete article by ID', async () => {
      mockDelete.mockResolvedValue({
        status: 200,
      });

      const result = await client.deleteArticle('article-1');

      expect(mockDelete).toHaveBeenCalledWith('/articles/article-1');

      expect(result.content[0].text).toContain('deleted');
    });

    test('should handle deletion errors', async () => {
      mockDelete.mockRejectedValue({
        message: 'Cannot delete',
        response: { status: 403 },
      });

      await expect(async () => {
        await client.deleteArticle('article-1');
      }).rejects.toThrow();
    });
  });

  describe('listArticles', () => {
    test('should list all articles', async () => {
      const mockArticles = [
        { id: 'article-1', summary: 'Article 1' },
        { id: 'article-2', summary: 'Article 2' },
      ];

      mockGet.mockResolvedValue({
        data: mockArticles,
        status: 200,
      });

      const result = await client.listArticles();

      expect(mockGet).toHaveBeenCalledWith(
        '/articles',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('2');
    });

    test('should filter by project', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.listArticles({ project: 'DOCS' });

      expect(mockGet).toHaveBeenCalled();
    });

    test('should handle empty list', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.listArticles();

      expect(result.content[0].text).toContain('0');
    });
  });

  describe('searchArticles', () => {
    test('should search articles by query', async () => {
      const mockResults = [
        { id: 'article-1', summary: 'Authentication Guide' },
      ];

      mockGet.mockResolvedValue({
        data: mockResults,
        status: 200,
      });

      const result = await client.searchArticles({ query: 'authentication' });

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('1');
    });

    test('should handle no search results', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.searchArticles({ query: 'nonexistent' });

      expect(result.content[0].text).toContain('0');
    });

    test('should search with multiple parameters', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.searchArticles({
        query: 'test',
        project: 'DOCS',
        tags: ['guide', 'tutorial'],
      });

      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockGet.mockRejectedValue(new Error('Network failure'));

      await expect(async () => {
        await client.listArticles();
      }).rejects.toThrow();
    });

    test('should handle timeout errors', async () => {
      mockGet.mockRejectedValue({
        message: 'timeout',
        code: 'ECONNABORTED',
      });

      await expect(async () => {
        await client.getArticle('article-1');
      }).rejects.toThrow();
    });

    test('should handle permission errors', async () => {
      mockPost.mockRejectedValue({
        message: 'Forbidden',
        response: { status: 403 },
      });

      await expect(async () => {
        await client.createArticle({
          title: 'Test',
          content: '## Content',
          project: 'DOCS',
        });
      }).rejects.toThrow();
    });
  });
});
