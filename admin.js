
// admin.js
const API = 'http://localhost:3000';

// --- helpers ---
function byId(id) { return document.getElementById(id); }
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
function renderTable(rows) {
  const body = byId('rezBody');
  if (!body) return;
  body.innerHTML = '';

  if (!rows || rows.length === 0) {
    body.innerHTML = '<tr><td colspan="9" class="muted">Nema rezervacija.</td></tr>';
    return;
  }

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="ID">${r.id}</td>
      <td data-label="Datum">${r.datum}</td>
      <td data-label="Početak">${r.vrijeme ?? ''}</td>
      <td data-label="Kraj">${r.kraj ?? ''}</td>
      <td data-label="Trajanje (min)">${r.trajanje_min}</td>
      <td data-label="Ime i prezime">${r.ime_prezime}</td>
      <td data-label="Životinja">${r.ime_zivotinje}</td>
      <td data-label="Vrsta">${r.vrsta_zivotinje}</td>
      <td data-label="Napomena">${r.napomena ?? ''}</td>
    `;
    body.appendChild(tr);
  });
}

// --- main ---
async function loadReservations() {
  const token   = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  const user    = userStr ? JSON.parse(userStr) : null;

  showDebug({ tokenExists: !!token, user });

  if (!token || !user) {
    renderError('Niste prijavljeni. Molimo ulogujte se.');
    location.href = 'login.html';
    return;
  }
  if (user.role !== 'admin') {
    renderError('Pristup samo za admin.');
    location.href = 'index.html';
    return;
  }

  try {
    const r = await fetch(`${API}/rezervacije`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    showDebug({ status: r.status, ok: r.ok, url: r.url });

    if (r.status === 401) {
      renderError('Sesija istekla ili nevažeća (401). Prijavite se ponovo.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setTimeout(() => location.href = 'login.html', 800);
      return;
    }
    if (r.status === 403) {
      renderError('Nedovoljna ovlaštenja (403).');
      setTimeout(() => location.href = 'index.html', 1200);
      return;
    }
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      renderError(j.error || 'Greška pri učitavanju rezervacija.');
      return;
    }

    const data = await r.json();
    showDebug({ rows: Array.isArray(data) ? data.length : 0 });
    renderTable(data);
  } catch (e) {
    console.error(e);
    renderError('Greška u mreži. Provjerite da backend radi na http://localhost:3000.');
    showDebug(String(e));
  }
}

// ✅ jedini event-listener: pozovi kad se DOM// ✅ jedini event-listener: pozovi kad se DOM učita
document.addEventListener('DOMContentLoaded', () => {
  loadReservations();
});