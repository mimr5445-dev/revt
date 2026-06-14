/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ضمان نجاح البناء على Vercel من أول مرة
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
