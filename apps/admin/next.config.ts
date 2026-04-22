import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@myexpensio/domain'],
}

export default nextConfig