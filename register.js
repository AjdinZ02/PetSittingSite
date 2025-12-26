
// ===========================
// register.js (robustna + debug)
// ===========================

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

function safeJSON(res) { return res.json().catch(() => null); }
function setAuth(token, user) {
  try {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    if (typeof window.applyNavAuthState === "function") window.applyNavAuthState();
  } catch {}
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[register.js] DOM ready");

  const form       = document.getElementById("registerForm");
  const btn        = document.getElementById("reg-btn");
  const usernameEl = document.getElementById("reg-username");
  const emailEl    = document.getElementById("reg-email");
  const phoneEl    = document.getElementById("reg-phone");
  const addressEl  = document.getElementById("reg-address");
  const passwordEl = document.getElementById("reg-password");

  if (!form || !btn) {
    console.error("[register.js] Form ili dugme nije pronađeno.");
    return;
  }

  // Spriječi svaki default submit (Enter u polju, sl.)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    btn.click();
  });

  btn.addEventListener("click", async () => {
    console.log("[register.js] Klik na 'Kreiraj nalog'"); // DEBUG

    const username = (usernameEl?.value || "").trim();
    const email    = (emailEl?.value || "").trim();
    const phone    = (phoneEl?.value || "").trim();
    const address  = (addressEl?.value || "").trim();
    const password = passwordEl?.value || "";

    if (!username ||
        !password || password.length < 6 ||
        !emailRegex.test(email) ||
        !phoneRegex.test(phone) ||
        !address || address.length < 5) {
      try { toast.warn("Popunite: korisničko ime, lozinka (min 6), ispravan email, telefon i adresu (min 5)."); } catch {}
      return;
    }

    try {
      // 1) Registracija
      const r = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email, phone, address }),
      });
      const j = await safeJSON(r);

      if (!r.ok) {
        try { toast.error((j && j.error) || "Registracija nije uspjela."); } catch {}
        return;
      }

      // 2) Pokušaj auto-login (ne blokira dalje)
      try {
        const lr = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (lr.ok) {
          const lj = await safeJSON(lr);
          if (lj?.token && lj?.user) {
            setAuth(lj.token, lj.user);
            try { toast.success(`Dobrodošli, ${lj.user.username}!`); } catch {}
          } else {
            try { toast.info("Nalog je kreiran. Sada se možete prijaviti."); } catch {}
          }
        } else {
          try { toast.info("Nalog je kreiran. Sada se možete prijaviti."); } catch {}
        }
      } catch (e) {
        console.error(e);
        try { toast.info("Nalog je kreiran."); } catch {}
      }

      
// 3) Garantovana navigacija (apsolutna putanja + replace)
try {
  // 1) Log da vidimo kuda pokušavamo ići
  const target = new URL('index.html', window.location.origin + window.location.pathname).toString();
  console.log('[register.js] Redirect ->', target);

  // 2) Mali delay da se eventualni toast prikaže pa navigacija krene sigurno
  setTimeout(() => {
    // .replace() da izbjegnemo "back" na register.html
    window.location.replace(target);
  }, 50);
} catch (navErr) {
  console.error('[register.js] Navigation error', navErr);
  // Fallback – pokušaj još jednom sa origin + root
  window.location.replace(window.location.origin + '/index.html');
}


    } catch (e) {
      console.error(e);
      try { toast.error("Greška pri komunikaciji sa serverom."); } catch {}
    }
  });
});
