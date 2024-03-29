import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GAME } from '@/game/const';
import { CartesianToCylinder } from '@/game/utils';

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
let SocketGeometry = null;
let GlyphGeometry = null;

const DEFAULT = {
  x: 0,
  y: 0,
  color: 0xffffff,
};

export default class CollectibleGlyph {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.enabled = true;
    this.noise = new Simple1DNoise();
    this.noiseIdx = Math.random();
    const offsets = Offsets[idxCount++ % Offsets.length];
    this.addGlyphMesh(offsets);
  }

  static SetHexVertices(target, cellSize) {
    const verts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      verts.push(new THREE.Vector2(
        cellSize * Math.cos(angle),
        cellSize * Math.sin(angle),
      ));
    }
    target.moveTo(verts[0].x, verts[0].y);
    for (let i = 0; i < 6; i++) {
      target.lineTo(verts[i].x, verts[i].y);
    }
    target.autoClose = true;
  }

  static GetSocketGeometry() {
    if (SocketGeometry === null) {
      const shape = new THREE.Shape();
      CollectibleGlyph.SetHexVertices(shape, 2.6);
      const pathHole = new THREE.Path();
      CollectibleGlyph.SetHexVertices(pathHole, 2);
      shape.holes.push(pathHole);
      const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: false,
      };
      SocketGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
    return SocketGeometry;
  }

  static GetGlyphGeometry() {
    if (GlyphGeometry === null) {
      const shape = new THREE.Shape();
      CollectibleGlyph.SetHexVertices(shape, 2);
      GlyphGeometry = new THREE.ShapeGeometry(shape);
    }
    return GlyphGeometry;
  }

  addGlyphMesh(offsets) {
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
    geo.applyMatrix(mesh.matrix);
    return geo;
  }

  setInverseLookAt(target, y) {
    const lookPosition = new THREE.Vector3(0, y, 0);
    lookPosition.subVectors(target.position, lookPosition).add(target.position);
    target.lookAt(lookPosition);
  }

  update(delta) {
    const { enabled, noise, glypMaterial } = this;
    const color = enabled ? this.opts.color : 0x212121;
    const mult = enabled ? 10 : 0.25;
    glypMaterial.emissive.setHex(color);
    glypMaterial.emissiveIntensity = 0.3 + noise.getVal(this.noiseIdx) * mult;
    this.noiseIdx += delta * 4;
  }
}
