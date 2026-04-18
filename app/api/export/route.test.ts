import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Export API Route', () => {
  test('should return 400 for missing URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/export', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('should return 400 for non-HTTPS URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/export', {
      method: 'POST',
      body: JSON.stringify({ url: 'http://example.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  test('should return 400 for empty URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/export', {
      method: 'POST',
      body: JSON.stringify({ url: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
