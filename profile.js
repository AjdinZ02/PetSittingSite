const API = '';

// Sigurni toast
const _toastFallback = {
  warn:   (m) => console.warn(m),
  error:  (m) => console.error(m),
  info:   (m) => console.log(m),
  success:(m) => console.log(m),
};
const toast = (() => {
  const t = (typeof window !== "undefined" && window.toast) ? window.toast : {};
  return {
    warn:    t.warn    || _toastFallback.warn,
    error:   t.error   || _toastFallback.error,
    info:    t.info    || _toastFallback.info,
    success: t.success || _toastFallback.success,
  };
})();

function safeJSON(res) { return res.json().catch(() => null); }

async function loadProfile() {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('Morate biti prijavljeni da vidite profil.');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }

    // Dohvati podatke o korisniku
    const response = await fetch(`${API}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        toast.error('Sesija je istekla. Molimo prijavite se ponovo.');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
      }
      throw new Error('Greška pri učitavanju profila');
    }

    const userData = await response.json();

    // Popuni podatke
    document.getElementById('profile-fullname').textContent = userData.fullname || '-';
    document.getElementById('profile-username').textContent = userData.username || '-';
    document.getElementById('profile-email').textContent = userData.email || '-';
    document.getElementById('profile-phone').textContent = userData.phone || '-';
    document.getElementById('profile-address').textContent = userData.address || '-';

  } catch (error) {
    console.error('Error loading profile:', error);
    toast.error('Greška pri učitavanju profila.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
});
