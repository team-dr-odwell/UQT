/* =========================================================
   UQT  ·  Coverage tool — page interactions
   ---------------------------------------------------------
   Live search across an illustrative provider slice.
   Replace PROVIDERS array when the real index lands.
   ========================================================= */
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const input    = $('#tool-search');
  const clearBtn = $('#tool-clear');
  const grid     = $('#tool-results');
  const empty    = $('#tool-empty');
  const count    = $('#tool-count');
  if (!input || !grid) return;

  // Illustrative slice — designed to feel representative, swap with live index later
  const PROVIDERS = [
    // banking
    { name: 'Coastal Trust Bank',  cat: 'banking', sub: 'Multi-currency operating · IBANs',  region: 'EU/UK',    keys: 'gbp eur multi-currency uk eu corporate' },
    { name: 'Meridian Private',    cat: 'banking', sub: 'Mainland MENA business banking',     region: 'MENA',     keys: 'aed uae mena gcc corporate private' },
    { name: 'Argentum Banking',    cat: 'banking', sub: 'Dedicated IBANs, multi-entity',      region: 'EU/UK',    keys: 'iban multi-entity holding group structured' },
    { name: 'Atlantic Commerce',   cat: 'banking', sub: 'E-commerce settlement, global',      region: 'Global',   keys: 'ecommerce acquiring usd gbp settlement' },
    { name: 'Pacific Reserve',     cat: 'banking', sub: 'APAC corporate banking',             region: 'APAC',     keys: 'sgd hkd jpy singapore hong-kong apac' },
    { name: 'Coral Mainland',      cat: 'banking', sub: 'UAE AED rails',                      region: 'MENA',     keys: 'aed uae dubai mainland local' },
    { name: 'Northwind Treasury',  cat: 'banking', sub: 'High-balance corporate treasury',    region: 'EU/UK',    keys: 'treasury private high-balance gbp' },
    { name: 'Sterling Commerce',   cat: 'banking', sub: 'UK SME, multi-currency',             region: 'EU/UK',    keys: 'uk gbp sme operating' },
    { name: 'Atlas First',         cat: 'banking', sub: 'Americas business banking',          region: 'Americas', keys: 'usd cad latam americas' },

    // fx
    { name: 'Helios FX',           cat: 'fx',      sub: 'Spot, forwards · 38 currencies',     region: 'Global',   keys: 'spot forwards hedging multi-currency' },
    { name: 'Cross-Border Pay',    cat: 'fx',      sub: 'High-volume payouts, payroll',       region: 'EU/UK',    keys: 'payouts payroll batch supplier' },
    { name: 'Solstice Treasury',   cat: 'fx',      sub: 'Corporate hedging programmes',       region: 'EU/UK',    keys: 'hedging treasury forwards options' },
    { name: 'Quayside Markets',    cat: 'fx',      sub: 'Emerging-market settlement',         region: 'APAC',     keys: 'inr try zar brl emerging-markets' },
    { name: 'Bridgewater FX',      cat: 'fx',      sub: 'Mass payroll FX',                    region: 'Global',   keys: 'payroll distributed teams multi-currency' },
    { name: 'Verdant Crossings',   cat: 'fx',      sub: 'Africa corridor specialists',        region: 'Africa',   keys: 'ngn ghs kes africa corridor' },
    { name: 'Lumen Settlement',    cat: 'fx',      sub: 'Same-day cross-border',              region: 'EU/UK',    keys: 'same-day settlement gbp eur swift' },

    // digital
    { name: 'Aether Custody',      cat: 'digital', sub: 'Regulated digital-asset custody',    region: 'MENA',     keys: 'custody btc eth vasp regulated' },
    { name: 'Vault One',           cat: 'digital', sub: 'Cold storage and treasury',          region: 'EU/UK',    keys: 'cold-storage treasury insurance multi-sig' },
    { name: 'Polaris Ramps',       cat: 'digital', sub: 'Fiat on/off ramp · EU',              region: 'EU/UK',    keys: 'ramp on-ramp off-ramp fiat eur' },
    { name: 'Stratos OTC',         cat: 'digital', sub: 'Block-trade execution',              region: 'Global',   keys: 'otc block execution trading desk' },
    { name: 'Beacon Stable',       cat: 'digital', sub: 'Stablecoin treasury rails',          region: 'Global',   keys: 'stablecoin usdc usdt eurc treasury' },
    { name: 'Crescent Markets',    cat: 'digital', sub: 'MENA regulated digital exchange',    region: 'MENA',     keys: 'mena dubai exchange regulated' },
  ];

  let state = { q: '', cat: 'all', region: 'all' };

  const norm = (s) => s.toLowerCase().trim();

  const filtered = () => {
    const q = norm(state.q);
    return PROVIDERS.filter(p => {
      if (state.cat !== 'all' && p.cat !== state.cat) return false;
      if (state.region !== 'all' && p.region !== state.region) return false;
      if (!q) return true;
      return [p.name, p.sub, p.cat, p.region, p.keys].some(v => norm(v).includes(q));
    });
  };

  const tagLabel = (cat) => cat === 'banking' ? 'Banking' : cat === 'fx' ? 'FX' : 'Digital';
  const tagClass = (cat) => cat === 'banking' ? 'bank' : cat === 'fx' ? 'fx' : 'digital';

  const render = () => {
    const list = filtered();
    grid.innerHTML = '';
    list.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'tool-card';
      row.style.animation = 'qm-row-in .4s cubic-bezier(.2,.7,.2,1) both';
      row.style.animationDelay = (i * 25) + 'ms';
      row.innerHTML = `
        <span class="tc-num">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <div class="tc-name">${p.name}</div>
          <div class="tc-sub">${p.sub}</div>
        </div>
        <div class="tc-tags">
          <span class="tc-region">${p.region}</span>
          <span class="tc-tag ${tagClass(p.cat)}">${tagLabel(p.cat)}</span>
        </div>
      `;
      grid.appendChild(row);
    });
    empty.hidden = list.length > 0;
    count.textContent = list.length;
    clearBtn.hidden = !(state.q || state.cat !== 'all' || state.region !== 'all');
  };

  input.addEventListener('input', () => {
    state.q = input.value;
    render();
  });

  clearBtn.addEventListener('click', () => {
    state = { q: '', cat: 'all', region: 'all' };
    input.value = '';
    $$('.tool-filter').forEach(b => {
      const t = b.dataset.filterType;
      b.classList.toggle('active', b.dataset.value === 'all');
    });
    render();
  });

  $$('.tool-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.filterType;
      $$(`.tool-filter[data-filter-type="${t}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[t] = btn.dataset.value;
      render();
    });
  });

  render();
})();
