import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
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
        cssCodeSplit: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            admin: path.resolve(__dirname, 'admin.html'),
          },
          output: {
            manualChunks: (id) => {
              // Separate Mapbox CSS/JS into its own chunk
              if (id.includes('mapbox-gl')) {
                return 'mapbox';
              }
              // Separate Leaflet CSS/JS into its own chunk
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'leaflet';
              }
              // Separate React and React DOM
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                return 'react-vendor';
              }
              // Separate router
              if (id.includes('react-router')) {
                return 'router';
              }
            },
          },
        },
      },
    };
});
