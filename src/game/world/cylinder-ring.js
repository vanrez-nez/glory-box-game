import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GAME } from '@/game/const';
import { ArcGeometry } from '@/common/three-utils';

const CYLINDER_HEIGHT = 64 * (((GAME.CylinderRadius - 5) * Math.PI * 2) / 1024);
const DEFAULT = {};

export default class WorldCylinderRing {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.init();
  }

  init() {
    this.addInnerCylinder();
  }

  addInnerCylinder() {
    // const ratio = CYLINDER_HEIGHT / (GAME.CylinderRadius * Math.PI * 2);

    // calculate cylinder height to wrap with texture dimensions
    const [texWidth, texHeight] = [1024, 64];
    const rad = GAME.CylinderRadius - 5;
    const circ = rad * Math.PI * 2;
    const height = texHeight * (circ / texWidth);

    const geo = new THREE.CylinderBufferGeometry(rad, rad, height, 128, 1, true);
    const mat = MaterialFactory.getMaterial('WorldCheckpointRing', {
      name: 'w_checkpoint_ring',
      xScale: 1,
      yScale: 1,
    }, 'w_checkpoint_ring');
    const mesh = new THREE.Mesh(geo, mat);
    this.group.add(mesh);
  }

  addBevel() {
    // const ratio = CYLINDER_HEIGHT / (GAME.CylinderRadius * Math.PI * 2);
    const xScale = 0.05;
    const yScale = 0.05;
    const geo = this.getGeometry();
    const mat = MaterialFactory.getMaterial('WorldCylinder', {
      name: 'w_main_cylinder',
      xScale,
      yScale,
    }, 'w_main_cylinder');
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  getBevelGeometry() {
    const depthRadius = GAME.CylinderRadius - 2;
    const bevelRadius = GAME.CylinderRadius + 1;
    const height = CYLINDER_HEIGHT / 3;
    const geo = new THREE.Geometry();
    // Rings
    const ring = ArcGeometry(depthRadius, bevelRadius, 0, Math.PI * 2, height);
    ring.rotateX(Math.PI / 2);
    ring.rotateY(Math.PI / 2);
    const r1 = ring.clone().translate(0, height * 1.5, 0);
    const r2 = ring.clone().translate(0, height * -0.5, 0);
    // Cylinders
    const middle = new THREE.CylinderGeometry(depthRadius, depthRadius, height, 128, 1, true);
    geo.merge(middle);
    geo.merge(r1);
    geo.merge(r2);
    return geo;
  }

  updatePosition() {
    this.group = 1;
    // this.group.position.y = y;
  }
}
