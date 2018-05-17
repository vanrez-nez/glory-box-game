import { GAME, PHYSICS, EVENTS, COLLECTIBLE } from './const';
import { TranslateTo3d } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import MapGlyph from './map-glyph';
import LineTrail from './line-trail';
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

export default class GameCollectible {
  constructor(x, y) {
    const pick = Collectibles[~~(Math.random() * Collectibles.length)];
    this.color = pick.color;
    this.type = pick.type;
    this.group = new THREE.Object3D();
    this.particles = [];
    this.offsetItem = Math.random();
    this.addGlyph(x, y, pick.color);
    this.addCollectible(x, y, pick.color);
    this.addTrailParticles(x, y, pick.color);
    this.attachEvents();
  }

  attachEvents() {
    this.body.events.on(EVENTS.CollisionBegan, this.onCollisionBegan.bind(this));
  }

  onCollisionBegan() {
    this.body.enabled = false;
    this.collectible.visible = false;
    this.particlesGroup.visible = false;
  }

  addCollectible(x, y, color) {
    const geo = new THREE.DodecahedronBufferGeometry(0.8);
    const mat = MaterialFactory.getMaterial('CollectibleSocket', { color });
    const mesh = new THREE.Mesh(geo, mat);
    TranslateTo3d(mesh.position, x, y, GAME.CollectibleDistance, 1.05);
    this.body = new GamePhysicsBody({
      type: PHYSICS.Collectible,
      mesh,
      isStatic: true,
      isSensor: true,
      label: 'collectible',
      distance: GAME.CollectibleDistance,
      scale: new THREE.Vector3(1.5, 1.5),
    });
    mesh.position.y = y;
    this.body.position.set(x, y);
    mesh.positionCulled = true;
    this.collectible = mesh;
    this.group.add(mesh);
  }

  addGlyph(x, y, color) {
    this.glyph = new MapGlyph(x, y, color);
    this.group.add(this.glyph.group);
  }

  addTrailParticles(x, y, color) {
    const g = new THREE.Object3D();
    for (let i = 0; i < MaxParticles; i++) {
      const phi = (Math.PI * 2 / MaxParticles) * i;
      const particle = this.getTrailParticle(x, y, color, phi);
      this.particles.push(particle);
      g.add(particle.trail.mesh);
    }
    g.positionCulled = true;
    this.particlesGroup = g;
    this.group.add(g);
  }

  getTrailParticle(x, y, color, phi) {
    const trail = new LineTrail({
      material: MaterialFactory.getMaterial('CollectibleTrail', { color }),
    });
    return { trail, theta: Math.random() * Math.PI, phi, r: 1.5 };
  }

  updateTrailsPosition(delta) {
    const { particles, particlesGroup } = this;
    const { position: cP } = this.collectible;
    const pos = new THREE.Vector3();
    particlesGroup.position.copy(cP);
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

  update(delta) {
    const { collectible, body } = this;
    this.offsetItem += delta * 3;
    collectible.rotation.x += delta * 0.5;
    collectible.rotation.y += delta * 0.5;
    body.meshPositionOffset.y = Math.sin(this.offsetItem) * 0.5;
    this.glyph.update(delta);
    this.updateTrailsPosition(delta);
  }

  get visible() {
    return this.collectible.visible
      && this.collectible.parent !== null;
  }
}
