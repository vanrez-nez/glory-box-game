const TWO_PI = Math.PI * 2;

export function Clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function GetTextureRepeat(url, repeatX, repeatY, offsetX = 0, offsetY = 0) {
  const tex = new THREE.TextureLoader().load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.offset.set(offsetX, offsetY);
  return tex;
}

export function GetTextureRepeatDefer(url, repeatX, repeatY, offsetX, offsetY) {
  return () => GetTextureRepeat(url, repeatX, repeatY, offsetX, offsetY);
}

export function TranslateTo3d(position, toX, toY, radius = 35, project = 0) {
  position.x = radius * Math.sin(toX / radius + TWO_PI);
  position.y = toY;
  position.z = radius * Math.cos(toX / radius + TWO_PI);
  if (project > 0) {
    position.multiplyScalar(project);
    position.y = toY;
  }
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
