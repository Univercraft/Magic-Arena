import { Potion } from '../entities/Potion.js';
import { SpellPickup } from '../entities/SpellPickup.js';
import * as THREE from 'three';

export class PotionManager {
    constructor(scene, player, spellManager = null, obstacleManager = null) {
        this.scene = scene;
        this.player = player;
        this.spellManager = spellManager;
        this.obstacleManager = obstacleManager;
        this.potions = [];
        this.potionTypes = ['health', 'mana', 'attack', 'defense'];
        this.collectionRadius = 1.5;
        this.maxPotions = 5; // Maximum de potions sur le terrain
        
        // Système de spawn progressif
        this.potionsToSpawn = [];
        this.spawnInterval = 5000; // 5 secondes entre chaque potion
        this.lastSpawnTime = 0;
        this.autoSpawn = true; // Activer le spawn automatique
        
        // Système de sorts au sol
        this.spellPickups = [];
        this.availableSpells = ['arresto', 'bombarda', 'diffindo', 'patronum', 'petrificus'];
        this.maxSpellsPerGame = 5; // Maximum 5 sorts par partie
        this.spellsSpawned = 0; // Compteur de sorts apparus
        this.currentBossIndex = 0; // Index du boss actuel
        this.disableSpellPickups = false; // Désactiver les pickups de sorts (mode infini)
        this.spawnedSpells = new Set(); // Tracker les sorts déjà apparus (sauf bombarda)
    }
    
    setSpellManager(spellManager) {
        this.spellManager = spellManager;
    }

    setBossIndex(index) {
        this.currentBossIndex = index;
        console.log(`🎯 Boss index: ${index}`);
    }

    spawnPotions(count = 4) {
        // Calculer combien de potions on peut ajouter
        const currentPotionsCount = this.potions.length + this.potionsToSpawn.length;
        const availableSlots = this.maxPotions - currentPotionsCount;
        
        if (availableSlots <= 0) {
            console.log(`🧪 Terrain plein (${this.maxPotions} potions maximum). Aucune nouvelle potion ajoutée.`);
            return;
        }
        
        // Limiter le nombre de potions à ajouter
        const potionsToAdd = Math.min(count, availableSlots);
        
        console.log(`🧪 Ajout de ${potionsToAdd} potions à la file (${currentPotionsCount}/${this.maxPotions} actuellement)`);

        // Créer la liste des potions à spawner
        for (let i = 0; i < potionsToAdd; i++) {
            const randomType = this.potionTypes[Math.floor(Math.random() * this.potionTypes.length)];
            
            // Utiliser l'ObstacleManager pour trouver une position valide
            let position;
            if (this.obstacleManager) {
                position = this.obstacleManager.getRandomValidPosition(5, 20);
            } else {
                const angle = Math.random() * Math.PI * 2;
                const distance = 5 + Math.random() * 10;
                position = new THREE.Vector3(
                    Math.cos(angle) * distance,
                    0.3,
                    Math.sin(angle) * distance
                );
            }

            this.potionsToSpawn.push({ type: randomType, position: position });
        }

        // Si c'est le premier spawn, commencer immédiatement
        if (this.potions.length === 0 && this.lastSpawnTime === 0) {
            this.lastSpawnTime = Date.now();
        } else {
            this.lastSpawnTime = Date.now();
        }
    }

    tryAutoSpawn() {
        // Vérifier s'il y a de la place pour plus de potions
        const currentTotal = this.potions.length + this.potionsToSpawn.length;
        
        if (currentTotal < this.maxPotions && this.autoSpawn) {
            // Calculer combien de potions manquent
            const needed = this.maxPotions - currentTotal;
            
            if (needed > 0) {
                // Déterminer si on spawn un sort ou une potion
                const shouldSpawnSpell = this.shouldSpawnSpell();
                
                // Utiliser l'ObstacleManager pour trouver une position valide
                let position;
                if (this.obstacleManager) {
                    position = this.obstacleManager.getRandomValidPosition(5, 20);
                } else {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 5 + Math.random() * 10;
                    position = new THREE.Vector3(
                        Math.cos(angle) * distance,
                        0.3,
                        Math.sin(angle) * distance
                    );
                }

                if (shouldSpawnSpell) {
                    const randomSpell = this.availableSpells[Math.floor(Math.random() * this.availableSpells.length)];
                    this.potionsToSpawn.push({ type: 'spell', spellName: randomSpell, position: position });
                    this.spellsSpawned++;
                    console.log(`🔄 Auto-spawn: nouveau sort ${randomSpell} ajouté à la file (${this.spellsSpawned}/${this.maxSpellsPerGame} sorts)`);
                } else {
                    const randomType = this.potionTypes[Math.floor(Math.random() * this.potionTypes.length)];
                    this.potionsToSpawn.push({ type: randomType, position: position });
                    console.log(`🔄 Auto-spawn: nouvelle potion ajoutée à la file (${currentTotal + 1}/${this.maxPotions})`);
                }
            }
        }
    }

    shouldSpawnSpell() {
        // Ne pas spawner de sorts en mode infini
        if (this.disableSpellPickups) {
            return false;
        }
        
        // Ne pas spawner de sort avant le 2ème boss (index >= 1)
        if (this.currentBossIndex < 1) {
            return false;
        }
        
        // Ne pas dépasser la limite de 5 sorts par partie
        if (this.spellsSpawned >= this.maxSpellsPerGame) {
            return false;
        }
        
        // 20% de chance de spawner un sort au lieu d'une potion
        return Math.random() < 0.2;
    }

    update(delta) {
        // Essayer de remplir automatiquement jusqu'à 5 potions
        this.tryAutoSpawn();

        // Spawner progressivement les potions/sorts si la limite n'est pas atteinte
        if (this.potionsToSpawn.length > 0 && this.potions.length < this.maxPotions) {
            const now = Date.now();
            if (now - this.lastSpawnTime >= this.spawnInterval) {
                const itemData = this.potionsToSpawn.shift();
                
                if (itemData.type === 'spell') {
                    // Vérifier si le sort peut apparaître (sauf bombarda qui peut apparaître plusieurs fois)
                    if (itemData.spellName !== 'bombarda' && this.spawnedSpells.has(itemData.spellName)) {
                        console.log(`⚠️ Sort ${itemData.spellName} déjà apparu, conversion en potion`);
                        // Convertir en potion si le sort a déjà été spawné
                        const randomType = this.potionTypes[Math.floor(Math.random() * this.potionTypes.length)];
                        const potion = new Potion(this.scene, randomType, itemData.position);
                        this.potions.push(potion);
                    } else {
                        // Spawner un sort
                        const spell = new SpellPickup(this.scene, itemData.spellName, itemData.position);
                        this.spellPickups.push(spell);
                        if (itemData.spellName !== 'bombarda') {
                            this.spawnedSpells.add(itemData.spellName);
                        }
                        console.log(`✨ Sort ${spell.config.displayName} apparu ! (${this.spellsSpawned}/${this.maxSpellsPerGame} sorts au total)`);
                    }
                } else {
                    // Spawner une potion
                    const potion = new Potion(this.scene, itemData.type, itemData.position);
                    this.potions.push(potion);
                    console.log(`🧪 Potion ${potion.config.name} apparue ! (${this.potions.length}/${this.maxPotions} sur le terrain, ${this.potionsToSpawn.length} en attente)`);
                }
                
                this.lastSpawnTime = now;
            }
        }

        // Mettre à jour toutes les potions existantes
        for (let i = this.potions.length - 1; i >= 0; i--) {
            const potion = this.potions[i];
            
            if (potion.collected) {
                this.potions.splice(i, 1);
                console.log(`✅ Potion collectée (${this.potions.length}/${this.maxPotions} restantes sur le terrain)`);
                continue;
            }

            potion.update(delta);

            // Vérifier la distance avec le joueur (marcher dessus)
            const distance = potion.getDistanceTo(this.player.camera.position);
            
            if (distance < this.collectionRadius) {
                this.collectPotion(potion);
            }
        }
        
        // Mettre à jour tous les sorts au sol
        for (let i = this.spellPickups.length - 1; i >= 0; i--) {
            const spell = this.spellPickups[i];
            
            if (spell.collected) {
                this.spellPickups.splice(i, 1);
                console.log(`✅ Sort collecté (${this.spellPickups.length} sorts restants)`);
                continue;
            }

            spell.update(delta);

            // Vérifier la distance avec le joueur
            const distance = spell.getDistanceTo(this.player.camera.position);
            
            if (distance < this.collectionRadius) {
                this.collectSpell(spell);
            }
        }
    }

    collectPotion(potion) {
        const config = potion.collect();
        if (!config) return;

        this.applyPotionEffect(config);
        this.showCollectionNotification(config);
    }

    collectSpell(spell) {
        const data = spell.collect();
        if (!data) return;

        this.applySpellEffect(data.spellName, data.config);
        this.showSpellCollectionNotification(data.config);
    }

    applySpellEffect(spellName, config) {
        if (!this.spellManager) {
            console.error('⚠️ SpellManager non défini !');
            return;
        }
        
        // Correspondance des noms de sorts entre SpellPickup et SpellManager
        const spellMapping = {
            'arresto': 'arrestoMomentum',
            'bombarda': 'bombarda',
            'bombardaMax': 'bombardaMaxima',
            'diffindo': 'diffindo',
            'patronum': 'speroPatronum',
            'petrificus': 'petrificusTotalus'
        };
        
        const spellId = spellMapping[spellName];
        
        // Vérifier si c'est Bombarda Maxima
        if (spellName === 'bombardaMax') {
            // Vérifier si le joueur a 2x Bombarda
            const bombardaCount = this.spellManager.unlockedSpells.filter(s => s === 'bombarda').length;
            if (bombardaCount < 2) {
                console.log('⚠️ Bombarda Maxima nécessite 2x Bombarda ! Converti en Bombarda.');
                spellName = 'bombarda';
            }
        }
        
        // Ajouter le sort au SpellManager
        this.spellManager.unlockSpell(spellId);
        console.log(`✨ Sort ${config.displayName} débloqué ! Total: ${this.spellManager.unlockedSpells.length} sorts`);
        
        // Dispatcher un event pour mettre à jour l'UI
        window.dispatchEvent(new CustomEvent('spellUnlocked', { 
            detail: { spellName: spellId, displayName: config.displayName } 
        }));
    }

    showSpellCollectionNotification(config) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(${this.getColorRGB(config.color)}, 0.95), rgba(${this.getColorRGB(config.color)}, 0.7));
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 18px;
            font-weight: bold;
            z-index: 1500;
            box-shadow: 0 0 30px rgba(${this.getColorRGB(config.color)}, 0.8), 0 0 60px rgba(${this.getColorRGB(config.color)}, 0.4);
            animation: spellCollect 3s ease-out;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
            border: 2px solid rgba(255, 255, 255, 0.3);
        `;
        notification.innerHTML = `✨ <strong>${config.displayName}</strong> ✨<br><small>${config.description}</small>`;
        document.body.appendChild(notification);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spellCollect {
                0% { opacity: 0; top: 100px; transform: translateX(-50%) scale(0.5); }
                20% { opacity: 1; top: 150px; transform: translateX(-50%) scale(1.1); }
                25% { transform: translateX(-50%) scale(1); }
                75% { opacity: 1; top: 150px; }
                100% { opacity: 0; top: 200px; transform: translateX(-50%) scale(0.8); }
            }
        `;
        if (!document.getElementById('spell-animation-style')) {
            style.id = 'spell-animation-style';
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    applyPotionEffect(config) {
        switch (config.effect) {
            case 'health':
                const oldHp = this.player.stats.hp;
                this.player.stats.hp = Math.min(this.player.stats.hp + config.value, this.player.stats.maxHp);
                const hpGained = this.player.stats.hp - oldHp;
                console.log(`❤️ +${hpGained.toFixed(0)} HP (${this.player.stats.hp.toFixed(0)}/${this.player.stats.maxHp})`);
                break;

            case 'mana':
                const oldMana = this.player.stats.mana;
                this.player.stats.mana = Math.min(this.player.stats.mana + config.value, this.player.stats.maxMana);
                const manaGained = this.player.stats.mana - oldMana;
                console.log(`💙 +${manaGained.toFixed(0)} Mana (${this.player.stats.mana.toFixed(0)}/${this.player.stats.maxMana})`);
                break;

            case 'attack':
                this.player.attackBoost = config.value;
                this.player.attackBoostEndTime = Date.now() + config.duration;
                console.log(`⚔️ Boost d'attaque x${config.value} pendant ${config.duration / 1000}s`);
                break;

            case 'defense':
                this.player.defenseBoost = config.value;
                this.player.defenseBoostEndTime = Date.now() + config.duration;
                console.log(`🛡️ Boost de défense x${config.value} pendant ${config.duration / 1000}s`);
                break;
        }
    }

    showCollectionNotification(config) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(${this.getColorRGB(config.color)}, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            z-index: 1500;
            box-shadow: 0 0 20px rgba(${this.getColorRGB(config.color)}, 0.6);
            animation: slideDown 2s ease-out;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        `;
        notification.textContent = `🧪 ${config.description}`;
        document.body.appendChild(notification);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                0% { opacity: 0; top: 100px; }
                20% { opacity: 1; top: 150px; }
                80% { opacity: 1; top: 150px; }
                100% { opacity: 0; top: 200px; }
            }
        `;
        if (!document.getElementById('potion-animation-style')) {
            style.id = 'potion-animation-style';
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 2000);
    }

    getColorRGB(hexColor) {
        const r = (hexColor >> 16) & 255;
        const g = (hexColor >> 8) & 255;
        const b = hexColor & 255;
        return `${r}, ${g}, ${b}`;
    }

    clearPotions() {
        this.potions.forEach(potion => potion.remove());
        this.potions = [];
        this.spellPickups.forEach(spell => spell.remove());
        this.spellPickups = [];
        this.potionsToSpawn = [];
        this.autoSpawn = false; // Désactiver l'auto-spawn
        console.log('🧹 Toutes les potions et sorts ont été nettoyés');
    }

    clearCollectedPotions() {
        const beforeCount = this.potions.length;
        for (let i = this.potions.length - 1; i >= 0; i--) {
            if (this.potions[i].collected) {
                this.potions.splice(i, 1);
            }
        }
        const removed = beforeCount - this.potions.length;
        if (removed > 0) {
            console.log(`🧹 ${removed} potion(s) collectée(s) nettoyée(s)`);
        }
    }

    getPotionCount() {
        return this.potions.length + this.potionsToSpawn.length;
    }
    
    resetSpellCounter() {
        this.spellsSpawned = 0;
        console.log('🔄 Compteur de sorts réinitialisé');
    }
}
