import { runFullUserJourney, BASE_URL } from './common.js';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp-up to 20 VUs
    { duration: '1m', target: 50 },  // Increase to 50 VUs
    { duration: '1m', target: 80 },  // Push to 80 VUs
    { duration: '30s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.10'],
  },
};

export default function runStressTest() {
  runFullUserJourney(BASE_URL);
}
