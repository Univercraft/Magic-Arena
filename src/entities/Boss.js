import * as THREE from 'three';

export class Boss {
    constructor(scene, config) {
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
        
        this.createMesh(config.color || 0xff0000, config.size || { x: 1, y: 2, z: 1 });
        this.position = config.position || { x: 0, y: 1, z: -10 };
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        // Effets actifs
        this.stunEndTime = 0;
        this.pacifyEndTime = 0; // Pour Impero
        this.dotEffects = [];
        this.originalColor = config.color || 0xff0000;
        
        console.log(`🎭 Boss créé: ${this.name} (${this.hp} HP)`);
    }

    createMesh(color, size) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
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
        this.hpBarBg.position.y = 2.5;
        this.mesh.add(this.hpBarBg);
        
        // Foreground
        const fgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const fgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.hpBarFg = new THREE.Mesh(fgGeometry, fgMaterial);
        this.hpBarFg.position.z = 0.01;
        this.hpBarBg.add(this.hpBarFg);
    }

    updateHealthBar() {
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        this.hpBarFg.scale.x = hpPercent;
        this.hpBarFg.position.x = -(1 - hpPercent);
    }

    takeDamage(amount) {
        if (this.isDead || this.isDefeated) return;
        
        this.hp -= amount;
        this.updateHealthBar();
        
        // Flash effect
        this.mesh.material.emissiveIntensity = 0.8;
        setTimeout(() => {
            if (this.mesh) this.mesh.material.emissiveIntensity = 0.3;
        }, 100);
        
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
        
        // Changer la couleur en bleu pendant le stun
        this.mesh.material.color.setHex(0x4444ff);
        this.mesh.material.emissive.setHex(0x4444ff);
        this.mesh.material.emissiveIntensity = 0.6;
        
        console.log(`😵 ${this.name} étourdi pour ${duration / 1000}s`);
    }

    isStunned() {
        const now = Date.now();
        
        if (now >= this.stunEndTime && this.stunEndTime > 0) {
            // Restaurer la couleur originale
            this.mesh.material.color.setHex(this.originalColor);
            this.mesh.material.emissive.setHex(this.originalColor);
            this.mesh.material.emissiveIntensity = 0.3;
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
        if (this.isStunned() || this.isPacified() || this.isDead) return;
        
        const direction = new THREE.Vector3();
        direction.subVectors(targetPosition, this.mesh.position);
        direction.y = 0;
        direction.normalize();
        
        this.mesh.position.add(direction.multiplyScalar(this.speed * delta));
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
    }

    update(delta, playerPosition) {
        if (this.isDead || this.isDefeated) return;
        
        this.updateDots();
        
        // Vérifier le stun et pacify à chaque frame
        const stunned = this.isStunned();
        const pacified = this.isPacified();
        
        // Ne bouger que si pas étourdi et pas pacifié
        if (!stunned && !pacified) {
            this.moveTowards(playerPosition, delta);
        }
        
        // Faire face au joueur (même étourdi/pacifié)
        if (this.mesh) {
            this.mesh.lookAt(playerPosition);
            this.mesh.rotation.x = 0;
            this.mesh.rotation.z = 0;
            
            // Animation de tremblement si étourdi
            if (stunned) {
                this.mesh.rotation.z = Math.sin(Date.now() * 0.01) * 0.1;
            }
            // Animation de rotation lente si pacifié
            else if (pacified) {
                this.mesh.material.emissive = new THREE.Color(0x9400D3);
                this.mesh.material.emissiveIntensity = 0.5;
            } else {
                // Restaurer la couleur normale
                this.mesh.material.emissive = new THREE.Color(this.originalColor);
                this.mesh.material.emissiveIntensity = 0.3;
            }
        }
    }
    
    isPacified() {
        return Date.now() < this.pacifyEndTime;
    }

    getDistanceToPlayer(playerPosition) {
        if (!this.mesh) return Infinity;
        return this.mesh.position.distanceTo(playerPosition);
    }
}
