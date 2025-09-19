const request = require('supertest');

const app = require('../server/app');

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'OK',
      timestamp: expect.any(String),
      service: 'Agile Coach Agent'
    });
  });
});