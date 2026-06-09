import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  // Treat 3D model binaries as static assets (handled by file-loader before).
  assetsInclude: ['**/*.glb'],
  // webpack polyfilled Node's `global`; the game code (and some deps) still
  // reference it, so map it to the browser global.
  define: {
    global: 'globalThis',
  },
  plugins: [
    vue(),
  ],
  resolve: {
    // `three.meshline` is a UMD module that `require('three')`, which resolves
    // to three's CommonJS build (three.cjs) — a *different file* than the ESM
    // build (three.module.js) the app imports. Two files means two copies of
    // three, which triggers its "Multiple instances of Three.js" warning.
    // Pinning the bare `three` specifier to the single ESM build (exact-match
    // regex so `three/examples/...` subpaths still resolve) collapses both
    // importers onto one module instance. `dedupe` keeps that single instance.
    dedupe: ['three'],
    // The codebase imports SFCs without the `.vue` extension, so it must be
    // added explicitly (Vite does not resolve `.vue` by default).
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: [
      {
        find: /^three$/,
        replacement: fileURLToPath(new URL('./node_modules/three/build/three.module.js', import.meta.url)),
      },
      { find: '@styles', replacement: fileURLToPath(new URL('./src/styles', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  server: {
    port: 8080,
  },
  build: {
    sourcemap: true,
  },
});
