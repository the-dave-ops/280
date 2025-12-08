# מדריך Migration לסביבות ישנות 🔄

## סקירה כללית

המערכת מוכנה לעבוד עם סביבות ישנות! כל migration בנוי בצורה שתומכת ב-**idempotency** - כלומר, אפשר להריץ אותו מספר פעמים ללא בעיות.

---

## 🎯 איך זה עובד?

### 1. המערכת מזהה אוטומטית migrations חדשים

כאשר מריצים `docker compose up`:

```bash
docker compose up -d
```

ה-backend מריץ אוטומטית:
```bash
npx prisma migrate deploy
```

### 2. Prisma בודק מה הורץ ומה לא

Prisma שומר רשימה של migrations שהורצו בטבלה:
```sql
_prisma_migrations
```

### 3. רק migrations חדשים מורצים

אם migration כבר הורץ - הוא מדולג:
```
4 migrations found in prisma/migrations
No pending migrations to apply.
```

---

## 🔒 אבטחה: IF NOT EXISTS

כל migration בנוי עם בדיקות `IF NOT EXISTS`:

```sql
-- Add frame_sku column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='prescriptions' AND column_name='frame_sku') THEN
        ALTER TABLE "prescriptions" ADD COLUMN "frame_sku" VARCHAR(100);
    END IF;
END $$;
```

**זה מבטיח:**
- ✅ אם העמודה לא קיימת - היא נוספת
- ✅ אם העמודה כבר קיימת - לא קורה כלום
- ✅ אין שגיאות גם אם מריצים פעמיים

---

## 📦 תרחיש: סביבה ישנה עם נתונים

### מצב התחלתי:
```
סביבה ישנה:
├─ DB עם נתונים ישנים
├─ prescriptions table ללא frame_sku
└─ prescriptions table ללא prescription_source
```

### צעדים:

#### 1. Pull הקוד החדש
```bash
git pull origin main
```

#### 2. הרץ docker compose
```bash
docker compose down
docker compose up -d
```

#### 3. מה קורה אוטומטית:

```
🔄 Backend מתחיל...
   ↓
🔍 Prisma בודק migrations
   ↓
📋 מוצא migration חדש: 20251208184700_add_frame_sku_and_prescription_source
   ↓
✅ מריץ את ה-migration
   ↓
🎉 העמודות נוספו!
   ↓
🚀 Backend מתחיל לרוץ
```

#### 4. התוצאה:
```
סביבה מעודכנת:
├─ DB עם כל הנתונים הישנים (שמורים!)
├─ prescriptions table עם frame_sku ✅
└─ prescriptions table עם prescription_source ✅
```

---

## 🧪 בדיקה: האם זה עובד?

### בדיקה 1: סביבה חדשה (ללא נתונים)
```bash
docker compose down -v  # מוחק הכל
docker compose up -d
```
**תוצאה צפויה:** ✅ כל ה-migrations רצים, DB נוצר מאפס

### בדיקה 2: סביבה קיימת (עם נתונים)
```bash
docker compose down      # שומר את ה-volume
docker compose up -d
```
**תוצאה צפויה:** ✅ רק migrations חדשים רצים, נתונים נשמרים

### בדיקה 3: הרצה חוזרת
```bash
docker compose restart backend
```
**תוצאה צפויה:** ✅ "No pending migrations to apply"

---

## 📊 רשימת Migrations

### Migrations קיימים:

1. **20251206000000_init**
   - יצירת טבלאות בסיסיות

2. **20251208000000_add_prescription_fields**
   - הוספת PRISM, PD, Height, VA

3. **20251208111651_add_customer_relations**
   - הוספת קשרים בין לקוחות

4. **20251208184700_add_frame_sku_and_prescription_source** ⭐ חדש!
   - הוספת מק"ט מסגרת
   - הוספת מקור מרשם

---

## 🔧 פתרון בעיות

### בעיה: Migration נכשל

**תסמינים:**
```
Error: P3009
migrate found failed migration
```

**פתרון:**
```bash
# 1. בדוק את הלוגים
docker compose logs backend

# 2. התחבר ל-DB ובדוק ידנית
docker compose exec db psql -U optometry_user -d optometry_user

# 3. בדוק אילו migrations הורצו
SELECT * FROM _prisma_migrations ORDER BY started_at DESC;

# 4. אם צריך - הרץ את ה-migration ידנית
\i /path/to/migration.sql
```

### בעיה: עמודה כבר קיימת

**תסמינים:**
```
ERROR: column "frame_sku" of relation "prescriptions" already exists
```

**פתרון:**
זה לא אמור לקרות! ה-migration בנוי עם `IF NOT EXISTS`.
אבל אם זה קרה:

```sql
-- בדוק אם העמודה קיימת
SELECT column_name 
FROM information_schema.columns 
WHERE table_name='prescriptions' 
  AND column_name IN ('frame_sku', 'prescription_source');

-- אם קיימת - סמן את ה-migration כהורץ
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) 
VALUES (gen_random_uuid(), '0', NOW(), '20251208184700_add_frame_sku_and_prescription_source', NULL, NULL, NOW(), 1);
```

---

## 🚀 Deploy לסביבת Production

### צעדים מומלצים:

#### 1. גיבוי לפני הכל!
```bash
# גיבוי DB
docker compose exec db pg_dump -U optometry_user optometry_user > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. Pull הקוד
```bash
git pull origin main
```

#### 3. בדוק את ה-migrations
```bash
cd backend
npx prisma migrate status
```

#### 4. הרץ את המערכת
```bash
docker compose down
docker compose up -d
```

#### 5. בדוק שהכל עובד
```bash
# בדוק logs
docker compose logs backend --tail 50

# בדוק שה-backend רץ
curl http://localhost:3001/health

# בדוק שהעמודות נוספו
docker compose exec db psql -U optometry_user -d optometry_user -c "\d prescriptions"
```

---

## ✅ Checklist לפני Deploy

- [ ] גיבוי DB בוצע
- [ ] הקוד החדש נמצא ב-main branch
- [ ] בדקתי את ה-migrations locally
- [ ] יש לי גישה ל-server
- [ ] יש לי תוכנית rollback (איך לחזור אחורה)
- [ ] צוות מוכן לתמוך במקרה של בעיה

---

## 🔄 Rollback (חזרה אחורה)

אם משהו השתבש:

### אופציה 1: שחזור מגיבוי
```bash
# עצור את המערכת
docker compose down

# שחזר את ה-DB
docker compose up -d db
docker compose exec -T db psql -U optometry_user optometry_user < backup_YYYYMMDD_HHMMSS.sql

# הרץ את הגרסה הישנה
git checkout <old-commit>
docker compose up -d
```

### אופציה 2: הסרת עמודות (לא מומלץ!)
```sql
ALTER TABLE prescriptions DROP COLUMN IF EXISTS frame_sku;
ALTER TABLE prescriptions DROP COLUMN IF EXISTS prescription_source;
```

---

## 📝 הערות חשובות

1. **תמיד עשה גיבוי לפני migration בproduction!**
2. **בדוק ב-staging לפני production**
3. **ה-migrations הם idempotent - בטוח להריץ מספר פעמים**
4. **נתונים ישנים נשמרים תמיד - רק עמודות חדשות נוספות**
5. **עמודות חדשות הן NULL by default - לא משבש נתונים קיימים**

---

## 🎓 למידע נוסף

- [Prisma Migrations Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**סיכום:** המערכת מוכנה לעבוד עם סביבות ישנות! פשוט תריץ `docker compose up -d` והכל יעבוד אוטומטית. 🚀✨
