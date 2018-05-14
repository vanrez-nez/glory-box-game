
// https://www.gamasutra.com/blogs/YoannPignole/20140103/207987/Platformer_controls_how_to_avoid_limpness_and_rigidity_feelings.php
// https://www.gamasutra.com/blogs/LisaBrown/20171005/307063/GameMaker_Platformer_Jumping_Tips.php
// https://zackbellgames.com/2014/10/27/how-to-make-a-platformer-feel-good/
// https://kotaku.com/5420545/lets-talk-about-jumping

import { PHYSICS, EVENTS, GAME } from './const';
import { Clamp, TranslateTo3d } from './utils';
import GamePhysicsBody from './physics-body';

const DEFAULT = {
  jumpTolerance: 50,
  fallTolerance: 120,
  jumpForce: 1.3,
  walkForce: 0.09,
  gravity: -0.16,
  descentGravity: -0.34,
};

export default class GamePlayer {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.jumpLocked = false;
    this.jumpDefer = 0;
    this.stateBuff = [];
    this.groundedTime = 0;
    this.group = new THREE.Object3D();
    this.initCube();
    this.initLights();
    this.body = new GamePhysicsBody({
      type: PHYSICS.Player,
      mesh: this.mesh,
      mass: 0.26,
      friction: 0.12,
      label: 'player',
      scale: new THREE.Vector2(1.5, 1.5),
      gravity: new THREE.Vector2(0, opts.gravity),
      maxVelocity: new THREE.Vector2(0.3, 1.7),
      distance: GAME.PlayerDistance,
    });
    this.attachEvents();
  }

  attachEvents() {
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
    // this.mesh.castShadow = true;
    this.group.add(this.mesh);
  }

  initLights() {
    this.light = new THREE.PointLight(0xffffff, 7, 20);
    this.light.castShadow = true;
    this.light.shadow.mapSize = new THREE.Vector2(128, 128);
    this.light.power = 2.45 * Math.PI * 4;
    this.group.add(this.light);
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

  get wasGrounded() {
    const time = performance.now();
    const dt = time - this.groundedTime;
    return this.descending && dt < this.opts.fallTolerance;
  }

  onCollisionBegan(edges) {
    const { body } = this;
    if (edges.bottom && (edges.bottom.isPlatform || edges.bottom.isWorldBounds)) {
      const tl = new TimelineMax();
      const pos = body.meshPositionOffset;
      const scale = body.meshScaleOffset;
      const hitHard = body.velocity.y < -0.8;
      const hitForce = hitHard ? 0.4 : 0.2;
      tl.to(scale, 0.1, { x: hitForce, y: -hitForce, ease: Power2.easeOut });
      tl.to(scale, 0.15, { x: 0, y: 0, ease: Power2.easeOut });
      tl.to(pos, 0.1, { y: -hitForce, ease: Power2.easeOut }, 0);
      tl.to(pos, 0.15, { y: 0, ease: Power2.easeOut });
    }
  }

  getJumpForce(inputs) {
    const { opts } = this;
    const released = inputs.Jump === false;
    const time = performance.now();

    if (this.grounded) {
      this.groundedTime = time;
    }

    const grounded = this.grounded || this.wasGrounded;
    if (this.jumpLocked === false) {
      // process defered jump
      const jumpDelta = time - this.jumpDefer;
      if (grounded && jumpDelta < opts.jumpTolerance) {
        this.canDoubleJump = true;
        this.jumpLocked = true;
        this.jumpDefer = 0;
        return opts.jumpForce;
      }

      if (inputs.Jump) {
        if (grounded) {
          this.canDoubleJump = true;
          this.jumpLocked = true;
          return opts.jumpForce;
        } else if (this.canDoubleJump) {
          this.jumpLocked = true;
          this.canDoubleJump = false;
          this.body.velocity.y = 0;
          return opts.jumpForce * 0.5;
        } else {
          this.jumpDefer = time;
        }
      }
    } else if (released) {
      this.jumpLocked = false;
    }
    return 0;
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
    if (xForce === 0) {
      this.body.velocity.x = 0;
    }
    if (xForce !== 0 || yForce !== 0) {
      body.applyForce(new THREE.Vector2(xForce, yForce));
    }
  }

  updateTransforms() {
    const { opts, body, grounded, descending } = this;
    if (descending) {
      body.opts.gravity.set(0, opts.descentGravity);
    } else {
      body.opts.gravity.set(0, opts.gravity);
    }
    if (!grounded) {
      // Modify height mass with velocity
      body.meshScaleOffset.y = Clamp(body.velocity.y * 0.5, -0.1, 0.9);
      // Modity width mass with velocity
      body.meshScaleOffset.x = Clamp(body.velocity.y * -0.2, -0.4, 0.15);
      body.meshScaleOffset.z = body.meshScaleOffset.x;
      // body.meshPositionOffset.multiplyScalar(0.99);
    }
  }

  updateLights() {
    const { light, body } = this;
    TranslateTo3d(light.position, body.position.x, body.position.y, GAME.PlayerDistance);
    light.position.addScalar(0.15);
  }

  update(delta, inputState) {
    this.processInputs(inputState);
    this.updateTransforms();
    this.updateLights();
  }
}
