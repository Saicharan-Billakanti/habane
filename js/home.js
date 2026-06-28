/* HABÄNE — homepage */

(function () {
  const H = window.HABANE;

  function initFeatured() {
    const grid = document.getElementById('grid');
    if (!grid) return;
    const featured = H.PRODUCTS.filter(p => p.featured).slice(0, 4);
    grid.innerHTML = featured.map(p => H.cardHTML(p)).join('');
    H.bindGrid(grid);
    H.observeCards();
    H.refreshIcons();
  }

  function initSmartSplit() {
    const section = document.querySelector('.smart-split');
    if (!section || !window.gsap) return;
    gsap.from('.smart-split__panel', {
      scrollTrigger: { trigger: section, start: 'top 80%' },
      y: 40, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
    });
  }

  function initFaqCarousel() {
    const track = document.getElementById('faqTrack');
    const prev = document.getElementById('faqPrev');
    const next = document.getElementById('faqNext');
    if (!track) return;

    track.innerHTML = H.FAQ_ITEMS.map((item, i) => `
      <article class="faq-card" data-index="${i}">
        <div class="faq-card__media">
          <img src="${item.img}" alt="">
        </div>
        <div class="faq-card__body">
          <span class="faq-card__tag">${item.tag}</span>
          <h3 class="faq-card__q">"${item.q.toUpperCase()}"</h3>
          <p class="faq-card__a">${item.a}</p>
          <div class="faq-card__nav">
            <button type="button" class="faq-card__arrow" data-faq-prev aria-label="Previous">${H.icon('chevron-left')}</button>
            <button type="button" class="faq-card__arrow" data-faq-next aria-label="Next">${H.icon('chevron-right')}</button>
          </div>
        </div>
      </article>`).join('');

    let index = 0;
    const cards = [...track.querySelectorAll('.faq-card')];
    const total = cards.length;

    function goTo(i) {
      index = (i + total) % total;
      track.style.transform = `translateX(calc(-${index} * (min(88vw, 720px) + 1.2rem)))`;
      cards.forEach((c, j) => c.classList.toggle('is-active', j === index));
    }

    prev?.addEventListener('click', () => goTo(index - 1));
    next?.addEventListener('click', () => goTo(index + 1));
    track.addEventListener('click', e => {
      if (e.target.closest('[data-faq-prev]')) goTo(index - 1);
      if (e.target.closest('[data-faq-next]')) goTo(index + 1);
    });

    let startX = 0;
    let dragging = false;
    track.addEventListener('pointerdown', e => { dragging = true; startX = e.clientX; track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointerup', e => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if (dx > 60) goTo(index - 1);
      else if (dx < -60) goTo(index + 1);
    });

    goTo(0);
    H.refreshIcons(track);
  }

  function initShowroom() {
    const viewer = document.getElementById('viewer');
    const models = window.HABANE_MODELS;
    if (!viewer || !models) return;
    viewer.src = models.carryon;

    document.getElementById('modelPick')?.addEventListener('click', e => {
      const btn = e.target.closest('.model-pick');
      if (!btn) return;
      const key = btn.dataset.model;
      if (!models[key]) return;
      document.querySelectorAll('.model-pick').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      viewer.src = models[key];
      viewer.cameraOrbit = '35deg 75deg 110%';
      H.toast(`Now viewing — ${btn.querySelector('.model-pick__name').textContent}`);
    });

    const spinBtn = document.getElementById('spinToggle');
    spinBtn?.addEventListener('click', () => {
      const on = viewer.hasAttribute('auto-rotate');
      if (on) viewer.removeAttribute('auto-rotate');
      else viewer.setAttribute('auto-rotate', '');
      spinBtn.classList.toggle('is-active', !on);
    });

    document.getElementById('resetView')?.addEventListener('click', () => {
      viewer.cameraOrbit = '35deg 75deg 110%';
      viewer.fieldOfView = 'auto';
      viewer.jumpCameraToGoal?.();
    });
  }

  function initNewsletter() {
    document.getElementById('newsForm')?.addEventListener('submit', e => {
      e.preventDefault();
      document.getElementById('newsDone').textContent = "You're in. Welcome to the list.";
      e.target.reset();
      H.toast('Subscribed — see you in your inbox');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    H.initShared();
    
    const heroViewer = document.getElementById('heroViewer');
    if (heroViewer && window.HABANE_MODELS) {
      heroViewer.src = window.HABANE_MODELS.voyager;
    }

    const bagCta = document.querySelector('#heroBagCta .hero-shop-cta__anim');
    if (bagCta) H.initBag3d(bagCta);
    initFeatured();
    initSmartSplit();
    initFaqCarousel();
    initShowroom();
    initNewsletter();
    if (window.gsap) {
      gsap.from('.hero__inner > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.2 });
    }
  });
})();
