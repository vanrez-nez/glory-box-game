import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GAME } from '@/game/const';

const CYLINDER_HEIGHT = 4;
const DEFAULT = {};

export default class WorldCylinderRing {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.init();
  }

  init() {
    const ratio = CYLINDER_HEIGHT / (GAME.CylinderRadius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
    const geo = this.getGeometry();
    const mat = MaterialFactory.getMaterial('WorldCylinder', {
      name: 'w_main_cylinder',
      xScale,
      yScale,
    }, 'w_main_cylinder');
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ wireframe: false }));//mat);
    this.group.add(mesh);
  }

  getGeometry() {
    const depthRadius = GAME.CylinderRadius - 2;
    const bevelRadius = GAME.CylinderRadius + 0.5;
    const height = CYLINDER_HEIGHT / 3;
    const geo = new THREE.Geometry();
    // Rings
    const ring = new THREE.RingGeometry(depthRadius, bevelRadius, 128, 1);
    ring.rotateX(Math.PI / 2);
    const r1 = ring.clone().translate(0, height * 1.5, 0);
    const r2 = ring.clone().translate(0, height * 0.5, 0);
    const r3 = ring.clone().translate(0, height * -0.5, 0);
    const r4 = ring.clone().translate(0, height * -1.5, 0);
    // Cylinders
    const middle = new THREE.CylinderGeometry(depthRadius, depthRadius, height, 128, 1, true);
    const top = new THREE.CylinderGeometry(bevelRadius, bevelRadius, height, 128, 1, true);
    const bottom = top.clone();
    bottom.translate(0, -height, 0);
    top.translate(0, height, 0);
    geo.merge(top);
    geo.merge(bottom);
    geo.merge(middle);
    geo.merge(r1);
    geo.merge(r2);
    geo.merge(r3);
    geo.merge(r4);
    return geo;
  }

  updatePosition(y) {
    this.group.position.y = y;
  }
}
