import { fileURLToPath, URL } from 'node:url'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  server: {
    proxy: {
      '/api/docling': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/docling/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err) => {
            console.log('Erro no proxy:', err);
          });
          proxy.on('proxyReq', (_, req) => {
            console.log(`Proxy request: ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`Proxy response: ${proxyRes.statusCode} ${req.url}`);
          });
        }
      }
    }
  }
})
