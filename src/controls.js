import * as THREE from "three";

export function setupControls(player) {
  const camera = player.camera;
  let isPointerLocked = false;
  const sensitivity = 0.002;

  // Pointer lock - DÉSACTIVÉ
  // window.addEventListener("click", () => {
  //   if (!isPointerLocked) document.body.requestPointerLock();
  // });

  // document.addEventListener("pointerlockchange", () => {
  //   isPointerLocked = document.pointerLockElement === document.body;
  // });

  window.addEventListener("mousemove", e => {
    // if (!isPointerLocked) return;

    // Rotation verticale caméra
    player.rotationX -= e.movementY * sensitivity;
    player.rotationX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, player.rotationX));
    camera.rotation.x = player.rotationX;

    // Rotation horizontale joueur
    player.container.rotation.y -= e.movementX * sensitivity;
  });
}
