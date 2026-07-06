/* HABÄNE ADMIN — Overview Landing Dashboard Page */

import { db, normalizeRevenue, escHTML } from './utils.js';
import { ChartColors, createLineChart, createBarChart } from './charts.js';
import { animateCounters } from './ui.js';

let overviewCharts = {};

export function render(container) {
  const orders = db.getOrders();
  const events = db.getEvents();
  const messages = db.getMessages();
  const newsletters = db.getNewsList();
  const catalog = window.HABANE?.PRODUCTS || [];
  const overrides = db.getCatalogOverrides();

  // Aggregate stats
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + normalizeRevenue(o.total, o.currency) : sum, 0);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  
  // Calculate Conversion Rate
  const totalViews = events.filter(e => e.event_type === 'Product Viewed').length || 1;
  const conversionRate = parseFloat(((totalOrders / totalViews) * 100).toFixed(2));

  // Returning Customers
  const customerOrdersMap = {};
  orders.forEach(o => {
    const email = o.customer_email.trim().toLowerCase();
    customerOrdersMap[email] = (customerOrdersMap[email] || 0) + 1;
  });
  const uniqueCustomers = Object.keys(customerOrdersMap).length || 1;
  const returningCustomers = Object.values(customerOrdersMap).filter(count => count > 1).length;
  const returningRate = parseFloat(((returningCustomers / uniqueCustomers) * 100).toFixed(1));

  // Wishlist Total Saves
  let totalWishlisted = 0;
  catalog.forEach(p => {
    const adds = events.filter(e => e.product_id === p.id && e.event_type === 'Wishlist Added').length;
    const rms = events.filter(e => e.product_id === p.id && e.event_type === 'Wishlist Removed').length;
    totalWishlisted += Math.max(0, adds - rms);
  });

  // Messages and newsletter
  const unreadMessagesCount = messages.filter(m => m.status === 'Unread').length;
  const subscribersCount = newsletters.length;

  // Cohort Growth Calculations (7-day and 30-day percentage shifts)
  const now = new Date();
  const getCohortStats = (days) => {
    const currentCut = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevCut = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const currentOrders = orders.filter(o => new Date(o.created_at) >= currentCut);
    const prevOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevCut && d < currentCut;
    });

    const currentRev = currentOrders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + normalizeRevenue(o.total, o.currency) : sum, 0);
    const prevRev = prevOrders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + normalizeRevenue(o.total, o.currency) : sum, 0);

    const revShift = prevRev > 0 ? Math.round(((currentRev - prevRev) / prevRev) * 100) : 0;
    const orderShift = prevOrders.length > 0 ? Math.round(((currentOrders.length - prevOrders.length) / prevOrders.length) * 100) : 0;

    return { revShift, orderShift };
  };

  const trend7 = getCohortStats(7);
  const trend30 = getCohortStats(30);

  // Recent Tables lists
  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const recentMessages = messages.filter(m => m.status === 'Unread').slice(0, 5);
  const lowStockAlerts = catalog.map(p => {
    const stock = overrides[p.id]?.stock !== undefined ? overrides[p.id].stock : 12;
    return { ...p, stock };
  }).filter(p => p.stock < 5).slice(0, 5);

  container.innerHTML = `
    <div class="module-header">
      <div class="module-header__title">
        <h1>Overview</h1>
        <p>Live health report for Habäne e-commerce sales, activities, and communication queues.</p>
      </div>
    </div>

    <!-- 1. KPI Stats Cards Grid -->
    <div class="summary-grid">
      
      <!-- Card 1: Revenue -->
      <div class="glass-card stat-card">
        <div class="stat-card__meta">
          <span>Total Revenue</span>
          <div class="stat-card__icon"><i data-lucide="indian-rupee"></i></div>
        </div>
        <div class="stat-card__value" data-counter="${totalRevenue}" data-is-currency="true">₹0</div>
        <div class="stat-card__trends">
          <span class="trend-indicator ${trend7.revShift >= 0 ? 'up' : 'down'}">
            <i data-lucide="${trend7.revShift >= 0 ? 'arrow-up-right' : 'arrow-down-right'}"></i>
            ${Math.abs(trend7.revShift)}%
          </span>
          <span>vs last 7d</span>
        </div>
      </div>

      <!-- Card 2: Orders -->
      <div class="glass-card stat-card">
        <div class="stat-card__meta">
          <span>Orders Placed</span>
          <div class="stat-card__icon"><i data-lucide="shopping-bag"></i></div>
        </div>
        <div class="stat-card__value" data-counter="${totalOrders}">0</div>
        <div class="stat-card__trends">
          <span class="trend-indicator ${trend7.orderShift >= 0 ? 'up' : 'down'}">
            <i data-lucide="${trend7.orderShift >= 0 ? 'arrow-up-right' : 'arrow-down-right'}"></i>
            ${Math.abs(trend7.orderShift)}%
          </span>
          <span>vs last 7d</span>
        </div>
      </div>

      <!-- Card 3: AOV -->
      <div class="glass-card stat-card">
        <div class="stat-card__meta">
          <span>Avg. Order Value</span>
          <div class="stat-card__icon"><i data-lucide="calculator"></i></div>
        </div>
        <div class="stat-card__value" data-counter="${aov}" data-is-currency="true">₹0</div>
        <div class="stat-card__trends">
          <span class="trend-indicator ${trend30.revShift >= 0 ? 'up' : 'down'}">
            <i data-lucide="${trend30.revShift >= 0 ? 'arrow-up-right' : 'arrow-down-right'}"></i>
            ${Math.abs(trend30.revShift)}%
          </span>
          <span>AOV 30d trend</span>
        </div>
      </div>

      <!-- Card 4: Conversion Rate -->
      <div class="glass-card stat-card">
        <div class="stat-card__meta">
          <span>Conversion Rate</span>
          <div class="stat-card__icon"><i data-lucide="percent"></i></div>
        </div>
        <div class="stat-card__value" data-counter="${conversionRate}" data-is-percent="true">0%</div>
        <div class="stat-card__trends">
          <span style="font-weight:700;">${returningRate}%</span>
          <span>returning customers</span>
        </div>
      </div>

      <!-- Card 5: Saves & Signups -->
      <div class="glass-card stat-card">
        <div class="stat-card__meta">
          <span>Wishlist &amp; Subs</span>
          <div class="stat-card__icon"><i data-lucide="heart"></i></div>
        </div>
        <div class="stat-card__value" style="font-size:1.15rem; display:flex; flex-direction:column; gap:0.25rem;">
          <span style="font-family:'Conthrax';">Saves: ${totalWishlisted}</span>
          <span style="font-family:'Conthrax';">List: ${subscribersCount}</span>
        </div>
        <div class="stat-card__trends" style="margin-top:0.4rem;">
          <span class="trend-indicator up"><i data-lucide="plus"></i> ${unreadMessagesCount}</span>
          <span>unread messages</span>
        </div>
      </div>

    </div>

    <!-- 2. Dual Revenue & Orders Charts -->
    <div class="dashboard-grid">
      <div class="glass-card chart-card">
        <h3>Revenue over Time (14 Days)</h3>
        <div class="chart-container"><canvas id="overviewRevenueChart"></canvas></div>
      </div>

      <div class="glass-card chart-card">
        <h3>Orders Volume (14 Days)</h3>
        <div class="chart-container"><canvas id="overviewOrdersChart"></canvas></div>
      </div>
    </div>

    <!-- 3. Tables: Recent Orders, Unread Messages, Low Stock Warnings -->
    <div class="dashboard-grid" style="grid-template-columns: 2fr 1fr; margin-top: 1.25rem;">
      
      <!-- Recent Orders Table -->
      <div class="glass-card" style="padding: 0; overflow: hidden;">
        <h3 style="font-family:'Conthrax'; font-size:0.85rem; padding:1.5rem 1.5rem 1rem 1.5rem; color:var(--navy);">Recent Orders Placed</h3>
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total Items</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${recentOrders.map(o => `
                <tr>
                  <td style="font-weight:700; color:var(--navy);">${o.id}</td>
                  <td>${escHTML(o.customer_name)}</td>
                  <td>${o.quantity} items</td>
                  <td style="font-weight:600;">₹${normalizeRevenue(o.total, o.currency).toLocaleString('en-IN')}</td>
                  <td><span class="badge ${o.status === 'New' ? 'badge--new' : (o.status === 'Packed' ? 'badge--packed' : (o.status === 'Shipped' ? 'badge--shipped' : 'badge--delivered'))}">${o.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alerts Panel (Low Stock & New Messages) -->
      <div class="glass-card" style="display:flex; flex-direction:column; gap:1.5rem;">
        
        <!-- Low Stock Alerts -->
        <div>
          <h4 style="font-family:'Conthrax'; font-size:0.75rem; color:var(--navy); margin-bottom:0.75rem; text-transform:uppercase; letter-spacing:0.04em;">
            ⚠️ Stock Warnings
          </h4>
          ${lowStockAlerts.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
              ${lowStockAlerts.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; background:rgba(255,23,68,0.06); padding:0.5rem; border-radius:8px; border:1px dashed rgba(255,23,68,0.25);">
                  <strong style="color:var(--navy);">${escHTML(p.name)}</strong>
                  <span style="color:var(--danger); font-weight:700;">${p.stock} left</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="font-size:0.74rem; color:var(--text-muted);">All inventory stock levels are healthy.</p>
          `}
        </div>

        <!-- Recent Unread Messages -->
        <div>
          <h4 style="font-family:'Conthrax'; font-size:0.75rem; color:var(--navy); margin-bottom:0.75rem; text-transform:uppercase; letter-spacing:0.04em;">
            📬 Pending Messages
          </h4>
          ${recentMessages.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
              ${recentMessages.map(m => `
                <div style="font-size:0.76rem; background:var(--silver-light); padding:0.6rem; border-radius:8px; border:1px solid var(--border-glass);">
                  <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                    <strong style="color:var(--navy);">${escHTML(m.name)}</strong>
                    <span style="font-size:0.66rem; color:var(--text-muted);">${new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style="color:var(--text-muted); font-size:0.72rem; line-height:1.3; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                    ${escHTML(m.message)}
                  </p>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="font-size:0.74rem; color:var(--text-muted);">No unread messages in the support queue.</p>
          `}
        </div>

      </div>

    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: container });

  // Animate stats cards
  animateCounters();

  // Create 14 day Line and Bar Charts
  const sortedOrdersAsc = [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  // Format labels & values for 14 days
  const dayMap = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dayMap[dStr] = { rev: 0, count: 0 };
  }

  sortedOrdersAsc.forEach(o => {
    const dateStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dayMap[dateStr] !== undefined) {
      dayMap[dateStr].count++;
      if (o.status !== 'Cancelled') {
        dayMap[dateStr].rev += normalizeRevenue(o.total, o.currency);
      }
    }
  });

  const labels = Object.keys(dayMap);
  const revPoints = labels.map(l => dayMap[l].rev);
  const countPoints = labels.map(l => dayMap[l].count);

  // Load overview charts
  overviewCharts.rev = createLineChart(document.getElementById('overviewRevenueChart'), labels, 'Revenue (INR)', revPoints, true);
  overviewInstancesDestructionCheck();
  overviewCharts.ord = createBarChart(document.getElementById('overviewOrdersChart'), labels, 'Orders placed', countPoints, false);
}

function overviewInstancesDestructionCheck() {
  // Save chart references to clean up when swapping pages
  window.HABANE_OVERVIEW_CHARTS = overviewCharts;
}
export function destroyCharts() {
  const chartsObj = window.HABANE_OVERVIEW_CHARTS || overviewCharts;
  Object.values(chartsObj).forEach(c => { if (c) c.destroy(); });
}
