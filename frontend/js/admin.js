const SPORT_LABEL = { sambo: 'Самбо', karate: 'Карате', boxing: 'Бокс' };
const SPORT_CLASS = { sambo: 'sambo', karate: 'karate', boxing: 'boxing' };
const STATUS_TEXT = { new: 'Новая', done: 'Готово', called: 'Звонили' };

function escapeHtml(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s || ''));
  return d.innerHTML;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
  document.body.classList.toggle('no-scroll');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  document.body.classList.remove('no-scroll');
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById('tab-' + name).style.display = 'block';
  if (btn) btn.classList.add('active');
  closeSidebar();
}

// ====== THEME ======

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('adminTheme', dark ? 'dark' : 'light');
  document.getElementById('themeIcon').innerHTML = dark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  document.getElementById('themeLabel').textContent = dark ? 'Светлая тема' : 'Тёмная тема';
}

function toggleTheme() {
  applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
}

const saved = localStorage.getItem('adminTheme');
if (saved === 'dark') applyTheme(true);

// ====== APPLICATIONS ======

async function load() {
  try {
    const r = await fetch('/api/applications');
    if (!r.ok) return;
    const apps = await r.json();
    const tbody = document.getElementById('tbody');

    document.getElementById('s-total').textContent = apps.length;
    document.getElementById('s-new').textContent = apps.filter(a => a.status === 'new').length;
    document.getElementById('s-done').textContent = apps.filter(a => a.status === 'done').length;

    if (!apps.length) {
      tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state">' +
        '<svg class="empty-state-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
        '<p>Заявок пока нет</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = apps.map(a => {
      const statusClass = a.status === 'new' ? 'badge-new' : a.status === 'done' ? 'badge-done' : 'badge-called';
      const statusText = STATUS_TEXT[a.status] || a.status;
      const sportClass = SPORT_CLASS[a.sport] || '';
      const sportText = SPORT_LABEL[a.sport] || a.sport;
      const created = a.created ? a.created.slice(0, 16).replace('T', ' ') : '-';

      return '<tr id="row-' + a.id + '">' +
        '<td class="id-cell">' + a.id + '</td>' +
        '<td class="date-cell">' + created + '</td>' +
        '<td class="name-cell">' + escapeHtml(a.name) + '</td>' +
        '<td class="phone-cell"><a href="tel:' + escapeHtml(a.phone) + '">' + escapeHtml(a.phone) + '</a></td>' +
        '<td><span class="sport-tag ' + sportClass + '">' + sportText + '</span></td>' +
        '<td>' + (a.age || '-') + '</td>' +
        '<td class="comment-cell">' + (escapeHtml(a.comment) || '-') + '</td>' +
        '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
        '<td class="actions">' +
          '<button class="btn btn-done" onclick="mark(' + a.id + ',\'done\')">Готово</button>' +
          '<button class="btn btn-call" onclick="mark(' + a.id + ',\'called\')">Звонили</button>' +
          '<button class="btn btn-delete" onclick="del(' + a.id + ')">Удалить</button>' +
        '</td></tr>';
    }).join('');
  } catch (e) {}
}

async function mark(id, status) {
  try {
    await fetch('/api/application/' + id + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    load();
    loadStats();
  } catch (e) {}
}

async function del(id) {
  if (!confirm('Удалить заявку N' + id + '?')) return;
  try {
    await fetch('/api/application/' + id, { method: 'DELETE' });
    const row = document.getElementById('row-' + id);
    if (row) row.remove();
    load();
    loadStats();
  } catch (e) {}
}

// ====== TRAINERS ======

async function loadTrainers() {
  try {
    const r = await fetch('/api/trainers');
    if (!r.ok) return;
    const trainers = await r.json();
    const body = document.getElementById('trainersBody');
    if (!body) return;

    if (!trainers.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Тренеров пока нет</p></div></td></tr>';
      return;
    }

    const sportClass = { 'Самбо': 'sambo', 'Карате': 'karate', 'Бокс': 'boxing' };
    body.innerHTML = trainers.map(t =>
      `<tr id="tr-row-${t.id}">
        <td style="width:50px">${t.photo ? `<img src="${escapeHtml(t.photo)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;display:block">` : '<span style="color:#ccc">—</span>'}</td>
        <td class="name-cell">${escapeHtml(t.name)}</td>
        <td><span class="sport-tag ${sportClass[t.sport] || ''}">${escapeHtml(t.sport)}</span></td>
        <td>${escapeHtml(t.title)}</td>
        <td>${escapeHtml(t.achieve)}</td>
        <td class="actions"><button class="btn btn-delete" onclick="deleteTrainer(${t.id})">Удалить</button></td>
      </tr>`
    ).join('');
  } catch (e) {}
}

async function addTrainer() {
  const name = document.getElementById('trName').value.trim();
  const sportVal = document.getElementById('trSport').value;
  const title = document.getElementById('trTitle').value.trim();
  const achieve = document.getElementById('trAchieve').value.trim();
  const photo = document.getElementById('trPhoto').value.trim();
  const sportLabel = { sambo: 'Самбо', karate: 'Карате', boxing: 'Бокс' };

  if (!name) return;
  try {
    await fetch('/api/trainers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sport: sportLabel[sportVal], title, achieve, photo })
    });
    document.getElementById('trName').value = '';
    document.getElementById('trTitle').value = '';
    document.getElementById('trAchieve').value = '';
    document.getElementById('trPhoto').value = '';
    loadTrainers();
  } catch (e) {}
}

async function deleteTrainer(id) {
  if (!confirm('Удалить тренера?')) return;
  try {
    await fetch('/api/trainers/' + id, { method: 'DELETE' });
    const row = document.getElementById('tr-row-' + id);
    if (row) row.remove();
    loadTrainers();
  } catch (e) {}
}

// ====== STATS ======

async function loadStats() {
  try {
    const r = await fetch('/api/applications');
    if (!r.ok) return;
    const apps = await r.json();
    const bars = document.getElementById('sportBars');
    if (!bars) return;

    const counts = { Самбо: 0, Карате: 0, Бокс: 0 };
    const map = { sambo: 'Самбо', karate: 'Карате', boxing: 'Бокс' };
    apps.forEach(a => { if (map[a.sport]) counts[map[a.sport]]++; });
    const max = Math.max(...Object.values(counts), 1);

    bars.innerHTML = '<div class="stats-chart-title">Распределение по секциям</div>' +
      Object.entries(counts).map(([name, val]) => `
        <div class="stats-bar-row">
          <div class="stats-bar-label">${name}: ${val}</div>
          <div class="stats-bar-track">
            <div class="stats-bar-fill" style="width:${Math.round(val/max*100)}%"></div>
          </div>
        </div>`).join('');
  } catch (e) {}
}

// ====== INIT ======

load();
loadTrainers();
loadStats();
setInterval(load, 30000);
setInterval(loadTrainers, 30000);