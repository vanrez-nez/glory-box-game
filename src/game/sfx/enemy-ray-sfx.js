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
    this.power = 0.2;
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
    // tl.set(u.thinDebrisIntensity, { value: 0 });
    // tl.to(u.thinDebrisIntensity, 4, { value: 1.0 });
    // tl.to(u.rayIntensity, 1, { value: 0.1, ease: Power2.easeOut }, 0.3);
    // tl.to(u.rayIntensity, 3, { value: 1.0, ease: Power2.easeIn }, '+=0');
    tl.to(u.rayColor.value, 3, {
      r: 1.0,
      g: 1.0,
      b: 1.0,
      ease: Expo.easeIn,
    }, 0.3);
    // tl.to(u.rayIntensity, 1, { value: 0.0, ease: Power2.easeIn }, '-=0.2');
    tl.to(u.rayColor.value, 3, {
      r: 0.0,
      g: 0.0,
      b: 0.0,
    });
    this.timeline = tl;
  }

  fire(x, power) {
    this.power = power;
    this.positionX = x;
    this.running = true;
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
    }
  }
}
