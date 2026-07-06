/* HABÄNE ADMIN — Promotions Module */

import { db, escHTML } from './utils.js';
import { showToast } from './ui.js';

export function render(container) {
  const promos = db.getPromotions();
  const orders = db.getOrders();

  // Aggregate stats per promo
  const getPromoStats = (code) => {
    const promoOrders = orders.filter(o => o.promo_code === code);
    const usageCount = promoOrders.length;
    const totalRevenue = promoOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageOrderValue = usageCount > 0 ? Math.round(totalRevenue / usageCount) : 0;
    
    return { usageCount, totalRevenue, averageOrderValue };
  };

  container.innerHTML = `
    <div class="module-header">
      <div class="module-header__title">
        <h1>Promotions</h1>
        <p>Manage promo codes, discount percentages, and track coupon conversion performance.</p>
      </div>
      <div class="module-actions">
        <button class="admin-btn admin-btn--primary" id="createNewPromoBtn">
          <i data-lucide="plus"></i> Create Code
        </button>
      </div>
    </div>

    <div class="form-grid">
      <!-- 1. Promotions List Table -->
      <div class="glass-card" style="padding: 0; overflow: hidden; grid-column: span 2;">
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Promo Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Usage Count</th>
                <th>AOV (INR)</th>
                <th>Revenue Generated</th>
                <th>Active Dates</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${promos.map(p => {
                const { usageCount, totalRevenue, averageOrderValue } = getPromoStats(p.code);
                
                // Expiry status
                let isExpired = false;
                if (p.active_dates && p.active_dates.includes('to')) {
                  const parts = p.active_dates.split(' to ');
                  if (parts[1]) {
                    const expiryDate = new Date(parts[1]);
                    if (expiryDate < new Date()) isExpired = true;
                  }
                }

                return `
                  <tr data-promo-code="${escHTML(p.code)}">
                    <td style="font-weight: 700; color: var(--navy); font-family: 'Conthrax', sans-serif;">${escHTML(p.code)}</td>
                    <td style="text-transform: uppercase;">${p.type === 'pct' ? 'Percentage' : 'Free Shipping'}</td>
                    <td>${p.type === 'pct' ? `${p.value}%` : 'Free'}</td>
                    <td>${usageCount} uses</td>
                    <td>₹${averageOrderValue.toLocaleString('en-IN')}</td>
                    <td style="font-weight: 600;">₹${totalRevenue.toLocaleString('en-IN')}</td>
                    <td style="font-size:0.75rem; color:var(--text-muted);">${escHTML(p.active_dates || '—')}</td>
                    <td>
                      <span class="badge ${p.enabled && !isExpired ? 'badge--delivered' : 'badge--cancelled'}">
                        ${isExpired ? 'Expired' : (p.enabled ? 'Active' : 'Disabled')}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:0.4rem;">
                        <button class="admin-btn admin-btn--secondary toggle-promo-btn" data-code="${escHTML(p.code)}" style="padding:0.35rem 0.6rem; font-size:0.7rem;">
                          ${p.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button class="admin-btn admin-btn--danger delete-promo-btn" data-code="${escHTML(p.code)}" style="padding:0.35rem 0.6rem; font-size:0.7rem;">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 2. Creating New Promotion Slide Over Overlay (Modal) -->
    <div id="promoDrawer" class="login-wall" style="display: none; background: rgba(6, 11, 40, 0.5); backdrop-filter: blur(4px); justify-content: flex-end; padding:0;">
      <div class="glass-card" style="width: 100%; max-width: 420px; height: 100%; border-radius: 0; background: #fff; color: var(--text-main); display: flex; flex-direction: column; box-shadow: var(--shadow-lg); border-left: 1px solid var(--border-glass);">
        <div class="notif-header" style="padding: 1.5rem; border-bottom: 1px solid var(--silver-bg); margin:0;">
          <h2 style="font-family: 'Conthrax', sans-serif; font-size:1.1rem; color: var(--navy);">Create Promotion</h2>
          <button class="notif-clear-all" id="closePromoDrawerBtn" style="font-size:1.2rem; color:var(--text-muted); font-weight:bold;">&times;</button>
        </div>
        
        <form id="promoDrawerForm" style="flex:1; padding: 1.5rem; overflow-y:auto; display:flex; flex-direction:column; justify-content: space-between;">
          <div>
            <div class="form-group">
              <label for="promoCode">Promo Code (All Caps)</label>
              <input type="text" id="promoCode" placeholder="E.g., FESTIVE25" required style="text-transform: uppercase;">
            </div>

            <div class="form-group">
              <label for="promoType">Discount Type</label>
              <select id="promoType" required>
                <option value="pct">Percentage Discount</option>
                <option value="ship">Free Shipping Threshold</option>
              </select>
            </div>

            <div class="form-group" id="promoValueGroup">
              <label for="promoValue">Discount Value (%)</label>
              <input type="number" id="promoValue" value="10" min="1" max="100">
            </div>

            <div class="form-group">
              <label for="promoStartDate">Start Date</label>
              <input type="date" id="promoStartDate" required>
            </div>

            <div class="form-group">
              <label for="promoExpiryDate">Expiry Date</label>
              <input type="date" id="promoExpiryDate" required>
            </div>
          </div>

          <div style="display:flex; gap:0.75rem; border-top: 1px solid var(--silver-bg); padding-top:1.5rem; margin-top:2rem;">
            <button type="submit" class="admin-btn admin-btn--primary" style="flex:1; justify-content:center;">Create Promo</button>
            <button type="button" class="admin-btn admin-btn--secondary" id="cancelPromoDrawerBtn" style="flex:1; justify-content:center;">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: container });

  // Event Listeners
  const drawer = document.getElementById('promoDrawer');
  const createBtn = document.getElementById('createNewPromoBtn');
  const closeBtn = document.getElementById('closePromoDrawerBtn');
  const cancelBtn = document.getElementById('cancelPromoDrawerBtn');
  const form = document.getElementById('promoDrawerForm');
  const typeSelect = document.getElementById('promoType');
  const valGroup = document.getElementById('promoValueGroup');

  // Toggle value field visibility based on type
  typeSelect?.addEventListener('change', () => {
    if (typeSelect.value === 'ship') {
      valGroup.style.display = 'none';
      document.getElementById('promoValue').required = false;
    } else {
      valGroup.style.display = 'flex';
      document.getElementById('promoValue').required = true;
    }
  });

  // Open Drawer
  createBtn?.addEventListener('click', () => {
    // Set default dates
    const today = new Date().toISOString().slice(0, 10);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const expiryStr = expiry.toISOString().slice(0, 10);
    
    document.getElementById('promoCode').value = '';
    document.getElementById('promoStartDate').value = today;
    document.getElementById('promoExpiryDate').value = expiryStr;

    drawer.style.display = 'flex';
    if (window.gsap) {
      window.gsap.fromTo(drawer.firstElementChild, { x: 420 }, { x: 0, duration: 0.35, ease: 'power2.out' });
    }
  });

  // Close Drawer
  closeBtn?.addEventListener('click', () => { drawer.style.display = 'none'; });
  cancelBtn?.addEventListener('click', () => { drawer.style.display = 'none'; });

  // Submit Drawer
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('promoCode').value.trim().toUpperCase();
    const type = document.getElementById('promoType').value;
    const value = type === 'pct' ? parseInt(document.getElementById('promoValue').value, 10) : 0;
    const start = document.getElementById('promoStartDate').value;
    const end = document.getElementById('promoExpiryDate').value;

    const promosList = db.getPromotions();
    if (promosList.some(x => x.code === code)) {
      showToast(`Promo code "${code}" already exists!`, "danger");
      return;
    }

    promosList.push({
      code,
      type,
      value,
      usage_count: 0,
      revenue_generated: 0,
      enabled: true,
      active_dates: `${start} to ${end}`
    });

    db.savePromotions(promosList);
    drawer.style.display = 'none';
    showToast(`Promo code "${code}" created successfully!`, "success");
    render(container);
  });

  // Toggle promo status
  const toggleButtons = container.querySelectorAll('.toggle-promo-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.dataset.code;
      const promosList = db.getPromotions();
      const pIdx = promosList.findIndex(x => x.code === code);
      if (pIdx > -1) {
        promosList[pIdx].enabled = !promosList[pIdx].enabled;
        db.savePromotions(promosList);
        showToast(`Promo code "${code}" status toggled!`, "success");
        render(container);
      }
    });
  });

  // Delete promo
  const deleteButtons = container.querySelectorAll('.delete-promo-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.dataset.code;
      if (confirm(`Are you sure you want to delete promo code "${code}"?`)) {
        let promosList = db.getPromotions();
        promosList = promosList.filter(x => x.code !== code);
        db.savePromotions(promosList);
        
        // Also remove from active storefront session if applied
        try {
          const applied = JSON.parse(localStorage.getItem('habane_promo'));
          if (applied && applied.code === code) {
            localStorage.removeItem('habane_promo');
          }
        } catch(err){}

        showToast(`Promo code "${code}" deleted!`, "warning");
        render(container);
      }
    });
  });
}
