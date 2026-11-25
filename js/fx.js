// Visual effects: star bursts and confetti.

export function burst(x, y, chars = ["❄", "✦", "❅", "★"], count = 14) {
  const g = window.gsap;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "burst";
    s.textContent = chars[i % chars.length];
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.color = ["#ffffff", "#4fc3f7", "#f6c453"][i % 3];
    document.body.appendChild(s);
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const d = 50 + Math.random() * 70;
    g.fromTo(s, { x: -10, y: -12, scale: 0.4, opacity: 1 }, {
      x: Math.cos(a) * d - 10, y: Math.sin(a) * d - 12, scale: 1 + Math.random(), rotation: Math.random() * 360, opacity: 0,
      duration: 0.8 + Math.random() * 0.4, ease: "power2.out", onComplete: () => s.remove(),
    });
  }
}

export function confetti(canvas, seconds = 3.5) {
  const c = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  const colours = ["#f6c453", "#4fc3f7", "#ffffff", "#ef3b4f", "#2ec27e", "#8e5cf7"];
  const parts = Array.from({ length: 160 }, (_, i) => ({
    x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 10,
    r: 4 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
    col: colours[i % colours.length], shape: i % 3,
  }));
  const end = performance.now() + seconds * 1000;
  const frame = (t) => {
    c.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col;
      if (p.shape === 0) c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      else if (p.shape === 1) { c.beginPath(); c.arc(0, 0, p.r / 1.5, 0, Math.PI * 2); c.fill(); }
      else { c.font = `${p.r * 3}px sans-serif`; c.fillText("❄", -p.r, p.r); }
      c.restore();
    }
    if (t < end) requestAnimationFrame(frame);
    else c.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(frame);
}
