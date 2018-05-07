
// https://www.gamasutra.com/blogs/YoannPignole/20140103/207987/Platformer_controls_how_to_avoid_limpness_and_rigidity_feelings.php
// https://www.gamasutra.com/blogs/LisaBrown/20171005/307063/GameMaker_Platformer_Jumping_Tips.php
// https://zackbellgames.com/2014/10/27/how-to-make-a-platformer-feel-good/
// https://kotaku.com/5420545/lets-talk-about-jumping

import { PHYSICS, EVENTS, GAME } from './const';
import { Clamp, TranslateTo3d } from './utils';
import GamePhysicsBody from './physics-body';
import LineTrail from './line-trail';

const DEFAULT = {
  jumpTolerance: 50,
  jumpForce: 1.5,
  walkForce: 0.16,
  gravity: -0.1,
  trailMaxPositions: 25,
  descentGravity: -0.8,
};

export default class GamePlayer {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.jumpLocked = false;
    this.jumpDefer = 0;
    this.group = new THREE.Object3D();
    this.initCube();
    this.initLights();
    this.initTrail();
    this.body = new GamePhysicsBody({
      type: PHYSICS.Player,
      mesh: this.mesh,
      mass: 0.16,
      friction: 0.13,
      label: 'player',
      scale: new THREE.Vector2(1.5, 1.5),
      gravity: new THREE.Vector2(0, opts.gravity),
      maxVelocity: new THREE.Vector2(0.3, 1.6),
      distance: GAME.PlayerDistance,
    });
    this.body.events.on(EVENTS.CollisionBegan, this.onCollisionBegan.bind(this));
  }

  initCube() {
    const geo = new THREE.BoxBufferGeometry(1.5, 1.5, 1.5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      transparent: true,
      flatShading: true,
      fog: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
  }

  initLights() {
    this.light = new THREE.PointLight(0xffffff, 7, 20);
    this.light.castShadow = true;
    this.light.shadow.mapSize = new THREE.Vector2(128, 128);
    this.light.power = 2.45 * Math.PI * 4;
    this.group.add(this.light);
  }

  initTrail() {
    this.trail = new LineTrail({});
    // this.group.add(this.trail.mesh);
  }

  get descending() {
    return !this.grounded && this.body.velocity.y < 0;
  }

  get ascending() {
    return !this.grounded && this.body.velocity.y > 0;
  }

  get grounded() {
    const cE = this.body.collidingEdges;
    return Boolean(cE.bottom) && (cE.bottom.isPlatform ||
      cE.bottom.opts.type === PHYSICS.WorldBounds);
  }

  onCollisionBegan(edges) {
    const { body, opts } = this;
    if (edges.bottom && (edges.bottom.isPlatform || edges.bottom.isWorldBounds)) {
      const tl = new TimelineMax();
      const pos = body.meshPositionOffset;
      const scale = body.meshScaleOffset;
      const hitHard = body.velocity.y < opts.descentGravity;
      const hitForce = hitHard ? 1 : 0.5;
      tl.to(scale, 0.1, { x: 0.5 * hitForce, y: -0.5 * hitForce, ease: Power2.easeOut });
      tl.to(scale, 0.15, { x: 0, y: 0, ease: Power2.easeOut });
      tl.to(pos, 0.1, { y: -0.6 * hitForce, ease: Power2.easeOut }, 0);
      tl.to(pos, 0.15, { y: 0, ease: Power2.easeOut });
    }
  }

  getJumpForce(inputs) {
    const { opts } = this;
    let force = 0;
    const time = performance.now();
    let isDeferedJump = false;

    // process defered jump
    const jumpDelta = time - this.jumpDefer;
    if (this.jumpDefer > 0 && jumpDelta < opts.jumpTolerance) {
      isDeferedJump = true;
    }

    if (inputs.Jump || isDeferedJump) {
      if (this.jumpLocked === true) return 0;
      this.jumpDefer = 0;
      if (this.grounded) {
        this.canDoubleJump = true;
        this.jumpLocked = true;
        force = opts.jumpForce;
      } else if (this.canDoubleJump) {
        force = opts.jumpForce;
        this.canDoubleJump = false;
        this.jumpLocked = true;
      } else {
        this.jumpDefer = time;
      }
    } else {
      this.jumpLocked = false;
    }
    return force;
  }

  getWalkingForce(inputs) {
    const { opts } = this;
    let force = 0;
    if (inputs.Left) {
      force -= opts.walkForce;
    }
    if (inputs.Right) {
      force += opts.walkForce;
    }
    return force;
  }

  processInputs(inputs) {
    const { body } = this;
    let [xForce, yForce] = [0, 0];
    yForce = this.getJumpForce(inputs);
    xForce = this.getWalkingForce(inputs);
    if (xForce !== 0 || yForce !== 0) {
      body.applyForce(new THREE.Vector2(xForce, yForce));
    }
  }

  updateTransforms() {
    const { opts, mesh, body, descending, grounded } = this;
    mesh.scale.y = Clamp(1 + body.velocity.y * 1.5, 1, 1.5);
    mesh.scale.x = Clamp(1 - body.velocity.y * 0.3, 0.5, 1);
    if (descending) {
      body.opts.gravity.set(0, opts.descentGravity);
    } else {
      body.opts.gravity.set(0, opts.gravity);
    }

    if (!grounded) {
      body.meshPositionOffset.multiplyScalar(0.8);
    }
  }

  updateLights() {
    const { light, body } = this;
    TranslateTo3d(light.position, body.position.x, body.position.y + 2, GAME.PlayerDistance + 3);
  }

  updateTrail() {
    const { trail, mesh } = this;
    trail.pushPosition(mesh.position);
  }

  update(delta, inputState) {
    this.processInputs(inputState);
    this.updateTransforms();
    this.updateLights();
    this.updateTrail();
  }
}
