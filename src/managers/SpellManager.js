export class SpellManager {
    constructor() {
        this.allSpells = this.initializeSpells();
        this.unlockedSpells = ['protego', 'expelliarmus']; // Sorts de base
        this.equippedSpells = [null, null, null, null]; // 4 slots
        this.currentSpellIndex = 0;
        this.shieldManager = null; // Référence au ShieldManager
        
        // Système de cooldown
        this.cooldowns = {}; // { spellId: endTime }
    }

    initializeSpells() {
        return {
            // Sorts de base
            protego: { 
                name: 'Protego', 
                damage: 0, 
                manaCost: 10, 
                type: 'shield', 
                duration: 3000, 
                invulnerable: true,
                cooldown: 0,
                description: 'Bouclier invulnérable 3s' 
            },
            expelliarmus: { 
                name: 'Expelliarmus', 
                damage: 10, 
                manaCost: 5, 
                type: 'projectile', 
                cooldown: 2000, // 2 secondes de cooldown
                description: 'Désarme l\'ennemi' 
            },
            
            // Boss rewards
            incendio: { 
                name: 'Incendio', 
                damage: 15, 
                manaCost: 15, 
                type: 'dot', 
                dotDamage: 5, 
                dotDuration: 10000, 
                cooldown: 5000,
                description: 'Feu + dégâts/s' 
            },
            stupefix: { 
                name: 'Stupéfix', 
                damage: 50, 
                manaCost: 20, 
                type: 'projectile', 
                stunDuration: 5000,
                cooldown: 7000,
                description: 'Stupéfixe l\'ennemi' 
            },
            protegoMaxima: { 
                name: 'Protego Maxima', 
                damage: 0, 
                manaCost: 30, 
                type: 'shield', 
                duration: 10000, 
                invulnerable: true,
                cooldown: 0,
                description: 'Bouclier invulnérable 10s' 
            },
            sectumsempra: { 
                name: 'Sectumsempra', 
                damage: 200, 
                manaCost: 50, 
                type: 'projectile', 
                cooldown: 10000,
                description: 'Sort mortel' 
            },
            
            // Sorts trouvés
            arrestoMomentum: { 
                name: 'Arresto Momentum', 
                damage: 0, 
                manaCost: 10, 
                type: 'stun', 
                stunDuration: 5000, 
                cooldown: 8000,
                description: 'Ralentit l\'ennemi' 
            },
            bombarda: { 
                name: 'Bombarda', 
                damage: 25, 
                manaCost: 20, 
                type: 'aoe', 
                radius: 5, 
                cooldown: 4000,
                description: 'Explosion' 
            },
            bombardaMaxima: { 
                name: 'Bombarda Maxima', 
                damage: 50, 
                manaCost: 50, 
                type: 'aoe', 
                radius: 15, 
                cooldown: 8000,
                description: 'Grande explosion', 
                requires: 2 
            },
            diffindo: { 
                name: 'Diffindo', 
                damage: 30, 
                manaCost: 25, 
                type: 'projectile', 
                cooldown: 3000,
                description: 'Lacère l\'ennemi' 
            },
            speroPatronum: { 
                name: 'Spero Patronum', 
                damage: 0, 
                manaCost: 50, 
                type: 'shield', 
                duration: 15000, 
                invulnerable: true,
                cooldown: 0,
                description: 'Bouclier Patronus 15s' 
            },
            petrificusTotalus: { 
                name: 'Petrificus Totalus', 
                damage: 10, 
                manaCost: 25, 
                type: 'stun', 
                stunDuration: 7000, // 7 secondes de stun
                cooldown: 6000,
                description: 'Pétrifie l\'ennemi' 
            },
            
            // Sorts impardonnables
            impero: { 
                name: 'Impero', 
                damage: 0, 
                manaCost: 100, 
                type: 'control', 
                duration: 10000, 
                cooldown: 15000,
                description: 'Contrôle mental', 
                forbidden: true 
            },
            endoloris: { 
                name: 'Endoloris', 
                damage: 100, 
                manaCost: 100, 
                type: 'dot', 
                dotDamage: 10, 
                dotDuration: 5000, 
                cooldown: 12000,
                description: 'Torture', 
                forbidden: true 
            },
            avadaKedavra: { 
                name: 'Avada Kedavra', 
                damage: 0, 
                manaCost: 200, 
                type: 'instant', 
                percentDamage: 0.5, 
                cooldown: 20000,
                description: 'Tue instantanément', 
                forbidden: true 
            }
        };
    }

    unlockSpell(spellId) {
        if (!this.unlockedSpells.includes(spellId)) {
            this.unlockedSpells.push(spellId);
        }
    }

    equipSpell(spellId, slotIndex) {
        if (this.unlockedSpells.includes(spellId) && slotIndex >= 0 && slotIndex < 4) {
            this.equippedSpells[slotIndex] = spellId;
            return true;
        }
        return false;
    }

    getEquippedSpell(slotIndex) {
        const spellId = this.equippedSpells[slotIndex];
        return spellId ? this.allSpells[spellId] : null;
    }

    getCurrentSpell() {
        return this.getEquippedSpell(this.currentSpellIndex);
    }

    selectSpell(index) {
        if (index >= 0 && index < 4) {
            this.currentSpellIndex = index;
        }
    }

    setShieldManager(shieldManager) {
        this.shieldManager = shieldManager;
    }

    isOnCooldown(spellId) {
        if (!this.cooldowns[spellId]) return false;
        return Date.now() < this.cooldowns[spellId];
    }

    getCooldownRemaining(spellId) {
        if (!this.cooldowns[spellId]) return 0;
        const remaining = this.cooldowns[spellId] - Date.now();
        return Math.max(0, remaining / 1000); // Retourne en secondes
    }

    startCooldown(spellId, duration) {
        this.cooldowns[spellId] = Date.now() + duration;
    }

    castCurrentSpell(playerMana) {
        const spell = this.getCurrentSpell();
        const spellId = this.equippedSpells[this.currentSpellIndex];
        
        if (!spell) {
            console.log('❌ Aucun sort équipé');
            return { success: false, reason: 'no_spell' };
        }

        // Vérifier le cooldown
        if (this.isOnCooldown(spellId)) {
            const remaining = this.getCooldownRemaining(spellId).toFixed(1);
            console.log(`⏳ ${spell.name} en cooldown (${remaining}s restantes)`);
            return { success: false, reason: 'cooldown', remaining: remaining };
        }

        if (playerMana < spell.manaCost) {
            console.log('❌ Pas assez de mana');
            return { success: false, reason: 'no_mana' };
        }

        // Démarrer le cooldown
        if (spell.cooldown > 0) {
            this.startCooldown(spellId, spell.cooldown);
            console.log(`⏱️ Cooldown de ${spell.cooldown / 1000}s activé pour ${spell.name}`);
        }

        // Si c'est un sort de bouclier, activer le ShieldManager
        if (spell.type === 'shield' && spell.invulnerable && this.shieldManager) {
            this.shieldManager.activate(spell.duration);
            console.log(`✨ ${spell.name} lancé !`);
        }

        return { success: true, spell: spell, manaCost: spell.manaCost, spellId: spellId };
    }
}
