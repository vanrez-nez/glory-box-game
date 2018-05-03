
// From https://www.shadertoy.com/view/ltB3zK by Timothy Lottes

export const CRTScreen = {
  uniforms: {
    opacity: { value: 1 },
    u_resolution: { value: new THREE.Vector2(800, 600) },
    tDiffuse: { value: null },
  },
  fragmentShader: `
    #define hardScan -5.0
    #define hardPix -10.0
    #define maskDark 0.9
    #define maskLight 1.2

    uniform vec2 u_resolution;
    uniform float opacity;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;

    // sRGB to Linear.
    // Assuing using sRGB typed textures this should not be needed.
    float ToLinear1(float c){return(c<=0.04045)?c/12.92:pow((c+0.055)/1.055,2.4);}
    vec3 ToLinear(vec3 c){return vec3(ToLinear1(c.r),ToLinear1(c.g),ToLinear1(c.b));}

    // Linear to sRGB.
    // Assuing using sRGB typed textures this should not be needed.
    float ToSrgb1(float c){return(c<0.0031308?c*12.92:1.055*pow(c,0.41666)-0.055);}
    vec3 ToSrgb(vec3 c){return vec3(ToSrgb1(c.r),ToSrgb1(c.g),ToSrgb1(c.b));}

    // Nearest emulated sample given floating point position and texel offset.
    // Also zero's off screen.
    const vec3 black = vec3(0.0,0.0,0.0);
    vec3 Fetch(vec2 pos,vec2 off){
      pos=floor(pos*u_resolution+off)/u_resolution;
      if(max(abs(pos.x-0.5),abs(pos.y-0.5))>0.5)return black;
      return ToLinear(texture2D(tDiffuse,pos.xy,-16.0).rgb);}
    
    // Distance in emulated pixels to nearest texel.
    vec2 Dist(vec2 pos) {return -(fract(pos*u_resolution)-vec2(0.5));}

    // 1D Gaussian.
    float Gaus(float pos,float scale){return exp2(scale*pos*pos);}

    // 3-tap Gaussian filter along horz line.
    vec3 Horz3(vec2 pos,float off){
    vec3 b=Fetch(pos,vec2(-0.5,off));
    vec3 c=Fetch(pos,vec2( 0.0,off));
    vec3 d=Fetch(pos,vec2( 0.5,off));
    float dst=Dist(pos).x;
    // Convert distance to weight.
    float scale=hardPix;
    float wb=Gaus(dst-0.5,scale);
    float wc=Gaus(dst+0.0,scale);
    float wd=Gaus(dst+0.5,scale);
    // Return filtered sample.
    return (b*wb+c*wc+d*wd)/(wb+wc+wd);}

    // 5-tap Gaussian filter along horz line.
    vec3 Horz5(vec2 pos,float off){
    vec3 a=Fetch(pos,vec2(-2.0,off));
    vec3 b=Fetch(pos,vec2(-1.0,off));
    vec3 c=Fetch(pos,vec2( 0.0,off));
    vec3 d=Fetch(pos,vec2( 1.0,off));
    vec3 e=Fetch(pos,vec2( 2.0,off));
    float dst=Dist(pos).x;
    // Convert distance to weight.
    float scale=hardPix;
    float wa=Gaus(dst-1.0,scale);
    float wb=Gaus(dst-0.5,scale);
    float wc=Gaus(dst+0.0,scale);
    float wd=Gaus(dst+0.5,scale);
    float we=Gaus(dst+1.0,scale);
    // Return filtered sample.
    return (a*wa+b*wb+c*wc+d*wd+e*we)/(wa+wb+wc+wd+we);}

    // Return scanline weight.
    float Scan(vec2 pos,float off){
    float dst=Dist(pos).y;
    return Gaus(dst+off,hardScan);}

    // Allow nearest three lines to effect pixel.
    vec3 Tri(vec2 pos){
    vec3 a=Horz3(pos,-1.0);
    vec3 b=Horz5(pos, 0.0);
    vec3 c=Horz3(pos, 1.0);
    float wa=Scan(pos,-1.0);
    float wb=Scan(pos, 0.0);
    float wc=Scan(pos, 1.0);
    return a*wa+b*wb+c*wc;}

    // Very compressed TV style shadow mask.
    vec3 Mask1(vec2 pos){
    float line=maskLight;
    float odd=0.0;
    if(fract(pos.x/6.0)<0.5)odd=1.0;
    if(fract((pos.y+odd)/2.0)<0.5)line=maskDark;  
    pos.x=fract(pos.x/3.0);
    vec3 mask=vec3(maskDark,maskDark,maskDark);
    if(pos.x<0.333)mask.r=maskLight;
    else if(pos.x<0.666)mask.g=maskLight;
    else mask.b=maskLight;
    mask*=line;
    return mask;}
    
    // Aperture-grille.
    vec3 Mask2(vec2 pos){
    pos.x=fract(pos.x/3.0);
    vec3 mask=vec3(maskDark,maskDark,maskDark);
    if(pos.x<0.333)mask.r=maskLight;
    else if(pos.x<0.666)mask.g=maskLight;
    else mask.b=maskLight;
    return mask;}

    // Stretched VGA style shadow mask (same as prior shaders).
    vec3 Mask3(vec2 pos){
    pos.x+=pos.y*3.0;
    vec3 mask=vec3(maskDark,maskDark,maskDark);
    pos.x=fract(pos.x/6.0);
    if(pos.x<0.333)mask.r=maskLight;
    else if(pos.x<0.666)mask.g=maskLight;
    else mask.b=maskLight;
    return mask;}

    // VGA style shadow mask.
    vec3 Mask4(vec2 pos){
    pos.xy=floor(pos.xy*vec2(1.0,0.5));
    pos.x+=pos.y*3.0;
    vec3 mask=vec3(maskDark,maskDark,maskDark);
    pos.x=fract(pos.x/6.0);
    if(pos.x<0.333)mask.r=maskLight;
    else if(pos.x<0.666)mask.g=maskLight;
    else mask.b=maskLight;
    return mask;}

    void main() {
      vec4 texel = texture2D( tDiffuse, vUv );
      //gl_FragColor = vec4(1.);
      gl_FragColor = opacity * texel;
      gl_FragColor.rgb=Tri(vUv)*Mask4(gl_FragColor.xy);
      gl_FragColor.a=1.0;  
      gl_FragColor.rgb=ToSrgb(gl_FragColor.rgb);
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

export default CRTScreen;
