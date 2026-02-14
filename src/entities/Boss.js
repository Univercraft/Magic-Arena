import * as THREE from 'three';
import { loadModel } from '../loaders.js';
import { Pathfinding } from '../utils/Pathfinding.js';

export class Boss {
    constructor(scene, config, obstacleManager = null) {
        this.scene = scene;
        this.name = config.name;
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.speed = config.speed || 1;
        this.damage = config.damage || 10;
        this.rewardSpell = config.rewardSpell;
        this.isDead = false;
        this.isDefeated = false; // Nouveau: pour les combats qui s'arrêtent avant la mort
        this.stopAtHpPercent = config.stopAtHpPercent || null; // Nouveau: arrêt à X% de vie
        this.modelPath = config.modelPath || null; // Chemin du modèle 3D
        this.modelScale = config.modelScale || 1; // Échelle du modèle 3D
        this.modelColor = config.modelColor || null; // Couleur personnalisée pour le modèle
        this.customColors = config.customColors || null; // Couleurs par parties du corps
        this.mesh = null; // Sera créé de manière asynchrone
        this.hitbox = null; // Hitbox pour les collisions
        this.mixer = null; // Pour les animations
        this.animations = {}; // Stockage des animations (walk, punch, etc.)
        this.currentAction = null; // Action en cours
        this.hasModel = false; // Indique si un modèle 3D est chargé
        this.obstacleManager = obstacleManager; // Gestionnaire d'obstacles pour les collisions
        
        // Système de pathfinding
        this.pathfinding = obstacleManager ? new Pathfinding(obstacleManager, config.arenaSize || 100, 5) : null;
        this.currentPath = null; // Chemin actuel à suivre
        this.currentWaypoint = 0; // Index du waypoint actuel dans le chemin
        this.pathUpdateInterval = 5000; // Recalculer le chemin toutes les 5 secondes (très optimisé)
        this.lastPathUpdate = 0; // Dernier recalcul du chemin
        this.waypointReachDistance = 2.0; // Distance pour considérer un waypoint atteint
        
        // Système d'attaque à distance
        this.canCastSpells = config.canCastSpells || false; // Si le boss peut lancer des sorts
        this.spellCooldown = config.spellCooldown || 2000; // Cooldown entre les sorts (ms)
        this.lastSpellTime = 0; // Dernier lancement de sort
        this.spellSpeed = config.spellSpeed || 10; // Vitesse des projectiles
        this.spellColor = config.spellColor || 0xff0000; // Couleur des sorts
        this.projectiles = []; // Projectiles actifs du boss
        
        // Effets actifs
        this.stunEndTime = 0;
        this.pacifyEndTime = 0; // Pour Impero
        this.dotEffects = [];
        this.originalColor = config.color || 0xff0000;
        
        this.position = config.position || { x: 0, y: 1, z: -10 };
        
        // Créer le mesh (avec modèle 3D si disponible)
        this.createMesh(config.color || 0xff0000, config.size || { x: 1, y: 2, z: 1 });
        
        console.log(`🎭 Boss créé: ${this.name} (${this.hp} HP)${this.canCastSpells ? ' 🔮 (Lance des sorts)' : ''}`);
    }

    async createMesh(color, size) {
        // Si un modèle 3D est disponible, le charger
        if (this.modelPath) {
            try {
                console.log(`🔍 Chargement du modèle pour ${this.name}:`, this.modelPath);
                const { model, animations } = await loadModel(this.modelPath);
                
                this.mesh = model;
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                
                // Appliquer le scale au modèle
                if (this.modelScale !== 1) {
                    this.mesh.scale.setScalar(this.modelScale);
                    console.log(`🔍 Scale appliqué pour ${this.name}:`, this.modelScale);
                }
                
                // Appliquer des couleurs personnalisées par parties du corps
                if (this.customColors !== null) {
                    // D'abord, tout colorier en noir (vêtements)
                    if (this.customColors.clothes) {
                        this.mesh.traverse((child) => {
                            if (child.isMesh && child.material) {
                                if (child.material.color) {
                                    child.material.color.setHex(this.customColors.clothes);
                                }
                            }
                        });
                    }
                    
                    // Ensuite, appliquer les couleurs spécifiques par-dessus
                    this.mesh.traverse((child) => {
                        if (child.isMesh && child.material) {
                            const meshName = child.name.toLowerCase();
                            
                            // Peau : Face uniquement
                            if (meshName.includes('face')) {
                                if (this.customColors.skin && child.material.color) {
                                    child.material.color.setHex(this.customColors.skin);
                                    console.log(`🎨 Peau colorée pour ${child.name}: #${this.customColors.skin.toString(16)}`);
                                }
                            } 
                            // Yeux - rechercher plus largement
                            if (meshName.includes('eye')) {
                                if (this.customColors.eyes && child.material.color) {
                                    child.material.color.setHex(this.customColors.eyes);
                                    // Ajouter de l'émissif pour les yeux rouges
                                    if (child.material.emissive) {
                                        child.material.emissive.setHex(this.customColors.eyes);
                                        child.material.emissiveIntensity = 1.0;
                                    }
                                    console.log(`👁️ Yeux colorés pour ${child.name}: #${this.customColors.eyes.toString(16)}`);
                                }
                            }
                        }
                    });
                    console.log(`🎨 Couleurs personnalisées appliquées pour ${this.name}`);
                }
                // Appliquer une couleur uniforme si spécifiée (pour les autres boss)
                else if (this.modelColor !== null) {
                    this.mesh.traverse((child) => {
                        if (child.isMesh && child.material) {
                            if (child.material.color) {
                                child.material.color.setHex(this.modelColor);
                            }
                        }
                    });
                    console.log(`🎨 Couleur appliquée pour ${this.name}:`, this.modelColor.toString(16));
                }
                
                // Calculer la taille du modèle après scale
                const box = new THREE.Box3().setFromObject(model);
                const modelSize = box.getSize(new THREE.Vector3());
                console.log(`📏 Taille du modèle ${this.name}:`, modelSize);
                
                this.hasModel = true;
                
                // Créer une hitbox invisible pour les collisions (utilise size)
                const hitboxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
                const hitboxMaterial = new THREE.MeshBasicMaterial({ 
                    visible: false // Invisible mais détectable pour les collisions
                });
                this.hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
                this.mesh.add(this.hitbox); // Attacher au modèle pour qu'elle suive
                
                // Configurer les animations si disponibles
                if (animations && animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(model);
                    
                    // Rechercher et stocker les animations par nom
                    animations.forEach((clip, index) => {
                        const name = clip.name.toLowerCase();
                        if (name.includes('walk') || name.includes('run') || name.includes('idle') || index === 0) {
                            this.animations.walk = this.mixer.clipAction(clip);
                        }
                        if (name.includes('punch') || name.includes('attack') || name.includes('hit')) {
                            this.animations.punch = this.mixer.clipAction(clip);
                        }
                    });
                    
                    // Jouer l'animation de marche par défaut
                    if (this.animations.walk) {
                        this.animations.walk.play();
                        this.currentAction = this.animations.walk;
                    }
                    
                    console.log(`🎬 Animations disponibles pour ${this.name}:`, Object.keys(this.animations));
                }
                
                this.scene.add(this.mesh);
                
                // Barre de vie au-dessus du modèle
                this.createHealthBar();
                
                console.log(`✅ Modèle 3D chargé pour ${this.name}`);
            } catch (error) {
                console.warn(`⚠️ Impossible de charger le modèle pour ${this.name}, utilisation d'un cube`, error);
                this.createFallbackMesh(color, size);
            }
        } else {
            // Pas de modèle 3D, utiliser un cube simple
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
        
        // Barre de vie au-dessus
        this.createHealthBar();
    }

    createHealthBar() {
        const barWidth = 2;
        const barHeight = 0.2;
        
        // Background
        const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x330000 });
        this.hpBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        
        // Pour les modèles 3D avec hitbox, positionner au-dessus de la hitbox
        if (this.hasModel && this.hitbox) {
            // Calculer la hauteur de la hitbox
            const box = new THREE.Box3().setFromObject(this.hitbox);
            const height = box.max.y - box.min.y;
            this.hpBarBg.position.y = height / 2 + 1.5; // Plus haut au-dessus de la hitbox
        } else {
            this.hpBarBg.position.y = 2.5; // Position par défaut
        }
        
        this.mesh.add(this.hpBarBg);
        
        // Foreground
        const fgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const fgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.hpBarFg = new THREE.Mesh(fgGeometry, fgMaterial);
        this.hpBarFg.position.z = 0.01;
        this.hpBarBg.add(this.hpBarFg);
    }

    updateHealthBar() {
        if (!this.hpBarFg || !this.hpBarBg) return;
        
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        this.hpBarFg.scale.x = hpPercent;
        this.hpBarFg.position.x = -(1 - hpPercent);
    }

    takeDamage(amount) {
        if (this.isDead || this.isDefeated) return;
        
        this.hp -= amount;
        this.updateHealthBar();
        
        // Flash effect - compatible avec les modèles 3D
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    const originalEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000);
                    const originalIntensity = child.material.emissiveIntensity || 0;
                    
                    if (child.material.emissive) {
                        child.material.emissiveIntensity = 0.8;
                    }
                    
                    setTimeout(() => {
                        if (child.material && child.material.emissive) {
                            child.material.emissive.copy(originalEmissive);
                            child.material.emissiveIntensity = originalIntensity;
                        }
                    }, 100);
                }
            });
        }
        
        console.log(`💥 ${this.name} prend ${amount} dégâts (${this.hp}/${this.maxHp} HP)`);
        
        // Vérifier si on doit arrêter le combat à un certain %
        if (this.stopAtHpPercent !== null) {
            const hpPercent = this.hp / this.maxHp;
            if (hpPercent <= this.stopAtHpPercent) {
                this.defeat();
                return;
            }
        }
        
        if (this.hp <= 0) {
            this.die();
        }
    }

    defeat() {
        this.isDefeated = true;
        this.hp = Math.max(this.hp, 1); // Garder au moins 1 HP
        
        console.log(`⚔️ ${this.name} s'échappe à ${Math.round((this.hp / this.maxHp) * 100)}% HP !`);
        
        // Animation de téléportation
        this.mesh.material.transparent = true;
        let opacity = 1;
        const fadeOut = setInterval(() => {
            opacity -= 0.05;
            if (this.mesh) {
                this.mesh.material.opacity = opacity;
                this.mesh.position.y += 0.1;
                this.mesh.rotation.y += 0.2;
            }
            
            if (opacity <= 0) {
                clearInterval(fadeOut);
                this.remove();
            }
        }, 50);
    }

    applyDot(damage, duration) {
        const dotEffect = {
            damage: damage,
            endTime: Date.now() + duration * 1000,
            interval: 1000, // 1 tick par seconde
            lastTick: Date.now()
        };
        this.dotEffects.push(dotEffect);
        console.log(`🔥 DoT appliqué: ${damage} dégâts/s pendant ${duration}s`);
    }

    stun(duration) {
        this.stunEndTime = Date.now() + duration;
        
        // Changer la couleur en bleu pendant le stun - uniquement pour les cubes
        if (this.mesh && !this.hasModel) {
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (child.material.color) {
                        child.material.color.setHex(0x4444ff);
                    }
                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x4444ff);
                        child.material.emissiveIntensity = 0.6;
                    }
                }
            });
        }
        
        console.log(`😵 ${this.name} étourdi pour ${duration / 1000}s`);
    }

    isStunned() {
        const now = Date.now();
        
        if (now >= this.stunEndTime && this.stunEndTime > 0) {
            // Restaurer la couleur originale - uniquement pour les cubes
            if (this.mesh && !this.hasModel) {
                this.mesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        if (child.material.color) {
                            child.material.color.setHex(this.originalColor);
                        }
                        if (child.material.emissive) {
                            child.material.emissive.setHex(this.originalColor);
                            child.material.emissiveIntensity = 0.3;
                        }
                    }
                });
            }
            this.stunEndTime = 0;
            console.log(`✅ ${this.name} n'est plus étourdi`);
        }
        
        return now < this.stunEndTime;
    }

    updateDots() {
        const now = Date.now();
        
        for (let i = this.dotEffects.length - 1; i >= 0; i--) {
            const dot = this.dotEffects[i];
            
            // Vérifier si le DoT a expiré
            if (now >= dot.endTime) {
                this.dotEffects.splice(i, 1);
                continue;
            }
            
            // Appliquer les dégâts si intervalle écoulé
            if (now - dot.lastTick >= dot.interval) {
                this.takeDamage(dot.damage);
                dot.lastTick = now;
            }
        }
    }

    moveTowards(targetPosition, delta) {
        if (!this.mesh || this.isStunned() || this.isPacified() || this.isDead) return;
        
        // OPTIMISATION : Ne pas bouger si le labyrinthe est en train de se transformer
        if (this.obstacleManager && this.obstacleManager.isTransforming) {
            return; // Attendre que les murs finissent de bouger
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
                // Pas de chemin trouvé, mouvement direct vers le joueur
                moveDirection.subVectors(targetPosition, this.mesh.position);
            }
        } else {
            // Pas de pathfinding, mouvement direct
            moveDirection.subVectors(targetPosition, this.mesh.position);
        }
        
        moveDirection.y = 0;
        
        // Vérifier que la direction est valide
        if (moveDirection.length() < 0.01) return;
        
        moveDirection.normalize();
        
        // Si le boss peut lancer des sorts, il se déplace plus lentement
        const speedMultiplier = this.canCastSpells ? 0.5 : 1.0;
        const movement = moveDirection.multiplyScalar(this.speed * speedMultiplier * delta);
        
        // Calculer la nouvelle position
        const newPosition = this.mesh.position.clone().add(movement);
        
        // Vérifier les collisions avec les obstacles
        if (this.obstacleManager) {
            const collision = this.obstacleManager.checkCollision(newPosition, 1.0);
            
            // Vérifier que la position corrigée n'est pas trop loin (éviter téléportation)
            const distanceMoved = this.mesh.position.distanceTo(collision.position);
            const maxAllowedDistance = this.speed * speedMultiplier * delta * 1.5; // Max 1.5x le mouvement normal (réduit de 2x)
            
            if (distanceMoved > maxAllowedDistance) {
                // La correction est trop grande, probablement bloqué - ne pas bouger
                console.warn(`⚠️ ${this.name}: Correction de collision suspecte (${distanceMoved.toFixed(2)}m > ${maxAllowedDistance.toFixed(2)}m), annulation du mouvement`);
                // Invalider le chemin actuel pour forcer un recalcul immédiat
                this.currentPath = null;
                this.lastPathUpdate = 0; // Forcer recalcul immédiat au prochain frame
                return;
            }
            
            // Si collision détectée, invalider le chemin pour forcer un recalcul
            if (collision.collided) {
                this.currentPath = null;
                // Forcer un recalcul plus rapide en cas de collision répétée
                if (now - this.lastPathUpdate > 1000) { // Si déjà 1s depuis dernier recalcul
                    this.lastPathUpdate = 0; // Forcer recalcul immédiat
                }
            }
            
            this.mesh.position.copy(collision.position);
        } else {
            this.mesh.position.copy(newPosition);
        }
    }
    
    castSpell(targetPosition) {
        if (!this.canCastSpells || !this.mesh) return;
        
        const now = Date.now();
        if (now - this.lastSpellTime < this.spellCooldown) return;
        
        this.lastSpellTime = now;
        
        // Créer un projectile
        const projectile = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            new THREE.MeshBasicMaterial({ 
                color: this.spellColor,
                emissive: this.spellColor,
                emissiveIntensity: 0.8
            })
        );
        
        // Position de départ : position du boss + légèrement devant
        const startPos = this.mesh.position.clone();
        startPos.y += 1.5; // Hauteur de lancement
        projectile.position.copy(startPos);
        
        // Direction vers le joueur
        const direction = new THREE.Vector3();
        direction.subVectors(targetPosition, startPos);
        direction.normalize();
        
        // Stocker les données du projectile
        projectile.userData = {
            velocity: direction.multiplyScalar(this.spellSpeed),
            damage: this.damage,
            boss: this
        };
        
        this.scene.add(projectile);
        this.projectiles.push(projectile);
        
        console.log(`✨ ${this.name} lance un sort ! (${this.damage} dégâts)`);
    }
    
    updateProjectiles(delta, playerPosition, playerHitRadius = 0.5) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Déplacer le projectile
            proj.position.add(proj.userData.velocity.clone().multiplyScalar(delta));
            
            // Vérifier la collision avec le joueur
            const distance = proj.position.distanceTo(playerPosition);
            if (distance < playerHitRadius) {
                // Touché !
                this.scene.remove(proj);
                this.projectiles.splice(i, 1);
                return { hit: true, damage: proj.userData.damage };
            }
            
            // Supprimer si trop loin (> 50 unités)
            if (proj.position.distanceTo(this.mesh.position) > 50) {
                this.scene.remove(proj);
                this.projectiles.splice(i, 1);
            }
        }
        
        return { hit: false, damage: 0 };
    }

    die() {
        this.isDead = true;
        this.hp = 0;
        
        console.log(`☠️ ${this.name} est vaincu!`);
        
        // Animation de mort
        let scale = 1;
        const deathAnimation = setInterval(() => {
            scale -= 0.05;
            if (this.mesh) {
                this.mesh.scale.set(scale, scale, scale);
                this.mesh.rotation.y += 0.2;
            }
            
            if (scale <= 0) {
                clearInterval(deathAnimation);
                this.remove();
            }
        }, 50);
    }

    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }
        
        // Supprimer tous les projectiles actifs
        for (const proj of this.projectiles) {
            this.scene.remove(proj);
        }
        this.projectiles = [];
    }

    update(delta, playerPosition) {
        if (this.isDead || this.isDefeated || !this.mesh) return;
        
        // Mettre à jour l'animation si disponible
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        this.updateDots();
        
        // Vérifier le stun et pacify à chaque frame
        const stunned = this.isStunned();
        const pacified = this.isPacified();
        
        // Calculer la distance au joueur
        const distance = this.getDistanceToPlayer(playerPosition);
        
        // Lancer des sorts si le boss en est capable (et pas trop proche)
        if (this.canCastSpells && !stunned && !pacified && distance > 3 && distance < 20) {
            this.castSpell(playerPosition);
        }
        
        // Gérer les animations pour les boss avec animations
        if (this.animations.punch && this.animations.walk) {
            // Pour les boss qui lancent des sorts, pas d'animation de punch
            if (this.canCastSpells) {
                // Toujours en mode marche
                if (this.currentAction !== this.animations.walk) {
                    if (this.animations.punch) this.animations.punch.fadeOut(0.2);
                    this.animations.walk.reset().fadeIn(0.2).play();
                    this.currentAction = this.animations.walk;
                }
            } else {
                // Boss au corps à corps : punch quand proche, sinon marche
                if (distance < 2 && !stunned && !pacified) {
                    if (this.currentAction !== this.animations.punch) {
                        this.animations.walk.fadeOut(0.2);
                        this.animations.punch.reset().fadeIn(0.2).play();
                        this.currentAction = this.animations.punch;
                    }
                } else {
                    if (this.currentAction !== this.animations.walk) {
                        if (this.animations.punch) this.animations.punch.fadeOut(0.2);
                        this.animations.walk.reset().fadeIn(0.2).play();
                        this.currentAction = this.animations.walk;
                    }
                }
            }
        }
        
        // Ne bouger que si pas étourdi et pas pacifié
        if (!stunned && !pacified) {
            this.moveTowards(playerPosition, delta);
        }
        
        // Faire face au joueur (même étourdi/pacifié)
        if (this.mesh) {
            // Pour les modèles 3D, calculer l'angle vers le joueur manuellement
            if (this.hasModel) {
                const direction = new THREE.Vector3();
                direction.subVectors(playerPosition, this.mesh.position);
                direction.y = 0; // Garder seulement la rotation horizontale
                direction.normalize();
                
                // Calculer l'angle et appliquer la rotation sur l'axe Y
                const angle = Math.atan2(direction.x, direction.z);
                this.mesh.rotation.y = angle;
            } else {
                // Pour les cubes, utiliser lookAt
                this.mesh.lookAt(playerPosition);
                this.mesh.rotation.x = 0;
                this.mesh.rotation.z = 0;
            }
            
            // Animation de tremblement si étourdi
            if (stunned) {
                this.mesh.rotation.z = Math.sin(Date.now() * 0.01) * 0.1;
            }
            // Effets de couleur uniquement pour les cubes (pas les modèles 3D)
            else if (pacified && !this.hasModel) {
                this.mesh.traverse((child) => {
                    if (child.isMesh && child.material && child.material.emissive) {
                        child.material.emissive = new THREE.Color(0x9400D3);
                        child.material.emissiveIntensity = 0.5;
                    }
                });
            } else if (!this.hasModel) {
                // Restaurer la couleur normale uniquement pour les cubes
                this.mesh.traverse((child) => {
                    if (child.isMesh && child.material && child.material.emissive) {
                        child.material.emissive = new THREE.Color(this.originalColor);
                        child.material.emissiveIntensity = 0.3;
                    }
                });
            }
        }
    }
    
    isPacified() {
        return Date.now() < this.pacifyEndTime;
    }

    getDistanceToPlayer(playerPosition) {
        if (!this.mesh) return Infinity;
        
        // Pour les modèles 3D et les cubes, utiliser la position du mesh
        return this.mesh.position.distanceTo(playerPosition);
    }
}
