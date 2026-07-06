/* HABÄNE ADMIN — Orders Module */

import { db, downloadCSV, escHTML } from './utils.js';
import { showToast, refreshNotifications } from './ui.js';

let currentFilters = {
  search: '',
  status: 'all',
  country: 'all',
  currency: 'all',
  dateRange: 'all'
};

export function render(container) {
  container.innerHTML = `
    <div class="module-header">
      <div class="module-header__title">
        <h1>Orders</h1>
        <p>Manage store orders, track shipping workflows, and export CSVs.</p>
      </div>
      <div class="module-actions">
        <button class="admin-btn admin-btn--secondary" id="exportOrdersBtn">
          <i data-lucide="download"></i> Export CSV
        </button>
      </div>
    </div>

    <!-- Table Filters Panel -->
    <div class="glass-card table-filters">
      <div class="table-filters__search">
        <i data-lucide="search"></i>
        <input type="text" id="orderSearch" placeholder="Search customer, ID, products..." value="${currentFilters.search}">
      </div>

      <div class="filter-group">
        <select class="filter-select" id="filterStatus">
          <option value="all" ${currentFilters.status === 'all' ? 'selected' : ''}>All Statuses</option>
          <option value="New" ${currentFilters.status === 'New' ? 'selected' : ''}>New</option>
          <option value="Packed" ${currentFilters.status === 'Packed' ? 'selected' : ''}>Packed</option>
          <option value="Shipped" ${currentFilters.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${currentFilters.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${currentFilters.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>

        <select class="filter-select" id="filterCountry">
          <option value="all" ${currentFilters.country === 'all' ? 'selected' : ''}>All Countries</option>
          ${(window.HABANE?.COUNTRIES || []).map(c => `
            <option value="${c.code}" ${currentFilters.country === c.code ? 'selected' : ''}>${c.flag} ${c.name}</option>
          `).join('')}
        </select>

        <select class="filter-select" id="filterDate">
          <option value="all" ${currentFilters.dateRange === 'all' ? 'selected' : ''}>All Dates</option>
          <option value="7" ${currentFilters.dateRange === '7' ? 'selected' : ''}>Last 7 Days</option>
          <option value="30" ${currentFilters.dateRange === '30' ? 'selected' : ''}>Last 30 Days</option>
          <option value="90" ${currentFilters.dateRange === '90' ? 'selected' : ''}>Last 90 Days</option>
        </select>
      </div>
    </div>

    <!-- Orders Data Grid -->
    <div class="glass-card" style="padding: 0; overflow: hidden; margin-top: 1.25rem;">
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Country</th>
              <th>Products</th>
              <th>Subtotal</th>
              <th>Discount</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            <!-- Rendered Rows Injected Here -->
          </tbody>
        </table>
      </div>
      <div id="ordersTableEmpty" class="notif-empty" style="display: none; padding: 3rem;">
        No orders match the selected filters.
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: container });

  // Event Listeners for Filters
  const searchInput = document.getElementById('orderSearch');
  const statusSelect = document.getElementById('filterStatus');
  const countrySelect = document.getElementById('filterCountry');
  const dateSelect = document.getElementById('filterDate');
  const exportBtn = document.getElementById('exportOrdersBtn');

  // Debounce search
  let searchTimeout = null;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.search = e.target.value.trim().toLowerCase();
      updateTable();
    }, 300);
  });

  statusSelect?.addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    updateTable();
  });

  countrySelect?.addEventListener('change', (e) => {
    currentFilters.country = e.target.value;
    updateTable();
  });

  dateSelect?.addEventListener('change', (e) => {
    currentFilters.dateRange = e.target.value;
    updateTable();
  });

  exportBtn?.addEventListener('click', () => {
    triggerCSVExport();
  });

  // Initial table rendering
  updateTable();
}

function getFilteredOrders() {
  const orders = db.getOrders();
  return orders.filter(o => {
    // 1. Search filter
    if (currentFilters.search) {
      const q = currentFilters.search;
      const idMatch = o.id.toLowerCase().includes(q);
      const nameMatch = o.customer_name.toLowerCase().includes(q);
      const emailMatch = o.customer_email.toLowerCase().includes(q);
      const prodMatch = o.products.some(p => p.name.toLowerCase().includes(q));
      
      if (!idMatch && !nameMatch && !emailMatch && !prodMatch) return false;
    }

    // 2. Status filter
    if (currentFilters.status !== 'all' && o.status !== currentFilters.status) return false;

    // 3. Country filter
    if (currentFilters.country !== 'all' && o.country !== currentFilters.country) return false;

    // 4. Date Range filter
    if (currentFilters.dateRange !== 'all') {
      const days = parseInt(currentFilters.dateRange, 10);
      const orderDate = new Date(o.created_at);
      const cutDate = new Date();
      cutDate.setDate(cutDate.getDate() - days);
      if (orderDate < cutDate) return false;
    }

    return true;
  });
}

function updateTable() {
  const tableBody = document.getElementById('ordersTableBody');
  const tableEmpty = document.getElementById('ordersTableEmpty');
  if (!tableBody) return;

  const filtered = getFilteredOrders();
  
  // Sort descending by created date
  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    tableEmpty.style.display = 'block';
    return;
  }

  tableEmpty.style.display = 'none';

  tableBody.innerHTML = filtered.map(o => {
    const symbol = getCurrencySymbol(o.currency);
    const dateFormatted = new Date(o.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const productsList = o.products.map(p => 
      `${escHTML(p.name)} (${escHTML(p.color)} · ${escHTML(p.size)} · Qty ${p.qty})`
    ).join('<br>');

    return `
      <tr class="clickable-order-row" data-order-id="${o.id}" style="cursor: pointer;">
        <td style="font-weight: 700; color: var(--navy);"><a href="#order/${o.id}" class="order-id-link" style="color: var(--navy); text-decoration: none;">${o.id}</a></td>
        <td>
          <div class="user-info">
            <span class="user-name">${escHTML(o.customer_name)}</span>
            <span class="user-role" style="text-transform:none;">${escHTML(o.customer_email)}</span>
          </div>
        </td>
        <td>${o.country}</td>
        <td style="font-size: 0.74rem; line-height:1.4;">${productsList}</td>
        <td>${symbol}${o.subtotal.toLocaleString()}</td>
        <td>${symbol}${o.discount.toLocaleString()}</td>
        <td style="font-weight: 700;">${symbol}${o.total.toLocaleString()}</td>
        <td>
          <select class="inline-select badge badge--status" data-order-id="${o.id}">
            <option value="New" ${o.status === 'New' ? 'selected' : ''}>New</option>
            <option value="Packed" ${o.status === 'Packed' ? 'selected' : ''}>Packed</option>
            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>${dateFormatted}</td>
      </tr>
    `;
  }).join('');

  // Add event listener to dynamically styling select drop downs on render
  const selectElements = tableBody.querySelectorAll('.badge--status');
  selectElements.forEach(select => {
    applyStatusBadgeColor(select);
    select.addEventListener('change', (e) => {
      const orderId = e.target.dataset.orderId;
      const newStatus = e.target.value;
      
      const success = db.updateOrderStatus(orderId, newStatus);
      if (success) {
        applyStatusBadgeColor(e.target);
        showToast(`Order ${orderId} updated to ${newStatus}`, "success");
        refreshNotifications();
      } else {
        showToast("Error updating order status", "danger");
      }
    });
  });

  // Attach row click listeners for navigation
  const rows = tableBody.querySelectorAll('.clickable-order-row');
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.inline-select') || e.target.closest('.order-id-link')) return;
      const orderId = row.dataset.orderId;
      window.location.hash = `order/${orderId}`;
    });
  });
}

function applyStatusBadgeColor(selectEl) {
  const status = selectEl.value;
  selectEl.className = 'inline-select badge';
  if (status === 'New') selectEl.classList.add('badge--new');
  if (status === 'Packed') selectEl.classList.add('badge--packed');
  if (status === 'Shipped') selectEl.classList.add('badge--shipped');
  if (status === 'Delivered') selectEl.classList.add('badge--delivered');
  if (status === 'Cancelled') selectEl.classList.add('badge--cancelled');
}

function getCurrencySymbol(code) {
  const countries = window.HABANE?.COUNTRIES || [];
  const c = countries.find(x => x.currency === code);
  return c ? c.symbol : (code === 'INR' ? '₹' : code);
}

function triggerCSVExport() {
  const filtered = getFilteredOrders();
  if (filtered.length === 0) {
    showToast("No orders available to export", "warning");
    return;
  }

  const headers = ['Order ID', 'Customer Name', 'Email', 'Country', 'Currency', 'Quantity', 'Subtotal', 'Discount', 'Total', 'Status', 'Date'];
  
  const rows = filtered.map(o => [
    o.id,
    o.customer_name,
    o.customer_email,
    o.country,
    o.currency,
    o.quantity,
    o.subtotal,
    o.discount,
    o.total,
    o.status,
    o.created_at
  ]);

  downloadCSV(`habane_orders_export_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
  showToast(`Successfully exported ${filtered.length} orders`, "success");
}
