
const { Pool } = require('pg');
const crypto = require('crypto');

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Password hashing

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
// Init & migracije

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
        fullname TEXT,
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
        parking TEXT,
        males TEXT,
        females TEXT,
        leash TEXT,
        runaway TEXT,
        fears TEXT,
        mobility TEXT,
        vaccinated TEXT,
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

    // Pet profiles tabela
    await client.query(`
      CREATE TABLE IF NOT EXISTS pet_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pet_name TEXT NOT NULL,
        pet_type TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        notes TEXT,
        parking TEXT,
        males TEXT,
        females TEXT,
        leash TEXT,
        runaway TEXT,
        fears TEXT,
        mobility TEXT,
        vaccinated TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, pet_name, pet_type)
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pet_profiles_user ON pet_profiles(user_id)
    `);

    // Migracija: Dodavanje fullname polja u users tabelu
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS fullname TEXT
      `);
      console.log('[MIGRATION] Successfully added fullname column to users table');
    } catch (e) {
      console.log('[MIGRATION] Fullname column may already exist:', e.message);
    }

    // Seed admin
    await seedAdmin(client);
  } finally {
    client.release();
  }
})();

function seedAdmin(client) {
  return new Promise(async (resolve, reject) => {
    try {
      const ADMIN_USER = process.env.ADMIN_USER ;
      const ADMIN_PASS = process.env.ADMIN_PASS ;
      if (!ADMIN_USER || !ADMIN_PASS) {
      console.log('[SEED] ADMIN_USER / ADMIN_PASS not set, skipping admin seed');
      return null;
    }

      
      console.log('[SEED] Checking for admin user:', ADMIN_USER);
      const res = await client.query(`SELECT id FROM users WHERE username = $1`, [ADMIN_USER]);
      if (res.rows.length > 0) {
        console.log('[SEED] Admin user already exists, id:', res.rows[0].id);
        return resolve(res.rows[0].id);
      }
      
      console.log('[SEED] Creating admin user...');
      const { salt, hash } = hashPassword(ADMIN_PASS);
      const insert = await client.query(
        `INSERT INTO users (username, role, password_salt, password_hash)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [ADMIN_USER, 'admin', salt, hash]
      );
      console.log('[SEED] Admin user created successfully, id:', insert.rows[0].id);
      resolve(insert.rows[0].id);
    } catch (e) {
      console.error('[SEED] Error creating admin user:', e.message);
      reject(e);
    }
  });
}


// Users helpers

function createUser({ username, password, email, phone, address, fullname, role = 'user' }) {
  return new Promise(async (resolve, reject) => {
    try {
      const { salt, hash } = hashPassword(password);
      const result = await pool.query(
        `INSERT INTO users (username, role, password_salt, password_hash, fullname, email, phone, address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [username, role, salt, hash, fullname, email, phone, address]
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


// Reviews helpers

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

// Rezervacije helpers

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

// Korisnik ima li makar jednu  ODOBRENU rezervaciju?
function hasUserReservation(userId, requirePast = false) {
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
  parking, males, females, leash, runaway, fears, mobility, vaccinated,
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
           adresa, telefon,
           parking, males, females, leash, runaway, fears, mobility, vaccinated,
           user_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`,
        [
          datum, start, end, trajanje_min,
          ime_prezime, ime_zivotinje, vrsta_zivotinje, napomena ?? '',
          adresa ?? '', telefon ?? '',
          parking ?? null, males ?? null, females ?? null, leash ?? null,
          runaway ?? null, fears ?? null, mobility ?? null, vaccinated ?? null,
          user_id ?? null,
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
                adresa, telefon, status, user_id,
                parking, males, females, leash, runaway, fears, mobility, vaccinated
           FROM rezervacije
       ORDER BY datum ASC, start_minutes ASC`
      );
      resolve(result.rows);
    } catch (e) {
      reject(e);
    }
  });
}

// Pet profiles helpers

function getPetProfile(userId, petName, petType) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(
        `SELECT id, user_id, pet_name, pet_type, address, phone, notes,
                parking, males, females, leash, runaway, fears, mobility, vaccinated,
                created_at, updated_at
           FROM pet_profiles
          WHERE user_id = $1 AND LOWER(pet_name) = LOWER($2) AND LOWER(pet_type) = LOWER($3)`,
        [userId, petName, petType]
      );
      resolve(result.rows[0] || null);
    } catch (e) {
      reject(e);
    }
  });
}

function savePetProfile({
  userId, petName, petType, address, phone, notes,
  parking, males, females, leash, runaway, fears, mobility, vaccinated
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await getPetProfile(userId, petName, petType);
      
      if (existing) {
        // Update existing profile
        const result = await pool.query(
          `UPDATE pet_profiles
              SET address = $1, phone = $2, notes = $3,
                  parking = $4, males = $5, females = $6, leash = $7,
                  runaway = $8, fears = $9, mobility = $10, vaccinated = $11,
                  updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
         RETURNING id`,
          [address, phone, notes, parking, males, females, leash, runaway, fears, mobility, vaccinated, existing.id]
        );
        resolve({ id: result.rows[0].id, updated: true });
      } else {
        // Insert new profile
        const result = await pool.query(
          `INSERT INTO pet_profiles
            (user_id, pet_name, pet_type, address, phone, notes,
             parking, males, females, leash, runaway, fears, mobility, vaccinated)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id`,
          [userId, petName, petType, address, phone, notes, parking, males, females, leash, runaway, fears, mobility, vaccinated]
        );
        resolve({ id: result.rows[0].id, created: true });
      }
    } catch (e) {
      reject(e);
    }
  });
}

function listUserPetProfiles(userId) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(
        `SELECT id, pet_name, pet_type, address, phone, notes,
                parking, males, females, leash, runaway, fears, mobility, vaccinated,
                created_at, updated_at
           FROM pet_profiles
          WHERE user_id = $1
       ORDER BY updated_at DESC`,
        [userId]
      );
      resolve(result.rows);
    } catch (e) {
      reject(e);
    }
  });
}


// Exports

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
  // pet profiles
  getPetProfile, savePetProfile, listUserPetProfiles,
};
