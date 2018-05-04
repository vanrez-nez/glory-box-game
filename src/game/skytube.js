import StarFieldShader from '../shaders/starfield';

export default class GameSkytube {
  constructor() {
    this.mesh = this.getMesh();
  }

  getMesh() {
    const geo = new THREE.CylinderGeometry(200, 200, 300, 16, 1, true);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      fragmentShader: StarFieldShader.fragmentShader,
      vertexShader: StarFieldShader.vertexShader,
      uniforms: StarFieldShader.uniforms,
    });

    mat.blending = THREE.CustomBlending;
    mat.blendSrc = THREE.SrcColorFactor;
    mat.blendDst = THREE.DstColorFactor;
    mat.blendEquation = THREE.AddEquation;

    const mesh = new THREE.Mesh(geo, mat);
    //mesh.rotation.y = Math.PI / 4;
    return mesh;
  }

  update(delta) {
    this.mesh.material.uniforms.time.value += delta * 0.35;
  }
}
