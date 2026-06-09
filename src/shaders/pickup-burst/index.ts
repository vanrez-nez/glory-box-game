import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uniform, uv, vec2, vec3, distance, smoothstep,
} from 'three/tsl';
import { hex } from '@/shaders/tsl/common';

/*
  TSL port of pickup-burst.fs — an expanding hexagon-textured ring disk used for
  collectible pickup bursts. Additive, transparent, no depth write.
*/
export function create() {
  const uniforms: Record<string, any> = {
    u_tint: uniform(new THREE.Color(0.0, 0.0, 1.0)),
    u_innerRadius: uniform(0.0),
    u_outterRadius: uniform(0.02),
    u_borderSoftness: uniform(0.0),
  };

  const fragUv = uv();
  const dist = distance(fragUv, vec2(0.5, 0.5));
  const inRad = uniforms.u_innerRadius;
  const outRad = uniforms.u_outterRadius;
  const border = uniforms.u_borderSoftness.mul(0.1);
  const disk = smoothstep(inRad, inRad.add(border), dist)
    .sub(smoothstep(outRad.sub(border), outRad, dist));
  // disk += disk*1.0 - smoothstep(0, inRad+0.02, hex(uv*80))
  const disk2 = disk.mul(2.0).sub(smoothstep(0.0, inRad.add(0.02), hex(fragUv.mul(80.0))));
  const color = vec3(disk2).mul(uniforms.u_tint);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;
  material.colorNode = color;
  (material as any).uniforms = uniforms;
  return material;
}

export default { create };
