
// register.js
const API = "http://localhost:3000";

document.getElementById("reg-btn").addEventListener("click", async () => {
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!username || !password || password.length < 6) {
    alert("Unesite korisničko ime i lozinku (min 6).");
    return;
  }

  try {
    const r = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const j = await r.json();
    if (!r.ok) return alert(j.error || "Registracija nije uspjela.");

    // (Opcionalno) automatski login odmah nakon registracije:
    const lr = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const lj = await lr.json();
    if (lr.ok) {
      localStorage.setItem("auth_token", lj.token);
      localStorage.setItem("auth_user", JSON.stringify(lj.user));
      if (typeof applyNavAuthState === "function") applyNavAuthState();
      alert(`Dobrodošli, ${lj.user.username}!`);
      // redirect: običan user -> reviews
      if (lj.user.role === "admin") location.href = "admin.html";
      else location.href = "reviews.html";
      return;
    }

    // fallback: bez auto-login
    alert("Nalog kreiran. Sada se možete prijaviti.");
    location.href = "login.html";
  } catch (e) {
    console.error(e);
    alert("Greška pri komunikaciji sa serverom.");
  }
});
