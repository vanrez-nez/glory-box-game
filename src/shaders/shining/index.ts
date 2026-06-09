import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, uv, vec3, vec4, float, atan, sin, pow, clamp, length, smoothstep, min, positionLocal,
  modelViewMatrix, cameraProjectionMatrix,
} from 'three/tsl';

const BLADES = 3.0;
const BIAS = 0.1;
const SHARPNESS = 5.0;

/*
  TSL port of the shining shader (player hit / explosion FX): a billboarded
  bladed glow. The original vertex shader billboards the quad by placing it at
  the model-view origin and offsetting by the local xy, reproduced here with a
  custom vertexNode. Additive, transparent, no depth write.
*/
export function create() {
  const uniforms: Record<string, any> = {
    u_color: uniform(new THREE.Color(0.180, 0.352, 0.764)),
    u_rotation: uniform(0.0),
    u_size: uniform(1.0),
    u_glowIntensity: uniform(1.0),
    u_opacity: uniform(1.0),
  };

  const p = uv().mul(2.0).sub(1.0);
  const blade = clamp(
    pow(sin(atan(p.y, p.x).mul(BLADES).add(uniforms.u_rotation)).add(BIAS), SHARPNESS),
    0.0,
    1.0,
  );
  const dst = float(1.0).div(length(p));

  // center glow + blades, then radial fade
  let c = uniforms.u_color.mul(dst).mul(uniforms.u_glowIntensity).mul(2.0);
  c = c.add(uniforms.u_color.mul(min(1.0, blade.mul(0.9))).mul(dst.mul(1.51)));
  c = c.mul(smoothstep(1.0, float(65.0).sub(uniforms.u_size.mul(60.0)), dst));

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;
  material.colorNode = vec3(c);
  material.opacityNode = uniforms.u_opacity;
  // Billboard: place quad at model-view origin, offset by local xy, then project.
  material.vertexNode = cameraProjectionMatrix.mul(
    modelViewMatrix.mul(vec4(0.0, 0.0, 0.0, 1.0))
      .add(vec4(positionLocal.x, positionLocal.y, 0.0, 0.0)),
  );
  (material as any).uniforms = uniforms;
  return material;
}

export default { create };
