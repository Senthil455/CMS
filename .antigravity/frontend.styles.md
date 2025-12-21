# Frontend Styling Rules (Authoritative)

These rules define how all frontend UI must be styled.
They override any default or inferred styling behavior.

---

## 1. Styling System

- Use **Tailwind CSS v4** as the primary styling solution
- Use the `@tailwindcss/vite` plugin for build-time processing
- Tailwind utility classes are the default
- Avoid custom CSS unless Tailwind cannot express the rule

---

## 2. Configuration (Tailwind v4)

- **CSS-First**: All Tailwind configuration (theme, custom utilities, variants) MUST live inside the main CSS entry point (`src/index.css`) within `@theme` or `@layer` blocks.
- **Forbidden**: `tailwind.config.js` and `postcss.config.js` are forbidden.
- **Directives**: Use `@import "tailwindcss";` instead of the legacy `@tailwind` directives.

---

## 3. Forbidden Patterns

- Inline styles (`style={{}}`)
- CSS-in-JS libraries (styled-components, emotion)
- Random global CSS files
- Hardcoded colors or spacing values

---

## 4. Code Quality

- Class names must be readable and grouped logically
- Avoid excessive class lists
- Prefer shared components for repeated patterns

---

## 5. Themes

### Supported Themes
- Light theme: light yellow background, dark text
- Dark theme: dark gray background, light text

### rules
- Themes are implemented using Tailwind CSS v4 variables
- Use the `dark` class strategy
- Colors must come from `@theme` block in CSS
- No hardcoded hex or RGB values in components

### Theme Scope
- Theme switching logic lives outside UI components
- Components must support both themes by default
---

## 6. Responsiveness

### Mobile First
- Base styles target mobile screens
- Larger screens enhance layout using responsive prefixes

### Requirements
- UI must be usable on small screens
- No fixed widths
- Avoid absolute positioning for layout
- Touch targets must be accessible

### Layout Patterns
- Prefer flexbox and grid
- Stack vertically on mobile
- Progressive enhancement for tablets and desktops
