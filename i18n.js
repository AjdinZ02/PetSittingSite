(function () {
  const LANG_KEY = 'lang';

  const DICT = {
    bs: {
      logo: 'Šetnja pasa | Kućne posjete',
      nav: {
        home:'Početna', about:'O nama', services:'Usluge', pricing:'Cjenovnik', gallery:'Galerija', contact:'Kontakt',
        reserve:'Rezervacija', reviews:'Recenzije', login:'Prijava', logout:'Odjava', admin:'Admin'
      },
      index: {
        hero_title:'Sretan ljubimac\n        =\nsretan vlasnik',
        hero_sub:'Pouzdane šetnje. Pažljiva briga. Bez stresa. Vaš ljubimac je sretan i aktivan dok ste zauzeti ili odsutni.',
        learn_more:'Rezervacija',
        hero_home_visits:'Kućna posjeta',
        hero_pet_walking:'Šetnja',
        about_h2: 'O nama',
        about_p: 'Mi smo Lejla i Mia, studentice i dugogodišnje vlasnice pasa, koje su svoju ljubav prema životinjama pretvorile u profesionalnu i pouzdanu uslugu za kućne ljubimce u Sarajevu. Obje imamo vlastite pse, ptice i gmizavce, svakodnevno radimo sa različitim pasminama i temperamentima, uključujući i radne pse, te posjedujemo osnovna znanja iz dresure i ponašanja pasa. Razumijemo potrebe pasa, njihove navike, signale i granice, što nam omogućava sigurno, smireno i odgovorno rukovanje u svakoj situaciji. Pružamo usluge šetnje pasa i kućnih obilazaka za kućne ljubimce, a povjerenje koje nam klijenti ukazuju shvatamo izuzetno ozbiljno. Upravo zbog toga sarađujemo s brojnim ambasadama u Sarajevu te smo prošle sigurnosnu provjeru što potvrđuje da smo odobrene za rad s diplomatskim institucijama. Naš rad je zasnovan na znanju, iskustvu i odgovornosti, ali i na iskrenoj posvećenosti i ljubavi prema životinjama.',
        services_h2:'Naše usluge',
        price_note: 'Cijena šetnje/posjete je 20KM',
        price_variable: 'Cijena može varirati u zavisnosti od više faktora, kao što su udaljenost, poslušnost psa, posebni zahtjevi i dodatne usluge.',
        price_weekend: 'Zbog prilagođenog rasporeda rada, usluge vikendom i praznicima se naplaćuju više.',
        
        pricing_h2: 'Cjenovnik',
        pricing_walk_title: 'Šetnja psa (30 min.)',
        pricing_walk_desc: 'Cijena za jednog psa',
        pricing_visit_title: 'Kućna posjeta',
        pricing_visit_price: 'Po dogovoru',
        pricing_visit_desc: 'U ovisnosti koliko traje',
        pricing_monthly_title: 'Mjesečne usluge',
        pricing_monthly_price: 'Prilagođeno',
        pricing_monthly_desc: 'Javite nam se za individualne cijene',
        pricing_weekend_title: 'Vikendi i praznici',
        pricing_weekend_price: 'Viša cijena',
        pricing_weekend_desc: 'Prilagođen raspored rada',
        pricing_evening_title: 'Večernje šetnje',
        pricing_evening_desc: 'Večernje šetnje se naplaćuju 5 KM više jer radimo tokom cijelog dana, a večernji termin je jedini period koji izdvajamo iz svog slobodnog vremena kako bismo vašim ljubimcima pružili istu pažnju, sigurnost i kvalitet usluge.',
        pricing_note_title: 'Napomena',
        pricing_note_desc: 'Konačna cijena može varirati u zavisnosti od više faktora, uključujući udaljenost, poslušnost psa, posebne zahtjeve i dodatne usluge.',
        
        services_cards: {
          walk_h3: 'Grupne šetnje',
          walk_p: 'Savršena prilika za zabavu i druženje gdje vaš pas može uživati u društvu novih četveronožnih prijatelja. Naše šetnje pružaju socijalizaciju i fizičku aktivnost, što pomaže psima da postanu sretni i uravnoteženi ljubimci u sigurnom i kontrolisanom okruženju. Kroz igru i druženje u sigurnoj grupi, gradimo zdrave navike i veselu narav vašeg ljubimca. Trajanje: 30 minuta.',
          sit_h3: 'Individualne šetnje',
          sit_p: 'Svjesni smo da svaki pas ima jedinstven karakter i naše individualne šetnje su posebno prilagođene onima koji se ne osjećaju prijatno u blizini drugih pasa. Prilagođavamo se tempu vašeg psa, izbjegavamo trigere i učinimo svaki izlazak napolje pozitivnim iskustvom. Trajanje: 30 minuta.',
          dropin_h3: 'Kućne posjete',
          dropin_p: 'Znamo da je dom tamo gdje se vaš pas, mačka, papagaj ili drugi kućni ljubimac osjeća najsigurnije. Naše kućne posjete su osmišljene da ljubimcima pruže sve neophodno dok ste vi odsutni - od svježe vode i obroka, do igranja i maženja. Ovo je savršena opcija za ljubimce koji ne vole promjenu okruženja, starije pse ili mačke koji uživaju u miru svog prostora. Idealna je za osobe koje putuju, jer ljubimcima omogućava da ostanu u svom domu i očuvaju svoju svakodnevnu rutinu. Trajanje: po dogovoru (15min. - par sati).',
        },

        contact_h2:'Kontakt',
        contact_p1:'Možete nas kontaktirati putem instagrama',
        contact_instagram_label:'Instagram :',
        contact_instagram_handle:'@setnja_pasa_sarajevo',
        contact_p5:'Radno vrijeme: fleksibilno prema potrebama klijenata',
        cta_h2:'Spremni za rezervaciju?',
        cta_p:'Osigurajte svoj termin na vrijeme za neku od naših usluga.',
        cta_btn:'Rezervacija',
        footer_copy:'© 2025 Petsittingapp. Sva prava zadržana.',
        instagram:'Instagram'
      },

      reservation: {
        back:'← Nazad na početnu',
        title:'Rezervišite termin',
        sub:'Odaberite datum, recite nam više o ljubimcu i pošaljite zahtjev. Rezervacija postaje važeća tek nakon našeg odobrenja.',
        legend_full:'Zauzeto (100%)', legend_free:'Slobodno', legend_partial:'Djelimično zauzeto',
        profile_pets_title:'Vaše životinje',
        profile_pets_sub:'Izaberite životinje za ovu rezervaciju:',
        pets_auto_fill:'Podaci o izabranim životinjama će biti automatski popunjeni',
        pet_type_label:'Vrsta životinje',
        pet_number_type: function(num, petName) { return 'Vrsta životinje ' + num + ' (' + petName + ')'; },
        labels:{
          date:'Datum',
          service:'Vrsta usluge',
          name:'Ime i prezime',
          address:'Adresa',
          phone:'Telefon',
          phone_hint:'Dozvoljeni su brojevi, razmaci, crtice i zagrade (npr. +387 61 123 456).',
          pet_type:'Vrsta životinje',
          pet_name:'Ime životinje',
          pet_name_hint:'💡 Ako ste već rezervisali termin za ovu životinju, podaci će se automatski popuniti.',
          notes:'Posebna napomena',
          additional_info:'Dodatne informacije',
          parking:'Da li postoji parking u blizini adrese?',
          males:'Da li se pas slaže sa drugim mužjacima?',
          females:'Da li se pas slaže sa drugim ženkama?',
          leash:'Da li je naviknut na povodac?',
          runaway:'Da li pas ima tendenciju da bježi ili se otima sa povodca?',
          fears:'Da li pas ima strahove (zvukovi, djeca, vozila)?',
          mobility:'Da li pas ima ograničenja u kretanju?',
          vaccinated:'Da li je pas redovno vakcinisan?',
          yes:'Da',
          no:'Ne'
        },
        options:{ walk:'Šetnja pasa', visit:'Kućna posjeta', dog:'Pas', cat:'Mačka', other:'Drugo' },
        send:'Pošalji zahtjev',
        weekdays:['Pon','Uto','Sri','Čet','Pet','Sub','Ned'],
        months:['januar','februar','mart','april','maj','juni','juli','august','septembar','oktobar','novembar','decembar']
      },

      reviews: {
        back: '← Nazad na početnu',
        title: 'Recenzije',
        sub: 'Prijavite se za dodavanje/uređivanje.',
        description: 'Podijelite svoje iskustvo - vaša ocjena i komentar pomažu drugima i nama da rastemo',
        form_title: 'Nova recenzija',
        rating: 'Ocjena',
        rating_legend: '1 🐾 = nezadovoljan | 5 🐾 = odličan',
        content: 'Sadržaj',
        placeholder: 'Napišite dojmove...',
        submit: 'Pošalji recenziju',
        eligible_hint: 'Napomena: recenzije mogu ostaviti korisnici sa završenom rezervacijom.',
        list_title: 'Sve recenzije',
        author_fallback: id => `Korisnik #${id}`,
        added_at: 'Dodano',
        edit: 'Uredi',
        del: 'Obriši',
        only_admin_del: 'Obriši',
        must_login: 'Prijavite se da biste dodali recenziju.',
        fetch_error: 'Greška pri dohvaćanju recenzija.',
        update_error: 'Greška pri ažuriranju.',
        delete_error: 'Greška pri brisanju.',
        sent_error: 'Greška pri slanju.',
        updated_ok: 'Recenzija ažurirana.',
        deleted_ok: 'Recenzija obrisana.',
        added_ok: 'Recenzija dodana.',
        eligible_warn: 'Samo korisnici sa završenom rezervacijom mogu ostaviti recenziju.',
        content_warn: 'Unesite sadržaj (min 3 znaka).',
      },

      profile: {
        title: 'Moj profil',
        sub: 'Vaši korisnički podaci',
        fullname: 'Ime i prezime',
        email: 'Email adresa',
        phone: 'Broj telefona',
        address: 'Adresa',
        my_pets: 'Moje životinje',
        add_pet: '+ Dodaj životinju',
        add_new_pet: 'Dodaj novu životinju',
        pet_name: 'Ime životinje',
        pet_type: 'Vrsta životinje',
        pet_type_label: 'Vrsta',
        select: 'Izaberite...',
        notes: 'Napomene',
        notes_label: 'Napomene',
        additional_info: 'Dodatne informacije',
        save: 'Sačuvaj',
        cancel: 'Odustani',
        back_home: 'Nazad na početnu',
        yes: 'Da',
        no: 'Ne',
        dog: 'Pas',
        cat: 'Mačka',
        other: 'Ostalo',
        parking: 'Da li postoji parking u blizini adrese?',
        parking_label: 'Parking',
        males: 'Da li se pas slaže sa drugim mužjacima?',
        males_label: 'Slaže se sa mužjacima',
        females: 'Da li se pas slaže sa drugim ženkama?',
        females_label: 'Slaže se sa ženkama',
        leash: 'Da li je pas naviknut na povodac?',
        leash_label: 'Naviknut na povodac',
        runaway: 'Da li pas ima tendenciju da bježi ili se otima sa povodca?',
        runaway_label: 'Tendencija da bježi',
        fears: 'Da li pas ima strahove (zvukovi, djeca, vozila)?',
        fears_label: 'Strahovi',
        mobility: 'Da li pas ima ograničenja u kretanju?',
        mobility_label: 'Ograničenja u kretanju',
        vaccinated: 'Da li je pas redovno vakcinisan?',
        vaccinated_label: 'Vakcinisan',
        edit: 'Izmijeni',
        delete: 'Obriši',
        edit_pet: 'Uredi životinju',
        update: 'Ažuriraj'
      },
    },

    en: {
      logo: 'Dog walking | House visits',
      nav: {
        home:'Home', about:'About', services:'Services', pricing:'Pricing', gallery:'Gallery', contact:'Contact',
        reserve:'Reserve', reviews:'Reviews', login:'Login', logout:'Logout', admin:'Admin'
      },
      index: {
        hero_title:'Happy pet\n     =\nhappy owner',
        hero_sub:'Reliable walks. Loving care. Stress-free service. We keep your pet happy and active while you’re busy or away.',
        learn_more:'Reserve',        
        hero_home_visits:'Home Visits',
        hero_pet_walking:'Pet Walking',
        about_h2: 'About Us',
        about_p: 'We are Lejla and Mia, students and long-time dog owners who have turned our love for animals into a professional and reliable pet care service in Sarajevo.We both have our own dogs, birds and reptiles  and work daily with different breeds and temperaments, including working dogs. We also have basic knowledge of dog training and canine behavior. We understand dogs’ needs, routines, signals, and boundaries, which allows us to handle every situation safely, calmly, and responsibly.We provide dog walking and home visit services for pets, and we take the trust our clients place in us very seriously. For this reason, we cooperate with several embassies in Sarajevo and have successfully passed security clearance, confirming that we are approved to work with diplomatic institutions.Our work is based on knowledge, experience, and responsibility, as well as genuine dedication and love for animals.',
        services_h2:'Our Services',
        price_note: 'The price for walking/visit services is 20KM',
        price_variable: 'The price may vary depending on several factors, such as distance, dog obedience, special requirements and additional services.',
        price_weekend: 'Due to adjusted work schedule, services on weekends and holidays are charged more.',
        
        pricing_h2: 'Price List',
        pricing_walk_title: 'Dog Walking (30 min.)',
        pricing_walk_desc: 'Price for one dog',
        pricing_visit_title: 'Home Visit',
        pricing_visit_price: 'By arrangement',
        pricing_visit_desc: 'Depending on duration',
        pricing_monthly_title: 'Monthly Services',
        pricing_monthly_price: 'Customized',
        pricing_monthly_desc: 'Contact us for customized pricing',
        pricing_weekend_title: 'Weekends & Holidays',
        pricing_weekend_price: 'Higher rate',
        pricing_weekend_desc: 'Adjusted work schedule',
        pricing_evening_title: 'Evening Walks',
        pricing_evening_desc: 'Evening walks are charged 5 KM extra because we work throughout the day, and the evening slot is the only period we dedicate from our free time to provide your pets with the same attention, safety, and quality of service.',
        pricing_note_title: 'Note',
        pricing_note_desc: 'The final price may vary depending on several factors, including distance, dog obedience, special requirements, and additional services.',
        
        services_cards: {
          walk_h3: 'Group Walks',
          walk_p: 'A perfect opportunity for fun and socialization, where your dog can enjoy the company of new four-legged friends. Our group walks provide both social interaction and physical activity, helping dogs become happy and well-balanced companions in a safe and controlled environment. Through play and positive interaction in a small, supervised group, we build healthy habits and a cheerful spirit for your pet. Duration: 30 minutes.',
          sit_h3: 'Individual Walks',
          sit_p: 'We understand that every dog has a unique personality. Our individual walks are specially designed for dogs who may not feel comfortable around other dogs. We adapt to your dogs pace, avoid known triggers, and make every outdoor experience calm, positive, and enjoyable. Duration: 30 minutes.',
          dropin_h3: 'Home Visits',
          dropin_p: 'We know that home is where your dog, cat, parrot or other pet feels the safest. Our home visit service is designed to provide everything your pet needs while you are away — from fresh water, playtime, and cuddles. This is an ideal option for pets who dont like changes in their environment, senior dogs, or cats who enjoy the peace and comfort of their own space. It is perfect for people who travel, as it allows pets to stay in their home and maintain their daily routine. Duration: by arrangement (15min. - a few hours).',
        },

        contact_h2:'Contact Us',
        contact_p1:'You can contact us via instagram',
        contact_instagram_label:'Instagram :',
        contact_instagram_handle:'@setnja_pasa_sarajevo',
        contact_p5:'Working hours: Flexible according to customer needs',
        cta_h2:'Ready for a reservation?',
        cta_p:'Secure your spot in advance for one of our services.',
        cta_btn:'Reserve',
        footer_copy:'© 2025 Petsittingapp. All rights reserved.',
        instagram:'Instagram'
      },

      reservation: {
        back:'← Back to Home',
        title:'Reserve your appointment',
        sub:'Select a date, tell us more about your pet and send us a request. The reservation becomes valid only after our approval.',
        legend_full:'Fully booked (100%)', legend_free:'Available', legend_partial:'Partially booked',
        profile_pets_title:'Your Pets',
        profile_pets_sub:'Select pets for this reservation:',
        pets_auto_fill:'Data for selected pets will be automatically filled',
        pet_type_label:'Pet type',
        pet_number_type: function(num, petName) { return 'Pet ' + num + ' type (' + petName + ')'; },
        labels:{
          date:'Date',
          service:'Service type',
          name:'Name and surname',
          address:'Address',
          phone:'Phone',
          phone_hint:'Numbers, spaces, dashes and brackets are allowed (e.g. +387 61 123 456).',
          pet_type:'Pet type',
          pet_name:'Pet name',
          pet_name_hint:'💡 If you have already reserved an appointment for this pet, the data will be auto-filled.',
          notes:'Special notes',
          additional_info:'Additional Information',
          parking:'Is there parking near the address?',
          males:'Does the dog get along with other males?',
          females:'Does the dog get along with other females?',
          leash:'Is the dog used to a leash?',
          runaway:'Does the dog tend to run away or pull on the leash?',
          fears:'Does the dog have fears (sounds, children, vehicles)?',
          mobility:'Does the dog have mobility restrictions?',
          vaccinated:'Is the dog regularly vaccinated?',
          yes:'Yes',
          no:'No'
        },
        options:{ walk:'Pet Walking', visit:'Home Visit', dog:'Dog', cat:'Cat', other:'Other' },
        send:'Send request',
        weekdays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        months:['january','february','march','april','may','june','july','august','september','october','november','december']
      },

      reviews: {
        back: '← Back to Home',
        title: 'Reviews',
        sub: 'Sign in to add/edit your review.',
        description: 'Share your experience - your rating and feedback help others and help us grow',
        form_title: 'New review',
        rating: 'Rating',
        rating_legend: '1 🐾 = dissatisfied | 5 🐾 = excellent',
        content: 'Content',
        placeholder: 'Write your experience...',
        submit: 'Submit review',
        eligible_hint: 'Note: only users with a completed reservation can leave a review.',
        list_title: 'All reviews',
        author_fallback: id => `User #${id}`,
        added_at: 'Added',
        edit: 'Edit',
        del: 'Delete',
        only_admin_del: 'Delete',
        must_login: 'Please sign in to leave a review.',
        fetch_error: 'Failed to fetch reviews.',
        update_error: 'Update failed.',
        delete_error: 'Delete failed.',
        sent_error: 'Submit failed.',
        updated_ok: 'Review updated.',
        deleted_ok: 'Review deleted.',
        added_ok: 'Review added.',
        eligible_warn: 'Only users with a completed reservation can leave a review.',
        content_warn: 'Enter content (min 3 characters).',
      },

      profile: {
        title: 'My Profile',
        sub: 'Your user information',
        fullname: 'Full name',
        email: 'Email address',
        phone: 'Phone number',
        address: 'Address',
        my_pets: 'My Pets',
        add_pet: '+ Add Pet',
        add_new_pet: 'Add New Pet',
        pet_name: 'Pet name',
        pet_type: 'Pet type',
        pet_type_label: 'Type',
        select: 'Select...',
        notes: 'Notes',
        notes_label: 'Notes',
        additional_info: 'Additional Information',
        save: 'Save',
        cancel: 'Cancel',
        back_home: 'Back to Home',
        yes: 'Yes',
        no: 'No',
        dog: 'Dog',
        cat: 'Cat',
        other: 'Other',
        parking: 'Is there parking near the address?',
        parking_label: 'Parking',
        males: 'Does the dog get along with other males?',
        males_label: 'Gets along with males',
        females: 'Does the dog get along with other females?',
        females_label: 'Gets along with females',
        leash: 'Is the dog used to a leash?',
        leash_label: 'Used to leash',
        runaway: 'Does the dog tend to run away or pull on the leash?',
        runaway_label: 'Tendency to run away',
        fears: 'Does the dog have fears (sounds, children, vehicles)?',
        fears_label: 'Fears',
        mobility: 'Does the dog have mobility restrictions?',
        mobility_label: 'Mobility restrictions',
        vaccinated: 'Is the dog regularly vaccinated?',
        vaccinated_label: 'Vaccinated',
        edit: 'Edit',
        delete: 'Delete',
        edit_pet: 'Edit Pet',
        update: 'Update'
      },
    }
  };

  // --- helpers ---
  const qs = (sel) => document.querySelector(sel);
  const setText = (sel, text) => { const el = qs(sel); if (el && typeof text === 'string') el.textContent = text; };
  const setAttr = (sel, attr, text) => { const el = qs(sel); if (el && typeof text === 'string') el.setAttribute(attr, text); };

  function applyIndex(lang) {
    const t = DICT[lang];
    // logo
    setText('.logo', t.logo);
    // nav
    setText('a[href="#home"]', t.nav.home);
    setText('a[href="#about"]', t.nav.about);
    setText('a[href="#services"]', t.nav.services);
    setText('a[href="#pricing"]', t.nav.pricing);
    setText('a[href="#gallery"]', t.nav.gallery);
    setText('a[href="#contact"]', t.nav.contact);
    setText('a[href="reservation.html"]', t.nav.reserve);
    setText('a[href="reviews.html"]', t.nav.reviews);
    setText('#navLogin', t.nav.login);
    setText('#navLogout', t.nav.logout);
    setText('#navAdmin', t.nav.admin);

    // hero
    const heroH1 = qs('#home .hero-text h1');
    if (heroH1) {
      heroH1.textContent = t.index.hero_title;
      heroH1.style.whiteSpace = 'pre-line';
      heroH1.style.textAlign = 'center';
    }
    setText('#home .hero-text p', t.index.hero_sub);
    setText('#home .hero-text .btn', t.index.learn_more);
    setText('#hero-home-visits', t.index.hero_home_visits);
    setText('#hero-pet-walking', t.index.hero_pet_walking);

    // ABOUT
    setText('#about h2', t.index.about_h2);
    setText('#about p', t.index.about_p);

    // SERVICES — naslov + 3 kartice
    setText('#services h2', t.index.services_h2);
    const serviceCards = document.querySelectorAll('#services .service-cards .card');
    if (serviceCards.length >= 3) {
      // 1) Walk
      const walkH3 = serviceCards[0].querySelector('h3');
      const walkP  = serviceCards[0].querySelector('p');
      if (walkH3) walkH3.textContent = t.index.services_cards.walk_h3;
      if (walkP)  walkP.textContent  = t.index.services_cards.walk_p;

      // 2) Sitting
      const sitH3 = serviceCards[1].querySelector('h3');
      const sitP  = serviceCards[1].querySelector('p');
      if (sitH3) sitH3.textContent = t.index.services_cards.sit_h3;
      if (sitP)  sitP.textContent  = t.index.services_cards.sit_p;

      // 3) Drop-In
      const dropH3 = serviceCards[2].querySelector('h3');
      const dropP  = serviceCards[2].querySelector('p');
      if (dropH3) dropH3.textContent = t.index.services_cards.dropin_h3;
      if (dropP)  dropP.textContent  = t.index.services_cards.dropin_p;
    }

    // Price notes
    setText('#price-note', t.index.price_note);
    setText('#price-variable', t.index.price_variable);
    setText('#price-weekend', t.index.price_weekend);

    // PRICING section
    const pricingH2 = document.querySelector('#pricing h2');
    if (pricingH2) pricingH2.textContent = t.index.pricing_h2;
    
    // Apply i18n to all elements with data-i18n attribute in pricing section
    document.querySelectorAll('#pricing [data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const keys = key.split('.');
      let value = t;
      for (let k of keys) {
        if (value && value[k] !== undefined) value = value[k];
        else { value = null; break; }
      }
      if (value && typeof value === 'string') {
        el.textContent = value;
      }
    });

    // CONTACT
    setText('#contact h2', t.index.contact_h2);
    const contactPs = document.querySelectorAll('#contact p');
    if (contactPs[0]) contactPs[0].textContent = t.index.contact_p1;
    // Instagram link
    if (contactPs[1]) {
      const instagramLink = contactPs[1].querySelector('a');
      contactPs[1].childNodes[0].textContent = t.index.contact_instagram_label;
      if (instagramLink) instagramLink.textContent = t.index.contact_instagram_handle;
    }
    if (contactPs[2]) contactPs[2].textContent = t.index.contact_p5;

    // CTA + footer
    setText('#cta h2', t.index.cta_h2);
    setText('#cta p', t.index.cta_p);
    setText('#cta .btn', t.index.cta_btn);
    setText('footer p', t.index.footer_copy);
    setText('footer .socials a[href*="instagram.com"]', t.index.instagram);
  }

  function applyReservation(lang) {
    const t = DICT[lang].reservation;
    setText('.back-link', t.back);
    setText('.reservation-hero h1', t.title);
    setText('.reservation-hero p', t.sub);
    // legenda
    const legend = document.querySelector('.cal-legend');
    if (legend) {
      legend.innerHTML =
        `<span class="legend-square full"></span> ${t.legend_full}
         <span class="legend-square free" style="margin-left:16px;"></span> ${t.legend_free}
         <span class="legend-square partial" style="margin-left:16px;"></span> ${t.legend_partial}`;
    }
    // labele i hint
    setText('label[for="res-date"]', t.labels.date);
    setText('label[for="res-service"]', t.labels.service);
    setText('label[for="res-name"]', t.labels.name);
    setText('label[for="res-address"]', t.labels.address);
    setText('label[for="res-phone"]', t.labels.phone);
    const hint = document.querySelector('.reservation-form small');
    if (hint) hint.textContent = t.labels.phone_hint;
    setText('label[for="res-pet-type"]', t.labels.pet_type);
    setText('label[for="res-pet-name"]', t.labels.pet_name);
    
    // Pet name hint 
    const petNameInput = document.getElementById('res-pet-name');
    if (petNameInput) {
      const petNameHint = petNameInput.nextElementSibling;
      if (petNameHint && petNameHint.tagName === 'SMALL') {
        petNameHint.textContent = t.labels.pet_name_hint;
      }
    }
    
    setText('label[for="res-notes"]', t.labels.notes);
    
    // opcije
    setText('#res-service option[value="Pet Walking"]', t.options.walk);
    setText('#res-service option[value="Home Visit"]', t.options.visit);
    setText('#res-pet-type option[value="Dog"]', t.options.dog);
    setText('#res-pet-type option[value="Cat"]', t.options.cat);
    setText('#res-pet-type option[value="Other"]', t.options.other);
    // dugme
    setText('#submit-res', t.send);
    // dani u sedmici
    const w = document.querySelectorAll('.cal-weekdays span');
    if (w.length === 7) t.weekdays.forEach((nm, i) => w[i].textContent = nm);
    // naslov mjeseca iz window.currentMonth
    const cm = window.currentMonth;
    const titleEl = document.getElementById('cal-title') || document.getElementById('calTitle');
    if (cm && titleEl) {
      const name = t.months[cm.month];
      titleEl.textContent = `${name} ${cm.year}`;
    }
    // re-apply on prev/next
    document.getElementById('prev-month')?.addEventListener('click', () => {
      setTimeout(() => {
        const cm2 = window.currentMonth;
        if (cm2 && titleEl) titleEl.textContent = `${t.months[cm2.month]} ${cm2.year}`;
      }, 0);
    });
    document.getElementById('next-month')?.addEventListener('click', () => {
      setTimeout(() => {
        const cm2 = window.currentMonth;
        if (cm2 && titleEl) titleEl.textContent = `${t.months[cm2.month]} ${cm2.year}`;
      }, 0);
    });
    
    // Apply i18n to all elements with data-i18n attribute in reservation page
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const keys = key.split('.');
      let value = DICT[lang];
      for (let k of keys) {
        if (value && value[k] !== undefined) value = value[k];
        else { value = null; break; }
      }
      if (value && typeof value === 'string') {
        el.textContent = value;
      }
    });
  }

  

  // === Profile stranica ===
  function applyProfile(lang) {
    // Apply i18n to all elements with data-i18n attribute in profile page
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const keys = key.split('.');
      let value = DICT[lang];
      for (let k of keys) {
        if (value && value[k] !== undefined) value = value[k];
        else { value = null; break; }
      }
      if (value && typeof value === 'string') {
        el.textContent = value;
      }
    });
    
    // Expose translations to profile.js
    window.__profile_lang__ = lang;
  }
  function applyReviews(lang) {
    const t = DICT[lang].reviews;

    // logo
    setText('.logo', DICT[lang].logo);

    // back link ako postoji
    const back = document.querySelector('.back-link');
    if (back) back.textContent = t.back;

    // header i forma
    const set = (sel, txt) => { const el = document.querySelector(sel); if (el && typeof txt === 'string') el.textContent = txt; };
    set('#rev-title', t.title);
    set('#rev-sub', t.sub);
    set('#rev-description', t.description);
    set('#form-title', t.form_title);
    set('#lbl-rating', t.rating);
    set('#rating-legend', t.rating_legend);
    set('#lbl-content', t.content);
    const ta = document.getElementById('rev-content');
    if (ta && ta.placeholder) ta.placeholder = t.placeholder;
    set('#rev-submit', t.submit);
    set('#eligibility-hint', t.eligible_hint);
    set('#list-title', t.list_title);

    // expose prijevode reviews.js-u
    window.__i18n_reviews__ = t;

    // ako je lista već učitana, repaint
    if (typeof window.reviewsRerender === 'function') {
      try { window.reviewsRerender(); } catch {}
    }
  }

  function applyAll(lang) {
    // mark active flag and <html lang>
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('#lang-switch [data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    const path = (location.pathname || '').toLowerCase();
    if (path.endsWith('/index.html') || path === '/' || path === '') applyIndex(lang);
    else if (path.endsWith('/reservation.html')) applyReservation(lang);
    else if (path.endsWith('/reviews.html')) applyReviews(lang);
    else if (path.endsWith('/profile.html')) applyProfile(lang);
    
  }

  function init() {
    const saved = localStorage.getItem(LANG_KEY) || 'bs';
    applyAll(saved);
    const switcher = document.getElementById('lang-switch');
    if (switcher) {
      switcher.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-lang]');
        if (!btn) return;
        const lang = btn.getAttribute('data-lang');
        localStorage.setItem(LANG_KEY, lang);
        applyAll(lang);
        // Reload pets list after language change on profile page
        if (location.pathname.endsWith('/profile.html') && typeof window.loadPets === 'function') {
          window.loadPets();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose DICT for other scripts
  window.DICT = DICT;
})();
