/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // The root monorepo .eslintrc.json references "next/core-web-vitals" which
    // isn't available outside the frontend package. Ignore ESLint during builds
    // to prevent false failures — linting is still enforced in CI separately.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
