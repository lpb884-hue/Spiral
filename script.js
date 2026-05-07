const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
let time = 0;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const palette = [
  [138, 72, 255],  // violet
  [80, 170, 255],  // electric blue
  [255, 108, 70],  // orange
  [195, 90, 255]   // magenta-violet
];

function colorAt(mix, alpha) {
  const count = palette.length;
  const wrapped = ((mix % 1) + 1) % 1;
  const index = Math.floor(wrapped * count) % count;
  const next = (index + 1) % count;
  const localMix = wrapped * count - Math.floor(wrapped * count);
  const r = Math.round(palette[index][0] + (palette[next][0] - palette[index][0]) * localMix);
  const g = Math.round(palette[index][1] + (palette[next][1] - palette[index][1]) * localMix);
  const b = Math.round(palette[index][2] + (palette[next][2] - palette[index][2]) * localMix);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawBackground() {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.fillRect(0, 0, width, height);
}

function drawPlume(seed, radiusScale, alphaScale) {
  const maxDim = Math.max(width, height);
  const cx = width * (0.5 + Math.sin(time * 0.000034 + seed * 1.9) * 0.42);
  const cy = height * (0.5 + Math.cos(time * 0.00003 + seed * 1.4) * 0.38);
  const baseRadius = maxDim * radiusScale * 0.55;
  const points = [];
  const segments = 36;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = t * Math.PI * 2.7 + Math.sin(time * 0.00011 + seed) * 0.4;
    const drift = 1 + Math.sin(t * 6 + time * 0.00018 + seed * 2.5) * 0.3;
    const radius = baseRadius * drift;
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    });
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "blur(14px)";
  for (let i = 0; i < points.length; i += 2) {
    const p = points[i];
    const t = i / points.length;
    const shift = time * 0.000075 + seed * 0.27 + t * 0.7;
    const r = baseRadius * (0.82 - t * 0.38);
    const grad = ctx.createRadialGradient(p.x, p.y, r * 0.08, p.x, p.y, r);
    grad.addColorStop(0, colorAt(shift + 0.03, 0.34 * alphaScale));
    grad.addColorStop(0.5, colorAt(shift + 0.35, 0.2 * alphaScale));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = "none";
}

function drawGrain() {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  for (let i = 0; i < 60; i += 1) {
    const x = (Math.sin(i * 31.7 + time * 0.0012) * 0.5 + 0.5) * width;
    const y = (Math.cos(i * 27.1 + time * 0.0014) * 0.5 + 0.5) * height;
    const size = 1 + (i % 2);
    ctx.fillRect(x, y, size, size);
  }
}

function drawAmbientGradient() {
  drawBackground();
  drawPlume(0.1, 0.24, 0.92);
  drawPlume(0.8, 0.19, 0.68);
  drawPlume(1.3, 0.22, 0.8);
  drawPlume(2.1, 0.2, 0.72);
  drawPlume(2.6, 0.18, 0.68);
  drawPlume(3.2, 0.24, 0.76);
  drawPlume(3.7, 0.19, 0.66);
  drawPlume(4.1, 0.21, 0.68);
  drawPlume(4.8, 0.17, 0.6);
  drawPlume(5.4, 0.2, 0.62);
  drawGrain();
}

function tick() {
  time = performance.now();
  drawAmbientGradient();
  requestAnimationFrame(tick);
}

window.addEventListener("resize", resize);
resize();
ctx.fillStyle = "rgb(0, 0, 0)";
ctx.fillRect(0, 0, width, height);
requestAnimationFrame(tick);
