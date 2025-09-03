// Copy this file to backend.config.js and update the values.
// Then include it in index.html BEFORE backend.js:
// <script src="./assets/backend.config.js"></script>
// <script src="./assets/backend.js"></script>

window.PARSHA_BACKEND = {
  supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLIC_ANON_KEY',
  tablePrefix: 'parsha'
};
