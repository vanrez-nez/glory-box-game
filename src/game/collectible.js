import { GAME } from './const';
import { TranslateTo3d } from './utils';
import MapGlyph from './map-glyph';
import { StaticInstance as Skybox } from './skybox';
import LineTrail from './line-trail';

const MaxParticles = 5;
const Colors = [
  0xff4f4f,
  0xf32fff,
  0x2fe9ff,
  0xff8c2f,
  0xfdff2f,
];

export default class GameCollectible {
  constructor(x, y) {
    const color = Colors[~~(Math.random() * Colors.length)];
    this.group = new THREE.Object3D();
    this.particles = [];
    this.offsetItem = Math.random();
    this.addGlyph(x, y, color);
    this.addCollectible(x, y, color);
    this.addParticles(x, y, color);
    this.initialPosition = this.collectible.position.clone();
  }

  addGlyph(x, y, color) {
    this.glyph = new MapGlyph(x, y, color);
    this.group.add(this.glyph.group);
  }

  addParticles(x, y, color) {
    for (let i = 0; i < MaxParticles; i++) {
      const phi = (Math.PI * 2 / MaxParticles) * i;
      const particle = this.getParticle(x, y, color, phi);
      this.particles.push(particle);
      this.group.add(particle.trail.mesh);
    }
  }

  getParticle(x, y, color, phi) {
    const trail = new LineTrail({
      material: new MeshLineMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        sizeAttenuation: true,
        lineWidth: 0.3,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      }),
    });
    return { trail, theta: Math.random() * Math.PI, phi, r: 1.5 };
  }

  addCollectible(x, y, color) {
    const geo = new THREE.DodecahedronBufferGeometry(0.8);
    const mat = new THREE.MeshLambertMaterial({
      envMap: Skybox.textureCube,
      reflectivity: 0.35,
      color,
      emissive: color,
      emissiveIntensity: 6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    TranslateTo3d(mesh.position, x, y, GAME.CilynderRadius);
    mesh.position.multiplyScalar(1.05);
    mesh.position.y = y;
    this.collectible = mesh;
    this.group.add(mesh);
  }

  updateTrailsPosition(delta) {
    const { particles } = this;
    const { position: cP } = this.collectible;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const { trail, phi, r } = p;
      const pos = new THREE.Vector3();
      p.theta += delta * 4;
      pos.x = cP.x + Math.cos(p.theta) * Math.cos(phi) * r;
      pos.y = cP.y + Math.sin(p.theta) * r;
      pos.z = cP.z + Math.cos(p.theta) * Math.sin(phi) * r;
      trail.pushPosition(pos);
    }
  }

  update(delta) {
    const { collectible, initialPosition } = this;
    this.offsetItem += delta * 3;
    collectible.rotation.x += delta * 0.5;
    collectible.rotation.y += delta * 0.5;
    collectible.position.y = initialPosition.y + Math.sin(this.offsetItem) * 0.5;
    this.glyph.update(delta);
    this.updateTrailsPosition(delta);
  }
}
