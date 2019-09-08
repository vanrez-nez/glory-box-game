/* eslint-disable */
// Load legacy code via script-loader
import '../static/js/ThreeCSG.min';
import '../static/js/Simple1DNoise';

// Load Three as global with dependencies
import './three-global';
import 'three/examples/js/postprocessing/EffectComposer';
import 'three/examples/js/shaders/CopyShader';
import 'three/examples/js/shaders/FXAAShader';
import 'three/examples/js/shaders/LuminosityHighPassShader';
import 'three/examples/js/postprocessing/RenderPass';
import 'three/examples/js/postprocessing/ShaderPass';
import 'three/examples/js/postprocessing/UnrealBloomPass';
import 'three/examples/js/loaders/GLTFLoader';
import 'three/examples/js/controls/OrbitControls';

import './vue-init';
