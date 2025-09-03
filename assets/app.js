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

// Active questions selection
const ACTIVE_KEY_LOCAL = `${NS}:activeQuestions:`; // + weekKey -> [ids]

async function getActiveQuestionIds(){
  const wk = window.PARSHA_CONFIG.weekKey;
  if(isRemoteEnabled()){
    try{
      const ids = await window.PARSHA_REMOTE.getActiveQuestions?.(wk);
      if(Array.isArray(ids) && ids.length===2) return ids;
    }catch{}
  }
  // local fallback
  return getJSON(`${ACTIVE_KEY_LOCAL}${wk}`, null) || defaultActiveIds();
}

function setActiveQuestionIds(ids){
  const wk = window.PARSHA_CONFIG.weekKey;
  if(isRemoteEnabled() && window.PARSHA_REMOTE.setActiveQuestions){
    return window.PARSHA_REMOTE.setActiveQuestions(wk, ids).catch(()=>{
      // also store locally as a fallback
      setJSON(`${ACTIVE_KEY_LOCAL}${wk}`, ids);
    });
  }
  setJSON(`${ACTIVE_KEY_LOCAL}${wk}`, ids);
  return Promise.resolve();
}

function defaultActiveIds(){
  const { questions } = window.PARSHA_CONFIG;
  return [questions[0]?.id, questions[1]?.id].filter(Boolean);
}

function getQuestionById(id){
  return window.PARSHA_CONFIG.questions.find(q=> q.id===id);
}

// Quiz rendering
async function renderQuestions(){
  const wrap = document.getElementById('questions');
  wrap.innerHTML = '';
  const activeIds = await getActiveQuestionIds();
  const active = activeIds.map(getQuestionById).filter(Boolean);
  active.forEach((q, qi)=>{
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

async function evaluateAnswers(form){
  const activeIds = await getActiveQuestionIds();
  const qs = activeIds.map(getQuestionById).filter(Boolean);
  let correct = 0;
  qs.forEach(q=>{
    const val = form.querySelector(`input[name="${q.id}"]:checked`);
    if(val && Number(val.value) === q.correctIndex) correct++;
  });
  return correct === qs.length && qs.length === 2;
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
  // Remote only: return the Promise so caller can await
  return window.PARSHA_REMOTE.remoteAddWinner(name, weekKey).catch(()=>{});
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
  return Promise.resolve();
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

      // Compute weekly winners from the main winners table to avoid reliance on a second table
      const wkKey = window.PARSHA_CONFIG.weekKey;
      const weekNames = Array.from(new Set(all.filter(x => (x.week_key||'') === wkKey).map(x => x.name)));
      fillList('leadersWeek', weekNames);
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
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    let name = form.studentName.value.trim();
    if(!name){ toast('נא להזין שם.'); return; }

    if(!(await evaluateAnswers(form))){
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
      addWinner(name)
        .finally(() => {
          renderLeaderboards();
        });
  toast('כל הכבוד! שמך נוסף לרשימת הזוכות של השבוע.');
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
  // Setup mode toggle via ?setup or #setup
  const isSetup = new URLSearchParams(location.search).has('setup') || (location.hash||'').toLowerCase().includes('setup');
  if(isSetup){
    const badge = document.getElementById('setupBadge');
    if(badge){ badge.classList.remove('hidden'); }
    buildSetupPanel();
    showCurrentUser();
    return; // skip loading video/quiz/leaderboards in setup mode
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

// Setup UI
async function buildSetupPanel(){
  const sec = document.getElementById('setupSection');
  const div = document.getElementById('setupContent');
  if(!sec || !div) return;
  sec.classList.remove('hidden');
  sec.setAttribute('aria-hidden','false');
  // Hide other sections while in setup mode
  document.querySelectorAll('main .card').forEach(el=>{
    if(el !== sec) el.classList.add('hidden');
  });

  const activeIds = await getActiveQuestionIds();
  const qs = window.PARSHA_CONFIG.questions;
  div.innerHTML = '';

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gridTemplateColumns = '1fr';
  list.style.gap = '.5rem';
  qs.forEach(q => {
    const id = `setup_${q.id}`;
    const wrap = document.createElement('div');
    wrap.style.border = '1px solid rgba(255,255,255,.15)';
    wrap.style.borderRadius = '10px';
    wrap.style.padding = '.6rem .8rem';
    wrap.style.background = 'rgba(255,255,255,.03)';

    const head = document.createElement('label');
    head.setAttribute('for', id);
    head.style.display = 'flex';
    head.style.gap = '.5rem';
    head.style.alignItems = 'flex-start';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.value = q.id;
    cb.checked = activeIds.includes(q.id);

    const title = document.createElement('strong');
    title.textContent = q.text;

    head.appendChild(cb);
    head.appendChild(title);
    wrap.appendChild(head);

    const opts = document.createElement('ul');
    opts.style.margin = '.5rem 0 0';
    opts.style.paddingInlineStart = '1.2rem';
    q.options.forEach((opt, oi)=>{
      const li = document.createElement('li');
      if(oi === q.correctIndex){
        const s = document.createElement('span');
        s.innerHTML = `<strong>${opt}</strong>  ✓`;
        li.appendChild(s);
      } else {
        li.textContent = opt;
      }
      opts.appendChild(li);
    });
    wrap.appendChild(opts);
    list.appendChild(wrap);
  });
  div.appendChild(list);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '.5rem';
  actions.style.marginTop = '1rem';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'primary';
  saveBtn.textContent = 'שמירת בחירה (2 שאלות)';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'secondary';
  cancelBtn.textContent = 'ביטול שינויים';
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  div.appendChild(actions);

  cancelBtn.addEventListener('click', async ()=>{
    await renderQuestions();
  });

  saveBtn.addEventListener('click', async ()=>{
    const selected = Array.from(div.querySelectorAll('input[type="checkbox"]:checked')).map(el=> el.value);
    if(selected.length !== 2){
      alert('יש לבחור בדיוק 2 שאלות פעילות.');
      return;
    }
    await setActiveQuestionIds(selected);
    await renderQuestions();
    alert('נשמר!');
  });
}
