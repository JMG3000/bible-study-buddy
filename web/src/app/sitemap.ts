import type { MetadataRoute } from "next";
import {
  getPublishedPlanSlugs,
  getPublishedStudySeriesSlugs,
} from "@/lib/lesson-plans";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [slugs, studySeriesSlugs] = await Promise.all([
    getPublishedPlanSlugs(),
    getPublishedStudySeriesSlugs(),
  ]);

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
    ...studySeriesSlugs.map((slug) => ({
      url: `${siteConfig.url}/series/${slug}`,
      lastModified: now,
    })),
  ];
}
