
// admin.js

const API = ''; // isti origin (http://localhost:3000)
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
});
