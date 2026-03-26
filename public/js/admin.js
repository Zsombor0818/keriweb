/* public/js/admin.js  –  Keri CMS Admin Panel */
'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let currentUser  = null;
let currentPage  = 'dashboard';
let allNews      = [];
let quillEditor  = null;
let modalSaveFn  = null;
let editingId    = null;

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    const r = await fetch('/api/auth/me', { credentials: 'include' });
    if (!r.ok) throw new Error('not authenticated');
    const { user } = await r.json();
    currentUser = user;
    showApp();
  } catch {
    showLogin();
  }
})();

// ── Auth ──────────────────────────────────────────────────────────────────────
function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminApp').style.display    = 'none';
  document.getElementById('loginUser').focus();
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display    = 'flex';
  document.getElementById('asName').textContent   = currentUser.name || currentUser.username;
  document.getElementById('asRole').textContent   = currentUser.role === 'admin' ? 'Rendszergazda' : 'Szerkesztő';
  document.getElementById('asAvatar').textContent = (currentUser.name || currentUser.username).slice(0,1).toUpperCase();
  setupNav();
  adminNav('dashboard');
}

window.doLogin = async function() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const btn      = document.getElementById('loginBtn');
  const errEl    = document.getElementById('loginError');

  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Bejelentkezés…';

  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Hiba');
    currentUser = data.user;
    showApp();
  } catch (e) {
    errEl.textContent    = e.message;
    errEl.style.display  = 'block';
    btn.disabled         = false;
    btn.textContent      = 'Bejelentkezés';
  }
};

window.doLogout = async function() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  currentUser = null;
  showLogin();
};

// Enter key on login
document.getElementById('loginPass')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

// ── Navigation ────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Irányítópult',
  news:      'Hírek',
  teachers:  'Oktatói testület',
  events:    'Rendezvények',
  media:     'Médiatár',
  settings:  'Beállítások',
  users:     'Felhasználók',
};

function setupNav() {
  document.querySelectorAll('.as-link[data-page]').forEach(a => {
    a.addEventListener('click', () => adminNav(a.dataset.page));
  });
  document.querySelectorAll('.dash-card[data-page]').forEach(card => {
    card.addEventListener('click', () => adminNav(card.dataset.page));
  });
}

window.adminNav = function(page) {
  currentPage = page;
  document.querySelectorAll('.apage').forEach(p => p.classList.toggle('active', p.id === `ap-${page}`));
  document.querySelectorAll('.as-link').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;
  loaders[page]?.();
};

// ── API helper ─────────────────────────────────────────────────────────────────
async function api(url, opts = {}) {
  const r = await fetch(url, { credentials: 'include', ...opts });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastTimer;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Loaders ───────────────────────────────────────────────────────────────────
const loaders = {
  dashboard: loadDashboard,
  news:      loadNews,
  teachers:  loadTeachers,
  events:    loadEvents,
  media:     loadMedia,
  settings:  loadSettings,
  users:     loadUsers,
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [news, teachers, events, media] = await Promise.all([
      api('/api/news/admin/all'),
      api('/api/teachers'),
      api('/api/events'),
      api('/api/media'),
    ]);
    document.getElementById('dNewsCount').textContent     = news.length;
    document.getElementById('dTeachersCount').textContent = teachers.length;
    document.getElementById('dEventsCount').textContent   = events.length;
    document.getElementById('dMediaCount').textContent    = media.length;

    const tbody = document.getElementById('dashNewsTable');
    tbody.innerHTML = news.slice(0, 5).map(n => `
      <tr>
        <td><span style="font-weight:600">${esc(n.title)}</span></td>
        <td style="color:var(--muted);font-size:12px">${fmtDate(n.created_at)}</td>
        <td><span class="${n.published ? 'badge-pub' : 'badge-draft'}">${n.published ? 'Közzétéve' : 'Vázlat'}</span></td>
        <td><button class="btn-edit" onclick="adminNav('news')">Szerkesztés</button></td>
      </tr>`).join('');
  } catch (e) { toast(e.message, 'error'); }
}

// ── NEWS ──────────────────────────────────────────────────────────────────────
async function loadNews() {
  try {
    allNews = await api('/api/news/admin/all');
    renderNewsTable(allNews);
  } catch (e) { toast(e.message, 'error'); }
}

function renderNewsTable(rows) {
  const tbody = document.getElementById('newsTable');
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:32px">Nincs hír</td></tr>'; return; }
  tbody.innerHTML = rows.map(n => `
    <tr>
      <td><span style="font-weight:600">${esc(n.title)}</span><br><span style="font-size:11px;color:var(--muted)">${n.slug}</span></td>
      <td><span style="font-size:12px">${esc(n.tag||'')}</span></td>
      <td style="color:var(--muted);font-size:12px;white-space:nowrap">${fmtDate(n.created_at)}</td>
      <td><span class="${n.published ? 'badge-pub' : 'badge-draft'}">${n.published ? 'Közzétéve' : 'Vázlat'}</span></td>
      <td>
        <div class="act-btns">
          <button class="btn-edit"   onclick="openNewsModal(${n.id})">Szerkesztés</button>
          <button class="btn-danger" onclick="deleteNews(${n.id})">Törlés</button>
        </div>
      </td>
    </tr>`).join('');
}

window.filterNews = function(q) {
  const filtered = allNews.filter(n =>
    n.title.toLowerCase().includes(q.toLowerCase()) ||
    (n.excerpt||'').toLowerCase().includes(q.toLowerCase())
  );
  renderNewsTable(filtered);
};

window.openNewsModal = function(id) {
  editingId = id || null;
  const n   = id ? allNews.find(x => x.id === id) : null;

  document.getElementById('modalTitle').textContent = id ? 'Hír szerkesztése' : 'Új hír';
  document.getElementById('modalBody').innerHTML = `
    <div class="field"><label>Cím *</label><input type="text" id="mNewsTitle" value="${esc(n?.title||'')}" placeholder="Hír címe"></div>
    <div class="field"><label>Kategória / Ikon</label><input type="text" id="mNewsTag" value="${esc(n?.tag||'')}" placeholder="pl. 📋 Felvételi"></div>
    <div class="field"><label>Kivonat</label><textarea id="mNewsExcerpt" rows="2" placeholder="Rövid összefoglaló…">${esc(n?.excerpt||'')}</textarea></div>
    <div class="field"><label>Tartalom</label><div id="mNewsBody"></div></div>
    <div class="field"><label><input type="checkbox" id="mNewsPublished" ${(!n || n.published) ? 'checked' : ''}> &nbsp;Közzétéve</label></div>`;

  // Init Quill
  if (quillEditor) quillEditor = null;
  quillEditor = new Quill('#mNewsBody', { theme: 'snow', modules: { toolbar: [
    [{ header: [2,3,false] }], ['bold','italic','underline'],
    [{ list: 'ordered' },{ list: 'bullet' }], ['link'], ['clean']
  ]}});
  if (n?.body) quillEditor.root.innerHTML = n.body;

  modalSaveFn = saveNews;
  openModal();
};

async function saveNews() {
  const title     = document.getElementById('mNewsTitle').value.trim();
  const tag       = document.getElementById('mNewsTag').value.trim();
  const excerpt   = document.getElementById('mNewsExcerpt').value.trim();
  const body      = quillEditor ? quillEditor.root.innerHTML : '';
  const published = document.getElementById('mNewsPublished').checked;

  if (!title) { toast('A cím kötelező!', 'error'); return; }

  try {
    if (editingId) {
      await api(`/api/news/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, tag, excerpt, body, published }),
      });
      toast('Hír frissítve ✓');
    } else {
      await api('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, tag, excerpt, body, published }),
      });
      toast('Hír létrehozva ✓');
    }
    closeModal();
    loadNews();
  } catch (e) { toast(e.message, 'error'); }
}

window.deleteNews = async function(id) {
  if (!confirm('Biztosan törlöd ezt a hírt?')) return;
  try {
    await api(`/api/news/${id}`, { method: 'DELETE' });
    toast('Hír törölve');
    loadNews();
  } catch (e) { toast(e.message, 'error'); }
};

// ── TEACHERS ──────────────────────────────────────────────────────────────────
let allTeachers = [];

async function loadTeachers() {
  try {
    allTeachers = await api('/api/teachers');
    renderTeachersTable(allTeachers);
  } catch (e) { toast(e.message, 'error'); }
}

function renderTeachersTable(rows) {
  const tbody = document.getElementById('teachersTable');
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:32px">Nincs oktató</td></tr>'; return; }
  tbody.innerHTML = rows.map(t => `
    <tr>
      <td><span style="font-weight:600">${esc(t.name)}</span></td>
      <td style="font-size:12px;color:var(--muted)">${esc(t.subjects||'')}</td>
      <td style="font-size:12px">${esc(t.qualification||'')}</td>
      <td>${t.is_leadership ? '<span class="badge-lead">Vezető</span>' : ''}</td>
      <td>
        <div class="act-btns">
          <button class="btn-edit"   onclick="openTeacherModal(${t.id})">Szerkesztés</button>
          <button class="btn-danger" onclick="deleteTeacher(${t.id})">Törlés</button>
        </div>
      </td>
    </tr>`).join('');
}

window.openTeacherModal = function(id) {
  editingId = id || null;
  const t   = id ? allTeachers.find(x => x.id === id) : null;

  document.getElementById('modalTitle').textContent = id ? 'Oktató szerkesztése' : 'Új oktató';
  document.getElementById('modalBody').innerHTML = `
    <div class="field"><label>Név *</label><input type="text" id="mTName" value="${esc(t?.name||'')}" placeholder="Dr. Kovács Mária"></div>
    <div class="field"><label>Tárgyak</label><input type="text" id="mTSubjects" value="${esc(t?.subjects||'')}" placeholder="Matematika, fizika"></div>
    <div class="field"><label>Szakképzettség</label><input type="text" id="mTQual" value="${esc(t?.qualification||'')}" placeholder="Matematika-fizika tanár"></div>
    <div class="field"><label>Szerepkör (vezető esetén)</label><input type="text" id="mTRole" value="${esc(t?.role||'')}" placeholder="Igazgató"></div>
    <div class="field"><label>Monogram</label><input type="text" id="mTInitials" value="${esc(t?.initials||'')}" placeholder="KM" maxlength="4"></div>
    <div class="field"><label>Sorrend</label><input type="number" id="mTOrder" value="${t?.sort_order||99}" min="1" max="999"></div>
    <div class="field"><label><input type="checkbox" id="mTLeader" ${t?.is_leadership ? 'checked':''}>  &nbsp;Iskolavezetés tagja</label></div>`;

  modalSaveFn = saveTeacher;
  openModal();
};

async function saveTeacher() {
  const name         = document.getElementById('mTName').value.trim();
  const subjects     = document.getElementById('mTSubjects').value.trim();
  const qualification= document.getElementById('mTQual').value.trim();
  const role         = document.getElementById('mTRole').value.trim();
  const initials     = document.getElementById('mTInitials').value.trim();
  const sort_order   = parseInt(document.getElementById('mTOrder').value) || 99;
  const is_leadership= document.getElementById('mTLeader').checked;

  if (!name) { toast('A név kötelező!', 'error'); return; }

  try {
    if (editingId) {
      await api(`/api/teachers/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subjects, qualification, role, initials, sort_order, is_leadership }),
      });
      toast('Oktató frissítve ✓');
    } else {
      await api('/api/teachers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subjects, qualification, role, initials, sort_order, is_leadership }),
      });
      toast('Oktató hozzáadva ✓');
    }
    closeModal();
    loadTeachers();
  } catch (e) { toast(e.message, 'error'); }
}

window.deleteTeacher = async function(id) {
  if (!confirm('Biztosan törlöd ezt az oktatót?')) return;
  try {
    await api(`/api/teachers/${id}`, { method: 'DELETE' });
    toast('Oktató törölve');
    loadTeachers();
  } catch (e) { toast(e.message, 'error'); }
};

// ── EVENTS ────────────────────────────────────────────────────────────────────
let allEvents = [];

async function loadEvents() {
  try {
    allEvents = await api('/api/events');
    renderEventsTable(allEvents);
  } catch (e) { toast(e.message, 'error'); }
}

function renderEventsTable(rows) {
  const tbody = document.getElementById('eventsTable');
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:32px">Nincs rendezvény</td></tr>'; return; }
  tbody.innerHTML = rows.map(e => `
    <tr>
      <td><span style="font-weight:600">${esc(e.title)}</span></td>
      <td style="font-size:12px;color:var(--muted);white-space:nowrap">${esc(e.date_label||'')}</td>
      <td style="font-size:12px;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.description||'')}</td>
      <td>
        <div class="act-btns">
          <button class="btn-edit"   onclick="openEventModal(${e.id})">Szerkesztés</button>
          <button class="btn-danger" onclick="deleteEvent(${e.id})">Törlés</button>
        </div>
      </td>
    </tr>`).join('');
}

window.openEventModal = function(id) {
  editingId = id || null;
  const e   = id ? allEvents.find(x => x.id === id) : null;

  document.getElementById('modalTitle').textContent = id ? 'Rendezvény szerkesztése' : 'Új rendezvény';
  document.getElementById('modalBody').innerHTML = `
    <div class="field"><label>Cím *</label><input type="text" id="mETitle" value="${esc(e?.title||'')}" placeholder="Rendezvény neve"></div>
    <div class="field"><label>Dátum / Időszak</label><input type="text" id="mEDate" value="${esc(e?.date_label||'')}" placeholder="2026. március 15."></div>
    <div class="field"><label>Leírás</label><textarea id="mEDesc" rows="4" placeholder="Rövid leírás…">${esc(e?.description||'')}</textarea></div>
    <div class="field"><label>Sorrend</label><input type="number" id="mEOrder" value="${e?.sort_order||99}" min="1"></div>`;

  modalSaveFn = saveEvent;
  openModal();
};

async function saveEvent() {
  const title       = document.getElementById('mETitle').value.trim();
  const date_label  = document.getElementById('mEDate').value.trim();
  const description = document.getElementById('mEDesc').value.trim();
  const sort_order  = parseInt(document.getElementById('mEOrder').value) || 99;

  if (!title) { toast('A cím kötelező!', 'error'); return; }

  try {
    if (editingId) {
      await api(`/api/events/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date_label, description, sort_order }),
      });
      toast('Rendezvény frissítve ✓');
    } else {
      await api('/api/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date_label, description, sort_order }),
      });
      toast('Rendezvény hozzáadva ✓');
    }
    closeModal();
    loadEvents();
  } catch (e) { toast(e.message, 'error'); }
}

window.deleteEvent = async function(id) {
  if (!confirm('Biztosan törlöd ezt a rendezvényt?')) return;
  try {
    await api(`/api/events/${id}`, { method: 'DELETE' });
    toast('Rendezvény törölve');
    loadEvents();
  } catch (e) { toast(e.message, 'error'); }
};

// ── MEDIA ─────────────────────────────────────────────────────────────────────
async function loadMedia() {
  try {
    const files = await api('/api/media');
    const grid  = document.getElementById('mediaGrid');
    if (!files.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:48px">Nincs feltöltött fájl</div>';
      return;
    }
    grid.innerHTML = files.map(f => {
      const isImg = f.mimetype && f.mimetype.startsWith('image/');
      const url   = `/uploads/${f.filename}`;
      return `
        <div class="media-card">
          <div class="media-thumb">
            ${isImg ? `<img src="${url}" alt="${esc(f.original_name||'')}">` : `<span>${fileIcon(f.mimetype)}</span>`}
          </div>
          <div class="media-info">
            <div class="media-name" title="${esc(f.original_name||f.filename)}">${esc(f.original_name||f.filename)}</div>
            <div class="media-size">${fmtSize(f.size)}</div>
          </div>
          <div class="media-actions">
            <button class="media-url-btn" onclick="copyUrl('${url}')">📋 URL másolása</button>
            <button class="btn-danger btn-sm" onclick="deleteMedia(${f.id})">🗑</button>
          </div>
        </div>`;
    }).join('');
  } catch (e) { toast(e.message, 'error'); }
}

window.uploadMedia = async function(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  try {
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      await api('/api/media', { method: 'POST', body: fd });
    }
    toast(`${files.length} fájl feltöltve ✓`);
    input.value = '';
    loadMedia();
  } catch (e) { toast(e.message, 'error'); }
};

window.deleteMedia = async function(id) {
  if (!confirm('Biztosan törlöd ezt a fájlt?')) return;
  try {
    await api(`/api/media/${id}`, { method: 'DELETE' });
    toast('Fájl törölve');
    loadMedia();
  } catch (e) { toast(e.message, 'error'); }
};

window.copyUrl = function(url) {
  const full = window.location.origin + url;
  navigator.clipboard.writeText(full).then(() => toast('URL vágólapra másolva ✓'));
};

// ── SETTINGS ─────────────────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const s = await api('/api/settings');
    const keys = ['site_name','site_tagline','director','om_id','maintainer','address','phone1','phone2','email','facebook_url','instagram_url','youtube_url'];
    keys.forEach(k => {
      const el = document.getElementById(`s_${k}`);
      if (el) el.value = s[k] || '';
    });
  } catch (e) { toast(e.message, 'error'); }
}

window.saveSettings = async function() {
  const keys = ['site_name','site_tagline','director','om_id','maintainer','address','phone1','phone2','email','facebook_url','instagram_url','youtube_url'];
  const body = {};
  keys.forEach(k => {
    const el = document.getElementById(`s_${k}`);
    if (el) body[k] = el.value;
  });
  try {
    await api('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    toast('Beállítások mentve ✓');
  } catch (e) { toast(e.message, 'error'); }
};

// ── USERS ─────────────────────────────────────────────────────────────────────
let allUsers = [];

async function loadUsers() {
  try {
    allUsers = await api('/api/users');
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = allUsers.map(u => `
      <tr>
        <td><span style="font-weight:600">${esc(u.username)}</span></td>
        <td>${esc(u.name||'')}</td>
        <td><span class="${u.role === 'admin' ? 'badge-admin' : 'badge-editor'}">${u.role === 'admin' ? 'Admin' : 'Szerkesztő'}</span></td>
        <td style="color:var(--muted);font-size:12px">${fmtDate(u.created_at)}</td>
        <td>
          <div class="act-btns">
            <button class="btn-edit"   onclick="openUserModal(${u.id})">Szerkesztés</button>
            ${u.id !== currentUser.id ? `<button class="btn-danger" onclick="deleteUser(${u.id})">Törlés</button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  } catch (e) { toast(e.message, 'error'); }
}

window.openUserModal = function(id) {
  editingId = id || null;
  const u   = id ? allUsers.find(x => x.id === id) : null;

  document.getElementById('modalTitle').textContent = id ? 'Felhasználó szerkesztése' : 'Új felhasználó';
  document.getElementById('modalBody').innerHTML = `
    ${!id ? `<div class="field"><label>Felhasználónév *</label><input type="text" id="mUUsername" placeholder="pl. toth.janos"></div>` : ''}
    <div class="field"><label>Teljes név</label><input type="text" id="mUName" value="${esc(u?.name||'')}" placeholder="Tóth János"></div>
    <div class="field"><label>Szerepkör</label>
      <select id="mURole">
        <option value="editor" ${(!u || u.role==='editor') ? 'selected':''}>Szerkesztő</option>
        <option value="admin"  ${u?.role==='admin' ? 'selected':''}>Admin</option>
      </select>
    </div>
    <div class="field"><label>${id ? 'Új jelszó (üresen hagyva nem változik)' : 'Jelszó *'}</label><input type="password" id="mUPass" placeholder="••••••••" autocomplete="new-password"></div>`;

  modalSaveFn = saveUser;
  openModal();
};

async function saveUser() {
  const name     = document.getElementById('mUName').value.trim();
  const role     = document.getElementById('mURole').value;
  const password = document.getElementById('mUPass').value;
  const username = document.getElementById('mUUsername')?.value.trim();

  try {
    if (editingId) {
      await api(`/api/users/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, ...(password ? { password } : {}) }),
      });
      toast('Felhasználó frissítve ✓');
    } else {
      if (!username || !password) { toast('Felhasználónév és jelszó kötelező!', 'error'); return; }
      await api('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, role, password }),
      });
      toast('Felhasználó létrehozva ✓');
    }
    closeModal();
    loadUsers();
  } catch (e) { toast(e.message, 'error'); }
}

window.deleteUser = async function(id) {
  if (!confirm('Biztosan törlöd ezt a felhasználót?')) return;
  try {
    await api(`/api/users/${id}`, { method: 'DELETE' });
    toast('Felhasználó törölve');
    loadUsers();
  } catch (e) { toast(e.message, 'error'); }
};

// ── MODAL ─────────────────────────────────────────────────────────────────────
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('modalSaveBtn').onclick = () => modalSaveFn?.();
}

window.closeModal = function() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('modalBody').innerHTML = '';
  quillEditor = null;
  editingId   = null;
  modalSaveFn = null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function fmtDate(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleDateString('hu-HU', { year:'numeric', month:'short', day:'numeric' });
}

function fmtSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(1) + ' MB';
}

function fileIcon(mime) {
  if (!mime) return '📄';
  if (mime.startsWith('image/'))       return '🖼️';
  if (mime.startsWith('video/'))       return '🎬';
  if (mime === 'application/pdf')      return '📕';
  if (mime.includes('word'))           return '📝';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊';
  return '📄';
}
