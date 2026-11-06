/* Полярный улов — интерактив лендинга */
(function () {
  'use strict';

  var doc = document;
  doc.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Header ---------------- */
  var header = doc.getElementById('header');

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-stuck', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Mobile menu ---------------- */
  var burger = doc.getElementById('burger');
  var nav = doc.getElementById('nav');

  function setMenu(open) {
    if (!burger || !nav) return;
    burger.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    doc.body.style.overflow = open ? 'hidden' : '';
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1100 && nav.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  var revealItems = doc.querySelectorAll('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealItems.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Accordion ---------------- */
  var accs = Array.prototype.slice.call(doc.querySelectorAll('.acc'));

  accs.forEach(function (acc) {
    var head = acc.querySelector('.acc__head');
    var panel = acc.querySelector('.acc__panel');
    if (!head || !panel) return;

    head.addEventListener('click', function () {
      var isOpen = acc.classList.contains('is-open');

      accs.forEach(function (other) {
        if (other === acc) return;
        other.classList.remove('is-open');
        var p = other.querySelector('.acc__panel');
        var h = other.querySelector('.acc__head');
        if (p) p.style.maxHeight = '0px';
        if (h) h.setAttribute('aria-expanded', 'false');
      });

      acc.classList.toggle('is-open', !isOpen);
      head.setAttribute('aria-expanded', String(!isOpen));
      panel.style.maxHeight = isOpen ? '0px' : panel.scrollHeight + 'px';
    });
  });

  /* ---------------- Booking form ---------------- */
  var form = doc.getElementById('bookingForm');
  var success = doc.getElementById('formSuccess');
  var again = doc.getElementById('formAgain');
  var toast = doc.getElementById('toast');
  var toastTimer;

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 4200);
  }

  function markField(el, invalid) {
    var wrapper = el.closest('.field') || el.closest('.check');
    if (wrapper) wrapper.classList.toggle('is-invalid', invalid);
    el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }

  // дата: не раньше сегодняшнего дня
  var dateInput = form ? form.querySelector('input[name="date"]') : null;
  if (dateInput) {
    var today = new Date();
    var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    dateInput.min = iso;
  }

  // маска телефона
  var phone = form ? form.querySelector('input[name="phone"]') : null;
  if (phone) {
    phone.addEventListener('input', function () {
      var digits = phone.value.replace(/\D/g, '');
      if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
      if (digits.charAt(0) !== '7') digits = '7' + digits;
      digits = digits.slice(0, 11);

      var out = '+7';
      if (digits.length > 1) out += ' (' + digits.slice(1, 4);
      if (digits.length >= 5) out += ') ' + digits.slice(4, 7);
      if (digits.length >= 8) out += '-' + digits.slice(7, 9);
      if (digits.length >= 10) out += '-' + digits.slice(9, 11);

      phone.value = out;
      markField(phone, false);
    });
    phone.addEventListener('blur', function () {
      if (phone.value.replace(/\D/g, '').length <= 1) phone.value = '';
    });
  }

  if (form) {
    form.addEventListener('input', function (e) {
      if (e.target.matches('input, select')) markField(e.target, false);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.querySelector('input[name="name"]');
      var agree = form.querySelector('input[name="agree"]');
      var firstInvalid = null;

      function check(el, ok) {
        markField(el, !ok);
        if (!ok && !firstInvalid) firstInvalid = el;
      }

      check(name, name.value.trim().length >= 2);
      check(phone, phone.value.replace(/\D/g, '').length === 11);
      check(dateInput, !!dateInput.value);
      check(agree, agree.checked);

      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        showToast('Проверьте выделенные поля');
        return;
      }

      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.querySelector('h3').focus && success.setAttribute('tabindex', '-1');
      }
      showToast('Спасибо! Заявка отправлена');
    });
  }

  if (again) {
    again.addEventListener('click', function () {
      if (success) success.hidden = true;
      if (form) {
        form.hidden = false;
        form.reset();
        form.querySelectorAll('.is-invalid').forEach(function (el) {
          el.classList.remove('is-invalid');
        });
      }
    });
  }

  /* ---------------- «Выбрать» → подставить тур ---------------- */
  var tourSelect = form ? form.querySelector('select[name="tour"]') : null;
  doc.querySelectorAll('[data-tour]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (!tourSelect) return;
      var want = link.getAttribute('data-tour');
      Array.prototype.forEach.call(tourSelect.options, function (opt) {
        if (opt.text.trim() === want) tourSelect.value = opt.value;
      });
    });
  });

  /* ---------------- Год в подвале ---------------- */
  var year = doc.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------- Звёзды в hero ---------------- */
  var starsGroup = doc.getElementById('stars');
  if (starsGroup) {
    var frag = doc.createDocumentFragment();
    var seed = 20251105;
    function rnd() {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    }
    for (var i = 0; i < 90; i++) {
      var cx = rnd() * 1440;
      var cy = rnd() * 470;
      var r = rnd() * 1.3 + 0.35;
      var op = rnd() * 0.55 + 0.15;
      var c = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx.toFixed(1));
      c.setAttribute('cy', cy.toFixed(1));
      c.setAttribute('r', r.toFixed(2));
      c.setAttribute('fill', '#dff6f2');
      c.setAttribute('opacity', op.toFixed(2));
      frag.appendChild(c);
    }
    starsGroup.appendChild(frag);
  }

  /* ---------------- Полярное сияние (canvas) ---------------- */
  (function aurora() {
    var canvas = doc.getElementById('aurora');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var host = canvas.parentElement;
    var SCALE = 0.45;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var W = 0, H = 0;
    var visible = true;
    var running = false;
    var rafId = 0;
    var lastFrame = 0;

    function rnd(seed) {
      return function () {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
    }

    function gradient(stops) {
      var g = ctx.createLinearGradient(0, 0, 0, 1);
      for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
      return g;
    }

    // снизу — яркая зелёная кромка, выше — бирюза и фиолетовая дымка
    var GREEN = [
      [0.00, 'rgba(120,110,255,0)'],
      [0.45, 'rgba(100,150,255,0.04)'],
      [0.68, 'rgba(80,225,195,0.12)'],
      [0.82, 'rgba(65,250,180,0.28)'],
      [0.92, 'rgba(140,255,205,0.38)'],
      [1.00, 'rgba(140,255,205,0)']
    ];
    var TEAL = [
      [0.00, 'rgba(110,120,255,0)'],
      [0.40, 'rgba(95,185,240,0.04)'],
      [0.70, 'rgba(85,220,215,0.14)'],
      [0.88, 'rgba(125,245,230,0.30)'],
      [1.00, 'rgba(125,245,230,0)']
    ];
    var VIOLET = [
      [0.00, 'rgba(145,110,255,0)'],
      [0.38, 'rgba(135,125,255,0.05)'],
      [0.72, 'rgba(115,165,255,0.11)'],
      [0.90, 'rgba(155,195,255,0.22)'],
      [1.00, 'rgba(155,195,255,0)']
    ];
    var RIM = [
      [0.00, 'rgba(140,255,210,0)'],
      [0.55, 'rgba(110,255,190,0.30)'],
      [0.90, 'rgba(170,255,220,0.42)'],
      [1.00, 'rgba(170,255,220,0)']
    ];

    var curtains = [
      { base: 0.46, amp: 0.075, len: 0.50, count: 96, alpha: 0.360, phase: 0.4, flow: 16, seed: 13, palette: GREEN },
      { base: 0.36, amp: 0.060, len: 0.40, count: 72, alpha: 0.250, phase: 2.3, flow: 24, seed: 29, palette: TEAL },
      { base: 0.55, amp: 0.050, len: 0.34, count: 54, alpha: 0.180, phase: 4.2, flow: 32, seed: 47, palette: VIOLET }
    ];

    curtains.forEach(function (c) {
      var r = rnd(c.seed);
      c.rays = [];
      for (var i = 0; i < c.count; i++) {
        c.rays.push({
          u: (i + r() * 0.8) / c.count,
          w: 5 + Math.pow(r(), 2) * 22,
          phase: r() * Math.PI * 2,
          flick: 0.55 + r() * 1.1,
          rim: 0.35 + r() * 0.65
        });
      }
      c.grad = gradient(c.palette);
      c.rim = gradient(RIM);
    });

    function draw(t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      var breathe = 0.84 + 0.16 * Math.sin(t * 0.24);
      var boost = W < 520 ? 1.6 : 1;

      // занавес шире кадра: рисунок уходит за правый край и возвращается за левым,
      // поэтому дрейф слева направо идёт без рывков
      var margin = Math.max(80, Math.round(W * 0.18));
      var span = W + margin * 2;

      for (var i = 0; i < curtains.length; i++) {
        var c = curtains[i];
        var baseY = c.base * H;
        var shift = (t * c.flow) % span;
        var amp = c.amp * (0.92 + 0.08 * Math.sin(t * 0.18 + c.phase));

        for (var j = 0; j < c.rays.length; j++) {
          var ray = c.rays[j];

          var p = (-margin + ray.u * span + shift) % span;
          if (p < 0) p += span;

          var x = p - margin + Math.sin(t * 0.5 + ray.phase) * 1.5;
          var u = p / span;

          var wave =
            Math.sin(u * 8.3 + c.phase) * 0.62 +
            Math.sin(u * 15.4 + c.phase * 1.7) * 0.38;

          var yb = baseY + wave * amp * H;
          var len = c.len * H * (0.92 + 0.08 * Math.sin(u * 8.7 + t * 0.3));
          var flicker = 0.74 + 0.26 * Math.sin(t * 0.9 * ray.flick + ray.phase * 2.3);
          var env = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(u * 2.6 + c.phase * 1.7 + t * 0.09));
          var a = c.alpha * breathe * boost * flicker * env;

          // мягкое объёмное свечение
          ctx.save();
          ctx.translate(x, yb - len);
          ctx.scale(1, len);
          ctx.globalAlpha = a * 0.05;
          ctx.fillStyle = c.grad;
          ctx.fillRect(-ray.w * 3.2, 0, ray.w * 6.4, 1);
          ctx.restore();

          // прожилки
          ctx.save();
          ctx.translate(x, yb - len);
          ctx.scale(1, len);
          ctx.globalAlpha = Math.min(0.95, a * 1.55);
          ctx.fillStyle = c.grad;
          ctx.fillRect(-ray.w / 2, 0, ray.w, 1);
          ctx.restore();

          // яркая кромка у нижнего края занавеса
          ctx.save();
          ctx.translate(x, yb - 10);
          ctx.scale(1, 12);
          ctx.globalAlpha = Math.min(0.85, a * 1.05 * ray.rim);
          ctx.fillStyle = c.rim;
          ctx.fillRect(-ray.w * 0.9, 0, ray.w * 1.8, 1);
          ctx.restore();
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function resize() {
      var rect = host.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width * SCALE));
      var h = Math.max(1, Math.round(rect.height * SCALE));
      if (w === W && h === H) return;
      W = w;
      H = h;
      canvas.width = w;
      canvas.height = h;
      if (!running) draw(0);
    }

    function loop(now) {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      if (now - lastFrame < 33) return; // ~30 кадров в секунду
      lastFrame = now;
      if (!visible || doc.hidden) return;
      draw(now / 1000);
    }

    function start() {
      if (running || still) return;
      running = true;
      lastFrame = 0;
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    function sync() {
      if (visible && !doc.hidden && !still) start();
      else stop();
    }

    resize();
    draw(0);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: 0 }).observe(host);
    }

    doc.addEventListener('visibilitychange', sync);

    if ('ResizeObserver' in window) {
      new ResizeObserver(resize).observe(host);
    } else {
      window.addEventListener('resize', resize);
    }

    sync();
  })();
})();
