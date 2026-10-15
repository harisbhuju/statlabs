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
};

export default nextConfig;
