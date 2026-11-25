// The three carnival rides. Coordinates are in a 900 × 560 play area.
// sockets: build spots (glowing ⊕) where the student drops objects. tray: how many of each object they get.
export const LEVELS = [
  {
    id: "bell",
    title: "Ring the Jingle Bell",
    goal: "Get the bauble to ring the giant jingle bell.",
    par: 2,
    tray: { ramp: 1, dominoes: 1, spring: 1, ball: 1 },
    start: { x: 50, y: 160, v: { x: 4.5, y: 0 } },
    platforms: [
      { l: 0, t: 160, w: 250, h: 20, style: "start" },
      { l: 500, t: 420, w: 400, h: 24 },
      { l: 680, t: 396, w: 12, h: 26, style: "post" },
    ],
    sockets: [
      { id: "A", x: 440, y: 330, air: true },
      { id: "B", x: 620, y: 420 },
    ],
    target: { x: 715, y: 372, w: 50, h: 52, kind: "bell", base: 420 },
  },
  {
    id: "balloon",
    title: "Pop the Present Balloon",
    goal: "Bounce the bauble up to pop the present balloon.",
    par: 2,
    tray: { ramp: 1, dominoes: 1, spring: 1, ball: 1 },
    start: { x: 860, y: 130, v: { x: -4.5, y: 0 } },
    platforms: [
      { l: 650, t: 130, w: 250, h: 20, style: "start" },
      { l: 140, t: 450, w: 250, h: 24 },
    ],
    sockets: [
      { id: "A", x: 460, y: 300, air: true },
      { id: "B", x: 205, y: 450 },
      { id: "C", x: 400, y: 560 },
    ],
    target: { x: 62, y: 168, w: 74, h: 84, kind: "balloon" },
  },
  {
    id: "star",
    title: "Light the Christmas Star",
    goal: "Send a bauble flying up to light the star.",
    par: 4,
    tray: { ramp: 1, dominoes: 1, spring: 1, ball: 1 },
    start: { x: 40, y: 120, v: { x: 4.5, y: 0 } },
    platforms: [
      { l: 0, t: 120, w: 220, h: 20, style: "start" },
      { l: 470, t: 430, w: 194, h: 24 },
      { l: 664, t: 406, w: 56, h: 48 },
      { l: 572, t: 348, w: 92, h: 14, style: "roof" },
    ],
    sockets: [
      { id: "A", x: 410, y: 340, air: true },
      { id: "B", x: 600, y: 430 },
      { id: "C", x: 688, y: 406 },
      { id: "D", x: 790, y: 560 },
    ],
    target: { x: 560, y: 286, w: 74, h: 74, kind: "star" },
    deco: "tree",
  },
];

// "Meet the Objects": four tiny looping scenes, one per object. view = the part of the world each card shows.
const floor = (t, l = 0, w = 900) => ({ l, t, w, h: 24, style: "plank" });
export const DEMOS = [
  {
    kind: "ramp", label: "Ramps roll it on",
    view: { x: 20, y: 30, w: 400, h: 240 },
    level: { par: 0, tray: {}, sockets: [], start: { x: 60, y: 90, v: { x: 2.6, y: 0 } },
      platforms: [{ l: 30, t: 90, w: 80, h: 16, style: "start" }, floor(262, 20, 400)],
      fixed: [{ kind: "ramp", x: 230, y: 190 }], target: { x: -500, y: -500, w: 1, h: 1 } },
  },
  {
    kind: "dominoes", label: "Dominoes knock in a row",
    view: { x: 20, y: 30, w: 400, h: 240 },
    level: { par: 0, tray: {}, sockets: [], start: { x: 60, y: 250, v: { x: 6, y: 0 } },
      platforms: [floor(250, 20, 400)],
      fixed: [{ kind: "dominoes", x: 220, y: 250 }], target: { x: -500, y: -500, w: 1, h: 1 } },
  },
  {
    kind: "spring", label: "Springs bounce it up",
    view: { x: 20, y: 30, w: 400, h: 240 },
    level: { par: 0, tray: {}, sockets: [], start: { x: 60, y: 120, v: { x: 2.2, y: 0 } },
      platforms: [{ l: 30, t: 120, w: 80, h: 16, style: "start" }, floor(262, 20, 400)],
      fixed: [{ kind: "spring", x: 170, y: 262 }], target: { x: -500, y: -500, w: 1, h: 1 } },
  },
  {
    kind: "ball", label: "Baubles roll when hit",
    view: { x: 20, y: 30, w: 400, h: 240 },
    level: { par: 0, tray: {}, sockets: [], start: { x: 60, y: 250, v: { x: 5, y: 0 } },
      platforms: [floor(250, 20, 400)],
      fixed: [{ kind: "ball", x: 200, y: 250 }], target: { x: -500, y: -500, w: 1, h: 1 } },
  },
];
