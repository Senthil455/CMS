import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'


// https://vite.dev/config/
export default defineConfig({
  base: '/app/',
  plugins: [
    react(),
    tailwindcss(),
    ((monacoEditorPlugin as any).default || monacoEditorPlugin)({
      languageWorkers: ['editorWorkerService', 'json', 'typescript'],
      customWorkers: [
        {
          label: 'graphql',
          entry: 'monaco-graphql/esm/graphql.worker',
        }
      ]
    }),
  ],

  server: {
    host: '127.0.0.1',
    proxy: {
      '/files': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
