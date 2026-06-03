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
  const cleanedText = text
    // 去除链接格式 [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 去除强调格式 **text** 或 __text__
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // 去除斜体格式 *text* 或 _text_
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')
    // 去除行内代码 `text`
    .replace(/`([^`]+)`/g, '$1')
    // 去除图片格式 ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  return cleanedText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
}
