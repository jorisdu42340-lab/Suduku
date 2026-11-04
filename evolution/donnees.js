// Données du jeu « Évolution ».
// Pour enrichir le jeu, il suffit d'ajouter des entrées à ces tableaux.

// Stades d'évolution, dans l'ordre. `cout` : ADN à dépenser pour l'atteindre.
// `ciel` et `sol` colorent l'habitat ; `decor` flotte en arrière-plan.
const ETAPES = [
  { nom: "Cellule", emoji: "🦠", milieu: "Océan primitif", cout: 0,
    ciel: "#0e7490", sol: "#164e63", decor: ["🫧", "💧", "🫧"],
    texte: "Une petite cellule flotte dans la soupe primitive. Tout commence ici." },
  { nom: "Ver", emoji: "🪱", milieu: "Fonds marins", cout: 50,
    ciel: "#0f766e", sol: "#3f3f46", decor: ["🫧", "🪨", "🌿"],
    texte: "Plusieurs cellules s'unissent : te voilà ver, rampant dans la vase." },
  { nom: "Poisson", emoji: "🐟", milieu: "Récif", cout: 400,
    ciel: "#0284c7", sol: "#0c4a6e", decor: ["🪸", "🐚", "🫧"],
    texte: "Une colonne vertébrale ! Tu nages librement dans les récifs." },
  { nom: "Amphibien", emoji: "🐸", milieu: "Marais", cout: 3000,
    ciel: "#65a30d", sol: "#365314", decor: ["🌿", "🪷", "💧"],
    texte: "Tu sors de l'eau pour la première fois. L'air, c'est étrange." },
  { nom: "Reptile", emoji: "🦎", milieu: "Forêt de fougères", cout: 20000,
    ciel: "#84cc16", sol: "#4d7c0f", decor: ["🌿", "🪨", "☀️"],
    texte: "Ta peau écailleuse te permet de conquérir la terre ferme." },
  { nom: "Dinosaure", emoji: "🦖", milieu: "Jurassique", cout: 150000,
    ciel: "#ea580c", sol: "#7c2d12", decor: ["🌋", "🌴", "🥚"],
    texte: "Tu règnes sur le monde. Pourvu qu'aucune météorite ne passe…" },
  { nom: "Mammifère", emoji: "🐿️", milieu: "Prairie", cout: 1000000,
    ciel: "#ca8a04", sol: "#713f12", decor: ["🌾", "🌰", "🍂"],
    texte: "Petit, poilu et au sang chaud : tu as survécu à la catastrophe." },
  { nom: "Primate", emoji: "🐒", milieu: "Jungle", cout: 8000000,
    ciel: "#15803d", sol: "#14532d", decor: ["🌴", "🍌", "🌳"],
    texte: "Tes mains agiles attrapent les branches… et les fruits." },
  { nom: "Humain", emoji: "🧑", milieu: "Civilisation", cout: 60000000,
    ciel: "#6366f1", sol: "#312e81", decor: ["🔥", "🏛️", "📜"],
    texte: "Le feu, l'écriture, les villes : ta curiosité n'a plus de limites." },
  { nom: "Cyborg", emoji: "🤖", milieu: "Mégapole", cout: 500000000,
    ciel: "#7c3aed", sol: "#1e1b4b", decor: ["🏙️", "💡", "🛰️"],
    texte: "La biologie ne suffit plus : tu fusionnes avec la machine." },
  { nom: "Être cosmique", emoji: "🌌", milieu: "Espace infini", cout: 5000000000,
    ciel: "#1e1b4b", sol: "#020617", decor: ["⭐", "🪐", "☄️"],
    texte: "Tu n'as plus de corps. Tu es l'univers qui se contemple lui-même." },
];

// Mutations achetables. `type` : "clic" (ADN par clic) ou "auto" (ADN par seconde).
// `etape` : indice du stade à partir duquel la mutation apparaît.
// Le prix augmente de 15 % à chaque exemplaire acheté.
const MUTATIONS = [
  { id: "flagelle", nom: "Flagelle", emoji: "🌀", type: "clic", valeur: 1, prix: 15, etape: 0 },
  { id: "photosynthese", nom: "Photosynthèse", emoji: "☀️", type: "auto", valeur: 0.5, prix: 25, etape: 0 },
  { id: "mitochondrie", nom: "Mitochondrie", emoji: "🔋", type: "auto", valeur: 3, prix: 150, etape: 1 },
  { id: "muscles", nom: "Muscles", emoji: "💪", type: "clic", valeur: 5, prix: 300, etape: 1 },
  { id: "branchies", nom: "Branchies", emoji: "🫧", type: "auto", valeur: 15, prix: 1500, etape: 2 },
  { id: "nageoires", nom: "Nageoires", emoji: "🐠", type: "clic", valeur: 25, prix: 2500, etape: 2 },
  { id: "poumons", nom: "Poumons", emoji: "🫁", type: "auto", valeur: 80, prix: 12000, etape: 3 },
  { id: "pattes", nom: "Pattes", emoji: "🦵", type: "clic", valeur: 120, prix: 20000, etape: 3 },
  { id: "ecailles", nom: "Écailles", emoji: "🛡️", type: "auto", valeur: 400, prix: 90000, etape: 4 },
  { id: "oeufs", nom: "Œufs à coquille", emoji: "🥚", type: "auto", valeur: 1500, prix: 400000, etape: 5 },
  { id: "machoires", nom: "Mâchoires puissantes", emoji: "🦷", type: "clic", valeur: 700, prix: 600000, etape: 5 },
  { id: "sang-chaud", nom: "Sang chaud", emoji: "🔥", type: "auto", valeur: 6000, prix: 2500000, etape: 6 },
  { id: "pouce", nom: "Pouce opposable", emoji: "✋", type: "clic", valeur: 5000, prix: 15000000, etape: 7 },
  { id: "cerveau", nom: "Gros cerveau", emoji: "🧠", type: "auto", valeur: 40000, prix: 30000000, etape: 7 },
  { id: "outils", nom: "Outils", emoji: "🔨", type: "clic", valeur: 40000, prix: 150000000, etape: 8 },
  { id: "langage", nom: "Langage", emoji: "🗣️", type: "auto", valeur: 200000, prix: 200000000, etape: 8 },
  { id: "implants", nom: "Implants neuronaux", emoji: "🔌", type: "auto", valeur: 1500000, prix: 2000000000, etape: 9 },
  { id: "nanobots", nom: "Nanorobots", emoji: "⚙️", type: "clic", valeur: 500000, prix: 3000000000, etape: 9 },
  { id: "energie-stellaire", nom: "Énergie stellaire", emoji: "⭐", type: "auto", valeur: 15000000, prix: 30000000000, etape: 10 },
];
