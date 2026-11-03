// Banque de questions du quiz de culture générale.
// Chaque question : catégorie, intitulé, choix possibles, index de la bonne réponse, explication.
const QUESTIONS = [
  // ---------- Histoire ----------
  { categorie: "Histoire", question: "En quelle année a eu lieu la prise de la Bastille ?", choix: ["1789", "1792", "1776", "1815"], reponse: 0, explication: "La Bastille a été prise le 14 juillet 1789, au début de la Révolution française." },
  { categorie: "Histoire", question: "Qui fut le premier empereur des Français ?", choix: ["Louis XIV", "Napoléon Bonaparte", "Charlemagne", "Napoléon III"], reponse: 1, explication: "Napoléon Bonaparte est sacré empereur le 2 décembre 1804 à Notre-Dame de Paris." },
  { categorie: "Histoire", question: "En quelle année le mur de Berlin est-il tombé ?", choix: ["1985", "1991", "1989", "1961"], reponse: 2, explication: "Le mur de Berlin est tombé dans la nuit du 9 au 10 novembre 1989." },
  { categorie: "Histoire", question: "Quelle civilisation a construit le Machu Picchu ?", choix: ["Les Aztèques", "Les Mayas", "Les Olmèques", "Les Incas"], reponse: 3, explication: "Le Machu Picchu a été bâti par les Incas au XVe siècle, au Pérou." },
  { categorie: "Histoire", question: "Qui était surnommée « la Pucelle d'Orléans » ?", choix: ["Jeanne d'Arc", "Catherine de Médicis", "Aliénor d'Aquitaine", "Marie-Antoinette"], reponse: 0, explication: "Jeanne d'Arc a fait lever le siège d'Orléans en 1429 pendant la guerre de Cent Ans." },
  { categorie: "Histoire", question: "En quelle année l'Homme a-t-il marché sur la Lune pour la première fois ?", choix: ["1965", "1969", "1972", "1957"], reponse: 1, explication: "Neil Armstrong pose le pied sur la Lune le 21 juillet 1969 (heure de Paris) lors de la mission Apollo 11." },
  { categorie: "Histoire", question: "Quel pharaon est célèbre pour son tombeau découvert presque intact en 1922 ?", choix: ["Ramsès II", "Khéops", "Toutânkhamon", "Akhenaton"], reponse: 2, explication: "Howard Carter découvre le tombeau de Toutânkhamon dans la Vallée des Rois en 1922." },

  // ---------- Géographie ----------
  { categorie: "Géographie", question: "Quelle est la capitale de l'Australie ?", choix: ["Sydney", "Melbourne", "Canberra", "Perth"], reponse: 2, explication: "Canberra a été choisie comme capitale en compromis entre Sydney et Melbourne." },
  { categorie: "Géographie", question: "Quel est le plus long fleuve de France ?", choix: ["La Seine", "La Loire", "Le Rhône", "La Garonne"], reponse: 1, explication: "La Loire mesure environ 1 000 km, ce qui en fait le plus long fleuve de France." },
  { categorie: "Géographie", question: "Quel est le plus grand océan du monde ?", choix: ["Atlantique", "Indien", "Arctique", "Pacifique"], reponse: 3, explication: "L'océan Pacifique couvre environ un tiers de la surface de la Terre." },
  { categorie: "Géographie", question: "Quel est le plus haut sommet du monde ?", choix: ["Le K2", "Le mont Everest", "Le Kilimandjaro", "Le mont Blanc"], reponse: 1, explication: "L'Everest culmine à 8 849 m, à la frontière entre le Népal et la Chine." },
  { categorie: "Géographie", question: "Dans quel pays se trouve la ville de Marrakech ?", choix: ["Tunisie", "Algérie", "Maroc", "Égypte"], reponse: 2, explication: "Marrakech, surnommée « la ville rouge », se trouve au Maroc." },
  { categorie: "Géographie", question: "Quel pays possède le plus d'habitants en 2025 ?", choix: ["Chine", "Inde", "États-Unis", "Indonésie"], reponse: 1, explication: "L'Inde a dépassé la Chine en 2023 et est désormais le pays le plus peuplé du monde." },
  { categorie: "Géographie", question: "Combien de continents compte-t-on traditionnellement en France ?", choix: ["5", "6", "7", "4"], reponse: 0, explication: "En France, on enseigne souvent 5 continents (Europe, Afrique, Amérique, Asie, Océanie), comme les anneaux olympiques." },
  { categorie: "Géographie", question: "Quel désert est le plus grand désert chaud du monde ?", choix: ["Le Gobi", "Le Kalahari", "Le Sahara", "L'Atacama"], reponse: 2, explication: "Le Sahara s'étend sur environ 9 millions de km² en Afrique du Nord." },

  // ---------- Sciences ----------
  { categorie: "Sciences", question: "Quel est le symbole chimique de l'or ?", choix: ["Or", "Au", "Ag", "Go"], reponse: 1, explication: "Au vient du latin « aurum ». Ag est le symbole de l'argent." },
  { categorie: "Sciences", question: "Quelle planète est surnommée la « planète rouge » ?", choix: ["Vénus", "Jupiter", "Mars", "Mercure"], reponse: 2, explication: "Mars doit sa couleur à l'oxyde de fer présent à sa surface." },
  { categorie: "Sciences", question: "Combien d'os compte le squelette d'un adulte humain ?", choix: ["186", "206", "226", "306"], reponse: 1, explication: "Un adulte possède 206 os ; un nouveau-né en a davantage, certains fusionnant avec l'âge." },
  { categorie: "Sciences", question: "Quel gaz les plantes absorbent-elles pour réaliser la photosynthèse ?", choix: ["L'oxygène", "L'azote", "Le dioxyde de carbone", "L'hélium"], reponse: 2, explication: "Les plantes captent le CO₂ et rejettent de l'oxygène grâce à la lumière." },
  { categorie: "Sciences", question: "Qui a formulé la théorie de la relativité ?", choix: ["Isaac Newton", "Albert Einstein", "Marie Curie", "Niels Bohr"], reponse: 1, explication: "Einstein publie la relativité restreinte en 1905 et la relativité générale en 1915." },
  { categorie: "Sciences", question: "À quelle température l'eau bout-elle au niveau de la mer ?", choix: ["90 °C", "100 °C", "110 °C", "120 °C"], reponse: 1, explication: "Sous une pression d'une atmosphère, l'eau bout à 100 °C." },
  { categorie: "Sciences", question: "Quelle est la planète la plus grande du système solaire ?", choix: ["Saturne", "Neptune", "Jupiter", "Uranus"], reponse: 2, explication: "Jupiter est si grande que plus de 1 300 Terres pourraient y tenir." },
  { categorie: "Sciences", question: "Quel scientifique a découvert la pénicilline ?", choix: ["Louis Pasteur", "Alexander Fleming", "Robert Koch", "Claude Bernard"], reponse: 1, explication: "Alexander Fleming découvre la pénicilline par hasard en 1928." },

  // ---------- Arts & Littérature ----------
  { categorie: "Arts & Littérature", question: "Qui a peint La Joconde ?", choix: ["Michel-Ange", "Raphaël", "Léonard de Vinci", "Botticelli"], reponse: 2, explication: "Léonard de Vinci l'a peinte au début du XVIe siècle ; elle est exposée au Louvre." },
  { categorie: "Arts & Littérature", question: "Qui a écrit « Les Misérables » ?", choix: ["Émile Zola", "Victor Hugo", "Gustave Flaubert", "Honoré de Balzac"], reponse: 1, explication: "Victor Hugo publie Les Misérables en 1862." },
  { categorie: "Arts & Littérature", question: "Quel compositeur a écrit « La Flûte enchantée » ?", choix: ["Beethoven", "Bach", "Mozart", "Verdi"], reponse: 2, explication: "Wolfgang Amadeus Mozart compose cet opéra en 1791, l'année de sa mort." },
  { categorie: "Arts & Littérature", question: "Qui est l'auteur du « Petit Prince » ?", choix: ["Jules Verne", "Antoine de Saint-Exupéry", "Albert Camus", "Marcel Pagnol"], reponse: 1, explication: "Antoine de Saint-Exupéry publie Le Petit Prince en 1943." },
  { categorie: "Arts & Littérature", question: "Quel peintre s'est coupé une partie de l'oreille ?", choix: ["Paul Gauguin", "Claude Monet", "Vincent van Gogh", "Pablo Picasso"], reponse: 2, explication: "Vincent van Gogh se mutile l'oreille en décembre 1888 à Arles." },
  { categorie: "Arts & Littérature", question: "Dans quelle ville se déroule « Roméo et Juliette » de Shakespeare ?", choix: ["Venise", "Vérone", "Florence", "Rome"], reponse: 1, explication: "La tragédie se déroule à Vérone, en Italie." },
  { categorie: "Arts & Littérature", question: "Quel mouvement artistique est associé à Claude Monet ?", choix: ["Le cubisme", "Le surréalisme", "L'impressionnisme", "Le baroque"], reponse: 2, explication: "Son tableau « Impression, soleil levant » a donné son nom à l'impressionnisme." },

  // ---------- Sport ----------
  { categorie: "Sport", question: "Combien de joueurs composent une équipe de football sur le terrain ?", choix: ["9", "10", "11", "12"], reponse: 2, explication: "Une équipe compte 11 joueurs sur le terrain, gardien compris." },
  { categorie: "Sport", question: "Dans quelle ville se sont déroulés les Jeux olympiques d'été de 2024 ?", choix: ["Los Angeles", "Tokyo", "Paris", "Londres"], reponse: 2, explication: "Paris a accueilli les JO d'été en 2024, cent ans après ceux de 1924." },
  { categorie: "Sport", question: "Quel tournoi du Grand Chelem se joue sur terre battue ?", choix: ["Wimbledon", "Roland-Garros", "US Open", "Open d'Australie"], reponse: 1, explication: "Roland-Garros, à Paris, est le seul Grand Chelem sur terre battue." },
  { categorie: "Sport", question: "Combien de temps dure un match de rugby à XV (hors prolongations) ?", choix: ["60 minutes", "70 minutes", "80 minutes", "90 minutes"], reponse: 2, explication: "Un match se compose de deux mi-temps de 40 minutes." },
  { categorie: "Sport", question: "De quelle couleur est le maillot du leader du Tour de France ?", choix: ["Vert", "Jaune", "Blanc", "À pois rouges"], reponse: 1, explication: "Le maillot jaune récompense le leader du classement général." },
  { categorie: "Sport", question: "Combien de fois l'équipe de France a-t-elle gagné la Coupe du monde de football masculine ?", choix: ["1", "2", "3", "0"], reponse: 1, explication: "La France a été sacrée championne du monde en 1998 et en 2018." },

  // ---------- Divers ----------
  { categorie: "Divers", question: "Combien de côtés possède un hexagone ?", choix: ["5", "6", "7", "8"], reponse: 1, explication: "Un hexagone a 6 côtés ; la France métropolitaine est surnommée « l'Hexagone »." },
  { categorie: "Divers", question: "Quelle est la langue la plus parlée au monde (locuteurs natifs) ?", choix: ["L'anglais", "L'espagnol", "Le mandarin", "L'hindi"], reponse: 2, explication: "Le mandarin compte plus de 900 millions de locuteurs natifs." },
  { categorie: "Divers", question: "Combien y a-t-il de minutes dans une journée ?", choix: ["1 240", "1 440", "1 640", "1 040"], reponse: 1, explication: "24 heures × 60 minutes = 1 440 minutes." },
  { categorie: "Divers", question: "Quel animal est le plus grand mammifère du monde ?", choix: ["L'éléphant d'Afrique", "La baleine bleue", "La girafe", "Le cachalot"], reponse: 1, explication: "La baleine bleue peut dépasser 30 mètres de long." },
  { categorie: "Divers", question: "Quelle est la monnaie du Japon ?", choix: ["Le yuan", "Le won", "Le yen", "Le baht"], reponse: 2, explication: "Le yen est la monnaie japonaise ; le yuan est chinois et le won coréen." },
  { categorie: "Divers", question: "Combien de touches compte un piano standard ?", choix: ["76", "88", "92", "64"], reponse: 1, explication: "Un piano standard possède 88 touches : 52 blanches et 36 noires." },
  { categorie: "Divers", question: "Quel fruit est traditionnellement utilisé pour faire le cidre ?", choix: ["La poire", "La pomme", "Le raisin", "La prune"], reponse: 1, explication: "Le cidre est fait de pommes ; à base de poires, on parle de poiré." },
];
