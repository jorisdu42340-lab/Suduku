// Logique du jeu « Évolution » : on récolte de l'ADN, on achète des mutations
// et on fait évoluer sa créature en choisissant sa branche dans l'arbre du vivant.

const CLE_SAUVEGARDE = "evolution-sauvegarde";
const HAUSSE_PRIX = 1.15;          // +15 % par exemplaire acheté
const BONUS_PAR_ETAPE = 0.5;       // chaque stade franchi ajoute +50 % à tous les gains
const HORS_LIGNE_MAX_S = 2 * 3600; // gains hors ligne plafonnés à 2 h
const HORS_LIGNE_TAUX = 0.5;       // … et réduits de moitié

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

function etatInitial(decouvertes = [RACINE]) {
  return { version: 2, adn: 0, adnTotal: 0, clics: 0, chemin: [RACINE], mutations: {}, decouvertes, effets: [], vu: Date.now() };
}

let messageMigration = "";

// Les sauvegardes de la première version suivaient une seule lignée.
function migrer(ancien) {
  const lignee = ["cellule", "ver", "poisson", "amphibien", "reptile"]; // jusqu'à l'embranchement
  const garde = Math.min(ancien.etape || 0, lignee.length - 1);
  const etat = Object.assign(etatInitial(), ancien, { version: 2, chemin: lignee.slice(0, garde + 1) });
  etat.decouvertes = [...etat.chemin];
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

const multiplicateur = () => 1 + BONUS_PAR_ETAPE * profondeur();
const parClic = () => (1 + somme("clic")) * multiplicateur() * atouts("clic") * modificateur("clic");
const parSeconde = () => somme("auto") * multiplicateur() * atouts("auto") * modificateur("auto");

function gagner(quantite) {
  etat.adn += quantite;
  etat.adnTotal += quantite;
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
  $("milieu").textContent = e.milieu;
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
  if (stadeActuel().suivantes.length) {
    const p = document.createElement("p");
    p.className = "verrou";
    p.textContent = "🔒 Chaque nouveau stade apporte ses propres mutations.";
    zone.append(p);
  }
}

// Cartes des stades suivants : une seule, ou plusieurs quand la branche se divise.
function construireChoix() {
  const zone = $("choix-evolution");
  zone.innerHTML = "";
  const suivantes = stadeActuel().suivantes.map((id) => STADE[id]);
  $("titre-evolution").textContent = suivantes.length > 1
    ? "🌳 Embranchement : choisis ta voie"
    : "Prochaine évolution";
  suivantes.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choix";
    b.dataset.id = s.id;
    const atout = s.atout ? `<span class="atout">${s.atout.texte}</span>` : "";
    b.innerHTML = `<span class="ico" aria-hidden="true">${s.emoji}</span>
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
      puce.className = "puce" + (etat.chemin.includes(e.id) ? " chemin" : connu ? "" : " inconnue");
      puce.textContent = connu ? `${e.emoji} ${e.nom}` : "❓";
      puce.title = connu ? `${e.nom} — ${e.milieu}` : "Espèce encore inconnue";
      puces.append(puce);
    });
    zone.append(rang);
  });
  $("decouvertes").textContent =
    `${etat.decouvertes.length} / ${ETAPES.length} espèces découvertes`;
}

function rafraichir() {
  $("adn").textContent = format(etat.adn);
  $("par-seconde").textContent = format(parSeconde());
  $("par-clic").textContent = format(parClic());

  document.querySelectorAll(".mutation").forEach((b) => {
    const m = MUTATIONS.find((x) => x.id === b.dataset.id);
    const p = prix(m);
    b.querySelector(".prix").textContent = `Coût : ${format(p)} ADN`;
    b.querySelector(".nb").textContent = nombre(m.id) || "";
    b.disabled = etat.adn < p;
  });

  const suivantes = stadeActuel().suivantes;
  if (suivantes.length) {
    const cout = coutStade(suivantes[0]);
    $("barre-evolution").style.width = `${Math.min(1, etat.adn / cout) * 100}%`;
    $("texte-evolution").textContent = `${format(etat.adn)} / ${format(cout)} ADN pour évoluer`;
    document.querySelectorAll(".choix").forEach((b) => { b.disabled = etat.adn < coutStade(b.dataset.id); });
  } else {
    $("titre-evolution").textContent = "Évolution complète 🌌";
    $("barre-evolution").style.width = "100%";
    const reste = ETAPES.length - etat.decouvertes.length;
    $("texte-evolution").textContent = reste
      ? `Tu as atteint le sommet ! Il reste ${reste} espèce${reste > 1 ? "s" : ""} à découvrir : recommence et choisis d'autres branches.`
      : "Tu as atteint le sommet et découvert toutes les espèces. Bravo !";
  }

  $("stats").textContent = `${format(etat.adnTotal)} ADN récoltés · ${etat.clics} clics`;
  afficherEffets();
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

function cliquer(evenement) {
  const gain = parClic();
  gagner(gain);
  etat.clics++;
  const zone = $("habitat").getBoundingClientRect();
  const x = evenement.clientX ? evenement.clientX - zone.left : zone.width / 2;
  const y = evenement.clientY ? evenement.clientY - zone.top : zone.height / 2;
  bulleGain(`+${format(gain)}`, x - 15, y - 20);
  rejouer($("creature"), "tape");
  son([300 + profondeur() * 40 + Math.random() * 60], 0.05, "triangle");
  rafraichir();
}

function acheter(m, bouton) {
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

function evoluer(id) {
  const suivante = STADE[id];
  if (!stadeActuel().suivantes.includes(id)) return;
  const cout = coutStade(id);
  if (etat.adn < cout) return;
  const embranchement = stadeActuel().suivantes.length > 1;
  etat.adn -= cout;
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
function effetPour(ev) {
  const variantes = ev.variantes || {};
  const id = [...etat.chemin].reverse().find((s) => variantes[s]);
  return id ? variantes[id] : ev.effet;
}

function appliquer(ev, effet) {
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
  rafraichir();
  sauver();
}

function declencherEvenement(id) {
  const ev = EVENEMENT[id];
  if (!ev || defiEnCours) return;
  dernierEvenement = id;
  noter(`${ev.emoji} ${ev.nom} ! ${ev.annonce}`);
  if (ev.defi) lancerDefi(ev);
  else appliquer(ev, effetPour(ev));
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
      appliquer(ev, ev.reussite);
    } else {
      const flash = document.createElement("div");
      flash.className = "flash impact";
      $("habitat").append(flash);
      setTimeout(() => flash.remove(), 800);
      rejouer($("habitat"), "secousse");
      appliquer(ev, effetPour(ev));
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

// ---------- Démarrage ----------

function gainsHorsLigne() {
  const secondes = Math.min(HORS_LIGNE_MAX_S, (Date.now() - etat.vu) / 1000);
  const gain = parSeconde() * secondes * HORS_LIGNE_TAUX;
  if (secondes > 10 && gain > 0) {
    gagner(gain);
    noter(`💤 Pendant ton absence, ta créature a récolté ${format(gain)} ADN.`);
  }
}

$("creature").addEventListener("click", cliquer);
// Recommencer demande un second clic de confirmation (pas de fenêtre confirm()).
let attenteReset = null;
$("btn-reset").addEventListener("click", () => {
  const btn = $("btn-reset");
  if (!attenteReset) {
    btn.textContent = "Sûr ? Clique encore pour repartir de la cellule (l'arbre est conservé)";
    btn.classList.add("alerte");
    attenteReset = setTimeout(() => {
      attenteReset = null;
      btn.textContent = "Recommencer depuis le début";
      btn.classList.remove("alerte");
    }, 4000);
    return;
  }
  clearTimeout(attenteReset);
  attenteReset = null;
  btn.textContent = "Recommencer depuis le début";
  btn.classList.remove("alerte");
  if (defiEnCours) {
    clearTimeout(defiEnCours.minuterie);
    defiEnCours = null;
    $("bonus-zone").querySelectorAll(".defi").forEach((d) => d.remove());
    $("annonce").hidden = true;
  }
  etat = etatInitial(etat.decouvertes);
  afficherAmbiance();
  $("journal").innerHTML = "";
  noter("🦠 Une nouvelle aventure commence. Cette fois, quelle branche choisiras-tu ?");
  toutAfficher();
  sauver();
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

// Production automatique, 10 fois par seconde.
let dernier = performance.now();
setInterval(() => {
  const maintenant = performance.now();
  gagner(parSeconde() * (maintenant - dernier) / 1000);
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
