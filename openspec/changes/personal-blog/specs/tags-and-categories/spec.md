# Tags and Categories Specification

## Overview

Tags and categories system enables organization and filtering of blog posts, providing a structured way to navigate content and help users discover relevant articles.

## Requirements

### Tag System

**Tag Properties**
- Unique identifier (slug)
- Display name
- Count of associated posts
- Associated categories (optional)

**Tag Behavior**
- Tags are case-insensitive
- Multiple tags per post allowed
- Tag links to filtered post list
- Hover effects for interactivity
- Tag clouds display tag counts

### Category System

**Category Properties**
- Unique identifier (slug)
- Display name
- Description
- Associated tags (optional)
- Order/priority for display

**Category Behavior**
- Categories can have multiple tags
- Single category per post
- Categories can be hierarchical (optional)
- Category links to filtered post list

### Filtering System

**Filter Logic**
- Can filter by single tag or category
- Can combine multiple tags (AND logic)
- Can exclude tags (NOT logic)
- Result URL contains filter parameters

**Filter Persistence**
- Filter state is URL-based
- Filter persists across navigation
- Clear filter button available
- Filter applied immediately

### UI Requirements

**Tag Display**
- Widget component for tag cloud
- Tag list in sidebar
- Tag chips in article list
- Tag count badges
- Active tag highlighting
- Responsive tag grid

**Category Display**
- Sidebar navigation
- Category dropdown (mobile)
- Category badges
- Active category highlighting
- Category descriptions

### Data Management

**Tag Extraction**
- Extract tags from post frontmatter
- Auto-generate tag slugs
- Track tag usage counts
- Remove unused tags (cleanup)

**Category Association**
- Extract categories from post frontmatter
- Validate category names
- Maintain category metadata
- Update category counts

## Implementation Details

### Data Structure

```typescript
interface Tag {
  slug: string;
  name: string;
  count: number;
  description?: string;
}

interface Category {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  posts: number;
}

interface PostWithTags {
  slug: string;
  title: string;
  tags: string[];
  categories: string[];
  date: string;
  description: string;
}
```

### Tag Cloud Component

**Features**
- Display all tags with counts
- Sort by popularity
- Filter by category
- Interactive hover effects
- Click to filter posts

### Category Sidebar

**Features**
- Hierarchical category tree
- Active category highlighting
- Post count per category
- Quick navigation
- Expand/collapse categories

### Tag Filter Component

**Features**
- Multi-select tag filter
- "All tags" option
- "Clear filters" button
- Filter count display
- URL parameter management

## Routing Strategy

**Tag Pages**
- Single tag: `/tags/[tag]`
- Tag query param: `/blog?tag=javascript`

**Category Pages**
- Single category: `/categories/[category]`
- Category query param: `/blog?category=astro`

**Filter Combination**
- Multiple tags: `/blog?tag=astro&tag=tutorial`
- Exclude tag: `/blog?tag=astro&exclude=programming`
- Category + tag: `/blog?category=frontend&tag=astro`

## Performance Considerations

- Tag counts pre-computed at build time
- Filtered queries use Astro query API
- Minimal JavaScript for tag interactions
- Optimistic UI updates
- URL-based state for sharing

## Accessibility Requirements

- Keyboard navigation for all filters
- Screen reader announcements for active filters
- Clear indication of selected filters
- Filter clear button high-contrast
- Focus management when opening filters

## Acceptance Criteria

- [ ] Posts can have multiple tags and categories
- [ ] Tag cloud displays with correct counts
- [ ] Clicking tag filters post list
- [ ] Category sidebar shows post counts
- [ ] Multiple tags can be combined in filter
- [ ] Filter state persists in URL
- [ ] Clear filters button works correctly
- [ ] Active filter is visually indicated
- [ ] Filter results update without full page reload
- [ ] Tags are auto-generated from frontmatter
- [ ] Unused tags can be cleaned up
