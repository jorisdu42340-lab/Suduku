(function () {
  "use strict";

  const DUREE_CHRONO = 20; // secondes par question
  const NOMS_NIVEAUX = { 1: "Facile", 2: "Moyen", 3: "Difficile" };

  const $ = (id) => document.getElementById(id);
  const ecrans = {
    accueil: $("ecran-accueil"),
    question: $("ecran-question"),
    resultat: $("ecran-resultat"),
    classement: $("ecran-classement"),
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

  const pourcent = (r) => `${Math.round((r.score / r.total) * 100)} %`;

  // « Histoire · Moyen », « Toutes catégories · tous niveaux »…
  function libelle(categorie, niveau) {
    return `${categorie || "Toutes catégories"} · ${niveau ? NOMS_NIVEAUX[niveau] : "tous niveaux"}`;
  }

  // ---------- Accueil ----------
  const CATEGORIES = [...new Set(QUESTIONS.map((q) => q.categorie))];

  function initialiserCategories() {
    const select = $("choix-categorie");
    select.innerHTML = "";
    select.add(new Option(`Toutes les catégories (${QUESTIONS.length})`, ""));
    CATEGORIES.forEach((c) => {
      const n = QUESTIONS.filter((q) => q.categorie === c).length;
      select.add(new Option(`${c} (${n})`, c));
    });
    const cl = $("cl-categorie");
    cl.innerHTML = "";
    cl.add(new Option("Toutes les catégories", ""));
    CATEGORIES.forEach((c) => cl.add(new Option(c, c)));
  }

  function majRecordAccueil() {
    const r = Classement.record($("choix-categorie").value, $("choix-niveau").value);
    $("record-accueil").textContent = r
      ? `🏆 Votre record ici : ${r.score} / ${r.total} (${pourcent(r)})`
      : "Pas encore de record pour cette sélection.";
  }

  // Questions correspondant à la catégorie et au niveau choisis.
  function questionsFiltrees() {
    const categorie = $("choix-categorie").value;
    const niveau = parseInt($("choix-niveau").value, 10);
    return QUESTIONS.filter((q) =>
      (!categorie || q.categorie === categorie) && (!niveau || q.niveau === niveau)
    );
  }

  // ---------- Questions déjà vues ----------
  // On retient dans le navigateur quand chaque question a été posée pour la
  // dernière fois : une partie propose d'abord des questions jamais vues, puis,
  // une fois tout vu, celles posées il y a le plus longtemps.
  const CLE_VUES = "quiz-culture-questions-vues";
  let vues = lireVues();

  function lireVues() {
    try {
      const v = JSON.parse(localStorage.getItem(CLE_VUES));
      return v && typeof v === "object" ? v : {};
    } catch (e) {
      return {};
    }
  }

  function marquerVue(q) {
    vues[q.question] = Date.now();
    try { localStorage.setItem(CLE_VUES, JSON.stringify(vues)); } catch (e) { /* ignoré */ }
  }

  function oublierVues(pool) {
    pool.forEach((q) => delete vues[q.question]);
    try { localStorage.setItem(CLE_VUES, JSON.stringify(vues)); } catch (e) { /* ignoré */ }
    majDisponibles();
  }

  // Nouvelles questions d'abord (dans un ordre aléatoire), puis les plus anciennes.
  function choisirQuestions(pool, nombre) {
    const nouvelles = melanger(pool.filter((q) => !vues[q.question]));
    const dejaVues = melanger(pool.filter((q) => vues[q.question]))
      .sort((a, b) => vues[a.question] - vues[b.question]);
    return melanger([...nouvelles, ...dejaVues].slice(0, nombre));
  }

  function majDisponibles() {
    const pool = questionsFiltrees();
    const dispo = pool.length;
    const nouvelles = pool.filter((q) => !vues[q.question]).length;
    const nombre = parseInt($("choix-nombre").value, 10);
    const info = $("info-disponibles");
    info.textContent = "";

    let texte;
    if (nouvelles === dispo) texte = `${dispo} questions, toutes nouvelles pour vous.`;
    else if (nouvelles === 0) texte = `Vous avez vu les ${dispo} questions : les plus anciennes reviennent en premier.`;
    else texte = `✨ ${nouvelles} nouvelles questions sur ${dispo}.`;
    if (dispo < nombre) texte += ` La partie en comptera ${dispo}.`;
    else if (nouvelles > 0 && nouvelles < nombre) texte += ` Complétée par ${nombre - nouvelles} déjà vues.`;
    info.append(texte);

    if (nouvelles < dispo) {
      const lien = document.createElement("button");
      lien.type = "button";
      lien.className = "lien";
      lien.textContent = "↺ Tout remettre à neuf";
      lien.addEventListener("click", () => oublierVues(pool));
      info.append(" ", lien);
    }
    majRecordAccueil();
  }

  function commencer() {
    const nombre = parseInt($("choix-nombre").value, 10);
    const pool = questionsFiltrees();

    // On choisit les questions, puis on mélange l'ordre des réponses de chacune.
    const questions = choisirQuestions(pool, nombre).map((q) => {
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
      categorie: $("choix-categorie").value,
      niveau: $("choix-niveau").value,
      historique: [],
      serie: 0, // bonnes réponses d'affilée
    };
    Effets.activerSon($("choix-son").checked);
    Effets.sons.depart();
    afficherEcran("question");
    afficherQuestion();
  }

  // ---------- Question ----------
  function afficherQuestion() {
    const q = partie.questions[partie.index];
    marquerVue(q);
    if (partie.index > 0) Effets.sons.question();
    const total = partie.questions.length;

    $("progression").textContent = `Question ${partie.index + 1} / ${total}`;
    $("score-courant").textContent = `Score : ${partie.score}`;
    $("barre-progression").style.width = `${(partie.index / total) * 100}%`;
    const themes = typeof Interface !== "undefined" ? Interface : null;
    $("categorie-question").textContent = themes ? `${themes.icone(q.categorie)} ${q.categorie}` : q.categorie;
    if (themes) themes.appliquerTheme(q.categorie);
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
      if (restant <= 5 && restant > 0) Effets.sons.tic(restant);
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
      partie.serie++;
      Effets.sons.bonne(partie.serie);
      if (partie.serie >= 3) Effets.flottant($("score-courant"), `🔥 Série ×${partie.serie}`);
      Effets.animer($("score-courant"), "saut");
      Effets.flottant(boutons[q.reponse], "+1");
    } else {
      partie.serie = 0;
      if (choisi === -1) Effets.sons.tempsEcoule();
      else Effets.sons.mauvaise();
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
    $("message-final").textContent = message;

    const { estRecord, ancien } = Classement.enregistrer(partie.categorie, partie.niveau, score, total);
    $("message-record").textContent = estRecord
      ? `🏆 Nouveau record en ${libelle(partie.categorie, partie.niveau)} !` +
        (ancien ? ` (ancien : ${ancien.score} / ${ancien.total})` : "")
      : "";

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
    if (ratio >= 0.8 || estRecord) { Effets.confettis(150); Effets.sons.victoire(); }
    else if (ratio >= 0.5) { Effets.confettis(50); Effets.sons.victoire(); }
    else Effets.sons.fin();
    if (estRecord) Effets.sons.record();
  }

  function rejouer() {
    majDisponibles();
    if (typeof Interface !== "undefined") Interface.appliquerTheme($("choix-categorie").value);
    afficherEcran("accueil");
  }

  // ---------- Classement ----------
  let rendu = 0; // évite qu'un ancien rendu (asynchrone) écrase un plus récent

  function ouvrirClassement(categorie, niveau) {
    $("cl-categorie").value = categorie || "";
    $("cl-niveau").value = niveau || "";
    afficherEcran("classement");
    afficherClassement();
  }

  async function afficherClassement() {
    const numero = ++rendu;
    const categorie = $("cl-categorie").value;
    const niveau = $("cl-niveau").value;
    const etat = Classement.etat();
    const liste = $("cl-liste");

    const messages = {
      local: "Le classement partagé est disponible sur la page publiée. Ici, seuls vos records sur cet appareil sont gardés.",
      chargement: "Chargement du classement…",
      lent: "Le classement ne répond pas pour le moment. Vos records restent enregistrés sur cet appareil.",
      erreur: "Le classement est indisponible pour le moment. Vos records restent enregistrés sur cet appareil.",
      pret: "",
    };
    let info = messages[etat] || "";
    if (etat === "pret" && Classement.ecritureRefusee()) {
      info = "Vous pouvez consulter le classement, mais vos scores n'y sont pas ajoutés (accès en lecture seule).";
    }
    $("cl-etat").textContent = info;

    renduRecords();

    const entrees = etat === "local" ? [] : Classement.classement(categorie, niveau);
    const profils = await Classement.profils(entrees.map((e) => e.id));
    if (numero !== rendu) return;

    liste.innerHTML = "";
    liste.classList.toggle("cache", etat === "local");
    if (entrees.length === 0) {
      if (etat === "pret" || etat === "lent") {
        const li = document.createElement("li");
        li.className = "vide";
        li.textContent = "Aucun score pour l'instant dans cette sélection. À vous de jouer !";
        liste.appendChild(li);
      }
      return;
    }

    const medailles = ["🥇", "🥈", "🥉"];
    entrees.forEach((e, i) => {
      const p = profils[e.id] || {};
      const li = document.createElement("li");
      li.style.setProperty("--i", i);
      if (e.moi) li.classList.add("moi");

      const rang = document.createElement("span");
      rang.className = "rang";
      rang.textContent = medailles[i] || String(i + 1);

      const img = document.createElement("img");
      img.alt = "";
      if (p.avatarUrl) img.src = p.avatarUrl;
      else img.style.visibility = "hidden";

      const nom = document.createElement("span");
      nom.className = "nom";
      nom.textContent = (p.name || "Joueur") + (e.moi ? " (vous)" : "");

      const points = document.createElement("span");
      points.className = "points";
      points.textContent = `${e.score} / ${e.total}`;
      const detail = document.createElement("small");
      detail.textContent = pourcent(e);
      points.appendChild(detail);

      li.append(rang, img, nom, points);
      liste.appendChild(li);
    });
  }

  function renduRecords() {
    const corps = $("mes-records").querySelector("tbody");
    corps.innerHTML = "";
    ["", ...CATEGORIES].forEach((categorie) => {
      const tr = document.createElement("tr");
      const th = document.createElement("td");
      th.textContent = categorie || "Toutes catégories";
      tr.appendChild(th);
      ["", "1", "2", "3"].forEach((niveau) => {
        const td = document.createElement("td");
        const r = Classement.record(categorie, niveau);
        if (r) {
          td.textContent = `${r.score}/${r.total}`;
          td.title = `${pourcent(r)} · le ${r.date}`;
          if (r.score === r.total) td.classList.add("parfait");
        } else {
          td.textContent = "—";
          td.classList.add("vide");
        }
        tr.appendChild(td);
      });
      corps.appendChild(tr);
    });
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
  $("btn-classement").addEventListener("click", () =>
    ouvrirClassement($("choix-categorie").value, $("choix-niveau").value)
  );
  $("btn-voir-classement").addEventListener("click", () =>
    ouvrirClassement(partie.categorie, partie.niveau)
  );
  $("btn-retour").addEventListener("click", rejouer);
  ["cl-categorie", "cl-niveau"].forEach((id) => $(id).addEventListener("change", afficherClassement));
  Classement.surChangement(() => {
    if (ecrans.classement.classList.contains("actif")) afficherClassement();
    else if (ecrans.accueil.classList.contains("actif")) majRecordAccueil();
  });

  initialiserCategories();
  majDisponibles();
  Classement.init();
})();
