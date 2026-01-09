export class MenuManager {
    constructor() {
        this.isPaused = false;
        this.isInMenu = true;
        this.onResumeCallback = null;
        this.onQuitCallback = null;
        this.onStartCallback = null;
        this.onGameWonCallback = null;
        this.difficulty = 'normal'; // 'normal', 'hard', ou 'infinite'
        this.hardModeCompleted = localStorage.getItem('hardModeCompleted') === 'true';
        this.bossKillCount = 0; // Pour le mode infini
        
        this.createMenus();
        this.showTitleScreen();
    }

    createMenus() {
        this.createTitleScreen();
        this.createDifficultyScreen();
        this.createControlsScreen();
        this.createPauseMenu();
        this.createVictoryScreen();
    }

    createTitleScreen() {
        this.titleScreen = document.createElement('div');
        this.titleScreen.id = 'title-screen';
        this.titleScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;

        this.titleScreen.innerHTML = `
            <div style="text-align: center;">
                <h1 style="
                    color: #ffd700;
                    font-size: 72px;
                    margin-bottom: 20px;
                    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                    font-family: 'Georgia', serif;
                ">⚡ Magic Arena ⚡</h1>
                <p style="
                    color: #ffffff;
                    font-size: 24px;
                    margin-bottom: 50px;
                    opacity: 0.9;
                ">Rogue-like Adventure</p>
                
                <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
                    <button id="btn-play" style="
                        width: 300px;
                        padding: 20px 40px;
                        font-size: 24px;
                        font-weight: bold;
                        color: white;
                        background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%);
                        border: 3px solid #ffd700;
                        border-radius: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4);
                    ">🎮 JOUER</button>
                    
                    <button id="btn-controls-title" style="
                        width: 300px;
                        padding: 20px 40px;
                        font-size: 24px;
                        font-weight: bold;
                        color: white;
                        background: linear-gradient(135deg, #4169e1 0%, #1e3a8a 100%);
                        border: 3px solid #ffd700;
                        border-radius: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 5px 15px rgba(65, 105, 225, 0.4);
                    ">🎯 CONTRÔLES</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.titleScreen);

        // Effets hover
        const buttons = this.titleScreen.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 10px 25px rgba(255, 215, 0, 0.6)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });
        });

        // Events
        document.getElementById('btn-play').addEventListener('click', () => this.showDifficultyScreen());
        document.getElementById('btn-controls-title').addEventListener('click', () => this.showControlsFromTitle());
    }

    createDifficultyScreen() {
        this.difficultyScreen = document.createElement('div');
        this.difficultyScreen.id = 'difficulty-screen';
        this.difficultyScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 3001;
        `;

        this.difficultyScreen.innerHTML = `
            <div style="text-align: center;">
                <h1 style="
                    color: #ffd700;
                    font-size: 56px;
                    margin-bottom: 20px;
                    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                    font-family: 'Georgia', serif;
                ">⚔️ Sélectionner la Difficulté ⚔️</h1>
                
                <div style="display: flex; gap: 40px; margin-top: 60px; justify-content: center; flex-wrap: wrap;">
                    <div id="btn-normal" style="
                        width: 250px;
                        padding: 30px 50px;
                        background: linear-gradient(135deg, #4169E1 0%, #1E3A8A 100%);
                        border: 3px solid #ffd700;
                        border-radius: 20px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 5px 20px rgba(65, 105, 225, 0.5);
                    ">
                        <h2 style="color: #ffd700; font-size: 36px; margin: 0; text-align: center;">🌟 NORMAL</h2>
                    </div>
                    
                    <div id="btn-hard" style="
                        width: 250px;
                        padding: 30px 50px;
                        background: linear-gradient(135deg, #DC143C 0%, #8B0000 100%);
                        border: 3px solid #ffd700;
                        border-radius: 20px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 5px 20px rgba(220, 20, 60, 0.5);
                    ">
                        <h2 style="color: #ffd700; font-size: 36px; margin: 0; text-align: center;">💀 DIFFICILE</h2>
                    </div>
                    
                    ${this.hardModeCompleted ? `
                    <div id="btn-infinite" style="
                        width: 350px;
                        padding: 30px;
                        background: linear-gradient(135deg, #9400D3 0%, #4B0082 100%);
                        border: 3px solid #ffd700;
                        border-radius: 20px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 5px 20px rgba(148, 0, 211, 0.5);
                    ">
                        <h2 style="color: #ffd700; font-size: 36px; margin: 0 0 15px 0;">♾️ INFINI</h2>
                        <p style="color: white; font-size: 18px; margin: 10px 0; text-align: left;">
                            💀 Régénération: <strong>Aucune</strong><br>
                            ☠️ Boss aléatoires: <strong>Infinis</strong><br>
                            ⚠️ PV ennemis: <strong>+10%</strong><br>
                            ⚠️ Dégâts ennemis: <strong>+10%</strong><br>
                            ⚡ Sorts Impardonnables: <strong>Débloqués</strong>
                        </p>
                        <p style="color: #DA70D6; font-size: 16px; margin-top: 15px; font-style: italic;">Mode débloqué !</p>
                    </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 20px; margin-top: 50px; justify-content: center; align-items: center;">
                    <button id="btn-back-difficulty" style="
                        padding: 15px 40px;
                        font-size: 20px;
                        color: white;
                        background: rgba(255, 255, 255, 0.1);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">← Retour</button>
                    
                    ${this.hardModeCompleted ? `
                    <button id="btn-reset-progress" style="
                        padding: 15px 40px;
                        font-size: 20px;
                        color: white;
                        background: rgba(220, 20, 60, 0.3);
                        border: 2px solid rgba(220, 20, 60, 0.5);
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">🔄 Réinitialiser Progression</button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(this.difficultyScreen);

        // Events
        const normalBtn = document.getElementById('btn-normal');
        const hardBtn = document.getElementById('btn-hard');
        const infiniteBtn = document.getElementById('btn-infinite');
        const backBtn = document.getElementById('btn-back-difficulty');

        // Hover effects
        const difficultyBtns = [normalBtn, hardBtn];
        if (infiniteBtn) difficultyBtns.push(infiniteBtn);
        
        difficultyBtns.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.05) translateY(-5px)';
                btn.style.boxShadow = '0 10px 30px rgba(255, 215, 0, 0.8)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1) translateY(0)';
            });
        });

        normalBtn.addEventListener('click', () => {
            this.difficulty = 'normal';
            this.bossKillCount = 0;
            this.hideDifficultyScreen();
            this.startGame();
        });

        hardBtn.addEventListener('click', () => {
            this.difficulty = 'hard';
            this.bossKillCount = 0;
            this.hideDifficultyScreen();
            this.startGame();
        });
        
        if (infiniteBtn) {
            infiniteBtn.addEventListener('click', () => {
                this.difficulty = 'infinite';
                this.bossKillCount = 0;
                this.hideDifficultyScreen();
                this.startGame();
            });
        }

        backBtn.addEventListener('click', () => {
            this.hideDifficultyScreen();
            this.showTitleScreen();
        });

        backBtn.addEventListener('mouseenter', () => {
            backBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        backBtn.addEventListener('mouseleave', () => {
            backBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        
        // Bouton de reset de progression
        const resetBtn = document.getElementById('btn-reset-progress');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                // Confirmer avant de reset
                if (confirm('⚠️ Voulez-vous vraiment réinitialiser votre progression ?\n\nCela verrouillera à nouveau le Mode Infini.')) {
                    localStorage.removeItem('hardModeCompleted');
                    this.hardModeCompleted = false;
                    
                    // Recréer l'écran de difficulté sans le mode infini
                    this.hideDifficultyScreen();
                    if (this.difficultyScreen && this.difficultyScreen.parentNode) {
                        document.body.removeChild(this.difficultyScreen);
                    }
                    this.createDifficultyScreen();
                    this.showDifficultyScreen();
                    
                    console.log('🔄 Progression réinitialisée');
                }
            });
            
            resetBtn.addEventListener('mouseenter', () => {
                resetBtn.style.background = 'rgba(220, 20, 60, 0.5)';
                resetBtn.style.borderColor = 'rgba(220, 20, 60, 0.8)';
            });
            resetBtn.addEventListener('mouseleave', () => {
                resetBtn.style.background = 'rgba(220, 20, 60, 0.3)';
                resetBtn.style.borderColor = 'rgba(220, 20, 60, 0.5)';
            });
        }
    }

    showDifficultyScreen() {
        this.hideTitleScreen();
        this.difficultyScreen.style.display = 'flex';
        this.isInMenu = true;
    }

    hideDifficultyScreen() {
        this.difficultyScreen.style.display = 'none';
    }

    createControlsScreen() {
        this.controlsScreen = document.createElement('div');
        this.controlsScreen.id = 'controls-screen';
        this.controlsScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            overflow-y: auto;
        `;

        this.controlsScreen.innerHTML = `
            <div style="max-width: 800px; padding: 40px; color: white;">
                <h2 style="
                    color: #ffd700;
                    font-size: 48px;
                    text-align: center;
                    margin-bottom: 40px;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                ">🎯 Contrôles</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; border: 2px solid #ffd700;">
                        <h3 style="color: #ffd700; margin-bottom: 15px;">🚶 Déplacement</h3>
                        <p><strong>ZQSD / WASD</strong> - Se déplacer</p>
                        <p><strong>Souris</strong> - Regarder autour</p>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; border: 2px solid #ffd700;">
                        <h3 style="color: #ffd700; margin-bottom: 15px;">⚡ Sorts</h3>
                        <p><strong>1, 2, 3, 4</strong> - Sélectionner sort</p>
                        <p><strong>Clic gauche / Espace</strong> - Lancer sort</p>
                        <p><strong>Q</strong> - Configuration sorts</p>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; border: 2px solid #ffd700;">
                        <h3 style="color: #ffd700; margin-bottom: 15px;">🧪 Potions</h3>
                        <p><strong>Marcher dessus</strong> - Collecter</p>
                        <p style="font-size: 14px; opacity: 0.8; margin-top: 10px;">
                            ❤️ Rouge: +50 HP<br>
                            💙 Cyan: +30 Mana<br>
                            ⚔️ Violet: Dégâts x2 (15s)<br>
                            🛡️ Vert: Dégâts /2 (15s)
                        </p>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; border: 2px solid #ffd700;">
                        <h3 style="color: #ffd700; margin-bottom: 15px;">✨ Sorts du Terrain</h3>
                        <p><strong>Marcher dessus</strong> - Débloquer</p>
                        <p style="font-size: 14px; opacity: 0.8; margin-top: 10px;">
                            Des sorts puissants apparaissent aléatoirement sur le terrain après le 2ème boss (max 5 par partie)
                        </p>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; border: 2px solid #ffd700;">
                        <h3 style="color: #ffd700; margin-bottom: 15px;">⚙️ Système</h3>
                        <p><strong>Échap</strong> - Pause / Menu</p>
                        <p><strong>Clic</strong> - Capturer souris</p>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <button id="btn-exit-controls" style="
                        padding: 15px 40px;
                        font-size: 20px;
                        font-weight: bold;
                        color: white;
                        background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%);
                        border: 3px solid #ffd700;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">← Retour</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.controlsScreen);

        document.getElementById('btn-exit-controls').addEventListener('click', () => {
            this.hideControls();
        });
    }

    createPauseMenu() {
        this.pauseMenu = document.createElement('div');
        this.pauseMenu.id = 'pause-menu';
        this.pauseMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;

        this.pauseMenu.innerHTML = `
            <div style="text-align: center;">
                <h2 style="
                    color: #ffd700;
                    font-size: 64px;
                    margin-bottom: 50px;
                    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                ">⏸️ PAUSE</h2>
                
                <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
                    <button id="btn-resume" style="
                        width: 300px;
                        padding: 20px 40px;
                        font-size: 24px;
                        font-weight: bold;
                        color: white;
                        background: linear-gradient(135deg, #00ff00 0%, #008800 100%);
                        border: 3px solid #ffd700;
                        border-radius: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">▶️ Reprendre</button>
                    
                    <button id="btn-controls-pause" style="
                        width: 300px;
                        padding: 20px 40px;
                        font-size: 24px;
                        font-weight: bold;
                        color: white;
                        background: linear-gradient(135deg, #4169e1 0%, #1e3a8a 100%);
                        border: 3px solid #ffd700;
                        border-radius: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">🎯 Contrôles</button>
                    
                    <button id="btn-quit" style="
                        width: 300px;
                        padding: 20px 40px;
                        font-size: 24px;
                        font-weight: bold;
                        color: white;
                        background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
                        border: 3px solid #ffd700;
                        border-radius: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">🚪 Quitter</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.pauseMenu);

        // Effets hover
        const buttons = this.pauseMenu.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 10px 25px rgba(255, 215, 0, 0.6)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });
        });

        // Events
        document.getElementById('btn-resume').addEventListener('click', () => this.resume());
        document.getElementById('btn-controls-pause').addEventListener('click', () => this.showControlsFromPause());
        document.getElementById('btn-quit').addEventListener('click', () => this.quitToTitle());
    }

    showTitleScreen() {
        this.titleScreen.style.display = 'flex';
        this.isInMenu = true;
        document.body.style.cursor = 'default';
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    hideTitleScreen() {
        this.titleScreen.style.display = 'none';
        this.isInMenu = false;
    }

    showControlsFromTitle() {
        this.titleScreen.style.display = 'none';
        this.controlsScreen.style.display = 'flex';
        this.controlsScreen.dataset.from = 'title';
    }

    showControlsFromPause() {
        this.pauseMenu.style.display = 'none';
        this.controlsScreen.style.display = 'flex';
        this.controlsScreen.dataset.from = 'pause';
    }

    hideControls() {
        this.controlsScreen.style.display = 'none';
        const from = this.controlsScreen.dataset.from;
        
        if (from === 'title') {
            this.titleScreen.style.display = 'flex';
        } else if (from === 'pause') {
            this.pauseMenu.style.display = 'flex';
        }
    }

    startGame() {
        this.hideTitleScreen();
        document.body.style.cursor = 'none';
        
        if (this.onStartCallback) {
            this.onStartCallback();
        }
        
        console.log('🎮 Jeu démarré !');
    }

    pause() {
        if (this.isInMenu) return;
        
        this.isPaused = true;
        this.pauseMenu.style.display = 'flex';
        document.body.style.cursor = 'default';
        
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        console.log('⏸️ Jeu en pause');
    }

    resume() {
        this.isPaused = false;
        this.pauseMenu.style.display = 'none';
        document.body.style.cursor = 'none';
        
        if (this.onResumeCallback) {
            this.onResumeCallback();
        }
        
        console.log('▶️ Jeu repris');
    }

    quitToTitle() {
        this.isPaused = false;
        this.pauseMenu.style.display = 'none';
        
        if (this.onQuitCallback) {
            this.onQuitCallback();
        }
        
        this.showTitleScreen();
        console.log('🚪 Retour au menu principal');
    }

    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    createVictoryScreen() {
        this.victoryScreen = document.createElement('div');
        this.victoryScreen.id = 'victory-screen';
        this.victoryScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1a0033 0%, #4d0099 50%, #ffd700 100%);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 4000;
        `;

        this.victoryScreen.innerHTML = `
            <div style="text-align: center; animation: victoryFadeIn 1s ease-out;">
                <h1 style="
                    color: #ffd700;
                    font-size: 96px;
                    margin-bottom: 20px;
                    text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 215, 0, 0.6);
                    font-family: 'Georgia', serif;
                    animation: victoryPulse 2s infinite;
                ">✨ VICTOIRE ! ✨</h1>
                
                <p style="
                    color: #ffffff;
                    font-size: 32px;
                    margin-bottom: 30px;
                    opacity: 0.9;
                ">Vous avez vaincu tous les boss !</p>
                
                <div id="victory-stats" style="
                    background: rgba(0, 0, 0, 0.5);
                    padding: 30px;
                    border-radius: 20px;
                    margin-bottom: 40px;
                    border: 3px solid #ffd700;
                ">
                    <h2 style="color: #ffd700; margin-bottom: 20px; font-size: 28px;">Statistiques finales</h2>
                    <div style="color: white; font-size: 20px; line-height: 2;">
                        <div>❤️ PV: <span id="final-hp" style="color: #ff6b6b; font-weight: bold;">0</span></div>
                        <div>🔵 Mana: <span id="final-mana" style="color: #4ecdc4; font-weight: bold;">0</span></div>
                        <div>✨ Sorts débloqués: <span id="final-spells" style="color: #ffd700; font-weight: bold;">0</span></div>
                    </div>
                </div>
                
                <button id="btn-play-again" style="
                    width: 300px;
                    padding: 20px 40px;
                    font-size: 28px;
                    font-weight: bold;
                    color: white;
                    background: linear-gradient(135deg, #4169E1 0%, #1E3A8A 100%);
                    border: 3px solid #ffd700;
                    border-radius: 15px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 5px 15px rgba(65, 105, 225, 0.6);
                ">🏠 MENU PRINCIPAL</button>
            </div>
        `;

        document.body.appendChild(this.victoryScreen);

        // Ajouter les animations CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes victoryFadeIn {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes victoryPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        if (!document.getElementById('victory-animation-style')) {
            style.id = 'victory-animation-style';
            document.head.appendChild(style);
        }

        // Effet hover
        const btn = this.victoryScreen.querySelector('#btn-play-again');
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 10px 30px rgba(255, 215, 0, 0.8)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
        });

        // Event
        btn.addEventListener('click', () => {
            this.hideVictory();
            // Retourner au menu principal du début
            this.showTitleScreen();
        });
    }

    showVictory(stats) {
        this.isInMenu = true;
        this.victoryScreen.style.display = 'flex';
        
        // Mettre à jour les stats
        if (stats) {
            document.getElementById('final-hp').textContent = `${stats.hp}/${stats.maxHp}`;
            document.getElementById('final-mana').textContent = `${stats.mana}/${stats.maxMana}`;
            document.getElementById('final-spells').textContent = stats.spellsUnlocked || 0;
        }
        
        // Débloquer le mode infini si le mode difficile est terminé
        if (this.difficulty === 'hard' && !this.hardModeCompleted) {
            this.hardModeCompleted = true;
            localStorage.setItem('hardModeCompleted', 'true');
            console.log('🔓 Mode Infini débloqué !');
            
            // Recréer l'écran de difficulté pour afficher le nouveau bouton
            if (this.difficultyScreen && this.difficultyScreen.parentNode) {
                document.body.removeChild(this.difficultyScreen);
            }
            this.createDifficultyScreen();
            
            // Afficher un message
            const unlockMsg = document.createElement('div');
            unlockMsg.style.cssText = `
                position: absolute;
                bottom: 150px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #9400D3 0%, #4B0082 100%);
                color: #ffd700;
                padding: 20px 40px;
                border-radius: 15px;
                font-size: 24px;
                font-weight: bold;
                border: 2px solid #ffd700;
                box-shadow: 0 5px 20px rgba(148, 0, 211, 0.8);
            `;
            unlockMsg.textContent = '🔓 Mode INFINI débloqué !';
            this.victoryScreen.appendChild(unlockMsg);
        }
        
        document.exitPointerLock();
        document.body.style.cursor = 'default';
        
        console.log('🏆 Écran de victoire affiché');
    }

    hideVictory() {
        this.victoryScreen.style.display = 'none';
        this.isInMenu = false;
    }}
