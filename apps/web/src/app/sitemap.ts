import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://writer.lmms-lab.com";

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/download`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/docs`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), priority: 0.5 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), priority: 0.5 },
  ];

  const contentDir = path.join(process.cwd(), "content/docs");
  const docPages: MetadataRoute.Sitemap = [];

  if (fs.existsSync(contentDir)) {
    const files = fs.readdirSync(contentDir);
    files
      .filter((file) => file.endsWith(".mdx"))
      .forEach((file) => {
        const slug = file.replace(/\.mdx$/, "");
        docPages.push({
          url: `${baseUrl}/docs/${slug}`,
          lastModified: new Date(),
          priority: 0.7,
        });
      });
  }

  return [...staticPages, ...docPages];
}
