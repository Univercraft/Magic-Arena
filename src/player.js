import * as THREE from "three";
import { ShieldManager } from './managers/ShieldManager.js';

export class Player {
    constructor(scene, arena = null, obstacleManager = null) {
        this.scene = scene;
        this.arena = arena;
        this.obstacleManager = obstacleManager;
        this.bossManager = null; // Sera défini plus tard
        
        // Stats du joueur
        this.stats = {
            hp: 100,
            maxHp: 100,
            mana: 100,
            maxMana: 100,
            defense: 0,
            attack: 10
        };
        
        // Système de difficulté
        this.difficulty = 'normal'; // Sera défini par le MenuManager

        // Raccourci pour compatibilité
        this.health = this.stats.hp;
        this.mana = this.stats.mana;

        // Camera FPS simple
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 5);

        // Container pour le mesh du joueur (invisible mais avec bouclier)
        this.container = new THREE.Object3D();
        this.container.position.copy(this.camera.position);
        scene.add(this.container);

        // Mesh du joueur (pour le bouclier)
        const geometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0 // Invisible mais présent pour le bouclier
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.container.add(this.mesh);

        // Shield Manager
        this.shieldManager = new ShieldManager(this);
        this.shieldManager.createShieldVisual(this.mesh);

        // Vitesse et rotation
        this.speed = 5;
        this.rotationSpeed = 0.003; // Augmenté de 0.002 à 0.003 pour une meilleure réactivité
        
        // Angles de rotation
        this.yaw = 0;   // Rotation horizontale
        this.pitch = 0; // Rotation verticale

        // Boosts de potions
        this.attackBoost = 1;
        this.attackBoostEndTime = 0;
        this.defenseBoost = 1;
        this.defenseBoostEndTime = 0;

        console.log('✅ Player créé avec ShieldManager');
    }

    setBossManager(bossManager) {
        this.bossManager = bossManager;
    }

    takeDamage(amount) {
        // VÉRIFICATION DU BOUCLIER EN PREMIER
        if (!this.shieldManager.canTakeDamage()) {
            console.log(`⚔️ ${amount} dégâts BLOQUÉS par le bouclier !`);
            return 0;
        }

        // Appliquer le boost de défense
        const now = Date.now();
        if (now < this.defenseBoostEndTime) {
            amount *= this.defenseBoost;
            console.log(`🛡️ Dégâts réduits par boost de défense: ${amount}`);
        }

        // Appliquer les dégâts normalement si pas de bouclier
        console.log(`💥 ${amount} dégâts reçus`);
        this.stats.hp -= amount;
        this.health = this.stats.hp;
        
        if (this.stats.hp < 0) {
            this.stats.hp = 0;
            this.health = 0;
        }
        
        return amount;
    }

    rotate(deltaX, deltaY) {
        // ROTATION HORIZONTALE (YAW) - Pas de limitation, rotation 360° complète
        this.yaw -= deltaX * this.rotationSpeed;
        
        // ROTATION VERTICALE (PITCH) - Limitée pour éviter de regarder trop haut/bas
        this.pitch -= deltaY * this.rotationSpeed;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        
        // Appliquer la rotation à la caméra
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        
        // Synchroniser la rotation du container avec le yaw pour le bouclier et les collisions
        this.container.rotation.y = this.yaw;
    }

    move(direction, deltaTime) {
        const moveSpeed = this.speed * deltaTime;
        
        // Créer un vecteur de mouvement basé sur la direction de la caméra
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        
        // Appliquer uniquement la rotation horizontale (yaw) au mouvement
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        
        const moveVector = new THREE.Vector3();
        
        if (direction.forward) moveVector.add(forward);
        if (direction.backward) moveVector.sub(forward);
        if (direction.left) moveVector.sub(right);
        if (direction.right) moveVector.add(right);
        
        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(moveSpeed);
            
            // Calculer la nouvelle position
            const newPosition = this.camera.position.clone().add(moveVector);
            
            // Vérifier la collision avec le boss d'abord
            if (this.bossManager && this.bossManager.currentBoss && !this.bossManager.currentBoss.isDead) {
                const boss = this.bossManager.currentBoss;
                if (boss.mesh && boss.mesh.position) {
                    const dx = newPosition.x - boss.mesh.position.x;
                    const dz = newPosition.z - boss.mesh.position.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    const minDistance = 2; // Rayon de collision avec le boss
                    
                    if (distance < minDistance) {
                        // Pousser le joueur à l'extérieur
                        const angle = Math.atan2(dz, dx);
                        const pushedX = boss.mesh.position.x + Math.cos(angle) * minDistance;
                        const pushedZ = boss.mesh.position.z + Math.sin(angle) * minDistance;
                        newPosition.x = pushedX;
                        newPosition.z = pushedZ;
                        
                        // CRITIQUE: Vérifier que la position poussée ne traverse pas un mur
                        if (this.obstacleManager) {
                            const obstacleCheck = this.obstacleManager.checkCollision(newPosition, 0.5);
                            newPosition.copy(obstacleCheck.position);
                        }
                    }
                }
            }
            
            // Vérifier la collision avec les obstacles (si pas déjà fait)
            if (this.obstacleManager) {
                const obstacleCollision = this.obstacleManager.checkCollision(newPosition, 0.5);
                newPosition.copy(obstacleCollision.position);
            }
            
            // Puis vérifier la collision avec les murs de l'arène
            if (this.arena) {
                const collision = this.arena.checkCollision(newPosition, 0.5);
                this.camera.position.copy(collision.position);
            } else {
                this.camera.position.copy(newPosition);
            }
            
            this.container.position.copy(this.camera.position);
        }
    }

    update(deltaTime) {
        // TOUJOURS mettre à jour le bouclier
        this.shieldManager.update();

        // Vérifier l'expiration des boosts
        const now = Date.now();
        if (this.attackBoostEndTime > 0 && now >= this.attackBoostEndTime) {
            this.attackBoost = 1;
            this.attackBoostEndTime = 0;
            console.log('⚔️ Boost d\'attaque expiré');
        }
        if (this.defenseBoostEndTime > 0 && now >= this.defenseBoostEndTime) {
            this.defenseBoost = 1;
            this.defenseBoostEndTime = 0;
            console.log('🛡️ Boost de défense expiré');
        }

        // Synchroniser les stats
        this.health = this.stats.hp;
        this.mana = this.stats.mana;

        // Régénération de HP en mode Normal uniquement (2%/s)
        if (this.difficulty === 'normal' && this.stats.hp < this.stats.maxHp) {
            const regenAmount = this.stats.maxHp * 0.02 * deltaTime; // 2% par seconde
            this.stats.hp += regenAmount;
            if (this.stats.hp > this.stats.maxHp) {
                this.stats.hp = this.stats.maxHp;
            }
        }

        // Régénération de mana
        if (this.stats.mana < this.stats.maxMana) {
            this.stats.mana += 5 * deltaTime;
            if (this.stats.mana > this.stats.maxMana) {
                this.stats.mana = this.stats.maxMana;
            }
        }
        
        // Synchroniser la position du container avec la caméra
        this.container.position.copy(this.camera.position);
    }
}
