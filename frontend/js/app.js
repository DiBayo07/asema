const API_URL = 'http://localhost:5000';

const SUPABASE_URL = 'https://egbiowrgdhudxmdytmfu.supabase.co/rest/v1/applications';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYmlvd3JnZGh1ZHhtZHl0bWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjUyNzAsImV4cCI6MjA5NzgwMTI3MH0.CG2GFXORqUyR_xu5Ci0KyOFO86fZADQE-ScM3riBr_I';
const SUPABASE_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

let applicationsCache = [];
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
    const res = await fetch('https://egbiowrgdhudxmdytmfu.supabase.co/rest/v1/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYmlvd3JnZGh1ZHhtZHl0bWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjUyNzAsImV4cCI6MjA5NzgwMTI3MH0.CG2GFXORqUyR_xu5Ci0KyOFO86fZADQE-ScM3riBr_I',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYmlvd3JnZGh1ZHhtZHl0bWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjUyNzAsImV4cCI6MjA5NzgwMTI3MH0.CG2GFXORqUyR_xu5Ci0KyOFO86fZADQE-ScM3riBr_I',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ name, phone, sport, age, comment })
    });
    if (res.ok) {
      showNotification('Заявка принята! Свяжемся с вами в течение часа.');
      ['enrollName','enrollPhone','enrollSport','enrollAge','enrollComment'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    } else {
      const errorData = await res.json();
      showNotification(errorData.message || 'Ошибка', 'error');
    }
  } catch (e) {
    showNotification('Ошибка сети. Попробуйте позже.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Отправить Заявку';
  }
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



function renderAll() {
  renderTrainers();
  renderSchedule();
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
