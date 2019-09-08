#define volsteps 6
varying vec2 v_uv;
uniform float u_time;
uniform float u_intensity;
uniform float u_fade;
uniform float u_zoom;
uniform float u_transverseSpeed;
uniform float u_tile;
uniform float u_stepSize;
uniform vec3 u_color;

float field(in vec3 p) {
  float strength = 19. + .03 * log(1.e-6 + fract(sin(u_time) * 4373.11));
  float accum = 0.;
  float prev = 0.;
  float tw = 0.;

  for (int i = 0; i < 7; ++i) {
    float mag = dot(p, p);
    p = abs(p) / mag + vec3(-.5, -.8 + 0.1 * sin(u_time * 0.7 + 2.0), -1.1 + 0.3 * cos(u_time * 0.3));
    float w = exp(-float(i) / 7.);
    accum += w * exp(-strength * pow(abs(mag - prev), 2.3));
    tw += w;
    prev = mag;
  }
  return max(0., 5. * accum / tw - .7);
}

void main() {
  vec2 uv = v_uv * vec2(1., 0.25);
  float a_xz = 0.9;
  float a_yz = -0.6;
  float a_xy = 0.9;

  vec3 dir=vec3(uv * u_zoom, 1.);
  vec3 from=vec3(0.0, 0.0, 0.0);

  vec3 forward = vec3(0., 0., 1.);
  from.x += u_transverseSpeed * cos(0.01 * u_time) + 0.01 * u_time;
  from.y += u_transverseSpeed * sin(0.01 * u_time) + 0.01 * u_time;
  from.z += 0.001 * u_time;

  // Volumetric rendering
  float s = 0.25;
  float s3 = s + u_stepSize / 2.0;
  float t3 = 0.0;
  vec3 nebula = vec3(0.);
  for (int r = 0; r < volsteps; r++) {
    vec3 p3 = from + s3 * dir;
    p3 = abs(vec3(u_tile) - mod(p3, vec3(u_tile * 2.))); // tiling fold
    t3 = field(p3);
    float f = pow(u_fade, max(0., float(r)));
    nebula += mix(.4, 1., 0.) * vec3(1.8 * t3 * t3 * t3, 1.4 * t3 * t3, t3) * f;
    s3 += u_stepSize;
  }
  nebula *= u_intensity * smoothstep(0., 0.075, uv.y);
  nebula *= u_color;
  gl_FragColor = vec4(nebula, 1.0);
}