import { PHYSICS } from './const';

// https://github.com/kittykatattack/bump/blob/master/src/bump.js
export default function SolveRectangleCollision(b1, b2) {
  const { collidingEdges: ceb1 } = b1;
  const { collidingEdges: ceb2 } = b2;
  const vx = b1.position.x - b2.position.x;
  const vy = b1.position.y - b2.position.y;
  const combHalfWidth = Math.abs(b1.halfScaleX) + Math.abs(b2.halfScaleX);
  const combHalfHeight = Math.abs(b1.halfScaleY) + Math.abs(b2.halfScaleY);

  if (Math.abs(vx) < combHalfWidth) {
    if (Math.abs(vy) < combHalfHeight) {
      /* finds out the direction for the collision in relation of B1 */
      const overlapX = combHalfWidth - Math.abs(vx);
      const overlapY = combHalfHeight - Math.abs(vy);

      // x axis collision
      if (overlapX >= overlapY) {
        const yDir = vy > 0 ? 1 : -1;
        if (yDir === -1) (ceb1.top = b2) && (ceb2.bottom = b1);
        if (yDir === 1) (ceb1.bottom = b2) && (ceb2.top = b1);

        // correct position of colliding object
        b1.position.y += overlapY * yDir;

        // ensure they are always colliding to avoid event looping
        b1.position.y -= PHYSICS.CollisionBias * yDir;

      // y axis collision
      } else {
        const xDir = vx > 0 ? 1 : -1;
        if (xDir === 1) (ceb1.left = b2) && (ceb2.right = b1);
        if (xDir === -1) (ceb1.right = b2) && (ceb2.left = b1);
        b1.position.x += overlapX * xDir;
        b1.position.x -= PHYSICS.CollisionBias * xDir;
      }
    }
  }
}
