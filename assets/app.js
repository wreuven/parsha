/*
App behavior:
- Load YouTube IFrame API and embed weekly video.
- Only after video ended -> reveal 2-question quiz.
- On submit: validate answers & name; if both correct -> add to week winners and update leaderboards.
- Leaderboards: overall, current month, current week.
- Data stored in localStorage (no backend). Keys namespace under 'parshaNoga:*'.
*/

const NS = 'parshaNoga';
const LS_KEYS = {
  winnersAll: `${NS}:winnersAll`, // array of {name, dateISO}
  winnersWeekPrefix: `${NS}:winnersWeek:` // + weekKey -> array of names
};

function isRemoteEnabled(){
  return !!window.PARSHA_REMOTE?.hasConfig;
}

// Utilities
const today = new Date();
const ymKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`; // e.g., 2025-08

function getJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}
function setJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function toast(msg){
  const el = document.getElementById('quizMessage');
  if(el){ el.textContent = msg; }
}

function normalizeName(s){
  return String(s || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g,' ')
    .toLowerCase();
}

// Quiz rendering
function renderQuestions(){
  const wrap = document.getElementById('questions');
  wrap.innerHTML = '';
  const { questions } = window.PARSHA_CONFIG;
  questions.forEach((q, qi)=>{
    const field = document.createElement('fieldset');
    field.className = 'field';

    const legend = document.createElement('legend');
    legend.textContent = `${qi+1}. ${q.text}`;
    field.appendChild(legend);

    q.options.forEach((opt, oi)=>{
      const id = `${q.id}_${oi}`;
      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.style.display = 'flex';
      label.style.gap = '.5rem';
      label.style.alignItems = 'center';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = q.id;
      input.id = id;
      input.value = String(oi);
      input.required = true;

      const span = document.createElement('span');
      span.textContent = opt;

      label.appendChild(input);
      label.appendChild(span);
      field.appendChild(label);
    });

    wrap.appendChild(field);
  });
}

function evaluateAnswers(form){
  const { questions } = window.PARSHA_CONFIG;
  let correct = 0;
  questions.forEach(q=>{
    const val = form.querySelector(`input[name="${q.id}"]:checked`);
    if(val && Number(val.value) === q.correctIndex) correct++;
  });
  return correct === questions.length;
}

// Cookie helpers
function setCookie(name, value, days=365){
  const d = new Date(); d.setTime(d.getTime() + (days*24*60*60*1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}
function getCookie(name){
  const n = `${name}=`;
  const ca = document.cookie.split(';');
  for(let c of ca){
    while(c.charAt(0)===' ') c = c.substring(1);
    if(c.indexOf(n)===0) return decodeURIComponent(c.substring(n.length));
  }
  return '';
}
const COOKIE_USER = `${NS}.username`;

function showCurrentUser(){
  const chip = document.getElementById('currentUser');
  const name = getCookie(COOKIE_USER);
  chip.textContent = name ? `שם שמור: ${name}` : 'שם לא שמור';
}

// Name confirmation modal
function openNameConfirm(name, onConfirm){
  const modal = document.getElementById('nameConfirmModal');
  document.getElementById('nameConfirmValue').textContent = name;
  modal.classList.remove('hidden');
  const confirmBtn = document.getElementById('confirmNameBtn');
  const cancelBtn = document.getElementById('cancelNameBtn');
  const close = ()=> modal.classList.add('hidden');
  const ok = ()=>{ close(); onConfirm?.(); cleanup(); };
  const ko = ()=>{ close(); cleanup(); };
  function cleanup(){
    confirmBtn.removeEventListener('click', ok);
    cancelBtn.removeEventListener('click', ko);
  }
  confirmBtn.addEventListener('click', ok);
  cancelBtn.addEventListener('click', ko);
}

// Leaderboards
function addWinner(name){
  const weekKey = window.PARSHA_CONFIG.weekKey;
  if(isRemoteEnabled()){
    // Remote only
    window.PARSHA_REMOTE.remoteAddWinner(name, weekKey).catch(()=>{});
  } else {
    // Local fallback (no remote configured)
    const all = getJSON(LS_KEYS.winnersAll, []);
    all.push({ name, dateISO: new Date().toISOString() });
    setJSON(LS_KEYS.winnersAll, all);

    const wkKey = `${LS_KEYS.winnersWeekPrefix}${weekKey}`;
    const wk = getJSON(wkKey, []);
    const norm = normalizeName(name);
    const wkNorms = wk.map(n => normalizeName(n));
    if(!wkNorms.includes(norm)) wk.push(name);
    setJSON(wkKey, wk);
  }
}

function getMonthWinners(monthKey){
  const all = getJSON(LS_KEYS.winnersAll, []);
  return all.filter(x => x.dateISO.startsWith(monthKey));
}

function getWeekWinners(){
  const wkKey = `${LS_KEYS.winnersWeekPrefix}${window.PARSHA_CONFIG.weekKey}`;
  return getJSON(wkKey, []);
}

function aggregateLeaders(entries){
  // entries: array of {name}
  const map = new Map();
  entries.forEach(e => map.set(e.name, (map.get(e.name)||0)+1));
  return [...map.entries()].sort((a,b)=> b[1]-a[1]).slice(0,10);
}

function renderLeaderboards(){
  if(isRemoteEnabled()){
    // Remote-only rendering
    fillList('leadersAll', []); // will show empty placeholder until fetch completes
    fillList('leadersMonth', []);
    fillList('leadersWeek', []);

    window.PARSHA_REMOTE.remoteFetchAll().then(({ all, week })=>{
      const allRank = aggregateLeaders(all.map(({name,date_iso})=>({ name, dateISO: date_iso })));
      fillList('leadersAll', allRank.map(([n])=> n));

      const month = all.filter(x => (x.date_iso||'').startsWith(ymKey));
      const monthRank = aggregateLeaders(month.map(({name,date_iso})=>({ name, dateISO: date_iso })));
      fillList('leadersMonth', monthRank.map(([n])=> n));

      fillList('leadersWeek', Array.from(new Set(week||[])));
    }).catch(()=>{
      // On failure, keep placeholders
    });
    return;
  }

  // Local-only (no remote configured)
  const localAll = getJSON(LS_KEYS.winnersAll, []);
  const localAllRank = aggregateLeaders(localAll);
  fillList('leadersAll', localAllRank.map(([n])=> n));

  const localMonth = getMonthWinners(ymKey);
  const localMonthRank = aggregateLeaders(localMonth);
  fillList('leadersMonth', localMonthRank.map(([n])=> n));

  const localWeek = getWeekWinners();
  fillList('leadersWeek', localWeek);
}

function fillList(id, items){
  const el = document.getElementById(id);
  el.innerHTML = '';
  if(items.length === 0){
    const li = document.createElement('li');
    li.textContent = '— עדיין אין נתונים —';
    el.appendChild(li);
    return;
  }
  items.forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    el.appendChild(li);
  });
}

// YouTube Integration
let ytPlayer;
let timeGuard = {
  intervalId: null,
  lastTime: 0,
  maxTime: 0
};
function onYouTubeIframeAPIReady(){
  const { videoId } = window.PARSHA_CONFIG;
  ytPlayer = new YT.Player('player', {
    width: '100%',
    videoId,
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      controls: 0,       // hide controls (no seek bar)
      disablekb: 1       // disable keyboard controls
    },
    events: {
      onReady: () => {},
      onStateChange: (e) => {
        // 0 = ended
        if(e.data === YT.PlayerState.ENDED){
          stopTimeGuard();
          unlockQuiz();
          return;
        }
        if(e.data === YT.PlayerState.PLAYING){
          startTimeGuard();
          return;
        }
        if(e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.BUFFERING){
          // keep guard running but update lastTime snapshot
          updateTimeGuardOnce();
        }
      }
    }
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function loadYouTubeAPI(){
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.body.appendChild(tag);
}

function unlockQuiz(){
  const sec = document.getElementById('quizSection');
  sec.classList.remove('hidden');
  sec.setAttribute('aria-hidden','false');
}

// Form handling
function setupForm(){
  renderQuestions();
  const form = document.getElementById('quizForm');
  // Prefill name from cookie if present
  const savedName = getCookie(COOKIE_USER);
  if(savedName) form.studentName.value = savedName;
  form.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    let name = form.studentName.value.trim();
    if(!name){ toast('נא להזין שם.'); return; }

    if(!evaluateAnswers(form)){
      toast('לא מדויק… נסו שוב לאחר צפייה חוזרת בנקודות הרלוונטיות.');
      return;
    }

    const proceed = ()=>{
      // persist name if not already saved
      if(!getCookie(COOKIE_USER)){
        setCookie(COOKIE_USER, name);
        showCurrentUser();
      }
      // success
      addWinner(name);
      renderLeaderboards();
      toast('כל הכבוד! שמך נוסף לרשימת הזוכים של השבוע.');
      // Keep name in field for convenience
      form.reset();
      form.studentName.value = getCookie(COOKIE_USER) || '';
    };

    // If cookie not set (first time), confirm and then save
    if(!getCookie(COOKIE_USER)){
      openNameConfirm(name, proceed);
    } else {
      proceed();
    }
  });
}

// Boot
(function init(){
  // Basic guard if config missing
  if(!window.PARSHA_CONFIG){
    console.error('Missing PARSHA_CONFIG');
    return;
  }
  loadYouTubeAPI();
  setupForm();
  renderLeaderboards();
  showCurrentUser();
})();

// Keep player sized on resize
// CSS handles responsive sizing; no JS resize needed

// Anti-scrubbing helpers
function startTimeGuard(){
  if(!ytPlayer) return;
  if(timeGuard.intervalId) return; // already running
  // Initialize from current time
  const t = safeTime();
  timeGuard.lastTime = t;
  timeGuard.maxTime = Math.max(timeGuard.maxTime, t);
  timeGuard.intervalId = setInterval(()=>{
    const now = safeTime();
    // forward jump beyond allowed threshold? snap back
    const allowedLead = 2; // seconds user can jump ahead (tolerance for buffering)
    if(now > timeGuard.maxTime + allowedLead){
      ytPlayer.seekTo(timeGuard.maxTime, true);
      return;
    }
    timeGuard.maxTime = Math.max(timeGuard.maxTime, now);
    timeGuard.lastTime = now;
  }, 500);
}

function stopTimeGuard(){
  if(timeGuard.intervalId){
    clearInterval(timeGuard.intervalId);
    timeGuard.intervalId = null;
  }
}

function updateTimeGuardOnce(){
  const t = safeTime();
  timeGuard.lastTime = t;
  timeGuard.maxTime = Math.max(timeGuard.maxTime, t);
}

function safeTime(){
  try { return ytPlayer?.getCurrentTime() ?? 0; } catch { return 0; }
}
