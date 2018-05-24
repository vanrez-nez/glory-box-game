import { GAME } from './const';
import { MODEL_ASSETS } from './assets';
import { TranslateTo3d, AddDot } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import LineTrail from './line-trail';

const DEFAULT = {
  tailSize: 90,
};

const AngleVector = new THREE.Vector2();

export default class GameEnemy {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.group.name = 'GameEnemy';
    this.speed = 3;
    this.time = 0;
    this.headAmp = 3;
    this.tailPositions = [];
    this.tailSegments = [];
    // this.debugDots = [];
    this.modelLoaded = false;
    this.theta = 0;
    this.positionY = 0;
    this.loadModel();
  }

  loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(MODEL_ASSETS.Dragon, (glft) => {
      const scene = glft.scenes[0];
      this.head = scene.getObjectByName('head');
      this.eyes = scene.getObjectByName('eyes');
      this.tailSegmentA = scene.getObjectByName('tail_segment_a');
      this.tailSegmentB = scene.getObjectByName('tail_segment_b');
      this.group.add(this.head);
      this.initHead();
      this.initTail();
      this.initTrail();
      this.modelLoaded = true;
    });
  }

  initHead() {
    const { head, eyes } = this;
    TranslateTo3d(this.head.position, 0, 0, GAME.EnemyDistance);
    head.material = MaterialFactory.getMaterial('EnemyHead', { color: 0x0 });
    eyes.material = MaterialFactory.getMaterial('GenericColor', { color: 0xff0000 });
  }

  initTail() {
    const { group, tailPositions, tailSegments, tailSegmentA, tailSegmentB } = this;
    const { tailSize } = this.opts;
    tailSegmentA.material = MaterialFactory.getMaterial('EnemyArmor', { color: 0xff0000 });
    //tailSegmentA.up = (new THREE.Vector3(1, -1, 0)).normalize();
    tailPositions.push(new THREE.Vector2());
    for (let i = 0; i < tailSize; i++) {
      const t = tailSegmentA.clone();
      tailSegments.push(t);
      tailPositions.push(new THREE.Vector2());
      // this.debugDots.push(AddDot(this.group, new THREE.Vector3()));
      group.add(t);
    }
  }

  initTrail() {
    let idx = 0;
    this.trail = new LineTrail({
      maxPositions: this.opts.tailSize,
      material: MaterialFactory.getMaterial('CollectibleTrail', {
        color: 0xffff00,
        lineWidth: 2,
      }),
      sizeFn: p => {
        let i = idx++ % this.opts.tailSize;
        if (i === this.opts.tailSize - 1) {
          return 0.1;
        } else {
          return this.easeExpoOut(i / this.opts.tailSize);
        }
      },
    });
    this.trail.line.geometry.boundingSphere.radius = 100;
    this.group.add(this.trail.mesh);
  }

  setOrbitPosition(obj, theta) {
    const x = GAME.EnemyDistance * Math.sin(theta);
    const y = this.positionY;
    const z = GAME.EnemyDistance * Math.cos(theta);
    obj.position.set(x, y, z);
  }

  /* 
    Keeps the object facing towards the center, this is a performant
    but simplistic alternative for using THREE.Object3D's lookAt method
    https://stackoverflow.com/questions/1251828/calculate-rotations-to-look-at-a-3d-point
  */
  lookAtCenter(obj, zRotationOffset) {
    const { x, y, z } = obj.position;
    const rotX = Math.atan2(y, z);
    const cosRotX = Math.cos(rotX);
    const rotY = z >= 0 ? -Math.atan2(x * cosRotX, -z) : Math.atan2(x * cosRotX, z);
    const rotZ = Math.atan2(cosRotX, Math.sin(rotX) * Math.sin(rotY));
    obj.rotation.set(rotX, rotY, rotZ + zRotationOffset);
  }

  updateHead(delta) {
    const { positionY, head, headAmp } = this;
    this.setOrbitPosition(this.head, this.theta);
    this.lookAtCenter(head, Math.PI / 4 * 6);
    head.position.y = positionY + Math.cos(this.time) * headAmp;
    /*
      (x) coord of tail positions array are irrelevant to the actual
      mesh position since all calcs for (x) and (z) are made using
      polar coords. Instead, x coords defines the force of the
      sinusoidal motion for the tail.
    */
    this.tailPositions[0].x = this.theta * 6;
    // update first tail position to follow the head
    this.tailPositions[0].y = head.position.y + 0.5;
  }

  getSegmentPosition(idx) {
    const { tailPositions } = this;
    if (idx == 0) {
      return tailPositions[idx];
    } else {
      const prev = tailPositions[idx - 1];
      const pos = tailPositions[idx];
      if (pos && prev) {
        const dx = prev.x - pos.x;
        const dy = prev.y - pos.y;
        const angle = Math.atan2(dy, dx);
        pos.x = prev.x - Math.cos(angle) * 0.5;
        pos.y = prev.y - Math.sin(angle) * 0.5;
      }
      return pos;
    }
  }
  
  easeExpoIn(t) {
    return t === 0 ? 0 : Math.pow(1024, t - 1);
  };

  easeExpoOut(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, - 10 * t);
  }

  updateTail(delta) {
    const { position, head, tailSegments } = this;
    const len = tailSegments.length;
    for (let i = 0; i < len; i++) {
      const seg = tailSegments[i];
      const pos = this.getSegmentPosition(i);
      const scale = Math.max(0.05, 1.4 - this.easeExpoIn(i / len));
      seg.scale.set(scale, scale, scale);
      const thetaOffset = Math.max(0.1, i * 0.05);
      this.setOrbitPosition(seg, this.theta - thetaOffset);
      seg.position.y = pos.y;
      this.updateTrailPosition(i, seg.position);
      //const rotOffset = (seg.position.y - prev.position.y) * 0.4;
      this.lookAtCenter(seg, Math.PI / 4 * 6);
    }
  }

  updateTrailPosition(idx, position) {
    const { attributes } = this.trail.line;
    const arr = attributes.position.array;
    const offset = arr.length - idx * 6;
    arr[offset - 6] = position.x;
    arr[offset - 5] = position.y;
    arr[offset - 4] = position.z;
    arr[offset - 3] = position.x;
    arr[offset - 2] = position.y;
    arr[offset - 1] = position.z;
    attributes.position.needsUpdate = true;
  }

  debug(delta) {
    const { positio } = this;
    for (let i = 0; i < this.debugDots.length; i++) {
      const dot = this.debugDots[i];
      const { x, y } = this.tailPositions[i];
      dot.position.x = x;
      dot.position.y = y;
    }
  }

  updateTrail() {
    this.trail.pushPosition(this.head.position);
  }

  update(delta) {
    if (this.modelLoaded) {
      this.theta += delta * 0.3 * this.speed;
      this.time += delta * this.speed;
      this.updateHead(delta);
      this.updateTail(delta);
      this.updateTrail(delta);
      // this.debug(delta);
    }
  }
}
