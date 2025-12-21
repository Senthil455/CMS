# Frontend Vite Rules (Authoritative)

These rules define the Vite configuration for the frontend application.

---

## 1. Tooling

- Use **Vite** as the build tool and development server.
- The configuration file is `vite.config.ts`.

---

## 2. Plugins

- **React**: Use `@vitejs/plugin-react` for React support.
- **Tailwind CSS**: Use `@tailwindcss/vite` for Tailwind CSS v4 support.
- All plugins must be correctly registered in the `plugins` array of `defineConfig`.

---

## 3. Configuration Patterns

- **CSS-First**: Rely on the `@tailwindcss/vite` plugin to process styles. 
- **No Legacy Config**: Do NOT use `tailwind.config.js` or `postcss.config.js` as they are deprecated in favor of the Vite-native/CSS-first approach in Tailwind v4.
- **Proxy**: (If applicable) API proxying should be configured in `server.proxy` to avoid CORS issues during development.
