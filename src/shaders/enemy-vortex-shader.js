// Shader based from http://www.inear.se/2011/09/set-a-sphere-on-fire-with-three-js/
import { GetTextureRepeat } from '../game/utils';
import { IMAGE_ASSETS } from '../game/assets';

const EnemyVortexShader = {
  uniforms: {
    uTime: { value: 0 },
    uTwist: { value: 1820.5 },
    uColorFrom: { value: new THREE.Color(0.008, 0.008, 0.008) },
    uColorTo: { value: new THREE.Color(0.149, 0.208, 0.412) },
    uShapeBias: { value: new THREE.Vector2(0, 0)},
    uDisplacementScale: { value: 17 },
    uDisplacementBias: { value: 13 },
    uFogDistance: { value: 180 },
    tHeightMap: { value: GetTextureRepeat(IMAGE_ASSETS.PerlinNoise, 0, 0) },
  },
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tHeightMap;
    uniform float uTime;
    uniform vec3 uColorTo;
    uniform float uFogDistance;
    uniform vec3 uColorFrom;

    void main() {
      vec3 tex = texture2D(tHeightMap, vUv - uTime * 0.08).rgb;
      vec3 color = vec3((uColorFrom + uColorTo) * tex.r);
      float depth = gl_FragCoord.z / gl_FragCoord.w;
      float fogFactor = smoothstep( 0.0, uFogDistance, depth );
      vec3 fogColor = mix( color, vec3(0.0), fogFactor);
      float opacity = clamp(smoothstep(0.2, 1.0, 1.0 - vUv.y) * 2.5 - fogFactor, 0.0, 1.0);
      gl_FragColor = vec4(fogColor, opacity);
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
      mPosition.x *= 1.0 - uShapeBias.x * ( 1.0 - vUv.y );
      mPosition.y *= 1.0 - ( vUv.y - 0.5 ) * uShapeBias.y;

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
