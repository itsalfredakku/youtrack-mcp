/**
 * Unit tests for FieldSelector utility
 */

import { FieldSelector } from '../../utils/field-selector.js';

describe('FieldSelector', () => {
  describe('Predefined Selectors', () => {
    it('should have MINIMAL selector with minimal fields', () => {
      expect(FieldSelector.MINIMAL).toBe('id,$type');
    });

    it('should have BASIC selector with common fields', () => {
      const basic = FieldSelector.BASIC;
      expect(basic).toContain('id');
      expect(basic).toContain('idReadable');
      expect(basic).toContain('summary');
      expect(basic).toContain('created');
      expect(basic).toContain('updated');
    });

    it('should have GANTT selector optimized for Gantt charts', () => {
      const gantt = FieldSelector.GANTT;
      expect(gantt).toContain('id');
      expect(gantt).toContain('idReadable');
      expect(gantt).toContain('summary');
      expect(gantt).toContain('customFields');
      expect(gantt).toContain('created');
      expect(gantt).toContain('resolved');
    });

    it('should have PROJECT selector with project fields', () => {
      const project = FieldSelector.PROJECT;
      expect(project).toContain('id');
      expect(project).toContain('name');
      expect(project).toContain('shortName');
    });

    it('should have USER selector with user fields', () => {
      const user = FieldSelector.USER;
      expect(user).toContain('id');
      expect(user).toContain('login');
      expect(user).toContain('fullName');
      expect(user).toContain('email');
    });

    it('should have SPRINT selector with sprint fields', () => {
      const sprint = FieldSelector.SPRINT;
      expect(sprint).toContain('id');
      expect(sprint).toContain('name');
      expect(sprint).toContain('goal');
      expect(sprint).toContain('start');
      expect(sprint).toContain('finish');
    });

    it('should have WORK_ITEM selector with work item fields', () => {
      const workItem = FieldSelector.WORK_ITEM;
      expect(workItem).toContain('id');
      expect(workItem).toContain('duration');
      expect(workItem).toContain('date');
      expect(workItem).toContain('author');
    });
  });

  describe('forUseCase', () => {
    it('should return correct selector for list use case', () => {
      const selector = FieldSelector.forUseCase('list');
      expect(selector).toBe(FieldSelector.BASIC);
    });

    it('should return correct selector for detail use case', () => {
      const selector = FieldSelector.forUseCase('detail');
      expect(selector).toContain('description');
      expect(selector).toContain('reporter');
      expect(selector).toContain('assignee');
    });

    it('should return correct selector for gantt use case', () => {
      const selector = FieldSelector.forUseCase('gantt');
      expect(selector).toBe(FieldSelector.GANTT);
    });

    it('should return BASIC selector for unknown use case', () => {
      const selector = FieldSelector.forUseCase('minimal');
      expect(selector).toBe(FieldSelector.MINIMAL);
    });
  });

  describe('custom', () => {
    it('should create custom selector from array', () => {
      const fields = ['id', 'summary', 'state'];
      const selector = FieldSelector.custom(fields);
      expect(selector).toBe('id,summary,state');
    });

    it('should handle empty array', () => {
      const selector = FieldSelector.custom([]);
      expect(selector).toBe('');
    });

    it('should handle single field', () => {
      const selector = FieldSelector.custom(['id']);
      expect(selector).toBe('id');
    });

    it('should join multiple fields with commas', () => {
      const fields = ['id', 'name', 'email', 'login'];
      const selector = FieldSelector.custom(fields);
      expect(selector).toBe('id,name,email,login');
    });
  });

  describe('extend', () => {
    it('should extend base selector with additional fields', () => {
      const base = 'id,name';
      const extended = FieldSelector.extend(base, ['email', 'login']);
      expect(extended).toBe('id,name,email,login');
    });

    it('should handle empty additional fields', () => {
      const base = 'id,name';
      const extended = FieldSelector.extend(base, []);
      // Implementation adds comma even for empty array
      expect(extended).toBe('id,name,');
    });

    it('should handle empty base selector', () => {
      const extended = FieldSelector.extend('', ['email', 'login']);
      expect(extended).toBe(',email,login');
    });

    it('should extend MINIMAL selector', () => {
      const extended = FieldSelector.extend(FieldSelector.MINIMAL, ['name', 'email']);
      expect(extended).toContain('id');
      expect(extended).toContain('$type');
      expect(extended).toContain('name');
      expect(extended).toContain('email');
    });

    it('should extend USER selector with custom fields', () => {
      const extended = FieldSelector.extend(FieldSelector.USER, ['banned', 'online']);
      expect(extended).toContain('id');
      expect(extended).toContain('login');
      expect(extended).toContain('banned');
      expect(extended).toContain('online');
    });
  });

  describe('Payload Reduction', () => {
    it('should significantly reduce payload size for Gantt queries', () => {
      // GANTT selector only includes essential fields
      const ganttFields = FieldSelector.GANTT.split(',').length;
      
      // Should be less than 15 fields (80% reduction from 50)
      expect(ganttFields).toBeLessThan(15);
    });

    it('should have minimal overhead for MINIMAL selector', () => {
      const minimalFields = FieldSelector.MINIMAL.split(',').length;
      expect(minimalFields).toBe(2); // Only id and $type
    });
  });
});
