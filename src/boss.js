import * as THREE from "three";
import { loadModel } from "./loaders.js";

export function setupBoss(scene) {
  const geo = new THREE.BoxGeometry(2, 2, 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
  const mesh = new THREE.Mesh(geo, mat);

  mesh.position.set(0, 1, -10);
  scene.add(mesh);

  return {
    model: mesh,
    hp: 200,
    maxHp: 200,
    damage: 5,      // augmente avec les niveaux
    speed: 0.01,
  };
}

export function updateBoss(boss, player) {
  const dir = new THREE.Vector3();
  dir.subVectors(player.camera.position, boss.model.position).normalize();
  boss.model.position.add(dir.multiplyScalar(boss.speed));

  const dist = boss.model.position.distanceTo(player.camera.position);
  if (dist < 1.5) {
    player.stats.hp -= boss.damage * 0.1;
  }
  if (boss.mixer) boss.mixer.update(0.016);

}
