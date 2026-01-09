import * as THREE from 'three';

export class Potion {
    constructor(scene, type, position) {
        this.scene = scene;
        this.type = type;
        this.collected = false;
        
        this.config = this.getPotionConfig(type);
        this.createMesh(position);
        
        console.log(`🧪 Potion ${this.config.name} créée à`, position);
    }

    getPotionConfig(type) {
        const configs = {
            health: {
                name: 'PV',
                color: 0xff0000,
                emissive: 0xff0000,
                effect: 'health',
                value: 50,
                description: 'Restaure 50 HP'
            },
            mana: {
                name: 'Mana',
                color: 0x00ffff,
                emissive: 0x00ffff,
                effect: 'mana',
                value: 30,
                description: 'Restaure 30 Mana'
            },
            attack: {
                name: 'Boost Atk',
                color: 0x9900ff,
                emissive: 0x9900ff,
                effect: 'attack',
                value: 2,
                duration: 15000, // 15 secondes
                description: 'Dégâts x2 pendant 15s'
            },
            defense: {
                name: 'Boost Def',
                color: 0x00ff00, // Vert
                emissive: 0x00ff00,
                effect: 'defense',
                value: 0.5,
                duration: 15000, // 15 secondes
                description: 'Dégâts reçus /2 pendant 15s'
            }
        };
        return configs[type];
    }

    createMesh(position) {
        // Corps de la potion (cylindre)
        const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.config.color,
            emissive: this.config.emissive,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.2;

        // Bouchon de la potion
        const capGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.1, 8);
        const capMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 0.45;

        // Groupe pour la potion complète
        this.mesh = new THREE.Group();
        this.mesh.add(body);
        this.mesh.add(cap);
        this.mesh.position.set(position.x, position.y, position.z);

        // Ajouter un halo lumineux
        const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.config.color,
            transparent: true,
            opacity: 0.2
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glow.position.y = 0.2;
        this.mesh.add(this.glow);

        this.scene.add(this.mesh);

        // Animation
        this.animationTime = 0;
    }

    update(delta) {
        if (this.collected || !this.mesh) return;

        this.animationTime += delta;

        // Rotation
        this.mesh.rotation.y += delta * 2;

        // Mouvement vertical (flottement)
        this.mesh.position.y = 0.3 + Math.sin(this.animationTime * 2) * 0.1;

        // Pulsation du halo
        const scale = 1 + Math.sin(this.animationTime * 3) * 0.1;
        this.glow.scale.set(scale, scale, scale);
    }

    collect() {
        if (this.collected) return null;
        
        this.collected = true;
        console.log(`✨ Potion ${this.config.name} collectée !`);

        // Animation de collection améliorée
        let scale = 1;
        let opacity = 1;
        const collectAnimation = setInterval(() => {
            scale += 0.15;
            opacity -= 0.15;
            
            if (this.mesh) {
                this.mesh.scale.set(scale, scale, scale);
                this.mesh.position.y += 0.05;
                
                // Réduire l'opacité de tous les matériaux
                this.mesh.traverse((child) => {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.transparent = true;
                                mat.opacity = opacity;
                            });
                        } else {
                            child.material.transparent = true;
                            child.material.opacity = opacity;
                        }
                    }
                });
            }

            if (opacity <= 0 || scale >= 2.5) {
                clearInterval(collectAnimation);
                this.remove();
            }
        }, 40);

        return this.config;
    }

    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }
    }

    getDistanceTo(position) {
        if (!this.mesh) return Infinity;
        return this.mesh.position.distanceTo(position);
    }
}
