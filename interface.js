// Interface dynamique de l'accueil : tuiles de catégories, boutons segmentés,
// thème de couleur par catégorie. Les menus <select> cachés restent la source
// de vérité lue par quiz.js : chaque clic met leur valeur à jour.
const Interface = (function () {
  "use strict";

  const THEMES = {
    "": { icone: "🎲", couleur: "#4f46e5", nom: "Toutes les catégories" },
    "Histoire": { icone: "🏛️", couleur: "#b45309" },
    "Géographie": { icone: "🌍", couleur: "#0f766e" },
    "Sciences": { icone: "🔬", couleur: "#1d4ed8" },
    "Arts & Littérature": { icone: "🎨", couleur: "#a21caf" },
    "Sport": { icone: "⚽", couleur: "#0e7490" },
    "Divers": { icone: "💡", couleur: "#57534e" },
    "Cinéma": { icone: "🎬", couleur: "#be123c" },
    "Musique": { icone: "🎵", couleur: "#db2777" },
    "Gastronomie": { icone: "🍽️", couleur: "#c2410c" },
    "Nature & Animaux": { icone: "🦊", couleur: "#15803d" },
    "Technologie": { icone: "💻", couleur: "#334155" },
    "Mythologie": { icone: "⚡", couleur: "#7c3aed" },
    "BD & Jeux vidéo": { icone: "🎮", couleur: "#0369a1" },
  };
  const theme = (cat) => THEMES[cat] || { icone: "❓", couleur: "#4f46e5" };

  const $ = (id) => document.getElementById(id);
  const mouvementReduit = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Change la couleur d'accent de toute la page.
  function appliquerTheme(categorie) {
    document.documentElement.style.setProperty("--accent", theme(categorie).couleur);
  }

  function choisir(select, valeur) {
    if (select.value === valeur) return;
    select.value = valeur;
    select.dispatchEvent(new Event("change"));
  }

  // ---------- Effets de clic ----------

  function onde(el, e) {
    if (mouvementReduit()) return;
    const r = el.getBoundingClientRect();
    const rond = document.createElement("span");
    rond.className = "onde";
    const taille = Math.max(r.width, r.height) * 2;
    const x = (e && e.clientX ? e.clientX : r.left + r.width / 2) - r.left;
    const y = (e && e.clientY ? e.clientY : r.top + r.height / 2) - r.top;
    rond.style.width = rond.style.height = `${taille}px`;
    rond.style.left = `${x - taille / 2}px`;
    rond.style.top = `${y - taille / 2}px`;
    el.appendChild(rond);
    rond.addEventListener("animationend", () => rond.remove());
  }

  // Petits emojis qui jaillissent de la tuile.
  function eclat(el, icone) {
    if (mouvementReduit()) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 7; i++) {
      const s = document.createElement("span");
      s.className = "eclat";
      s.textContent = icone;
      const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.5;
      const dist = 45 + Math.random() * 35;
      s.style.left = `${r.left + r.width / 2}px`;
      s.style.top = `${r.top + r.height / 2}px`;
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }
  }

  // ---------- Tuiles de catégories ----------

  function construireTuiles() {
    const select = $("choix-categorie");
    const grille = $("tuiles-categories");
    grille.innerHTML = "";
    [...select.options].forEach((opt, i) => {
      const t = theme(opt.value);
      const nombre = (opt.textContent.match(/\((\d+)\)\s*$/) || [])[1];
      const nom = opt.value || "Mélange";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tuile";
      btn.dataset.valeur = opt.value;
      btn.style.setProperty("--c", t.couleur);
      btn.style.setProperty("--i", i);
      btn.setAttribute("aria-pressed", "false");

      const icone = document.createElement("span");
      icone.className = "tuile-icone";
      icone.textContent = t.icone;
      const titre = document.createElement("span");
      titre.className = "tuile-nom";
      titre.textContent = nom;
      const compte = document.createElement("span");
      compte.className = "tuile-compte";
      compte.textContent = nombre ? `${nombre} questions` : "";
      const coche = document.createElement("span");
      coche.className = "tuile-coche";
      coche.setAttribute("aria-hidden", "true");
      coche.textContent = "✓";

      btn.append(icone, titre, compte, coche);
      btn.addEventListener("click", (e) => {
        onde(btn, e);
        animer(btn, "pop");
        eclat(btn, t.icone);
        Effets.sons.clic(i); // chaque tuile joue sa propre note
        choisir(select, opt.value);
      });
      grille.appendChild(btn);
    });
  }

  function majTuiles() {
    const valeur = $("choix-categorie").value;
    document.querySelectorAll(".tuile").forEach((b) => {
      const actif = b.dataset.valeur === valeur;
      b.classList.toggle("active", actif);
      b.setAttribute("aria-pressed", String(actif));
    });
    const t = theme(valeur);
    const icone = $("hero-icone");
    const texte = $("hero-texte");
    if (texte.textContent !== (valeur || THEMES[""].nom)) {
      icone.textContent = t.icone;
      texte.textContent = valeur || THEMES[""].nom;
      animer(icone, "rebondir");
      animer(texte, "changer");
      document.querySelectorAll(".hero-emojis span").forEach((s) => {
        s.textContent = t.icone;
        animer(s, "rebondir");
      });
    }
    appliquerTheme(valeur);
  }

  // ---------- Boutons segmentés (difficulté, nombre) ----------

  function construireSegments(conteneur) {
    const select = $(conteneur.dataset.cible);
    conteneur.innerHTML = "";
    const curseur = document.createElement("span");
    curseur.className = "curseur";
    curseur.setAttribute("aria-hidden", "true");
    conteneur.appendChild(curseur);
    conteneur.style.setProperty("--n", select.options.length);

    [...select.options].forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "segment";
      b.dataset.valeur = opt.value;
      // « ⭐⭐ Moyen » : les étoiles et le mot sont séparés pour pouvoir s'empiler sur mobile.
      const m = opt.textContent.match(/^(⭐+)\s*(.*)$/);
      if (m) {
        const etoiles = document.createElement("span");
        etoiles.className = "etoiles";
        etoiles.textContent = m[1];
        const mot = document.createElement("span");
        mot.textContent = m[2];
        b.append(etoiles, " ", mot);
      } else {
        b.textContent = opt.textContent;
      }
      b.addEventListener("click", (e) => {
        onde(b, e);
        const avant = select.selectedIndex;
        const apres = [...select.options].indexOf(opt);
        if (apres !== avant) Effets.sons.glisse(apres > avant);
        else Effets.sons.clic();
        choisir(select, opt.value);
      });
      conteneur.appendChild(b);
    });

    const maj = () => {
      const boutons = [...conteneur.querySelectorAll(".segment")];
      const index = Math.max(0, boutons.findIndex((b) => b.dataset.valeur === select.value));
      boutons.forEach((b, i) => {
        b.classList.toggle("actif", i === index);
        b.setAttribute("aria-pressed", String(i === index));
      });
      conteneur.style.setProperty("--index", index);
    };
    select.addEventListener("change", maj);
    maj();
  }

  function animer(el, classe) {
    el.classList.remove(classe);
    void el.offsetWidth;
    el.classList.add(classe);
  }

  // ---------- Démarrage ----------

  function init() {
    construireTuiles();
    document.querySelectorAll(".segments").forEach(construireSegments);
    $("choix-categorie").addEventListener("change", majTuiles);
    majTuiles();

    const son = $("choix-son");
    Effets.activerSon(son.checked);
    son.addEventListener("change", () => Effets.activerSon(son.checked));
    son.addEventListener("change", () => { if (son.checked) Effets.sons.interrupteur(true); });
    const chrono = $("choix-chrono");
    chrono.addEventListener("change", () => Effets.sons.interrupteur(chrono.checked));
  }

  init();

  return { appliquerTheme, couleur: (cat) => theme(cat).couleur, icone: (cat) => theme(cat).icone };
})();
