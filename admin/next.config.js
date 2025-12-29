/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output as standalone for Vercel
  output: 'standalone',
  // API routes will be handled by Vercel serverless functions
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*', // Proxy to Vercel API routes
      },
    ];
  },
};

module.exports = nextConfig;

