// Shader based from http://www.inear.se/2011/09/set-a-sphere-on-fire-with-three-js/
import { GetTextureRepeat } from '../game/utils';
import { IMAGE_ASSETS } from '../game/assets';

const EnemyVortexShader = {
  uniforms: {
    uTime: { value: 0 },
    uTwist: { value: 3050 },
    // 301d39 - 1a0708
    uColorFrom: { value: new THREE.Color(0.188, 0.114, 0.224) },
    uColorTo: { value: new THREE.Color(0.102, 0.027, 0.031) },
    uDisplacementScale: { value: 14 },
    uDisplacementBias: { value: 24 },
    uFogDistance: { value: 54 },
    tHeightMap: { value: GetTextureRepeat(IMAGE_ASSETS.PerlinNoise, 0, 0) },
  },
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tHeightMap;
    uniform float uTime;
    uniform vec3 uColorTo;
    uniform float uFogDistance;
    uniform vec3 uColorFrom;

    float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
    }

    float dash(vec2 dashUv, float density) {
      float line = floor(dashUv.x);
      dashUv.y += uTime * 43.0 * (mod(line, 1.0) * 2.0 - 6.0) * random(vec2(line));
      float rndDash = density * 0.1 * random(vec2(line));
      float dash = smoothstep(rndDash, rndDash + 0.1 * density, 1.7 * random( floor(dashUv) ));
      dash = dash * -1.0 + 1.0;
      return dash;
    }

    void main() {
      vec3 tex = texture2D(tHeightMap, vUv - uTime * 0.1).rgb;
      vec3 color = vec3((uColorFrom + uColorTo) * tex.r);
      float depth = gl_FragCoord.z / gl_FragCoord.w;
      float fogFactor = smoothstep( 0.0, uFogDistance, depth );
      color = mix( color, vec3(0.0), fogFactor);

      vec2 uv = vUv * 2.0 - 1.0;
      float d = dash(uv * vec2(260.0, 590.0), 1.0);
      d *= smoothstep(0.0, abs(uv.x), 0.6);
      vec3 dashColor = d * vec3(2.0) * fogFactor;
      color = mix(dashColor, color, 0.8);

      float opacity = clamp(smoothstep(0.2, 1.0, 1.0 - vUv.y) * 2.5 - fogFactor, 0.0, 1.0);
      gl_FragColor = vec4(color, opacity - 0.05);
    }
  `,
  vertexShader: `
    #define PI 3.14159265359
    varying vec2 vUv;
    uniform float uTime;
    uniform float uTwist;
    uniform float uDisplacementScale;
    uniform float uDisplacementBias;
    uniform vec2 uShapeBias;
    uniform sampler2D tHeightMap;

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
      vUv = uv;
      vec3 vNormal = normalize( normalMatrix * normal );
      
      vec4 mPosition = modelMatrix * vec4(position, 1.0);
      float angle_rad = uTwist * (PI / 180.0);
      float height = -500.0;
      float ang = (position.y-height*0.5)/height * angle_rad;
      vec4 twistedPosition = DoTwist(mPosition, ang);
      vec4 twistedNormal = DoTwist(vec4(vNormal,1.0), ang);
      vec4 mvPosition = viewMatrix * twistedPosition;
      vec2 sUv = vUv + uTime * 0.03;
      vec3 tex = texture2D(tHeightMap, sUv).xyz;
      float df = tex.x * uDisplacementScale + uDisplacementBias;
      vec4 displacementPosition = vec4(df * twistedNormal.xyz, 0.0) + mvPosition;
      gl_Position = projectionMatrix * displacementPosition;
    }
  `,
};

export default EnemyVortexShader;
