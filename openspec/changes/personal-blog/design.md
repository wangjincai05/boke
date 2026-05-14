## Architecture Design

### Tech Stack

**Frontend Framework**: Astro 4.x
- Modern static site generator
- Islands architecture for optimal performance
- First-class Markdown and MDX support

**Styling**: Tailwind CSS
- Utility-first CSS framework
- Dark mode support via CSS variables
- Responsive design

**Content Format**: Markdown + MDX
- Easy authoring with Markdown
- React components within Markdown via MDX
- Code syntax highlighting

**Icons**: Astro Icons / Lucide React
- SVG icons as components
- Lightweight and fast

**Deployment**: Vercel
- Automatic builds from Git
- Global CDN
- Preview deployments

### Project Structure

```
personal-blog/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   └── ThemeToggle.astro
│   │   ├── Content/
│   │   │   ├── ArticleCard.astro
│   │   │   ├── ArticleList.astro
│   │   │   ├── TagCloud.astro
│   │   │   └── SearchBar.astro
│   │   └── Navigation/
│   │       ├── Navigation.astro
│   │       └── Breadcrumb.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── blog/
│   │   │   ├── [slug].astro
│   │   │   └── index.astro
│   │   ├── tags/
│   │   │   └── [tag].astro
│   │   └── about.astro
│   ├── content/
│   │   ├── blog/
│   │   │   ├── 2024-01-01-introduction.md
│   │   │   ├── 2024-01-15-astro-guide.md
│   │   │   └── ...
│   │   └── config.ts (Zod schema for content validation)
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── BlogLayout.astro
│   │   └── ArticleLayout.astro
│   └── styles/
│       └── global.css
├── public/
│   ├── images/
│   ├── favicon.ico
│   └── robots.txt
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

### Component Architecture

#### Layout Components

**BaseLayout** (HOC pattern)
- Provides global structure
- Handles theme state management
- Includes metadata injection
- Wraps all pages

**BlogLayout**
- Optimized for blog listing
- Features sidebar with tags and recent posts
- Compact design for better readability

**ArticleLayout**
- Feature-rich article page
- Table of contents
- Related posts section
- Author bio

#### Content Components

**ArticleCard**
- Preview of blog post
- Thumbnail image support
- Category and tags
- Excerpt preview
- Read more link

**TagCloud**
- Interactive tag list
- Hover effects
- Category filtering
- Tag count display

**SearchBar**
- Client-side search
- Debounced input
- Real-time filtering
- Keyboard navigation

### Routing Structure

1. **Homepage** (`/`)
   - Latest posts featured
   - Quick access to categories
   - Search bar prominently displayed

2. **Blog Listing** (`/blog`)
   - Paginated post list
   - Filter by category
   - Sort options (date, title)
   - Featured posts

3. **Article Detail** (`/blog/[slug]`)
   - Full article content
   - Table of contents
   - Related posts
   - Breadcrumb navigation

4. **Tag Page** (`/tags/[tag]`)
   - All posts with specific tag
   - Tag description
   - Related tags

5. **About Page** (`/about`)
   - Author bio
   - Social links
   - Blog statistics

### Content Management

**Content Schema** (using Zod)
```typescript
interface Post {
  title: string;
  description: string;
  date: string;
  tags: string[];
  categories: string[];
  image?: string;
  draft?: boolean;
  featured?: boolean;
}
```

**Frontmatter Structure**
```yaml
---
title: "Article Title"
description: "Article description"
date: 2024-01-15T10:00:00Z
tags: ["astro", "tutorial"]
categories: ["frontend"]
image: "/images/article-cover.jpg"
featured: true
draft: false
---

# Content starts here
```

### Styling Approach

**CSS Architecture**
- Utility classes for layout and spacing
- Custom classes for specific components
- CSS variables for theming
- Dark mode via `[data-theme="dark"]` selector

**Responsive Design**
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly interactions
- Flexible typography

**Color System**
- Primary: Indigo-600
- Secondary: Slate-600
- Background: Slate-50 / Slate-900 (dark)
- Text: Slate-900 / Slate-100 (dark)
- Accent: Amber-500

### Performance Strategy

**Optimizations**
- Static site generation (SSG)
- Image optimization via Astro
- Code splitting per route
- Tree shaking
- Lazy loading components
- CDN caching

**Core Web Vitals**
- Fast First Contentful Paint (FCP)
- Low Largest Contentful Paint (LCP)
- Efficient Cumulative Layout Shift (CLS)
- Immediate Time to Interactive (TTI)

### Deployment Strategy

**Vercel Configuration**
- Automatic builds on push to main
- Environment variables for production
- Custom domain configuration
- Preview deployments for feature branches
- Analytics integration

**Build Process**
1. Run `npm install`
2. Build: `astro build`
3. Output: `.astro/output`
4. Deploy to Vercel via Git integration

**Continuous Deployment**
- Automated CI/CD pipeline
- Automated testing (optional)
- Deployment previews
- Rollback on failure
