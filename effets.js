// Effets visuels et sonores du quiz.
// Les sons sont synthétisés avec la Web Audio API : aucun fichier audio n'est nécessaire.
const Effets = (function () {
  "use strict";

  const mouvementReduit = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let sonActif = true;
  let audio = null;

  // ---------- Animations ----------

  // Relance une animation CSS même si la classe est déjà présente.
  function animer(el, classe) {
    if (!el) return;
    el.classList.remove(classe);
    void el.offsetWidth; // force le navigateur à recalculer le style
    el.classList.add(classe);
  }

  // Petit texte qui s'envole depuis un élément (ex. « +1 »).
  function flottant(el, texte) {
    if (!el || mouvementReduit()) return;
    const r = el.getBoundingClientRect();
    const span = document.createElement("span");
    span.className = "flottant";
    span.textContent = texte;
    span.style.left = `${r.left + r.width / 2}px`;
    span.style.top = `${r.top}px`;
    document.body.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  }

  // Fait défiler un nombre de 0 jusqu'à la valeur finale.
  function compter(el, valeur, total, duree = 900) {
    if (mouvementReduit() || valeur === 0) {
      el.textContent = `${valeur} / ${total}`;
      return;
    }
    const debut = performance.now();
    const etape = (t) => {
      const p = Math.min(1, (t - debut) / duree);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = `${Math.round(valeur * ease)} / ${total}`;
      if (p < 1) requestAnimationFrame(etape);
    };
    requestAnimationFrame(etape);
  }

  // Pluie de confettis sur toute la page.
  function confettis(quantite = 120) {
    if (mouvementReduit()) return;
    const couleurs = ["#4f46e5", "#16a34a", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];
    const conteneur = document.createElement("div");
    conteneur.className = "confettis";
    for (let i = 0; i < quantite; i++) {
      const c = document.createElement("i");
      c.style.left = `${Math.random() * 100}vw`;
      c.style.background = couleurs[i % couleurs.length];
      c.style.setProperty("--derive", `${(Math.random() - 0.5) * 200}px`);
      c.style.setProperty("--rotation", `${Math.random() * 720 - 360}deg`);
      c.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
      c.style.animationDelay = `${Math.random() * 0.6}s`;
      if (Math.random() < 0.5) c.style.borderRadius = "50%";
      conteneur.appendChild(c);
    }
    document.body.appendChild(conteneur);
    setTimeout(() => conteneur.remove(), 5000);
  }

  // ---------- Sons ----------
  // Petit synthétiseur maison (Web Audio API) : notes avec glissando, vibrato
  // et filtre, bruit blanc filtré pour les percussions, carillons à harmoniques.

  let sortie = null;
  let bruitBlanc = null;

  function contexte() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
      // Compresseur en sortie : les sons superposés ne saturent pas.
      const comp = audio.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      sortie = audio.createGain();
      sortie.gain.value = 2.4;
      sortie.connect(comp).connect(audio.destination);
      // Une seconde de bruit blanc, réutilisée par toutes les percussions.
      bruitBlanc = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const d = bruitBlanc.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }

  // Enveloppe : attaque rapide, puis décroissance jusqu'au silence.
  function enveloppe(ctx, t, duree, volume, attaque = 0.01) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + attaque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    return g;
  }

  /**
   * Une note. Options :
   *   f, fin (fréquence d'arrivée : glissando), t (début, s), d (durée, s),
   *   type (sine, triangle, square, sawtooth), v (volume), attaque,
   *   vibrato: [vitesse Hz, profondeur Hz], filtre: [type, fréquence, fin, Q]
   */
  function ton(ctx, t0, o) {
    const t = t0 + (o.t || 0);
    const d = o.d || 0.2;
    const osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f, t);
    if (o.fin) osc.frequency.exponentialRampToValueAtTime(o.fin, t + d * (o.glisse || 1));
    if (o.vibrato) {
      const lfo = ctx.createOscillator();
      const prof = ctx.createGain();
      lfo.frequency.value = o.vibrato[0];
      prof.gain.value = o.vibrato[1];
      lfo.connect(prof).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + d + 0.05);
    }
    let noeud = osc;
    if (o.filtre) {
      const [type, freq, fin, q] = o.filtre;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.Q.value = q || 1;
      f.frequency.setValueAtTime(freq, t);
      if (fin) f.frequency.exponentialRampToValueAtTime(fin, t + d);
      noeud = noeud.connect(f);
    }
    noeud.connect(enveloppe(ctx, t, d, o.v || 0.15, o.attaque)).connect(sortie);
    osc.start(t);
    osc.stop(t + d + 0.05);
  }

  // Un carillon : la note et deux harmoniques qui s'éteignent plus vite.
  function cloche(ctx, t0, f, t, d = 0.6, v = 0.12) {
    ton(ctx, t0, { f, t, d, v, type: "sine", attaque: 0.003 });
    ton(ctx, t0, { f: f * 2.01, t, d: d * 0.6, v: v * 0.45, type: "sine", attaque: 0.003 });
    ton(ctx, t0, { f: f * 3.98, t, d: d * 0.3, v: v * 0.2, type: "sine", attaque: 0.003 });
  }

  // Bruit filtré : caisse claire, cymbale, souffle…
  function bruit(ctx, t0, o) {
    const t = t0 + (o.t || 0);
    const d = o.d || 0.1;
    const src = ctx.createBufferSource();
    src.buffer = bruitBlanc;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.filtre || "bandpass";
    f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f || 2000, t);
    if (o.fin) f.frequency.exponentialRampToValueAtTime(o.fin, t + d);
    src.connect(f).connect(enveloppe(ctx, t, d, o.v || 0.1, o.attaque || 0.005)).connect(sortie);
    src.start(t, Math.random() * 0.5);
    src.stop(t + d + 0.05);
  }

  // Lance un son seulement si les sons sont activés et disponibles.
  const jouer = (fn) => (...args) => {
    if (!sonActif) return;
    const ctx = contexte();
    if (!ctx) return;
    try { fn(ctx, ctx.currentTime + 0.01, ...args); } catch (e) { /* son ignoré */ }
  };

  // Gamme pentatonique (do ré mi sol la) : n'importe quelle suite de notes sonne juste.
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];
  const varie = (f, pct = 0.04) => f * (1 + (Math.random() * 2 - 1) * pct);

  const sons = {
    // Bulle qui éclate. Avec un numéro, chaque tuile a sa propre note : on joue une mélodie !
    clic: jouer((ctx, t, n) => {
      const f = n === undefined ? varie(700) : PENTA[n % PENTA.length];
      ton(ctx, t, { f: f * 0.6, fin: f * 1.6, d: 0.09, v: 0.3, type: "sine", glisse: 0.8 });
      ton(ctx, t, { f: f * 2, t: 0.05, d: 0.12, v: 0.1, type: "triangle" });
    }),

    // Petit sifflet qui monte ou descend vers la nouvelle position du curseur.
    glisse: jouer((ctx, t, versLaDroite) => {
      const [a, b] = versLaDroite ? [500, 1100] : [1100, 500];
      ton(ctx, t, { f: a, fin: b, d: 0.16, v: 0.2, type: "sine", vibrato: [30, 15] });
    }),

    // Interrupteur : « tic » clair à l'allumage, plus grave à l'extinction.
    interrupteur: jouer((ctx, t, allume) => {
      bruit(ctx, t, { f: allume ? 3500 : 1800, q: 6, d: 0.04, v: 0.5 });
      ton(ctx, t, { f: allume ? 1200 : 600, d: 0.06, v: 0.12, type: "square", filtre: ["lowpass", 2500] });
    }),

    // Départ : trois bips de compte à rebours puis un grand « whoosh » qui monte.
    depart: jouer((ctx, t) => {
      [0, 0.12, 0.24].forEach((dt, i) => ton(ctx, t, { f: i === 2 ? 1046 : 784, t: dt, d: 0.09, v: 0.1, type: "square", filtre: ["lowpass", 3000] }));
      bruit(ctx, t, { t: 0.32, f: 400, fin: 6000, d: 0.45, v: 0.12, q: 2 });
      ton(ctx, t, { t: 0.32, f: 300, fin: 1500, d: 0.45, v: 0.07, type: "sawtooth", filtre: ["lowpass", 800, 5000] });
    }),

    // Souffle quand une nouvelle question glisse à l'écran.
    question: jouer((ctx, t) => {
      bruit(ctx, t, { f: 600, fin: 3000, d: 0.28, v: 0.14, q: 1.5, attaque: 0.08 });
      ton(ctx, t, { f: varie(1568, 0.02), t: 0.12, d: 0.25, v: 0.06, type: "sine" });
    }),

    // Bonne réponse : arpège de carillons, d'autant plus aigu que la série est longue.
    bonne: jouer((ctx, t, serie = 1) => {
      const base = Math.min(serie - 1, 4); // la gamme monte à chaque bonne réponse d'affilée
      [0, 2, 4].forEach((pas, i) => cloche(ctx, t, PENTA[base + pas], i * 0.07, 0.5, 0.1));
      // Paillettes
      for (let i = 0; i < 4 + base; i++) {
        ton(ctx, t, { f: varie(3000 + Math.random() * 2500, 0), t: 0.2 + i * 0.04, d: 0.08, v: 0.025, type: "sine" });
      }
      if (serie >= 3) bruit(ctx, t, { t: 0.18, f: 8000, d: 0.35, v: 0.05, filtre: "highpass" }); // petite cymbale
    }),

    // Mauvaise réponse : « bwoh-bwoh » de trombone de dessin animé.
    mauvaise: jouer((ctx, t) => {
      ton(ctx, t, { f: 233, fin: 220, d: 0.22, v: 0.12, type: "sawtooth", filtre: ["lowpass", 900, 500, 4], vibrato: [6, 4] });
      ton(ctx, t, { f: 196, fin: 147, t: 0.22, d: 0.45, v: 0.12, type: "sawtooth", filtre: ["lowpass", 900, 300, 4], vibrato: [7, 6] });
    }),

    // Temps écoulé : ressort « boïïïng » qui retombe.
    tempsEcoule: jouer((ctx, t) => {
      ton(ctx, t, { f: 180, fin: 60, d: 0.6, v: 0.3, type: "triangle", vibrato: [18, 40] });
      bruit(ctx, t, { f: 300, d: 0.12, v: 0.1, q: 3 });
    }),

    // Chronomètre : bloc de bois, plus aigu dans les 3 dernières secondes.
    tic: jouer((ctx, t, restant = 5) => {
      const aigu = restant <= 3;
      ton(ctx, t, { f: aigu ? 1400 : 1000, fin: aigu ? 1100 : 800, d: 0.05, v: 0.25, type: "triangle", attaque: 0.002 });
      bruit(ctx, t, { f: aigu ? 4000 : 2500, q: 8, d: 0.03, v: 0.3 });
    }),

    // Bon score : roulement de tambour, accord de fanfare et cymbale.
    victoire: jouer((ctx, t) => {
      for (let i = 0; i < 10; i++) bruit(ctx, t, { t: i * 0.035, f: 1800, q: 0.8, d: 0.05, v: 0.04 + i * 0.008 });
      const fanfare = [[523.25, 0.4], [659.25, 0.52], [783.99, 0.64], [1046.5, 0.8]];
      fanfare.forEach(([f, dt], i) => {
        const d = i === 3 ? 0.9 : 0.14;
        ton(ctx, t, { f, t: dt, d, v: 0.09, type: "sawtooth", filtre: ["lowpass", 2500, 1500], vibrato: i === 3 ? [5.5, 6] : null });
        ton(ctx, t, { f: f / 2, t: dt, d, v: 0.06, type: "square", filtre: ["lowpass", 1200] });
      });
      bruit(ctx, t, { t: 0.8, f: 7000, d: 1, v: 0.09, filtre: "highpass" });
      cloche(ctx, t, 2093, 0.85, 0.8, 0.06);
    }),

    // Nouveau record : petite mélodie de carillons par-dessus la victoire.
    record: jouer((ctx, t) => {
      [1046.5, 1318.51, 1567.98, 2093, 1567.98, 2093].forEach((f, i) => cloche(ctx, t, f, 1.3 + i * 0.09, 0.5, 0.07));
    }),

    // Score faible : « wah wah wah waaah » de trombone triste.
    fin: jouer((ctx, t) => {
      [[392, 0], [370, 0.32], [349, 0.64]].forEach(([f, dt]) =>
        ton(ctx, t, { f, t: dt, d: 0.28, v: 0.11, type: "sawtooth", filtre: ["lowpass", 400, 1400, 6] })
      );
      ton(ctx, t, { f: 330, fin: 311, t: 0.96, d: 1, v: 0.11, type: "sawtooth", filtre: ["lowpass", 400, 1400, 6], vibrato: [5, 8] });
    }),
  };

  return {
    animer,
    flottant,
    compter,
    confettis,
    sons,
    activerSon(actif) { sonActif = actif; }, // le contexte audio est créé au premier son, après un clic
  };
})();
