import * as THREE from "three";

export function setupControls(player) {
  const camera = player.camera;
  let isPointerLocked = false;
  const sensitivity = 0.002;
  let gameStarted = false;

  // Créer l'overlay pour le verrouillage du pointeur
  const pointerLockOverlay = document.createElement('div');
  pointerLockOverlay.id = 'pointer-lock-overlay';
  pointerLockOverlay.className = 'hidden';
  pointerLockOverlay.innerHTML = `
    <div id="pointer-lock-message">
      <span class="click-icon">🖱️</span>
      <div>Cliquez pour contrôler la caméra</div>
      <div class="hint">Appuyez sur Échap pour libérer le pointeur</div>
    </div>
  `;
  document.body.appendChild(pointerLockOverlay);

  // Créer le bouton plein écran
  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.id = 'fullscreen-btn';
  fullscreenBtn.innerHTML = '⛶ Plein écran';
  fullscreenBtn.title = 'Mode plein écran (F11 recommandé pour Mac)';
  document.body.appendChild(fullscreenBtn);

  // Gestion du plein écran
  fullscreenBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Empêcher le clic de déclencher le pointer lock
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Erreur plein écran: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // Mettre à jour le texte du bouton selon l'état
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      fullscreenBtn.innerHTML = '⛶ Quitter plein écran';
    } else {
      fullscreenBtn.innerHTML = '⛶ Plein écran';
    }
  });

  // Fonction pour demander le verrouillage du pointeur
  function requestPointerLock() {
    if (!gameStarted) return; // Ne pas verrouiller si le jeu n'a pas démarré
    document.body.requestPointerLock();
  }

  // Afficher/cacher l'overlay
  function showPointerLockOverlay() {
    if (gameStarted) {
      pointerLockOverlay.classList.remove('hidden');
    }
  }

  function hidePointerLockOverlay() {
    pointerLockOverlay.classList.add('hidden');
  }

  // Fonction publique pour activer le pointer lock (appelée depuis main.js)
  player.enablePointerLock = function() {
    gameStarted = true;
    hidePointerLockOverlay();
    fullscreenBtn.style.display = 'none'; // Cacher le bouton en jeu
    setTimeout(() => {
      requestPointerLock();
    }, 100);
  };

  player.disablePointerLock = function() {
    gameStarted = false;
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    hidePointerLockOverlay();
    fullscreenBtn.style.display = 'block'; // Réafficher le bouton dans le menu
  };

  // Clic sur l'overlay pour verrouiller
  pointerLockOverlay.addEventListener('click', requestPointerLock);

  // Clic sur la fenêtre pour verrouiller (si pas déjà verrouillé)
  window.addEventListener('click', (e) => {
    // Ignorer les clics sur le bouton plein écran et sur les menus
    if (e.target === fullscreenBtn || e.target.closest('#title-screen, #difficulty-screen, #controls-screen, #pause-menu, #victory-screen')) {
      return;
    }
    if (!isPointerLocked && gameStarted) {
      requestPointerLock();
    }
  });

  // Changement d'état du verrouillage
  document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === document.body;
    if (isPointerLocked) {
      console.log('🔒 Pointeur verrouillé - Contrôles actifs');
      hidePointerLockOverlay();
    } else {
      console.log('🔓 Pointeur libéré');
      if (gameStarted) {
        // Afficher l'overlay seulement si le jeu est en cours
        showPointerLockOverlay();
      }
    }
  });

  // Gestion des erreurs de verrouillage
  document.addEventListener('pointerlockerror', () => {
    console.error('❌ Erreur lors du verrouillage du pointeur');
  });

  // Mouvement de la souris
  window.addEventListener('mousemove', e => {
    if (!isPointerLocked) return;

    // Rotation verticale caméra
    player.rotationX -= e.movementY * sensitivity;
    player.rotationX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, player.rotationX));
    camera.rotation.x = player.rotationX;

    // Rotation horizontale joueur
    player.container.rotation.y -= e.movementX * sensitivity;
  });

  // Retourner une fonction de nettoyage si nécessaire
  return {
    cleanup: () => {
      pointerLockOverlay.remove();
      fullscreenBtn.remove();
    }
  };
}
