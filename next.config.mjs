// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // If you added any custom config, keep it here.
  // experimental: { typedRoutes: true },
  // images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
}

export default nextConfig
