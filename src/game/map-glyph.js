import { GAME } from './const';
import { IMAGE_ASSETS } from './assets';
import { StaticInstance as Skybox } from './skybox';
import { TranslateTo3d, GetTextureRepeat } from './utils';

const RepeatX = 1 / 9;
const RepeatY = 1 / 9;

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
    this.addInnerMesh(x, y, offsets, color);
    this.addOutterMesh(x, y, offsets);
  }

  addInnerMesh(x, y, offsets, color) {
    const texBase = GetTextureRepeat(IMAGE_ASSETS.HullBase, RepeatX, RepeatY);
    texBase.offset.set(offsets.x, offsets.y);
    const texEmissive = this.getTexture(IMAGE_ASSETS.GlyphsEmissive, offsets);
    const geo = this.getInnerGeometry();
    const mat = new THREE.MeshStandardMaterial({
      envMap: Skybox.textureCube,
      map: texBase,
      color: 0x090c11,
      emissiveMap: texEmissive,
      emissiveIntensity: 6,
      emissive: color,
      roughness: 0.25,
      metalness: 0.5,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    TranslateTo3d(mesh.position, x, y, GAME.CollectibleDistance, 0.935);
    mesh.positionCulled = true;
    this.setInverseLookAt(mesh, y);
    this.glypMaterial = mat;
    this.group.add(mesh);
  }

  addOutterMesh(x, y) {
    const geo = this.getOutterGeometry();
    const mat = new THREE.MeshLambertMaterial({
      envMap: Skybox.textureCube,
      color: 0x05070a,
      reflectivity: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.positionCulled = true;
    TranslateTo3d(mesh.position, x, y, GAME.CollectibleDistance, 0.935);
    this.setInverseLookAt(mesh, y);
    this.group.add(mesh);
  }

  setInverseLookAt(target, y) {
    const lookPosition = new THREE.Vector3(0, y, 0);
    lookPosition.subVectors(target.position, lookPosition).add(target.position);
    target.lookAt(lookPosition);
  }

  getTexture(url, offsets) {
    const tex = new THREE.TextureLoader().load(url);
    tex.repeat.set(RepeatX, RepeatY);
    tex.offset.set(offsets.x, offsets.y);
    return tex;
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

  getOutterGeometry() {
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

  getInnerGeometry() {
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
