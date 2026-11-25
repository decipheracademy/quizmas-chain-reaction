// Chain Reaction Carnival · drawing. Everything is drawn on a canvas in the 900 × 560 design space.
import { W, H, BALL_R, RAMP, SPRING, DOMINO } from "./engine.js";

export const C = {
  navy: "#0b2f6b", deep: "#061a3a", sky: "#4fc3f7", sky2: "#29b6f6", white: "#ffffff",
  gold: "#f6c453", goldDark: "#b97c10", red: "#ef3b4f", redDark: "#a3162a", green: "#2ec27e",
  purple: "#8e5cf7", orange: "#ff9f43", pink: "#ff6fa8",
};
const GIFT = [C.red, C.green, C.purple, C.orange, C.sky2, C.pink];
const BAUBLE = [["#b388ff", "#6a1bd9"], ["#7ef0b4", "#11885a"], ["#ffd36e", "#c27a06"], ["#7fd8ff", "#0b6fb3"]];

function rr(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------- Background (drawn once per size) ----------
function drawBackground(g) {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0a2a63");
  sky.addColorStop(0.55, "#0b2f6b");
  sky.addColorStop(1, "#071d45");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // Tent stripes fanning from the top centre
  g.save();
  for (let i = -9; i <= 9; i++) {
    g.beginPath();
    g.moveTo(W / 2 + i * 14, -40);
    g.lineTo(W / 2 + i * 120 - 60, H);
    g.lineTo(W / 2 + i * 120 + 0, H);
    g.lineTo(W / 2 + i * 14 + 7, -40);
    g.closePath();
    g.fillStyle = i % 2 ? "rgba(79,195,247,.07)" : "rgba(255,255,255,.035)";
    g.fill();
  }
  g.restore();
  // Soft spotlights
  for (const [x, y, r, a] of [[180, 120, 260, 0.09], [720, 140, 280, 0.08], [450, 560, 380, 0.06]]) {
    const s = g.createRadialGradient(x, y, 10, x, y, r);
    s.addColorStop(0, `rgba(122,214,255,${a})`);
    s.addColorStop(1, "rgba(122,214,255,0)");
    g.fillStyle = s;
    g.fillRect(0, 0, W, H);
  }
  // Distant snowy crowd silhouettes / ground glow
  g.fillStyle = "rgba(255,255,255,.06)";
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 30) g.lineTo(x, H - 26 - Math.sin(x * 0.05) * 8 - (x % 90 === 0 ? 10 : 0));
  g.lineTo(W, H);
  g.fill();
  // Snowy ground
  const snow = g.createLinearGradient(0, H - 14, 0, H);
  snow.addColorStop(0, "#ffffff");
  snow.addColorStop(1, "#cfe9fb");
  g.fillStyle = snow;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, H - 4 - Math.sin(x * 0.07) * 2.5);
  g.lineTo(W, H);
  g.closePath();
  g.fill();
  // Valance (scalloped tent edge)
  const vh = 26;
  for (let x = 0; x < W; x += 50) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 50, 0);
    g.lineTo(x + 50, vh - 8);
    g.quadraticCurveTo(x + 25, vh + 14, x, vh - 8);
    g.closePath();
    g.fillStyle = (x / 50) % 2 ? C.white : C.sky2;
    g.fill();
  }
  g.fillStyle = C.navy;
  g.fillRect(0, 0, W, 6);
}

// ---------- Pieces ----------
function drawPlatform(g, b) {
  const w = b.qzW, h = b.qzH, style = b.style;
  if (!w || b.label === "wall" || b.label === "floor") return;
  g.save();
  g.translate(b.position.x, b.position.y);
  g.rotate(b.angle);
  if (style === "start") {
    rr(g, -w / 2, -h / 2, w, h, h / 2);
    g.fillStyle = C.white;
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = C.red;
    for (let x = -w / 2 - 40; x < w / 2 + 40; x += 22) {
      g.beginPath();
      g.moveTo(x, h / 2);
      g.lineTo(x + 11, h / 2);
      g.lineTo(x + 11 + h, -h / 2);
      g.lineTo(x + h, -h / 2);
      g.fill();
    }
    g.restore();
    g.lineWidth = 2;
    g.strokeStyle = C.redDark;
    rr(g, -w / 2, -h / 2, w, h, h / 2);
    g.stroke();
  } else if (style === "post") {
    rr(g, -w / 2, -h / 2, w, h, 4);
    const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0);
    gr.addColorStop(0, C.goldDark);
    gr.addColorStop(0.5, "#ffe9a6");
    gr.addColorStop(1, C.goldDark);
    g.fillStyle = gr;
    g.fill();
  } else if (style === "roof") {
    rr(g, -w / 2, -h / 2, w, h, 4);
    g.fillStyle = C.white;
    g.fill();
    for (let x = -w / 2; x < w / 2; x += 23) {
      g.beginPath();
      g.moveTo(x, h / 2);
      g.quadraticCurveTo(x + 11.5, h / 2 + 12, x + 23, h / 2);
      g.fillStyle = Math.round((x + w / 2) / 23) % 2 ? C.white : C.red;
      g.fill();
    }
    g.fillStyle = C.red;
    for (let x = -w / 2; x < w / 2; x += 46) g.fillRect(x, -h / 2, 23, h);
  } else {
    // Sky-blue carnival girder with a white top edge
    rr(g, -w / 2, -h / 2, w, h, 6);
    const gr = g.createLinearGradient(0, -h / 2, 0, h / 2);
    gr.addColorStop(0, "#5fd0ff");
    gr.addColorStop(1, "#1976d2");
    g.fillStyle = gr;
    g.fill();
    g.fillStyle = "rgba(255,255,255,.9)";
    rr(g, -w / 2, -h / 2, w, 5, 3);
    g.fill();
    g.fillStyle = "rgba(6,26,58,.35)";
    for (let x = -w / 2 + 14; x < w / 2 - 6; x += 28) {
      g.beginPath();
      g.arc(x, 3, 2.4, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}

export function drawRamp(g, x, y, angle) {
  const w = RAMP.len, h = RAMP.th;
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.shadowColor = "rgba(0,0,0,.35)";
  g.shadowBlur = 6;
  g.shadowOffsetY = 3;
  rr(g, -w / 2, -h / 2, w, h, h / 2);
  g.fillStyle = C.white;
  g.fill();
  g.shadowColor = "transparent";
  g.save();
  g.clip();
  g.fillStyle = C.red;
  for (let sx = -w / 2 - 30; sx < w / 2 + 30; sx += 20) {
    g.beginPath();
    g.moveTo(sx, h / 2);
    g.lineTo(sx + 9, h / 2);
    g.lineTo(sx + 9 + h, -h / 2);
    g.lineTo(sx + h, -h / 2);
    g.fill();
  }
  g.fillStyle = "rgba(255,255,255,.45)";
  g.fillRect(-w / 2, -h / 2, w, 3);
  g.restore();
  g.lineWidth = 2;
  g.strokeStyle = C.redDark;
  rr(g, -w / 2, -h / 2, w, h, h / 2);
  g.stroke();
  // Little arrow showing which way it rolls
  g.fillStyle = "rgba(255,255,255,.95)";
  g.restore();
}

export function drawGiftDomino(g, x, y, angle, colour) {
  const w = DOMINO.w, h = DOMINO.h;
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  rr(g, -w / 2, -h / 2, w, h, 2.5);
  g.fillStyle = GIFT[colour % GIFT.length];
  g.fill();
  g.fillStyle = "rgba(255,255,255,.22)";
  g.fillRect(-w / 2, -h / 2, 3, h);
  g.fillStyle = C.gold;
  g.fillRect(-1.5, -h / 2, 3, h);
  g.fillRect(-w / 2, -4, w, 4);
  // bow
  g.beginPath();
  g.ellipse(-4, -h / 2 - 2, 4, 2.6, -0.5, 0, Math.PI * 2);
  g.ellipse(4, -h / 2 - 2, 4, 2.6, 0.5, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function drawSpring(g, x, y, dir, squash = 0) {
  // x, y = bottom centre
  const w = SPRING.w;
  g.save();
  g.translate(x, y);
  // base
  rr(g, -w / 2, -18, w, 18, 5);
  g.fillStyle = "#123a7a";
  g.fill();
  g.fillStyle = C.sky;
  g.beginPath();
  // arrow on the base shows which way it bounces
  g.moveTo(dir * 14, -9);
  g.lineTo(dir * 2, -15);
  g.lineTo(dir * 2, -3);
  g.closePath();
  g.fill();
  g.fillRect(dir > 0 ? -12 : 2, -11, 10, 4);
  // coil
  const top = -36 + squash * 10;
  g.strokeStyle = "#dfe9f5";
  g.lineWidth = 3;
  g.beginPath();
  const turns = 5;
  for (let i = 0; i <= turns * 2; i++) {
    const yy = -18 + ((top + 6 + 18) * i) / (turns * 2);
    g.lineTo(i % 2 ? w / 2 - 12 : -w / 2 + 12, yy);
  }
  g.stroke();
  // pad (tilted slightly the way it throws)
  g.save();
  g.translate(0, top);
  g.rotate(dir * 0.12);
  rr(g, -w / 2 + 2, -6, w - 4, 12, 6);
  g.fillStyle = C.red;
  g.fill();
  g.fillStyle = "rgba(255,255,255,.5)";
  rr(g, -w / 2 + 8, -4, w - 16, 3, 2);
  g.fill();
  g.restore();
  g.restore();
}

export function drawBauble(g, x, y, spin, palette, starter = false) {
  const r = BALL_R;
  g.save();
  g.translate(x, y);
  const [light, dark] = starter ? ["#ff7a8a", "#b0142c"] : palette;
  const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, 2, 0, 0, r);
  gr.addColorStop(0, "#ffffff");
  gr.addColorStop(0.25, light);
  gr.addColorStop(1, dark);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fill();
  // rotating band so you can see it roll
  g.save();
  g.rotate(spin);
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = starter ? C.gold : "rgba(255,255,255,.7)";
  g.fillRect(-r, -3, r * 2, 6);
  g.fillStyle = starter ? "#fff3c4" : "rgba(255,255,255,.9)";
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.arc(i * 6, 0, 1.4, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  // shine
  g.fillStyle = "rgba(255,255,255,.75)";
  g.beginPath();
  g.ellipse(-r * 0.38, -r * 0.42, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2);
  g.fill();
  if (starter) {
    g.strokeStyle = "rgba(255,255,255,.9)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(0, 0, r + 0.5, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();
}

function star(g, x, y, r1, r2, n = 5, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = rot + (i * Math.PI) / n;
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.closePath();
}

function drawTarget(g, level, ui, time) {
  const T = level.target;
  if (!T || T.x < 0) return;
  const hit = ui.targetHitAt ? (time - ui.targetHitAt) / 1000 : -1;
  g.save();
  g.translate(T.x, T.y);
  // pulsing "aim here" ring while building
  if (hit < 0 && ui.phase !== "run") {
    const p = (time / 900) % 1;
    g.strokeStyle = `rgba(246,196,83,${0.7 * (1 - p)})`;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(0, 0, 34 + p * 26, 0, Math.PI * 2);
    g.stroke();
  }
  if (T.kind === "bell") {
    if (T.base) {
      // carnival bell stand
      const px = 44, topY = -T.h / 2 - 22, baseY = T.base - T.y;
      g.strokeStyle = C.gold;
      g.lineWidth = 6;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(px, baseY);
      g.lineTo(px, topY);
      g.lineTo(0, topY);
      g.stroke();
      g.fillStyle = C.gold;
      rr(g, px - 12, baseY - 6, 24, 6, 3);
      g.fill();
      g.lineCap = "butt";
    }
    const swing = hit >= 0 ? Math.sin(hit * 14) * Math.exp(-hit * 1.6) * 0.6 : Math.sin(time / 700) * 0.04;
    // stand
    g.strokeStyle = C.gold;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(0, -T.h / 2 - 22);
    g.lineTo(0, -26);
    g.stroke();
    g.rotate(swing);
    g.translate(0, -26);
    const gr = g.createLinearGradient(-24, 0, 24, 0);
    gr.addColorStop(0, C.goldDark);
    gr.addColorStop(0.45, "#ffe7a0");
    gr.addColorStop(1, C.goldDark);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(-6, 0);
    g.bezierCurveTo(-18, 4, -16, 34, -27, 44);
    g.lineTo(27, 44);
    g.bezierCurveTo(16, 34, 18, 4, 6, 0);
    g.closePath();
    g.fill();
    rr(g, -29, 41, 58, 7, 3);
    g.fill();
    g.fillStyle = C.goldDark;
    g.beginPath();
    g.arc(0, 52, 6, 0, Math.PI * 2);
    g.fill();
    // bow
    g.fillStyle = C.red;
    g.beginPath();
    g.ellipse(-10, 2, 10, 6, -0.4, 0, Math.PI * 2);
    g.ellipse(10, 2, 10, 6, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillRect(-3, -2, 6, 8);
    if (hit >= 0 && hit < 1.4) {
      g.strokeStyle = `rgba(255,255,255,${1 - hit / 1.4})`;
      g.lineWidth = 3;
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.arc(0, 26, 40 + k * 12 + hit * 30, s > 0 ? -0.5 : Math.PI - 0.5 + 1, s > 0 ? 0.5 : Math.PI + 0.5);
        g.stroke();
      }
    }
  } else if (T.kind === "balloon") {
    if (hit < 0) {
      const bob = Math.sin(time / 600) * 4;
      g.strokeStyle = "rgba(255,255,255,.7)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(0, 34 + bob);
      g.quadraticCurveTo(10, 70, 0, 110);
      g.stroke();
      const gr = g.createRadialGradient(-10, -14 + bob, 4, 0, bob, 40);
      gr.addColorStop(0, "#ff9aa8");
      gr.addColorStop(1, "#c8102e");
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(0, bob, 30, 36, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(-5, 35 + bob);
      g.lineTo(5, 35 + bob);
      g.lineTo(0, 30 + bob);
      g.fill();
      g.fillStyle = "rgba(255,255,255,.55)";
      g.beginPath();
      g.ellipse(-11, -14 + bob, 6, 10, -0.5, 0, Math.PI * 2);
      g.fill();
      // little present tied below
      g.fillStyle = C.green;
      rr(g, -14, 110, 28, 22, 3);
      g.fill();
      g.fillStyle = C.gold;
      g.fillRect(-2, 110, 4, 22);
      g.fillRect(-14, 119, 28, 4);
    } else {
      // pop! the present falls open
      // the present drops to the snow and bounces open
      const floorDrop = H - 4 - 22 - (T.y + 110);
      const drop = Math.min(floorDrop, 700 * hit * hit);
      const landed = drop >= floorDrop;
      g.save();
      g.translate(0, 110 + drop);
      g.fillStyle = C.green;
      rr(g, -14, 0, 28, 22, 3);
      g.fill();
      g.fillStyle = C.gold;
      g.fillRect(-2, 0, 4, 22);
      g.fillRect(-14, 9, 28, 4);
      if (landed) {
        // lid pops up and a little star comes out
        const t = Math.min(1, (hit - Math.sqrt(floorDrop / 700)) * 3);
        g.fillStyle = C.red;
        g.save();
        g.translate(-16, -2 - t * 10);
        g.rotate(-t * 0.5);
        rr(g, 0, -6, 32, 7, 2);
        g.fill();
        g.restore();
        g.fillStyle = "#fff1a8";
        star(g, 0, -10 - t * 26, 9 * t, 4 * t);
        g.fill();
      }
      g.restore();
      if (hit < 0.8) {
        g.strokeStyle = `rgba(255,255,255,${1 - hit / 0.8})`;
        g.lineWidth = 3;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          g.beginPath();
          g.moveTo(Math.cos(a) * (20 + hit * 60), Math.sin(a) * (20 + hit * 60));
          g.lineTo(Math.cos(a) * (34 + hit * 80), Math.sin(a) * (34 + hit * 80));
          g.stroke();
        }
      }
    }
  } else if (T.kind === "star") {
    const lit = hit >= 0;
    // hanging rope
    g.strokeStyle = "rgba(255,255,255,.5)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, -T.y);
    g.lineTo(0, -34);
    g.stroke();
    if (lit) {
      const glow = g.createRadialGradient(0, 0, 10, 0, 0, 110);
      glow.addColorStop(0, "rgba(255,236,150,.8)");
      glow.addColorStop(1, "rgba(255,236,150,0)");
      g.fillStyle = glow;
      g.fillRect(-110, -110, 220, 220);
    }
    g.rotate(lit ? hit * 2 : Math.sin(time / 900) * 0.08);
    star(g, 0, 0, 36, 16);
    g.fillStyle = lit ? "#fff1a8" : "rgba(246,196,83,.35)";
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = lit ? "#ffffff" : C.gold;
    g.stroke();
  }
  g.restore();
}

function drawTree(g, x, y, lit, time) {
  // decorative tree; its lights switch on when the star is lit
  g.save();
  g.translate(x, y);
  g.fillStyle = "#5b3a1e";
  g.fillRect(-10, -26, 20, 26);
  const layers = [[-26, 70], [-80, 58], [-128, 44]];
  for (const [yy, ww] of layers) {
    g.beginPath();
    g.moveTo(-ww, yy);
    g.lineTo(ww, yy);
    g.lineTo(0, yy - 70);
    g.closePath();
    g.fillStyle = "#1f8a4c";
    g.fill();
    g.fillStyle = "rgba(255,255,255,.85)";
    g.beginPath();
    g.moveTo(-ww, yy);
    g.quadraticCurveTo(0, yy - 12, ww, yy);
    g.lineTo(ww, yy + 4);
    g.quadraticCurveTo(0, yy - 6, -ww, yy + 4);
    g.fill();
  }
  const bulbs = [[-40, -40], [30, -46], [-8, -60], [-28, -96], [24, -100], [0, -120], [-14, -150], [14, -158], [46, -34], [-52, -32]];
  bulbs.forEach(([bx, by], i) => {
    const on = lit && Math.sin(time / 180 + i) > -0.4;
    g.fillStyle = on ? [C.gold, C.red, C.sky, C.pink][i % 4] : "rgba(255,255,255,.25)";
    if (on) { g.shadowColor = g.fillStyle; g.shadowBlur = 10; }
    g.beginPath();
    g.arc(bx, by, 4.5, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
  });
  g.restore();
}

function drawMallet(g, start, t) {
  // A candy-cane mallet that swings into the starting ball. t: 0 = raised, 1 = hit.
  const dir = Math.sign(start.v.x) || 1;
  const bx = start.x - dir * (BALL_R + 11), by = start.y - BALL_R;
  const pivotX = bx - dir * 8, pivotY = by - 70;
  const angle = dir * (-0.9 + 0.9 * t);
  g.save();
  g.translate(pivotX, pivotY);
  g.rotate(angle);
  g.fillStyle = "#e9eef5";
  g.fillRect(-3, 0, 6, 64);
  g.fillStyle = C.red;
  for (let y = 4; y < 60; y += 12) g.fillRect(-3, y, 6, 5);
  rr(g, -13, 58, 26, 22, 6);
  g.fillStyle = C.red;
  g.fill();
  g.fillStyle = "rgba(255,255,255,.85)";
  g.fillRect(-13, 66, 26, 5);
  g.restore();
  // pivot post
  g.fillStyle = C.gold;
  g.beginPath();
  g.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
  g.fill();
}

function drawSocket(g, s, ui, time) {
  const filled = ui.placements[s.id];
  const isGround = !s.air;
  const cy = isGround ? s.y - 30 : s.y;
  const hover = ui.hoverSocket === s.id;
  const keen = ui.selectedKind || ui.dragging;
  if (filled && !hover) return;
  g.save();
  g.translate(s.x, cy);
  const pulse = 1 + Math.sin(time / 300 + s.x) * 0.06 * (keen ? 2 : 1);
  g.scale(pulse, pulse);
  g.fillStyle = hover ? "rgba(246,196,83,.32)" : keen ? "rgba(79,195,247,.22)" : "rgba(255,255,255,.08)";
  g.beginPath();
  g.arc(0, 0, 30, 0, Math.PI * 2);
  g.fill();
  g.setLineDash([6, 6]);
  g.lineDashOffset = -time / 60;
  g.lineWidth = 2.5;
  g.strokeStyle = hover ? C.gold : keen ? C.sky : "rgba(255,255,255,.7)";
  g.stroke();
  g.setLineDash([]);
  if (!filled) {
    g.strokeStyle = hover ? C.gold : "rgba(255,255,255,.85)";
    g.lineWidth = 3.5;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(-9, 0);
    g.lineTo(9, 0);
    g.moveTo(0, -9);
    g.lineTo(0, 9);
    g.stroke();
  }
  g.restore();
  if (isGround && !filled) {
    g.fillStyle = "rgba(255,255,255,.35)";
    g.fillRect(s.x - 22, s.y - 2, 44, 2);
  }
}

function drawFlipBadge(g, x, y) {
  g.save();
  g.translate(x, y);
  g.fillStyle = C.gold;
  g.beginPath();
  g.arc(0, 0, 12, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = C.deep;
  g.lineWidth = 2.4;
  g.beginPath();
  g.arc(0, 0, 6, -0.3, Math.PI * 1.4);
  g.stroke();
  g.fillStyle = C.deep;
  g.beginPath();
  g.moveTo(6.5, 2);
  g.lineTo(9.5, -4);
  g.lineTo(2.5, -3);
  g.closePath();
  g.fill();
  g.restore();
}

export function flipBadgePos(s, kind) {
  if (kind === "ramp") return { x: s.x, y: s.y - 30 };
  return { x: s.x + SPRING.w / 2 + 6, y: s.y - 44 };
}

// ---------- Renderer ----------
export function createRenderer(canvas, { view = { x: 0, y: 0, w: W, h: H }, background = true } = {}) {
  const g = canvas.getContext("2d");
  let scale = 1, dpr = 1, bg = null;
  const spins = new WeakMap();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(cw * dpr));
    canvas.height = Math.max(1, Math.round(ch * dpr));
    scale = cw / view.w;
    if (background) {
      bg = document.createElement("canvas");
      bg.width = canvas.width;
      bg.height = canvas.height;
      const b = bg.getContext("2d");
      b.setTransform(dpr * scale, 0, 0, dpr * scale, -view.x * dpr * scale, -view.y * dpr * scale);
      drawBackground(b);
    }
  }

  function toDesign(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: view.x + ((clientX - r.left) / r.width) * view.w, y: view.y + ((clientY - r.top) / r.height) * view.h };
  }
  function toScreen(x, y) {
    const r = canvas.getBoundingClientRect();
    return { x: r.left + ((x - view.x) / view.w) * r.width, y: r.top + ((y - view.y) / view.h) * r.height };
  }

  function spinOf(b) {
    let s = spins.get(b);
    if (!s) { s = { a: 0, x: b.position.x }; spins.set(b, s); }
    s.a += (b.position.x - s.x) / BALL_R;
    s.x = b.position.x;
    return s.a;
  }

  function draw(sim, ui, time) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (bg) g.drawImage(bg, 0, 0);
    else g.clearRect(0, 0, canvas.width, canvas.height);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, -view.x * dpr * scale, -view.y * dpr * scale);
    const level = ui.level;

    if (level.deco === "tree") drawTree(g, 120, H - 2, !!ui.targetHitAt, time);
    for (const b of sim.statics) drawPlatform(g, b);
    drawTarget(g, level, ui, time);

    // last attempt's path
    if (ui.trail && ui.trail.length > 1 && ui.phase !== "run") {
      g.save();
      g.setLineDash([2, 9]);
      g.lineCap = "round";
      g.lineWidth = 4;
      g.strokeStyle = "rgba(255,255,255,.4)";
      g.beginPath();
      ui.trail.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
      g.stroke();
      g.restore();
      const end = ui.trail[ui.trail.length - 1];
      g.fillStyle = "rgba(255,255,255,.55)";
      g.font = "800 13px Nunito, sans-serif";
      g.textAlign = "center";
      g.fillText("last try", end.x, end.y - 24);
    }

    if (level.sockets) for (const s of level.sockets) drawSocket(g, s, ui, time);

    let bi = 0;
    for (const it of sim.items) {
      if (it.kind === "ramp") drawRamp(g, it.bodies[0].position.x, it.bodies[0].position.y, it.bodies[0].angle);
      else if (it.kind === "spring") drawSpring(g, it.x, it.y, it.dir, it.squash);
      else if (it.kind === "dominoes") it.bodies.forEach((d, i) => drawGiftDomino(g, d.position.x, d.position.y, d.angle, i + (it.owner.charCodeAt?.(0) || 0)));
      else if (it.kind === "ball") {
        const b = it.bodies[0];
        drawBauble(g, b.position.x, b.position.y, spinOf(b), BAUBLE[bi++ % BAUBLE.length]);
      }
      if (ui.phase === "build" && it.owner !== "fixed" && (it.kind === "ramp" || it.kind === "spring")) {
        const s = level.sockets.find((q) => q.id === it.owner);
        const p = flipBadgePos(s, it.kind);
        drawFlipBadge(g, p.x, p.y);
      }
    }
    if (sim.starter.position.y < H + 100) {
      drawBauble(g, sim.starter.position.x, sim.starter.position.y, spinOf(sim.starter), null, true);
    }
    if (level.start && ui.showMallet !== false) drawMallet(g, level.start, ui.malletT || 0);

    // "START" tag
    if (ui.phase === "build" && level.start) {
      g.font = "800 12px Nunito, sans-serif";
      g.textAlign = "center";
      g.fillStyle = C.gold;
      const dir = Math.sign(level.start.v.x) || 1;
      g.fillText(dir > 0 ? "START ▸" : "◂ START", level.start.x + dir * 34, level.start.y - BALL_R * 2 - 8);
    }

    // ghost of the object being dragged over a socket
    if (ui.ghost) {
      g.globalAlpha = 0.55;
      const { kind, x, y, flip } = ui.ghost;
      drawKind(g, kind, x, y, flip);
      g.globalAlpha = 1;
    }

    // floating labels
    for (const p of ui.popups || []) {
      const age = (time - p.t) / 1000;
      if (age > 1.4) continue;
      g.globalAlpha = Math.max(0, 1 - age / 1.4);
      g.font = "800 20px 'Baloo 2', Nunito, sans-serif";
      g.textAlign = "center";
      g.lineWidth = 5;
      g.strokeStyle = C.deep;
      g.strokeText(p.text, p.x, p.y - age * 40);
      g.fillStyle = p.colour || C.gold;
      g.fillText(p.text, p.x, p.y - age * 40);
      g.globalAlpha = 1;
    }
    // sparkles
    for (const s of ui.sparks || []) {
      const age = (time - s.t) / 1000;
      if (age > s.life) continue;
      const k = age / s.life;
      g.globalAlpha = 1 - k;
      g.fillStyle = s.c;
      star(g, s.x + s.vx * age * 60, s.y + s.vy * age * 60 + 120 * age * age, s.r, s.r / 2.4, 4, age * 6);
      g.fill();
      g.globalAlpha = 1;
    }
  }

  return { resize, draw, toDesign, toScreen, get scale() { return scale; }, view };
}

// Draws one object as it would sit on a socket at (x, y).
export function drawKind(g, kind, x, y, flip) {
  if (kind === "ramp") drawRamp(g, x, y, flip ? -RAMP.angle : RAMP.angle);
  else if (kind === "spring") drawSpring(g, x, y, flip ? -1 : 1, 0);
  else if (kind === "dominoes") for (let i = 0; i < DOMINO.count; i++) drawGiftDomino(g, x + (i - 1) * DOMINO.gap, y - DOMINO.h / 2, 0, i);
  else if (kind === "ball") drawBauble(g, x, y - BALL_R, 0, BAUBLE[0]);
}

// Small picture of each object for the tray (returns a data URL).
export function iconFor(kind) {
  const S = 96, cv = document.createElement("canvas");
  cv.width = cv.height = S * 2;
  const g = cv.getContext("2d");
  g.scale(2, 2);
  if (kind === "ramp") { g.translate(S / 2, S / 2); g.scale(0.5, 0.5); drawRamp(g, 0, 0, RAMP.angle); }
  else if (kind === "dominoes") { g.translate(S / 2, S * 0.82); g.scale(0.95, 0.95); drawKind(g, "dominoes", 0, 0); }
  else if (kind === "spring") { g.translate(S / 2, S * 0.8); g.scale(1.1, 1.1); drawSpring(g, 0, 0, 1, 0); }
  else if (kind === "ball") { g.translate(S / 2, S / 2 + 16 * 1.6); g.scale(1.6, 1.6); drawKind(g, "ball", 0, 0); }
  return cv.toDataURL("image/png");
}
