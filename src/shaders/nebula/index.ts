import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  Fn, uniform, uv, vec2, vec3, float, sin, cos, log, fract, dot, abs, mod, exp, pow, max, smoothstep,
  Loop,
} from 'three/tsl';

/*
  TSL port of nebula.fs — a volumetric star/nebula field rendered on the inside
  (BackSide) of the sky cylinder. The original `field()` inner loop (7) and the
  outer volumetric march (volsteps = 6) are reproduced with TSL Loop().
*/
function field(pIn: any, time: any): any {
  const strength = float(19.0)
    .add(float(0.03).mul(log(float(1e-6).add(fract(sin(time).mul(4373.11))))));
  const accum = float(0).toVar();
  const prev = float(0).toVar();
  const tw = float(0).toVar();
  const p = pIn.toVar();
  Loop(7, ({ i }: any) => {
    const mag = dot(p, p);
    p.assign(abs(p).div(mag).add(vec3(
      -0.5,
      float(-0.8).add(sin(time.mul(0.7).add(2.0)).mul(0.1)),
      float(-1.1).add(cos(time.mul(0.3)).mul(0.3)),
    )));
    const w = exp(float(i).negate().div(7.0));
    accum.addAssign(w.mul(exp(strength.negate().mul(pow(abs(mag.sub(prev)), 2.3)))));
    tw.addAssign(w);
    prev.assign(mag);
  });
  return max(0.0, accum.mul(5.0).div(tw).sub(0.7));
}

export function create() {
  const uniforms: Record<string, any> = {
    u_color: uniform(new THREE.Color(0.5, 0.1, 0.0)),
    u_transverseSpeed: uniform(3.0),
    u_stepSize: uniform(0.25),
    u_intensity: uniform(0.3),
    u_zoom: uniform(1.3),
    u_tile: uniform(0.65),
    u_fade: uniform(0.65),
    u_time: uniform(0),
  };
  const time = uniforms.u_time;

  // Wrapped in Fn() so TSL mutable vars (toVar/addAssign) and Loop() have a
  // stack context.
  const colorFn = Fn(() => {
    const uv2: any = uv().mul(vec2(1.0, 0.25));
    const dir = vec3(uv2.mul(uniforms.u_zoom), 1.0);
    const from = vec3(
      uniforms.u_transverseSpeed.mul(cos(time.mul(0.01))).add(time.mul(0.01)),
      uniforms.u_transverseSpeed.mul(sin(time.mul(0.01))).add(time.mul(0.01)),
      time.mul(0.001),
    );

    const stepSize = uniforms.u_stepSize;
    const tile = uniforms.u_tile;
    const fade = uniforms.u_fade;
    const s3 = float(0.25).add(stepSize.div(2.0)).toVar();
    const nebula = vec3(0).toVar();
    Loop(6, ({ i }: any) => {
      const p3 = from.add(dir.mul(s3));
      const folded = abs(vec3(tile).sub(mod(p3, vec3(tile.mul(2.0)))));
      const t3 = field(folded, time);
      const f = pow(fade, max(0.0, float(i)));
      // mix(.4, 1., 0.) === 0.4
      const contrib = vec3(t3.mul(t3).mul(t3).mul(1.8), t3.mul(t3).mul(1.4), t3).mul(f).mul(0.4);
      nebula.addAssign(contrib);
      s3.addAssign(stepSize);
    });
    nebula.mulAssign(uniforms.u_intensity.mul(smoothstep(0.0, 0.075, uv2.y)));
    nebula.mulAssign(uniforms.u_color);
    return nebula;
  });

  const material = new MeshBasicNodeMaterial();
  material.side = THREE.BackSide;
  material.colorNode = colorFn();
  (material as any).uniforms = uniforms;
  return material;
}

export default { create };
