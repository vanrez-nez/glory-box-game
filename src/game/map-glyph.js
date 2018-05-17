import { GAME } from './const';
import { TranslateTo3d } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

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

export default class MapGlyph {
  constructor(x, y, color) {
    this.noise = new Simple1DNoise();
    this.noiseIdx = Math.random();
    this.group = new THREE.Object3D();
    const offsets = Offsets[idxCount++ % Offsets.length];
    this.addGlyphMesh(x, y, offsets, color);
    this.addSocketMesh(x, y, offsets);
  }

  addGlyphMesh(x, y, offsets, color) {
    const geo = this.getGlyphGeometry();
    const mat = MaterialFactory.getMaterial('CollectibleGlyph', {
      emissiveColor: color,
      xOffset: offsets.x,
      yOffset: offsets.y,
    });
    const mesh = new THREE.Mesh(geo, mat);
    TranslateTo3d(mesh.position, x, y, GAME.CollectibleDistance, 0.935);
    mesh.positionCulled = true;
    this.setInverseLookAt(mesh, y);
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    this.glypMaterial = mat;
    this.group.add(mesh);
  }

  addSocketMesh(x, y) {
    const geo = this.getSocketGeometry();
    const mat = MaterialFactory.getMaterial('CollectibleSocket', { color: 0x0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.positionCulled = true;
    mesh.matrixAutoUpdate = false;
    TranslateTo3d(mesh.position, x, y, GAME.CollectibleDistance, 0.935);
    this.setInverseLookAt(mesh, y);
    this.group.add(mesh);
  }

  setInverseLookAt(target, y) {
    const lookPosition = new THREE.Vector3(0, y, 0);
    lookPosition.subVectors(target.position, lookPosition).add(target.position);
    target.lookAt(lookPosition);
  }

  setHexVertices(target, cellSize) {
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

  getSocketGeometry() {
    const shape = new THREE.Shape();
    this.setHexVertices(shape, 2.6);
    const pathHole = new THREE.Path();
    this.setHexVertices(pathHole, 2);
    shape.holes.push(pathHole);
    const extrudeSettings = {
      amount: 0.3,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
  }

  getGlyphGeometry() {
    const shape = new THREE.Shape();
    this.setHexVertices(shape, 2);
    return new THREE.ShapeGeometry(shape);
  }

  update(delta) {
    const { noise, glypMaterial } = this;
    glypMaterial.emissiveIntensity = 0.3 + noise.getVal(this.noiseIdx) * 10;
    this.noiseIdx += delta * 4;
  }
}
