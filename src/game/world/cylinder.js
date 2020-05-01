import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GAME } from '@/game/const';
import WorldCylinderRing from '@/game/world/cylinder-ring';

const CYLINDER_HEIGHT = 128;
const CYLINDER_GAP = 0;

const DEFAULT = {};

export default class WorldCylinder {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.group.name = 'WorldCylinder';
    this.init();
  }

  init() {
    const { group } = this;
    this.noise = new Simple1DNoise();
    this.noiseIdx = Math.random();
    this.ring = new WorldCylinderRing();
    this.c1 = this.getCylinder();
    this.c2 = this.c1.clone();
    this.base = this.getBaseCylinder();
    group.add(this.c1, this.c2, this.base, this.ring.group);
  }

  getCylinder() {
    const ratio = CYLINDER_HEIGHT / (GAME.CylinderRadius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
    const geo = new THREE.CylinderBufferGeometry(GAME.CylinderRadius, GAME.CylinderRadius,
      CYLINDER_HEIGHT, 128, 1, true);
    const mat = MaterialFactory.getMaterial('WorldCylinder', {
      name: 'w_main_cylinder',
      xScale,
      yScale,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.position.y = CYLINDER_HEIGHT * 0.5 + GAME.BoundsBottom;
    mesh.rotation.y = Math.PI / 8;
    return mesh;
  }

  getBaseCylinder() {
    const height = 2.5;
    const ratio = height / (GAME.CylinderRadius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
    const geo = new THREE.CylinderBufferGeometry(GAME.CylinderRadius + 0.5,
      GAME.CylinderRadius + 1.8, height, 64, 1);
    const mat = MaterialFactory.getMaterial('WorldCylinder', {
      name: 'w_base_cylinder',
      xScale,
      yScale,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.cylinderBase = mesh;
    mesh.position.y = GAME.BoundsBottom + height / 2;
    return mesh;
  }

  getSnappedPosition(playerPosition, offset) {
    const h = CYLINDER_HEIGHT + CYLINDER_GAP;
    const snap = Math.round(playerPosition.y / h);
    return (snap + offset) * h;
  }

  getClosestSnappedPosition(playerPosition) {
    const sT = this.getSnappedPosition(playerPosition, 1);
    const sB = this.getSnappedPosition(playerPosition, -1);
    // get distances from top and bottom
    const dstTop = Math.abs(playerPosition.y - sT);
    const dstBottom = Math.abs(playerPosition.y - sB);
    // return closest
    return dstBottom > dstTop ? sT : sB;
  }

  updateRingPosition(playerPosition) {
    const { ring } = this;
    // reposition the ring to the closest edge (top or bottom)
    // of the current cylinder
    const closerPos = this.getSnappedPosition(playerPosition, 0);
    const halfCylinder = CYLINDER_HEIGHT * 0.5;
    const halfGap = CYLINDER_GAP * 0.5;
    const top = closerPos + halfCylinder + halfGap;
    const bottom = closerPos - halfCylinder - halfGap;
    const dstTop = Math.abs(playerPosition.y - top);
    const dstBottom = Math.abs(playerPosition.y - bottom);
    const closer = dstTop > dstBottom ? bottom : top;
    ring.updatePosition(closer);
  }

  /*
  Adjust (y) position of both cylinders to be tiled one
  in top of the another, so they are always covering the
  view height from current player's position.
  */
  updateMainCylindersTiling(playerPosition) {
    const { c1, c2 } = this;
    c1.position.y = this.getSnappedPosition(playerPosition, 0);
    c2.position.y = this.getClosestSnappedPosition(playerPosition);
  }

  update(delta, playerPosition) {
    const { c1, c2, base, noise } = this;
    if (base.material.emissiveIntensity) {
      this.noiseIdx += delta;
      const val = Math.max(0.55, noise.getVal(this.noiseIdx) * 1.8);
      c1.material.emissiveIntensity = val;
      c2.material.emissiveIntensity = val;
      base.material.emissiveIntensity = val;
    }

    this.updateMainCylindersTiling(playerPosition);
    this.updateRingPosition(playerPosition);
  }
}
