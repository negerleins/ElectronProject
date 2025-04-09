import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
    fastRefresh: true,
  })],
  base: './',
  build: {
    outDir: 'dist-interface',
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
