
import { PHYSICS } from './const';
import SolveRectangleCollision from './collision';
import GamePhysicsBody from './physics-body';

const DEFAULT = {
  gravity: new THREE.Vector2(0, -0.25),
  bounds: new THREE.Box2(),
  debug: false,
  timeScale: 1,
};

export default class GamePhysics {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.dynamicBodies = [];
    this.staticBodies = [];
    this.allBodies = [];
    // eslint-disable-next-line
    this.rTree = new rbush();
    this.collisionSpace = new THREE.Box2();
    /*
      Dummy object to set colliding edges of world bodies
      when hitting world boundaries
    */
    this.boundsBody = new GamePhysicsBody({ type: PHYSICS.WorldBounds });
    this.testBoxA = new THREE.Box2();
    this.testBoxB = new THREE.Box2();
  }

  add(bodies) {
    const { rTree, testBoxA, staticBodies, dynamicBodies } = this;
    [].concat(bodies).forEach((body) => {
      if (body.opts.isStatic) {
        staticBodies.push(body);
        const box = testBoxA.copy(body.box).translate(body.position);
        rTree.insert({
          minX: box.min.x,
          minY: box.min.y,
          maxX: box.max.x,
          maxY: box.max.y,
          body,
        });
      } else {
        dynamicBodies.push(body);
      }
    });
    this.allBodies = dynamicBodies.concat(staticBodies);
  }

  constrainToBoundaries(body, bounds) {
    const { boundsBody } = this;
    if (body.opts.isStatic === false) {
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

  getBodiesWithinCollisionSpace() {
    const { collisionSpace: cS, rTree } = this;
    return rTree.search({
      minX: cS.min.x,
      minY: cS.min.y,
      maxX: cS.max.x,
      maxY: cS.max.y,
    }).map(o => o.body).concat(this.dynamicBodies);
  }

  updateCollisionSpace(position, area) {
    const { collisionSpace: cS } = this;
    cS.min.set(-area * 0.5, -area * 0.5);
    cS.max.set(area * 0.5, area * 0.5);
    cS.translate(position);
  }

  getCollisions(bodies) {
    const { testBoxA: boxA, testBoxB: boxB } = this;
    const collisionPairs = [];
    for (let i = 0; i < bodies.length; i++) {
      const b1 = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const b2 = bodies[j];
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

  // https://gamedev.stackexchange.com/questions/48587/resolving-a-collision-with-forces/48834#48834
  calcCollisionForce(b1, b2, target) {
    const { x: b1vx, y: b1vy } = b1.velocity;
    const { x: b2vx, y: b2vy } = b2.velocity;
    target.x = (b1vx * (b1.mass - b2.mass) + (2 * b2.mass * b2vx)) / (b1.mass + b2.mass);
    target.y = (b1vy * (b1.mass - b2.mass) + (2 * b2.mass * b2vy)) / (b1.mass + b2.mass);
  }

  solveCollisions(collisions) {
    if (collisions.length > 0) {
      for (let i = 0; i < collisions.length; i++) {
        const [b1, b2] = collisions[i];
        SolveRectangleCollision(b1, b2);

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
    const { allBodies } = this;
    for (let i = 0; i < allBodies.length; i++) {
      const b = allBodies[i];
      const { opts } = b;

      // skip grounded objects from apply gravity
      if (!opts.isStatic && !b.collidingEdges.bottom) {
        const g = opts.gravity !== undefined ? opts.gravity : gravity;
        b.velocity.x += opts.mass * g.x;
        b.velocity.y += opts.mass * g.y;
      }

      b.update(delta, timeScale);
      b.resetCollisionEdges();
      this.constrainToBoundaries(b, bounds);
    }
    const cBodies = this.getBodiesWithinCollisionSpace();
    const collisionPairs = this.getCollisions(cBodies);
    this.solveCollisions(collisionPairs);
  }
}
