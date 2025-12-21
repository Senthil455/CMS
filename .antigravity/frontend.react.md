# Frontend Architecture (React + Vite)

## General
- Use React with Vite
- TypeScript strict mode

## Separation of Concerns
- UI components must not call APIs directly
- API calls live in hooks only
- Hooks import endpoint definitions from shared

## Folder Structure

/pages/pageA/
  index.tsx        # entry point
  hooks/           # API & logic
  components/      # page-specific UI

/components/
  # shared UI components only
