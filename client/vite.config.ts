import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true, // Don't try other ports if 5173 is busy
    host: true,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    outDir: '../dist/public',
  },
}) 