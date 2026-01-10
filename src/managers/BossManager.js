import { Boss } from '../entities/Boss.js';

export class BossManager {
    constructor(scene, spellManager, potionManager = null, player = null, menuManager = null) {
        this.scene = scene;
        this.spellManager = spellManager;
        this.potionManager = potionManager;
        this.player = player;
        this.menuManager = menuManager;
        this.currentBoss = null;
        this.currentBossIndex = 0;
        this.difficulty = 'normal'; // Sera défini par le jeu
        this.isInfiniteMode = false;
        this.bossKillCount = 0;
        this.bossConfigs = this.initBossConfigs();
    }

    initBossConfigs() {
        return [
            {
                name: 'Quirrell',
                hp: 200,
                speed: 1,
                damage: 10,
                color: 0x8B00FF,
                size: { x: 1.5, y: 3, z: 1.5 }, // Hitbox augmentée
                position: { x: 0, y: 0, z: -10 },
                rewardSpell: 'incendio',
                modelPath: '/models/Animated Wizard.glb',
                modelScale: 1.0 // Taille normale du modèle
            },
            {
                name: 'Basilic',
                hp: 300,
                speed: 1.8,
                damage: 15,
                color: 0x00ff00,
                size: { x: 2, y: 2, z: 4 }, // Hitbox augmentée pour basilic
                position: { x: 0, y: 0, z: -12 },
                rewardSpell: null,
                modelPath: '/models/Snake.glb',
                modelScale: 1.0 // Taille normale
            },
            {
                name: 'Dementor',
                hp: 500,
                speed: 1.5,
                damage: 20,
                color: 0x363535,
                size: { x: 0.8, y: 1.5, z: 0.8 },
                position: { x: 0, y: 0, z: -10 },
                rewardSpell: 'stupefix',
                modelPath: '/models/Ghost.glb'
            },
            {
                name: 'Voldemort',
                hp: 1500,
                speed: 1.5,
                damage: 30,
                color: 0x000000,
                size: { x: 1, y: 2.2, z: 1 },
                position: { x: 0, y: 0, z: -15 },
                rewardSpell: null,
                stopAtHpPercent: 0.5, // Arrêt à 50% de vie
                modelPath: '/models/Animated Wizard.glb',
                modelScale: 1.1,
                modelColor: 0x0f0f0f // Noir très foncé (presque noir)
            },
            {
                name: 'Ombrage',
                hp: 800,
                speed: 1,
                damage: 25,
                color: 0xff1493,
                size: { x: 1, y: 1.8, z: 1 },
                position: { x: 0, y: 0, z: -10 },
                rewardSpell: 'protegoMaxima',
                modelPath: '/models/Witch.glb',
                modelScale: 1.0,
                modelColor: 0xff69b4 // Rose vif pour Ombrage
            },
            {
                name: 'Bellatrix',
                hp: 1000,
                speed: 1.8,
                damage: 35,
                color: 0x808080,
                size: { x: 0.9, y: 1.9, z: 0.9 },
                position: { x: 0, y: 0, z: -10 },
                rewardSpell: 'sectumsempra',
                modelPath: '/models/Witch.glb'
            },
            {
                name: 'Voldemort Final',
                hp: 1500,
                speed: 2,
                damage: 50,
                color: 0x2a2a2a,
                size: { x: 1.2, y: 2.5, z: 1.2 },
                position: { x: 0, y: 0, z: -15 },
                rewardSpell: null,
                modelPath: '/models/Animated Wizard.glb',
                modelScale: 1.2,
                modelColor: 0x3a3a3a // Gris foncé
            }
        ];
    }

    spawnBoss(index = 0) {
        if (this.currentBoss) {
            this.currentBoss.remove();
        }

        // Mode infini : toujours spawner un boss aléatoire
        if (this.isInfiniteMode) {
            const randomIndex = Math.floor(Math.random() * this.bossConfigs.length);
            const config = { ...this.bossConfigs[randomIndex] };
            
            // Appliquer le boost de +10% en mode infini
            config.hp = Math.floor(config.hp * 1.1);
            config.damage = Math.floor(config.damage * 1.1);
            
            this.currentBoss = new Boss(this.scene, config);
            this.currentBossIndex = randomIndex;
            
            console.log(`♾️ Boss Infini #${this.bossKillCount + 1}: ${config.name} [+10%]`);
            
            // Spawner des potions
            if (this.potionManager) {
                this.potionManager.setBossIndex(randomIndex);
                this.potionManager.autoSpawn = true;
                if (this.bossKillCount === 0) {
                    this.potionManager.spawnPotions(5);
                }
                this.potionManager.clearCollectedPotions();
            }
            
            return this.currentBoss;
        }

        // Mode normal/difficile : progression linéaire
        if (index >= this.bossConfigs.length) {
            console.log('🎉 Tous les boss sont vaincus!');
            
            // Nettoyer les potions uniquement à la fin du jeu
            if (this.potionManager) {
                this.potionManager.clearPotions();
            }
            
            // Afficher l'écran de victoire
            if (this.menuManager && this.player) {
                const stats = {
                    hp: Math.round(this.player.stats.hp),
                    maxHp: this.player.stats.maxHp,
                    mana: Math.round(this.player.stats.mana),
                    maxMana: this.player.stats.maxMana,
                    spellsUnlocked: this.spellManager.unlockedSpells.length
                };
                this.menuManager.showVictory(stats);
            }
            
            return null;
        }

        const config = { ...this.bossConfigs[index] };
        
        // Appliquer le modificateur de difficulté
        if (this.difficulty === 'hard') {
            config.hp = Math.floor(config.hp * 1.1); // +10% HP
            config.damage = Math.floor(config.damage * 1.1); // +10% dégâts
        }
        
        this.currentBoss = new Boss(this.scene, config);
        this.currentBossIndex = index;

        console.log(`⚔️ Boss ${index + 1}/${this.bossConfigs.length}: ${config.name}${this.difficulty === 'hard' ? ' [DIFFICILE]' : ''}`);
        
        // Mettre à jour l'index du boss dans le potionManager
        if (this.potionManager) {
            this.potionManager.setBossIndex(index);
            
            // Activer l'auto-spawn
            this.potionManager.autoSpawn = true;
            
            // Au premier boss, remplir le terrain
            if (index === 0) {
                this.potionManager.spawnPotions(5);
            }
            
            // Nettoyer uniquement les potions déjà collectées
            this.potionManager.clearCollectedPotions();
        }
        
        return this.currentBoss;
    }

    onBossDefeated() {
        if (!this.currentBoss) return;

        // Mode infini : incrémenter le compteur et spawner un nouveau boss
        if (this.isInfiniteMode) {
            this.bossKillCount++;
            console.log(`🏆 Boss tué ! Total: ${this.bossKillCount}`);
            
            // Mettre à jour le compteur dans le MenuManager
            if (this.menuManager) {
                this.menuManager.bossKillCount = this.bossKillCount;
            }
            
            // Afficher notification du compteur
            this.showInfiniteKillNotification(this.bossKillCount);
            
            // Spawner le prochain boss aléatoire après un délai
            setTimeout(() => {
                this.spawnBoss(0); // L'index n'a pas d'importance en mode infini
            }, 3000);
            
            return;
        }

        const config = this.bossConfigs[this.currentBossIndex];
        
        // Message spécial pour Voldemort Part 1
        if (config.stopAtHpPercent) {
            console.log(`⚡ ${config.name} s'est échappé ! Il reviendra plus puissant...`);
            this.showEscapeNotification(config.name);
        }
        
        // Débloquer le sort récompense
        if (config.rewardSpell) {
            this.spellManager.unlockSpell(config.rewardSpell);
            const spell = this.spellManager.allSpells[config.rewardSpell];
            console.log(`✨ Nouveau sort débloqué: ${spell.name}!`);
            
            // Afficher une notification
            this.showRewardNotification(spell.name);
        }
        
        // Level Up ! Gagner des PV et du Mana
        if (this.player) {
            const hpGain = 20;
            const manaGain = 20;
            
            this.player.stats.maxHp += hpGain;
            this.player.stats.maxMana += manaGain;
            this.player.stats.hp = this.player.stats.maxHp; // Restaurer complètement
            this.player.stats.mana = this.player.stats.maxMana; // Restaurer complètement
            
            console.log(`🎆 LEVEL UP ! +${hpGain} HP Max, +${manaGain} Mana Max`);
            console.log(`💪 Stats: ${this.player.stats.maxHp} HP, ${this.player.stats.maxMana} Mana`);
            
            this.showLevelUpNotification(hpGain, manaGain, this.player.stats.maxHp, this.player.stats.maxMana);
        }

        // Passer au boss suivant après 3 secondes
        setTimeout(() => {
            this.spawnBoss(this.currentBossIndex + 1);
        }, 3000);
    }

    showEscapeNotification(bossName) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(102, 0, 102, 0.95);
            color: white;
            padding: 30px 50px;
            border-radius: 20px;
            font-size: 24px;
            font-weight: bold;
            z-index: 2000;
            box-shadow: 0 0 30px rgba(102, 0, 102, 0.8);
            animation: fadeInOut 3s ease-in-out;
            text-align: center;
        `;
        notification.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 10px;">⚡</div>
            <div>${bossName} s'échappe !</div>
            <div style="font-size: 16px; margin-top: 10px; opacity: 0.8;">Il reviendra plus puissant...</div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    showRewardNotification(spellName) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.95);
            color: black;
            padding: 30px 50px;
            border-radius: 20px;
            font-size: 24px;
            font-weight: bold;
            z-index: 2000;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
            animation: fadeInOut 3s ease-in-out;
        `;
        notification.textContent = `✨ Nouveau sort: ${spellName} ✨`;
        document.body.appendChild(notification);

        // Ajouter l'animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    showLevelUpNotification(hpGain, manaGain, maxHp, maxMana) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.95), rgba(75, 0, 130, 0.95));
            color: white;
            padding: 30px 50px;
            border-radius: 20px;
            font-size: 28px;
            font-weight: bold;
            z-index: 2000;
            box-shadow: 0 0 40px rgba(138, 43, 226, 0.8);
            animation: levelUpAnim 3s ease-in-out;
            text-align: center;
            border: 3px solid gold;
        `;
        notification.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">🎆 LEVEL UP ! 🎆</div>
            <div style="font-size: 24px; line-height: 1.8;">
                <div>❤️ +${hpGain} HP Max ➝ ${maxHp} HP</div>
                <div>🔵 +${manaGain} Mana Max ➝ ${maxMana} Mana</div>
            </div>
            <div style="font-size: 18px; margin-top: 15px; opacity: 0.9;">Complètement restauré !</div>
        `;
        document.body.appendChild(notification);

        // Ajouter l'animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes levelUpAnim {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(-5deg); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1) rotate(2deg); }
                25% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        if (!document.getElementById('levelup-animation-style')) {
            style.id = 'levelup-animation-style';
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
    
    showInfiniteKillNotification(killCount) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(148, 0, 211, 0.95), rgba(75, 0, 130, 0.95));
            color: #ffd700;
            padding: 30px 60px;
            border-radius: 20px;
            font-size: 32px;
            font-weight: bold;
            z-index: 2000;
            box-shadow: 0 0 40px rgba(148, 0, 211, 0.9);
            border: 3px solid #ffd700;
            animation: infiniteKillAnim 3s ease-in-out;
        `;
        notification.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">☠️ ${killCount} ☠️</div>
                <div style="font-size: 24px;">Boss éliminés</div>
            </div>
        `;
        document.body.appendChild(notification);

        // Ajouter l'animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes infiniteKillAnim {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                30% { transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        if (!document.getElementById('infinite-kill-animation-style')) {
            style.id = 'infinite-kill-animation-style';
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    update(delta, playerPosition) {
        if (this.currentBoss && !this.currentBoss.isDead && !this.currentBoss.isDefeated) {
            this.currentBoss.update(delta, playerPosition);
        } else if (this.currentBoss && (this.currentBoss.isDead || this.currentBoss.isDefeated)) {
            this.onBossDefeated();
            this.currentBoss = null;
        }
    }

    getCurrentBoss() {
        return this.currentBoss;
    }
}
