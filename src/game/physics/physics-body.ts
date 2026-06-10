import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { EVENTS, PHYSICS, GAME } from '@/game/const';
import { GameConfigInstance as GameConfig } from '@/game/config';
import CollisionEdges from '@/game/physics/collision-edges';

export interface PhysicsBodyOptions {
  label: string;
  mass: number;
  friction: number;
  isStatic: boolean;
  isSensor: boolean;
  syncLookAt: boolean;
  type: number;
  maxVelocity: THREE.Vector2;
  distance: number;
  onUpdate: (body: GamePhysicsBody) => void;
  collisionTargets: number[];
  scale?: THREE.Vector2;
  gravity?: THREE.Vector2;
}

const DEFAULT: PhysicsBodyOptions = {
  label: 'body',
  mass: 0.1,
  friction: 0.1,
  isStatic: false,
  isSensor: false,
  syncLookAt: true,
  type: PHYSICS.Generic,
  maxVelocity: new THREE.Vector2(1, 1),
  distance: 0,
  onUpdate: () => {},
  collisionTargets: [],
};

export default class GamePhysicsBody {
  id: string;
  opts: PhysicsBodyOptions;
  enabled: boolean;
  box: THREE.Box2;
  events: EventEmitter3;
  scale: THREE.Vector2;
  position: THREE.Vector2;
  prevPosition: THREE.Vector2;
  // Render interpolation: prevRenderPosition is the position at the start of the
  // last physics step; renderPosition is the interpolated value the mesh is
  // drawn at (see GamePhysics.interpolate). Kept separate from prevPosition,
  // which the moving-platform carry uses.
  prevRenderPosition: THREE.Vector2;
  renderPosition: THREE.Vector2;
  acceleration: THREE.Vector2;
  velocity: THREE.Vector2;
  prevCollisions: CollisionEdges;
  collidingEdges: CollisionEdges;
  isWorldBounds: boolean;
  isMovingPlatform: boolean;
  isStaticPlatform: boolean;
  isPlatform: boolean;
  mask = 0;

  constructor(opts: Partial<PhysicsBodyOptions> = {}) {
    this.id = THREE.MathUtils.generateUUID();
    this.opts = { ...DEFAULT, ...opts };
    this.enabled = true;
    this.box = new THREE.Box2();
    this.events = new EventEmitter3();
    this.scale = this.opts.scale || new THREE.Vector2();
    this.position = new THREE.Vector2();
    this.prevPosition = new THREE.Vector2();
    this.prevRenderPosition = new THREE.Vector2();
    this.renderPosition = new THREE.Vector2();
    this.acceleration = new THREE.Vector2();
    this.velocity = new THREE.Vector2();
    this.prevCollisions = new CollisionEdges();
    this.collidingEdges = new CollisionEdges();
    this.isWorldBounds = this.opts.type === PHYSICS.WorldBounds;
    this.isMovingPlatform = this.opts.type === PHYSICS.MovingPlatform;
    this.isStaticPlatform = this.opts.type === PHYSICS.StaticPlatform;
    this.isPlatform = this.isStaticPlatform || this.isMovingPlatform;
    this.updateScale();
    this.updateCollisionMask();
  }

  updateCollisionMask() {
    const { collisionTargets } = this.opts;
    collisionTargets.forEach((target) => {
      this.mask |= 1 << target | 0;
    });
  }

  applyForce(vecForce: THREE.Vector2) {
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
      if (collidingEdges.isEmpty()) {
        this.events.emit(EVENTS.CollisionEnded, collidingEdges);
      } else {
        const diff = collidingEdges.diff(prevCollisions);
        this.events.emit(EVENTS.CollisionBegan, diff);
      }
    }
  }

  update(delta: number, timeScale: number) {
    const { velocity, acceleration, position } = this;
    const { friction, maxVelocity } = this.opts;
    velocity.add(acceleration);
    velocity.x = THREE.MathUtils.clamp(velocity.x, -maxVelocity.x, maxVelocity.x);
    velocity.y = THREE.MathUtils.clamp(velocity.y, -maxVelocity.y, maxVelocity.y);
    acceleration.set(0, 0);
    if (delta > 0) {
      const dt = (1000 / 60) / (delta * 1000) * timeScale;
      velocity.multiplyScalar(1 - friction * dt);
      position.x += velocity.x * dt;
      position.y += velocity.y * dt;
    }
    this.updateScale();
    // Mesh sync no longer happens here — it runs once per drawn frame in
    // GamePhysics.interpolate so the render can interpolate between fixed steps.
  }

  canCollideWith(bodyType: number) {
    return (this.mask & (1 << bodyType | 0)) !== 0;
  }

  // Bodies author scale.x as a WORLD width (player cube 1.5, platform width, ray
  // diameter), but x positions/collisions live in map-x. One map-x unit spans
  // `CylinderRadius * ThetaPerUnit` world units of arc, so divide the x half-width
  // by that to keep the collision footprint matching the visual at any wrap angle.
  // (y maps 1:1 to world, so it's left alone.)
  get worldPerUnit() { return GAME.CylinderRadius * GameConfig.ThetaPerUnit; }

  updateScale() {
    const { box, scale } = this;
    const halfX = (scale.x * 0.5) / this.worldPerUnit;
    box.min.set(-halfX, -scale.y * 0.5);
    box.max.set(halfX, scale.y * 0.5);
  }

  /* Get absolute position for box edges */
  get leftEdge() { return this.position.x + this.box.min.x; }
  get rightEdge() { return this.position.x + this.box.max.x; }
  get topEdge() { return this.position.y - this.box.min.y; }
  get bottomEdge() { return this.position.y - this.box.max.y; }
  get halfScaleX() { return (this.scale.x / 2) / this.worldPerUnit; }
  get halfScaleY() { return this.scale.y / 2; }
}
