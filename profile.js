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

function getToken() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    toast.error('Morate biti prijavljeni.');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return null;
  }
  return token;
}

async function loadProfile() {
  try {
    const token = getToken();
    if (!token) return;

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

async function loadPets() {
  try {
    const token = getToken();
    if (!token) return;

    const response = await fetch(`${API}/pet-profiles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Greška pri učitavanju životinja');
    }

    const pets = await response.json();
    displayPets(pets);

  } catch (error) {
    console.error('Error loading pets:', error);
    toast.error('Greška pri učitavanju životinja.');
  }
}

function displayPets(pets) {
  const container = document.getElementById('petsList');
  
  if (!pets || pets.length === 0) {
    container.innerHTML = '<p style="color: #999; font-style: italic;">Nemate dodanih životinja.</p>';
    return;
  }

  container.innerHTML = pets.map(pet => `
    <div style="padding: 16px; background: white; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0 0 8px 0; color: #333;">${escapeHtml(pet.pet_name)}</h4>
          <p style="margin: 0; color: #666;"><strong>Vrsta:</strong> ${escapeHtml(pet.pet_type)}</p>
          ${pet.notes ? `<p style="margin: 8px 0 0 0; color: #666;"><strong>Napomene:</strong> ${escapeHtml(pet.notes)}</p>` : ''}
        </div>
        <button onclick="deletePet('${escapeHtml(pet.pet_name)}', '${escapeHtml(pet.pet_type)}')" 
                style="padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
          Obriši
        </button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function addPet(petData) {
  try {
    const token = getToken();
    if (!token) return;

    const response = await fetch(`${API}/pet-profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(petData)
    });

    if (!response.ok) {
      const error = await safeJSON(response);
      throw new Error(error?.error || 'Greška pri dodavanju životinje');
    }

    toast.success('Životinja je uspješno dodana!');
    loadPets();
    
    // Reset forma
    document.getElementById('addPetForm').reset();
    document.getElementById('petFormContainer').style.display = 'none';

  } catch (error) {
    console.error('Error adding pet:', error);
    toast.error(error.message);
  }
}

async function deletePet(petName, petType) {
  if (!confirm(`Da li ste sigurni da želite obrisati ${petName}?`)) {
    return;
  }

  try {
    const token = getToken();
    if (!token) return;

    const response = await fetch(`${API}/pet-profiles/${encodeURIComponent(petName)}/${encodeURIComponent(petType)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Greška pri brisanju životinje');
    }

    toast.success('Životinja je obrisana.');
    loadPets();

  } catch (error) {
    console.error('Error deleting pet:', error);
    toast.error('Greška pri brisanju životinje.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadPets();

  // Toggle forma za dodavanje životinje
  const toggleBtn = document.getElementById('togglePetFormBtn');
  const formContainer = document.getElementById('petFormContainer');
  const cancelBtn = document.getElementById('cancelPetBtn');

  toggleBtn.addEventListener('click', () => {
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
  });

  cancelBtn.addEventListener('click', () => {
    formContainer.style.display = 'none';
    document.getElementById('addPetForm').reset();
  });

  // Submit forma za dodavanje životinje
  document.getElementById('addPetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const petData = {
      petName: document.getElementById('pet-name').value.trim(),
      petType: document.getElementById('pet-type').value,
      notes: document.getElementById('pet-notes').value.trim()
    };

    if (!petData.petName || !petData.petType) {
      toast.warn('Ime i vrsta životinje su obavezni.');
      return;
    }

    addPet(petData);
  });
});

// Globalna funkcija za brisanje (poziva se iz HTML-a)
window.deletePet = deletePet;
