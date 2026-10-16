import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uses the route-segment `revalidate` + revalidatePath caching model (ISR).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // One canonical host for search engines: www.statlabs.si permanently redirects to statlabs.si.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.statlabs.si" }],
        destination: "https://statlabs.si/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
