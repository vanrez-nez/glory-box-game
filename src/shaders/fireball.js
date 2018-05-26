const FireballShader = {
  uniforms: {
    tint: { value: new THREE.Color(0.5, 0.4, 0.0) },
    time: { value: 0 },
    intensity: { value: 0.9 },
    ringTickness: { value: 1 }
  },
  fragmentShader: `
    #define field_fn length(fract(q*=m*=.6+.1*2.)-.5)
    uniform vec3 tint;
    uniform float time;
    uniform float intensity;
    uniform float ringTickness;
    varying vec2 vUv;

    float Hash( vec2 p, float s ){
      return fract(sin(dot(vec3(p.xy,10.0 * abs(sin(s))),vec3(27.1,61.7, 12.4)))*273758.5453123);
    }
    
    float noise(in vec2 p, in float s) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f *= f * (3.0-2.0*f);
        return mix(mix(Hash(i + vec2(0.,0.), s), Hash(i + vec2(1.,0.), s),f.x),mix(Hash(i + vec2(0.,1.), s), Hash(i + vec2(1.,1.), s),f.x),f.y) * s;
    }

    float fbm(vec2 p) {
        float v = 0.0;
        v += noise(p*1., 0.35);
        v += noise(p*2., 0.25);
        v += noise(p*4., 0.125);
        v += noise(p*8., 0.0625);
        return v;
    }

    // https://gist.github.com/sakrist/8706749
    float hex(vec2 p) {
      p.x *= 0.57735*2.0;
      p.y += mod(floor(p.x), 2.0)*0.5;
      p = abs((mod(p, 1.0) - 0.5));
      return abs(max(p.x*1.5 + p.y, p.y*2.0) - 1.0);
    }

    void main() {
      vec2 ratio = vec2(2.0, 1.0);
      vec2 uv = vUv * ratio;
      vec2 pos = ratio * 0.5;
      float hex = smoothstep(0.0, 0.45, hex(uv * 5.0));

      // http://glslsandbox.com/e#45218.0
      vec3 q = vec3(uv, time);
      mat3 m = mat3(-2,-1,2, 3,-2,1, -1,1,3);
      float field = pow(min(min(field_fn,field_fn),field_fn), 7.) * 100. * intensity;
      float col = step(hex, 0.1) * field;
      col += (hex + field) * intensity * 0.15;

      // http://glslsandbox.com/e#46950.0
      float energyDisp = mod(time * 10., 1.5) + 0.3;
      float tickness = 220. - (200. * ringTickness);
      uv *= 2. - 1.0;
      float energy = abs((2.0) / ((uv.y - energyDisp + fbm(uv + time * 10.)) * tickness));
      // enable ring only if energy > 0
      col += step(max(sign(0.01 - ringTickness), 0.0), 0.5) * energy;

      vec3 color = vec3(col) * tint;
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

export default FireballShader;
