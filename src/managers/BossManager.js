import * as THREE from 'three';
import { Boss } from '../entities/Boss.js';
import { Minion } from '../entities/Minion.js';

export class BossManager {
    constructor(scene, spellManager, potionManager = null, player = null, menuManager = null, obstacleManager = null) {
        this.scene = scene;
        this.spellManager = spellManager;
        this.potionManager = potionManager;
        this.player = player;
        this.menuManager = menuManager;
        this.obstacleManager = obstacleManager;
        this.currentBoss = null;
        this.currentBossIndex = 0;
        this.difficulty = 'normal'; // Sera défini par le jeu
        this.isInfiniteMode = false;
        this.bossKillCount = 0;
        this.bossConfigs = this.initBossConfigs();
        
        // Système de sbires
        this.minions = []; // Liste des sbires actuellement en vie
        this.minionsRequired = [5, 7, 10, 12, 15, 17, 20]; // Nombre de sbires par boss
        this.minionsKilled = 0; // Nombre de sbires tués
        this.minionsSpawned = false; // Flag pour savoir si les sbires ont été spawnés
        this.minionsSpawnTime = 0; // Timestamp du spawn des sbires
        this.minionsHelpTimeout = 120000; // 2 minutes avant d'afficher les positions
        this.minionsHelpActivated = false; // Flag pour savoir si l'aide est activée
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
                modelPath: 'models/AnimatedWizard.glb',
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
                modelPath: 'models/Snake.glb',
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
                modelPath: 'models/Ghost.glb'
            },
            {
                name: 'Voldemort',
                hp: 1500,
                speed: 1.5,
                damage: 75,
                color: 0x000000,
                size: { x: 1, y: 2.2, z: 1 },
                position: { x: 0, y: 0, z: -15 },
                rewardSpell: null,
                stopAtHpPercent: 0.5, // Arrêt à 50% de vie
                modelPath: 'models/AnimatedWizard.glb',
                modelScale: 1.1,
                modelColor: 0x0f0f0f, // Noir très foncé (presque noir)
                canCastSpells: true,
                spellCooldown: 2500,
                spellSpeed: 8,
                spellColor: 0x00ff00 // Vert (Avada Kedavra)
            },
            {
                name: 'Ombrage',
                hp: 800,
                speed: 1,
                damage: 50,
                color: 0xff1493,
                size: { x: 1, y: 1.8, z: 1 },
                position: { x: 0, y: 0, z: -10 },
                rewardSpell: 'protegoMaxima',
                modelPath: 'models/Witch.glb',
                modelScale: 1.0,
                modelColor: 0xff69b4, // Rose vif pour Ombrage
                canCastSpells: true,
                spellCooldown: 2000,
                spellSpeed: 7,
                spellColor: 0xff1493 // Rose
            },
            {
                name: 'Bellatrix',
                hp: 1000,
                speed: 1.8,
                damage: 70,
                color: 0x808080,
                size: { x: 0.9, y: 1.9, z: 0.9 },
                position: { x: 0, y: 0, z: -10 },
                rewardSpell: 'sectumsempra',
                modelPath: 'models/Witch.glb',
                canCastSpells: true,
                spellCooldown: 1800,
                spellSpeed: 9,
                spellColor: 0x8800ff // Violet
            },
            {
                name: 'Voldemort Final',
                hp: 1500,
                speed: 2,
                damage: 80,
                color: 0x2a2a2a,
                size: { x: 1.2, y: 2.5, z: 1.2 },
                position: { x: 0, y: 0, z: -15 },
                rewardSpell: null,
                modelPath: 'models/AnimatedWizard.glb',
                modelScale: 1.2,
                modelColor: 0x3a3a3a, // Gris foncé
                canCastSpells: true,
                spellCooldown: 1500,
                spellSpeed: 10,
                spellColor: 0x00ff00 // Vert (Avada Kedavra)
            }
        ];
    }

    spawnBoss(index = 0) {
        if (this.currentBoss) {
            this.currentBoss.remove();
        }
        
        // Régénérer le labyrinthe à chaque nouveau boss (sauf le premier)
        if (this.obstacleManager && index > 0) {
            console.log('🔄 Régénération du labyrinthe pour le boss suivant...');
            this.obstacleManager.regenerate();
        }

        // Mode infini : toujours spawner un boss aléatoire
        if (this.isInfiniteMode) {
            const randomIndex = Math.floor(Math.random() * this.bossConfigs.length);
            const config = { ...this.bossConfigs[randomIndex] };
            
            // Appliquer le boost de +10% en mode infini
            config.hp = Math.floor(config.hp * 1.1);
            config.damage = Math.floor(config.damage * 1.1);
            
            // Ajouter la taille de l'arène pour le pathfinding
            config.arenaSize = 100;
            
            // Trouver une position valide pour le boss (loin des obstacles)
            if (this.obstacleManager && this.player) {
                const validPosition = this.obstacleManager.getRandomBossPosition(this.player.camera.position, 15, 22);
                config.position = { x: validPosition.x, y: 0, z: validPosition.z };
            }
            
            this.currentBoss = new Boss(this.scene, config, this.obstacleManager);
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

        // Sauvegarder l'index pour le spawning ultérieur
        this.currentBossIndex = index;
        this.minionsSpawned = false;
        
        // NOUVEAU : Spawner d'abord les sbires au lieu du boss
        this.spawnMinions(index);
        
        console.log(`⚔️ Boss ${index + 1}/${this.bossConfigs.length}: ${this.bossConfigs[index].name} - Éliminez d'abord les sbires !`);
        
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
        
        return null; // Pas de boss pour l'instant, seulement les sbires
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
        // Mettre à jour les sbires
        for (let i = this.minions.length - 1; i >= 0; i--) {
            const minion = this.minions[i];
            
            if (minion.isDead) {
                this.minions.splice(i, 1);
                this.minionsKilled++;
                console.log(`👊 Sbire éliminé ! (${this.minionsKilled}/${this.getMinionCount()})`);
            } else {
                minion.update(delta, playerPosition);
            }
        }
        
        // Vérifier si on doit activer l'aide après 2 minutes
        if (this.minionsSpawned && !this.minionsHelpActivated && this.minions.length > 0) {
            const elapsed = Date.now() - this.minionsSpawnTime;
            if (elapsed >= this.minionsHelpTimeout) {
                this.activateMinionsHelp();
            }
        }
        
        // Si tous les sbires sont morts et le boss n'a pas encore spawné, spawner le boss
        if (this.minionsSpawned && this.minions.length === 0 && !this.currentBoss) {
            console.log('✅ Tous les sbires éliminés ! Le boss arrive...');
            
            // Spawner le VRAI boss maintenant
            const index = this.currentBossIndex;
            const config = { ...this.bossConfigs[index] };
            
            // Appliquer le modificateur de difficulté
            if (this.difficulty === 'hard') {
                config.hp = Math.floor(config.hp * 1.1);
                config.damage = Math.floor(config.damage * 1.1);
            }
            
            config.arenaSize = 100;
            
            // Trouver une position valide pour le boss
            if (this.obstacleManager && this.player) {
                const validPosition = this.obstacleManager.getRandomBossPosition(this.player.camera.position, 15, 22);
                config.position = { x: validPosition.x, y: 0, z: validPosition.z };
                console.log(`📍 Position du boss: (${validPosition.x.toFixed(1)}, ${validPosition.z.toFixed(1)})`);
            }
            
            this.currentBoss = new Boss(this.scene, config, this.obstacleManager);
            console.log(`⚔️ Boss ${index + 1}/${this.bossConfigs.length}: ${config.name}${this.difficulty === 'hard' ? ' [DIFFICILE]' : ''}`);
        }
        
        if (this.currentBoss && !this.currentBoss.isDead && !this.currentBoss.isDefeated) {
            this.currentBoss.update(delta, playerPosition);
        } else if (this.currentBoss && (this.currentBoss.isDead || this.currentBoss.isDefeated)) {
            this.onBossDefeated();
            this.currentBoss = null;
        }
    }
    
    spawnMinions(bossIndex) {
        // Nettoyer les sbires existants
        this.minions.forEach(minion => minion.remove());
        this.minions = [];
        this.minionsKilled = 0;
        this.minionsSpawned = true;
        this.minionsSpawnTime = Date.now(); // Démarrer le timer
        this.minionsHelpActivated = false;
        
        const config = this.bossConfigs[bossIndex];
        const count = this.getMinionCount();
        
        console.log(`👥 Spawning ${count} sbires avant le boss ${config.name}...`);
        
        const spawnedPositions = []; // Pour vérifier l'espacement minimum
        const minDistance = 20; // Distance minimum entre sbires
        
        // Créer les sbires espacés d'au moins 20m
        for (let i = 0; i < count; i++) {
            let x, z;
            let validPosition = false;
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!validPosition && attempts < maxAttempts) {
                // Générer une position aléatoire dans l'arène (pas en cercle)
                x = (Math.random() - 0.5) * 90; // -45 à +45
                z = (Math.random() - 0.5) * 90;
                
                // Vérifier que le sbire n'est pas trop proche du joueur (minimum 15m)
                const distToPlayer = Math.sqrt(
                    Math.pow(x - this.player.camera.position.x, 2) + 
                    Math.pow(z - this.player.camera.position.z, 2)
                );
                
                if (distToPlayer < 15) {
                    attempts++;
                    continue;
                }
                
                // Vérifier l'espacement avec les autres sbires (minimum 20m)
                let tooClose = false;
                for (const pos of spawnedPositions) {
                    const dist = Math.sqrt(
                        Math.pow(x - pos.x, 2) + 
                        Math.pow(z - pos.z, 2)
                    );
                    if (dist < minDistance) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (tooClose) {
                    attempts++;
                    continue;
                }
                
                // Vérifier les collisions avec obstacles
                if (this.obstacleManager) {
                    const testPos = new THREE.Vector3(x, 0, z);
                    if (this.obstacleManager.checkCollision(testPos, 1.0)) {
                        attempts++;
                        continue;
                    }
                }
                
                // Position valide !
                validPosition = true;
            }
            
            // Si aucune position valide trouvée après maxAttempts, utiliser une position par défaut
            if (!validPosition) {
                const angle = (Math.PI * 2 * i) / count;
                x = this.player.camera.position.x + Math.cos(angle) * 30;
                z = this.player.camera.position.z + Math.sin(angle) * 30;
                console.warn(`⚠️ Position par défaut utilisée pour sbire ${i + 1}`);
            }
            
            spawnedPositions.push({ x, z });
            
            const minionConfig = {
                name: `Sbire ${config.name}`,
                speed: 2,
                color: config.color,
                size: { x: 0.5, y: 1, z: 0.5 },
                position: { x, y: 0, z },
                modelPath: config.modelPath,
                modelScale: config.modelScale,
                modelColor: config.modelColor,
                customColors: config.customColors,
                arenaSize: 100
            };
            
            const minion = new Minion(this.scene, minionConfig, this.obstacleManager);
            this.minions.push(minion);
        }
        
        console.log(`✅ ${count} sbires spawnés avec espacement de ${minDistance}m minimum`);
    }
    
    getMinionCount() {
        // Retourner le nombre de sbires requis pour le boss actuel
        if (this.currentBossIndex < this.minionsRequired.length) {
            return this.minionsRequired[this.currentBossIndex];
        }
        return 5; // Par défaut
    }
    
    getMinions() {
        return this.minions;
    }
    
    checkMinionCollision(position, radius) {
        for (const minion of this.minions) {
            if (minion.isDead) continue;
            
            const distance = minion.getDistanceToPlayer(position);
            if (distance < radius + 0.5) {
                return { hit: true, minion: minion, distance: distance };
            }
        }
        return { hit: false };
    }
    
    activateMinionsHelp() {
        this.minionsHelpActivated = true;
        console.log(`🆘 Aide activée ! Affichage des positions des sbires restants...`);
        
        // Afficher les marqueurs pour tous les sbires vivants
        for (const minion of this.minions) {
            if (!minion.isDead) {
                minion.showPositionMarker();
            }
        }
        
        // Notification à l'écran
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 3000;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
            animation: helpNotification 3s ease-in-out;
        `;
        notification.textContent = `📍 Les positions des sbires restants sont maintenant visibles !`;
        document.body.appendChild(notification);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes helpNotification {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                10% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                20% { transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    getCurrentBoss() {
        return this.currentBoss;
    }
}
