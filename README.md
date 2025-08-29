# פרשת השבוע - אולפנת נוגה

אתר סטטי: צפו בוידאו עד הסוף, ענו על 2 שאלות רב-ברירה, והצטרפו לרשימת הזוכים. כולל טבלאות מובילים כללי/חודשי/שבועי. אופציונלי: חיבור ל-Supabase לשיתופיות בין מחשבים.

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

## פריסה ל-GitHub Pages
המאגר כולל Workflow שמפרסם את התיקייה כולה ל-GitHub Pages אוטומטית בכל push ל-main.
צעדים:
1. צרו ריפו ב-GitHub (למשל `parsha`).
2. דחפו את הקוד לסניף `main`.
3. לשונית Settings → Pages: ודאו ש-GitHub Pages מאופשר. ה-Workflow יגדיר סביבה تلقائית.

לאחר מכן האתר יפורסם בכתובת שה-GitHub יציג (לרוב: `https://<user>.github.io/<repo>/`).

## קבצים עיקריים
- `index.html` — עמוד ראשי, נגן YouTube, חידון, וטבלאות מובילים
- `assets/app.js` — לוגיקה: נגן, פתיחת חידון לאחר סיום, בדיקת תשובות, דירוגים
- `assets/config.js` — הגדרות השבוע (וידאו, שאלות, מזהה שבוע)
- `assets/backend.js` — חיבור אופציונלי ל-Supabase
- `assets/styles.css` — עיצוב
