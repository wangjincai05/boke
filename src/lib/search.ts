export async function getSearchIndex() {
  const modules = import.meta.glob("../content/blog/*.md", { eager: false });
  const posts: any[] = [];

  for (const [path, loader] of Object.entries(modules)) {
    const mod = (await loader()) as any;
    const slug = path.replace("../content/blog/", "").replace(".md", "");
    posts.push({
      slug,
      title: mod.frontmatter.title,
      description: mod.frontmatter.description,
      tags: mod.frontmatter.tags || [],
      content: mod.rawContent?.() ?? "",
      date: mod.frontmatter.date,
    });
  }

  return posts.filter((p) => !p.draft);
}

export function getAllTags(
  posts: Array<{ data: { tags: string[] } }>,
): Array<{ name: string; count: number }> {
  const tagMap = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllCategories(
  posts: Array<{ data: { categories: string[] } }>,
): Array<{ name: string; count: number }> {
  const catMap = new Map<string, number>();
  for (const post of posts) {
    for (const cat of post.data.categories) {
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    }
  }
  return Array.from(catMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}