import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    PRIVY_APP_ID: process.env.PRIVY_APP_ID,
    FIREBASE_API_ID: process.env.FIREBASE_API_ID,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    MAX: process.env.MAX,
    STARTING: process.env.STARTING,
    REGENERATION_PER_TURN: process.env.REGENERATION_PER_TURN,
    CRITICAL_HIT_REWARD: process.env.CRITICAL_HIT_REWARD,
    COOLDOWN_TURNS: process.env.COOLDOWN_TURNS
  },
};

export default nextConfig;
