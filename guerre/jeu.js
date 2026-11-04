"use strict";

// ---------------------------------------------------------------------------
// Constantes du champ de bataille (coordonnées logiques, mises à l'échelle)
// ---------------------------------------------------------------------------
const LARGEUR = 1000;
const HAUTEUR = 340;
const SOL = 285;
const FRONT = { joueur: 80, ennemi: 920 }; // bord avant de chaque base
const APPARITION = { joueur: 70, ennemi: 930 };
const PV_BASE = 1000;
const PV_BASE_PAR_ERE = 500;
const REVENU = 4; // or par seconde à la Préhistoire
const RECHARGE_POUVOIR = 40;
const ASSAUT_FINAL = 600; // après 10 min : tourelles désactivées et bases deux fois plus fragiles
// Position des emplacements de tourelle, par rapport au centre de la base (côté joueur)
const EMPLACEMENTS = [{ dx: 34, dy: 62 }, { dx: -22, dy: 100 }, { dx: 34, dy: 100 }];
const CLE_RECORDS = "guerre-records";
const CLE_SON = "guerre-son";

const $ = (id) => document.getElementById(id);
const canvas = $("terrain");
const ctx = canvas.getContext("2d");
const reduireAnimations = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let etat = null;
let difficulte = "normal";
let dernierInstant = 0;
// Sur un petit écran, le terrain est plus haut que large proportionnellement
// et les emojis sont agrandis pour rester lisibles.
let hauteurVue = HAUTEUR;
let zoom = 1;

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------
const facteurStats = (ere) => Math.pow(FACTEUR_STATS, ere);
const coutUnite = (ere, i) => Math.round(ROLES[i].cout * Math.pow(FACTEUR_COUT, ere));
const coutTourelle = (ere, i) => Math.round(TOURELLES[i].cout * Math.pow(FACTEUR_COUT, ere));
const hasard = (min, max) => min + Math.random() * (max - min);
const formatTemps = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const formatNombre = (n) => Math.floor(n).toLocaleString("fr-FR");

function lireRecords() {
  try { return JSON.parse(localStorage.getItem(CLE_RECORDS)) || {}; } catch (e) { return {}; }
}
function ecrireRecords(r) {
  try { localStorage.setItem(CLE_RECORDS, JSON.stringify(r)); } catch (e) { /* ignoré */ }
}

// ---------------------------------------------------------------------------
// Bruitages synthétisés
// ---------------------------------------------------------------------------
let audio = null;
let dernierCoup = 0;

function son(frequences, duree = 0.1, forme = "square", volume = 0.05) {
  if (!$("choix-son").checked) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audio.currentTime;
    frequences.forEach((f, k) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = forme;
      osc.frequency.setValueAtTime(f, t0 + k * duree);
      gain.gain.setValueAtTime(volume, t0 + k * duree);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (k + 1) * duree);
      osc.connect(gain).connect(audio.destination);
      osc.start(t0 + k * duree);
      osc.stop(t0 + (k + 1) * duree);
    });
  } catch (e) { /* pas de son */ }
}

function bruit(duree = 0.3, volume = 0.12) {
  if (!$("choix-son").checked) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const n = Math.floor(audio.sampleRate * duree);
    const tampon = audio.createBuffer(1, n, audio.sampleRate);
    const d = tampon.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = audio.createBufferSource();
    const gain = audio.createGain();
    gain.gain.value = volume;
    src.buffer = tampon;
    src.connect(gain).connect(audio.destination);
    src.start();
  } catch (e) { /* pas de son */ }
}

function sonCoup() {
  const t = performance.now();
  if (t - dernierCoup < 70) return;
  dernierCoup = t;
  son([hasard(140, 220)], 0.05, "triangle", 0.04);
}

// ---------------------------------------------------------------------------
// Partie
// ---------------------------------------------------------------------------
function nouveauCamp(cote) {
  return {
    cote,
    dir: cote === "joueur" ? 1 : -1,
    or: 40,
    xp: 0,
    ere: 0,
    pv: PV_BASE,
    pvMax: PV_BASE,
    recharges: ROLES.map(() => 0),
    pouvoir: 20,
    tir: 0,
    secousse: 0,
    emplacements: 1,
    tourelles: COUT_EMPLACEMENTS.map(() => null),
  };
}

function nouvellePartie() {
  etat = {
    camps: { joueur: nouveauCamp("joueur"), ennemi: nouveauCamp("ennemi") },
    unites: [],
    projectiles: [],
    chutes: [],
    effets: [],
    temps: 0,
    pause: false,
    fini: false,
    prochainId: 1,
    iaDelai: 3,
    iaVoulu: null,
    iaAttente: 0,
    stats: { invoques: 0, vaincus: 0 },
  };
  construireBoutonsUnites();
  construireBoutonsTourelles();
  $("ecran").hidden = true;
  $("btn-pause").textContent = "⏸";
  son([392, 523, 659], 0.08, "square", 0.05);
}

function revenu(camp) {
  const base = REVENU * Math.pow(FACTEUR_COUT, camp.ere);
  return camp.cote === "ennemi" ? base * DIFFICULTES[difficulte].revenu : base;
}

function invoquer(camp, i) {
  if (!etat || etat.fini || etat.pause) return false;
  const cout = coutUnite(camp.ere, i);
  if (camp.or < cout || camp.recharges[i] > 0) return false;
  const r = ROLES[i];
  const def = ERES[camp.ere].unites[i];
  const f = facteurStats(camp.ere);
  camp.or -= cout;
  camp.recharges[i] = r.recharge;
  camp.xp += cout * 0.3;
  etat.unites.push({
    id: etat.prochainId++,
    camp: camp.cote,
    dir: camp.dir,
    nom: def.nom,
    emoji: def.emoji,
    projectile: def.projectile || null,
    distance: r.portee > 60,
    x: APPARITION[camp.cote],
    pv: r.pv * f,
    pvMax: r.pv * f,
    attaque: r.attaque * f,
    portee: r.portee,
    vitesse: r.vitesse,
    cadence: r.cadence,
    zone: r.zone || 0,
    taille: r.taille,
    valeur: cout,
    attente: 0.3,
    flash: 0,
    elan: 0,
    pas: Math.random() * 6,
    apparition: 0.3,
  });
  if (camp.cote === "joueur") {
    etat.stats.invoques++;
    son([330 + i * 60, 440 + i * 60], 0.05, "square", 0.04);
    const btn = document.querySelector(`.unite[data-i="${i}"]`);
    if (btn) { btn.classList.remove("invoque"); void btn.offsetWidth; btn.classList.add("invoque"); }
  }
  return true;
}

function peutEvoluer(camp) {
  const e = ERES[camp.ere];
  return e.xpSuivante !== null && camp.xp >= e.xpSuivante;
}

function evoluer(camp) {
  if (!etat || etat.fini || etat.pause || !peutEvoluer(camp)) return false;
  camp.xp -= ERES[camp.ere].xpSuivante;
  camp.ere++;
  camp.pvMax += PV_BASE_PAR_ERE;
  camp.pv += PV_BASE_PAR_ERE;
  const x = camp.cote === "joueur" ? 50 : 950;
  texteFlottant(x, SOL - 140, `${ERES[camp.ere].emoji} ${ERES[camp.ere].nom} !`, "#a855f7", 2);
  for (let k = 0; k < 16; k++) particule(x, SOL - 60, ["✨", "⭐"][k % 2]);
  if (camp.cote === "joueur") {
    construireBoutonsUnites();
  construireBoutonsTourelles();
    son([523, 659, 784, 1047], 0.12, "square", 0.06);
  } else {
    son([220, 196, 175], 0.12, "sawtooth", 0.04);
  }
  return true;
}

function lancerPouvoir(camp) {
  if (!etat || etat.fini || etat.pause || camp.pouvoir > 0) return false;
  camp.pouvoir = RECHARGE_POUVOIR;
  const adverses = etat.unites.filter((u) => u.camp !== camp.cote);
  const emoji = ERES[camp.ere].pouvoir.emoji;
  const degats = 45 * facteurStats(camp.ere);
  for (let k = 0; k < 12; k++) {
    let x;
    if (adverses.length) x = adverses[k % adverses.length].x + hasard(-25, 25);
    else x = camp.cote === "joueur" ? hasard(450, 900) : hasard(100, 550);
    etat.chutes.push({ x, y: -30 - k * 45, vy: 420, camp: camp.cote, degats, emoji });
  }
  son([880, 660, 440, 220], 0.07, "sawtooth", 0.05);
  return true;
}

// ---------------------------------------------------------------------------
// Tourelles
// ---------------------------------------------------------------------------
function acheterTourelle(camp, i) {
  if (!etat || etat.fini || etat.pause) return false;
  const k = camp.tourelles.findIndex((t, n) => t === null && n < camp.emplacements);
  const cout = coutTourelle(camp.ere, i);
  if (k < 0 || camp.or < cout) return false;
  const r = TOURELLES[i];
  const def = ERES[camp.ere].tourelles[i];
  camp.or -= cout;
  camp.tourelles[k] = {
    type: i, ere: camp.ere, nom: def.nom, emoji: def.emoji, projectile: def.projectile,
    attaque: r.attaque * facteurStats(camp.ere), portee: r.portee, cadence: r.cadence,
    zone: r.zone || 0, valeur: cout, attente: 0.5, recul: 0,
  };
  const p = positionEmplacement(camp, k);
  for (let n = 0; n < 6; n++) particule(p.x, p.y, "✨");
  if (camp.cote === "joueur") son([262, 392, 523], 0.07, "square", 0.05);
  return true;
}

function vendreTourelle(camp, k) {
  if (!etat || etat.fini || etat.pause || !camp.tourelles[k]) return false;
  const gain = Math.round(camp.tourelles[k].valeur / 2);
  camp.or += gain;
  const p = positionEmplacement(camp, k);
  texteFlottant(p.x, p.y - 20, `+${gain} 💰`, "#facc15", 1);
  camp.tourelles[k] = null;
  if (camp.cote === "joueur") son([523, 392], 0.07, "triangle", 0.05);
  return true;
}

function debloquerEmplacement(camp) {
  if (!etat || etat.fini || etat.pause || camp.emplacements >= COUT_EMPLACEMENTS.length) return false;
  const cout = COUT_EMPLACEMENTS[camp.emplacements];
  if (camp.or < cout) return false;
  camp.or -= cout;
  camp.emplacements++;
  if (camp.cote === "joueur") son([392, 523], 0.07, "square", 0.05);
  return true;
}

function positionEmplacement(camp, k) {
  const z = Math.min(zoom, 1.3);
  const centre = camp.cote === "joueur" ? 42 : 958;
  return { x: centre + EMPLACEMENTS[k].dx * camp.dir, y: SOL - EMPLACEMENTS[k].dy * z };
}

function majTourelles(camp, dt) {
  camp.tourelles.forEach((t, k) => {
    if (!t) return;
    t.attente = Math.max(0, t.attente - dt);
    t.recul = Math.max(0, t.recul - dt);
    if (t.attente > 0 || etat.temps >= ASSAUT_FINAL) return;
    let cible = null;
    let dmin = t.portee;
    for (const u of etat.unites) {
      if (u.camp === camp.cote || u.pv <= 0) continue;
      const d = (u.x - FRONT[camp.cote]) * camp.dir;
      if (d < dmin) { dmin = d; cible = u; }
    }
    if (!cible) return;
    t.attente = t.cadence;
    t.recul = 0.15;
    const p = positionEmplacement(camp, k);
    tirer(null, camp.cote, p.x, p.y - 14, cible, t.attaque, t.projectile, t.zone);
  });
}

// ---------------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------------
function adversaire(cote) { return cote === "joueur" ? "ennemi" : "joueur"; }

function blesser(u, degats, cote) {
  if (u.pv <= 0) return;
  u.pv -= degats;
  u.flash = 0.12;
  sonCoup();
  if (u.pv <= 0) {
    const vainqueur = etat.camps[cote];
    const gain = Math.round(u.valeur * 0.5);
    vainqueur.or += gain;
    vainqueur.xp += u.valeur;
    particule(u.x, SOL - u.taille * 0.6, "💀");
    if (cote === "joueur") {
      etat.stats.vaincus++;
      texteFlottant(u.x, SOL - u.taille - 20, `+${gain} 💰`, "#facc15", 1);
    }
  }
}

function blesserBase(cote, degats) {
  const camp = etat.camps[cote];
  if (camp.pv <= 0) return;
  if (etat.temps >= ASSAUT_FINAL) degats *= 2;
  camp.pv = Math.max(0, camp.pv - degats);
  camp.secousse = 0.2;
  const x = cote === "joueur" ? 40 + hasard(-20, 20) : 960 + hasard(-20, 20);
  texteFlottant(x, SOL - 120, `-${Math.round(degats)}`, "#ef4444", 0.8);
  if (camp.pv <= 0) finDePartie(cote === "ennemi");
}

function impact(p) {
  const adverse = adversaire(p.camp);
  if (p.zone) {
    particule(p.x, p.y, "💥");
    for (const u of etat.unites) {
      if (u.camp === adverse && u.pv > 0 && Math.abs(u.x - p.x) <= p.zone + u.taille * 0.4) blesser(u, p.degats, p.camp);
    }
    if (Math.abs(FRONT[adverse] - p.x) <= p.zone) blesserBase(adverse, p.degats);
  } else if (p.cible === "base") {
    blesserBase(adverse, p.degats);
  } else if (p.cible && p.cible.pv > 0) {
    blesser(p.cible, p.degats, p.camp);
  }
}

function tirer(source, cote, xDepart, yDepart, cible, degats, type, zone) {
  const cx = cible === "base" ? FRONT[adversaire(cote)] : cible.x;
  const cy = cible === "base" ? SOL - 50 : SOL - cible.taille * 0.5;
  etat.projectiles.push({
    camp: cote, x: xDepart, y: yDepart, x0: xDepart, y0: yDepart,
    cx, cy, cible, degats, type, zone, t: 0,
    duree: Math.max(0.15, Math.abs(cx - xDepart) / 450),
  });
}

function attaquer(u, cible) {
  u.attente = u.cadence;
  u.elan = 0.2;
  if (u.projectile) {
    tirer(u, u.camp, u.x + u.dir * u.taille * 0.3, SOL - u.taille * 0.6, cible, u.attaque, u.projectile, u.zone);
  } else if (cible === "base") {
    blesserBase(adversaire(u.camp), u.attaque);
  } else {
    blesser(cible, u.attaque, u.camp);
  }
}

function majUnite(u, dt) {
  u.attente = Math.max(0, u.attente - dt);
  u.flash = Math.max(0, u.flash - dt);
  u.elan = Math.max(0, u.elan - dt);
  u.apparition = Math.max(0, u.apparition - dt);
  const demi = u.taille * 0.35;

  // Ennemi le plus proche devant
  let cible = null;
  let dmin = Infinity;
  for (const v of etat.unites) {
    if (v.camp === u.camp || v.pv <= 0) continue;
    const d = (v.x - u.x) * u.dir - demi - v.taille * 0.35;
    if (d > -v.taille && d < dmin) { dmin = d; cible = v; }
  }
  const dBase = (FRONT[adversaire(u.camp)] - u.x) * u.dir - demi;

  if (cible && dmin <= u.portee) {
    if (u.attente <= 0) attaquer(u, cible);
    return;
  }
  if (dBase <= u.portee) {
    if (u.attente <= 0) attaquer(u, "base");
    return;
  }

  // Bloqué par un allié devant ? (les combattants au corps à corps dépassent les tireurs)
  for (const v of etat.unites) {
    if (v === u || v.camp !== u.camp || v.pv <= 0) continue;
    const ecart = (v.x - u.x) * u.dir;
    const devant = ecart > 0 || (ecart === 0 && v.id < u.id);
    if (!devant) continue;
    if (v.distance && !u.distance) continue;
    if (ecart < (u.taille + v.taille) * 0.4) return;
  }
  u.x += u.dir * u.vitesse * dt;
  u.pas += dt * u.vitesse / 5;
}

function majBase(camp, dt) {
  camp.tir = Math.max(0, camp.tir - dt);
  camp.secousse = Math.max(0, camp.secousse - dt);
  if (camp.tir > 0 || etat.temps >= ASSAUT_FINAL) return;
  let cible = null;
  let dmin = 170;
  for (const u of etat.unites) {
    if (u.camp === camp.cote || u.pv <= 0) continue;
    const d = (u.x - FRONT[camp.cote]) * camp.dir;
    if (d < dmin) { dmin = d; cible = u; }
  }
  if (!cible) return;
  camp.tir = 1.4;
  const x = camp.cote === "joueur" ? 50 : 950;
  tirer(null, camp.cote, x, SOL - 100, cible, 7 * facteurStats(camp.ere), ERES[camp.ere].tir, 0);
}

// ---------------------------------------------------------------------------
// Adversaire contrôlé par l'ordinateur
// ---------------------------------------------------------------------------
function iaTourelles(ia) {
  const envie = { facile: 0.06, normal: 0.12, difficile: 0.2 }[difficulte];
  const reserve = 40 * Math.pow(FACTEUR_COUT, ia.ere);
  const libre = ia.tourelles.some((t, n) => t === null && n < ia.emplacements);
  // Remplace une vieille tourelle d'un âge dépassé quand il a de l'or en trop
  const vieille = ia.tourelles.findIndex((t) => t && t.ere < ia.ere);
  if (!libre && vieille >= 0 && ia.or > coutTourelle(ia.ere, 2) + reserve && Math.random() < envie) {
    vendreTourelle(ia, vieille);
    acheterTourelle(ia, 2);
    return;
  }
  if (!libre) {
    const cout = COUT_EMPLACEMENTS[ia.emplacements];
    if (cout !== undefined && ia.or > cout + reserve * 2 && Math.random() < envie) debloquerEmplacement(ia);
    return;
  }
  const menace = etat.unites.some((u) => u.camp === "joueur" && u.x > 700);
  if (Math.random() > (menace ? envie * 3 : envie)) return;
  for (let i = TOURELLES.length - 1; i >= 0; i--) {
    if (ia.or >= coutTourelle(ia.ere, i) + reserve && Math.random() < 0.6 && acheterTourelle(ia, i)) return;
  }
}

function majIA(dt) {
  const ia = etat.camps.ennemi;
  etat.iaDelai -= dt;
  if (etat.iaDelai > 0) return;
  etat.iaDelai = DIFFICULTES[difficulte].reflexion * hasard(0.6, 1.4);

  evoluer(ia);
  iaTourelles(ia);

  const menaces = etat.unites.filter((u) => u.camp === "joueur" && u.x > 600);
  if (ia.pouvoir <= 0 && (menaces.length >= 4 || (ia.pv < ia.pvMax * 0.4 && menaces.length >= 2))) {
    lancerPouvoir(ia);
  }

  // Défense : invoque la meilleure unité abordable si le joueur approche
  if (menaces.some((u) => u.x > 750)) {
    for (let i = ROLES.length - 1; i >= 0; i--) {
      if (invoquer(ia, i)) { etat.iaVoulu = null; return; }
    }
  }

  if (etat.iaVoulu === null) {
    const poids = difficulte === "difficile" ? [3, 3, 2.5, 2, 1.5] : [4, 3, 2, 1.2, 0.7];
    let total = poids.reduce((a, b) => a + b, 0);
    let tirage = Math.random() * total;
    let choix = 0;
    while (tirage > poids[choix]) { tirage -= poids[choix]; choix++; }
    etat.iaVoulu = choix;
    etat.iaAttente = 0;
  }
  etat.iaAttente += DIFFICULTES[difficulte].reflexion;
  if (invoquer(ia, etat.iaVoulu) || etat.iaAttente > 15) etat.iaVoulu = null;
}

// ---------------------------------------------------------------------------
// Effets visuels
// ---------------------------------------------------------------------------
function texteFlottant(x, y, texte, couleur, vie = 1) {
  etat.effets.push({ type: "texte", x, y, texte, couleur, vie, vieMax: vie, vy: -40 });
}
function particule(x, y, emoji) {
  if (reduireAnimations && emoji !== "💀") return;
  etat.effets.push({ type: "emoji", x, y, texte: emoji, vie: 0.9, vieMax: 0.9, vx: hasard(-60, 60), vy: hasard(-120, -40) });
}

// ---------------------------------------------------------------------------
// Boucle de jeu
// ---------------------------------------------------------------------------
function maj(dt) {
  const avant = etat.temps;
  etat.temps += dt;
  if (avant < ASSAUT_FINAL && etat.temps >= ASSAUT_FINAL) {
    texteFlottant(LARGEUR / 2, SOL - 150, "⚡ Assaut final : les bases sont deux fois plus fragiles !", "#fde047", 4);
    son([196, 262, 330, 392], 0.15, "sawtooth", 0.05);
  }
  for (const camp of Object.values(etat.camps)) {
    camp.or += revenu(camp) * dt;
    camp.recharges = camp.recharges.map((r) => Math.max(0, r - dt));
    camp.pouvoir = Math.max(0, camp.pouvoir - dt);
    majBase(camp, dt);
    majTourelles(camp, dt);
  }
  majIA(dt);

  for (const u of etat.unites) if (u.pv > 0) majUnite(u, dt);

  for (const p of etat.projectiles) {
    if (p.cible !== "base" && p.cible.pv > 0) {
      p.cx = p.cible.x;
      p.cy = SOL - p.cible.taille * 0.5;
    }
    p.t += dt / p.duree;
    const t = Math.min(1, p.t);
    p.x = p.x0 + (p.cx - p.x0) * t;
    p.y = p.y0 + (p.cy - p.y0) * t - Math.sin(t * Math.PI) * (p.type === "laser" || p.type === "balle" ? 0 : 30);
    if (p.t >= 1) { p.fini = true; impact(p); }
  }

  for (const c of etat.chutes) {
    c.y += c.vy * dt;
    if (c.y >= SOL - 10) {
      c.fini = true;
      particule(c.x, SOL - 10, "💥");
      bruit(0.15, 0.06);
      const adverse = adversaire(c.camp);
      for (const u of etat.unites) {
        if (u.camp === adverse && u.pv > 0 && Math.abs(u.x - c.x) < 50) blesser(u, c.degats, c.camp);
      }
    }
  }

  for (const e of etat.effets) {
    e.vie -= dt;
    e.y += e.vy * dt;
    if (e.type === "emoji") { e.x += e.vx * dt; e.vy += 200 * dt; }
  }

  etat.unites = etat.unites.filter((u) => u.pv > 0);
  etat.projectiles = etat.projectiles.filter((p) => !p.fini);
  etat.chutes = etat.chutes.filter((c) => !c.fini);
  etat.effets = etat.effets.filter((e) => e.vie > 0);
}

function boucle(instant) {
  const dt = Math.min(0.05, (instant - dernierInstant) / 1000 || 0);
  dernierInstant = instant;
  if (etat && !etat.pause && !etat.fini) maj(dt);
  dessiner(instant / 1000);
  majInterface();
  requestAnimationFrame(boucle);
}

function finDePartie(victoire) {
  if (etat.fini) return;
  etat.fini = true;
  const records = lireRecords();
  const r = records[difficulte] || { victoires: 0, defaites: 0, meilleur: null };
  let nouveauRecord = false;
  if (victoire) {
    r.victoires++;
    if (r.meilleur === null || etat.temps < r.meilleur) { r.meilleur = etat.temps; nouveauRecord = true; }
  } else {
    r.defaites++;
  }
  records[difficulte] = r;
  ecrireRecords(records);

  if (victoire) {
    son([523, 659, 784, 1047, 784, 1047], 0.13, "square", 0.06);
    for (let k = 0; k < 24; k++) particule(950 + hasard(-40, 40), SOL - hasard(20, 120), ["🎉", "✨", "💥"][k % 3]);
  } else {
    son([392, 330, 262, 196], 0.2, "sawtooth", 0.05);
    bruit(0.6, 0.1);
  }
  setTimeout(() => afficherEcran(victoire ? "victoire" : "defaite", nouveauRecord), 1200);
}

// ---------------------------------------------------------------------------
// Dessin
// ---------------------------------------------------------------------------
function redimensionner() {
  const ratio = window.devicePixelRatio || 1;
  const largeur = canvas.clientWidth || LARGEUR;
  hauteurVue = Math.max(HAUTEUR, Math.min(LARGEUR * 0.6, LARGEUR * 210 / largeur));
  zoom = Math.max(1, Math.min(1.7, 520 / largeur));
  canvas.width = Math.round(largeur * ratio);
  canvas.height = Math.round(largeur * ratio * hauteurVue / LARGEUR);
}

function emoji(texte, x, y, taille, retourner = false, agrandir = zoom) {
  taille *= agrandir;
  ctx.save();
  ctx.translate(x, y);
  if (retourner) ctx.scale(-1, 1);
  ctx.font = `${taille}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(texte, 0, 0);
  ctx.restore();
}

function barreVie(x, y, largeur, ratio, couleur) {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  const h = 4 * zoom;
  ctx.fillRect(x - largeur / 2 - 1, y - 1, largeur + 2, h + 2);
  ctx.fillStyle = ratio > 0.5 ? couleur : ratio > 0.25 ? "#f59e0b" : "#ef4444";
  ctx.fillRect(x - largeur / 2, y, largeur * Math.max(0, ratio), h);
}

const COULEUR = { joueur: "#3b82f6", ennemi: "#ef4444" };

function dessinerBase(camp) {
  const e = ERES[camp.ere];
  const x = camp.cote === "joueur" ? 42 : 958;
  const dx = camp.secousse > 0 ? hasard(-3, 3) : 0;
  const z = Math.min(zoom, 1.3);
  const haut = 110 * z;
  // drapeau
  ctx.strokeStyle = "#57534e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + dx, SOL - haut);
  ctx.lineTo(x + dx, SOL - haut - 40);
  ctx.stroke();
  ctx.fillStyle = COULEUR[camp.cote];
  ctx.beginPath();
  ctx.moveTo(x + dx, SOL - haut - 40);
  ctx.lineTo(x + dx + camp.dir * 24 * z, SOL - haut - 33);
  ctx.lineTo(x + dx, SOL - haut - 26);
  ctx.fill();
  emoji(e.base, x + dx, SOL + 6, 100, camp.cote === "ennemi", z);
  camp.tourelles.forEach((t, k) => {
    if (!t) return;
    const p = positionEmplacement(camp, k);
    ctx.fillStyle = "#57534e";
    ctx.fillRect(p.x + dx - 13 * z, p.y - 2, 26 * z, 6);
    ctx.fillStyle = "#a8a29e";
    ctx.fillRect(p.x + dx - 13 * z, p.y - 2, 26 * z, 2);
    const recul = t.recul > 0 ? -camp.dir * 3 : 0;
    emoji(t.emoji, p.x + dx + recul, p.y - 1, 26, camp.cote === "joueur", z);
  });
  barreVie(x, SOL - haut - 55 * z, 80, camp.pv / camp.pvMax, "#22c55e");
  ctx.font = `bold ${Math.round(12 * zoom)}px system-ui, sans-serif`;
  ctx.textAlign = camp.cote === "joueur" ? "left" : "right";
  ctx.textBaseline = "bottom";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  const tx = camp.cote === "joueur" ? 4 : LARGEUR - 4;
  ctx.strokeText(`${Math.ceil(camp.pv)} / ${camp.pvMax}`, tx, SOL - haut - 60 * z);
  ctx.fillStyle = "#fff";
  ctx.fillText(`${Math.ceil(camp.pv)} / ${camp.pvMax}`, tx, SOL - haut - 60 * z);
}

function dessinerUnite(u, t) {
  const bond = u.elan > 0 ? Math.sin((u.elan / 0.2) * Math.PI) * 8 * u.dir : 0;
  const pasY = Math.abs(Math.sin(u.pas)) * 3;
  const echelle = 1 - u.apparition / 0.3 * 0.6;
  // ombre colorée de l'équipe
  ctx.fillStyle = COULEUR[u.camp];
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(u.x, SOL - 2, u.taille * 0.45 * zoom, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = u.flash > 0 ? 0.5 + 0.5 * Math.sin(t * 80) : 1;
  // Les emojis regardent souvent vers la gauche : on retourne ceux du joueur
  emoji(u.emoji, u.x + bond, SOL - pasY, u.taille * echelle, u.camp === "joueur");
  ctx.globalAlpha = 1;
  if (u.pv < u.pvMax) barreVie(u.x, SOL - u.taille * zoom - 10, Math.max(24, u.taille * 0.8) * zoom, u.pv / u.pvMax, COULEUR[u.camp]);
}

function dessinerProjectile(p) {
  const angle = Math.atan2(p.cy - p.y0, p.cx - p.x0);
  if (p.type === "fleche") {
    const dirx = p.cx >= p.x0 ? 1 : -1;
    ctx.strokeStyle = "#44403c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - dirx * 14, p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.fillStyle = "#78716c";
    ctx.beginPath();
    ctx.moveTo(p.x + dirx * 5, p.y);
    ctx.lineTo(p.x - dirx * 1, p.y - 3);
    ctx.lineTo(p.x - dirx * 1, p.y + 3);
    ctx.fill();
  } else if (p.type === "balle") {
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(250, 204, 21, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - (p.cx >= p.x0 ? 1 : -1) * 10, p.y);
    ctx.stroke();
  } else if (p.type === "laser") {
    const dirx = p.cx >= p.x0 ? 1 : -1;
    ctx.strokeStyle = p.camp === "joueur" ? "#22d3ee" : "#f472b6";
    ctx.lineWidth = 3;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(p.x - dirx * 22, p.y - Math.sin(angle) * 22);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    emoji(p.type, p.x, p.y + 10, 18);
  }
}

function dessiner(t) {
  const echelle = canvas.width / LARGEUR;
  const decalage = hauteurVue - HAUTEUR;
  ctx.setTransform(echelle, 0, 0, echelle, 0, decalage * echelle);
  const camp = etat ? etat.camps.joueur : { ere: 0 };
  const e = ERES[camp.ere];

  // Ciel
  const ciel = ctx.createLinearGradient(0, -decalage, 0, SOL);
  ciel.addColorStop(0, e.ciel[1]);
  ciel.addColorStop(1, e.ciel[0]);
  ctx.fillStyle = ciel;
  ctx.fillRect(0, -decalage, LARGEUR, hauteurVue);

  // Décor
  ctx.globalAlpha = 0.5;
  e.decor.forEach((d, k) => emoji(d, 200 + k * 200, SOL - 4, 54 + (k % 2) * 20, false, Math.min(zoom, 1.4)));
  ctx.globalAlpha = 0.8;
  for (let k = 0; k < 3; k++) {
    const x = ((t * (8 + k * 3) + k * 380) % (LARGEUR + 200)) - 100;
    emoji("☁️", x, 50 - decalage * 0.6 + k * 28, 34);
  }
  ctx.globalAlpha = 1;

  // Sol
  ctx.fillStyle = e.herbe;
  ctx.fillRect(0, SOL - 2, LARGEUR, 8);
  ctx.fillStyle = e.sol;
  ctx.fillRect(0, SOL + 6, LARGEUR, HAUTEUR - SOL);

  if (!etat) return;

  dessinerBase(etat.camps.joueur);
  dessinerBase(etat.camps.ennemi);

  const tries = [...etat.unites].sort((a, b) => b.taille - a.taille);
  for (const u of tries) dessinerUnite(u, t);
  for (const p of etat.projectiles) dessinerProjectile(p);
  for (const c of etat.chutes) emoji(c.emoji, c.x, c.y + 14, 30);

  for (const fx of etat.effets) {
    ctx.globalAlpha = Math.max(0, fx.vie / fx.vieMax);
    if (fx.type === "texte") {
      ctx.font = `bold ${Math.round(15 * zoom)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.strokeText(fx.texte, fx.x, fx.y);
      ctx.fillStyle = fx.couleur;
      ctx.fillText(fx.texte, fx.x, fx.y);
    } else {
      emoji(fx.texte, fx.x, fx.y, 22);
    }
  }
  ctx.globalAlpha = 1;

  if (etat.pause && !etat.fini) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, -decalage, LARGEUR, hauteurVue);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.round(36 * zoom)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⏸ Pause", LARGEUR / 2, (HAUTEUR - decalage) / 2);
  }
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------
function construireBoutonsUnites() {
  const ere = etat ? etat.camps.joueur.ere : 0;
  const f = facteurStats(ere);
  const conteneur = $("unites");
  conteneur.innerHTML = "";
  ERES[ere].unites.forEach((def, i) => {
    const r = ROLES[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "unite";
    btn.dataset.i = i;
    btn.title = `${def.nom} (${r.role})\n❤️ ${Math.round(r.pv * f)} PV · ⚔️ ${Math.round(r.attaque * f)} dégâts` +
      ` · 🎯 portée ${r.portee}${r.zone ? " · 💥 dégâts de zone" : ""}`;
    btn.innerHTML = `
      <span class="u-touche">${i + 1}</span>
      <span class="u-emoji">${def.emoji}</span>
      <span class="u-nom">${def.nom}</span>
      <span class="u-etoiles" aria-label="Attaque ${r.etoiles} sur 5">${"★".repeat(r.etoiles)}${"☆".repeat(5 - r.etoiles)}</span>
      <span class="u-cout">💰 ${coutUnite(ere, i)}</span>
      <span class="recharge"></span>`;
    btn.addEventListener("click", () => etat && invoquer(etat.camps.joueur, i));
    conteneur.appendChild(btn);
  });
  const p = ERES[ere].pouvoir;
  $("pouvoir-emoji").textContent = p.emoji;
  $("pouvoir-nom").textContent = p.nom;
}

function construireBoutonsTourelles() {
  const ere = etat ? etat.camps.joueur.ere : 0;
  const f = facteurStats(ere);
  const conteneur = $("tourelles");
  conteneur.innerHTML = "";
  ERES[ere].tourelles.forEach((def, i) => {
    const r = TOURELLES[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "unite tourelle";
    btn.dataset.t = i;
    btn.title = `${def.nom} (${r.role})\n⚔️ ${Math.round(r.attaque * f)} dégâts toutes les ${r.cadence} s` +
      ` · 🎯 portée ${r.portee}${r.zone ? " · 💥 dégâts de zone" : ""}`;
    btn.innerHTML = `
      <span class="u-touche">${i + 6}</span>
      <span class="u-emoji">${def.emoji}</span>
      <span class="u-nom">${def.nom}</span>
      <span class="u-etoiles" aria-label="Attaque ${r.etoiles} sur 5">${"★".repeat(r.etoiles)}${"☆".repeat(5 - r.etoiles)}</span>
      <span class="u-cout">💰 ${coutTourelle(ere, i)}</span>`;
    btn.addEventListener("click", () => etat && acheterTourelle(etat.camps.joueur, i));
    conteneur.appendChild(btn);
  });
}

let signatureEmplacements = "";

function majEmplacements(j, actif) {
  const signature = JSON.stringify([j.emplacements, j.tourelles.map((t) => t && [t.nom, t.valeur]), actif]);
  if (signature !== signatureEmplacements) {
    signatureEmplacements = signature;
    const conteneur = $("emplacements");
    conteneur.innerHTML = "";
    COUT_EMPLACEMENTS.forEach((cout, k) => {
      const t = j.tourelles[k];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "emplacement";
      btn.disabled = !actif;
      if (t) {
        btn.classList.add("occupe");
        btn.title = "Revendre cette tourelle";
        btn.innerHTML = `<span class="e-emoji">${t.emoji}</span><span>${t.nom}` +
          `<span class="e-detail">${ERES[t.ere].emoji} · Vendre +${Math.round(t.valeur / 2)} 💰</span></span>`;
        btn.addEventListener("click", () => vendreTourelle(etat.camps.joueur, k));
      } else if (k < j.emplacements) {
        btn.disabled = true;
        btn.innerHTML = `<span class="e-emoji">⬜</span><span>Emplacement libre</span>`;
      } else {
        btn.classList.add("verrou");
        btn.disabled = !actif || k !== j.emplacements;
        btn.innerHTML = `<span class="e-emoji">🔒</span><span>Débloquer<span class="e-detail">💰 ${cout}</span></span>`;
        btn.addEventListener("click", () => debloquerEmplacement(etat.camps.joueur));
      }
      conteneur.appendChild(btn);
    });
  }
  const verrou = document.querySelector(".emplacement.verrou:not(:disabled)");
  if (verrou) verrou.classList.toggle("cher", j.or < COUT_EMPLACEMENTS[j.emplacements]);
  const libre = j.tourelles.some((t, n) => t === null && n < j.emplacements);
  document.querySelectorAll(".tourelle").forEach((btn) => {
    const i = Number(btn.dataset.t);
    btn.classList.toggle("cher", j.or < coutTourelle(j.ere, i));
    btn.disabled = !actif || !libre;
  });
}

function majInterface() {
  if (!etat) return;
  const j = etat.camps.joueur;
  const e = ERES[j.ere];
  $("or").textContent = formatNombre(j.or);
  $("temps").textContent = formatTemps(etat.temps);
  $("ere-nom").textContent = `${e.emoji} ${e.nom}`;
  if (e.xpSuivante !== null) {
    $("xp-texte").textContent = `· ${formatNombre(j.xp)} / ${e.xpSuivante} XP`;
    $("barre-xp").style.width = `${Math.min(100, (j.xp / e.xpSuivante) * 100)}%`;
  } else {
    $("xp-texte").textContent = "· âge maximal atteint";
    $("barre-xp").style.width = "100%";
  }

  const actif = !etat.pause && !etat.fini;
  document.querySelectorAll(".unite:not(.tourelle)").forEach((btn) => {
    const i = Number(btn.dataset.i);
    const cher = j.or < coutUnite(j.ere, i);
    btn.classList.toggle("cher", cher);
    btn.disabled = !actif;
    btn.querySelector(".recharge").style.setProperty("--p", j.recharges[i] / ROLES[i].recharge);
  });

  majEmplacements(j, actif);

  const evo = $("btn-evoluer");
  const pret = actif && peutEvoluer(j);
  evo.disabled = !pret;
  evo.classList.toggle("pret", pret);
  $("evoluer-texte").textContent = e.xpSuivante === null
    ? "Tu es au dernier âge"
    : `${ERES[j.ere + 1].emoji} ${ERES[j.ere + 1].nom} · ${pret ? "prêt !" : `${e.xpSuivante} XP`}`;

  const pouvoir = $("btn-pouvoir");
  const pouvoirPret = actif && j.pouvoir <= 0;
  pouvoir.disabled = !pouvoirPret;
  pouvoir.classList.toggle("pret", pouvoirPret);
  $("pouvoir-texte").textContent = j.pouvoir > 0 ? `Recharge : ${Math.ceil(j.pouvoir)} s` : "Prêt !";
  $("pouvoir-recharge").style.setProperty("--p", j.pouvoir / RECHARGE_POUVOIR);
}

function afficherRecords() {
  const records = lireRecords();
  const morceaux = Object.entries(DIFFICULTES).map(([cle, d]) => {
    const r = records[cle];
    if (!r) return null;
    const meilleur = r.meilleur !== null ? `, record ${formatTemps(r.meilleur)}` : "";
    return `${d.nom} : ${r.victoires} 🏆 / ${r.defaites} 💀${meilleur}`;
  }).filter(Boolean);
  $("records").textContent = morceaux.length ? morceaux.join(" · ") : "Aucune partie jouée pour l'instant.";
}

function construireDifficultes() {
  const conteneur = $("choix-difficulte");
  conteneur.innerHTML = "";
  for (const [cle, d] of Object.entries(DIFFICULTES)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = d.nom;
    btn.setAttribute("aria-pressed", String(cle === difficulte));
    btn.addEventListener("click", () => {
      difficulte = cle;
      conteneur.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      son([600], 0.05, "square", 0.03);
      majRecordEcran();
    });
    conteneur.appendChild(btn);
  }
}

function majRecordEcran() {
  const r = lireRecords()[difficulte];
  $("ecran-record").textContent = r && r.meilleur !== null
    ? `🏆 Victoire la plus rapide en ${DIFFICULTES[difficulte].nom.toLowerCase()} : ${formatTemps(r.meilleur)}`
    : "";
}

function afficherEcran(type, nouveauRecord = false) {
  const titres = {
    accueil: "⚔️ Guerre des âges",
    victoire: "🏆 Victoire !",
    defaite: "💀 Défaite…",
  };
  $("ecran-titre").textContent = titres[type];
  $("ecran-regles").hidden = type !== "accueil";
  if (type === "accueil") {
    $("ecran-texte").textContent = "Détruis la base ennemie avant qu'elle ne détruise la tienne !";
    $("btn-jouer").textContent = "Jouer";
  } else {
    const s = etat.stats;
    $("ecran-texte").textContent = (type === "victoire"
      ? `La base ennemie est tombée en ${formatTemps(etat.temps)}.`
      : `Ta base a résisté ${formatTemps(etat.temps)}.`) +
      ` ${s.invoques} combattants invoqués, ${s.vaincus} ennemis vaincus.` +
      (nouveauRecord ? " Nouveau record !" : "");
    $("btn-jouer").textContent = "Rejouer";
  }
  majRecordEcran();
  afficherRecords();
  $("ecran").hidden = false;
  $("btn-jouer").focus({ preventScroll: true });
}

function basculerPause() {
  if (!etat || etat.fini) return;
  etat.pause = !etat.pause;
  $("btn-pause").textContent = etat.pause ? "▶" : "⏸";
}

// ---------------------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------------------
$("btn-jouer").addEventListener("click", nouvellePartie);
$("btn-pause").addEventListener("click", basculerPause);
$("btn-evoluer").addEventListener("click", () => etat && evoluer(etat.camps.joueur));
$("btn-pouvoir").addEventListener("click", () => etat && lancerPouvoir(etat.camps.joueur));
$("btn-abandon").addEventListener("click", () => {
  if (etat && !etat.fini && confirm("Abandonner la partie en cours ?")) finDePartie(false);
});

document.addEventListener("keydown", (ev) => {
  if (ev.target.closest("input, select, textarea")) return;
  if (!etat || etat.fini) return;
  const j = etat.camps.joueur;
  const k = ev.key.toLowerCase();
  if (k >= "1" && k <= "5") invoquer(j, Number(k) - 1);
  else if (k >= "6" && k <= "8") acheterTourelle(j, Number(k) - 6);
  else if (k === "e") evoluer(j);
  else if (k === "f") lancerPouvoir(j);
  else if (k === "p" || k === "escape") basculerPause();
  else return;
  ev.preventDefault();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && etat && !etat.fini && !etat.pause) basculerPause();
});

try { $("choix-son").checked = localStorage.getItem(CLE_SON) !== "non"; } catch (e) { /* ignoré */ }
$("choix-son").addEventListener("change", () => {
  try { localStorage.setItem(CLE_SON, $("choix-son").checked ? "oui" : "non"); } catch (e) { /* ignoré */ }
});

window.addEventListener("resize", redimensionner);
redimensionner();
construireDifficultes();
construireBoutonsUnites();
  construireBoutonsTourelles();
afficherEcran("accueil");
requestAnimationFrame(boucle);
