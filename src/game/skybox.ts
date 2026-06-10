import * as THREE from 'three/webgpu';
// Side-effect import: registers the starfield GPU bake service + CPU sampler so
// the manifest's `starfield` layer actually renders (no-op without it).
import 'skybox-studio-runtime/starfield';
import { Skybox } from 'skybox-studio-runtime';
import manifest from '@/assets/skybox/manifest.json';
import { IMAGE_ASSETS } from '@/game/assets';

/*
  Skybox split into two responsibilities:
    - mesh:   the VISIBLE backdrop, driven by a Skybox Studio manifest
              (skybox-studio-runtime). A live WebGPU/TSL Mesh (unit box, depthTest/
              Write off, renderOrder -1, BackSide) the engine recentres on the
              camera each frame.
    - textureCube: the material reflections (classic envMap). Kept on the baked
              cube images — MeshBasic/Phong envMap needs a CubeTexture, and a
              manifest equirect->cube path currently breaks the WebGPU pipeline for
              every envMap material (they vanish), so reflections stay on the cube.
*/
export class GameSkybox {
  manifest: any = manifest;
  textureCube: THREE.CubeTexture;
  mesh: Skybox | null = null;

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
  }

  // Live visible backdrop. Needs the WebGPU renderer.
  createMesh(renderer: any): Skybox {
    this.mesh = new Skybox()
      .setRenderer(renderer)
      .setRenderMode('auto')
      .setGeometry({ type: 'box' })
      .fromManifest(this.manifest)
      .load();
    return this.mesh;
  }
}

export const StaticInstance = new GameSkybox();
