import * as THREE from "three";

export const ORBIT_TARGET = new THREE.Vector3(0, 0.7, 0);

const FOCUS_DISTANCE_RATIO = 0.55;
const COMFORT_WIDTH_PX = 1000;
const MIN_WIDTH_FACTOR = 0.6;

const tmpDir = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpUp = new THREE.Vector3();

function getWidthFactor(size, shiftX) {
  const freeWidthPx = size.width * (1 - shiftX);
  return THREE.MathUtils.clamp(freeWidthPx / COMFORT_WIDTH_PX, MIN_WIDTH_FACTOR, 1);
}

export function getFocusHeightPx(size, { shiftX = 0, shiftY = 0 }, heightRatio) {
  return size.height * (1 - shiftY) * heightRatio * getWidthFactor(size, shiftX);
}

export function computeFocus(
  { camera, size },
  { shiftX = 0, shiftY = 0, side = 0, heightRatio },
  out
) {
  const distance = camera.position.distanceTo(ORBIT_TARGET) * FOCUS_DISTANCE_RATIO;
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
  const visibleWidth = visibleHeight * (size.width / size.height);
  const freeWidth = visibleWidth * (1 - shiftX);
  const freeHeight = visibleHeight * (1 - shiftY);
  const height = freeHeight * heightRatio * getWidthFactor(size, shiftX);

  tmpDir.subVectors(ORBIT_TARGET, camera.position).normalize();
  tmpRight.setFromMatrixColumn(camera.matrixWorld, 0);
  tmpUp.setFromMatrixColumn(camera.matrixWorld, 1);

  out
    .copy(camera.position)
    .addScaledVector(tmpDir, distance)
    .addScaledVector(tmpRight, -shiftX * visibleWidth * 0.5 + side * freeWidth)
    .addScaledVector(tmpUp, shiftY * visibleHeight * 0.5 - height / 2);

  return height;
}
