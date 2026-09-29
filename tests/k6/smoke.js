import { runFullUserJourney, BASE_URL } from './common.js';

export const options = {
  vus: 2,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<2500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    custom_success_rate: ['rate>0.99'],
    custom_ttfb: ['p(95)<1200'],
  },
};

export default function runSmokeTest() {
  runFullUserJourney(BASE_URL);
}
