/*
  Shared TSL helper functions, ported 1:1 from the original GLSL shaders. These
  mirror the helpers that used to be duplicated across the .fs files (random,
  hex, hash/noise/fbm, dash) so the node materials read like the originals.

  Note: TSL's `Fn()` return type is declared as a zero-argument callable, so the
  exported helpers are typed `any` to allow the argument lists they really take.
*/
import {
  Fn, vec2, vec3, float, fract, sin, dot, floor, abs, mod, max, mix, smoothstep,
} from 'three/tsl';

// fract(sin(dot(st, (12.9898,78.233))) * 43758.5453123)
export const random: any = Fn(([st]: any) => fract(sin(dot(st, vec2(12.9898, 78.233))).mul(43758.5453123)));

// Hexagonal distance field — http://glslsandbox.com/e#42962.0
export const hex: any = Fn(([pIn]: any) => {
  const px = pIn.x.mul(0.57735 * 2.0);
  const py = pIn.y.add(mod(floor(px), 2.0).mul(0.5));
  const p: any = abs(mod(vec2(px, py), 1.0).sub(0.5));
  return abs(max(p.x.mul(1.5).add(p.y), p.y.mul(2.0)).sub(1.0));
});

// fireball noise stack ------------------------------------------------------
const Hash: any = Fn(([p, s]: any) => fract(
  sin(dot(vec3(p.x, p.y, abs(sin(s)).mul(10.0)), vec3(27.1, 61.7, 12.4))).mul(273758.5453123),
));

const noise: any = Fn(([p, s]: any) => {
  const i = floor(p);
  const f0 = fract(p);
  const f: any = f0.mul(f0).mul(float(3.0).sub(f0.mul(2.0)));
  return mix(
    mix(Hash(i.add(vec2(0.0, 0.0)), s), Hash(i.add(vec2(1.0, 0.0)), s), f.x),
    mix(Hash(i.add(vec2(0.0, 1.0)), s), Hash(i.add(vec2(1.0, 1.0)), s), f.x),
    f.y,
  ).mul(s);
});

export const fbm: any = Fn(([p]: any) => noise(p.mul(1.0), 0.35)
  .add(noise(p.mul(2.0), 0.25))
  .add(noise(p.mul(4.0), 0.125))
  .add(noise(p.mul(8.0), 0.0625)));

/*
  Animated dash pattern shared by the enemy-ray and vortex shaders. The original
  GLSL versions differed only in constants, captured here as parameters:
    timeMul: time-scroll speed (20 for rays, 43 for vortex)
    edgeMul: smoothstep edge width factor (0.01 for rays, 0.1 for vortex)
    randMul: random gate multiplier (0.9 for rays, 1.7 for vortex)
*/
export const dash: any = Fn(([dashUv, density, time, timeMul, edgeMul, randMul]: any) => {
  const line = floor(dashUv.x);
  const r = random(vec2(line, line));
  const y = dashUv.y.add(time.mul(timeMul).mul(mod(line, 1.0).mul(2.0).sub(6.0)).mul(r));
  const newUv = vec2(dashUv.x, y);
  const rndDash = density.mul(0.1).mul(r);
  const d = smoothstep(rndDash, rndDash.add(edgeMul.mul(density)), randMul.mul(random(floor(newUv))));
  return d.mul(-1.0).add(1.0);
});
