import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { GAME } from '@/game/const';
import GameLobby from '@/game/lobby';
import WorldCylinder from '@/game/world/cylinder';

export default class GameWorld {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'GameWorld';
    this.addFloor();
    this.addMainCylinder();
    this.addFxCylinder();
    this.addSkyCylinder();
  }

  addMainCylinder() {
    this.mainCylinder = new WorldCylinder({});
    this.group.add(this.mainCylinder.group);
  }

  addLobby() {
    this.lobby = new GameLobby();
    this.group.add(this.lobby.group);
  }

  addSkyCylinder() {
    if (GameConfig.EnableSkyShader) {
      const geo = new THREE.CylinderGeometry(200, 200, 250, 16, 1, true);
      const mat = MaterialFactory.getMaterial('WorldSkyCylinder', {
        name: 'w_skyc',
      });
      this.skyCylinder = new THREE.Mesh(geo, mat);
      this.group.add(this.skyCylinder);
    }
  }

  addFloor() {
    const geo = new THREE.PlaneBufferGeometry(500, 500);
    const mat = MaterialFactory.getMaterial('WorldFloor', {
      name: 'w_floor',
      scale: 20,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.floor = mesh;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = GAME.BoundsBottom;
    mesh.positionCulled = true;
    this.group.add(mesh);
  }

  addFxCylinder() {
    const height = (GAME.CylinderRadius * Math.PI * 2) / 2;
    const radius = GAME.CylinderRadius + 0.01;
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
    uniforms.u_innerRadius.value = 0;
    uniforms.u_outterRadius.value = 0.01;
    uniforms.u_borderSoftness.value = 0;
    uniforms.u_tint.value.set(color);
    fxCylinder.position.y = position.y;
    // Find cylinder rotation so the center matches the position
    const defaultRot = (-Math.PI / 2);
    this.fxCylinder.rotation.y = defaultRot + (Math.PI / 2) * ((position.x * 1.08) / 64);
    tl.addCallback(() => { fxCylinder.visible = true; });
    tl.to(uniforms.u_innerRadius, 2, { value: 1, ease: Power1.easeOut });
    tl.to(uniforms.u_outterRadius, 1, { value: 1, ease: Power2.easeOut }, 0);
    tl.to(uniforms.u_borderSoftness, 1, { value: 1.0, ease: Power1.easeOut }, 0);
    tl.addCallback(() => { fxCylinder.visible = false; });
  }

  update(delta, playerPosition) {
    const { skyCylinder, mainCylinder } = this;
    mainCylinder.update(delta, playerPosition);
    if (GameConfig.EnableSkyShader) {
      const { uniforms } = skyCylinder.material;
      uniforms.u_time.value += delta * 0.35;
      skyCylinder.position.y = playerPosition.y;
    }
  }
}
