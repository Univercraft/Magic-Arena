export class SpellWheel {
    constructor(spellManager) {
        this.spellManager = spellManager;
        this.isOpen = false;
        this.selectedSlot = null;
        this.createWheel();
    }

    createWheel() {
        // Container principal
        this.wheelContainer = document.createElement('div');
        this.wheelContainer.id = 'spell-wheel';
        this.wheelContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            z-index: 1000;
            overflow-y: auto;
            cursor: default;
        `;

        // Contenu principal
        const content = document.createElement('div');
        content.style.cssText = `
            max-width: 1200px;
            margin: 50px auto;
            padding: 20px;
        `;

        // Titre
        const title = document.createElement('div');
        title.style.cssText = `
            text-align: center;
            color: #ffd700;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        `;
        title.textContent = '⚡ Configuration des Sorts ⚡';
        content.appendChild(title);

        // Instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            text-align: center;
            color: white;
            font-size: 16px;
            margin-bottom: 30px;
        `;
        instructions.innerHTML = `
            Cliquez sur un slot (1-4) pour le configurer<br>
            <small style="color: #aaa;">Appuyez sur Q pour fermer</small>
        `;
        content.appendChild(instructions);

        // Zone des 4 slots configurables
        this.slotsArea = this.createSlotsArea();
        content.appendChild(this.slotsArea);

        // Zone de sélection des sorts
        this.spellSelection = this.createSpellSelection();
        content.appendChild(this.spellSelection);

        this.wheelContainer.appendChild(content);
        document.body.appendChild(this.wheelContainer);
    }

    createSlotsArea() {
        const area = document.createElement('div');
        area.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        `;

        for (let i = 0; i < 4; i++) {
            const slot = document.createElement('div');
            slot.className = 'config-slot';
            slot.dataset.slotIndex = i;
            slot.style.cssText = `
                width: 150px;
                height: 180px;
                background: linear-gradient(145deg, rgba(50, 50, 50, 0.9), rgba(30, 30, 30, 0.9));
                border: 3px solid #ffd700;
                border-radius: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s;
                padding: 15px;
            `;

            const keyLabel = document.createElement('div');
            keyLabel.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                width: 30px;
                height: 30px;
                background: #ffd700;
                color: black;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 16px;
            `;
            keyLabel.textContent = i + 1;

            const slotContent = document.createElement('div');
            slotContent.className = 'slot-content';
            slotContent.style.cssText = `
                text-align: center;
                width: 100%;
            `;

            const spellName = document.createElement('div');
            spellName.className = 'slot-spell-name';
            spellName.style.cssText = `
                color: white;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 10px;
                min-height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            spellName.textContent = 'Vide';

            const spellInfo = document.createElement('div');
            spellInfo.className = 'slot-spell-info';
            spellInfo.style.cssText = `
                color: #aaa;
                font-size: 11px;
            `;

            slotContent.appendChild(spellName);
            slotContent.appendChild(spellInfo);

            slot.style.position = 'relative';
            slot.appendChild(keyLabel);
            slot.appendChild(slotContent);

            slot.addEventListener('click', () => this.selectSlot(i));
            slot.addEventListener('mouseenter', () => {
                if (this.selectedSlot !== i) {
                    slot.style.transform = 'scale(1.05)';
                    slot.style.borderColor = '#ffff00';
                }
            });
            slot.addEventListener('mouseleave', () => {
                if (this.selectedSlot !== i) {
                    slot.style.transform = 'scale(1)';
                    slot.style.borderColor = '#ffd700';
                }
            });

            area.appendChild(slot);
        }

        return area;
    }

    createSpellSelection() {
        const container = document.createElement('div');
        container.style.cssText = `
            display: none;
            background: rgba(20, 20, 20, 0.95);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            color: #ffd700;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
        `;
        header.textContent = 'Sélectionnez un sort';
        container.appendChild(header);

        const spellGrid = document.createElement('div');
        spellGrid.className = 'spell-grid';
        spellGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        `;

        container.appendChild(spellGrid);
        return container;
    }

    selectSlot(slotIndex) {
        this.selectedSlot = slotIndex;
        this.updateSlotHighlight();
        this.showSpellSelection();
    }

    updateSlotHighlight() {
        const slots = this.slotsArea.querySelectorAll('.config-slot');
        slots.forEach((slot, index) => {
            if (index === this.selectedSlot) {
                slot.style.borderColor = '#00ff00';
                slot.style.transform = 'scale(1.1)';
                slot.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
            } else {
                slot.style.borderColor = '#ffd700';
                slot.style.transform = 'scale(1)';
                slot.style.boxShadow = 'none';
            }
        });
    }

    showSpellSelection() {
        const grid = this.spellSelection.querySelector('.spell-grid');
        grid.innerHTML = '';

        // Afficher tous les sorts débloqués
        this.spellManager.unlockedSpells.forEach(spellId => {
            const spell = this.spellManager.allSpells[spellId];
            
            const spellCard = document.createElement('div');
            spellCard.className = 'spell-card';
            spellCard.style.cssText = `
                background: linear-gradient(145deg, rgba(60, 60, 60, 0.9), rgba(40, 40, 40, 0.9));
                border: 2px solid #555;
                border-radius: 10px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s;
            `;

            spellCard.innerHTML = `
                <div style="color: #ffd700; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                    ${spell.name}
                </div>
                <div style="color: #00ffff; font-size: 12px; margin-bottom: 5px;">
                    ${spell.manaCost} mana
                </div>
                <div style="color: #aaa; font-size: 11px; margin-bottom: 8px;">
                    ${spell.description}
                </div>
                ${spell.cooldown > 0 ? `
                    <div style="color: #ff6666; font-size: 10px;">
                        ⏱️ Cooldown: ${spell.cooldown / 1000}s
                    </div>
                ` : ''}
            `;

            spellCard.addEventListener('click', () => {
                this.assignSpell(spellId);
            });

            spellCard.addEventListener('mouseenter', () => {
                spellCard.style.borderColor = '#ffd700';
                spellCard.style.transform = 'scale(1.05)';
                spellCard.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.3)';
            });

            spellCard.addEventListener('mouseleave', () => {
                spellCard.style.borderColor = '#555';
                spellCard.style.transform = 'scale(1)';
                spellCard.style.boxShadow = 'none';
            });

            grid.appendChild(spellCard);
        });

        this.spellSelection.style.display = 'block';
    }

    assignSpell(spellId) {
        if (this.selectedSlot !== null) {
            this.spellManager.equipSpell(spellId, this.selectedSlot);
            this.updateSlots();
            this.spellSelection.style.display = 'none';
            this.selectedSlot = null;
            this.updateSlotHighlight();
            
            const spell = this.spellManager.allSpells[spellId];
            console.log(`✅ ${spell.name} assigné au slot ${this.selectedSlot + 1}`);
        }
    }

    updateSlots() {
        const slots = this.slotsArea.querySelectorAll('.config-slot');
        slots.forEach((slot, index) => {
            const spellId = this.spellManager.equippedSpells[index];
            const spellName = slot.querySelector('.slot-spell-name');
            const spellInfo = slot.querySelector('.slot-spell-info');
            
            if (spellId) {
                const spell = this.spellManager.allSpells[spellId];
                spellName.textContent = spell.name;
                spellInfo.innerHTML = `
                    <div style="color: #00ffff; margin-bottom: 3px;">${spell.manaCost} mana</div>
                    <div style="color: #aaa; font-size: 10px;">${spell.description}</div>
                    ${spell.cooldown > 0 ? `<div style="color: #ff6666; margin-top: 3px; font-size: 10px;">⏱️ ${spell.cooldown / 1000}s</div>` : ''}
                `;
                slot.style.background = 'linear-gradient(145deg, rgba(50, 100, 50, 0.9), rgba(30, 70, 30, 0.9))';
            } else {
                spellName.textContent = 'Vide';
                spellInfo.innerHTML = '<div style="color: #666; font-size: 10px;">Cliquez pour assigner</div>';
                slot.style.background = 'linear-gradient(145deg, rgba(50, 50, 50, 0.9), rgba(30, 30, 30, 0.9))';
            }
        });
    }

    show() {
        this.isOpen = true;
        this.wheelContainer.style.display = 'block';
        document.body.style.cursor = 'default';
        this.updateSlots();
        this.spellSelection.style.display = 'none';
        this.selectedSlot = null;
    }

    hide() {
        this.isOpen = false;
        this.wheelContainer.style.display = 'none';
        this.spellSelection.style.display = 'none';
        this.selectedSlot = null;
        this.updateSlotHighlight();
    }

    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }
}
