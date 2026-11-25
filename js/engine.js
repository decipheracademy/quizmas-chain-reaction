// Chain Reaction Carnival · physics world (Matter.js).
// The same file runs in the browser and in the automated level tests, so Matter is passed in.

export const W = 900;
export const H = 560;
export const BALL_R = 16;
export const RAMP = { len: 170, th: 14, angle: 0.3 };
export const SPRING = { w: 56, vx: 3.6, vy: 12.5 };
export const DOMINO = { w: 12, h: 58, gap: 30, count: 3 };
const STEP_MS = 1000 / 60;
const MAX_STEPS = 60 * 12;

export const KINDS = {
  ramp: { name: "Ramp", hint: "Catches a ball and rolls it on. Tap to flip it." },
  dominoes: { name: "Dominoes", hint: "Knock one and they all fall." },
  spring: { name: "Spring", hint: "Bounces things up high. Tap to flip it." },
  ball: { name: "Bauble ball", hint: "Rolls away when something hits it." },
};

// placements: { socketId: { kind, flip } }
// Dominoes grip the floor but slide easily against each other, like real ones.
function tunePairs(M) {
  if (M.Pair.__qzTuned) return;
  const original = M.Pair.update;
  M.Pair.update = function (pair, collision, timestamp) {
    original(pair, collision, timestamp);
    if (collision.parentA.label === "domino" && collision.parentB.label === "domino") pair.friction = 0.04;
  };
  M.Pair.__qzTuned = true;
}

export function createSim(M, level, placements = {}) {
  tunePairs(M);
  const { Engine, Bodies, Body, Composite, Events } = M;
  const engine = Engine.create({ gravity: { x: 0, y: 1 }, positionIterations: 12, velocityIterations: 10 });
  engine.enableSleeping = false;
  const world = engine.world;
  const items = [];
  const statics = [];
  const add = (b) => { Composite.add(world, b); return b; };
  const stat = (x, y, w, h, angle = 0, extra = {}) => {
    const b = add(Bodies.rectangle(x, y, w, h, { isStatic: true, angle, friction: 1, frictionStatic: 2, restitution: 0.05, qzW: w, qzH: h, ...extra }));
    statics.push(b);
    return b;
  };

  // Walls and floor
  stat(W / 2, H + 30, W + 400, 60, 0, { label: "floor", render: { hidden: true } });
  stat(-30, H / 2, 60, H * 3, 0, { label: "wall" });
  stat(W + 30, H / 2, 60, H * 3, 0, { label: "wall" });
  for (const p of level.platforms) {
    const cx = p.cx ?? p.l + p.w / 2, cy = p.cy ?? p.t + p.h / 2;
    stat(cx, cy, p.w, p.h, p.a || 0, { label: p.label || "platform", style: p.style || "plank" });
  }

  const ballBody = (x, y, extra = {}) => Bodies.circle(x, y, BALL_R, {
    restitution: 0.1, friction: 0, frictionStatic: 0, frictionAir: 0.001, density: 0.004, label: "ball", ...extra,
  });

  function makeItem(kind, x, y, flip, owner) {
    const it = { kind, owner, flip: !!flip, bodies: [], activated: false, x, y };
    if (kind === "ramp") {
      const a = flip ? -RAMP.angle : RAMP.angle;
      it.bodies.push(add(Bodies.rectangle(x, y, RAMP.len, RAMP.th, { isStatic: true, angle: a, friction: 0.05, restitution: 0.02, label: "ramp", qzW: RAMP.len, qzH: RAMP.th })));
    } else if (kind === "spring") {
      it.dir = flip ? -1 : 1;
      it.bodies.push(add(Bodies.rectangle(x, y - 9, SPRING.w, 18, { isStatic: true, label: "springBase", friction: 0.3, qzW: SPRING.w, qzH: 18 })));
      it.pad = add(Bodies.rectangle(x, y - 24, SPRING.w - 6, 12, { isStatic: true, isSensor: true, label: "springPad" }));
      it.bodies.push(it.pad);
      it.squash = 0;
    } else if (kind === "dominoes") {
      for (let i = 0; i < DOMINO.count; i++) {
        const dx = (i - (DOMINO.count - 1) / 2) * DOMINO.gap;
        it.bodies.push(add(Bodies.rectangle(x + dx, y - DOMINO.h / 2, DOMINO.w, DOMINO.h, {
          density: 0.0016, friction: 1, frictionStatic: 2, restitution: 0, label: "domino", chamfer: { radius: 2 }, qzW: DOMINO.w, qzH: DOMINO.h, qzColour: i,
        })));
      }
    } else if (kind === "ball") {
      it.bodies.push(add(ballBody(x, y - BALL_R)));
    }
    it.bodies.forEach((b) => { b.item = it; });
    items.push(it);
    return it;
  }

  // Fixed carnival pieces that are part of the level
  for (const f of level.fixed || []) makeItem(f.kind, f.x, f.y, f.flip, "fixed");
  // The student's pieces
  for (const s of level.sockets) {
    const p = placements[s.id];
    if (p) makeItem(p.kind, s.x, s.y, p.flip, s.id);
  }
  // Starting ball and target
  const starter = add(ballBody(level.start.x, level.start.y - BALL_R, { label: "ball" }));
  starter.isStarter = true;
  const T = level.target;
  const target = add(Bodies.rectangle(T.x, T.y, T.w, T.h, { isStatic: true, isSensor: true, label: "target", qzW: T.w, qzH: T.h }));

  const state = { lastEvent: 0, steps: 0, triggered: false, success: false, successStep: -1, ended: false, still: 0, hits: [], links: 0 };
  const dynamic = () => Composite.allBodies(world).filter((b) => !b.isStatic);
  const isMoving = (b) => b.speed > 0.12 || Math.abs(b.angularVelocity) > 0.004;
  const isHitting = (b) => b.speed > 0.35 || Math.abs(b.angularVelocity) > 0.02;

  function activate(it) {
    if (!it || it.activated) return;
    it.activated = true;
    state.lastEvent = state.steps;
    state.hits.push({ kind: it.kind, owner: it.owner, step: state.steps });
  }

  Events.on(engine, "collisionStart", (ev) => {
    for (const pair of ev.pairs) {
      for (const [a, b] of [[pair.bodyA, pair.bodyB], [pair.bodyB, pair.bodyA]]) {
        if (a.label === "target" && !b.isStatic && !state.success && state.triggered) {
          state.success = true;
          state.successStep = state.steps;
          state.successBody = b;
        }
        if (a.label === "springPad" && !b.isStatic) {
          const it = a.item;
          // The spring catches the object in its centre first, so every bounce flies the same way.
          if (b.label === "ball") Body.setPosition(b, { x: a.position.x, y: Math.min(b.position.y, a.position.y - BALL_R + 4) });
          Body.setVelocity(b, { x: it.dir * SPRING.vx, y: -SPRING.vy });
          Body.setAngularVelocity(b, b.angularVelocity * 0.2);
          it.squash = 1;
          activate(it);
        }
        if (a.label === "ramp" && !b.isStatic && isHitting(b)) activate(a.item);
        // A ball or domino counts once something moving hits it
        if ((a.label === "ball" || a.label === "domino") && a.item && !b.isStatic && isHitting(b)) activate(a.item);
      }
    }
  });

  function trigger() {
    state.triggered = true;
    state.lastEvent = state.steps;
    Body.setVelocity(starter, level.start.v);
  }

  function step() {
    if (state.ended) return;
    Engine.update(engine, STEP_MS);
    state.steps++;
    for (const it of items) {
      if (it.squash) it.squash = Math.max(0, it.squash - 0.08);
      if (it.kind === "dominoes" && !it.activated && it.bodies.some((d) => Math.abs(d.angle) > 0.35)) activate(it);
    }
    for (const b of dynamic()) {
      if (b.position.y > H + 200) Composite.remove(world, b);
      // Snow on the ground slows rolling baubles down
      else if (b.label === "ball" && b.position.y > H - BALL_R - 3) Body.setVelocity(b, { x: b.velocity.x * 0.965, y: b.velocity.y });
    }
    state.links = items.filter((i) => i.owner !== "fixed" && i.activated).length;
    if (!state.triggered) return;
    const moving = dynamic().some(isMoving);
    state.still = moving ? 0 : state.still + 1;
    if (state.success && state.steps - state.successStep > 80) state.ended = true;
    if (state.still > 70 && state.steps > 30) state.ended = true;
    if (state.steps > MAX_STEPS) state.ended = true;
    // Nothing new has happened for a while: the chain has stopped
    if (!state.success && state.steps - state.lastEvent > 200) state.ended = true;
  }

  // Run instantly to the end (used by tests)
  function runToEnd() {
    trigger();
    while (!state.ended) step();
    return result();
  }

  function result() {
    return {
      success: state.success,
      links: state.links,
      placed: items.filter((i) => i.owner !== "fixed").length,
      chain: [...state.hits],
      steps: state.steps,
    };
  }

  return { engine, world, items, statics, starter, target, state, trigger, step, runToEnd, result, M };
}
