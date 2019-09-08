#define field_fn length(fract(q*=m*=.6+.1*2.)-.5)
varying vec2 v_uv;
varying float v_glowIntensity;
uniform vec3 u_fissuresColor;
uniform vec3 u_glowColor;
uniform vec3 u_ringColor;
uniform float u_time;
uniform float u_fissuresIntensity;
uniform float u_ringThickness;

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
  p.x *= (0.57735*2.0);
  p.y += (mod(floor(p.x), 2.0)*0.5);
  p = abs((mod(p, 1.0) - 0.5));
  return abs(max(p.x * 1.5 + p.y, p.y*2.0) - 1.0);
}

void main() {
  vec2 ratio = vec2(2.0, 1.0);
  vec2 uv = v_uv * ratio;

  // Hexagon + Caustic water like
  // http://glslsandbox.com/e#45218.0
  float h = smoothstep(0.0, 0.45, hex((uv + u_time * 0.2) * 7.0));
  vec3 q = vec3(uv, u_time);
  mat3 m = mat3(-2,-1,2, 3,-2,1, -1,1,3);
  float field = pow(min(min(field_fn,field_fn),field_fn), 7.) * 100. * u_fissuresIntensity;
  float col = step(h, 0.1) * field;

  // Ring
  // http://glslsandbox.com/e#46950.0
  uv *= 2. - 1.0;
  float energyDisp = mod(u_time * 10., 2.5) + 0.3;
  float thickness = 220. - (200. * u_ringThickness);
  float energy = abs((10.0) / ((uv.y - energyDisp + fbm(uv + u_time * 10.)) * thickness));
  // enable ring only if u_ringThickness > 0
  float ringCol = step(max(sign(0.01 - u_ringThickness), 0.0), 1.0) * energy;
  vec3 ring = vec3(ringCol) * u_ringColor;
  
  // inner glow
  vec3 glow = v_glowIntensity * u_glowColor;

  // mix all
  vec3 color = mix(glow, vec3(col) * u_fissuresColor, 0.5);
  color = mix(ring, color, 0.5);

  gl_FragColor = vec4(color, 1.0);
}