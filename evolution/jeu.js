// Logique du jeu « Évolution » : on récolte de l'ADN, on achète des mutations
// et on fait évoluer sa créature de la cellule à l'être cosmique.

const CLE_SAUVEGARDE = "evolution-sauvegarde";
const HAUSSE_PRIX = 1.15;          // +15 % par exemplaire acheté
const BONUS_PAR_ETAPE = 0.5;       // chaque stade ajoute +50 % à tous les gains
const HORS_LIGNE_MAX_S = 2 * 3600; // gains hors ligne plafonnés à 2 h
const HORS_LIGNE_TAUX = 0.5;       // … et réduits de moitié

const $ = (id) => document.getElementById(id);

function etatInitial() {
  return { adn: 0, adnTotal: 0, clics: 0, etape: 0, mutations: {}, vu: Date.now() };
}

let etat = charger();

// ---------- Sauvegarde ----------

function charger() {
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE);
    if (brut) return Object.assign(etatInitial(), JSON.parse(brut));
  } catch (e) { /* stockage indisponible : on repart de zéro */ }
  return etatInitial();
}

function sauver() {
  etat.vu = Date.now();
  try { localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat)); } catch (e) { /* ignoré */ }
}

// ---------- Calculs ----------

const multiplicateur = () => 1 + BONUS_PAR_ETAPE * etat.etape;
const nombre = (id) => etat.mutations[id] || 0;
const prix = (m) => Math.ceil(m.prix * Math.pow(HAUSSE_PRIX, nombre(m.id)));

function somme(type) {
  return MUTATIONS.filter((m) => m.type === type)
    .reduce((total, m) => total + m.valeur * nombre(m.id), 0);
}
const parClic = () => (1 + somme("clic")) * multiplicateur();
const parSeconde = () => somme("auto") * multiplicateur();

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
  const e = ETAPES[etat.etape];
  const habitat = $("habitat");
  habitat.style.setProperty("--ciel", e.ciel);
  habitat.style.setProperty("--sol", e.sol);
  $("creature").textContent = e.emoji;
  $("nom-etape").textContent = `${e.nom} · stade ${etat.etape + 1}/${ETAPES.length}`;
  $("milieu").textContent = e.milieu;

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
}

function construireMutations() {
  const zone = $("mutations");
  zone.innerHTML = "";
  MUTATIONS.filter((m) => m.etape <= etat.etape).forEach((m) => {
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
  const prochaine = MUTATIONS.find((m) => m.etape > etat.etape);
  if (prochaine) {
    const p = document.createElement("p");
    p.className = "verrou";
    p.textContent = `🔒 D'autres mutations se débloqueront au stade « ${ETAPES[prochaine.etape].nom} ».`;
    zone.append(p);
  }
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

  const suivante = ETAPES[etat.etape + 1];
  const btn = $("btn-evoluer");
  if (suivante) {
    const avance = Math.min(1, etat.adn / suivante.cout);
    $("barre-evolution").style.width = `${avance * 100}%`;
    $("texte-evolution").textContent =
      `Prochain stade : ${suivante.emoji} ${suivante.nom} — ${format(etat.adn)} / ${format(suivante.cout)} ADN`;
    btn.textContent = `Évoluer en ${suivante.nom} ${suivante.emoji}`;
    btn.disabled = etat.adn < suivante.cout;
  } else {
    $("barre-evolution").style.width = "100%";
    $("texte-evolution").textContent = "Tu as atteint le sommet de l'évolution… pour l'instant !";
    btn.textContent = "Évolution complète 🌌";
    btn.disabled = true;
  }

  $("stats").textContent = `${format(etat.adnTotal)} ADN récoltés · ${etat.clics} clics`;
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
  son([300 + etat.etape * 40 + Math.random() * 60], 0.05, "triangle");
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

function evoluer() {
  const suivante = ETAPES[etat.etape + 1];
  if (!suivante || etat.adn < suivante.cout) return;
  etat.adn -= suivante.cout;
  etat.etape++;

  const flash = document.createElement("div");
  flash.className = "flash";
  $("habitat").append(flash);
  setTimeout(() => flash.remove(), 800);
  rejouer($("creature"), "mue");
  son([392, 523, 659, 784, 1047], 0.1, "square");

  noter(`${suivante.emoji} Tu as évolué en ${suivante.nom} ! ${suivante.texte}`);
  afficherHabitat();
  construireMutations();
  rafraichir();
  sauver();
}

// Bonus aléatoire : un objet brillant apparaît quelques secondes dans l'habitat.
function programmerBonus() {
  setTimeout(() => {
    const e = ETAPES[etat.etape];
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
      noter(`✨ Mutation spontanée dans ${e.milieu.toLowerCase()} : +${format(gain)} ADN`);
      b.remove();
      rafraichir();
    });
    $("bonus-zone").append(b);
    setTimeout(() => b.remove(), 8000);
    programmerBonus();
  }, 25000 + Math.random() * 35000);
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
$("btn-evoluer").addEventListener("click", evoluer);
$("btn-reset").addEventListener("click", () => {
  if (!confirm("Effacer ta progression et repartir de la cellule ?")) return;
  etat = etatInitial();
  $("journal").innerHTML = "";
  noter("🦠 Une nouvelle aventure commence dans l'océan primitif.");
  afficherHabitat();
  construireMutations();
  rafraichir();
  sauver();
});

try {
  const sonCoupe = localStorage.getItem("evolution-son") === "non";
  $("choix-son").checked = !sonCoupe;
} catch (e) { /* ignoré */ }
$("choix-son").addEventListener("change", () => {
  try { localStorage.setItem("evolution-son", $("choix-son").checked ? "oui" : "non"); } catch (e) { /* ignoré */ }
});

gainsHorsLigne();
if (etat.adnTotal === 0) noter(`🦠 ${ETAPES[0].texte}`);
afficherHabitat();
construireMutations();
rafraichir();
programmerBonus();

// Production automatique, 10 fois par seconde.
let dernier = performance.now();
setInterval(() => {
  const maintenant = performance.now();
  gagner(parSeconde() * (maintenant - dernier) / 1000);
  dernier = maintenant;
  rafraichir();
}, 100);
setInterval(sauver, 5000);
window.addEventListener("beforeunload", sauver);
