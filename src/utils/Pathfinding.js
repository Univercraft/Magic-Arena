import * as THREE from 'three';

/**
 * Système de pathfinding A* pour navigation dans le labyrinthe
 */
export class Pathfinding {
    constructor(obstacleManager, arenaSize = 100, gridResolution = 2) {
        this.obstacleManager = obstacleManager;
        this.arenaSize = arenaSize;
        this.gridResolution = gridResolution; // Taille d'une cellule de grille
        this.gridSize = Math.ceil(arenaSize / gridResolution);
        this.grid = null;
        this.lastGridUpdate = 0;
        this.gridUpdateInterval = 999999999; // Désactivé - ne plus reconstruire la grille (optimisation)
        
        this.buildNavigationGrid();
    }

    /**
     * Construire la grille de navigation basée sur les obstacles
     */
    buildNavigationGrid() {
        const halfSize = this.arenaSize / 2;
        this.grid = [];
        
        for (let x = 0; x < this.gridSize; x++) {
            this.grid[x] = [];
            for (let z = 0; z < this.gridSize; z++) {
                // Convertir la position de grille en position monde
                const worldX = (x * this.gridResolution) - halfSize;
                const worldZ = (z * this.gridResolution) - halfSize;
                const worldPos = new THREE.Vector3(worldX, 0, worldZ);
                
                // Vérifier si cette position est bloquée par un obstacle
                const isWalkable = this.isPositionWalkable(worldPos);
                
                this.grid[x][z] = {
                    walkable: isWalkable,
                    x: x,
                    z: z,
                    worldX: worldX,
                    worldZ: worldZ
                };
            }
        }
        
        this.lastGridUpdate = Date.now();
        console.log(`🗺️ Grille de navigation construite: ${this.gridSize}x${this.gridSize}`);
    }

    /**
     * Vérifier si une position est accessible (pas d'obstacle)
     */
    isPositionWalkable(position) {
        if (!this.obstacleManager) return true;
        
        // Vérifier contre les obstacles
        const testRadius = 0.8; // Rayon de sécurité
        for (const obstacle of this.obstacleManager.obstacleData) {
            const dx = position.x - obstacle.x;
            const dz = position.z - obstacle.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < (obstacle.radius + testRadius)) {
                return false; // Collision détectée
            }
        }
        
        // Vérifier contre les murs animés
        for (const wall of this.obstacleManager.animatedWalls) {
            if (!wall.isActive) continue; // Mur descendu = pas d'obstacle
            
            const wallBox = new THREE.Box3().setFromObject(wall.group);
            const testPoint = new THREE.Vector3(position.x, 1, position.z);
            
            if (wallBox.containsPoint(testPoint)) {
                return false;
            }
            
            // Vérifier aussi une petite marge autour
            const expanded = wallBox.clone().expandByScalar(testRadius);
            if (expanded.containsPoint(testPoint)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Convertir une position monde en coordonnées de grille
     */
    worldToGrid(worldPos) {
        const halfSize = this.arenaSize / 2;
        const x = Math.floor((worldPos.x + halfSize) / this.gridResolution);
        const z = Math.floor((worldPos.z + halfSize) / this.gridResolution);
        
        // Clamper dans les limites de la grille
        return {
            x: Math.max(0, Math.min(this.gridSize - 1, x)),
            z: Math.max(0, Math.min(this.gridSize - 1, z))
        };
    }

    /**
     * Obtenir les voisins d'une cellule
     */
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, z: -1 },  // Nord
            { x: 1, z: 0 },   // Est
            { x: 0, z: 1 },   // Sud
            { x: -1, z: 0 },  // Ouest
            { x: 1, z: -1 },  // Nord-Est
            { x: 1, z: 1 },   // Sud-Est
            { x: -1, z: 1 },  // Sud-Ouest
            { x: -1, z: -1 }  // Nord-Ouest
        ];
        
        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newZ = node.z + dir.z;
            
            if (newX >= 0 && newX < this.gridSize && newZ >= 0 && newZ < this.gridSize) {
                const neighbor = this.grid[newX][newZ];
                if (neighbor.walkable) {
                    // Pour les diagonales, vérifier que les cellules adjacentes sont aussi libres
                    if (dir.x !== 0 && dir.z !== 0) {
                        const checkX = this.grid[node.x + dir.x][node.z];
                        const checkZ = this.grid[node.x][node.z + dir.z];
                        if (checkX.walkable && checkZ.walkable) {
                            neighbors.push(neighbor);
                        }
                    } else {
                        neighbors.push(neighbor);
                    }
                }
            }
        }
        
        return neighbors;
    }

    /**
     * Heuristique pour A* (distance de Manhattan)
     */
    heuristic(nodeA, nodeB) {
        const dx = Math.abs(nodeA.x - nodeB.x);
        const dz = Math.abs(nodeA.z - nodeB.z);
        // Distance de Chebyshev pour permettre les diagonales
        return Math.max(dx, dz) + (Math.sqrt(2) - 1) * Math.min(dx, dz);
    }

    /**
     * Algorithme A* pour trouver le chemin
     */
    findPath(startPos, endPos) {
        // Mettre à jour la grille périodiquement (pour les murs qui changent)
        const now = Date.now();
        if (now - this.lastGridUpdate > this.gridUpdateInterval) {
            this.buildNavigationGrid();
        }
        
        const startGrid = this.worldToGrid(startPos);
        const endGrid = this.worldToGrid(endPos);
        
        const startNode = this.grid[startGrid.x][startGrid.z];
        const endNode = this.grid[endGrid.x][endGrid.z];
        
        // Vérifier que le début et la fin sont accessibles
        if (!startNode.walkable || !endNode.walkable) {
            return null; // Pas de chemin possible
        }
        
        const openSet = [startNode];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(startNode, 0);
        fScore.set(startNode, this.heuristic(startNode, endNode));
        
        while (openSet.length > 0) {
            // Trouver le nœud avec le plus petit fScore
            let current = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (fScore.get(openSet[i]) < fScore.get(current)) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            // Si on a atteint la destination
            if (current === endNode) {
                return this.reconstructPath(cameFrom, current);
            }
            
            // Retirer current de openSet
            openSet.splice(currentIndex, 1);
            closedSet.add(current);
            
            // Examiner les voisins
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor)) continue;
                
                // Coût pour aller au voisin
                const dx = Math.abs(current.x - neighbor.x);
                const dz = Math.abs(current.z - neighbor.z);
                const moveCost = (dx !== 0 && dz !== 0) ? Math.sqrt(2) : 1;
                const tentativeGScore = gScore.get(current) + moveCost;
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(neighbor)) {
                    continue;
                }
                
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, endNode));
            }
        }
        
        // Pas de chemin trouvé
        return null;
    }

    /**
     * Reconstruire le chemin depuis la map cameFrom
     */
    reconstructPath(cameFrom, current) {
        const path = [new THREE.Vector3(current.worldX, 0, current.worldZ)];
        
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.unshift(new THREE.Vector3(current.worldX, 0, current.worldZ));
        }
        
        // Simplifier le chemin (enlever les points intermédiaires en ligne droite)
        return this.smoothPath(path);
    }

    /**
     * Lisser le chemin pour enlever les points inutiles
     */
    smoothPath(path) {
        if (path.length <= 2) return path;
        
        const smoothed = [path[0]];
        let current = 0;
        
        while (current < path.length - 1) {
            // Essayer de trouver le point le plus loin qu'on peut atteindre en ligne droite
            let farthest = current + 1;
            
            for (let i = path.length - 1; i > current + 1; i--) {
                if (this.hasLineOfSight(path[current], path[i])) {
                    farthest = i;
                    break;
                }
            }
            
            smoothed.push(path[farthest]);
            current = farthest;
        }
        
        return smoothed;
    }

    /**
     * Vérifier s'il y a une ligne de vue directe entre deux points
     */
    hasLineOfSight(from, to) {
        const steps = Math.ceil(from.distanceTo(to) / this.gridResolution);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const checkPos = new THREE.Vector3(
                from.x + (to.x - from.x) * t,
                0,
                from.z + (to.z - from.z) * t
            );
            
            if (!this.isPositionWalkable(checkPos)) {
                return false;
            }
        }
        
        return true;
    }
}
