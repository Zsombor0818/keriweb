# Keri CMS — Katolikus Keri Iskolai Weblap & CMS

Teljes CMS rendszer a Katolikus Keri – Szent István Technikum és Gimnázium weboldalához.

**Stack:** Node.js · Express.js · MySQL/MariaDB · JWT Auth · Quill szerkesztő · Vanilla JS

---

## Gyors indítás

### 1. Előfeltételek
- Node.js 18+
- MySQL 8.0+ vagy MariaDB 10.6+

### 2. MySQL adatbázis létrehozása

```sql
CREATE DATABASE keri_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'keri_user'@'localhost' IDENTIFIED BY 'keri_pass';
GRANT ALL PRIVILEGES ON keri_cms.* TO 'keri_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Projekt beállítása

```bash
# Fájlok kicsomagolása után:
cd keri-cms

# Függőségek telepítése
npm install

# .env fájl létrehozása
cp .env.example .env
# Szerkeszd a .env fájlt a saját adataiddal!

# Adatbázis inicializálása (táblák + alapadatok)
npm run init-db

# Szerver indítása (fejlesztői módban)
npm run dev

# Szerver indítása (éles)
npm start
```

### 4. Belépési adatok

| URL | Leírás |
|-----|--------|
| `http://localhost:3000` | Nyilvános weboldal |
| `http://localhost:3000/admin` | Admin felület |

**Alapértelmezett admin:** `admin` / `admin123` ← **Változtasd meg első belépés után!**

---

## .env konfiguráció

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=keri_user
DB_PASS=keri_pass
DB_NAME=keri_cms

JWT_SECRET=valtozd_meg_ezt_egy_hosszu_random_stringre

PORT=3000
NODE_ENV=production
```

---

## Projekt struktúra

```
keri-cms/
├── server/
│   ├── index.js          # Express belépési pont
│   ├── db.js             # MySQL2 connection pool
│   ├── initDb.js         # Táblák + seed adatok
│   ├── middleware/
│   │   └── auth.js       # JWT middleware
│   └── routes/
│       ├── auth.js       # POST /api/auth/login|logout, GET /me
│       ├── news.js       # CRUD /api/news
│       ├── teachers.js   # CRUD /api/teachers
│       ├── events.js     # CRUD /api/events
│       ├── pages.js      # CRUD /api/pages
│       ├── settings.js   # GET/PUT /api/settings
│       ├── media.js      # Upload/delete /api/media
│       └── users.js      # CRUD /api/users (admin only)
├── public/
│   ├── index.html        # Nyilvános SPA
│   ├── admin.html        # Admin SPA
│   ├── css/
│   │   ├── site.css      # Weboldal stílus
│   │   └── admin.css     # Admin stílus
│   ├── js/
│   │   ├── site.js       # Weboldal JS (API fetch)
│   │   └── admin.js      # Admin JS (CRUD, modal, Quill)
│   └── uploads/          # Feltöltött fájlok
├── .env.example
├── .gitignore
└── package.json
```

---

## API végpontok

### Auth
| Metódus | URL | Leírás |
|---------|-----|--------|
| POST | `/api/auth/login` | Bejelentkezés → JWT cookie |
| POST | `/api/auth/logout` | Kijelentkezés |
| GET  | `/api/auth/me` | Bejelentkezett user |

### Hírek
| Metódus | URL | Leírás |
|---------|-----|--------|
| GET    | `/api/news` | Közzétett hírek (publikus) |
| GET    | `/api/news/by-slug/:slug` | Egy hír slug szerint |
| GET    | `/api/news/admin/all` | Összes hír (auth) |
| POST   | `/api/news` | Új hír (auth) |
| PUT    | `/api/news/:id` | Hír módosítása (auth) |
| DELETE | `/api/news/:id` | Hír törlése (auth) |

### Oktatók, Rendezvények, Beállítások, Média, Felhasználók
Hasonló CRUD szerkezet – lásd `server/routes/`.

---

## Admin CMS funkciók

- ✅ **Hírek kezelése** – Quill rich text szerkesztő, kategória, közzétett/vázlat állapot
- ✅ **Oktatói testület** – Vezető / beosztott tag, sorrend
- ✅ **Rendezvények** – Dátum, leírás, sorrend
- ✅ **Médiatár** – Képfeltöltés, URL másolás, törlés
- ✅ **Weboldal beállítások** – Cím, telefon, email, social linkek
- ✅ **Felhasználók** – Admin / szerkesztő szerepkörök, jelszókezelés
- ✅ **JWT autentikáció** – HttpOnly cookie, 8h lejárat

---

## Éles üzembe helyezés (PM2)

```bash
npm install -g pm2
NODE_ENV=production pm2 start server/index.js --name keri-cms
pm2 save
pm2 startup
```

### Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name katolikuskeri.hu www.katolikuskeri.hu;

    client_max_body_size 10M;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Fejlesztők
Eredetileg készítette: Kuzma Bence, Szabó Zsombor, Varga Viktor  
CMS átírás: 2026
