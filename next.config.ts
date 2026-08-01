import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cấu hình serverExternalPackages cho Next.js App Router để xử lý isomorphic-dompurify và jsdom
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom', 'canvas'],
  // Khai báo turbopack rỗng để tương thích Next.js 16 mặc định Turbopack
  turbopack: {},
};

export default nextConfig;
