# Quiz de culture générale

Un quiz de culture générale en français, en HTML/CSS/JavaScript sans dépendance.

## Jouer

Ouvrez `index.html` dans un navigateur.

## Fonctionnalités

- 75 questions réparties en 10 catégories (Histoire, Géographie, Sciences, Arts & Littérature, Sport, Divers, Cinéma, Musique, Gastronomie, Nature & Animaux)
- Choix de la catégorie et du nombre de questions (5, 10 ou 20)
- Questions et réponses mélangées à chaque partie
- Chronomètre optionnel de 20 secondes par question
- Explication après chaque réponse et récapitulatif final
- Meilleur score sauvegardé dans le navigateur
- Raccourcis clavier : touches 1-4 ou A-D pour répondre

## Ajouter des questions

Ajoutez des entrées au tableau `QUESTIONS` dans `questions.js` :

```js
{ categorie: "Sport", question: "…", choix: ["A", "B", "C", "D"], reponse: 0, explication: "…" }
```

`reponse` est l’\indice (à partir de 0) de la bonne réponse dans `choix`.
