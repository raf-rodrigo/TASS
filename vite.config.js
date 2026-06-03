import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/tass/' : '/',
  plugins: [
    vue()
  ],
  server: {
    port: 5175,
    strictPort: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [], // Podemos adicionar um arquivo de setup se necessário futuramente
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
}))
