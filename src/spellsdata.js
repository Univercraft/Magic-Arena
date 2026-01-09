export const spells = {
  expelliarmus:  { mana: 5,  damage: 10, cooldown: 2000 },
  protego:       { mana: 10, shield: 3, cooldown: 3000 },
  incendio:      { mana: 15, damage: 15, dot: { amount: 5, duration: 10 }, cooldown: 3000 },
  stupéfix:      { mana: 20, damage: 50, stun: 5, cooldown: 5000 },
  protegoMaxima: { mana: 30, shield: 10, cooldown: 10000 },
  sectumsempra:  { mana: 50, damage: 200, cooldown: 5000 },

  // terrain
  arresto:       { mana: 10, stun: 5, cooldown: 4000 },
  bombarda:      { mana: 20, aoe: 5, damage: 25, cooldown: 5000 },
  bombardaMax:   { mana: 50, aoe: 15, damage: 50, cooldown: 8000 },
  diffindo:      { mana: 25, damage: 30, cooldown: 3000 },
  patronum:      { mana: 50, shield: 15, cooldown: 12000 },
  petrificus:    { mana: 25, damage: 10, stun: 7, cooldown: 6000 },

  // hardcore - Sorts Impardonnables
  impero:        { mana: 100, pacify: 10, cooldown: 15000 },
  endoloris:     { mana: 100, damage: 100, dot: { amount: 10, duration: 5 }, cooldown: 10000 },
  avada:         { mana: 200, hpPercent: 0.5, cooldown: 20000 },
};
