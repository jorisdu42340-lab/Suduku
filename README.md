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
- Branches d'évolution au choix : cinq embranchements mènent à 6 lignées (48 espèces), qui se rejoignent dans l'Être cosmique
  - 🦐 Arthropodes : crustacé, scorpion, scarabée, fourmi, abeille, papillon, esprit-ruche, essaim stellaire
  - 🦈 Océan : requin, tortue marine, baleine, dauphin, peuple des mers, Atlantes, océan vivant
  - 🦖 Dinosaures : amphibien, reptile, dinosaure, oiseau, perroquet, dragon, phénix
  - 🐿️ Mammifères : amphibien, reptile, mammifère, primate, humain, cyborg, conscience planétaire
  - 🌿 Végétaux (dès la cellule) : algue, mousse, fougère, conifère, plante à fleurs, arbre millénaire, forêt pensante, réseau mycorhizien, Gaïa
  - 🐙 Céphalopodes : mollusque, pieuvre, calmar géant, kraken, pieuvre-mage, esprit à neuf cerveaux, peuple des abysses, ombre infinie
- Chaque stade a un milieu de vie (🌊 aquatique, 🌍 terrestre, 🕊️ aérien ou 🌌 spatial), affiché dans l'habitat, sur les cartes de choix et dans l'arbre ; au stade Poisson, l'embranchement propose de rester dans l'eau (🦈 lignée de l'océan) ou d'en sortir (🐸 amphibiens, puis dinosaures ou mammifères)
- Aide pour les dernières formes : après 3 extinctions, l'« Élan final » double tous les gains à partir du stade 8, jusqu'à l'Être cosmique (annoncé un stade avant)
- Conseiller : la mutation la plus rentable pour son prix est marquée ⭐ et un message dit quoi faire (acheter, économiser pour une nouvelle mutation avec le temps estimé, ou évoluer d'abord) ; le bouton « ⭐ Acheter les conseils » achète les meilleures mutations d'un coup (en gardant de quoi évoluer si c'est déjà possible) ; les mutations des prochains stades sont affichées 🔒 avec le stade qui les débloque ; le temps restant avant la prochaine évolution est estimé
- Chaque choix de branche donne un atout permanent (plus d'ADN par clic ou par seconde)
- L'arbre de l'évolution montre les 31 espèces, découvertes ou encore inconnues (❓) ; il est conservé quand on recommence, pour explorer les autres branches
- Des bonus ✨ apparaissent de temps en temps dans l'habitat
- Événements aléatoires toutes les une à deux minutes environ, qui teintent l'habitat et modifient temporairement les gains selon ta lignée :
  - ☄️ Météorite : clique 10 fois dessus pour la dévier ; sinon l'impact frappe fort les dinosaures, moins les oiseaux et l'océan, à peine les arthropodes… et profite aux mammifères
  - 🧊 Ère glaciaire (les mammifères à fourrure en profitent), 🌋 éruption volcanique (un régal pour les dragons), 🌧️ saison des pluies (les abeilles adorent), 💥 explosion de la diversité, 🌑 éclipse, 🤒 épidémie (défi : développe des anticorps), 🌞 tempête solaire (gare aux cyborgs), 🌠 comète porteuse de vie
- Extinction : à partir de 100 000 ADN récoltés dans une partie, tu peux provoquer une grande extinction. Tu repars de la cellule sans ADN ni mutations, mais tu gagnes des fossiles 🦴 (racine carrée de l'ADN récolté ÷ 100 000) ; chacun ajoute +10 % à tous les gains, pour toujours. Les espèces découvertes, les succès et les fossiles survivent à l'extinction ; « Tout effacer », en bas de page, remet vraiment tout à zéro
- 37 succès à débloquer (clics, ADN récolté, mutations, lignées, événements, extinctions…), dont 6 secrets ; chacun ajoute +2 % à tous les gains, pour toujours
- Classement partagé entre joueurs sur la page publiée sur claude.ai (`evolution/classement.js`), trié au choix par ADN récolté, stade le plus évolué atteint, fossiles, espèces découvertes ou succès. Chaque joueur a une fiche qu'il est seul à modifier (le propriétaire peut faire le ménage) ; on n'y stocke que son identifiant, son nom est retrouvé à l'affichage. En local, le classement est indisponible
- Progression sauvegardée dans le navigateur, avec des gains hors ligne (la moitié de la production, jusqu'à 2 h)

Les événements se trouvent dans le tableau `EVENEMENTS` du même fichier : chacun a un effet par défaut et des `variantes` par stade de la lignée (le format est décrit en commentaire).

Les succès sont dans le tableau `SUCCES` : chacun a une fonction `test` qui reçoit un résumé de la progression (décrit en commentaire).

### Ajouter des espèces

Ajoutez un stade au tableau `ETAPES` dans `evolution/donnees.js` et citez son `id` dans les `suivantes` du stade précédent (plusieurs `suivantes` créent un embranchement). La puissance et le prix de ses deux mutations se calculent automatiquement d'après sa profondeur dans l'arbre :

```js
{ id: "chat", nom: "Chat", emoji: "🐈", milieu: "Savane", ciel: "#ca8a04", sol: "#713f12",
  decor: ["🌾", "☀️"], texte: "…", atout: { clic: 1.3, texte: "Griffes : +30 % d'ADN par clic" },
  suivantes: ["…"], mutations: [["moustaches", "Moustaches", "🐾", "clic"], ["sieste", "Sieste", "😴", "auto"]] }
```
