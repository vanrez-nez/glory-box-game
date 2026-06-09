import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  Fn, uniform, uv, vec2, vec3, float, abs, smoothstep, clamp,
} from 'three/tsl';
import { dash } from '@/shaders/tsl/common';

/*
  TSL port of enemy-ray.fs — a central ray with two animated debris dash layers.
  Levels packed in vec4s:
    Debris [speed, density, width, intensity]
    Ray    [innerGlow, outerGlow, intensity, innerFade]
  Additive, transparent, no depth write.
*/
export function create() {
  const uniforms: Record<string, any> = {
    u_resolution: uniform(new THREE.Vector2(1, 1)),
    u_rayLevels: uniform(new THREE.Vector4(0.5, 0.5, 0.2, 0.0)),
    u_rayColor: uniform(new THREE.Color(0.180, 0.352, 0.764)),
    u_thinDebrisLevels: uniform(new THREE.Vector4(0.5, 1.0, 1.0, 0.5)),
    u_thinDebrisColor: uniform(new THREE.Color(0.121, 0.470, 0.784)),
    u_fatDebrisLevels: uniform(new THREE.Vector4(0.5, 1.0, 0.4, 0.5)),
    u_fatDebrisColor: uniform(new THREE.Color(0, 0.588, 1)),
    u_offsetY: uniform(0),
    u_time: uniform(0),
  };
  const t = uniforms.u_time;

  // Wrapped in Fn() so TSL mutable vars (toVar/addAssign) have a stack context.
  const colorFn = Fn(() => {
    const res = uniforms.u_resolution;
    const ratio = vec2(res.x.div(res.y), 1.0);
    const base = uv().mul(2.0).sub(1.0).mul(ratio);
    const fuv = vec2(base.x, base.y.add(uniforms.u_offsetY.mul(0.033)));
    const ax = abs(fuv.x);

    const color = vec3(smoothstep(0.0, ax, 0.055).mul(0.001)).toVar();

    // Thin debris dash layer
    const tl = uniforms.u_thinDebrisLevels;
    const d1 = dash(fuv.mul(vec2(300.0, float(300.0).sub(tl.x.mul(260.0)))), tl.y, t, 20.0, 0.01, 0.9)
      .mul(smoothstep(0.0, ax, tl.z.mul(0.05)));
    color.addAssign(d1.mul(uniforms.u_thinDebrisColor).mul(tl.w));

    // Fat debris dash layer
    const fl = uniforms.u_fatDebrisLevels;
    const d2 = dash(fuv.mul(vec2(120.0, 80.0)), fl.y, t, 20.0, 0.01, 0.9)
      .mul(smoothstep(0.0, ax, fl.z.mul(0.05)));
    color.addAssign(d2.mul(uniforms.u_fatDebrisColor).mul(fl.w));

    // Central ray
    const rl = uniforms.u_rayLevels;
    const rayT = abs(rl.x.div(fuv.x.mul(float(32.0).sub(rl.x.mul(30.0))))).toVar();
    rayT.addAssign(smoothstep(0.0, ax, rl.y.mul(0.1)).mul(0.7));
    const ray = clamp(uniforms.u_rayColor.mul(rayT).mul(rl.z), 0.0, 1.0)
      .sub(smoothstep(0.0, ax, rl.w.mul(0.25)));
    color.addAssign(ray);
    return color;
  });

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;
  material.colorNode = colorFn();
  (material as any).uniforms = uniforms;
  return material;
}

export default { create };
