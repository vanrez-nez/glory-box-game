import * as THREE from 'three/webgpu';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { GAME } from '@/game/const';

const PI_WIDTH = 128 / Math.PI;

export function GetTextureRepeat(url: any, repeatX: any, repeatY: any, offsetX = 0, offsetY = 0) {
  const tex = new THREE.TextureLoader().load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.offset.set(offsetX, offsetY);
  return tex;
}

/*
  Map 2D cartesian coords to cylindrical coords
*/
export function CartesianToCylinder(vec3: any, x: any, y: any, project = 0) {
  const theta = x / PI_WIDTH;
  const radius = GAME.CylinderRadius + project;
  vec3.x = radius * Math.sin(theta);
  vec3.y = y;
  vec3.z = radius * Math.cos(theta);
}

export function CylinderToCartesian(vec3: any, radius: any, theta: any) {
  vec3.x = radius * Math.sin(theta);
  vec3.z = radius * Math.cos(theta);
}

/*
  Returns the radio and angle from a vector position
*/
export function CylinderFromCartesian(vec3: any) {
  const r = Math.sqrt(vec3.x * vec3.x + vec3.z * vec3.z);
  const theta = Math.atan2(vec3.x, vec3.z);
  return [r, theta];
}

export function AddDot(parent: any, position: any, size = 5) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([position.x, position.y, position.z]), 3));
  const mat = new THREE.PointsMaterial({
    size,
    sizeAttenuation: false,
    color: 0xffffff,
  });
  const dot = new THREE.Points(geo, mat);
  parent.add(dot);
  return dot;
}

export function EaseExpoIn(t: any) {
  return t === 0 ? 0 : 1024 ** (t - 1);
}

export function EaseExpoOut(t: any) {
  return t === 1 ? 1 : 1 - (2 ** (-10 * t));
}

const vPositionZero = new THREE.Vector2();
const vScaleZero = new THREE.Vector3();
export function SyncBodyPhysicsMesh(mesh: any, body: any) {
  if (mesh) {
    if (GameConfig.DebugCollisions && mesh.material) {
      mesh.material.wireframe = body.collidingEdges.isColliding();
    }
    const positionOffset = mesh.positionOffset || vPositionZero;
    const scaleOffset = mesh.scaleOffset || vScaleZero;

    CartesianToCylinder(
      mesh.position,
      body.position.x + positionOffset.x,
      body.position.y + positionOffset.y,
      body.opts.distance,
    );
    if (body.opts.syncLookAt) {
      mesh.lookAt(0, body.position.y, 0);
    }
    mesh.scale.x = 1 + scaleOffset.x;
    mesh.scale.y = 1 + scaleOffset.y;
    mesh.scale.z = 1 + scaleOffset.z;
  }
}
