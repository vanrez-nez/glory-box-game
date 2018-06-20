const ShineFxShader = {
  uniforms: {
    color: { value: new THREE.Color(0.180, 0.352, 0.764) },
    rotation: { value: 0 },
    size: { value: 1.0 },
    glowIntensity: { value: 1.0 },
    opacity: { value: 1.0 },
  },
  fragmentShader: `
    varying vec2 vUv;
    uniform float rotation;
    uniform float size;
    uniform vec3 color;
    uniform float opacity;
    uniform float glowIntensity;

    #define BLADES 3.0
    #define BIAS 0.1
    #define SHARPNESS 5.0

    void main() {
      vec2 uv = vUv * 2. - 1.0;
      // From MrOMGWTF at http://glslsandbox.com/e#5248.0
      vec3 c = vec3(0.);
      float blade = clamp(pow(sin(atan(uv.y,uv.x)*BLADES+rotation)+BIAS, SHARPNESS), 0.0, 1.0);
      float dst = 1.0 / distance(vec2(0.0), uv);
      
      // center glow
      c += color * dst * glowIntensity * 2.0;
      
      // blades
      c += (color * min(1.0, blade * 0.9)) * (dst * 1.51);
      
      // fade
      c *= smoothstep(1.0, 65.0 - size * 60.0, dst);
      gl_FragColor = vec4(c, opacity);
    }
  `,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // https://stackoverflow.com/questions/22053932/three-js-billboard-vertex-shader
      gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.x, position.y, 0.0, 0.0));
    }
  `,
};

export default ShineFxShader;
