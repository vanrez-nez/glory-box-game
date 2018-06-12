import { PHYSICS, GAME } from '../const';
import { SyncBodyPhysicsMesh, CartesianToCylinder } from '../utils';
import GamePhysicsBody from '../physics-body';
import LineTrail from '../line-trail';
import { MaterialFactoryInstance as MaterialFactory } from '../materials/material-factory';

const DEFAULT = {
  parent: null,
  maxTrails: 8,
};

export default class PlayerExplosionSfx {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.bodies = [];
    this.particles = [];
    this.ringRotationZ = 0;
    this.ringPosition = new THREE.Vector2();
    this.initParticles();
    this.initRing();
  }

  initRing() {
    const mat = MaterialFactory.getMaterial('GenericColor', {
      transparent: true,
      color: 0xffffff,
    });
    const geo = new THREE.RingBufferGeometry(0.8, 1.0, 8);
    this.ring = new THREE.Mesh(geo, mat);
    this.opts.parent.add(this.ring);
    this.ring.visible = false;
  }

  initParticles() {
    const { parent } = this.opts;
    const mat = MaterialFactory.getMaterial('GenericColor', {
      name: 'player_particle',
      color: 0xffffff,
    });
    const geoCone = new THREE.ConeBufferGeometry(1, 1, 3);
    const geoBox = new THREE.BoxBufferGeometry();
    let trailsCount = this.opts.maxTrails;
    for (let i = 0; i < 30; i++) {
      const size = THREE.Math.randFloat(0.4, 0.8);
      const trail = size > 0.5 && trailsCount-- > 0 ? this.getTrail(size) : null;
      const geo = size > 0.5 ? geoBox : geoCone;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.multiplyScalar(size);
      const body = new GamePhysicsBody({
        type: PHYSICS.Particle,
        label: 'particle',
        onUpdate: this.onPhysicsUpdate.bind(this, mesh, trail),
        distance: GAME.PlayerOffset,
        mass: Math.max(0.3 * (1 - size), 0.05),
        friction: 0.025,
        syncLookAt: false,
        scale: new THREE.Vector2(size, size),
        maxVelocity: new THREE.Vector2(5, 5),
        collisionTargets: [],
      });
      mesh.scaleOffset = new THREE.Vector3(-size, -size, -size);
      parent.add(mesh);
      this.bodies.push(body);
      this.particles.push({ trail, mesh, body });
      body.enabled = false;
      mesh.visible = false;
      if (trail) {
        parent.add(trail.mesh);
        trail.mesh.visible = false;
      }
    }
  }

  getTrail(lineWidth) {
    return new LineTrail({
      material: MaterialFactory.getMaterial('GenericTrail', {
        name: 'explode_trail',
        opacity: 0.1,
        transparent: true,
        color: 0xffffff,
        lineWidth,
      }, 'explode_trail'),
    });
  }

  onPhysicsUpdate(mesh, trail, body) {
    const { ring, ringPosition, ringRotationZ } = this;
    SyncBodyPhysicsMesh(mesh, body);
    mesh.rotation.x += body.velocity.x * 0.1;
    mesh.rotation.y += body.velocity.y * 0.1;
    if (trail) {
      trail.pushPosition(mesh.position);
    }
    CartesianToCylinder(ring.position, ringPosition.x, ringPosition.y,
      GAME.PlayerOffset + 7.5);
    this.ring.lookAt(0, ring.position.y, 0);
    this.ring.rotation.y = Math.PI;
    this.ring.rotation.z = ringRotationZ;
  }

  ringExplode(position) {
    const { ring } = this;
    const tl = new TimelineMax();
    this.ringPosition = position;
    this.ringRotationZ = Math.random() * Math.PI;
    ring.visible = true;
    ring.material.opacity = 1;
    ring.scale.set(0.1, 0.1, 0.1);
    tl.to(this, 0.5, { ringRotationZ: Math.PI / 4, ease: Power2.easeOut });
    tl.to(ring.material, 0.5, { opacity: 0, ease: Power2.easeOut }, 0);
    tl.to(ring.scale, 0.8, { x: 40, y: 40, ease: Power2.easeOut }, 0);
    tl.set(ring.scale, { x: 0.1, y: 0.1 });
  }

  explode(position) {
    const { particles } = this;
    const vForce = new THREE.Vector2();
    this.ringExplode(position);
    for (let i = 0; i < particles.length; i++) {
      const { body, mesh, trail } = particles[i];
      body.position.copy(position);
      body.enabled = true;
      if (trail) {
        trail.mesh.visible = true;
      }
      mesh.visible = true;
      const fX = THREE.Math.randFloat(-0.2, 0.2);
      const fY = THREE.Math.randFloat(-0.1, 0.3);
      vForce.set(fX, fY);
      body.applyForce(vForce);
    }
  }
}
