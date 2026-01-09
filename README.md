# ⚡ Magic Arena - Harry Potter Three.js Game

## 📋 Description

Jeu de combat rogue-like en 3D inspiré de l'univers Harry Potter, développé avec **Three.js** et **Vite**.

Combattez une série de boss iconiques, débloquez des sorts puissants, et testez vos compétences en mode Infini !

## 🎮 Fonctionnalités

### Modes de jeu
- **Normal** : Régénération 2%/s, stats équilibrées
- **Difficile** : Pas de régénération, ennemis +10% HP/Dégâts
- **Infini** : Mode débloqué après avoir terminé le mode Difficile
  - Boss aléatoires infinis
  - Sorts Impardonnables débloqués (Impero, Endoloris, Avada Kedavra)
  - Stats maximales (200 HP/Mana)
  - Compteur de boss éliminés

### Système de progression
- 6 boss à affronter avec difficultés croissantes
- Level up automatique : +20 HP/Mana après chaque boss
- Déblocage de sorts puissants en récompense
- Sorts récupérables sur le terrain (max 5 par partie, après le 2ème boss)

### Sorts disponibles
**Sorts de base :**
- Protego : Bouclier invulnérable 3s
- Expelliarmus : Désarme l'ennemi

**Sorts débloquables :**
- Incendio : Dégâts + brûlure continue
- Stupéfix : Gros dégâts + stun 5s
- Protego Maxima : Bouclier renforcé
- Sectumsempra : Dégâts massifs

**Sorts du terrain :**
- Arresto Momentum : Stun 5s
- Bombarda / Bombarda Maxima : Dégâts de zone
- Diffindo : Dégâts tranchants
- Spero Patronum : Bouclier puissant
- Petrificus Totalus : Pétrification 7s

**Sorts Impardonnables (Mode Infini uniquement) :**
- Impero : Pacifie la cible 10s
- Endoloris : 100 dégâts + 10 dégâts/s pendant 5s
- Avada Kedavra : Retire 50% des HP restants

### Système de potions
- 🧪 Potions de soin (+50 HP)
- 💙 Potions de mana (+30 Mana)
- ⚔️ Potions d'attaque (x2 dégâts, 15s)
- 🛡️ Potions de défense (/2 dégâts reçus, 15s)

## 🎯 Contrôles

### Déplacement
- **ZQSD / WASD** : Se déplacer
- **Souris** : Regarder autour

### Combat
- **1, 2, 3, 4** : Sélectionner un sort
- **Clic gauche / Espace** : Lancer le sort
- **Q** : Ouvrir la roue de configuration des sorts

### Système
- **Échap** : Pause / Menu
- **V** : Accès direct à l'écran de victoire (debug, à retirer)

## 🚀 Installation

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation locale

```bash
# Cloner le dépôt
git clone <votre-repo-url>
cd HarryPotterThreeJS

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

## 🌐 Déploiement GitHub Pages

Le projet est automatiquement déployé sur GitHub Pages via GitHub Actions.

**URL de démo :** `https://<votre-username>.github.io/<nom-du-repo>/`

### Configuration manuelle

1. Activer GitHub Pages dans les paramètres du dépôt
2. Sélectionner la branche `gh-pages` comme source
3. Le site sera disponible après le premier déploiement

## 📁 Structure du projet

```
HarryPotterThreeJS/
├── public/              # Fichiers statiques
├── src/
│   ├── assets/          # Ressources (textures, sons, etc.)
│   ├── entities/        # Entités du jeu (Boss, Player, Arena, etc.)
│   │   ├── Arena.js
│   │   ├── Boss.js
│   │   ├── Player.js
│   │   ├── Potion.js
│   │   └── SpellPickup.js
│   ├── managers/        # Gestionnaires de systèmes
│   │   ├── BossManager.js
│   │   ├── PotionManager.js
│   │   ├── ShieldManager.js
│   │   └── SpellManager.js
│   ├── ui/              # Interface utilisateur
│   │   ├── MenuManager.js
│   │   ├── SpellUI.js
│   │   └── SpellWheel.js
│   ├── controls/        # Contrôles du joueur
│   │   └── SpellControls.js
│   ├── main.js          # Point d'entrée principal
│   ├── spellsdata.js    # Configuration des sorts
│   └── style.css        # Styles CSS
├── index.html           # Page HTML principale
├── package.json         # Dépendances npm
├── vite.config.js       # Configuration Vite
└── README.md            # Ce fichier
```

## 🛠️ Technologies utilisées

- **Three.js** (v0.181.2) : Moteur 3D
- **Vite** (v7.2.4) : Build tool et dev server
- **Vue 3** (v3.5.24) : Framework JavaScript (minimal, mostly vanilla JS)
- **JavaScript ES6+** : Langage principal

## 🎨 Caractéristiques techniques

- Rendu 3D temps réel avec Three.js
- Système de particules pour les effets visuels
- Gestion des collisions
- Système de cooldown pour les sorts
- Sauvegarde de progression (localStorage pour le mode Infini)
- Interface utilisateur responsive
- Animations fluides

## 📝 Notes de développement

### Difficulté
Le système de difficulté modifie :
- La régénération des HP du joueur
- Les HP et dégâts des boss
- L'accès aux sorts Impardonnables (mode Infini)

### Mode Infini
Le mode Infini se débloque automatiquement après avoir terminé le mode Difficile. Il peut être réinitialisé via le bouton de reset dans l'écran de sélection de difficulté.

### Boss
1. **Quirrell** (Violet) - Boss d'introduction
2. **Basilic** (Vert) - Boss rapide
3. **Dementor** (Noir) - Boss résistant
4. **Voldemort Part 1** (Gris foncé) - Boss intermédiaire qui fuit à 50% HP
5. **Ombrage** (Rose) - Boss de contrôle
6. **Bellatrix** (Gris) - Boss rapide et agressif
7. **Voldemort Final** (Gris clair) - Boss final

## 👨‍💻 Auteur

Projet réalisé dans le cadre du cours R507 - Dispositif Interactif (MMI3)

## 📄 Licence

Ce projet est un projet éducatif.
