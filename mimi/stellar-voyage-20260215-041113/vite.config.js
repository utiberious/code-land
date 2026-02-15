/**
 * Vite configuration for Stellar Voyage
 */

export default {
  root: './',
  base: '/code-land/mimi/stellar-voyage-20260215-041113/',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'terser'
  }
};
