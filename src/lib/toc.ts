export interface Heading {
  slug: string;
  text: string;
  depth: number;
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    const text = match[2].trim();
    const slug = generateSlug(text);

    headings.push({
      slug,
      text,
      depth,
    });
  }

  return headings;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}
