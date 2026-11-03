(function () {
  "use strict";

  const DUREE_CHRONO = 20; // secondes par question
  const CLE_MEILLEUR = "quiz-culture-meilleur-score";
  const NOMS_NIVEAUX = { 1: "Facile", 2: "Moyen", 3: "Difficile" };

  const $ = (id) => document.getElementById(id);
  const ecrans = {
    accueil: $("ecran-accueil"),
    question: $("ecran-question"),
    resultat: $("ecran-resultat"),
  };

  let partie = null;
  let minuteur = null;

  // ---------- Utilitaires ----------
  function melanger(tableau) {
    const t = tableau.slice();
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  }

  function afficherEcran(nom) {
    Object.values(ecrans).forEach((e) => e.classList.remove("actif"));
    ecrans[nom].classList.add("actif");
  }

  function lireMeilleur() {
    try { return JSON.parse(localStorage.getItem(CLE_MEILLEUR)); } catch (e) { return null; }
  }

  function enregistrerMeilleur(score, total) {
    const actuel = lireMeilleur();
    const ratio = score / total;
    if (!actuel || ratio > actuel.score / actuel.total) {
      try { localStorage.setItem(CLE_MEILLEUR, JSON.stringify({ score, total })); } catch (e) { /* ignoré */ }
      return true;
    }
    return false;
  }

  function afficherMeilleur() {
    const m = lireMeilleur();
    $("meilleur-score").textContent = m ? `Meilleur score : ${m.score} / ${m.total}` : "";
  }

  // ---------- Accueil ----------
  function initialiserCategories() {
    const categories = [...new Set(QUESTIONS.map((q) => q.categorie))];
    const select = $("choix-categorie");
    select.innerHTML = "";
    select.add(new Option(`Toutes les catégories (${QUESTIONS.length})`, ""));
    categories.forEach((c) => {
      const n = QUESTIONS.filter((q) => q.categorie === c).length;
      select.add(new Option(`${c} (${n})`, c));
    });
  }

  // Questions correspondant à la catégorie et au niveau choisis.
  function questionsFiltrees() {
    const categorie = $("choix-categorie").value;
    const niveau = parseInt($("choix-niveau").value, 10);
    return QUESTIONS.filter((q) =>
      (!categorie || q.categorie === categorie) && (!niveau || q.niveau === niveau)
    );
  }

  function majDisponibles() {
    const dispo = questionsFiltrees().length;
    const nombre = parseInt($("choix-nombre").value, 10);
    $("info-disponibles").textContent = dispo < nombre
      ? `${dispo} questions disponibles avec ces filtres : la partie en comptera ${dispo}.`
      : `${dispo} questions disponibles avec ces filtres.`;
  }

  function commencer() {
    const nombre = parseInt($("choix-nombre").value, 10);
    const pool = questionsFiltrees();

    // On mélange les questions et l'ordre des réponses de chacune.
    const questions = melanger(pool).slice(0, nombre).map((q) => {
      const ordre = melanger(q.choix.map((_, i) => i));
      return {
        ...q,
        choix: ordre.map((i) => q.choix[i]),
        reponse: ordre.indexOf(q.reponse),
      };
    });

    partie = {
      questions,
      index: 0,
      score: 0,
      chrono: $("choix-chrono").checked,
      historique: [],
    };
    Effets.activerSon($("choix-son").checked);
    afficherEcran("question");
    afficherQuestion();
  }

  // ---------- Question ----------
  function afficherQuestion() {
    const q = partie.questions[partie.index];
    const total = partie.questions.length;

    $("progression").textContent = `Question ${partie.index + 1} / ${total}`;
    $("score-courant").textContent = `Score : ${partie.score}`;
    $("barre-progression").style.width = `${(partie.index / total) * 100}%`;
    $("categorie-question").textContent = q.categorie;
    $("niveau-question").textContent = `${"⭐".repeat(q.niveau)} ${NOMS_NIVEAUX[q.niveau]}`;
    $("intitule").textContent = q.question;
    $("explication").textContent = "";
    $("explication").classList.remove("visible");
    $("score-courant").classList.remove("saut");
    $("btn-suivant").classList.add("cache");
    Effets.animer(document.querySelector("#ecran-question .badges"), "entree-question");
    Effets.animer($("intitule"), "entree-question");

    const conteneur = $("reponses");
    conteneur.innerHTML = "";
    q.choix.forEach((texte, i) => {
      const btn = document.createElement("button");
      btn.className = "reponse";
      btn.style.setProperty("--i", i);
      btn.textContent = `${String.fromCharCode(65 + i)}. ${texte}`;
      btn.addEventListener("click", () => repondre(i));
      conteneur.appendChild(btn);
    });

    demarrerChrono();
  }

  function demarrerChrono() {
    clearInterval(minuteur);
    const el = $("chrono");
    if (!partie.chrono) { el.textContent = ""; return; }

    let restant = DUREE_CHRONO;
    const maj = () => {
      el.textContent = `⏱ ${restant} s`;
      el.classList.toggle("urgent", restant <= 5);
      if (restant <= 5 && restant > 0) Effets.sons.tic();
    };
    maj();
    minuteur = setInterval(() => {
      restant--;
      maj();
      if (restant <= 0) {
        clearInterval(minuteur);
        repondre(-1); // temps écoulé
      }
    }, 1000);
  }

  function repondre(choisi) {
    clearInterval(minuteur);
    const q = partie.questions[partie.index];
    const boutons = $("reponses").querySelectorAll(".reponse");
    if (boutons[0].disabled) return; // déjà répondu

    boutons.forEach((b, i) => {
      b.disabled = true;
      if (i === q.reponse) b.classList.add("bonne");
      else if (i === choisi) b.classList.add("mauvaise");
    });

    const correct = choisi === q.reponse;
    if (correct) partie.score++;
    partie.historique.push({ q, choisi, correct });

    const prefixe = correct ? "✅ Bonne réponse ! " : choisi === -1 ? "⏰ Temps écoulé ! " : "❌ Raté ! ";
    $("explication").textContent = prefixe + q.explication;
    Effets.animer($("explication"), "visible");
    $("score-courant").textContent = `Score : ${partie.score}`;

    if (correct) {
      Effets.sons.bonne();
      Effets.animer($("score-courant"), "saut");
      Effets.flottant(boutons[q.reponse], "+1");
    } else {
      Effets.sons.mauvaise();
    }

    const suivant = $("btn-suivant");
    suivant.textContent = partie.index + 1 < partie.questions.length ? "Question suivante" : "Voir les résultats";
    suivant.classList.remove("cache");
    suivant.focus();
  }

  function suivant() {
    partie.index++;
    if (partie.index < partie.questions.length) afficherQuestion();
    else afficherResultat();
  }

  // ---------- Résultats ----------
  function afficherResultat() {
    const { score, questions, historique } = partie;
    const total = questions.length;
    const ratio = score / total;

    Effets.compter($("score-final"), score, total);
    let message;
    if (ratio === 1) message = "Parfait ! Vous êtes une encyclopédie vivante 🏆";
    else if (ratio >= 0.8) message = "Excellent ! Très belle culture générale 🎉";
    else if (ratio >= 0.5) message = "Pas mal du tout ! Encore un petit effort 👍";
    else message = "Il y a de quoi apprendre… Retentez votre chance 📚";
    if (score > 0 && enregistrerMeilleur(score, total)) message += " — Nouveau record !";
    $("message-final").textContent = message;

    const liste = $("recapitulatif");
    liste.innerHTML = "";
    historique.forEach(({ q, choisi, correct }, i) => {
      const li = document.createElement("li");
      li.style.setProperty("--i", i);
      const icone = document.createElement("span");
      icone.className = correct ? "ok" : "ko";
      icone.textContent = correct ? "✔ " : "✘ ";
      li.appendChild(icone);
      li.appendChild(document.createTextNode(q.question));
      const detail = document.createElement("small");
      const votre = choisi === -1 ? "aucune (temps écoulé)" : q.choix[choisi];
      detail.textContent = correct
        ? `Réponse : ${q.choix[q.reponse]}`
        : `Votre réponse : ${votre} — Bonne réponse : ${q.choix[q.reponse]}`;
      li.appendChild(detail);
      liste.appendChild(li);
    });

    afficherEcran("resultat");

    // Célébration selon le score
    if (ratio >= 0.8) { Effets.confettis(150); Effets.sons.victoire(); }
    else if (ratio >= 0.5) { Effets.confettis(50); Effets.sons.victoire(); }
    else Effets.sons.fin();
  }

  function rejouer() {
    afficherMeilleur();
    afficherEcran("accueil");
  }

  // ---------- Clavier : touches 1-4 / A-D pour répondre, Entrée pour continuer ----------
  document.addEventListener("keydown", (e) => {
    if (!ecrans.question.classList.contains("actif")) return;
    const touche = e.key.toUpperCase();
    const idx = "1234".indexOf(touche) !== -1 ? "1234".indexOf(touche) : "ABCD".indexOf(touche);
    if (idx !== -1) {
      const boutons = $("reponses").querySelectorAll(".reponse");
      if (boutons[idx] && !boutons[idx].disabled) repondre(idx);
    }
  });

  ["choix-categorie", "choix-niveau", "choix-nombre"].forEach((id) =>
    $(id).addEventListener("change", majDisponibles)
  );
  $("btn-commencer").addEventListener("click", commencer);
  $("btn-suivant").addEventListener("click", suivant);
  $("btn-rejouer").addEventListener("click", rejouer);

  initialiserCategories();
  majDisponibles();
  afficherMeilleur();
})();
