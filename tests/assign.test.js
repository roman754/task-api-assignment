const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('PATCH /tasks/:id/assign', () => {
  let taskId;

  beforeEach(() => {
    taskService._reset();
    const task = taskService.create({ title: 'Task to Assign' });
    taskId = task.id;
  });

  describe('Happy Path', () => {
    it('should assign a task to a user successfully', async () => {
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'John Doe' })
        .expect(200);

      expect(response.body).toHaveProperty('id', taskId);
      expect(response.body).toHaveProperty('assignee', 'John Doe');
      expect(response.body).toHaveProperty('title', 'Task to Assign');
    });

    it('should persist the assignee to the task', async () => {
      await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'Jane Smith' })
        .expect(200);

      // Verify it's persisted by fetching the task
      const task = taskService.findById(taskId);
      expect(task.assignee).toBe('Jane Smith');
    });

    it('should allow reassigning a task', async () => {
      // First assignment
      await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'John Doe' })
        .expect(200);

      // Reassign to someone else
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'Jane Smith' })
        .expect(200);

      expect(response.body.assignee).toBe('Jane Smith');
    });

    it('should work with names containing special characters', async () => {
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: "O'Brien-Smith Jr." })
        .expect(200);

      expect(response.body.assignee).toBe("O'Brien-Smith Jr.");
    });

    it('should work with unicode names', async () => {
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: '李明 (Li Ming)' })
        .expect(200);

      expect(response.body.assignee).toBe('李明 (Li Ming)');
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'John Doe' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 when assignee is missing', async () => {
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('assignee');
    });

    it('should return 400 when assignee is not a string', async () => {
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 12345 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('assignee');
    });

    it('should return 400 when assignee is an empty string', async () => {
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('assignee');
    });

    it('should return 400 when assignee is only whitespace', async () => {
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('assignee');
    });

    it('should return 400 when assignee is null', async () => {
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: null })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Integration with Other Fields', () => {
    it('should not modify other task fields when assigning', async () => {
      const originalTask = taskService.findById(taskId);
      
      await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'John Doe' })
        .expect(200);

      const updatedTask = taskService.findById(taskId);
      expect(updatedTask.title).toBe(originalTask.title);
      expect(updatedTask.status).toBe(originalTask.status);
      expect(updatedTask.priority).toBe(originalTask.priority);
      expect(updatedTask.createdAt).toBe(originalTask.createdAt);
    });

    it('should work on tasks with different statuses', async () => {
      const todoTask = taskService.create({ title: 'Todo', status: 'todo' });
      const inProgressTask = taskService.create({ title: 'In Progress', status: 'in_progress' });
      const doneTask = taskService.create({ title: 'Done', status: 'done' });

      await request(app)
        .patch(`/tasks/${todoTask.id}/assign`)
        .send({ assignee: 'User 1' })
        .expect(200);

      await request(app)
        .patch(`/tasks/${inProgressTask.id}/assign`)
        .send({ assignee: 'User 2' })
        .expect(200);

      await request(app)
        .patch(`/tasks/${doneTask.id}/assign`)
        .send({ assignee: 'User 3' })
        .expect(200);

      expect(taskService.findById(todoTask.id).assignee).toBe('User 1');
      expect(taskService.findById(inProgressTask.id).assignee).toBe('User 2');
      expect(taskService.findById(doneTask.id).assignee).toBe('User 3');
    });

    it('should allow assigning and then completing a task', async () => {
      await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: 'John Doe' })
        .expect(200);

      const response = await request(app)
        .patch(`/tasks/${taskId}/complete`)
        .expect(200);

      expect(response.body.assignee).toBe('John Doe');
      expect(response.body.status).toBe('done');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long assignee names', async () => {
      const longName = 'A'.repeat(1000);
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: longName })
        .expect(200);

      expect(response.body.assignee).toBe(longName);
    });

    it('should trim whitespace from assignee names', async () => {
      const response = await request(app)
        .patch(`/tasks/${taskId}/assign`)
        .send({ assignee: '  John Doe  ' })
        .expect(200);

      // Decision: Should we trim? This test documents the behavior
      // For now, we'll accept the trimmed value
      expect(response.body.assignee).toBe('John Doe');
    });
  });
});
