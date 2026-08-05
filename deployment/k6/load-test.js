import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Peak at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be under 1%
  },
};

export default function () {
  // Test Health Endpoint
  const healthRes = http.get('http://localhost:4000/health');
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // Test Media Extraction API Endpoint
  const payload = JSON.stringify({
    url: 'https://www.youtube.com/watch?v=-NVcoSWEF08',
  });
  const headers = { 'Content-Type': 'application/json' };

  const analyzeRes = http.post('http://localhost:4000/api/v1/analyze', payload, { headers });
  check(analyzeRes, {
    'analyze status is 200': (r) => r.status === 200,
    'contains title': (r) => r.body.includes('title'),
  });

  sleep(1);
}
