const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const {
  // auth
  createUser, verifyUser, findUserByUsername,
  // reviews
  listReviews, listUserReviews, createReview, updateReview, deleteReview, getReviewOwner,
  // reservations
  getTakenSlots, createReservation, toMinutes
} = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===== Config rasporeda =====
const SLOT_STEP_MIN = 60;
const WORK_FROM = '08:00';
const WORK_TO   = '22:00';

// ===== Token store =====
/**
 * activeTokens: Map(token => { userId, role, username })
 */
const activeTokens = new Map();

// ===== Middleware =====
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authorization missing.' });
  const token = authHeader.replace('Bearer ', '');
  const session = activeTokens.get(token);
  if (!session) return res.status(401).json({ error: 'Invalid token. Please login.' });
  req.user = session; // { userId, role, username }
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

// ===== AUTH ROUTES =====

// Register (samo obični korisnik)
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

// Login (admin ili user)
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Unesite korisničko ime i lozinku.' });

    const user = await verifyUser(username, password);
    if (!user) return res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka.' });

    const token = crypto.randomBytes(24).toString('hex');
    activeTokens.set(token, { userId: user.id, role: user.role, username: user.username });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri prijavi.' });
  }
});

// Logout
app.post('/auth/logout', authenticate, (req, res) => {
  activeTokens.delete(req.token);
  res.json({ message: 'Odjavljeni ste.' });
});

// Current user (me)
app.get('/auth/me', authenticate, (req, res) => {
  res.json({ id: req.user.userId, username: req.user.username, role: req.user.role });
});

// ===== RESERVATIONS (ostaje kao ranije) =====

// Availability: jedan dan
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

// Availability: raspon (kalendar)
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

// Kreiranje rezervacije
app.post('/rezervacija', async (req, res) => {
  try {
    const { ime_prezime, datum, vrijeme, trajanje_min = SLOT_STEP_MIN, ime_zivotinje, vrsta_zivotinje, napomena } = req.body;

    if (!ime_prezime || !datum || !vrijeme || !ime_zivotinje || !vrsta_zivotinje) {
      return res.status(400).json({ error: 'Popunite obavezna polja: ime_prezime, datum, vrijeme, ime_zivotinje, vrsta_zivotinje.' });
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

    const result = await createReservation({ ime_prezime, datum, vrijeme, trajanje_min, ime_zivotinje, vrsta_zivotinje, napomena });
    res.status(201).json({ message: '✅ Rezervacija spašena.', id: result.id });
  } catch (e) {
    if (e.code === 'CONFLICT') return res.status(409).json({ error: e.message });
    if (e.code === 'BAD_TIME') return res.status(400).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});

// Admin-only pregled rezervacija (koristi isti endpoint, samo zaštita)
app.get('/rezervacije', authenticate, authorizeRole('admin'), (req, res) => {
  const { db } = require('./db');
  db.all(
    `SELECT id, datum, start_minutes, end_minutes, trajanje_min, ime_prezime, ime_zivotinje, vrsta_zivotinje, napomena
     FROM rezervacije
     ORDER BY datum ASC, start_minutes ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const { formatHHMM } = require('./db');
      const data = rows.map(r => ({ ...r, vrijeme: formatHHMM(r.start_minutes), kraj: formatHHMM(r.end_minutes) }));
      res.json(data);
    }
  );
});

// ===== REVIEWS (korisnik i admin) =====

// Public list svih recenzija
app.get('/reviews', async (req, res) => {
  try {
    const items = await listReviews();
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri dohvaćanju recenzija.' });
  }
});

// Moje recenzije (auth)
app.get('/reviews/mine', authenticate, async (req, res) => {
  try {
    const items = await listUserReviews(req.user.userId);
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri dohvaćanju recenzija.' });
  }
});

// Kreiraj recenziju (auth: user ili admin)
app.post('/reviews', authenticate, async (req, res) => {
  try {
    const { rating, content } = req.body;
    if (!rating || !content || content.trim().length < 3) {
      return res.status(400).json({ error: 'Unesite ocjenu (1–5) i sadržaj (min 3 znaka).' });
    }
    const r = Math.max(1, Math.min(5, Number(rating)));
    const result = await createReview({ userId: req.user.userId, rating: r, content: content.trim() });
    res.status(201).json({ id: result.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Greška pri kreiranju recenzije.' });
  }
});

// Uredi svoju recenziju (auth: vlasnik)
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

// Obriši recenziju (auth: vlasnik ili admin)
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

// ===== Start =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`
Server slusa na portu ${PORT}`));