/* ============================================================
   光景 — main.js
   1. 工具 / 滚动锁
   2. 背景照片
   3. 开屏：loader → 整张图 → 黑白 ENTER → 图片退成背景
   4. 菜单 / 游戏播放器
   5. 滚动与细节
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const body = document.body;
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(window.location.search);

  const locks = new Set();
  function setLock(name, on) {
    if (on) locks.add(name);
    else locks.delete(name);

    const locked = locks.size > 0;
    if (locked && !body.classList.contains("is-locked")) {
      const gap = window.innerWidth - document.documentElement.clientWidth;
      root.style.setProperty("--sbw", gap + "px");
    }
    body.classList.toggle("is-locked", locked);
  }

  function readSession(key) {
    try { return window.sessionStorage.getItem(key); }
    catch (error) { return null; }
  }
  function writeSession(key, value) {
    try { window.sessionStorage.setItem(key, value); }
    catch (error) { /* file:// 下可能不可用 */ }
  }

  function cssUrl(url) {
    return 'url("' + String(url).replace(/"/g, "%22") + '")';
  }

  /* ------------------------------------------------------------
     2. 背景照片
  ------------------------------------------------------------ */

  const PHOTOS = Array.isArray(window.SCENE_PHOTOS)
    ? window.SCENE_PHOTOS.filter((item) => typeof item === "string" && item.trim())
    : [];
  const FIRST = PHOTOS[0] || "";

  const bg = $("#bg");
  const bgMedia = $("#bgMedia");
  const page = $("#page");
  const gameCover = $("#gameCover");

  function applyPhotos() {
    if (!FIRST) {
      if (bgMedia) {
        bgMedia.style.backgroundImage =
          "radial-gradient(60% 60% at 70% 25%, #bdefff, transparent 60%), linear-gradient(160deg, #57d0fb, #bdefff 55%, #eafaff)";
      }
      if (gameCover) gameCover.style.display = "none";
      return;
    }
    if (bgMedia) bgMedia.style.backgroundImage = cssUrl(FIRST);
    if (gameCover) gameCover.src = FIRST;
  }

  /* ------------------------------------------------------------
     3. 开屏
  ------------------------------------------------------------ */

  const LOADER_HOLD = 1200;  // 第一幕
  const IMAGE_PLAY = 2800   // 图片停留（进度条 4.2s）
  const ENTER_TIME = 1150;   // 图片退成背景

  const opening = $("#opening");
  const enterBtn = $("#enterBtn");
  const skip = $("#skip");
  const topbar = $("#topbar");

  let openingActive = false;
  let gateReady = false;
  let entering = false;
  let loaderTimer = null;
  let gateTimer = null;
  let enterTimer = null;

  function clearOpeningTimers() {
    window.clearTimeout(loaderTimer);
    window.clearTimeout(gateTimer);
    window.clearTimeout(enterTimer);
  }

  function revealGate() {
    if (!opening || !openingActive || gateReady || entering) return;
    gateReady = true;
    window.clearTimeout(gateTimer);
    opening.classList.add("is-ready");
    if (enterBtn) window.setTimeout(() => enterBtn.focus({ preventScroll: true }), 700);
  }

  function enterSite() {
    if (!opening || !openingActive || !gateReady || entering) return;
    entering = true;
    clearOpeningTimers();

    opening.classList.add("is-entering");
    bg.classList.add("is-page");
    page.classList.add("is-in");
    setLock("opening", false);
    writeSession("scene-entered", "1");

    enterTimer = window.setTimeout(finishOpening, ENTER_TIME);
  }

  function finishOpening() {
    if (!opening) return;
    openingActive = false;
    entering = false;
    gateReady = false;
    opening.classList.remove("is-active", "is-loaded", "is-ready", "is-entering");
    opening.setAttribute("aria-hidden", "true");
    setLock("opening", false);
    page.classList.add("is-in");
    bg.classList.add("is-page");

    const main = $("#main");
    if (main) main.focus({ preventScroll: true });
  }

  function showOpening() {
    if (!opening || openingActive) return;

    closeNav(false);
    closePlayer(false);

    openingActive = true;
    gateReady = false;
    entering = false;
    clearOpeningTimers();

    page.classList.remove("is-in");
    bg.classList.remove("is-page", "is-zoom");

    opening.classList.remove("is-loaded", "is-ready", "is-entering");
    opening.setAttribute("aria-hidden", "false");
    opening.setAttribute("tabindex", "-1");
    setLock("opening", true);

    /* 同一 class 重复添加不会重播动画，先强制回流 */
    opening.classList.remove("is-active");
    void opening.offsetWidth;
    opening.classList.add("is-active");
    opening.focus({ preventScroll: true });

    loaderTimer = window.setTimeout(() => {
      if (!openingActive) return;
      opening.classList.add("is-loaded");
      bg.classList.add("is-zoom");
      gateTimer = window.setTimeout(revealGate, IMAGE_PLAY);
    }, LOADER_HOLD);
  }

  function replayOpening() {
    if (openingActive) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    window.setTimeout(showOpening, 80);
  }

  function showPageDirect() {
    if (!opening) return;
    bg.classList.add("is-page", "is-zoom");
    page.classList.add("is-in");
    opening.classList.remove("is-active");
    opening.setAttribute("aria-hidden", "true");
    setLock("opening", false);
  }

  /* ------------------------------------------------------------
     4-1. 菜单
  ------------------------------------------------------------ */

  const nav = $("#nav");
  const menuOpen = $("#menuOpen");
  const navClose = $("#navClose");
  let navTrigger = null;

  function openNav() {
    if (!nav || body.classList.contains("nav-open") || openingActive) return;
    navTrigger = document.activeElement;
    nav.classList.add("is-open");
    nav.setAttribute("aria-hidden", "false");
    body.classList.add("nav-open");
    setLock("nav", true);
    if (menuOpen) menuOpen.setAttribute("aria-expanded", "true");
    if (navClose) navClose.focus({ preventScroll: true });
  }

  function closeNav(returnFocus = true) {
    if (!nav || !body.classList.contains("nav-open")) return;
    nav.classList.remove("is-open");
    nav.setAttribute("aria-hidden", "true");
    body.classList.remove("nav-open");
    setLock("nav", false);
    if (menuOpen) menuOpen.setAttribute("aria-expanded", "false");
    if (returnFocus && navTrigger && navTrigger.focus) navTrigger.focus({ preventScroll: true });
  }

  if (menuOpen) menuOpen.addEventListener("click", openNav);
  if (navClose) navClose.addEventListener("click", () => closeNav());
  if (nav) {
    $$("[data-nav-link]", nav).forEach((link) => {
      link.addEventListener("click", () => closeNav(false));
    });
  }

  /* ------------------------------------------------------------
     4-2. 游戏播放器
  ------------------------------------------------------------ */

  const player = $("#player");
  const playerStage = $("#playerStage");
  const playerMissing = $("#playerMissing");
  const playerTip = $("#playerTip");
  const playerClose = $("#playerClose");
  const startCard = $("#startCard");
  let playerTrigger = null;

  function resetPlayer() {
    const old = playerStage ? $("iframe", playerStage) : null;
    if (old) old.remove();
    if (playerMissing) playerMissing.hidden = true;
    if (playerTip) playerTip.hidden = true;
  }

  function showPlayerMissing(kind) {
    if (!playerMissing) return;
    playerMissing.hidden = false;
    if (playerTip) playerTip.hidden = kind !== "file";
  }

  async function openPlayer() {
    if (!player || openingActive) return;
    closeNav(false);
    playerTrigger = document.activeElement;

    resetPlayer();
    player.classList.add("is-open");
    player.setAttribute("aria-hidden", "false");
    setLock("player", true);
    if (playerClose) playerClose.focus({ preventScroll: true });

    if (location.protocol === "file:") {
      showPlayerMissing("file");
      return;
    }

    let exists = false;
    try {
      const res = await fetch("game/index.html", { method: "HEAD", cache: "no-store" });
      exists = res.ok;
    } catch (error) {
      exists = false;
    }

    if (!player.classList.contains("is-open")) return;
    if (!exists) {
      showPlayerMissing("missing");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.src = "game/index.html";
    iframe.title = "游戏画面";
    iframe.allow = "fullscreen; gamepad; autoplay; clipboard-write";
    playerStage.appendChild(iframe);
  }

  function closePlayer(returnFocus = true) {
    if (!player || !player.classList.contains("is-open")) return;
    player.classList.remove("is-open");
    player.setAttribute("aria-hidden", "true");
    setLock("player", false);
    const frame = playerStage ? $("iframe", playerStage) : null;
    if (frame) frame.remove();
    if (returnFocus && playerTrigger && playerTrigger.focus) playerTrigger.focus({ preventScroll: true });
  }

  if (playerClose) playerClose.addEventListener("click", () => closePlayer());
  if (player) {
    $$("[data-close]", player).forEach((el) => {
      el.addEventListener("click", () => closePlayer());
    });
  }

  $$("[data-game]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeNav(false);
      openPlayer();
    });
  });

  /* ------------------------------------------------------------
     5. 滚动 / 入口
  ------------------------------------------------------------ */

  function onScroll() {
    if (topbar) topbar.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* 开屏内的 Tab 圈定 */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (player && player.classList.contains("is-open")) {
        event.preventDefault();
        closePlayer();
        return;
      }
      if (body.classList.contains("nav-open")) {
        event.preventDefault();
        closeNav();
        return;
      }
      if (openingActive) {
        event.preventDefault();
        if (gateReady) enterSite();
        else revealGate();
      }
      return;
    }

    if (event.key !== "Tab" || !openingActive || !opening) return;
    const items = $$('button, [href], [tabindex]:not([tabindex="-1"])', opening)
      .filter((el) => el.offsetWidth || el.offsetHeight);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || !opening.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !opening.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });

  if (enterBtn) enterBtn.addEventListener("click", enterSite);
  if (skip) skip.addEventListener("click", revealGate);
  $$("[data-replay]").forEach((btn) => {
    btn.addEventListener("click", replayOpening);
  });

  /* ------------------------------------------------------------
     6. 初始化
  ------------------------------------------------------------ */

  applyPhotos();

  const seen = readSession("scene-entered");
  const forced = params.get("opening") === "1";
  const disabled = params.get("noopening") === "1" || params.get("opening") === "0";
  const shouldOpen = forced || (!seen && !disabled && !reduceMotion);

  if (shouldOpen) {
    /* 第一帧就盖上幕布，避免先看到页面再跳开屏 */
    window.requestAnimationFrame(() => showOpening());
  } else {
    showPageDirect();
  }

  window.SCENE = {
    playOpening: showOpening,
    enter: enterSite,
    openGame: openPlayer,
    photos: PHOTOS
  };
})();
