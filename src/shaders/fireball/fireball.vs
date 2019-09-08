varying vec2 v_uv;
varying float v_glowIntensity;
uniform vec2 u_glowIntensity;

void main() {
  v_uv = uv;
  // http://stemkoski.github.io/Three.js/Shader-Halo.html
  vec3 vNormal = normalize( normalMatrix * normal );
  float c = u_glowIntensity.x;
  float p = u_glowIntensity.y;
  v_glowIntensity = pow( c - dot( vNormal, vec3(0.7, 0.0, 1.0 ) ), p );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}