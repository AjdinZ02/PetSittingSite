
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
    body.innerHTML = '<tr><td colspan="13" style="padding:10px;">Nema rezervacija.</td></tr>';
    return;
  }

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${formatDate(r.datum)}</td>
      <td>${r.vrijeme ?? ''}</td>
      <td>${r.kraj ?? ''}</td>
      <td>${r.trajanje_min}</td>
      <td>${r.ime_prezime}</td>
      <td>${r.ime_zivotinje}</td>
      <td>${r.vrsta_zivotinje}</td>
      <td>${r.adresa ?? ''}</td>
      <td>${r.telefon ?? ''}</td>
      <td>${r.napomena ?? ''}</td>
      <td><span class="admin-pill">${r.status}</span></td>
      <td class="admin-actions">
        <button class="btn btn-approve" data-id="${r.id}" ${r.status==='approved' ? 'disabled' : ''}>Odobri</button>
        <button class="btn btn-reject"  data-id="${r.id}" ${r.status==='rejected' ? 'disabled' : ''}>Odbij</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

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

    const data = await r.json();
    showDebug({ rows: Array.isArray(data) ? data.length : 0 });
    renderTable(data);
    window.toast?.success?.('Rezervacije učitane.');
  } catch (e) {
    console.error(e);
    renderError('Greška u mreži. Provjerite da backend radi na http://localhost:3000.');
    showDebug(String(e));
  }
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
});
