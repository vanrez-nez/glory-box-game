import fragment from './pickup-burst.fs';
import vertex from '../common/passthrough.vs';

const Shader = {
  uniforms: {
    u_tint: { value: new THREE.Color(0.0, 0.0, 1.0) },
    u_innerRadius: { value: 0.0 },
    u_outterRadius: { value: 0.02 },
    u_borderSoftness: { value: 0 },
  },
  vertex,
  fragment,
};

export default Shader;
