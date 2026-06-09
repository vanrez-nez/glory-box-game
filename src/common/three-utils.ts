import * as THREE from 'three/webgpu';

/*
  Returns the width and height units to cover the entire
  screen with the given distance (usually z position) from
  the camera.
*/
export function GetScreenSize(camera: any, dst: any) {
  const vFOV = camera.fov * Math.PI / 180;
  const h = 2 * Math.tan(vFOV / 2) * Math.abs(dst);
  const w = h * camera.aspect;
  return [w, h];
}

/*
  Returns current world coords based on current camera distance
  and FOV. (x) and (y) params should be a range from 0 to 1
*/
export function GetScreenCoords(x: any, y: any, camera: any, dst: any) {
  const [w, h] = GetScreenSize(camera, dst);
  const xResult = w * -0.5 + (w * x);
  const yResult = h * -0.5 + (h * y);
  return [xResult, yResult];
}


/*
  Adds a zero-filled `uv` attribute to a geometry that lacks one. WebGPU node
  materials reference the `uv` attribute during setup (for potential maps) even
  when no texture is assigned, logging "Vertex attribute uv not found" for
  geometries without UVs (e.g. the dragon GLTF). These meshes don't sample any
  map, so an unused zero UV set is harmless and silences the warning.
*/
export function EnsureUv(geometry: any) {
  if (geometry?.attributes?.position && !geometry.attributes.uv) {
    const count = geometry.attributes.position.count;
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
}

export function ArcGeometry(innerRadius: any, outerRadius: any, thetaStart: any, thetaLength: any, depth: any) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, thetaStart, thetaStart + thetaLength, false);
  shape.absarc(0, 0, innerRadius, thetaStart + thetaLength, thetaStart, true);
  const extrudeSettings = {
    depth,
    bevelEnabled: false,
    curveSegments: Math.ceil(thetaLength * 7),
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Non-indexed so each triangle has independent vertices (for flat per-face/
  // per-segment vertex colors and clean merging via mergeGeometries).
  // ExtrudeGeometry is already non-indexed, so only convert when needed to
  // avoid three's "BufferGeometry is already non-indexed" warning.
  return geo.index ? geo.toNonIndexed() : geo;
}
