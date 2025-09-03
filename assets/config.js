// Weekly configuration: set the parsha id, name, and YouTube video ID.
// Update these values each week.
window.PARSHA_CONFIG = {
  // A stable key for this week's parsha (used for week winners list)
  // Tip: using a date helps keep it unique.
  weekKey: '2025-09-05-ki-teitzei',
  // Human-friendly title shown in UI (optional)
  parshaTitle: 'פרשת כי תצא',
  // YouTube video ID for the weekly clip (must be embeddable; placeholder for now)
  // Replace with the exact video ID you want to use this week.
  videoId: 'k629oThnEZ4',
  // Two quiz questions for Parashat Ki Teitzei.
  questions: [
    {
      id: 'q1',
      text: 'איזו מצווה עוסקת ביחס לקן ציפור בפרשה?',
      options: [
        'לקחת את הביצים והאם יחד',
        'לשלח את האם לפני לקיחת הבנים',
        'לא להתקרב לקן כלל',
        'להביא את הקן הביתה ולהשגיח עליו'
      ],
      correctIndex: 1
    },
    {
      id: 'q2',
      text: 'מה מצווה התורה לעשות ביחס לעמלק בסוף הפרשה?',
      options: [
        'לקרוא לו לשלום ולשכוח מה שעשה',
        'לאהוב אותו כי הוא שכנו',
        'לזכור את אשר עשה לך עמלק ולמחות את זכרו',
        'לא להתעסק בנושא כלל'
      ],
      correctIndex: 2
    }
  ]
};
