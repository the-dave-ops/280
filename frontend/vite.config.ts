import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS 
      ? process.env.VITE_ALLOWED_HOSTS.split(',').map(host => host.trim())
      : ['localhost', '.localhost'],
    watch: {
      usePolling: true,
    },
  },
});

