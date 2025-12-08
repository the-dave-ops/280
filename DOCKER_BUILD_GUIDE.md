# Docker Build Guide 🐳

מדריך לבניית ה-images בסביבות שונות

## 📋 סקירה כללית

יש לנו שני סוגי Dockerfiles:
- **`.dev`** - לפיתוח (מהיר, פשוט, גדול יותר)
- **`.prod`** - לייצור (multi-stage, קטן יותר, מאובטח)

---

## 🔧 Development (פיתוח)

### Frontend Dev
```bash
# בניה
docker build -f frontend/Dockerfile.dev -t optometry-frontend:dev ./frontend

# הרצה
docker run -p 3000:3000 optometry-frontend:dev
```

### Backend Dev
```bash
# בניה
docker build -f backend/Dockerfile.dev -t optometry-backend:dev ./backend

# הרצה
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  optometry-backend:dev
```

### Docker Compose Dev (מומלץ)
```bash
# עדכן docker-compose.yml להשתמש ב-Dockerfile.dev
docker compose up -d
```

---

## 🚀 Production (ייצור)

### Frontend Production
```bash
# בניה
docker build -f frontend/Dockerfile.prod -t optometry-frontend:prod ./frontend

# הרצה
docker run -p 3000:3000 optometry-frontend:prod
```

**גודל Image:**
- Dev: ~300-400MB
- Prod: ~150-200MB (חיסכון של ~50%)

### Backend Production
```bash
# בניה
docker build -f backend/Dockerfile.prod -t optometry-backend:prod ./backend

# הרצה
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  optometry-backend:prod
```

**גודל Image:**
- Dev: ~400-500MB (node:18-slim)
- Prod: ~200-250MB (node:18-alpine + multi-stage)

---

## 📊 השוואת גדלים

| Component | Dev Mode | Production | חיסכון |
|-----------|----------|------------|--------|
| Frontend  | ~350MB   | ~180MB     | ~48%   |
| Backend   | ~450MB   | ~230MB     | ~49%   |
| **סה"כ** | **~800MB** | **~410MB** | **~49%** |

---

## 🔐 יתרונות Production Build

1. **גודל קטן יותר** - פחות תלויות, רק מה שצריך
2. **אבטחה** - non-root user, פחות attack surface
3. **מהיר יותר** - פחות layers, deployment מהיר
4. **נקי** - רק production dependencies

---

## 🛠️ שימוש עם Docker Compose

### Development
```yaml
# docker-compose.yml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
```

### Production
```yaml
# docker-compose.prod.yml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
```

---

## 📝 הערות חשובות

### Frontend
- **Dev**: Hot-reload, source maps, dev server
- **Prod**: Built static files, served with `serve`

### Backend
- **Dev**: TypeScript direct execution, hot-reload
- **Prod**: Compiled code (אם יש build), production mode

### Multi-stage Benefits
- ✅ Smaller final image
- ✅ No build tools in production
- ✅ Better security (non-root user)
- ✅ Faster deployment
- ✅ Less attack surface

---

## 🚦 מתי להשתמש במה?

### השתמש ב-Dev כאשר:
- 🔧 אתה מפתח locally
- 🐛 אתה צריך debugging
- ⚡ אתה רוצה hot-reload
- 🔄 אתה עושה שינויים תכופים

### השתמש ב-Prod כאשר:
- 🚀 Deploy לסביבת production
- 📦 Deploy לסביבת staging
- 🔒 אתה צריך אבטחה מקסימלית
- 💾 אתה רוצה לחסוך במקום

---

## 🎯 המלצות

1. **Development**: השתמש ב-`Dockerfile.dev` עם docker-compose
2. **CI/CD**: בנה עם `Dockerfile.prod`
3. **Production**: Deploy רק `Dockerfile.prod` images
4. **Testing**: השתמש ב-`Dockerfile.prod` לבדיקות integration

---

## 📚 קריאה נוספת

- [Docker Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Node.js Docker best practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
