import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@myexpensio/domain'],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
