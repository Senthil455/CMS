# Design Tokens (Authoritative)

Design tokens define the visual language of the UI.
Components must use tokens, not raw Tailwind colors.

---

## General Rules

- All colors must come from Tailwind theme tokens
- No direct use of Tailwind default palette in components
  (e.g. `bg-gray-900`, `text-yellow-400`)
- Tokens must be semantic, not visual

---

## Color Tokens

### Background
- bg-app       → app background
- bg-surface   → cards, panels
- bg-muted     → secondary background

### Text
- text-primary
- text-secondary
- text-muted

### Border
- border-default
- border-muted

---

## Theme Support

- Tokens must support both light and dark themes
- Components must not care about light/dark directly
