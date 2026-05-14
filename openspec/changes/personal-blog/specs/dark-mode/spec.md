# Dark Mode Specification

## Overview

Dark mode capability provides a light/dark theme toggle that adapts the entire blog interface to user preference. This improves accessibility and user comfort in different lighting conditions.

## Requirements

### Theme System

**Theme Types**
- Light mode (default)
- Dark mode
- System preference detection

**Theme Persistence**
- User preference saved to localStorage
- Preference remembered across sessions
- Default to system preference if not set
- Theme flag in URL for sharing

### Toggle Interface

**Toggle Component**
- Button/icon to switch themes
- Visual indicator of current theme
- Smooth theme transition animation
- Accessible aria labels
- Keyboard navigation support

**Toggle Placement**
- Header/navigation bar
- Sidebar (desktop)
- Bottom of page (mobile)
- Consistent placement across pages

### UI Adaptation

**Color Changes**
- Background colors invert
- Text colors invert
- Borders and dividers invert
- Card backgrounds invert
- Code block themes adapt

**Theme-Specific Elements**
- Dark: Deep slate backgrounds
- Light: Off-white backgrounds
- Both: Consistent borders and shadows

### CSS Architecture

**CSS Variables**
- Use CSS custom properties for theming
- Theme selector: `[data-theme="dark"]`
- Default: `[data-theme="light"]`
- System detection: `@media (prefers-color-scheme: dark)`

**Implementation Strategy**
- Base styles in global.css
- Tailwind dark mode utilities
- Custom component styles
- Theme transition CSS

### Theme Transition

**Smooth Transitions**
- Background transitions (0.3s ease)
- Color transitions (0.2s ease)
- Avoid layout shift
- Preserve content visibility during transition

**Optimization**
- Minimal JavaScript
- CSS-driven transitions
- Avoid expensive reflows
- Hardware accelerated animations

## Implementation Details

### Theme Storage

```typescript
// Theme management utility
interface ThemeManager {
  getTheme(): 'light' | 'dark' | 'system';
  setTheme(theme: 'light' | 'dark'): void;
  setSystemPreference(): void;
  applyTheme(theme: string): void;
}
```

### Tailwind Configuration

```javascript
// tailwind.config.mjs
export default {
  darkMode: 'class', // or 'media' for system preference
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // ... theme-specific colors
      },
    },
  },
};
```

### Component Structure

```astro
<!-- ThemeToggle.astro -->
<client:load>
  <script define:vars={isDark}>
    // Theme management logic
  </script>
</client:load>

<button aria-label="Toggle dark mode">
  {isDark ? '☀' : '🌙'}
</button>
```

### Global Styles

```css
/* global.css */
:root {
  --background: 240 10% 98%;
  --foreground: 240 10% 3%;
  --card: 240 10% 98%;
  --card-foreground: 240 10% 3%;
}

[data-theme="dark"] {
  --background: 240 10% 3%;
  --foreground: 240 10% 98%;
  --card: 240 10% 3%;
  --card-foreground: 240 10% 98%;
}

* {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* Smooth transitions */
body {
  transition: background-color 0.3s ease, color 0.2s ease;
}
```

## Accessibility Requirements

### Keyboard Navigation

- Toggle button focusable
- Tab order navigation
- Enter/Space to toggle
- Focus indicators
- Clear button descriptions

### Screen Reader Support

- ARIA label: "Toggle dark mode"
- Current theme announcement
- State changes announced
- Focus management

### Visual Accessibility

- High contrast in both modes
- Clear visual indicators
- No color-only information
- Respects user preferences

## Performance Considerations

- Minimal JavaScript overhead
- CSS-driven theme switching
- No theme download on initial load
- Fast color transitions
- No layout shifts during transition

## Theme Sync

**Across Pages**
- Theme persists on navigation
- No theme reload on page change
- URL parameter for sharing theme preference

**Cross-Device**
- localStorage sync
- System preference detection
- User can override system preference

## Acceptance Criteria

- [ ] Light/dark toggle works in header
- [ ] Theme preference persists across sessions
- [ ] Smooth theme transition animation
- [ ] System preference is detected correctly
- [ ] URL parameter updates with theme change
- [ ] All colors adapt to current theme
- [ ] Toggle button is keyboard accessible
- [ ] Toggle button is screen reader accessible
- [ ] High contrast maintained in both modes
- [ ] No visual glitches during theme switch
- [ ] Icon changes to indicate current theme
- [ ] Theme preference shared via URL
