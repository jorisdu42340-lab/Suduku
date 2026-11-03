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
- Meilleur score sauvegardé dans le navigateur
- Raccourcis clavier : touches 1-4 ou A-D pour répondre

## Ajouter des questions

Ajoutez des entrées au tableau `QUESTIONS` dans `questions.js` :

```js
{ categorie: "Sport", niveau: 2, question: "…", choix: ["A", "B", "C", "D"], reponse: 0, explication: "…" }
```

`niveau` vaut 1 (facile), 2 (moyen) ou 3 (difficile). `reponse` est l’indice (à partir de 0) de la bonne réponse dans `choix`.
