/* public/js/site.js  –  Keri CMS public frontend */
'use strict';

// ── Navigation ───────────────────────────────────────────────────────────────
const pages = document.querySelectorAll('.page');
const sbItems = document.querySelectorAll('.sb-item, .sb-sub[data-p]');

function nav(id) {
  pages.forEach(p => p.classList.toggle('active', p.id === `page-${id}`));
  sbItems.forEach(a => a.classList.toggle('active', a.dataset.p === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeSidebar();
}

window.nav = nav;

// Sidebar toggle
const sbBtn   = document.getElementById('sbBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

function openSidebar()  { sidebar.classList.add('open');  overlay.classList.add('show'); }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }

sbBtn?.addEventListener('click', () =>
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
overlay?.addEventListener('click', closeSidebar);

sbItems.forEach(a => a.addEventListener('click', () => nav(a.dataset.p)));

// ── API helpers ───────────────────────────────────────────────────────────────
async function api(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

// ── Load settings ─────────────────────────────────────────────────────────────
async function loadSettings() {
  const s = await api('/api/settings');
  if (!s) return;

  // Tagline
  const tagEl = document.getElementById('siteTagline');
  if (tagEl && s.site_tagline) tagEl.textContent = s.site_tagline;

  // Director
  const dirEl = document.getElementById('directorName');
  if (dirEl && s.director) dirEl.textContent = `— ${s.director} igazgató`;

  // Intézmény kártya
  setText('iDirector',   s.director);
  setText('iOmId',       s.om_id);
  setText('iAddress',    s.address);
  setText('iPhone',      s.phone1 + (s.phone2 ? ' · ' + s.phone2 : ''));
  setText('iEmail',      s.email);
  setText('iMaintainer', s.maintainer);

  // Footer contact
  const fc = document.getElementById('footerContact');
  if (fc) fc.innerHTML = `${s.address || ''}<br><span style="color:var(--st)">${s.phone1||''} | ${s.phone2||''}</span>`;

  // Kapcsolat oldal
  const kCim   = document.getElementById('kontaktCim');
  const kTel   = document.getElementById('kontaktTel');
  const kEmail = document.getElementById('kontaktEmail');
  if (kCim)   kCim.innerHTML   = `<strong>Szent István Katolikus Technikum és Gimnázium</strong><br>${s.address||''}`;
  if (kTel)   kTel.innerHTML   = `<a href="tel:${s.phone1}" style="color:var(--cr);font-weight:600">${s.phone1||''}</a><br><a href="tel:${s.phone2}" style="color:var(--cr);font-weight:600">${s.phone2||''}</a>`;
  if (kEmail) kEmail.innerHTML = `<a href="mailto:${s.email}" style="color:var(--cr);font-weight:600">${s.email||''}</a>`;

  // Social links
  const socEl   = document.getElementById('socialLinks');
  const footSoc = document.getElementById('footerSocial');
  if (socEl) {
    socEl.innerHTML = '';
    if (s.facebook_url)  socEl.innerHTML  += `<a href="${s.facebook_url}"  target="_blank" title="Facebook">f</a>`;
    if (s.instagram_url) socEl.innerHTML  += `<a href="${s.instagram_url}" target="_blank" title="Instagram">in</a>`;
    if (s.youtube_url)   socEl.innerHTML  += `<a href="${s.youtube_url}"   target="_blank" title="YouTube">▶</a>`;
  }
  if (footSoc) {
    footSoc.innerHTML = '';
    if (s.facebook_url)  footSoc.innerHTML += `<a href="${s.facebook_url}"  target="_blank">Facebook</a>`;
    if (s.instagram_url) footSoc.innerHTML += `<a href="${s.instagram_url}" target="_blank">Instagram</a>`;
    if (s.youtube_url)   footSoc.innerHTML += `<a href="${s.youtube_url}"   target="_blank">YouTube</a>`;
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '–';
}

// ── Load News ─────────────────────────────────────────────────────────────────
function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadNews() {
  const news = await api('/api/news?limit=20');
  if (!news) return;

  // Hero news widget (top 3)
  const heroList = document.getElementById('heroNewsList');
  const countEl  = document.getElementById('newsCount');
  if (heroList) {
    const top3 = news.slice(0, 3);
    if (countEl) countEl.textContent = `${top3.length} új`;
    heroList.innerHTML = top3.map(n => `
      <a class="hn-item" href="#" onclick="showNewsDetail(${n.id});return false">
        <div class="hn-item-tag">${n.tag || '📰 Hír'}</div>
        <div class="hn-item-title">${escHtml(n.title)}</div>
        <div class="hn-item-date">${fmtDate(n.created_at)}</div>
        <div class="hn-item-excerpt">${escHtml(n.excerpt||'')}</div>
      </a>`).join('');
  }

  // Home news grid (top 3)
  const homeList = document.getElementById('homeNewsList');
  if (homeList) {
    homeList.innerHTML = news.slice(0, 3).map(n => `
      <div class="nc">
        <div class="nc-top">
          <div class="nc-date">${fmtDate(n.created_at)}</div>
          <div class="nc-title">${escHtml(n.title)}</div>
        </div>
        <div class="nc-body">
          <p class="nc-ex">${escHtml(n.excerpt||'')}</p>
          <a href="#" onclick="showNewsDetail(${n.id});return false" style="font-size:12px;color:var(--cr);font-weight:600">Tovább →</a>
        </div>
      </div>`).join('');
  }

  // All news page
  const allList = document.getElementById('allNewsList');
  if (allList) {
    allList.innerHTML = news.map(n => `
      <div class="nc">
        <div class="nc-top">
          <div class="nc-date">${fmtDate(n.created_at)} · ${n.tag||''}</div>
          <div class="nc-title">${escHtml(n.title)}</div>
        </div>
        <div class="nc-body">
          <p class="nc-ex">${escHtml(n.excerpt||'')}</p>
          <a href="#" onclick="showNewsDetail(${n.id});return false" style="font-size:12px;color:var(--cr);font-weight:600">Tovább →</a>
        </div>
      </div>`).join('');
  }
}

// News detail – inline in a simple overlay
let _newsCache = {};
window.showNewsDetail = async function(id) {
  if (!_newsCache[id]) {
    const all = await api('/api/news?limit=100');
    if (all) all.forEach(n => (_newsCache[n.id] = n));
  }
  const n = _newsCache[id];
  if (!n) return;

  const overlay = document.createElement('div');
  overlay.className = 'news-detail-overlay';
  overlay.innerHTML = `
    <div class="ndo-box">
      <button class="ndo-close" onclick="this.parentElement.parentElement.remove()">✕</button>
      <div class="ndo-tag">${n.tag||'📰 Hír'}</div>
      <h2 class="ndo-title">${escHtml(n.title)}</h2>
      <div class="ndo-date">${fmtDate(n.created_at)}</div>
      <div class="ndo-body">${n.body || escHtml(n.excerpt||'')}</div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
};

// ── Load Teachers ─────────────────────────────────────────────────────────────
async function loadTeachers() {
  const teachers = await api('/api/teachers');
  if (!teachers) return;

  const leadership = teachers.filter(t => t.is_leadership);
  const staff      = teachers.filter(t => !t.is_leadership);

  const lgGrid = document.getElementById('leadershipGrid');
  if (lgGrid) {
    lgGrid.innerHTML = leadership.map(t => `
      <div class="tc">
        <div class="tav">${escHtml(t.initials||t.name.slice(0,2).toUpperCase())}</div>
        <div class="tname">${escHtml(t.name)}</div>
        <div class="trole">${escHtml(t.role||t.subjects||'')}</div>
      </div>`).join('');
  }

  const tbody = document.getElementById('teachersTableBody');
  if (tbody) {
    tbody.innerHTML = staff.map(t => `
      <tr>
        <td class="tnm">${escHtml(t.name)}</td>
        <td>${escHtml(t.subjects||'')}</td>
        <td>${escHtml(t.qualification||'')}</td>
      </tr>`).join('');
  }
}

// ── Load Events ───────────────────────────────────────────────────────────────
async function loadEvents() {
  const events = await api('/api/events');
  if (!events) return;
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;
  grid.innerHTML = events.map(e => `
    <div class="nc">
      <div class="nc-top">
        <div class="nc-date">${escHtml(e.date_label||'')}</div>
        <div class="nc-title">${escHtml(e.title)}</div>
      </div>
      <div class="nc-body"><p class="nc-ex">${escHtml(e.description||'')}</p></div>
    </div>`).join('');
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── Inline styles for news detail overlay ─────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
.news-detail-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
.ndo-box{background:#fff;border-radius:14px;max-width:680px;width:100%;padding:32px;position:relative;max-height:90vh;overflow-y:auto}
.ndo-close{position:absolute;top:16px;right:16px;background:rgba(0,0,0,.07);border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}
.ndo-tag{font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}
.ndo-title{font-family:'Playfair Display',serif;font-size:26px;margin-bottom:8px;line-height:1.3}
.ndo-date{font-size:12px;color:var(--st);margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.ndo-body{font-size:14px;line-height:1.8;color:var(--st-dark)}
.ndo-body p{margin-bottom:12px}
`;
document.head.appendChild(style);

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  await loadSettings();
  await loadNews();
  await loadTeachers();
  await loadEvents();
})();
