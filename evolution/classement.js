// Classement partagé entre joueurs (page publiée sur claude.ai).
//
// Chaque joueur a une fiche « classement/<identifiant> » qu'il est seul à modifier
// (le propriétaire de la page peut faire le ménage). On n'y stocke que son
// identifiant et ses résultats, jamais son nom : le nom est retrouvé à l'affichage.
// En ouvrant evolution/index.html en local, le classement est simplement indisponible.
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const TAILLE_MAX = 50;          // joueurs affichés
  const INTERVALLE_ENVOI = 20000; // la fiche est mise à jour au plus toutes les 20 s

  // Critères de tri : valeur lue dans une fiche, et affichage.
  const TRIS = {
    adn: { nom: "🧬 ADN", valeur: (f) => f.adn, texte: (f) => `${format(f.adn)} ADN` },
    stade: { nom: "🌌 Stade", valeur: (f) => f.stade * 1e3 + f.sommets, texte: (f) => `stade ${f.stade + 1}${f.sommets ? ` · 🌌 ×${f.sommets}` : ""}` },
    fossiles: { nom: "🦴 Fossiles", valeur: (f) => f.fossiles, texte: (f) => `${f.fossiles} 🦴` },
    especes: { nom: "📖 Espèces", valeur: (f) => f.especes, texte: (f) => `${f.especes} / ${ETAPES.length} espèces` },
    succes: { nom: "🏆 Succès", valeur: (f) => f.succes, texte: (f) => `${f.succes} / ${SUCCES.length} succès` },
  };

  let tri = "adn";
  try { if (TRIS[localStorage.getItem("evolution-tri")]) tri = localStorage.getItem("evolution-tri"); } catch (e) { /* ignoré */ }

  let db = null;
  let user = null;
  let uid = null;
  let fiches = [];
  let etatClassement = "chargement"; // local | chargement | lent | pret | erreur
  let lectureSeule = false;
  let dernierEnvoi = "";
  let noms = {};

  // ---------- Ma fiche ----------

  function maFiche() {
    const plusProfond = etat.decouvertes.reduce((a, id) => (PROFONDEUR[id] > PROFONDEUR[a] ? id : a), RACINE);
    return {
      adn: Math.floor(etat.stats.adn),
      stade: PROFONDEUR[plusProfond],
      espece: plusProfond,
      sommets: etat.stats.sommets.length,
      fossiles: etat.fossiles,
      extinctions: etat.stats.extinctions,
      especes: etat.decouvertes.length,
      succes: etat.succes.length,
    };
  }

  async function envoyer() {
    if (!db || !uid || lectureSeule) return;
    const fiche = maFiche();
    const cle = JSON.stringify(fiche);
    if (cle === dernierEnvoi) return;
    dernierEnvoi = cle;
    try {
      await db.doc(`classement/${uid}`).set(Object.assign(fiche, { maj: Date.now() }));
    } catch (e) {
      if (e && e.code === "unavailable") {
        dernierEnvoi = ""; // on réessaiera au prochain passage
      } else {
        lectureSeule = true; // accès en lecture seule : on se contente d'afficher
        afficher();
      }
    }
  }

  // ---------- Lecture des fiches (écrites par d'autres : on vérifie tout) ----------

  const entier = (v, max) => (Number.isFinite(v) && v >= 0 ? Math.min(Math.floor(v), max) : 0);

  function lire(doc) {
    const d = doc.data() || {};
    return {
      id: doc.id,
      adn: entier(d.adn, 1e30),
      stade: entier(d.stade, COUTS.length - 1),
      espece: STADE[d.espece] ? d.espece : RACINE,
      sommets: entier(d.sommets, 99),
      fossiles: entier(d.fossiles, 1e9),
      extinctions: entier(d.extinctions, 1e9),
      especes: entier(d.especes, ETAPES.length),
      succes: entier(d.succes, SUCCES.length),
    };
  }

  // ---------- Affichage ----------

  function construireOnglets() {
    const zone = $("cl-onglets");
    zone.innerHTML = "";
    Object.entries(TRIS).forEach(([cle, t]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "onglet" + (cle === tri ? " actif" : "");
      b.textContent = t.nom;
      b.setAttribute("aria-pressed", cle === tri);
      b.addEventListener("click", () => {
        tri = cle;
        try { localStorage.setItem("evolution-tri", cle); } catch (e) { /* ignoré */ }
        construireOnglets();
        afficher();
      });
      zone.append(b);
    });
  }

  async function afficher() {
    const liste = $("cl-liste");
    const message = {
      local: "Le classement partagé est disponible sur la page publiée sur claude.ai.",
      chargement: "Chargement du classement…",
      lent: "Le classement met du temps à arriver…",
      erreur: "Impossible de charger le classement pour l'instant.",
      pret: "",
    }[etatClassement];

    // Ma ligne est calculée en direct, pour qu'elle suive la partie sans attendre l'envoi.
    let lignes = fiches.filter((f) => f.id !== uid);
    if (uid && !lectureSeule) lignes.push(Object.assign({ id: uid }, maFiche()));
    const t = TRIS[tri];
    lignes = lignes.filter((f) => f.adn > 0 || f.id === uid)
      .sort((a, b) => t.valeur(b) - t.valeur(a) || b.adn - a.adn)
      .slice(0, TAILLE_MAX);

    let info = message;
    if (etatClassement === "pret") {
      info = lignes.length ? `${lignes.length} joueur${lignes.length > 1 ? "s" : ""}` : "Personne n'est encore classé. Joue pour être le premier !";
      if (lectureSeule) info += " · tu peux consulter le classement, mais ton accès ne permet pas d'y apparaître.";
    }
    $("cl-etat").textContent = info;

    const ids = lignes.map((f) => f.id);
    if (user && ids.some((id) => !(id in noms))) {
      try {
        const ps = await user.profiles(ids);
        ids.forEach((id) => { noms[id] = (ps[id] && ps[id].name) || ""; });
      } catch (e) { /* noms indisponibles */ }
    }

    liste.innerHTML = "";
    lignes.forEach((f, i) => {
      const li = document.createElement("li");
      li.className = "ligne-classement" + (f.id === uid ? " moi" : "");
      const rang = document.createElement("span");
      rang.className = "rang-cl";
      rang.textContent = ["🥇", "🥈", "🥉"][i] || i + 1;
      const ico = document.createElement("span");
      ico.className = "ico";
      ico.textContent = STADE[f.espece].emoji;
      ico.title = `Espèce la plus évoluée : ${STADE[f.espece].nom}`;
      const qui = document.createElement("span");
      qui.className = "qui";
      const nom = document.createElement("strong");
      nom.textContent = (noms[f.id] || "Un joueur") + (f.id === uid ? " (toi)" : "");
      const details = document.createElement("small");
      details.textContent = Object.entries(TRIS).filter(([cle]) => cle !== tri).map(([, x]) => x.texte(f)).join(" · ");
      qui.append(nom, details);
      const valeur = document.createElement("span");
      valeur.className = "valeur-cl";
      valeur.textContent = t.texte(f);
      li.append(rang, ico, qui, valeur);
      liste.append(li);
    });
  }

  // ---------- Démarrage ----------

  async function init() {
    construireOnglets();
    const claude = window.claude;
    if (!claude || typeof claude.use !== "function") {
      etatClassement = "local";
      afficher();
      return;
    }
    afficher();
    const [d, u] = await Promise.all([claude.use("db"), claude.use("user")]);
    db = d;
    user = u;
    if (!db) { etatClassement = "local"; afficher(); return; }
    uid = user ? await user.id() : null;
    if (!uid) lectureSeule = true;
    if (user && (await user.can("data.write")) === false) lectureSeule = true;

    const minuteur = setTimeout(() => {
      if (etatClassement === "chargement") { etatClassement = "lent"; afficher(); }
    }, 10000);

    db.collection("classement").limit(1000).onSnapshot(
      (snap) => {
        fiches = snap.docs.filter((doc) => doc.exists).map(lire);
        if (!snap.metadata.fromCache && etatClassement !== "pret") {
          clearTimeout(minuteur);
          etatClassement = "pret";
          envoyer();
        }
        afficher();
      },
      () => {
        clearTimeout(minuteur);
        etatClassement = "erreur";
        afficher();
      }
    );

    setInterval(() => { if (etatClassement === "pret") { envoyer(); afficher(); } }, INTERVALLE_ENVOI);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && etatClassement === "pret") envoyer();
    });
  }

  init();
})();
