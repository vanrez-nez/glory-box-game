varying vec2 v_uv;
uniform vec3 u_color;
uniform sampler2D u_emissive;

void main() {
  vec2 uv = v_uv * 2.0 - 1.0;
  vec3 color = texture2D(u_emissive, v_uv).rgb;
  gl_FragColor = vec4(color, 1.0);
}