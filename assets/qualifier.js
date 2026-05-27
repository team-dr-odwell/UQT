/* =========================================================
   UQT  ·  Qualifier modal (60-second match)
   ========================================================= */
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const overlay  = $('#qm-overlay');
  if (!overlay) return;
  const modal    = $('#qm');
  const close    = $('#qm-close');
  const stage    = $('.qm-stage');
  const backBtn  = $('#qm-back');
  const nextBtn  = $('#qm-next');
  const progress = $$('#qm-progress i');
  const steps    = $$('.qm-step');

  const VOLUME_LABELS = [
    'Under £250k',
    '£250k to £1M',
    '£1M to £5M',
    '£5M to £25M',
    '£25M to £100M',
    '£100M to £500M',
    'Over £500M',
  ];

  const state = {
    step: 0,
    sector: null,
    regions: new Set(),
    needs: new Set(),
    volume: 2,
    email: '',
    name: '',
    company: '',
  };

  // -----------------------------------------------------------
  // Open / close
  // -----------------------------------------------------------
  const focusableSel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let lastFocus = null;

  const openModal = () => {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      modal.querySelector(focusableSel)?.focus();
    });
  };

  const closeModal = () => {
    overlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      overlay.hidden = true;
      document.body.style.overflow = '';
      lastFocus?.focus();
    }, 280);
  };

  $$('[data-open-qualifier]').forEach(btn => {
    btn.addEventListener('click', openModal);
  });
  close.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') closeModal();
  });

  // -----------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------
  const showStep = (idx) => {
    state.step = idx;
    steps.forEach((s, i) => s.classList.toggle('active', i === idx));
    progress.forEach((p, i) => {
      p.classList.toggle('active', i === idx && idx < 4);
      p.classList.toggle('passed', i < idx);
    });

    backBtn.hidden = idx === 0 || idx === 4;

    if (idx === 4) {
      // result step
      nextBtn.textContent = 'Book a call →';
      nextBtn.disabled = false;
      nextBtn.onclick = bookCall;
    } else if (idx === 3) {
      nextBtn.innerHTML = 'See my shortlist <span class="arrow" aria-hidden="true">→</span>';
      nextBtn.disabled = false;
      nextBtn.onclick = goNext;
    } else {
      nextBtn.innerHTML = 'Continue <span class="arrow" aria-hidden="true">→</span>';
      nextBtn.onclick = goNext;
      validate();
    }

    requestAnimationFrame(() => {
      steps[idx]?.querySelector(focusableSel)?.focus();
    });
  };

  const goNext = () => {
    if (state.step === 3) renderResult();
    if (state.step < 4) showStep(state.step + 1);
  };

  const goBack = () => {
    if (state.step > 0) showStep(state.step - 1);
  };

  backBtn.addEventListener('click', goBack);

  // -----------------------------------------------------------
  // Step interactions
  // -----------------------------------------------------------
  $$('.qm-chip', stage).forEach(chip => {
    chip.addEventListener('click', () => {
      const field = chip.dataset.field;
      const value = chip.dataset.value;
      const multi = chip.dataset.multi === '1';

      if (multi) {
        const set = state[field];
        if (set.has(value)) {
          set.delete(value);
          chip.classList.remove('selected');
        } else {
          set.add(value);
          chip.classList.add('selected');
        }
      } else {
        $$(`.qm-chip[data-field="${field}"]`, stage).forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        state[field] = value;
        // auto-advance single-select after a beat
        setTimeout(() => { if (state.step === 0) goNext(); }, 220);
      }
      validate();
    });
  });

  const volumeInput = $('#qm-volume');
  const volumeVal = $('#qm-volume-val');
  if (volumeInput) {
    volumeVal.textContent = VOLUME_LABELS[parseInt(volumeInput.value, 10)];
    volumeInput.addEventListener('input', () => {
      state.volume = parseInt(volumeInput.value, 10);
      volumeVal.textContent = VOLUME_LABELS[state.volume];
    });
  }

  ['qm-email', 'qm-name', 'qm-company'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state[id.replace('qm-', '')] = el.value.trim();
    });
  });

  const validate = () => {
    let ok = false;
    if (state.step === 0) ok = !!state.sector;
    if (state.step === 1) ok = state.regions.size > 0;
    if (state.step === 2) ok = state.needs.size > 0;
    if (state.step === 3) ok = true; // optional
    nextBtn.disabled = !ok;
  };

  // -----------------------------------------------------------
  // Illustrative shortlist generator
  // -----------------------------------------------------------
  const POOL = {
    banking: [
      { name: 'Coastal Trust Bank',     sub: 'Multi-currency operating accounts',         region: 'EU/UK' },
      { name: 'Meridian Private',       sub: 'Mainland MENA business banking',            region: 'MENA' },
      { name: 'Argentum Banking',       sub: 'Dedicated IBANs, multi-entity',             region: 'EU' },
      { name: 'Atlantic Commerce',      sub: 'E-commerce settlement, global',             region: 'Global' },
      { name: 'Pacific Reserve',        sub: 'APAC corporate banking',                    region: 'APAC' },
      { name: 'Coral Mainland',         sub: 'UAE AED rails',                             region: 'MENA' },
    ],
    fx: [
      { name: 'Helios FX',              sub: 'Spot, forwards across 38 currencies',       region: 'Global' },
      { name: 'Cross-Border Pay',       sub: 'High-volume payouts',                        region: 'EU/UK' },
      { name: 'Solstice Treasury',      sub: 'Corporate hedging desks',                    region: 'EU' },
      { name: 'Quayside Markets',       sub: 'Emerging-market settlement',                 region: 'APAC' },
      { name: 'Bridgewater FX',         sub: 'Mass payroll FX',                            region: 'Global' },
    ],
    digital: [
      { name: 'Aether Custody',         sub: 'Regulated digital-asset custody',           region: 'MENA' },
      { name: 'Vault One',              sub: 'Cold storage and treasury',                  region: 'EU' },
      { name: 'Polaris Ramps',          sub: 'Fiat on/off ramp',                           region: 'EU' },
      { name: 'Stratos OTC',            sub: 'Block-trade execution desk',                 region: 'Global' },
    ],
  };

  const renderResult = () => {
    const container = $('#qm-result');
    container.innerHTML = '';

    // pick which categories to show based on state.needs
    const cats = [];
    if (state.needs.has('banking') || state.needs.has('treasury') || state.needs.size === 0) cats.push('banking');
    if (state.needs.has('fx') || state.needs.has('payouts')) cats.push('fx');
    if (state.needs.has('digital') || state.needs.has('custody')) cats.push('digital');
    if (!cats.length) cats.push('banking', 'fx');

    // build shortlist (5 rows)
    const picks = [];
    let i = 0;
    while (picks.length < 5) {
      const cat = cats[i % cats.length];
      const pool = POOL[cat];
      const idx = Math.floor(picks.length / cats.length) % pool.length;
      const item = pool[idx];
      if (!picks.find(p => p.name === item.name)) {
        picks.push({ ...item, cat });
      }
      i++;
      if (i > 30) break;
    }

    // assign descending scores 96 → 76
    const scores = [96, 91, 88, 84, 79];
    picks.forEach((p, idx) => {
      const tagLabel = p.cat === 'bank' || p.cat === 'banking' ? 'Banking'
        : p.cat === 'fx' ? 'FX' : 'Digital';
      const tagClass = p.cat === 'banking' ? 'bank' : p.cat === 'fx' ? 'fx' : 'digital';
      const score = scores[idx];
      const row = document.createElement('div');
      row.className = 'qm-result-row';
      row.style.animationDelay = (idx * 90) + 'ms';
      row.style.setProperty('--w', score + '%');
      row.innerHTML = `
        <span class="qmr-num">0${idx + 1}</span>
        <div>
          <div class="qmr-name">${p.name}</div>
          <div class="qmr-sub">${p.sub} · ${p.region}</div>
        </div>
        <span class="qmr-tag ${tagClass}">${tagLabel}</span>
        <span class="qmr-pct"><span class="qmr-bar"><i></i></span>${score}%</span>
      `;
      container.appendChild(row);
      setTimeout(() => row.classList.add('in'), 60 + idx * 90);
    });

    // illustrative scored count
    const scoredCount = $('#qm-scored');
    if (scoredCount) scoredCount.textContent = '218';
  };

  const bookCall = () => {
    const subject = encodeURIComponent('Match shortlist — ' + (state.company || state.sector || 'enquiry'));
    const body = encodeURIComponent([
      'Hi UQT,',
      '',
      'I just ran the 60-second match on your site. Here is what I shared:',
      '',
      `Sector: ${state.sector || '—'}`,
      `Regions: ${[...state.regions].join(', ') || '—'}`,
      `Needs: ${[...state.needs].join(', ') || '—'}`,
      `Annual volume: ${VOLUME_LABELS[state.volume]}`,
      state.company ? `Business: ${state.company}` : '',
      state.name ? `Name: ${state.name}` : '',
      '',
      'Please follow up with a 20-minute call.',
      '',
      'Thanks,',
    ].filter(Boolean).join('\n'));
    window.location.href = `mailto:hello@uqt.ae?subject=${subject}&body=${body}`;
  };

  // init
  showStep(0);
})();
