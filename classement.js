// Records personnels et classement partagé.
//
// - Les records sont toujours gardés dans le navigateur (localStorage), par
//   catégorie et par niveau : ils fonctionnent même en ouvrant index.html en local.
// - Sur la page publiée sur claude.ai, chaque joueur a aussi une fiche partagée
//   « classement/<identifiant> » qui contient ses records. Toutes les fiches
//   forment le classement. On ne stocke que l'identifiant du joueur, jamais son
//   nom : le nom est retrouvé au moment de l'affichage.
const Classement = (function () {
  "use strict";

  const CLE_LOCALE = "quiz-culture-records";
  const TOUTES = "*"; // toutes les catégories
  const TOUS = "0"; // tous les niveaux
  const TAILLE_MAX = 50; // joueurs affichés dans le classement

  let local = lireLocal();
  let db = null;
  let user = null;
  let uid = null;
  let fiches = []; // [{ id, records }]
  let etat = "local"; // local | chargement | lent | pret | erreur
  let synchroFaite = false;
  let ecritureRefusee = false;
  const abonnes = [];

  // ---------- Outils ----------

  const cle = (categorie, niveau) => `${categorie || TOUTES}|${niveau || TOUS}`;

  // Les fiches partagées sont écrites par d'autres joueurs : on vérifie tout.
  function valide(r) {
    return !!r && Number.isInteger(r.score) && Number.isInteger(r.total) &&
      r.total > 0 && r.total <= 1000 && r.score >= 0 && r.score <= r.total;
  }

  // a est-il meilleur que b ? D'abord le % de bonnes réponses, puis le nombre de questions.
  function meilleur(a, b) {
    if (!valide(a)) return false;
    if (!valide(b)) return true;
    const pa = a.score / a.total;
    const pb = b.score / b.total;
    if (pa !== pb) return pa > pb;
    return a.total > b.total;
  }

  function comparer(a, b) {
    if (meilleur(a, b)) return -1;
    if (meilleur(b, a)) return 1;
    return String(a.date || "").localeCompare(String(b.date || "")); // le plus ancien d'abord
  }

  function lireLocal() {
    try {
      const v = JSON.parse(localStorage.getItem(CLE_LOCALE));
      return v && typeof v === "object" ? v : {};
    } catch (e) {
      return {};
    }
  }

  function ecrireLocal() {
    try { localStorage.setItem(CLE_LOCALE, JSON.stringify(local)); } catch (e) { /* ignoré */ }
  }

  function notifier() {
    abonnes.forEach((fn) => fn());
  }

  // ---------- Partage ----------

  async function envoyer(tentative = 0) {
    if (!db || !uid || ecritureRefusee) return;
    try {
      await db.doc(`classement/${uid}`).set({ records: local, maj: Date.now() });
    } catch (e) {
      if (e && e.code === "unavailable" && tentative === 0) {
        setTimeout(() => envoyer(1), 1000 + Math.random() * 1000);
      } else {
        // Accès en lecture seule (ou autre refus) : on garde les records en local.
        ecritureRefusee = true;
        notifier();
      }
    }
  }

  // Une seule fois, au premier chargement : fusionne la fiche partagée et les records locaux.
  function synchroniser() {
    if (synchroFaite || !uid) return;
    synchroFaite = true;
    const mienne = fiches.find((f) => f.id === uid);
    const distants = mienne ? mienne.records : {};
    let localModifie = false;
    let aEnvoyer = false;
    Object.keys(distants).forEach((k) => {
      if (meilleur(distants[k], local[k])) { local[k] = distants[k]; localModifie = true; }
    });
    Object.keys(local).forEach((k) => {
      if (meilleur(local[k], distants[k])) aEnvoyer = true;
    });
    if (localModifie) ecrireLocal();
    if (aEnvoyer) envoyer();
  }

  async function init() {
    const claude = window.claude;
    if (!claude || typeof claude.use !== "function") return; // page ouverte en local
    etat = "chargement";
    notifier();

    const [d, u] = await Promise.all([claude.use("db"), claude.use("user")]);
    db = d;
    user = u;
    if (!db) { etat = "local"; notifier(); return; }
    uid = user ? await user.id() : null;

    const minuteur = setTimeout(() => {
      if (etat === "chargement") { etat = "lent"; notifier(); }
    }, 10000);

    db.collection("classement").limit(1000).onSnapshot(
      (snap) => {
        fiches = snap.docs
          .filter((doc) => doc.exists)
          .map((doc) => {
            const records = (doc.data() || {}).records;
            return { id: doc.id, records: records && typeof records === "object" ? records : {} };
          });
        if (!snap.metadata.fromCache) {
          clearTimeout(minuteur);
          etat = "pret";
          synchroniser();
        }
        notifier();
      },
      () => {
        clearTimeout(minuteur);
        etat = "erreur";
        notifier();
      }
    );
  }

  // ---------- API ----------

  return {
    init,

    // Record personnel pour une catégorie et un niveau ("" = toutes / tous).
    record: (categorie, niveau) => (valide(local[cle(categorie, niveau)]) ? local[cle(categorie, niveau)] : null),

    // Enregistre une partie. Renvoie { estRecord, ancien }.
    enregistrer(categorie, niveau, score, total) {
      const k = cle(categorie, niveau);
      const ancien = valide(local[k]) ? local[k] : null;
      const partie = { score, total, date: new Date().toISOString().slice(0, 10) };
      const estRecord = score > 0 && meilleur(partie, ancien);
      if (estRecord) {
        local[k] = partie;
        ecrireLocal();
        notifier();
        envoyer();
      }
      return { estRecord, ancien };
    },

    // Classement partagé pour une catégorie et un niveau.
    classement(categorie, niveau) {
      const k = cle(categorie, niveau);
      return fiches
        .map((f) => ({ id: f.id, moi: f.id === uid, ...(f.records[k] || {}) }))
        .filter(valide)
        .sort(comparer)
        .slice(0, TAILLE_MAX);
    },

    // Noms et avatars des joueurs, résolus au moment de l'affichage.
    async profils(ids) {
      if (!user || ids.length === 0) return {};
      try { return await user.profiles(ids); } catch (e) { return {}; }
    },

    etat: () => etat,
    partage: () => !!db,
    ecritureRefusee: () => ecritureRefusee || (!!db && !uid),
    surChangement: (fn) => abonnes.push(fn),
  };
})();
