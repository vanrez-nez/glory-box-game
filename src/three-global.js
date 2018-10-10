import * as THREE from 'three';
/*
  Define THREE as global. This is different from use webpack's provide plugin
  THREE in here will be on window so other dependencies can reach it
  when being required. This is the case for examples js libraries of THREE.
  See more info on: https://github.com/mrdoob/three.js/issues/9562
  Note: This should have worked by using imports-loader but for some reason
        the library three.meshline complains when we do so.
*/
global.THREE = THREE;
