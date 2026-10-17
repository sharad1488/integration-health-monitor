import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } } },
  build: { rollupOptions: { output: { manualChunks(id) { if (id.includes('node_modules')) { if (id.includes('recharts') || id.includes('d3-')) return 'charts'; if (id.includes('@mui') || id.includes('@emotion')) return 'mui'; if (id.includes('react')) return 'framework'; } } } } },
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', pool: 'threads', maxWorkers: 1, fileParallelism: false }
});
