/* HABÄNE — shared UI components */

(function () {
  const H = window.HABANE;
  H.events = H.events || new EventTarget();
  const { byId, inr, discountValue, cartQty, cartSubtotal } = H;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ---- Lucide icons ---- */
  function icon(name, cls = '') {
    return `<i data-lucide="${name}" class="icon ${cls}" aria-hidden="true"></i>`;
  }

  function refreshIcons(root) {
    if (!window.lucide) return;
    if (root) window.lucide.createIcons({ attrs: { class: 'icon' }, nameAttr: 'data-lucide', root });
    else window.lucide.createIcons({ attrs: { class: 'icon' }, nameAttr: 'data-lucide' });
  }
  H.icon = icon;
  H.refreshIcons = refreshIcons;

  /* ---- micro-sounds (WebAudio, no files) — play only after a user gesture,
     so autoplay policies are happy. Kill switch: localStorage habane_sfx = 'off' ---- */
  let audioCtx;
  function sfx(kind) {
    try {
      if (localStorage.getItem('habane_sfx') === 'off') return;
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime;
      const notes = kind === 'win'
        ? [[523.25, 0], [659.25, 0.09], [783.99, 0.18]]   // little C-E-G rise
        : [[440, 0], [660, 0.06]];                          // soft two-note pop
      notes.forEach(([f, d]) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
        o.connect(g).connect(audioCtx.destination);
        o.start(t + d);
        o.stop(t + d + 0.22);
      });
    } catch { /* no audio? no problem */ }
  }
  H.sfx = sfx;

  /* ---- Toast ---- */
  const toastEl = () => document.getElementById('toast');
  let toastT;
  function toast(msg) {
    const el = toastEl();
    if (!el) return;
    el.innerHTML = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2800);
  }
  H.toast = toast;

  /* ---- Modals ---- */
  function openModal(el) {
    if (!el) return;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }
  function closeModal(el) {
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.qv.open,.cart.open,.search-pop.open,.done.open,.wheel.open,.auth-pop.open,.prebook.open'))
      document.body.classList.remove('no-scroll');
  }
  H.openModal = openModal;
  H.closeModal = closeModal;

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
      $$('.qv.open,.cart.open,.search-pop.open,.done.open,.wheel.open,.auth-pop.open,.prebook.open').forEach(closeModal);
  });

  /* ---- Nav scroll transparency ---- */
  function initNav() {
    const nav = $('#nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('shrink', scrollY > 40);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile drawer ---- */
  function initDrawer() {
    const burger = $('#burger');
    const drawer = $('#drawer');
    if (!burger || !drawer) return;
    const close = () => { burger.classList.remove('open'); drawer.classList.remove('open'); };
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      drawer.classList.toggle('open');
    });
    // account entry for small screens where the profile icon is hidden
    if (!drawer.querySelector('[data-drawer-account]')) {
      const a = document.createElement('a');
      a.href = 'account.html';
      a.setAttribute('data-drawer-account', '');
      a.textContent = H.getUser?.() ? 'My Account' : 'Log In / Sign Up';
      const cartLink = drawer.querySelector('#drawerCartLink');
      cartLink ? drawer.insertBefore(a, cartLink) : drawer.appendChild(a);
    }
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    H.closeDrawer = close;
  }

  /* ---- HTML escaping for user-provided strings ---- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  H.esc = esc;

  /* ---- Profile dropdown ---- */
  function initProfile() {
    const btn = $('#profileBtn');
    const menu = $('#profileMenu');
    if (!btn || !menu) return;

    function renderMenu() {
      const user = H.getUser?.();
      menu.innerHTML = user
        ? `<span class="nav__profile-hi">Hi, ${esc(user.name.trim().split(/\s+/)[0])}</span>
           <button type="button" data-account>My Account</button>
           <button type="button" data-logout>Log Out</button>`
        : `<button type="button" data-auth="login">Log In</button>
           <button type="button" data-auth="signup">Sign Up</button>`;
    }
    renderMenu();
    H.events.addEventListener('user:update', renderMenu);

    btn.addEventListener('click', e => {
      e.stopPropagation();
      menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
    menu.addEventListener('click', e => {
      const auth = e.target.closest('[data-auth]');
      if (auth) { window.location.href = auth.dataset.auth === 'signup' ? 'account.html?mode=signup' : 'account.html'; return; }
      if (e.target.closest('[data-account]')) { window.location.href = 'account.html'; return; }
      if (e.target.closest('[data-logout]')) {
        H.logout();
        menu.classList.remove('open');
        toast('Logged out — see you soon');
      }
    });

    // legacy auth pop-up (still present on older pages) → route to the account page
    $('#authClose')?.addEventListener('click', () => closeModal($('#authPop')));
    $('#authCloseOverlay')?.addEventListener('click', () => closeModal($('#authPop')));
    $$('.auth-pop__btn').forEach(b => b.addEventListener('click', () => {
      window.location.href = /sign\s*up/i.test(b.textContent) ? 'account.html?mode=signup' : 'account.html';
    }));
  }

  /* ---- Wishlist button ---- */
  function initWishNav() {
    const btn = $('#wishBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const ids = H.wishData;
      if (!ids.length) { toast('Your wishlist is empty'); return; }
      openModal($('#searchPop'));
      runSearch('');
      $('#searchInput').value = '';
      $('#searchResults').innerHTML = `<p class="search-pop__hint">Wishlist</p>` +
        ids.map(id => {
          const p = byId(id);
          return searchRowHTML(p);
        }).join('');
    });
    H.events.addEventListener('wish:update', syncWishCount);
    syncWishCount();
  }

  function syncWishCount() {
    const n = H.wishData.length;
    const el = $('#wishCount');
    if (el) { el.textContent = n; el.hidden = n === 0; }
  }

  /* ---- Location selector (floating, bottom-left) ---- */
  function flagImg(code, cls) {
    return `<img class="${cls}" src="https://flagcdn.com/${code.toLowerCase()}.svg" alt="" width="24" height="18" loading="lazy">`;
  }

  function initLocation() {
    const wrap = $('#locSelect');
    if (!wrap) return;
    // float it on the page, not inside the nav
    if (wrap.parentElement !== document.body) document.body.appendChild(wrap);
    const btn = wrap.querySelector('.loc-select__btn');
    const panel = wrap.querySelector('.loc-select__panel');
    const search = wrap.querySelector('.loc-select__search');
    const list = wrap.querySelector('.loc-select__list');
    let current = H.getLocation();

    function render(filter = '') {
      const q = filter.toLowerCase();
      const items = H.COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q));
      list.innerHTML = items.map(c => `
        <button type="button" class="loc-select__item ${c.code === current.code ? 'is-active' : ''}" data-code="${c.code}">
          ${flagImg(c.code, 'loc-select__flag-img')}
          <span class="loc-select__name">${c.name}</span>
          <span class="loc-select__cur">${c.currency}</span>
        </button>`).join('');
    }

    function updateBtn() {
      btn.innerHTML = `${flagImg(current.code, 'loc-select__flag-img')}<span>${current.currency}</span>${icon('chevron-down', 'loc-select__chev')}`;
      refreshIcons(btn);
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      wrap.classList.toggle('open');
      if (wrap.classList.contains('open')) { render(); search.focus(); }
    });
    search.addEventListener('input', () => render(search.value));
    list.addEventListener('click', e => {
      const item = e.target.closest('.loc-select__item');
      if (!item) return;
      current = H.COUNTRIES.find(c => c.code === item.dataset.code);
      H.setLocation(current);
      updateBtn();
      wrap.classList.remove('open');
      toast(`Prices now in ${current.currency}`);
    });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) wrap.classList.remove('open'); });
    H.events.addEventListener('location:update', e => {
      current = e.detail;
      updateBtn();
      H.refreshPrices();
      syncCart();
    });
    updateBtn();
    render();
  }

  /* ---- Search ---- */
  function searchRowHTML(p) {
    return `<button class="search-row" data-id="${p.id}" type="button">
      <img src="${p.img}" alt="">
      <span><strong>${p.name}</strong><em>${p.catLabel} · ${inr(p.price)}</em></span>
      ${icon('arrow-up-right', 'search-row__arrow')}
    </button>`;
  }

  function runSearch(q) {
    q = q.trim().toLowerCase();
    const list = !q ? H.PRODUCTS.slice(0, 4)
      : H.PRODUCTS.filter(p => (p.name + ' ' + p.catLabel + ' ' + p.desc).toLowerCase().includes(q));
    const res = $('#searchResults');
    if (!res) return;
    if (!list.length) {
      res.innerHTML = `<p class="search-pop__none">No matches for "${q}". Try "duffel" or "smart".</p>`;
      return;
    }
    res.innerHTML = (q ? '' : '<p class="search-pop__hint">Popular right now</p>') + list.map(searchRowHTML).join('');
    refreshIcons(res);
  }

  function initSearch() {
    const pop = $('#searchPop');
    const btn = $('#searchBtn');
    if (!btn || !pop) return;
    btn.addEventListener('click', () => {
      openModal(pop);
      setTimeout(() => $('#searchInput')?.focus(), 60);
      runSearch('');
    });
    $('#searchClose')?.addEventListener('click', () => closeModal(pop));
    pop.addEventListener('click', e => { if (e.target === pop) closeModal(pop); });
    $('#searchInput')?.addEventListener('input', e => runSearch(e.target.value));
    $('#searchResults')?.addEventListener('click', e => {
      const row = e.target.closest('.search-row');
      if (!row) return;
      closeModal(pop);
      window.location.href = `product.html?id=${row.dataset.id}`;
    });
  }

  /* ---- Cart drawer ---- */
  function lineHTML(i) {
    const p = byId(i.id);
    return `
    <div class="line" data-key="${i.key}">
      <div class="line__img"><img src="${p.img}" alt="${p.name}"></div>
      <div class="line__info">
        <h4>${p.name}</h4>
        <span class="line__meta">${i.color} · ${i.size}</span>
        <div class="line__bottom">
          <div class="line__qty">
            <button data-dec type="button" aria-label="Decrease">${icon('minus')}</button>
            <span>${i.qty}</span>
            <button data-inc type="button" aria-label="Increase">${icon('plus')}</button>
          </div>
          <span class="line__price">${inr(p.price * i.qty)}</span>
        </div>
      </div>
      <button class="line__rm" data-rm type="button" aria-label="Remove">${icon('x')}</button>
    </div>`;
  }

  function syncCart() {
    const cart = H.cartData;
    const qty = cartQty();
    const countEls = $$('#cartCount, .drawer-cart-count');
    countEls.forEach(el => { if (el) el.textContent = qty; });
    const itemsEl = $('#cartItems');
    if (itemsEl) itemsEl.textContent = `(${qty})`;

    const body = $('#cartBody');
    const empty = $('#cartEmpty');
    const foot = $('#cartFoot');
    const ship = document.querySelector('.cart__ship');
    const cartEl = $('#cart');

    if (!body) return;

    if (!cart.length) {
      body.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      if (foot) foot.style.display = 'none';
      if (ship) ship.style.display = 'none';
    } else {
      if (empty) empty.style.display = 'none';
      if (foot) foot.style.display = 'block';
      if (ship) ship.style.display = 'block';
      body.innerHTML = cart.map(lineHTML).join('');
      refreshIcons(body);
      const sub = cartSubtotal();
      const subEl = $('#cartSubtotal');
      if (subEl) subEl.textContent = inr(sub);

      const promo = H.promoData;
      const disc = discountValue(sub);
      const promoBox = $('#cartPromo');
      const discRow = $('#cartDiscRow');
      const totalRow = $('#cartTotalRow');
      if (promo && promoBox) { promoBox.hidden = false; $('#cartPromoChip').textContent = promo.code; }
      else if (promoBox) promoBox.hidden = true;
      if (disc > 0) {
        if (discRow) { discRow.hidden = false; $('#cartDisc').textContent = '−' + inr(disc); }
        if (totalRow) { totalRow.hidden = false; $('#cartTotal').textContent = inr(sub - disc); }
      } else {
        if (discRow) discRow.hidden = true;
        if (totalRow) totalRow.hidden = true;
      }

      const pct = Math.min(100, Math.round(sub / H.FREE_SHIP * 100));
      const bar = $('#shipBar');
      if (bar) bar.style.width = pct + '%';
      const msg = $('#shipMsg');
      if (msg) {
        msg.innerHTML = sub >= H.FREE_SHIP
          ? 'You unlocked <strong>free shipping</strong>'
          : `Add <strong>${inr(H.FREE_SHIP - sub)}</strong> more for <strong>free shipping</strong>`;
      }
    }
    renderCartRecommend();
    refreshIcons(cartEl);
  }

  /* ---- "You may also like" inside the cart ---- */
  function renderCartRecommend() {
    const panel = document.querySelector('.cart__panel');
    const foot = $('#cartFoot');
    if (!panel || !foot) return;
    let rec = $('#cartRecommend');
    if (!H.cartData.length) { if (rec) rec.remove(); return; }
    const inCart = new Set(H.cartData.map(i => i.id));
    const picks = H.PRODUCTS
      .filter(p => !inCart.has(p.id))
      .sort((a, b) => (b.bestSelling ? 1 : 0) - (a.bestSelling ? 1 : 0))
      .slice(0, 3);
    if (!picks.length) { if (rec) rec.remove(); return; }
    if (!rec) {
      rec = document.createElement('div');
      rec.id = 'cartRecommend';
      rec.className = 'cart-rec';
      panel.insertBefore(rec, foot);
    }
    rec.innerHTML = `<h4 class="cart-rec__head">You may also like</h4>` +
      picks.map(p => `
        <div class="cart-rec__item">
          <a class="cart-rec__link" href="product.html?id=${p.id}"><img src="${p.img}" alt="${p.name}"></a>
          <div class="cart-rec__info">
            <a href="product.html?id=${p.id}"><strong>${p.name}</strong></a>
            <span>${inr(p.price)}</span>
          </div>
          <button class="cart-rec__add" type="button" data-rec-add="${p.id}" aria-label="Add ${p.name} to cart">${icon('plus')}</button>
        </div>`).join('');
    refreshIcons(rec);
  }

  function bumpCart() {
    const el = $('#cartCount');
    if (!el?.animate) return;
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.6)' }, { transform: 'scale(1)' }],
      { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
  }

  function initCart() {
    const cartEl = $('#cart');
    // one empty-state voice across every page's cart markup
    const emptyEl = $('#cartEmpty');
    if (emptyEl) {
      emptyEl.innerHTML = `<div class="cart__empty-icon">${icon('luggage')}</div>
        <p>it's giving empty 🥲</p>
        <a href="shop.html" class="cart__empty-btn" data-cart-close>FIX THAT →</a>`;
    }
    $('#cartBtn')?.addEventListener('click', () => openModal(cartEl));
    $('#drawerCartLink')?.addEventListener('click', e => {
      e.preventDefault();
      H.closeDrawer?.();
      openModal(cartEl);
    });
    cartEl?.addEventListener('click', e => {
      if (e.target.closest('[data-cart-close]')) closeModal(cartEl);
    });
    $('#cartBody')?.addEventListener('click', e => {
      const line = e.target.closest('.line');
      if (!line) return;
      const key = line.dataset.key;
      if (e.target.closest('[data-inc]')) H.changeQty(key, 1);
      if (e.target.closest('[data-dec]')) H.changeQty(key, -1);
      if (e.target.closest('[data-rm]')) H.removeItem(key);
    });
    // express-checkout framing: one tap out of the drawer, straight to pay
    const coBtn = $('#checkoutBtn');
    if (coBtn && document.body.dataset.page !== 'checkout') {
      coBtn.innerHTML = 'EXPRESS CHECKOUT <em class="cart__co-sub">⚡ done in 60 seconds</em>';
    }
    coBtn?.addEventListener('click', () => {
      if (!H.cartData.length) return;
      window.location.href = 'checkout.html';
    });
    document.querySelector('.cart__panel')?.addEventListener('click', e => {
      const add = e.target.closest('[data-rec-add]');
      if (!add) return;
      e.preventDefault();
      const p = byId(add.dataset.recAdd);
      if (p) H.addToCartUI(p.id, p.colors[0].name, p.sizes[0], 1);
    });
    H.events.addEventListener('cart:update', syncCart);
    syncCart();
  }

  H.syncCart = syncCart;
  H.bumpCart = bumpCart;
  H.runSearch = runSearch;

  /* Re-format every price on the page to the selected currency */
  H.refreshPrices = function (root) {
    (root || document).querySelectorAll('[data-inr]').forEach(el => {
      const v = Number(el.dataset.inr);
      if (!isNaN(v)) el.textContent = inr(v);
    });
  };

  H.addToCartUI = function (id, color, size, qty) {
    const p = H.addToCart(id, color, size, qty);
    toast(`in the bag 🙌 — ${p.name}`);
    sfx('pop');
    bumpCart();
    openModal($('#cart'));
  };

  /* ---- Product card HTML ---- */
  H.cardHTML = function (p, opts = {}) {
    let badgeClass = 'card__badge--black';
    if (p.badge === 'BESTSELLER' || p.badge === 'SALE' || p.badge === 'TRENDING') {
      badgeClass = 'card__badge--red';
    }
    if (p.prebook) badgeClass = 'card__badge--brass';
    const badge = p.badge ? `<span class="card__badge ${badgeClass}">${p.badge}</span>` : '';
    const was = p.was ? `<span class="card__was" data-inr="${p.was}">${inr(p.was)}</span>` : '';
    const liked = H.isWish(p.id);
    const back = p.img2 ? `<img class="card__img card__img--back" src="${p.img2}" alt="" loading="lazy">` : '';
    const idx = H.PRODUCTS.indexOf(p);
    const no = idx > -1 ? `Nº ${String(idx + 1).padStart(2, '0')}` : '';
    const fmtCount = n => n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : n;
    const rating = p.prebook
      ? `<span class="card__hypeline">✦ first drop — be employee zero of the hype</span>`
      : `<div class="card__rate"><span class="card__stars">${H.stars(p.stars)}</span><em class="card__reviews">(${fmtCount(p.reviews || 0)})</em></div>`;
    const save = (p.was && p.was > p.price)
      ? `<span class="card__save">SAVE <b data-inr="${p.was - p.price}">${inr(p.was - p.price)}</b></span>`
      : '';
    const quick = p.prebook
      ? `<button class="card__add card__add--prebook" data-prebook type="button">PREBOOK ✦ RESERVE YOUR Nº</button>`
      : `<button class="card__add" data-add type="button">QUICK ADD — 1 TAP</button>`;
    const meta = p.prebook
      ? `<span class="card__cat card__cat--drop">DROPS ${p.dropLabel || 'SOON'} · ${p.edition || 300} PIECES</span>`
      : `<span class="card__cat">${p.catLabel}${no ? ` · ${no}` : ''}</span>`;
    return `
    <article class="card ${p.img2 ? 'has-alt' : ''} ${p.prebook ? 'card--prebook' : ''}" data-cat="${p.cat}" data-id="${p.id}">
      <a href="product.html?id=${p.id}" class="card__link">
        <div class="card__media">
          ${badge}
          <button class="card__wish ${liked ? 'liked' : ''}" data-wish type="button" aria-label="Wishlist">${icon('heart')}</button>
          <img class="card__img card__img--front" src="${p.img}" alt="${p.name}" loading="lazy">
          ${back}
          <span class="card__sheen" aria-hidden="true"></span>
          <div class="card__quick">
            <span class="card__view">VIEW DETAILS</span>
            ${quick}
          </div>
        </div>
        <div class="card__body">
          <div class="card__info">
            <div class="card__info-left">
              <h3 class="card__name">${p.name.toUpperCase()}</h3>
              ${meta}
              ${rating}
            </div>
            <div class="card__info-right">
              <span class="card__price" data-inr="${p.price}">${inr(p.price)}</span>
              ${was}
              ${save}
            </div>
          </div>
        </div>
      </a>
    </article>`;
  };

  H.bindGrid = function (gridEl) {
    if (!gridEl) return;
    gridEl.addEventListener('click', e => {
      const card = e.target.closest('.card');
      if (!card) return;
      const id = card.dataset.id;
      if (e.target.closest('[data-wish]')) {
        e.preventDefault();
        e.stopPropagation();
        const liked = H.toggleWish(id);
        const btn = e.target.closest('[data-wish]');
        btn.classList.toggle('liked', liked);
        btn.innerHTML = icon('heart');
        refreshIcons(btn);
        toast(liked ? 'Saved to wishlist' : 'Removed from wishlist');
        return;
      }
      if (e.target.closest('[data-add]')) {
        e.preventDefault();
        e.stopPropagation();
        const p = byId(id);
        H.addToCartUI(id, p.colors[0].name, p.sizes[0], 1);
      }
      if (e.target.closest('[data-prebook]')) {
        e.preventDefault();
        e.stopPropagation();
        H.openPrebook(id);
      }
    });
  };

  H.observeCards = function () {
    const io = new IntersectionObserver(ents => {
      ents.forEach((en, i) => {
        if (en.isIntersecting) {
          setTimeout(() => en.target.classList.add('in'), i * 60);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    $$('.card').forEach(c => io.observe(c));
  };

  /* ---- Ribbon / marquee (seamless, gap-proof) ---- */
  const RIBBON_PHRASE = 'PREBOOK: HABÄNE 01 — LUNAR EDITION · 300 PIECES ONLY ✦    CHECKOUT IN 60 SECONDS — UPI · COD · CARD ✦    FREE SHIPPING ON EVERYTHING ✦    CARRY THE CITY ✦    LIFETIME ZIPPER WARRANTY ✦    ';
  function fillRibbon(track) {
    const phrase = track.dataset.phrase || RIBBON_PHRASE;
    const span = document.createElement('span');
    track.innerHTML = '';
    track.appendChild(span);
    let txt = phrase;
    span.textContent = txt;
    let guard = 0;
    // repeat until one copy is wider than the viewport → -50% loop never shows a gap
    while (span.offsetWidth < window.innerWidth + 200 && guard < 30) {
      txt += phrase;
      span.textContent = txt;
      guard++;
    }
    track.appendChild(span.cloneNode(true));
  }
  H.fillRibbon = fillRibbon;
  function initRibbon() {
    const tracks = $$('.ribbon__track');
    if (!tracks.length) return;
    tracks.forEach(fillRibbon);
    let rt;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => tracks.forEach(fillRibbon), 200);
    });
  }

  /* ---- Sparkling "night sky" footer (all pages) ---- */
  function initFooter() {
    const foot = document.querySelector('.foot');
    if (!foot) return;
    const isHome = document.body.dataset.page === 'home';
    const lookbookHref = isHome ? '#lookbook' : 'index.html#lookbook';
    const storyHref = isHome ? '#story' : 'index.html#story';

    // hand-rolled twinkles — random size, position & rhythm so no two visits match
    let sparkles = '';
    for (let i = 0; i < 26; i++) {
      const big = Math.random() > 0.72;
      sparkles += `<i class="foot__spark ${big ? 'foot__spark--star' : ''}" style="
        left:${(Math.random() * 98).toFixed(1)}%;
        top:${(Math.random() * 92).toFixed(1)}%;
        --tw:${(2.2 + Math.random() * 4.5).toFixed(2)}s;
        --twd:${(Math.random() * 5).toFixed(2)}s;
        --sc:${(0.5 + Math.random() * 1.1).toFixed(2)};">${big ? '✦' : ''}</i>`;
    }

    foot.classList.add('foot--sky');
    foot.innerHTML = `
      <div class="foot__sparks" aria-hidden="true">${sparkles}</div>
      <div class="foot__shimmerline" aria-hidden="true"></div>

      <div class="foot__hero">
        <p class="foot__hero-eyebrow">THE NEXT DROP ✦ 300 PIECES, NUMBERED</p>
        <h3 class="foot__hero-title">HABÄNE 01 — LUNAR EDITION</h3>
        <button type="button" class="foot__prebook" data-open-prebook="p15">PREBOOK YOUR Nº →</button>
      </div>

      <div class="foot__top">
        <div class="foot__brand">
          <img src="assets/brand/wordmark-silver.png" alt="Habäne" class="foot__word" />
          <p class="foot__tag">Carry the city. Leave the baggage.</p>
          <div class="foot__social">
            <a href="#">IG</a><a href="#">TT</a><a href="#">YT</a><a href="#">X</a>
          </div>
        </div>
        <div class="foot__col">
          <h4>The Goods</h4>
          <a href="shop.html?cat=duffel">Duffels</a>
          <a href="shop.html?cat=backpack">Backpacks</a>
          <a href="smart-series.html">Smart Series</a>
          <a href="shop.html?cat=sling">Slings</a>
        </div>
        <div class="foot__col">
          <h4>Lowkey Iconic</h4>
          <a href="${lookbookHref}">Lookbook</a>
          <a href="${storyHref}">Our Lore</a>
          <a href="product.html?id=p15">The Drop List</a>
          <a href="#">Gift Cards fr</a>
        </div>
        <div class="foot__col foot__col--boring">
          <h4>Boring Stuff 🥱</h4>
          <a href="#">Shipping &amp; whatnot</a>
          <a href="#">Returns (it's giving easy)</a>
          <a href="#">Privacy, ig</a>
          <a href="#">Terms &amp; conditions 💤</a>
          <a href="contact.html">Adulting (Contact us)</a>
        </div>
      </div>

      <div class="foot__giant" aria-hidden="true"><span>HABÄNE</span></div>

      <div class="foot__bottom">
        <p>© <span id="yr"></span> Habäne. All rights reserved. No cap.</p>
        <p class="foot__vibe">Made with chaotic good energy ✦ Carry the city</p>
      </div>`;
    const yr = foot.querySelector('#yr');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---- Prebook: numbered reservation modal (all pages) ---- */
  const PREBOOK_BASE = 137; // spots already claimed before the site counter starts

  function prebookCount() {
    try { return (JSON.parse(localStorage.getItem('habane_prebooks')) || []).length; }
    catch { return 0; }
  }

  function initPrebook() {
    if (document.getElementById('prebookPop')) return;
    const wrap = document.createElement('div');
    wrap.className = 'prebook';
    wrap.id = 'prebookPop';
    wrap.setAttribute('aria-hidden', 'true');
    document.body.appendChild(wrap);
    wrap.addEventListener('click', e => {
      if (e.target.closest('[data-prebook-close]')) closeModal(wrap);
    });

    // any element with data-open-prebook opens the modal (footer, hero, drop bar…)
    document.addEventListener('click', e => {
      const opener = e.target.closest('[data-open-prebook]');
      if (opener) { e.preventDefault(); H.openPrebook(opener.dataset.openPrebook); }
    });
  }

  H.openPrebook = function (id) {
    const p = byId(id) || H.PRODUCTS.find(x => x.prebook);
    if (!p) return;
    const pop = document.getElementById('prebookPop');
    if (!pop) return;
    const claimed = PREBOOK_BASE + prebookCount();
    const left = Math.max(0, (p.edition || 300) - claimed);
    const mine = (() => {
      try { return (JSON.parse(localStorage.getItem('habane_prebooks')) || []).find(r => r.id === p.id); }
      catch { return null; }
    })();

    pop.innerHTML = `
      <div class="prebook__overlay" data-prebook-close></div>
      <div class="prebook__panel" role="dialog" aria-modal="true" aria-label="Prebook ${esc(p.name)}">
        <button class="prebook__close" data-prebook-close type="button" aria-label="Close">✕</button>
        <div class="prebook__media"><img src="${p.img}" alt="${esc(p.name)}"><span class="prebook__stamp">Nº ___ / ${p.edition || 300}</span></div>
        <div class="prebook__body">
          <p class="prebook__eyebrow">FIRST ACCESS ✦ DROPS ${p.dropLabel || 'SOON'}</p>
          <h3 class="prebook__title">${esc(p.name)}</h3>
          <p class="prebook__sub">${p.edition || 300} pieces, each laser-etched with its number. Reserve yours free — pay only when it ships. <strong>${left} spots left.</strong></p>
          ${mine ? `
            <div class="prebook__ok">
              <strong>You're already in — Nº ${String(mine.no).padStart(4, '0')}</strong>
              <span>We'll ping ${esc(mine.contact)} the second it drops.</span>
            </div>` : `
            <form class="prebook__form" id="prebookForm">
              <input type="text" id="prebookName" placeholder="your name" required autocomplete="name">
              <input type="text" id="prebookContact" placeholder="phone or email" required>
              <button type="submit" class="prebook__cta">RESERVE MY Nº ✦</button>
            </form>
            <p class="prebook__fine">No payment now. Your Nº is locked for 48h at drop time.</p>`}
        </div>
      </div>`;

    pop.querySelector('#prebookForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = pop.querySelector('#prebookName').value.trim();
      const contact = pop.querySelector('#prebookContact').value.trim();
      if (!name || !contact) return;
      let list;
      try { list = JSON.parse(localStorage.getItem('habane_prebooks')) || []; } catch { list = []; }
      const no = PREBOOK_BASE + list.length + 1;
      list.push({ id: p.id, name, contact, no, at: new Date().toISOString() });
      localStorage.setItem('habane_prebooks', JSON.stringify(list));
      sfx('win');
      pop.querySelector('.prebook__body').innerHTML = `
        <p class="prebook__eyebrow">CONSIDER IT DONE ✦</p>
        <h3 class="prebook__title">You're Nº ${String(no).padStart(4, '0')}</h3>
        <p class="prebook__sub">of ${p.edition || 300}. That number is etched on your bag. We'll ping <strong>${esc(contact)}</strong> the second the drop goes live — ${p.dropLabel || 'soon'}.</p>
        <button type="button" class="prebook__cta" data-prebook-close>CARRY ON →</button>`;
      toast(`Reserved — you're Nº ${String(no).padStart(4, '0')} ✦`);
    });

    openModal(pop);
  };

  /* ---- Floating 3D Showroom button (bottom-right) ---- */
  function initShowroomFab() {
    if (document.body.dataset.page === 'showroom') return;
    if (document.querySelector('.showroom-fab')) return;
    const a = document.createElement('a');
    a.href = 'showroom.html';
    a.className = 'showroom-fab';
    a.setAttribute('aria-label', 'Open 3D Showroom');
    a.innerHTML = `${icon('box')}<span>3D Showroom</span>`;
    document.body.appendChild(a);
    refreshIcons(a);
  }

  /* ---- Boot shared UI ---- */
  H.initShared = function () {
    initNav();
    initDrawer();
    initProfile();
    initWishNav();
    initLocation();
    initSearch();
    initCart();
    initRibbon();
    initFooter();
    initPrebook();
    initShowroomFab();
    const yr = $('#yr');
    if (yr) yr.textContent = new Date().getFullYear();
    refreshIcons();
  };
})();
