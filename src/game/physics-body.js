
import { EVENTS, PHYSICS, CONFIG, GAME } from './const';
import { Clamp, TranslateTo3d } from './utils';
import CollisionEdges from './collision-edges';

const DEFAULT = {
  label: 'body',
  mass: 0.1,
  mesh: null,
  friction: 0.1,
  isStatic: false,
  maxVelocity: new THREE.Vector2(1, 1),
  distance: GAME.CilynderRadius,
};

export default class GamePhysicsBody {
  constructor(opts) {
    this.id = THREE.Math.generateUUID();
    this.opts = { ...DEFAULT, ...opts };
    this.box = new THREE.Box2();
    this.scale = this.opts.scale || new THREE.Vector2();
    this.position = new THREE.Vector2();
    this.meshPositionOffset = new THREE.Vector2();
    this.meshScaleOffset = new THREE.Vector3();
    this.prevPosition = new THREE.Vector2();
    this.acceleration = new THREE.Vector2();
    this.velocity = new THREE.Vector2();
    this.events = new EventEmitter3();
    this.prevCollisions = new CollisionEdges();
    this.collidingEdges = new CollisionEdges();
    this.isWorldBounds = this.opts.type === PHYSICS.WorldBounds;
    this.isMovingPlatform = this.opts.type === PHYSICS.MovingPlatform;
    this.isStaticPlatform = this.opts.type === PHYSICS.StaticPlatform;
    this.isPlatform = this.isStaticPlatform || this.isMovingPlatform;
    this.sync(true);
  }

  applyForce(vecForce) {
    const { mass } = this.opts;
    vecForce.divide(new THREE.Vector2(mass, mass));
    this.acceleration.add(vecForce);
  }

  resetCollisionEdges() {
    const { prevCollisions, collidingEdges } = this;
    prevCollisions.copy(collidingEdges);
    collidingEdges.reset();
  }

  updateCollisionEvents() {
    const { prevCollisions, collidingEdges } = this;
    if (!prevCollisions.equals(collidingEdges)) {
      const diff = collidingEdges.diff(prevCollisions);
      this.events.emit(EVENTS.CollisionBegan, diff);
    }
  }

  update(delta, timeScale) {
    const { velocity, acceleration, position } = this;
    const { friction, maxVelocity } = this.opts;
    velocity.add(acceleration);
    velocity.x = Clamp(velocity.x, -maxVelocity.x, maxVelocity.x);
    velocity.y = Clamp(velocity.y, -maxVelocity.y, maxVelocity.y);
    acceleration.set(0, 0);
    if (delta > 0) {
      const dt = (1000 / 60) / (delta * 1000) * timeScale;
      velocity.multiplyScalar(1 - friction * dt);
      position.x += velocity.x * dt;
      position.y += velocity.y * dt;
    }
    this.sync(this.isStaticPlatform === false);
  }

  sync(updateLookAt) {
    const { opts,
      position: pos,
      collidingEdges: cE,
      meshPositionOffset: pOffset,
      meshScaleOffset: sOffset,
    } = this;
    const { mesh } = opts;
    this.updateScale();
    if (mesh) {
      if (CONFIG.DebugCollisions) {
        mesh.material.wireframe = cE.isColliding();
      }
      TranslateTo3d(
        mesh.position,
        pos.x + pOffset.x,
        pos.y + pOffset.y,
        opts.distance,
      );
      if (updateLookAt) {
        mesh.lookAt(0, pos.y, 0);
      }
      mesh.scale.x = 1 + sOffset.x;
      mesh.scale.y = 1 + sOffset.y;
      mesh.scale.z = 1 + sOffset.z;
    }
  }

  updateScale() {
    const { box, scale } = this;
    box.min.set(-scale.x * 0.5, -scale.y * 0.5);
    box.max.set(scale.x * 0.5, scale.y * 0.5);
  }

  /* Get absolute position for box edges */
  get leftEdge() { return this.position.x + this.box.min.x; }
  get rightEdge() { return this.position.x + this.box.max.x; }
  get topEdge() { return this.position.y - this.box.min.y; }
  get bottomEdge() { return this.position.y - this.box.max.y; }
  get halfScaleX() { return this.scale.x / 2; }
  get halfScaleY() { return this.scale.y / 2; }
}
