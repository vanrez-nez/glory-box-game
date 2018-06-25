import { GAME, PHYSICS, EVENTS } from './const';
import { MODEL_ASSETS } from './assets';
import { CartesianToCylinder, EaseExpoIn, EaseExpoOut } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import LineTrail from './line-trail';
import GamePhysicsBody from './physics-body';

const DEFAULT = {
  parent: null,
  tailSize: 120,
  startPositionY: -40,
};

export default class GameEnemyDragon {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.modelLoaded = false;
    this.positionY = this.opts.startPositionY;
    this.headAmp = 3;
    this.sinForce = 20;
    this.speed = 2.7;
    this.theta = 0;
    this.time = 0;
    this.tailPositions = [];
    this.tailSegments = [];
    this.body = this.getBody();
    this.loadModel();
    this.attachEvents();
  }

  attachEvents() {
    this.body.events.on(EVENTS.CollisionBegan, this.onCollisionBegan.bind(this));
  }

  onCollisionBegan() {
    this.events.emit(EVENTS.EnemyDragonHit);
    this.body.enabled = false;
  }

  getBody() {
    return new GamePhysicsBody({
      type: PHYSICS.EnemyDragon,
      isStatic: true,
      isSensor: true,
      scale: new THREE.Vector2(100, 10),
      label: 'enemy_dragon',
      collisionTargets: [PHYSICS.Player],
    });
  }

  loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(MODEL_ASSETS.Dragon, (glft) => {
      const scene = glft.scenes[0];
      this.head = scene.getObjectByName('head');
      this.eyes = scene.getObjectByName('eyes');
      this.tailSegment = scene.getObjectByName('tail_segment');
      this.opts.parent.add(this.head);
      this.initHead();
      this.initTail();
      this.initSpine();
      this.modelLoaded = true;
    });
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
    const { opts, tailPositions, tailSegments, tailSegment } = this;
    const { tailSize } = this.opts;
    tailSegment.material = MaterialFactory.getMaterial('EnemyArmor', {
      name: 'enemy_armor',
      color: 0x131e,
    });
    tailPositions.push(new THREE.Vector2());
    for (let i = 0; i < tailSize; i++) {
      const t = tailSegment.clone();
      tailSegments.push(t);
      tailPositions.push(new THREE.Vector2(-100, 0));
      opts.parent.add(t);
    }
  }

  initSpine() {
    const { opts } = this;
    let idx = 0;
    this.spine = new LineTrail({
      maxPositions: opts.tailSize,
      material: MaterialFactory.getMaterial('GenericTrail', {
        name: 'enemy_col_trail',
        color: 0xffff00,
        lineWidth: 2,
      }),
      sizeFn: () => {
        const i = idx++ % opts.tailSize;
        return EaseExpoOut(i / opts.tailSize);
      },
    });
    this.spine.line.geometry.boundingSphere.radius = 100;
    opts.parent.add(this.spine.mesh);
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
        pos.x = prev.x - Math.cos(angle);
        pos.y = prev.y - Math.sin(angle);
      }
      return pos;
    }
  }

  restart() {
    this.body.enabled = true;
    this.positionY = this.opts.startPositionY;
    this.body.position.y = this.positionY;
    this.time = 0;
    this.theta = 0;
    this.tailPositions.forEach((p) => {
      p.x = -200;
    });
  }

  updateHead(delta) {
    const { positionY, head, headAmp, sinForce } = this;
    this.setOrbitPosition(this.head, this.theta);
    this.lookAtCenter(head, Math.PI / 4 * 6);
    head.position.y = positionY + Math.cos(this.time) * headAmp;

    /*
      (x) coord of tail positions array are irrelevant to the actual
      mesh position since all calcs for (x) and (z) are made using
      polar coords. Instead, x coords defines the force of the
      sinusoidal motion for the tail.
    */
    this.tailPositions[0].x = this.theta * sinForce;
    // update first tail position to follow the head
    this.tailPositions[0].y = head.position.y + 0.7;
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
      this.spine.updateTrailPosition(i, seg.position);
      this.lookAtCenter(seg, Math.PI / 4 * 6);
    }
  }

  updateSpine() {
    this.spine.pushPosition(this.head.position);
  }

  update(delta, playerPosition) {
    if (this.modelLoaded) {
      this.positionY += delta * 7;
      this.theta += delta * 0.3 * this.speed;
      this.time += delta * this.speed;
      this.body.position.y = this.positionY;
      this.updateHead(delta);
      this.updateTail();
      this.updateSpine();
    }
  }
}
