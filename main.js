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
    downloadUrl: "https://drive.google.com/drive/folders/1Q1qMbop7FKNc_JV_NQKb9Ua5aVSHXAPC?usp=sharing",
    instructionsUrl: "https://steamcommunity.com/sharedfiles/filedetails/?id=1632538283",
    // If feedbackUrl is set, "Відгук" is rendered into the third slot
    // (game-btn-details) when instructionsUrl is also active; otherwise
    // it replaces the Інструкції button. See renderGames() logic.
    feedbackUrl: "https://docs.google.com/forms/d/e/1FAIpQLSelYHqEOB9MUDRJ5SEEkYfWLoN6sWGDi3ZLuJaV2jtt9-lE2A/viewform",
    detailsUrl: "#",
    watchUrl: null,
    jarUrl: "https://send.monobank.ua/jar/4H5aTBoTGM",
    // counterapi.dev slug — increments on Завантажити click, value shown below button
    counterSlug: "skyvoice-bioshock-download-clics",
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
    jarUrl: "https://send.monobank.ua/jar/5zyzPnBtsJ",
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
    watchUrl: "https://t.me/+fdpeog32s2tkYTVi",
    jarUrl: null,                            // already released — no fundraiser
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
    jarUrl: "https://send.monobank.ua/jar/4bJ1T46L7L",
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
    jarUrl: "https://send.monobank.ua/jar/6rUNLEm5gS",
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
    const det = section.querySelector(".game-btn-details");
    const buttonsRow = section.querySelector(".game-buttons");

    // Wire URLs IF they're real; otherwise mark the button as a disabled placeholder.
    // (Until release assets exist, Завантажити / Інструкції are non-clickable.)
    const wireOrDisable = (btn, url) => {
      if (url && url !== "#") {
        btn.href = url;
      } else {
        btn.removeAttribute("href");
        btn.removeAttribute("target");
        btn.removeAttribute("rel");
        btn.classList.add("is-disabled");
        btn.setAttribute("aria-disabled", "true");
        btn.setAttribute("tabindex", "-1");
      }
    };
    wireOrDisable(dl, game.downloadUrl);

    // Render "Відгук" into whichever slot is free.
    // - If game has real Інструкції (instructionsUrl ≠ "#") AND feedbackUrl:
    //     Інструкції stays in slot 2, "Відгук" goes into slot 3 (game-btn-details).
    // - If only feedbackUrl:
    //     "Відгук" takes slot 2 (replacing the Інструкції placeholder).
    // - If only Інструкції: slot 2 is active "Інструкції", slot 3 hidden.
    // - If neither: slot 2 is disabled placeholder, slot 3 hidden.
    const renderFeedback = (btn, url) => {
      btn.textContent = "";
      btn.append("Відгук");
      const arrow = document.createElement("span");
      arrow.className = "external-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      btn.append(arrow);
      btn.href = url;
      btn.target = "_blank";
      btn.rel = "noopener";
      btn.classList.remove("is-hidden", "is-disabled");
      btn.removeAttribute("aria-disabled");
      btn.removeAttribute("tabindex");
    };
    const hasInstr = game.instructionsUrl && game.instructionsUrl !== "#";
    const hasFeedback = !!game.feedbackUrl;

    if (hasInstr) {
      wireOrDisable(ins, game.instructionsUrl);
      if (hasFeedback) renderFeedback(det, game.feedbackUrl);
    } else if (hasFeedback) {
      renderFeedback(ins, game.feedbackUrl);
    } else {
      wireOrDisable(ins, game.instructionsUrl);
    }

    // "available" games (already released) — only the "Дивитись зараз" link
    // in the release-text area makes sense; hide DL / Інструкції entirely.
    if (game.status === "available") {
      dl.classList.add("is-hidden");
      ins.classList.add("is-hidden");
    }

    // "tba" games (e.g. Slay the Princess) — release depends on hitting a
    // donation goal. Replace the disabled DL/Instr pair with a single
    // active "Підтримати збір" button that links to the project's jar.
    if (game.status === "tba" && game.jarUrl) {
      dl.classList.add("is-hidden");
      ins.classList.add("is-hidden");
      const support = document.createElement("a");
      support.className = "btn btn--primary game-btn-support";
      support.href = game.jarUrl;
      support.target = "_blank";
      support.rel = "noopener";
      support.innerHTML = `Підтримати збір<span class="external-arrow" aria-hidden="true">↗</span>`;
      // Insert at the START of the buttons row so it visually replaces the pair.
      buttonsRow.prepend(support);
    }

    // "Подробніше" slot: only meaningful when the feedback / instructions
    // branches above didn't already repurpose this element. Skip the legacy
    // wiring if it's already been turned into "Відгук".
    if (det.textContent.trim() === "Подробніше") {
      det.href = game.detailsUrl || "#";
      if (DETAILS_ENABLED) det.classList.remove("is-hidden");
    }

    root.appendChild(node);
  });
}

/* ------------------------------------------------------------------
   Touch detection — phones + tablets + anything with no real cursor.
   Desktop with a mouse falls through to CSS mandatory snap.
   ------------------------------------------------------------------ */

const isTouch = matchMedia("(hover: none) and (pointer: coarse)").matches;

if (isTouch) {
  document.documentElement.classList.add("soft-snap");
}

/* ------------------------------------------------------------------
   Soft-snap (any touch device) — after a scroll settles, ALWAYS smooth-
   scroll to the nearest section. No dead zone, no threshold — wherever
   the user lands, the page softly centers on the closest slide.

   Runs AFTER native momentum (debounced 140 ms past the last scroll
   event), so it doesn't fight WebKit / Chromium's own scrolling.
   ------------------------------------------------------------------ */

function wireSoftSnap() {
  if (!isTouch) return;
  if (prefersReducedMotion) return;

  const stops = [
    document.getElementById("hero"),
    ...Array.from(document.querySelectorAll(".section.game")),
    document.getElementById("support"),
    document.getElementById("contacts"),
  ].filter(Boolean);

  let scrollTimer = null;
  let touching = false;
  let lastSnapAt = 0;

  const maybeSnap = () => {
    // Don't snap during interaction or right after we just snapped
    if (touching) return;
    if (Date.now() - lastSnapAt < 700) return;
    // Don't snap if mobile menu is open (page is locked anyway)
    if (document.documentElement.classList.contains("menu-open")) return;

    const vt = window.scrollY;

    // Find the nearest section by top edge
    let nearest = null;
    let bestDist = Infinity;
    for (const s of stops) {
      const d = Math.abs(s.offsetTop - vt);
      if (d < bestDist) {
        bestDist = d;
        nearest = s;
      }
    }
    if (!nearest) return;
    // Already aligned (within 4px) — nothing to do
    if (bestDist < 4) return;

    // Always snap to the closest section — no dead zone.
    lastSnapAt = Date.now();
    nearest.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const debouncedMaybeSnap = () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(maybeSnap, 140);
  };

  window.addEventListener(
    "touchstart",
    () => {
      touching = true;
      clearTimeout(scrollTimer);
    },
    { passive: true }
  );
  window.addEventListener(
    "touchend",
    () => {
      touching = false;
      // After touchend, momentum continues — let it run, then check.
      // 140ms idle from the scroll-handler debounce will fire after momentum ends.
    },
    { passive: true }
  );
  window.addEventListener("scroll", debouncedMaybeSnap, { passive: true });
}

/* ------------------------------------------------------------------
   Scroll indicators — clicking an arrow scrolls to the next section.
   The arrow on the last visible section (game-5) scrolls to #contacts.
   ------------------------------------------------------------------ */

function wireScrollIndicators() {
  // The ordered list of "things to scroll between" — same order as the page.
  const stops = [
    document.getElementById("hero"),
    ...Array.from(document.querySelectorAll(".section.game")),
    document.getElementById("support"),
    document.getElementById("contacts"),
  ].filter(Boolean);

  document.querySelectorAll(".scroll-indicator").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const here = btn.closest(".section");
      const idx = stops.indexOf(here);
      const next = stops[idx + 1];
      if (!next) return;
      next.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });
}

/* ------------------------------------------------------------------
   Download tracking (counterapi.dev) — private, not shown on the site.
   Stats are visible only in the counterapi.dev dashboard.
   No auth needed for increment on this free tier — token stays out of
   the client. Per-browser dedupe via localStorage: one increment per
   slug per 12 hours, so refreshes / re-clicks don't inflate the number.
   ------------------------------------------------------------------ */

const COUNTER_API_BASE = "https://api.counterapi.dev/v2/iskamele";
const DEDUPE_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

function dedupeKey(slug) {
  return `vg_dl_${slug}`;
}

function recentlyCounted(slug) {
  try {
    const raw = localStorage.getItem(dedupeKey(slug));
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DEDUPE_WINDOW_MS;
  } catch (_) {
    // Private mode / storage disabled — fall through to "not counted"
    return false;
  }
}

function markCounted(slug) {
  try {
    localStorage.setItem(dedupeKey(slug), String(Date.now()));
  } catch (_) { /* ignore */ }
}

function incrementCount(slug) {
  // Fire-and-forget. keepalive lets the request survive a tab-close.
  try {
    fetch(`${COUNTER_API_BASE}/${slug}/up`, { method: "GET", keepalive: true });
  } catch (_) { /* ignore */ }
}

function wireDownloadTracking() {
  GAMES.forEach((game) => {
    if (!game.counterSlug) return;
    const section = document.getElementById(game.id);
    const dl = section?.querySelector(".game-btn-download");
    if (!dl) return;

    dl.addEventListener("click", () => {
      if (dl.classList.contains("is-disabled")) return;
      if (recentlyCounted(game.counterSlug)) return; // within 12h dedupe window
      markCounted(game.counterSlug);
      incrementCount(game.counterSlug);
    });
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
    href: "#support",
    label: "// SUPPORT",
    title: "Підтримати",
    sub: "Допомога зі зборами",
  });
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
   Support section — renders one row per game that has a jarUrl.
   Each row is a link to the monobank jar + a "Поширити" button that
   uses the Web Share API (with clipboard fallback).
   ------------------------------------------------------------------ */

function shareTextFor(game) {
  // URL inlined in the text — some apps (Telegram channels, X, etc.) strip
  // the separate share-url metadata; having it inside the text guarantees
  // recipients always see the jar link.
  return `Команда VOCAL GAMES робить українську озвучку гри ${game.title}. Підтримай збір: ${game.jarUrl}`;
}

function renderSupport() {
  const list = document.querySelector(".support-list");
  if (!list) return;
  const supportable = GAMES.filter((g) => g.jarUrl);
  list.innerHTML = supportable
    .map((g, i) => {
      const label = g.title.toUpperCase();
      const text = shareTextFor(g);
      // data-* values are HTML-escaped via attribute encoding
      return `
        <li class="support-row">
          <a class="support-link" href="${g.jarUrl}" target="_blank" rel="noopener">
            <span class="support-index">[${pad2(i + 1)}]</span>
            <span class="support-label">${label}</span>
            <span class="support-arrow" aria-hidden="true">↗</span>
          </a>
          <button
            type="button"
            class="support-share"
            data-share-title="VOCAL GAMES — ${label}"
            data-share-text="${text}"
            data-share-url="${g.jarUrl}"
          >Поширити</button>
        </li>`;
    })
    .join("");
}

/* Web Share API + clipboard fallback. Visual feedback is a temporary text
   swap on the button itself ("Скопійовано" / "Готово"). */
async function shareJar(btn) {
  const title = btn.dataset.shareTitle || "VOCAL GAMES";
  const text  = btn.dataset.shareText  || "";
  const url   = btn.dataset.shareUrl   || "";
  if (!url) return;

  const flash = (msg) => {
    const orig = btn.textContent;
    btn.textContent = msg;
    btn.classList.add("is-flashing");
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove("is-flashing");
    }, 1600);
  };

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      // share sheet handled it — no toast needed
      return;
    } catch (_) {
      // user cancelled — fall through silently
      return;
    }
  }
  // Fallback: copy the message (which already contains the URL) to clipboard
  try {
    // If the share-text already includes the URL (shareTextFor inlines it),
    // don't append it again.
    const payload = text.includes(url) ? text : `${text}\n${url}`;
    await navigator.clipboard.writeText(payload);
    flash("Скопійовано");
  } catch (_) {
    // Last-ditch: just open the jar
    window.open(url, "_blank", "noopener");
  }
}

function wireSupportShare() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".support-share");
    if (!btn) return;
    e.preventDefault();
    shareJar(btn);
  });
}

/* ------------------------------------------------------------------
   IntersectionObserver — set .is-active on the right-nav item
   matching the section currently centered in the viewport.
   ------------------------------------------------------------------ */

function wireActiveSectionObserver() {
  const sections = [
    ...document.querySelectorAll(".section.game"),
    document.getElementById("support"),
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
  renderSupport();
  renderRightNav();
  renderMobileMenu();
  wireActiveSectionObserver();
  wireSmoothScroll();
  wireMobileMenu();
  wireScrollIndicators();
  wireSupportShare();
  wireSoftSnap();
  wireDownloadTracking();
  startCountdownTicker();
});
