import * as THREE from 'three';

export class Arena {
    constructor(scene, size = 50) {
        this.scene = scene;
        this.size = size;
        this.wallHeight = 5;
        this.wallThickness = 0.5;
        this.walls = [];
        
        this.createFloor();
        this.createWalls();
        this.createLighting();
        
        console.log(`🏟️ Arène créée (${size}x${size}m)`);
    }

    createFloor() {
        // Sol principal
        const floorGeometry = new THREE.PlaneGeometry(this.size, this.size);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2d2d2d,
            roughness: 0.8,
            metalness: 0.2,
            flatShading: false,
            side: THREE.FrontSide
        });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // Bordure du sol (texture différente)
        const borderSize = 2;
        const borderGeometry = new THREE.PlaneGeometry(this.size + borderSize * 2, this.size + borderSize * 2);
        const borderMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: false,
            side: THREE.FrontSide
        });
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.rotation.x = -Math.PI / 2;
        border.position.y = -0.01;
        border.receiveShadow = true;
        this.scene.add(border);
    }

    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a4a4a,
            roughness: 0.7,
            metalness: 0.3,
            flatShading: false,
            side: THREE.FrontSide
        });

        const halfSize = this.size / 2;

        // Mur Nord
        this.createWall(
            0, 
            this.wallHeight / 2, 
            -halfSize,
            this.size + this.wallThickness * 2,
            this.wallHeight,
            this.wallThickness,
            wallMaterial
        );

        // Mur Sud
        this.createWall(
            0, 
            this.wallHeight / 2, 
            halfSize,
            this.size + this.wallThickness * 2,
            this.wallHeight,
            this.wallThickness,
            wallMaterial
        );

        // Mur Est
        this.createWall(
            halfSize, 
            this.wallHeight / 2, 
            0,
            this.wallThickness,
            this.wallHeight,
            this.size,
            wallMaterial
        );

        // Mur Ouest
        this.createWall(
            -halfSize, 
            this.wallHeight / 2, 
            0,
            this.wallThickness,
            this.wallHeight,
            this.size,
            wallMaterial
        );

        // Ajouter des torches décoratives sur les murs
        this.addTorches();
    }

    createWall(x, y, z, width, height, depth, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.walls.push(wall);
        this.scene.add(wall);

        // Ajouter une bordure lumineuse en haut du mur
        const borderGeometry = new THREE.BoxGeometry(width, 0.2, depth);
        const borderMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b7355,
            emissive: 0x8b7355,
            emissiveIntensity: 0.2
        });
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.set(x, height, z);
        this.scene.add(border);
    }

    addTorches() {
        const torchPositions = [
            // Coins
            { x: -this.size / 2 + 2, z: -this.size / 2 + 2 },
            { x: this.size / 2 - 2, z: -this.size / 2 + 2 },
            { x: -this.size / 2 + 2, z: this.size / 2 - 2 },
            { x: this.size / 2 - 2, z: this.size / 2 - 2 },
            // Milieux des murs
            { x: 0, z: -this.size / 2 + 0.5 },
            { x: 0, z: this.size / 2 - 0.5 },
            { x: -this.size / 2 + 0.5, z: 0 },
            { x: this.size / 2 - 0.5, z: 0 },
        ];

        torchPositions.forEach(pos => {
            this.createTorch(pos.x, pos.z);
        });
    }

    createTorch(x, z) {
        // Support de la torche
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, 1, z);
        this.scene.add(pole);

        // Flamme (sphère lumineuse)
        const flameGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6600,
            emissive: 0xff6600,
            emissiveIntensity: 1
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(x, 2.3, z);
        this.scene.add(flame);

        // Lumière de la torche
        const light = new THREE.PointLight(0xff6600, 1, 10);
        light.position.set(x, 2.3, z);
        light.castShadow = true;
        this.scene.add(light);

        // Animation de la flamme
        const animateFlame = () => {
            if (flame) {
                flame.position.y = 2.3 + Math.sin(Date.now() * 0.005) * 0.1;
                light.intensity = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
            }
            requestAnimationFrame(animateFlame);
        };
        animateFlame();
    }

    createLighting() {
        // Lumière ambiante plus sombre pour l'ambiance
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Lumière directionnelle principale
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -this.size;
        directionalLight.shadow.camera.right = this.size;
        directionalLight.shadow.camera.top = this.size;
        directionalLight.shadow.camera.bottom = -this.size;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    checkCollision(position, radius = 0.5) {
        const halfSize = this.size / 2;
        
        // Limiter la position dans les murs
        let correctedPosition = position.clone();
        let collided = false;

        if (position.x < -halfSize + radius) {
            correctedPosition.x = -halfSize + radius;
            collided = true;
        }
        if (position.x > halfSize - radius) {
            correctedPosition.x = halfSize - radius;
            collided = true;
        }
        if (position.z < -halfSize + radius) {
            correctedPosition.z = -halfSize + radius;
            collided = true;
        }
        if (position.z > halfSize - radius) {
            correctedPosition.z = halfSize - radius;
            collided = true;
        }

        return { position: correctedPosition, collided: collided };
    }

    isInsideArena(position, margin = 0) {
        const halfSize = this.size / 2 - margin;
        return position.x >= -halfSize && position.x <= halfSize &&
               position.z >= -halfSize && position.z <= halfSize;
    }
}
