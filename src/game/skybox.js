
import { IMAGE_ASSETS } from './assets';

export default class GameSkybox {
  constructor() {
    this.textureCube = new THREE.CubeTextureLoader().load([
      IMAGE_ASSETS.SkyboxPX,
      IMAGE_ASSETS.SkyboxNX,
      IMAGE_ASSETS.SkyboxPY,
      IMAGE_ASSETS.SkyboxNY,
      IMAGE_ASSETS.SkyboxPZ,
      IMAGE_ASSETS.SkyboxNZ,
    ]);
    this.textureCube.format = THREE.RGBFormat;
    this.textureCube.mapping = THREE.CubeReflectionMapping;
    const shader = THREE.ShaderLib.cube;
    const mat = new THREE.ShaderMaterial({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: true,
      side: THREE.BackSide,
    });
    mat.uniforms.tCube.value = this.textureCube;
    this.mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(550, 550, 550), mat);
    this.mesh.position.y = 550 * 0.4;
  }
}

export const StaticInstance = new GameSkybox();
