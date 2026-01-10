# 🪄 Magic Arena - Guide du Jeu

## 📖 Présentation

**Magic Arena** est un jeu d'action/combat inspiré de l'univers Harry Potter. Affrontez une succession de boss légendaires dans une arène magique en utilisant vos sorts et votre agilité pour survivre !

### 🎯 Objectif
Vaincre les 7 boss en progressant à travers trois niveaux de difficulté :
- **NORMAL** : Dégâts standards, mode apprentissage
- **DIFFICILE** : Dégâts augmentés de 50%, vrai défi
- **INFINI** : Boss aléatoires avec boost de +10% à chaque victoire

---

## 🎮 Contrôles du Jeu

### Déplacement
- **Z/W** : Avancer
- **S** : Reculer
- **Q/A** : Gauche
- **D** : Droite
- **ESPACE** : Sauter
- **SHIFT** : Sprint
- **SOURIS** : Regarder autour

### Combat
- **CLIC GAUCHE** : Lancer un sort
- **Q** : Ouvrir/fermer la roue des sorts
- **1-4** : Sélectionner rapidement un sort équipé
- **E** : Ramasser une potion

### Interface
- **ÉCHAP** : Pause / Menu
- **TAB** : Inventaire des sorts

---

## 🔮 Système de Sorts

### Sorts de Base
- **Expelliarmus** 🔵 : Sort de désarmement (20 dégâts)
- **Protego** 🟢 : Bouclier de protection (3 secondes d'invulnérabilité)

### Sorts Débloquables
Récupérez de nouveaux sorts en battant les boss :
- **Incendio** 🔥 : Boule de feu avec dégâts sur la durée
- **Stupefix** 💜 : Étourdit l'ennemi
- **Protego Maxima** 💚 : Bouclier amélioré
- **Sectumsempra** 🩸 : Sort tranchant puissant

### Emplacements de Sorts
Équipez jusqu'à **4 sorts** simultanément via l'inventaire (TAB).

---

## 🧙 Les Boss

### 1. **Quirrell** 👨‍🏫
- **HP** : 200
- **Type** : Corps à corps
- **Modèle** : Sorcier animé
- **Récompense** : Sort Incendio

### 2. **Basilic** 🐍
- **HP** : 300
- **Type** : Corps à corps rapide
- **Modèle** : Serpent géant
- **Récompense** : Aucune

### 3. **Détraqueur** 👻
- **HP** : 500
- **Type** : Corps à corps
- **Modèle** : Fantôme
- **Récompense** : Sort Stupefix

### 4. **Voldemort (Partie 1)** 🐍💀
- **HP** : 1500
- **Type** : **Attaque à distance** (sorts verts)
- **Dégâts** : 75 PV par sort
- **Modèle** : Sorcier noir
- **Particularité** : S'enfuit à 50% de vie

### 5. **Ombrage** 💗
- **HP** : 800
- **Type** : **Attaque à distance** (sorts roses)
- **Dégâts** : 50 PV par sort
- **Modèle** : Sorcière rose
- **Récompense** : Sort Protego Maxima

### 6. **Bellatrix** 🟣
- **HP** : 1000
- **Type** : **Attaque à distance** (sorts violets)
- **Dégâts** : 70 PV par sort
- **Vitesse** : Rapide
- **Modèle** : Sorcière
- **Récompense** : Sort Sectumsempra

### 7. **Voldemort Final** ⚡💀
- **HP** : 1500
- **Type** : **Attaque à distance** (sorts verts rapides)
- **Dégâts** : 80 PV par sort
- **Vitesse** : Très rapide
- **Modèle** : Sorcier sombre renforcé
- **Récompense** : Victoire finale !

---

## 🧪 Système de Potions

Les potions apparaissent progressivement pendant le combat :
- **Potion de PV** ❤️ : Restaure 50 points de vie
- **Potion de Mana** 💙 : Restaure 100 points de mana
- **Potion Boost Attaque** ⚔️ : +50% de dégâts pendant 10 secondes
- **Potion Boost Défense** 🛡️ : -50% de dégâts reçus pendant 10 secondes

Appuyez sur **E** à proximité pour les ramasser.

---

## 🎯 Stratégies de Combat

### Boss au Corps à Corps (Quirrell, Basilic, Détraqueur)
- Gardez vos distances
- Utilisez Protego quand ils sont proches
- Attaquez en reculant

### Boss Lanceurs de Sorts (Voldemort, Ombrage, Bellatrix)
- **Esquivez les projectiles** en vous déplaçant latéralement
- Ils avancent lentement : profitez-en !
- Les sorts sont **visibles** et peuvent être évités
- Utilisez Protego en dernier recours

---

## 🐛 Touches de Debug (Pour les Tests)

### ⚠️ ATTENTION : Ces touches sont destinées aux développeurs/testeurs

- **B** : Tuer instantanément le boss actuel
  - Réduit immédiatement les HP du boss à 0
  - Déclenche l'animation de mort
  - Passe au boss suivant

### 📝 Note
Il n'existe pas de touche pour "finir instantanément la manche" car le jeu est conçu pour être joué de manière progressive. Cependant, vous pouvez :
1. Utiliser **B** pour tuer chaque boss un par un
2. Utiliser le **mode INFINI** après avoir complété le mode DIFFICILE
3. Ajuster la difficulté dans le menu principal

---

## 💡 Astuces

1. **Gérez votre mana** : Les sorts puissants consomment beaucoup de mana
2. **Utilisez les potions** : Elles peuvent renverser le cours d'un combat
3. **Équilibrez vos sorts** : Ayez toujours au moins un sort défensif
4. **Patterns des boss** : Apprenez leurs comportements d'attaque
5. **Esquive > Bouclier** : Protego a un cooldown, mieux vaut esquiver quand possible

---

## 🏆 Progression

1. **Terminez le mode NORMAL** pour débloquer le mode DIFFICILE
2. **Terminez le mode DIFFICILE** pour débloquer le mode INFINI
3. **Survivez le plus longtemps possible** en mode INFINI pour prouver votre maîtrise

---

## 🎨 Crédits

Développé avec **Three.js** et **Vite**
- Modèles 3D : AnimatedWizard.glb, Snake.glb, Ghost.glb, Witch.glb
- Système de sorts inspiré de l'univers Harry Potter

---

## 🔗 Liens

- **GitHub Repository** : [Univercraft/Magic-Arena](https://github.com/Univercraft/Magic-Arena)
- **Jouer en ligne** : [https://univercraft.github.io/Magic-Arena/](https://univercraft.github.io/Magic-Arena/)

---

**Bonne chance, jeune sorcier ! 🪄⚡**
