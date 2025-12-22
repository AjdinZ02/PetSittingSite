
// script.js

// === Hamburger (nav) ===
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    if (navLinks) navLinks.classList.toggle('active');
  });
}

// ===== Auth helperi (localStorage) =====
var AUTH_TOKEN_KEY = 'auth_token';
var AUTH_USER_KEY = 'auth_user';

function getAuth() {
  try {
    var t = localStorage.getItem(AUTH_TOKEN_KEY);
    var u = localStorage.getItem(AUTH_USER_KEY);
    return (t && u) ? { token: t, user: JSON.parse(u) } : null;
  } catch (e) { return null; }
}

function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function applyNavAuthState() {
  var auth = getAuth();
  var navLogin = document.getElementById('navLogin');
  var navLogout = document.getElementById('navLogout');
  var navAdmin = document.getElementById('navAdmin');
  var navUser = document.getElementById('navUser');
  var navUsername = document.getElementById('navUsername');
  if (!navLogin || !navLogout) return;

  if (auth) {
    navLogin.style.display = 'none';
    navLogout.style.display = 'inline-block';
    if (navAdmin) navAdmin.style.display = (auth.user.role === 'admin') ? 'inline-block' : 'none';
    if (navUser) {
      navUser.style.display = 'inline-block';
      if (navUsername) navUsername.textContent = auth.user.username;
    }
  } else {
    navLogin.style.display = 'inline-block';
    navLogout.style.display = 'none';
    if (navAdmin) navAdmin.style.display = 'none';
    if (navUser) navUser.style.display = 'none';
    if (navUsername) navUsername.textContent = 'Guest';
  }
}

function wireLogout() {
  var navLogout = document.getElementById('navLogout');
  if (!navLogout) return;
  navLogout.addEventListener('click', function (e) {
    e.preventDefault();
    var auth = getAuth();
    if (!auth) { applyNavAuthState(); return; }
    fetch('/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + auth.token }
    })
      .catch(function () { /* ignore */ })
      .finally(function () {
        clearAuth();
        applyNavAuthState();
        if (location.pathname.endsWith('admin.html')) location.href = 'index.html';
      });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  applyNavAuthState();
  wireLogout();
});

// ===== API helper =====
function api(path) { return (path.charAt(0) === '/' ? path : '/' + path); }

// ===== Kalendar/rezervacije =====
var SLOT_STEP_MIN = 60;
var WORK_FROM = '08:00';
var WORK_TO = '22:00';

var dateEl     = document.getElementById('res-date');
var slotsEl    = document.getElementById('time-slots');
var timeEl     = document.getElementById('res-time');
var nameEl     = document.getElementById('res-name');
var petTypeEl  = document.getElementById('res-pet-type');
var petNameEl  = document.getElementById('res-pet-name');
var notesEl    = document.getElementById('res-notes');
var submitBtn  = document.getElementById('submit-res');
// ✅ NOVO:
var addressEl  = document.getElementById('res-address');
var phoneEl    = document.getElementById('res-phone');

var calGrid    = document.getElementById('cal-grid');
var calTitle   = document.getElementById('cal-title');
var prevMonthBtn = document.getElementById('prev-month');
var nextMonthBtn = document.getElementById('next-month');

var selectedTime = null;
var currentMonth = (function () {
  var d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() }; // 0–11
})();

// Helpers
function toMinutes(hhmm) {
  var parts = String(hhmm).split(':');
  var h = Number(parts[0]);
  var m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}
function formatHHMM(mins) {
  var h = String(Math.floor(mins / 60));
  var m = String(mins % 60);
  if (h.length < 2) h = '0' + h;
  if (m.length < 2) m = '0' + m;
  return h + ':' + m;
}
function makeSlots(startHHMM, endHHMM, stepMin) {
  var res = [];
  var start = toMinutes(startHHMM);
  var end = toMinutes(endHHMM);
  for (var s = start; s + stepMin <= end; s += stepMin) {
    res.push(formatHHMM(s));
  }
  return res;
}
function firstDayOfMonth(year, month) { return new Date(year, month, 1); }
function lastDayOfMonth(year, month) { return new Date(year, month + 1, 0); }
function yyyyMMDD(dateObj) {
  var y = dateObj.getFullYear();
  var m = String(dateObj.getMonth() + 1); if (m.length < 2) m = '0' + m;
  var d = String(dateObj.getDate());      if (d.length < 2) d = '0' + d;
  return y + '-' + m + '-' + d;
}

// API
function fetchAvailability(date) {
  return fetch(api('/availability?date=' + encodeURIComponent(date)))
    .then(function (r) {
      if (!r.ok) throw new Error('Greška pri dohvaćanju dostupnosti.');
      return r.json();
    });
}
function fetchAvailabilityRange(from, to) {
  return fetch(api('/availability/range?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to)))
    .then(function (r) {
      if (!r.ok) throw new Error('Greška pri dohvaćanju kalendarske dostupnosti.');
      return r.json();
    });
}

// Slots render
function renderSlots(allSlots, takenTimes) {
  if (!slotsEl) return;
  slotsEl.innerHTML = '';
  selectedTime = null;
  if (timeEl) timeEl.value = '';
  allSlots.forEach(function (t) {
    var isTaken = takenTimes.indexOf(t) !== -1;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot ' + (isTaken ? 'taken' : 'free');
    btn.textContent = t;
    btn.disabled = isTaken;
    btn.addEventListener('click', function () {
      Array.prototype.slice.call(slotsEl.querySelectorAll('.slot.selected'))
        .forEach(function (el) { el.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedTime = t;
      if (timeEl) timeEl.value = t;
      if (dateEl) dateEl.dispatchEvent(new Event('input'));
    });
    slotsEl.appendChild(btn);
  });
}

// Kalendar render
function renderCalendar(year, month) {
  if (!calGrid || !calTitle) return;
  var first = firstDayOfMonth(year, month);
  var last = lastDayOfMonth(year, month);
  try {
    calTitle.textContent = first.toLocaleDateString('bs-BA', { month: 'long', year: 'numeric' });
  } catch (e) {
    calTitle.textContent = year + '-' + (month + 1);
  }
  var from = yyyyMMDD(first);
  var to   = yyyyMMDD(last);
  fetchAvailabilityRange(from, to)
    .then(function (data) {
      var weekStart = (first.getDay() || 7) - 1; // 0=pon
      var totalDays = last.getDate();
      calGrid.innerHTML = '';
      for (var i = 0; i < weekStart; i++) {
        var empty = document.createElement('div');
        empty.className = 'day disabled';
        empty.textContent = '';
        calGrid.appendChild(empty);
      }
      var totalSlots = data.settings.totalSlots;
      for (var day = 1; day <= totalDays; day++) {
        (function (dayIdx) {
          var d = new Date(year, month, dayIdx);
          var key = yyyyMMDD(d);
          var info = data.days[key] || { takenTimes: [], fullyBooked: false };
          var cell = document.createElement('div');
          var statusClass = 'free';
          if (info.fullyBooked) statusClass = 'full';
          else if (info.takenTimes.length > 0 && info.takenTimes.length < totalSlots) statusClass = 'partial';
          cell.className = 'day ' + statusClass;
          cell.textContent = String(dayIdx);
          cell.addEventListener('click', function () {
            if (statusClass === 'full') {
              alert('Ovaj dan je 100% zauzet.');
              return;
            }
            if (dateEl) {
              dateEl.value = key;
              dateEl.dispatchEvent(new Event('change'));
            }
            Array.prototype.slice.call(calGrid.querySelectorAll('.day.selected'))
              .forEach(function (el) { el.classList.remove('selected'); });
            cell.classList.add('selected');
          });
          calGrid.appendChild(cell);
        })(day);
      }
    })
    .catch(function (e) {
      console.error(e);
      calGrid.innerHTML = '<div style="grid-column:1/-1;color:#c00">Greška pri učitavanju kalendara.</div>';
    });
}

// Navigacija mjeseca
if (prevMonthBtn) {
  prevMonthBtn.addEventListener('click', function () {
    currentMonth.month -= 1;
    if (currentMonth.month < 0) { currentMonth.month = 11; currentMonth.year -= 1; }
    renderCalendar(currentMonth.year, currentMonth.month);
  });
}
if (nextMonthBtn) {
  nextMonthBtn.addEventListener('click', function () {
    currentMonth.month += 1;
    if (currentMonth.month > 11) { currentMonth.month = 0; currentMonth.year += 1; }
    renderCalendar(currentMonth.year, currentMonth.month);
  });
}

// Reakcija na promjenu datuma: učitaj slotove
if (dateEl) {
  dateEl.addEventListener('change', function () {
    var date = dateEl.value;
    if (!date) return;
    fetchAvailability(date)
      .then(function (data) {
        var allSlots = makeSlots(WORK_FROM, WORK_TO, SLOT_STEP_MIN);
        renderSlots(allSlots, data.takenTimes || []);
      })
      .catch(function (e) {
        console.error(e);
        alert('Nešto je pošlo po zlu pri dohvaćanju zauzeća.');
      });
  });
}

// Submit rezervacije — ✅ šalje adresa i telefon (status = pending)
if (submitBtn) {
  submitBtn.addEventListener('click', function () {
    var payload = {
      ime_prezime: (nameEl && nameEl.value ? nameEl.value.trim() : ''),
      datum: (dateEl && dateEl.value ? dateEl.value : ''),
      vrijeme: (selectedTime != null ? selectedTime : (timeEl && timeEl.value ? timeEl.value : '')),
      trajanje_min: SLOT_STEP_MIN, // 60 min
      ime_zivotinje: (petNameEl && petNameEl.value ? petNameEl.value.trim() : ''),
      vrsta_zivotinje: (petTypeEl && petTypeEl.value ? petTypeEl.value : ''),
      napomena: (notesEl && notesEl.value ? notesEl.value.trim() : ''),
      adresa: (addressEl && addressEl.value ? addressEl.value.trim() : ''),
      telefon: (phoneEl && phoneEl.value ? phoneEl.value.trim() : '')
    };

    if (!payload.datum || !payload.vrijeme) {
      alert('Molimo izaberite datum i slobodan termin.');
      return;
    }
    if (!payload.ime_prezime || !payload.ime_zivotinje || !payload.vrsta_zivotinje) {
      alert('Molimo popunite obavezna polja (ime, vrsta i ime ljubimca).');
      return;
    }
    if (!payload.adresa || payload.adresa.length < 5) {
      alert('Unesite adresu (min 5 znakova).');
      return;
    }
    var phoneRe = /^[+]?[\d\s\-()]{7,15}$/;
    if (!payload.telefon || !phoneRe.test(payload.telefon)) {
      alert('Unesite validan broj telefona (npr. +387 61 123 456).');
      return;
    }

    var auth = getAuth();
    fetch(api('/rezervacija'), {
      method: 'POST',
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        auth ? { 'Authorization': 'Bearer ' + auth.token } : {}
      ),
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok)
          return r.json().catch(function () { return { error: 'Greška' }; })
            .then(function (j) { throw new Error(j.error || 'Greška pri slanju zahtjeva.'); });
        return r.json();
      })
      .then(function () {
        if (window.toast && toast.success) {
          toast.success('✅ Zahtjev poslan. Bićete obaviješteni nakon odobrenja.');
        } else {
          alert('Zahtjev poslan. Bićete obaviješteni nakon odobrenja.');
        }
        selectedTime = null;
        if (timeEl) timeEl.value = '';
        if (nameEl) nameEl.value = '';
        if (petNameEl) petNameEl.value = '';
        if (notesEl) notesEl.value = '';
        if (addressEl) addressEl.value = '';
        if (phoneEl) phoneEl.value = '';
        setTimeout(function () { window.location.href = 'index.html'; }, 600);
      })
      .catch(function (e) {
        console.error(e);
        alert('Nešto je pošlo po zlu pri slanju zahtjeva.');
      });
  });
}

// Inicijalizacija
(function init() {
  if (calGrid && calTitle) {
    renderCalendar(currentMonth.year, currentMonth.month);
  }
})();
