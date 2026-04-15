import type { MetadataRoute } from "next";
import { getPublishedPlanSlugs } from "@/lib/lesson-plans";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const slugs = await getPublishedPlanSlugs();

  return [
    {
      url: siteConfig.url,
      lastModified: now,
    },
    {
      url: `${siteConfig.url}/plans`,
      lastModified: now,
    },
    ...slugs.map((slug) => ({
      url: `${siteConfig.url}/plans/${slug}`,
      lastModified: now,
    })),
  ];
}
