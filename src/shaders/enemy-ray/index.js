import fragment from './enemy-ray.fs';
import vertex from '../common/passthrough.vs';

/*
  Debris levels:
    [0]: Speed
    [1]: Density
    [2]: Width
    [3]: Intensity
  Ray Levels:
    [0]: InnerGlow
    [1]: OuterGlow
    [2]: Intensity
    [3]: InnerFade
*/

const Shader = {
  uniforms: {
    u_resolution: { value: new THREE.Vector2(1, 1) },
    u_rayLevels: { value: new THREE.Vector4(0.5, 0.5, 0.2, 0.0) },
    u_rayColor: { value: new THREE.Color(0.180, 0.352, 0.764) },
    u_thinDebrisLevels: { value: new THREE.Vector4(0.5, 1.0, 1.0, 0.5) },
    u_thinDebrisColor: { value: new THREE.Color(0.121, 0.470, 0.784) },
    u_fatDebrisLevels: { value: new THREE.Vector4(0.5, 1.0, 0.4, 0.5) },
    u_fatDebrisColor: { value: new THREE.Color(0, 0.588, 1) },
    u_offsetY: { value: 0 },
    u_time: { value: 0 },
  },
  vertex,
  fragment,
};

export default Shader;
