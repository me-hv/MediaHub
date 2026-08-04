import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@mediahub/types', '@mediahub/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
