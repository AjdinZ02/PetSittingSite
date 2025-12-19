
const API = 'http://localhost:3000';
const token = localStorage.getItem('auth_token');
const user = JSON.parse(localStorage.getItem('auth_user') || 'null');

const ratingEl = document.getElementById('rev-rating');
const contentEl = document.getElementById('rev-content');
const submitBtn = document.getElementById('rev-submit');
const listEl = document.getElementById('reviews-list');

function authHeaders() {
  return token ? { Authorization: 'Bearer ' + token } : {};
}

function renderReviews(items) {
  listEl.innerHTML = '';
  items.forEach(r => {
    const wrap = document.createElement('div');
    wrap.className = 'card';
    const author = r.username ? r.username : ('Korisnik #' + r.user_id);
    wrap.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong>${author}</strong>
        <span>⭐ ${r.rating}</span>
      </div>
      <p style="margin-top:8px">${r.content}</p>
      <small style="color:#666">Dodano: ${r.createdAt}</small>
      <div style="margin-top:10px; display:flex; gap:8px;">
        ${user && user.id === r.user_id ? `
          <button class="btn secondary-btn" data-edit="${r.id}">Uredi</button>
          <button class="btn" data-del="${r.id}">Obriši</button>
        ` : user && user.role === 'admin' ? `
          <button class="btn" data-del="${r.id}">Obriši</button>
        ` : ``}
      </div>
    `;
    listEl.appendChild(wrap);
  });

  // Edit/Delete handlers
  listEl.querySelectorAll('button[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit');
      const newRating = prompt('Nova ocjena (1–5):', '5');
      if (!newRating) return;
      const newContent = prompt('Novi sadržaj:', '');
      if (!newContent) return;
      fetch(`${API}/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ rating: Number(newRating), content: newContent })
      })
        .then(r => r.json().then(j => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (!ok) return alert(j.error || 'Greška pri ažuriranju.');
          loadReviews();
        });
    });
  });

  listEl.querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      if (!confirm('Obrisati recenziju?')) return;
      fetch(`${API}/reviews/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders() }
      })
        .then(r => r.json().then(j => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (!ok) return alert(j.error || 'Greška pri brisanju.');
          loadReviews();
        });
    });
  });
}

function loadReviews() {
  fetch(`${API}/reviews`)
    .then(r => r.json())
    .then(items => renderReviews(items))
    .catch(() => alert('Greška pri dohvaćanju recenzija.'));
}

submitBtn.addEventListener('click', () => {
  if (!token) return alert('Prijavite se da biste dodali recenziju.');
  const rating = Number(ratingEl.value);
  const content = contentEl.value.trim();
  if (!content || content.length < 3) return alert('Unesite sadržaj (min 3 znaka).');

  fetch(`${API}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ rating, content })
  })
    .then(r => r.json().then(j => ({ ok: r.ok, j })))
    .then(({ ok, j }) => {
      if (!ok) return alert(j.error || 'Greška pri slanju.');
      contentEl.value = '';
      loadReviews();
    });
});

// Init
loadReviews();
``
