import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  server: {
    // host: '192.168.1.3',
    port: 3000,
    open: true,
    allowedHosts: [
      '60a7-197-186-54-57.ngrok-free.app', 
      '.ngrok-free.app' 
    ],
    cors: true
  }
});