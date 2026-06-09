import * as THREE from 'three/webgpu';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { attribute } from 'three/tsl';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ArcGeometry } from '@/common/three-utils';

const DEFAULT = {
  radius: 1,
  speed: 1,
  thickness: 0.2,
  depth: 0.3,
  segments: 8,
  minSize: 0.15,
  maxSize: 3,
  colors: [0xffffff],
};

export default class GameLogoRing {
  opts!: Record<string, any>;
  mesh!: any;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.mesh = this.createRing();
  }

  createRing() {
    const { radius, thickness, depth } = this.opts;
    const segments = this.generateSegments();
    const geometries = [];
    let thetaStart = 0;
    for (let i = 1; i < segments.length; i += 2) {
      thetaStart += segments[i - 1];
      const thetaLength = segments[i];
      const segmentGeo = ArcGeometry(radius - thickness, radius, thetaStart, thetaLength, depth);
      thetaStart += thetaLength;
      this.setRandomColor(segmentGeo);
      geometries.push(segmentGeo);
    }
    const geo = mergeGeometries(geometries, false);
    // Drive the lit albedo from the baked per-vertex `color` attribute. The node
    // material path doesn't reliably honor `vertexColors: true`, so bind it
    // explicitly via a TSL colorNode.
    const mat = new MeshStandardNodeMaterial();
    mat.colorNode = attribute('color', 'vec3');
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  // Bake a single random color into every vertex of the segment as a `color`
  // attribute (replaces the legacy Geometry face.color + FaceColors workflow).
  setRandomColor(geo: any) {
    const { colors } = this.opts;
    const colorHex = colors[~~(Math.random() * colors.length)];
    const color = new THREE.Color(colorHex);
    const count = geo.attributes.position.count;
    const colorArr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colorArr[i * 3] = color.r;
      colorArr[i * 3 + 1] = color.g;
      colorArr[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
  }

  generateSegments() {
    const { segments, minSize, maxSize } = this.opts;
    const res = [];
    let total = 0;
    for (let i = 0; i < segments * 2; i++) {
      const segmentSize = THREE.MathUtils.randFloat(minSize, maxSize);
      res.push(segmentSize);
      total += segmentSize;
    }
    return res.map(v => (v / total) * Math.PI * 2);
  }

  update(delta: any) {
    const { speed } = this.opts;
    const { mesh } = this;
    mesh.rotation.z -= delta * speed * 0.0001;
  }
}
