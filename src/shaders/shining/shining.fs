varying vec2 v_uv;
uniform vec3 u_color;
uniform float u_rotation;
uniform float u_size;
uniform float u_opacity;
uniform float u_glowIntensity;

#define BLADES 3.0
#define BIAS 0.1
#define SHARPNESS 5.0

void main() {
  vec2 uv = v_uv * 2. - 1.0;
  // From MrOMGWTF at http://glslsandbox.com/e#5248.0
  vec3 c = vec3(0.);
  float blade = clamp(pow(sin(atan(uv.y,uv.x)*BLADES+u_rotation)+BIAS, SHARPNESS), 0.0, 1.0);
  float dst = 1.0 / distance(vec2(0.0), uv);

  // center glow
  c += u_color * dst * u_glowIntensity * 2.0;

  // blades
  c += (u_color * min(1.0, blade * 0.9)) * (dst * 1.51);

  // fade
  c *= smoothstep(1.0, 65.0 - u_size * 60.0, dst);
  gl_FragColor = vec4(c, u_opacity);
}