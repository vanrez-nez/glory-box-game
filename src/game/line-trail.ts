import * as THREE from 'three/webgpu';
import { MeshLine } from 'makio-meshline';

/*
  Snake-like trail built on makio-meshline (TSL/WebGPU). Maintains a fixed-length
  ring of points that follow a moving target; pushPosition() shifts the buffer and
  appends the newest point, reproducing the old three.meshline advance() behaviour.
  makio's MeshLine *is* a THREE.Mesh and owns its (node) material, so unlike the
  previous version the material is configured from opts here rather than injected.
  (mesh/line are typed `any`: makio's MeshLine.raycast signature isn't assignable
  to three/webgpu's Object3D, which otherwise breaks scene.add() type-checking.)
*/
const DEFAULT = {
  maxPositions: 15,
  sizeFn: (p: number) => p * 0.5,
  color: 0xffffff as number | string,
  lineWidth: 1,
  opacity: 1,
  transparent: false,
};

export default class LineTrail {
  opts!: Record<string, any>;
  points!: Float32Array;
  mesh!: any;
  // Back-compat alias: callers used `trail.line` (the old MeshLine instance).
  line!: any;

  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.points = new Float32Array(this.opts.maxPositions * 3);
    const mesh = new MeshLine({
      lines: this.points,
      lineWidth: this.opts.lineWidth,
      color: this.opts.color,
      opacity: this.opts.opacity,
      transparent: this.opts.transparent,
      widthCallback: this.opts.sizeFn,
      sizeAttenuation: true,
      dynamic: true,
      usage: THREE.DynamicDrawUsage,
    });
    // makio builds/configures the material lazily on first render, which resets
    // material flags — so force the build now and set them on the finalized
    // material. These mirror the original three.meshline MeshLineMaterial:
    // fog=false (the old shader ignored scene fog, so trails don't fade into the
    // black FogExp2); depthTest=false with depthWrite=TRUE — the trail ignores
    // existing depth but still writes its own near depth, so farther geometry
    // (e.g. the floor) fails its depth test and the trail stays on top. Setting
    // depthWrite=false instead made the floor overdraw the trail ("behind floor").
    mesh.ensureBuilt();
    const mat = mesh.material as any;
    mat.fog = false;
    mat.depthTest = false;
    mat.depthWrite = true;
    // makio's MeshLine ribbon defaults to FrontSide; its front face depends on
    // the line's orientation, so some trails (e.g. the pickup→fireball steering
    // trails) land back-facing and get culled. The old GenericTrailMaterial used
    // DoubleSide — restore it so trails are visible from any angle.
    mat.side = THREE.DoubleSide;
    // Trails are short and move with their target; skip frustum culling rather
    // than maintain a bounding sphere as the old implementation did.
    mesh.frustumCulled = false;
    this.mesh = mesh;
    this.line = mesh;
  }

  resetPositionTo(position: any) {
    const { points, opts } = this;
    for (let i = 0; i < opts.maxPositions; i++) {
      points[i * 3] = position.x;
      points[i * 3 + 1] = position.y;
      points[i * 3 + 2] = position.z;
    }
    this.mesh.setPositions(points, false);
  }

  // Write a single point. No GPU flush — a following pushPosition() (or an
  // explicit setPositions) uploads the buffer. Used by the dragon spine, which
  // rewrites every point each frame and then pushes the head position.
  updateTrailPosition(idx: number, position: any) {
    const o = idx * 3;
    this.points[o] = position.x;
    this.points[o + 1] = position.y;
    this.points[o + 2] = position.z;
  }

  // Upload the current points as-is (no ring shift). For callers that rewrite
  // every point each frame (the dragon spine) — pushPosition() would rotate the
  // buffer and wrap the tail back to the head, closing a loop.
  flush() {
    this.mesh.setPositions(this.points, false);
  }

  pushPosition(position: any) {
    const { points, opts } = this;
    // Drop the oldest point and append the newest at the end.
    points.copyWithin(0, 3);
    const last = (opts.maxPositions - 1) * 3;
    points[last] = position.x;
    points[last + 1] = position.y;
    points[last + 2] = position.z;
    this.mesh.setPositions(points, false);
  }
}
