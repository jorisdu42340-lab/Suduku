// Données du jeu « Guerre des âges ».
//
// Chaque rôle a des statistiques de base (celles de la Préhistoire) ; à chaque
// âge, les statistiques sont multipliées par FACTEUR_STATS et le coût par
// FACTEUR_COUT. « etoiles » est le niveau d'attaque affiché sur les boutons.

const FACTEUR_STATS = 2.2;
const FACTEUR_COUT = 1.9;

const ROLES = [
  { id: "melee", role: "Corps à corps", etoiles: 1, cout: 15, pv: 60, attaque: 10, portee: 22, vitesse: 42, cadence: 0.9, recharge: 1, taille: 34 },
  { id: "distance", role: "Tir à distance", etoiles: 2, cout: 25, pv: 40, attaque: 9, portee: 150, vitesse: 38, cadence: 1.2, recharge: 1.5, taille: 32 },
  { id: "tank", role: "Résistant", etoiles: 3, cout: 55, pv: 230, attaque: 16, portee: 24, vitesse: 30, cadence: 1.2, recharge: 3, taille: 40 },
  { id: "artillerie", role: "Dégâts de zone", etoiles: 4, cout: 90, pv: 70, attaque: 30, portee: 130, vitesse: 30, cadence: 2, recharge: 5, taille: 36, zone: 45 },
  { id: "colosse", role: "Colosse", etoiles: 5, cout: 160, pv: 520, attaque: 52, portee: 32, vitesse: 24, cadence: 1.6, recharge: 10, taille: 54 },
];

// projectile : un emoji, ou "fleche" / "laser" (dessinés au trait)
const ERES = [
  {
    nom: "Préhistoire", emoji: "🦴", base: "🛖", xpSuivante: 500,
    ciel: ["#fcd34d", "#fb923c"], sol: "#78350f", herbe: "#a16207",
    decor: ["🌋", "🌴", "🦕", "🌴"],
    tir: "🪨",
    pouvoir: { nom: "Pluie de météores", emoji: "☄️" },
    unites: [
      { nom: "Cogneur", emoji: "🧔" },
      { nom: "Frondeur", emoji: "🧒", projectile: "🪨" },
      { nom: "Mammouth", emoji: "🦣" },
      { nom: "Chaman", emoji: "🧌", projectile: "🔥" },
      { nom: "Tyrannosaure", emoji: "🦖" },
    ],
  },
  {
    nom: "Moyen Âge", emoji: "🛡️", base: "🏰", xpSuivante: 2000,
    ciel: ["#7dd3fc", "#38bdf8"], sol: "#365314", herbe: "#4d7c0f",
    decor: ["🌲", "⛰️", "🌲", "🏞️"],
    tir: "fleche",
    pouvoir: { nom: "Pluie de flèches", emoji: "🏹" },
    unites: [
      { nom: "Garde", emoji: "💂" },
      { nom: "Archer", emoji: "🧝", projectile: "fleche" },
      { nom: "Chevalier", emoji: "🏇" },
      { nom: "Mage", emoji: "🧙", projectile: "🔥" },
      { nom: "Dragon", emoji: "🐉" },
    ],
  },
  {
    nom: "Futur", emoji: "🚀", base: "🏙️", xpSuivante: null,
    ciel: ["#312e81", "#7c3aed"], sol: "#1e1b4b", herbe: "#6366f1",
    decor: ["🛰️", "🌆", "🪐", "🌆"],
    tir: "laser",
    pouvoir: { nom: "Frappe orbitale", emoji: "💫" },
    unites: [
      { nom: "Androïde", emoji: "🤖" },
      { nom: "Tireur laser", emoji: "👩‍🚀", projectile: "laser" },
      { nom: "Blindé", emoji: "🚜" },
      { nom: "Ovni", emoji: "🛸", projectile: "⚡" },
      { nom: "Titan", emoji: "👾" },
    ],
  },
];

const DIFFICULTES = {
  facile: { nom: "Facile", revenu: 0.7, reflexion: 2.2 },
  normal: { nom: "Normal", revenu: 1, reflexion: 1.4 },
  difficile: { nom: "Difficile", revenu: 1.5, reflexion: 0.7 },
};
