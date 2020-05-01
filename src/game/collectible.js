import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import { GAME, PHYSICS, EVENTS, COLLECTIBLE } from '@/game/const';
import { SyncBodyPhysicsMesh } from '@/game/utils';
import CollectibleGlyph from '@/game/collectible-glyph';
import GamePhysicsBody from '@/game/physics/physics-body';
import GameObjectState from '@/game/object-state';
import LineTrail from '@/game/line-trail';

const DEFAULT = {
  x: 0,
  y: 0,
};

const MaxParticles = 5;
const Collectibles = [
  { type: COLLECTIBLE.Honor, color: 0xff9a9a },
  { type: COLLECTIBLE.Courage, color: 0xfc7ad0 },
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
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.events = new EventEmitter3();
    this.group.name = 'GameCollectible';
    this.state = new GameObjectState({
      getStateFn: this.getState.bind(this),
      setStateFn: this.setState.bind(this),
    });
    const pick = Collectibles[~~(Math.random() * Collectibles.length)];
    this.color = pick.color;
    this.type = pick.type;
    this.particles = [];
    this.offsetItem = Math.random();
    this.consumed = false;
    this.addGlyph();
    this.addItem();
    this.addTrailParticles();
    this.attachEvents();
  }

  attachEvents() {
    this.body.events.on(EVENTS.CollisionBegan, this.onCollisionBegan.bind(this));
  }

  setPosition(position) {
    this.body.position.copy(position);
    this.glyph.mesh.position.y = position.y;
    this.glyph.mesh.updateMatrix();
  }

  getState() {
    return {
      consumed: this.consumed,
    };
  }

  setState(state) {
    this.consumed = state.consumed;
  }

  onCollisionBegan() {
    this.consumed = true;
    AudioManager.playTrack('collect');
  }

  addItem() {
    const { x, y } = this.opts;
    const cacheId = this.color;
    const mat = MaterialFactory.getMaterial('CollectibleItem', {
      name: `collect_item_${this.type}`,
      color: this.color,
    }, cacheId);
    const mesh = new THREE.Mesh(ItemGeometry, mat);
    mesh.positionOffset = new THREE.Vector2();
    this.body = new GamePhysicsBody({
      type: PHYSICS.Collectible,
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
    this.itemMesh = mesh;
    this.group.add(mesh);
  }

  addGlyph() {
    const { x, y } = this.opts;
    this.glyph = new CollectibleGlyph({ x, y, color: this.color, type: this.type });
    this.group.add(this.glyph.mesh);
  }

  addTrailParticles() {
    const { x, y } = this.opts;
    const g = new THREE.Group();
    for (let i = 0; i < MaxParticles; i++) {
      const phi = (Math.PI * 2 / MaxParticles) * i;
      const particle = this.getTrailParticle(x, y, phi);
      this.particles.push(particle);
      g.add(particle.trail.mesh);
    }
    g.position.y = y;
    this.trailsGroup = g;
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
      this.trailsGroup.localToWorld(vPos);
      return vPos;
    });
  }

  updateTrails(delta) {
    const { particles, trailsGroup } = this;
    const pos = new THREE.Vector3();
    trailsGroup.position.copy(this.itemMesh.position);
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
    const { consumed, glyph, itemMesh, trailsGroup, body } = this;
    const visible = !consumed;
    itemMesh.visible = visible;
    trailsGroup.visible = visible;
    body.enabled = visible;
    glyph.enabled = visible;
    if (visible) {
      this.offsetItem += delta * 3;
      itemMesh.rotation.x += delta * 0.5;
      itemMesh.rotation.y += delta * 0.5;
      itemMesh.positionOffset.y = Math.sin(this.offsetItem) * 0.5;
      this.updateTrails(delta);
    }
    this.glyph.update(delta);
  }
}
