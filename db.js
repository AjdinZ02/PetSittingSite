
const { Pool } = require('pg');
const crypto = require('crypto');

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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
// Init & migracije
// =====================
const ready = (async () => {
  const client = await pool.connect();
  try {
    // Kreiraj tabele
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('admin','user')),
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rezervacije (
        id SERIAL PRIMARY KEY,
        datum DATE NOT NULL,
        start_minutes INTEGER,
        end_minutes INTEGER,
        trajanje_min INTEGER NOT NULL DEFAULT 60,
        ime_prezime TEXT NOT NULL,
        ime_zivotinje TEXT NOT NULL,
        vrsta_zivotinje TEXT NOT NULL,
        napomena TEXT,
        adresa TEXT NOT NULL DEFAULT '',
        telefon TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rezervacije_datum ON rezervacije(datum)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rezervacije_user ON rezervacije(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rezervacije_status ON rezervacije(status)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)
    `);

    // Seed admin
    await seedAdmin(client);
  } finally {
    client.release();
  }
})();

function seedAdmin(client) {
  return new Promise(async (resolve, reject) => {
    try {
      const ADMIN_USER = process.env.ADMIN_USER ?? 'admin';
      const ADMIN_PASS = process.env.ADMIN_PASS ?? 'adminadmin123';
      
      const res = await client.query(`SELECT id FROM users WHERE username = $1`, [ADMIN_USER]);
      if (res.rows.length > 0) return resolve(res.rows[0].id);
      
      const { salt, hash } = hashPassword(ADMIN_PASS);
      const insert = await client.query(
        `INSERT INTO users (username, role, password_salt, password_hash)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [ADMIN_USER, 'admin', salt, hash]
      );
      resolve(insert.rows[0].id);
    } catch (e) {
      reject(e);
    }
  });
}

// =====================
// Users helpers
// =====================
function createUser({ username, password, email, phone, address, role = 'user' }) {
  return new Promise(async (resolve, reject) => {
    try {
      const { salt, hash } = hashPassword(password);
      const result = await pool.query(
        `INSERT INTO users (username, role, password_salt, password_hash, email, phone, address)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [username, role, salt, hash, email, phone, address]
      );
      resolve({ id: result.rows[0].id, username, role });
    } catch (err) {
      const msg = String(err.message || '');
      if (err.code === '23505' && msg.includes('users_username'))
        return reject({ code: 'USERNAME_EXISTS', message: 'Korisničko ime je zauzeto.' });
      if (err.code === '23505' && msg.includes('email'))
        return reject({ code: 'EMAIL_EXISTS', message: 'Email je već registrovan.' });
      reject(err);
    }
  });
}
function findUserByUsername(username) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(
        `SELECT id, username, role, password_salt AS salt, password_hash AS hash
         FROM users WHERE username = $1`,
        [username]
      );
      resolve(result.rows[0] || null);
    } catch (e) {
      reject(e);
    }
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
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(
        `SELECT r.id, r.user_id, u.username, r.rating, r.content, 
                r.created_at AS "createdAt", r.updated_at AS "updatedAt"
           FROM reviews r
           JOIN users u ON u.id = r.user_id
          ORDER BY r.created_at DESC`
      );
      resolve(result.rows);
    } catch (e) {
      reject(e);
    }
  });
}
function listUserReviews(userId) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(
        `SELECT id, user_id, rating, content, created_at AS "createdAt", updated_at AS "updatedAt"
           FROM reviews
          WHERE user_id = $1
          ORDER BY created_at DESC`,
        [userId]
      );
      resolve(result.rows);
    } catch (e) {
      reject(e);
    }
  });
}
function createReview({ userId, rating, content }) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(
        `INSERT INTO reviews (user_id, rating, content) VALUES ($1,$2,$3) RETURNING id`,
        [userId, rating, content]
      );
      resolve({ id: result.rows[0].id });
    } catch (e) {
      reject(e);
    }
  });
}
function getReviewOwner(reviewId) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(`SELECT id, user_id FROM reviews WHERE id = $1`, [reviewId]);
      resolve(result.rows[0] || null);
    } catch (e) {
      reject(e);
    }
  });
}
function updateReview({ id, userId, rating, content }) {
  return new Promise(async (resolve, reject) => {
    try {
      const rev = await getReviewOwner(id);
      if (!rev) return reject({ code: 'NOT_FOUND', message: 'Recenzija nije pronađena.' });
      if (rev.user_id !== userId)
        return reject({ code: 'FORBIDDEN', message: 'Možete uređivati samo svoje recenzije.' });

      const result = await pool.query(
        `UPDATE reviews
            SET rating = $1, content = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3`,
        [rating, content, id]
      );
      resolve({ updated: result.rowCount });
    } catch (e) {
      reject(e);
    }
  });
}
function deleteReview(reviewId) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(`DELETE FROM reviews WHERE id = $1`, [reviewId]);
      resolve({ deleted: result.rowCount });
    } catch (e) {
      reject(e);
    }
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
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(
        `SELECT start_minutes, end_minutes
           FROM rezervacije
          WHERE datum = $1 AND status = 'approved'`,
        [date]
      );
      resolve(result.rows);
    } catch (e) {
      reject(e);
    }
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
  return new Promise(async (resolve, reject) => {
    try {
      let sql = `
        SELECT EXISTS(
          SELECT 1 FROM rezervacije
           WHERE user_id = $1 AND status = 'approved'
      `;
      if (requirePast) {
        sql += ` AND (
          datum < CURRENT_DATE
          OR (datum = CURRENT_DATE AND end_minutes <= EXTRACT(HOUR FROM CURRENT_TIME) * 60 + EXTRACT(MINUTE FROM CURRENT_TIME))
        )`;
      }
      sql += ` LIMIT 1) AS has`;
      
      const result = await pool.query(sql, [userId]);
      resolve(result.rows[0].has);
    } catch (e) {
      reject(e);
    }
  });
}

// Kreiranje ZAHTJEVA (status = pending)
function createReservation({
  ime_prezime, datum, vrijeme, trajanje_min = 60,
  ime_zivotinje, vrsta_zivotinje, napomena,
  adresa, telefon,
  user_id = null
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const start = toMinutes(vrijeme);
      if (start == null) return reject({ code: 'BAD_TIME', message: 'Neispravno vrijeme HH:mm.' });
      const end = start + Number(trajanje_min ?? 60);

      const result = await pool.query(
        `INSERT INTO rezervacije
          (datum, start_minutes, end_minutes, trajanje_min,
           ime_prezime, ime_zivotinje, vrsta_zivotinje, napomena,
           adresa, telefon, user_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [
          datum, start, end, trajanje_min,
          ime_prezime, ime_zivotinje, vrsta_zivotinje, napomena ?? '',
          adresa ?? '', telefon ?? '', user_id ?? null,
          'pending'
        ]
      );
      resolve({ id: result.rows[0].id });
    } catch (e) {
      reject(e);
    }
  });
}

// Admin: promjena statusa
function updateReservationStatus(id, status) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!['approved', 'rejected', 'pending'].includes(String(status))) {
        return reject(new Error('Invalid status'));
      }
      const result = await pool.query(
        `UPDATE rezervacije SET status = $1 WHERE id = $2`,
        [status, id]
      );
      resolve({ updated: result.rowCount });
    } catch (e) {
      reject(e);
    }
  });
}
function listReservationsAdmin() {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(
        `SELECT id, datum, start_minutes, end_minutes, trajanje_min,
                ime_prezime, ime_zivotinje, vrsta_zivotinje, napomena,
                adresa, telefon, status, user_id
           FROM rezervacije
       ORDER BY datum ASC, start_minutes ASC`
      );
      resolve(result.rows);
    } catch (e) {
      reject(e);
    }
  });
}

// =====================
// Exports
// =====================
module.exports = {
  db: pool, ready,
  // auth
  createUser, findUserByUsername, verifyUser, hashPassword, verifyPassword,
  // reviews
  listReviews, listUserReviews, createReview, updateReview, deleteReview, getReviewOwner,
  // reservations
  toMinutes, formatHHMM, getDayReservations, getTakenSlots, createReservation, hasUserReservation,
  // admin reservations
  updateReservationStatus, listReservationsAdmin,
};
