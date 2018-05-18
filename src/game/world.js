import { GAME } from './const';
import GameLobby from './lobby';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import CylinderFxShader from '../shaders/cylinder-fx';

export default class GameWorld {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'GameWorld';
    this.addFloor();
    this.addLobby();
    this.addMainCylinder();
    this.addFxCylinder();
    this.addCylinderBase();
    this.addSkyCylinder();
  }

  addLobby() {
    this.lobby = new GameLobby();
    // this.group.add(this.lobby.group);
  }

  addSkyCylinder() {
    const geo = new THREE.CylinderGeometry(200, 200, 250, 16, 1, true);
    const mat = MaterialFactory.getMaterial('WorldSkyCylinder');
    this.skyCylinder = new THREE.Mesh(geo, mat);
    // this.group.add(this.skyCylinder);
  }

  addFloor() {
    const geo = new THREE.PlaneBufferGeometry(1000, 1000);
    const mat = MaterialFactory.getMaterial('WorldFloor', { scale: 200 });
    const mesh = new THREE.Mesh(geo, mat);
    this.floor = mesh;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = GAME.BoundsBottom;
    mesh.positionCulled = true;
    this.group.add(mesh);
  }

  addFxCylinder() {
    const height = (GAME.CilynderRadius * Math.PI * 2) / 2;
    const radius = GAME.CilynderRadius + 0.01;
    const geo = new THREE.CylinderBufferGeometry(radius, radius,
      height, 64, 1, true, 0, Math.PI);
    const mat = new THREE.ShaderMaterial({
      fragmentShader: CylinderFxShader.fragmentShader,
      vertexShader: CylinderFxShader.vertexShader,
      uniforms: CylinderFxShader.uniforms,
      transparent: true,
    });
    mat.blending = THREE.AdditiveBlending;
    this.fxCylinder = new THREE.Mesh(geo, mat);
    this.fxCylinder.rotation.y = -Math.PI / 2;
    this.fxCylinder.visible = false;
    this.group.add(this.fxCylinder);
  }

  addCylinderBurstTweens(tl, position, color) {
    const { fxCylinder } = this;
    const { uniforms } = fxCylinder.material;
    uniforms.innerRadius.value = 0;
    uniforms.outterRadius.value = 0.01;
    uniforms.borderSoftness.value = 0;
    uniforms.tint.value.set(color);
    fxCylinder.position.y = position.y;
    const defaultRot = (-Math.PI / 2);
    this.fxCylinder.rotation.y = defaultRot + (Math.PI / 2) * ((position.x * 1.08) / 64);
    tl.addCallback(() => { fxCylinder.visible = true; });
    tl.to(uniforms.innerRadius, 2, { value: 1, ease: Power1.easeOut });
    tl.to(uniforms.outterRadius, 1, { value: 1, ease: Power2.easeOut }, 0);
    tl.to(uniforms.borderSoftness, 1, { value: 1.0, ease: Power1.easeOut }, 0);
    tl.addCallback(() => { fxCylinder.visible = false; });
  }

  addMainCylinder() {
    const height = 550;
    const ratio = height / (GAME.CilynderRadius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
    const geo = new THREE.CylinderBufferGeometry(GAME.CilynderRadius, GAME.CilynderRadius,
      height, 64, 1, true);
    const mat = MaterialFactory.getMaterial('WorldCylinder', { xScale, yScale });
    this.cylinder = new THREE.Mesh(geo, mat);
    // this.cylinder.receiveShadow = true;
    this.cylinder.position.y = height * 0.5 + GAME.BoundsBottom;
    this.cylinder.rotation.y = Math.PI / 8;
    this.group.add(this.cylinder);
  }

  addCylinderBase() {
    const height = 2.5;
    const ratio = height / (GAME.CilynderRadius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
    const geo = new THREE.CylinderBufferGeometry(GAME.CilynderRadius + 0.5,
      GAME.CilynderRadius + 1.8, height, 64, 1);
    const mat = MaterialFactory.getMaterial('WorldCylinder', { xScale, yScale });
    const mesh = new THREE.Mesh(geo, mat);
    this.cylinderBase = mesh;
    mesh.position.y = GAME.BoundsBottom + height / 2;
    this.group.add(mesh);
  }

  update(delta, playerPosition) {
    this.skyCylinder.material.uniforms.time.value += delta * 0.35;
    this.skyCylinder.position.y = playerPosition.y;
  }
}
