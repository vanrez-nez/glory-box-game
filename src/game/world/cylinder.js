import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GAME } from '@/game/const';
import WorldCylinderRing from '@/game/world/cylinder-ring';

const CYLINDER_HEIGHT = 128;
const CYLINDER_GAP = 4;

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

  updateRingPosition(playerPosition) {
    const { ring, c1 } = this;
    const h = CYLINDER_HEIGHT;
    const { y } = playerPosition;
    const q = Math.round(y / h);
    const topCylinder = q * h + h * 0.5;
    ring.updatePosition(topCylinder + CYLINDER_GAP * 0.5);
  }

  /*
  Adjust (y) position from both cylinders so there are tiled one
  in top of the another, so they are always covering the
  view height from current player's position.
  */
  updateMainCylindersTiling(playerPosition) {
    const { c1, c2 } = this;
    const { y } = playerPosition;
    const h = CYLINDER_HEIGHT + CYLINDER_GAP;
    const q = Math.round(y / h);

    // get middle, top and bottom snapped positions
    const qM = q * h;
    const qT = (q + 1) * h;
    const qB = (q - 1) * h;

    // get distances from top and bottom
    const dstTop = Math.abs(y - qT);
    const dstBottom = Math.abs(y - qB);

    // use closest as next
    const qNext = dstBottom > dstTop ? qT : qB;
    c1.position.y = qM;
    c2.position.y = qNext;
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
