export class SpellUI {
    constructor(spellManager, shieldManager = null, player = null) {
        this.spellManager = spellManager;
        this.shieldManager = shieldManager;
        this.player = player;
        this.createUI();
        this.createShieldIndicator();
        this.createBoostIndicators();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'spell-ui';
        this.container.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            z-index: 100;
        `;

        for (let i = 0; i < 4; i++) {
            const spellSlot = document.createElement('div');
            spellSlot.className = 'spell-ui-slot';
            spellSlot.dataset.index = i;
            spellSlot.style.cssText = `
                width: 70px;
                height: 70px;
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid #555;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 11px;
                transition: all 0.2s;
                position: relative;
            `;

            const key = document.createElement('div');
            key.textContent = i + 1;
            key.style.cssText = 'color: #ffd700; font-weight: bold; margin-bottom: 5px;';
            spellSlot.appendChild(key);

            const name = document.createElement('div');
            name.className = 'spell-ui-name';
            name.style.cssText = 'text-align: center; font-size: 9px;';
            spellSlot.appendChild(name);

            const mana = document.createElement('div');
            mana.className = 'spell-ui-mana';
            mana.style.cssText = 'color: #00ffff; font-size: 8px;';
            spellSlot.appendChild(mana);

            // Overlay de cooldown
            const cooldownOverlay = document.createElement('div');
            cooldownOverlay.className = 'spell-ui-cooldown';
            cooldownOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 10px;
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                color: #ff6666;
            `;
            spellSlot.appendChild(cooldownOverlay);

            this.container.appendChild(spellSlot);
        }

        document.body.appendChild(this.container);
    }

    createShieldIndicator() {
        this.shieldIndicator = document.createElement('div');
        this.shieldIndicator.id = 'shield-indicator';
        this.shieldIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            background: rgba(65, 105, 225, 0.8);
            border: 2px solid #4169e1;
            border-radius: 20px;
            color: white;
            font-weight: bold;
            display: none;
            z-index: 101;
        `;
        document.body.appendChild(this.shieldIndicator);
    }

    createBoostIndicators() {
        // Conteneur pour les boosts
        this.boostContainer = document.createElement('div');
        this.boostContainer.id = 'boost-indicators';
        this.boostContainer.style.cssText = `
            position: fixed;
            top: 80px;
            left: 20px;
            z-index: 101;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        // Indicateur d'attaque
        this.attackBoostIndicator = document.createElement('div');
        this.attackBoostIndicator.style.cssText = `
            padding: 10px 15px;
            background: rgba(153, 0, 255, 0.8);
            border: 2px solid #9900ff;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            font-size: 14px;
            display: none;
        `;
        this.boostContainer.appendChild(this.attackBoostIndicator);

        // Indicateur de défense
        this.defenseBoostIndicator = document.createElement('div');
        this.defenseBoostIndicator.style.cssText = `
            padding: 10px 15px;
            background: rgba(0, 255, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            font-size: 14px;
            display: none;
        `;
        this.boostContainer.appendChild(this.defenseBoostIndicator);

        document.body.appendChild(this.boostContainer);
    }

    update() {
        const slots = this.container.querySelectorAll('.spell-ui-slot');
        
        slots.forEach((slot, index) => {
            const spellId = this.spellManager.equippedSpells[index];
            const spell = this.spellManager.getEquippedSpell(index);
            const name = slot.querySelector('.spell-ui-name');
            const mana = slot.querySelector('.spell-ui-mana');
            const cooldownOverlay = slot.querySelector('.spell-ui-cooldown');

            if (spell) {
                name.textContent = spell.name;
                mana.textContent = `${spell.manaCost} mana`;
                slot.style.borderColor = index === this.spellManager.currentSpellIndex ? '#ffd700' : '#555';
                slot.style.transform = index === this.spellManager.currentSpellIndex ? 'scale(1.1)' : 'scale(1)';
                
                // Afficher le cooldown
                if (this.spellManager.isOnCooldown(spellId)) {
                    const remaining = this.spellManager.getCooldownRemaining(spellId);
                    cooldownOverlay.textContent = remaining.toFixed(1);
                    cooldownOverlay.style.display = 'flex';
                } else {
                    cooldownOverlay.style.display = 'none';
                }
            } else {
                name.textContent = 'Vide';
                mana.textContent = '';
                slot.style.borderColor = '#555';
                cooldownOverlay.style.display = 'none';
            }
        });

        // Mettre à jour l'indicateur de bouclier
        if (this.shieldManager && this.shieldManager.isActive) {
            const timeLeft = this.shieldManager.getRemainingTime().toFixed(1);
            this.shieldIndicator.textContent = `🛡️ Bouclier actif : ${timeLeft}s`;
            this.shieldIndicator.style.display = 'block';
        } else {
            this.shieldIndicator.style.display = 'none';
        }

        // Mettre à jour les indicateurs de boost
        if (this.player) {
            const now = Date.now();
            
            // Boost d'attaque
            if (this.player.attackBoostEndTime > now) {
                const remaining = ((this.player.attackBoostEndTime - now) / 1000).toFixed(1);
                this.attackBoostIndicator.textContent = `⚔️ Attaque x${this.player.attackBoost} : ${remaining}s`;
                this.attackBoostIndicator.style.display = 'block';
            } else {
                this.attackBoostIndicator.style.display = 'none';
            }
            
            // Boost de défense
            if (this.player.defenseBoostEndTime > now) {
                const remaining = ((this.player.defenseBoostEndTime - now) / 1000).toFixed(1);
                this.defenseBoostIndicator.textContent = `🛡️ Défense x${this.player.defenseBoost} : ${remaining}s`;
                this.defenseBoostIndicator.style.display = 'block';
            } else {
                this.defenseBoostIndicator.style.display = 'none';
            }
        }
    }

    highlightSpell(index) {
        this.spellManager.selectSpell(index);
        this.update();
    }
}
