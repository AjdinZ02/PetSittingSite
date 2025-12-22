
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'dogwalking.db'));

// =====================
// Password hashing
// =====================
const HASH_ITER = 120000;
const HASH_LEN = 64;
const HASH_DIGEST = 'sha512';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITER, HASH_LEN, HASH_DIGEST).toString('hex');
  return { salt, hash, iter: HASH_ITER, digest: HASH_DIGEST };
}
function verifyPassword(password, salt, hash) {
  const h = crypto.pbkdf2Sync(password, salt, HASH_ITER, HASH_LEN, HASH_DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
}

// =====================
// Init & migracije (bez brisanja baze)
// =====================
const ready = new Promise((resolve, reject) => {
  db.serialize(() => {
    // 1) Kreiraj tabele ako ne postoje (sa svim kolonama za nove baze)
    db.run(`
      CREATE TABLE IF NOT EXISTS rezervacije (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        datum TEXT NOT NULL,            -- YYYY-MM-DD
        start_minutes INTEGER,          -- minute od ponoći
        end_minutes INTEGER,            -- minute od ponoći
        trajanje_min INTEGER NOT NULL DEFAULT 60,
        ime_prezime TEXT NOT NULL,
        ime_zivotinje TEXT NOT NULL,
        vrsta_zivotinje TEXT NOT NULL,
        napomena TEXT,
        adresa TEXT NOT NULL DEFAULT '',
        telefon TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected
        user_id INTEGER NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `, onErr);

    // Ovi indexi su bezbjedni jer kolone sigurno postoje
    db.run(`CREATE INDEX IF NOT EXISTS idx_rezervacije_datum  ON rezervacije(datum)`, onErr);
    db.run(`CREATE INDEX IF NOT EXISTS idx_rezervacije_user   ON rezervacije(user_id)`, onErr);

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('admin','user')),
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `, onErr);
    db.run(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
         ON users(email) WHERE email IS NOT NULL`,
      onErr
    );

    db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        content TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, onErr);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`, onErr);

    // 2) Migracije kolona za već postojeće baze (redoslijed je bitan)
    ensureColumn('rezervacije', `adresa TEXT NOT NULL DEFAULT ''`)
      .then(() => ensureColumn('rezervacije', `telefon TEXT NOT NULL DEFAULT ''`))
      .then(() => ensureColumn('rezervacije', `status TEXT NOT NULL DEFAULT 'pending'`))
      .then(() => ensureColumn('rezervacije', `user_id INTEGER NULL`))
      .then(() => {
        // ✅ Tek sada, kad sigurno postoji kolona status, pravimo indeks na status
        db.run(`CREATE INDEX IF NOT EXISTS idx_rezervacije_status ON rezervacije(status)`, onErr);
      })
      .then(() => seedAdmin())
      .then(() => resolve())
      .catch(reject);
  });
});

function onErr(err) {
  // Loguj ali ne ruši proces – migracije/indeksi su idempotentni
  if (err) console.error('[DB] SQL error:', err.message);
}

function ensureColumn(table, columnDef) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, [], (err, cols) => {
      if (err) return reject(err);
      const names = Array.isArray(cols) ? cols.map(c => c.name) : [];
      const colName = String(columnDef).trim().split(/\s+/)[0];
      if (names.includes(colName)) return resolve({ added: false, name: colName });
      db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`, (e) => {
        if (e) return reject(e);
        resolve({ added: true, name: colName });
      });
    });
  });
}

// =====================
// Admin seeding
// =====================
function seedAdmin() {
  return new Promise((resolve, reject) => {
    const ADMIN_USER = process.env.ADMIN_USER ?? 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASS ?? 'adminadmin123';
    db.get(`SELECT id FROM users WHERE username = ?`, [ADMIN_USER], (err, row) => {
      if (err) return reject(err);
      if (row) return resolve(row.id);
      const { salt, hash } = hashPassword(ADMIN_PASS);
      db.run(
        `INSERT INTO users (username, role, password_salt, password_hash)
         VALUES (?,?,?,?)`,
        [ADMIN_USER, 'admin', salt, hash],
        function (err2) {
          if (err2) return reject(err2);
          resolve(this.lastID);
        }
      );
    });
  });
}

// =====================
// Users helpers
// =====================
function createUser({ username, password, email, phone, address, role = 'user' }) {
  return new Promise((resolve, reject) => {
    const { salt, hash } = hashPassword(password);
    db.run(
      `INSERT INTO users (username, role, password_salt, password_hash, email, phone, address)
       VALUES (?,?,?,?,?,?,?)`,
      [username, role, salt, hash, email, phone, address],
      function (err) {
        if (err) {
          const msg = String(err.message || '');
          if (msg.includes('UNIQUE') && msg.includes('users.username'))
            return reject({ code: 'USERNAME_EXISTS', message: 'Korisničko ime je zauzeto.' });
          if (msg.includes('UNIQUE') && (msg.includes('users.email') || msg.includes('idx_users_email_unique')))
            return reject({ code: 'EMAIL_EXISTS', message: 'Email je već registrovan.' });
          return reject(err);
        }
        resolve({ id: this.lastID, username, role });
      }
    );
  });
}
function findUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, username, role, password_salt AS salt, password_hash AS hash
       FROM users WHERE username = ?`,
      [username],
      (err, row) => (err ? reject(err) : resolve(row || null))
    );
  });
}
function verifyUser(username, password) {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await findUserByUsername(username);
      if (!user) return resolve(null);
      const ok = verifyPassword(password, user.salt, user.hash);
      resolve(ok ? { id: user.id, username: user.username, role: user.role } : null);
    } catch (e) {
      reject(e);
    }
  });
}

// =====================
// Reviews helpers
// =====================
function listReviews() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT r.id, r.user_id, u.username, r.rating, r.content, r.createdAt, r.updatedAt
         FROM reviews r
         JOIN users u ON u.id = r.user_id
        ORDER BY r.createdAt DESC`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    );
  });
}
function listUserReviews(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, user_id, rating, content, createdAt, updatedAt
         FROM reviews
        WHERE user_id = ?
        ORDER BY createdAt DESC`,
      [userId],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    );
  });
}
function createReview({ userId, rating, content }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO reviews (user_id, rating, content) VALUES (?,?,?)`,
      [userId, rating, content],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}
function getReviewOwner(reviewId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, user_id FROM reviews WHERE id = ?`, [reviewId], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}
function updateReview({ id, userId, rating, content }) {
  return new Promise(async (resolve, reject) => {
    try {
      const rev = await getReviewOwner(id);
      if (!rev) return reject({ code: 'NOT_FOUND', message: 'Recenzija nije pronađena.' });
      if (rev.user_id !== userId)
        return reject({ code: 'FORBIDDEN', message: 'Možete uređivati samo svoje recenzije.' });

      db.run(
        `UPDATE reviews
            SET rating = ?, content = ?, updatedAt = datetime('now')
          WHERE id = ?`,
        [rating, content, id],
        function (err) {
          if (err) return reject(err);
          resolve({ updated: this.changes });
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}
function deleteReview(reviewId) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM reviews WHERE id = ?`, [reviewId], function (err) {
      if (err) return reject(err);
      resolve({ deleted: this.changes });
    });
  });
}

// =====================
// Rezervacije helpers
// =====================
function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}
function formatHHMM(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// Za zauzeće uzimamo SAMO odobrene rezervacije
function getDayReservations(date) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT start_minutes, end_minutes
         FROM rezervacije
        WHERE datum = ? AND status = 'approved'`,
      [date],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

async function getTakenSlots(date, slotStepMin, workFromHHMM, workToHHMM) {
  const reservations = await getDayReservations(date);
  const workStart = toMinutes(workFromHHMM);
  const workEnd = toMinutes(workToHHMM);
  const taken = [];
  for (let s = workStart; s + slotStepMin <= workEnd; s += slotStepMin) {
    const slotStart = s;
    const slotEnd = s + slotStepMin;
    const overlaps = reservations.some(r => r.start_minutes < slotEnd && slotStart < r.end_minutes);
    if (overlaps) taken.push(formatHHMM(slotStart));
  }
  return taken;
}

// Korisnik ima li makar jednu (po defaultu: prošlu) ODOBRENU rezervaciju?
function hasUserReservation(userId, requirePast = true) {
  return new Promise((resolve, reject) => {
    const nowMinutesExpr = `CAST(strftime('%H','now','localtime') AS INTEGER) * 60
                            + CAST(strftime('%M','now','localtime') AS INTEGER)`;
    const wherePast = `
      (
        date(datum) < date('now','localtime')
        OR (date(datum) = date('now','localtime') AND end_minutes <= ${nowMinutesExpr})
      )
    `;
    const sql = `
      SELECT EXISTS(
        SELECT 1 FROM rezervacije
         WHERE user_id = ? AND status = 'approved' ${requirePast ? `AND ${wherePast}` : ``}
         LIMIT 1
      ) AS has
    `;
    db.get(sql, [userId], (err, row) => {
      if (err) return reject(err);
      resolve(!!(row && row.has === 1));
    });
  });
}

// Kreiranje ZAHTJEVA (status = pending)
function createReservation({
  ime_prezime, datum, vrijeme, trajanje_min = 60,
  ime_zivotinje, vrsta_zivotinje, napomena,
  adresa, telefon,
  user_id = null
}) {
  return new Promise((resolve, reject) => {
    const start = toMinutes(vrijeme);
    if (start == null) return reject({ code: 'BAD_TIME', message: 'Neispravno vrijeme HH:mm.' });
    const end = start + Number(trajanje_min ?? 60);

    db.run(
      `INSERT INTO rezervacije
        (datum, start_minutes, end_minutes, trajanje_min,
         ime_prezime, ime_zivotinje, vrsta_zivotinje, napomena,
         adresa, telefon, user_id, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        datum, start, end, trajanje_min,
        ime_prezime, ime_zivotinje, vrsta_zivotinje, napomena ?? '',
        adresa ?? '', telefon ?? '', user_id ?? null,
        'pending'
      ],
      function (err2) {
        if (err2) return reject(err2);
        resolve({ id: this.lastID });
      }
    );
  });
}

// Admin: promjena statusa
function updateReservationStatus(id, status) {
  return new Promise((resolve, reject) => {
    if (!['approved', 'rejected', 'pending'].includes(String(status))) {
      return reject(new Error('Invalid status'));
    }
    db.run(
      `UPDATE rezervacije SET status = ? WHERE id = ?`,
      [status, id],
      function (err) {
        if (err) return reject(err);
        resolve({ updated: this.changes });
      }
    );
  });
}
function listReservationsAdmin() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, datum, start_minutes, end_minutes, trajanje_min,
              ime_prezime, ime_zivotinje, vrsta_zivotinje, napomena,
              adresa, telefon, status, user_id
         FROM rezervacije
     ORDER BY datum ASC, start_minutes ASC`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    );
  });
}

// =====================
// Exports
// =====================
module.exports = {
  db, ready,
  // auth
  createUser, findUserByUsername, verifyUser, hashPassword, verifyPassword,
  // reviews
  listReviews, listUserReviews, createReview, updateReview, deleteReview, getReviewOwner,
  // reservations
  toMinutes, formatHHMM, getDayReservations, getTakenSlots, createReservation, hasUserReservation,
  // admin reservations
  updateReservationStatus, listReservationsAdmin,
};
