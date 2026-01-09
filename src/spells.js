import * as THREE from "three";
import { spells } from "./spellsdata.js";

let projectiles = [];
let lastCastTime = {};
export let currentSpell = "expelliarmus";
export let isWheelOpen = false;
export let unlockedSpells = ["expelliarmus", "protego"]; // débloqués au départ

export function setupSpells() {
  Object.keys(spells).forEach(key => lastCastTime[key] = 0);

  // Changer le sort avec touches 1 à 4
  window.addEventListener("keydown", e => {
    if (e.key >= "1" && e.key <= "4") {
      const spellKeys = unlockedSpells;
      const idx = parseInt(e.key) - 1;
      if (spellKeys[idx]) currentSpell = spellKeys[idx];
      closeWheel();
    }

    // Activer la roue avec Q
    if (e.key.toLowerCase() === "q") toggleWheel();
  });
}

function toggleWheel() {
  isWheelOpen = !isWheelOpen;
  const wheel = document.getElementById("spellWheel");
  if (isWheelOpen) {
    if (!wheel) createWheel();
    else wheel.style.display = "block";
  } else if (wheel) wheel.style.display = "none";
}

function closeWheel() {
  isWheelOpen = false;
  const wheel = document.getElementById("spellWheel");
  if (wheel) wheel.style.display = "none";
}

function createWheel() {
  const wheel = document.createElement("div");
  wheel.id = "spellWheel";
  wheel.style.position = "fixed";
  wheel.style.top = "50%";
  wheel.style.left = "50%";
  wheel.style.transform = "translate(-50%, -50%)";
  wheel.style.background = "rgba(0,0,0,0.7)";
  wheel.style.color = "white";
  wheel.style.padding = "20px";
  wheel.style.borderRadius = "50%";
  wheel.style.textAlign = "center";
  wheel.style.zIndex = 100;
  wheel.innerHTML = "<b>Choisis un sort :</b><br>" +
    unlockedSpells.map((s, i) => `${i+1} - ${s}`).join("<br>");
  document.body.appendChild(wheel);
}

// Couleurs par sort
const spellColors = {
  expelliarmus: 0x00ffff,
  protego: 0x00ff00,
  incendio: 0xff4500,
  stupéfix: 0xff00ff,
  protegoMaxima: 0x00aa00,
  sectumsempra: 0x880000,
  arresto: 0xffff00,
  bombarda: 0xffa500,
  bombardaMax: 0xff0000,
  diffindo: 0x0000ff,
  patronum: 0xffffff,
  petrificus: 0x00ffff,
  impero: 0x8800ff,
  endoloris: 0xff0088,
  avada: 0x000000
};

// Lancer un sort
export function castSpell(player, scene, boss) {
  if (isWheelOpen) return; // roue ouverte → pause

  const spell = spells[currentSpell];
  if (!spell || player.stats.mana < spell.mana) return;

  const now = Date.now();
  if (lastCastTime[currentSpell] + (spell.cooldown || 0) > now) return;

  player.stats.mana -= spell.mana;
  lastCastTime[currentSpell] = now;

  // Projectile offensif
  if (spell.damage || spell.aoe || spell.hpPercent) {
    const color = spellColors[currentSpell] || 0x00ffff;
    const proj = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color })
    );
    const globalPos = new THREE.Vector3();
    player.camera.getWorldPosition(globalPos);
    proj.position.copy(globalPos);

    proj.direction = new THREE.Vector3();
    player.camera.getWorldDirection(proj.direction);
    proj.speed = 5;
    proj.damage = spell.damage || 0;
    proj.aoe = spell.aoe || 0;
    proj.hpPercent = spell.hpPercent || 0;
    proj.dot = spell.dot ? { ...spell.dot, applied: 0 } : null;
    proj.stun = spell.stun || 0;
    proj.toDelete = false;

    scene.add(proj);
    projectiles.push(proj);
  }

  // Sorts de protection ou pacification
  if (spell.shield) {
    player.shield = spell.shield;
    player.shieldTime = spell.shield; // secondes
  }
  if (spell.pacify) boss.stunned = spell.pacify;
}

// Mettre à jour projectiles
export function updateProjectiles(scene, boss, delta) {
  if (!boss || !boss.position) return;

  projectiles.forEach(p => {
    p.position.add(p.direction.clone().multiplyScalar(p.speed * delta));

    const distance = p.position.distanceTo(boss.position);
    if (distance < 1.5) {
      if (p.damage) boss.hp -= p.damage;
      if (p.dot) {
        boss.dot = boss.dot || [];
        boss.dot.push({ amount: p.dot.amount, duration: p.dot.duration, time: 0 });
      }
      if (p.stun) boss.stunned = p.stun;
      if (p.hpPercent) boss.hp -= boss.maxHp * p.hpPercent;
      p.toDelete = true;
    }
  });

  projectiles = projectiles.filter(p => {
    if (p.toDelete) {
      scene.remove(p);
      return false;
    }
    return true;
  });
}

// Mettre à jour DOT du boss
export function updateBossDOT(boss, delta) {
  if (!boss.dot) return;
  boss.dot.forEach(d => {
    const dmgPerFrame = (d.amount / d.duration) * delta;
    boss.hp -= dmgPerFrame;
    d.time += delta;
  });
  boss.dot = boss.dot.filter(d => d.time < d.duration);
}
