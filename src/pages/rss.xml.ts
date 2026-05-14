import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "../config";

export async function GET() {
  const posts = await getCollection("blog");
  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: siteConfig.url,
    items: posts
      .filter((p) => !p.data.draft)
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `/blog/${post.slug}`,
      })),
  });
}