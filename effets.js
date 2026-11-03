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

  function contexte() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
    }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }

  // Joue une suite de notes : [fréquence (Hz), début (s), durée (s)].
  function notes(liste, type = "sine", volume = 0.15) {
    if (!sonActif) return;
    const ctx = contexte();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    liste.forEach(([freq, debut, duree]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + debut);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + debut + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + debut + duree);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + debut);
      osc.stop(t0 + debut + duree + 0.05);
    });
  }

  const sons = {
    bonne: () => notes([[659, 0, 0.15], [880, 0.1, 0.25]], "triangle"),
    mauvaise: () => notes([[220, 0, 0.18], [165, 0.15, 0.3]], "sawtooth", 0.08),
    tic: () => notes([[1200, 0, 0.05]], "square", 0.04),
    clic: () => notes([[880, 0, 0.06], [1320, 0.04, 0.08]], "sine", 0.06),
    victoire: () => notes([[523, 0, 0.15], [659, 0.15, 0.15], [784, 0.3, 0.15], [1047, 0.45, 0.4]], "triangle"),
    fin: () => notes([[392, 0, 0.2], [330, 0.2, 0.35]], "triangle"),
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
