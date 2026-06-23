const API_URL = 'http://localhost:5000';

let currentAge = 'kids';
let currentTrainerFilter = 'all';

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

function showNotification(text, type) {
  const n = document.getElementById('notification');
  n.innerText = text;
  n.style.background = type === 'error' ? '#e53935' : '#1B5E20';
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 3500);
}

function getTrainerPhoto(name) {
  const photos = {
    'Кулунбек': 'images/sambo.jpeg',
    'Кундуз': 'images/samb.jpeg',
    'Асылбек': 'images/g3.jpeg',
    'Тилекмат': 'images/g2.jpeg',
    'Аксыбек': 'images/karat.jpeg'
  };
  return photos[name] || 'https://i.pravatar.cc/300';
}

function openTrainerModal(trainer) {
  const sportColors = { 'Самбо': '#E3F2FD:#0D47A1', 'Карате': '#F3E5F5:#6A1B9A', 'Бокс': '#FBE9E7:#BF360C' };
  const [bg, color] = (sportColors[trainer.sport] || '#eee:#333').split(':');

  document.getElementById('modalPhoto').src    = getTrainerPhoto(trainer.name);
  document.getElementById('modalName').textContent    = trainer.name;
  document.getElementById('modalTitle').textContent   = trainer.title;
  document.getElementById('modalAchieve').textContent = trainer.achieve;

  const sportEl = document.getElementById('modalSport');
  sportEl.textContent = trainer.sport;
  sportEl.style.background = bg;
  sportEl.style.color = color;

  const modal = document.getElementById('trainerModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTrainerModal() {
  document.getElementById('trainerModal').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('click', function(e) {
  const modal = document.getElementById('trainerModal');
  if (e.target === modal) closeTrainerModal();
});

async function submitEnroll() {
  const name    = document.getElementById('enrollName').value.trim();
  const phone   = document.getElementById('enrollPhone').value.trim();
  const sport   = document.getElementById('enrollSport').value;
  const age     = document.getElementById('enrollAge').value.trim();
  const comment = document.getElementById('enrollComment')?.value.trim() || '';

  if (!name || !phone || !sport) {
    showNotification('Заполните обязательные поля', 'error');
    return;
  }

  const phoneClean = phone.replace(/[\s\-\(\)\+]/g, '');
  if (!/^\d{9,12}$/.test(phoneClean)) {
    showNotification('Введите корректный номер телефона', 'error');
    return;
  }

  const btn = document.querySelector('.form-submit');
  btn.disabled = true;
  btn.textContent = 'Отправка...';

  try {
    const res = await fetch(API_URL + '/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, sport, age, comment })
    });
    const data = await res.json();
    if (data.ok) {
      showNotification('Заявка принята! Свяжемся с вами в течение часа.');
      ['enrollName','enrollPhone','enrollSport','enrollAge','enrollComment'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    } else {
      showNotification(data.error || 'Ошибка', 'error');
    }
  } catch (e) {
    const apps = JSON.parse(localStorage.getItem('applications') || '[]');
    apps.push({ id: Date.now(), name, phone, sport, age, comment, status: 'new' });
    localStorage.setItem('applications', JSON.stringify(apps));
    showNotification('Заявка сохранена! Свяжемся с вами в течение часа.');
    ['enrollName','enrollPhone','enrollSport','enrollAge','enrollComment'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
  } finally {
    btn.disabled = false;
    btn.textContent = 'Отправить Заявку';
  }
}

function openAdmin() {
  document.getElementById('adminModal').classList.add('open');
}

function closeAdmin() {
  document.getElementById('adminModal').classList.remove('open');
}

// Hamburger
document.getElementById('hamburger').addEventListener('click', function(e) {
  e.stopPropagation();
  this.classList.toggle('open');
  document.querySelector('.nav-links').classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(function(l) {
  l.addEventListener('click', function() {
    document.getElementById('hamburger').classList.remove('open');
    document.querySelector('.nav-links').classList.remove('open');
  });
});
function closeMenuOnOutsideClick(e) {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks && !hamburger.contains(e.target) && !navLinks.contains(e.target)) {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  }
}
document.addEventListener('click', closeMenuOnOutsideClick);
document.addEventListener('touchstart', closeMenuOnOutsideClick, {passive: true});

async function doLogin() {
  const login = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  // Local mock login for GitHub Pages
  if (login === 'admin' && pass === 'admin') {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
    renderAll();
  } else {
    document.getElementById('loginError').textContent = 'Неверный логин или пароль (используйте admin/admin)';
    document.getElementById('loginError').style.display = 'block';
  }
}

function filterTrainer(sport, el) {
  currentTrainerFilter = sport;
  document.querySelectorAll('.trainers-filter .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderTrainers();
}

function renderTrainers() {
  const grid = document.getElementById('trainersGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = trainers.filter(t => currentTrainerFilter === 'all' || t.sport === currentTrainerFilter);

  filtered.forEach(t => {
    let bc = t.sport === 'Самбо' ? 'badge-sambo' : t.sport === 'Карате' ? 'badge-karate' : 'badge-boxing';
    const card = document.createElement('div');
    card.className = 'trainer-card';
    card.style.cursor = 'pointer';
    card.onclick = () => openTrainerModal(t);
    card.innerHTML = `
      <div class="trainer-photo">
        <img src="${getTrainerPhoto(t.name)}" alt="${t.name}">
        <div class="trainer-badge ${bc}">${t.sport}</div>
      </div>
      <div class="trainer-info">
        <div class="trainer-name">${t.name}</div>
        <div class="trainer-sport">${t.title}</div>
        <div class="trainer-bio">Нажмите для подробной информации</div>
        <div class="trainer-medals"><div class="medal">${t.achieve.split('.')[0]}</div></div>
      </div>`;
    grid.appendChild(card);
  });
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
  renderTrainers(); renderTrainersAdmin();
}

function deleteTrainer(id) {
  trainers = trainers.filter(t => t.id !== id);
  localStorage.setItem('trainers', JSON.stringify(trainers));
  renderTrainers(); renderTrainersAdmin();
}

function renderSchedule() {
  const grid = document.getElementById('scheduleGrid');
  if (!grid) return;
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const byAge = {
    kids:   [{time:'08:30–10:00'},{time:'15:00–16:30'}],
    junior: [{time:'08:30–10:00'},{time:'17:00–18:30'}],
    adult:  [{time:'18:30–20:00'}]
  };
  const sports = [{name:'Самбо',class:'slot-sambo'},{name:'Карате',class:'slot-karate'},{name:'Бокс',class:'slot-boxing'}];
  grid.innerHTML = '';
  days.forEach(day => {
    let col = `<div class="day-col"><div class="day-header">${day}</div>`;
    if (day === 'Вс') {
      col += `<div class="schedule-slot">Выходной</div>`;
    } else {
      byAge[currentAge].forEach(t => sports.forEach(s => {
        col += `<div class="schedule-slot ${s.class}"><div class="slot-time">${t.time}</div><div class="slot-name">${s.name}</div></div>`;
      }));
    }
    grid.innerHTML += col + '</div>';
  });
}

function setAge(age, el) {
  currentAge = age;
  document.querySelectorAll('.schedule-filter .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderSchedule();
}

function addSlot() {}
function renderScheduleAdmin() {
  const body = document.getElementById('scheduleAdminBody');
  if (!body) return;
  body.innerHTML = schedule.map(s => `<tr>
    <td>${s.day}</td><td>${s.time}</td><td><span class="sport-badge">${s.sport}</span></td><td>${s.trainer}</td>
    <td><button class="admin-action-btn delete" onclick="deleteSlot(${s.id})">Удалить</button></td>
  </tr>`).join('');
}
function deleteSlot(id) {
  schedule = schedule.filter(s => s.id !== id);
  localStorage.setItem('schedule', JSON.stringify(schedule));
  renderScheduleAdmin();
}

function scrollGallery(x) {
  document.querySelector('.gallery-grid').scrollBy({ left: x, behavior: 'smooth' });
}

(function initSwipe() {
  let startX = 0;
  const el = document.querySelector('.gallery-grid');
  if (!el) return;
  el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) el.scrollBy({ left: diff * 2, behavior: 'smooth' });
  }, { passive: true });
})();

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

function renderStats() {
  const apps = JSON.parse(localStorage.getItem('applications') || '[]');
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

function renderAll() {
  renderTrainers();
  renderTrainersAdmin();
  renderSchedule();
  renderScheduleAdmin();
  renderStats();
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let v = 0;
  const step = Math.ceil(target / 60);
  const t = setInterval(() => {
    v += step;
    if (v >= target) { el.textContent = target; clearInterval(t); }
    else el.textContent = v;
  }, 20);
}

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter('c1', 110);
      animateCounter('c2', 6);
      animateCounter('c3', 27);
      heroObserver.disconnect();
    }
  });
}, { threshold: 0.05 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) btn.style.display = window.scrollY > 400 ? 'block' : 'none';
});

renderAll();
