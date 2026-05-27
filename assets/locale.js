/* =========================================================
   UQT  ·  Locale layer
   ---------------------------------------------------------
   - Nav language switcher (open/close, keyboard)
   - IP-based suggestion banner (one-time per visitor)
   - Sets <html lang> when a real translation is picked
   ========================================================= */
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const switchBtn = $('#lang-switch');
  const menu      = $('#lang-menu');
  const banner    = $('#lang-banner');
  if (!switchBtn || !menu) return;

  const opts = $$('.lang-opt', menu);

  // ---------------------------------------------------------
  // Available languages
  // ---------------------------------------------------------
  const langs = {
    en: { code: 'EN', label: 'English',  available: true,  dir: 'ltr' },
    ar: { code: 'AR', label: 'العربية',  available: false, dir: 'rtl' },
    fr: { code: 'FR', label: 'Français', available: false, dir: 'ltr' },
    es: { code: 'ES', label: 'Español',  available: false, dir: 'ltr' },
    zh: { code: 'ZH', label: '中文',     available: false, dir: 'ltr' },
    hi: { code: 'HI', label: 'हिंदी',     available: false, dir: 'ltr' },
  };

  const setActive = (code) => {
    const lang = langs[code];
    if (!lang) return;
    switchBtn.querySelector('.lang-code').textContent = lang.code;
    opts.forEach(o => o.classList.toggle('active', o.dataset.lang === code));
    if (lang.available) {
      document.documentElement.lang = code === 'en' ? 'en-GB' : code;
      document.documentElement.dir = lang.dir;
      localStorage.setItem('uqt-lang', code);
    }
  };

  // ---------------------------------------------------------
  // Switcher open/close
  // ---------------------------------------------------------
  const openMenu = () => {
    menu.hidden = false;
    switchBtn.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    menu.hidden = true;
    switchBtn.setAttribute('aria-expanded', 'false');
  };

  switchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden ? openMenu() : closeMenu();
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !switchBtn.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      closeMenu();
      switchBtn.focus();
    }
  });

  opts.forEach(opt => {
    opt.addEventListener('click', () => {
      const lang = opt.dataset.lang;
      const status = opt.dataset.status;
      if (status === 'soon') {
        // gentle nudge — show "coming soon" feedback briefly
        opt.style.transition = 'opacity .2s';
        opt.style.opacity = '0.4';
        setTimeout(() => { opt.style.opacity = ''; }, 320);
        return;
      }
      setActive(lang);
      closeMenu();
    });
  });

  // restore previously-chosen language
  const saved = localStorage.getItem('uqt-lang');
  if (saved && langs[saved]?.available) setActive(saved);

  // ---------------------------------------------------------
  // IP-based suggestion banner
  // ---------------------------------------------------------
  const COUNTRY_TO_LANG = {
    // MENA → Arabic (banner suggests once Arabic is shipped)
    AE: 'ar', SA: 'ar', QA: 'ar', KW: 'ar', BH: 'ar', OM: 'ar',
    JO: 'ar', LB: 'ar', EG: 'ar', MA: 'ar', TN: 'ar', DZ: 'ar', IQ: 'ar', SY: 'ar',
    // Francophone
    FR: 'fr', BE: 'fr', LU: 'fr', CH: 'fr', SN: 'fr', CI: 'fr', MC: 'fr',
    // Hispanophone
    ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', UY: 'es',
    // Sinophone
    CN: 'zh', HK: 'zh', TW: 'zh', SG: 'zh',
    // Hindi
    IN: 'hi',
  };

  const COUNTRY_NAMES = {
    AE: 'the UAE', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain',
    OM: 'Oman', JO: 'Jordan', LB: 'Lebanon', EG: 'Egypt', MA: 'Morocco',
    FR: 'France', BE: 'Belgium', LU: 'Luxembourg', CH: 'Switzerland',
    ES: 'Spain', MX: 'Mexico', AR: 'Argentina', CO: 'Colombia', CL: 'Chile',
    CN: 'China', HK: 'Hong Kong', TW: 'Taiwan', SG: 'Singapore',
    IN: 'India',
  };

  const bannerDismissed = () => localStorage.getItem('uqt-lang-banner-dismissed') === '1';
  const dismissBanner = () => {
    localStorage.setItem('uqt-lang-banner-dismissed', '1');
    banner?.classList.remove('show');
    setTimeout(() => banner && (banner.hidden = true), 450);
  };

  $('#lang-banner-close')?.addEventListener('click', dismissBanner);

  const showBanner = (country, suggested) => {
    if (!banner || bannerDismissed()) return;
    const lang = langs[suggested];
    if (!lang) return;
    const txt = $('#lang-banner-text');
    const cta = $('#lang-banner-cta');
    const countryName = COUNTRY_NAMES[country] || 'your region';
    if (lang.available) {
      txt.textContent = `It looks like you're visiting from ${countryName}. Would you like to switch to ${lang.label}?`;
      cta.textContent = `Switch to ${lang.label}`;
      cta.onclick = () => {
        setActive(suggested);
        dismissBanner();
      };
    } else {
      txt.innerHTML = `It looks like you're visiting from ${countryName}. <b>${lang.label}</b> is coming soon — we'll let you know.`;
      cta.textContent = 'Notify me';
      cta.onclick = () => {
        window.location.href = `mailto:hello@uqt.ae?subject=Notify%20me%20when%20${encodeURIComponent(lang.label)}%20is%20available`;
        dismissBanner();
      };
    }
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add('show'));
  };

  // Detect once, cache the result for 7 days
  const cacheKey = 'uqt-geo';
  const cacheTtl = 7 * 24 * 60 * 60 * 1000;

  const tryDetect = async () => {
    if (bannerDismissed()) return;
    if (saved && langs[saved]?.available) return; // user has already chosen

    let geo = null;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && (Date.now() - cached.t) < cacheTtl) geo = cached;
    } catch {}

    if (!geo) {
      try {
        const r = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        if (!data || !data.country_code) return;
        geo = { country: data.country_code, t: Date.now() };
        try { localStorage.setItem(cacheKey, JSON.stringify(geo)); } catch {}
      } catch {
        return;
      }
    }

    const country = geo.country;
    const suggested = COUNTRY_TO_LANG[country];
    if (!suggested) return; // English visitor, no banner

    // delay so it doesn't fight the page reveal
    setTimeout(() => showBanner(country, suggested), 1800);
  };

  // kick off detection after window loads
  if (document.readyState === 'complete') {
    tryDetect();
  } else {
    window.addEventListener('load', tryDetect);
  }
})();
