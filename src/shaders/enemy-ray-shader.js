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

const EnemyRayShader = {
  uniforms: {
    resolution: { value: new THREE.Vector2(1, 1) },
    rayLevels: { value: new THREE.Vector4(0.5, 0.5, 0.2, 0.0) },
    rayColor: { value: new THREE.Color(0.180, 0.352, 0.764) },
    thinDebrisLevels: { value: new THREE.Vector4(0.5, 1.0, 1.0, 0.5) },
    thinDebrisColor: { value: new THREE.Color(0.121, 0.470, 0.784) },
    fatDebrisLevels: { value: new THREE.Vector4(0.5, 1.0, 0.4, 0.5) },
    fatDebrisColor: { value: new THREE.Color(0, 0.588, 1) },
    offsetY: { value: 0 },
    time: { value: 0 },
  },
  fragmentShader: `
    varying vec2 vUv;
    uniform float time;
    uniform float offsetY;
    uniform vec3 rayColor;
    uniform vec4 rayLevels;
    uniform vec4 fatDebrisLevels;
    uniform vec3 fatDebrisColor;
    uniform vec4 thinDebrisLevels;
    uniform vec3 thinDebrisColor;
    uniform vec2 resolution;

    float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
    }

    float dash(vec2 dashUv, float density) {
      float line = floor(dashUv.x);
      dashUv.y += time * 20.0 * (mod(line, 1.0) * 2.0 - 6.0) * random(vec2(line));
      float rndDash = density * 0.1 * random(vec2(line));
      float dash = smoothstep(rndDash, rndDash + 0.01 * density, 0.9 * random( floor(dashUv) ));
      dash = dash * -1.0 + 1.0;
      return dash;
    }

    void main() {
      vec2 ratio = resolution / resolution.y;
      vec2 uv = vUv * 2.0 - 1.0;
      uv *= ratio;

      /*
        This magic number have a direct relation with the y scale of the mesh
        it helps to offset the effect in relation to the player's position
      */
      uv.y += offsetY * 0.033;
      
      vec3 color = vec3(smoothstep(0.0, abs(uv.x), 0.055)) * 0.001;

      // Thin Dash background
      float d1Speed = thinDebrisLevels[0];
      float d1Density = thinDebrisLevels[1];
      float d1Width = thinDebrisLevels[2];
      float d1Intensity = thinDebrisLevels[3];
      float d1 = dash(uv * vec2(300.0, 300.0 - 260.0 * d1Speed), d1Density);
      d1 *= smoothstep(0.0, abs(uv.x), 0.05 * d1Width);
      color += d1 * thinDebrisColor * d1Intensity;

      // Fat Dash Background
      float d2Speed = fatDebrisLevels[0];
      float d2Density = fatDebrisLevels[1];
      float d2Width = fatDebrisLevels[2];
      float d2Intensity = fatDebrisLevels[3];
      float d2 = dash(uv * vec2(120.0, 80.0), d2Density);
      d2 *= smoothstep(0.0, abs(uv.x), 0.05 * d2Width);
      color += d2 * fatDebrisColor * d2Intensity;

      // Ray
      float rInnerGlow = rayLevels[0];
      float rOuterGlow = rayLevels[1];
      float rIntensity = rayLevels[2];
      float rInnerFade = rayLevels[3];
      float t = abs(rInnerGlow / (uv.x * (32.0 - 30.0 * rInnerGlow)));
      t += smoothstep(0.0, abs(uv.x), 0.1 * rOuterGlow) * 0.7;
      vec3 ray = rayColor * t * rIntensity;
      ray = clamp(ray, vec3(0.0), vec3(1.0));
      ray -= smoothstep(0.0, abs(uv.x), 0.25 * rInnerFade) * 1.0;
      color += ray;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
};

export default EnemyRayShader;
