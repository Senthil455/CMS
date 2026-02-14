import { defineConfig } from 'vite'
// @ts-ignore
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/portal/', // Set the base path for all assets
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  }
})
