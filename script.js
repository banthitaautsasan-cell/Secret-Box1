// ====== CONFIG: make sure uploaded filenames match these entries ======
const models = [
  { id:'item01', file:'item01.mp4', rare:false },
  { id:'item02', file:'item02.mp4', rare:false },
  { id:'item03', file:'item03.mp4', rare:false },
  { id:'item04', file:'item04.mp4', rare:false },
  { id:'item05', file:'item05.mp4', rare:false },
  { id:'item06', file:'item06.mp4', rare:false },
  { id:'item07', file:'item07.mp4', rare:false },
  { id:'item08', file:'item08.mp4', rare:false },
  { id:'item09', file:'item09.mp4', rare:false },
  { id:'item10', file:'item10.mp4', rare:false },
  { id:'Secret', file:'Secret.mp4', rare:true }
];
// ===============================================================

/* storage keys */
const KEY_NAME = 'sub_name';
const KEY_CLAIMED = 'sub_claimed_items';
const KEY_DRAWN = 'sub_has_drawn'; // one-time-draw per browser

/* UI refs */
const playerNameInput = document.getElementById('playerName');
const startBtn = document.getElementById('startBtn');
const intro = document.getElementById('intro');
const mainArea = document.getElementById('mainArea');
const assetVideo = document.getElementById('assetVideo');
const shuffleBtn = document.getElementById('shuffleBtn');
const claimBtn = document.getElementById('claimBtn');
const resultText = document.getElementById('resultText');
const remainingText = document.getElementById('remainingText');
const playerLabel = document.getElementById('playerLabel');

const successModal = document.getElementById('successModal');
const successTitle = document.getElementById('successTitle');
const successBody = document.getElementById('successBody');
const closeSuccess = document.getElementById('closeSuccess');

const box3d = document.getElementById('box3d');
const confettiRoot = document.getElementById('confetti');

let pool = [];
let current = null;

/* localStorage helpers */
function loadClaimed(){
  try { const raw = localStorage.getItem(KEY_CLAIMED); return raw ? JSON.parse(raw) : []; }
  catch(e){ return []; }
}
function saveClaimed(arr){ localStorage.setItem(KEY_CLAIMED, JSON.stringify(arr)); }
function loadName(){ return localStorage.getItem(KEY_NAME) || ''; }
function saveName(n){ localStorage.setItem(KEY_NAME, n); }
function hasDrawn(){ return localStorage.getItem(KEY_DRAWN) === '1'; }
function setDrawn(){ localStorage.setItem(KEY_DRAWN, '1'); }

/* build weighted pool (secret rarer) */
function buildPool(){
  const claimed = loadClaimed();
  pool = [];
  models.forEach(m=>{
    if(claimed.includes(m.id)) return;
    const weight = m.rare ? 1 : 10; // rare is 1/10 chance
    for(let i=0;i<weight;i++) pool.push(m);
  });
}

/* update remaining text */
function updateRemaining(){
  const claimed = loadClaimed();
  const remainingCount = models.filter(m=>!claimed.includes(m.id)).length;
  remainingText.textContent = remainingCount;
  if(remainingCount === 0){
    // nothing left
    mainArea.classList.add('hidden');
    alert('All items claimed on this browser.');
  }
}

/* start button */
startBtn.addEventListener('click', ()=>{
  if(hasDrawn()){
    alert('This browser already used the draw. Each browser can draw only once.');
    return;
  }
  const name = playerNameInput.value.trim();
  if(!name){ alert('Please enter your name to start'); return; }
  saveName(name);
  playerLabel.textContent = name;
  intro.classList.add('hidden');
  mainArea.classList.remove('hidden');
  buildPool();
  updateRemaining();
});

/* autopopulate saved name */
const saved = loadName();
if(saved) playerNameInput.value = saved;

/* pick random */
function pickRandom(){
  if(pool.length === 0) return null;
  const idx = Math.floor(Math.random()*pool.length);
  return pool[idx];
}

/* animations */
function animateBoxSpin(){ box3d.classList.add('rotate'); setTimeout(()=>box3d.classList.remove('rotate'), 1100); }
function spawnHearts(){
  for(let i=0;i<18;i++){
    const h = document.createElement('div');
    h.textContent = '💖';
    h.style.position='fixed';
    h.style.left = `${30 + Math.random()*80}%`;
    h.style.top = `${20 + Math.random()*40}%`;
    h.style.fontSize = `${12 + Math.random()*18}px`;
    h.style.opacity = '0.95';
    confettiRoot.appendChild(h);
    const dur = 900 + Math.random()*900;
    h.animate([
      { transform: `translateY(0) scale(0.6)`, opacity:1 },
      { transform: `translateY(-160px) scale(1.2)`, opacity:0 }
    ], { duration: dur, easing:'cubic-bezier(.2,.8,.2,1)'});
    setTimeout(()=> h.remove(), dur+80);
  }
}
function burstConfetti(){
  for(let i=0;i<40;i++){
    const c = document.createElement('div');
    c.className = 'conf';
    c.style.position='fixed';
    c.style.left = `${50 + (Math.random()*400-200)}px`;
    c.style.top = `${200 + Math.random()*100}px`;
    c.style.width = '10px';
    c.style.height = '10px';
    c.style.background = ['#ff4da6','#ffd1e8','#ff9ccf'][Math.floor(Math.random()*3)];
    c.style.opacity = '0.95';
    c.style.borderRadius = '2px';
    confettiRoot.appendChild(c);
    const dur = 800 + Math.random()*900;
    c.animate([
      { transform:'translateY(0) rotate(0deg)', opacity:1 },
      { transform:`translateY(${80+Math.random()*200}px) rotate(${Math.random()*720-360}deg)`, opacity:0 }
    ], { duration: dur, easing:'cubic-bezier(.2,.8,.2,1)'});
    setTimeout(()=> c.remove(), dur+80);
  }
}

/* shuffle */
shuffleBtn.addEventListener('click', async ()=>{
  if(hasDrawn()){ alert('This browser already used the draw. Each browser can draw only once.'); return; }
  shuffleBtn.disabled = true;
  shuffleBtn.textContent = 'Shuffling...';
  animateBoxSpin();

  // small preview loop with a few random model thumbnails (fast)
  let frames = 0;
  const loop = setInterval(()=>{
    const r = models[Math.floor(Math.random()*models.length)];
    assetVideo.src = r.file;
    assetVideo.play().catch(()=>{});
    frames++;
    if(frames>8) clearInterval(loop);
  }, 100);

  setTimeout(()=>{
    clearInterval(loop);
    buildPool(); // refresh pool
    const pick = pickRandom();
    if(!pick){
      resultText.textContent = 'No items left';
      shuffleBtn.disabled = false;
      shuffleBtn.textContent = 'Shuffle & Reveal';
      return;
    }
    current = pick;
    // set video src and play
    assetVideo.src = pick.file;
    assetVideo.muted = true;
    assetVideo.play().catch(()=>{});
    // reveal UI
    resultText.textContent = `You got: ${pick.id.replace(/^item0?/,'').replace('Secret','SECRET — Secret Box!')}${ pick.rare ? ' (SECRET!)' : '' }`;
    claimBtn.disabled = false;
    shuffleBtn.textContent = 'Shuffled';
    // visual effects
    spawnHearts();
  }, 1200);
});

/* claim */
claimBtn.addEventListener('click', ()=>{
  if(!current){ alert('You need to shuffle first'); return; }
  // mark drawn (one-time)
  setDrawn();

  const claimed = loadClaimed();
  if(claimed.includes(current.id)){
    alert('Already claimed on this browser');
    return;
  }
  // simulate instant claim and show success modal
  const orderId = 'ORD-' + Math.random().toString(36).substring(2,9).toUpperCase();
  const name = loadName() || playerNameInput.value || 'Guest';
  successTitle.textContent = 'Success!';
  successBody.innerText = `Order ID: ${orderId}\nName: ${name}\nItem: ${current.id}`;
  successModal.classList.remove('hidden');

  // visual burst
  burstConfetti();

  // save claimed unique id
  const newClaimed = [...claimed, current.id];
  saveClaimed(newClaimed);

  // remove picked unique items from pool (rebuild)
  buildPool();
  updateRemaining();

  // disable buttons permanently
  claimBtn.disabled = true;
  shuffleBtn.disabled = true;
  shuffleBtn.textContent = 'Locked';
  resultText.textContent = `You got: ${current.id}`;
  current = null;
});

/* close modal */
closeSuccess.addEventListener('click', ()=>{
  successModal.classList.add('hidden');
});

/* initial build */
buildPool();
updateRemaining();