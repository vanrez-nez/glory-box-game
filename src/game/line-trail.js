
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

  updateTrailPosition(idx, position) {
    const { attributes } = this.line;
    const arr = attributes.position.array;
    const offset = arr.length - idx * 6;
    arr[offset - 6] = position.x;
    arr[offset - 5] = position.y;
    arr[offset - 4] = position.z;
    arr[offset - 3] = position.x;
    arr[offset - 2] = position.y;
    arr[offset - 1] = position.z;
    attributes.position.needsUpdate = true;
  }

  resetPositionTo(position) {
    const { opts, line } = this;
    for (let i = 0; i < opts.maxPositions; i++) {
      this.updateTrailPosition(i, position);
    }
    line.advance(position);
  }

  pushPosition(position) {
    const { line } = this;
    line.advance(position);
    line.geometry.boundingSphere.center.copy(position);
  }
}
