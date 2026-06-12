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
    // This is a pure WebGPU app: everything imports `three/webgpu` + `three/tsl`.
    // The TSL node system carries a MODULE-LEVEL build stack, so every three entry
    // point MUST resolve to a single shared instance — otherwise a node built by
    // one copy calls `.assign()` against another copy's (null) stack and you get
    // a "THREE.TSL: No stack defined" cascade that blanks the whole render.
    // Pin bare `three` to the WebGPU build (three.meshline is gone; nothing needs
    // the WebGL `three.module.js`), and dedupe so only one copy is ever bundled.
    dedupe: ['three'],
    // The codebase imports SFCs without the `.vue` extension, so it must be
    // added explicitly (Vite does not resolve `.vue` by default).
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: [
      {
        find: /^three$/,
        replacement: fileURLToPath(new URL('./node_modules/three/build/three.webgpu.js', import.meta.url)),
      },
      { find: '@styles', replacement: fileURLToPath(new URL('./src/styles', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  // Pre-bundle ALL three entry points (+ makio-meshline, which also pulls
  // three/webgpu + three/tsl) in ONE optimize pass so they share a single core
  // chunk. Without this, Vite re-optimizes each three dep lazily as it's
  // discovered, minting a fresh `?v=` hash and a separate core copy each time —
  // the "Multiple instances of Three.js" fragmentation behind the TSL crash.
  optimizeDeps: {
    include: [
      'three/webgpu',
      'three/tsl',
      'three/addons/tsl/display/BloomNode.js',
      'three/addons/tsl/display/FXAANode.js',
      'three/addons/utils/BufferGeometryUtils.js',
      'three/addons/loaders/SVGLoader.js',
      'three/addons/loaders/GLTFLoader.js',
      'three/addons/controls/OrbitControls.js',
      'makio-meshline',
    ],
  },
  server: {
    port: 8080,
  },
  build: {
    sourcemap: true,
  },
});
