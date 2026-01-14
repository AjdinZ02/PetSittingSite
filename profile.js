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
        <div style="flex: 1;">
          <h4 style="margin: 0 0 8px 0; color: #333;">${escapeHtml(pet.pet_name)}</h4>
          <p style="margin: 0; color: #666;"><strong>Vrsta:</strong> ${escapeHtml(pet.pet_type)}</p>
          ${pet.notes ? `<p style="margin: 8px 0 0 0; color: #666;"><strong>Napomene:</strong> ${escapeHtml(pet.notes)}</p>` : ''}
          ${pet.parking ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 14px;"><strong>Parking:</strong> ${pet.parking === 'yes' ? 'Da' : 'Ne'}</p>` : ''}
          ${pet.pet_type === 'Pas' && pet.males ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 14px;"><strong>Slaže se sa mužjacima:</strong> ${pet.males === 'yes' ? 'Da' : 'Ne'}</p>` : ''}
          ${pet.pet_type === 'Pas' && pet.females ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 14px;"><strong>Slaže se sa ženkama:</strong> ${pet.females === 'yes' ? 'Da' : 'Ne'}</p>` : ''}
          ${pet.pet_type === 'Pas' && pet.vaccinated ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 14px;"><strong>Vakcinisan:</strong> ${pet.vaccinated === 'yes' ? 'Da' : 'Ne'}</p>` : ''}
        </div>
        <button onclick="deletePet('${escapeHtml(pet.pet_name)}', '${escapeHtml(pet.pet_type)}')" 
                style="padding: 3px 8px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
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
    
    // Reset forma i sakrij dodatna pitanja
    document.getElementById('addPetForm').reset();
    document.getElementById('petFormContainer').style.display = 'none';
    document.getElementById('additionalQuestions').style.display = 'none';
    document.getElementById('dogQuestions').style.display = 'none';

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
  const petTypeSelect = document.getElementById('pet-type');
  const additionalQuestions = document.getElementById('additionalQuestions');
  const dogQuestions = document.getElementById('dogQuestions');

  toggleBtn.addEventListener('click', () => {
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
  });

  cancelBtn.addEventListener('click', () => {
    formContainer.style.display = 'none';
    document.getElementById('addPetForm').reset();
    additionalQuestions.style.display = 'none';
    dogQuestions.style.display = 'none';
  });

  // Prikaži/sakrij pitanja na osnovu vrste životinje
  petTypeSelect.addEventListener('change', (e) => {
    const petType = e.target.value;
    
    if (petType) {
      additionalQuestions.style.display = 'block';
      
      if (petType === 'Pas') {
        dogQuestions.style.display = 'block';
        // Učini sva pitanja za psa obaveznim
        dogQuestions.querySelectorAll('input[type="radio"]').forEach(input => {
          input.required = true;
        });
      } else {
        dogQuestions.style.display = 'none';
        // Ukloni obaveznost za pitanja psa
        dogQuestions.querySelectorAll('input[type="radio"]').forEach(input => {
          input.required = false;
          input.checked = false;
        });
      }
    } else {
      additionalQuestions.style.display = 'none';
      dogQuestions.style.display = 'none';
    }
  });

  // Submit forma za dodavanje životinje
  document.getElementById('addPetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const petType = document.getElementById('pet-type').value;
    const petData = {
      petName: document.getElementById('pet-name').value.trim(),
      petType: petType,
      notes: document.getElementById('pet-notes').value.trim(),
      parking: document.querySelector('input[name="parking"]:checked')?.value || ''
    };

    if (!petData.petName || !petData.petType) {
      toast.warn('Ime i vrsta životinje su obavezni.');
      return;
    }

    // Ako je pas, dodaj dodatna pitanja
    if (petType === 'Pas') {
      petData.males = document.querySelector('input[name="males"]:checked')?.value || '';
      petData.females = document.querySelector('input[name="females"]:checked')?.value || '';
      petData.leash = document.querySelector('input[name="leash"]:checked')?.value || '';
      petData.runaway = document.querySelector('input[name="runaway"]:checked')?.value || '';
      petData.fears = document.querySelector('input[name="fears"]:checked')?.value || '';
      petData.mobility = document.querySelector('input[name="mobility"]:checked')?.value || '';
      petData.vaccinated = document.querySelector('input[name="vaccinated"]:checked')?.value || '';

      // Provjeri da li su sva pitanja odgovorena
      if (!petData.males || !petData.females || !petData.leash || !petData.runaway || 
          !petData.fears || !petData.mobility || !petData.vaccinated) {
        toast.warn('Molimo odgovorite na sva pitanja za pse.');
        return;
      }
    }

    if (!petData.parking) {
      toast.warn('Molimo odgovorite na pitanje o parkingu.');
      return;
    }

    addPet(petData);
  });
});

// Globalna funkcija za brisanje (poziva se iz HTML-a)
window.deletePet = deletePet;
