import { IMAGE_ASSETS } from './assets';
import NebulaShader from '../shaders/nebula';

export default class GameSkytube {
  constructor() {
    this.group = new THREE.Object3D();
    this.addOutterCylinder();
    this.addInnerCylinder();
  }

  addOutterCylinder() {
    const geo = new THREE.CylinderGeometry(200, 200, 250, 16, 1, true);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      fragmentShader: NebulaShader.fragmentShader,
      vertexShader: NebulaShader.vertexShader,
      uniforms: NebulaShader.uniforms,
    });
    this.outterCylinder = new THREE.Mesh(geo, mat);
    this.group.add(this.outterCylinder);
    // mesh.rotation.y = Math.PI / 4;
  }

  addInnerCylinder() {
    const height = 550;
    const tex = new THREE.TextureLoader().load(IMAGE_ASSETS.UniverseAmbient);
    const geo = new THREE.CylinderGeometry(100, 100, height, 16, 1, true);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      opacity: 0.65,
      side: THREE.BackSide,
    });

    this.innerCylinder = new THREE.Mesh(geo, mat);
    this.group.add(this.innerCylinder);
  }

  update(delta) {
    this.innerCylinder.rotation.y += delta * 0.05;
    this.outterCylinder.material.uniforms.time.value += delta * 0.35;
  }
}
