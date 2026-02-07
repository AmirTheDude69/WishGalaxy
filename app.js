const storageKey = 'private-wish-galaxy-v1';
const starsLayer = document.getElementById('starsLayer');
const starCount = document.getElementById('starCount');
const loadingHint = document.getElementById('loadingHint');
const modal = document.getElementById('modal');
const backdrop = document.getElementById('modalBackdrop');
const stepEls = [...document.querySelectorAll('.step')];
const dots = [...document.querySelectorAll('.steps span')];
const title = document.getElementById('modalTitle');
const aimIndicator = document.getElementById('aimIndicator');
const wishPreview = document.getElementById('wishPreview');
const launchPreview = document.getElementById('launchPreview');
const detailBackdrop = document.getElementById('detailBackdrop');
const detailModal = document.getElementById('detailModal');
const detailImage = document.getElementById('detailImage');
const detailWish = document.getElementById('detailWish');
const detailName = document.getElementById('detailName');
const detailDate = document.getElementById('detailDate');

let stars = JSON.parse(localStorage.getItem(storageKey) || '[]');
let drawing = [];
let color = '#f2a8d8';
let size = 6;
let tool = 'pen';
let pendingPoint = null;
let pendingDrawing = null;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function generateCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB');
  } catch {
    return '';
  }
}

function createLegacyArt(colorValue, sizeValue) {
  const size = Math.max(36, sizeValue || 36);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colorValue;
  ctx.shadowColor = colorValue;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 6, 0, Math.PI * 2);
  ctx.fill();
  return { url: canvas.toDataURL('image/png'), w: size, h: size };
}

function normalizeStar(star) {
  const normalized = { ...star };
  normalized.id = star.id || `star-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  normalized.name = star.name || star.starName || 'Unnamed Star';
  normalized.wish = star.wish || star.description || 'A quiet private wish.';
  normalized.createdAt = star.createdAt || new Date().toISOString();
  normalized.code = star.code || generateCode();
  normalized.glow = star.glow || star.color || '#cdd6ff';
  normalized.floatX = star.floatX ?? randomBetween(-16, 16);
  normalized.floatY = star.floatY ?? randomBetween(-16, 16);
  normalized.floatDur = star.floatDur ?? randomBetween(10, 18);

  if (!normalized.artSmall) {
    const legacy = createLegacyArt(normalized.glow, star.size || 32);
    normalized.artSmall = legacy.url;
    normalized.artLarge = legacy.url;
    normalized.artW = legacy.w;
    normalized.artH = legacy.h;
  }

  normalized.artLarge = normalized.artLarge || normalized.artSmall;
  normalized.artW = normalized.artW || star.size || 48;
  normalized.artH = normalized.artH || star.size || 48;
  normalized.displaySize = normalized.displaySize || Math.max(normalized.artW, normalized.artH);
  return normalized;
}

stars = stars.map(normalizeStar);

function renderStars() {
  starsLayer.innerHTML = '';

  stars.forEach((star) => {
    const el = document.createElement('button');
    el.className = 'star';
    el.type = 'button';
    el.style.left = `${star.x}%`;
    el.style.top = `${star.y}%`;
    const width = star.displaySize || star.artW || 48;
    const height = Math.round((star.artH || width) * (width / (star.artW || width)));
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.setProperty('--glow', star.glow || '#cdd6ff');
    el.style.setProperty('--float-x', `${star.floatX}px`);
    el.style.setProperty('--float-y', `${star.floatY}px`);
    el.style.setProperty('--float-dur', `${star.floatDur}s`);
    el.setAttribute('aria-label', `${star.name}: ${star.wish}`);

    const img = document.createElement('img');
    img.src = star.artSmall;
    img.alt = '';
    el.appendChild(img);

    el.addEventListener('click', (evt) => {
      if (document.body.classList.contains('aiming')) return;
      evt.stopPropagation();
      openDetail(star);
    });

    starsLayer.appendChild(el);
  });

  starCount.textContent = `${stars.length} stars in the galaxy`;
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(stars));
  renderStars();
}

renderStars();
loadingHint.textContent = '○ Ready';
setTimeout(() => loadingHint.remove(), 1200);

const twinkle = document.getElementById('twinkle');
const twinkleCtx = twinkle.getContext('2d');

function resize() {
  twinkle.width = innerWidth;
  twinkle.height = innerHeight;
}

resize();
addEventListener('resize', resize);

const sky = Array.from({ length: 120 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 2 + 0.2,
  a: Math.random(),
}));

setInterval(() => {
  twinkleCtx.clearRect(0, 0, twinkle.width, twinkle.height);
  for (const s of sky) {
    s.a += (Math.random() - 0.5) * 0.08;
    s.a = Math.max(0.1, Math.min(1, s.a));
    twinkleCtx.globalAlpha = s.a;
    twinkleCtx.fillStyle = '#fff9d6';
    twinkleCtx.beginPath();
    twinkleCtx.arc(s.x * twinkle.width, s.y * twinkle.height, s.r, 0, Math.PI * 2);
    twinkleCtx.fill();
  }
}, 60);

function spawnShootingStar() {
  const star = document.createElement('div');
  star.className = 'shooting-star';
  const startX = randomBetween(0, innerWidth * 0.7);
  const startY = randomBetween(0, innerHeight * 0.5);
  star.style.left = `${startX}px`;
  star.style.top = `${startY}px`;
  star.style.setProperty('--shoot-x', `${randomBetween(200, 380)}px`);
  star.style.setProperty('--shoot-y', `${randomBetween(120, 220)}px`);
  document.body.appendChild(star);
  star.addEventListener('animationend', () => star.remove());
}

setInterval(() => {
  if (Math.random() < 0.6) spawnShootingStar();
}, 6000);

function goto(stepIndex) {
  stepEls.forEach((el, idx) => el.classList.toggle('on', idx === stepIndex));
  dots.forEach((el, idx) => el.classList.toggle('on', idx <= stepIndex));
  title.textContent = ['Draw Your Star', 'Make a Wish', 'Launch Your Star'][stepIndex];
  document.body.classList.toggle('aiming', stepIndex === 2);
  if (stepIndex !== 2) {
    pendingPoint = null;
    aimIndicator.classList.add('hidden');
  }
  if (stepIndex >= 1) refreshPreviews();
}

function openModal() {
  modal.classList.remove('hidden');
  backdrop.classList.remove('hidden');
  clearDraw();
  document.getElementById('wishInput').value = '';
  document.getElementById('nameInput').value = '';
  pendingPoint = null;
  aimIndicator.classList.add('hidden');
  goto(0);
}

function closeModal() {
  modal.classList.add('hidden');
  backdrop.classList.add('hidden');
  pendingPoint = null;
  aimIndicator.classList.add('hidden');
  document.body.classList.remove('aiming');
}

function openDetail(star) {
  detailImage.src = star.artLarge || star.artSmall;
  detailWish.textContent = star.wish;
  detailName.textContent = `${star.name} - ${star.code}`;
  detailDate.textContent = formatDate(star.createdAt);
  detailBackdrop.classList.remove('hidden');
  detailModal.classList.remove('hidden');
}

function closeDetail() {
  detailBackdrop.classList.add('hidden');
  detailModal.classList.add('hidden');
}

document.getElementById('addStarBtn').onclick = openModal;
document.getElementById('closeModal').onclick = closeModal;
backdrop.onclick = () => {
  if (!document.body.classList.contains('aiming')) closeModal();
};
document.getElementById('detailClose').onclick = closeDetail;
detailBackdrop.onclick = closeDetail;

const drawCanvas = document.getElementById('drawCanvas');
const drawCtx = drawCanvas.getContext('2d');
let isDown = false;

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function drawStroke(ctx, stroke) {
  if (!stroke.points.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = stroke.size * 1.2;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    stroke.points.forEach((point, idx) => {
      if (idx) ctx.lineTo(point.x, point.y);
      else ctx.moveTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.shadowColor = stroke.color;
  const glowBoost = stroke.tool === 'glow' ? 2.4 : stroke.tool === 'sparkle' ? 2.0 : 1.4;
  ctx.shadowBlur = stroke.size * glowBoost;

  if (stroke.tool === 'sparkle') {
    const baseRadius = Math.max(1.2, stroke.size * 0.35);
    stroke.points.forEach((point, idx) => {
      const jitterX = (seededRandom(stroke.seed + idx * 3.1) - 0.5) * stroke.size * 0.6;
      const jitterY = (seededRandom(stroke.seed + idx * 4.7) - 0.5) * stroke.size * 0.6;
      const radius = baseRadius * (0.6 + seededRandom(stroke.seed + idx * 7.9) * 0.8);
      ctx.beginPath();
      ctx.arc(point.x + jitterX, point.y + jitterY, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.lineWidth = stroke.size;
    ctx.beginPath();
    stroke.points.forEach((point, idx) => {
      if (idx) ctx.lineTo(point.x, point.y);
      else ctx.moveTo(point.x, point.y);
    });
    ctx.stroke();
  }

  ctx.restore();
}

function redraw() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawing.forEach((stroke) => drawStroke(drawCtx, stroke));
}

function clearDraw() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawing = [];
  pendingDrawing = null;
  if (wishPreview) wishPreview.src = '';
  if (launchPreview) launchPreview.src = '';
}

function point(evt) {
  const rect = drawCanvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (drawCanvas.width / rect.width),
    y: (evt.clientY - rect.top) * (drawCanvas.height / rect.height),
  };
}

drawCanvas.onpointerdown = (evt) => {
  isDown = true;
  drawCanvas.setPointerCapture(evt.pointerId);
  drawing.push({
    tool,
    color,
    size,
    seed: Math.random() * 1000,
    points: [point(evt)],
  });
};

drawCanvas.onpointermove = (evt) => {
  if (!isDown) return;
  drawing.at(-1).points.push(point(evt));
  redraw();
};

drawCanvas.onpointerup = () => {
  isDown = false;
  refreshPreviews();
};

drawCanvas.onpointerleave = () => {
  isDown = false;
};

document.getElementById('undoBtn').onclick = () => {
  drawing.pop();
  redraw();
  refreshPreviews();
};

document.querySelectorAll('.color').forEach((btn) => {
  btn.onclick = () => {
    color = btn.dataset.color;
    document.querySelectorAll('.color').forEach((el) => el.classList.remove('on'));
    btn.classList.add('on');
  };
});

document.getElementById('customColor').oninput = (evt) => {
  color = evt.target.value;
  document.querySelectorAll('.color').forEach((el) => el.classList.remove('on'));
};

document.querySelectorAll('.tool').forEach((btn) => {
  btn.onclick = () => {
    tool = btn.dataset.tool;
    document.querySelectorAll('.tool').forEach((el) => el.classList.remove('on'));
    btn.classList.add('on');
  };
});

document.getElementById('sizeSlider').oninput = (evt) => {
  size = Number(evt.target.value);
};

document.getElementById('continue1').onclick = () => goto(1);
document.getElementById('back2').onclick = () => goto(0);
document.getElementById('continue2').onclick = () => goto(2);
document.getElementById('back3').onclick = () => goto(1);

function getDrawingBounds(strokes) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  strokes.forEach((stroke) => {
    const pad = stroke.size * 0.8 + 6;
    stroke.points.forEach((point) => {
      minX = Math.min(minX, point.x - pad);
      minY = Math.min(minY, point.y - pad);
      maxX = Math.max(maxX, point.x + pad);
      maxY = Math.max(maxY, point.y + pad);
    });
  });
  if (!isFinite(minX)) {
    return { x: 0, y: 0, width: drawCanvas.width, height: drawCanvas.height, empty: true };
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return { x: minX, y: minY, width, height, empty: false };
}

function normalizeStrokes(strokes) {
  const bounds = getDrawingBounds(strokes);
  if (bounds.empty) {
    return { strokes: [], bounds };
  }
  const normalized = strokes.map((stroke) => ({
    tool: stroke.tool,
    color: stroke.color,
    size: stroke.size,
    seed: stroke.seed,
    points: stroke.points.map((point) => ({
      x: (point.x - bounds.x) / bounds.width,
      y: (point.y - bounds.y) / bounds.height,
    })),
  }));
  return { strokes: normalized, bounds };
}

function renderNormalized(strokes, bounds, sizePx) {
  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d');
  if (!strokes.length) {
    return { url: '', w: canvas.width, h: canvas.height };
  }
  const padding = Math.max(8, sizePx * 0.12);
  const inner = sizePx - padding * 2;
  const ratio = bounds.width / bounds.height;
  let drawW = inner;
  let drawH = inner;
  if (ratio > 1) {
    drawH = inner / ratio;
  } else {
    drawW = inner * ratio;
  }
  const offsetX = (sizePx - drawW) / 2;
  const offsetY = (sizePx - drawH) / 2;
  const scaleFactor = Math.min(drawW / bounds.width, drawH / bounds.height);

  strokes.forEach((stroke) => {
    const scaledStroke = {
      ...stroke,
      size: stroke.size * scaleFactor,
      points: stroke.points.map((point) => ({
        x: offsetX + point.x * drawW,
        y: offsetY + point.y * drawH,
      })),
    };
    drawStroke(ctx, scaledStroke);
  });

  return { url: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height };
}

function getAccentColor() {
  for (let i = drawing.length - 1; i >= 0; i -= 1) {
    if (drawing[i].tool !== 'eraser') return drawing[i].color;
  }
  return color;
}

function prepareDrawing() {
  const normalized = normalizeStrokes(drawing);
  if (normalized.bounds.empty) return null;
  const small = renderNormalized(normalized.strokes, normalized.bounds, 84);
  const large = renderNormalized(normalized.strokes, normalized.bounds, 160);
  const base = Math.max(normalized.bounds.width, normalized.bounds.height);
  const displaySize = Math.round(Math.max(48, Math.min(110, base * 0.3)));
  return {
    normalized: normalized.strokes,
    bounds: normalized.bounds,
    small,
    large,
    accent: getAccentColor(),
    displaySize,
  };
}

function refreshPreviews() {
  if (!drawing.length) {
    if (wishPreview) wishPreview.src = '';
    if (launchPreview) launchPreview.src = '';
    pendingDrawing = null;
    return;
  }
  pendingDrawing = prepareDrawing();
  if (!pendingDrawing) return;
  if (wishPreview) wishPreview.src = pendingDrawing.large.url;
  if (launchPreview) launchPreview.src = pendingDrawing.large.url;
}

document.addEventListener('pointerdown', (evt) => {
  if (!stepEls[2].classList.contains('on')) return;
  if (modal.contains(evt.target)) return;
  if (evt.target.closest('#addStarBtn')) return;
  const x = (evt.clientX / innerWidth) * 100;
  const y = (evt.clientY / innerHeight) * 100;
  pendingPoint = { x, y };
  aimIndicator.style.left = `${evt.clientX}px`;
  aimIndicator.style.top = `${evt.clientY}px`;
  aimIndicator.classList.remove('hidden');
});

function launchStarAnimation(star, onFinish) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    onFinish();
    return;
  }
  const rect = launchPreview.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;
  const targetX = (star.x / 100) * innerWidth;
  const targetY = (star.y / 100) * innerHeight;
  const ghost = document.createElement('img');
  ghost.src = star.artLarge;
  ghost.className = 'launch-ghost';
  ghost.style.left = `${startX}px`;
  ghost.style.top = `${startY}px`;
  ghost.style.width = `${Math.max(star.displaySize * 1.2, 80)}px`;
  ghost.style.height = `${Math.max(star.displaySize * 1.2, 80)}px`;
  ghost.style.transform = 'translate(-50%, -50%)';
  document.body.appendChild(ghost);

  const dx = targetX - startX;
  const dy = targetY - startY;
  const anim = ghost.animate([
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.95 },
    { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 1 },
  ], {
    duration: 1400,
    easing: 'cubic-bezier(0.18, 0.8, 0.2, 1)',
  });

  anim.onfinish = () => {
    ghost.remove();
    onFinish();
  };
}

function buildStar() {
  const prepared = pendingDrawing || prepareDrawing();
  if (!prepared) return null;
  const nameInput = document.getElementById('nameInput').value.trim();
  const wishInput = document.getElementById('wishInput').value.trim();
  const code = generateCode();
  const starName = nameInput || `Nova Minor-${code}`;
  const starWish = wishInput || 'A quiet private wish.';
  const pointToUse = pendingPoint || {
    x: 50 + (Math.random() * 14 - 7),
    y: 50 + (Math.random() * 14 - 7),
  };

  return {
    id: `star-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    x: pointToUse.x,
    y: pointToUse.y,
    name: starName,
    wish: starWish,
    createdAt: new Date().toISOString(),
    code,
    glow: prepared.accent,
    artSmall: prepared.small.url,
    artLarge: prepared.large.url,
    artW: prepared.small.w,
    artH: prepared.small.h,
    displaySize: prepared.displaySize,
    floatX: randomBetween(-16, 16),
    floatY: randomBetween(-16, 16),
    floatDur: randomBetween(10, 18),
  };
}

document.getElementById('saveStar').onclick = () => {
  const newStar = buildStar();
  if (!newStar) return;
  closeModal();
  const finalize = () => {
    stars.push(newStar);
    save();
  };
  launchStarAnimation(newStar, finalize);
  clearDraw();
  document.getElementById('wishInput').value = '';
  document.getElementById('nameInput').value = '';
};
