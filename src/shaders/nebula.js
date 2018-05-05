const NebulaShader = {
  uniforms: {
    color: { value: new THREE.Color(0.5, 0.1, 0.0) },
    transverseSpeed: { value: 3.0 },
    stepSize: { value: 0.25 },
    intensity: { value: 0.3 },
    zoom: { value: 1.3 },
    tile: { value: 0.65 },
    fade: { value: 0.65 },
    time: { value: 0 },
  },
  fragmentShader: `
    #define volsteps 6
    varying vec2 vUv;
    uniform float time;
    uniform float intensity;
    uniform float fade;
    uniform float zoom;
    uniform float transverseSpeed;
    uniform float tile;
    uniform float stepSize;
    uniform vec3 color;

    float field(in vec3 p) {
      float strength = 19. + .03 * log(1.e-6 + fract(sin(time) * 4373.11));
      float accum = 0.;
      float prev = 0.;
      float tw = 0.;
    
      for (int i = 0; i < 7; ++i) {
        float mag = dot(p, p);
        p = abs(p) / mag + vec3(-.5, -.8 + 0.1 * sin(time * 0.7 + 2.0), -1.1 + 0.3 * cos(time * 0.3));
        float w = exp(-float(i) / 7.);
        accum += w * exp(-strength * pow(abs(mag - prev), 2.3));
        tw += w;
        prev = mag;
      }
      return max(0., 5. * accum / tw - .7);
    }

    void main() {
      vec2 uv = vUv * vec2(1., 0.25);
      float a_xz = 0.9;
      float a_yz = -0.6;
      float a_xy = 0.9;

      vec3 dir=vec3(uv * zoom, 1.);
      vec3 from=vec3(0.0, 0.0, 0.0);

      vec3 forward = vec3(0., 0., 1.);
      from.x += transverseSpeed * cos(0.01 * time) + 0.01 * time;
      from.y += transverseSpeed * sin(0.01 * time) + 0.01 * time;
      from.z += 0.001 * time;

      // Volumetric rendering
      float s = 0.25;
      float s3 = s + stepSize / 2.0;
      float t3 = 0.0;
      vec3 nebula = vec3(0.);
      for (int r = 0; r < volsteps; r++) {
        vec3 p3 = from + s3 * dir;
        p3 = abs(vec3(tile) - mod(p3, vec3(tile * 2.))); // tiling fold
        t3 = field(p3);
        float f = pow(fade, max(0., float(r)));
        nebula += mix(.4, 1., 0.) * vec3(1.8 * t3 * t3 * t3, 1.4 * t3 * t3, t3) * f;
        s3 += stepSize;
      }
      nebula *= intensity * smoothstep(0., 0.075, uv.y);
      nebula *= color;
      gl_FragColor = vec4(nebula, 1.0);
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

export default NebulaShader;
