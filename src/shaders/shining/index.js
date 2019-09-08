import fragment from './shining.fs';
import vertex from './shining.vs';

const Shader = {
  uniforms: {
    u_color: { value: new THREE.Color(0.180, 0.352, 0.764) },
    u_rotation: { value: 0 },
    u_size: { value: 1.0 },
    u_glowIntensity: { value: 1.0 },
    u_opacity: { value: 1.0 },
  },
  vertex,
  fragment,
};

export default Shader;
