const API = '';
const byId = (id) => document.getElementById(id);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function showDebug(obj) {
  const el = byId('debug');
  if (!el) return;
  el.style.display = 'block';
  el.textContent = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
}

function renderError(msg) {
  const e = byId('admin-error');
  if (!e) return;
  e.textContent = msg;
  e.style.display = 'block';
}

function renderUserPill() {
  const pill = byId('admin-user-pill');
  if (!pill) return;
  const userStr = localStorage.getItem('auth_user');
  const user = userStr ? JSON.parse(userStr) : null;
  pill.textContent = user ? `👤 ${user.username} (${user.role})` : '👤 Guest';
}

function renderTable(rows) {
  const body = byId('rezBody');
  if (!body) return;

  body.innerHTML = '';

  if (!rows || rows.length === 0) {
    body.innerHTML = '<tr><td colspan="18" style="padding:10px;">Nema rezervacija.</td></tr>';
    return;
  }

  // Helper function to format yes/no answers
  function formatYesNo(value) {
    if (!value) return '-';
    if (value === 'yes') return 'Da';
    if (value === 'no') return 'Ne';
    return value;
  }

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Datum">${formatDate(r.datum)}</td>
      <td data-label="Početak">${r.vrijeme ?? ''}</td>
      <td data-label="Ime i prezime">${r.ime_prezime}</td>
      <td data-label="Životinja">${r.ime_zivotinje}</td>
      <td data-label="Vrsta">${r.vrsta_zivotinje}</td>
      <td data-label="Adresa">${r.adresa ?? ''}</td>
      <td data-label="Telefon">${r.telefon ?? ''}</td>
      <td data-label="Napomena">${r.napomena ?? ''}</td>
      <td data-label="Parking">${formatYesNo(r.parking)}</td>
      <td data-label="Sa mužjacima">${formatYesNo(r.males)}</td>
      <td data-label="Sa ženkama">${formatYesNo(r.females)}</td>
      <td data-label="Povodac">${formatYesNo(r.leash)}</td>
      <td data-label="Bježi">${formatYesNo(r.runaway)}</td>
      <td data-label="Strahovi">${formatYesNo(r.fears)}</td>
      <td data-label="Kretanje">${formatYesNo(r.mobility)}</td>
      <td data-label="Vakcinisan">${formatYesNo(r.vaccinated)}</td>
      <td data-label="Status"><span class="admin-pill status-${r.status}">${r.status}</span></td>
      <td data-label="Akcije" class="admin-actions">
        <button class="btn btn-approve" data-id="${r.id}" ${r.status==='approved' ? 'disabled' : ''}>Odobri</button>
        <button class="btn btn-reject"  data-id="${r.id}" ${r.status==='rejected' ? 'disabled' : ''}>Odbij</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

let allReservations = [];
let currentFilter = null;

async function loadReservations() {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  const user = userStr ? JSON.parse(userStr) : null;

  renderUserPill();
  showDebug({ tokenExists: !!token, user });

  if (!token || !user) {
    renderError('Niste prijavljeni. Molimo ulogujte se.');
    setTimeout(() => { location.href = 'login.html'; }, 800);
    return;
  }
  if (user.role !== 'admin') {
    renderError('Pristup samo za admin.');
    setTimeout(() => { location.href = 'index.html'; }, 1200);
    return;
  }

  try {
    const r = await fetch(`${API}/rezervacije`, {
      method: 'GET',
      headers: { ...authHeaders() }
    });

    showDebug({ status: r.status, ok: r.ok, url: r.url });

    if (r.status === 401) {
      renderError('Sesija istekla ili nevažeća (401). Prijavite se ponovo.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setTimeout(() => (location.href = 'login.html'), 800);
      return;
    }
    if (r.status === 403) {
      renderError('Nedovoljna ovlaštenja (403).');
      setTimeout(() => (location.href = 'index.html'), 1200);
      return;
    }
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      renderError(j.error || 'Greška pri učitavanju rezervacija.');
      return;
    }

    allReservations = await r.json();
    console.log('Loaded reservations:', allReservations.length, allReservations);
    showDebug({ rows: Array.isArray(allReservations) ? allReservations.length : 0 });
    applyFilter();
    window.toast?.success?.('Rezervacije učitane.');
  } catch (e) {
    console.error(e);
    renderError('Greška u mreži. Provjerite da backend radi na http://localhost:3000.');
    showDebug(String(e));
  }
}

function applyFilter() {
  let filteredData = allReservations;
  
  if (currentFilter) {
    console.log('Filtering by:', currentFilter);
    filteredData = allReservations.filter(res => {
      // Normalize date to YYYY-MM-DD format
      const resDate = res.datum ? res.datum.split('T')[0] : '';
      console.log('Comparing:', resDate, '===', currentFilter, '?', resDate === currentFilter);
      return resDate === currentFilter;
    });
    console.log('Filtered results:', filteredData.length);
    const filterLabel = byId('filter-label');
    if (filterLabel) {
      filterLabel.textContent = `Filtrirano: ${currentFilter} (${filteredData.length} rezervacija)`;
    }
  } else {
    const filterLabel = byId('filter-label');
    if (filterLabel) filterLabel.textContent = '';
  }
  
  renderTable(filteredData);
}

// Delegirani klikovi na dugmad Odobri/Odbij
const body = byId('rezBody');
if (body) {
  body.addEventListener('click', async (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    const id = Number(t.getAttribute('data-id'));
    if (!id) return;

    const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
    try {
      if (t.classList.contains('btn-approve')) {
        const r = await fetch(`${API}/rezervacije/${id}/approve`, { method: 'PUT', headers });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Greška');
        window.toast?.success?.('Zahtjev odobren.');
        loadReservations();
      } else if (t.classList.contains('btn-reject')) {
        const r = await fetch(`${API}/rezervacije/${id}/reject`, { method: 'PUT', headers });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Greška');
        window.toast?.success?.('Zahtjev odbijen.');
        loadReservations();
      }
    } catch (e) {
      console.error(e);
      renderError('Greška pri izmjeni statusa.');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadReservations();
  const reloadBtn = byId('reload-btn');
  if (reloadBtn) reloadBtn.addEventListener('click', loadReservations);

  // Filter by date
  const filterDateInput = byId('filter-date');
  const showAllBtn = byId('show-all-btn');

  if (filterDateInput) {
    filterDateInput.addEventListener('change', function() {
      console.log('Date input changed to:', this.value);
      console.log('All reservations count:', allReservations.length);
      if (allReservations.length > 0) {
        console.log('Sample reservation datum:', allReservations[0].datum);
      }
      if (this.value) {
        currentFilter = this.value;
        applyFilter();
      }
    });
  }

  if (showAllBtn) {
    showAllBtn.addEventListener('click', function() {
      currentFilter = null;
      if (filterDateInput) filterDateInput.value = '';
      applyFilter();
    });
  }

  // Tab switching
  setupTabs();

  // Quick booking functionality
  setupQuickBooking();
});

// ============ TAB SWITCHING ============
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Remove active from all buttons and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active to clicked button and corresponding content
      btn.classList.add('active');
      const content = document.getElementById(`${targetTab}-tab`);
      if (content) content.classList.add('active');
    });
  });
}

// ============ QUICK BOOKING FUNCTIONALITY ============
const SLOT_STEP_MIN = 60;
const WORK_FROM = '08:00';
const WORK_TO = '22:00';

let quickCurrentMonth = (function () {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
})();

let quickSelectedTime = null;

function toMinutes(hhmm) {
  const parts = String(hhmm).split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function formatHHMM(mins) {
  let h = String(Math.floor(mins / 60));
  let m = String(mins % 60);
  if (h.length < 2) h = '0' + h;
  if (m.length < 2) m = '0' + m;
  return h + ':' + m;
}

function makeSlots(startHHMM, endHHMM, stepMin) {
  const res = [];
  const start = toMinutes(startHHMM);
  const end = toMinutes(endHHMM);
  for (let s = start; s + stepMin <= end; s += stepMin) {
    res.push(formatHHMM(s));
  }
  return res;
}

function firstDayOfMonth(year, month) { 
  return new Date(year, month, 1); 
}

function lastDayOfMonth(year, month) { 
  return new Date(year, month + 1, 0); 
}

function yyyyMMDD(dateObj) {
  const y = dateObj.getFullYear();
  let m = String(dateObj.getMonth() + 1); 
  if (m.length < 2) m = '0' + m;
  let d = String(dateObj.getDate());      
  if (d.length < 2) d = '0' + d;
  return y + '-' + m + '-' + d;
}

function fetchAvailability(date) {
  return fetch(`/availability?date=${encodeURIComponent(date)}`)
    .then(r => {
      if (!r.ok) throw new Error('Greška pri dohvaćanju dostupnosti.');
      return r.json();
    });
}

function fetchAvailabilityRange(from, to) {
  return fetch(`/availability/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
    .then(r => {
      if (!r.ok) throw new Error('Greška pri dohvaćanju kalendarske dostupnosti.');
      return r.json();
    });
}

function setupQuickBooking() {
  const quickDateEl = byId('quick-res-date');
  const quickSlotsEl = byId('quick-time-slots');
  const quickCalGrid = byId('quick-cal-grid');
  const quickCalTitle = byId('quick-cal-title');
  const quickPrevBtn = byId('quick-prev-month');
  const quickNextBtn = byId('quick-next-month');

  // Render slots
  function renderQuickSlots(allSlots, takenTimes) {
    if (!quickSlotsEl) return;
    quickSlotsEl.innerHTML = '';
    quickSelectedTime = null;
    
    allSlots.forEach(t => {
      const isTaken = takenTimes.indexOf(t) !== -1;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot ' + (isTaken ? 'taken' : 'free');
      btn.textContent = t;
      btn.disabled = isTaken;
      
      btn.addEventListener('click', async () => {
        if (!quickDateEl.value) {
          alert('Molimo izaberite datum.');
          return;
        }

        const confirmed = confirm(`Rezervisati termin:\nDatum: ${quickDateEl.value}\nVrijeme: ${t}\n\nOva rezervacija će biti automatski odobrena.`);
        if (!confirmed) return;

        try {
          const payload = {
            ime_prezime: 'Admin Rezervacija',
            datum: quickDateEl.value,
            vrijeme: t,
            trajanje_min: SLOT_STEP_MIN,
            ime_zivotinje: 'N/A',
            vrsta_zivotinje: 'N/A',
            napomena: 'Brza rezervacija - admin',
            adresa: 'N/A',
            telefon: 'N/A',
            parking: null,
            males: null,
            females: null,
            leash: null,
            runaway: null,
            fears: null,
            mobility: null,
            vaccinated: null
          };

          const r = await fetch(`${API}/rezervacija`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders()
            },
            body: JSON.stringify(payload)
          });

          if (!r.ok) {
            const j = await r.json().catch(() => ({ error: 'Greška' }));
            throw new Error(j.error || 'Greška pri slanju zahtjeva.');
          }

          const createdRes = await r.json();
          
          // Auto-approve the reservation
          const approveR = await fetch(`${API}/rezervacije/${createdRes.id}/approve`, {
            method: 'PUT',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' }
          });

          if (!approveR.ok) {
            throw new Error('Rezervacija kreirana ali nije odobrena automatski.');
          }

          window.toast?.success?.('✅ Termin uspješno rezervisan!');
          
          // Refresh calendar and slots
          if (quickDateEl.value) {
            quickDateEl.dispatchEvent(new Event('change'));
          }
          renderQuickCalendar(quickCurrentMonth.year, quickCurrentMonth.month);

        } catch (e) {
          console.error(e);
          alert('Greška pri rezervaciji: ' + e.message);
        }
      });
      
      quickSlotsEl.appendChild(btn);
    });
  }

  // Render calendar
  function renderQuickCalendar(year, month) {
    if (!quickCalGrid || !quickCalTitle) return;
    
    const first = firstDayOfMonth(year, month);
    const last = lastDayOfMonth(year, month);
    
    try {
      quickCalTitle.textContent = first.toLocaleDateString('bs-BA', { month: 'long', year: 'numeric' });
    } catch (e) {
      quickCalTitle.textContent = year + '-' + (month + 1);
    }

    const from = yyyyMMDD(first);
    const to = yyyyMMDD(last);

    fetchAvailabilityRange(from, to)
      .then(data => {
        const weekStart = (first.getDay() || 7) - 1;
        const totalDays = last.getDate();
        quickCalGrid.innerHTML = '';

        for (let i = 0; i < weekStart; i++) {
          const empty = document.createElement('div');
          empty.className = 'day disabled';
          empty.textContent = '';
          quickCalGrid.appendChild(empty);
        }

        const totalSlots = data.settings.totalSlots;

        for (let day = 1; day <= totalDays; day++) {
          (function (dayIdx) {
            const d = new Date(year, month, dayIdx);
            const key = yyyyMMDD(d);
            const info = data.days[key] || { takenTimes: [], fullyBooked: false };
            const cell = document.createElement('div');
            
            let statusClass = 'free';
            if (info.fullyBooked) statusClass = 'full';
            else if (info.takenTimes.length > 0 && info.takenTimes.length < totalSlots) statusClass = 'partial';
            
            cell.className = 'day ' + statusClass;
            cell.textContent = String(dayIdx);
            
            cell.addEventListener('click', () => {
              if (statusClass === 'full') {
                alert('Ovaj dan je 100% zauzet.');
                return;
              }
              if (quickDateEl) {
                quickDateEl.value = key;
                quickDateEl.dispatchEvent(new Event('change'));
              }
              Array.prototype.slice.call(quickCalGrid.querySelectorAll('.day.selected'))
                .forEach(el => el.classList.remove('selected'));
              cell.classList.add('selected');
            });
            
            quickCalGrid.appendChild(cell);
          })(day);
        }
      })
      .catch(e => {
        console.error(e);
        quickCalGrid.innerHTML = '<div style="grid-column:1/-1;color:#c00">Greška pri učitavanju kalendara.</div>';
      });
  }

  // Month navigation
  if (quickPrevBtn) {
    quickPrevBtn.addEventListener('click', () => {
      quickCurrentMonth.month -= 1;
      if (quickCurrentMonth.month < 0) { 
        quickCurrentMonth.month = 11; 
        quickCurrentMonth.year -= 1; 
      }
      renderQuickCalendar(quickCurrentMonth.year, quickCurrentMonth.month);
    });
  }

  if (quickNextBtn) {
    quickNextBtn.addEventListener('click', () => {
      quickCurrentMonth.month += 1;
      if (quickCurrentMonth.month > 11) { 
        quickCurrentMonth.month = 0; 
        quickCurrentMonth.year += 1; 
      }
      renderQuickCalendar(quickCurrentMonth.year, quickCurrentMonth.month);
    });
  }

  // Date change handler
  if (quickDateEl) {
    quickDateEl.addEventListener('change', () => {
      const date = quickDateEl.value;
      if (!date) return;
      
      fetchAvailability(date)
        .then(data => {
          const allSlots = makeSlots(WORK_FROM, WORK_TO, SLOT_STEP_MIN);
          renderQuickSlots(allSlots, data.takenTimes || []);
        })
        .catch(e => {
          console.error(e);
          alert('Nešto je pošlo po zlu pri dohvaćanju zauzeća.');
        });
    });
  }

  // Initial render
  renderQuickCalendar(quickCurrentMonth.year, quickCurrentMonth.month);
}
