# Quiz de culture générale

Un quiz de culture générale en français, en HTML/CSS/JavaScript sans dépendance.

## Jouer

Ouvrez `index.html` dans un navigateur.

## Fonctionnalités

- 260 questions réparties en 13 catégories de 20 questions : Histoire, Géographie, Sciences, Arts & Littérature, Sport, Divers, Cinéma, Musique, Gastronomie, Nature & Animaux, Technologie, Mythologie, BD & Jeux vidéo
- 3 niveaux de difficulté (⭐ facile, ⭐⭐ moyen, ⭐⭐⭐ difficile), environ 7 / 7 / 6 questions par catégorie
- Choix de la catégorie, du niveau et du nombre de questions (5, 10 ou 20)
- Questions et réponses mélangées à chaque partie
- Chronomètre optionnel de 20 secondes par question
- Explication après chaque réponse et récapitulatif final
- Records personnels par catégorie et par niveau, gardés dans le navigateur, avec un tableau « Mes records »
- Classement partagé entre joueurs sur la page publiée sur claude.ai (`classement.js`) : chaque joueur a une fiche qu'il est seul à modifier (le propriétaire peut faire le ménage) ; on n'y stocke que son identifiant, son nom est retrouvé à l'affichage. En local, seuls les records personnels sont disponibles
- Raccourcis clavier : touches 1-4 ou A-D pour répondre
- Effets visuels : apparition animée des questions, rebond sur la bonne réponse, secousse sur une erreur, « +1 » qui s'envole, chronomètre qui palpite, score final qui défile et confettis pour les bons scores (désactivés si le système demande de réduire les animations)
- Effets sonores synthétisés dans le navigateur (aucun fichier audio), désactivables depuis l'accueil

## Ajouter des questions

Ajoutez des entrées au tableau `QUESTIONS` dans `questions.js` :

```js
{ categorie: "Sport", niveau: 2, question: "…", choix: ["A", "B", "C", "D"], reponse: 0, explication: "…" }
```

`niveau` vaut 1 (facile), 2 (moyen) ou 3 (difficile). `reponse` est l’indice (à partir de 0) de la bonne réponse dans `choix`.
