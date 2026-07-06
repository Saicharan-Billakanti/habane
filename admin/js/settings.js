/* HABÄNE ADMIN — Regional Settings Module */

import { db } from './utils.js';
import { showToast } from './ui.js';

export function render(container) {
  const settings = db.getSettings();

  // Reference defaults for countries if not present in custom settings
  const baseCountries = window.HABANE?.COUNTRIES || [
    { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳', symbol: '₹', rate: 1, locale: 'en-IN' },
    { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸', symbol: '$', rate: 0.012, locale: 'en-US' }
  ];

  container.innerHTML = `
    <div class="module-header">
      <div class="module-header__title">
        <h1>Settings</h1>
        <p>Configure region settings, local currencies, conversion rates, shipping costs, and payment rules.</p>
      </div>
    </div>

    <form id="settingsForm" class="form-grid">
      <!-- 1. Global Preferences -->
      <div class="glass-card" style="grid-column: span 2;">
        <h3 style="font-family:'Conthrax';font-size:0.85rem;margin-bottom:1.25rem;color:var(--navy);">Global Store Preferences</h3>
        <div style="display:flex; gap:2rem; flex-wrap:wrap;">
          <div class="form-group" style="min-width:200px;">
            <label for="defaultCurrency">Default Operations Currency</label>
            <select id="defaultCurrency">
              <option value="INR" ${settings.default_currency === 'INR' ? 'selected' : ''}>INR (₹) - Indian Rupee</option>
              <option value="USD" ${settings.default_currency === 'USD' ? 'selected' : ''}>USD ($) - US Dollar</option>
              <option value="EUR" ${settings.default_currency === 'EUR' ? 'selected' : ''}>EUR (€) - Euro</option>
            </select>
          </div>
          <div class="form-group" style="min-width:200px;">
            <label for="landingCountry">Default Landing Region</label>
            <select id="landingCountry">
              ${baseCountries.map(c => `
                <option value="${c.code}" ${settings.landing_country === c.code ? 'selected' : ''}>
                  ${c.flag} ${c.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- 2. Country-wise Rules Table -->
      <div class="glass-card" style="grid-column: span 2; padding: 0; overflow: hidden; margin-top:0.75rem;">
        <h3 style="font-family:'Conthrax';font-size:0.85rem;padding: 1.5rem 1.5rem 1rem 1.5rem;color:var(--navy);background:#fff;">Country Configuration Rules</h3>
        <div class="table-container">
          <table class="admin-table" style="font-size:0.76rem;">
            <thead>
              <tr>
                <th>Active</th>
                <th>Country</th>
                <th>Currency</th>
                <th>Exchange Rate (1 INR = X)</th>
                <th>Shipping Fee (INR)</th>
                <th>Free Shipping Threshold (INR)</th>
                <th>COD Allowed</th>
              </tr>
            </thead>
            <tbody>
              ${baseCountries.map(c => {
                const cSet = settings.countries?.[c.code] || {};
                const enabled = cSet.enabled !== false;
                const currency = cSet.currency ?? c.currency;
                const rate = cSet.rate !== undefined ? cSet.rate : c.rate;
                const shippingFee = cSet.shipping_fee !== undefined ? cSet.shipping_fee : 150; // default 150
                const freeShip = cSet.free_shipping_threshold !== undefined ? cSet.free_shipping_threshold : 4999; // default 4999
                const cod = cSet.cod !== false;

                return `
                  <tr data-code="${c.code}" class="setting-country-row">
                    <td>
                      <input type="checkbox" class="c-enabled" data-code="${c.code}" ${enabled ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;">
                    </td>
                    <td style="font-weight:600; color:var(--navy); font-size:0.8rem;">
                      ${c.flag} ${c.name}
                    </td>
                    <td>
                      <input type="text" class="c-currency form-input-sm" data-code="${c.code}" value="${currency}" maxlength="3" required style="width: 60px; text-align:center; padding:0.25rem;">
                    </td>
                    <td>
                      <input type="number" step="0.000001" class="c-rate form-input-sm" data-code="${c.code}" value="${rate}" required style="width: 120px; padding:0.25rem;">
                    </td>
                    <td>
                      <input type="number" class="c-ship form-input-sm" data-code="${c.code}" value="${shippingFee}" required style="width: 90px; padding:0.25rem;">
                    </td>
                    <td>
                      <input type="number" class="c-threshold form-input-sm" data-code="${c.code}" value="${freeShip}" required style="width: 100px; padding:0.25rem;">
                    </td>
                    <td>
                      <input type="checkbox" class="c-cod" data-code="${c.code}" ${cod ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;">
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Submit Section -->
      <div style="grid-column: span 2; display:flex; justify-content:flex-end; gap:1rem; padding: 1.5rem; border-top:1px solid var(--border-glass);">
        <button type="button" class="admin-btn admin-btn--secondary" id="resetSettingsDefaultsBtn">Reset Default Settings</button>
        <button type="submit" class="admin-btn admin-btn--primary">Save Settings Rules</button>
      </div>
    </form>
  `;

  // Attach Event Listeners
  const form = document.getElementById('settingsForm');
  const resetBtn = document.getElementById('resetSettingsDefaultsBtn');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const countryRows = document.querySelectorAll('.setting-country-row');
    const countriesConfig = {};

    countryRows.forEach(row => {
      const code = row.dataset.code;
      const enabled = row.querySelector('.c-enabled').checked;
      const currency = row.querySelector('.c-currency').value.trim().toUpperCase();
      const rate = parseFloat(row.querySelector('.c-rate').value);
      const shippingFee = parseInt(row.querySelector('.c-ship').value, 10);
      const freeShip = parseInt(row.querySelector('.c-threshold').value, 10);
      const cod = row.querySelector('.c-cod').checked;

      countriesConfig[code] = {
        enabled,
        currency,
        rate,
        shipping_fee: shippingFee,
        free_shipping_threshold: freeShip,
        cod
      };
    });

    const payload = {
      default_currency: document.getElementById('defaultCurrency').value,
      landing_country: document.getElementById('landingCountry').value,
      countries: countriesConfig
    };

    db.saveSettings(payload);

    // Apply globally to H.COUNTRIES for real-time testing simulation in active session
    if (window.HABANE) {
      // Update H.COUNTRIES reference in data.js context dynamically
      const updatedCountries = baseCountries.map(c => {
        const cSet = countriesConfig[c.code];
        if (cSet) {
          return {
            ...c,
            currency: cSet.currency ?? c.currency,
            rate: cSet.rate !== undefined ? cSet.rate : c.rate,
            enabled: cSet.enabled !== false
          };
        }
        return { ...c, enabled: true };
      }).filter(c => c.enabled);
      
      window.HABANE.COUNTRIES.length = 0;
      window.HABANE.COUNTRIES.push(...updatedCountries);

      // Update FREE_SHIP threshold dynamically
      const landingSet = countriesConfig[payload.landing_country];
      if (landingSet && landingSet.free_shipping_threshold) {
        window.HABANE.FREE_SHIP = landingSet.free_shipping_threshold;
      }
    }

    showToast("System settings saved successfully!", "success");
    render(container);
  });

  resetBtn?.addEventListener('click', () => {
    if (confirm("Reset regional configuration back to default values?")) {
      localStorage.removeItem('habane_settings');
      showToast("Regional settings restored to factory defaults.", "warning");
      render(container);
    }
  });
}
