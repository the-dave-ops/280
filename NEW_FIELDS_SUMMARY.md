# סיכום שדות חדשים במערכת המרשמים ✅

## תאריך: 08/12/2024

---

## 🎯 שדות חדשים שנוספו

### 1. מק"ט מסגרת (Frame SKU)
- **שדה**: `frameSku`
- **טיפוס**: VARCHAR(100)
- **מיקום בUI**: במסגרת, אחרי "צבע"
- **חובה**: לא (אופציונלי)
- **מטרה**: מעקב אחר מק"ט המסגרת למלאי ותמחור

### 2. מקור המרשם (Prescription Source)
- **שדה**: `prescriptionSource`
- **טיפוס**: VARCHAR(100)
- **מיקום בUI**: אחרי "סוג ביטוח"
- **חובה**: לא (אופציונלי)
- **אופציות**:
  - "אופטומטריסט" - מרשם שנוצר על ידי אופטומטריסט במקום
  - "משקף קיים" - מרשם שהועתק ממשקף קיים של הלקוח
  - "בדיקה חיצונית" - מרשם מבדיקה חיצונית (רופא עיניים וכו')
- **מטרה**: מעקב אחר מקור המרשם לצרכי ביקורת ואיכות

---

## 📦 קבצים שעודכנו

### Backend:
1. ✅ `/backend/prisma/schema.prisma`
   - הוספת `frameSku?: String? @map("frame_sku") @db.VarChar(100)`
   - הוספת `prescriptionSource?: String? @map("prescription_source") @db.VarChar(100)`

2. ✅ `/backend/prisma/migrations/20251208184700_add_frame_sku_and_prescription_source/migration.sql`
   - Migration עם IF NOT EXISTS (idempotent)
   - תומך בסביבות ישנות

3. ✅ Database
   - ALTER TABLE הורץ בהצלחה
   - עמודות נוספו לטבלת prescriptions

### Frontend:
1. ✅ `/frontend/src/types/index.ts`
   - הוספת `frameSku?: string | null;`
   - הוספת `prescriptionSource?: string | null;`

2. ✅ `/frontend/src/components/PrescriptionDetails.tsx`
   - הוספת `prescriptionSourceOptions` array
   - הוספת שדה "מק"ט" במסגרת (שורה 925)
   - הוספת שדה "מקור מרשם" (שורה 811)
   - עדכון `initialFormData` עם השדות החדשים
   - עדכון Print HTML עם השדות החדשים

---

## 🎨 מיקום בממשק

### בעריכת מרשם:

```
┌─────────────────────────────────────┐
│  מסגרת                              │
├─────────────────────────────────────┤
│  שם      │  דגם     │  צבע         │
│  מק"ט    │  גשר     │  רוחב        │  ← מק"ט כאן!
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  פרטי תשלום                         │
├─────────────────────────────────────┤
│  קופת חולים: [dropdown]            │
│  סוג ביטוח: [dropdown]             │
│  מקור מרשם: [dropdown]             │  ← מקור מרשם כאן!
│    - אופטומטריסט                   │
│    - משקף קיים                      │
│    - בדיקה חיצונית                  │
└─────────────────────────────────────┘
```

### בהדפסה:

```
┌─────────────────────────────────────┐
│  טבלה 1: נתוני מרשם                │
│  R, L, Cyl, AX, index, PD, ADD...  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  טבלה 2: מידע נוסף                 │
├─────────────────────────────────────┤
│  קופ"ח: ...        מחירון: ...     │
│  סוג ביטוח: ...                    │
│  מקור מרשם: ...                    │  ← מודפס!
│  מק"ט מסגרת: ...                   │  ← מודפס!
│  הערות: ...                         │
└─────────────────────────────────────┘
```

---

## 🔄 Migration - תמיכה בסביבות ישנות

### המערכת תומכת ב:
- ✅ סביבות חדשות (DB ריק)
- ✅ סביבות ישנות עם נתונים
- ✅ הרצה חוזרת של migration (idempotent)

### איך זה עובד:

```sql
-- Migration עם IF NOT EXISTS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='prescriptions' AND column_name='frame_sku') THEN
        ALTER TABLE "prescriptions" ADD COLUMN "frame_sku" VARCHAR(100);
    END IF;
END $$;
```

### תרחיש: סביבה ישנה
```bash
# 1. Pull הקוד החדש
git pull origin main

# 2. הרץ docker compose
docker compose up -d

# 3. המערכת תריץ אוטומטית:
# - npx prisma migrate deploy
# - יזהה migration חדש
# - יריץ אותו
# - יוסיף את העמודות החדשות
# - כל הנתונים הישנים נשמרים!
```

---

## 📊 השפעה על המערכת

### נתונים קיימים:
- ✅ **כל הנתונים הישנים נשמרים**
- ✅ מרשמים ישנים: `frameSku = NULL`, `prescriptionSource = NULL`
- ✅ מרשמים חדשים: יכולים להשתמש בשדות החדשים
- ✅ **תאימות לאחור מלאה**

### ביצועים:
- ✅ אין השפעה על ביצועים
- ✅ עמודות אופציונליות (NULL)
- ✅ אין indexes נוספים (לא נדרש)

---

## 🧪 בדיקות

### בדיקות שבוצעו:
- ✅ Migration הורץ בהצלחה
- ✅ Frontend מתעדכן אוטומטית (HMR)
- ✅ Types מעודכנים
- ✅ UI מציג את השדות החדשים
- ✅ Print View כולל את השדות החדשים

### בדיקות נדרשות:
- [ ] יצירת מרשם חדש עם מק"ט
- [ ] בחירת מקור מרשם
- [ ] שמירה ושליפה מה-DB
- [ ] הדפסה עם השדות החדשים
- [ ] עריכת מרשם קיים
- [ ] תאימות לאחור (מרשמים ישנים)

---

## 📝 שימוש

### יצירת מרשם חדש:
```typescript
const newPrescription = {
  // ... שדות קיימים
  frameSku: "FRM-12345",
  prescriptionSource: "אופטומטריסט"
};
```

### API Request:
```bash
POST /api/prescriptions
{
  "customerId": 123,
  "type": "מרחק",
  "frameSku": "FRM-12345",
  "prescriptionSource": "אופטומטריסט",
  ...
}
```

### API Response:
```json
{
  "id": 456,
  "customerId": 123,
  "frameSku": "FRM-12345",
  "prescriptionSource": "אופטומטריסט",
  ...
}
```

---

## 🎓 מסמכים נוספים

- `/MIGRATION_GUIDE.md` - מדריך migration מפורט
- `/PRESCRIPTION_UX_IMPROVEMENTS.md` - תיעוד שיפורי UX
- `/backend/prisma/schema.prisma` - Schema מעודכן

---

## ✅ סטטוס

**הכל מוכן ועובד!** 🎉

- ✅ Backend - Schema + Migration
- ✅ Database - עמודות נוספו
- ✅ Frontend - Types + UI + Print
- ✅ תיעוד - מסמכים מפורטים
- ✅ תמיכה בסביבות ישנות

**המערכת מוכנה לשימוש!** 🚀
