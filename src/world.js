import * as THREE from "three";

export function setupWorld(scene) {
  const planeGeo = new THREE.PlaneGeometry(100, 100);
  const planeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);
}
