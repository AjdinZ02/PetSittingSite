const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const {
  // auth
  createUser, verifyUser, findUserByUsername,
  // reviews
  listReviews, listUserReviews, createReview, updateReview, deleteReview, getReviewOwner,
  // reservations
  getTakenSlots, createReservation, toMinutes, hasUserReservation,
  // utils + admin
  db, formatHHMM,
  updateReservationStatus, listReservationsAdmin
} = require('./db');

const app = express();

// Statika: služi sve iz trenutnog foldera 
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Body + CORS
app.use(cors());
app.use(bodyParser.json());

// Config rasporeda 
const SLOT_STEP_MIN = 60;
const WORK_FROM = '08:00';
const WORK_TO = '22:00';

//  Token store 
const activeTokens = new Map();

// Middleware 
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authorization missing.' });
  const token = authHeader.replace('Bearer ', '');
  const session = activeTokens.get(token);
  if (!session) return res.status(401).json({ error: 'Invalid token. Please login.' });
  req.user = session;
  req.token = token;
  next();
}
function authorizeRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient privileges.' });
    }
    next();
  };
}
function tryAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const session = activeTokens.get(token);
    if (session) {
      req.user = session;
      req.token = token;
    }
  }
  next();
}

// AUTH 
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
      return res.status(400).json({ error: 'Unesite korisničko ime i lozinku (min 6 znakova).' });
    }
    const exists = await findUserByUsername(username);
    if (exists) return res.status(409).json({ error: 'Korisničko ime je zauzeto.' });
    const user = await createUser({ username, password, role: 'user' });
    res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri registraciji.' });
  }
});
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('[LOGIN] Attempt for username:', username);
    if (!username || !password) return res.status(400).json({ error: 'Unesite korisničko ime i lozinku.' });
    const user = await verifyUser(username, password);
    console.log('[LOGIN] verifyUser result:', user ? `User found: ${user.username}, role: ${user.role}` : 'User NOT found');
    if (!user) return res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka.' });
    const token = crypto.randomBytes(24).toString('hex');
    activeTokens.set(token, { userId: user.id, role: user.role, username: user.username });
    console.log('[LOGIN] Success! Token created for user:', user.username);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    console.error('[LOGIN] Error:', e);
    res.status(500).json({ error: 'Greška pri prijavi.' });
  }
});
app.post('/auth/logout', authenticate, (req, res) => {
  activeTokens.delete(req.token);
  res.json({ message: 'Odjavljeni ste.' });
});
app.get('/auth/me', authenticate, (req, res) => {
  res.json({ id: req.user.userId, username: req.user.username, role: req.user.role });
});

// RESERVATIONS 
app.get('/availability', async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) return res.status(400).json({ error: 'Parametar date je obavezan (YYYY-MM-DD).' });
    const takenTimes = await getTakenSlots(date, SLOT_STEP_MIN, WORK_FROM, WORK_TO);
    const totalSlots = Math.floor((toMinutes(WORK_TO) - toMinutes(WORK_FROM)) / SLOT_STEP_MIN);
    const fullyBooked = takenTimes.length >= totalSlots;
    res.json({ date, takenTimes, settings: { SLOT_STEP_MIN, WORK_FROM, WORK_TO }, fullyBooked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});

app.get('/availability/range', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'Parametri from i to su obavezni (YYYY-MM-DD).' });
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ error: 'Neispravan raspon datuma.' });
    }
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    const totalSlots = Math.floor((toMinutes(WORK_TO) - toMinutes(WORK_FROM)) / SLOT_STEP_MIN);
    const result = {};
    for (const date of dates) {
      const takenTimes = await getTakenSlots(date, SLOT_STEP_MIN, WORK_FROM, WORK_TO);
      result[date] = { takenTimes, fullyBooked: takenTimes.length >= totalSlots };
    }
    res.json({ settings: { SLOT_STEP_MIN, WORK_FROM, WORK_TO, totalSlots }, days: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});

// ✅ Rezervacija: adresa/telefon obavezni (status = pending)
app.post('/rezervacija', tryAuthenticate, async (req, res) => {
  try {
    const {
      ime_prezime, datum, vrijeme,
      trajanje_min = SLOT_STEP_MIN,
      ime_zivotinje, vrsta_zivotinje, napomena,
      adresa, telefon
    } = req.body;

    if (!ime_prezime || !datum || !vrijeme || !ime_zivotinje || !vrsta_zivotinje) {
      return res.status(400).json({ error: 'Popunite obavezna polja: ime_prezime, datum, vrijeme, ime_zivotinje, vrsta_zivotinje.' });
    }
    if (!adresa || String(adresa).trim().length < 5) {
      return res.status(400).json({ error: 'Adresa je obavezna (min 5 znakova).' });
    }
    const phone = String(telefon || '').trim();
    const phoneRe = /^[+]?[\d\s\-()]{7,15}$/;
    if (!phone || !phoneRe.test(phone)) {
      return res.status(400).json({ error: 'Broj telefona je obavezan (npr. +387 61 123 456).' });
    }

    const chosen = new Date(`${datum}T${vrijeme}:00`);
    if (isNaN(chosen.getTime())) return res.status(400).json({ error: 'Neispravan format datuma/vremena.' });
    const now = new Date();
    if (chosen < now) return res.status(400).json({ error: 'Ne možete rezervisati u prošlosti.' });

    const startMin = toMinutes(vrijeme);
    const wStart = toMinutes(WORK_FROM);
    const wEnd = toMinutes(WORK_TO);
    if (startMin < wStart || startMin + Number(trajanje_min) > wEnd) {
      return res.status(400).json({ error: `Vrijeme mora biti unutar radnog vremena (${WORK_FROM}–${WORK_TO}).` });
    }

    const userId = req.user?.userId ?? null;

    const result = await createReservation({
      ime_prezime, datum, vrijeme, trajanje_min,
      ime_zivotinje, vrsta_zivotinje, napomena,
      adresa, telefon,
      user_id: userId
    });

    res.status(201).json({ message: '✅ Zahtjev poslan. Bićete obaviješteni nakon odobrenja.', id: result.id });
  } catch (e) {
    if (e.code === 'BAD_TIME') return res.status(400).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});

// ADMIN lista 
app.get('/rezervacije', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const rows = await listReservationsAdmin();
    const data = rows.map(r => ({
      ...r,
      vrijeme: formatHHMM(r.start_minutes),
      kraj: formatHHMM(r.end_minutes)
    }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN akcije: odobri / odbij

app.put('/rezervacije/:id/approve', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rowResult = await db.query(
      `SELECT datum, start_minutes, end_minutes FROM rezervacije WHERE id = $1`,
      [id]
    );
    const row = rowResult.rows[0];
    if (!row) return res.status(404).json({ error: 'Rezervacija nije pronađena.' });

    const conflictResult = await db.query(
      `SELECT 1 FROM rezervacije
        WHERE datum = $1 AND status='approved'
          AND start_minutes < $2 AND $3 < end_minutes
        LIMIT 1`,
      [row.datum, row.end_minutes, row.start_minutes]
    );
    const conflict = conflictResult.rows.length > 0;
    if (conflict) return res.status(409).json({ error: 'Konflikt sa postojećom odobrenom rezervacijom.' });

    const r = await updateReservationStatus(id, 'approved');
    if (!r.updated) return res.status(404).json({ error: 'Rezervacija nije pronađena.' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[APPROVE ERROR]', e);
    res.status(500).json({ error: 'Greška pri odobravanju.' });
  }
});

app.put('/rezervacije/:id/reject', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await updateReservationStatus(id, 'rejected');
    if (!r.updated) return res.status(404).json({ error: 'Rezervacija nije pronađena.' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[REJECT ERROR]', e);
    res.status(500).json({ error: 'Greška pri odbijanju.' });
  }
});
  

//  REVIEWS 
app.get('/reviews', async (req, res) => {
  try {
    const items = await listReviews();
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri dohvaćanju recenzija.' });
  }
});

app.get('/reviews/mine', authenticate, async (req, res) => {
  try {
    const items = await listUserReviews(req.user.userId);
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri dohvaćanju recenzija.' });
  }
});

// Korisnik smije ostaviti recenziju samo ako ima barem jednu prošlu ODOBRENU rezervaciju
app.get('/reviews/eligible', authenticate, async (req, res) => {
  try {
    const eligible = await hasUserReservation(req.user.userId, true);
    res.json({ eligible: !!eligible });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri provjeri prava na recenziju.' });
  }
});

app.post('/reviews', authenticate, async (req, res) => {
  try {
    const { rating, content } = req.body;
    if (!rating || !content || content.trim().length < 3) {
      return res.status(400).json({ error: 'Unesite ocjenu (1–5) i sadržaj (min 3 znaka).' });
    }
    const eligible = await hasUserReservation(req.user.userId, true);
    if (!eligible) {
      return res.status(403).json({ error: 'Samo korisnici sa završenom odobrenom rezervacijom mogu ostaviti recenziju.' });
    }
    const r = Math.max(1, Math.min(5, Number(rating)));
    const result = await createReview({ userId: req.user.userId, rating: r, content: content.trim() });
    res.status(201).json({ id: result.id, message: 'OK' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri kreiranju recenzije.' });
  }
});

app.put('/reviews/:id', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rating, content } = req.body;
    if (!rating || !content || content.trim().length < 3) {
      return res.status(400).json({ error: 'Unesite ocjenu (1–5) i sadržaj (min 3 znaka).' });
    }
    const r = Math.max(1, Math.min(5, Number(rating)));
    const result = await updateReview({ id, userId: req.user.userId, rating: r, content: content.trim() });
    res.json({ updated: result.updated });
  } catch (e) {
    if (e.code === 'NOT_FOUND') return res.status(404).json({ error: e.message });
    if (e.code === 'FORBIDDEN') return res.status(403).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Greška pri ažuriranju recenzije.' });
  }
});

app.delete('/reviews/:id', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const owner = await getReviewOwner(id);
    if (!owner) return res.status(404).json({ error: 'Recenzija nije pronađena.' });
    const isOwner = owner.user_id === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Nemate pravo na brisanje ove recenzije.' });
    const result = await deleteReview(id);
    res.json({ deleted: result.deleted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri brisanju recenzije.' });
  }
});

// Start 
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Server sluša na portu ${PORT}`));
