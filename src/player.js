import * as THREE from "three";
import { ShieldManager } from './managers/ShieldManager.js';

export class Player {
    constructor(scene, arena = null) {
        this.scene = scene;
        this.arena = arena;
        
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
        this.rotationSpeed = 0.002;
        
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
        this.yaw -= deltaX * this.rotationSpeed;
        this.pitch -= deltaY * this.rotationSpeed;
        
        // Limiter la rotation verticale
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        
        // Appliquer la rotation à la caméra
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
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
            
            // Vérifier la collision avec les murs si l'arène existe
            if (this.arena) {
                const collision = this.arena.checkCollision(newPosition, 0.5);
                this.camera.position.copy(collision.position);
            } else {
                this.camera.position.add(moveVector);
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
