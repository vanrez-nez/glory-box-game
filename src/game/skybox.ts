import * as THREE from 'three/webgpu';
// Side-effect import: registers the starfield GPU bake service + CPU sampler so
// the manifest's `starfield` layer actually renders (no-op without it).
import 'skybox-studio-runtime/starfield';
import { Skybox } from 'skybox-studio-runtime';
import manifest from '@/assets/skybox/manifest.json';
import loader from '@/loader';

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
  mesh: Skybox | null = null;
  #cube?: THREE.CubeTexture;

  // Lazy: this is a module-load singleton but the cube image only exists after the
  // manifest loads. Materials read `textureCube` when they build (after load), so
  // building it on first access is safe (all 6 faces share the one cube image).
  get textureCube(): THREE.CubeTexture {
    if (!this.#cube) {
      const img = loader.get<HTMLImageElement>('universeCube') as any;
      this.#cube = new THREE.CubeTexture([img, img, img, img, img, img]);
      this.#cube.mapping = THREE.CubeReflectionMapping;
      this.#cube.needsUpdate = true;
    }
    return this.#cube;
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
