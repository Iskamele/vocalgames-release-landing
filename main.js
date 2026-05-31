/* =========================================================
   VOCAL GAMES — main.js
   - GAMES config (single source of truth)
   - Renders game sections from a <template>
   - Renders right-nav + mobile slide-in menu
   - IntersectionObserver for active-section highlighting
   - Smooth-scroll handlers
   - Mobile menu toggle
   ========================================================= */

/* ------------------------------------------------------------------
   TODO for site owner — fill these before going live:
   - Real watch URL for Warhammer:           watchUrl on game-3
   - Per-game download / instructions URLs:  downloadUrl, instructionsUrl
   - Final hero sentence (optional):         index.html (.hero-subtitle)
   ------------------------------------------------------------------ */

const DETAILS_ENABLED = false; // flip to true to reveal "Подробніше" everywhere

const GAMES = [
  {
    id: "game-1",
    title: "BioShock",                       // uk: Біошок
    status: "date",                          // "date" | "available" | "tba"
    releaseDate: "30 червня",                // display label
    releaseAt: "2026-06-30",                 // YYYY-MM-DD — drives the countdown (local time)
    releaseText: null,
    image: "assets/games/01-bioshock-cover.jpg",
    downloadUrl: "#",
    instructionsUrl: "#",
    detailsUrl: "#",
    watchUrl: null,
  },
  {
    id: "game-2",
    title: "Subnautica",                     // uk: Субнаутіка
    status: "date",
    releaseDate: "15 липня",
    releaseAt: "2026-07-15",
    releaseText: null,
    image: "assets/games/02-subnautica-cover.jpg",
    downloadUrl: "#",
    instructionsUrl: "#",
    detailsUrl: "#",
    watchUrl: null,
  },
  {
    id: "game-3",
    title: "Warhammer",                      // uk: Вархамер — already released
    status: "available",
    releaseDate: null,
    releaseAt: null,
    releaseText: null,
    image: "assets/games/03-warhammer-cover.jpg",
    downloadUrl: "#",
    instructionsUrl: "#",
    detailsUrl: "#",
    watchUrl: "https://t.me/+fdpeog32s2tkYTVi", // <-- the "Дивитись зараз" target
  },
  {
    id: "game-4",
    title: "Skyrim",                         // uk: Скайрім
    status: "date",
    releaseDate: "11.11.2026",
    releaseAt: "2026-11-11",
    releaseText: null,
    image: "assets/games/04-skyrim-cover.jpg",
    downloadUrl: "#",
    instructionsUrl: "#",
    detailsUrl: "#",
    watchUrl: null,
  },
  {
    id: "game-5",
    title: "Позбутися принцеси",             // Slay the Princess
    status: "tba",
    releaseDate: null,
    releaseAt: null,
    releaseText: "Дату оголосимо після перших 10к на збір",
    image: "assets/games/05-slay-the-princess-cover.jpg",
    downloadUrl: "#",
    instructionsUrl: "#",
    detailsUrl: "#",
    watchUrl: null,
  },
];

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad2 = (n) => String(n).padStart(2, "0");

/* Ukrainian plural picker:
   forms = [nominative singular, plural 2-4, plural 5+]
   e.g. pluralUk(5, ["день", "дні", "днів"]) === "днів" */
function pluralUk(n, forms) {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

/* Parse a YYYY-MM-DD string as a local-midnight Date.
   Using new Date("2026-06-30") would parse as UTC midnight which shifts in UA timezone. */
function parseDateLocal(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/* Format a remaining-time string like "12 днів 03:24:18".
   Returns null if expired or invalid. */
function formatCountdown(target) {
  if (!target) return null;
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const dword = pluralUk(days, ["день", "дні", "днів"]);
  return `${days} ${dword} ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function buildReleaseNode(game) {
  if (game.status === "date") {
    // The release area becomes a three-line block:
    //   До релізу демо залишилося
    //   12 днів 03:24:18           (countdown — JS ticks each second)
    //   30 червня
    const target = parseDateLocal(game.releaseAt);
    const initial = formatCountdown(target) || "—";
    return `
      <span class="game-release-prompt">До релізу демо залишилося</span>
      <span class="game-countdown" data-target="${game.releaseAt || ""}">${initial}</span>
      <span class="game-release-date">${game.releaseDate}</span>
    `;
  }
  if (game.status === "available") {
    if (game.watchUrl) {
      return `<a href="${game.watchUrl}" target="_blank" rel="noopener">Дивитись зараз<span class="external-arrow" aria-hidden="true">↗</span></a>`;
    }
    return "Дивитись зараз";
  }
  return game.releaseText || "";
}

function shortReleaseLabel(game) {
  if (game.status === "date") return `Дата релізу демо ${game.releaseDate}`;
  if (game.status === "available") return "Дивитись зараз";
  return game.releaseText || "";
}

/* ------------------------------------------------------------------
   Render game sections
   ------------------------------------------------------------------ */

function renderGames() {
  const tpl = document.getElementById("tpl-game");
  const root = document.getElementById("games-root");

  GAMES.forEach((game, i) => {
    const node = tpl.content.cloneNode(true);
    const section = node.querySelector(".section.game");

    section.id = game.id;
    section.dataset.gameId = game.id;
    section.dataset.status = game.status;
    section.setAttribute("aria-label", game.title);

    const img = section.querySelector(".game-art");
    img.src = game.image;
    img.alt = `${game.title} cover art`;

    section.querySelector(".game-index").textContent = `// ${pad2(i + 1)} / ${pad2(GAMES.length)}`;
    section.querySelector(".game-title").textContent = game.title;
    section.querySelector(".game-release-text").innerHTML = buildReleaseNode(game);

    const dl = section.querySelector(".game-btn-download");
    const ins = section.querySelector(".game-btn-instructions");
    dl.href = game.downloadUrl || "#";
    ins.href = game.instructionsUrl || "#";

    // "available" games (already released) — only the "Дивитись зараз" link
    // makes sense; hide Завантажити / Інструкції entirely.
    if (game.status === "available") {
      dl.classList.add("is-hidden");
      ins.classList.add("is-hidden");
    }

    const det = section.querySelector(".game-btn-details");
    det.href = game.detailsUrl || "#";
    if (DETAILS_ENABLED) det.classList.remove("is-hidden");

    root.appendChild(node);
  });
}

/* ------------------------------------------------------------------
   Countdown ticker — updates every second.
   Reads .game-countdown[data-target="YYYY-MM-DD"] and rewrites text.
   ------------------------------------------------------------------ */

function startCountdownTicker() {
  const nodes = Array.from(document.querySelectorAll(".game-countdown"));
  if (!nodes.length) return;

  const tick = () => {
    nodes.forEach((node) => {
      const target = parseDateLocal(node.dataset.target);
      const txt = formatCountdown(target);
      if (txt) {
        node.textContent = txt;
      } else {
        // Expired — clear the countdown line so the date label still reads cleanly.
        // (Owner can then flip the game's status to "available" in GAMES.)
        node.textContent = "";
        node.classList.add("is-expired");
      }
    });
  };

  tick();
  setInterval(tick, 1000);
}

/* ------------------------------------------------------------------
   Right-nav (desktop) + mobile menu render
   ------------------------------------------------------------------ */

function navItems() {
  const items = GAMES.map((g, i) => ({
    href: `#${g.id}`,
    label: `RELEASE // ${pad2(i + 1)}`,
    title: g.title,
    sub: shortReleaseLabel(g),
  }));
  items.push({
    href: "#contacts",
    label: "// CONTACT",
    title: "Контакти",
    sub: "Telegram / YouTube / Email",
  });
  return items;
}

function renderRightNav() {
  const list = document.querySelector(".right-nav-list");
  if (!list) return;
  list.innerHTML = navItems()
    .map(
      (it) => `
        <li>
          <a class="right-nav-item" href="${it.href}" data-scroll-to="${it.href}">
            <span class="right-nav-label">${it.label}</span>
            <span class="right-nav-title">${it.title}</span>
            <span class="right-nav-sub">${it.sub}</span>
          </a>
        </li>`
    )
    .join("");
}

function renderMobileMenu() {
  const list = document.querySelector(".mobile-menu-list");
  if (!list) return;
  list.innerHTML = navItems()
    .map(
      (it) => `
        <li>
          <a class="mobile-menu-item" href="${it.href}" data-scroll-to="${it.href}" data-mobile-close>
            <span class="right-nav-label">${it.label}</span>
            <span class="right-nav-title">${it.title}</span>
            <span class="right-nav-sub">${it.sub}</span>
          </a>
        </li>`
    )
    .join("");
}

/* ------------------------------------------------------------------
   IntersectionObserver — set .is-active on the right-nav item
   matching the section currently centered in the viewport.
   ------------------------------------------------------------------ */

function wireActiveSectionObserver() {
  const sections = [
    ...document.querySelectorAll(".section.game"),
    document.getElementById("contacts"),
  ].filter(Boolean);

  const itemFor = (id) => document.querySelector(`.right-nav-item[href="#${id}"]`);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const item = itemFor(entry.target.id);
        if (!item) return;
        if (entry.isIntersecting) {
          document
            .querySelectorAll(".right-nav-item.is-active")
            .forEach((el) => el.classList.remove("is-active"));
          item.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((s) => observer.observe(s));
}

/* ------------------------------------------------------------------
   Smooth-scroll for in-page anchors
   ------------------------------------------------------------------ */

function wireSmoothScroll() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-scroll-to], a[href^='#']");
    if (!a) return;
    const target = a.getAttribute("data-scroll-to") || a.getAttribute("href");
    if (!target || target === "#" || !target.startsWith("#")) return;
    const el = document.querySelector(target);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  });
}

/* ------------------------------------------------------------------
   Mobile slide-in menu
   ------------------------------------------------------------------ */

function wireMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const toggle = document.querySelector(".spine-menu-toggle");
  if (!menu || !toggle) return;

  const open = () => {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("menu-open");
    document.body.classList.add("menu-open");
  };

  const close = () => {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("menu-open");
    document.body.classList.remove("menu-open");
  };

  toggle.addEventListener("click", () => {
    menu.classList.contains("is-open") ? close() : open();
  });

  // Any element with [data-mobile-close] closes the menu (backdrop, ✕, list links)
  menu.addEventListener("click", (e) => {
    if (e.target.closest("[data-mobile-close]")) close();
  });

  // Esc closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) close();
  });
}

/* ------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  renderGames();
  renderRightNav();
  renderMobileMenu();
  wireActiveSectionObserver();
  wireSmoothScroll();
  wireMobileMenu();
  startCountdownTicker();
});
