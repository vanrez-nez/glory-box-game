const StarFieldShader = {
  uniforms: {
    opacity: { value: 1 },
    time: { value: 0 },
  },
  fragmentShader: `
    #define iterations 6
    #define formuparam 0.8
    #define volsteps 6
    #define stepsize 0.450
    #define zoom 1.800
    #define tile 0.650
    #define brightness 0.008
    #define distfading 0.760
    #define saturation 0.300
    #define dustintensity 0.3
    #define starsvolume 1.8
    #define transverseSpeed zoom*1.0

    varying vec2 vUv;
    uniform float time;

    float field(in vec3 p) {
      float strength = 7. + .03 * log(1.e-6 + fract(sin(time) * 4373.11));
      float accum = 0.;
      float prev = 0.;
      float tw = 0.;
    
      for (int i = 0; i < 7; ++i) {
        float mag = dot(p, p);
        p = abs(p) / mag + vec3(-.5, -.8 + 0.1*sin(time*0.7 + 2.0), -1.1+0.3*cos(time*0.3));
        float w = exp(-float(i) / 7.);
        accum += w * exp(-strength * pow(abs(mag - prev), 2.3));
        tw += w;
        prev = mag;
      }
      return max(0., 5. * accum / tw - .7);
    }

    void main() {
      vec2 uv = vUv * vec2(1.,0.25);
      float a_xz = 0.9;
      float a_yz = -0.6;
      float a_xy = 0.9;

      vec3 dir=vec3(uv*zoom,1.);
      vec3 from=vec3(0.0, 0.0,0.0);

      vec3 forward = vec3(0.,0.,1.);
      from.x += transverseSpeed*(1.0)*cos(0.01*time) + 0.01*time;
      from.y += transverseSpeed*(1.0)*sin(0.01*time) + 0.01*time;
      from.z += 0.001 * time;

      //volumetric rendering
      float s=0.25;
      float s3 = s + stepsize/2.0;
      float t3 = 0.0;
      vec3 dust = vec3(0.);
      for (int r=0; r<volsteps; r++) {
        vec3 p3=from+(s3)*dir;
        p3 = abs(vec3(tile)-mod(p3,vec3(tile*2.))); // tiling fold
        t3 = field(p3);
        float fade = pow(distfading,max(0.,float(r)));
        dust += mix(.4, 1., 0.) * vec3(1.8 * t3 * t3 * t3, 1.4 * t3 * t3, t3) * fade;
        s3 += stepsize;
      }
      
      dust *= dustintensity;
      dust.r *= 0.05;
      dust.b *= 0.8;
      dust.g *= 0.1;
      gl_FragColor = vec4(dust, 1.0);
      //gl_FragColor = vec4(1., 0., 1., 1.);
    }
  `,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
};

export default StarFieldShader;
