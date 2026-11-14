/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server for the Devya VPS (left Vercel 2026-11-14).
  output: 'standalone',
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  async rewrites() {
    const upstream = process.env.API_PROXY_TARGET ?? 'https://api.devya-solutions.com';
    return [{ source: '/api/:path*', destination: `${upstream}/api/:path*` }];
  },
};

export default nextConfig;
