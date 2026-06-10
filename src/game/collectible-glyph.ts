import Simple1DNoise from '@/vendor/Simple1DNoise';
import * as THREE from 'three/webgpu';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GAME } from '@/game/const';
import { CartesianToCylinder } from '@/game/utils';
import { createHexRingGeometry, createHexWindowGeometry } from '@/game/props/socket-geometry';

const Offsets = [
  { x: 0.17, y: 0.83 },
  { x: 0.5, y: 0.83 },
  { x: 0.85, y: 0.85 },
  { x: 0.17, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.84, y: 0.49 },
  { x: 0.17, y: 0.17 },
  { x: 0.5, y: 0.16 },
  { x: 0.83, y: 0.17 },
];

let idxCount = 0;
let SocketGeometry: THREE.BufferGeometry | null = null;
let GlyphGeometry: THREE.BufferGeometry | null = null;

const DEFAULT = {
  x: 0,
  y: 0,
  color: 0xffffff,
};

export default class CollectibleGlyph {
  opts!: Record<string, any>;
  enabled!: boolean;
  noise!: any;
  noiseIdx!: any;
  glypMaterial!: any;
  mesh!: any;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.enabled = true;
    this.noise = Simple1DNoise();
    this.noiseIdx = Math.random();
    const offsets = Offsets[idxCount++ % Offsets.length];
    this.addGlyphMesh(offsets);
  }

  static GetSocketGeometry() {
    if (SocketGeometry === null) {
      SocketGeometry = createHexRingGeometry(2.6, 2, 0.3);
    }
    return SocketGeometry;
  }

  static GetGlyphGeometry() {
    if (GlyphGeometry === null) {
      GlyphGeometry = createHexWindowGeometry(2);
    }
    return GlyphGeometry;
  }

  addGlyphMesh(offsets: any) {
    const { x, y, color, type } = this.opts;
    const geo = CollectibleGlyph.GetGlyphGeometry();
    const mat = MaterialFactory.getMaterial('CollectibleGlyph', {
      name: `collect_glyph_${type}`,
      emissiveColor: color,
      xOffset: offsets.x,
      yOffset: offsets.y,
    });
    const mesh = new THREE.Mesh(geo, mat);
    CartesianToCylinder(mesh.position, x, y, GAME.CollectibleSocketOffset);
    mesh.positionCulled = true;
    this.setInverseLookAt(mesh, y);
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    this.glypMaterial = mat;
    this.mesh = mesh;
  }

  getSocketGeometry() {
    const { x, y } = this.opts;
    const geo = CollectibleGlyph.GetSocketGeometry().clone();
    const mesh = new THREE.Mesh(geo);
    CartesianToCylinder(mesh.position, x, y, GAME.CollectibleSocketOffset);
    this.setInverseLookAt(mesh, y);
    mesh.updateMatrix();
    geo.applyMatrix4(mesh.matrix);
    return geo;
  }

  setInverseLookAt(target: any, y: any) {
    const lookPosition = new THREE.Vector3(0, y, 0);
    lookPosition.subVectors(target.position, lookPosition).add(target.position);
    target.lookAt(lookPosition);
  }

  update(delta: any) {
    const { enabled, noise, glypMaterial } = this;
    const color = enabled ? this.opts.color : 0x212121;
    const mult = enabled ? 10 : 0.25;
    glypMaterial.emissive.setHex(color);
    glypMaterial.emissiveIntensity = 0.3 + noise.getVal(this.noiseIdx) * mult;
    this.noiseIdx += delta * 4;
  }
}
