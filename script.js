const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
let renderScale = 0.72;
let time = 0;
let activeBlob = null;
let activePointerId = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
const cursorBlob = {
  x: width * 0.5,
  y: height * 0.5,
  targetX: width * 0.5,
  targetY: height * 0.5,
  active: false
};

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  const maxDim = Math.max(width, height);
  renderScale = maxDim > 2200 ? 0.58 : maxDim > 1700 ? 0.64 : 0.72;
  const effectiveDpr = dpr * renderScale;
  canvas.width = Math.floor(width * effectiveDpr);
  canvas.height = Math.floor(height * effectiveDpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(effectiveDpr, 0, 0, effectiveDpr, 0, 0);
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

const blobs = [
  { seed: 0.1, radiusScale: 0.16, alphaScale: 0.84, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 0.8, radiusScale: 0.13, alphaScale: 0.62, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 1.3, radiusScale: 0.15, alphaScale: 0.72, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 2.1, radiusScale: 0.14, alphaScale: 0.66, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 2.6, radiusScale: 0.12, alphaScale: 0.6, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 3.2, radiusScale: 0.16, alphaScale: 0.7, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 3.9, radiusScale: 0.13, alphaScale: 0.6, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 },
  { seed: 4.6, radiusScale: 0.15, alphaScale: 0.58, orbitX: 0.42, orbitY: 0.38, speedX: 0.000034, speedY: 0.00003, offsetX: 0, offsetY: 0, lastRadius: 0 }
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
  const cx = auto.x + blob.offsetX;
  const cy = auto.y + blob.offsetY;
  const baseRadius = maxDim * blob.radiusScale * 0.4;
  return { cx, cy, baseRadius };
}

function drawPlume(blob) {
  const { cx, cy, baseRadius } = getBlobState(blob);
  blob.lastRadius = baseRadius;
  const points = [];
  const segments = 28;

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
  ctx.filter = "blur(14px)";
  for (let i = 0; i < points.length; i += 3) {
    const p = points[i];
    const t = i / points.length;
    const shift = time * 0.000075 + blob.seed * 0.27 + t * 0.7;
    const r = baseRadius * (0.72 - t * 0.3);
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
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  for (let i = 0; i < 60; i += 1) {
    const x = (Math.sin(i * 31.7 + time * 0.0012) * 0.5 + 0.5) * width;
    const y = (Math.cos(i * 27.1 + time * 0.0014) * 0.5 + 0.5) * height;
    const size = 1 + (i % 2);
    ctx.fillRect(x, y, size, size);
  }
}

function getPointerPos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function hitTestBlob(x, y) {
  for (let i = blobs.length - 1; i >= 0; i -= 1) {
    const blob = blobs[i];
    const { cx, cy, baseRadius } = getBlobState(blob);
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= (baseRadius * 0.95) ** 2) {
      return { blob, cx, cy };
    }
  }
  return null;
}

function onPointerDown(event) {
  const pos = getPointerPos(event);
  const hit = hitTestBlob(pos.x, pos.y);
  if (!hit) {
    return;
  }
  activeBlob = hit.blob;
  activePointerId = event.pointerId;
  dragOffsetX = hit.cx - pos.x;
  dragOffsetY = hit.cy - pos.y;
  const currentIndex = blobs.indexOf(activeBlob);
  if (currentIndex >= 0) {
    blobs.splice(currentIndex, 1);
    blobs.push(activeBlob);
  }
  canvas.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  const pos = getPointerPos(event);
  cursorBlob.targetX = pos.x;
  cursorBlob.targetY = pos.y;
  cursorBlob.active = true;

  if (!activeBlob || event.pointerId !== activePointerId) {
    return;
  }
  const auto = getAutoCenter(activeBlob);
  activeBlob.offsetX = pos.x + dragOffsetX - auto.x;
  activeBlob.offsetY = pos.y + dragOffsetY - auto.y;
}

function stopDrag(event) {
  if (!activeBlob || event.pointerId !== activePointerId) {
    return;
  }
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  activeBlob = null;
  activePointerId = null;
}

function onPointerLeave() {
  cursorBlob.active = false;
}

function drawCursorBlob() {
  const lerp = cursorBlob.active ? 0.35 : 0.08;
  cursorBlob.x += (cursorBlob.targetX - cursorBlob.x) * lerp;
  cursorBlob.y += (cursorBlob.targetY - cursorBlob.y) * lerp;

  const maxDim = Math.max(width, height);
  const radius = maxDim * 0.035;
  const shift = time * 0.00012;
  const grad = ctx.createRadialGradient(
    cursorBlob.x - radius * 0.22,
    cursorBlob.y - radius * 0.16,
    radius * 0.08,
    cursorBlob.x,
    cursorBlob.y,
    radius
  );
  grad.addColorStop(0, colorAt(shift + 0.18, 0.17));
  grad.addColorStop(0.5, colorAt(shift + 0.42, 0.09));
  grad.addColorStop(1, "rgba(0,0,0,0)");

  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "blur(10px)";
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cursorBlob.x, cursorBlob.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = "none";
}

function drawAmbientGradient() {
  drawBackground();
  for (const blob of blobs) {
    drawPlume(blob);
  }
  drawCursorBlob();
  drawGrain();
}

function tick() {
  time = performance.now();
  drawAmbientGradient();
  requestAnimationFrame(tick);
}

window.addEventListener("resize", resize);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", stopDrag);
canvas.addEventListener("pointercancel", stopDrag);
canvas.addEventListener("pointerleave", onPointerLeave);
canvas.style.touchAction = "none";
resize();
ctx.fillStyle = "rgb(0, 0, 0)";
ctx.fillRect(0, 0, width, height);
requestAnimationFrame(tick);
