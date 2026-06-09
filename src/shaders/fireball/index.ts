import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  Fn, uniform, uv, vec2, vec3, float, mat3, smoothstep, step, mod, sign, max, min, abs, length,
  fract, dot, pow, mix, normalView,
} from 'three/tsl';
import { fbm, hex } from '@/shaders/tsl/common';

/*
  TSL port of the fireball shader (player HUD fireball): a hexagon-masked caustic
  "fissures" field, an animated energy ring, and a fresnel-style inner glow. The
  glow term, originally a vertex varying, is computed per-fragment from the
  view-space normal (visually equivalent). Opaque.
*/
export function create() {
  const uniforms: Record<string, any> = {
    u_fissuresColor: uniform(new THREE.Color(1.0, 0.5, 0.0)),
    u_glowColor: uniform(new THREE.Color(0.1, 0.1, 0.0)),
    u_ringColor: uniform(new THREE.Color(1.0, 0.4, 0.1)),
    u_fissuresIntensity: uniform(1.6),
    u_ringThickness: uniform(0.2),
    u_glowIntensity: uniform(new THREE.Vector2(0.1, 0.5)),
    u_time: uniform(0),
  };
  const time = uniforms.u_time;

  // Wrapped in Fn() so the caustic field's mutable vars (toVar/assign) have a
  // stack context.
  const colorFn = Fn(() => {
    const fuv = uv().mul(vec2(2.0, 1.0));

    // Hexagon mask + caustic field (the original field_fn macro mutates q and m).
    const h = smoothstep(0.0, 0.45, hex(fuv.add(time.mul(0.2)).mul(7.0)));
    const q = vec3(fuv, time).toVar();
    const m = (mat3 as any)(-2, -1, 2, 3, -2, 1, -1, 1, 3).toVar();
    const fieldFn = (): any => {
      m.mulAssign(0.8); // .6 + .1*2.
      q.assign(m.mul(q));
      return length(fract(q).sub(0.5));
    };
    const f1 = fieldFn();
    const f2 = fieldFn();
    const f3 = fieldFn();
    const field = pow(min(min(f1, f2), f3), 7.0).mul(100.0).mul(uniforms.u_fissuresIntensity);
    const col = step(h, 0.1).mul(field);

    // Energy ring (note: original `uv *= 2. - 1.` is a no-op multiply by 1.0).
    const energyDisp = mod(time.mul(10.0), 2.5).add(0.3);
    const thickness = float(220.0).sub(uniforms.u_ringThickness.mul(200.0));
    const energy = abs(float(10.0).div(
      fuv.y.sub(energyDisp).add(fbm(fuv.add(time.mul(10.0)))).mul(thickness),
    ));
    const ringCol = step(max(sign(float(0.01).sub(uniforms.u_ringThickness)), 0.0), 1.0).mul(energy);
    const ring = vec3(ringCol).mul(uniforms.u_ringColor);

    // Inner glow (fresnel-ish), originally a vertex varying.
    const glowI = pow(
      uniforms.u_glowIntensity.x.sub(dot(normalView, vec3(0.7, 0.0, 1.0))),
      uniforms.u_glowIntensity.y,
    );
    const glow = vec3(glowI).mul(uniforms.u_glowColor);

    let color: any = mix(glow, vec3(col).mul(uniforms.u_fissuresColor), 0.5);
    color = mix(ring, color, 0.5);
    return color;
  });

  const material = new MeshBasicNodeMaterial();
  material.colorNode = colorFn();
  (material as any).uniforms = uniforms;
  return material;
}

export default { create };
