import * as THREE from 'three/webgpu';

/*
  Shared hexagonal "socket" geometry builders. Sockets are the inset hex frames /
  windows that props (collectibles, the dragon den) sit in on the cylinder wall.
  Extracted from collectible-glyph so every socketed prop builds the same hex.

  Geometries are LOCAL (centred on the origin, lying in the XY plane, +Z normal).
  Consumers either parent them under a positioned group, or bake them to world
  space (clone + applyMatrix4) when merging many sockets into one mesh.
*/

// Trace a regular hexagon of `cellSize` radius onto a THREE.Shape or THREE.Path.
export function setHexVertices(target: THREE.Shape | THREE.Path, cellSize: number) {
  const verts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i;
    verts.push(new THREE.Vector2(
      cellSize * Math.cos(angle),
      cellSize * Math.sin(angle),
    ));
  }
  target.moveTo(verts[0].x, verts[0].y);
  for (let i = 0; i < 6; i++) {
    target.lineTo(verts[i].x, verts[i].y);
  }
  target.autoClose = true;
}

// Solid hex face (the glyph symbol, or the den's interior window).
export function createHexWindowGeometry(radius: number) {
  const shape = new THREE.Shape();
  setHexVertices(shape, radius);
  return new THREE.ShapeGeometry(shape);
}

// Hex ring/frame: an extruded hexagon with a concentric hexagonal hole.
export function createHexRingGeometry(outer: number, inner: number, depth: number) {
  const shape = new THREE.Shape();
  setHexVertices(shape, outer);
  const hole = new THREE.Path();
  setHexVertices(hole, inner);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
}
