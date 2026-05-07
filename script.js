const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
const dpr = Math.min(window.devicePixelRatio || 1, 1);
let renderScale = 0.72;
let time = 0;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  const maxDim = Math.max(width, height);
  renderScale = maxDim > 2200 ? 0.42 : maxDim > 1700 ? 0.5 : 0.58;
  const effectiveDpr = dpr * renderScale;
  canvas.width = Math.floor(width * effectiveDpr);
  canvas.height = Math.floor(height * effectiveDpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(effectiveDpr, 0, 0, effectiveDpr, 0, 0);
}

const palettes = [
  [
    [138, 72, 255],  // violet
    [80, 170, 255],  // electric blue
    [255, 108, 70],  // orange
    [195, 90, 255]   // magenta-violet
  ],
  [
    [90, 255, 218],  // mint
    [58, 158, 255],  // azure
    [184, 124, 255], // lavender
    [255, 132, 205]  // pink
  ],
  [
    [255, 140, 88],  // coral
    [255, 82, 168],  // fuchsia
    [132, 98, 255],  // indigo
    [84, 205, 255]   // sky
  ],
  [
    [120, 255, 112], // lime
    [72, 205, 255],  // cyan
    [120, 120, 255], // soft blue
    [255, 152, 98]   // warm orange
  ]
];
let paletteIndex = 0;
let palette = palettes[paletteIndex];

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

function cyclePalette() {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  palette = palettes[paletteIndex];
}

function drawBackground() {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.fillRect(0, 0, width, height);
}

const blobs = [
  { seed: 0.1, radiusScale: 0.16, alphaScale: 0.84, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 0.8, radiusScale: 0.13, alphaScale: 0.62, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 1.3, radiusScale: 0.15, alphaScale: 0.72, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 2.6, radiusScale: 0.12, alphaScale: 0.6, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 3.2, radiusScale: 0.16, alphaScale: 0.7, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 4.6, radiusScale: 0.15, alphaScale: 0.58, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 5.1, radiusScale: 0.07, alphaScale: 0.5, orbitX: 0.5, orbitY: 0.46, speedX: 0.00004, speedY: 0.000035, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 6.4, radiusScale: 0.068, alphaScale: 0.46, orbitX: 0.52, orbitY: 0.45, speedX: 0.000042, speedY: 0.000036, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 7.1, radiusScale: 0.08, alphaScale: 0.5, orbitX: 0.47, orbitY: 0.43, speedX: 0.000039, speedY: 0.000034, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 9.5, radiusScale: 0.07, alphaScale: 0.46, orbitX: 0.48, orbitY: 0.44, speedX: 0.00004, speedY: 0.000033, offsetX: 0, offsetY: 0, lastRadius: 0 }
];

function getAutoCenter(blob) {
  return {
    x: width * (0.5 + Math.sin(time * blob.speedX + blob.seed * 1.9) * blob.orbitX),
    y: height * (0.5 + Math.cos(time * blob.speedY + blob.seed * 1.4) * blob.orbitY)
  };
}

function getBlobState(blob) {
  const maxDim = Math.max(width, height);
  const auto = getAutoCenter(blob);
  const cx = auto.x;
  const cy = auto.y;
  const baseRadius = maxDim * blob.radiusScale * 0.4;
  return { cx, cy, baseRadius };
}

function drawPlume(blob) {
  const { cx, cy, baseRadius } = getBlobState(blob);
  blob.lastRadius = baseRadius;
  const points = [];
  const segments = 16;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = t * Math.PI * 2.7 + Math.sin(time * 0.00011 + blob.seed) * 0.4;
    const drift = 1 + Math.sin(t * 6 + time * 0.00018 + blob.seed * 2.5) * 0.3;
    const radius = baseRadius * drift;
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    });
  }

  ctx.globalCompositeOperation = "source-over";
  const pointStep = blob.radiusScale < 0.09 ? 6 : 5;
  const blurPx = blob.radiusScale < 0.09 ? 6 : 8;
  ctx.filter = `blur(${blurPx}px)`;
  for (let i = 0; i < points.length; i += pointStep) {
    const p = points[i];
    const t = i / points.length;
    const shift = time * 0.000075 + blob.seed * 0.27 + t * 0.7;
    const r = baseRadius * (0.58 - t * 0.2);
    const grad = ctx.createRadialGradient(p.x, p.y, r * 0.08, p.x, p.y, r);
    grad.addColorStop(0, colorAt(shift + 0.03, 0.34 * blob.alphaScale));
    grad.addColorStop(0.5, colorAt(shift + 0.35, 0.2 * blob.alphaScale));
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
  ctx.fillStyle = "rgba(255, 255, 255, 0.008)";
  for (let i = 0; i < 24; i += 1) {
    const x = (Math.sin(i * 31.7 + time * 0.0012) * 0.5 + 0.5) * width;
    const y = (Math.cos(i * 27.1 + time * 0.0014) * 0.5 + 0.5) * height;
    const size = 0.4 + (i % 2) * 0.15;
    ctx.fillRect(x, y, size, size);
  }
}

function drawAmbientGradient() {
  drawBackground();
  for (const blob of blobs) {
    drawPlume(blob);
  }
  drawGrain();
}

function tick() {
  time = performance.now();
  drawAmbientGradient();
  requestAnimationFrame(tick);
}

window.addEventListener("resize", resize);
canvas.addEventListener("click", cyclePalette);
resize();
ctx.fillStyle = "rgb(0, 0, 0)";
ctx.fillRect(0, 0, width, height);
requestAnimationFrame(tick);
