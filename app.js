const key = 'private-wish-galaxy-v1';
let stars = JSON.parse(localStorage.getItem(key) || '[]');
const starsLayer = document.getElementById('starsLayer');
const starCount = document.getElementById('starCount');
const modal = document.getElementById('modal');
const backdrop = document.getElementById('modalBackdrop');
const stepEls = [...document.querySelectorAll('.step')];
const dots = [...document.querySelectorAll('.steps span')];
const title = document.getElementById('modalTitle');
let drawing = [], color = '#f2a8d8', size = 6, pendingWish = '', pendingPoint = null;

function save(){ localStorage.setItem(key, JSON.stringify(stars)); renderStars(); }
function renderStars(){
  starsLayer.innerHTML = '';
  stars.forEach(s => {
    const el = document.createElement('div');
    el.className = 'star';
    el.style.left = s.x + '%'; el.style.top = s.y + '%';
    el.style.color = s.color; el.style.width = el.style.height = s.size + 'px';
    el.title = s.wish;
    starsLayer.appendChild(el);
  });
  starCount.textContent = `${stars.length} stars in the galaxy`;
}
renderStars();

const tw = document.getElementById('twinkle');
const ctx = tw.getContext('2d');
function resize(){ tw.width = innerWidth; tw.height = innerHeight; } resize(); addEventListener('resize', resize);
const sky = Array.from({length:120}, () => ({x:Math.random(),y:Math.random(),r:Math.random()*2+0.2,a:Math.random()}));
setInterval(() => {
  ctx.clearRect(0,0,tw.width,tw.height);
  for (const s of sky){ s.a += (Math.random()-0.5)*0.08; s.a = Math.max(0.1,Math.min(1,s.a)); ctx.globalAlpha=s.a; ctx.fillStyle='#fff9d6'; ctx.beginPath(); ctx.arc(s.x*tw.width,s.y*tw.height,s.r,0,Math.PI*2); ctx.fill(); }
}, 60);

function openModal(){ modal.classList.remove('hidden'); backdrop.classList.remove('hidden'); goto(0); }
function closeModal(){ modal.classList.add('hidden'); backdrop.classList.add('hidden'); pendingPoint = null; }
function goto(i){
  stepEls.forEach((e,n)=>e.classList.toggle('on', n===i));
  dots.forEach((e,n)=>e.classList.toggle('on', n<=i));
  title.textContent = ['Draw Your Star','Make a Wish','Place Your Star'][i];
}

document.getElementById('addStarBtn').onclick = openModal;
document.getElementById('closeModal').onclick = closeModal;
backdrop.onclick = closeModal;

const dc = document.getElementById('drawCanvas');
const dctx = dc.getContext('2d');
let isDown = false;
function drawPath(path){ dctx.strokeStyle = color; dctx.lineWidth = size; dctx.lineCap='round'; dctx.beginPath(); path.forEach((p,i)=> i?dctx.lineTo(p.x,p.y):dctx.moveTo(p.x,p.y)); dctx.stroke(); }
function clearDraw(){ dctx.clearRect(0,0,dc.width,dc.height); drawing=[]; }
function point(e){ const r=dc.getBoundingClientRect(); return {x:(e.clientX-r.left)*(dc.width/r.width), y:(e.clientY-r.top)*(dc.height/r.height)}; }
dc.onpointerdown = (e)=>{ isDown=true; drawing.push([point(e)]); };
dc.onpointermove = (e)=>{ if(!isDown) return; drawing.at(-1).push(point(e)); dctx.clearRect(0,0,dc.width,dc.height); drawing.forEach(drawPath); };
addEventListener('pointerup', ()=> isDown=false);
document.getElementById('undoBtn').onclick = ()=>{ drawing.pop(); dctx.clearRect(0,0,dc.width,dc.height); drawing.forEach(drawPath); };
document.querySelectorAll('.color').forEach(btn => btn.onclick = () => { color = btn.dataset.color; document.querySelectorAll('.color').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); dctx.clearRect(0,0,dc.width,dc.height); drawing.forEach(drawPath); });
document.getElementById('sizeSlider').oninput = (e) => size = +e.target.value;

document.getElementById('continue1').onclick = ()=> goto(1);
document.getElementById('back2').onclick = ()=> goto(0);
document.getElementById('continue2').onclick = ()=>{ pendingWish = document.getElementById('wishInput').value.trim() || 'A quiet private wish.'; goto(2); };
document.getElementById('back3').onclick = ()=> goto(1);

document.addEventListener('click', (e) => {
  if (stepEls[2].classList.contains('on') && !modal.contains(e.target) && !e.target.closest('#addStarBtn')) {
    pendingPoint = { x: (e.clientX / innerWidth) * 100, y: (e.clientY / innerHeight) * 100 };
  }
});

document.getElementById('saveStar').onclick = () => {
  const p = pendingPoint || {x: 50 + (Math.random()*10-5), y: 50 + (Math.random()*10-5)};
  stars.push({ ...p, color, size: Math.max(4,size), wish: pendingWish });
  save(); closeModal(); clearDraw(); document.getElementById('wishInput').value='';
};
