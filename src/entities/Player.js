import { ShieldManager } from '../managers/ShieldManager.js';

export class Player {
    constructor() {
        // ...existing code...
        this.shieldManager = new ShieldManager(this);
    }

    takeDamage(amount) {
        // Vérifier si le bouclier est actif
        if (!this.shieldManager.canTakeDamage()) {
            console.log('Dégâts bloqués par le bouclier !');
            return 0; // Aucun dégât pris
        }

        // ...existing code pour appliquer les dégâts normalement...
        const actualDamage = amount; // Calculer avec défense, etc.
        this.health -= actualDamage;
        
        return actualDamage;
    }

    update(deltaTime) {
        // ...existing code...
        
        // Mettre à jour le bouclier
        this.shieldManager.update();
        
        // ...existing code...
    }
}