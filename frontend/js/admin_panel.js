const SUPABASE_URL = 'https://egbiowrgdhudxmdytmfu.supabase.co/rest/v1/applications';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYmlvd3JnZGh1ZHhtZHl0bWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjUyNzAsImV4cCI6MjA5NzgwMTI3MH0.CG2GFXORqUyR_xu5Ci0KyOFO86fZADQE-ScM3riBr_I';
const SUPABASE_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

let applicationsCache = [];
let trainers = JSON.parse(localStorage.getItem('trainers')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || [];

if (trainers.length === 0) {
  trainers = [
    { id: 1, name: 'Кулунбек', sport: 'Самбо',  title: 'Главный тренер', achieve: 'Мастер спорта. Подготовил более 50 призёров соревнований КР. Тренерский стаж — 15 лет.' },
    { id: 2, name: 'Кундуз',   sport: 'Самбо',  title: 'Тренер',         achieve: 'Мастер спорта. Специализация — женское самбо и группы дети 6–12 лет.' },
    { id: 3, name: 'Асылбек',  sport: 'Бокс',   title: 'Старший тренер', achieve: 'Чемпион Кыргызстана 2018, 2020. Призёр чемпионата Центральной Азии. Тренерский стаж — 10 лет.' },
    { id: 4, name: 'Тилекмат',  sport: 'Бокс',   title: 'Тренер',         achieve: 'Призёр городских и республиканских турниров. Специализация — юниорский и любительский бокс.' },
    { id: 5, name: 'Аксыбек',   sport: 'Карате', title: 'Тренер',         achieve: 'Обладатель чёрного пояса, 2 дан. Призёр чемпионата Кыргызстана по WKF. Стаж 8 лет.' }
  ];
  localStorage.setItem('trainers', JSON.stringify(trainers));
}

async function doLogin() {
  const login = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (login === 'admin' && pass === 'admin') {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
    renderAllAdmin();
  } else {
    document.getElementById('loginError').textContent = 'Неверный логин или пароль';
    document.getElementById('loginError').style.display = 'block';
  }
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

async function loadApplicationsAdmin() {
  try {
    const res = await fetch(SUPABASE_URL + '?select=*', { headers: SUPABASE_HEADERS });
    if (res.ok) {
      applicationsCache = await res.json();
      renderApplicationsAdmin();
      renderStats();
    }
  } catch(e) {}
}

function renderApplicationsAdmin() {
  const body = document.getElementById('applicationsBody');
  if (!body) return;
  const STATUS_TEXT = { new: 'Новая', done: 'Готово', called: 'Звонили' };
  body.innerHTML = applicationsCache.map(a => {
    const statusClass = a.status === 'new' ? 'badge-new' : a.status === 'done' ? 'badge-done' : 'badge-called';
    const statusText = STATUS_TEXT[a.status] || a.status;
    return `<tr>
      <td>${a.id}</td>
      <td>${a.name}</td>
      <td><a href="tel:${a.phone}">${a.phone}</a></td>
      <td><span class="sport-badge">${a.sport}</span></td>
      <td>${a.age || '-'}</td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>
        <button class="admin-action-btn edit" onclick="updateAppStatus(${a.id}, 'done')" title="Готово">✔</button>
        <button class="admin-action-btn call" onclick="updateAppStatus(${a.id}, 'called')" title="Звонили">📞</button>
        <button class="admin-action-btn delete" onclick="deleteApp(${a.id})" title="Удалить">✖</button>
      </td>
    </tr>`;
  }).join('');
}

async function updateAppStatus(id, status) {
  try {
    await fetch(SUPABASE_URL + '?id=eq.' + id, {
      method: 'PATCH',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({ status })
    });
    loadApplicationsAdmin();
  } catch (e) {}
}

async function deleteApp(id) {
  if(!confirm('Удалить заявку?')) return;
  try {
    await fetch(SUPABASE_URL + '?id=eq.' + id, { method: 'DELETE', headers: SUPABASE_HEADERS });
    loadApplicationsAdmin();
  } catch (e) {}
}

function renderTrainersAdmin() {
  const body = document.getElementById('trainersAdminBody');
  if (!body) return;
  const sportClass = { 'Самбо': 'sambo', 'Карате': 'karate', 'Бокс': 'boxing' };
  body.innerHTML = trainers.map(t =>
    `<tr>
      <td>${t.name}</td>
      <td><span class="sport-badge ${sportClass[t.sport] || ''}">${t.sport}</span></td>
      <td>${t.title}</td>
      <td>${t.achieve}</td>
      <td><button class="admin-action-btn delete" onclick="deleteTrainer(${t.id})">Удалить</button></td>
    </tr>`
  ).join('');
}

function addTrainer() {
  const name    = document.getElementById('trName').value.trim();
  const sportVal= document.getElementById('trSport').value;
  const title   = document.getElementById('trTitle').value.trim();
  const achieve = document.getElementById('trAchieve').value.trim();
  const sportLabel = { sambo: 'Самбо', karate: 'Карате', boxing: 'Бокс' };
  if (!name) return;
  trainers.push({ id: Date.now(), name, sport: sportLabel[sportVal] || sportVal, title, achieve });
  localStorage.setItem('trainers', JSON.stringify(trainers));
  renderTrainersAdmin();
  renderStats();
}

function deleteTrainer(id) {
  trainers = trainers.filter(t => t.id !== id);
  localStorage.setItem('trainers', JSON.stringify(trainers));
  renderTrainersAdmin();
  renderStats();
}

function renderScheduleAdmin() {
  const body = document.getElementById('scheduleAdminBody');
  if (!body) return;
  body.innerHTML = schedule.map(s => `<tr>
    <td>${s.day}</td><td>${s.time}</td><td><span class="sport-badge">${s.sport}</span></td><td>${s.trainer}</td>
    <td><button class="admin-action-btn delete" onclick="deleteSlot(${s.id})">Удалить</button></td>
  </tr>`).join('');
}

function addSlot() {
  const time = document.getElementById('slotTime').value.trim();
  const day = document.getElementById('slotDay').value;
  const sportVal = document.getElementById('slotSport').value;
  const trainer = document.getElementById('slotTrainer').value.trim();
  const sportLabel = { sambo: 'Самбо', karate: 'Карате', boxing: 'Бокс' };
  if (!time) return;
  schedule.push({ id: Date.now(), time, day, sport: sportLabel[sportVal] || sportVal, trainer });
  localStorage.setItem('schedule', JSON.stringify(schedule));
  renderScheduleAdmin();
  renderStats();
}

function deleteSlot(id) {
  schedule = schedule.filter(s => s.id !== id);
  localStorage.setItem('schedule', JSON.stringify(schedule));
  renderScheduleAdmin();
  renderStats();
}

function renderStats() {
  const apps = applicationsCache;
  const se = document.getElementById('statEnroll');
  const st = document.getElementById('statTrainers');
  const ss = document.getElementById('statSlots');
  if (se) se.innerText = apps.length;
  if (st) st.innerText = trainers.length;
  if (ss) ss.innerText = schedule.length;

  const bars = document.getElementById('sportBars');
  if (!bars) return;
  const counts = { Самбо: 0, Карате: 0, Бокс: 0 };
  const map = { sambo: 'Самбо', karate: 'Карате', boxing: 'Бокс' };
  apps.forEach(a => { if (map[a.sport]) counts[map[a.sport]]++; });
  const max = Math.max(...Object.values(counts), 1);
  bars.innerHTML = Object.entries(counts).map(([name, val]) => `
    <div style="margin-bottom:12px;">
      <div style="font-size:0.82rem;margin-bottom:4px;color:#333;">${name}: ${val}</div>
      <div style="height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;">
        <div style="height:100%;width:${Math.round(val/max*100)}%;background:#FFD600;border-radius:5px;transition:width .6s;"></div>
      </div>
    </div>`).join('');
}

function renderAllAdmin() {
  renderTrainersAdmin();
  renderScheduleAdmin();
  loadApplicationsAdmin();
}
