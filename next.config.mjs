// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // If you added any custom config, keep it here.
  // experimental: { typedRoutes: true },
  // images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },

  // Ignore ESLint errors during builds (warnings shouldn't fail the build)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
