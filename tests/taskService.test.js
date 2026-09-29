const taskService = require('../src/services/taskService');

describe('TaskService Unit Tests', () => {
  beforeEach(() => {
    // Reset the tasks array before each test
    taskService._reset();
  });

  describe('getAll', () => {
    it('should return empty array when no tasks exist', () => {
      const tasks = taskService.getAll();
      expect(tasks).toEqual([]);
    });

    it('should return all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      
      const tasks = taskService.getAll();
      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });

    it('should return a copy of tasks array (not reference)', () => {
      taskService.create({ title: 'Task 1' });
      const tasks1 = taskService.getAll();
      const tasks2 = taskService.getAll();
      
      expect(tasks1).not.toBe(tasks2); // Different array references
      expect(tasks1).toEqual(tasks2); // Same content
    });
  });

  describe('findById', () => {
    it('should return undefined when task does not exist', () => {
      const task = taskService.findById('non-existent-id');
      expect(task).toBeUndefined();
    });

    it('should return task when id exists', () => {
      const created = taskService.create({ title: 'Find Me' });
      const found = taskService.findById(created.id);
      
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.title).toBe('Find Me');
    });
  });

  describe('getByStatus', () => {
    beforeEach(() => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'in_progress' });
      taskService.create({ title: 'Task 3', status: 'done' });
      taskService.create({ title: 'Task 4', status: 'todo' });
    });

    it('should return tasks with matching status', () => {
      const todoTasks = taskService.getByStatus('todo');
      expect(todoTasks).toHaveLength(2);
      expect(todoTasks.every(t => t.status === 'todo')).toBe(true);
    });

    it('should return empty array when no tasks match status', () => {
      taskService._reset();
      const tasks = taskService.getByStatus('in_progress');
      expect(tasks).toEqual([]);
    });

    it('should handle partial status matching', () => {
      // Bug: using includes() instead of strict equality
      const tasks = taskService.getByStatus('in');
      expect(tasks.length).toBeGreaterThan(0);
    });
  });

  describe('getPaginated', () => {
    beforeEach(() => {
      for (let i = 1; i <= 25; i++) {
        taskService.create({ title: `Task ${i}` });
      }
    });

    it('should return first page with default limit', () => {
      const tasks = taskService.getPaginated(1, 10);
      expect(tasks).toHaveLength(10);
      expect(tasks[0].title).toBe('Task 1');
    });

    it('should return correct page of results', () => {
      const page2 = taskService.getPaginated(2, 10);
      // Fixed: Now correctly returns 10 items from offset 10 (tasks 11-20)
      expect(page2).toHaveLength(10);
      expect(page2[0].title).toBe('Task 11');
    });

    it('should return remaining items on last page', () => {
      const page3 = taskService.getPaginated(3, 10);
      // Fixed: Page 3 should have 5 remaining items (tasks 21-25)
      expect(page3).toHaveLength(5);
      expect(page3[0].title).toBe('Task 21');
    });

    it('should handle page 0', () => {
      const tasks = taskService.getPaginated(0, 10);
      // Page 0 with new formula: (0-1) * 10 = -10, slice(-10, 0) returns empty
      // This is edge case behavior - in production, page should be >= 1
      expect(tasks).toHaveLength(0);
    });

    it('should return empty array when page exceeds total', () => {
      const tasks = taskService.getPaginated(10, 10);
      expect(tasks).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return zero counts for empty task list', () => {
      const stats = taskService.getStats();
      expect(stats).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0
      });
    });

    it('should count tasks by status correctly', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'todo' });
      taskService.create({ title: 'Task 3', status: 'in_progress' });
      taskService.create({ title: 'Task 4', status: 'done' });
      
      const stats = taskService.getStats();
      expect(stats.todo).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
    });

    it('should count overdue tasks correctly', () => {
      const pastDate = new Date('2020-01-01').toISOString();
      taskService.create({ title: 'Overdue 1', status: 'todo', dueDate: pastDate });
      taskService.create({ title: 'Overdue 2', status: 'in_progress', dueDate: pastDate });
      taskService.create({ title: 'Not Overdue', status: 'done', dueDate: pastDate });
      
      const stats = taskService.getStats();
      expect(stats.overdue).toBe(2); // Only non-done tasks
    });

    it('should not count tasks without dueDate as overdue', () => {
      taskService.create({ title: 'No Due Date', status: 'todo' });
      
      const stats = taskService.getStats();
      expect(stats.overdue).toBe(0);
    });

    it('should not count future due dates as overdue', () => {
      const futureDate = new Date('2030-01-01').toISOString();
      taskService.create({ title: 'Future', status: 'todo', dueDate: futureDate });
      
      const stats = taskService.getStats();
      expect(stats.overdue).toBe(0);
    });
  });

  describe('create', () => {
    it('should create task with all required fields', () => {
      const task = taskService.create({ title: 'New Task' });
      
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title', 'New Task');
      expect(task).toHaveProperty('description', '');
      expect(task).toHaveProperty('status', 'todo');
      expect(task).toHaveProperty('priority', 'medium');
      expect(task).toHaveProperty('dueDate', null);
      expect(task).toHaveProperty('completedAt', null);
      expect(task).toHaveProperty('createdAt');
      expect(typeof task.id).toBe('string');
    });

    it('should create task with custom values', () => {
      const dueDate = new Date('2025-12-31').toISOString();
      const task = taskService.create({
        title: 'Custom Task',
        description: 'Custom description',
        status: 'in_progress',
        priority: 'high',
        dueDate
      });
      
      expect(task.title).toBe('Custom Task');
      expect(task.description).toBe('Custom description');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(dueDate);
    });

    it('should generate unique IDs for each task', () => {
      const task1 = taskService.create({ title: 'Task 1' });
      const task2 = taskService.create({ title: 'Task 2' });
      
      expect(task1.id).not.toBe(task2.id);
    });

    it('should add task to the tasks list', () => {
      taskService.create({ title: 'Task 1' });
      const tasks = taskService.getAll();
      expect(tasks).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should return null when task does not exist', () => {
      const result = taskService.update('non-existent-id', { title: 'Updated' });
      expect(result).toBeNull();
    });

    it('should update task fields', () => {
      const task = taskService.create({ title: 'Original' });
      const updated = taskService.update(task.id, { 
        title: 'Updated',
        description: 'New description'
      });
      
      expect(updated.title).toBe('Updated');
      expect(updated.description).toBe('New description');
      expect(updated.id).toBe(task.id);
    });

    it('should preserve fields not included in update', () => {
      const task = taskService.create({ 
        title: 'Task',
        status: 'todo',
        priority: 'high'
      });
      
      const updated = taskService.update(task.id, { title: 'Updated' });
      expect(updated.status).toBe('todo');
      expect(updated.priority).toBe('high');
    });

    it('should update task in the tasks array', () => {
      const task = taskService.create({ title: 'Original' });
      taskService.update(task.id, { title: 'Updated' });
      
      const found = taskService.findById(task.id);
      expect(found.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should return false when task does not exist', () => {
      const result = taskService.remove('non-existent-id');
      expect(result).toBe(false);
    });

    it('should remove task and return true', () => {
      const task = taskService.create({ title: 'To Remove' });
      const result = taskService.remove(task.id);
      
      expect(result).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('should remove only the specified task', () => {
      const task1 = taskService.create({ title: 'Task 1' });
      const task2 = taskService.create({ title: 'Task 2' });
      
      taskService.remove(task1.id);
      
      expect(taskService.findById(task1.id)).toBeUndefined();
      expect(taskService.findById(task2.id)).toBeDefined();
    });
  });

  describe('completeTask', () => {
    it('should return null when task does not exist', () => {
      const result = taskService.completeTask('non-existent-id');
      expect(result).toBeNull();
    });

    it('should mark task as done and set completedAt', () => {
      const task = taskService.create({ title: 'To Complete', status: 'in_progress' });
      const completed = taskService.completeTask(task.id);
      
      expect(completed.status).toBe('done');
      expect(completed.completedAt).toBeTruthy();
      expect(typeof completed.completedAt).toBe('string');
    });

    it('should set priority to medium when completing', () => {
      const task = taskService.create({ title: 'High Priority', priority: 'high' });
      const completed = taskService.completeTask(task.id);
      
      expect(completed.priority).toBe('medium');
    });

    it('should preserve other task fields', () => {
      const task = taskService.create({ 
        title: 'Complete Me',
        description: 'Important task'
      });
      
      const completed = taskService.completeTask(task.id);
      expect(completed.title).toBe('Complete Me');
      expect(completed.description).toBe('Important task');
      expect(completed.id).toBe(task.id);
    });

    it('should update task in the tasks array', () => {
      const task = taskService.create({ title: 'Task' });
      taskService.completeTask(task.id);
      
      const found = taskService.findById(task.id);
      expect(found.status).toBe('done');
      expect(found.completedAt).toBeTruthy();
    });
  });
});
