import { GAME } from '@/game/const';
import { GetTextureRepeat } from '@/game/utils';
import { IMAGE_ASSETS } from '@/game/assets';
import fragment from './checkpoint-ring.fs';
import vertex from '../common/passthrough.vs';

const circumference = GAME.CylinderRadius * Math.PI * 2;

const Shader = {
  uniforms: {
    u_color: { value: new THREE.Color(1.0, 0.0, 0.0) },
    u_intensity: { value: 0.3 },
    u_dimensions: { value: new THREE.Vector2(circumference, 1) },
    u_emissive: { value: GetTextureRepeat(IMAGE_ASSETS.RingEmissive, 0, 0) },
    // u_diffuse: { value: GetTextureRepeat(IMAGE_ASSETS.UvTest, 0, 0) },
    u_time: { value: 0 },
  },
  vertex,
  fragment,
};

export default Shader;
