"use client";

import { useEffect, useState } from "react";
import { LogoCrawl } from "./LogoCrawl";
import { LogosPanel } from "./LogosPanel";
import { LOGO_CRAWL_DEFAULTS, type LogoCrawlConfig } from "./logos";

/**
 * Playground wrapper for the logo crawl. Owns the live config and mounts the dev
 * dial kit only in development or when the URL has `?dials=1`. Used by
 * /playground/logos to tune the motion before baking the config into
 * LOGO_CRAWL_DEFAULTS and dropping <LogoCrawl /> under the hero.
 */
export function LogosWithDials() {
  const [config, setConfig] = useState<LogoCrawlConfig>(LOGO_CRAWL_DEFAULTS);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const enabled =
      process.env.NODE_ENV === "development" ||
      new URLSearchParams(window.location.search).has("dials");
    setShowPanel(enabled);
  }, []);

  return (
    <>
      <LogoCrawl config={config} />
      {showPanel ? <LogosPanel config={config} onChange={setConfig} /> : null}
    </>
  );
}
