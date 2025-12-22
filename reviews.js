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


function authHeaders() { return token ? { Authorization: 'Bearer ' + token } : {}; }

function renderReviews(items) {
  listEl.innerHTML = '';
  items.forEach(r => {
    const wrap = document.createElement('div');
    wrap.className = 'card';
    const author = r.username ? r.username : ('Korisnik #' + r.user_id);
    wrap.innerHTML = `
      <div><strong>${author}</strong> <span>⭐ ${r.rating}</span></div>
      <p>${r.content}</p>
      <small>Dodano: ${r.createdAt}</small>
      ${user && user.id === r.user_id
        ? `<div style="margin-top:8px">
             <button class="btn secondary-btn" data-edit="${r.id}">Uredi</button>
             <button class="btn" data-del="${r.id}">Obriši</button>
           </div>`
        : user && user.role === 'admin'
        ? `<div style="margin-top:8px">
             <button class="btn" data-del="${r.id}">Obriši</button>
           </div>`
        : ``}
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
        if (!ok) {
          toast.error(j.error || 'Greška pri ažuriranju.');
          return;
        }
        toast.success('Recenzija ažurirana.');
        loadReviews();
      });
    });
  });

  listEl.querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      if (!confirm('Obrisati recenziju?')) return;

      fetch(`${API}/reviews/${id}`, { method: 'DELETE', headers: { ...authHeaders() } })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) {
          toast.error(j.error || 'Greška pri brisanju.');
          return;
        }
        toast.success('Recenzija obrisana.');
        loadReviews();
      });
    });
  });
}

function loadReviews() {
  fetch(`${API}/reviews`)
    .then(r => r.json())
    .then(items => renderReviews(items))
    .catch(() => toast.error('Greška pri dohvaćanju recenzija.'));
}

if (submitBtn) {
  submitBtn.addEventListener('click', () => {
    if (!token) {
      toast.warn('Prijavite se da biste dodali recenziju.');
      return;
    }
    const rating = Number(ratingEl.value);
    const content = contentEl.value.trim();
    if (!content || content.length < 3) {
      toast.warn('Unesite sadržaj (min 3 znaka).');
      return;
    }
    fetch(`${API}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ rating, content })
       })
    .then(r => r.json().then(j => ({ ok: r.ok, j })))
    .then(({ ok, j }) => {
      if (!ok) {
        toast.error(j.error || 'Greška pri slanju.');
        return;
      }
      toast.success('Recenzija dodana.');
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
    if (!eligible) toast.warn('Samo korisnici sa završenom rezervacijom mogu ostaviti recenziju.');
    return eligible;
  } catch {
    
    return true;
  }
}

checkReviewEligibility();
loadReviews();