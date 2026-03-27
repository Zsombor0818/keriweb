// server/initDb.js  –  creates all tables and seed data in MySQL
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db     = require('./db');
const bcrypt = require('bcryptjs');

async function init() {
  console.log('⏳  Connecting to MySQL…');

  await db.q(`CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(80)  UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(120) DEFAULT '',
    role       VARCHAR(20)  DEFAULT 'editor',
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.q(`CREATE TABLE IF NOT EXISTS news (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    slug       VARCHAR(160) UNIQUE NOT NULL,
    title      VARCHAR(255) NOT NULL,
    excerpt    TEXT,
    body       LONGTEXT,
    tag        VARCHAR(80),
    published  TINYINT(1)   DEFAULT 1,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.q(`CREATE TABLE IF NOT EXISTS pages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    slug       VARCHAR(120) UNIQUE NOT NULL,
    title      VARCHAR(255) NOT NULL,
    content    LONGTEXT,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.q(`CREATE TABLE IF NOT EXISTS settings (
    \`key\`   VARCHAR(80)  PRIMARY KEY,
    value  TEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.q(`CREATE TABLE IF NOT EXISTS media (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    filename      VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mimetype      VARCHAR(100),
    size          INT,
    uploaded_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.q(`CREATE TABLE IF NOT EXISTS teachers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(120) NOT NULL,
    subjects       TEXT,
    qualification  TEXT,
    is_leadership  TINYINT(1) DEFAULT 0,
    role           VARCHAR(120),
    initials       VARCHAR(10),
    sort_order     INT DEFAULT 99
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.q(`CREATE TABLE IF NOT EXISTS events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    date_label  VARCHAR(60),
    description TEXT,
    sort_order  INT DEFAULT 99
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  console.log('✅  Tables ready');

  // ── Seed: admin user ──────────────────────────────────────────────
  const existing = await db.q1('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.run('INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)',
      ['admin', hash, 'Rendszergazda', 'admin']);
    console.log('✅  Admin user created  (admin / admin123)');
  }

  // ── Seed: settings ───────────────────────────────────────────────
  const defaults = [
    ['site_name',    'Katolikus Keri – Szent István Technikum és Gimnázium'],
    ['site_tagline', 'Szívvel, lélekkel'],
    ['address',      '3980 Sátoraljaújhely, Kazinczy u. 12.'],
    ['phone1',       '+36-47-521-104'],
    ['phone2',       '+36-30-786-9473'],
    ['email',        'iroda@katolikuskeri.hu'],
    ['director',     'Sebes Péter'],
    ['om_id',        '201594'],
    ['maintainer',   'Egri Főegyházmegye'],
    ['facebook_url', 'https://www.facebook.com/Katolikus-Keri-1453252641645070/'],
    ['instagram_url','https://www.instagram.com/katolikuskeriinsta'],
    ['youtube_url',  'https://www.youtube.com/@katolikuskeriyt'],
  ];
  for (const [k, v] of defaults) {
    await db.run('INSERT IGNORE INTO settings (`key`, value) VALUES (?,?)', [k, v]);
  }

  // ── Seed: news ────────────────────────────────────────────────────
  const nCount = (await db.q1('SELECT COUNT(*) AS c FROM news')).c;
  if (nCount === 0) {
    const ni = (s,t,e,b,tg) => db.run(
      'INSERT INTO news (slug,title,excerpt,body,tag) VALUES (?,?,?,?,?)', [s,t,e,b,tg]);
    await ni('ideiglenes-felveteli-rangsor',
      'Ideiglenes felvételi rangsor elérhető',
      'Az ideiglenes rangsor megjelent – kérjük az érintetteket, ellenőrizzék eredményüket.',
      '<p>Az ideiglenes felvételi rangsor 2026. március 17-én megjelent. Kérjük az érintett tanulókat és szüleiket, hogy ellenőrizzék eredményeiket az iskolai weboldalon közzétett dokumentumban.</p><p>A végleges rangsor várható megjelenési ideje: 2026. április 15.</p>',
      '📋 Felvételi');
    await ni('felvetelizok-figyelmebe',
      'Felvételizők figyelmébe!',
      'Fontos tudnivalók a 2026/27-es tanévre jelentkezők számára.',
      '<p>Kedves Felvételizők és Szülők! Kérjük, figyelmesen olvassák el az alábbi tájékoztatót a 2026/27-es tanévre vonatkozó felvételi eljárással kapcsolatban.</p>',
      '📢 Tájékoztató');
    await ni('kepzesi-ajanlat-2026-27',
      'Képzési ajánlatunk 2026/27',
      'Megjelent a következő tanév képzési ajánlata és beiskolázási kódjaink.',
      '<p>Megjelent a 2026/27-es tanévre vonatkozó képzési ajánlatunk. Négy képzési ágazatban várjuk a jelentkezőket.</p>',
      '🎓 Képzés');
    console.log('✅  Sample news inserted');
  }

  // ── Seed: teachers ───────────────────────────────────────────────
  const tCount = (await db.q1('SELECT COUNT(*) AS c FROM teachers')).c;
  if (tCount === 0) {
    const ti = (n,s,q,l,r,i,o) => db.run(
      'INSERT INTO teachers (name,subjects,qualification,is_leadership,role,initials,sort_order) VALUES (?,?,?,?,?,?,?)',
      [n,s,q,l,r,i,o]);
    await ti('Sebes Péter','Igazgató, történelem','Történelem tanár',1,'Igazgató, történelem tanár','SP',1);
    await ti('Galo Gábor','Óraadó, rk. hittan, iskolalelkész','Katolikus lelkész',1,'Iskolalelkész, rk. hittan','GG',2);
    await ti('Kecskés Attila','Rm. kat. főesperes','Főesperes',1,'Rm. kat. főesperes','KA',3);
    await ti('Szaláncziné Tamás Ilona','Igazgatóhelyettes, közgazdasági tárgyak','Közgazdász tanár',1,'Ált. igazgatóhelyettes','SzT',4);
    await ti('Bihari Sándorné','Igazgatóhelyettes, közgazdasági tárgyak','Közgazdász tanár',1,'Szakmai igh.','BS',5);
    await ti('Majoros Zoltánné','Gazdasági vezető','Gazdasági vezető',1,'Gazdasági vezető','MZ',6);
    await ti('Horváthová Éva','Matematika','Matematika tanár',0,null,'HÉ',10);
    await ti('György Éva','Informatikai tárgyak','Informatika tanár',0,null,'GyÉ',11);
    await ti('Prokop Norbert','Informatikai tárgyak','Informatikai rendszerüzemeltető',0,null,'PN',12);
    await ti('Pongó Barbara','Angol nyelv','Angol nyelv, magyar tanár',0,null,'PB',13);
    console.log('✅  Sample teachers inserted');
  }

  // ── Seed: events ─────────────────────────────────────────────────
  const eCount = (await db.q1('SELECT COUNT(*) AS c FROM events')).c;
  if (eCount === 0) {
    const ei = (t,d,desc,o) => db.run(
      'INSERT INTO events (title,date_label,description,sort_order) VALUES (?,?,?,?)',[t,d,desc,o]);
    await ei('Nemzeti Ünnep – Megemlékezés','2026. március 15.','Ünnepi műsor az 1848-as forradalom évfordulóján.',1);
    await ei('Farsangi Bál','2026. február','Évi hagyományos farsangi mulatság jelmezversennyel.',2);
    await ei('Karácsonyi Műsor','2025. december','Adventi és karácsonyi ünnepi műsor.',3);
    console.log('✅  Sample events inserted');
  }

  await db.end();
  console.log('\n🎉  Database initialised successfully!');
  console.log('    Run: npm start   to launch the server');
}

init().catch(err => {
  console.error('❌  Init failed:', err.message);
  process.exit(1);
});
