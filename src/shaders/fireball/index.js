import fragment from './fireball.fs';
import vertex from './fireball.vs';

const Shader = {
  uniforms: {
    u_fissuresColor: { value: new THREE.Color(1.0, 0.5, 0.0) },
    u_glowColor: { value: new THREE.Color(0.1, 0.1, 0.0) },
    u_ringColor: { value: new THREE.Color(1.0, 0.4, 0.1) },
    u_fissuresIntensity: { value: 1.6 }, // Range from 0.0 to 10.0
    u_ringThickness: { value: 0.2 }, // Range from 0.0 to 1.2
    u_glowIntensity: { value: new THREE.Vector2(0.1, 0.5) },
    u_time: { value: 0 },
  },
  vertex,
  fragment,
};

export default Shader;
