varying vec2 v_uv;
uniform float u_time;
uniform float u_offsetY;
uniform vec3 u_rayColor;
uniform vec4 u_rayLevels;
uniform vec4 u_fatDebrisLevels;
uniform vec3 u_fatDebrisColor;
uniform vec4 u_thinDebrisLevels;
uniform vec3 u_thinDebrisColor;
uniform vec2 u_resolution;

float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

float dash(vec2 dashUv, float density) {
  float line = floor(dashUv.x);
  dashUv.y += u_time * 20.0 * (mod(line, 1.0) * 2.0 - 6.0) * random(vec2(line));
  float rndDash = density * 0.1 * random(vec2(line));
  float dash = smoothstep(rndDash, rndDash + 0.01 * density, 0.9 * random( floor(dashUv) ));
  dash = dash * -1.0 + 1.0;
  return dash;
}

void main() {
  vec2 ratio = u_resolution / u_resolution.y;
  vec2 uv = v_uv * 2.0 - 1.0;
  uv *= ratio;

  /*
    This magic number have a direct relation with the y scale of the mesh
    it helps to offset the effect in relation to the player's position
  */
  uv.y += u_offsetY * 0.033;
  
  vec3 color = vec3(smoothstep(0.0, abs(uv.x), 0.055)) * 0.001;

  // Thin Dash background
  float d1Speed = u_thinDebrisLevels[0];
  float d1Density = u_thinDebrisLevels[1];
  float d1Width = u_thinDebrisLevels[2];
  float d1Intensity = u_thinDebrisLevels[3];
  float d1 = dash(uv * vec2(300.0, 300.0 - 260.0 * d1Speed), d1Density);
  d1 *= smoothstep(0.0, abs(uv.x), 0.05 * d1Width);
  color += d1 * u_thinDebrisColor * d1Intensity;

  // Fat Dash Background
  float d2Speed = u_fatDebrisLevels[0];
  float d2Density = u_fatDebrisLevels[1];
  float d2Width = u_fatDebrisLevels[2];
  float d2Intensity = u_fatDebrisLevels[3];
  float d2 = dash(uv * vec2(120.0, 80.0), d2Density);
  d2 *= smoothstep(0.0, abs(uv.x), 0.05 * d2Width);
  color += d2 * u_fatDebrisColor * d2Intensity;

  // Ray
  float rInnerGlow = u_rayLevels[0];
  float rOuterGlow = u_rayLevels[1];
  float rIntensity = u_rayLevels[2];
  float rInnerFade = u_rayLevels[3];
  float t = abs(rInnerGlow / (uv.x * (32.0 - 30.0 * rInnerGlow)));
  t += smoothstep(0.0, abs(uv.x), 0.1 * rOuterGlow) * 0.7;
  vec3 ray = u_rayColor * t * rIntensity;
  ray = clamp(ray, vec3(0.0), vec3(1.0));
  ray -= smoothstep(0.0, abs(uv.x), 0.25 * rInnerFade) * 1.0;
  color += ray;

  gl_FragColor = vec4(color, 1.0);
}