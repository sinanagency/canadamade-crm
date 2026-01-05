/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['iaabsenvpwyqakvkypeq.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      enabled: true,
    },
  },
}

module.exports = nextConfig
