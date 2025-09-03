// Optional backend integration (Supabase). If config is missing, functions no-op.
// To enable: set window.PARSHA_BACKEND = { supabaseUrl, supabaseAnonKey, tablePrefix } in config.js or another script.
// Expected tables (SQL examples in README sketch below):
// - <prefix>_winners (id uuid default uuid_generate_v4(), name text, date_iso text, week_key text, created_at timestamp default now())
// - <prefix>_week_winners (id uuid, name text, week_key text, created_at timestamp)

(function(){
  const hasConfig = !!window.PARSHA_BACKEND?.supabaseUrl && !!window.PARSHA_BACKEND?.supabaseAnonKey;
  let supabase = null;
  let settingsAvailable = true; // back off if settings table not found
  let customAvailable = true;   // back off if custom questions table not found

  async function ensureClient(){
    if(!hasConfig) return null;
    if(supabase) return supabase;
    // Load supabase client dynamically if not present
    if(!window.supabase){
      await new Promise((resolve, reject)=>{
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
        s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
      });
    }
    const { supabaseUrl, supabaseAnonKey } = window.PARSHA_BACKEND;
    supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    return supabase;
  }

  async function remoteAddWinner(name, weekKey){
    const client = await ensureClient();
    if(!client) return;
    const prefix = window.PARSHA_BACKEND.tablePrefix || 'parsha';
    const table = `${prefix}_winners`;
    await client.from(table).insert({ name, date_iso: new Date().toISOString(), week_key: weekKey });
    const weekTable = `${prefix}_week_winners`;
    // Insert if not exists (unique constraint recommended at DB level)
    await client.from(weekTable).insert({ name, week_key: weekKey }).catch(()=>{});
  }

  async function remoteFetchAll(){
    const client = await ensureClient();
    if(!client) return { all: [], week: [] };
    const prefix = window.PARSHA_BACKEND.tablePrefix || 'parsha';
    const weekKey = window.PARSHA_CONFIG.weekKey;

  const { data: all = [] } = await client.from(`${prefix}_winners`).select('*').order('created_at', { ascending: false });
    const { data: week = [] } = await client.from(`${prefix}_week_winners`).select('*').eq('week_key', weekKey);
  return { all, week: [...new Set(week.map(x=>x.name))] };
  }

  // Optional: active questions storage
  async function getActiveQuestions(weekKey){
    const client = await ensureClient();
    if(!client || !settingsAvailable) return null;
    const prefix = window.PARSHA_BACKEND.tablePrefix || 'parsha';
    let data, error;
    try{
      const res = await client
        .from(`${prefix}_settings`)
        .select('value')
        .eq('key', `active:${weekKey}`)
        .maybeSingle();
      data = res.data; error = res.error;
    }catch(e){ error = e; }
    if(error){ settingsAvailable = false; return null; }
    try{
      const v = data?.value && JSON.parse(data.value);
      if(Array.isArray(v) && v.length===2) return v;
    }catch{}
    return null;
  }

  async function setActiveQuestions(weekKey, ids){
    const client = await ensureClient();
    if(!client || !settingsAvailable) return;
    const prefix = window.PARSHA_BACKEND.tablePrefix || 'parsha';
    const key = `active:${weekKey}`;
    const val = JSON.stringify(ids);
    // upsert
    try{
      await client.from(`${prefix}_settings`).upsert({ key, value: val }, { onConflict: 'key' });
    }catch{
      settingsAvailable = false;
    }
  }

  // Custom questions (per week)
  async function remoteFetchCustomQuestions(weekKey){
    const client = await ensureClient();
    if(!client || !customAvailable) return [];
    const prefix = window.PARSHA_BACKEND.tablePrefix || 'parsha';
    try{
      const { data, error } = await client
        .from(`${prefix}_custom_questions`)
        .select('id, week_key, text, options, correct_index, created_at')
        .eq('week_key', weekKey)
        .order('created_at', { ascending: true });
      if(error){ customAvailable = false; return []; }
      return data || [];
    }catch{
      customAvailable = false; return [];
    }
  }

  async function remoteAddCustomQuestion(weekKey, q){
    const client = await ensureClient();
    if(!client || !customAvailable) return null;
    const prefix = window.PARSHA_BACKEND.tablePrefix || 'parsha';
    try{
      const payload = {
        week_key: weekKey,
        text: q.text,
        options: q.options,
        correct_index: q.correctIndex
      };
      const { data, error } = await client
        .from(`${prefix}_custom_questions`)
        .insert(payload)
        .select('id')
        .single();
      if(error){ customAvailable = false; return null; }
      return data?.id || null;
    }catch{
      customAvailable = false; return null;
    }
  }

  window.PARSHA_REMOTE = { remoteAddWinner, remoteFetchAll, hasConfig, getActiveQuestions, setActiveQuestions, remoteFetchCustomQuestions, remoteAddCustomQuestion };
})();
