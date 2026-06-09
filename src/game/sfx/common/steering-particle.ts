import * as THREE from 'three/webgpu';
/*
  Simple Seek Steering Behaviour from Craig Reynolds as showed in
  http://www.red3d.com/cwr/steer/
  http://natureofcode.com/book/chapter-6-autonomous-agents/
*/

const DEFAULT = {
  maxSpeed: 6,
  maxForce: 0.6,
};

const cacheVecA = new THREE.Vector3();
const cacheVecB = new THREE.Vector3();

export default class SteeringParticle {
  opts!: Record<string, any>;
  position!: THREE.Vector3;
  acceleration!: THREE.Vector3;
  velocity!: THREE.Vector3;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.position = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
  }

  applyForce(force: any) {
    this.acceleration.add(force);
  }

  seek(target: any) {
    const { maxSpeed, maxForce } = this.opts;
    const { position, velocity } = this;
    const desired = cacheVecA.copy(target).sub(position);
    const d = desired.length();
    desired.normalize();
    if (d < 35) {
      const m = (d / 35) * maxSpeed;
      desired.multiplyScalar(m);
    } else {
      desired.multiplyScalar(maxSpeed * 2);
    }
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
