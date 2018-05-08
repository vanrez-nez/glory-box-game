const TWO_PI = Math.PI * 2;

export function Clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function GetTextureRepeat(url, repeatX, repeatY) {
  const tex = new THREE.TextureLoader().load(url);
  tex.wrapS = THREE.MirroredRepeatWrapping;
  tex.wrapT = THREE.MirroredRepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

export function TranslateTo3d(position, toX, toY, radius = 35) {
  position.x = radius * Math.sin(toX / radius + TWO_PI);
  position.y = toY;
  position.z = radius * Math.cos(toX / radius + TWO_PI);
}

export function AddDot(scene, position, size = 5) {
  const geo = new THREE.Geometry();
  geo.vertices.push(position.clone());
  const mat = new THREE.PointsMaterial({
    size,
    sizeAttenuation: false,
    color: 0xffffff,
  });
  const dot = new THREE.Points(geo, mat);
  scene.add(dot);
  return dot;
}
