"use client";

import { Agentation } from "agentation";

/**
 * Dev-only visual-feedback widget (bottom-right toolbar). Lets us click UI
 * elements on the running preview and copy structured annotations for the agent.
 * Mounted from the root layout behind a `NODE_ENV === "development"` guard, so it
 * is tree-shaken out of production builds and never ships to the live site.
 */
export function AgentationDev() {
  return <Agentation />;
}
