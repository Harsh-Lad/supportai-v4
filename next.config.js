/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // Enable for Docker; Vercel doesn't need this
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'natural', 'pdf-parse', 'mammoth'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    return config;
  },
}

module.exports = nextConfig
