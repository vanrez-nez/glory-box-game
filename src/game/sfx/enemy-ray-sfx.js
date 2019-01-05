import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import { GAME, PHYSICS } from '@/game/const';
import { CartesianToCylinder } from '@/game/utils';
import GamePhysicsBody from '@/game/physics/physics-body';

const DEFAULT = {
  parent: null,
};

export default class GameEnemyRaySfx {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.mesh = this.getMesh();
    this.body = this.getBody();
    this.positionX = 0;
    this.running = false;
    this.body.enabled = false;
    this.initTimeline();
  }

  getBody() {
    return new GamePhysicsBody({
      type: PHYSICS.EnemyRay,
      isStatic: true,
      isSensor: true,
      label: 'enemy_ray',
      collisionTargets: [PHYSICS.Player],
    });
  }

  getMesh() {
    const height = 1;
    const radius = 3.5;
    const ratio = height / (radius * Math.PI * 2);
    const xScale = 3;
    const yScale = 3 * ratio;
    const geo = new THREE.CylinderBufferGeometry(radius, radius, height, 16, 1, true);
    const mat = MaterialFactory.getMaterial('EnemyRay', {
      name: 'enemy_ray',
      color: 0xffffff,
      xScale,
      yScale,
    });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  initTimeline() {
    const { mesh, body } = this;
    const { uniforms: u } = mesh.material;
    const tl = new TimelineMax({ paused: true });
    /*
      Ray Levels - [x] InnerGlow, [y]: OuterGlow, [z]: Intensity, [w]: InnerFade
      Debris Levels - [x]: Speed, [y]: Density, [z]: Width, [w]: Intensity
    */

    tl.set(u.rayLevels.value, { x: 0, y: 0.5, z: 0.0, w: 0.0 });
    tl.set(u.thinDebrisLevels.value, { x: 0.5, y: 0.1, z: 0,  w: 0 });
    tl.set(u.fatDebrisLevels.value, { x: 0, y: 0, z: 0, w: 0 });
    tl.add(() => {
      body.enabled = false;
    });

    tl.add('warning');
    tl.to(u.rayLevels.value, 0.25, { z: 0.4 }, 'warning');
    tl.to(u.rayLevels.value, 0.35, { x: 0.2, ease: Power2.easeOut }, 'warning');
    tl.to(u.thinDebrisLevels.value, 1, { z: 0.5, w: 0.5 }, 'warning');
    tl.to(u.fatDebrisLevels.value, 0.6, { x: 0.5, y: 1.0, z: 0.4, w: 0.2 }, 'warning');

    tl.add('fire', 1.45);
    tl.set(body.scale, { x: 0.1 }, 'fire');
    tl.add(() => {
      AudioManager.playTrack('electric_blast');
      body.enabled = true;
    });
    tl.to(body.scale, 0.35, { x: 7, ease: Power2.easeOut }, 'fire');
    tl.to(u.rayLevels.value, 0.35, { x: 1.0, y: 0.2, z: 1.0, ease: Power2.easeOut }, 'fire');
    tl.to(u.thinDebrisLevels.value, 0.35, { y: 0.5, z: 1.0, w: 1.0, ease: Power2.easeOut }, 'fire');
    tl.to(u.fatDebrisLevels.value, 0.35, { y: 0.9, z: 1.0, w: 1.0, ease: Power2.easeOut }, 'fire');

    tl.add('cool', 1.8);
    tl.set(u.thinDebrisLevels.value, { x: 0.4, y: 1.0 }, 'cool');
    tl.set(u.fatDebrisLevels.value, { x: 1.0, y: 1.0 }, 'cool');
    tl.to(u.fatDebrisLevels.value, 0.1, { y: 0, w: 0.0, ease: Power2.easeOut }, 'cool');
    tl.to(u.rayLevels.value, 0.3, { w: 1.0, ease: Power4.easeOut }, 'cool');
    tl.add(() => {
      body.enabled = false;
    }, 'cool');
    tl.to(u.thinDebrisLevels.value, 0.8, { z: 0.0, y: 0.5, w: 0, ease: Power2.easeOut }, 'cool');

    this.timeline = tl;
  }

  fire(x) {
    this.positionX = x;
    this.timeline.progress(0, true);
    this.timeline.invalidate();
    this.running = true;
    this.body.enabled = false;
    AudioManager.playTrack('electric_charge');
  }

  hide() {
    this.running = false;
    this.body.enabled = false;
    this.mesh.visible = false;
  }

  update(delta, offsetY) {
    const { mesh, body, positionX, timeline: tl } = this;
    const { uniforms } = mesh.material;
    const { position: mPos } = mesh;
    mesh.visible = this.running;
    if (this.running === true) {
      mPos.y = offsetY;
      mesh.rotation.set(0, mesh.rotation.y + Math.PI, 0);
      body.position.set(positionX, mPos.y);
      body.scale.y = mesh.scale.y;
      const project = GAME.PlayerOffset;
      CartesianToCylinder(mPos, positionX, mPos.y, project);
      uniforms.time.value += delta;
      uniforms.offsetY.value = offsetY;
      const xRes = Math.sqrt(mPos.x * mPos.x + mPos.z * mPos.z);
      const yRes = mesh.scale.y;
      uniforms.resolution.value.set(xRes, yRes);
      tl.time(tl.time() + delta);
      this.running = tl.progress() < 1;
    }
  }
}
