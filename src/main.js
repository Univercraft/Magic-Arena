import * as THREE from "three";
import { Player } from './player.js';
import { SpellManager } from './managers/SpellManager.js';
import { BossManager } from './managers/BossManager.js';
import { PotionManager } from './managers/PotionManager.js';
import { SpellWheel } from './ui/SpellWheel.js';
import { SpellUI } from './ui/SpellUI.js';
import { Arena } from './entities/Arena.js';
import { MenuManager } from './ui/MenuManager.js';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
scene.fog = new THREE.Fog(0x1a1a1a, 30, 60); // Brouillard pour l'ambiance

// ARÈNE
const arena = new Arena(scene, 50);

// LUMIERE
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// SOL
const floorGeometry = new THREE.PlaneGeometry(50, 50);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// PLAYER
const player = new Player(scene, arena);

// PROJECTILES
const projectiles = [];

// Créer le gestionnaire de sorts
const spellManager = new SpellManager();

// Créer le gestionnaire de potions
const potionManager = new PotionManager(scene, player, spellManager);

// MENU MANAGER
const menuManager = new MenuManager();

// Créer le gestionnaire de boss avec player et menuManager
const bossManager = new BossManager(scene, spellManager, potionManager, player, menuManager);

// Créer la roue de sorts
const spellWheel = new SpellWheel(spellManager);

// Créer l'UI des sorts avec le ShieldManager et le Player
const spellUI = new SpellUI(spellManager, player.shieldManager, player);

// IMPORTANT: Lier le ShieldManager au SpellManager
spellManager.setShieldManager(player.shieldManager);

// Équiper les sorts de base dans les slots
spellManager.equipSpell('protego', 0);
spellManager.equipSpell('expelliarmus', 1);

// Callbacks du menu
menuManager.onStartCallback = () => {
    // Définir la difficulté choisie par le joueur
    player.difficulty = menuManager.difficulty;
    bossManager.difficulty = menuManager.difficulty;
    
    // Mode infini : débloquer TOUS les sorts et désactiver les pickups
    if (menuManager.difficulty === 'infinite') {
        bossManager.isInfiniteMode = true;
        bossManager.bossKillCount = 0;
        player.difficulty = 'hard'; // Pas de régénération en mode infini
        
        // Définir les stats au maximum (level max)
        player.stats.maxHp = 200;
        player.stats.maxMana = 200;
        player.stats.hp = 200;
        player.stats.mana = 200;
        
        // Débloquer TOUS les sorts disponibles
        const allSpells = [
            'incendio', 'stupefix', 'protegoMaxima', 'sectumsempra',
            'arrestoMomentum', 'bombarda', 'diffindo', 'speroPatronum', 'petrificusTotalus',
            'impero', 'endoloris', 'avadaKedavra'
        ];
        allSpells.forEach(spell => spellManager.unlockSpell(spell));
        
        // Désactiver l'apparition des sorts au sol en mode infini
        potionManager.disableSpellPickups = true;
        
        console.log('☠️ MODE INFINI ACTIVÉ - Level Max (200 HP/Mana) - TOUS les sorts débloqués - Pickups de sorts désactivés !');
    } else {
        bossManager.isInfiniteMode = false;
        potionManager.disableSpellPickups = false;
    }
    
    console.log(`🎮 Difficulté sélectionnée: ${menuManager.difficulty.toUpperCase()}`);
    
    // Spawner le premier boss au démarrage
    bossManager.spawnBoss(0);
    updateCrosshairVisibility();
    // document.body.requestPointerLock();
};

menuManager.onResumeCallback = () => {
    updateCrosshairVisibility();
    // document.body.requestPointerLock();
};

menuManager.onQuitCallback = () => {
    // Réinitialiser le jeu
    resetGame();
    // Reset le mode infini au retour au menu
    localStorage.removeItem('hardModeCompleted');
    menuManager.hardModeCompleted = false;
    updateCrosshairVisibility();
};

function resetGame() {
    // Nettoyer les projectiles
    projectiles.forEach(proj => scene.remove(proj));
    projectiles.length = 0;
    
    // Réinitialiser le joueur
    player.stats.hp = player.stats.maxHp;
    player.stats.mana = player.stats.maxMana;
    player.camera.position.set(0, 1.6, 5);
    player.attackBoost = 1;
    player.defenseBoost = 1;
    player.attackBoostEndTime = 0;
    player.defenseBoostEndTime = 0;
    
    // Réinitialiser les managers
    if (bossManager.currentBoss) {
        bossManager.currentBoss.remove();
        bossManager.currentBoss = null;
    }
    bossManager.currentBossIndex = 0;
    
    potionManager.clearPotions();
    potionManager.resetSpellCounter(); // Réinitialiser le compteur de sorts
    potionManager.setBossIndex(0); // Réinitialiser l'index du boss
    potionManager.spawnedSpells.clear(); // Réinitialiser les sorts déjà apparus
    
    // Réinitialiser les sorts
    spellManager.equippedSpells = [null, null, null, null];
    spellManager.unlockedSpells = ['protego', 'expelliarmus'];
    spellManager.equipSpell('protego', 0);
    spellManager.equipSpell('expelliarmus', 1);
    
    console.log('🔄 Jeu réinitialisé');
}

// État de la roue de sorts
let isWheelOpen = false;

// Gérer le crosshair
const crosshair = document.getElementById('crosshair');

function updateCrosshairVisibility() {
    if (menuManager.isPaused || menuManager.isInMenu || isWheelOpen) {
        crosshair.style.display = 'none';
    } else {
        crosshair.style.display = 'block';
    }
}

// FONCTIONS HELPER
function castSpell() {
    if (isWheelOpen) return;

    const result = spellManager.castCurrentSpell(player.stats.mana);
    
    if (result.success) {
        player.stats.mana -= result.manaCost;
        player.mana = player.stats.mana;
        
        // Si c'est un projectile, un sort DoT, Stun, AoE, Control ou Instant, créer un projectile
        if (result.spell.type === 'projectile' || 
            result.spell.type === 'dot' || 
            result.spell.type === 'stun' ||
            result.spell.type === 'aoe' ||
            result.spell.type === 'control' ||
            result.spell.type === 'instant') {
            createProjectile(result.spell);
        }
        
        console.log(`✨ ${result.spell.name} lancé ! Mana restant: ${player.stats.mana}`);
    }
}

function createProjectile(spell) {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    let color = 0xff00ff;
    
    // Couleur selon le type de sort
    if (spell.type === 'dot' || spell.name === 'Incendio' || spell.name === 'Endoloris') {
        color = 0xff4400; // Orange pour incendio/endoloris
    } else if (spell.stunDuration || spell.name === 'Stupéfix') {
        color = 0x4444ff; // Bleu pour stun
    } else if (spell.name === 'Impero') {
        color = 0x9400D3; // Violet pour Impero
    } else if (spell.name === 'Avada Kedavra') {
        color = 0x00FF00; // Vert pour Avada Kedavra
    } else if (spell.name === 'Sectumsempra') {
        color = 0x660000; // Rouge sombre pour sectumsempra
    }
    
    const material = new THREE.MeshBasicMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.5
    });
    const projectile = new THREE.Mesh(geometry, material);
    
    projectile.position.copy(player.camera.position);
    
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(player.camera.quaternion);
    
    projectile.userData = {
        velocity: direction.multiplyScalar(20),
        spell: spell,
        lifetime: 5
    };
    
    scene.add(projectile);
    projectiles.push(projectile);
}

function updateProjectiles(delta) {
    const boss = bossManager.getCurrentBoss();
    if (!boss || boss.isDead || boss.isDefeated) return;
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        proj.position.add(proj.userData.velocity.clone().multiplyScalar(delta));
        proj.userData.lifetime -= delta;
        
        // Rotation pour effet visuel
        proj.rotation.x += delta * 5;
        proj.rotation.y += delta * 5;
        
        // Collision avec le boss
        if (proj.position.distanceTo(boss.mesh.position) < 1.5) {
            const spell = proj.userData.spell;
            
            console.log(`🎯 ${spell.name} touche ${boss.name}!`);
            
            // Avada Kedavra : divise par 2 la vie restante
            if (spell.percentDamage) {
                const damage = boss.hp * spell.percentDamage;
                boss.takeDamage(damage);
                console.log(`☠️ Avada Kedavra ! ${Math.round(damage)} dégâts (50% de ${Math.round(boss.hp + damage)} HP)`);
            }
            // Impero : pacifie le boss (arrête ses mouvements et ses attaques)
            else if (spell.duration && spell.type === 'control') {
                if (boss.pacifyEndTime === undefined) {
                    boss.pacifyEndTime = 0;
                }
                boss.pacifyEndTime = Date.now() + spell.duration;
                console.log(`🧠 Impero ! Boss pacifié pendant ${spell.duration / 1000}s`);
            }
            // Dégâts directs (avec boost d'attaque)
            else if (spell.damage) {
                let damage = spell.damage * player.attackBoost;
                boss.takeDamage(damage);
                if (player.attackBoost > 1) {
                    console.log(`💥 ${damage} dégâts infligés (avec boost x${player.attackBoost})`);
                } else {
                    console.log(`💥 ${damage} dégâts infligés`);
                }
            }
            
            // Appliquer DoT (Damage over Time) - avec boost
            if (spell.dotDamage && spell.dotDuration) {
                const dotDamage = spell.dotDamage * player.attackBoost;
                boss.applyDot(dotDamage, spell.dotDuration / 1000);
                console.log(`🔥 DoT appliqué: ${dotDamage} dégâts/s pendant ${spell.dotDuration / 1000}s`);
            }
            
            // Appliquer Stun
            if (spell.stunDuration) {
                boss.stun(spell.stunDuration);
                console.log(`😵 Stun appliqué: ${spell.stunDuration / 1000}s`);
            }
            
            scene.remove(proj);
            projectiles.splice(i, 1);
            continue;
        }
        
        // Supprimer si trop vieux
        if (proj.userData.lifetime <= 0) {
            scene.remove(proj);
            projectiles.splice(i, 1);
        }
    }
}

function updateHUD() {
    const hpBar = document.getElementById('hp-bar');
    const manaBar = document.getElementById('mana-bar');
    const bossHpBar = document.getElementById('boss-hp-bar');
    const bossName = document.getElementById('boss-name');
    
    if (hpBar) {
        const hpPercent = (player.stats.hp / player.stats.maxHp) * 100;
        hpBar.style.width = hpPercent + '%';
    }
    
    if (manaBar) {
        const manaPercent = (player.stats.mana / player.stats.maxMana) * 100;
        manaBar.style.width = manaPercent + '%';
    }
    
    const boss = bossManager.getCurrentBoss();
    if (boss && !boss.isDead && !boss.isDefeated) {
        if (bossHpBar) {
            const bossHpPercent = Math.max(0, (boss.hp / boss.maxHp) * 100);
            bossHpBar.style.width = bossHpPercent + '%';
        }
        if (bossName) {
            // Formater le nom du boss: majuscules et retirer "Part 1", "Final", etc.
            let displayName = boss.name.toUpperCase();
            displayName = displayName.replace(/ PART \d+/i, '');
            displayName = displayName.replace(/ FINAL/i, '');
            bossName.textContent = displayName;
        }
    } else {
        if (bossHpBar) bossHpBar.style.width = '0%';
        if (bossName) bossName.textContent = 'AUCUN BOSS';
    }
}

// Gestion des touches
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // PAUSE avec Échap
    if (e.key === 'Escape') {
        e.preventDefault();
        if (!menuManager.isInMenu) {
            menuManager.togglePause();
        }
        return;
    }    updateCrosshairVisibility();
        
    
    // Ne rien faire si le jeu est en pause ou dans un menu
    if (menuManager.isPaused || menuManager.isInMenu) {
        return;
    }
    
    // Ouvrir/Fermer la roue de sorts avec Q (WASD) ou A (ZQSD)
    const spellWheelKey = menuManager.keyboardLayout === 'wasd' ? 'q' : 'a';
    if (key === spellWheelKey) {
        e.preventDefault();
        spellWheel.toggle();
        isWheelOpen = spellWheel.isOpen;
        
        if (isWheelOpen) {
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
            document.body.style.cursor = 'default';
            // Cacher la baguette quand la roue est ouverte
        } else {
            document.body.requestPointerLock();
            document.body.style.cursor = 'none';
        }
        
        updateCrosshairVisibility();
        return;
    }
    
    // Déplacement (seulement si la roue est fermée)
    if (!isWheelOpen) {
        if (menuManager.keyboardLayout === 'wasd') {
            // Configuration WASD
            if (key === 'w') keys.forward = true;
            if (key === 's') keys.backward = true;
            if (key === 'a') keys.left = true;
            if (key === 'd') keys.right = true;
        } else {
            // Configuration ZQSD
            if (key === 'z') keys.forward = true;
            if (key === 's') keys.backward = true;
            if (key === 'q') keys.left = true;
            if (key === 'd') keys.right = true;
        }
    }

    // Sélection des sorts (1-4) - Ferme automatiquement la roue
    if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        spellManager.selectSpell(index);
        const selectedSpell = spellManager.getCurrentSpell();
        console.log(`✨ Sort ${index + 1} sélectionné: ${selectedSpell?.name || 'Vide'}`);
        
        if (isWheelOpen) {
            spellWheel.hide();
            isWheelOpen = false;
            console.log('🎯 Roue de sorts FERMÉE automatiquement');
        }
    }
    
    // Lancer le sort (Espace)
    if (!isWheelOpen && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        castSpell();
    }
    
    // Touche V pour accéder à la fin du jeu (mode debug)
    if (key === 'v') {
        e.preventDefault();
        console.log('🏁 Touche V : Accès à la fin du jeu');
        if (menuManager && player) {
            const stats = {
                hp: Math.round(player.stats.hp),
                maxHp: player.stats.maxHp,
                mana: Math.round(player.stats.mana),
                maxMana: player.stats.maxMana,
                spellsUnlocked: spellManager.unlockedSpells.length
            };
            menuManager.showVictory(stats);
        }
    }
    
    // Touche B pour tuer instantanément le boss actuel (mode debug)
    if (key === 'b') {
        e.preventDefault();
        if (bossManager.currentBoss && !bossManager.currentBoss.isDead) {
            console.log('💀 Touche B : Tuer le boss actuel instantanément');
            bossManager.currentBoss.hp = 0;
            bossManager.currentBoss.die();
        } else {
            console.log('⚠️ Aucun boss actif à tuer');
        }
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    
    const spellWheelKey = menuManager.keyboardLayout === 'wasd' ? 'q' : 'a';
    if (key === spellWheelKey) return;
    
    if (menuManager.keyboardLayout === 'wasd') {
        // Configuration WASD
        if (key === 'w') keys.forward = false;
        if (key === 's') keys.backward = false;
        if (key === 'a') keys.left = false;
        if (key === 'd') keys.right = false;
    } else {
        // Configuration ZQSD
        if (key === 'z') keys.forward = false;
        if (key === 's') keys.backward = false;
        if (key === 'q') keys.left = false;
        if (key === 'd') keys.right = false;
    }
});

// Clic souris pour lancer un sort
window.addEventListener("click", () => {
    if (!menuManager.isPaused && !menuManager.isInMenu && !isWheelOpen) {
        castSpell();
    }
});

// Mouvement de la souris pour la caméra
document.addEventListener('mousemove', (e) => {
    if (!menuManager.isPaused && !menuManager.isInMenu && !isWheelOpen) {
        player.rotate(e.movementX, e.movementY);
    }
});

// Pointer lock - DÉSACTIVÉ
// document.addEventListener('click', () => {
//     if (!isWheelOpen && !document.pointerLockElement) {
//         document.body.requestPointerLock();
//         document.body.style.cursor = 'none';
//     }
// });

// Gérer la sortie du pointer lock - DÉSACTIVÉ
// document.addEventListener('pointerlockchange', () => {
//     if (!document.pointerLockElement && !isWheelOpen) {
//         document.body.style.cursor = 'default';
//     }
// });

// CLOCK
const clock = new THREE.Clock();

// RENDERER avec ombres
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ANIMATE
function animate() {
    requestAnimationFrame(animate);
    
    // Si en pause ou dans un menu, ne pas mettre à jour le jeu
    if (menuManager.isPaused || menuManager.isInMenu) {
        if (wand && wand.group) wand.group.visible = false;
        renderer.render(scene, player.camera);
        return;
    }
    
    const delta = clock.getDelta();
    // Mettre à jour le joueur
    if (!isWheelOpen) {
        player.move(keys, delta);
    }
    player.update(delta);

    // Mettre à jour l'UI des sorts
    spellUI.update();

    // Mettre à jour les potions
    potionManager.update(delta);

    // Mettre à jour projectiles
    updateProjectiles(delta);

    // Mettre à jour le boss (seulement si pas en pause)
    if (!menuManager.isPaused) {
        bossManager.update(delta, player.camera.position);
    }

    // Collision avec le boss (seulement si pas en pause)
    const boss = bossManager.getCurrentBoss();
    if (!isWheelOpen && !menuManager.isPaused && boss && !boss.isDead && !boss.isDefeated) {
        const distance = boss.getDistanceToPlayer(player.camera.position);
        
        // Debug : afficher la distance occasionnellement
        if (Math.random() < 0.01) {
            console.log(`📏 Distance au boss ${boss.name}: ${distance.toFixed(2)}m`);
        }
        
        // Vérifier les projectiles du boss (si c'est un lanceur de sorts)
        if (boss.canCastSpells) {
            const hitResult = boss.updateProjectiles(delta, player.camera.position, 0.5);
            if (hitResult.hit) {
                player.takeDamage(hitResult.damage);
                console.log(`🎯 ${boss.name} vous touche avec un sort ! Dégâts: ${hitResult.damage}`);
            }
        }
        
        // Attaque au corps à corps (seulement si le boss ne lance pas de sorts)
        // ou s'il est très proche malgré ses sorts
        const attackRange = boss.hasModel ? 3.0 : 1.5;
        
        // Ne pas prendre de dégâts si le boss est pacifié (Impero)
        if (!boss.isPacified() && distance < attackRange && !boss.canCastSpells) {
            const damageAmount = boss.damage * delta;
            player.takeDamage(damageAmount);
            // Log uniquement toutes les 60 frames pour ne pas spam la console
            if (Math.random() < 0.016) {
                console.log(`👊 ${boss.name} attaque ! Distance: ${distance.toFixed(2)}m, Dégâts: ${damageAmount.toFixed(1)}`);
            }
        }
    }

    updateHUD();

    renderer.render(scene, player.camera);
}

animate();

// RESIZE
window.addEventListener("resize", () => {
    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
