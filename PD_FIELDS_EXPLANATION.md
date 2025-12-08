# הסבר על שדות PD במערכת ✅

## תאריך: 08/12/2025

---

## 📋 סקירה כללית

המערכת תומכת ב-3 שדות PD:
1. **pdR** - PD עין ימין
2. **pdL** - PD עין שמאל  
3. **pdTotal** - סה"כ PD (חישוב אוטומטי)

---

## 🔢 ערכים מותרים

### pdR ו-pdL:
- **טווח**: 20.00 - 40.00
- **קפיצות**: 0.5
- **דוגמאות**: 20.0, 20.5, 21.0, 21.5, ..., 39.5, 40.0

### pdTotal:
- **חישוב אוטומטי**: pdR + pdL
- **דוגמה**: אם pdR=31.5 ו-pdL=32.0, אז pdTotal=63.5

---

## 📍 מיקום בממשק

### AddPrescriptionModal (יצירת מרשם חדש):

**שורת R (ימין):**
```
┌─────────────────────────────────────┐
│ SPH | CYL | Axis | PRISM | PD | ... │
│                           ^^         │
│                           pdR        │
└─────────────────────────────────────┘
```

**שורת L (שמאל):**
```
┌─────────────────────────────────────┐
│ SPH | CYL | Axis | PRISM | PD | ... │
│                           ^^         │
│                           pdL        │
└─────────────────────────────────────┘
```

**נתונים כלליים:**
```
┌─────────────────────────────────────┐
│ PD Total | Add | index | color | %  │
│ ^^^^^^^^                             │
│ pdTotal (חישוב אוטומטי)             │
└─────────────────────────────────────┘
```

### PrescriptionDetails (צפייה/עריכת מרשם):

**אותו מבנה בדיוק** - pdR ו-pdL בשורות R ו-L, ו-pdTotal ב-"נתונים כלליים"

---

## ⚙️ חישוב אוטומטי

### ב-AddPrescriptionModal:

```typescript
// כשמשנים pdR:
handleChange('pdTotal', calculatePdTotal(newPdR, formData.pdL));

// כשמשנים pdL:
handleChange('pdTotal', calculatePdTotal(formData.pdR, newPdL));

// פונקציית החישוב:
export const calculatePdTotal = (pdR: number, pdL: number): number => {
  return Number((pdR + pdL).toFixed(1));
};
```

### דוגמה:
1. משתמש מזין `pdR = 31.5`
2. משתמש מזין `pdL = 32.0`
3. **המערכת מחשבת אוטומטית**: `pdTotal = 63.5`

---

## 🎯 Validation

### Frontend:
```typescript
// בקובץ prescriptionFields.ts:
export const PD_RANGE = { 
  min: 20.00, 
  max: 40.00, 
  step: 0.5 
};
```

### Backend:
```typescript
// בקובץ routes/prescriptions.ts:
const prescriptionCreateSchema = z.object({
  pdR: z.number().nullable().optional(),
  pdL: z.number().nullable().optional(),
  pdTotal: z.number().nullable().optional(),
  // ...
});
```

---

## 📊 דוגמאות שימוש

### דוגמה 1: מרשם רגיל
```json
{
  "pdR": 31.5,
  "pdL": 32.0,
  "pdTotal": 63.5
}
```

### דוגמה 2: מרשם עם PD שונה
```json
{
  "pdR": 28.0,
  "pdL": 29.5,
  "pdTotal": 57.5
}
```

### דוגמה 3: מרשם ללא PD
```json
{
  "pdR": null,
  "pdL": null,
  "pdTotal": null
}
```

---

## 🔄 Backward Compatibility

### מרשמים ישנים:
מרשמים ישנים שהיו עם שדה `pd` הועברו ל-`pdTotal` במהלך ה-migration:

```sql
-- Migration:
UPDATE "Prescription" 
SET "pdTotal" = "pd" 
WHERE "pd" IS NOT NULL;
```

---

## ✅ מה עובד

1. ✅ **יצירת מרשם חדש** - pdR, pdL נשמרים, pdTotal מחושב אוטומטית
2. ✅ **עריכת מרשם** - ניתן לערוך את כל 3 השדות
3. ✅ **צפייה במרשם** - כל 3 השדות מוצגים
4. ✅ **המרה לקריאה** - pdTotal מועבר למרשם הקריאה (עם -3)
5. ✅ **PDF Generation** - pdTotal מופיע ב-PDF
6. ✅ **Backward compatibility** - מרשמים ישנים עובדים

---

## 📝 הערות חשובות

### 1. חישוב אוטומטי רק ב-AddPrescriptionModal:
- בעת **יצירת מרשם חדש** - pdTotal מחושב אוטומטית
- בעת **עריכת מרשם** - pdTotal לא מחושב אוטומטית (ניתן לערוך ידנית)

### 2. כל השדות הם Optional:
- לא חובה למלא pdR או pdL
- אם לא ממלאים, pdTotal יהיה null

### 3. Step ו-Min/Max:
- **Step**: 0.5 (קפיצות של חצי)
- **Min**: 20.0
- **Max**: 40.0

---

## 🚀 סיכום

המערכת תומכת במלואה בשדות PD:
- ✅ pdR ו-pdL בשורות R ו-L
- ✅ pdTotal ב-"נתונים כלליים"
- ✅ חישוב אוטומטי ב-AddPrescriptionModal
- ✅ Validation מלא
- ✅ Backward compatibility

**הכל עובד ומוכן לשימוש!** 🎉

---

**תאריך:** 08/12/2025  
**גרסה:** 2.0.0  
**סטטוס:** ✅ מוטמע במלואו
