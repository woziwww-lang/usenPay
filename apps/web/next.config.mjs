/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@usen-pay/domain", "@usen-pay/ui"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
