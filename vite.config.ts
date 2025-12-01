import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        visualizer({
          open: true,
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            admin: path.resolve(__dirname, 'admin.html'),
          },
          output: {
            manualChunks(id) {
              // React core libraries
              if (id.includes('node_modules/react/') ||
                  id.includes('node_modules/react-dom/') ||
                  id.includes('node_modules/scheduler/') ||
                  id.includes('node_modules/react-router-dom/')) {
                return 'vendor-react';
              }
              // Leaflet mapping
              if (id.includes('node_modules/leaflet') ||
                  id.includes('node_modules/react-leaflet')) {
                return 'vendor-leaflet';
              }
              // Mapbox mapping
              if (id.includes('node_modules/mapbox-gl')) {
                return 'vendor-mapbox';
              }
              // Other node_modules
              if (id.includes('node_modules/')) {
                return 'vendor';
              }
            },
          },
        },
      },
    };
});
