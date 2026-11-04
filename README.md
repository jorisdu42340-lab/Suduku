# Quiz de culture générale

Un quiz de culture générale en français, en HTML/CSS/JavaScript sans dépendance.

## Jouer

Ouvrez `index.html` dans un navigateur.

## Fonctionnalités

- 260 questions réparties en 13 catégories de 20 questions : Histoire, Géographie, Sciences, Arts & Littérature, Sport, Divers, Cinéma, Musique, Gastronomie, Nature & Animaux, Technologie, Mythologie, BD & Jeux vidéo
- Accueil interactif (`interface.js`) : tuiles de catégories animées au clic (onde, rebond, emojis qui jaillissent), boutons à curseur glissant pour la difficulté et le nombre de questions, interrupteurs pour les options ; chaque catégorie a sa couleur, qui teinte toute l'interface et le fond animé
- 3 niveaux de difficulté (⭐ facile, ⭐⭐ moyen, ⭐⭐⭐ difficile), environ 7 / 7 / 6 questions par catégorie
- Choix de la catégorie, du niveau et du nombre de questions (5, 10 ou 20)
- Pas de répétition : le quiz retient les questions déjà posées et propose d'abord celles jamais vues, puis les plus anciennes ; l'accueil indique combien de nouvelles questions restent, avec un bouton pour tout remettre à neuf
- Ordre des réponses mélangé à chaque partie
- Chronomètre optionnel de 20 secondes par question
- Explication après chaque réponse et récapitulatif final
- Records personnels par catégorie et par niveau, gardés dans le navigateur, avec un tableau « Mes records »
- Classement partagé entre joueurs sur la page publiée sur claude.ai (`classement.js`) : chaque joueur a une fiche qu'il est seul à modifier (le propriétaire peut faire le ménage) ; on n'y stocke que son identifiant, son nom est retrouvé à l'affichage. En local, seuls les records personnels sont disponibles
- Raccourcis clavier : touches 1-4 ou A-D pour répondre
- Effets visuels : apparition animée des questions, rebond sur la bonne réponse, secousse sur une erreur, « +1 » qui s'envole, chronomètre qui palpite, score final qui défile et confettis pour les bons scores (désactivés si le système demande de réduire les animations)
- Bruitages synthétisés dans le navigateur (aucun fichier audio), désactivables depuis l'accueil : bulles qui jouent une mélodie sur les tuiles, sifflet sur les curseurs, compte à rebours au départ, carillons qui montent avec les séries de bonnes réponses (🔥), trombone de dessin animé pour les erreurs, ressort quand le temps est écoulé, fanfare avec roulement de tambour, mélodie de record

## Ajouter des questions

Ajoutez des entrées au tableau `QUESTIONS` dans `questions.js` :

```js
{ categorie: "Sport", niveau: 2, question: "…", choix: ["A", "B", "C", "D"], reponse: 0, explication: "…" }
```

`niveau` vaut 1 (facile), 2 (moyen) ou 3 (difficile). `reponse` est l’indice (à partir de 0) de la bonne réponse dans `choix`.

## Jeu « Évolution » (`evolution/`)

Un jeu incrémental où l'on fait évoluer une créature, de la cellule à l'être cosmique, en choisissant sa branche dans l'arbre du vivant. On y accède depuis l'accueil du quiz (« 🧬 Nouveau jeu : Évolution ») ou en ouvrant `evolution/index.html`.

- Clique sur la créature pour récolter de l'ADN
- Achète des mutations : chaque stade apporte les siennes, l'une augmente l'ADN par clic, l'autre en produit automatiquement chaque seconde (le prix augmente de 15 % à chaque achat)
- Dépense de l'ADN pour évoluer : 11 stades, chacun avec son habitat et +50 % sur tous les gains
- Branches d'évolution au choix : trois embranchements mènent à 4 lignées, qui se rejoignent dans l'Être cosmique
  - 🦐 Arthropodes : crustacé, scorpion, scarabée, fourmi, abeille, papillon, esprit-ruche, essaim stellaire
  - 🦈 Océan : requin, tortue marine, baleine, dauphin, peuple des mers, Atlantes, océan vivant
  - 🦖 Dinosaures : amphibien, reptile, dinosaure, oiseau, perroquet, dragon, phénix
  - 🐿️ Mammifères : amphibien, reptile, mammifère, primate, humain, cyborg, conscience planétaire
- Chaque choix de branche donne un atout permanent (plus d'ADN par clic ou par seconde)
- L'arbre de l'évolution montre les 31 espèces, découvertes ou encore inconnues (❓) ; il est conservé quand on recommence, pour explorer les autres branches
- Des bonus ✨ apparaissent de temps en temps dans l'habitat
- Progression sauvegardée dans le navigateur, avec des gains hors ligne (la moitié de la production, jusqu'à 2 h)

### Ajouter des espèces

Ajoutez un stade au tableau `ETAPES` dans `evolution/donnees.js` et citez son `id` dans les `suivantes` du stade précédent (plusieurs `suivantes` créent un embranchement). La puissance et le prix de ses deux mutations se calculent automatiquement d'après sa profondeur dans l'arbre :

```js
{ id: "chat", nom: "Chat", emoji: "🐈", milieu: "Savane", ciel: "#ca8a04", sol: "#713f12",
  decor: ["🌾", "☀️"], texte: "…", atout: { clic: 1.3, texte: "Griffes : +30 % d'ADN par clic" },
  suivantes: ["…"], mutations: [["moustaches", "Moustaches", "🐾", "clic"], ["sieste", "Sieste", "😴", "auto"]] }
```

## Jeu « Guerre des âges » (`guerre/`)

Un jeu de stratégie en temps réel : ta base à gauche, celle de l'ennemi à droite, et des combattants qui s'affrontent entre les deux. On y accède depuis l'accueil du quiz (« ⚔️ Nouveau jeu : Guerre des âges ») ou en ouvrant `guerre/index.html`.

- Tu gagnes de l'or chaque seconde et en battant des ennemis (la moitié de leur coût) ; dépense-le pour invoquer des combattants
- 5 combattants par âge, avec des niveaux d'attaque de ★ à ★★★★★ : corps à corps, tir à distance, résistant, dégâts de zone et colosse ; plus ils coûtent, plus ils frappent fort. Chacun a un court temps de recharge
- 4 âges : Préhistoire (cogneur, frondeur, mammouth, chaman, tyrannosaure), Moyen Âge (garde, archer, chevalier, mage, dragon volant), Époque moderne (sapeur, fusilier, autoblindée, montgolfière qui vole au-dessus du champ de bataille et lâche des bombes, locomotive blindée) et Futur (androïde, tireur laser, blindé, ovni volant, titan). L'expérience gagnée en invoquant et en battant des ennemis fait passer à l'âge suivant : troupes 2,2 fois plus fortes et base renforcée
- Pouvoir spécial rechargeable (pluie de météores, pluie de flèches, bombardement, frappe orbitale) qui frappe les troupes ennemies
- Tourelles à acheter pour la base, 3 par âge (tir rapide ★★, dégâts de zone ★★★, tir lourd ★★★★), par exemple lance-pierres, baliste, mitrailleuse ou tourelle laser. La base a 3 emplacements : le premier est offert, les suivants se débloquent pour 120 et 300 💰. Une tourelle garde la puissance de l'âge où elle a été achetée ; on la revend pour la moitié de son prix en cliquant dessus
- Les bases et leurs tourelles tirent sur les ennemis proches ; après 10 minutes, l'assaut final désactive ces tirs et rend les bases deux fois plus fragiles
- L'ordinateur joue avec les mêmes règles (il achète aussi des tourelles), en 3 difficultés (il reçoit plus ou moins d'or et réfléchit plus ou moins vite)
- Raccourcis : touches 1 à 5 pour invoquer, 6 à 8 pour acheter une tourelle, E pour changer d'âge, F pour le pouvoir, P ou Échap pour la pause
- Victoires, défaites et victoire la plus rapide gardées dans le navigateur pour chaque difficulté

### Modifier les combattants

Les statistiques de base sont dans le tableau `ROLES` de `guerre/donnees.js` (coût, points de vie, attaque, portée, vitesse, cadence, recharge) ; elles sont multipliées par `FACTEUR_STATS` à chaque âge, et le coût par `FACTEUR_COUT`. Les tourelles sont dans `TOURELLES` et le prix des emplacements dans `COUT_EMPLACEMENTS`. Les noms et emojis de chaque âge (combattants et tourelles) sont dans `ERES` ; ajoutez `vol: 75` à un combattant pour le faire voler.
