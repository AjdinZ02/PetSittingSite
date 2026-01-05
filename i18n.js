(function () {
  const LANG_KEY = 'lang';

  const DICT = {
    bs: {
      logo: 'Šetnja pasa | Kućne posjete',
      nav: {
        home:'Početna', about:'O nama', services:'Usluge', contact:'Kontakt',
        reserve:'Rezervacija', reviews:'Recenzije', login:'Prijava', logout:'Odjava', admin:'Admin'
      },
      index: {
        hero_title:'Sretan ljubimac = sretan vlasnik',
        hero_sub:'Pouzdane šetnje. Pažljiva briga. Bez stresa. Vaš ljubimac je sretan i aktivan dok ste zauzeti ili odsutni.',
        learn_more:'Rezervacija',
        hero_home_visits:'Kućna posjeta',
        hero_pet_walking:'Šetnja',
        about_h2: 'O nama',
        about_p: 'Mi smo Lejla i Mia, studentice i dugogodišnje vlasnice pasa, koje su svoju ljubav prema životinjama pretvorile u profesionalnu i pouzdanu uslugu za kućne ljubimce u Sarajevu.Obje imamo vlastite pse, svakodnevno radimo sa različitim pasminama i temperamentima, uključujući i radne pse, te posjedujemo osnovna znanja iz dresure i ponašanja pasa. Razumijemo potrebe pasa, njihove navike, signale i granice, što nam omogućava sigurno, smireno i odgovorno rukovanje u svakoj situaciji.Pružamo usluge šetnje pasa i kućnih obilazaka za kućne ljubimce, a povjerenje koje nam klijenti ukazuju shvatamo izuzetno ozbiljno. Upravo zbog toga sarađujemo s brojnim ambasadama u Sarajevu te smo prošle sigurnosnu provjeru što potvrđuje da smo odobrene za rad s diplomatskim institucijama. Naš rad je zasnovan na znanju, iskustvu i odgovornosti, ali i na iskrenoj posvećenosti i ljubavi prema životinjama.',
        services_h2:'Naše usluge',
        services_cards: {
          walk_h3: 'Grupne šetnje',
          walk_p: 'Savršena prilika za zabavu i druženje gdje vaš pas može uživati u društvu novih četveronožnih prijatelja. Naše šetnje pružaju socijalizaciju i fizičku aktivnost, što pomaže psima da postanu sretni i uravnoteženi ljubimci u sigurnom i kontrolisanom okruženju. Kroz igru i druženje u sigurnoj grupi, gradimo zdrave navike i veselu narav vašeg ljubimca. Trajanje: 30 minuta.',
          sit_h3: 'Individualne šetnje',
          sit_p: 'Svjesni smo da svaki pas ima jedinstven karakter i naše individualne šetnje su posebno prilagođene onima koji se ne osjećaju prijatno u blizini drugih pasa. Prilagođavamo se tempu vašeg psa, izbjegavamo trigere i učinimo svaki izlazak napolje pozitivnim iskustvom. Trajanje: 30 minuta.',
          dropin_h3: 'Kućne posjete',
          dropin_p: 'Znamo da je dom tamo gdje se vaš pas ili mačka osjećaju najsigurnije. Naše kućne posjete su osmišljeni da ljubimcima pruže sve neophodno dok ste vi odsutni - od svježe vode i obroka, do šetnje, igranja i maženja. Ovo je savršena opcija za ljubimce koji ne voli promjenu okruženja, starije pse ili mačke koji uživaju u miru svog prostora. '
        },

        contact_h2:'Kontakt',
        contact_p1:'Možete nas kontaktirati putem instagrama',
        contact_p4:'Instagram: @setnja_pasa_sarajevo',
        contact_p5:'Radno vrijeme: fleksibilno prema potrebama klijenata',
        cta_h2:'Spremni za rezervaciju?',
        cta_p:'Osigurajte šetnju ili brigu – rezervacija je samo jedan klik daleko.',
        cta_btn:'Rezervacija',
        footer_copy:'© 2025 Petsittingapp. Sva prava zadržana.',
        instagram:'Instagram'
      },

      reservation: {
        back:'← Nazad na početnu',
        title:'Rezervišite termin',
        sub:'Odaberite datum, recite nam više o ljubimcu i pošaljite zahtjev. Rezervacija postaje važeća tek nakon našeg odobrenja.',
        legend_full:'Zauzeto (100%)', legend_free:'Slobodno', legend_partial:'Djelimično zauzeto',
        labels:{
          date:'Datum',
          service:'Vrsta usluge',
          name:'Ime i prezime',
          address:'Adresa',
          phone:'Telefon',
          phone_hint:'Dozvoljeni su brojevi, razmaci, crtice i zagrade (npr. +387 61 123 456).',
          pet_type:'Vrsta životinje',
          pet_name:'Ime životinje',
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
    },

    en: {
      logo: 'Dog walking | House visits',
      nav: {
        home:'Home', about:'About', services:'Services', contact:'Contact',
        reserve:'Reserve', reviews:'Reviews', login:'Login', logout:'Logout', admin:'Admin'
      },
      index: {
        hero_title:'Happy pet = happy owner',
        hero_sub:'Reliable walks. Loving care. Stress-free service. We keep your pet happy and active while you’re busy or away.',
        learn_more:'Reserve',        hero_home_visits:'Home Visits',
        hero_pet_walking:'Pet Walking',
        about_h2: 'About Us',
        about_p: 'We are Lejla and Mia, students and long-time dog owners who have turned our love for animals into a professional and reliable pet care service in Sarajevo.We both have our own dogs and work daily with different breeds and temperaments, including working dogs. We also have basic knowledge of dog training and canine behavior. We understand dogs’ needs, routines, signals, and boundaries, which allows us to handle every situation safely, calmly, and responsibly.We provide dog walking and home visit services for pets, and we take the trust our clients place in us very seriously. For this reason, we cooperate with several embassies in Sarajevo and have successfully passed security clearance, confirming that we are approved to work with diplomatic institutions.Our work is based on knowledge, experience, and responsibility, as well as genuine dedication and love for animals.',
        services_h2:'Our Services',
        services_cards: {
          walk_h3: 'Group Walks',
          walk_p: 'A perfect opportunity for fun and socialization, where your dog can enjoy the company of new four-legged friends. Our group walks provide both social interaction and physical activity, helping dogs become happy and well-balanced companions in a safe and controlled environment. Through play and positive interaction in a small, supervised group, we build healthy habits and a cheerful spirit for your pet. Duration: 30 minutes.',
          sit_h3: 'Individual Walks',
          sit_p: 'We understand that every dog has a unique personality. Our individual walks are specially designed for dogs who may not feel comfortable around other dogs. We adapt to your dogs pace, avoid known triggers, and make every outdoor experience calm, positive, and enjoyable. Duration: 30 minutes.',
          dropin_h3: 'Home Visits',
          dropin_p: 'We know that home is where your dog or cat feels the safest. Our home visit service is designed to provide everything your pet needs while you are away — from fresh water and meals to walks, playtime, and cuddles. This is an ideal option for pets who don’t like changes in their environment, senior dogs, or cats who enjoy the peace and comfort of their own space.'
        },

        contact_h2:'Contact Us',
        contact_p1:'You can contact us via instagram',
        contact_p4:'Instagram: @setnja_pasa_sarajevo',
        contact_p5:'Working hours: Flexible according to customer needs',
        cta_h2:'Ready for a reservation?',
        cta_p:'Ensure a walk or care – a reservation is just one click away.',
        cta_btn:'Reserve',
        footer_copy:'© 2025 Petsittingapp. All rights reserved.',
        instagram:'Instagram'
      },

      reservation: {
        back:'← Back to Home',
        title:'Reserve your appointment',
        sub:'Select a date, tell us more about your pet and send us a request. The reservation becomes valid only after our approval.',
        legend_full:'Fully booked (100%)', legend_free:'Available', legend_partial:'Partially booked',
        labels:{
          date:'Date',
          service:'Service type',
          name:'Name and surname',
          address:'Address',
          phone:'Phone',
          phone_hint:'Numbers, spaces, dashes and brackets are allowed (e.g. +387 61 123 456).',
          pet_type:'Pet type',
          pet_name:'Pet name',
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
    setText('a[href="#contact"]', t.nav.contact);
    setText('a[href="reservation.html"]', t.nav.reserve);
    setText('a[href="reviews.html"]', t.nav.reviews);
    setText('#navLogin', t.nav.login);
    setText('#navLogout', t.nav.logout);
    setText('#navAdmin', t.nav.admin);

    // hero
    setText('#home .hero-text h1', t.index.hero_title);
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

    // CONTACT
    setText('#contact h2', t.index.contact_h2);
    const contactPs = document.querySelectorAll('#contact p');
    const lines = [t.index.contact_p1, t.index.contact_p2, t.index.contact_p3, t.index.contact_p4, t.index.contact_p5];
    lines.forEach((ln, i) => { if (contactPs[i]) contactPs[i].textContent = ln; });

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
    setText('label[for="res-notes"]', t.labels.notes);
    
    // Additional questions
    const additionalHeading = document.querySelector('.reservation-form h3');
    if (additionalHeading) additionalHeading.textContent = t.labels.additional_info;
    
    const allLabels = document.querySelectorAll('.reservation-form > label');
    const questionLabels = Array.from(allLabels).filter(label => !label.hasAttribute('for'));
    
    if (questionLabels.length >= 8) {
      questionLabels[0].textContent = t.labels.parking;
      questionLabels[1].textContent = t.labels.males;
      questionLabels[2].textContent = t.labels.females;
      questionLabels[3].textContent = t.labels.leash;
      questionLabels[4].textContent = t.labels.runaway;
      questionLabels[5].textContent = t.labels.fears;
      questionLabels[6].textContent = t.labels.mobility;
      questionLabels[7].textContent = t.labels.vaccinated;
    }
    
    // Yes/No radio buttons
    document.querySelectorAll('.radio-group label').forEach(label => {
      const radio = label.querySelector('input[type="radio"]');
      if (radio && radio.value === 'yes') {
        const textNode = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = ` ${t.labels.yes}`;
      } else if (radio && radio.value === 'no') {
        const textNode = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = ` ${t.labels.no}`;
      }
    });
    
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
  }

  // === Reviews stranica ===
  function applyReviews(lang) {
    const t = DICT[lang].reviews;

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
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
