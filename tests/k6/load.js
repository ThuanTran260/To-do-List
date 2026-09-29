import { runFullUserJourney, BASE_URL } from './common.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp-up to 10 VUs
    { duration: '1m', target: 25 },  // Steady load at 25 VUs
    { duration: '30s', target: 0 },  // Ramp-down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    http_req_failed: ['rate<0.03'],
    checks: ['rate>0.97'],
    custom_success_rate: ['rate>0.97'],
  },
};

export default function runLoadTest() {
  runFullUserJourney(BASE_URL);
}
