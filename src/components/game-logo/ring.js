
const DEFAULT = {
  radius: 1,
  speed: 1,
  thickness: 0.2,
  segments: 5,
  minSize: 0.25,
  maxSize: 3,
  colors: [0xffffff],
};

export default class GameLogoRing {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.mesh = this.createRing();
  }

  createRing() {
    const { radius, thickness } = this.opts;
    const geo = new THREE.Geometry();
    const segments = this.generateSegments();
    let thetaStart = 0;
    for (let i = 1; i < segments.length; i += 2) {
      thetaStart += segments[i - 1];
      const thetaLength = segments[i];
      const segmentGeo = this.arcGeometry(radius - thickness, radius, thetaStart, thetaLength);
      thetaStart += thetaLength;
      this.setRandomFacesColor(segmentGeo.faces);
      geo.merge(segmentGeo);
    }
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: THREE.FaceColors,
      wireframe: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  arcGeometry(innerRadius, outerRadius, thetaStart, thetaLength) {
    const buffGeometry = new THREE.Geometry();
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, thetaStart, thetaStart + thetaLength, false);
    shape.absarc(0, 0, innerRadius, thetaStart + thetaLength, thetaStart, true);
    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: false,
      curveSegments: Math.ceil(thetaLength * 7),
    };
    const geo = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
    return buffGeometry.fromBufferGeometry(geo);
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
    const { mesh } = this;
    mesh.rotation.z -= delta * speed * 0.0001;
  }
}
