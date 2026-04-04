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

  const MAX_WORDS = 22;
  let W, H, words = [];

  function makeWord(spawnInside, scrollY = window.scrollY) {
    const fromEdge = Math.random();
    let x = Math.random() * W;
    let y = scrollY + Math.random() * H;

    if (!spawnInside) {
      if (fromEdge < 0.25) {
        x = -80;
        y = scrollY + Math.random() * H;
      } else if (fromEdge < 0.5) {
        x = W + 80;
        y = scrollY + Math.random() * H;
      } else if (fromEdge < 0.75) {
        x = Math.random() * W;
        y = scrollY - 40;
      } else {
        x = Math.random() * W;
        y = scrollY + H + 40;
      }
    }

    return {
      text:  TOKENS[Math.floor(Math.random() * TOKENS.length)],
      x,
      y,
      size:  11 + Math.floor(Math.random() * 12),
      angle: (Math.random() - 0.5) * 0.5,
      rotV:  (Math.random() - 0.5) * 0.003,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.05 + Math.random() * 0.12,
      vx:    (Math.random() - 0.5) * 0.16,
      vy:    (Math.random() - 0.5) * 0.12,
      life:  0,
      maxLife: 3200 + Math.random() * 4200,
    };
  }

  function buildWords() {
    const count = Math.max(12, Math.min(MAX_WORDS, Math.floor(W / 70)));
    words = Array.from({ length: count }, () => makeWord(true));
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

    words.forEach((w, i) => {
      w.life += 50;
      const vy = w.y - scrollY;
      if (
        w.life >= w.maxLife ||
        w.x < -140 || w.x > W + 140 ||
        vy < -120 || vy > H + 120
      ) {
        words[i] = makeWord(false, scrollY);
        return;
      }

      const fadeIn = Math.min(1, w.life / 900);
      const fadeOut = Math.min(1, (w.maxLife - w.life) / 1300);
      const alpha = w.alpha * Math.min(fadeIn, fadeOut);
      if (alpha < 0.01) {
        w.x += w.vx;
        w.y += w.vy;
        w.angle += w.rotV;
        return;
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = w.color;
      ctx.font        = `${w.size}px "JetBrains Mono", monospace`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(w.x, vy);
      ctx.rotate(w.angle);
      ctx.fillText(w.text, 0, 0);
      ctx.restore();

      w.x += w.vx;
      w.y += w.vy;
      w.angle += w.rotV;
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
  const TOKENS = [
    'SELECT', 'JOIN', 'NULL', 'return', 'static', 'const',
    'Datum', 'int32', 'char*', 'sqlite3', '#define',
    '->', '{}', '[]', '()', 'VARCHAR', 'BTREE'
  ];
  let W, H, ptcls = [];

  function makePtcl(maxY) {
    const c = PCOLS[Math.floor(Math.random() * PCOLS.length)];
    const text = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const size = 10 + Math.random() * 8;
    return {
      x: Math.random() * W,
      y: Math.random() * (maxY || H * 0.7),
      text,
      size,
      rot: (Math.random() - 0.5) * 0.22,
      rotV: (Math.random() - 0.5) * 0.0025,
      c, vx: (Math.random() - 0.5) * 0.18,
      vy: -(0.07 + Math.random() * 0.25),
      a: 0.18 + Math.random() * 0.30,
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
    const count = Math.max(20, Math.min(44, Math.floor(W / 34)));
    ptcls = Array.from({ length: count }, () => makePtcl(heroBottom() || H * 0.7));
  }

  let last = 0;
  function tick(ts) {
    if (ts - last < 50) { requestAnimationFrame(tick); return; }
    last = ts;

    const yClip = heroBottom();
    ctx.clearRect(0, 0, W, H);

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
      ctx.shadowBlur  = p.size * 0.55;
      ctx.shadowColor = `rgba(${r},${g},${b},0.32)`;
      ctx.fillStyle   = `rgb(${r},${g},${b})`;
      ctx.font        = `${p.size}px "JetBrains Mono", monospace`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillText(p.text, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
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
(function initHeroVideoFallback() {
  const shell = document.querySelector('.hero-video[data-vimeo-url]');
  const iframe = shell?.querySelector('iframe');
  if (!shell || !iframe) return;

  // Start visible immediately — iframe URL already has autoplay=1&muted=1.
  // Vimeo Player API is used only for enhanced control when available.
  shell.dataset.videoState = 'ready';

  if (!window.Vimeo || typeof window.Vimeo.Player !== 'function') return;

  try {
    const player = new window.Vimeo.Player(iframe);
    player.ready().then(async () => {
      if (typeof player.setMuted === 'function') await player.setMuted(true).catch(() => {});
      if (typeof player.play === 'function') await player.play().catch(() => {});
    }).catch(() => {});
    if (typeof player.on === 'function') {
      player.on('error', () => { shell.dataset.videoState = 'error'; });
    }
  } catch (_) {}
})();

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
