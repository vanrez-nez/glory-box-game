import { GAME, EVENTS, PHYSICS } from '../const';
import { CartesianToCylinder } from '../utils';
import GamePhysicsBody from '../physics-body';
import { MaterialFactoryInstance as MaterialFactory } from '../materials/material-factory';

const DEFAULT = {
  parent: null,
};

export default class GameEnemyRaySfx {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.mesh = this.getMesh();
    this.body = this.getBody();
    this.positionX = 0;
    this.running = true;
    this.attachEvents();
    this.initTimeline();
  }

  attachEvents() {
  }

  getBody() {
    const { opts } = this;
    return new GamePhysicsBody({
      type: PHYSICS.EnemyRay,
      mass: 0.26,
      friction: 0.12,
      isStatic: true,
      label: 'enemy_ray',
      gravity: new THREE.Vector2(0, opts.gravity),
      maxVelocity: new THREE.Vector2(0.3, 1.7),
      distance: GAME.PlayerOffset,
    });
  }

  getMesh() {
    const height = 1;
    const radius = 5.5;
    const ratio = height / (radius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
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
    const { mesh } = this;
    const { uniforms: u } = mesh.material;
    const tl = new TimelineMax({ paused: true });
    /*
      Ray Levels - [x] InnerGlow, [y]: OuterGlow, [z]: Intensity, [w]: InnerFade
      Debris Levels - [x]: Speed, [y]: Density, [z]: Width, [w]: Intensity
    */
    
    tl.set(u.rayLevels.value, { x: 0, y: 0.5, z: 0.0, w: 0.0 });
    tl.set(u.thinDebrisLevels.value, { x: 0.5, y: 0.1, w: 0 });
    tl.set(u.fatDebrisLevels.value, { x: 0, y: 0, z: 0, w: 0 });
    
    tl.add('warning')
    tl.to(u.rayLevels.value, 0.5, { z: 0.4 }, 'warning');
    tl.to(u.thinDebrisLevels.value, 0.5, { z: 0.5, w: 0.5 }, 'warning');

    tl.add('fire', 2.0);
    tl.to(u.rayLevels.value, 1, { x: 0.6, y: 1.0, z: 1.0, ease: Power4.easeOut }, 'fire');
    tl.to(u.thinDebrisLevels.value, 1, { y: 0.5, z: 1.0, w: 1.0, ease: Power2.easeOut }, 'fire');
    tl.to(u.fatDebrisLevels.value, 1, { y: 0.6, z: 1.0, w: 1.0, ease: Power2.easeOut }, 'fire');

    tl.add('full', 3.0);
    tl.to(u.rayLevels.value, 1, { x: 1.0, ease: Power4.easeIn }, 'full');
    tl.to(u.thinDebrisLevels.value, 1, { x: 0.4, y: 1.0 }, 'full');
    tl.to(u.fatDebrisLevels.value, 1, { x: 1.0, y: 1.0 }, 'full');

    tl.add('down', 4.0);
    tl.to(u.rayLevels.value, 1.0, { w: 1.0, ease: Power4.easeOut }, 'down');
    tl.to(u.thinDebrisLevels.value, 1.6, { z: 0.0, y: 0.5, w: 0, ease: Power2.easeOut }, 'down');
    tl.to(u.fatDebrisLevels.value, 0.1, { y: 0, w: 0.0, ease: Power2.easeOut }, 'down');

    this.timeline = tl;
  }

  fire(x) {
    this.positionX = x;
    this.running = true;
    this.timeline.progress(0);
  }

  update(delta, offsetY) {
    const { mesh, positionX, timeline: tl } = this;
    const { uniforms } = mesh.material;
    const { position: mPos } = mesh;
    mesh.visible = this.running;
    if (this.running === true) {
      mesh.position.y = offsetY;
      mesh.rotation.x = 0;
      mesh.rotation.z = 0;
      mesh.rotation.y += Math.PI;
      const project = GAME.PlayerOffset;
      CartesianToCylinder(mesh.position, positionX, mesh.position.y, project);
      mesh.material.uniforms.time.value += delta;
      uniforms.offsetY.value = offsetY;
      const xRes = Math.sqrt(mPos.x * mPos.x + mPos.z * mPos.z);
      const yRes = mesh.scale.y;
      uniforms.resolution.value.set(xRes, yRes);
      tl.time(tl.time() + delta);
      this.running = tl.progress() < 1;
    }
  }
}
