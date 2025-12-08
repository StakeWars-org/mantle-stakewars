import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID
  },
};

export default nextConfig;
