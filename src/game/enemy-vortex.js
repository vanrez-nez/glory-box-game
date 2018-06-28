import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';

const DEFAULT = {
  parent: null,
};

export default class GameEnemyVortex {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.clock = new THREE.Clock();
    this.particles = [];
    this.addMesh();
    this.addParticles();
  }

  addMesh() {
    const geo = new THREE.IcosahedronGeometry(35, 3);
    geo.computeFaceNormals();
    const mat = MaterialFactory.getMaterial('EnemyVortex', {});
    this.material = mat;
    this.mesh = new THREE.Mesh(geo, mat);
    this.opts.parent.add(this.mesh);
  }

  addParticles() {
    const geo = new THREE.BufferGeometry();
    const vertices = this.getVertices(1000);
    const materials = this.getMaterials();
    geo.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    materials.forEach((mat) => {
      const points = new THREE.Points(geo, mat);
      this.particles.push(points);
      this.opts.parent.add(points);
    });
  }

  getMaterials() {
    const materials = [];
    const params = [
      [0.2, 0x704362],
      [0.4, 0xa26395],
      [0.5, 0x9f5a6d],
    ];
    const tex = this.getParticleTexture();
    for (let i = 0; i < params.length; i++) {
      const [size, color] = params[i];
      const mat = MaterialFactory.getMaterial('EnemyVortexParticle', { 
        size, color,
        map: tex,
      });
      materials.push(mat);
    }
    return materials;
  }

  getParticleTexture() {
    const canvas = document.createElement('canvas');
    const size = 32;
    const half = size / 2;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(half, half, 0, half, half, size / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.arc(half, half, size, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  getVertices(count) {
    const vertices = [];
    const v3 = new THREE.Vector3();
    const cylindrical = new THREE.Cylindrical();
    for (let i = 0; i < count; i++) {
      cylindrical.set(
        THREE.Math.randFloat(35, 60),
        THREE.Math.randFloat(0, Math.PI * 2),
        THREE.Math.randFloat(-40, 40),
      );
      v3.setFromCylindrical(cylindrical);
      vertices.push(v3.x, v3.y, v3.z);
    }
    return vertices;
  }

  update(delta, positionY) {
    const { mesh, particles, clock } = this;
    const { uniforms } = this.material;
    mesh.rotation.y += delta;
    uniforms.uTime.value += delta;
    mesh.position.y = positionY + 20;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.position.copy(mesh.position);
      p.rotation.y += (1 - p.material.size) * 2 * delta;
      p.rotation.x = Math.sin(clock.getElapsedTime() + i) * Math.PI / 8;
    }
  }
}
