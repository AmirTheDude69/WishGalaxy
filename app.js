const storageKey = 'private-wish-galaxy-v1';
const starsLayer = document.getElementById('starsLayer');
const starCount = document.getElementById('starCount');
const loadingHint = document.getElementById('loadingHint');
const modal = document.getElementById('modal');
const backdrop = document.getElementById('modalBackdrop');
const stepEls = [...document.querySelectorAll('.step')];
const dots = [...document.querySelectorAll('.steps span')];
const title = document.getElementById('modalTitle');

let stars = JSON.parse(localStorage.getItem(storageKey) || '[]');
let drawing = [];
let color = '#f2a8d8';
let size = 6;
let pendingWish = '';
let pendingPoint = null;

function renderStars() {
  starsLayer.innerHTML = '';

  stars.forEach((star) => {
    const el = document.createElement('button');
    el.className = 'star';
    el.type = 'button';
    el.style.left = `${star.x}%`;
    el.style.top = `${star.y}%`;
    el.style.color = star.color;
    el.style.width = `${star.size}px`;
    el.style.height = `${star.size}px`;
    el.dataset.wish = star.wish;
    el.setAttribute('aria-label', star.wish);
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

function goto(stepIndex) {
  stepEls.forEach((el, idx) => el.classList.toggle('on', idx === stepIndex));
  dots.forEach((el, idx) => el.classList.toggle('on', idx <= stepIndex));
  title.textContent = ['Draw Your Star', 'Make a Wish', 'Place Your Star'][stepIndex];
}

function openModal() {
  modal.classList.remove('hidden');
  backdrop.classList.remove('hidden');
  goto(0);
}

function closeModal() {
  modal.classList.add('hidden');
  backdrop.classList.add('hidden');
  pendingPoint = null;
}

document.getElementById('addStarBtn').onclick = openModal;
document.getElementById('closeModal').onclick = closeModal;
backdrop.onclick = closeModal;

const drawCanvas = document.getElementById('drawCanvas');
const drawCtx = drawCanvas.getContext('2d');
let isDown = false;

function drawPath(path) {
  drawCtx.strokeStyle = color;
  drawCtx.lineWidth = size;
  drawCtx.lineCap = 'round';
  drawCtx.beginPath();
  path.forEach((point, idx) => {
    if (idx) drawCtx.lineTo(point.x, point.y);
    else drawCtx.moveTo(point.x, point.y);
  });
  drawCtx.stroke();
}

function redraw() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawing.forEach(drawPath);
}

function clearDraw() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawing = [];
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
  drawing.push([point(evt)]);
};

drawCanvas.onpointermove = (evt) => {
  if (!isDown) return;
  drawing.at(-1).push(point(evt));
  redraw();
};

addEventListener('pointerup', () => {
  isDown = false;
});

document.getElementById('undoBtn').onclick = () => {
  drawing.pop();
  redraw();
};

document.querySelectorAll('.color').forEach((btn) => {
  btn.onclick = () => {
    color = btn.dataset.color;
    document.querySelectorAll('.color').forEach((el) => el.classList.remove('on'));
    btn.classList.add('on');
    redraw();
  };
});

document.getElementById('sizeSlider').oninput = (evt) => {
  size = Number(evt.target.value);
};

document.getElementById('continue1').onclick = () => goto(1);
document.getElementById('back2').onclick = () => goto(0);
document.getElementById('continue2').onclick = () => {
  pendingWish = document.getElementById('wishInput').value.trim() || 'A quiet private wish.';
  goto(2);
};
document.getElementById('back3').onclick = () => goto(1);

document.addEventListener('click', (evt) => {
  if (stepEls[2].classList.contains('on') && !modal.contains(evt.target) && !evt.target.closest('#addStarBtn')) {
    pendingPoint = {
      x: (evt.clientX / innerWidth) * 100,
      y: (evt.clientY / innerHeight) * 100,
    };
  }
});

document.getElementById('saveStar').onclick = () => {
  const pointToUse = pendingPoint || { x: 50 + (Math.random() * 10 - 5), y: 50 + (Math.random() * 10 - 5) };

  stars.push({
    ...pointToUse,
    color,
    size: Math.max(4, size),
    wish: pendingWish,
  });

  save();
  closeModal();
  clearDraw();
  document.getElementById('wishInput').value = '';
};
