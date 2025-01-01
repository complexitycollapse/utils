import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    global: true
  },
  plugins: [react()],
  build: {
    outDir: './dist'
  }
});
