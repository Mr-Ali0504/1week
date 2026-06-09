const request = require('supertest');
const { Pool } = require('pg');

// Mock the pg module before requiring app
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const app = require('./index');

describe('Backend API Routes', () => {
  let pool;

  beforeEach(() => {
    // Get the mocked pool instance
    pool = new Pool();
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('OK');
    });
  });

  describe('GET /api/tasks', () => {
    it('should return a list of tasks', async () => {
      const mockTasks = [{ id: 1, title: 'Test Task', status: 'pending' }];
      pool.query.mockResolvedValueOnce({ rows: mockTasks });

      const res = await request(app).get('/api/tasks');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockTasks);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM tasks ORDER BY id ASC');
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/tasks');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Server error');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a single task', async () => {
      const mockTask = { id: 1, title: 'Test Task', status: 'pending' };
      pool.query.mockResolvedValueOnce({ rows: [mockTask] });

      const res = await request(app).get('/api/tasks/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockTask);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM tasks WHERE id = $1', ['1']);
    });

    it('should return 404 if task not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/tasks/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Task not found');
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/tasks/1');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Server error');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const newTask = { title: 'New Task', description: 'Desc' };
      const createdTask = { id: 2, ...newTask, status: 'pending' };
      pool.query.mockResolvedValueOnce({ rows: [createdTask] });

      const res = await request(app).post('/api/tasks').send(newTask);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(createdTask);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
        ['New Task', 'Desc']
      );
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).post('/api/tasks').send({ title: 'T' });
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Server error');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const updatedTask = { id: 1, title: 'Test Task', status: 'completed' };
      pool.query.mockResolvedValueOnce({ rows: [updatedTask] });

      const res = await request(app).put('/api/tasks/1').send({ status: 'completed' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(updatedTask);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
        ['completed', '1']
      );
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).put('/api/tasks/1').send({ status: 'done' });
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Server error');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const res = await request(app).delete('/api/tasks/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Task deleted successfully');
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM tasks WHERE id = $1 RETURNING *', ['1']);
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).delete('/api/tasks/1');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Server error');
    });
  });
});
