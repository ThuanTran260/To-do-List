import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics
export const ttfbTrend = new Trend('custom_ttfb');
export const successRate = new Rate('custom_success_rate');

// Target Base URL (override via -e BASE_URL=...)
export const BASE_URL = __ENV.BASE_URL || 'https://to-do-list-pied-kappa.vercel.app';

/**
 * Executes a full simulated user journey through Flow State
 * @param {string} baseUrl
 */
export function runFullUserJourney(baseUrl = BASE_URL) {
  const params = {
    headers: {
      'User-Agent': 'k6-load-test/1.0 (FlowState Performance Test)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    tags: { name: 'LandingPage' },
  };

  // 1. Landing Page (SSR/SSG)
  const homeRes = http.get(`${baseUrl}/`, params);
  ttfbTrend.add(homeRes.timings.waiting);
  const homeOk = check(homeRes, {
    'landing page status is 200': (r) => r.status === 200,
    'landing page has HTML body': (r) => r.body && r.body.length > 500,
  });
  successRate.add(homeOk);

  sleep(0.5);

  // 2. Login Page
  const loginRes = http.get(`${baseUrl}/login`, {
    headers: params.headers,
    tags: { name: 'LoginPage' },
  });
  ttfbTrend.add(loginRes.timings.waiting);
  const loginOk = check(loginRes, {
    'login page status is 200': (r) => r.status === 200,
    'login page has body content': (r) => r.body && r.body.length > 200,
  });
  successRate.add(loginOk);

  sleep(0.5);

  // 3. Public API: CSRF Token
  const csrfRes = http.get(`${baseUrl}/api/csrf-token`, {
    headers: {
      'User-Agent': params.headers['User-Agent'],
      'Accept': 'application/json',
    },
    tags: { name: 'CSRF_API' },
  });
  ttfbTrend.add(csrfRes.timings.waiting);
  const csrfOk = check(csrfRes, {
    'csrf token status is 200': (r) => r.status === 200,
    'csrf response has csrfToken field': (r) => {
      try {
        const json = r.json();
        return json && (typeof json.csrfToken === 'string' || typeof json.token === 'string');
      } catch {
        return false;
      }
    },
  });
  successRate.add(csrfOk);

  sleep(0.5);

  // 4. Protected Route: Dashboard (Expect redirect 307 or 302 to login when unauthenticated)
  const dashRes = http.get(`${baseUrl}/dashboard`, {
    headers: params.headers,
    redirects: 0,
    tags: { name: 'ProtectedDashboard' },
  });
  ttfbTrend.add(dashRes.timings.waiting);
  const dashOk = check(dashRes, {
    'protected route redirects to login or 200': (r) =>
      r.status === 307 || r.status === 302 || r.status === 200,
  });
  successRate.add(dashOk);

  sleep(0.5);
}
