
// reviews.js — render i CRUD za recenzije, sa i18n hookovima
const API = 'http://localhost:3000';
const token = localStorage.getItem('auth_token');
const userStr = localStorage.getItem('auth_user');
const user = userStr ? JSON.parse(userStr) : null;

const ratingEl = document.getElementById('rev-rating');
const contentEl = document.getElementById('rev-content');
const submitBtn = document.getElementById('rev-submit');
const listEl = document.getElementById('reviews-list');

// Pseće šape rating (1–5)
(function initPawRating() {
  const pawWrap = document.getElementById('paw-rating');
  if (!pawWrap) return;
  const paws = Array.from(pawWrap.querySelectorAll('.paw'));
  function renderSelected(val) {
    const n = Number(val) || 0;
    paws.forEach((btn) => {
      const v = Number(btn.dataset.value);
      btn.classList.toggle('selected', v <= n);
    });
  }
  renderSelected(ratingEl?.value ?? 5);
  paws.forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = Number(btn.dataset.value);
      if (ratingEl) ratingEl.value = String(v);
      renderSelected(v);
    });
  });
})();

function authHeaders() {
  return token ? { Authorization: 'Bearer ' + token } : {};
}

// === i18n helpers ===
function T(k, fallback) {
  const pack = window.__i18n_reviews__;
  if (!pack) return fallback;
  const v = pack[k];
  if (typeof v === 'function') return v;
  return v ?? fallback;
}

// Render liste
function renderReviews(items) {
  listEl.innerHTML = '';
  items.forEach(r => {
    const wrap = document.createElement('div');
    wrap.className = 'card';

    const author = r.username ? r.username :
      (T('author_fallback', (id)=>'Korisnik #' + id)(r.user_id));

    wrap.innerHTML = `
      <div class="rating">
        ${author}
        <span class="stars">⭐ ${r.rating}</span>
      </div>
      <div class="content" style="margin-top:6px">${r.content}</div>
      <div class="muted" style="margin-top:6px">${T('added_at','Dodano')}: ${r.createdAt}</div>

      ${
        (user && user.id === r.user_id)
          ? `<div class="actions">
               <button class="btn" data-edit="${r.id}">${T('edit','Uredi')}</button>
               <button class="btn btn-danger" data-del="${r.id}">${T('del','Obriši')}</button>
             </div>`
          : (user && user.role === 'admin')
            ? `<div class="actions">
                 <button class="btn btn-danger" data-del="${r.id}">${T('only_admin_del','Obriši')}</button>
               </div>`
            : ``
      }
    `;
    listEl.appendChild(wrap);
  });

  // Edit/Delete handlers
  listEl.querySelectorAll('button[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit');
      const newRating = prompt('Nova ocjena (1–5):', '5'); // (po želji prevesti)
      if (!newRating) return;
      const newContent = prompt('Novi sadržaj:', '');
      if (!newContent) return;
      fetch(`${API}/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ rating: Number(newRating), content: newContent })
      })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok }) => {
        if (!ok) { toast.error(T('update_error','Greška pri ažuriranju.')); return; }
        toast.success(T('updated_ok','Recenzija ažurirana.'));
        loadReviews();
      });
    });
  });

  listEl.querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      if (!confirm('Obrisati recenziju?')) return; // (po želji prevesti)
      fetch(`${API}/reviews/${id}`, { method: 'DELETE', headers: { ...authHeaders() } })
        .then(r => r.json().then(j => ({ ok: r.ok, j })))
        .then(({ ok }) => {
          if (!ok) { toast.error(T('delete_error','Greška pri brisanju.')); return; }
          toast.success(T('deleted_ok','Recenzija obrisana.'));
          loadReviews();
        });
    });
  });
}

function loadReviews() {
  fetch(`${API}/reviews`)
    .then(r => r.json())
    .then(items => renderReviews(items))
    .catch(() => toast.error(T('fetch_error','Greška pri dohvaćanju recenzija.')));
}

if (submitBtn) {
  submitBtn.addEventListener('click', () => {
    if (!token) { toast.warn(T('must_login','Prijavite se da biste dodali recenziju.')); return; }
    const rating = Number(ratingEl.value);
    const content = contentEl.value.trim();
    if (!content || content.length < 3) { toast.warn(T('content_warn','Unesite sadržaj (min 3 znaka).')); return; }

    fetch(`${API}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ rating, content })
    })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok }) => {
        if (!ok) { toast.error(T('sent_error','Greška pri slanju.')); return; }
        toast.success(T('added_ok','Recenzija dodana.'));
        contentEl.value = '';
        loadReviews();
      });
  });
}

async function checkReviewEligibility() {
  if (!token) return false;
  try {
    const r = await fetch(`${API}/reviews/eligible`, { headers: { ...authHeaders() } });
    const d = await r.json();
    const eligible = !!d.eligible;
    const btn = document.getElementById('rev-submit');
    if (btn) {
      btn.disabled = !eligible;
      btn.style.opacity = eligible ? '1' : '0.6';
      btn.style.cursor = eligible ? 'pointer' : 'not-allowed';
    }
    if (!eligible) toast.warn(T('eligible_warn','Samo korisnici sa završenom rezervacijom mogu ostaviti recenziju.'));
    return eligible;
  } catch {
    return true;
  }
}

// i18n repaint hook (poziva ga i18n.js kad se promijeni jezik)
window.reviewsRerender = function() {
  loadReviews();
};

// init
checkReviewEligibility();
loadReviews();

// expose user global (ako želiš ga koristiti u templatu)
window.user = user;
