import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pathfinding } from '../utils/Pathfinding.js';

/**
 * Sbire (version miniature d'un boss)
 */
export class Minion {
    constructor(scene, config, obstacleManager = null) {
        this.scene = scene;
        this.name = config.name || 'Sbire';
        this.hp = 15; // HP fixe pour tous les sbires
        this.maxHp = 15;
        this.damage = 5; // Dégâts fixes
        this.speed = config.speed || 2; // Plus rapide qu'un boss
        this.color = config.color || 0x888888;
        this.size = config.size || { x: 0.5, y: 1, z: 0.5 }; // Petit
        this.position = config.position || { x: 0, y: 0, z: 0 };
        this.modelPath = config.modelPath || null;
        this.modelScale = (config.modelScale || 1.0) * 0.4; // 40% de la taille du boss
        this.modelColor = config.modelColor || null;
        this.customColors = config.customColors || null;
        
        this.obstacleManager = obstacleManager;
        this.mesh = null;
        this.hitbox = null;
        this.healthBar = null;
        this.healthBarBg = null;
        this.hasModel = false;
        this.isDead = false;
        
        // Pathfinding simplifié
        this.pathfinding = obstacleManager ? new Pathfinding(obstacleManager, config.arenaSize || 100, 5) : null;
        this.currentPath = null;
        this.currentWaypoint = 0;
        this.pathUpdateInterval = 3000; // Recalcul toutes les 3 secondes
        this.lastPathUpdate = 0;
        this.waypointReachDistance = 1.0; // Réduit à 1m pour permettre l'approche plus proche
        
        // Attaque
        this.attackRange = 2.0; // Distance d'attaque (augmentée pour faciliter)
        this.attackCooldown = 1000; // Cooldown entre les attaques (1s)
        this.lastAttackTime = 0;
        
        // Système de patrouille et détection
        this.detectionRange = 10; // Détecte le joueur à 10m
        this.isChasing = false; // Mode poursuite activé ou non
        this.patrolTarget = null; // Point de patrouille actuel
        this.patrolChangeInterval = 5000; // Change de direction toutes les 5 secondes
        this.lastPatrolChange = 0; // Forcer la génération immédiate d'un premier point
        this.arenaSize = config.arenaSize || 100; // Taille de l'arène
        
        // Animation
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        
        // Marqueur de position (pour l'aide après 2min)
        this.positionMarker = null;
        this.showMarker = false;
        
        this.createMesh(this.size, this.color);
    }
    
    createMesh(size, color) {
        // Créer un mesh temporaire IMMEDIATEMENT pour que le mouvement fonctionne
        const tempGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const tempMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.3
        });
        this.mesh = new THREE.Mesh(tempGeometry, tempMaterial);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
        
        if (this.modelPath) {
            const loader = new GLTFLoader();
            loader.load(this.modelPath, (gltf) => {
                const model = gltf.scene;
                model.scale.set(this.modelScale, this.modelScale, this.modelScale);
                
                // Supprimer le mesh temporaire
                if (this.mesh) {
                    const oldPosition = this.mesh.position.clone();
                    const oldRotation = this.mesh.rotation.clone();
                    this.scene.remove(this.mesh);
                    
                    // Créer le nouveau mesh avec le modèle
                    this.mesh = new THREE.Object3D();
                    this.mesh.add(model);
                    this.mesh.position.copy(oldPosition);
                    this.mesh.rotation.copy(oldRotation);
                } else {
                    this.mesh = new THREE.Object3D();
                    this.mesh.add(model);
                    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                }
                
                // Appliquer les couleurs personnalisées
                if (this.customColors) {
                    model.traverse((child) => {
                        if (child.isMesh && child.material && child.name) {
                            const meshName = child.name.toLowerCase();
                            if (meshName.includes('robe') || meshName.includes('body')) {
                                if (this.customColors.robe && child.material.color) {
                                    child.material.color.setHex(this.customColors.robe);
                                }
                            }
                            if (meshName.includes('eye')) {
                                if (this.customColors.eyes && child.material.color) {
                                    child.material.color.setHex(this.customColors.eyes);
                                    if (child.material.emissive) {
                                        child.material.emissive.setHex(this.customColors.eyes);
                                        child.material.emissiveIntensity = 1.0;
                                    }
                                }
                            }
                        }
                    });
                } else if (this.modelColor !== null) {
                    model.traverse((child) => {
                        if (child.isMesh && child.material && child.material.color) {
                            child.material.color.setHex(this.modelColor);
                        }
                    });
                }
                
                this.hasModel = true;
                
                // Hitbox invisible
                const hitboxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
                const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
                this.hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
                this.mesh.add(this.hitbox);
                
                // Animations
                const animations = gltf.animations;
                if (animations && animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(model);
                    animations.forEach((clip, index) => {
                        const name = clip.name.toLowerCase();
                        if (name.includes('walk') || name.includes('run') || name.includes('idle') || index === 0) {
                            this.animations.walk = this.mixer.clipAction(clip);
                        }
                        if (name.includes('punch') || name.includes('attack') || name.includes('hit')) {
                            this.animations.punch = this.mixer.clipAction(clip);
                        }
                    });
                    if (this.animations.walk) {
                        this.animations.walk.play();
                        this.currentAction = this.animations.walk;
                    }
                }
                
                this.scene.add(this.mesh);
                this.createHealthBar();
            }, undefined, (error) => {
                console.warn(`⚠️ Impossible de charger le modèle pour ${this.name}, utilisation d'un cube`, error);
                this.createFallbackMesh(color, size);
            });
        } else {
            this.createFallbackMesh(color, size);
        }
    }
    
    createFallbackMesh(color, size) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
        this.createHealthBar();
    }
    
    createHealthBar() {
        const barWidth = 1.2;
        const barHeight = 0.15;
        
        const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x330000, transparent: true, opacity: 0.8 });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarBg.position.set(0, this.size.y + 0.5, 0);
        
        const barGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const barMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.healthBar = new THREE.Mesh(barGeometry, barMaterial);
        this.healthBar.position.set(0, this.size.y + 0.5, 0.01);
        
        this.mesh.add(this.healthBarBg);
        this.mesh.add(this.healthBar);
    }
    
    updateHealthBar() {
        if (this.healthBar) {
            const healthPercent = Math.max(0, this.hp / this.maxHp);
            this.healthBar.scale.x = healthPercent;
            this.healthBar.position.x = -(1 - healthPercent) * 0.6;
        }
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        this.updateHealthBar();
        
        if (this.hp <= 0 && !this.isDead) {
            this.isDead = true;
            this.die();
        }
    }
    
    die() {
        console.log(`💀 Sbire ${this.name} éliminé !`);
        // Effet de mort simple
        if (this.mesh) {
            const originalY = this.mesh.position.y;
            let elapsed = 0;
            const duration = 500;
            
            const animateDeath = () => {
                elapsed += 16;
                const progress = Math.min(elapsed / duration, 1);
                
                if (this.mesh) {
                    this.mesh.position.y = originalY - progress * 2;
                    this.mesh.rotation.x = progress * Math.PI;
                    
                    if (this.mesh.traverse) {
                        this.mesh.traverse((child) => {
                            if (child.material && child.material.opacity !== undefined) {
                                child.material.transparent = true;
                                child.material.opacity = 1 - progress;
                            }
                        });
                    }
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animateDeath);
                } else {
                    this.remove();
                }
            };
            
            animateDeath();
        }
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.positionMarker) {
            this.scene.remove(this.positionMarker);
        }
    }
    
    showPositionMarker() {
        if (this.positionMarker || !this.mesh || this.isDead) return;
        
        // Créer un marqueur visible au-dessus du sbire
        const markerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        this.positionMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        this.positionMarker.position.set(
            this.mesh.position.x,
            5,
            this.mesh.position.z
        );
        this.scene.add(this.positionMarker);
        this.showMarker = true;
        
        console.log(`📍 Marqueur de position activé pour sbire à (${this.mesh.position.x.toFixed(1)}, ${this.mesh.position.z.toFixed(1)})`);
    }
    
    updateMarkerPosition() {
        if (this.positionMarker && this.mesh && !this.isDead) {
            this.positionMarker.position.x = this.mesh.position.x;
            this.positionMarker.position.z = this.mesh.position.z;
            // Faire pulser le marqueur
            const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 1;
            this.positionMarker.scale.set(pulse, 1, pulse);
        }
    }
    
    moveTowards(targetPosition, delta) {
        if (!this.mesh || this.isDead) return;
        
        // Ne pas bouger si le labyrinthe se transforme
        if (this.obstacleManager && this.obstacleManager.isTransforming) {
            return;
        }
        
        const now = Date.now();
        let moveDirection = new THREE.Vector3();
        
        // Essayer d'utiliser le pathfinding si disponible
        if (this.pathfinding) {
            // Recalculer le chemin périodiquement
            if (!this.currentPath || now - this.lastPathUpdate > this.pathUpdateInterval) {
                this.currentPath = this.pathfinding.findPath(this.mesh.position, targetPosition);
                this.currentWaypoint = 0;
                this.lastPathUpdate = now;
            }
            
            // Si on a un chemin valide, le suivre
            if (this.currentPath && this.currentPath.length > 0) {
                const waypoint = this.currentPath[this.currentWaypoint];
                const distToWaypoint = this.mesh.position.distanceTo(waypoint);
                
                if (distToWaypoint < this.waypointReachDistance) {
                    this.currentWaypoint++;
                    if (this.currentWaypoint >= this.currentPath.length) {
                        // Chemin terminé - maintenant aller directement vers la cible
                        this.currentPath = null;
                        // Ne pas retourner ! Continuer vers la cible directement
                        moveDirection.subVectors(targetPosition, this.mesh.position);
                    } else {
                        const targetWaypoint = this.currentPath[this.currentWaypoint];
                        moveDirection.subVectors(targetWaypoint, this.mesh.position);
                    }
                } else {
                    const targetWaypoint = this.currentPath[this.currentWaypoint];
                    moveDirection.subVectors(targetWaypoint, this.mesh.position);
                }
            } else {
                // Pas de chemin trouvé, mouvement direct
                moveDirection.subVectors(targetPosition, this.mesh.position);
            }
        } else {
            // Pas de pathfinding, mouvement direct
            moveDirection.subVectors(targetPosition, this.mesh.position);
        }
        
        moveDirection.y = 0;
        if (moveDirection.length() < 0.01) return;
        moveDirection.normalize();
        
        const movement = moveDirection.multiplyScalar(this.speed * delta);
        const newPosition = this.mesh.position.clone().add(movement);
        
        // Vérifier les collisions
        if (this.obstacleManager) {
            const collision = this.obstacleManager.checkCollision(newPosition, 0.5);
            
            // Vérifier que la position corrigée n'est pas trop loin (éviter téléportation)
            const distanceMoved = this.mesh.position.distanceTo(collision.position);
            const maxAllowedDistance = 3.0; // Seuil fixe de 3m (les corrections normales sont < 2m)
            
            if (distanceMoved > maxAllowedDistance) {
                // La correction est trop grande, probablement bloqué - ne pas bouger
                console.warn(`⚠️ Sbire ${this.name}: Correction de collision excessive (${distanceMoved.toFixed(2)}m > ${maxAllowedDistance}m), annulation`);
                // Invalider le chemin actuel pour forcer un recalcul
                this.currentPath = null;
                this.lastPathUpdate = 0; // Forcer recalcul immédiat
                return;
            }
            
            // Si collision détectée, invalider le chemin pour forcer un recalcul
            if (collision.collided) {
                this.currentPath = null;
            }
            
            this.mesh.position.copy(collision.position);
        } else {
            this.mesh.position.copy(newPosition);
        }
        
        // Toujours orienter vers la cible finale (joueur ou point de patrouille)
        const directionToTarget = new THREE.Vector3();
        directionToTarget.subVectors(targetPosition, this.mesh.position);
        directionToTarget.y = 0;
        if (directionToTarget.length() > 0.01) {
            const angle = Math.atan2(directionToTarget.x, directionToTarget.z);
            this.mesh.rotation.y = angle;
        }
    }
    
    getRandomPatrolPoint() {
        if (!this.mesh) return null;
        
        // Générer un point aléatoire dans l'arène
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            // Générer un point autour de la position actuelle
            const range = 20; // Rayon de patrouille de 20m
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * range;
            
            let x = this.mesh.position.x + Math.cos(angle) * distance;
            let z = this.mesh.position.z + Math.sin(angle) * distance;
            
            // Limiter à l'arène
            const arenaLimit = (this.arenaSize / 2) - 2;
            x = Math.max(-arenaLimit, Math.min(arenaLimit, x));
            z = Math.max(-arenaLimit, Math.min(arenaLimit, z));
            
            const targetPos = new THREE.Vector3(x, 0, z);
            
            // Vérifier que le point est accessible avec le pathfinding
            if (this.pathfinding && this.pathfinding.isPositionWalkable(targetPos)) {
                return targetPos;
            }
        }
        
        // Si aucun point valide n'a été trouvé, retourner un point proche
        return new THREE.Vector3(
            this.mesh.position.x + (Math.random() - 0.5) * 10,
            0,
            this.mesh.position.z + (Math.random() - 0.5) * 10
        );
    }
    
    update(delta, playerPosition) {
        if (this.isDead) return;
        
        // Mettre à jour l'animation
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // Mettre à jour le marqueur de position
        if (this.showMarker) {
            this.updateMarkerPosition();
        }
        
        if (!this.mesh) {
            console.warn(`⚠️ Sbire ${this.name}: mesh non défini, skip update`);
            return;
        }
        
        if (!playerPosition) {
            console.warn(`⚠️ Sbire ${this.name}: playerPosition non défini, skip update`);
            return;
        }
        
        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        const now = Date.now();
        
        // Détecter le joueur à 10m
        if (distanceToPlayer <= this.detectionRange) {
            // Mode poursuite : attaquer le joueur
            if (!this.isChasing) {
                this.isChasing = true;
                this.patrolTarget = null;
                this.currentPath = null;
                console.log(`👀 Sbire ${this.name} détecte le joueur à ${distanceToPlayer.toFixed(1)}m !`);
            }
            
            // Log périodique de la distance en mode poursuite
            if (now % 2000 < 50) { // Toutes les ~2 secondes
                console.log(`🏃 Sbire ${this.name} poursuit le joueur - Distance: ${distanceToPlayer.toFixed(2)}m (attaque à ${this.attackRange}m)`);
            }
            
            // Si à portée d'attaque, jouer l'animation d'attaque
            if (distanceToPlayer < this.attackRange) {
                if (this.animations.punch && this.currentAction !== this.animations.punch) {
                    this.currentAction?.fadeOut(0.2);
                    this.animations.punch.reset().fadeIn(0.2).play();
                    this.currentAction = this.animations.punch;
                }
            } else {
                // Sinon, jouer l'animation de marche
                if (this.animations.walk && this.currentAction !== this.animations.walk) {
                    this.currentAction?.fadeOut(0.2);
                    this.animations.walk.reset().fadeIn(0.2).play();
                    this.currentAction = this.animations.walk;
                }
            }
            
            this.moveTowards(playerPosition, delta);
        } else {
            // Mode patrouille : se balader librement
            if (this.isChasing) {
                this.isChasing = false;
                this.patrolTarget = null;
                this.currentPath = null;
                this.lastPatrolChange = 0; // Générer immédiatement un nouveau point
                console.log(`🚶 Sbire ${this.name} perd le joueur de vue`);
            }
            
            // Changer de point de patrouille régulièrement ou si on n'en a pas
            if (!this.patrolTarget || now - this.lastPatrolChange > this.patrolChangeInterval) {
                this.patrolTarget = this.getRandomPatrolPoint();
                this.lastPatrolChange = now;
                this.currentPath = null; // Forcer le recalcul du chemin
                console.log(`🎯 Sbire ${this.name} nouveau point de patrouille : (${this.patrolTarget.x.toFixed(1)}, ${this.patrolTarget.z.toFixed(1)})`);
            }
            
            // Se déplacer vers le point de patrouille
            if (this.patrolTarget) {
                const distToPatrol = this.mesh.position.distanceTo(this.patrolTarget);
                
                // Si on a atteint le point de patrouille, en choisir un nouveau
                if (distToPatrol < 2) {
                    this.patrolTarget = this.getRandomPatrolPoint();
                    this.lastPatrolChange = now;
                    this.currentPath = null;
                    console.log(`✅ Sbire ${this.name} atteint son objectif, nouveau point : (${this.patrolTarget.x.toFixed(1)}, ${this.patrolTarget.z.toFixed(1)})`);
                } else {
                    // Se déplacer activement vers le point de patrouille
                    this.moveTowards(this.patrolTarget, delta);
                }
            }
        }
    }
    
    getDistanceToPlayer(playerPosition) {
        if (!this.mesh) return Infinity;
        return this.mesh.position.distanceTo(playerPosition);
    }
}
