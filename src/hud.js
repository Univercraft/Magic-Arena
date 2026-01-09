export function setupHUD() {
  const style = document.createElement("style");
  style.textContent = `
    #hud { position: fixed; left: 20px; bottom: 20px; color: white; font-family: Arial; z-index: 10; }
    .bar { width: 200px; height: 20px; background: #333; margin: 5px 0; border: 1px solid #111; }
    .fill { height: 100%; background: red; }
    .mana-fill { background: blue; }

    #bossbar { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10; }
  `;
  document.head.appendChild(style); // injecter style

  const hud = document.createElement("div");
  hud.id = "hud";
  hud.innerHTML = `
    <div class="bar"><div id="hp" class="fill"></div></div>
    <div class="bar"><div id="mana" class="fill mana-fill"></div></div>
  `;
  document.body.appendChild(hud);

  const bossbar = document.createElement("div");
  bossbar.id = "bossbar";
  bossbar.classList.add("bar");
  bossbar.style.width = "400px";
  bossbar.innerHTML = `<div id="bossHP" class="fill"></div>`;
  document.body.appendChild(bossbar);
}

export function updateHUD(player, boss) {
  const hp = document.getElementById("hp");
  const mana = document.getElementById("mana");
  const bossHP = document.getElementById("bossHP");

  if (!hp || !mana || !bossHP) return;

  hp.style.width = (player.stats.hp / player.stats.maxHp) * 100 + "%";
  mana.style.width = (player.stats.mana / player.stats.maxMana) * 100 + "%";
  bossHP.style.width = boss ? (boss.hp / boss.maxHp) * 100 + "%" : "0%";
}
