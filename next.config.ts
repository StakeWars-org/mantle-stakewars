import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID
  },
  serverExternalPackages: ['thread-stream', 'pino'],
  turbopack: {
    resolveAlias: {
      'tap': path.join(__dirname, 'empty-module.js'),
      'why-is-node-running': path.join(__dirname, 'empty-module.js'),
      '@react-native-async-storage/async-storage': path.join(__dirname, 'empty-module.js'),
    },
  },
};

export default nextConfig;
