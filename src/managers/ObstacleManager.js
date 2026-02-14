import * as THREE from 'three';

export class ObstacleManager {
    constructor(scene, arenaSize = 100) {
        this.scene = scene;
        this.arenaSize = arenaSize;
        this.obstacles = [];
        this.obstacleData = [];
        this.animatedWalls = [];
        this.wallHeight = 3.5;
        this.wallThickness = 0.8;
        this.seed = Math.random();
        
        // Système de labyrinthe vivant - OPTIMISÉ
        this.isLiving = true;
        this.changeInterval = 20000; // 20 secondes (optimisé pour éviter les freezes)
        this.lastChangeTime = Date.now();
        this.animationDuration = 1500; // 1.5 secondes (plus rapide !)
        this.isTransforming = false; // Flag pour savoir si des murs sont en train de bouger
        
        // OPTIMISATION : Matériaux partagés pour tous les murs (réduit drastiquement la mémoire)
        this.sharedHedgeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a4d1a,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: false,
            side: THREE.FrontSide
        });
        
        this.sharedTopMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2d5a2d,
            roughness: 0.8,
            metalness: 0.05,
            flatShading: false,
            side: THREE.FrontSide
        });
        
        this.generateMaze();
        console.log('🌿 Labyrinthe VIVANT créé (seed:', this.seed.toFixed(4), ')');
    }

    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    regenerate() {
        console.log('🔄 Régénération du labyrinthe...');
        
        this.obstacles.forEach(obstacle => {
            this.scene.remove(obstacle);
            if (obstacle.geometry) obstacle.geometry.dispose();
            if (obstacle.material) obstacle.material.dispose();
        });
        
        this.obstacles = [];
        this.obstacleData = [];
        this.seed = Math.random();
        this.generateMaze();
        
        console.log('✅ Nouveau labyrinthe (seed:', this.seed.toFixed(4), ')');
    }

    generateMaze() {
        this.animatedWalls = [];
        let seedCounter = this.seed * 1000;
        
        const wallPositions = [];
        
        // NOUVEAU : Labyrinthe SIMPLIFIÉ pour éviter les pièces fermées
        // On crée seulement des murs isolés espacés, JAMAIS de pièces closes
        
        const numWalls = 70; // Nombre suffisant de murs pour un labyrinthe dense
        const minSpacing = 5; // Espacement minimum entre les murs
        
        for (let i = 0; i < numWalls; i++) {
            let validPosition = false;
            let x, z, width, depth;
            let attempts = 0;
            
            while (!validPosition && attempts < 20) {
                // Position aléatoire loin du centre (spawn du joueur)
                const angle = this.seededRandom(seedCounter++) * Math.PI * 2;
                const distance = 10 + this.seededRandom(seedCounter++) * 40; // 10-50m du centre
                x = Math.cos(angle) * distance;
                z = Math.sin(angle) * distance;
                
                // Taille du mur : soit horizontal, soit vertical, mais PAS les deux
                const isHorizontal = this.seededRandom(seedCounter++) > 0.5;
                const length = 8 + this.seededRandom(seedCounter++) * 12; // 8-20m de long
                
                if (isHorizontal) {
                    width = length;
                    depth = this.wallThickness;
                } else {
                    width = this.wallThickness;
                    depth = length;
                }
                
                // Vérifier qu'on n'est pas trop proche d'un autre mur
                let tooClose = false;
                for (const existingWall of wallPositions) {
                    const dist = Math.sqrt(
                        Math.pow(x - existingWall.x, 2) + 
                        Math.pow(z - existingWall.z, 2)
                    );
                    if (dist < minSpacing) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) {
                    validPosition = true;
                } else {
                    attempts++;
                }
            }
            
            if (validPosition) {
                wallPositions.push({
                    x, z, width, depth,
                    isActive: this.seededRandom(seedCounter++) > 0.2 // 80% actifs
                });
            }
        }
        
        // Créer les murs
        wallPositions.forEach((pos) => {
            this.createAnimatedHedge(pos.x, pos.z, pos.width, pos.depth, pos.isActive);
        });
        
        // Ajouter quelques arbres et rochers pour décoration (bien espacés)
        const numTrees = 20; // Réduit
        for (let i = 0; i < numTrees; i++) {
            const angle = this.seededRandom(seedCounter++) * Math.PI * 2;
            const distance = 30 + this.seededRandom(seedCounter++) * 45;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            if (this.isPositionValidForTree({ x, z })) {
                this.createTree(x, z);
            }
        }
        
        const numRocks = 30 + Math.floor(this.seededRandom(seedCounter++) * 20); // 30-50 rochers
        for (let i = 0; i < numRocks; i++) {
            const angle = this.seededRandom(seedCounter++) * Math.PI * 2;
            const distance = 25 + this.seededRandom(seedCounter++) * 50;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            if (this.isPositionValidForTree({ x, z })) {
                this.createRock(x, z, this.seededRandom(seedCounter++));
            }
        }
    }

    isPositionValidForTree(position) {
        if (Math.abs(position.x) < 6 && Math.abs(position.z) < 6) {
            return false;
        }
        
        for (const obstacle of this.obstacleData) {
            const dx = position.x - obstacle.x;
            const dz = position.z - obstacle.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < 4) {
                return false;
            }
        }
        
        return true;
    }

    createAnimatedHedge(x, z, width, depth, isActive = true) {
        // OPTIMISATION : Utiliser les matériaux partagés au lieu de créer de nouveaux matériaux à chaque fois
        const geometry = new THREE.BoxGeometry(width, this.wallHeight, depth);
        const hedge = new THREE.Mesh(geometry, this.sharedHedgeMaterial);
        hedge.castShadow = true;
        hedge.receiveShadow = true;
        
        const topGeometry = new THREE.BoxGeometry(width, 0.3, depth);
        const top = new THREE.Mesh(topGeometry, this.sharedTopMaterial);
        top.castShadow = true;
        
        // OPTIMISATION : Réduire drastiquement le nombre de feuillages (diviser par 3)
        // Cela réduit le nombre d'objets 3D de centaines à quelques dizaines
        const foliageObjects = [];
        const foliageCount = Math.max(2, Math.floor((width + depth) / 10)); // Beaucoup moins de feuillages

        for (let i = 0; i < foliageCount; i++) {
            const offsetX = (Math.random() - 0.5) * width * 0.9;
            const offsetZ = (Math.random() - 0.5) * depth * 0.9;
            const offsetY = Math.random() * this.wallHeight * 0.5 + this.wallHeight * 0.5;

            // Utiliser le matériau partagé pour le feuillage aussi
            const foliageGeometry = new THREE.SphereGeometry(0.25, 6, 6);
            const foliage = new THREE.Mesh(foliageGeometry, this.sharedTopMaterial);
            foliage.position.set(offsetX, offsetY, offsetZ);
            foliageObjects.push(foliage);
        }
        
        const wallGroup = new THREE.Group();
        wallGroup.add(hedge);
        wallGroup.add(top);
        foliageObjects.forEach(f => wallGroup.add(f));
        
        const targetY = this.wallHeight / 2;
        const hiddenY = -this.wallHeight;
        
        wallGroup.position.set(x, isActive ? targetY : hiddenY, z);
        this.scene.add(wallGroup);
        
        const animatedWall = {
            group: wallGroup,
            hedge: hedge,
            top: top,
            foliage: foliageObjects,
            x: x,
            z: z,
            width: width,
            depth: depth,
            isActive: isActive,
            isAnimating: false,
            animationStartTime: 0,
            startY: isActive ? targetY : hiddenY,
            targetY: isActive ? targetY : hiddenY,
            collisionData: null
        };
        
        this.animatedWalls.push(animatedWall);
        this.obstacles.push(wallGroup);
        
        if (isActive) {
            animatedWall.collisionData = {
                x: x,
                z: z,
                width: width,
                depth: depth,
                type: 'hedge',
                wall: animatedWall
            };
            this.obstacleData.push(animatedWall.collisionData);
        }
        
        hedge.position.y = 0;
        top.position.y = this.wallHeight / 2 + 0.15;
        
        return animatedWall;
    }

    animateWall(wall, shouldRise) {
        if (wall.isAnimating) return;
        
        wall.isAnimating = true;
        wall.animationStartTime = Date.now();
        wall.startY = wall.group.position.y;
        wall.targetY = shouldRise ? this.wallHeight / 2 : -this.wallHeight;
        
        if (shouldRise && !wall.collisionData) {
            wall.collisionData = {
                x: wall.x,
                z: wall.z,
                width: wall.width,
                depth: wall.depth,
                type: 'hedge',
                wall: wall
            };
            this.obstacleData.push(wall.collisionData);
        }
        
        if (!shouldRise && wall.collisionData) {
            setTimeout(() => {
                const index = this.obstacleData.indexOf(wall.collisionData);
                if (index > -1) {
                    this.obstacleData.splice(index, 1);
                }
                wall.collisionData = null;
            }, this.animationDuration);
        }
        
        wall.isActive = shouldRise;
        // OPTIMISATION CRITIQUE : Particules désactivées car elles causent d'énormes freezes
        // Elles créent trop d'objets 3D + animations + requestAnimationFrame
        // this.createWallParticles(wall.x, wall.z, shouldRise);
    }

    // DÉSACTIVÉ pour optimisation - causait des freezes majeurs
    // Les particules créaient des centaines de requestAnimationFrame simultanés
    /*
    createWallParticles(x, z, isRising) {
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: isRising ? 0x4CAF50 : 0x8B4513,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            particle.position.set(
                x + (Math.random() - 0.5) * 2,
                0,
                z + (Math.random() - 0.5) * 2
            );
            
            this.scene.add(particle);
            
            const startTime = Date.now();
            const duration = 1000;
            const velocity = {
                x: (Math.random() - 0.5) * 2,
                y: Math.random() * 3 + 1,
                z: (Math.random() - 0.5) * 2
            };
            
            const animateParticle = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                
                if (progress < 1) {
                    particle.position.x += velocity.x * 0.016;
                    particle.position.y += velocity.y * 0.016;
                    particle.position.z += velocity.z * 0.016;
                    velocity.y -= 9.8 * 0.016;
                    
                    particle.material.opacity = 0.8 * (1 - progress);
                    
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                }
            };
            
            animateParticle();
        }
    }
    */

    update() {
        const now = Date.now();
        
        // Vérifier si des murs sont en train d'animer
        this.isTransforming = false;
        
        this.animatedWalls.forEach(wall => {
            if (wall.isAnimating) {
                this.isTransforming = true; // Au moins un mur bouge
                const elapsed = now - wall.animationStartTime;
                const progress = Math.min(elapsed / this.animationDuration, 1);
                
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                wall.group.position.y = wall.startY + (wall.targetY - wall.startY) * eased;
                
                if (progress >= 1) {
                    wall.isAnimating = false;
                    wall.group.position.y = wall.targetY;
                }
            }
        });
        
        if (this.isLiving && now - this.lastChangeTime > this.changeInterval) {
            this.transformMaze();
            this.lastChangeTime = now;
        }
    }

    transformMaze() {
        console.log('🌿 Le labyrinthe se transforme...');
        
        // Choisir seulement 1-2 murs à faire changer d'état (optimisé pour performances)
        const numChanges = 1 + Math.floor(Math.random() * 2);
        const shuffled = [...this.animatedWalls].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(numChanges, shuffled.length); i++) {
            const wall = shuffled[i];
            if (!wall.isAnimating) {
                this.animateWall(wall, !wall.isActive);
            }
        }
    }

    createTree(x, z) {
        const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3d2817,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: false
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.scene.add(trunk);
        this.obstacles.push(trunk);

        const foliageGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a4d1a,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: false
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(x, 4.5, z);
        foliage.castShadow = true;
        this.scene.add(foliage);
        this.obstacles.push(foliage);

        this.obstacleData.push({
            x: x,
            z: z,
            radius: 1.5,
            type: 'tree'
        });
    }

    createRock(x, z, randomSeed) {
        const scale = 0.8 + randomSeed * 0.6;
        const rockGeometry = new THREE.DodecahedronGeometry(scale, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a4a4a,
            roughness: 0.95,
            metalness: 0.05,
            flatShading: false
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(x, scale * 0.5, z);
        rock.rotation.y = randomSeed * Math.PI * 2;
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
        this.obstacles.push(rock);

        this.obstacleData.push({
            x: x,
            z: z,
            radius: scale * 1.2,
            type: 'rock'
        });
    }

    isPositionValid(position, margin = 1) {
        for (const obstacle of this.obstacleData) {
            if (obstacle.type === 'hedge') {
                const halfWidth = obstacle.width / 2 + margin;
                const halfDepth = obstacle.depth / 2 + margin;
                
                if (position.x >= obstacle.x - halfWidth &&
                    position.x <= obstacle.x + halfWidth &&
                    position.z >= obstacle.z - halfDepth &&
                    position.z <= obstacle.z + halfDepth) {
                    return false;
                }
            } else if (obstacle.type === 'tree' || obstacle.type === 'rock') {
                const dx = position.x - obstacle.x;
                const dz = position.z - obstacle.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < obstacle.radius + margin) {
                    return false;
                }
            }
        }
        return true;
    }

    checkCollision(position, radius = 0.5) {
        let correctedPosition = position.clone();
        let collided = false;
        const originalPosition = position.clone();

        for (const obstacle of this.obstacleData) {
            if (obstacle.type === 'hedge') {
                const halfWidth = obstacle.width / 2 + radius;
                const halfDepth = obstacle.depth / 2 + radius;
                
                if (position.x >= obstacle.x - halfWidth &&
                    position.x <= obstacle.x + halfWidth &&
                    position.z >= obstacle.z - halfDepth &&
                    position.z <= obstacle.z + halfDepth) {
                    
                    collided = true;
                    
                    const dx = position.x - obstacle.x;
                    const dz = position.z - obstacle.z;
                    
                    const overlapX = halfWidth - Math.abs(dx);
                    const overlapZ = halfDepth - Math.abs(dz);
                    
                    // Corriger dans la direction du plus petit chevauchement
                    if (overlapX < overlapZ) {
                        correctedPosition.x = obstacle.x + (dx > 0 ? halfWidth : -halfWidth);
                    } else {
                        correctedPosition.z = obstacle.z + (dz > 0 ? halfDepth : -halfDepth);
                    }
                    
                    // Limiter la distance de correction pour éviter les téléportations
                    const correctionDistance = correctedPosition.distanceTo(originalPosition);
                    const maxCorrection = 5.0; // Maximum 5 unités de correction
                    
                    if (correctionDistance > maxCorrection) {
                        // Si la correction est trop grande, garder la position originale
                        correctedPosition.copy(originalPosition);
                    }
                }
            } else if (obstacle.type === 'tree' || obstacle.type === 'rock') {
                const dx = position.x - obstacle.x;
                const dz = position.z - obstacle.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                const minDistance = obstacle.radius + radius;
                
                if (distance < minDistance) {
                    collided = true;
                    
                    // Éviter division par zéro
                    if (distance < 0.01) {
                        // Si on est exactement sur l'obstacle, pousser dans une direction aléatoire
                        const randomAngle = Math.random() * Math.PI * 2;
                        correctedPosition.x = obstacle.x + Math.cos(randomAngle) * minDistance;
                        correctedPosition.z = obstacle.z + Math.sin(randomAngle) * minDistance;
                    } else {
                        const angle = Math.atan2(dz, dx);
                        correctedPosition.x = obstacle.x + Math.cos(angle) * minDistance;
                        correctedPosition.z = obstacle.z + Math.sin(angle) * minDistance;
                    }
                }
            }
        }

        return { position: correctedPosition, collided: collided };
    }

    getRandomValidPosition(minDistance = 15, maxDistance = 70, maxAttempts = 50) {
        for (let i = 0; i < maxAttempts; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            
            const position = new THREE.Vector3(
                Math.cos(angle) * distance,
                0.3,
                Math.sin(angle) * distance
            );

            if (this.isPositionValid(position, 1.5)) {
                return position;
            }
        }
        
        console.warn('⚠️ Impossible de trouver une position valide');
        return new THREE.Vector3(0, 0.3, 0);
    }

    getRandomBossPosition(playerPosition, minDistance = 30, maxDistance = 65) {
        return this.getRandomValidPosition(minDistance, maxDistance);
    }
}
