import { GAME, PHYSICS, EVENTS, COLLECTIBLE } from './const';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import CollectibleGlyph from './collectible-glyph';
import LineTrail from './line-trail';
import SteeringParticle from './steering-particle';
import GamePhysicsBody from './physics-body';

const MaxParticles = 5;
const Collectibles = [
  { type: COLLECTIBLE.Honor, color: 0xff4f4f },
  { type: COLLECTIBLE.Courage, color: 0xf32fff },
  { type: COLLECTIBLE.Destiny, color: 0x2fe9ff },
  { type: COLLECTIBLE.Strength, color: 0xff8c2f },
  { type: COLLECTIBLE.Peace, color: 0xfdff2f },
  { type: COLLECTIBLE.Love, color: 0xff4f4f },
  { type: COLLECTIBLE.Energy, color: 0xff4f4f },
  { type: COLLECTIBLE.Difficulty, color: 0xff4f4f },
  { type: COLLECTIBLE.Happiness, color: 0xff4f4f },
];
const ItemGeometry = new THREE.IcosahedronGeometry(0.8);
const cacheVA = new THREE.Vector3();
const cacheVB = new THREE.Vector3();

export default class GameCollectible {
  constructor(x, y) {
    this.group = new THREE.Group();
    this.group.name = 'GameCollectible';
    const pick = Collectibles[~~(Math.random() * Collectibles.length)];
    this.color = pick.color;
    this.type = pick.type;
    this.particles = [];
    this.tracers = [];
    this.tracerMode = false;
    this.offsetItem = Math.random();
    this.addGlyph(x, y, pick.color);
    this.addItem(x, y, pick.color);
    this.addTrailParticles(x, y, pick.color);
    this.attachEvents();
  }

  attachEvents() {
    this.body.events.on(EVENTS.CollisionBegan, this.onCollisionBegan.bind(this));
  }

  onCollisionBegan() {
    this.body.enabled = false;
  }

  addItem(x, y, color) {
    const cacheId = color;
    const mat = MaterialFactory.getMaterial('CollectibleItem', { color }, cacheId);
    const mesh = new THREE.Mesh(ItemGeometry, mat);
    this.body = new GamePhysicsBody({
      type: PHYSICS.Collectible,
      mesh,
      isStatic: true,
      isSensor: true,
      label: 'collectible',
      distance: GAME.CollectibleItemOffset,
      scale: new THREE.Vector3(1.5, 1.5),
    });
    mesh.position.y = y;
    this.body.position.set(x, y);
    mesh.positionCulled = true;
    this.itemMesh = mesh;
    this.group.add(mesh);
  }

  addGlyph(x, y, color) {
    this.glyph = new CollectibleGlyph({ x, y, color });
    this.group.add(this.glyph.group);
  }

  addTrailParticles(x, y, color) {
    const g = new THREE.Group();
    for (let i = 0; i < MaxParticles; i++) {
      const phi = (Math.PI * 2 / MaxParticles) * i;
      const particle = this.getTrailParticle(x, y, color, phi);
      this.particles.push(particle);
      g.add(particle.trail.mesh);
    }
    g.positionCulled = true;
    g.position.y = y;
    this.particlesGroup = g;
    this.group.add(g);
  }

  getTrailParticle(x, y, color, phi) {
    const cacheId = color;
    const trail = new LineTrail({
      material: MaterialFactory.getMaterial('CollectibleTrail', {
        color,
        lineWidth: 0.3,
      }, cacheId),
    });
    return { trail, theta: Math.random() * Math.PI, phi, r: 1.5 };
  }

  updateStationaryTrailsPosition(delta) {
    const { particles, particlesGroup } = this;
    const pos = new THREE.Vector3();
    particlesGroup.position.copy(this.itemMesh.position);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const { trail, phi, r } = p;
      p.theta += delta * 4;
      pos.x = Math.cos(p.theta) * Math.cos(phi) * r;
      pos.y = Math.sin(p.theta) * r;
      pos.z = Math.cos(p.theta) * Math.sin(phi) * r;
      trail.pushPosition(pos);
    }
  }

  updateTracerTrailsPosition(delta) {
    const { tracers } = this;
    for (let i = 0; i < tracers.length; i++) {
      const { targetPosition, trail, particle } = tracers[i];
      const { opts } = particle;
      particle.update();
      particle.seek(targetPosition);
      opts.maxForce += 0.001;
      opts.maxSpeed = Math.max(0, opts.maxSpeed - 0.005);
      cacheVA.copy(particle.position);
      this.particlesGroup.worldToLocal(cacheVA);
      trail.pushPosition(cacheVA);
    }
  }

  startTracerMode(targetObject) {
    const { particles } = this;
    this.tracerMode = true;
    const rotStep = Math.PI / particles.length;
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const x = Math.sin(rotStep * i) * 2;
      const y = Math.cos(rotStep * i) * 2;
      const z = 1;
      const p = new SteeringParticle({});
      cacheVA.copy(particle.trail.mesh.position);
      p.acceleration.set(x, y, z);
      this.particlesGroup.localToWorld(cacheVA);
      p.position.copy(cacheVA);
      this.tracers.push({
        trail: particle.trail,
        targetPosition: targetObject.position,
        particle: p,
      });
    }
  }

  update(delta) {
    const { itemMesh, body } = this;
    if (!this.tracerMode) {
      this.offsetItem += delta * 3;
      itemMesh.rotation.x += delta * 0.5;
      itemMesh.rotation.y += delta * 0.5;
      body.meshPositionOffset.y = Math.sin(this.offsetItem) * 0.5;
      this.glyph.update(delta);
      this.updateStationaryTrailsPosition(delta);
    } else {
      this.updateTracerTrailsPosition(delta);
    }
  }

  get visible() {
    return (this.itemMesh.visible || this.particlesGroup.visible)
      && this.itemMesh.parent !== null;
  }
}
