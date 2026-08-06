import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME-type sniffing (e.g. serving JS as text/html)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent the page from being embedded in an iframe (clickjacking protection)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Legacy XSS filter for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Control referrer information sent with requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser feature access
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Force HTTPS for 2 years, including subdomains (only effective on HTTPS)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  turbopack: {},

  // Apply security headers to ALL responses (including static assets).
  // This complements the middleware.ts headers which only run on matched routes.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
