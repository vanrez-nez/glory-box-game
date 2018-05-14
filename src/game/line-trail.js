
const DEFAULT = {
  maxPositions: 15,
  sizeFn: p => p * 0.5,
  material: new MeshLineMaterial({
    color: new THREE.Color(0xffffff),
    transparent: false,
    opacity: 1,
    depthTest: false,
    side: THREE.FrontSide,
    sizeAttenuation: true,
    lineWidth: 1,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
  }),
};

export default class LineTrail {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.geo = this.getGeometry();
    this.line = new MeshLine();
    this.line.setGeometry(this.geo, this.opts.sizeFn);
    this.line.geometry.computeBoundingSphere();
    this.mesh = new THREE.Mesh(this.line.geometry, this.opts.material);
  }

  getGeometry() {
    const { opts } = this;
    const geo = new THREE.Geometry();
    for (let i = 0; i < opts.maxPositions; i++) {
      geo.vertices.push(new THREE.Vector3());
    }
    return geo;
  }

  pushPosition(position) {
    const { line } = this;
    line.advance(position);
    line.geometry.boundingSphere.center.copy(position);
  }
}
