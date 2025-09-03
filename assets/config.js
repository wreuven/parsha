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
  // Ten quiz questions for Parashat Ki Teitzei. The app will use 2 active ones.
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
    },
    {
      id: 'q3',
      text: 'מה יש לעשות לגבי אבידה שנמצאה לפי הפרשה?',
      options: [
        'להתעלם ולהמשיך',
        'להחזיר לבעלים לאחר סימנים',
        'לשמור לעצמי מיד',
        'למכור ולתת צדקה'
      ],
      correctIndex: 1
    },
    {
      id: 'q4',
      text: 'איזו מצווה קשורה לבגד בעל ארבע כנפות?',
      options: [
        'לא לשים בו צבעים שונים',
        'להוסיף לו פעמונים',
        'לעשות גדילים (ציצית) על ארבע הכנפות',
        'להימנע מללבוש אותו'
      ],
      correctIndex: 2
    },
    {
      id: 'q5',
      text: 'איזו הגבלה חלה על קישור חיות ועבודה יחד?',
      options: [
        'אסור לחרוש בשור וחמור יחד',
        'אסור להשקות צאן ובקר יחד',
        'אסור לרעות בשדה משותפת',
        'מותר הכול בלי הגבלה'
      ],
      correctIndex: 0
    },
    {
      id: 'q6',
      text: 'מה האיסור לגבי שעטנז בפרשה?',
      options: [
        'אסור ללבוש בגד צמר לבדו',
        'אסור ללבוש בגד פשתן לבדו',
        'אסור ללבוש צמר ופשתן יחד',
        'הכול מותר'
      ],
      correctIndex: 2
    },
    {
      id: 'q7',
      text: 'מה הדין לגבי שכר שכיר?',
      options: [
        'מותר לעכב עד שבוע',
        'יש לשלם בו ביום; לא תלין פעולת שכיר',
        'רק אם העובד מתלונן צריך לשלם',
        'אין הוראה בפרשה'
      ],
      correctIndex: 1
    },
    {
      id: 'q8',
      text: 'מה נאסר לגבי לקיחת משכון לעני?',
      options: [
        'אסור לקחת משכון כלל',
        'מותר לקחת רחיים ונפש כמשכון',
        'אסור לקחת רחיים ונפש כמשכון',
        'מותר רק ביום'
      ],
      correctIndex: 2
    },
    {
      id: 'q9',
      text: 'מה היחס לעבד הנמלט אליך?',
      options: [
        'להשיבו לאדוניו מיד',
        'לא להסגירו; יגור בקרבך במקום שיבחר',
        'להענישו על הבריחה',
        'לגרשו מן המחנה'
      ],
      correctIndex: 1
    },
    {
      id: 'q10',
      text: 'כיצד נוהגים בשכחה בשדה (עומר שנשכח)?',
      options: [
        'לחזור לקחתו מיד',
        'להותירו לגר ליתום ולאלמנה',
        'למכור ולתת מעשר',
        'אין דין מיוחד'
      ],
      correctIndex: 1
    }
  ]
};
