/* HABÄNE ADMIN — Customers, Newsletters, & Contact Inbox Module */

import { db, downloadCSV, escHTML } from './utils.js';
import { showToast, refreshNotifications } from './ui.js';

let activeTab = 'customers'; // 'customers', 'newsletters', 'messages'

export function render(container) {
  const orders = db.getOrders();
  const newsletters = db.getNewsList();
  const messages = db.getMessages();
  const events = db.getEvents();

  // Collate unique customers from orders
  const customerMap = {};
  orders.forEach(o => {
    const email = o.customer_email.trim().toLowerCase();
    if (!customerMap[email]) {
      customerMap[email] = {
        name: o.customer_name,
        email: o.customer_email,
        country: o.country,
        orderCount: 0,
        totalSpend: 0,
        currency: o.currency,
        lastOrderDate: o.created_at,
        wishlistProducts: new Set()
      };
    }
    
    customerMap[email].orderCount++;
    customerMap[email].totalSpend += o.total;
    if (new Date(o.created_at) > new Date(customerMap[email].lastOrderDate)) {
      customerMap[email].lastOrderDate = o.created_at;
      customerMap[email].name = o.customer_name;
      customerMap[email].country = o.country;
    }
  });

  // Populate active wishlist items for customers
  events.forEach(e => {
    if (e.customer_email && (e.event_type === 'Wishlist Added' || e.event_type === 'Wishlist Removed')) {
      const email = e.customer_email.trim().toLowerCase();
      if (customerMap[email]) {
        const prod = window.HABANE?.byId(e.product_id);
        if (prod) {
          if (e.event_type === 'Wishlist Added') {
            customerMap[email].wishlistProducts.add(prod.name);
          } else {
            customerMap[email].wishlistProducts.delete(prod.name);
          }
        }
      }
    }
  });

  const customersList = Object.values(customerMap);

  container.innerHTML = `
    <div class="module-header">
      <div class="module-header__title">
        <h1>Customers & Communications</h1>
        <p>Browse customer accounts, view newsletter subscribers, and reply to support inquiries.</p>
      </div>
      <div class="module-actions">
        <button class="admin-btn admin-btn--secondary" id="exportCustomerDataBtn">
          <i data-lucide="download"></i> Export Tab CSV
        </button>
      </div>
    </div>

    <!-- Tab Filter Header -->
    <div class="analytics-header-filters" style="margin-bottom: 1.5rem; display:inline-flex;">
      <button class="analytics-tab-btn ${activeTab === 'customers' ? 'active' : ''}" data-tab="customers">
        Customers (${customersList.length})
      </button>
      <button class="analytics-tab-btn ${activeTab === 'newsletters' ? 'active' : ''}" data-tab="newsletters">
        Newsletter Subscribers (${newsletters.length})
      </button>
      <button class="analytics-tab-btn ${activeTab === 'messages' ? 'active' : ''}" data-tab="messages">
        Contact Messages (${messages.length})
      </button>
    </div>

    <!-- Active Tab Display -->
    <div class="glass-card" style="padding: 0; overflow: hidden;" id="customerTableWrapper">
      ${renderActiveTable(customersList, newsletters, messages)}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: container });

  // Tab Clicking listeners
  const tabs = container.querySelectorAll('.analytics-tab-btn');
  tabs.forEach(t => {
    t.addEventListener('click', (e) => {
      activeTab = e.currentTarget.dataset.tab;
      render(container);
    });
  });

  // Action listeners inside active tab
  const tableWrapper = document.getElementById('customerTableWrapper');
  tableWrapper?.addEventListener('click', (e) => {
    const markRepliedBtn = e.target.closest('.mark-replied-btn');
    if (markRepliedBtn) {
      const msgId = markRepliedBtn.dataset.id;
      const success = db.updateMessageStatus(msgId, 'Replied');
      if (success) {
        showToast("Message status updated to Replied", "success");
        refreshNotifications();
        render(container);
      } else {
        showToast("Error updating message status", "danger");
      }
    }
  });

  // Export CSV
  const exportBtn = document.getElementById('exportCustomerDataBtn');
  exportBtn?.addEventListener('click', () => {
    triggerCSVExport(customersList, newsletters, messages);
  });
}

function renderActiveTable(customers, newsletters, messages) {
  if (activeTab === 'customers') {
    if (customers.length === 0) {
      return `<div class="notif-empty" style="padding: 3rem;">No customer profiles found. Place orders to populate.</div>`;
    }
    return `
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email Address</th>
              <th>Country</th>
              <th>Orders Count</th>
              <th>Total spend (Local)</th>
              <th>Wishlist Saves</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(c => `
              <tr>
                <td style="font-weight: 700; color: var(--navy);">${escHTML(c.name)}</td>
                <td>${escHTML(c.email)}</td>
                <td>${c.country}</td>
                <td>${c.orderCount} order${c.orderCount > 1 ? 's' : ''}</td>
                <td style="font-weight:600;">${getCurrencySymbol(c.currency)}${c.totalSpend.toLocaleString()}</td>
                <td>
                  ${c.wishlistProducts.size > 0 
                    ? Array.from(c.wishlistProducts).map(pName => `<span class="badge badge--new" style="font-size:0.65rem; padding:0.15rem 0.4rem; margin-right:0.25rem; margin-bottom:0.25rem; white-space:nowrap;">${escHTML(pName)}</span>`).join('') 
                    : '<span style="color:var(--text-muted); font-style:italic;">None</span>'}
                </td>
                <td>${new Date(c.lastOrderDate).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (activeTab === 'newsletters') {
    if (newsletters.length === 0) {
      return `<div class="notif-empty" style="padding: 3rem;">No newsletter subscribers registered yet.</div>`;
    }
    return `
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Subscriber Email</th>
              <th>Country</th>
              <th>Subscription Date</th>
            </tr>
          </thead>
          <tbody>
            ${newsletters.map(n => `
              <tr>
                <td style="font-weight: 700;">${n.id}</td>
                <td style="font-weight: 600; color: var(--navy);">${escHTML(n.email)}</td>
                <td>${n.country || 'IN'}</td>
                <td>${new Date(n.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (activeTab === 'messages') {
    if (messages.length === 0) {
      return `<div class="notif-empty" style="padding: 3rem;">No customer inquiries found.</div>`;
    }
    // Sort messages descending by date
    const sortedMsgs = [...messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return `
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Email</th>
              <th>Country</th>
              <th>Message Content</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${sortedMsgs.map(m => `
              <tr>
                <td style="font-weight: 700; color: var(--navy);">${escHTML(m.name)}</td>
                <td>${escHTML(m.email)}</td>
                <td>${m.country || 'IN'}</td>
                <td style="max-width: 250px; font-size: 0.74rem; line-height: 1.4; word-wrap: break-word; white-space: normal;">
                  ${escHTML(m.message)}
                </td>
                <td>
                  <span class="badge ${m.status === 'Unread' ? 'badge--danger' : (m.status === 'Read' ? 'badge--packed' : 'badge--delivered')}">
                    ${m.status}
                  </span>
                </td>
                <td>${new Date(m.created_at).toLocaleDateString()}</td>
                <td>
                  ${m.status !== 'Replied' ? `
                    <button class="admin-btn admin-btn--secondary mark-replied-btn" data-id="${m.id}" style="padding:0.35rem 0.6rem; font-size:0.7rem;">
                      <i data-lucide="check"></i> Mark Replied
                    </button>
                  ` : `<span style="font-size:0.72rem; color:var(--success); font-weight:600;">✓ Replied</span>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

function getCurrencySymbol(code) {
  const countries = window.HABANE?.COUNTRIES || [];
  const c = countries.find(x => x.currency === code);
  return c ? c.symbol : (code === 'INR' ? '₹' : code);
}

function triggerCSVExport(customers, newsletters, messages) {
  if (activeTab === 'customers') {
    if (customers.length === 0) return;
    const headers = ['Customer Name', 'Email Address', 'Country', 'Orders Count', 'Total Spend', 'Currency', 'Wishlist Saves', 'Last Active'];
    const rows = customers.map(c => [
      c.name,
      c.email,
      c.country,
      c.orderCount,
      c.totalSpend,
      c.currency,
      Array.from(c.wishlistProducts).join('; '),
      c.lastOrderDate
    ]);
    downloadCSV(`habane_customers_export_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
  } else if (activeTab === 'newsletters') {
    if (newsletters.length === 0) return;
    const headers = ['Subscriber ID', 'Email Address', 'Country', 'Subscription Date'];
    const rows = newsletters.map(n => [n.id, n.email, n.country, n.created_at]);
    downloadCSV(`habane_subscribers_export_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
  } else if (activeTab === 'messages') {
    if (messages.length === 0) return;
    const headers = ['Message ID', 'Sender Name', 'Email Address', 'Country', 'Message Body', 'Status', 'Received Date'];
    const rows = messages.map(m => [m.id, m.name, m.email, m.country, m.message, m.status, m.created_at]);
    downloadCSV(`habane_messages_export_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
  }
  showToast(`Successfully exported ${activeTab} CSV`, "success");
}
