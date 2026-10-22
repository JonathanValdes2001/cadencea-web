import type { MetadataRoute } from "next";
import { isPreviewSite } from "@/lib/site-channel.mjs";

// Previews (the v2 site, branch previews, local runs) are never crawled.
export default function robots(): MetadataRoute.Robots {
  if (isPreviewSite()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" } };
}
