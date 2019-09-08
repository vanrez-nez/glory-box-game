import { GetTextureRepeat } from '@/game/utils';
import { IMAGE_ASSETS } from '@/game/assets';
import fragment from './vortex.fs';
import vertex from './vortex.vs';

const Shader = {
  uniforms: {
    u_time: { value: 0 },
    u_twist: { value: 3050 },
    // 301d39 - 1a0708
    u_colorFrom: { value: new THREE.Color(0.188, 0.114, 0.224) },
    u_colorTo: { value: new THREE.Color(0.102, 0.027, 0.031) },
    u_displacementScale: { value: 14 },
    u_displacementBias: { value: 24 },
    u_fogDistance: { value: 54 },
    t_heightMap: { value: GetTextureRepeat(IMAGE_ASSETS.PerlinNoise, 0, 0) },
  },
  vertex,
  fragment,
};

export default Shader;
