/* HABÄNE — homepage */

(function () {
  const H = window.HABANE;

  /* THE LINEUP — clean horizontal carousel of minimal product cards */
  function initLineup() {
    const track = document.getElementById('grid');
    if (!track) return;
    const priority = H.PRODUCTS.filter(p => p.featured || p.bestSelling);
    const rest = H.PRODUCTS.filter(p => !p.featured && !p.bestSelling);
    const list = [...priority, ...rest].slice(0, 8);

    track.innerHTML = list.map(p => {
      const badgeText = p.prebook ? 'PREBOOK' : (p.badge || (p.cat === 'smart' ? 'SMART' : ''));
      const badge = badgeText
        ? `<span class="lcard__badge ${p.prebook ? 'lcard__badge--brass' : ''}">${badgeText}</span>` : '';
      const addLabel = p.prebook ? 'PREBOOK ✦' : 'QUICK ADD ✦';
      const addAttr = p.prebook ? 'data-prebook' : 'data-add';
      return `
      <a class="lcard" href="product.html?id=${p.id}" data-id="${p.id}">
        <div class="lcard__media">
          ${badge}
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          <button class="lcard__add" ${addAttr} type="button">${addLabel}</button>
        </div>
        <div class="lcard__body">
          <h3 class="lcard__name">${p.name}</h3>
          <span class="lcard__price" data-inr="${p.price}">${H.inr(p.price)}</span>
        </div>
      </a>`;
    }).join('');

    // quick-add / prebook straight from the carousel
    track.addEventListener('click', e => {
      const btn = e.target.closest('[data-add],[data-prebook]');
      if (!btn) return;
      e.preventDefault();
      const p = H.byId(btn.closest('[data-id]').dataset.id);
      if (btn.hasAttribute('data-prebook')) { H.openPrebook?.(p.id); return; }
      H.addToCartUI(p.id, p.colors[0].name, p.sizes[0], 1);
    });

    // next-arrow scrolls a page; loops back to start once it reaches the end
    const nextBtn = document.getElementById('rangeNext');
    nextBtn?.addEventListener('click', () => {
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 12;
      if (atEnd) { track.scrollTo({ left: 0, behavior: 'smooth' }); return; }
      const card = track.querySelector('.lcard');
      const step = card ? (card.getBoundingClientRect().width + 18) * 2 : track.clientWidth * 0.8;
      track.scrollBy({ left: step, behavior: 'smooth' });
    });

    H.refreshPrices(track);
  }

  /* Hype strip: shoppable product ticker right under the hero */
  function initHype() {
    const track = document.getElementById('hypeTrack');
    if (!track) return;
    const list = [...H.PRODUCTS].sort((a, b) =>
      (b.prebook ? 2 : b.bestSelling ? 1 : 0) - (a.prebook ? 2 : a.bestSelling ? 1 : 0)).slice(0, 10);
    const itemsHTML = list.map(p => `
      <a class="hype__item ${p.prebook ? 'hype__item--drop' : ''}" href="product.html?id=${p.id}">
        <img src="${p.img}" alt="" loading="lazy">
        <span>${p.name.toUpperCase()}</span>
        <em data-inr="${p.price}">${H.inr(p.price)}</em>
      </a>`).join('');
    // two identical halves → the -50% marquee loop never shows a seam
    track.innerHTML = `<div class="hype__half">${itemsHTML}</div><div class="hype__half" aria-hidden="true">${itemsHTML}</div>`;
  }

  function initSmartSplit() {
    const section = document.querySelector('.smart-split');
    if (!section || !window.gsap) return;
    gsap.from('.smart-split__panel', {
      scrollTrigger: { trigger: section, start: 'top 80%' },
      y: 40, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
    });
  }

  /* THE TEA — static chat-bubble FAQ (question bubble + navy answer bubble) */
  function initFaqChat() {
    const grid = document.getElementById('teaGrid');
    if (!grid) return;
    const TIMES = [['11:28 AM', '11:30 AM'], ['12:05 PM', '12:07 PM'], ['01:40 PM', '01:42 PM'], ['02:15 PM', '02:16 PM'], ['03:02 PM', '03:04 PM']];
    grid.innerHTML = H.FAQ_ITEMS.map((item, i) => {
      const [qt, at] = TIMES[i % TIMES.length];
      return `
      <div class="tea__col">
        <div class="tea__bubble tea__bubble--q">
          <p>${item.q}</p>
          <span class="tea__time">${qt}</span>
        </div>
        <div class="tea__bubble tea__bubble--a">
          <span class="tea__avatar">☕</span>
          <p>${item.a}</p>
          <span class="tea__time">${at}</span>
        </div>
      </div>`;
    }).join('');
  }

  /* Spin-to-win discount wheel — floating FAB opens a modal wheel that
     auto-applies a promo code via H.promoData, same as a manually-entered code. */
  function initSpinWheel() {
    const wheel = document.getElementById('wheel');
    const disc = document.getElementById('wheelDisc');
    const fab = document.getElementById('spinFab');
    if (!wheel || !fab) return;

    // segment order must match the DOM order in #wheelDisc
    const REWARDS = [
      { label: '10% OFF', code: 'HABÄNE10', type: 'pct', value: 10 },
      { label: 'FREE SHIP', code: 'FREESHIP', type: 'ship', value: 0 },
      { label: '5% OFF', code: 'HABÄNE5', type: 'pct', value: 5 },
      { label: '15% OFF', code: 'HABÄNE15', type: 'pct', value: 15 },
      { label: 'TRY AGAIN', code: null, type: 'none', value: 0 },
      { label: '20% OFF', code: 'HABÄNE20', type: 'pct', value: 20 },
    ];
    // weighted winners (rigged for conversion — never lands on TRY AGAIN)
    const WEIGHTS = [[0, 38], [3, 30], [2, 14], [5, 10], [1, 8]];
    function pickWinner() {
      const total = WEIGHTS.reduce((s, w) => s + w[1], 0);
      let r = Math.random() * total;
      for (const [seg, w] of WEIGHTS) { if ((r -= w) <= 0) return seg; }
      return 0;
    }

    let spun = false;
    function openWheel(auto) {
      if (H.promoData) return;
      // never auto-pop over a modal the user is already inside (prebook, cart…)
      if (auto && document.querySelector('.prebook.open,.cart.open,.done.open,.search-pop.open,.auth-pop.open')) return;
      H.openModal(wheel);
    }
    function close() { H.closeModal(wheel); }
    wheel.addEventListener('click', e => { if (e.target.closest('[data-wheel-close]')) close(); });

    document.getElementById('wheelForm')?.addEventListener('submit', e => {
      e.preventDefault();
      if (spun) return;
      spun = true;
      const seg = pickWinner();
      const turns = 5; // full spins for drama
      const target = turns * 360 + (360 - (seg * 60 + 30)); // center segment under the top pointer
      disc.style.transition = 'transform 4.4s cubic-bezier(.15,.9,.25,1)';
      disc.style.transform = `rotate(${target}deg)`;
      const spinBtn = document.getElementById('wheelSpin');
      spinBtn.disabled = true; spinBtn.textContent = 'spinning…';

      setTimeout(() => {
        const reward = REWARDS[seg];
        if (reward.type !== 'none') {
          H.promoData = { code: reward.code, type: reward.type, value: reward.value };
          H.syncCart();
        }
        const msg = reward.type === 'pct' ? `YESSS — <strong>${reward.value}% OFF</strong> unlocked. Code <strong>${reward.code}</strong> auto-applies at checkout. 💅`
          : reward.type === 'ship' ? `<strong>FREE SHIPPING</strong> unlocked, code <strong>${reward.code}</strong> is in your cart. 🚚`
          : `so close 😭 try again later.`;
        document.getElementById('wheelResult').innerHTML = msg;
        H.toast(reward.type !== 'none' ? `Discount unlocked — ${reward.label} ✦` : 'almost! 😭');
        setTimeout(close, 2600);
      }, 4500);
    });

    function updateFab() { fab.style.display = H.promoData ? 'none' : 'flex'; }
    fab.addEventListener('click', openWheel);
    updateFab();
    if (!H.promoData && !sessionStorage.getItem('wheelSeen')) {
      sessionStorage.setItem('wheelSeen', '1');
      setTimeout(() => openWheel(true), 6500);
    }
  }

  /* Drop bar countdown — ticks to the HABÄNE 01 drop date */
  function initDropBar() {
    const bar = document.getElementById('dropCount');
    if (!bar) return;
    const p = H.PRODUCTS.find(x => x.prebook && x.dropDate);
    if (!p) { document.querySelector('.dropbar')?.remove(); return; }
    const target = new Date(p.dropDate).getTime();
    const cells = {
      d: bar.querySelector('[data-dc="d"]'),
      h: bar.querySelector('[data-dc="h"]'),
      m: bar.querySelector('[data-dc="m"]'),
      s: bar.querySelector('[data-dc="s"]'),
    };
    function tick() {
      let ms = target - Date.now();
      if (ms <= 0) {
        clearInterval(t);
        bar.innerHTML = '<strong class="dropbar__live">IT\'S LIVE ✦</strong>';
        return;
      }
      const d = Math.floor(ms / 864e5);
      const h = Math.floor(ms % 864e5 / 36e5);
      const m = Math.floor(ms % 36e5 / 6e4);
      const s = Math.floor(ms % 6e4 / 1e3);
      cells.d.textContent = String(d).padStart(2, '0');
      cells.h.textContent = String(h).padStart(2, '0');
      cells.m.textContent = String(m).padStart(2, '0');
      cells.s.textContent = String(s).padStart(2, '0');
    }
    tick();
    const t = setInterval(tick, 1000);
  }

  function initNewsletter() {
    document.getElementById('newsForm')?.addEventListener('submit', e => {
      e.preventDefault();
      document.getElementById('newsDone').textContent = "you're in. don't leave us on read 💌";
      e.target.reset();
      H.toast('Subscribed — see you in your inbox');
    });
  }

  /* Hero 3D logo — fall back to a static emblem if WebGL is unavailable
     (e.g. low-end laptops with HW acceleration off / old Intel drivers) */
  function initHeroLogo() {
    const mv = document.getElementById('heroLogo');
    if (!mv) return;
    function webglOK() {
      try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
          (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
      } catch (e) { return false; }
    }
    function fallback() {
      if (!mv.isConnected || mv.dataset.fallback) return;
      mv.dataset.fallback = '1';
      const img = document.createElement('img');
      img.src = 'assets/brand/logo-emblem-navy.png';
      img.alt = 'Habäne';
      img.className = 'hero-logo3d--img';
      mv.replaceWith(img);
    }
    if (!webglOK()) { fallback(); return; }
    let loaded = false;
    mv.addEventListener('load', () => { loaded = true; }, { once: true });
    mv.addEventListener('error', fallback, { once: true });
    setTimeout(() => { if (!loaded) fallback(); }, 6000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    H.initShared();

    initHeroLogo();
    initHype();
    initDropBar();
    initLineup();
    initSmartSplit();
    initFaqChat();
    initNewsletter();
    initSpinWheel();
    if (window.gsap) {
      gsap.from('.hero__inner > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.2 });
    }
  });
})();
