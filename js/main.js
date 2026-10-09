/* RELIC No.01 — interaction layer. No dependencies. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Replace with the real enquiries address before launch.
  const ENQUIRY_EMAIL = 'nsumlu@hotmail.com';

  /* ---------------- header + mobile menu ---------------- */
  const header = $('.header');
  const nav = $('#nav');
  const menuBtn = $('.menu-btn');

  function setHeader(light) {
    header.classList.toggle('is-light', light);
    header.classList.toggle('is-paper', !light);
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Close' : 'Menu';
      document.body.classList.toggle('menu-open', open);
    });
    $$('#nav a, #nav button').forEach(el =>
      el.addEventListener('click', () => {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = 'Menu';
        document.body.classList.remove('menu-open');
      })
    );
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) menuBtn.click();
    });
  }

  /* ---------------- dark entrance: real-image light reveal ---------------- */
  const entrance = $('.entrance');
  if (entrance) {
    const pin = $('.entrance__pin', entrance);
    const frame = $('.entrance__frame', entrance);
    const lit = $('.e-lit', entrance);
    const text = $('.entrance__text', entrance);

    let p = 0;                       // scroll progress 0..1
    let rect = frame.getBoundingClientRect();
    let mx = 0.5, my = 0.45;         // current spot (fractions of the frame)
    let tx = 0.5, ty = 0.45;         // target
    let usingPointer = false;
    let active = true;
    let raf = 0;
    let lastKey = '';

    const FLAME = { x: 0.5, y: 0.44 };   // the flame in the hero render

    const measure = () => { rect = frame.getBoundingClientRect(); };
    const readScroll = () => {
      const h = entrance.offsetHeight - window.innerHeight;
      const top = entrance.getBoundingClientRect().top;
      p = clamp(-top / Math.max(h, 1));
    };

    const ease = t => t * t * (3 - 2 * t);
    const mix = (a, b, t) => Math.round(a + (b - a) * t);

    function paint(now) {
      if (!reduce.matches && !usingPointer) {
        // slow ambient drift across the lamp when nobody is pointing
        tx = FLAME.x + 0.08 * Math.sin(now / 3200);
        ty = FLAME.y + 0.11 * Math.sin(now / 2700 + 1.2);
      }
      const k = reduce.matches ? 1 : 0.05;
      mx += (tx - mx) * k;
      my += (ty - my) * k;

      const w = frame.offsetWidth, h = frame.offsetHeight;
      const r0 = Math.min(w, h) * (window.innerWidth < 820 ? 0.24 : 0.17);
      const rMax = Math.hypot(w, h) * 1.15;
      const r = r0 + (rMax - r0) * ease(clamp((p - 0.14) / 0.74));

      const key = [mx.toFixed(4), my.toFixed(4), Math.round(r), p.toFixed(3)].join('|');
      if (key !== lastKey) {
        lastKey = key;
        lit.style.setProperty('--mx', (mx * w).toFixed(1) + 'px');
        lit.style.setProperty('--my', (my * h).toFixed(1) + 'px');
        lit.style.setProperty('--r', r.toFixed(1) + 'px');

        const t = ease(clamp((p - 0.62) / 0.3));
        pin.style.background = `rgb(${mix(4, 247, t)},${mix(3, 243, t)},${mix(2, 236, t)})`;
        text.style.opacity = String(1 - clamp((p - 0.1) / 0.22));
        setHeader(p < 0.74);
      }
    }

    function loop(now) {
      paint(now);
      if (active) raf = requestAnimationFrame(loop);
    }

    function pointTo(clientX, clientY) {
      usingPointer = true;
      tx = clamp((clientX - rect.left) / rect.width, -0.2, 1.2);
      ty = clamp((clientY - rect.top) / rect.height, -0.2, 1.2);
    }

    entrance.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') pointTo(e.clientX, e.clientY);
    }, { passive: true });
    // Touch: follow the finger without ever preventing scroll.
    entrance.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) pointTo(t.clientX, t.clientY); }, { passive: true });
    entrance.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) pointTo(t.clientX, t.clientY); }, { passive: true });

    window.addEventListener('scroll', () => { readScroll(); measure(); if (reduce.matches) paint(0); }, { passive: true });
    window.addEventListener('resize', () => { measure(); readScroll(); lastKey = ''; });

    new IntersectionObserver(([en]) => {
      active = en.isIntersecting;
      if (active) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    }, { rootMargin: '10% 0px' }).observe(entrance);

    // The reveal needs the image, not the layout: wait for it so the first spot is real.
    const start = () => { measure(); readScroll(); raf = requestAnimationFrame(loop); };
    if (lit.complete) start(); else lit.addEventListener('load', start, { once: true });
  } else if (header) {
    setHeader(false);
  }

  /* ---------------- fade images in once decoded ---------------- */
  $$('img.fade-img').forEach(img => {
    const done = () => img.classList.add('is-in');
    if (img.complete) done(); else img.addEventListener('load', done, { once: true });
  });

  /* ---------------- subtle parallax on the hero object ---------------- */
  const para = $('[data-parallax]');
  if (para && !reduce.matches) {
    let ticking = false;
    const run = () => {
      const r = para.getBoundingClientRect();
      const vh = window.innerHeight;
      const c = (r.top + r.height / 2 - vh / 2) / vh;      // -1..1 around the viewport centre
      para.style.transform = `translate3d(0, ${(clamp(c, -1, 1) * -14).toFixed(2)}px, 0)`;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* ---------------- video: play when visible, pause offscreen, controls ---------------- */
  const vids = $$('video[data-film]');
  const userPaused = new WeakSet();

  function label(btn, txt) { btn.textContent = txt; }

  vids.forEach(v => {
    const toggle = document.querySelector(`[data-toggle="${v.id}"]`);
    const replay = Array.from(document.querySelectorAll(`[data-replay="${v.id}"]`));
    const loopFor = v.hasAttribute('loop');

    const sync = () => { if (toggle) label(toggle, v.paused ? 'Play' : 'Pause'); };
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    v.addEventListener('ended', sync);

    if (toggle) {
      toggle.addEventListener('click', () => {
        if (v.paused) { userPaused.delete(v); v.play().catch(() => {}); }
        else { userPaused.add(v); v.pause(); }
      });
    }
    replay.forEach(b => b.addEventListener('click', () => {
      userPaused.delete(v);
      v.currentTime = 0;
      v.play().catch(() => {});
    }));

    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && en.intersectionRatio >= 0.35) {
        if (!reduce.matches && !userPaused.has(v) && (loopFor || !v.ended || v.currentTime === 0)) {
          if (v.ended) v.currentTime = 0;
          v.play().catch(() => {});
        }
      } else if (!v.paused) {
        v.pause();
      }
    }, { threshold: [0, 0.35, 0.6] }).observe(v);

    sync();
  });

  /* ---------------- lightbox: fit or actual size, drag to pan ---------------- */
  const lb = $('#lightbox');
  if (lb) {
    const lbImg = $('img', lb);
    const mode = document.createElement('button');
    mode.className = 'lightbox__mode'; mode.type = 'button'; mode.textContent = 'Actual size';
    lb.insertBefore(mode, lb.firstChild);
    const setActual = on => { lb.classList.toggle('is-actual', on); mode.textContent = on ? 'Fit to screen' : 'Actual size'; };
    $$('[data-zoom]').forEach(btn => btn.addEventListener('click', () => {
      lbImg.src = btn.dataset.zoom; lbImg.alt = btn.dataset.alt || '';
      setActual(false); lb.showModal(); lb.scrollTop = 0; lb.scrollLeft = 0;
    }));
    mode.addEventListener('click', e => { e.stopPropagation(); setActual(!lb.classList.contains('is-actual')); });
    $('.lightbox__close', lb).addEventListener('click', e => { e.stopPropagation(); lb.close(); });
    let drag = null, moved = false;
    lb.addEventListener('pointerdown', e => {
      if (!lb.classList.contains('is-actual') || e.target.closest('button')) return;
      drag = { x: e.clientX, y: e.clientY, sl: lb.scrollLeft, st: lb.scrollTop }; moved = false;
      lb.classList.add('is-drag'); lb.setPointerCapture(e.pointerId);
    });
    lb.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      lb.scrollLeft = drag.sl - dx; lb.scrollTop = drag.st - dy;
    });
    const end = () => { drag = null; lb.classList.remove('is-drag'); };
    lb.addEventListener('pointerup', end); lb.addEventListener('pointercancel', end);
    lb.addEventListener('click', e => {
      if (e.target.closest('button') || moved) { moved = false; return; }
      setActual(!lb.classList.contains('is-actual'));
    });
  }

  /* ---------------- enquiry dialog ---------------- */
  const enq = $('#enquiry');
  if (enq) {
    const form = $('form', enq);
    const status = $('.enq__status', enq);
    $$('[data-enquire]').forEach(b => b.addEventListener('click', e => {
      e.preventDefault();
      status.textContent = '';
      enq.showModal();
      $('input', enq).focus();
    }));
    $('.enq__close', enq).addEventListener('click', () => enq.close());
    enq.addEventListener('click', e => { if (e.target === enq) enq.close(); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form);
      const subject = encodeURIComponent('Enquiry: RELIC No.01');
      const body = encodeURIComponent(`${d.get('message')}\n\n${d.get('name')}\n${d.get('email')}`);
      status.textContent = 'Thank you. Your message is ready in your email app.';
      window.location.href = `mailto:${ENQUIRY_EMAIL}?subject=${subject}&body=${body}`;
    });
  }

  /* ---------------- accordions (product page) ---------------- */
  $$('.acc__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      $$('.acc__btn').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        document.getElementById(b.getAttribute('aria-controls')).dataset.open = 'false';
      });
      if (!open) {
        btn.setAttribute('aria-expanded', 'true');
        document.getElementById(btn.getAttribute('aria-controls')).dataset.open = 'true';
      }
    });
  });
})();
