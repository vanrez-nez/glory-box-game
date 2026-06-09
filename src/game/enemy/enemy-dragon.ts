import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import { GAME, PHYSICS, EVENTS } from '@/game/const';
import { MODEL_ASSETS } from '@/game/assets';
import { CartesianToCylinder, EaseExpoIn, EaseExpoOut } from '@/game/utils';
import { EnsureUv } from '@/common/three-utils';
import LineTrail from '@/game/line-trail';
import GamePhysicsBody from '@/game/physics/physics-body';

interface DragonOptions {
  parent: THREE.Object3D | null;
  tailSize: number;
  startPositionY: number;
  initialSpeed: number;
  maxSpeed: number;
}

const DEFAULT: DragonOptions = {
  parent: null,
  tailSize: 100,
  startPositionY: -80,
  initialSpeed: 3,
  maxSpeed: 10,
};

export default class GameEnemyDragon {
  opts: DragonOptions;
  events: EventEmitter3;
  modelLoaded: boolean;
  positionY: number;
  speed: number;
  headAmp: number;
  sinForce: number;
  theta: number;
  time: number;
  tailPositions: THREE.Vector2[];
  tailSegments: THREE.Object3D[];
  body: GamePhysicsBody;
  head!: THREE.Mesh;
  eyes!: THREE.Mesh;
  tailSegment!: THREE.Mesh;
  spine!: LineTrail;

  constructor(opts: Partial<DragonOptions> = {}) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.modelLoaded = false;
    this.positionY = this.opts.startPositionY;
    this.speed = this.opts.initialSpeed;
    this.headAmp = 13;
    this.sinForce = 10;
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
    AudioManager.playTrack('dragon_roar', '', 800);
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
    const loader = new GLTFLoader();
    loader.load(MODEL_ASSETS.Dragon, (glft) => {
      const scene = glft.scenes[0];
      this.head = scene.getObjectByName('head') as THREE.Mesh;
      this.eyes = scene.getObjectByName('eyes') as THREE.Mesh;
      this.tailSegment = scene.getObjectByName('tail_segment') as THREE.Mesh;
      this.opts.parent!.add(this.head);
      this.initHead();
      this.initTail();
      this.initSpine();
      this.modelLoaded = true;
    });
  }

  initHead() {
    const { head, eyes } = this;
    // The dragon GLTF ships without UVs; add zero UVs so the node materials
    // don't warn about a missing `uv` attribute.
    EnsureUv(head.geometry);
    EnsureUv(eyes.geometry);
    head.scale.multiplyScalar(2);
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
    // Shared geometry across all cloned tail segments — add zero UVs once.
    EnsureUv(tailSegment.geometry);
    tailSegment.material = MaterialFactory.getMaterial('EnemyArmor', {
      name: 'enemy_armor',
      color: 0x131e,
    });
    tailPositions.push(new THREE.Vector2());
    for (let i = 0; i < tailSize; i++) {
      const t = tailSegment.clone() as THREE.Mesh;
      tailSegments.push(t);
      tailPositions.push(new THREE.Vector2(-100, 0));
      opts.parent!.add(t);
    }
  }

  initSpine() {
    const { opts } = this;
    this.spine = new LineTrail({
      maxPositions: opts.tailSize,
      color: 0xffff00,
      lineWidth: 2,
      // widthCallback receives the normalized position along the line (0..1).
      sizeFn: (t: number) => EaseExpoOut(t),
    });
    opts.parent!.add(this.spine.mesh);
  }

  setOrbitPosition(obj: THREE.Object3D, theta: number) {
    const x = (GAME.CylinderRadius + GAME.EnemyOffset) * Math.sin(theta);
    const y = this.positionY;
    const z = (GAME.CylinderRadius + GAME.EnemyOffset) * Math.cos(theta);
    obj.position.set(x, y, z);
  }

  /*
    Keeps the object facing towards the center, this is a performant
    but simplistic alternative for using THREE.Object3D's lookAt method
    https://stackoverflow.com/questions/1251828/calculate-rotations-to-look-at-a-3d-point
  */
  lookAtCenter(obj: THREE.Object3D, zRotationOffset: number) {
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
  getSegmentPosition(idx: number) {
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
    this.speed = this.opts.initialSpeed;
    this.theta = 0;
    this.tailPositions.forEach((p) => {
      p.x = -200;
    });
  }

  updateHead(_delta?: number) {
    const { positionY, head, headAmp, sinForce } = this;
    this.setOrbitPosition(this.head, this.theta);
    this.lookAtCenter(head, Math.PI / 4 * 6);
    const headCos = Math.cos(this.time) * headAmp;
    head.position.y = positionY + headCos;

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
      const scale = Math.max(0.05, 3.0 - EaseExpoIn(i / len));
      seg.scale.set(scale, scale, scale);
      const thetaOffset = (i + 2.8) * 0.07;
      this.setOrbitPosition(seg, this.theta - thetaOffset);
      seg.position.y = pos.y;
      this.spine.updateTrailPosition(i, seg.position);
      this.lookAtCenter(seg, Math.PI / 4 * 6);
    }
  }

  updateSpine() {
    this.spine.pushPosition(this.head.position);
  }

  update(delta: number) {
    if (this.modelLoaded) {
      this.speed += delta * 0.1;
      this.speed = Math.min(this.opts.maxSpeed, this.speed);
      this.positionY += delta * this.speed;
      this.theta += delta * 1.2;
      this.time += delta;
      this.body.position.y = this.positionY - 5;
      this.updateHead(delta);
      this.updateTail();
      this.updateSpine();
    }
  }
}
