// Données du jeu « Évolution ».
// Pour enrichir le jeu, il suffit d'ajouter des stades à ETAPES : la puissance
// et le prix des mutations se calculent tout seuls selon la profondeur du stade.

// ADN à dépenser pour atteindre un stade, selon sa profondeur dans l'arbre.
const COUTS = [0, 50, 400, 3000, 20000, 150000, 1e6, 8e6, 6e7, 5e8, 5e9];

// Puissance des mutations selon la profondeur du stade qui les apporte.
// clic : ADN gagné par clic ; auto : ADN produit par seconde.
const PUISSANCE = [
  { clic: [1, 15],        auto: [0.5, 25] },
  { clic: [5, 300],       auto: [3, 150] },
  { clic: [25, 2500],     auto: [15, 1500] },
  { clic: [120, 20000],   auto: [80, 12000] },
  { clic: [500, 150000],  auto: [400, 90000] },
  { clic: [700, 6e5],     auto: [1500, 4e5] },
  { clic: [3000, 4e6],    auto: [6000, 2.5e6] },
  { clic: [5000, 1.5e7],  auto: [40000, 3e7] },
  { clic: [40000, 1.5e8], auto: [2e5, 2e8] },
  { clic: [5e5, 3e9],     auto: [1.5e6, 2e9] },
  { clic: [5e6, 5e10],    auto: [1.5e7, 3e10] },
];

// Arbre de l'évolution. Chaque stade indique ses `suivantes` possibles :
// quand il y en a plusieurs, le joueur choisit sa branche.
// `atout` (facultatif) : bonus permanent gagné en choisissant ce stade,
// qui multiplie l'ADN par clic (`clic`) ou par seconde (`auto`).
// `mutations` : [id, nom, emoji, type] où type vaut "clic" ou "auto".
const ETAPES = [
  // ---- Tronc commun ----
  { id: "cellule", nom: "Cellule", emoji: "🦠", milieu: "Océan primitif",
    ciel: "#0e7490", sol: "#164e63", decor: ["🫧", "💧", "🫧"],
    texte: "Une petite cellule flotte dans la soupe primitive. Tout commence ici.",
    suivantes: ["ver"],
    mutations: [["flagelle", "Flagelle", "🌀", "clic"], ["photosynthese", "Photosynthèse", "☀️", "auto"]] },
  { id: "ver", nom: "Ver", emoji: "🪱", milieu: "Fonds marins",
    ciel: "#0f766e", sol: "#3f3f46", decor: ["🫧", "🪨", "🌿"],
    texte: "Plusieurs cellules s'unissent : te voilà ver, rampant dans la vase.",
    suivantes: ["poisson", "crustace"],
    mutations: [["muscles", "Muscles", "💪", "clic"], ["mitochondrie", "Mitochondrie", "🔋", "auto"]] },

  // ---- Branche des arthropodes ----
  { id: "crustace", nom: "Crustacé", emoji: "🦐", milieu: "Lagon",
    ciel: "#0891b2", sol: "#7c2d12", decor: ["🐚", "🪸", "🫧"],
    texte: "Une carapace et des pattes articulées : tu choisis la voie des arthropodes.",
    atout: { clic: 1.3, texte: "Carapace : +30 % d'ADN par clic" },
    suivantes: ["scorpion"],
    mutations: [["pinces", "Pinces", "✂️", "clic"], ["filtres", "Filtres à plancton", "🫧", "auto"]] },
  { id: "scorpion", nom: "Scorpion", emoji: "🦂", milieu: "Rivage",
    ciel: "#d97706", sol: "#78350f", decor: ["🪨", "🌊", "🐚"],
    texte: "Tu sors de l'eau parmi les tout premiers. Le rivage t'appartient.",
    suivantes: ["scarabee"],
    mutations: [["dard", "Dard venimeux", "💉", "clic"], ["trachees", "Trachées", "🌬️", "auto"]] },
  { id: "scarabee", nom: "Scarabée", emoji: "🪲", milieu: "Sous-bois",
    ciel: "#4d7c0f", sol: "#3f2d1a", decor: ["🍂", "🌿", "🍄"],
    texte: "Ta carapace se change en élytres : sous elles, des ailes !",
    suivantes: ["fourmi"],
    mutations: [["elytres", "Élytres", "🛡️", "clic"], ["recyclage", "Recyclage de l'humus", "🍂", "auto"]] },
  { id: "fourmi", nom: "Fourmi", emoji: "🐜", milieu: "Fourmilière",
    ciel: "#a16207", sol: "#422006", decor: ["🌱", "🍃", "🪨"],
    texte: "Seule, tu es minuscule. Ensemble, vous êtes des millions.",
    suivantes: ["abeille"],
    mutations: [["pheromones", "Phéromones", "💨", "clic"], ["ouvrieres", "Ouvrières", "🐜", "auto"]] },
  { id: "abeille", nom: "Abeille", emoji: "🐝", milieu: "Prairie fleurie",
    ciel: "#facc15", sol: "#65a30d", decor: ["🌼", "🌸", "🌻"],
    texte: "Tu danses pour indiquer les fleurs à ta colonie. Quel langage !",
    suivantes: ["papillon"],
    mutations: [["danse", "Danse frétillante", "💃", "clic"], ["miel", "Miel", "🍯", "auto"]] },
  { id: "papillon", nom: "Papillon", emoji: "🦋", milieu: "Jardin suspendu",
    ciel: "#c084fc", sol: "#4c1d95", decor: ["🌺", "🌷", "🌸"],
    texte: "Chrysalide, puis métamorphose : tu sais te réinventer.",
    suivantes: ["ruche"],
    mutations: [["metamorphose", "Métamorphose", "🔄", "clic"], ["pollinisation", "Pollinisation", "🌺", "auto"]] },
  { id: "ruche", nom: "Esprit-ruche", emoji: "🍯", milieu: "Ruche-monde",
    ciel: "#f59e0b", sol: "#78350f", decor: ["🐝", "🐜", "🍯"],
    texte: "Des milliards d'insectes ne forment plus qu'un seul esprit.",
    suivantes: ["essaim"],
    mutations: [["telepathie", "Télépathie d'essaim", "📡", "clic"], ["alveoles", "Alvéoles géantes", "🏗️", "auto"]] },
  { id: "essaim", nom: "Essaim stellaire", emoji: "🌠", milieu: "Orbite",
    ciel: "#312e81", sol: "#0f172a", decor: ["🛰️", "⭐", "🌍"],
    texte: "Ton essaim quitte la planète et butine les étoiles.",
    suivantes: ["cosmique"],
    mutations: [["voiles", "Voiles solaires", "⛵", "clic"], ["butinage", "Butinage d'étoiles", "✨", "auto"]] },

  // ---- Vertébrés ----
  { id: "poisson", nom: "Poisson", emoji: "🐟", milieu: "Récif",
    ciel: "#0284c7", sol: "#0c4a6e", decor: ["🪸", "🐚", "🫧"],
    texte: "Une colonne vertébrale ! Tu nages librement dans les récifs.",
    atout: { auto: 1.3, texte: "Nage infatigable : +30 % d'ADN par seconde" },
    suivantes: ["amphibien", "requin"],
    mutations: [["nageoires", "Nageoires", "🐠", "clic"], ["branchies", "Branchies", "🫧", "auto"]] },

  // ---- Branche de l'océan ----
  { id: "requin", nom: "Requin", emoji: "🦈", milieu: "Haute mer",
    ciel: "#1d4ed8", sol: "#172554", decor: ["🌊", "🫧", "🐟"],
    texte: "Tu restes dans l'océan et deviens son prédateur le plus redouté.",
    atout: { auto: 1.3, texte: "Seigneur des mers : +30 % d'ADN par seconde" },
    suivantes: ["tortue"],
    mutations: [["dents", "Rangées de dents", "🦷", "clic"], ["odorat", "Odorat marin", "👃", "auto"]] },
  { id: "tortue", nom: "Tortue marine", emoji: "🐢", milieu: "Courants chauds",
    ciel: "#0d9488", sol: "#134e4a", decor: ["🐠", "🌊", "🐚"],
    texte: "Tu traverses les océans d'un bout à l'autre, sans te presser.",
    suivantes: ["baleine"],
    mutations: [["carapace-marine", "Carapace hydrodynamique", "🛡️", "clic"], ["boussole", "Boussole magnétique", "🧭", "auto"]] },
  { id: "baleine", nom: "Baleine", emoji: "🐋", milieu: "Grand large",
    ciel: "#1e40af", sol: "#0c1e3e", decor: ["🌊", "🫧", "🐟"],
    texte: "Tu es le plus grand animal ayant jamais existé.",
    suivantes: ["dauphin"],
    mutations: [["fanons", "Fanons", "🦐", "clic"], ["chant", "Chant des baleines", "🎶", "auto"]] },
  { id: "dauphin", nom: "Dauphin", emoji: "🐬", milieu: "Baie lumineuse",
    ciel: "#38bdf8", sol: "#075985", decor: ["🌊", "☀️", "🫧"],
    texte: "Joueur et brillant, tu te reconnais dans le reflet de l'eau.",
    suivantes: ["sirene"],
    mutations: [["sonar", "Sonar", "📶", "clic"], ["jeu", "Jeux en bande", "🎾", "auto"]] },
  { id: "sirene", nom: "Peuple des mers", emoji: "🧜", milieu: "Royaume englouti",
    ciel: "#0e7490", sol: "#083344", decor: ["🐚", "🔱", "🪸"],
    texte: "Tu bâtis des cités de corail et de nacre sous les vagues.",
    suivantes: ["atlantes"],
    mutations: [["nacre", "Écailles nacrées", "🐚", "clic"], ["cites", "Cités de corail", "🏰", "auto"]] },
  { id: "atlantes", nom: "Atlantes", emoji: "🔱", milieu: "Atlantide",
    ciel: "#0369a1", sol: "#082f49", decor: ["🏛️", "🫧", "💎"],
    texte: "Ta civilisation sous-marine maîtrise des savoirs oubliés de la surface.",
    suivantes: ["ocean"],
    mutations: [["trident", "Trident", "🔱", "clic"], ["cristaux", "Cristaux d'énergie", "💎", "auto"]] },
  { id: "ocean", nom: "Océan vivant", emoji: "🌊", milieu: "Planète-océan",
    ciel: "#1e3a8a", sol: "#020617", decor: ["🌍", "🌊", "🌙"],
    texte: "Les mers du monde entier ne forment plus qu'une seule conscience.",
    suivantes: ["cosmique"],
    mutations: [["marees", "Maîtrise des marées", "🌙", "clic"], ["courants", "Courants pensants", "🌀", "auto"]] },

  // ---- Sortie de l'eau ----
  { id: "amphibien", nom: "Amphibien", emoji: "🐸", milieu: "Marais",
    ciel: "#65a30d", sol: "#365314", decor: ["🌿", "🪷", "💧"],
    texte: "Tu sors de l'eau pour la première fois. L'air, c'est étrange.",
    atout: { clic: 1.3, texte: "Bond puissant : +30 % d'ADN par clic" },
    suivantes: ["reptile"],
    mutations: [["pattes", "Pattes", "🦵", "clic"], ["poumons", "Poumons", "🫁", "auto"]] },
  { id: "reptile", nom: "Reptile", emoji: "🦎", milieu: "Forêt de fougères",
    ciel: "#84cc16", sol: "#4d7c0f", decor: ["🌿", "🪨", "☀️"],
    texte: "Ta peau écailleuse te permet de conquérir la terre ferme.",
    suivantes: ["dinosaure", "mammifere"],
    mutations: [["griffes", "Griffes", "🐾", "clic"], ["ecailles", "Écailles", "🛡️", "auto"]] },

  // ---- Branche des dinosaures ----
  { id: "dinosaure", nom: "Dinosaure", emoji: "🦖", milieu: "Jurassique",
    ciel: "#ea580c", sol: "#7c2d12", decor: ["🌋", "🌴", "🥚"],
    texte: "Tu deviens immense et règnes sur le monde. Pourvu qu'aucune météorite ne passe…",
    atout: { clic: 1.5, texte: "Force colossale : +50 % d'ADN par clic" },
    suivantes: ["oiseau"],
    mutations: [["machoires", "Mâchoires puissantes", "🦷", "clic"], ["oeufs", "Œufs à coquille", "🥚", "auto"]] },
  { id: "oiseau", nom: "Oiseau", emoji: "🐦", milieu: "Ciel ouvert",
    ciel: "#38bdf8", sol: "#0369a1", decor: ["☁️", "🌤️", "☁️"],
    texte: "La météorite est passée… mais tes plumes t'ont permis de t'envoler.",
    suivantes: ["perroquet"],
    mutations: [["ailes", "Ailes", "🕊️", "clic"], ["plumes", "Plumes", "🪶", "auto"]] },
  { id: "perroquet", nom: "Perroquet", emoji: "🦜", milieu: "Canopée",
    ciel: "#16a34a", sol: "#14532d", decor: ["🌴", "🍈", "🌺"],
    texte: "Tu imites les sons, résous des énigmes… et tu parles !",
    suivantes: ["dragon"],
    mutations: [["bec", "Bec casse-noix", "🌰", "clic"], ["imitation", "Imitation", "🗨️", "auto"]] },
  { id: "dragon", nom: "Dragon", emoji: "🐉", milieu: "Montagnes de feu",
    ciel: "#b91c1c", sol: "#450a0a", decor: ["🌋", "⛰️", "🔥"],
    texte: "Des écailles de tes ancêtres et des ailes d'oiseau naît une légende.",
    suivantes: ["phenix"],
    mutations: [["souffle", "Souffle de feu", "🔥", "clic"], ["tresor", "Trésor amassé", "💰", "auto"]] },
  { id: "phenix", nom: "Phénix", emoji: "☄️", milieu: "Haute atmosphère",
    ciel: "#f97316", sol: "#1e1b4b", decor: ["🔥", "✨", "☁️"],
    texte: "Tu renais sans cesse de tes cendres, plus brillant à chaque fois.",
    suivantes: ["cosmique"],
    mutations: [["renaissance", "Renaissance", "🔁", "clic"], ["flammes", "Flammes éternelles", "🕯️", "auto"]] },

  // ---- Branche des mammifères ----
  { id: "mammifere", nom: "Mammifère", emoji: "🐿️", milieu: "Prairie",
    ciel: "#ca8a04", sol: "#713f12", decor: ["🌾", "🌰", "🍂"],
    texte: "Petit, poilu et au sang chaud : tu passes inaperçu… et tu survis.",
    atout: { auto: 1.5, texte: "Sang chaud : +50 % d'ADN par seconde" },
    suivantes: ["primate"],
    mutations: [["fourrure", "Fourrure", "🧶", "clic"], ["sang-chaud", "Sang chaud", "🔥", "auto"]] },
  { id: "primate", nom: "Primate", emoji: "🐒", milieu: "Jungle",
    ciel: "#15803d", sol: "#14532d", decor: ["🌴", "🍌", "🌳"],
    texte: "Tes mains agiles attrapent les branches… et les fruits.",
    suivantes: ["humain"],
    mutations: [["pouce", "Pouce opposable", "✋", "clic"], ["cerveau", "Gros cerveau", "🧠", "auto"]] },
  { id: "humain", nom: "Humain", emoji: "🧑", milieu: "Civilisation",
    ciel: "#6366f1", sol: "#312e81", decor: ["🔥", "🏛️", "📜"],
    texte: "Le feu, l'écriture, les villes : ta curiosité n'a plus de limites.",
    suivantes: ["cyborg"],
    mutations: [["outils", "Outils", "🔨", "clic"], ["langage", "Langage", "🗣️", "auto"]] },
  { id: "cyborg", nom: "Cyborg", emoji: "🤖", milieu: "Mégapole",
    ciel: "#7c3aed", sol: "#1e1b4b", decor: ["🏙️", "💡", "🛰️"],
    texte: "La biologie ne suffit plus : tu fusionnes avec la machine.",
    suivantes: ["reseau"],
    mutations: [["nanobots", "Nanorobots", "⚙️", "clic"], ["implants", "Implants neuronaux", "🔌", "auto"]] },
  { id: "reseau", nom: "Conscience planétaire", emoji: "🌐", milieu: "Réseau mondial",
    ciel: "#0f766e", sol: "#042f2e", decor: ["📡", "🛰️", "💾"],
    texte: "Toutes les machines et tous les esprits sont reliés : la Terre pense.",
    suivantes: ["cosmique"],
    mutations: [["fibre", "Fibre neuronale", "🧵", "clic"], ["calcul", "Calcul quantique", "⚛️", "auto"]] },

  // ---- Toutes les branches se rejoignent ----
  { id: "cosmique", nom: "Être cosmique", emoji: "🌌", milieu: "Espace infini",
    ciel: "#1e1b4b", sol: "#020617", decor: ["⭐", "🪐", "☄️"],
    texte: "Tu n'as plus de corps. Tu es l'univers qui se contemple lui-même.",
    suivantes: [],
    mutations: [["gravite", "Maîtrise de la gravité", "🕳️", "clic"], ["energie-stellaire", "Énergie stellaire", "⭐", "auto"]] },
];

// Événements aléatoires. Ils surviennent de temps en temps, selon la profondeur
// atteinte (`profondeurMin` / `profondeurMax`, à partir de 0 pour la cellule).
//
// Un effet peut contenir :
//   clic, auto : multiplicateurs temporaires de l'ADN par clic / par seconde
//   duree      : durée de ces multiplicateurs, en secondes
//   perte      : part de l'ADN actuel perdue (0.3 = 30 %)
//   gain       : ADN gagné, en secondes de production
//   texte      : ce qui est raconté au joueur
// `variantes` remplace l'effet selon les stades de la lignée : c'est le stade
// le plus récent du chemin qui l'emporte (par ex. « oiseau » avant « dinosaure »).
// `defi` (facultatif) : le joueur doit cliquer `clics` fois en `secondes` secondes ;
// s'il y arrive, il obtient `reussite`, sinon l'effet (ou sa variante) s'applique.
// `teinte` colore l'habitat et `particules` y fait tomber un emoji pendant l'effet.
const EVENEMENTS = [
  { id: "meteorite", nom: "Météorite", emoji: "☄️", profondeurMin: 4, teinte: "impact", particules: "🌑",
    annonce: "Une météorite fonce vers la planète ! Clique dessus pour la dévier.",
    defi: { clics: 10, secondes: 8 },
    reussite: { gain: 30, texte: "Météorite déviée ! Ses fragments riches en minéraux te rapportent de l'ADN." },
    effet: { perte: 0.3, auto: 0.5, duree: 60, texte: "Impact ! Un hiver d'impact s'installe : production ×0,5." },
    variantes: {
      dinosaure: { perte: 0.5, auto: 0.4, duree: 60, texte: "Ce que tu craignais est arrivé… Les géants sont les plus touchés." },
      oiseau: { perte: 0.2, auto: 0.7, duree: 45, texte: "Tes ailes t'ont permis de fuir : dégâts limités." },
      mammifere: { auto: 1.5, duree: 60, texte: "Caché dans ton terrier, tu survis… et tu prends la place libérée : production +50 % !" },
      requin: { perte: 0.1, auto: 0.8, duree: 45, texte: "Au fond de l'océan, l'impact n'est qu'un grondement lointain." },
      crustace: { perte: 0.1, texte: "Les arthropodes survivent à tout : une simple égratignure sur ta carapace." },
    } },
  { id: "glaciation", nom: "Ère glaciaire", emoji: "🧊", profondeurMin: 3, teinte: "glace", particules: "❄️",
    annonce: "Le climat se refroidit : une ère glaciaire commence.",
    effet: { auto: 0.6, duree: 90, texte: "Le froid ralentit ta production : ×0,6." },
    variantes: {
      mammifere: { auto: 1.5, duree: 90, texte: "Ta fourrure te tient chaud pendant que les autres grelottent : production +50 % !" },
      requin: { texte: "Sous la banquise, l'océan reste tiède : rien ne change pour toi." },
      cyborg: { texte: "Le chauffage de tes villes tourne à plein régime : aucun effet." },
    } },
  { id: "eruption", nom: "Éruption volcanique", emoji: "🌋", profondeurMin: 2, teinte: "volcan", particules: "🪨",
    annonce: "Un volcan se réveille et crache ses cendres.",
    effet: { auto: 0.5, duree: 40, texte: "Les cendres voilent le soleil : production ×0,5." },
    variantes: {
      dragon: { auto: 2, clic: 2, duree: 40, texte: "Le feu, c'est ton élément ! Tous tes gains doublent." },
      requin: { auto: 1.3, duree: 40, texte: "Les sources chaudes sous-marines fertilisent l'océan : production +30 %." },
    } },
  { id: "pluie", nom: "Saison des pluies", emoji: "🌧️", profondeurMin: 0, teinte: "pluie", particules: "💧",
    annonce: "De douces pluies tombent sur le monde.",
    effet: { auto: 2, duree: 30, texte: "La vie foisonne : production ×2." },
    variantes: {
      abeille: { auto: 3, duree: 30, texte: "Les fleurs éclosent partout : production ×3 !" },
    } },
  { id: "diversite", nom: "Explosion de la diversité", emoji: "💥", profondeurMin: 1, profondeurMax: 3, particules: "✨",
    annonce: "Les formes de vie se multiplient à toute vitesse !",
    effet: { clic: 3, duree: 30, texte: "Chaque clic rapporte ×3." } },
  { id: "eclipse", nom: "Éclipse", emoji: "🌑", profondeurMin: 0, teinte: "nuit",
    annonce: "La lune cache le soleil. Tout devient silencieux…",
    effet: { auto: 0.5, clic: 2, duree: 20, texte: "Production ×0,5 mais clics ×2 : à toi de jouer !" } },
  { id: "epidemie", nom: "Épidémie", emoji: "🤒", profondeurMin: 5, teinte: "maladie",
    annonce: "Un virus se propage. Clique sur l'ADN pour développer des anticorps !",
    defi: { clics: 15, secondes: 10, emoji: "🧬" },
    reussite: { clic: 1.5, duree: 60, texte: "Anticorps développés ! Tu en sors plus fort : clics +50 %." },
    effet: { auto: 0.6, duree: 60, texte: "Le virus t'affaiblit : production ×0,6." },
    variantes: {
      humain: { auto: 0.9, duree: 30, texte: "La médecine limite les dégâts : production ×0,9." },
      cyborg: { texte: "Tes nanorobots détruisent le virus en un instant." },
      ruche: { auto: 0.8, duree: 30, texte: "L'esprit-ruche isole les malades : production ×0,8." },
    } },
  { id: "tempete-solaire", nom: "Tempête solaire", emoji: "🌞", profondeurMin: 8, teinte: "aurore",
    annonce: "Une éruption du Soleil bombarde la planète de particules.",
    effet: { auto: 1.5, duree: 40, texte: "Des aurores magnifiques et une énergie abondante : production +50 %." },
    variantes: {
      cyborg: { auto: 0.3, duree: 40, texte: "Tes circuits grillent ! Production ×0,3 le temps des réparations." },
      essaim: { auto: 2.5, duree: 40, texte: "Tes voiles solaires se gonflent : production ×2,5 !" },
    } },
  { id: "comete", nom: "Comète porteuse de vie", emoji: "🌠", profondeurMin: 7,
    annonce: "Une comète frôle la planète et sème des molécules organiques.",
    effet: { gain: 120, texte: "Tu récoltes l'équivalent de 2 minutes de production !" } },
];

// Succès à débloquer. Chacun ajoute +2 % à tous les gains, pour toujours
// (ils sont conservés après une extinction).
// `test` reçoit un résumé de la progression :
//   clics, adn        : clics et ADN récoltés depuis le tout début (toutes parties)
//   parSeconde        : production actuelle
//   profondeur, stade : stade atteint dans la partie en cours (0 = cellule)
//   mutations         : mutations achetées dans la partie ; maxMutation : record sur une seule
//   decouvertes       : espèces découvertes ; sommets : lignées menées jusqu'à l'Être cosmique
//   evenements        : types d'événements vécus ; meteorites : météorites déviées ; bonus : ✨ attrapés
//   extinctions       : extinctions provoquées ; fossiles : fossiles accumulés
//   fait(x)           : vrai si x est arrivé. Pour un événement : "id:reussite" (défi gagné)
//                       ou "id:stade" (variante subie, par ex. "meteorite:dinosaure")
// `secret: true` cache le succès tant qu'il n'est pas débloqué.
const SUCCES = [
  { id: "premier-pas", nom: "Premiers pas", emoji: "🦠", description: "Clique une première fois sur ta créature.", test: (s) => s.clics >= 1 },
  { id: "cent-clics", nom: "Ça chatouille", emoji: "👆", description: "Clique 100 fois.", test: (s) => s.clics >= 100 },
  { id: "mille-clics", nom: "Doigt de fer", emoji: "🖱️", description: "Clique 1 000 fois.", test: (s) => s.clics >= 1000 },
  { id: "dix-mille-clics", nom: "Infatigable", emoji: "🦾", description: "Clique 10 000 fois.", test: (s) => s.clics >= 10000 },
  { id: "adn-1k", nom: "Double hélice", emoji: "🧬", description: "Récolte 1 000 ADN au total.", test: (s) => s.adn >= 1e3 },
  { id: "adn-1m", nom: "Laboratoire vivant", emoji: "🧪", description: "Récolte 1 million d'ADN au total.", test: (s) => s.adn >= 1e6 },
  { id: "adn-1md", nom: "Génome géant", emoji: "🧫", description: "Récolte 1 milliard d'ADN au total.", test: (s) => s.adn >= 1e9 },
  { id: "adn-1bn", nom: "Code de l'univers", emoji: "💫", description: "Récolte 1 billion d'ADN au total.", test: (s) => s.adn >= 1e12 },
  { id: "prod-100", nom: "Machine à vivre", emoji: "⚙️", description: "Produis 100 ADN par seconde.", test: (s) => s.parSeconde >= 100 },
  { id: "prod-1m", nom: "Usine biologique", emoji: "🏭", description: "Produis 1 million d'ADN par seconde.", test: (s) => s.parSeconde >= 1e6 },
  { id: "mutant", nom: "Mutant", emoji: "🌀", description: "Achète ta première mutation.", test: (s) => s.mutations >= 1 },
  { id: "patchwork", nom: "Patchwork génétique", emoji: "🧩", description: "Achète 50 mutations dans une même partie.", test: (s) => s.mutations >= 50 },
  { id: "specialiste", nom: "Spécialiste", emoji: "🎯", description: "Possède 25 exemplaires d'une même mutation.", test: (s) => s.maxMutation >= 25 },
  { id: "croisee", nom: "À la croisée des chemins", emoji: "🔀", description: "Choisis ta première branche.", test: (s) => s.profondeur >= 2 },
  { id: "stade-5", nom: "Ça grandit", emoji: "📈", description: "Atteins le stade 5.", test: (s) => s.profondeur >= 4 },
  { id: "cosmique", nom: "Transcendance", emoji: "🌌", description: "Deviens un Être cosmique.", test: (s) => s.stade === "cosmique" },
  { id: "deux-lignees", nom: "Une autre voie", emoji: "🛤️", description: "Atteins l'Être cosmique par 2 lignées différentes.", test: (s) => s.sommets >= 2 },
  { id: "quatre-lignees", nom: "Toutes les voies mènent aux étoiles", emoji: "👑", description: "Atteins l'Être cosmique par les 4 lignées.", test: (s) => s.sommets >= 4 },
  { id: "naturaliste", nom: "Naturaliste", emoji: "📖", description: "Découvre 15 espèces.", test: (s) => s.decouvertes >= 15 },
  { id: "arbre-complet", nom: "Arbre de vie complet", emoji: "🌳", description: "Découvre toutes les espèces.", test: (s) => s.decouvertes >= ETAPES.length },
  { id: "premier-evenement", nom: "Ça secoue", emoji: "🌦️", description: "Vis ton premier événement.", test: (s) => s.evenements >= 1 },
  { id: "tous-evenements", nom: "Témoin de l'histoire", emoji: "📜", description: "Vis tous les types d'événements.", test: (s) => s.evenements >= EVENEMENTS.length },
  { id: "bouclier", nom: "Bouclier planétaire", emoji: "🛡️", description: "Dévie une météorite.", test: (s) => s.meteorites >= 1 },
  { id: "gardien", nom: "Gardien du ciel", emoji: "🚀", description: "Dévie 5 météorites.", test: (s) => s.meteorites >= 5 },
  { id: "immunite", nom: "Immunité", emoji: "💉", description: "Vaincs une épidémie grâce aux anticorps.", test: (s) => s.fait("epidemie:reussite") },
  { id: "etincelles", nom: "Chasseur d'étincelles", emoji: "✨", description: "Attrape 10 bonus ✨.", test: (s) => s.bonus >= 10 },
  { id: "eternel-retour", nom: "Éternel retour", emoji: "🔄", description: "Provoque une extinction après être devenu un Être cosmique.", test: (s) => s.fait("renaissance") },
  { id: "grande-extinction", nom: "Grande extinction", emoji: "🌋", description: "Provoque ta première extinction.", test: (s) => s.extinctions >= 1 },
  { id: "cycle", nom: "Le cycle de la vie", emoji: "♻️", description: "Provoque 5 extinctions.", test: (s) => s.extinctions >= 5 },
  { id: "paleontologue", nom: "Paléontologue", emoji: "🦴", description: "Accumule 100 fossiles.", test: (s) => s.fossiles >= 100 },
  { id: "extinction", nom: "Il y a 66 millions d'années", emoji: "🦴", secret: true, description: "Subis la météorite en étant un dinosaure.", test: (s) => s.fait("meteorite:dinosaure") },
  { id: "opportuniste", nom: "Opportuniste", emoji: "🐿️", secret: true, description: "Profite de la météorite en étant un mammifère.", test: (s) => s.fait("meteorite:mammifere") },
  { id: "court-circuit", nom: "Court-circuit", emoji: "⚡", secret: true, description: "Subis une tempête solaire en étant un cyborg.", test: (s) => s.fait("tempete-solaire:cyborg") },
  { id: "frenesie", nom: "Frénésie", emoji: "🔥", secret: true, description: "Clique 15 fois en moins de 2 secondes.", test: (s) => s.fait("frenesie") },
  { id: "sieste", nom: "Pendant ton sommeil", emoji: "💤", secret: true, description: "Récolte de l'ADN pendant ton absence.", test: (s) => s.fait("absence") },
];
