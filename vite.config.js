import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'radio-proxy',
      configureServer(server) {
        server.middlewares.use('/radio-proxy', async (req, res) => {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`).searchParams.get('url');
            if (!url) {
              res.statusCode = 400;
              return res.end('Missing URL parameter');
            }

            const response = await fetch(url);
            const data = await response.text();
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(data);
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      }
    }
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
})
