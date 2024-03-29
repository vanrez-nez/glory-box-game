uniform vec3 u_tint;
uniform float u_innerRadius;
uniform float u_outterRadius;
uniform float u_borderSoftness;
varying vec2 v_uv;

// borrowed from  http://glslsandbox.com/e#42962.0
float hex(vec2 p) 
{
  p.x *= 0.57735*2.0;
  p.y += mod(floor(p.x), 2.0)*0.5;
  p = abs((mod(p, 1.0) - 0.5));
  return abs(max(p.x*1.5 + p.y, p.y*2.0) - 1.0);
}

void main() {
  vec2 ratio = vec2(1.0, 1.0);
  vec2 uv = v_uv * ratio;
  vec2 pos = ratio * 0.5;
  float dist = distance(uv, pos);
  float inRad = u_innerRadius * ratio.y;
  float outRad = u_outterRadius * ratio.y;
  float border = u_borderSoftness * 0.1;
  float disk = smoothstep(inRad, inRad + border, dist)
              - smoothstep(outRad - border, outRad, dist);
  disk += disk * 1.0 - smoothstep(0.0, inRad + 0.02, hex(uv * 80.0));
  vec3 c = vec3(disk) * u_tint;
  gl_FragColor = vec4(c, 1.0);
}