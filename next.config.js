const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // Add these configurations
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  images: {
    domains: ['boxpartner.blob.core.windows.net'], // Add the external domain here
  },
  // Ensure client-side navigation works properly
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, './src'),
      '@/components': path.join(__dirname, './src/components'),
      '@/lib': path.join(__dirname, './src/app/lib'),
      '@/app': path.join(__dirname, './src/app')
    };
    return config;
  },
}

module.exports = nextConfig;