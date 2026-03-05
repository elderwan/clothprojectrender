import request from 'supertest';
import app from '../../src/app.js';

describe('Auth API', () => {
  it('GET /api/auth/me should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('POST /api/auth/login should validate required fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '', password: '' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Email and password are required.' });
  });
});
