
const API = 'http://localhost:3000';

// --- LOGIN ---
document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) return alert('Unesite korisničko ime i lozinku.');

  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const j = await r.json();
    if (!r.ok) return alert(j.error || 'Neuspješna prijava.');

    localStorage.setItem('auth_token', j.token);
    localStorage.setItem('auth_user', JSON.stringify(j.user));
    if (typeof applyNavAuthState === 'function') applyNavAuthState();

    alert(`Prijavljeni: ${j.user.username} (${j.user.role})`);
    if (j.user.role === 'admin') location.href = 'admin.html';
    else location.href = 'reviews.html';
  } catch (e) {
    alert('Greška pri prijavi.');
  }
});

// --- TOGGLE registracija box (koristi se samo na login.html) ---
const regLink = document.getElementById('register-link');
if (regLink) {
  regLink.addEventListener('click', (e) => {
    e.preventDefault();
    const box = document.getElementById('register-box');
    box.style.display = (box.style.display === 'none' || !box.style.display) ? 'block' : 'none';
  });
}

// --- REGISTRACIJA iz login stranice (embedded box) ---
const regBtn = document.getElementById('reg-btn');
if (regBtn) {
  regBtn.addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!username || !password || password.length < 6) return alert('Unesite korisničko ime i lozinku (min 6).');

    try {
      const r = await fetch(`${API}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const j = await r.json();
      if (!r.ok) return alert(j.error || 'Registracija nije uspjela.');

      alert('Nalog kreiran. Sada se možete prijaviti.');
      // ili auto-login kao u register.html – po želji
    } catch (e) {
      alert('Greška pri registraciji.');
    }
  });
}