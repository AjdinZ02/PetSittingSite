// Logo refresh 
const logo = document.querySelector('.logo');
if (logo) {
  logo.style.cursor = 'pointer';
  logo.addEventListener('click', () => {
    window.location.reload();
  });
}

//  Hamburger 
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navLinks) navLinks.classList.toggle('active');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('active')) {
      // Check if click is outside both hamburger and navLinks
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        navLinks.classList.remove('active');
      }
    }
  });
  
  // Close menu when clicking on a nav link
  if (navLinks) {
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
}

//Auth helperi 
var AUTH_TOKEN_KEY = 'auth_token';
var AUTH_USER_KEY = 'auth_user';

function getAuth() {
  try {
    var t = localStorage.getItem(AUTH_TOKEN_KEY);
    var u = localStorage.getItem(AUTH_USER_KEY);
    return (t && u) ? { token: t, user: JSON.parse(u) } : null;
  } catch (e) { return null; }
}

function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

// Pet profile helpers 
function savePetProfile(petName, petType, petData) {
  var auth = getAuth();
  if (!auth || !auth.token) {
    console.error('Cannot save pet profile: user not authenticated');
    return Promise.resolve(false);
  }

  return fetch(api('/pet-profiles'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + auth.token
    },
    body: JSON.stringify({
      petName: petName,
      petType: petType,
      address: petData.address,
      phone: petData.phone,
      notes: petData.notes,
      parking: petData.parking,
      males: petData.males,
      females: petData.females,
      leash: petData.leash,
      runaway: petData.runaway,
      fears: petData.fears,
      mobility: petData.mobility,
      vaccinated: petData.vaccinated
    })
  })
  .then(function(r) {
    if (!r.ok) throw new Error('Failed to save pet profile');
    return r.json();
  })
  .then(function() {
    return true;
  })
  .catch(function(e) {
    console.error('Error saving pet profile:', e);
    return false;
  });
}

function loadPetProfile(petName, petType) {
  var auth = getAuth();
  if (!auth || !auth.token) {
    console.error('Cannot load pet profile: user not authenticated');
    return Promise.resolve(null);
  }

  return fetch(api('/pet-profiles/' + encodeURIComponent(petName) + '/' + encodeURIComponent(petType)), {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + auth.token
    }
  })
  .then(function(r) {
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('Failed to load pet profile');
    return r.json();
  })
  .catch(function(e) {
    console.error('Error loading pet profile:', e);
    return null;
  });
}

function applyNavAuthState() {
  var auth = getAuth();
  var navLogin = document.getElementById('navLogin');
  var navLogout = document.getElementById('navLogout');
  var navAdmin = document.getElementById('navAdmin');
  var navUser = document.getElementById('navUser');
  var navUsername = document.getElementById('navUsername');
  if (!navLogin || !navLogout) return;

  if (auth) {
    navLogin.style.display = 'none';
    navLogout.style.display = 'inline-block';
    if (navAdmin) navAdmin.style.display = (auth.user.role === 'admin') ? 'inline-block' : 'none';
    if (navUser) {
      navUser.style.display = 'inline-block';
      if (navUsername) navUsername.textContent = auth.user.username;
    }
  } else {
    navLogin.style.display = 'inline-block';
    navLogout.style.display = 'none';
    if (navAdmin) navAdmin.style.display = 'none';
    if (navUser) navUser.style.display = 'none';
    if (navUsername) navUsername.textContent = 'Guest';
  }
}

function wireLogout() {
  var navLogout = document.getElementById('navLogout');
  if (!navLogout) return;
  navLogout.addEventListener('click', function (e) {
    e.preventDefault();
    var auth = getAuth();
    if (!auth) { applyNavAuthState(); return; }
    fetch('/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + auth.token }
    })
      .catch(function () { /* ignore */ })
      .finally(function () {
        clearAuth();
        applyNavAuthState();
        if (location.pathname.endsWith('admin.html')) location.href = 'index.html';
      });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  applyNavAuthState();
  wireLogout();
});

// API helper
function api(path) { return (path.charAt(0) === '/' ? path : '/' + path); }

//  Kalendar/rezervacije 
var SLOT_STEP_MIN = 60;
var WORK_FROM = '08:00';
var WORK_TO = '22:00';

var dateEl     = document.getElementById('res-date');
var slotsEl    = document.getElementById('time-slots');
var timeEl     = document.getElementById('res-time');
var nameEl     = document.getElementById('res-name');
var petTypeEl  = document.getElementById('res-pet-type');
var petNameEl  = document.getElementById('res-pet-name');
var notesEl    = document.getElementById('res-notes');
var submitBtn  = document.getElementById('submit-res');
var addressEl  = document.getElementById('res-address');
var phoneEl    = document.getElementById('res-phone');

var calGrid    = document.getElementById('cal-grid');
var calTitle   = document.getElementById('cal-title');
var prevMonthBtn = document.getElementById('prev-month');
var nextMonthBtn = document.getElementById('next-month');

var selectedTime = null;
var currentMonth = (function () {
  var d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() }; // 0–11
})();

// Helpers
function toMinutes(hhmm) {
  var parts = String(hhmm).split(':');
  var h = Number(parts[0]);
  var m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}
function formatHHMM(mins) {
  var h = String(Math.floor(mins / 60));
  var m = String(mins % 60);
  if (h.length < 2) h = '0' + h;
  if (m.length < 2) m = '0' + m;
  return h + ':' + m;
}
function makeSlots(startHHMM, endHHMM, stepMin) {
  var res = [];
  var start = toMinutes(startHHMM);
  var end = toMinutes(endHHMM);
  for (var s = start; s + stepMin <= end; s += stepMin) {
    res.push(formatHHMM(s));
  }
  return res;
}
function firstDayOfMonth(year, month) { return new Date(year, month, 1); }
function lastDayOfMonth(year, month) { return new Date(year, month + 1, 0); }
function yyyyMMDD(dateObj) {
  var y = dateObj.getFullYear();
  var m = String(dateObj.getMonth() + 1); if (m.length < 2) m = '0' + m;
  var d = String(dateObj.getDate());      if (d.length < 2) d = '0' + d;
  return y + '-' + m + '-' + d;
}

// API
function fetchAvailability(date) {
  return fetch(api('/availability?date=' + encodeURIComponent(date)))
    .then(function (r) {
      if (!r.ok) throw new Error('Greška pri dohvaćanju dostupnosti.');
      return r.json();
    });
}
function fetchAvailabilityRange(from, to) {
  return fetch(api('/availability/range?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to)))
    .then(function (r) {
      if (!r.ok) throw new Error('Greška pri dohvaćanju kalendarske dostupnosti.');
      return r.json();
    });
}

// Slots render
function renderSlots(allSlots, takenTimes) {
  if (!slotsEl) return;
  slotsEl.innerHTML = '';
  selectedTime = null;
  if (timeEl) timeEl.value = '';
  allSlots.forEach(function (t) {
    var isTaken = takenTimes.indexOf(t) !== -1;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot ' + (isTaken ? 'taken' : 'free');
    btn.textContent = t;
    btn.disabled = isTaken;
    btn.addEventListener('click', function () {
      Array.prototype.slice.call(slotsEl.querySelectorAll('.slot.selected'))
        .forEach(function (el) { el.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedTime = t;
      if (timeEl) timeEl.value = t;
      if (dateEl) dateEl.dispatchEvent(new Event('input'));
    });
    slotsEl.appendChild(btn);
  });
}

// Kalendar render
function renderCalendar(year, month) {
  if (!calGrid || !calTitle) return;
  var first = firstDayOfMonth(year, month);
  var last = lastDayOfMonth(year, month);
  try {
    calTitle.textContent = first.toLocaleDateString('bs-BA', { month: 'long', year: 'numeric' });
  } catch (e) {
    calTitle.textContent = year + '-' + (month + 1);
  }
  var from = yyyyMMDD(first);
  var to   = yyyyMMDD(last);
  fetchAvailabilityRange(from, to)
    .then(function (data) {
      var weekStart = (first.getDay() || 7) - 1; // 0=pon
      var totalDays = last.getDate();
      calGrid.innerHTML = '';
      for (var i = 0; i < weekStart; i++) {
        var empty = document.createElement('div');
        empty.className = 'day disabled';
        empty.textContent = '';
        calGrid.appendChild(empty);
      }
      var totalSlots = data.settings.totalSlots;
      for (var day = 1; day <= totalDays; day++) {
        (function (dayIdx) {
          var d = new Date(year, month, dayIdx);
          var key = yyyyMMDD(d);
          var info = data.days[key] || { takenTimes: [], fullyBooked: false };
          var cell = document.createElement('div');
          var statusClass = 'free';
          if (info.fullyBooked) statusClass = 'full';
          else if (info.takenTimes.length > 0 && info.takenTimes.length < totalSlots) statusClass = 'partial';
          cell.className = 'day ' + statusClass;
          cell.textContent = String(dayIdx);
          cell.addEventListener('click', function () {
            if (statusClass === 'full') {
              alert('Ovaj dan je 100% zauzet.');
              return;
            }
            if (dateEl) {
              dateEl.value = key;
              dateEl.dispatchEvent(new Event('change'));
            }
            Array.prototype.slice.call(calGrid.querySelectorAll('.day.selected'))
              .forEach(function (el) { el.classList.remove('selected'); });
            cell.classList.add('selected');
          });
          calGrid.appendChild(cell);
        })(day);
      }
    })
    .catch(function (e) {
      console.error(e);
      calGrid.innerHTML = '<div style="grid-column:1/-1;color:#c00">Greška pri učitavanju kalendara.</div>';
    });
}

// Navigacija mjeseca
if (prevMonthBtn) {
  prevMonthBtn.addEventListener('click', function () {
    currentMonth.month -= 1;
    if (currentMonth.month < 0) { currentMonth.month = 11; currentMonth.year -= 1; }
    renderCalendar(currentMonth.year, currentMonth.month);
  });
}
if (nextMonthBtn) {
  nextMonthBtn.addEventListener('click', function () {
    currentMonth.month += 1;
    if (currentMonth.month > 11) { currentMonth.month = 0; currentMonth.year += 1; }
    renderCalendar(currentMonth.year, currentMonth.month);
  });
}

// Reakcija na promjenu datuma: učitaj slotove
if (dateEl) {
  dateEl.addEventListener('change', function () {
    var date = dateEl.value;
    if (!date) return;
    fetchAvailability(date)
      .then(function (data) {
        var allSlots = makeSlots(WORK_FROM, WORK_TO, SLOT_STEP_MIN);
        renderSlots(allSlots, data.takenTimes || []);
      })
      .catch(function (e) {
        console.error(e);
        alert('Nešto je pošlo po zlu pri dohvaćanju zauzeća.');
      });
  });
}

// Auto-fill pet data when name and type are entered
function setupPetAutoFill() {
  if (!petNameEl || !petTypeEl) return;
  
  var autoFillPetData = function() {
    var auth = getAuth();
    if (!auth || !auth.user) return;
    
    var petName = petNameEl.value.trim();
    var petType = petTypeEl.value;
    
    if (!petName || !petType) return;
    
    // Load from server 
    loadPetProfile(petName, petType).then(function(profile) {
      if (profile) {
        // Show indicator that data was found
        if (window.toast && toast.info) {
          toast.info('📋 Podaci za ' + profile.pet_name + ' su učitani iz prethodne rezervacije.');
        }
        
        // Fill in the fields
        if (addressEl && profile.address) addressEl.value = profile.address;
        if (phoneEl && profile.phone) phoneEl.value = profile.phone;
        if (notesEl && profile.notes) notesEl.value = profile.notes;
        
        // Fill radio buttons
        if (profile.parking) {
          var parkingRadio = document.querySelector('input[name="parking"][value="' + profile.parking + '"]');
          if (parkingRadio) parkingRadio.checked = true;
        }
        if (profile.males) {
          var malesRadio = document.querySelector('input[name="males"][value="' + profile.males + '"]');
          if (malesRadio) malesRadio.checked = true;
        }
        if (profile.females) {
          var femalesRadio = document.querySelector('input[name="females"][value="' + profile.females + '"]');
          if (femalesRadio) femalesRadio.checked = true;
        }
        if (profile.leash) {
          var leashRadio = document.querySelector('input[name="leash"][value="' + profile.leash + '"]');
          if (leashRadio) leashRadio.checked = true;
        }
        if (profile.runaway) {
          var runawayRadio = document.querySelector('input[name="runaway"][value="' + profile.runaway + '"]');
          if (runawayRadio) runawayRadio.checked = true;
        }
        if (profile.fears) {
          var fearsRadio = document.querySelector('input[name="fears"][value="' + profile.fears + '"]');
          if (fearsRadio) fearsRadio.checked = true;
        }
        if (profile.mobility) {
          var mobilityRadio = document.querySelector('input[name="mobility"][value="' + profile.mobility + '"]');
          if (mobilityRadio) mobilityRadio.checked = true;
        }
        if (profile.vaccinated) {
          var vaccinatedRadio = document.querySelector('input[name="vaccinated"][value="' + profile.vaccinated + '"]');
          if (vaccinatedRadio) vaccinatedRadio.checked = true;
        }
      }
    }).catch(function(e) {
      console.error('Error auto-filling pet data:', e);
    });
  };
  
  // Add event listeners
  petNameEl.addEventListener('blur', autoFillPetData);
  petTypeEl.addEventListener('change', autoFillPetData);
}

// Load user profile and pets for auto-fill
function loadUserProfileAndPets() {
  var auth = getAuth();
  if (!auth || !auth.token) return;

  // Load user profile
  fetch(api('/auth/profile'), {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + auth.token }
  })
  .then(function(r) {
    if (!r.ok) throw new Error('Failed to load profile');
    return r.json();
  })
  .then(function(userData) {
    // Auto-fill user data
    if (nameEl && userData.fullname) nameEl.value = userData.fullname;
    if (addressEl && userData.address) addressEl.value = userData.address;
    if (phoneEl && userData.phone) phoneEl.value = userData.phone;
  })
  .catch(function(e) {
    console.error('Error loading user profile:', e);
  });

  // Load user's pets
  fetch(api('/pet-profiles'), {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + auth.token }
  })
  .then(function(r) {
    if (!r.ok) throw new Error('Failed to load pets');
    return r.json();
  })
  .then(function(pets) {
    if (pets && pets.length > 0) {
      displayUserPets(pets);
    }
  })
  .catch(function(e) {
    console.error('Error loading pets:', e);
  });
}

function displayUserPets(pets) {
  var section = document.getElementById('profile-pets-section');
  var list = document.getElementById('profile-pets-list');
  
  if (!section || !list || !pets || pets.length === 0) return;
  
  section.style.display = 'block';
  
  list.innerHTML = pets.map(function(pet, index) {
    return '<label style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 6px; cursor: pointer;">' +
      '<input type="checkbox" class="pet-checkbox" data-pet-index="' + index + '" ' +
      'data-pet-name="' + escapeHtml(pet.pet_name) + '" ' +
      'data-pet-type="' + escapeHtml(pet.pet_type) + '" ' +
      'style="cursor: pointer;">' +
      '<span style="font-weight: 500;">' + escapeHtml(pet.pet_name) + '</span>' +
      '<span style="color: #666;">(' + escapeHtml(pet.pet_type) + ')</span>' +
      '</label>';
  }).join('');
  
  // Store pets data globally
  window.userPets = pets;
  
  // Add event listeners to checkboxes
  var checkboxes = list.querySelectorAll('.pet-checkbox');
  checkboxes.forEach(function(cb) {
    cb.addEventListener('change', handlePetSelection);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function handlePetSelection() {
  var checkboxes = document.querySelectorAll('.pet-checkbox:checked');
  
  if (checkboxes.length === 0) return;
  
  // Get selected pets
  var selectedPets = [];
  checkboxes.forEach(function(cb) {
    var index = parseInt(cb.getAttribute('data-pet-index'));
    if (window.userPets && window.userPets[index]) {
      selectedPets.push(window.userPets[index]);
    }
  });
  
  if (selectedPets.length === 0) return;
  
  // If single pet selected, fill in the form
  if (selectedPets.length === 1) {
    var pet = selectedPets[0];
    if (petNameEl) petNameEl.value = pet.pet_name;
    if (petTypeEl) {
      // Map pet type to form values
      var typeMap = { 'Pas': 'Dog', 'Mačka': 'Cat', 'Ostalo': 'Other' };
      petTypeEl.value = typeMap[pet.pet_type] || 'Dog';
    }
    if (notesEl && pet.notes) notesEl.value = pet.notes;
    
    // Fill radio buttons from pet profile
    fillRadioButtons(pet);
  } else {
    // Multiple pets - create combined pet name and fill common data
    var petNames = selectedPets.map(function(p) { return p.pet_name; }).join(', ');
    if (petNameEl) petNameEl.value = petNames;
    
    // Check if all are same type
    var allSameType = selectedPets.every(function(p) { return p.pet_type === selectedPets[0].pet_type; });
    if (allSameType && petTypeEl) {
      var typeMap = { 'Pas': 'Dog', 'Mačka': 'Cat', 'Ostalo': 'Other' };
      petTypeEl.value = typeMap[selectedPets[0].pet_type] || 'Dog';
    }
    
    // Fill radio buttons based on all selected pets
    fillRadioButtonsMultiple(selectedPets);
  }
}

function fillRadioButtons(pet) {
  if (pet.parking) {
    var parkingRadio = document.querySelector('input[name="parking"][value="' + pet.parking + '"]');
    if (parkingRadio) parkingRadio.checked = true;
  }
  
  // Only fill dog-specific questions if it's a dog
  if (pet.pet_type === 'Pas') {
    if (pet.males) {
      var malesRadio = document.querySelector('input[name="males"][value="' + pet.males + '"]');
      if (malesRadio) malesRadio.checked = true;
    }
    if (pet.females) {
      var femalesRadio = document.querySelector('input[name="females"][value="' + pet.females + '"]');
      if (femalesRadio) femalesRadio.checked = true;
    }
    if (pet.leash) {
      var leashRadio = document.querySelector('input[name="leash"][value="' + pet.leash + '"]');
      if (leashRadio) leashRadio.checked = true;
    }
    if (pet.runaway) {
      var runawayRadio = document.querySelector('input[name="runaway"][value="' + pet.runaway + '"]');
      if (runawayRadio) runawayRadio.checked = true;
    }
    if (pet.fears) {
      var fearsRadio = document.querySelector('input[name="fears"][value="' + pet.fears + '"]');
      if (fearsRadio) fearsRadio.checked = true;
    }
    if (pet.mobility) {
      var mobilityRadio = document.querySelector('input[name="mobility"][value="' + pet.mobility + '"]');
      if (mobilityRadio) mobilityRadio.checked = true;
    }
    if (pet.vaccinated) {
      var vaccinatedRadio = document.querySelector('input[name="vaccinated"][value="' + pet.vaccinated + '"]');
      if (vaccinatedRadio) vaccinatedRadio.checked = true;
    }
  }
}

function fillRadioButtonsMultiple(pets) {
  // Check if any pet has parking info (use first one that has it)
  var parkingPet = pets.find(function(p) { return p.parking; });
  if (parkingPet && parkingPet.parking) {
    var parkingRadio = document.querySelector('input[name="parking"][value="' + parkingPet.parking + '"]');
    if (parkingRadio) parkingRadio.checked = true;
  }
  
  // Check if we have any dogs in selection
  var hasDog = pets.some(function(p) { return p.pet_type === 'Pas'; });
  
  if (hasDog) {
    // Use data from first dog
    var firstDog = pets.find(function(p) { return p.pet_type === 'Pas'; });
    if (firstDog) {
      fillRadioButtons(firstDog);
    }
  }
}

// Initialize auto-fill on page load
if (petNameEl && petTypeEl) {
  setupPetAutoFill();
  
  // Load user profile and pets when page loads
  document.addEventListener('DOMContentLoaded', function() {
    loadUserProfileAndPets();
  });
}

// Submit rezervacije 
if (submitBtn) {
  submitBtn.addEventListener('click', function () {
    // Provjera prijave
    var auth = getAuth();
    if (!auth || !auth.token) {
      alert('Morate biti prijavljeni da biste rezervisali termin. Molimo prijavite se.');
      window.location.href = 'login.html';
      return;
    }

    var payload = {
      ime_prezime: (nameEl && nameEl.value ? nameEl.value.trim() : ''),
      datum: (dateEl && dateEl.value ? dateEl.value : ''),
      vrijeme: (selectedTime != null ? selectedTime : (timeEl && timeEl.value ? timeEl.value : '')),
      trajanje_min: SLOT_STEP_MIN, // 60 min
      ime_zivotinje: (petNameEl && petNameEl.value ? petNameEl.value.trim() : ''),
      vrsta_zivotinje: (petTypeEl && petTypeEl.value ? petTypeEl.value : ''),
      napomena: (notesEl && notesEl.value ? notesEl.value.trim() : ''),
      adresa: (addressEl && addressEl.value ? addressEl.value.trim() : ''),
      telefon: (phoneEl && phoneEl.value ? phoneEl.value.trim() : ''),
      parking: document.querySelector('input[name="parking"]:checked')?.value || null,
      males: document.querySelector('input[name="males"]:checked')?.value || null,
      females: document.querySelector('input[name="females"]:checked')?.value || null,
      leash: document.querySelector('input[name="leash"]:checked')?.value || null,
      runaway: document.querySelector('input[name="runaway"]:checked')?.value || null,
      fears: document.querySelector('input[name="fears"]:checked')?.value || null,
      mobility: document.querySelector('input[name="mobility"]:checked')?.value || null,
      vaccinated: document.querySelector('input[name="vaccinated"]:checked')?.value || null
    };

    if (!payload.datum || !payload.vrijeme) {
      alert('Molimo izaberite datum i slobodan termin.');
      return;
    }
    if (!payload.ime_prezime || !payload.ime_zivotinje || !payload.vrsta_zivotinje) {
      alert('Molimo popunite obavezna polja (ime, vrsta i ime ljubimca).');
      return;
    }
    if (!payload.adresa || payload.adresa.length < 5) {
      alert('Unesite adresu (min 5 znakova).');
      return;
    }
    var phoneRe = /^[+]?[\d\s\-()]{7,15}$/;
    if (!payload.telefon || !phoneRe.test(payload.telefon)) {
      alert('Unesite validan broj telefona (npr. +387 61 123 456).');
      return;
    }

    fetch(api('/rezervacija'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + auth.token
      },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok)
          return r.json().catch(function () { return { error: 'Greška' }; })
            .then(function (j) { throw new Error(j.error || 'Greška pri slanju zahtjeva.'); });
        return r.json();
      })
      .then(function () {
        // Save pet profile for future use 
        if (payload.ime_zivotinje && payload.vrsta_zivotinje) {
          savePetProfile(payload.ime_zivotinje, payload.vrsta_zivotinje, {
            address: payload.adresa,
            phone: payload.telefon,
            notes: payload.napomena,
            parking: payload.parking,
            males: payload.males,
            females: payload.females,
            leash: payload.leash,
            runaway: payload.runaway,
            fears: payload.fears,
            mobility: payload.mobility,
            vaccinated: payload.vaccinated
          }).catch(function(e) {
            console.error('Failed to save pet profile:', e);
            // Don't fail the whole reservation if pet profile save fails
          });
        }
        
        if (window.toast && toast.success) {
          toast.success('✅ Zahtjev poslan. Bićete obaviješteni nakon odobrenja.');
        } else {
          alert('Zahtjev poslan. Bićete obaviješteni nakon odobrenja.');
        }
        selectedTime = null;
        if (timeEl) timeEl.value = '';
        if (nameEl) nameEl.value = '';
        if (petNameEl) petNameEl.value = '';
        if (notesEl) notesEl.value = '';
        if (addressEl) addressEl.value = '';
        if (phoneEl) phoneEl.value = '';
        setTimeout(function () { window.location.href = 'index.html'; }, 600);
      })
      .catch(function (e) {
        console.error(e);
        alert('Nešto je pošlo po zlu pri slanju zahtjeva.');
      });
  });
}

// Inicijalizacija
(function init() {
  if (calGrid && calTitle) {
    renderCalendar(currentMonth.year, currentMonth.month);
  }
  
  // Gallery tab functionality
  initGallery();
})();

// Gallery Tab Functionality 
function initGallery() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const galleryGrid = document.querySelector('.gallery-grid');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  
  if (galleryItems.length === 0) return;
  
  let currentIndex = 0;
  let itemsPerView = getItemsPerView();
  
  // Calculate how many items visible based on screen width
  function getItemsPerView() {
    const width = window.innerWidth;
    if (width <= 480) return 1;
    if (width <= 768) return 2;
    if (width <= 1024) return 3;
    return 4;
  }
  
  // Update carousel position
  function updateCarousel() {
    if (!galleryGrid) return;
    
    const visibleItems = Array.from(galleryItems).filter(item => !item.classList.contains('hidden'));
    const maxIndex = Math.max(0, visibleItems.length - itemsPerView);
    
    // Clamp current index
    currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
    
    // Calculate item width + gap
    const itemWidth = visibleItems.length > 0 ? visibleItems[0].offsetWidth : 320;
    const gap = 24; 
    const offset = currentIndex * (itemWidth + gap);
    
    galleryGrid.style.transform = `translateX(-${offset}px)`;
    
    // Update button states
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
  }
  
  // Navigation buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      currentIndex++;
      updateCarousel();
    });
  }
  
  // Handle window resize
  window.addEventListener('resize', function() {
    const newItemsPerView = getItemsPerView();
    if (newItemsPerView !== itemsPerView) {
      itemsPerView = newItemsPerView;
      currentIndex = 0;
      updateCarousel();
    }
  });
  
  // Add click handlers to gallery images for lightbox
  galleryItems.forEach(function(item) {
    const img = item.querySelector('img');
    if (img) {
      item.addEventListener('click', function() {
        openLightbox(img.src, img.alt);
      });
      item.style.cursor = 'pointer';
    }
  });
  
  // Initial carousel setup
  updateCarousel();
}

//  Lightbox Functions 
function openLightbox(src, alt) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (lightbox && lightboxImg) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close lightbox on click outside image
if (document.getElementById('lightbox')) {
  document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) {
      closeLightbox();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });
}
