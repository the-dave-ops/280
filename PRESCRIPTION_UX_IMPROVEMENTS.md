# שיפורי UX למערכת המרשמים 🎯

## סטטוס: בתהליך ⏳

---

## 📋 סיכום השינויים

### 1. ✅ שדות חדשים שנוספו

#### מק"ט מסגרת (Frame SKU)
- **שדה**: `frameSku`
- **טיפוס**: VARCHAR(100)
- **מיקום**: במסגרת, אחרי Frame Color
- **מטרה**: מעקב אחר מק"ט המסגרת

#### מקור המרשם (Prescription Source)
- **שדה**: `prescriptionSource`
- **טיפוס**: VARCHAR(100)
- **אופציות**:
  - "אופטומטריסט" - מרשם שנוצר על ידי אופטומטריסט
  - "משקף קיים" - מרשם שהועתק ממשקף קיים
  - "בדיקה חיצונית" - מרשם מבדיקה חיצונית
- **מטרה**: מעקב אחר מקור המרשם לצרכי ביקורת ואיכות

---

### 2. ⏳ שינויים בסדר שדות

#### PD לפני PRISM
- **לפני**: PRISM → PD → Height
- **אחרי**: PD → PRISM → Height
- **סיבה**: PD נמצא בשימוש תכוף יותר

---

### 3. ⏳ שדות מתקדמים מוסתרים

#### שדות שיוסתרו כברירת מחדל:
1. **PRISM** - prismR, prismL, inOutR, inOutL, upDownR, upDownL
2. **Height** - heightR, heightL
3. **VA** - vaR, vaL

#### כפתור הרחבה:
- **טקסט**: "שדות מתקדמים >>"
- **מיקום**: אחרי השדות הבסיסיים
- **פעולה**: לחיצה תציג/תסתיר את השדות המתקדמים
- **סיבה**: ברוב המקרים השדות האלו לא בשימוש

---

## 🗂️ קבצים שעודכנו

### Backend:
- ✅ `/backend/prisma/schema.prisma`
  - הוספת `frameSku`
  - הוספת `prescriptionSource`
  
- ✅ `/backend/prisma/migrations/20251208_add_frame_sku_and_prescription_source/migration.sql`
  - ALTER TABLE prescriptions

- ✅ Database
  - הרצת migration

### Frontend (בתהליך):
- ⏳ `/frontend/src/types/index.ts`
  - הוספת frameSku ו-prescriptionSource ל-Prescription interface
  
- ⏳ `/frontend/src/components/PrescriptionDetails.tsx`
  - שינוי סדר שדות (PD לפני PRISM)
  - הוספת state לשדות מתקדמים
  - הוספת כפתור הרחבה
  - הוספת dropdown למקור מרשם
  
- ⏳ `/frontend/src/components/AddPrescriptionModal.tsx`
  - הוספת שדה מק"ט
  - הוספת dropdown למקור מרשם

---

## 📝 צעדים הבאים

### שלב 1: עדכון Types ✅
```typescript
interface Prescription {
  // ... existing fields
  frameSku?: string | null;
  prescriptionSource?: string | null;
}
```

### שלב 2: עדכון PrescriptionDetails ⏳
1. הוספת state:
```typescript
const [showAdvancedFields, setShowAdvancedFields] = useState(false);
```

2. שינוי סדר שדות - PD לפני PRISM

3. הוספת כפתור הרחבה:
```tsx
<button onClick={() => setShowAdvancedFields(!showAdvancedFields)}>
  {showAdvancedFields ? 'הסתר שדות מתקדמים <<' : 'שדות מתקדמים >>'}
</button>
```

4. הוספת conditional rendering:
```tsx
{showAdvancedFields && (
  <>
    {/* PRISM fields */}
    {/* Height fields */}
    {/* VA fields */}
  </>
)}
```

5. הוספת dropdown למקור מרשם:
```tsx
<select value={formData.prescriptionSource || ''}>
  <option value="">בחר מקור</option>
  <option value="אופטומטריסט">אופטומטריסט</option>
  <option value="משקף קיים">משקף קיים</option>
  <option value="בדיקה חיצונית">בדיקה חיצונית</option>
</select>
```

### שלב 3: עדכון AddPrescriptionModal ⏳
1. הוספת שדה מק"ט במסגרת
2. הוספת dropdown למקור מרשם

### שלב 4: עדכון Backend Routes ⏳
1. הוספת validation ל-prescriptionSource
2. עדכון API documentation

### שלב 5: עדכון Print View ⏳
1. הוספת frameSku להדפסה
2. הוספת prescriptionSource להדפסה

---

## 🎯 יתרונות השיפורים

### 1. חוויית משתמש משופרת
- ✅ ממשק נקי יותר - שדות לא רלוונטיים מוסתרים
- ✅ גישה מהירה לשדות נפוצים
- ✅ אפשרות להרחיב לשדות מתקדמים בלחיצה

### 2. מעקב ובקרה
- ✅ מעקב אחר מקור המרשם
- ✅ מעקב אחר מק"ט מסגרת
- ✅ שיפור ביקורת ואיכות

### 3. ארגון טוב יותר
- ✅ סדר לוגי של שדות (PD לפני PRISM)
- ✅ הפרדה בין שדות בסיסיים למתקדמים

---

## 📊 השפעה על ביצועים

- **זמן טעינה**: ללא שינוי (שדות נטענים אבל מוסתרים)
- **זמן מילוי טופס**: משופר (פחות שדות גלויים)
- **שגיאות משתמש**: צפוי לרדת (פחות בלבול)

---

## 🧪 בדיקות נדרשות

- [ ] יצירת מרשם חדש עם מק"ט
- [ ] בחירת מקור מרשם
- [ ] הצגה/הסתרה של שדות מתקדמים
- [ ] שמירה עם שדות חדשים
- [ ] הדפסה עם שדות חדשים
- [ ] עריכת מרשם קיים
- [ ] תאימות לאחור (מרשמים ישנים ללא שדות חדשים)

---

## 📅 Timeline

- **08/12/2024 18:45** - התחלת פיתוח
- **08/12/2024** - עדכון schema ו-migration ✅
- **בהמשך** - עדכון frontend ⏳

---

## 💡 הערות

1. השדות החדשים הם אופציונליים - תאימות לאחור מלאה
2. כפתור ההרחבה יישמר במצב סגור כברירת מחדל
3. במצב עריכה, אם יש ערכים בשדות מתקדמים, הכפתור יהיה פתוח אוטומטית
