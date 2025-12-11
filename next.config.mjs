// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // If you added any custom config, keep it here.
  // experimental: { typedRoutes: true },
  // images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },

  // Explicitly configure Turbopack (default in Next.js 16)
  turbopack: {},
}

export default nextConfig
