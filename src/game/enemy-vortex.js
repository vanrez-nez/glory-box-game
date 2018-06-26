import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

const DEFAULT = {
  parent: null,
};

export default class GameEnemyVortex {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.clock = new THREE.Clock();
    this.addMesh();
  }

  addMesh() {
    const geo = new THREE.IcosahedronGeometry(35, 3);
    geo.computeFaceNormals();
    const mat = MaterialFactory.getMaterial('EnemyVortex', {});
    this.material = mat;
    this.mesh = new THREE.Mesh(geo, mat);
    this.opts.parent.add(this.mesh);
  }

  update(delta) {
    const { mesh } = this;
    const { uniforms } = this.material;
    mesh.rotation.y += delta;
    uniforms.uTime.value += delta;
  }
}
