// Kaufiko Startseite: Intro-Player, Regler-Demo, Tippen im Kopf, Scroll-Effekte.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Staffelung beim Einlaufen: Geschwister nacheinander.
  $$('.pledge, .packs, .feat, .intro-grid').forEach(function (g) {
    $$('.reveal', g).forEach(function (el, i) { el.style.setProperty('--i', i); });
  });

  // Fortschrittsbalken oben und leichte Bewegung der Formen im Kopf.
  var bar = $('.scrollbar i'), hero = $('.h-hero');
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (hero && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * 60 + 'px');
      hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5) * 60 + 'px');
    });
  }

  // Wechselndes Wort im Kopf: tippen, halten, löschen.
  var typeEl = $('.h-type');
  if (typeEl && !reduce) {
    var words = typeEl.getAttribute('data-words').split(','), wi = 0, ci = words[0].length, del = true, wait = 1800;
    (function step() {
      var w = words[wi];
      if (wait > 0) { var t = wait; wait = 0; return setTimeout(step, t); }
      if (del) { ci--; if (ci <= 0) { del = false; wi = (wi + 1) % words.length; ci = 0; } }
      else { ci++; if (ci >= words[wi].length) { del = true; wait = 1900; } }
      typeEl.textContent = words[wi].slice(0, Math.max(ci, del ? ci : ci)) || ' ';
      setTimeout(step, del ? 45 : 95);
    })();
  }

  // ---------- Intro-Player ----------
  var player = $('#player');
  if (player) {
    var scenes = $$('.scene', player), bars = $$('.story-bars b', player), steps = $$('.intro-steps li');
    var dur = [5200, 5600, 6400, 5800], cur = 0, t = 0, last = performance.now(), held = false, visible = false;
    var typed = $('.s-typed', player), count = $('.s-n', player), pcts = $$('.pct', player), word = 'Saugroboter';
    function show(n) {
      cur = (n + scenes.length) % scenes.length; t = 0;
      scenes.forEach(function (s, k) { s.classList.remove('on'); if (k === cur) { void s.offsetWidth; s.classList.add('on'); } });
      steps.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
      bars.forEach(function (b, k) { b.style.transform = 'scaleX(' + (k < cur ? 1 : 0) + ')'; });
      player.setAttribute('data-scene', cur);
      paint();
    }
    function paint() {
      if (cur === 0 && typed) typed.textContent = word.slice(0, Math.max(0, Math.min(word.length, Math.floor((t - 900) / 130))));
      if (cur === 2 && count) count.textContent = Math.max(0, Math.min(14, Math.floor((t - 700) / 320)));
      if (cur === 3) pcts.forEach(function (p, k) {
        var k01 = Math.max(0, Math.min(1, (t - 900 - k * 250) / 1100)), e = 1 - Math.pow(1 - k01, 3);
        p.textContent = Math.round(+p.getAttribute('data-to') * e) + '%';
      });
    }
    function tick(now) {
      var dt = Math.min(now - last, 100); last = now;
      if (visible && !held) {
        t += dt;
        bars[cur].style.transform = 'scaleX(' + Math.min(1, t / dur[cur]) + ')';
        paint();
        if (t >= dur[cur]) show(cur + 1);
      }
      requestAnimationFrame(tick);
    }
    // Halten pausiert, kurzes Tippen wechselt (links zurück, sonst vor), Wischen ebenso.
    var downAt = 0, downX = 0;
    player.addEventListener('pointerdown', function (e) { held = true; downAt = performance.now(); downX = e.clientX; player.classList.add('paused'); });
    function release(e) {
      if (!held) return; held = false; player.classList.remove('paused');
      var dx = (e.clientX || downX) - downX, quick = performance.now() - downAt < 260;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
      else if (quick && e.type === 'pointerup') { var r = player.getBoundingClientRect(); show(cur + ((e.clientX - r.left) < r.width * .3 ? -1 : 1)); }
    }
    player.addEventListener('pointerup', release); player.addEventListener('pointercancel', release); player.addEventListener('pointerleave', release);
    steps.forEach(function (s, k) { s.addEventListener('click', function () { show(k); }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: .25 }).observe(player);
    else visible = true;
    show(0); requestAnimationFrame(tick);
  }

  // ---------- Regler-Demo: Ranking sortiert sich live ----------
  var rank = $('#demo-rank');
  if (rank) {
    var cards = $$('.dcard', rank), inputs = $$('.demo-sliders input');
    var colors = ['#3D4EF5', '#FF5C39', '#E8B400', '#0B7A55', '#9A45D6'];
    function update(animate) {
      var w = inputs.map(function (i) { return +i.value; }), sum = w.reduce(function (a, b) { return a + b; }, 0) || 1;
      inputs.forEach(function (i) { i.style.setProperty('--p', i.value * 10 + '%'); });
      var first = cards.map(function (c) { return c.getBoundingClientRect().top; });
      cards.forEach(function (c) {
        var s = c.getAttribute('data-s').split(',').map(Number), m = 0, best = 0, bi = 0;
        s.forEach(function (v, k) { var part = w[k] / sum * v / 5; m += part; if (part > best) { best = part; bi = k; } });
        c._m = Math.round(m * 100);
        $('.dpct', c).textContent = c._m + '%';
        var b = $('.dbar i', c); b.style.width = c._m + '%'; b.style.background = colors[bi];
      });
      var order = cards.slice().sort(function (a, b) { return b._m - a._m; });
      order.forEach(function (c, k) { rank.insertBefore(c, rank.children[k]); $('.pos', c).textContent = k + 1; c.classList.toggle('top', k === 0); });
      if (animate && !reduce) cards.forEach(function (c, k) {
        var dy = first[k] - c.getBoundingClientRect().top;
        if (!dy) return;
        c.style.transition = 'none'; c.style.transform = 'translateY(' + dy + 'px)';
        requestAnimationFrame(function () { c.style.transition = 'transform .55s cubic-bezier(.34,1.56,.64,1), border-color .3s'; c.style.transform = ''; });
      });
    }
    inputs.forEach(function (i) { i.addEventListener('input', function () { update(true); }); });
    update(false);
  }
})();
