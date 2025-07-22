const request = require('supertest');
const express = require('express');
const app = require('./server'); // if you export app from api.js

describe('API Endpoints', () => {
  it('GET / should return a health check message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('API Threat Assessment Tool API is running.');
  });

  it('POST /scan should start a mock scan', async () => {
    const res = await request(app)
      .post('/scan')
      .send({ targetUrl: 'http://example.com' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'Scan started');
    expect(res.body).toHaveProperty('target', 'http://example.com');
    expect(res.body).toHaveProperty('scanId');
  });

  it('GET /results/:scanId should return mock scan results', async () => {
    const res = await request(app).get('/results/12345');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('scanId', '12345');
    expect(Array.isArray(res.body.vulnerabilities)).toBe(true);
  });

  it('GET /status/:scanId should return mock scan status', async () => {
    const res = await request(app).get('/status/12345');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('scanId', '12345');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('progress');
  });
});
