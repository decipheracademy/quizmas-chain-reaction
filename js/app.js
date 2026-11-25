// Chain Reaction Carnival · main game flow.
import { startSnow } from "./snow.js";
import * as audio from "./audio.js";
import { createSim, KINDS, W, H } from "./engine.js";
import { LEVELS, DEMOS } from "./levels.js";
import { createRenderer, iconFor, flipBadgePos } from "./render.js";
import { attemptsSoFar, registerAttempt, saveResult, flush, normaliseId } from "./storage.js";
import { burst, confetti } from "./fx.js";

const CFG = window.CR_CONFIG;
const M = window.Matter;
const PARAMS = new URLSearchParams(location.search);
if (PARAMS.get("fast") === "1") CFG.RIDE_TIME = { 1: 12, 2: 12, 3: 12 };
const FROM = (PARAMS.get("from") || "").toLowerCase();
const gsap = window.gsap;
const $ = (id) => document.getElementById(id);
const sfx = audio.sfx;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const KIND_ORDER = ["ramp", "dominoes", "spring", "ball"];

const S = {
  player: null, play: 0, ride: 0, level: null, placements: {}, history: [],
  tries: 0, timeLeft: 0, phase: "idle", sim: null, best: null, rides: [], trail: null, auto: false,
  popups: [], sparks: [], targetHitAt: 0, malletT: 0, selectedKind: null, hoverSocket: null, dragging: null, ghost: null,
  startedAt: 0, result: null,
};
window.__CR = S; // used by automated tests

// ---------------------------------------------------------------- basics
let current = "loader";
function show(id) {
  const from = $(current), to = $(id);
  if (from === to) return;
  gsap.to(from, { opacity: 0, duration: 0.25, onComplete: () => { from.classList.remove("active"); from.style.opacity = ""; } });
  to.classList.add("active");
  gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.35, delay: 0.15 });
  current = id;
}
let toastTimer = null;
function toast(msg, ms = 2400) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), ms);
}
function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ---------------------------------------------------------------- loader
const STATUS = ["Putting up the big tent…", "Oiling the springs…", "Stacking the dominoes…", "Polishing the baubles…", "Roll up, roll up…"];
async function runLoader() {
  const spokes = $("spokes");
  const cabin = ["#ef3b4f", "#f6c453", "#2ec27e", "#4fc3f7", "#8e5cf7", "#ff9f43", "#ffffff", "#ff6fa8"];
  spokes.innerHTML = cabin.map((c, i) => {
    const a = (i / cabin.length) * Math.PI * 2, x = 100 + Math.cos(a) * 78, y = 100 + Math.sin(a) * 78;
    return `<line x1="100" y1="100" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.55)" stroke-width="2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="${c}"/>`;
  }).join("");
  const fill = document.querySelector(".loader-fill"), bar = document.querySelector(".loader-bar");
  const start = performance.now();
  let real = 0;
  const fonts = ["20px Bungee", "800 20px 'Baloo 2'", "700 20px 'Baloo 2'", "700 20px Nunito", "800 20px Nunito", "400 20px Nunito"];
  const tasks = [Promise.all(fonts.map((f) => document.fonts.load(f).catch(() => {}))), new Promise((r) => setTimeout(r, 300))];
  tasks.forEach((p) => p.then(() => { real += 1 / tasks.length; }));
  await new Promise((resolve) => {
    let shown = 0;
    const step = () => {
      const tf = Math.min(1, (performance.now() - start) / CFG.LOADER_MIN_MS);
      const target = Math.min(real, tf);
      shown = Math.min(target, shown + (target - shown) * 0.12 + 0.002);
      const pct = Math.round(shown * 100);
      fill.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", pct);
      $("loaderPct").textContent = pct + "%";
      $("loaderText").textContent = STATUS[Math.min(STATUS.length - 1, Math.floor(shown * STATUS.length))];
      if (shown >= 0.999 && real >= 1 && tf >= 1) return resolve();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  await gsap.to(".loader-card", { scale: 1.08, opacity: 0, duration: 0.45, ease: "power2.in" });
}

// ---------------------------------------------------------------- curtains + intro
function showIntro() {
  const name = CFG.TRACK_NAMES[FROM];
  if (name) $("trackTag").textContent = `Quizmas Fun Zone · from ${name}`;
  show("intro");
  gsap.set("#introInner", { opacity: 0 });
  let opened = false;
  const open = () => {
    if (opened) return;
    opened = true;
    audio.unlock();
    $("intro").classList.add("curtains-open");
    sfx.whoosh();
    if (reduceMotion) {
      gsap.set(".curtain", { opacity: 0 });
    } else {
      gsap.to(".curtain.left", { xPercent: -100, skewY: -4, duration: 1.1, ease: "power3.inOut" });
      gsap.to(".curtain.right", { xPercent: 100, skewY: 4, duration: 1.1, ease: "power3.inOut" });
    }
    gsap.to("#introInner", { opacity: 1, duration: 0.3, delay: 0.5 });
    gsap.from("#marquee", { scale: 0.4, rotation: -6, duration: 0.9, delay: 0.55, ease: "elastic.out(1, 0.55)" });
    gsap.from(".objective", { y: 16, opacity: 0, duration: 0.4, delay: 0.9 });
    gsap.from(".controls li", { y: 30, opacity: 0, duration: 0.4, stagger: 0.1, delay: 1, ease: "back.out(2)" });
    gsap.from("#startBtn", { scale: 0, duration: 0.5, delay: 1.35, ease: "back.out(2.2)" });
    setTimeout(() => {
      sfx.fanfare();
      const r = $("marquee").getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, ["★", "✦", "❄", "●"], 22);
    }, 700);
    audio.startMusic();
  };
  $("intro").addEventListener("pointerdown", open, { once: true });
  $("curtainHint").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") open(); });
  gsap.from("#curtainHint", { y: 30, opacity: 0, duration: 0.5, delay: 0.4 });
}

// ---------------------------------------------------------------- entry
function setupEntry() {
  const form = $("entryForm"), err = $("entryError");
  $("quizmasId").addEventListener("input", () => {
    const id = normaliseId($("quizmasId").value);
    const n = attemptsSoFar(id);
    $("attemptNote").textContent = n > 0 ? `Welcome back! This will be play #${n + 1}. Your best score counts.` : "";
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("playerName").value.trim().replace(/\s+/g, " ");
    const id = normaliseId($("quizmasId").value);
    if (name.length < 2) { err.textContent = "Please enter your name."; $("playerName").focus(); sfx.wrong(); return; }
    if (!/^[A-Z0-9-]{3,20}$/.test(id)) { err.textContent = "Please enter your Quizmas ID (letters, numbers and dashes)."; $("quizmasId").focus(); sfx.wrong(); return; }
    err.textContent = "";
    S.player = { name, id };
    sfx.pop();
    document.activeElement?.blur?.();
    showMeet();
  });
}

// ---------------------------------------------------------------- meet the pieces
let demoRun = 0;
function showMeet() {
  show("meet");
  const grid = $("demoGrid");
  grid.innerHTML = DEMOS.map((d, i) => `<figure class="demo" style="margin:0"><canvas id="demo${i}"></canvas><p><span>${KINDS[d.kind].name}</span>${d.label}</p></figure>`).join("");
  const run = ++demoRun;
  setTimeout(() => {
    const scenes = DEMOS.map((d, i) => {
      const r = createRenderer($(`demo${i}`), { view: d.view });
      r.resize();
      return { d, r, sim: null, t: 0 };
    });
    const reset = (sc) => { sc.sim = createSim(M, sc.d.level, {}); sc.t = 0; };
    scenes.forEach(reset);
    const ui = (sc) => ({ level: sc.d.level, placements: {}, phase: "run", showMallet: false });
    const loop = (time) => {
      if (run !== demoRun || current !== "meet") return;
      for (const sc of scenes) {
        sc.t++;
        if (sc.t === 30) sc.sim.trigger();
        if (sc.t > 30 && sc.t < 230) sc.sim.step();
        if (sc.t > 260) reset(sc);
        sc.r.draw(sc.sim, ui(sc), time);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    window.addEventListener("resize", () => scenes.forEach((s) => s.r.resize()), { once: true });
  }, 60);
  gsap.from(".demo", { y: 30, opacity: 0, duration: 0.45, stagger: 0.1, delay: 0.2, ease: "back.out(1.8)" });
}

// ---------------------------------------------------------------- game setup
let renderer = null;
function startPlay() {
  S.play = registerAttempt(S.player.id);
  S.rides = [];
  S.startedAt = performance.now();
  show("game");
  const first = Math.min(LEVELS.length, Math.max(1, Number(PARAMS.get("ride")) || 1)) - 1;
  setTimeout(() => { layoutBoard(); startRide(first); }, 80);
}

function layoutBoard() {
  const play = document.querySelector(".play"), wrap = $("boardWrap"), cv = $("board");
  const portrait = window.matchMedia("(orientation: portrait)").matches;
  const pr = play.getBoundingClientRect();
  let w, h;
  if (portrait) {
    const goalH = 34;
    const dockMin = Math.min(250, pr.height * 0.45);
    w = Math.min(pr.width, ((pr.height - dockMin - goalH) * W) / H);
  } else {
    const wr = wrap.getBoundingClientRect();
    w = Math.min(wr.width, (wr.height * W) / H);
  }
  w = Math.max(200, Math.floor(w));
  h = Math.floor((w * H) / W);
  cv.style.width = w + "px";
  cv.style.height = h + "px";
  if (!renderer) { renderer = createRenderer(cv); S.toScreen = (x, y) => renderer.toScreen(x, y); }
  renderer.resize();
}

function rebuildSim() {
  S.sim = createSim(M, S.level, S.placements);
}
function usedCount(kind) {
  return Object.values(S.placements).filter((p) => p.kind === kind).length;
}
function remaining(kind) {
  return (S.level.tray[kind] || 0) - usedCount(kind);
}

function renderTray() {
  const tray = $("tray");
  tray.innerHTML = KIND_ORDER.filter((k) => S.level.tray[k]).map((k) => {
    const n = remaining(k);
    return `<button class="tray-item ${n ? "" : "empty"} ${S.selectedKind === k ? "selected" : ""}" data-kind="${k}" aria-label="${KINDS[k].name}, ${n} left. ${KINDS[k].hint}">
      <img src="${ICONS[k]}" alt=""><span>${KINDS[k].name}</span><b class="count">${n}</b></button>`;
  }).join("");
  tray.querySelectorAll(".tray-item").forEach((el) => el.addEventListener("pointerdown", (e) => trayDown(e, el.dataset.kind)));
  tray.querySelectorAll(".tray-item").forEach((el) => el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectKind(el.dataset.kind); }
  }));
}
let ICONS = {};

function setTries() {
  const total = CFG.TRIES_PER_RIDE;
  $("tries").innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i < total - S.tries ? "used" : ""}"></i>`).join("");
  $("tries").setAttribute("aria-label", `${S.tries} tries left`);
}
function setRideScore(v) {
  $("rideScore").textContent = v;
}
function setTimer() {
  const total = CFG.RIDE_TIME[S.ride + 1];
  $("timerText").textContent = fmtTime(S.timeLeft);
  $("timerRing").style.strokeDashoffset = String(97.4 * (1 - S.timeLeft / total));
  $("timer").classList.toggle("low", S.timeLeft <= 10);
  $("timer").classList.toggle("paused", S.phase !== "build");
}

// ---------------------------------------------------------------- rides
function startRide(i) {
  S.ride = i;
  S.level = LEVELS[i];
  S.placements = {};
  S.history = [];
  S.tries = CFG.TRIES_PER_RIDE;
  S.timeLeft = CFG.RIDE_TIME[i + 1];
  S.best = null;
  S.trail = null;
  S.auto = false;
  S.targetHitAt = 0;
  S.selectedKind = null;
  S.malletT = 0;
  S.popups = [];
  S.sparks = [];
  rebuildSim();
  $("rideNum").textContent = `Ride ${i + 1} / ${LEVELS.length}`;
  $("rideTitle").textContent = S.level.title;
  $("goalText").textContent = `🎯 ${S.level.goal}`;
  $("rideCard").hidden = true;
  setTries();
  setRideScore(0);
  renderTray();
  setPhase("banner");
  setTimer();
  // Ride banner
  $("bannerNum").textContent = `RIDE ${i + 1}`;
  $("bannerTitle").textContent = S.level.title;
  $("bannerGoal").textContent = S.level.goal;
  const b = $("rideBanner");
  b.hidden = false;
  sfx.bells();
  const tl = gsap.timeline({ onComplete: () => { b.hidden = true; setPhase("build"); if (i === 0) firstTimeHint(); } });
  tl.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    .from("#bannerTitle", { scale: 0.5, duration: 0.5, ease: "back.out(2)" }, 0)
    .to(b, { opacity: 0, duration: 0.35, delay: reduceMotion ? 0.8 : 1.6 });
}
function firstTimeHint() {
  toast("Drag a piece onto a glowing ⊕ spot, then press Set it off!", 3800);
}

function setPhase(p) {
  S.phase = p;
  const build = p === "build";
  ["goBtn", "undoBtn", "resetBtn"].forEach((id) => { $(id).disabled = !build; });
  $("undoBtn").disabled = !build || !S.history.length;
  $("resetBtn").disabled = !build || !Object.keys(S.placements).length;
  $("dock").style.opacity = build ? "1" : "0.6";
  $("tray").style.pointerEvents = build ? "" : "none";
  setTimer();
}

let timerHandle = null;
function startClock() {
  clearInterval(timerHandle);
  let last = performance.now();
  timerHandle = setInterval(() => {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    if (current !== "game" || S.phase !== "build" || document.hidden) return;
    const before = Math.ceil(S.timeLeft);
    S.timeLeft = Math.max(0, S.timeLeft - dt);
    if (Math.ceil(S.timeLeft) !== before && S.timeLeft <= 10 && S.timeLeft > 0) sfx.tick();
    setTimer();
    if (S.timeLeft <= 0) {
      S.auto = true;
      toast("⏰ Time's up! Setting it off…", 2000);
      launch();
    }
  }, 200);
}

// ---------------------------------------------------------------- placing pieces
function snapshot() {
  S.history.push(JSON.stringify(S.placements));
  if (S.history.length > 40) S.history.shift();
}
function changed() {
  rebuildSim();
  renderTray();
  setPhase("build");
}
function place(kind, socketId, fromSocket = null) {
  const s = S.level.sockets.find((q) => q.id === socketId);
  if (!s) return;
  snapshot();
  const prev = S.placements[socketId];
  if (fromSocket) {
    const moving = S.placements[fromSocket];
    delete S.placements[fromSocket];
    if (prev) S.placements[fromSocket] = prev; // swap
    S.placements[socketId] = moving;
  } else {
    S.placements[socketId] = { kind, flip: defaultFlip(kind) };
  }
  sfx.snap();
  const p = renderer.toScreen(s.x, s.air ? s.y : s.y - 30);
  burst(p.x, p.y, ["✦", "★"], 8);
  changed();
}
// Ramps and springs start pointing the way the starting bauble rolls.
function defaultFlip(kind) {
  if (kind !== "ramp" && kind !== "spring") return false;
  return S.level.start.v.x < 0;
}
function removeAt(socketId) {
  if (!S.placements[socketId]) return;
  snapshot();
  delete S.placements[socketId];
  sfx.pop();
  changed();
}
function flipAt(socketId) {
  const p = S.placements[socketId];
  if (!p || (p.kind !== "ramp" && p.kind !== "spring")) return false;
  snapshot();
  p.flip = !p.flip;
  sfx.whoosh();
  changed();
  return true;
}
function selectKind(kind) {
  if (S.phase !== "build" || remaining(kind) <= 0) return;
  S.selectedKind = S.selectedKind === kind ? null : kind;
  sfx.pop();
  renderTray();
  if (S.selectedKind) toast(`Now tap a glowing spot for the ${KINDS[kind].name.toLowerCase()}.`, 2200);
}

function socketCentre(s) {
  return { x: s.x, y: s.air ? s.y : s.y - 30 };
}
function nearestSocket(p, radius = 70) {
  let best = null, bd = radius;
  for (const s of S.level.sockets) {
    const c = socketCentre(s);
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
// Which placed piece is under the pointer (generous, for fingers)
function pieceAt(p) {
  for (const s of S.level.sockets) {
    const pl = S.placements[s.id];
    if (!pl) continue;
    if (pl.kind === "ramp" || pl.kind === "spring") {
      const fb = flipBadgePos(s, pl.kind);
      if (Math.hypot(fb.x - p.x, fb.y - p.y) < 26) return { s, badge: true };
    }
    let hit = false;
    if (pl.kind === "ramp") hit = Math.abs(p.x - s.x) < 95 && Math.abs(p.y - s.y - (p.x - s.x) * Math.tan(pl.flip ? -0.3 : 0.3)) < 34;
    else if (pl.kind === "dominoes") hit = Math.abs(p.x - s.x) < 58 && p.y < s.y + 12 && p.y > s.y - 80;
    else if (pl.kind === "spring") hit = Math.abs(p.x - s.x) < 42 && p.y < s.y + 12 && p.y > s.y - 60;
    else if (pl.kind === "ball") hit = Math.hypot(p.x - s.x, p.y - (s.y - 16)) < 36;
    if (hit) return { s, badge: false };
  }
  return null;
}

// Drag from the tray (or tap to select)
function makeGhost(kind) {
  const g = document.createElement("img");
  g.src = ICONS[kind];
  g.className = "drag-ghost";
  g.alt = "";
  document.body.appendChild(g);
  return g;
}
function trayDown(e, kind) {
  if (S.phase !== "build" || remaining(kind) <= 0) return;
  e.preventDefault();
  audio.unlock();
  const start = { x: e.clientX, y: e.clientY };
  let ghost = null;
  const move = (ev) => {
    const d = Math.hypot(ev.clientX - start.x, ev.clientY - start.y);
    if (!ghost && d > 8) { ghost = makeGhost(kind); S.dragging = { kind }; S.selectedKind = null; renderTray(); }
    if (ghost) {
      ghost.style.left = ev.clientX + "px";
      ghost.style.top = ev.clientY + "px";
      updateHover(ev, kind, false);
    }
  };
  const up = (ev) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    if (!ghost) { selectKind(kind); return; }
    ghost.remove();
    const target = S.hoverSocket;
    S.dragging = null; S.hoverSocket = null; S.ghost = null;
    if (target) place(kind, target);
    else { renderTray(); toast("Drop it on a glowing ⊕ spot.", 1800); }
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}
function updateHover(ev, kind, flip) {
  const p = renderer.toDesign(ev.clientX, ev.clientY);
  const inside = p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H;
  const s = inside ? nearestSocket(p, 80) : null;
  S.hoverSocket = s ? s.id : null;
  S.ghost = s ? { kind, x: s.x, y: s.y, flip: flip ?? defaultFlip(kind) } : null;
}

// Board: tap a spot (place selected), tap a piece (flip), drag a piece (move / remove)
function boardDown(e) {
  if (S.phase !== "build") return;
  e.preventDefault();
  audio.unlock();
  const p = renderer.toDesign(e.clientX, e.clientY);
  const hit = pieceAt(p);
  if (!hit) {
    const s = nearestSocket(p, 55);
    if (s && S.selectedKind) {
      const kind = S.selectedKind;
      S.selectedKind = null;
      place(kind, s.id);
    } else if (s && !S.placements[s.id]) {
      toast("Pick a piece from the tray, or drag one onto this spot.", 2200);
    }
    return;
  }
  const sid = hit.s.id, pl = S.placements[sid];
  const start = { x: e.clientX, y: e.clientY };
  let ghost = null;
  const move = (ev) => {
    if (!ghost && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 10) {
      ghost = makeGhost(pl.kind);
      S.dragging = { kind: pl.kind, from: sid };
    }
    if (ghost) {
      ghost.style.left = ev.clientX + "px";
      ghost.style.top = ev.clientY + "px";
      updateHover(ev, pl.kind, pl.flip);
    }
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    if (!ghost) {
      if (!flipAt(sid)) { sfx.pop(); toast(`${KINDS[pl.kind].name}: ${KINDS[pl.kind].hint} Drag it off to take it back.`, 2600); }
      return;
    }
    ghost.remove();
    const target = S.hoverSocket;
    S.dragging = null; S.hoverSocket = null; S.ghost = null;
    if (target && target !== sid) place(pl.kind, target, sid);
    else if (!target) removeAt(sid);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}

function undo() {
  if (S.phase !== "build" || !S.history.length) return;
  S.placements = JSON.parse(S.history.pop());
  sfx.pop();
  rebuildSim();
  renderTray();
  setPhase("build");
}
function clearAll() {
  if (S.phase !== "build" || !Object.keys(S.placements).length) return;
  snapshot();
  S.placements = {};
  sfx.whoosh();
  changed();
}

// ---------------------------------------------------------------- set it off!
let acc = 0, lastFrame = 0, seenHits = 0;
function launch() {
  if (S.phase !== "build") return;
  audio.unlock();
  S.tries--;
  setTries();
  S.selectedKind = null;
  renderTray();
  setPhase("run");
  rebuildSim();
  S.trail = [];
  S.targetHitAt = 0;
  S.popups = [];
  seenHits = 0;
  S.launchTimeLeft = S.timeLeft;
  const swing = { t: 0 };
  gsap.to(swing, {
    t: 1, duration: 0.22, ease: "power2.in",
    onUpdate: () => { S.malletT = swing.t; },
    onComplete: () => {
      sfx.bonk();
      S.sim.trigger();
      acc = 0;
      lastFrame = performance.now();
      gsap.to(swing, { t: 0.3, duration: 0.5, delay: 0.2, onUpdate: () => { S.malletT = swing.t; } });
    },
  });
}

const HIT_TEXT = { ramp: "Whee!", dominoes: "Clack-clack!", spring: "BOING!", ball: "Bonk!" };
const HIT_SFX = { ramp: () => sfx.whoosh(), dominoes: () => { sfx.clack(); setTimeout(sfx.clack, 120); setTimeout(sfx.clack, 240); }, spring: () => sfx.boing(), ball: () => sfx.bonk() };
const TARGET_TEXT = { bell: "DING DONG!", balloon: "POP!", star: "STAR LIT!" };

function stepRun(now) {
  const sim = S.sim;
  if (!sim.state.triggered) return;
  acc += Math.min(100, now - lastFrame);
  lastFrame = now;
  let n = 0;
  while (acc >= 1000 / 60 && n < 4 && !sim.state.ended) {
    sim.step();
    acc -= 1000 / 60;
    n++;
    if (sim.state.steps % 3 === 0 && sim.starter.position.y < H + 50) S.trail.push({ x: sim.starter.position.x, y: sim.starter.position.y });
  }
  // new links in the chain
  const hits = sim.state.hits;
  while (seenHits < hits.length) {
    const h = hits[seenHits++];
    const it = sim.items.find((i) => i.owner === h.owner);
    const pos = it ? (it.kind === "spring" ? { x: it.x, y: it.y - 50 } : it.bodies[0].position) : { x: 450, y: 280 };
    HIT_SFX[h.kind]?.();
    if (h.owner !== "fixed") {
      const links = hits.slice(0, seenHits).filter((x) => x.owner !== "fixed").length;
      S.popups.push({ text: links > 1 ? `${HIT_TEXT[h.kind]} ×${links}` : HIT_TEXT[h.kind], x: pos.x, y: pos.y - 20, t: now });
      setRideScore(Math.max(S.best?.total || 0, links >= 2 ? 50 : 25));
    }
  }
  if (sim.state.success && !S.targetHitAt) {
    S.targetHitAt = now;
    const T = S.level.target;
    S.popups.push({ text: TARGET_TEXT[T.kind] || "YES!", x: T.x, y: T.y - 50, t: now, colour: "#ffffff" });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      S.sparks.push({ x: T.x, y: T.y, vx: Math.cos(a) * (2 + Math.random() * 3), vy: Math.sin(a) * (2 + Math.random() * 3) - 1, r: 5 + Math.random() * 5, c: ["#f6c453", "#ffffff", "#4fc3f7", "#ef3b4f"][i % 4], t: now, life: 1.2 });
    }
    if (T.kind === "bell") sfx.ding();
    else if (T.kind === "balloon") { sfx.popBalloon(); setTimeout(() => sfx.chime(), 150); }
    else sfx.chime();
  }
  if (sim.state.ended) finishAttempt();
}

function attemptScore(res, timeLeft) {
  const chain = res.links >= 2 ? 50 : res.links === 1 ? 25 : 0;
  const target = res.success ? 30 : 0;
  const fewer = res.success && res.placed <= S.level.par ? 10 : 0;
  const quick = res.success && !S.auto && timeLeft >= CFG.RIDE_TIME[S.ride + 1] / 3 ? 10 : 0;
  return { chain, target, fewer, quick, total: chain + target + fewer + quick, success: res.success, links: res.links, placed: res.placed };
}

function finishAttempt() {
  const res = S.sim.result();
  const sc = attemptScore(res, S.launchTimeLeft);
  if (!S.best || sc.total > S.best.total) S.best = sc;
  setRideScore(S.best.total);
  setPhase("result");
  const outOfTime = S.timeLeft <= 0 || S.auto;
  if (sc.success || (S.best.success && (S.tries === 0 || outOfTime))) {
    if (!sc.success) sfx.sad();
    setTimeout(() => rideCard(true), 900);
  } else if (S.best.success) {
    // A better try didn't work out: keep the earlier success and offer the choice again.
    sfx.sad();
    setTimeout(() => rideCard(true), 700);
  } else if (S.tries > 0 && !outOfTime) {
    sfx.sad();
    setTimeout(() => {
      toast(res.links ? `So close! Change something and try again. ${S.tries} ${S.tries === 1 ? "try" : "tries"} left.` : `Nothing joined the chain yet. Try a different piece or spot! ${S.tries} ${S.tries === 1 ? "try" : "tries"} left.`, 3200);
      rebuildSim();
      setPhase("build");
    }, 700);
  } else {
    sfx.sad();
    setTimeout(() => rideCard(false), 900);
  }
}

function rideCard(success) {
  const b = S.best;
  const last = S.ride === LEVELS.length - 1;
  $("cardTitle").textContent = success ? (TARGET_TEXT[S.level.target.kind] ? `${TARGET_TEXT[S.level.target.kind]} You did it!` : "You did it!") : b.total ? "Ride over! Nice work." : "Ride over! On to the next one.";
  const row = (label, pts, max) => `<li class="${pts ? "" : "miss"}"><span>${label}</span><b>${pts ? "+" + pts : "0"}</b></li>`;
  $("cardPoints").innerHTML = [
    row(b.links >= 2 ? `Chain reaction (${b.links} pieces joined in)` : b.links === 1 ? "Chain started (1 piece joined in)" : "Chain reaction", b.chain),
    row("Reached the target", b.target),
    row(`Fewer pieces bonus (${S.level.par} or fewer)`, b.fewer),
    row("Speedy bonus", b.quick),
  ].join("");
  $("cardTotal").textContent = "0";
  const actions = $("cardActions");
  actions.innerHTML = "";
  const next = document.createElement("button");
  next.className = "btn btn-gold";
  next.textContent = last ? "See my score ›" : "Next ride ›";
  next.addEventListener("click", () => { sfx.pop(); nextRide(); });
  if (success && b.total < 100 && S.tries > 0 && S.timeLeft > 0) {
    const again = document.createElement("button");
    again.className = "btn btn-ghost";
    again.textContent = "Try for more points";
    again.addEventListener("click", () => { sfx.pop(); $("rideCard").hidden = true; S.targetHitAt = 0; rebuildSim(); setPhase("build"); });
    actions.append(again);
  }
  actions.append(next);
  const card = $("rideCard");
  card.hidden = false;
  gsap.fromTo(card, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.8)" });
  gsap.from("#cardPoints li", { x: -20, opacity: 0, duration: 0.3, stagger: 0.12, delay: 0.25 });
  const counter = { v: 0 };
  gsap.to(counter, { v: b.total, duration: 0.9, delay: 0.5, ease: "power1.out", onUpdate: () => { $("cardTotal").textContent = Math.round(counter.v); sfx.count(); } });
  if (success) {
    setTimeout(() => sfx.fanfare(), 200);
    const r = card.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + 30, ["★", "✦", "❄"], 18);
  }
  setTimeout(() => next.focus({ preventScroll: true }), 500);
}

function nextRide() {
  S.rides.push({ ...S.best, title: S.level.title });
  $("rideCard").hidden = true;
  if (S.ride < LEVELS.length - 1) startRide(S.ride + 1);
  else finishGame();
}

// ---------------------------------------------------------------- results
function achievement(score) {
  if (score >= 90) return "Chain Reaction Champion!";
  if (score >= 70) return "Carnival Contraption Pro!";
  if (score >= 45) return "Domino Daredevil!";
  if (score >= 20) return "Bauble Bouncer!";
  return "Carnival Explorer!";
}
async function finishGame() {
  setPhase("idle");
  const scores = S.rides.map((r) => r.total);
  const total = Math.round(scores.reduce((a, b) => a + b, 0) / LEVELS.length);
  const targets = S.rides.filter((r) => r.success).length;
  const bestChain = Math.max(0, ...S.rides.map((r) => r.links));
  const seconds = Math.round((performance.now() - S.startedAt) / 1000);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const title = achievement(total);
  S.result = {
    timestamp: new Date().toISOString(),
    name: S.player.name,
    quizmasId: S.player.id,
    game: CFG.GAME_ID,
    gameName: CFG.GAME_NAME,
    category: CFG.CATEGORY,
    official: false,
    attempt: S.play,
    score: total,
    maxScore: 100,
    level: title,
    breakdown: S.rides.map((r, i) => `Ride ${i + 1} ${r.total}/100`).join(" · "),
    progress: `${targets}/${LEVELS.length} targets hit · best chain ${bestChain}`,
    ride1: scores[0], ride2: scores[1], ride3: scores[2], targetsHit: targets, bestChain,
    totalSeconds: seconds,
    device: coarse ? (Math.min(screen.width, screen.height) < 700 ? "phone" : "tablet") : "computer",
    track: FROM || "",
  };
  show("results");
  $("achievement").textContent = title;
  $("resultsName").textContent = `${S.player.name} · Play #${S.play}`;
  $("statTargets").textContent = `${targets}/${LEVELS.length}`;
  $("statChain").textContent = String(bestChain);
  $("statTime").textContent = seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
  $("rideList").innerHTML = S.rides.map((r, i) => `<li><span class="ok ${r.success ? "" : "no"}">${r.success ? "✓" : "–"}</span><em>Ride ${i + 1}: ${r.title}</em><b>${r.total}</b></li>`).join("");
  const counter = { v: 0 };
  $("scoreNum").textContent = "0";
  gsap.to(counter, { v: total, duration: 1.4, delay: 0.5, ease: "power2.out", onUpdate: () => { $("scoreNum").textContent = Math.round(counter.v); }, onComplete: () => sfx.fanfare() });
  gsap.from(".trophy", { scale: 0, rotation: -30, duration: 0.7, delay: 0.3, ease: "back.out(2.5)" });
  gsap.from("#achievement", { y: 20, opacity: 0, duration: 0.5, delay: 0.5 });
  setTimeout(() => confetti($("confetti"), 3.5), 600);
  const back = backLink();
  $("backBtn").hidden = !back;
  if (back) $("backBtn").textContent = `Back to ${back.name}`;
  $("saveStatus").className = "save-status";
  $("saveStatus").textContent = "Saving your score…";
  const status = await saveResult(S.result);
  $("saveStatus").classList.toggle("ok", status === "sent");
  $("saveStatus").textContent = status === "sent" ? "✓ Score saved to the Quizmas fun leaderboard." : status === "queued" ? "✓ Score saved on this device. It will be sent to Quizmas automatically." : "✓ Saved on this device. It will upload when you're back online.";
}

function backLink() {
  const url = CFG.TRACK_LINKS[FROM];
  if (url) return { url, name: CFG.TRACK_NAMES[FROM] || "my track" };
  if (document.referrer && history.length > 1) return { url: null, name: "my track" };
  return null;
}

// ---------------------------------------------------------------- frame loop
function frame(now) {
  if (current === "game" && renderer && S.sim) {
    if (S.phase === "run") stepRun(now);
    renderer.draw(S.sim, {
      level: S.level, placements: S.placements, phase: S.phase === "run" || S.phase === "result" ? "run" : S.phase,
      hoverSocket: S.hoverSocket, selectedKind: S.selectedKind, dragging: S.dragging, ghost: S.ghost,
      trail: S.trail, popups: S.popups, sparks: S.sparks, targetHitAt: S.targetHitAt, malletT: S.malletT,
    }, now);
    if (S.popups.length > 12) S.popups.splice(0, S.popups.length - 12);
    S.sparks = S.sparks.filter((s) => now - s.t < s.life * 1000);
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- boot
function boot() {
  startSnow($("snow"));
  ICONS = Object.fromEntries(KIND_ORDER.map((k) => [k, iconFor(k)]));
  setupEntry();
  $("startBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    audio.unlock();
    sfx.pop();
    show("entry");
    setTimeout(() => $("playerName").focus(), 450);
  });
  $("meetBtn").addEventListener("click", () => { sfx.pop(); startPlay(); });
  $("goBtn").addEventListener("click", launch);
  $("undoBtn").addEventListener("click", undo);
  $("resetBtn").addEventListener("click", clearAll);
  $("board").addEventListener("pointerdown", boardDown);
  $("againBtn").addEventListener("click", () => { sfx.pop(); startPlay(); });
  $("backBtn").addEventListener("click", () => {
    const b = backLink();
    if (b?.url) location.href = b.url + (b.url.includes("?") ? "&" : "?") + "from=fun";
    else history.back();
  });
  $("muteBtn").addEventListener("click", () => {
    const m = !audio.isMuted();
    audio.setMuted(m);
    $("muteBtn").firstChild.textContent = m ? "🔇" : "🔊";
    $("muteBtn").setAttribute("aria-label", m ? "Sound off" : "Sound on");
  });
  window.addEventListener("keydown", (e) => {
    if (current !== "game") return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
  });
  if (window.ResizeObserver) new ResizeObserver(() => { if (current === "game") layoutBoard(); }).observe(document.querySelector(".play"));
  window.addEventListener("orientationchange", () => setTimeout(() => { if (current === "game") layoutBoard(); }, 300));
  startClock();
  requestAnimationFrame(frame);
  flush();
  // Staff testing shortcut: ?skip=1 jumps straight into the rides.
  if (PARAMS.get("skip") === "1") {
    current = "loader";
    $("loader").classList.remove("active");
    S.player = { name: "Test Player", id: "TEST-1" };
    current = "entry";
    startPlay();
    return;
  }
  runLoader().then(showIntro);
}
boot();
