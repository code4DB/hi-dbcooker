/* ════════════════════════════════════════════════════════
   DBCooker Homepage  —  main.js  v4
   Code-rain canvas · Typewriter hero · Reveal · Nav
════════════════════════════════════════════════════════ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 0. Word-cloud canvas (scrolls with page) ──────────── */
(function initCodeCloud() {
  if (REDUCED) return;

  const canvas = document.getElementById('cloud-canvas');
  const ctx    = canvas.getContext('2d');

  const TOKENS = [
    'SELECT','FROM','WHERE','JOIN','INDEX','INSERT','UPDATE','DELETE',
    'CREATE','TABLE','HAVING','LIMIT','DISTINCT','VACUUM','EXPLAIN',
    'Datum','palloc','pfree','ereport','HeapTuple','pg_proc','pg_am',
    'BTREE','GIN','GIST','BRIN','HASH',
    'int32','int64','uint32','bool','char*','void*',
    '#define','typedef','struct','enum','inline','static','const',
    'sqlite3','SQLITE_OK','DataChunk','VARCHAR','INTEGER','DOUBLE',
    'malloc','free','memcpy','NULL','return','true','false',
  ];

  const COLORS = ['#00FF41', '#00D4FF', '#FFC83C'];

  let W, H, words = [];

  function pageH() {
    return Math.max(document.body.scrollHeight, H * 2);
  }

  function buildWords() {
    const pH = pageH();
    words = TOKENS.map(text => ({
      text,
      bx:     Math.random() * W,
      by:     Math.random() * pH,          // spread across full page height
      size:   10 + Math.floor(Math.random() * 18),
      angle:  (Math.random() - 0.5) * 0.65,
      color:  COLORS[Math.floor(Math.random() * COLORS.length)],
      base:   0.08 + Math.random() * 0.20,
      phase:  Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 28,
      driftY: (Math.random() - 0.5) * 20,
      period: 3000 + Math.random() * 5000,
    }));
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildWords();
  }

  let last = 0;
  function tick(ts) {
    if (ts - last < 50) { requestAnimationFrame(tick); return; }
    last = ts;

    ctx.clearRect(0, 0, W, H);
    const scrollY = window.scrollY;
    const t = Date.now();

    words.forEach(w => {
      // Convert page-space Y to viewport Y
      const vy = w.by - scrollY;
      if (vy < -40 || vy > H + 40) return;   // cull off-screen tokens

      const wave  = Math.sin(t / w.period * Math.PI * 2 + w.phase);
      const alpha = w.base * Math.abs(wave);
      if (alpha < 0.005) return;

      const ox = w.driftX * Math.sin(t / 4000 + w.phase);
      const oy = w.driftY * Math.cos(t / 5500 + w.phase);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = w.color;
      ctx.font        = `${w.size}px "JetBrains Mono", monospace`;
      ctx.translate(w.bx + ox, vy + oy);
      ctx.rotate(w.angle);
      ctx.fillText(w.text, 0, 0);
      ctx.restore();
    });

    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(tick);
})();

/* ── 1. Hero particle glow ─────────────────────────────── */
(function initHeroParticles() {
  if (REDUCED) return;

  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  const heroEl = document.getElementById('hero');

  const PCOLS = [[255,255,255],[0,212,255],[120,160,255],[180,220,255]];
  let W, H, ptcls = [];

  function makePtcl(maxY) {
    const c = PCOLS[Math.floor(Math.random() * PCOLS.length)];
    return {
      x: Math.random() * W,
      y: Math.random() * (maxY || H * 0.7),
      r: 0.7 + Math.random() * 2.0,
      c, vx: (Math.random() - 0.5) * 0.22,
      vy: -(0.07 + Math.random() * 0.25),
      a: 0.35 + Math.random() * 0.55,
      life: Math.floor(Math.random() * 5000),
      maxLife: 5000 + Math.random() * 7000,
    };
  }

  function heroBottom() {
    return heroEl ? Math.max(0, heroEl.getBoundingClientRect().bottom) : 0;
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (!ptcls.length)
      ptcls = Array.from({ length: 75 }, () => makePtcl(heroBottom() || H * 0.7));
  }

  let last = 0;
  function tick(ts) {
    if (ts - last < 50) { requestAnimationFrame(tick); return; }
    last = ts;

    const yClip = heroBottom();
    // Gentle fade trail
    ctx.fillStyle = 'rgba(6,9,18,0.055)';
    ctx.fillRect(0, 0, W, Math.max(yClip, H));

    ptcls.forEach((p, i) => {
      p.life += 50;
      if (p.life >= p.maxLife || p.y < -6) {
        ptcls[i] = makePtcl(yClip || H * 0.7); return;
      }
      if (p.y > yClip) { p.x += p.vx; p.y += p.vy; return; }
      const fade  = Math.min(p.life / 1200, 1) * Math.max(0, (p.maxLife - p.life) / 1500);
      const alpha = p.a * Math.min(fade, 1);
      if (alpha < 0.02) { p.x += p.vx; p.y += p.vy; return; }
      const [r, g, b] = p.c;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur  = p.r * 7;
      ctx.shadowColor = `rgb(${r},${g},${b})`;
      ctx.fillStyle   = `rgb(${r},${g},${b})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      p.x += p.vx; p.y += p.vy;
    });

    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(tick);
})();

/* ── (Code rain — commented out) ───────────────────────── */
/*
(function initCodeRain() {
  if (REDUCED) return;

  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  const heroEl = document.getElementById('hero');

  const CHARS = 'SELECTFROMWHEREJOININDEXINSERTUPDATEDELETECREATETABLEdbsql01{}[];()><*=_#@';
  const FS = 14, SKIP = 4;
  const SLOPE = 0.32;
  const VDOWN = 2.2;
  let W, H, drops = [];

  const PCOLS = [[255,255,255],[0,212,255],[120,160,255],[180,220,255]];
  let ptcls = [];

  function makePtcl(maxY) {
    const c = PCOLS[Math.floor(Math.random() * PCOLS.length)];
    return {
      x: Math.random() * W,
      y: Math.random() * (maxY || H * 0.7),
      r: 0.7 + Math.random() * 2.0,
      c, vx: (Math.random() - 0.5) * 0.22,
      vy: -(0.07 + Math.random() * 0.25),
      a: 0.35 + Math.random() * 0.55,
      life: Math.floor(Math.random() * 5000),
      maxLife: 5000 + Math.random() * 7000,
    };
  }

  function heroBottom() {
    return heroEl ? Math.max(0, heroEl.getBoundingClientRect().bottom) : 0;
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const hb = heroBottom();
    const total = Math.floor(W / (FS * SKIP));
    drops = Array.from({ length: total }, () => ({
      x: Math.random() * W,
      y: hb + Math.random() * (H - hb)
    }));
    if (!ptcls.length)
      ptcls = Array.from({ length: 75 }, () => makePtcl(hb || H * 0.7));
  }

  let last = 0;
  function tick(ts) {
    if (ts - last < 50) { requestAnimationFrame(tick); return; }
    last = ts;
    const yClip = heroBottom();
    ctx.fillStyle = 'rgba(6,9,18,0.055)';
    ctx.fillRect(0, 0, W, yClip);
    ptcls.forEach((p, i) => {
      p.life += 50;
      if (p.life >= p.maxLife || p.y < -6) { ptcls[i] = makePtcl(yClip || H * 0.7); return; }
      if (p.y > yClip) { p.x += p.vx; p.y += p.vy; return; }
      const fade  = Math.min(p.life / 1200, 1) * Math.max(0, (p.maxLife - p.life) / 1500);
      const alpha = p.a * Math.min(fade, 1);
      if (alpha < 0.02) { p.x += p.vx; p.y += p.vy; return; }
      const [r, g, b] = p.c;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur  = p.r * 7;
      ctx.shadowColor = `rgb(${r},${g},${b})`;
      ctx.fillStyle   = `rgb(${r},${g},${b})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      p.x += p.vx; p.y += p.vy;
    });
    ctx.fillStyle = 'rgba(6,9,18,0.10)';
    ctx.fillRect(0, yClip, W, H - yClip);
    ctx.font = `${FS}px "JetBrains Mono", monospace`;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, yClip, W, H); ctx.clip();
    drops.forEach(drop => {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      const bx1 = drop.x - SLOPE * FS,     by1 = drop.y - FS;
      const bx2 = drop.x - SLOPE * FS * 2, by2 = drop.y - FS * 2;
      if (by1 >= yClip) { ctx.fillStyle = 'rgba(0,140,220,0.28)'; ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], bx1, by1); }
      if (by2 >= yClip) { ctx.fillStyle = 'rgba(0,90,180,0.12)'; ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], bx2, by2); }
      ctx.fillStyle = 'rgba(0,180,255,0.82)';
      ctx.fillText(ch, drop.x, drop.y);
      if (Math.random() > 0.97) { ctx.fillStyle = 'rgba(140,220,255,0.95)'; ctx.fillText(ch, drop.x, drop.y); }
      drop.x += SLOPE * VDOWN;
      drop.y += VDOWN;
      if (drop.y > H + FS * 3 || drop.x > W + 80) { drop.x = Math.random() * W; drop.y = yClip + Math.random() * FS * 2; }
    });
    ctx.restore();
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(tick);
})();
*/

/* ── 2. Typewriter hero text ────────────────────────────── */
(function initTyper() {
  const el = document.getElementById('typer');
  if (!el) return;

  const phrases = [
    'Ships Databases',
    'Cooks Your Kernels',
    // 'Implements Functions',
    // 'Automates Engineering',
  ];

  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ci + 1);
      ci++;
      if (ci === phrase.length) {
        deleting = true;
        setTimeout(tick, 2400);
        return;
      }
      setTimeout(tick, 68);
    } else {
      el.textContent = phrase.slice(0, ci - 1);
      ci--;
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(tick, 380);
        return;
      }
      setTimeout(tick, 32);
    }
  }

  // Start after a short delay so page settles
  setTimeout(tick, 900);
})();

/* ── 3. Workflow robot highlight cycling (Plan → Code → Test → Done) ── */
(function initWorkflow() {
  const items = document.querySelectorAll('.wfr-item');
  if (!items.length) return;
  let current = 0;
  setInterval(() => {
    items[current].classList.remove('active');
    current = (current + 1) % items.length;
    items[current].classList.add('active');
  }, 2200);
})();

/* ── 4. Nav scroll state ────────────────────────────────── */
(function () {
  const nav = document.getElementById('nav');
  const fn  = () => nav.classList.toggle('scrolled', window.scrollY > 32);
  window.addEventListener('scroll', fn, { passive: true });
  fn();
})();

/* ── 5. Active nav link on scroll ──────────────────────── */
(function () {
  const secs  = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-links a');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)
      );
    });
  }, { rootMargin: '-40% 0px -50% 0px' });
  secs.forEach(s => obs.observe(s));
})();

/* ── 6. Terminal lines — static, show immediately ── */
(function () {
  document.querySelectorAll('.tl').forEach(el => {
    el.style.transition = 'none';
    el.classList.add('show');
  });
})();

/* ── 7. Scroll reveal with stagger ─────────────────────── */
(function () {
  // Stagger bento/db/qs cards
  ['.bento', '.db-grid', '.qs-grid'].forEach(sel => {
    const grid = document.querySelector(sel);
    if (!grid) return;
    grid.querySelectorAll('.bc, .db-card, .qs-step').forEach((el, i) => {
      el.style.transitionDelay = REDUCED ? '0ms' : `${i * 45}ms`;
    });
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -20px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ── 8. Logo hex pulse ──────────────────────────────────── */
(function () {
  if (REDUCED) return;
  let t = 0;
  const hexes = document.querySelectorAll('.logo-hex');
  setInterval(() => {
    t += 0.07;
    const s = (4 + Math.sin(t) * 4).toFixed(1);
    const a = (0.35 + Math.sin(t) * 0.35).toFixed(2);
    hexes.forEach(h => h.style.filter = `drop-shadow(0 0 ${s}px rgba(0,212,255,${a}))`);
  }, 48);
})();

/* ── 9. Hero stat counters ──────────────────────────────── */
(function () {
  if (REDUCED) return;
  const nums = document.querySelectorAll('.hstat-n[data-target]');
  let done = false;

  const obs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || done) return;
    done = true;
    nums.forEach((el, i) => {
      const target = parseInt(el.dataset.target, 10);
      let cur = 0;
      const step = () => {
        cur++;
        el.textContent = cur;
        if (cur < target) setTimeout(step, 110);
      };
      setTimeout(step, i * 180);
    });
    obs.disconnect();
  }, { threshold: 0.6 });

  const statsEl = document.querySelector('.hero-stats');
  if (statsEl) obs.observe(statsEl);
})();

/* ── 10. Copy button ────────────────────────────────────── */
function copyCode(btn) {
  const pre = btn.closest('.codebox').querySelector('pre');
  navigator.clipboard.writeText(pre.innerText.trim()).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = '#00D4FF';
    btn.style.borderColor = 'rgba(0,212,255,.4)';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 2000);
  });
}
