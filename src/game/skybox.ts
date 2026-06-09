import * as THREE from 'three';
import { IMAGE_ASSETS } from '@/game/assets';

/*
  Renders the cubemap on a positioned box. three removed `THREE.ShaderLib.cube`
  and `THREE.RGBFormat`, so we sample the cube texture directly with a minimal
  shader (BackSide box, sampled by vertex direction).
*/
const VERTEX_SHADER = `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform samplerCube tCube;
varying vec3 vDir;
void main() {
  gl_FragColor = textureCube(tCube, normalize(vDir));
}
`;

export default class GameSkybox {
  textureCube!: THREE.CubeTexture;
  mesh!: THREE.Mesh;
  constructor() {
    this.textureCube = new THREE.CubeTextureLoader().load([
      IMAGE_ASSETS.SkyboxPX,
      IMAGE_ASSETS.SkyboxNX,
      IMAGE_ASSETS.SkyboxPY,
      IMAGE_ASSETS.SkyboxNY,
      IMAGE_ASSETS.SkyboxPZ,
      IMAGE_ASSETS.SkyboxNZ,
    ]);
    this.textureCube.mapping = THREE.CubeReflectionMapping;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        tCube: { value: this.textureCube },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      depthWrite: true,
      side: THREE.BackSide,
    });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(550, 550, 550), mat);
    this.mesh.position.y = 550 * 0.4;
  }
}

export const StaticInstance = new GameSkybox();
