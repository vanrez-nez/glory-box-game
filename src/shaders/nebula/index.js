import fragment from './nebula.fs';
import vertex from '../common/passthrough.vs';

const Shader = {
  uniforms: {
    u_color: { value: new THREE.Color(0.5, 0.1, 0.0) },
    u_transverseSpeed: { value: 3.0 },
    u_stepSize: { value: 0.25 },
    u_intensity: { value: 0.3 },
    u_zoom: { value: 1.3 },
    u_tile: { value: 0.65 },
    u_fade: { value: 0.65 },
    u_time: { value: 0 },
  },
  vertex,
  fragment,
};

export default Shader;
