import { GAME, CONFIG } from './const';

const PI_WIDTH = 128 / Math.PI;

export function Clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function GroupBy(arr, keyFunction) {
  return arr.reduce((result, item) => {
    const key = keyFunction(item);
    result[key] = result[key] || [];
    result[key].push(item);
    return result;
  }, {});
}

export function GetTextureRepeat(url, repeatX, repeatY, offsetX = 0, offsetY = 0) {
  const tex = new THREE.TextureLoader().load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.offset.set(offsetX, offsetY);
  return tex;
}

export function GetTextureRepeatDefer(url, repeatX, repeatY, offsetX, offsetY) {
  return () => GetTextureRepeat(url, repeatX, repeatY, offsetX, offsetY);
}

/*
  Returns the width and height units to cover the entire
  screen with the given distance (usually z position) from
  the camera.
*/
export function GetScreenSize(camera, dst) {
  const vFOV = camera.fov * Math.PI / 180;
  const h = 2 * Math.tan(vFOV / 2) * Math.abs(dst);
  const w = h * camera.aspect;
  return [w, h];
}

/*
  Returns current world coords based on current camera distance
  and FOV. (x) and (y) params should be a range from 0 to 1
*/
export function GetScreenCoords(x, y, camera, dst) {
  const [w, h] = GetScreenSize(camera, dst);
  const xResult = w * -0.5 + (w * x);
  const yResult = h * -0.5 + (h * y);
  return [xResult, yResult];
}

/*
  Map 2D cartesian coords to cylindrical coords
*/
export function CartesianToCylinder(vec3, x, y, project = 0) {
  const theta = x / PI_WIDTH;
  const radius = GAME.CilynderRadius + project;
  vec3.x = radius * Math.sin(theta);
  vec3.y = y;
  vec3.z = radius * Math.cos(theta);
}

export function CylinderToCartesian(vec3, radius, theta) {
  vec3.x = radius * Math.sin(theta);
  vec3.z = radius * Math.cos(theta);
}

/*
  Returns the radio and angle from a vector position
*/
export function CylinderFromCartesian(vec3) {
  const r = Math.sqrt(vec3.x * vec3.x + vec3.z * vec3.z);
  const theta = Math.atan2(vec3.x, vec3.z);
  return [r, theta];
}

export function AddDot(parent, position, size = 5) {
  const geo = new THREE.Geometry();
  geo.vertices.push(position.clone());
  const mat = new THREE.PointsMaterial({
    size,
    sizeAttenuation: false,
    color: 0xffffff,
  });
  const dot = new THREE.Points(geo, mat);
  parent.add(dot);
  return dot;
}

export function EaseExpoIn(t) {
  return t === 0 ? 0 : 1024 ** (t - 1);
}

export function EaseExpoOut(t) {
  return t === 1 ? 1 : 1 - (2 ** (-10 * t));
}

export function SyncBodyPhysicsMesh(mesh, body) {
  if (mesh) {
    if (CONFIG.DebugCollisions && mesh.material) {
      mesh.material.wireframe = body.collidingEdges.isColliding();
    }
    CartesianToCylinder(
      mesh.position,
      body.position.x + body.meshPositionOffset.x,
      body.position.y + body.meshPositionOffset.y,
      body.opts.distance,
    );
    if (body.opts.syncLookAt) {
      mesh.lookAt(0, body.position.y, 0);
    }
    mesh.scale.x = 1 + body.meshScaleOffset.x;
    mesh.scale.y = 1 + body.meshScaleOffset.y;
    mesh.scale.z = 1 + body.meshScaleOffset.z;
  }
}
