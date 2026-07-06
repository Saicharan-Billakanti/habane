/* HABÄNE — Client-side Event Tracking and Content Override Injector */

(function () {
  const H = window.HABANE;
  if (!H) return;

  // Helper to log events to localStorage
  function logEvent(eventType, metadata = {}) {
    try {
      const events = JSON.parse(localStorage.getItem('habane_events')) || [];
      const loc = H.getLocation?.() || { code: 'IN', currency: 'INR' };
      const event = {
        id: 'EV-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
        event_type: eventType,
        timestamp: new Date().toISOString(),
        country: loc.code,
        currency: loc.currency,
        product_id: metadata.productId || null,
        quantity: metadata.quantity || null,
        search_query: metadata.searchQuery || null,
        order_total: metadata.orderTotal !== undefined ? Number(metadata.orderTotal) : null,
        customer_email: metadata.customerEmail || null,
        status: metadata.status || null
      };
      events.push(event);
      localStorage.setItem('habane_events', JSON.stringify(events));
    } catch (e) {
      console.error("Error writing event to localStorage:", e);
    }
  }

  let searchDebounceTimeout = null;

  // Unified tracker and override bootstrap
  function initTrackingAndOverrides() {
    // 1.1 Product detail view
    if (window.location.pathname.includes('product.html')) {
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('id');
      if (prodId) {
        logEvent('Product Viewed', { productId: prodId });
      }
    }

    // 1.2 Checkout started on checkout page load
    if (window.location.pathname.includes('checkout.html')) {
      const sub = H.cartSubtotal?.() || 0;
      const disc = H.discountValue?.(sub) || 0;
      logEvent('Checkout Started', { orderTotal: sub - disc });
    }

    // 1.3 Apply Content Overrides dynamically
    applyContentOverrides();

    // 2. Search Event Tracking (Debounced)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimeout);
        const query = e.target.value.trim();
        if (query.length >= 3) {
          searchDebounceTimeout = setTimeout(() => {
            logEvent('Product Searched', { searchQuery: query });
          }, 1000);
        }
      });
    }
  }

  // Safe DOM ready execution check for async script injection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrackingAndOverrides);
  } else {
    initTrackingAndOverrides();
  }

  // 3. Cart Event Tracking (intercept additions via cart updates)
  let prevCart = JSON.parse(localStorage.getItem('habane_cart')) || [];
  H.events?.addEventListener('cart:update', () => {
    const currCart = H.cartData || [];
    // Determine what changed
    currCart.forEach(currItem => {
      const prevItem = prevCart.find(p => p.key === currItem.key);
      if (!prevItem) {
        // Brand new item added to cart
        logEvent('Product Added to Cart', { productId: currItem.id, quantity: currItem.qty });
      } else if (currItem.qty > prevItem.qty) {
        // Quantity bumped
        logEvent('Product Added to Cart', { productId: currItem.id, quantity: currItem.qty - prevItem.qty });
      }
    });
    prevCart = JSON.parse(JSON.stringify(currCart));
  });

  // 4. Wishlist Event Tracking (Wishlist Added / Removed)
  H.events?.addEventListener('wish:update', (e) => {
    const prodId = e.detail?.id;
    if (prodId) {
      const isLiked = H.isWish?.(prodId);
      logEvent(isLiked ? 'Wishlist Added' : 'Wishlist Removed', { productId: prodId });
    }
  });

  // 5. Country and Currency Change Tracking
  let prevLoc = H.getLocation?.();
  H.events?.addEventListener('location:update', (e) => {
    const currLoc = e.detail;
    if (!prevLoc) {
      prevLoc = currLoc;
      return;
    }
    if (currLoc.code !== prevLoc.code) {
      logEvent('Country Changed', { status: `${prevLoc.code} -> ${currLoc.code}` });
    }
    if (currLoc.currency !== prevLoc.currency) {
      logEvent('Currency Changed', { status: `${prevLoc.currency} -> ${currLoc.currency}` });
    }
    prevLoc = currLoc;
  });

  // 6. Form Submission Capturing (Newsletter, Contact, Checkout)
  document.addEventListener('submit', function (e) {
    const form = e.target;
    const loc = H.getLocation?.() || { code: 'IN', currency: 'INR' };

    // 6.1 Newsletter signup
    if (form.id === 'newsForm') {
      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        const email = emailInput.value.trim();
        try {
          const list = JSON.parse(localStorage.getItem('habane_news_list')) || [];
          if (!list.some(n => n.email === email)) {
            list.push({
              id: 'NL-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
              email: email,
              created_at: new Date().toISOString(),
              country: loc.code
            });
            localStorage.setItem('habane_news_list', JSON.stringify(list));
          }
        } catch (err) {
          console.error("Newsletter save error:", err);
        }
        logEvent('Newsletter Subscription', { customerEmail: email });
      }
    }

    // 6.2 Contact Message
    if (form.id === 'contactForm') {
      const emailInput = form.querySelector('input[name="email"]');
      const nameInput = form.querySelector('input[name="name"]') || form.querySelector('input[type="text"]');
      const msgInput = form.querySelector('textarea');
      if (emailInput && emailInput.value) {
        const email = emailInput.value.trim();
        const name = nameInput ? nameInput.value.trim() : 'Anonymous';
        const msg = msgInput ? msgInput.value.trim() : '';

        try {
          const msgs = JSON.parse(localStorage.getItem('habane_msgs')) || [];
          msgs.push({
            id: 'MSG-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
            name: name,
            email: email,
            message: msg,
            status: 'Unread',
            created_at: new Date().toISOString(),
            country: loc.code
          });
          localStorage.setItem('habane_msgs', JSON.stringify(msgs));
        } catch (err) {
          console.error("Contact message save error:", err);
        }
        logEvent('Contact Message', { customerEmail: email });
      }
    }

    // 6.3 Checkout & Order Placed
    if (form.id === 'coForm') {
      // Form values captured during the capturing phase
      const firstName = form.querySelectorAll('input[placeholder="First name"]')[0]?.value || '';
      const lastName = form.querySelectorAll('input[placeholder="Last name"]')[0]?.value || '';
      const email = form.querySelector('input[type="email"]')?.value || '';
      const phone = form.querySelector('input[type="tel"]')?.value || '';
      const address = form.querySelector('input[placeholder="Address"]')?.value || '';
      const city = form.querySelector('input[placeholder="City"]')?.value || '';
      const pin = form.querySelector('input[placeholder="PIN code"]')?.value || '';

      const cart = JSON.parse(JSON.stringify(H.cartData || []));
      const subtotal = H.cartSubtotal?.() || 0;
      const discount = H.discountValue?.(subtotal) || 0;
      const shipping = subtotal >= H.FREE_SHIP ? 0 : 150; // default shipping
      const total = subtotal - discount + shipping;
      const promo = H.promoData ? H.promoData.code : null;

      // checkout.js generates order ID and empties cart synchronously in bubbling phase.
      // Wait 0ms until that runs, so that #doneOrder is updated, then record order details.
      setTimeout(() => {
        const orderIdEl = document.getElementById('doneOrder');
        const orderId = orderIdEl ? orderIdEl.textContent.trim() : 'HB-' + Math.random().toString(36).slice(2, 8).toUpperCase();

        try {
          const orders = JSON.parse(localStorage.getItem('habane_orders')) || [];
          const newOrder = {
            id: orderId,
            customer_name: `${firstName} ${lastName}`.trim() || 'Guest Customer',
            customer_email: email,
            phone: phone,
            address: `${address}, ${city} - ${pin}`,
            country: loc.code,
            currency: loc.currency,
            products: cart.map(i => {
              const p = H.byId(i.id) || {};
              return {
                id: i.id,
                name: p.name || 'Travel Bag',
                color: i.color,
                size: i.size,
                qty: i.qty,
                price: p.price || 0
              };
            }),
            quantity: cart.reduce((s, i) => s + i.qty, 0),
            subtotal: subtotal,
            discount: discount,
            shipping_fee: shipping,
            total: total,
            status: 'New',
            promo_code: promo,
            created_at: new Date().toISOString()
          };
          orders.push(newOrder);
          localStorage.setItem('habane_orders', JSON.stringify(orders));

          // If promo was used, increment its usage statistics
          if (promo) {
            updatePromoStats(promo, total);
          }
        } catch (err) {
          console.error("Order save error:", err);
        }

        logEvent('Order Placed', { orderTotal: total, customerEmail: email });
      }, 0);
    }
  }, true); // Use capturing listener to run BEFORE store resets

  // Increment usage count & revenue generated for promo code
  function updatePromoStats(code, orderTotal) {
    try {
      const promos = JSON.parse(localStorage.getItem('habane_promotions')) || [];
      const pIndex = promos.findIndex(x => x.code === code);
      if (pIndex > -1) {
        promos[pIndex].usage_count = (promos[pIndex].usage_count || 0) + 1;
        promos[pIndex].revenue_generated = (promos[pIndex].revenue_generated || 0) + orderTotal;
        localStorage.setItem('habane_promotions', JSON.stringify(promos));
      }
    } catch (e) {
      console.error("Error updating promo stats:", e);
    }
  }

  // Inject content overrides dynamically into storefront DOM
  function applyContentOverrides() {
    try {
      const content = JSON.parse(localStorage.getItem('habane_content_overrides'));
      if (!content) return;

      // 1. Hero Banner overrides
      const heroImg = document.querySelector('.hero-banner__img');
      if (heroImg) {
        if (content.hero_image) heroImg.src = content.hero_image;
        if (content.hero_alt) heroImg.alt = content.hero_alt;
      }

      // 2. Ribbon overrides
      const ribbonTracks = document.querySelectorAll('.ribbon__track');
      if (ribbonTracks.length > 0 && content.ribbon_text) {
        ribbonTracks.forEach(track => {
          track.dataset.phrase = content.ribbon_text;
          if (H.fillRibbon) H.fillRibbon(track);
        });
      }

      // Periodic check to enforce custom ribbon text against any browser caching or layout resets
      setInterval(() => {
        const activeTracks = document.querySelectorAll('.ribbon__track');
        if (activeTracks.length > 0 && content.ribbon_text) {
          activeTracks.forEach(track => {
            const hasCustomText = track.textContent.includes(content.ribbon_text.trim());
            if (track.dataset.phrase !== content.ribbon_text || !hasCustomText) {
              track.dataset.phrase = content.ribbon_text;
              if (H.fillRibbon) H.fillRibbon(track);
            }
          });
        }
      }, 500);

      // 3. Announcements / Story text overrides
      const announcements = document.querySelector('.strip__track');
      if (announcements && content.announcement_text) {
        const spans = announcements.querySelectorAll('span');
        spans.forEach(span => {
          span.textContent = content.announcement_text + ' · ';
        });
      }
      const storyTitle = document.querySelector('.story__title');
      if (storyTitle && content.story_title) {
        storyTitle.innerHTML = content.story_title;
      }
      const storyDesc = document.querySelector('.story p');
      if (storyDesc && content.story_desc) {
        storyDesc.textContent = content.story_desc;
      }

      // 4. Smart Series overrides
      const ssHeroTitle = document.querySelector('.ss-hero2__title');
      if (ssHeroTitle && content.smart_hero_title) {
        ssHeroTitle.textContent = content.smart_hero_title;
      }
      const ssHeroDesc = document.querySelector('.ss-hero2__copy p:not(.hero__eyebrow)');
      if (ssHeroDesc && content.smart_hero_desc) {
        ssHeroDesc.textContent = content.smart_hero_desc;
      }

      // 5. FAQ overrides (modifying H.FAQ_ITEMS array and re-rendering FAQ track cards)
      if (content.faqs && Array.isArray(content.faqs) && content.faqs.length > 0) {
        H.FAQ_ITEMS.length = 0;
        H.FAQ_ITEMS.push(...content.faqs);

        const faqTrack = document.getElementById('faqTrack');
        if (faqTrack) {
          faqTrack.innerHTML = content.faqs.map((item, i) => `
            <article class="faq-card" data-index="${i}">
              <div class="faq-card__media">
                <img src="${item.img}" alt="">
              </div>
              <div class="faq-card__body">
                <span class="faq-card__tag">${item.tag}</span>
                <h3 class="faq-card__q">"${item.q.toUpperCase()}"</h3>
                <p class="faq-card__a">${item.a}</p>
              </div>
            </article>`).join('');

          const cards = faqTrack.querySelectorAll('.faq-card');
          if (cards.length > 0) cards[0].classList.add('is-active');
          if (H.refreshIcons) H.refreshIcons(faqTrack);
        }
      }

      // 6. Footer Content details (run slightly later or directly if rendered)
      setTimeout(() => {
        // Backup ribbon sync in case components.js loaded late
        const ribbonTracksLater = document.querySelectorAll('.ribbon__track');
        if (ribbonTracksLater.length > 0 && content.ribbon_text) {
          ribbonTracksLater.forEach(track => {
            track.dataset.phrase = content.ribbon_text;
            if (H.fillRibbon) H.fillRibbon(track);
          });
        }

        const details = document.querySelectorAll('.foot-acc');
        if (details.length >= 3) {
          if (content.footer_acc_1_title) details[0].querySelector('summary').textContent = content.footer_acc_1_title;
          if (content.footer_acc_1_desc) details[0].querySelector('p').textContent = content.footer_acc_1_desc;
          if (content.footer_acc_2_title) details[1].querySelector('summary').textContent = content.footer_acc_2_title;
          if (content.footer_acc_2_desc) details[1].querySelector('p').textContent = content.footer_acc_2_desc;
          if (content.footer_acc_3_title) details[2].querySelector('summary').textContent = content.footer_acc_3_title;
          if (content.footer_acc_3_desc) details[2].querySelector('p').textContent = content.footer_acc_3_desc;
        }
      }, 50);
    } catch (e) {
      console.error("Error applying Habäne content overrides:", e);
    }
  }
})();
