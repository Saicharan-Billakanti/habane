/* HABÄNE — express checkout (UI only)
   Speed levers: saved details prefill, UPI-first payment tabs,
   COD = zero extra fields, live total on the pay button. */

(function () {
  const H = window.HABANE;
  const $ = s => document.querySelector(s);

  let payMethod = 'upi';

  function total() {
    const sub = H.cartSubtotal();
    return sub - H.discountValue(sub);
  }

  function renderSummary() {
    const cart = H.cartData;
    const list = $('#coItems');
    const empty = $('#coEmpty');
    if (!cart.length) {
      if (list) list.innerHTML = '';
      empty?.removeAttribute('hidden');
      updateSubmit();
      return;
    }
    empty?.setAttribute('hidden', '');
    if (list) {
      list.innerHTML = cart.map(i => {
        const p = H.byId(i.id);
        return `<div class="co-line">
          <img src="${p.img}" alt="">
          <div><strong>${p.name}</strong><span>${i.color} · ${i.size} · Qty ${i.qty}</span></div>
          <em>${H.inr(p.price * i.qty)}</em>
        </div>`;
      }).join('');
    }
    const sub = H.cartSubtotal();
    const disc = H.discountValue(sub);
    $('#coSubtotal').textContent = H.inr(sub);
    const discRow = $('#coDiscRow');
    if (disc > 0) {
      discRow.hidden = false;
      $('#coDisc').textContent = '−' + H.inr(disc);
    } else discRow.hidden = true;
    $('#coTotal').textContent = H.inr(sub - disc);
    updateSubmit();
  }

  /* pay button always shows exactly what happens next */
  function updateSubmit() {
    const label = $('#coSubmitLabel');
    if (!label) return;
    const t = H.inr(total());
    label.textContent =
      payMethod === 'cod' ? `PLACE ORDER · ${t} ON DELIVERY`
      : payMethod === 'card' ? `PAY ${t} · CARD`
      : `PAY ${t} · UPI`;
  }

  /* ---- payment method tabs: only the active method's fields exist ---- */
  function initPays() {
    const wrap = $('#coPays');
    if (!wrap) return;
    wrap.addEventListener('click', e => {
      const btn = e.target.closest('.xco__pay');
      if (!btn) return;
      payMethod = btn.dataset.pay;
      wrap.querySelectorAll('.xco__pay').forEach(b => b.classList.toggle('is-on', b === btn));
      document.querySelectorAll('[data-paybody]').forEach(el => {
        el.hidden = el.dataset.paybody !== payMethod;
      });
      updateSubmit();
    });
  }

  /* ---- remember shipping details so round two is a single tap ---- */
  const SAVE_KEY = 'habane_checkout_info';
  const FIELDS = ['coName', 'coPhone', 'coAddr', 'coPin', 'coCity', 'coUpi'];

  function prefill() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { saved = null; }
    if (!saved) return;
    let filled = 0;
    FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && saved[id]) { el.value = saved[id]; filled++; }
    });
    if (filled >= 3) {
      const note = $('#coWelcome');
      if (note) { note.hidden = false; H.refreshIcons(note); }
    }
  }

  function persist() {
    const data = {};
    FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim()) data[id] = el.value.trim();
    });
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  function validate() {
    const required = ['coName', 'coPhone', 'coAddr', 'coPin', 'coCity'];
    if (payMethod === 'card') required.push('coCard', 'coExp', 'coCvv');
    let firstBad = null;
    required.forEach(id => {
      const el = document.getElementById(id);
      const bad = !el || !el.value.trim();
      el?.classList.toggle('is-bad', bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) { firstBad.focus(); H.toast('Almost there — fill the highlighted bits'); }
    return !firstBad;
  }

  document.addEventListener('DOMContentLoaded', () => {
    H.initShared();
    renderSummary();
    initPays();
    prefill();
    H.events.addEventListener('cart:update', renderSummary);

    $('#coForm')?.addEventListener('submit', e => {
      e.preventDefault();
      if (!H.cartData.length) { H.toast('Your bag is empty'); return; }
      if (!validate()) return;
      persist();
      const order = 'HB-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      $('#doneOrder').textContent = order;
      const t = H.inr(total());
      const qty = H.cartQty();
      const how = payMethod === 'cod' ? 'Pay on delivery' : payMethod === 'card' ? 'Card charged' : 'UPI request sent';
      $('#doneMsg').textContent = `${qty} item${qty !== 1 ? 's' : ''} · ${t} · ${how}. Your bags are on the way.`;
      H.clearCart();
      H.sfx?.('win');
      H.openModal($('#checkoutDone'));
    });

    $('#checkoutDone')?.addEventListener('click', e => {
      if (e.target.closest('[data-done-close]')) {
        H.closeModal($('#checkoutDone'));
        location.href = 'index.html';
      }
    });
  });
})();
