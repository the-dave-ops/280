# הוראות התקנה והפעלה

## התקנה מהירה עם Docker

1. **הפעל את כל השירותים:**
   ```bash
   docker-compose up -d
   ```

2. **הרץ מיגרציות של מסד הנתונים:**
   ```bash
   docker-compose exec backend npx prisma migrate dev --name init
   ```

3. **צור Prisma Client:**
   ```bash
   docker-compose exec backend npx prisma generate
   ```

4. **פתח בדפדפן:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## התקנה מקומית (ללא Docker)

### דרישות מוקדמות
- Node.js 18+
- PostgreSQL 15+
- npm או yarn

### Backend

```bash
cd backend
npm install

# צור קובץ .env
cp .env.example .env
# ערוך את .env והגדר:
# DATABASE_URL=postgresql://user:password@localhost:5432/optometry_db

# הרץ מיגרציות
npx prisma migrate dev

# צור Prisma Client
npx prisma generate

# הפעל שרת פיתוח
npm run dev
```

### Frontend

```bash
cd frontend
npm install

# צור קובץ .env
cp .env.example .env
# ערוך את .env והגדר:
# VITE_API_URL=http://localhost:3001

# הפעל שרת פיתוח
npm run dev
```

## פתרון בעיות

### בעיות חיבור למסד נתונים
- ודא ש-PostgreSQL פועל
- בדוק את ה-DATABASE_URL בקובץ .env
- ודא שהמסד נתונים קיים

### בעיות פורטים
- אם פורט 3000, 3001 או 5432 תפוסים, שנה אותם ב-docker-compose.yml
- עדכן את FRONTEND_URL ו-VITE_API_URL בהתאם

### איפוס מסד נתונים
```bash
# אזהרה: מוחק את כל הנתונים!
docker-compose exec backend npx prisma migrate reset
```

## שימוש ראשוני

1. פתח את האתר ב-http://localhost:3000
2. חפש לקוח לפי שם, תעודת זהות או טלפון
3. בחר לקוח כדי לראות את כל הפרטים
4. צור מרשם חדש או ערוך מרשם קיים
5. השתמש בפונקציות: שכפול, המרה לקריאה, יצירת PDF

## מבנה הפרויקט

```
280-new/
├── frontend/        # אפליקציית React
├── backend/         # שרת Express
├── database/        # סקריפטים למסד נתונים
└── docker-compose.yml
```

## תמיכה

לשאלות או בעיות, בדוק את ה-README.md הראשי.

