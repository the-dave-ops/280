# צעדים הבאים - עדכון ממשק המשתמש

## סטטוס נוכחי ✅

### הושלם:
1. ✅ עדכון Database Schema
2. ✅ Migration מוצלח
3. ✅ Prisma Client עודכן
4. ✅ קבצי קבועים נוצרו (Backend + Frontend)
5. ✅ תיעוד מלא
6. ✅ התחלת עדכון AddPrescriptionModal

### בתהליך:
- ⏳ עדכון AddPrescriptionModal - התחלנו, צריך להמשיך

### ממתין:
- ⏳ עדכון PrescriptionDetails
- ⏳ עדכון PrescriptionsList
- ⏳ עדכון Backend API

---

## שדות שצריך להוסיף ל-UI

### 1. נתוני PRISM (בסעיף נתוני עיניים)

יש להוסיף בשורות R ו-L:

```tsx
// בשורת R
<div>
  <label className="label text-sm">PRISM</label>
  <input
    type="number"
    step="0.25"
    min="0.25"
    max="4.00"
    value={formData.prismR || ''}
    onChange={(e) => handleChange('prismR', parseFloat(e.target.value) || null)}
    className="input"
    dir="ltr"
    placeholder="0.00"
  />
</div>
<div>
  <label className="label text-sm">In/Out</label>
  <select
    value={formData.inOutR || ''}
    onChange={(e) => handleChange('inOutR', e.target.value || null)}
    className="input"
  >
    <option value="">-</option>
    <option value="in">In</option>
    <option value="out">Out</option>
  </select>
</div>
<div>
  <label className="label text-sm">Up/Down</label>
  <select
    value={formData.upDownR || ''}
    onChange={(e) => handleChange('upDownR', e.target.value || null)}
    className="input"
  >
    <option value="">-</option>
    <option value="up">Up</option>
    <option value="down">Down</option>
  </select>
</div>

// אותו דבר לשורת L עם prismL, inOutL, upDownL
```

### 2. נתוני PD (בסעיף נתוני עיניים)

להוסיף בשורות R ו-L:

```tsx
// בשורת R
<div>
  <label className="label text-sm">PD</label>
  <input
    type="number"
    step="0.5"
    min="20.00"
    max="40.00"
    value={formData.pdR || ''}
    onChange={(e) => {
      const newPdR = parseFloat(e.target.value) || null;
      handleChange('pdR', newPdR);
      // חישוב אוטומטי של pdTotal
      if (newPdR && formData.pdL) {
        handleChange('pdTotal', calculatePdTotal(newPdR, formData.pdL));
      }
    }}
    className="input"
    dir="ltr"
    placeholder="31.5"
  />
</div>

// אותו דבר לשורת L עם pdL
```

### 3. נתוני גובה (בשורות R ו-L)

```tsx
<div>
  <label className="label text-sm">גובה</label>
  <input
    type="number"
    step="0.5"
    min="16.00"
    max="35.00"
    value={formData.heightR || ''}
    onChange={(e) => handleChange('heightR', parseFloat(e.target.value) || null)}
    className="input"
    dir="ltr"
    placeholder="25.0"
  />
</div>
```

### 4. PD Total (בסעיף נתונים כלליים)

```tsx
<div>
  <label className="label">PD סה"כ</label>
  <input
    type="number"
    step="0.5"
    value={formData.pdTotal || ''}
    onChange={(e) => handleChange('pdTotal', parseFloat(e.target.value) || null)}
    className="input"
    dir="ltr"
    placeholder="63.5"
    readOnly // אם רוצים שיהיה מחושב אוטומטית
  />
</div>
```

### 5. עדכון שדה VA לרשימת ערכים

```tsx
// במקום input רגיל, להשתמש ב-select או datalist
<div>
  <label className="label text-sm">Va</label>
  <select
    value={formData.vaR || ''}
    onChange={(e) => handleChange('vaR', e.target.value || null)}
    className="input"
  >
    <option value="">-</option>
    {VA_OPTIONS.map(va => (
      <option key={va} value={va}>{va}</option>
    ))}
  </select>
</div>
```

### 6. עדכון שדה Index לרשימת ערכים

```tsx
<div>
  <label className="label">אינדקס</label>
  <select
    value={formData.index || '1.56'}
    onChange={(e) => handleChange('index', e.target.value)}
    className="input"
  >
    {INDEX_OPTIONS.map(idx => (
      <option key={idx} value={idx}>{idx}</option>
    ))}
  </select>
</div>
```

### 7. עדכון שדה צבע מסגרת

```tsx
<div>
  <label className="label">צבע מסגרת</label>
  <select
    value={formData.frameColor || ''}
    onChange={(e) => handleChange('frameColor', e.target.value)}
    className="input"
  >
    <option value="">בחר צבע</option>
    {FRAME_COLOR_OPTIONS.map(color => (
      <option key={color} value={color}>{color}</option>
    ))}
  </select>
</div>
```

### 8. הוספת שדה גשר מסגרת

```tsx
<div>
  <label className="label">גשר</label>
  <input
    type="text"
    value={formData.frameBridge || ''}
    onChange={(e) => handleChange('frameBridge', e.target.value)}
    className="input"
    dir="ltr"
    placeholder="18"
  />
</div>
```

### 9. הסרת שדה frameC

יש למחוק את השדה frameC מהטופס (שורות 428-438 בקובץ המקורי).

---

## מבנה מומלץ לטופס

```
┌─────────────────────────────────────────┐
│ סוג מרשם | תאריך                        │
├─────────────────────────────────────────┤
│ נתוני עיניים                            │
│ ┌───────────────────────────────────┐   │
│ │ R (ימין)                          │   │
│ │ SPH | CYL | Axis | PRISM | In/Out│   │
│ │     |     |      |       | Up/Down│   │
│ │ PD  | VA  | גובה                  │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ L (שמאל)                          │   │
│ │ SPH | CYL | Axis | PRISM | In/Out│   │
│ │     |     |      |       | Up/Down│   │
│ │ PD  | VA  | גובה                  │   │
│ └───────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ נתונים כלליים                           │
│ ADD | אינדקס | צבע עדשות | % | PD סה"כ │
├─────────────────────────────────────────┤
│ נתוני מסגרת                             │
│ שם | דגם | צבע | גשר | רוחב            │
│ הערות מסגרת                             │
├─────────────────────────────────────────┤
│ נתונים כספיים                           │
│ קופת חולים | ביטוח | מחיר | ...        │
└─────────────────────────────────────────┘
```

---

## קבצים שצריך לעדכן

### Frontend Components

1. **`/frontend/src/components/AddPrescriptionModal.tsx`**
   - ✅ התחלנו - צריך להוסיף את כל השדות החדשים
   - הסרת שדה frameC
   - הוספת שדות PRISM, PD, גובה, גשר
   - עדכון VA, Index, frameColor ל-dropdowns

2. **`/frontend/src/components/PrescriptionDetails.tsx`**
   - הצגת כל השדות החדשים
   - הסרת pd, frameC
   - הוספת pdR, pdL, pdTotal, וכל השדות החדשים

3. **`/frontend/src/components/PrescriptionsList.tsx`**
   - עדכון התצוגה בטבלה (אם רלוונטי)

4. **`/frontend/src/types/index.ts`** (או קובץ types אחר)
   - עדכון ה-interface של Prescription

### Backend API

5. **`/backend/src/routes/prescriptions.ts`** (או קובץ routes דומה)
   - עדכון validation לשדות החדשים
   - שימוש ב-validators מ-`prescription-fields.ts`

6. **`/backend/src/controllers/prescriptions.ts`** (אם קיים)
   - עדכון הלוגיקה לטיפול בשדות החדשים

---

## דוגמת קוד מלאה - שורת R מעודכנת

```tsx
{/* R Row */}
<div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 mb-3">
  <h4 className="font-medium mb-3 text-blue-700">R (ימין)</h4>
  <div className="grid grid-cols-6 gap-3">
    {/* SPH */}
    <div>
      <label className="label text-sm">SPH</label>
      <input
        type="number"
        step="0.25"
        value={formData.r || ''}
        onChange={(e) => handleChange('r', parseFloat(e.target.value) || null)}
        className="input"
        dir="ltr"
        placeholder="0.00"
      />
    </div>
    
    {/* CYL */}
    <div>
      <label className="label text-sm">CYL</label>
      <input
        type="number"
        step="0.25"
        value={formData.cylR || ''}
        onChange={(e) => handleChange('cylR', parseFloat(e.target.value) || null)}
        className="input"
        dir="ltr"
        placeholder="0.00"
      />
    </div>
    
    {/* Axis */}
    <div>
      <label className="label text-sm">Axis</label>
      <input
        type="number"
        step="1"
        min="0"
        max="180"
        value={formData.axR || ''}
        onChange={(e) => handleChange('axR', parseFloat(e.target.value) || null)}
        className="input"
        dir="ltr"
        placeholder="0"
      />
    </div>
    
    {/* PRISM */}
    <div>
      <label className="label text-sm">PRISM</label>
      <input
        type="number"
        step="0.25"
        min="0.25"
        max="4.00"
        value={formData.prismR || ''}
        onChange={(e) => handleChange('prismR', parseFloat(e.target.value) || null)}
        className="input"
        dir="ltr"
        placeholder="0.00"
      />
    </div>
    
    {/* PD */}
    <div>
      <label className="label text-sm">PD</label>
      <input
        type="number"
        step="0.5"
        min="20.00"
        max="40.00"
        value={formData.pdR || ''}
        onChange={(e) => {
          const newPdR = parseFloat(e.target.value) || null;
          handleChange('pdR', newPdR);
          if (newPdR && formData.pdL) {
            handleChange('pdTotal', calculatePdTotal(newPdR, formData.pdL));
          }
        }}
        className="input"
        dir="ltr"
        placeholder="31.5"
      />
    </div>
    
    {/* גובה */}
    <div>
      <label className="label text-sm">גובה</label>
      <input
        type="number"
        step="0.5"
        min="16.00"
        max="35.00"
        value={formData.heightR || ''}
        onChange={(e) => handleChange('heightR', parseFloat(e.target.value) || null)}
        className="input"
        dir="ltr"
        placeholder="25.0"
      />
    </div>
  </div>
  
  {/* שורה שנייה - In/Out, Up/Down, VA */}
  <div className="grid grid-cols-6 gap-3 mt-3">
    <div className="col-span-2"></div> {/* רווח */}
    <div className="col-span-2"></div> {/* רווח */}
    
    {/* In/Out */}
    <div>
      <label className="label text-sm">In/Out</label>
      <select
        value={formData.inOutR || ''}
        onChange={(e) => handleChange('inOutR', e.target.value || null)}
        className="input"
      >
        <option value="">-</option>
        {IN_OUT_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
    
    {/* Up/Down */}
    <div>
      <label className="label text-sm">Up/Down</label>
      <select
        value={formData.upDownR || ''}
        onChange={(e) => handleChange('upDownR', e.target.value || null)}
        className="input"
      >
        <option value="">-</option>
        {UP_DOWN_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
    
    {/* VA */}
    <div>
      <label className="label text-sm">VA</label>
      <select
        value={formData.vaR || ''}
        onChange={(e) => handleChange('vaR', e.target.value || null)}
        className="input"
      >
        <option value="">-</option>
        {VA_OPTIONS.map(va => (
          <option key={va} value={va}>{va}</option>
        ))}
      </select>
    </div>
  </div>
</div>
```

---

## בדיקות לביצוע

לאחר השלמת העדכונים:

- [ ] בדוק שכל השדות החדשים מופיעים בטופס
- [ ] בדוק ש-PD Total מתחשב אוטומטית
- [ ] בדוק ש-dropdowns עובדים (VA, Index, Frame Color, In/Out, Up/Down)
- [ ] בדוק שהשדות הישנים (pd, frameC) הוסרו
- [ ] בדוק שה-validation עובד
- [ ] בדוק שהשמירה למסד הנתונים עובדת
- [ ] בדוק שהתצוגה של מרשם קיים מציגה את כל השדות

---

## הערות חשובות

1. **חישוב אוטומטי של pdTotal**: יש לוודא שכאשר משנים pdR או pdL, ה-pdTotal מתעדכן אוטומטית.

2. **Validation**: יש להשתמש ב-validators מהקובץ `prescriptionFields.ts` לפני שליחה לשרת.

3. **UI/UX**: מומלץ להשתמש ב-dropdowns עבור שדות עם רשימת ערכים מוגדרת (VA, Index, Frame Color, In/Out, Up/Down).

4. **Grid Layout**: ייתכן שתצטרך לשנות את ה-grid layout מ-`grid-cols-4` ל-`grid-cols-6` כדי להכיל את כל השדות החדשים.

5. **Mobile Responsive**: וודא שהטופס נראה טוב גם במובייל עם כל השדות החדשים.

---

**תאריך**: 08/12/2025  
**סטטוס**: בתהליך - Database ✅ | Frontend UI ⏳ | Backend API ⏳
