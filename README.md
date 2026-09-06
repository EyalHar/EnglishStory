# EnglishStory

אפליקציה ללימוד קריאה שוטפת ואוצר מילים באנגלית. המשתמש מתחבר עם חשבון Google, עובר מבחן מיון קצר לקביעת הרמה, וקורא סיפורים שנוצרים במיוחד עבורו על ידי מודל שפה (Gemini) — ברמה, בנושאים, ובמילים שמתאימים בדיוק להתקדמות שלו. כל מילה בסיפור לחיצה: אפשר לתרגם אותה לעברית (עם הבנת הקשר — כולל ביטויים כמו "flea market") או לסמן אותה כ"קשה" למעקב. בסיום כל סיפור, הרמה מתעדכנת אוטומטית, מילים ש"נשלטו" מסומנות ככאלה, והסיפור הבא משלב את המילים שעדיין דורשות תרגול.

לפירוט מלא של מה שכבר בנוי ומה מתוכנן — ראו [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Tech stack

- **Frontend:** React (Create React App), CSS Modules, RTL (עברית) עם תוכן הסיפורים ב-LTR
- **Backend:** Node.js + Express, MongoDB (Mongoose)
- **Auth:** Google Sign-In (`@react-oauth/google` + `google-auth-library`), JWT
- **LLM:** Google Gemini API (`@google/genai`) — טיר חינמי, ללא צורך בכרטיס אשראי

## מבנה הפרויקט

```
EnglishStory/
  client/   ← React frontend
  server/   ← Node.js + Express backend
  docs/     ← תיעוד סטטוס ותכנון
```

## הרצה מקומית

### דרישות מקדימות

1. **Node.js** מותקן
2. **MongoDB** — cluster ב-Atlas (יש טיר חינמי) או מופע מקומי
3. **Google OAuth Client ID** — [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create Credentials → OAuth client ID (Web application). הוסיפו את הכתובת שבה ירוץ הקליינט (למשל `http://localhost:3004`) ל-Authorized JavaScript origins.
4. **Gemini API Key** — חינמי, ללא כרטיס אשראי: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### הגדרת משתני סביבה

**`server/.env`** (העתיקו מ-`server/.env.example`):
```
PORT=5001
MONGODB_URI=<connection string ל-MongoDB>
GOOGLE_CLIENT_ID=<ה-Client ID מלמעלה>
JWT_SECRET=<מחרוזת אקראית>
GEMINI_API_KEY=<המפתח מ-AI Studio>
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
GEMINI_CLASSIFIER_MODEL=gemini-3.5-flash-lite
GEMINI_CLASSIFIER_FALLBACK_MODEL=gemini-2.5-flash-lite
```

**`client/.env`** (העתיקו מ-`client/.env.example`):
```
PORT=3000
REACT_APP_GOOGLE_CLIENT_ID=<אותו Client ID כמו בשרת>
REACT_APP_API_BASE_URL=http://localhost:5001
```

### הרצה

מהתיקייה השורשית:
```
npm install
npm run dev
```

זה מריץ את השרת (`server`, ברירת מחדל פורט 5001) ואת הקליינט (`client`, ברירת מחדל פורט 3000) יחד, עם הדפסות מסומנות `[server]`/`[client]`.

## הערת עלות

כל הרכיבים בפרויקט הזה חינמיים לחלוטין — כולל Gemini API, שיש לו טיר חינמי קבוע (לא ניסיון עם תפוגה) ללא צורך בכרטיס אשראי. יש הגבלות קצב (requests per minute/day) שמתאימות בנוחות לשימוש אישי.
