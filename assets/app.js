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

// Leaderboards
function addWinner(name){
  const weekKey = window.PARSHA_CONFIG.weekKey;
  // overall
  const all = getJSON(LS_KEYS.winnersAll, []);
  all.push({ name, dateISO: new Date().toISOString() });
  setJSON(LS_KEYS.winnersAll, all);

  // weekly
  const wkKey = `${LS_KEYS.winnersWeekPrefix}${weekKey}`;
  const wk = getJSON(wkKey, []);
  const norm = normalizeName(name);
  const wkNorms = wk.map(n => normalizeName(n));
  if(!wkNorms.includes(norm)) wk.push(name);
  setJSON(wkKey, wk);

  // remote (if configured)
  if(window.PARSHA_REMOTE?.hasConfig){
    window.PARSHA_REMOTE.remoteAddWinner(name, weekKey).catch(()=>{});
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
  // render local first for instant UI
  const localAll = getJSON(LS_KEYS.winnersAll, []);
  const localAllRank = aggregateLeaders(localAll);
  fillList('leadersAll', localAllRank.map(([n,c])=> `${n} — ${c}`));

  const localMonth = getMonthWinners(ymKey);
  const localMonthRank = aggregateLeaders(localMonth);
  fillList('leadersMonth', localMonthRank.map(([n,c])=> `${n} — ${c}`));

  const localWeek = getWeekWinners();
  fillList('leadersWeek', localWeek);

  // then try remote and merge/replace
  if(window.PARSHA_REMOTE?.hasConfig){
    window.PARSHA_REMOTE.remoteFetchAll().then(({ all, week })=>{
      const allRank = aggregateLeaders(all.map(({name,date_iso})=>({name,dateISO:date_iso})));
      fillList('leadersAll', allRank.map(([n,c])=> `${n} — ${c}`));
      const month = all.filter(x => (x.date_iso||'').startsWith(ymKey));
      const monthRank = aggregateLeaders(month.map(({name,date_iso})=>({name,dateISO:date_iso})));
      fillList('leadersMonth', monthRank.map(([n,c])=> `${n} — ${c}`));
      fillList('leadersWeek', week);
    }).catch(()=>{});
  }
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
function onYouTubeIframeAPIReady(){
  const { videoId } = window.PARSHA_CONFIG;
  ytPlayer = new YT.Player('player', {
    width: '100%',
    videoId,
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1
    },
    events: {
      onReady: () => {},
      onStateChange: (e) => {
        // 0 = ended
        if(e.data === YT.PlayerState.ENDED){
          unlockQuiz();
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
  form.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const name = form.studentName.value.trim();
    if(!name){ toast('נא להזין שם.'); return; }

    if(!evaluateAnswers(form)){
      toast('לא מדויק… נסו שוב לאחר צפייה חוזרת בנקודות הרלוונטיות.');
      return;
    }

    // success
    addWinner(name);
    renderLeaderboards();
    toast('כל הכבוד! שמך נוסף לרשימת הזוכים של השבוע.');
    form.reset();
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
})();
