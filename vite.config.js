import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import glsl from 'vite-plugin-glsl';

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
    glsl({
      include: ['**/*.glsl', '**/*.vs', '**/*.fs', '**/*.vert', '**/*.frag'],
    }),
  ],
  resolve: {
    // The codebase imports SFCs without the `.vue` extension, so it must be
    // added explicitly (Vite does not resolve `.vue` by default).
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
    },
  },
  optimizeDeps: {
    // The legacy example scripts read a global `THREE`; let esbuild pre-bundle
    // them so they are served as a single optimized dependency.
    include: [
      'three',
      'three/examples/js/postprocessing/EffectComposer',
      'three/examples/js/shaders/CopyShader',
      'three/examples/js/shaders/FXAAShader',
      'three/examples/js/shaders/LuminosityHighPassShader',
      'three/examples/js/postprocessing/RenderPass',
      'three/examples/js/postprocessing/ShaderPass',
      'three/examples/js/postprocessing/UnrealBloomPass',
      'three/examples/js/loaders/GLTFLoader',
      'three/examples/js/controls/OrbitControls',
    ],
  },
  server: {
    port: 8080,
  },
  build: {
    sourcemap: true,
  },
});
