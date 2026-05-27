/* =========================================================
   UQT  ·  Interaction layer
   ---------------------------------------------------------
   Each module is intentional. Every interaction earns
   its place by improving clarity, credibility, or action.
   ========================================================= */

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- 1. Nav: scroll state, hide-on-scroll-down, active section ---------- */
  const nav = $('#nav');
  const navLinks = $$('.nav-links a');
  const indicator = $('.nav-indicator');
  let lastY = 0;

  const updateNav = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 32);
    if (y > 600 && y > lastY + 4) {
      nav.classList.add('hidden');
    } else if (y < lastY - 4) {
      nav.classList.remove('hidden');
    }
    lastY = y;
  };
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  const moveIndicator = (link) => {
    if (!link || !indicator) return;
    const rect = link.getBoundingClientRect();
    const parentRect = link.parentElement.getBoundingClientRect();
    indicator.style.width = rect.width + 'px';
    indicator.style.transform = `translateX(${rect.left - parentRect.left}px)`;
    indicator.style.opacity = '0.85';
  };

  /* active section observer */
  const sections = $$('section[id]');
  const linkBySection = new Map(
    navLinks.map(a => [a.getAttribute('href').replace('#', ''), a])
  );
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const link = linkBySection.get(e.target.id);
      if (!link) return;
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        moveIndicator(link);
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => sectionObs.observe(s));

  /* ---------- 2. Mobile menu ---------- */
  const ham = $('#hamburger');
  const mm = $('#mobile-menu');
  if (ham && mm) {
    ham.addEventListener('click', () => {
      const open = mm.classList.toggle('open');
      ham.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mm.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mm.classList.remove('open');
        ham.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- 3. Sticky mobile CTA ---------- */
  const stickyCta = $('#sticky-cta');
  if (stickyCta) {
    const hero = $('#hero');
    const final = $('#final-cta');
    const ctaObs = new IntersectionObserver(() => {
      const heroVisible = hero.getBoundingClientRect().bottom > 0;
      const finalVisible = final.getBoundingClientRect().top < window.innerHeight;
      stickyCta.classList.toggle('show', !heroVisible && !finalVisible);
    }, { threshold: [0, 0.1] });
    ctaObs.observe(hero);
    ctaObs.observe(final);
    window.addEventListener('scroll', () => {
      const heroVisible = hero.getBoundingClientRect().bottom > 0;
      const finalVisible = final.getBoundingClientRect().top < window.innerHeight;
      stickyCta.classList.toggle('show', !heroVisible && !finalVisible);
    }, { passive: true });
  }

  /* ---------- 4. Scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- 5. Hero: parallax + line draw-on + live counter ---------- */
  if (!reducedMotion) {
    const farLayer = $('.hero-stars');
    const midLayer = $('.hero-rings');
    const fgLayer = $('.graphic');
    const onScroll = () => {
      const y = Math.min(window.scrollY, 1400);
      if (farLayer) farLayer.style.transform = `translate3d(0, ${y * 0.04}px, 0)`;
      if (midLayer) midLayer.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
      if (fgLayer)  fgLayer.style.transform  = `translate3d(0, ${y * -0.06}px, 0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  $$('.g-line.draw').forEach((p, i) => {
    try {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.transition = `stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)`;
      p.style.transitionDelay = (0.5 + i * 0.13) + 's';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        p.style.strokeDashoffset = 0;
      }));
    } catch (e) { /* ignore */ }
  });

  /* live counter inside hero center node */
  const heroCounter = $('#hero-counter');
  if (heroCounter) {
    let n = 1247;
    const tick = () => {
      n += Math.floor(Math.random() * 3) + 1;
      heroCounter.textContent = n.toLocaleString();
    };
    setInterval(tick, 3400);
  }

  /* ---------- 6. Animated counters (trust strip + why-uqt) ---------- */
  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const dur = 1600;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const v = easeOutQuart(p) * target;
      el.firstChild.nodeValue = decimals
        ? v.toFixed(decimals)
        : Math.round(v).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.firstChild.nodeValue = (decimals ? target.toFixed(decimals) : target.toLocaleString());
    };
    requestAnimationFrame(step);
  };
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        countUp(e.target);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  $$('[data-count]').forEach(el => counterObs.observe(el));

  /* ---------- 7. Tabs (Solutions) ---------- */
  const tabBars = $$('.tab-bar');
  tabBars.forEach((bar) => {
    const buttons = $$('.tab-btn', bar);
    const indicator = $('.tab-indicator', bar);
    const panels = $$('.tab-panel', bar.parentElement);

    const setActive = (key) => {
      buttons.forEach(b => b.classList.toggle('active', b.dataset.tab === key));
      panels.forEach(p => p.classList.toggle('active', p.dataset.tab === key));
      const active = buttons.find(b => b.classList.contains('active'));
      if (active && indicator) {
        const rect = active.getBoundingClientRect();
        const parentRect = bar.getBoundingClientRect();
        indicator.style.width = rect.width + 'px';
        indicator.style.transform = `translateX(${rect.left - parentRect.left + bar.scrollLeft}px)`;
      }
    };

    buttons.forEach(b => b.addEventListener('click', () => setActive(b.dataset.tab)));
    // init
    requestAnimationFrame(() => setActive(buttons[0].dataset.tab));
    window.addEventListener('resize', () => {
      const active = buttons.find(b => b.classList.contains('active'));
      if (active) setActive(active.dataset.tab);
    });
  });

  /* ---------- 8. Sticky scrollytelling ---------- */
  const scrolly = $('.scrolly');
  if (scrolly) {
    const steps = $$('.scrolly-step', scrolly);
    const states = $$('.scrolly-state', scrolly);
    const bars = $$('.scrolly-step-bar', scrolly);
    const setActive = (idx) => {
      steps.forEach((s, i) => s.classList.toggle('active', i === idx));
      states.forEach((s, i) => s.classList.toggle('active', i === idx));
      bars.forEach((b, i) => {
        b.classList.toggle('active', i === idx);
        b.classList.toggle('passed', i < idx);
      });
    };
    const sObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = steps.indexOf(e.target);
          setActive(idx);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(s => sObs.observe(s));
    setActive(0);
  }

  /* ---------- 9. Matching engine: bars fill on view + refresh shuffle ---------- */
  const meRows = $$('.me-row');
  const meObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        meRows.forEach((row, i) => {
          setTimeout(() => row.classList.add('in'), i * 90);
        });
        meObs.disconnect();
      }
    });
  }, { threshold: 0.3 });
  if (meRows.length) meObs.observe(meRows[0]);

  const meRefresh = $('.me-refresh');
  if (meRefresh) {
    meRefresh.addEventListener('click', () => {
      meRefresh.classList.add('spin');
      meRows.forEach((row, i) => {
        const bar = $('.bar i', row);
        const pct = $('.pct', row);
        bar.style.width = '0%';
        setTimeout(() => {
          const cur = parseInt(row.style.getPropertyValue('--w') || '80', 10);
          const next = Math.max(60, Math.min(98, cur + (Math.floor(Math.random() * 7) - 3)));
          row.style.setProperty('--w', next + '%');
          bar.style.width = next + '%';
          pct.textContent = next + '%';
        }, 250 + i * 80);
      });
      setTimeout(() => meRefresh.classList.remove('spin'), 700);
    });
  }

  /* ---------- 10. Specialists: expand on click ---------- */
  $$('.agent').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const wasOpen = card.classList.contains('open');
      $$('.agent').forEach(c => c.classList.remove('open'));
      if (!wasOpen) card.classList.add('open');
    });
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  /* ---------- 11. Coverage region pills ---------- */
  const pills = $$('.region-pill');
  const crTotal = $('#cr-total');
  const crBreakdown = $('#cr-breakdown');
  const data = {
    global: { total: 218, breakdown: { banking: 96, fx: 72, digital: 50 } },
    'emea':   { total: 86,  breakdown: { banking: 42, fx: 28, digital: 16 } },
    'mena':   { total: 54,  breakdown: { banking: 26, fx: 18, digital: 10 } },
    'apac':   { total: 41,  breakdown: { banking: 18, fx: 14, digital: 9 } },
    'amer':   { total: 37,  breakdown: { banking: 16, fx: 12, digital: 9 } },
  };
  const renderCoverage = (key) => {
    const d = data[key];
    if (!d || !crTotal || !crBreakdown) return;
    // animate the number
    const cur = parseInt(crTotal.dataset.cur || '0', 10);
    const target = d.total;
    const dur = 700, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.round(cur + (target - cur) * easeOutQuart(p));
      crTotal.firstChild.nodeValue = v;
      if (p < 1) requestAnimationFrame(step);
      else crTotal.dataset.cur = target;
    };
    requestAnimationFrame(step);

    const max = Math.max(...Object.values(d.breakdown));
    $$('.cr-bar-row').forEach(row => {
      const k = row.dataset.k;
      const v = d.breakdown[k] || 0;
      const bar = $('.bar i', row);
      const val = $('.v', row);
      bar.style.width = (v / max * 100) + '%';
      val.textContent = v;
    });
  };
  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      renderCoverage(p.dataset.region);
    });
  });
  // init once visible
  if (crTotal) {
    const covObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          renderCoverage('global');
          covObs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    covObs.observe(crTotal);
  }

  /* ---------- 12. FAQ accordion ---------- */
  $$('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const wasOpen = item.classList.contains('open');
      $$('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ---------- 13. Smooth anchor scroll with nav offset ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const t = document.querySelector(href);
      if (!t) return;
      e.preventDefault();
      const navH = 72;
      const top = t.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

})();
