varying vec2 v_uv;
uniform vec3 u_colorTo;
uniform vec3 u_colorFrom;
uniform float u_fogDistance;
uniform float u_time;
uniform sampler2D t_heightMap;

float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

float dash(vec2 dashUv, float density) {
  float line = floor(dashUv.x);
  dashUv.y += u_time * 43.0 * (mod(line, 1.0) * 2.0 - 6.0) * random(vec2(line));
  float rndDash = density * 0.1 * random(vec2(line));
  float dash = smoothstep(rndDash, rndDash + 0.1 * density, 1.7 * random( floor(dashUv) ));
  dash = dash * -1.0 + 1.0;
  return dash;
}

void main() {
  vec3 tex = texture2D(t_heightMap, v_uv - u_time * 0.1).rgb;
  vec3 color = vec3((u_colorFrom + u_colorTo) * tex.r);
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = smoothstep( 0.0, u_fogDistance, depth );
  color = mix( color, vec3(0.0), fogFactor);

  vec2 uv = v_uv * 2.0 - 1.0;
  float d = dash(uv * vec2(260.0, 590.0), 1.0);
  d *= smoothstep(0.0, abs(uv.x), 0.6);
  vec3 dashColor = d * vec3(2.0) * fogFactor;
  color = mix(dashColor, color, 0.8);

  float opacity = clamp(smoothstep(0.2, 1.0, 1.0 - v_uv.y) * 2.5 - fogFactor, 0.0, 1.0);
  gl_FragColor = vec4(color, opacity - 0.05);
}