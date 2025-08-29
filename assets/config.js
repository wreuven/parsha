// Weekly configuration: set the parsha id, name, and YouTube video ID.
// Update these values each week.
window.PARSHA_CONFIG = {
  // A stable key for this week's parsha (used for week winners list)
  // Tip: using a date helps keep it unique.
  weekKey: '2025-08-29-shoftim',
  // Human-friendly title shown in UI (optional)
  parshaTitle: 'פרשת שופטים',
  // YouTube video ID for the weekly clip (must be embeddable; placeholder for now)
  // Replace with the exact video ID you want to use this week.
  videoId: 'ylOlVTXfEI0',
  // Two quiz questions for Parashat Shoftim.
  questions: [
    {
      id: 'q1',
      text: 'כמה עדים נדרשים כדי להעמיד אדם בדין (לדיני נפשות ועונשים חמורים)?',
      options: [
        'עד אחד',
        'שניים או שלושה עדים',
        'שלושה עדים בלבד',
        'עשרה עדים'
      ],
      correctIndex: 1
    },
    {
      id: 'q2',
      text: 'מה מן הבאים אסור למלך להרבות לפי הפרשה?',
      options: [
        'סוסים',
        'נשים',
        'כסף וזהב',
        'כל התשובות נכונות'
      ],
      correctIndex: 3
    }
  ]
};
