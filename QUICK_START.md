# Quick Start Guide - עדכון שדות מרשם ✅

## 🎉 העדכון הושלם בהצלחה!

השרת Backend עודכן ורץ עם כל השדות החדשים.

---

## ✅ מה עובד עכשיו:

### Backend API:
```bash
# בדיקה שהשרת עובד:
curl http://localhost:3001/api/customers

# בדיקת prescription עם שדות חדשים:
curl http://localhost:3001/api/prescriptions?limit=1
```

### Frontend:
- פתח דפדפן: http://localhost:3000
- או: http://localhost (אם רץ עם docker-compose)
- התחבר עם: `280@280.com` / `280280`

---

## 📋 השדות החדשים שזמינים:

### PRISM (6 שדות):
- `prismR`, `prismL` - ערכים: 0.25-4.00 בקפיצות 0.25
- `inOutR`, `inOutL` - ערכים: 'in' או 'out'
- `upDownR`, `upDownL` - ערכים: 'up' או 'down'

### PD (3 שדות):
- `pdR`, `pdL` - ערכים: 20.00-40.00 בקפיצות 0.5
- `pdTotal` - **מחושב אוטומטית** מ-pdR + pdL

### Height (2 שדות):
- `heightR`, `heightL` - ערכים: 16.00-35.00 בקפיצות 0.5

### Frame (1 שדה):
- `frameBridge` - החלפת frameC הישן

### VA (עודכן):
- `vaR`, `vaL` - dropdown עם ערכים: 6/5, 6/6, 6/7, 6/8, 6/9, 6/12, 6/18, 6/24, 6/36, 6/120

---

## 🧪 בדיקה מהירה:

### 1. צור מרשם חדש:
```bash
curl -X POST http://localhost:3001/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "type": "מרחק",
    "date": "2025-12-08",
    "r": -2.50,
    "l": -2.75,
    "prismR": 0.50,
    "prismL": 0.25,
    "inOutR": "in",
    "inOutL": "out",
    "upDownR": "up",
    "upDownL": "down",
    "pdR": 31.5,
    "pdL": 32.0,
    "pdTotal": 63.5,
    "heightR": 25.0,
    "heightL": 25.5,
    "vaR": "6/6",
    "vaL": "6/6",
    "frameBridge": "18"
  }'
```

### 2. קרא את המרשם:
```bash
curl http://localhost:3001/api/prescriptions/[ID]
```

---

## 🔄 פקודות שימושיות:

### הצג logs:
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### הפעל מחדש:
```bash
docker compose restart backend
docker compose restart frontend
```

### בנה מחדש (אם יש שינויים בקוד):
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### בדוק סטטוס:
```bash
docker compose ps
```

---

## 🎨 UI Features:

### AddPrescriptionModal:
- ✅ כל השדות החדשים בשורות R ו-L
- ✅ Dropdowns ל-VA, In/Out, Up/Down
- ✅ חישוב אוטומטי של pdTotal
- ✅ Validation עם min/max/step
- ✅ תוויות בעברית

### Grid Layout:
```
┌───────────────────────────────────────────────────────┐
│ R (ימין)                                              │
│ SPH | CYL | Axis | PRISM | PD | גובה                 │
│     |     |       | In/Out | Up/Down | VA            │
└───────────────────────────────────────────────────────┘
```

---

## ⚠️ שימו לב:

### Backward Compatibility:
- מרשמים ישנים ימשיכו לעבוד
- השדות החדשים הם optional
- `pd` הישן הועבר ל-`pdTotal` במהלך ה-migration

### PrescriptionDetails:
- ⏳ עדיין לא עודכן להציג את כל השדות החדשים
- זה הצעד הבא בעדכון

---

## 📚 תיעוד נוסף:

1. `/COMPLETE_UPDATE_SUMMARY.md` - סיכום מלא
2. `/PRESCRIPTION_FIELDS_DOCUMENTATION.md` - תיעוד שדות
3. `/BACKEND_API_UPDATE_COMPLETED.md` - עדכון Backend
4. `/UI_UPDATE_COMPLETED.md` - עדכון Frontend

---

## 🚀 הכל מוכן!

השרת רץ עם כל השדות החדשים.  
פתח את הדפדפן ב-http://localhost:3000 ונסה ליצור מרשם חדש!

**תאריך:** 08/12/2025  
**גרסה:** 2.0.0  
**סטטוס:** ✅ Production Ready
