import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: true
  },
  base: '/code-land/lava/shopping-list/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
