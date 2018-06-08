import { GAME, PHYSICS, EVENTS, COLLECTIBLE } from './const';
import { SyncBodyPhysicsMesh } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import CollectibleGlyph from './collectible-glyph';
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
const ItemGeometry = new THREE.IcosahedronGeometry(0.8);

export default class GameCollectible {
  constructor(x, y) {
    this.group = new THREE.Group();
    this.events = new EventEmitter3();
    this.group.name = 'GameCollectible';
    const pick = Collectibles[~~(Math.random() * Collectibles.length)];
    this.color = pick.color;
    this.type = pick.type;
    this.particles = [];
    this.offsetItem = Math.random();
    this.addGlyph(x, y);
    this.addItem(x, y);
    this.addTrailParticles(x, y);
    this.attachEvents();
  }

  attachEvents() {
    this.body.events.on(EVENTS.CollisionBegan, this.onCollisionBegan.bind(this));
  }

  onCollisionBegan() {
    this.body.enabled = false;
  }

  disable() {
    this.itemMesh.visible = false;
    this.particlesGroup.visible = false;
  }

  addItem(x, y) {
    const cacheId = this.color;
    const mat = MaterialFactory.getMaterial('CollectibleItem', {
      name: `collect_item_${this.type}`,
      color: this.color,
    }, cacheId);
    const mesh = new THREE.Mesh(ItemGeometry, mat);
    mesh.positionOffset = new THREE.Vector2();
    this.body = new GamePhysicsBody({
      type: PHYSICS.Collectible,
      mesh,
      isStatic: true,
      isSensor: true,
      label: 'collectible',
      onUpdate: SyncBodyPhysicsMesh.bind(this, mesh),
      distance: GAME.CollectibleItemOffset,
      scale: new THREE.Vector3(1.5, 1.5),
      collisionTargets: [PHYSICS.Player],
    });
    mesh.position.y = y;
    this.body.position.set(x, y);
    mesh.positionCulled = true;
    this.itemMesh = mesh;
    this.group.add(mesh);
  }

  addGlyph(x, y) {
    this.glyph = new CollectibleGlyph({ x, y, color: this.color, type: this.type });
    this.group.add(this.glyph.group);
  }

  addTrailParticles(x, y) {
    const g = new THREE.Group();
    for (let i = 0; i < MaxParticles; i++) {
      const phi = (Math.PI * 2 / MaxParticles) * i;
      const particle = this.getTrailParticle(x, y, phi);
      this.particles.push(particle);
      g.add(particle.trail.mesh);
    }
    g.positionCulled = true;
    g.position.y = y;
    this.particlesGroup = g;
    this.group.add(g);
  }

  getTrailParticle(x, y, phi) {
    const cacheId = this.color;
    const trail = new LineTrail({
      material: MaterialFactory.getMaterial('GenericTrail', {
        name: `collect_trail_${this.type}`,
        color: this.color,
        lineWidth: 0.3,
      }, cacheId),
    });
    return { trail, theta: Math.random() * Math.PI, phi, r: 1.5 };
  }

  /*
    Returns an array with all trail positions in world coordinates
  */
  getTrailPositions() {
    return this.particles.map((p) => {
      const pos = p.trail.line.geometry.attributes.position.array;
      const vPos = new THREE.Vector3(pos[0], pos[1], pos[2]);
      this.particlesGroup.localToWorld(vPos);
      return vPos;
    });
  }

  updateTrails(delta) {
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

  update(delta) {
    const { itemMesh, body } = this;
    this.offsetItem += delta * 3;
    itemMesh.rotation.x += delta * 0.5;
    itemMesh.rotation.y += delta * 0.5;
    itemMesh.positionOffset.y = Math.sin(this.offsetItem) * 0.5;
    this.glyph.update(delta);
    this.updateTrails(delta);
  }

  get visible() {
    return (this.itemMesh.visible || this.particlesGroup.visible)
      && this.itemMesh.parent !== null;
  }
}
