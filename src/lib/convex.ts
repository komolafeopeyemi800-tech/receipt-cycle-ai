import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Receipt Cycle web app is missing its server URL. Check the project configuration for developers.");
}

export const convex = new ConvexReactClient(convexUrl);
