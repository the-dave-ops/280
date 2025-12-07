# הוראות פריסה

## פריסה אוטומטית מלאה

המערכת כוללת סקריפט אוטומטי **מוטמע בבילד של Docker** שירוץ בעת עליית ה-containers ויבצע:

1. ✅ המתנה למסד הנתונים להיות מוכן
2. ✅ פתרון אוטומטי של מיגרציות שנכשלו (אם יש)
3. ✅ הרצת migrations אוטומטית
4. ✅ יצירת Prisma Client
5. ✅ יצירת משתמש מנהל ראשי
6. ✅ הפעלת האפליקציה

**הכל קורה אוטומטית - אין צורך בהתערבות ידנית!**

### הפעלה

```bash
# בנה והפעל את כל ה-containers
docker compose up -d --build

# המערכת תתחיל אוטומטית ותבצע את כל ההגדרות הנדרשות
# אין צורך להריץ פקודות נוספות!
```

### משתני סביבה

ניתן להגדיר את משתני הסביבה הבאים ב-`.env` או ב-`docker-compose.yml`:

- `ADMIN_EMAIL` - אימייל המנהל (ברירת מחדל: `admin@example.com`)
- `ADMIN_PASSWORD` - סיסמת המנהל (ברירת מחדל: `admin123`)
- `ADMIN_DELETE_PASSWORD` - סיסמה למחיקת מרשמים (ברירת מחדל: `admin123`)
- `SKIP_AUTH` - דלג על אימות בפיתוח (ברירת מחדל: `true`)

### בדיקת סטטוס

```bash
# בדוק את הלוגים
docker compose logs backend

# בדוק את סטטוס ה-containers
docker compose ps
```

### בדיקת סטטוס הפריסה

```bash
# הרץ סקריפט בדיקה
./check-deployment.sh

# או בדוק ידנית
docker compose ps
docker compose logs backend
```

### פתרון בעיות

**אם ה-backend לא עולה:**

1. בדוק את הלוגים:
   ```bash
   docker compose logs backend
   ```

2. בדוק שה-containers רצים:
   ```bash
   docker compose ps
   ```

3. אם ה-containers לא רצים, נסה:
   ```bash
   docker compose down
   docker compose up -d --build
   ```

4. אם יש בעיה עם ה-ports, בדוק שהם לא תפוסים:
   ```bash
   # Linux/Mac
   lsof -i :3001
   lsof -i :3000
   lsof -i :5432
   ```

### איפוס מלא (אם צריך)

```bash
# עצור ומחק הכל כולל volumes
docker compose down -v

# בנה והפעל מחדש
docker compose up -d --build
```

