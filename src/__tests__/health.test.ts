import request from 'supertest';
import app from '../app';

describe('Violation Service Health Check', () => {
  it('should return 200 and correct response', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('service', 'violation-service');
  });
});
