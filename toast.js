
// toast.js (robustna verzija bez grešaka i bez ikakvog vanjskog oslanjanja)
(function () {
  const ROOT_ID = 'toast-root';

  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      root.setAttribute('aria-live', 'polite');
      root.setAttribute('aria-atomic', 'true');
      root.style.cssText = [
        'position:fixed',
        'top:20px',
        'right:20px',
        'z-index:9999',
        'display:flex',
        'flex-direction:column',
        'gap:10px',
        'pointer-events:none'
      ].join(';');
      document.body.appendChild(root);
    }
    return root;
  }

  function makeToast(type, message, opts = {}) {
    const root = ensureRoot();

    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.style.cssText = [
      'pointer-events:auto',
      'min-width:280px',
      'max-width:420px',
      'padding:12px 14px',
      'border-radius:12px',
      'color:#fff',
      'background:rgba(17,17,17,.92)',
      'backdrop-filter:blur(6px)',
      'box-shadow:0 14px 32px rgba(0,0,0,.25)',
      'border:1px solid rgba(255,255,255,.08)',
      'display:grid',
      'grid-template-columns:auto 1fr auto',
      'gap:12px',
      'align-items:start',
      'opacity:0',
      'transform:translateY(-6px)',
      'transition:opacity .15s ease, transform .15s ease'
    ].join(';');

    const iconMap = { success: '✅', error: '⛔', warn: '⚠️', info: 'ℹ️' };
    const icon = document.createElement('span');
    icon.textContent = iconMap[type] || iconMap.info;

    const text = document.createElement('div');
    text.textContent = message || '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Zatvori');
    closeBtn.style.cssText = [
      'background:transparent',
      'border:none',
      'color:#fff',
      'font-size:18px',
      'line-height:1',
      'cursor:pointer',
      'padding:0',
      'margin:0'
    ].join(';');

    el.appendChild(icon);
    el.appendChild(text);
    el.appendChild(closeBtn);
    root.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    function close() {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-6px)';
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 150);
    }

    closeBtn.addEventListener('click', close);

    const timeout = typeof opts.timeout === 'number'
      ? opts.timeout
      : (type === 'error' ? 6000 : 4200);

    if (!opts.sticky) setTimeout(close, timeout);

    return { close, el };
  }

  window.toast = {
    success: (msg, opts) => makeToast('success', msg, opts),
    error:   (msg, opts) => makeToast('error',   msg, opts),
    info:    (msg, opts) => makeToast('info',    msg, opts),
    warn:    (msg, opts) => makeToast('warn',    msg, opts)
  };
})();
