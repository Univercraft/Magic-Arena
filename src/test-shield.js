// Test du bouclier
console.log('=== TEST DU BOUCLIER ===');

// 1. Le joueur a 100 PV
console.log(`PV initial: ${player.health}`);

// 2. Attaque sans bouclier
player.takeDamage(20);
console.log(`PV après attaque: ${player.health}`); // Devrait être 80

// 3. Activer Protego (touche 1 puis Espace)
spellManager.selectSpell(0); // Protego dans le slot 1
spellManager.castCurrentSpell(player.mana);

// 4. Attaque avec bouclier ACTIF
setTimeout(() => {
    player.takeDamage(20);
    console.log(`PV après attaque avec bouclier: ${player.health}`); // Devrait rester 80
}, 500);

// 5. Attaque après expiration du bouclier (après 3s)
setTimeout(() => {
    player.takeDamage(20);
    console.log(`PV après expiration du bouclier: ${player.health}`); // Devrait être 60
}, 3500);
