/* HABÄNE — product detail page */

(function () {
  const H = window.HABANE;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  let state = { color: null, size: null, qty: 1, imgIndex: 0 };

  function render(p) {
    if (!p) {
      document.querySelector('.pd')?.replaceChildren(Object.assign(document.createElement('p'), { textContent: 'Product not found.', className: 'pd__missing' }));
      return;
    }

    document.title = `${p.name} — HABÄNE`;
    state.color = p.colors[0].name;
    state.size = p.sizes[0];

    const imgs = p.images || [p.img, p.img2].filter(Boolean);
    const mainImg = document.getElementById('pdMainImg');
    const thumbs = document.getElementById('pdThumbs');
    if (mainImg) { mainImg.src = imgs[0]; mainImg.alt = p.name; }
    if (thumbs) {
      thumbs.innerHTML = imgs.map((src, i) =>
        `<button type="button" class="pd__thumb ${i === 0 ? 'is-active' : ''}" data-i="${i}"><img src="${src}" alt=""></button>`).join('');
    }

    document.getElementById('pdCat').textContent = p.catLabel;
    document.getElementById('pdName').textContent = p.name;
    const crumb = document.getElementById('pdNameCrumb');
    if (crumb) crumb.textContent = p.name;

    // script tagline (highlighter swipe) — one liner per category
    const TAGLINES = {
      duffel: 'Carry stories, not stuff.',
      backpack: 'Built for the detours.',
      sling: 'Essentials only. Ego optional.',
      smart: 'The bag that thinks.',
    };
    const tagline = document.getElementById('pdTagline');
    if (tagline) tagline.innerHTML = `<mark class="hl">${TAGLINES[p.cat] || TAGLINES.duffel}</mark>`;

    // scrapbook props: handwritten note + the two polaroids
    const note = document.getElementById('pdNote');
    if (note) note.innerHTML = (GRAFFITI[p.cat] || GRAFFITI.duffel).replace(' ', '<br>');
    const pol1 = document.getElementById('pdPolaroid1');
    const pol2 = document.getElementById('pdPolaroid2');
    if (pol1) pol1.src = imgs[1] || imgs[0];
    if (pol2) pol2.src = imgs[2] || imgs[1] || imgs[0];

    const fmtCount = n => n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : n;
    document.getElementById('pdStars').innerHTML = H.stars(p.stars) +
      (p.reviews ? ` <em class="pd__revs">(${fmtCount(p.reviews)} reviews)</em>` : '');
    document.getElementById('pdDesc').textContent = p.desc;

    const savePct = (p.was && p.was > p.price) ? Math.round((p.was - p.price) / p.was * 100) : 0;
    document.getElementById('pdPrice').innerHTML =
      `<span data-inr="${p.price}">${H.inr(p.price)}</span>` +
      (p.was ? ` <s data-inr="${p.was}">${H.inr(p.was)}</s>` : '') +
      (savePct ? ` <span class="pd__savechip">SAVE ${savePct}%</span>` : '');

    const badge = document.getElementById('pdBadge');
    if (badge) {
      badge.textContent = p.badge || '';
      badge.hidden = !p.badge;
    }

    document.getElementById('pdColors').innerHTML = p.colors.map((c, i) =>
      `<button type="button" class="pd__color ${i === 0 ? 'on' : ''}" data-color="${c.name}" title="${c.name}" style="--c:${c.hex}"></button>`).join('');
    document.getElementById('pdColorName').textContent = p.colors[0].name;

    document.getElementById('pdSizes').innerHTML = p.sizes.map((s, i) =>
      `<button type="button" class="pd__size ${i === 0 ? 'on' : ''}" data-size="${s}">${s}</button>`).join('');

    document.getElementById('pdQty').textContent = '1';

    const specs = document.getElementById('pdSpecs');
    if (specs && p.specs) {
      specs.innerHTML = Object.entries(p.specs).map(([k, v]) =>
        `<div class="pd__spec"><span>${k}</span><strong>${v}</strong></div>`).join('');
    }

    const feats = document.getElementById('pdSmartFeats');
    if (feats) {
      const list = (p.smartFeatures || []).map(fid => H.SMART_FEATURES.find(f => f.id === fid)).filter(Boolean);
      feats.innerHTML = list.length
        ? list.map(f => `<div class="pd__feat"><span class="pd__feat-icon">${H.icon(f.icon)}</span><div><strong>${f.title}</strong><p>${f.desc}</p></div></div>`).join('')
        : '<p class="pd__no-smart">Classic carry — no smart electronics in this model.</p>';
      H.refreshIcons(feats);
    }

    const wishBtn = document.getElementById('pdWish');
    if (wishBtn) {
      const liked = H.isWish(p.id);
      wishBtn.classList.toggle('liked', liked);
      wishBtn.innerHTML = H.icon('heart') + (liked ? ' Saved' : ' Wishlist');
      H.refreshIcons(wishBtn);
    }

    // limited drop: swap buy actions for a single PREBOOK reservation CTA
    if (p.prebook) {
      const actions = document.querySelector('.pd__actions');
      if (actions) {
        actions.innerHTML = `
          <button class="pd__prebook" id="pdPrebook" type="button">
            PREBOOK ✦ RESERVE YOUR Nº
            <em>${p.edition || 300} pieces · drops ${p.dropLabel || 'soon'} · no payment now</em>
          </button>`;
        document.getElementById('pdPrebook').addEventListener('click', () => H.openPrebook(p.id));
      }
      document.getElementById('pdPrice').insertAdjacentHTML('beforeend',
        `<span class="pd__drop-chip">DROPS ${p.dropLabel || 'SOON'}</span>`);
    }
  }

  function renderRelated(p) {
    const track = document.getElementById('relatedGrid');
    if (!track) return;
    const same = H.PRODUCTS.filter(x => x.id !== p.id && x.cat === p.cat);
    const others = H.PRODUCTS.filter(x => x.id !== p.id && x.cat !== p.cat);
    const rel = [...same, ...others].slice(0, 10);
    track.innerHTML = rel.map(x => H.cardHTML(x)).join('');
    H.bindGrid(track);
    H.observeCards();
    H.refreshIcons(track);

    const step = () => {
      const card = track.querySelector('.card');
      const w = card ? card.getBoundingClientRect().width + 20 : 320;
      return Math.max(w, Math.round(track.clientWidth * 0.8));
    };
    document.getElementById('relPrev')?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    document.getElementById('relNext')?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  }

  /* ---- product stage: breathing aura + drifting sparks behind the gallery ---- */
  const GRAFFITI = {
    duffel: 'built for escapes',
    backpack: 'built for detours',
    sling: 'essentials only',
    smart: 'the bag that thinks',
  };

  function initAura(p) {
    const gal = document.querySelector('.pd__gallery');
    if (!gal) return;
    const aura = document.createElement('div');
    aura.className = 'pd__aura' + (p.prebook ? ' pd__aura--brass' : '');
    gal.prepend(aura);

    const main = gal.querySelector('.pd__main');
    if (main) {
      // hand-script graffiti over the stage
      main.insertAdjacentHTML('beforeend',
        `<span class="pd__graffiti" aria-hidden="true">${GRAFFITI[p.cat] || GRAFFITI.duffel} <i>///</i></span>`);
      // rating chip, bottom-left — like a gallery placard
      if (p.reviews) {
        const fmt = n => n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : n;
        main.insertAdjacentHTML('beforeend',
          `<span class="pd__ratechip">★ <b>${p.stars === 5 ? '4.8' : '4.5'}/5</b> ${fmt(p.reviews)}+ reviews</span>`);
      }
      // 360° badge → the 3D showroom
      main.insertAdjacentHTML('beforeend',
        `<a class="pd__360" href="showroom.html" aria-label="Open 3D showroom">360°<i>↻</i></a>`);
      // spray smiley, corner tag
      main.insertAdjacentHTML('beforeend', `<span class="pd__smile" aria-hidden="true">☻</span>`);
    }

    const wrap = document.createElement('div');
    wrap.className = 'pd__sparks';
    let sp = '';
    const n = p.prebook ? 12 : 7;
    for (let i = 0; i < n; i++) {
      const star = p.prebook && i % 3 === 0;
      sp += `<i class="pd__spark ${star ? 'pd__spark--star' : ''}" style="
        left:${(4 + Math.random() * 92).toFixed(1)}%;
        top:${(4 + Math.random() * 88).toFixed(1)}%;
        --tw:${(2.4 + Math.random() * 3.8).toFixed(2)}s;
        --twd:${(Math.random() * 4).toFixed(2)}s;">${star ? '✦' : ''}</i>`;
    }
    wrap.innerHTML = sp;
    gal.querySelector('.pd__main')?.appendChild(wrap);
  }

  /* ---- price rolls up to its value on load ---- */
  function countUpPrice(p) {
    const el = document.querySelector('#pdPrice [data-inr]');
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = p.price;
    const start = Math.round(target * 0.72);
    const t0 = performance.now();
    (function frame(t) {
      const k = Math.min(1, (t - t0) / 700);
      const ease = 1 - Math.pow(1 - k, 3);
      el.textContent = H.inr(Math.round(start + (target - start) * ease));
      if (k < 1) requestAnimationFrame(frame);
    })(t0);
  }

  /* ---- "people eyeing this rn" — seeded per product, wobbles gently ---- */
  function initLiveEyes(p) {
    const rateRow = document.querySelector('.pd__rate');
    if (!rateRow || p.prebook) return; // the drop has its own scarcity story
    const seed = [...p.id].reduce((s, c) => s + c.charCodeAt(0), 0);
    let n = 8 + (seed % 17);
    const el = document.createElement('span');
    el.className = 'pd__live';
    el.innerHTML = `<span class="pd__live-dot"></span><b>${n}</b>&nbsp;people eyeing this rn`;
    rateRow.appendChild(el);
    setInterval(() => {
      n = Math.min(29, Math.max(6, n + (Math.random() > 0.5 ? 1 : -1)));
      const b = el.querySelector('b');
      if (b) b.textContent = n;
    }, 7000);
  }

  /* Amazon-style hover-to-zoom on the main product image (desktop only) */
  function initZoom() {
    const box = document.querySelector('.pd__main');
    const img = document.getElementById('pdMainImg');
    if (!box || !img) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    box.classList.add('pd__main--zoom');
    if (!box.querySelector('.pd__zoom-hint')) {
      box.insertAdjacentHTML('beforeend',
        `<span class="pd__zoom-hint">${H.icon('zoom-in')} Hover to zoom</span>`);
      H.refreshIcons(box);
    }
    const ZOOM = 2.3;
    box.addEventListener('mousemove', e => {
      const r = box.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
      img.style.transform = `scale(${ZOOM})`;
    });
    box.addEventListener('mouseenter', () => box.classList.add('is-zooming'));
    box.addEventListener('mouseleave', () => {
      box.classList.remove('is-zooming');
      img.style.transform = 'scale(1)';
      img.style.transformOrigin = 'center';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    H.initShared();
    const p = H.byId(id);
    render(p);
    if (!p) return;
    renderRelated(p);
    initZoom();
    initAura(p);
    countUpPrice(p);
    initLiveEyes(p);

    document.getElementById('pdThumbs')?.addEventListener('click', e => {
      const t = e.target.closest('.pd__thumb');
      if (!t) return;
      const imgs = p.images || [p.img];
      document.getElementById('pdMainImg').src = imgs[t.dataset.i];
      document.querySelectorAll('.pd__thumb').forEach(x => x.classList.remove('is-active'));
      t.classList.add('is-active');
    });

    document.querySelector('.pd')?.addEventListener('click', e => {
      const col = e.target.closest('[data-color]');
      const siz = e.target.closest('[data-size]');
      const step = e.target.closest('[data-step]');
      if (col) {
        state.color = col.dataset.color;
        document.querySelectorAll('.pd__color').forEach(b => b.classList.remove('on'));
        col.classList.add('on');
        document.getElementById('pdColorName').textContent = col.dataset.color;
      }
      if (siz) {
        state.size = siz.dataset.size;
        document.querySelectorAll('.pd__size').forEach(b => b.classList.remove('on'));
        siz.classList.add('on');
      }
      if (step) {
        state.qty = Math.max(1, state.qty + Number(step.dataset.step));
        document.getElementById('pdQty').textContent = state.qty;
      }
    });

    document.getElementById('pdAdd')?.addEventListener('click', () => {
      H.addToCartUI(p.id, state.color, state.size, state.qty);
    });

    document.getElementById('pdBuy')?.addEventListener('click', () => {
      H.addToCart(p.id, state.color, state.size, state.qty);
      H.syncCart();
      location.href = 'checkout.html';
    });

    document.getElementById('pdWish')?.addEventListener('click', () => {
      const liked = H.toggleWish(p.id);
      const btn = document.getElementById('pdWish');
      btn.classList.toggle('liked', liked);
      btn.innerHTML = H.icon('heart') + (liked ? ' Saved' : ' Wishlist');
      H.refreshIcons(btn);
      H.toast(liked ? 'Saved to wishlist' : 'Removed from wishlist');
    });

    if (window.gsap) {
      gsap.from('.spread__left, .spread__stage, .buycard', { y: 24, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' });
    }
  });
})();
