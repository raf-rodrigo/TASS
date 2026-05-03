import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5175,
    strictPort: true
  },
  build: {
    // Aumentamos o limite para 1000kB para acomodar bibliotecas de UI ricas
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Separa as bibliotecas (node_modules) em um arquivo 'vendor' dedicado
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
