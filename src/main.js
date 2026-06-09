/* eslint-disable */
// Expose THREE / EventEmitter3 / gsap as globals before anything that needs them.
import './three-global';

// Legacy three.js example scripts (attach to the global THREE).
import 'three/examples/js/postprocessing/EffectComposer';
import 'three/examples/js/shaders/CopyShader';
import 'three/examples/js/shaders/FXAAShader';
import 'three/examples/js/shaders/LuminosityHighPassShader';
import 'three/examples/js/postprocessing/RenderPass';
import 'three/examples/js/postprocessing/ShaderPass';
import 'three/examples/js/postprocessing/UnrealBloomPass';
import 'three/examples/js/loaders/GLTFLoader';
import 'three/examples/js/controls/OrbitControls';

// Vendored legacy scripts (define window.ThreeBSP / window.Simple1DNoise).
import './vendor/ThreeCSG.min.js';
import './vendor/Simple1DNoise.js';

import './vue-init';
