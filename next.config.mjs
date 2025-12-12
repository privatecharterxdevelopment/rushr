// next.config.mjs
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Set turbopack root to fix build panic
  turbopack: {
    root: __dirname,
  },
  // If you added any custom config, keep it here.
  // experimental: { typedRoutes: true },
  // images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
}

export default nextConfig
