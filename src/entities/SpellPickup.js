import * as THREE from 'three';

export class SpellPickup {
    constructor(scene, spellName, position) {
        this.scene = scene;
        this.spellName = spellName;
        this.collected = false;
        
        this.config = this.getSpellConfig(spellName);
        this.createMesh(position);
        
        console.log(`✨ Sort ${this.config.displayName} créé à`, position);
    }

    getSpellConfig(spellName) {
        const configs = {
            arresto: {
                displayName: 'Arresto Momentum',
                color: 0xffff00, // Jaune
                emissive: 0xffff00,
                description: 'Stun l\'ennemi pendant 5s'
            },
            bombarda: {
                displayName: 'Bombarda',
                color: 0xff6600, // Orange
                emissive: 0xff6600,
                description: '25 dégâts dans une zone de 5m'
            },
            bombardaMax: {
                displayName: 'Bombarda Maxima',
                color: 0xff0000, // Rouge vif
                emissive: 0xff0000,
                description: '50 dégâts dans une zone de 15m'
            },
            diffindo: {
                displayName: 'Diffindo',
                color: 0xc0c0c0, // Argent
                emissive: 0xc0c0c0,
                description: '30 dégâts'
            },
            patronum: {
                displayName: 'Spero Patronum',
                color: 0xadd8e6, // Bleu clair
                emissive: 0xadd8e6,
                description: 'Bouclier protecteur pendant 15s'
            },
            petrificus: {
                displayName: 'Petrificus Totalus',
                color: 0x9370db, // Violet
                emissive: 0x9370db,
                description: '10 dégâts + stun pendant 7s'
            }
        };
        return configs[spellName];
    }

    createMesh(position) {
        // Forme de cristal/diamant pour le sort
        const geometry = new THREE.OctahedronGeometry(0.3, 0);
        const material = new THREE.MeshStandardMaterial({
            color: this.config.color,
            emissive: this.config.emissive,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.9,
            metalness: 0.5,
            roughness: 0.2
        });
        
        this.crystal = new THREE.Mesh(geometry, material);
        this.crystal.position.y = 0.3;

        // Groupe pour le sort complet
        this.mesh = new THREE.Group();
        this.mesh.add(this.crystal);
        this.mesh.position.set(position.x, position.y, position.z);

        // Ajouter un halo lumineux plus intense
        const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.config.color,
            transparent: true,
            opacity: 0.3
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glow.position.y = 0.3;
        this.mesh.add(this.glow);

        // Particules tourbillonnantes autour du cristal
        this.createParticles();

        this.scene.add(this.mesh);

        // Animation
        this.animationTime = 0;
    }

    createParticles() {
        const particlesCount = 20;
        const positions = new Float32Array(particlesCount * 3);
        
        for (let i = 0; i < particlesCount; i++) {
            const angle = (i / particlesCount) * Math.PI * 2;
            const radius = 0.4;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = 0.3 + (Math.random() - 0.5) * 0.3;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: this.config.color,
            size: 0.05,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.mesh.add(this.particles);
    }

    update(delta) {
        if (this.collected || !this.mesh) return;

        this.animationTime += delta;

        // Rotation du cristal
        this.crystal.rotation.y += delta * 2;
        this.crystal.rotation.x += delta * 0.5;

        // Mouvement vertical (flottement)
        this.mesh.position.y = 0.3 + Math.sin(this.animationTime * 2) * 0.15;

        // Pulsation du halo
        const scale = 1 + Math.sin(this.animationTime * 3) * 0.2;
        this.glow.scale.set(scale, scale, scale);

        // Rotation des particules
        if (this.particles) {
            this.particles.rotation.y += delta * 1.5;
        }
    }

    collect() {
        if (this.collected) return null;
        
        this.collected = true;
        console.log(`✨ Sort ${this.config.displayName} collecté !`);

        // Animation de collection spectaculaire
        let scale = 1;
        let opacity = 1;
        const collectAnimation = setInterval(() => {
            scale += 0.2;
            opacity -= 0.15;
            
            if (this.mesh) {
                this.mesh.scale.set(scale, scale, scale);
                this.mesh.position.y += 0.08;
                
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

            if (opacity <= 0 || scale >= 3) {
                clearInterval(collectAnimation);
                this.remove();
            }
        }, 40);

        return { spellName: this.spellName, config: this.config };
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
