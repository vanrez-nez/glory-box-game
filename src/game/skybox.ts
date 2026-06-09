import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { cubeTexture, positionLocal, normalize } from 'three/tsl';
import { IMAGE_ASSETS } from '@/game/assets';

/*
  Renders the cubemap on a positioned BackSide box. Ported from the old GLSL
  ShaderMaterial (textureCube unsupported on WebGPU) to a TSL node material that
  samples the cube texture by the normalized local vertex direction.
*/
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
    const mat = new MeshBasicNodeMaterial();
    mat.side = THREE.BackSide;
    mat.depthWrite = true;
    mat.colorNode = cubeTexture(this.textureCube, normalize(positionLocal));
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(550, 550, 550), mat);
    this.mesh.position.y = 550 * 0.4;
  }
}

export const StaticInstance = new GameSkybox();
