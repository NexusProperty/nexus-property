import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 10 }, // ramp up to 10 users
    { duration: '30s', target: 10 }, // stay at 10 users
    { duration: '10s', target: 0 },  // ramp down
  ],
};

export default function () {
  // Test authentication endpoint
  let loginRes = http.post('http://localhost:5173/api/auth/login', { email: 'test@example.com', password: 'password' });
  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test data access endpoint
  let dataRes = http.get('http://localhost:5173/api/data');
  check(dataRes, {
    'data status is 200': (r) => r.status === 200,
    'data time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test another API endpoint
  let apiRes = http.get('http://localhost:5173/api/health');
  check(apiRes, {
    'health status is 200': (r) => r.status === 200,
    'health time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
} 