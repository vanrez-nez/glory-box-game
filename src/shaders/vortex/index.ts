import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, uv, vec2, vec3, vec4, smoothstep, mix, clamp, abs, sin, cos, texture,
  positionLocal, normalView, positionView, modelWorldMatrix, cameraViewMatrix,
  cameraProjectionMatrix,
} from 'three/tsl';
import { GetTextureRepeat } from '@/game/utils';
import { IMAGE_ASSETS } from '@/game/assets';
import { dash } from '@/shaders/tsl/common';

const DEG2RAD = Math.PI / 180;

// Rotate a vec4 around the Y axis by angle t (the original DoTwist()).
function doTwist(pos: any, t: any) {
  const st = sin(t);
  const ct = cos(t);
  return vec4(
    pos.x.mul(ct).sub(pos.z.mul(st)),
    pos.y,
    pos.x.mul(st).add(pos.z.mul(ct)),
    pos.w,
  );
}

/*
  TSL port of the vortex shader. The vertex stage twists the cylinder around Y
  and displaces vertices along the (twisted) normal by a height-map sample; the
  fragment stage tints by the height map with distance fog and an animated dash
  overlay. Transparent, no depth write.
*/
export function create() {
  const heightTex = GetTextureRepeat(IMAGE_ASSETS.PerlinNoise, 0, 0);
  const uniforms: Record<string, any> = {
    u_time: uniform(0),
    u_twist: uniform(3050),
    u_colorFrom: uniform(new THREE.Color(0.188, 0.114, 0.224)),
    u_colorTo: uniform(new THREE.Color(0.102, 0.027, 0.031)),
    u_displacementScale: uniform(14),
    u_displacementBias: uniform(24),
    u_fogDistance: uniform(54),
    t_heightMap: { value: heightTex },
  };
  const time = uniforms.u_time;

  // ---- Vertex: twist + height-map displacement (all in view space) ----
  const mPosition = modelWorldMatrix.mul(vec4(positionLocal, 1.0));
  const angleRad = uniforms.u_twist.mul(DEG2RAD);
  const height = -500.0;
  const ang = positionLocal.y.sub(height * 0.5).div(height).mul(angleRad);
  const twistedPosition = doTwist(mPosition, ang);
  const twistedNormal = doTwist(vec4(normalView, 1.0), ang);
  const mvPosition = cameraViewMatrix.mul(twistedPosition);
  const sUv = uv().add(time.mul(0.03));
  const dispTex = (texture(heightTex, sUv) as any).level(0);
  const df = dispTex.x.mul(uniforms.u_displacementScale).add(uniforms.u_displacementBias);
  const displacementPosition = vec4(twistedNormal.xyz.mul(df), 0.0).add(mvPosition);

  // ---- Fragment: height-map tint + fog + dash ----
  const tex = texture(heightTex, uv().sub(time.mul(0.1)));
  const fogFactor = smoothstep(0.0, uniforms.u_fogDistance, positionView.z.negate());
  let color: any = vec3(uniforms.u_colorFrom.add(uniforms.u_colorTo).mul(tex.r));
  color = mix(color, vec3(0.0), fogFactor);

  const p = uv().mul(2.0).sub(1.0);
  const d = dash(p.mul(vec2(260.0, 590.0)), 1.0, time, 43.0, 0.1, 1.7)
    .mul(smoothstep(0.0, abs(p.x), 0.6));
  const dashColor = vec3(2.0).mul(d).mul(fogFactor);
  color = mix(dashColor, color, 0.8);

  const opacity = clamp(
    smoothstep(0.2, 1.0, uv().y.oneMinus()).mul(2.5).sub(fogFactor),
    0.0,
    1.0,
  );

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.colorNode = color;
  material.opacityNode = opacity.sub(0.05);
  material.vertexNode = cameraProjectionMatrix.mul(displacementPosition);
  (material as any).uniforms = uniforms;
  return material;
}

export default { create };
