import * as THREE from 'three/webgpu';
import { PHYSICS } from '@/game/const';
import { GameConfigInstance as GameConfig } from '@/game/config';
import SolveRectangleCollision from '@/game/physics/collision';
import GamePhysicsBody from '@/game/physics/physics-body';

const DEFAULT = {
  gravity: new THREE.Vector2(0, -0.25),
  bounds: new THREE.Box2(),
  debug: false,
  timeScale: 1,
};

export default class GamePhysics {
  opts!: Record<string, any>;
  bodies!: any[];
  boundsBody!: any;
  testBoxA!: THREE.Box2;
  testBoxB!: THREE.Box2;
  wrapVec!: THREE.Vector2;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.bodies = [];
    /*
      Dummy object to set colliding edges of world bodies
      when hitting world boundaries
    */
    this.boundsBody = new GamePhysicsBody({ type: PHYSICS.WorldBounds });
    this.testBoxA = new THREE.Box2();
    this.testBoxB = new THREE.Box2();
    this.wrapVec = new THREE.Vector2();
  }

  // In full-circle mode the playable x is a loop of width MapWidth. Returns the
  // offset to add to bx so it lands in the nearest copy relative to ax (0 if the
  // pair doesn't straddle the seam, or when wrapping is disabled).
  wrapOffset(ax: number, bx: number) {
    if (!GameConfig.WrapAround) { return 0; }
    const w = GameConfig.MapWidth;
    const half = w / 2;
    const dx = bx - ax;
    if (dx > half) { return -w; }
    if (dx < -half) { return w; }
    return 0;
  }

  add(body: any) {
    const { bodies } = this;
    [].concat(body).forEach((b) => {
      bodies.push(b);
    });
  }

  remove(body: any) {
    const { bodies } = this;
    [].concat(body).forEach((b) => {
      const idx = bodies.indexOf(b);
      if (idx !== -1) {
        bodies.splice(idx, 1);
      }
    });
  }

  constrainToBoundaries(body: any, bounds: any) {
    const { boundsBody } = this;
    if (body.enabled && body.canCollideWith(boundsBody.opts.type)) {
      const {
        box,
        position: pos,
        velocity: vel,
        collidingEdges: cE,
      } = body;

      let collided = false;

      if (body.bottomEdge < bounds.max.y) {
        cE.bottom = boundsBody;
        pos.y += bounds.max.y - body.bottomEdge;
        pos.y -= PHYSICS.CollisionBias;
        collided = true;
      } else if (body.topEdge > bounds.min.y) {
        cE.top = boundsBody;
        pos.y -= bounds.min.y - body.topEdge;
        pos.y += PHYSICS.CollisionBias;
        collided = true;
      }

      if (GameConfig.WrapAround) {
        // Full circle: loop x continuously instead of hitting left/right walls.
        const w = GameConfig.MapWidth;
        const half = w / 2;
        if (pos.x >= half) {
          pos.x -= w;
        } else if (pos.x < -half) {
          pos.x += w;
        }
      } else if (body.leftEdge < bounds.min.x) {
        cE.left = boundsBody;
        pos.x = bounds.min.x - box.min.x;
        vel.x = 0;
        collided = true;
      } else if (body.rightEdge > bounds.max.x) {
        cE.right = boundsBody;
        pos.x = bounds.max.x - box.max.x;
        vel.x = 0;
        collided = true;
      }

      if (collided) {
        body.updateCollisionEvents();
      }
    }
  }

  getCollisions(bodies: any) {
    const { testBoxA: boxA, testBoxB: boxB } = this;
    const collisionPairs = [];
    for (let i = 0; i < bodies.length; i++) {
      const b1 = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const b2 = bodies[j];
        const disabled = b1.enabled === false || b2.enabled === false;
        const canCollide = b1.canCollideWith(b2.opts.type) || b2.canCollideWith(b1.opts.type);
        if (disabled || canCollide === false) {
          continue;
        }
        // Wrap-aware test: bring b2 into the nearest seam-copy of b1 so pads at
        // opposite map edges (same spot on the circle) still collide.
        const off2 = this.wrapOffset(b1.position.x, b2.position.x);
        boxA.copy(b1.box).translate(b1.position);
        boxB.copy(b2.box).translate(this.wrapVec.set(b2.position.x + off2, b2.position.y));
        const isColliding = boxA.intersectsBox(boxB);

        let shouldCollide = isColliding;

        // swap so b1 is always the dynamic object
        const swapped = b1.opts.isStatic;
        const pair = swapped ? [b2, b1] : [b1, b2];
        // offset that brings pair[1] into pair[0]'s frame for the solve
        const pairOff = swapped ? -off2 : off2;

        const b2isPlatform = pair[1].opts.type === PHYSICS.StaticPlatform ||
              pair[1].opts.type === PHYSICS.MovingPlatform;

        // skip collisions against platforms when comming from from bottom
        if (shouldCollide && pair[0].opts.type === PHYSICS.Player && b2isPlatform) {
          shouldCollide = pair[0].velocity.y < 0;
        }

        if (shouldCollide) {
          collisionPairs.push([pair[0], pair[1], pairOff]);
        }
      }
    }
    return collisionPairs;
  }

  solveCollisions(collisions: any) {
    if (collisions.length > 0) {
      for (let i = 0; i < collisions.length; i++) {
        const [b1, b2, off] = collisions[i];

        // Solve collision only when any of the two bodies are not sensors
        const solve = b1.opts.isSensor === false &&
          b2.opts.isSensor === false;
        // Resolve in b1's frame across the seam: shift b2 next to b1, solve, then
        // restore so the moving-platform follow below uses real positions.
        if (off) { b2.position.x += off; }
        SolveRectangleCollision(b1, b2, solve);
        if (off) { b2.position.x -= off; }

        // if object is colliding with moving platform move b1 along with it
        if (b2.opts.type === PHYSICS.MovingPlatform) {
          b1.position.x += b2.position.x - b2.prevPosition.x;
        }

        b2.updateCollisionEvents();
        b1.updateCollisionEvents();
      }
    }
  }

  // Render-interpolate every body's mesh between its position at the start of the
  // last physics step (prevRenderPosition) and now (position), by `alpha` (0..1,
  // mainloop's interpolationPercentage). Called once per drawn frame so motion is
  // smooth even when a frame runs zero or several fixed steps. Platforms/static
  // bodies sync to the current position (the moving-platform carry is timed to
  // the fixed step — see prevPosition snapshot below — so interpolating them
  // would fight it).
  interpolate(alpha: any) {
    const { bodies } = this;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      // Only enabled bodies were synced before (onUpdate ran inside body.update,
      // which is gated on enabled) — keep that so disabled meshes stay frozen.
      if (!b.enabled) { continue; }
      const { prevRenderPosition: prev, renderPosition: render, position: pos } = b;
      if (b.isPlatform || b.opts.isStatic) {
        render.copy(pos);
      } else {
        // Shortest path across the wrap seam so a seam crossing doesn't sweep
        // the body backwards across the whole cylinder for one frame.
        const px = prev.x + this.wrapOffset(pos.x, prev.x);
        render.x = px + (pos.x - px) * alpha;
        render.y = prev.y + (pos.y - prev.y) * alpha;
      }
      b.opts.onUpdate(b);
    }
  }

  update(delta: any) {
    const { gravity, timeScale, bounds } = this.opts;
    const { bodies } = this;
    // Snapshot each body's position before this step so the draw can interpolate
    // from here to the post-step position.
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].prevRenderPosition.copy(bodies[i].position);
    }
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const { opts } = b;
      if (b.enabled) {
        // skip static objects from apply gravity
        if (!opts.isStatic) {
          const g = opts.gravity !== undefined ? opts.gravity : gravity;
          b.velocity.x += opts.mass * g.x;
          b.velocity.y += opts.mass * g.y;
        }
        b.update(delta, timeScale);
      }
      b.resetCollisionEdges();
      this.constrainToBoundaries(b, bounds);
    }
    const collisionPairs = this.getCollisions(bodies);
    this.solveCollisions(collisionPairs);
    // Snapshot moving-platform x AFTER carrying so each physics step's carry
    // measures the platform's displacement since the previous step — independent
    // of how many draws (which set position) happened in between.
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.isMovingPlatform) {
        b.prevPosition.x = b.position.x;
      }
    }
  }
}
