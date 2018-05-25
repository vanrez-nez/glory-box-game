/*
  Simple Seek Steering Behaviour from Craig Reynolds as showed in
  http://www.red3d.com/cwr/steer/
  http://natureofcode.com/book/chapter-6-autonomous-agents/
*/

const DEFAULT = {
  maxSpeed: 1.4,
  maxForce: 0.07,
};

const cacheVecA = new THREE.Vector3();
const cacheVecB = new THREE.Vector3();

export default class SteeringParticle {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.position = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  seek(target) {
    const { maxSpeed, maxForce } = this.opts;
    const { position, velocity } = this;
    const desired = cacheVecA.copy(target).sub(position);
    desired.normalize();
    desired.multiplyScalar(maxSpeed);
    const steer = cacheVecB.subVectors(desired, velocity);
    steer.clampScalar(-maxForce, maxForce);
    this.applyForce(steer);
  }

  update() {
    const { maxSpeed } = this.opts;
    const { acceleration, velocity, position } = this;
    velocity.add(acceleration);
    velocity.clampScalar(-maxSpeed, maxSpeed);
    position.add(velocity);
    acceleration.multiplyScalar(0);
  }
}
