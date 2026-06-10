import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, vec2, vec4, float, dot, normalize, max, min, abs, sign, mix, clamp,
  positionLocal, cameraPosition, modelWorldMatrixInverse,
} from 'three/tsl';

/*
  Interior mapping for the hex "socket" window: fakes a recessed room behind a
  flat hex face so a hole reads as having depth, without modelling any interior.

  Done in OBJECT space (exact — no screen-space derivatives, no UVs): the window
  geometry lies in local XY at z=0 with the room extending into -z. We bring the
  camera into object space (modelWorldMatrixInverse), cast the view ray from the
  fragment, and intersect a HEXAGONAL PRISM room whose side walls line up with
  the hex opening's edges, capped by a back wall at z=-depth. A regular hexagon
  is three pairs of parallel edges, so the prism is the slab method over three
  hex-aligned axes (edge normals at 30°/90°/150°) plus the z back-cap — the
  nearest wall hit gives a depth the room is shaded by (darker toward the back,
  a faint rim glow near the opening).

  v1 is procedural only (the chosen default); a cubemap-textured path can sample
  `cubeTexture(...)` with the hit direction later.
*/

// Matches createHexWindowGeometry(2.0) in props/socket-geometry.ts.
const RADIUS = 2.0;
// Apothem (centre→edge) of the hex the side walls sit on.
const APOTHEM = RADIUS * Math.sqrt(3) / 2;
// The three hex slab axes (outward edge normals at 30°/90°/150°).
const HEX_AXES = [Math.PI / 6, Math.PI / 2, (5 * Math.PI) / 6].map(
  a => [Math.cos(a), Math.sin(a)] as [number, number],
);

export function create() {
  const uniforms: Record<string, any> = {
    u_depth: uniform(5.0),
    u_nearColor: uniform(new THREE.Color(0.08, 0.10, 0.14)),
    u_farColor: uniform(new THREE.Color(0.01, 0.012, 0.02)),
    u_tint: uniform(new THREE.Color(0.35, 0.65, 1.0)),
  };
  const depth = uniforms.u_depth;

  // Object-space camera + view ray (the face's +z points at the camera).
  const camLocal = modelWorldMatrixInverse.mul(vec4(cameraPosition, 1.0)).xyz;
  const rd = normalize(positionLocal.sub(camLocal));
  const eps = float(1e-4);
  const rdz = min(rd.z, eps.negate());        // force the ray into the room (-z)

  // Ray vs hex prism: exit t through the heading-side apothem plane of each of
  // the 3 hex slabs, then the z back-cap. Nearest is the wall we see.
  const o2 = positionLocal.xy;
  const d2 = rd.xy;
  const slabExit = (axis: [number, number]) => {
    const a = vec2(axis[0], axis[1]);
    const pd = dot(d2, a);
    const pds = sign(pd).mul(max(abs(pd), eps)); // guard near-parallel
    return sign(pds).mul(APOTHEM).sub(dot(o2, a)).div(pds);
  };
  const tHex = min(min(slabExit(HEX_AXES[0]), slabExit(HEX_AXES[1])), slabExit(HEX_AXES[2]));
  const tZ = depth.negate().div(rdz);
  const tHit = min(tHex, tZ);
  const depth01 = clamp(rdz.mul(tHit).negate().div(depth), 0.0, 1.0);

  // Procedural empty room: depth-darkened, with a faint tint glow at the opening.
  const room = mix(uniforms.u_nearColor, uniforms.u_farColor, depth01)
    .add(uniforms.u_tint.mul(float(0.05).mul(float(1.0).sub(depth01))));

  const material = new MeshBasicNodeMaterial();
  material.colorNode = room;
  (material as any).uniforms = uniforms;
  return material;
}

export default { create };
