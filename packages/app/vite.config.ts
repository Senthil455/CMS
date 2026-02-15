import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'


// https://vite.dev/config/
const CMS_TARGET = 'http://127.0.0.1:5000';
const APP_TARGET = 'http://127.0.0.1:3001';

export default defineConfig({
  base: '/app/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
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
        target: CMS_TARGET,
        changeOrigin: true,
      },
      '/api': {
        target: CMS_TARGET,
        changeOrigin: true,
      },
      '/graphql': {
        target: CMS_TARGET,
        changeOrigin: true,
      },
      '/cmsapi': {
        target: APP_TARGET,
        changeOrigin: true,
        ws: true,
      },
      '/admin': {
        target: APP_TARGET,
        changeOrigin: true,
      },
      '/portal': {
        target: APP_TARGET,
        changeOrigin: true,
      },
    },
  },
})
