varying vec2 v_uv;
void main() {
  v_uv = uv;
  // https://stackoverflow.com/questions/22053932/three-js-billboard-vertex-shader
  gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.x, position.y, 0.0, 0.0));
}