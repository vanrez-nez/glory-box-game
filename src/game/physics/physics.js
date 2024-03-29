import { PHYSICS } from '@/game/const';
import SolveRectangleCollision from '@/game/physics/collision';
import GamePhysicsBody from '@/game/physics/physics-body';

const DEFAULT = {
  gravity: new THREE.Vector2(0, -0.25),
  bounds: new THREE.Box2(),
  debug: false,
  timeScale: 1,
};

export default class GamePhysics {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.bodies = [];
    /*
      Dummy object to set colliding edges of world bodies
      when hitting world boundaries
    */
    this.boundsBody = new GamePhysicsBody({ type: PHYSICS.WorldBounds });
    this.testBoxA = new THREE.Box2();
    this.testBoxB = new THREE.Box2();
  }

  add(body) {
    const { bodies } = this;
    [].concat(body).forEach((b) => {
      bodies.push(b);
    });
  }

  remove(body) {
    const { bodies } = this;
    [].concat(body).forEach((b) => {
      const idx = bodies.indexOf(b);
      if (idx !== -1) {
        bodies.splice(idx, 1);
      }
    });
  }

  constrainToBoundaries(body, bounds) {
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

      if (body.leftEdge < bounds.min.x) {
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

  getCollisions(bodies) {
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
        boxA.copy(b1.box).translate(b1.position);
        boxB.copy(b2.box).translate(b2.position);
        const isColliding = boxA.intersectsBox(boxB);

        let shouldCollide = isColliding;

        // swap so b1 is always the dynamic object
        const pair = b1.opts.isStatic ? [b2, b1] : [b1, b2];

        const b2isPlatform = pair[1].opts.type === PHYSICS.StaticPlatform ||
              pair[1].opts.type === PHYSICS.MovingPlatform;

        // skip collisions against platforms when comming from from bottom
        if (shouldCollide && pair[0].opts.type === PHYSICS.Player && b2isPlatform) {
          shouldCollide = pair[0].velocity.y < 0;
        }

        if (shouldCollide) {
          collisionPairs.push(pair);
        }
      }
    }
    return collisionPairs;
  }

  solveCollisions(collisions) {
    if (collisions.length > 0) {
      for (let i = 0; i < collisions.length; i++) {
        const [b1, b2] = collisions[i];

        // Solve collision only when any of the two bodies are not sensors
        const solve = b1.opts.isSensor === false &&
          b2.opts.isSensor === false;
        SolveRectangleCollision(b1, b2, solve);

        // if object is colliding with moving platform move b1 along with it
        if (b2.opts.type === PHYSICS.MovingPlatform) {
          b1.position.x += b2.position.x - b2.prevPosition.x;
        }

        b2.updateCollisionEvents();
        b1.updateCollisionEvents();
      }
    }
  }

  update(delta) {
    const { gravity, timeScale, bounds } = this.opts;
    const { bodies } = this;
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
  }
}
