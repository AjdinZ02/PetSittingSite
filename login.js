
// login.js
const API = '';

document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) {
    toast.warn('Unesite korisničko ime i lozinku.');
    return;
  }

  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const j = await r.json();
       if (!r.ok) {
      toast.error(j.error || 'Neuspješna prijava.');
      return;
    }

    localStorage.setItem('auth_token', j.token);
    localStorage.setItem('auth_user', JSON.stringify(j.user));
    toast.success(`Prijavljeni: ${j.user.username} (${j.user.role})`);
    location.href = (j.user.role === 'admin') ? 'admin.html' : 'reservation.html';
  } catch (e) {
    console.error(e);
    toast.error('Greška pri prijavi.');
  }
});