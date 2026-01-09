export class SpellControls {
    constructor(spellManager, spellUI, spellWheel, shieldManager, isVR = false) {
        this.spellManager = spellManager;
        this.spellUI = spellUI;
        this.spellWheel = spellWheel;
        this.shieldManager = shieldManager;
        this.isVR = isVR;
        
        this.setupControls();
    }

    setupControls() {
        if (this.isVR) {
            this.setupVRControls();
        } else {
            this.setupDesktopControls();
        }
    }

    setupDesktopControls() {
        document.addEventListener('keydown', (e) => {
            // Sélection rapide des sorts (1-4)
            if (e.key >= '1' && e.key <= '4') {
                const index = parseInt(e.key) - 1;
                this.spellUI.highlightSpell(index);
            }

            // Ouvrir/fermer la roue de configuration (E)
            if (e.key.toLowerCase() === 'e') {
                this.spellWheel.toggle();
            }
        });
    }

    setupVRControls() {
        // À implémenter avec les contrôleurs VR
        // Gâchettes pour ouvrir la roue
        // A, B, X, Y pour sélection rapide
        console.log('VR controls to be implemented with VR controllers');
    }

    castSpell(playerMana) {
        const spell = this.spellManager.getCurrentSpell();
        
        if (!spell) {
            console.log('Aucun sort équipé');
            return null;
        }

        if (playerMana < spell.manaCost) {
            console.log('Pas assez de mana');
            return null;
        }

        // Si c'est un sort de bouclier, activer le ShieldManager
        if (spell.type === 'shield' && spell.invulnerable && this.shieldManager) {
            this.shieldManager.activate(spell.duration);
        }

        return spell;
    }
}
