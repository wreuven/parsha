# פרשת השבוע - אולפנת נוגה

אתר סטטי: צפו בוידאו עד הסוף, ענו על 2 שאלות רב-ברירה, והצטרפו לרשימת הזוכות. כולל טבלאות מובילות כללי/חודשי/שבועי. אופציונלי: חיבור ל-Supabase לשיתופיות בין מחשבים.

## הפעלה מקומית
- פתחו את `index.html` בדפדפן.
- אם יש בעיות בגלל file://, הפעילו שרת סטטי מקומי (אופציונלי).

## עדכון שבועי
ערכו את `assets/config.js`:
- `weekKey` — מזהה ייחודי לשבוע (למשל תאריך+פרשה)
- `parshaTitle` — שם הפרשה לתצוגה
- `videoId` — מזהה סרטון YouTube (החלק שאחרי v=)
- `questions` — שתי שאלות רב-ברירה בלבד

## חיבור אופציונלי ל-Supabase (שיתוף דירוגים)
הוסיפו בקובץ JS שמוטען לפני `assets/backend.js`:
```html
<script>
  window.PARSHA_BACKEND = {
    supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
    supabaseAnonKey: 'YOUR_PUBLIC_ANON_KEY',
    tablePrefix: 'parsha'
  };
</script>
```
צרו טבלאות `parsha_winners` ו-`parsha_week_winners` (ניתן לבקש ממני SQL מוכן).

### SQL מוכן (להדביק ב-Supabase SQL Editor)
החליפו את המקטע parsha אם תרצו prefix אחר.

```sql
-- Enable required extension for UUID (if not already enabled)
create extension if not exists pgcrypto;

-- All-time winners
create table if not exists parsha_winners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date_iso text not null,
  week_key text not null,
  created_at timestamp with time zone default now()
);

-- Week winners (unique per name per week)
create table if not exists parsha_week_winners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  week_key text not null,
  created_at timestamp with time zone default now(),
  constraint uniq_week_name unique (week_key, name)
);

-- Public read (for leaderboards) and insert-only (for winners)
-- Adjust RLS policies as needed.
alter table parsha_winners enable row level security;
alter table parsha_week_winners enable row level security;

create policy "Public read winners" on parsha_winners
  for select using ( true );
create policy "Insert winners" on parsha_winners
  for insert with check ( true );

create policy "Public read week winners" on parsha_week_winners
  for select using ( true );
create policy "Insert week winners" on parsha_week_winners
  for insert with check ( true );
```

### הפעלה מהירה
1. צרו פרויקט ב-Supabase (חינמי).
2. בהגדרות קחו Project URL ו-Anon Key.
3. פתחו SQL Editor והדביקו את ה-SQL למעלה.
4. העתיקו `assets/backend.config.example.js` ל-`assets/backend.config.js` ועדכנו את הערכים.
5. ודאו ש-`index.html` טוען את הקובץ לפני `backend.js`.
6. רעננו את האתר — הדירוגים ישותפו בין מחשבים.

## פריסה ל-GitHub Pages
המאגר כולל Workflow שמפרסם את התיקייה כולה ל-GitHub Pages אוטומטית בכל push ל-main.
צעדים:
1. צרו ריפו ב-GitHub (למשל `parsha`).
2. דחפו את הקוד לסניף `main`.
3. לשונית Settings → Pages: ודאו ש-GitHub Pages מאופשר. ה-Workflow יגדיר סביבה تلقائית.

לאחר מכן האתר יפורסם בכתובת שה-GitHub יציג (לרוב: `https://<user>.github.io/<repo>/`).

## קבצים עיקריים
- `index.html` — עמוד ראשי, נגן YouTube, חידון, וטבלאות מובילות
- `assets/app.js` — לוגיקה: נגן, פתיחת חידון לאחר סיום, בדיקת תשובות, דירוגים
- `assets/config.js` — הגדרות השבוע (וידאו, שאלות, מזהה שבוע)
- `assets/backend.js` — חיבור אופציונלי ל-Supabase
- `assets/styles.css` — עיצוב
