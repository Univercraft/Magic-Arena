import * as THREE from 'three';

export class ShieldManager {
    constructor(player) {
        this.player = player;
        this.isActive = false;
        this.endTime = 0;
        this.shieldMesh = null;
    }

    createShieldVisual(playerMesh) {
        if (this.shieldMesh) return;

        const geometry = new THREE.SphereGeometry(1.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4169e1,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        this.shieldMesh = new THREE.Mesh(geometry, material);
        this.shieldMesh.visible = false;
        
        if (playerMesh) {
            playerMesh.add(this.shieldMesh);
        }
    }

    activate(duration) {
        this.isActive = true;
        this.endTime = Date.now() + duration;
        
        if (this.shieldMesh) {
            this.shieldMesh.visible = true;
        }

        console.log(`🛡️ BOUCLIER ACTIVÉ pour ${duration / 1000}s - Invulnérable jusqu'à ${new Date(this.endTime).toLocaleTimeString()}`);
    }

    update() {
        if (this.isActive) {
            const currentTime = Date.now();
            
            if (currentTime >= this.endTime) {
                this.deactivate();
            } else {
                if (this.shieldMesh) {
                    const pulse = Math.sin(currentTime * 0.005) * 0.1 + 1;
                    this.shieldMesh.scale.set(pulse, pulse, pulse);
                    
                    const timeLeft = (this.endTime - currentTime) / 1000;
                    if (timeLeft < 1) {
                        this.shieldMesh.material.opacity = Math.sin(currentTime * 0.02) * 0.2 + 0.3;
                    }
                }
            }
        }
    }

    deactivate() {
        this.isActive = false;
        this.endTime = 0;
        
        if (this.shieldMesh) {
            this.shieldMesh.visible = false;
            this.shieldMesh.scale.set(1, 1, 1);
            this.shieldMesh.material.opacity = 0.3;
        }

        console.log('🛡️ Bouclier désactivé');
    }

    canTakeDamage() {
        const canTake = !this.isActive;
        if (!canTake) {
            console.log('⚔️ DÉGÂTS BLOQUÉS PAR LE BOUCLIER !');
        }
        return canTake;
    }

    getRemainingTime() {
        if (!this.isActive) return 0;
        return Math.max(0, (this.endTime - Date.now()) / 1000);
    }
}
