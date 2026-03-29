import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'


// https://vite.dev/config/
const CMS_TARGET = 'http://127.0.0.1:5000';
const APP_TARGET = 'http://127.0.0.1:3001';

export default defineConfig({
  base: '/app/',
  define: {
    __APP_BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
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
      ],
      customDistPath: (root: string, buildOutDir: string, _base: string) => {
        // The plugin defaults to path.join(root, outDir, base, publicPath),
        // which creates dist/app/monacoeditorwork/. But Fastify serves
        // /app/ prefix from the dist/ root, so the workers need to be at
        // dist/monacoeditorwork/ (without the extra base nesting).
        return `${root}/${buildOutDir}/monacoeditorwork`;
      },
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
