import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getUsersDuration = new Trend('get_users_duration', true);
export const RateStatusOK = new Rate('status_code_200');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Início com 10 VUs
    // { duration: '3m', target: 300 },  // Rampa até 300 VUs
    // { duration: '1m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.12'],                        // <12% de falhas
    get_users_duration: ['p(95)<5700'],                    // 95% abaixo de 5700ms
    status_code_200: ['rate>0.95'],                        // >95% com status 200
  }
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const url = 'https://jsonplaceholder.typicode.com/todos/1';

  const res = http.get(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  getUsersDuration.add(res.timings.duration);
  RateStatusOK.add(res.status === 200);

  check(res, {
    'GET /users - status 200': () => res.status === 200
  });
}
