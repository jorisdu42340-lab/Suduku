// Logique du jeu « Évolution » : on récolte de l'ADN, on achète des mutations
// et on fait évoluer sa créature en choisissant sa branche dans l'arbre du vivant.

const CLE_SAUVEGARDE = "evolution-sauvegarde";
const HAUSSE_PRIX = 1.15;          // +15 % par exemplaire acheté
const BONUS_PAR_ETAPE = 0.5;       // chaque stade franchi ajoute +50 % à tous les gains
const HORS_LIGNE_MAX_S = 2 * 3600; // gains hors ligne plafonnés à 2 h
const HORS_LIGNE_TAUX = 0.5;       // … et réduits de moitié
const BONUS_PAR_SUCCES = 0.02;     // chaque succès ajoute +2 % à tous les gains
const BONUS_PAR_FOSSILE = 0.1;     // chaque fossile ajoute +10 % à tous les gains
const ELAN_FINAL = 2;              // coup de pouce : gains ×2 pour les dernières formes…
const PROFONDEUR_ELAN = 7;         // … à partir du stade 8…
const EXTINCTIONS_ELAN = 3;        // … une fois 3 extinctions provoquées
const CLICS_PAR_SECONDE = 3;       // rythme supposé pour conseiller les mutations « clic »
const ADN_PAR_FOSSILE = 1e5;       // fossiles gagnés = racine carrée de (ADN récolté dans la partie / 100 000)

const $ = (id) => document.getElementById(id);

// ---------- Préparation de l'arbre ----------

const STADE = Object.fromEntries(ETAPES.map((e) => [e.id, e]));
const RACINE = ETAPES[0].id;

// Profondeur de chaque stade, à partir de la racine.
const PROFONDEUR = { [RACINE]: 0 };
(function calculerProfondeurs() {
  const file = [RACINE];
  while (file.length) {
    const id = file.shift();
    STADE[id].suivantes.forEach((s) => {
      if (!STADE[s]) return console.error(`Stade inconnu « ${s} » après « ${id} »`);
      if (PROFONDEUR[s] === undefined) {
        PROFONDEUR[s] = PROFONDEUR[id] + 1;
        file.push(s);
      } else if (PROFONDEUR[s] !== PROFONDEUR[id] + 1) {
        console.warn(`« ${s} » est atteint à des profondeurs différentes`);
      }
    });
  }
})();

// Mutations à plat, avec puissance et prix déduits de la profondeur du stade.
const MUTATIONS = ETAPES.flatMap((e) => e.mutations.map(([id, nom, emoji, type]) => {
  const [valeur, prix] = PUISSANCE[Math.min(PROFONDEUR[e.id], PUISSANCE.length - 1)][type];
  return { id, nom, emoji, type, valeur, prix, stade: e.id };
}));

const coutStade = (id) => COUTS[Math.min(PROFONDEUR[id], COUTS.length - 1)];

// ---------- État et sauvegarde ----------

// Statistiques de toutes les parties, conservées quand on recommence (pour les succès).
function statsInitiales(clics = 0, adn = 0) {
  return { clics, adn, meteorites: 0, bonus: 0, extinctions: 0, evenements: [], sommets: [], faits: [] };
}

// `garde` : ce qui survit à une extinction (espèces découvertes, succès, statistiques, fossiles).
function etatInitial(garde = {}) {
  return Object.assign({ version: 2, adn: 0, adnTotal: 0, clics: 0, chemin: [RACINE], mutations: {},
    decouvertes: [RACINE], effets: [], succes: [], stats: statsInitiales(), fossiles: 0, vu: Date.now() }, garde);
}

let messageMigration = "";

// Les sauvegardes de la première version suivaient une seule lignée.
function migrer(ancien) {
  const lignee = ["cellule", "ver", "poisson", "amphibien", "reptile"]; // jusqu'à l'embranchement
  const garde = Math.min(ancien.etape || 0, lignee.length - 1);
  const etat = Object.assign(etatInitial(), ancien, { version: 2, chemin: lignee.slice(0, garde + 1) });
  etat.decouvertes = [...etat.chemin];
  etat.stats = statsInitiales(etat.clics, etat.adnTotal);
  delete etat.etape;
  // Les stades qui n'existent plus sur ce chemin sont remboursés.
  let rembourse = 0;
  for (let d = garde + 1; d <= (ancien.etape || 0); d++) rembourse += COUTS[d] || 0;
  if (rembourse) {
    etat.adn += rembourse;
    messageMigration = `🌳 L'évolution se ramifie ! Ta créature redevient ${STADE[etat.chemin.at(-1)].nom} ` +
      `et récupère ${format(rembourse)} ADN pour choisir sa nouvelle branche.`;
  } else {
    messageMigration = "🌳 L'évolution se ramifie : à certains stades, tu choisiras désormais ta branche !";
  }
  return etat;
}

function charger() {
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE);
    if (brut) {
      const donnees = JSON.parse(brut);
      if (donnees.version !== 2) return migrer(donnees);
      const etat = Object.assign(etatInitial(), donnees);
      // On ignore les stades qui n'existeraient plus dans les données.
      const valide = etat.chemin.findIndex((id) => !STADE[id]);
      if (valide > 0) etat.chemin = etat.chemin.slice(0, valide);
      etat.decouvertes = etat.decouvertes.filter((id) => STADE[id]);
      etat.effets = (etat.effets || []).filter((e) => e.fin > Date.now());
      etat.stats = Object.assign(statsInitiales(etat.clics, etat.adnTotal), donnees.stats);
      etat.succes = etat.succes.filter((id) => SUCCES.some((x) => x.id === id));
      return etat;
    }
  } catch (e) { /* stockage indisponible ou illisible : on repart de zéro */ }
  return etatInitial();
}

function sauver() {
  etat.vu = Date.now();
  try { localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat)); } catch (e) { /* ignoré */ }
}

let etat = charger();

// ---------- Calculs ----------

const stadeActuel = () => STADE[etat.chemin.at(-1)];
const profondeur = () => etat.chemin.length - 1;
const nombre = (id) => etat.mutations[id] || 0;
const prix = (m) => Math.ceil(m.prix * Math.pow(HAUSSE_PRIX, nombre(m.id)));
const disponibles = () => MUTATIONS.filter((m) => etat.chemin.includes(m.stade));

// Produit des atouts gagnés le long du chemin, pour "clic" ou "auto".
function atouts(type) {
  return etat.chemin.reduce((total, id) => total * ((STADE[id].atout || {})[type] || 1), 1);
}

function somme(type) {
  return disponibles().filter((m) => m.type === type)
    .reduce((total, m) => total + m.valeur * nombre(m.id), 0);
}
// Effets temporaires des événements en cours.
const effetsActifs = () => etat.effets.filter((e) => e.fin > Date.now());
const modificateur = (type) => effetsActifs().reduce((m, e) => m * (e[type] || 1), 1);

const bonusFossiles = (n = etat.fossiles) => BONUS_PAR_FOSSILE * n;
const elanDebloque = () => etat.stats.extinctions >= EXTINCTIONS_ELAN;
const elanFinal = () => elanDebloque() && profondeur() >= PROFONDEUR_ELAN;
const multiplicateur = () => (1 + BONUS_PAR_ETAPE * profondeur()) *
  (1 + BONUS_PAR_SUCCES * etat.succes.length) * (1 + bonusFossiles()) * (elanFinal() ? ELAN_FINAL : 1);

// Conseil : la mutation qui rapporte le plus pour chaque ADN dépensé, même si elle n'est pas
// encore payable (il vaut alors mieux économiser pour elle). Les simulations montrent que
// c'est la stratégie la plus rapide pour atteindre les dernières formes.
// Les clics comptent pour CLICS_PAR_SECONDE clics par seconde.
const apport = (m) => m.valeur * multiplicateur() * atouts(m.type) * modificateur(m.type) *
  (m.type === "clic" ? CLICS_PAR_SECONDE : 1);
const rythme = () => parSeconde() + parClic() * CLICS_PAR_SECONDE;

function meilleureMutation() {
  return disponibles().reduce((a, b) => (apport(b) / prix(b) > apport(a) / prix(a) ? b : a), disponibles()[0]);
}

function duree(secondes) {
  if (!isFinite(secondes)) return "∞";
  if (secondes < 60) return `${Math.ceil(secondes)} s`;
  if (secondes < 3600) return `${Math.floor(secondes / 60)} min ${String(Math.ceil(secondes % 60)).padStart(2, "0")} s`;
  return `${Math.floor(secondes / 3600)} h ${String(Math.floor((secondes % 3600) / 60)).padStart(2, "0")} min`;
}

// Fossiles obtenus si l'extinction avait lieu maintenant, et ADN à récolter pour le suivant.
const fossilesAGagner = () => Math.floor(Math.sqrt(etat.adnTotal / ADN_PAR_FOSSILE));
const adnPourFossiles = (n) => n * n * ADN_PAR_FOSSILE;
const parClic = () => (1 + somme("clic")) * multiplicateur() * atouts("clic") * modificateur("clic");
const parSeconde = () => somme("auto") * multiplicateur() * atouts("auto") * modificateur("auto");

function gagner(quantite) {
  etat.adn += quantite;
  etat.adnTotal += quantite;
  etat.stats.adn += quantite;
}

// Retient qu'une chose est arrivée (utile aux succès).
function marquer(fait) {
  if (!etat.stats.faits.includes(fait)) etat.stats.faits.push(fait);
}

function format(n) {
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1).replace(".", ",") : Math.floor(n).toString();
  const unites = ["", "k", "M", "Md", "Bn", "Bd", "Tn"];
  let i = 0;
  while (n >= 1000 && i < unites.length - 1) { n /= 1000; i++; }
  return n.toLocaleString("fr-FR", { maximumFractionDigits: n < 100 ? 2 : 0 }) + " " + unites[i];
}

// ---------- Sons (synthétisés, aucun fichier) ----------

let audio = null;
function son(frequences, duree = 0.08, forme = "sine") {
  if (!$("choix-son").checked) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    frequences.forEach((f, i) => {
      const t = audio.currentTime + i * duree;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = forme;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duree * 1.5);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + duree * 1.5);
    });
  } catch (e) { /* audio indisponible */ }
}

// ---------- Journal ----------

function noter(texte) {
  const li = document.createElement("li");
  li.textContent = texte;
  $("journal").prepend(li);
  while ($("journal").children.length > 30) $("journal").lastChild.remove();
}

// ---------- Affichage ----------

function afficherHabitat() {
  const e = stadeActuel();
  const habitat = $("habitat");
  habitat.style.setProperty("--ciel", e.ciel);
  habitat.style.setProperty("--sol", e.sol);
  $("creature").textContent = e.emoji;
  $("nom-etape").textContent = `${e.nom} · stade ${profondeur() + 1}`;
  $("milieu").textContent = `${MILIEUX[e.type].emoji} ${e.milieu}`;
  $("lignee").textContent = etat.chemin.map((id) => STADE[id].emoji).join(" › ");

  const decor = $("decor");
  decor.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const s = document.createElement("span");
    s.textContent = e.decor[i % e.decor.length];
    s.style.left = `${(i * 37 + 7) % 92}%`;
    s.style.top = `${(i * 53 + 11) % 85}%`;
    s.style.animationDelay = `${-i * 1.3}s`;
    decor.append(s);
  }

  const liste = etat.chemin.map((id) => STADE[id].atout).filter(Boolean);
  if (elanFinal()) liste.push({ texte: `🌟 Élan final : gains ×${ELAN_FINAL} pour les dernières formes` });
  $("atouts").innerHTML = "";
  liste.forEach((a) => {
    const li = document.createElement("li");
    li.textContent = a.texte;
    $("atouts").append(li);
  });
  $("atouts").hidden = liste.length === 0;
}

function construireMutations() {
  const zone = $("mutations");
  zone.innerHTML = "";
  disponibles().forEach((m) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mutation";
    b.dataset.id = m.id;
    b.innerHTML = `<span class="ico" aria-hidden="true">${m.emoji}</span>
      <span><span class="nom">${m.nom}</span>
      <span class="effet">+${format(m.valeur)} ADN ${m.type === "clic" ? "par clic" : "par seconde"}</span>
      <span class="prix"></span></span>
      <span class="nb"></span>`;
    b.addEventListener("click", () => acheter(m, b));
    zone.append(b);
  });
  // Aperçu : les mutations qu'apportera chacune des prochaines évolutions.
  const suivantes = stadeActuel().suivantes.map((id) => STADE[id]);
  if (suivantes.length) {
    const titre = document.createElement("p");
    titre.className = "verrou";
    titre.textContent = suivantes.length > 1
      ? "🔒 À débloquer : chaque branche apporte ses propres mutations."
      : "🔒 À débloquer au prochain stade :";
    zone.append(titre);
    suivantes.forEach((st) => {
      MUTATIONS.filter((m) => m.stade === st.id).forEach((m) => {
        const d = document.createElement("div");
        d.className = "mutation a-venir";
        d.innerHTML = `<span class="ico" aria-hidden="true"></span>
          <span><span class="nom"></span><span class="effet"></span><span class="prix"></span></span><span class="nb">🔒</span>`;
        d.querySelector(".ico").textContent = m.emoji;
        d.querySelector(".nom").textContent = m.nom;
        d.querySelector(".effet").textContent = `+${format(m.valeur)} ADN ${m.type === "clic" ? "par clic" : "par seconde"}`;
        d.querySelector(".prix").textContent = `Avec ${st.emoji} ${st.nom} · ${format(m.prix)} ADN`;
        zone.append(d);
      });
    });
  }
}

// Cartes des stades suivants : une seule, ou plusieurs quand la branche se divise.
function construireChoix() {
  const zone = $("choix-evolution");
  zone.innerHTML = "";
  const suivantes = stadeActuel().suivantes.map((id) => STADE[id]);
  const types = [...new Set(suivantes.map((s) => s.type))];
  $("titre-evolution").textContent = suivantes.length < 2
    ? "Prochaine évolution"
    : types.length > 1
      ? `🌳 Embranchement : ${types.map((t) => `${MILIEUX[t].emoji} ${MILIEUX[t].nom.toLowerCase()}`).join(" ou ")} ?`
      : "🌳 Embranchement : choisis ta voie";
  suivantes.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choix";
    b.dataset.id = s.id;
    const atout = s.atout ? `<span class="atout">${s.atout.texte}</span>` : "";
    const m = MILIEUX[s.type];
    b.innerHTML = `<span class="type-milieu type-${s.type}">${m.emoji} ${m.nom}</span>
      <span class="ico" aria-hidden="true">${s.emoji}</span>
      <span class="nom">${s.nom}</span>
      <span class="milieu-choix">${s.milieu}</span>${atout}
      <span class="action">Évoluer</span>`;
    b.addEventListener("click", () => evoluer(s.id));
    zone.append(b);
  });
}

function construireArbre() {
  const zone = $("arbre");
  zone.innerHTML = "";
  const parNiveau = [];
  ETAPES.forEach((e) => {
    const d = PROFONDEUR[e.id];
    if (d !== undefined) (parNiveau[d] = parNiveau[d] || []).push(e);
  });
  parNiveau.forEach((stades, d) => {
    const rang = document.createElement("div");
    rang.className = "rang";
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = d + 1;
    const puces = document.createElement("div");
    puces.className = "puces";
    rang.append(num, puces);
    stades.forEach((e) => {
      const connu = etat.decouvertes.includes(e.id);
      const puce = document.createElement("span");
      puce.className = `puce type-${e.type}` + (etat.chemin.includes(e.id) ? " chemin" : connu ? "" : " inconnue");
      puce.textContent = connu ? `${e.emoji} ${e.nom}` : "❓";
      puce.title = connu ? `${e.nom} — ${e.milieu} (${MILIEUX[e.type].nom.toLowerCase()})` : "Espèce encore inconnue";
      puces.append(puce);
    });
    zone.append(rang);
  });
  $("decouvertes").textContent =
    `${etat.decouvertes.length} / ${ETAPES.length} espèces découvertes`;
  $("legende-milieux").innerHTML = "";
  Object.entries(MILIEUX).forEach(([cle, m]) => {
    const l = document.createElement("span");
    l.className = `puce type-${cle}`;
    l.textContent = `${m.emoji} ${m.nom}`;
    $("legende-milieux").append(l);
  });
}

function rafraichir() {
  $("adn").textContent = format(etat.adn);
  $("par-seconde").textContent = format(parSeconde());
  $("par-clic").textContent = format(parClic());

  const conseil = meilleureMutation();
  $("texte-conseil").textContent = texteConseil(conseil);
  document.querySelectorAll(".mutation[data-id]").forEach((b) => {
    const m = MUTATIONS.find((x) => x.id === b.dataset.id);
    b.classList.toggle("conseil", m === conseil);
    const p = prix(m);
    b.querySelector(".prix").textContent = `Coût : ${format(p)} ADN`;
    b.querySelector(".nb").textContent = nombre(m.id) || "";
    b.disabled = etat.adn < p;
  });

  const suivantes = stadeActuel().suivantes;
  if (suivantes.length) {
    const cout = coutStade(suivantes[0]);
    $("barre-evolution").style.width = `${Math.min(1, etat.adn / cout) * 100}%`;
    const manque = cout - etat.adn;
    let estimation = "";
    if (manque > 0) {
      estimation = parSeconde() > 0
        ? ` · ≈ ${duree(manque / parSeconde())} sans cliquer`
        : " · achète des mutations « par seconde » pour avancer sans cliquer";
    }
    $("texte-evolution").textContent = `${format(etat.adn)} / ${format(cout)} ADN pour évoluer${estimation}`;
    const prochaine = profondeur() + 1;
    $("aide-elan").hidden = prochaine !== PROFONDEUR_ELAN || !elanDebloque();
    $("aide-elan").textContent = `🌟 Au prochain stade commencent les dernières formes : tous tes gains seront multipliés par ${ELAN_FINAL} jusqu'à l'Être cosmique.`;
    document.querySelectorAll(".choix").forEach((b) => { b.disabled = etat.adn < coutStade(b.dataset.id); });
  } else {
    $("titre-evolution").textContent = "Évolution complète 🌌";
    $("aide-elan").hidden = true;
    $("barre-evolution").style.width = "100%";
    const reste = ETAPES.length - etat.decouvertes.length;
    $("texte-evolution").textContent = reste
      ? `Tu as atteint le sommet ! Il reste ${reste} espèce${reste > 1 ? "s" : ""} à découvrir : recommence et choisis d'autres branches.`
      : "Tu as atteint le sommet et découvert toutes les espèces. Bravo !";
  }

  $("stats").textContent = `${format(etat.adnTotal)} ADN récoltés · ${etat.clics} clics`;
  afficherExtinction();
  afficherEffets();
}

const pourcent = (x) => `+${Math.round(x * 100).toLocaleString("fr-FR")} %`;

function afficherExtinction() {
  const faites = etat.stats.extinctions;
  $("texte-elan").textContent = elanDebloque()
    ? `🌟 Élan final débloqué : tes gains sont doublés à partir du stade ${PROFONDEUR_ELAN + 1}.`
    : `🔒 Élan final : après ${EXTINCTIONS_ELAN} extinctions, tes gains seront doublés à partir du stade ${PROFONDEUR_ELAN + 1}, ` +
      `jusqu'à l'Être cosmique (${faites} / ${EXTINCTIONS_ELAN}).`;
  $("texte-elan").classList.toggle("debloque", elanDebloque());
  $("fossiles").hidden = etat.fossiles === 0;
  $("fossiles").textContent = `🦴 ${etat.fossiles} fossile${etat.fossiles > 1 ? "s" : ""} · ${pourcent(bonusFossiles())} sur tous les gains`;
  const n = fossilesAGagner();
  const suivant = adnPourFossiles(n + 1);
  const btn = $("btn-extinction");
  btn.disabled = n < 1 || figee;
  if (n < 1) {
    $("texte-extinction").textContent =
      `Récolte ${format(suivant)} ADN dans cette partie pour obtenir ton premier fossile (${format(etat.adnTotal)} pour l'instant).`;
  } else {
    $("texte-extinction").innerHTML = "";
    const gain = document.createElement("strong");
    gain.textContent = `🦴 +${n} fossile${n > 1 ? "s" : ""}`;
    $("texte-extinction").append("Si l'extinction arrive maintenant : ", gain,
      ` → bonus permanent ${pourcent(bonusFossiles(etat.fossiles))} → ${pourcent(bonusFossiles(etat.fossiles + n))}. ` +
      `Fossile suivant à ${format(suivant)} ADN récoltés.`);
  }
}

const facteur = (x) => "×" + x.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

function afficherEffets() {
  const liste = $("effets");
  const actifs = effetsActifs();
  liste.hidden = actifs.length === 0;
  liste.innerHTML = "";
  actifs.forEach((e) => {
    const reste = Math.ceil((e.fin - Date.now()) / 1000);
    const parts = [];
    if (e.clic && e.clic !== 1) parts.push(`${facteur(e.clic)} / clic`);
    if (e.auto && e.auto !== 1) parts.push(`${facteur(e.auto)} / s`);
    const li = document.createElement("li");
    li.className = (e.clic || 1) * (e.auto || 1) >= 1 ? "bon" : "mauvais";
    li.textContent = `${e.emoji} ${e.nom} · ${parts.join(" · ")} · ${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, "0")}`;
    liste.append(li);
  });
}

// Teinte et particules de l'événement le plus récent encore actif.
let ambiance = "";
function afficherAmbiance() {
  const actifs = effetsActifs();
  const teinte = [...actifs].reverse().find((e) => e.teinte);
  const pluie = [...actifs].reverse().find((e) => e.particules);
  const cle = `${teinte ? teinte.teinte : ""}|${pluie ? pluie.particules : ""}`;
  if (cle === ambiance) return;
  ambiance = cle;
  $("voile").className = "voile" + (teinte ? ` voile-${teinte.teinte}` : "");
  const meteo = $("meteo");
  meteo.innerHTML = "";
  if (!pluie) return;
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.textContent = pluie.particules;
    s.style.left = `${(i * 41 + 3) % 97}%`;
    s.style.animationDuration = `${2.5 + (i % 5) * 0.6}s`;
    s.style.animationDelay = `${-i * 0.45}s`;
    meteo.append(s);
  }
}

function toutAfficher() {
  construireSucces();
  afficherHabitat();
  construireMutations();
  construireChoix();
  construireArbre();
  rafraichir();
}

// ---------- Effets ----------

function bulleGain(texte, x, y) {
  const g = document.createElement("span");
  g.className = "gain";
  g.textContent = texte;
  g.style.left = `${x}px`;
  g.style.top = `${y}px`;
  $("habitat").append(g);
  setTimeout(() => g.remove(), 900);
}

function rejouer(el, classe) {
  el.classList.remove(classe);
  void el.offsetWidth; // relance l'animation
  el.classList.add(classe);
  el.addEventListener("animationend", () => el.classList.remove(classe), { once: true });
}

// ---------- Actions ----------

const derniersClics = [];
let figee = false; // vrai pendant l'animation d'extinction
function cliquer(evenement) {
  if (figee) return;
  const gain = parClic();
  gagner(gain);
  etat.clics++;
  etat.stats.clics++;
  const maintenant = Date.now();
  derniersClics.push(maintenant);
  while (derniersClics[0] < maintenant - 2000) derniersClics.shift();
  if (derniersClics.length >= 15) marquer("frenesie");
  const zone = $("habitat").getBoundingClientRect();
  const x = evenement.clientX ? evenement.clientX - zone.left : zone.width / 2;
  const y = evenement.clientY ? evenement.clientY - zone.top : zone.height / 2;
  bulleGain(`+${format(gain)}`, x - 15, y - 20);
  rejouer($("creature"), "tape");
  son([300 + profondeur() * 40 + Math.random() * 60], 0.05, "triangle");
  rafraichir();
}

function acheter(m, bouton) {
  if (figee) return;
  const p = prix(m);
  if (etat.adn < p) return;
  etat.adn -= p;
  etat.mutations[m.id] = nombre(m.id) + 1;
  rejouer(bouton, "achat");
  son([523, 659], 0.07);
  if (nombre(m.id) === 1) noter(`${m.emoji} Nouvelle mutation : ${m.nom} !`);
  rafraichir();
  sauver();
}

function texteConseil(m = meilleureMutation()) {
  const suivantes = stadeActuel().suivantes;
  if (suivantes.length && etat.adn >= coutStade(suivantes[0])) {
    return "⭐ Conseil : évolue d'abord ! Chaque nouveau stade ajoute +50 % à tous tes gains et apporte de nouvelles mutations.";
  }
  if (!m) return "";
  if (etat.adn >= prix(m)) {
    return `⭐ Conseil : achète ${m.emoji} ${m.nom}, c'est la mutation qui rapporte le plus pour son prix.`;
  }
  const attente = (prix(m) - etat.adn) / rythme();
  const autres = disponibles().some((x) => x !== m && etat.adn >= prix(x));
  return `⭐ Conseil : économise pour ${m.emoji} ${m.nom} (${format(prix(m))} ADN, ≈ ${duree(attente)}), ` +
    (autres ? "même si d'autres sont payables : c'est elle qui rapporte le plus pour son prix."
            : "c'est la mutation qui rapporte le plus pour son prix.");
}

// Achète la mutation conseillée tant qu'on peut se la payer.
function acheterConseils() {
  if (figee) return;
  const achats = {};
  // Si une évolution est déjà payable, on garde de quoi la payer.
  const suivantes = stadeActuel().suivantes;
  const cout = suivantes.length ? coutStade(suivantes[0]) : Infinity;
  const reserve = etat.adn >= cout ? cout : 0;
  for (let i = 0; i < 500; i++) {
    const m = meilleureMutation();
    if (!m || etat.adn - reserve < prix(m)) break;
    etat.adn -= prix(m);
    etat.mutations[m.id] = nombre(m.id) + 1;
    achats[m.id] = (achats[m.id] || 0) + 1;
  }
  const liste = Object.entries(achats);
  if (!liste.length) {
    annoncer(texteConseil(), 3500);
    return;
  }
  son([523, 659, 784], 0.06);
  noter("⭐ Achats conseillés : " + liste.map(([id, n]) => {
    const m = MUTATIONS.find((x) => x.id === id);
    return `${m.emoji} ${m.nom} ×${n}`;
  }).join(", "));
  rafraichir();
  sauver();
}

function evoluer(id) {
  if (figee) return;
  const suivante = STADE[id];
  if (!stadeActuel().suivantes.includes(id)) return;
  const cout = coutStade(id);
  if (etat.adn < cout) return;
  const embranchement = stadeActuel().suivantes.length > 1;
  etat.adn -= cout;
  if (id === "cosmique" && !etat.stats.sommets.includes(etat.chemin.at(-1))) {
    etat.stats.sommets.push(etat.chemin.at(-1));
  }
  etat.chemin.push(id);
  const nouvelle = !etat.decouvertes.includes(id);
  if (nouvelle) etat.decouvertes.push(id);

  const flash = document.createElement("div");
  flash.className = "flash";
  $("habitat").append(flash);
  setTimeout(() => flash.remove(), 800);
  rejouer($("creature"), "mue");
  son([392, 523, 659, 784, 1047], 0.1, "square");

  noter(`${suivante.emoji} Tu as évolué en ${suivante.nom} ! ${suivante.texte}`);
  if (embranchement && suivante.atout) noter(`🌳 Branche choisie. Atout gagné — ${suivante.atout.texte}`);
  if (nouvelle && etat.decouvertes.length > 1) noter(`📖 Nouvelle espèce découverte (${etat.decouvertes.length}/${ETAPES.length})`);
  toutAfficher();
  sauver();
}

// Bonus aléatoire : un objet brillant apparaît quelques secondes dans l'habitat.
function programmerBonus() {
  setTimeout(() => {
    const e = stadeActuel();
    const b = document.createElement("button");
    b.type = "button";
    b.className = "bonus";
    b.textContent = "✨";
    b.setAttribute("aria-label", "Bonus d'ADN");
    b.style.left = `${10 + Math.random() * 75}%`;
    b.style.top = `${15 + Math.random() * 60}%`;
    b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const gain = Math.max(parClic() * 20, parSeconde() * 30, 10);
      gagner(gain);
      etat.stats.bonus++;
      bulleGain(`✨ +${format(gain)}`, b.offsetLeft, b.offsetTop);
      son([784, 988, 1175], 0.06);
      noter(`✨ Mutation spontanée (${e.milieu.toLowerCase()}) : +${format(gain)} ADN`);
      b.remove();
      rafraichir();
    });
    $("bonus-zone").append(b);
    setTimeout(() => b.remove(), 8000);
    programmerBonus();
  }, 25000 + Math.random() * 35000);
}

// ---------- Événements aléatoires ----------

const EVENEMENT = Object.fromEntries(EVENEMENTS.map((e) => [e.id, e]));
let defiEnCours = null;
let dernierEvenement = null;
let minuterieAnnonce = null;

function annoncer(texte, duree = 7000) {
  const a = $("annonce");
  a.textContent = texte;
  a.hidden = false;
  rejouer(a, "arrivee");
  clearTimeout(minuterieAnnonce);
  if (duree) minuterieAnnonce = setTimeout(() => { a.hidden = true; }, duree);
}

// L'effet à appliquer : la variante du stade le plus récent de la lignée, sinon l'effet par défaut.
// Renvoie aussi la clé de la variante, pour les succès ("dinosaure", "defaut"…).
function effetPour(ev) {
  const variantes = ev.variantes || {};
  const id = [...etat.chemin].reverse().find((s) => variantes[s]);
  return id ? [variantes[id], id] : [ev.effet, "defaut"];
}

function appliquer(ev, effet, cle) {
  marquer(`${ev.id}:${cle}`);
  if (ev.id === "meteorite" && cle === "reussite") etat.stats.meteorites++;
  let detail = "";
  if (effet.perte) {
    const perte = etat.adn * effet.perte;
    etat.adn -= perte;
    detail += ` (−${format(perte)} ADN)`;
  }
  if (effet.gain) {
    const gain = Math.max(parSeconde() * effet.gain, parClic() * effet.gain / 2, 10);
    gagner(gain);
    detail += ` (+${format(gain)} ADN)`;
    const zone = $("habitat");
    bulleGain(`+${format(gain)}`, zone.clientWidth / 2 - 30, zone.clientHeight / 3);
  }
  if (effet.duree && (effet.clic || effet.auto)) {
    etat.effets.push({ id: ev.id, nom: ev.nom, emoji: ev.emoji, clic: effet.clic, auto: effet.auto,
      teinte: ev.teinte, particules: ev.particules, fin: Date.now() + effet.duree * 1000 });
  }
  const bilan = (effet.clic || 1) * (effet.auto || 1) >= 1 && !effet.perte;
  son(bilan ? [523, 784, 1047] : [220, 185, 147], 0.12, bilan ? "sine" : "sawtooth");
  noter(`${ev.emoji} ${ev.nom} : ${effet.texte}${detail}`);
  annoncer(`${ev.emoji} ${effet.texte}${detail}`);
  afficherAmbiance();
  verifierSucces();
  rafraichir();
  sauver();
}

function declencherEvenement(id) {
  const ev = EVENEMENT[id];
  if (!ev || defiEnCours || figee) return;
  dernierEvenement = id;
  if (!etat.stats.evenements.includes(id)) etat.stats.evenements.push(id);
  noter(`${ev.emoji} ${ev.nom} ! ${ev.annonce}`);
  if (ev.defi) lancerDefi(ev);
  else appliquer(ev, ...effetPour(ev));
}

// Défi : un objet traverse l'habitat, il faut cliquer dessus assez de fois avant la fin.
function lancerDefi(ev) {
  let restant = ev.defi.clics;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "defi";
  b.style.left = `${15 + Math.random() * 55}%`;
  b.style.animationDuration = `${ev.defi.secondes}s`;
  b.innerHTML = `<span aria-hidden="true">${ev.defi.emoji || ev.emoji}</span><span class="compte">${restant}</span>`;
  b.setAttribute("aria-label", `${ev.nom} : encore ${restant} clics`);
  annoncer(`${ev.emoji} ${ev.annonce}`, 0);
  son([880, 660, 880, 660], 0.12, "square");

  const finir = (reussi) => {
    clearTimeout(defiEnCours.minuterie);
    defiEnCours = null;
    b.remove();
    if (reussi) {
      appliquer(ev, ev.reussite, "reussite");
    } else {
      const flash = document.createElement("div");
      flash.className = "flash impact";
      $("habitat").append(flash);
      setTimeout(() => flash.remove(), 800);
      rejouer($("habitat"), "secousse");
      appliquer(ev, ...effetPour(ev));
    }
  };

  b.addEventListener("click", (e) => {
    e.stopPropagation();
    restant--;
    b.querySelector(".compte").textContent = restant;
    b.setAttribute("aria-label", `${ev.nom} : encore ${restant} clics`);
    rejouer(b.firstElementChild, "touche");
    son([400 + (ev.defi.clics - restant) * 50], 0.04, "square");
    if (restant <= 0) finir(true);
  });
  $("bonus-zone").append(b);
  defiEnCours = { finir, minuterie: setTimeout(() => finir(false), ev.defi.secondes * 1000) };
}

function programmerEvenement(delai) {
  setTimeout(() => {
    const d = profondeur();
    const possibles = EVENEMENTS.filter((e) =>
      d >= (e.profondeurMin || 0) && d <= (e.profondeurMax ?? Infinity) &&
      e.id !== dernierEvenement && !effetsActifs().some((x) => x.id === e.id));
    if (!defiEnCours && !document.hidden && possibles.length) {
      declencherEvenement(possibles[Math.floor(Math.random() * possibles.length)].id);
    }
    programmerEvenement(60000 + Math.random() * 90000);
  }, delai);
}

// ---------- Succès ----------

function resume() {
  const quantites = Object.entries(etat.mutations)
    .filter(([id]) => disponibles().some((m) => m.id === id))
    .map(([, n]) => n);
  return {
    clics: etat.stats.clics,
    adn: etat.stats.adn,
    parSeconde: parSeconde(),
    profondeur: profondeur(),
    stade: etat.chemin.at(-1),
    mutations: quantites.reduce((a, b) => a + b, 0),
    maxMutation: Math.max(0, ...quantites),
    decouvertes: etat.decouvertes.length,
    sommets: etat.stats.sommets.length,
    evenements: etat.stats.evenements.length,
    meteorites: etat.stats.meteorites,
    bonus: etat.stats.bonus,
    extinctions: etat.stats.extinctions,
    fossiles: etat.fossiles,
    fait: (x) => etat.stats.faits.includes(x),
  };
}

function verifierSucces() {
  const restants = SUCCES.filter((x) => !etat.succes.includes(x.id));
  if (!restants.length) return;
  const r = resume();
  const nouveaux = restants.filter((x) => { try { return x.test(r); } catch (e) { return false; } });
  if (!nouveaux.length) return;
  nouveaux.forEach((x, i) => {
    etat.succes.push(x.id);
    noter(`🏆 Succès débloqué : ${x.emoji} ${x.nom} — ${x.description} (+${BONUS_PAR_SUCCES * 100} % de gains)`);
    setTimeout(() => notifierSucces(x), i * 700);
  });
  construireSucces();
  sauver();
}

function notifierSucces(x) {
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.innerHTML = `<span class="ico" aria-hidden="true"></span><span><small>Succès débloqué</small><strong></strong></span>`;
  t.querySelector(".ico").textContent = x.emoji;
  t.querySelector("strong").textContent = x.nom;
  $("toasts").append(t);
  son([659, 784, 988, 1319], 0.09, "triangle");
  setTimeout(() => t.classList.add("sortie"), 3500);
  setTimeout(() => t.remove(), 4000);
}

function construireSucces() {
  const zone = $("succes");
  zone.innerHTML = "";
  SUCCES.forEach((x) => {
    const obtenu = etat.succes.includes(x.id);
    const cache = x.secret && !obtenu;
    const d = document.createElement("div");
    d.className = "badge-succes" + (obtenu ? " obtenu" : "");
    d.innerHTML = `<span class="ico" aria-hidden="true"></span><span><strong></strong><small></small></span>`;
    d.querySelector(".ico").textContent = obtenu ? x.emoji : cache ? "❔" : "🔒";
    d.querySelector("strong").textContent = cache ? "Succès secret" : x.nom;
    d.querySelector("small").textContent = cache ? "Continue de jouer pour le découvrir…" : x.description;
    zone.append(d);
  });
  const n = etat.succes.length;
  $("bilan-succes").textContent =
    `${n} / ${SUCCES.length} débloqués · bonus permanent +${Math.round(n * BONUS_PAR_SUCCES * 100)} % sur tous les gains`;
}

// ---------- Démarrage ----------

function gainsHorsLigne() {
  const secondes = Math.min(HORS_LIGNE_MAX_S, (Date.now() - etat.vu) / 1000);
  const gain = parSeconde() * secondes * HORS_LIGNE_TAUX;
  if (secondes > 10 && gain > 0) {
    gagner(gain);
    marquer("absence");
    noter(`💤 Pendant ton absence, ta créature a récolté ${format(gain)} ADN.`);
  }
}

$("creature").addEventListener("click", cliquer);
$("btn-conseils").addEventListener("click", acheterConseils);
// Les actions irréversibles demandent un second clic (pas de fenêtre confirm()).
function confirmerDeuxFois(btn, texteConfirmation, action) {
  let attente = null;
  const texteNormal = btn.innerHTML;
  const remettre = () => {
    clearTimeout(attente);
    attente = null;
    btn.innerHTML = texteNormal;
    btn.classList.remove("alerte");
  };
  btn.addEventListener("click", () => {
    if (!attente) {
      btn.textContent = texteConfirmation;
      btn.classList.add("alerte");
      attente = setTimeout(remettre, 4000);
      return;
    }
    remettre();
    action();
  });
}

function annulerDefi() {
  if (!defiEnCours) return;
  clearTimeout(defiEnCours.minuterie);
  defiEnCours = null;
  $("bonus-zone").querySelectorAll(".defi").forEach((d) => d.remove());
  $("annonce").hidden = true;
}

function nouvellePartie(garde, message) {
  etat = etatInitial(garde);
  ambiance = null;
  afficherAmbiance();
  $("journal").innerHTML = "";
  [].concat(message).forEach(noter);
  verifierSucces();
  toutAfficher();
  sauver();
}

// Extinction : on repart de la cellule, mais on gagne des fossiles (bonus permanent).
function provoquerExtinction() {
  const gain = fossilesAGagner();
  if (gain < 1 || figee) return;
  annulerDefi();
  figee = true;
  if (etat.chemin.at(-1) === "cosmique") marquer("renaissance");
  const garde = { decouvertes: etat.decouvertes, succes: etat.succes, stats: etat.stats, fossiles: etat.fossiles + gain };
  const ancien = stadeActuel();

  $("habitat").classList.add("cataclysme");
  annoncer("☄️ Une grande extinction balaie la planète…", 2400);
  son([392, 330, 262, 196, 131, 98], 0.18, "sawtooth");
  afficherExtinction();

  setTimeout(() => {
    $("habitat").classList.remove("cataclysme");
    figee = false;
    garde.stats.extinctions++;
    const elan = garde.stats.extinctions === EXTINCTIONS_ELAN
      ? [`🌟 ${EXTINCTIONS_ELAN}e extinction : l'Élan final est débloqué ! Tes gains seront doublés à partir du stade ${PROFONDEUR_ELAN + 1}.`]
      : [];
    nouvellePartie(garde, [
      `🦴 Extinction ! Ton espèce de ${ancien.nom.toLowerCase()} a disparu, mais ses fossiles lui survivent : ` +
      `+${gain} fossile${gain > 1 ? "s" : ""}, soit ${pourcent(bonusFossiles(garde.fossiles))} sur tous tes gains, pour toujours.`,
      "🦠 La vie repart de zéro dans l'océan primitif. Quelle branche choisiras-tu cette fois ?", ...elan]);
    rejouer($("creature"), "mue");
    son([262, 330, 392, 523, 659, 784], 0.1, "triangle");
  }, 2400);
}

confirmerDeuxFois($("btn-extinction"), "Sûr ? Clique encore pour provoquer l'extinction", provoquerExtinction);
confirmerDeuxFois($("btn-reset"), "Vraiment tout effacer, y compris succès et fossiles ? Clique encore", () => {
  annulerDefi();
  nouvellePartie({}, "🦠 Tout a été effacé. Une toute nouvelle aventure commence.");
});

try {
  $("choix-son").checked = localStorage.getItem("evolution-son") !== "non";
} catch (e) { /* ignoré */ }
$("choix-son").addEventListener("change", () => {
  try { localStorage.setItem("evolution-son", $("choix-son").checked ? "oui" : "non"); } catch (e) { /* ignoré */ }
});

if (etat.adnTotal === 0) noter(`🦠 ${STADE[RACINE].texte}`);
if (messageMigration) noter(messageMigration);
gainsHorsLigne();
toutAfficher();
afficherAmbiance();
sauver();
programmerBonus();
programmerEvenement(40000 + Math.random() * 50000);

// Production automatique, 10 fois par seconde ; succès vérifiés 2 fois par seconde.
let dernier = performance.now();
setInterval(verifierSucces, 500);
setInterval(() => {
  const maintenant = performance.now();
  if (!figee) gagner(parSeconde() * (maintenant - dernier) / 1000);
  dernier = maintenant;
  // Fin des effets expirés.
  const actifs = effetsActifs();
  if (actifs.length !== etat.effets.length) {
    etat.effets.filter((e) => !actifs.includes(e)).forEach((e) => noter(`${e.emoji} Fin de l'événement : ${e.nom}.`));
    etat.effets = actifs;
    afficherAmbiance();
  }
  rafraichir();
}, 100);
setInterval(sauver, 5000);
window.addEventListener("beforeunload", sauver);
