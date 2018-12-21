const DEFAULT = {
  radius: 1,
  speed: 1,
  thickness: 0.2,
  segments: 10,
  minSize: 0.1,
  maxSize: 3,
  colors: [0xffffff],
};

export default class GameLogoRing {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.mesh = this.createRing();
    this.group.add(this.mesh);
  }

  createRing() {
    const { radius, thickness } = this.opts;
    const geo = new THREE.Geometry();
    const segments = this.generateSegments();
    let thetaStart = 0;
    for (let i = 1; i < segments.length; i += 2) {
      thetaStart += segments[i - 1];
      const thetaLength = segments[i];
      const segmentGeo = new THREE.RingGeometry(
        /* innerRadius */ radius - thickness,
        /* outerRadius */ radius,
        /* thetaSegments */ Math.ceil(thetaLength * 10),
        /* phiSegments */ 1,
        /* thetaStart */ thetaStart,
        /* thetaLength */ thetaLength,
      );
      thetaStart += thetaLength;
      this.setRandomFacesColor(segmentGeo.faces);
      geo.merge(segmentGeo);
    }
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: THREE.FaceColors,
      wireframe: false,
    });
    return new THREE.Mesh(geo, mat);
  }

  setRandomFacesColor(faces) {
    const { colors } = this.opts;
    const colorHex = colors[~~(Math.random() * colors.length)];
    const color = new THREE.Color(colorHex);
    faces.forEach((f) => {
      f.color = color;
    });
  }

  generateSegments() {
    const { segments, minSize, maxSize } = this.opts;
    const res = [];
    let total = 0;
    for (let i = 0; i < segments * 2; i++) {
      const segmentSize = THREE.Math.randFloat(minSize, maxSize);
      res.push(segmentSize);
      total += segmentSize;
    }
    return res.map(v => (v / total) * Math.PI * 2);
  }

  update(delta) {
    const { speed } = this.opts;
    const { group } = this;
    group.rotation.z -= delta * speed * 0.0001;
  }
}
