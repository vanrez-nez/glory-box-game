import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { uniform, texture, uv } from 'three/tsl';
import { GAME } from '@/game/const';
import { GetTextureRepeat } from '@/game/utils';
import { IMAGE_ASSETS } from '@/game/assets';

const circumference = GAME.CylinderRadius * Math.PI * 2;

/*
  TSL port of the old checkpoint-ring GLSL shader: it simply samples the ring
  emissive texture. The uniform dict is preserved so existing runtime updates
  (e.g. world.ts incrementing u_time) keep working unchanged.
*/
export function create() {
  const emissiveTex = GetTextureRepeat(IMAGE_ASSETS.RingEmissive, 0, 0);
  const uniforms: Record<string, any> = {
    u_color: uniform(new THREE.Color(1.0, 0.0, 0.0)),
    u_intensity: uniform(0.3),
    u_dimensions: uniform(new THREE.Vector2(circumference, 1)),
    u_emissive: { value: emissiveTex },
    u_time: uniform(0),
  };

  const material = new MeshBasicNodeMaterial();
  material.side = THREE.FrontSide;
  material.colorNode = texture(emissiveTex, uv());
  (material as any).uniforms = uniforms;
  return material;
}

export default { create };
