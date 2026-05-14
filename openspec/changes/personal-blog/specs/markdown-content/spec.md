# Markdown Content Management Specification

## Overview

Markdown content management capability provides a structured way to author, organize, and render blog posts using Markdown and MDX formats. This enables easy content creation while maintaining rich formatting capabilities.

## Requirements

### Content Structure

**Frontmatter Format**
- Must include `title` (string, required)
- Must include `date` (ISO 8601 string, required)
- Must include `tags` (array of strings, required)
- Must include `description` (string, required)
- Optional `categories` (array of strings)
- Optional `image` (string URL)
- Optional `draft` (boolean, defaults to false)
- Optional `featured` (boolean, defaults to false)

**Content Organization**
- Posts must be stored in `src/content/blog/` directory
- File naming convention: `YYYY-MM-DD-title-slug.md`
- Each post must have unique slug based on title

### Rendering Requirements

**Markdown Support**
- Full Markdown syntax support
- Headers (H1-H6)
- Lists (ordered and unordered)
- Code blocks with language specification
- Blockquotes
- Links and images
- Tables
- Horizontal rules

**MDX Support**
- React components can be embedded
- Props can be passed to components
- Dynamic imports supported
- Style overrides within MDX

**Code Highlighting**
- Syntax highlighting for supported languages
- Line numbers optional
- Copy code button required

### Content Processing

**Post Processing Pipeline**
1. Frontmatter validation using Zod schema
2. Slug generation from title
3. Date normalization
4. Metadata extraction
5. Content sanitization
6. SEO metadata generation

**Automatic Metadata Generation**
- Extract description from first paragraph
- Generate canonical URLs
- Create open graph tags
- Generate meta description

## Implementation Details

### Content Schema (Zod)

```typescript
import { z } from 'zod';

export const postSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().datetime(),
  tags: z.array(z.string()),
  categories: z.array(z.string()).optional(),
  image: z.string().url().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  publishedAt: z.coerce.date(), // Convert to Date object
});
```

### Routing Strategy

- Blog listing page: `/blog`
- Article detail: `/blog/[slug]`
- RSS feed: `/rss.xml`
- Sitemap: `/sitemap-index.xml`

### Performance Considerations

- Static generation for all published posts
- Lazy load content for drafts
- CDN caching for static assets
- Image optimization via Astro

### Accessibility Requirements

- Proper heading hierarchy
- Alt text for images
- Semantic HTML structure
- Keyboard navigation support

## Acceptance Criteria

- [ ] Posts can be created with Markdown format
- [ ] Frontmatter validation prevents invalid posts
- [ ] MDX components render correctly
- [ ] Code blocks display with syntax highlighting
- [ ] SEO metadata is automatically generated
- [ ] URLs are clean and SEO-friendly
- [ ] Draft posts are not publicly accessible
- [ ] Featured posts are highlighted on homepage
- [ ] RSS feed generates correctly
- [ ] Sitemap includes all published posts
