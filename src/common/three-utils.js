
/*
  Returns the width and height units to cover the entire
  screen with the given distance (usually z position) from
  the camera.
*/
export function GetScreenSize(camera, dst) {
  const vFOV = camera.fov * Math.PI / 180;
  const h = 2 * Math.tan(vFOV / 2) * Math.abs(dst);
  const w = h * camera.aspect;
  return [w, h];
}

/*
  Returns current world coords based on current camera distance
  and FOV. (x) and (y) params should be a range from 0 to 1
*/
export function GetScreenCoords(x, y, camera, dst) {
  const [w, h] = GetScreenSize(camera, dst);
  const xResult = w * -0.5 + (w * x);
  const yResult = h * -0.5 + (h * y);
  return [xResult, yResult];
}
