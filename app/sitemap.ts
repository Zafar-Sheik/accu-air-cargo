import type { MetadataRoute } from "next";
import { catalogue } from "@/lib/catalogue";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || "http://localhost:3000";
  return [
    "",
    "/shop",
    "/ship",
    "/track",
    "/contact",
    "/services",
    "/faq",
    "/policies",
    ...catalogue.map((p) => "/shop/" + p.slug),
  ].map((path) => ({ url: base + path }));
}
