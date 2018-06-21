import { PHYSICS, GAME } from '../const';
import { SyncBodyPhysicsMesh, CartesianToCylinder } from '../utils';
import GamePhysicsBody from '../physics-body';
import LineTrail from '../line-trail';
import { MaterialFactoryInstance as MaterialFactory } from '../materials/material-factory';

const DEFAULT = {
  parent: null,
  maxTrails: 8,
  maxParticles: 30,
};

export default class PlayerExplosionSfx {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.bodies = [];
    this.particles = [];
    this.ringPosition = new THREE.Vector2();
    this.initParticles();
    this.initRing();
  }

  initRing() {
    const mat = MaterialFactory.getMaterial('PlayerHitFx', {
      transparent: true,
      color: 0xffffff,
    });
    const geo = new THREE.PlaneBufferGeometry(35, 35);
    this.ring = new THREE.Mesh(geo, mat);
    this.opts.parent.add(this.ring);
    this.ring.visible = false;
  }

  initParticles() {
    const { parent, maxParticles, maxTrails } = this.opts;
    const mat = MaterialFactory.getMaterial('GenericColor', {
      name: 'player_particle',
      color: 0x4544895,
    });
    const geoCone = new THREE.ConeBufferGeometry(1, 1, 3);
    const geoBox = new THREE.BoxBufferGeometry();
    let trailsCount = maxTrails;
    for (let i = 0; i < maxParticles; i++) {
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
    const { ring, ringPosition } = this;
    SyncBodyPhysicsMesh(mesh, body);
    mesh.rotation.x += body.velocity.x * 0.1;
    mesh.rotation.y += body.velocity.y * 0.1;
    if (trail) {
      trail.pushPosition(mesh.position);
    }
    CartesianToCylinder(ring.position, ringPosition.x, ringPosition.y,
      GAME.PlayerOffset + 1.5);
  }

  ringExplode(position) {
    const { ring } = this;
    const tl = new TimelineMax();
    this.ringPosition = position;
    ring.visible = true;
    const { uniforms } = ring.material;
    uniforms.rotation.value = THREE.Math.randFloat(0, Math.PI);
    uniforms.size.value = 0;
    uniforms.opacity.value = 1;
    uniforms.glowIntensity.value = 0;
    tl.to(uniforms.glowIntensity, 0.5, { value: 1 });
    tl.to(uniforms.glowIntensity, 0.3, { value: 0.2 }, 0.5);
    tl.to(uniforms.size, 1, { value: 1.0 }, 0);
    tl.to(uniforms.rotation, 1, { value: Math.PI }, 0);
    tl.to(uniforms.opacity, 0.1, { value: 0 }, 1.0);
    tl.timeScale(5.5);
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
