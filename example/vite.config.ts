import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ezSagaHmr from '../src/vite/index';

export default defineConfig({
  plugins: [
    react(),
    ezSagaHmr(), // 启用 ez-saga HMR 插件
  ],
  resolve: {
    alias: {
      'ez-saga': '../src/index.ts',
    },
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
});
