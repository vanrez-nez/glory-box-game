#define PI 3.14159265359
varying vec2 v_uv;
uniform vec2 u_shapeBias;
uniform float u_time;
uniform float u_twist;
uniform float u_displacementScale;
uniform float u_displacementBias;
uniform sampler2D t_heightMap;

vec4 DoTwist( vec4 pos, float t ) {
  float st = sin(t);
  float ct = cos(t);
  vec4 new_pos;
  new_pos.x = pos.x*ct - pos.z*st;
  new_pos.z = pos.x*st + pos.z*ct;
  new_pos.y = pos.y;
  new_pos.w = pos.w;
  return new_pos;
}

void main() {
  v_uv = uv;
  vec3 vNormal = normalize( normalMatrix * normal );
  vec4 mPosition = modelMatrix * vec4(position, 1.0);
  float angle_rad = u_twist * (PI / 180.0);
  float height = -500.0;
  float ang = (position.y-height*0.5)/height * angle_rad;
  vec4 twistedPosition = DoTwist(mPosition, ang);
  vec4 twistedNormal = DoTwist(vec4(vNormal,1.0), ang);
  vec4 mvPosition = viewMatrix * twistedPosition;
  vec2 sUv = v_uv + u_time * 0.03;
  vec3 tex = texture2D(t_heightMap, sUv).xyz;
  float df = tex.x * u_displacementScale + u_displacementBias;
  vec4 displacementPosition = vec4(df * twistedNormal.xyz, 0.0) + mvPosition;
  gl_Position = projectionMatrix * displacementPosition;
}