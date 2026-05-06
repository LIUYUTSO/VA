/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ico|png|jpg|jpeg|gif)$/i,
      type: 'asset/resource'
    });
    return config;
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
}

module.exports = nextConfig
