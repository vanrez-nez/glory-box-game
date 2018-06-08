import { GAME, EVENTS } from './const';
import { MODEL_ASSETS } from './assets';
import { CartesianToCylinder, EaseExpoIn, EaseExpoOut } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import GameEnemyRaySfx from './sfx/enemy-ray-sfx';
import LineTrail from './line-trail';

const DEFAULT = {
  tailSize: 90,
  maxRays: 1,
};

export default class GameEnemy {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.group.name = 'GameEnemy';
    this.events = new EventEmitter3();
    this.modelLoaded = false;
    this.positionY = 0;
    this.headAmp = 3;
    this.speed = 3;
    this.theta = 0;
    this.time = 0;
    this.rays = [];
    this.bodies = [];
    this.tailPositions = [];
    this.tailSegments = [];
    this.loadModel();
    this.initRays();
    this.attachEvents();
  }

  attachEvents() {
    const { rays } = this;
    rays.forEach(r => r.body.events.on(EVENTS.CollisionBegan,
      this.onEnemyRayCollision.bind(this, r)));
  }

  loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(MODEL_ASSETS.Dragon, (glft) => {
      const scene = glft.scenes[0];
      this.head = scene.getObjectByName('head');
      this.eyes = scene.getObjectByName('eyes');
      this.tailSegment = scene.getObjectByName('tail_segment');
      this.group.add(this.head);
      this.initHead();
      this.initTail();
      this.initTrail();
      this.modelLoaded = true;
    });
  }

  onEnemyRayCollision(ray) {
    ray.body.enabled = false;
    this.events.emit(EVENTS.EnemyRayHit);
  }

  initRays() {
    const { group, bodies, rays, opts } = this;
    for (let i = 0; i < opts.maxRays; i++) {
      const sfx = new GameEnemyRaySfx({});
      sfx.mesh.scale.y = 70;
      rays.push(sfx);
      bodies.push(sfx.body);
      group.add(sfx.mesh);
    }

    setInterval(() => {
      rays[0].fire(0);
    }, 5000);
  }

  initHead() {
    const { head, eyes } = this;
    CartesianToCylinder(this.head.position, 0, 0, GAME.EnemyOffset);
    const headId = 'enemy_head';
    head.material = MaterialFactory.getMaterial('EnemyHead', {
      name: headId,
      color: 0x131e,
    }, headId);
    const eyesId = 'enemy_eyes';
    eyes.material = MaterialFactory.getMaterial('EnemyEyes', {
      name: eyesId,
      color: 0xffffff,
    }, eyesId);
  }

  initTail() {
    const { group, tailPositions, tailSegments, tailSegment } = this;
    const { tailSize } = this.opts;
    tailSegment.material = MaterialFactory.getMaterial('EnemyArmor', {
      name: 'enemy_armor',
      color: 0x131e,
    });
    tailPositions.push(new THREE.Vector2());
    for (let i = 0; i < tailSize; i++) {
      const t = tailSegment.clone();
      tailSegments.push(t);
      tailPositions.push(new THREE.Vector2(-100, 0, 0));
      group.add(t);
    }
  }

  initTrail() {
    let idx = 0;
    this.trail = new LineTrail({
      maxPositions: this.opts.tailSize,
      material: MaterialFactory.getMaterial('GenericTrail', {
        name: 'enemy_col_trail',
        color: 0xffff00,
        lineWidth: 2,
      }),
      sizeFn: () => {
        const i = idx++ % this.opts.tailSize;
        return EaseExpoOut(i / this.opts.tailSize);
      },
    });
    this.trail.line.geometry.boundingSphere.radius = 100;
    this.group.add(this.trail.mesh);
  }

  setOrbitPosition(obj, theta) {
    const x = (GAME.CilynderRadius + GAME.EnemyOffset) * Math.sin(theta);
    const y = this.positionY;
    const z = (GAME.CilynderRadius + GAME.EnemyOffset) * Math.cos(theta);
    obj.position.set(x, y, z);
  }

  /*
    Keeps the object facing towards the center, this is a performant
    but simplistic alternative for using THREE.Object3D's lookAt method
    https://stackoverflow.com/questions/1251828/calculate-rotations-to-look-at-a-3d-point
  */
  lookAtCenter(obj, zRotationOffset) {
    const { x, y, z } = obj.position;
    const rotX = Math.atan2(y - this.positionY, z);
    const cosRotX = Math.cos(rotX);
    const rotY = z >= 0 ? -Math.atan2(x * cosRotX, -z) : Math.atan2(x * cosRotX, z);
    const rotZ = Math.atan2(cosRotX, Math.sin(rotX) * Math.sin(rotY));
    obj.rotation.set(rotX, rotY, rotZ + zRotationOffset);
  }

  updateHead() {
    const { positionY, head, headAmp } = this;
    this.setOrbitPosition(this.head, this.theta);
    this.lookAtCenter(head, Math.PI / 4 * 6);
    head.position.y = positionY + Math.cos(this.time) * headAmp;
    /*
      (x) coord of tail positions array are irrelevant to the actual
      mesh position since all calcs for (x) and (z) are made using
      polar coords. Instead, x coords defines the force of the
      sinusoidal motion for the tail.
    */
    this.tailPositions[0].x = this.theta * 6;
    // update first tail position to follow the head
    this.tailPositions[0].y = head.position.y + 0.7;
  }

  /*
    Updates segment position to behave like a chain
    https://processing.org/examples/follow3.html
  */
  getSegmentPosition(idx) {
    const { tailPositions } = this;
    if (idx === 0) {
      return tailPositions[idx];
    } else {
      const prev = tailPositions[idx - 1];
      const pos = tailPositions[idx];
      if (pos && prev) {
        const dx = prev.x - pos.x;
        const dy = prev.y - pos.y;
        const angle = Math.atan2(dy, dx);
        pos.x = prev.x - Math.cos(angle) * 0.5;
        pos.y = prev.y - Math.sin(angle) * 0.5;
      }
      return pos;
    }
  }

  updateTail() {
    const { tailSegments } = this;
    const len = tailSegments.length;
    for (let i = 0; i < len; i++) {
      const seg = tailSegments[i];
      const pos = this.getSegmentPosition(i);
      const scale = Math.max(0.05, 1.4 - EaseExpoIn(i / len));
      seg.scale.set(scale, scale, scale);
      const thetaOffset = (i + 1.8) * 0.05;
      this.setOrbitPosition(seg, this.theta - thetaOffset);
      seg.position.y = pos.y;
      this.trail.updateTrailPosition(i, seg.position);
      this.lookAtCenter(seg, Math.PI / 4 * 6);
    }
  }

  updateTrail() {
    this.trail.pushPosition(this.head.position);
  }

  updateRays(delta, camera, playerPosition) {
    const { rays } = this;
    for (let i = 0; i < rays.length; i++) {
      const ray = rays[i];
      ray.mesh.lookAt(camera.position);
      ray.update(delta, playerPosition.y);
    }
  }

  fireRays(playerPosition) {

  }

  update(delta, camera, playerPosition) {
    if (this.modelLoaded) {
      this.theta += delta * 0.3 * this.speed;
      this.time += delta * this.speed;
      // this.positionY += delta * this.speed * 0.5;
      this.updateHead();
      this.updateTail();
      this.updateTrail(delta);
    }
    this.updateRays(delta, camera, playerPosition);
    this.fireRays();
  }
}
