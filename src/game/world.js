import { GAME, CONFIG } from './const';
import GameLobby from './lobby';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

const CYLINDER_HEIGHT = 128;

export default class GameWorld {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'GameWorld';
    this.noise = new Simple1DNoise();
    this.noiseIdx = Math.random();
    this.addFloor();
    // this.addLobby();
    this.addMainCylinder();
    this.addFxCylinder();
    this.addCylinderBase();
    this.addSkyCylinder();
  }

  addLobby() {
    this.lobby = new GameLobby();
    this.group.add(this.lobby.group);
  }

  addSkyCylinder() {
    if (CONFIG.EnableSkyShader) {
      const geo = new THREE.CylinderGeometry(200, 200, 250, 16, 1, true);
      const mat = MaterialFactory.getMaterial('WorldSkyCylinder', {
        name: 'w_skyc',
      });
      this.skyCylinder = new THREE.Mesh(geo, mat);
      this.group.add(this.skyCylinder);
    }
  }

  addFloor() {
    const geo = new THREE.PlaneBufferGeometry(1000, 1000);
    const mat = MaterialFactory.getMaterial('WorldFloor', {
      name: 'w_floor',
      scale: 200,
    });
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
    const mat = MaterialFactory.getMaterial('WorldFxCylinder', {
      name: 'w_fx_cylinder',
    });
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
    // Find cylinder rotation so the center matches the position
    const defaultRot = (-Math.PI / 2);
    this.fxCylinder.rotation.y = defaultRot + (Math.PI / 2) * ((position.x * 1.08) / 64);
    tl.addCallback(() => { fxCylinder.visible = true; });
    tl.to(uniforms.innerRadius, 2, { value: 1, ease: Power1.easeOut });
    tl.to(uniforms.outterRadius, 1, { value: 1, ease: Power2.easeOut }, 0);
    tl.to(uniforms.borderSoftness, 1, { value: 1.0, ease: Power1.easeOut }, 0);
    tl.addCallback(() => { fxCylinder.visible = false; });
  }

  getCylinder() {
    const ratio = CYLINDER_HEIGHT / (GAME.CilynderRadius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
    const geo = new THREE.CylinderBufferGeometry(GAME.CilynderRadius, GAME.CilynderRadius,
      CYLINDER_HEIGHT, 128, 1, true);
    const mat = MaterialFactory.getMaterial('WorldCylinder', {
      name: 'w_main_cylinder',
      xScale,
      yScale,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.position.y = CYLINDER_HEIGHT * 0.5 + GAME.BoundsBottom;
    mesh.rotation.y = Math.PI / 8;
    return mesh;
  }

  getLightDivision() {

  }

  addMainCylinder() {
    const c1 = this.getCylinder();
    const c2 = c1.clone();
    const div = this.getLightDivision();
    this.mainCylinder = { c1, c2, div };
    this.group.add(c1, c2);
  }

  addCylinderBase() {
    const height = 2.5;
    const ratio = height / (GAME.CilynderRadius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
    const geo = new THREE.CylinderBufferGeometry(GAME.CilynderRadius + 0.5,
      GAME.CilynderRadius + 1.8, height, 64, 1);
    const mat = MaterialFactory.getMaterial('WorldCylinder', {
      name: 'w_base_cylinder',
      xScale,
      yScale,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.cylinderBase = mesh;
    mesh.position.y = GAME.BoundsBottom + height / 2;
    this.group.add(mesh);
  }

  /*
    Adjust (y) position from both cylinders so there are tiled one
    in top of the another, so they are always covering the
    view height from current player's position.
  */
  updateMainCylindersTiling(playerPosition) {
    const { c1, c2 } = this.mainCylinder;
    const { y } = playerPosition;
    const h = CYLINDER_HEIGHT;
    const q = Math.round(y / h);

    // get middle, top and bottom snapped positions
    const qM = q * h;
    const qT = (q + 1) * h;
    const qB = (q - 1) * h;

    // get distances from top and bottom
    const dstTop = Math.abs(y - qT);
    const dstBottom = Math.abs(y - qB);

    // use closest as next
    const qNext = dstBottom > dstTop ? qT : qB;
    c1.position.y = qM;
    c2.position.y = qNext;
  }

  update(delta, playerPosition) {
    const { skyCylinder, mainCylinder, cylinderBase, noise } = this;

    if (CONFIG.EnableSkyShader) {
      const { uniforms } = skyCylinder.material;
      uniforms.time.value += delta * 0.35;
      skyCylinder.position.y = playerPosition.y;
    }

    if (cylinderBase.material.emissiveIntensity) {
      this.noiseIdx += delta;
      const { c1, c2 } = mainCylinder;
      const val = Math.max(0.55, noise.getVal(this.noiseIdx) * 1.8);
      c1.material.emissiveIntensity = val;
      c2.material.emissiveIntensity = val;
      cylinderBase.material.emissiveIntensity = val;
    }
    this.updateMainCylindersTiling(playerPosition);
  }
}
