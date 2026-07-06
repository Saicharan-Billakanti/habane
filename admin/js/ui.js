/* HABÄNE ADMIN — Shell UI, Sidebar, Toasts, and Dynamic Alerts Engine */

import { db } from './utils.js';

// ==========================================
// 1. SIDEBAR NAVIGATION & COLLAPSE CONTROLLERS
// ==========================================

export function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
  const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
  const mainContent = document.getElementById('mainContent');

  // Desktop Collapse Toggle
  sidebarCollapseBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    // Refresh icons inside sidebar brand
    setTimeout(() => {
      if (window.lucide) window.lucide.createIcons();
    }, 300);
  });

  // Mobile Drawer Toggle
  mobileSidebarToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
  });

  // Click outside to close mobile drawer
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 991) {
      if (!sidebar.contains(e.target) && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
  });
}

// ==========================================
// 2. TOASTER NOTIFICATION ALERTS SYSTEM
// ==========================================

export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `admin-toast admin-toast--${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'warning') iconName = 'alert-triangle';
  if (type === 'danger') iconName = 'shield-alert';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  if (window.lucide) window.lucide.createIcons({ root: toast });

  // GSAP Slide In
  if (window.gsap) {
    window.gsap.fromTo(toast, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' });
  }

  // Auto remove after 3s
  setTimeout(() => {
    if (window.gsap) {
      window.gsap.to(toast, {
        opacity: 0,
        x: 30,
        duration: 0.3,
        onComplete: () => toast.remove()
      });
    } else {
      toast.remove();
    }
  }, 3000);
}

// ==========================================
// 3. STAT CARD COUNTER ANIMATION
// ==========================================

export function animateCounters() {
  if (!window.gsap) return;
  const elements = document.querySelectorAll('[data-counter]');
  elements.forEach(el => {
    const target = parseFloat(el.getAttribute('data-counter'));
    if (isNaN(target)) return;
    
    const obj = { val: 0 };
    window.gsap.to(obj, {
      val: target,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        if (el.dataset.isCurrency === 'true') {
          el.textContent = '₹' + Math.floor(obj.val).toLocaleString('en-IN');
        } else if (el.dataset.isPercent === 'true') {
          el.textContent = obj.val.toFixed(1) + '%';
        } else {
          el.textContent = Math.floor(obj.val).toLocaleString('en-IN');
        }
      }
    });
  });
}

// ==========================================
// 4. REAL-TIME DYNAMIC NOTIFICATION ENGINE
// ==========================================

let activeNotifications = [];

export function initNotificationEngine() {
  const bellBtn = document.getElementById('notifBellBtn');
  const dropdown = document.getElementById('notifDropdown');
  const list = document.getElementById('notifList');
  const badge = document.getElementById('notifBadge');
  const clearBtn = document.getElementById('notifClearBtn');

  // Bell click toggle
  bellBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });

  // Close bell dropdown on clicking outside
  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Clear button click
  clearBtn?.addEventListener('click', () => {
    activeNotifications = [];
    renderNotifications();
    showToast("All notifications dismissed", "info");
  });

  // Generate notifications based on database state
  generateAlertsFromDB();
  renderNotifications();
}

function generateAlertsFromDB() {
  const alerts = [];
  
  // 1. Pending Orders Alerts
  const orders = db.getOrders();
  const pendingOrders = orders.filter(o => o.status === 'New');
  if (pendingOrders.length > 0) {
    alerts.push({
      id: 'notif-pending',
      type: 'info',
      msg: `${pendingOrders.length} New pending order${pendingOrders.length > 1 ? 's' : ''} require packing.`,
      time: 'Action Needed'
    });
  }

  // 2. High Value Order Alert (> 20,000 INR)
  const highValueOrders = orders.filter(o => o.total > 20000 && o.status === 'New');
  highValueOrders.forEach(o => {
    alerts.push({
      id: `notif-hval-${o.id}`,
      type: 'warning',
      msg: `High-value order alert: ${o.id} is worth ₹${o.total.toLocaleString('en-IN')}!`,
      time: 'Recent'
    });
  });

  // 3. Low Stock Alerts
  const catalog = window.HABANE?.PRODUCTS || [];
  const overrides = db.getCatalogOverrides();
  catalog.forEach(p => {
    const stock = overrides[p.id]?.stock !== undefined ? overrides[p.id].stock : 12; // default stock threshold
    if (stock < 5) {
      alerts.push({
        id: `notif-stock-${p.id}`,
        type: 'danger',
        msg: `Low stock alert: ${p.name} only has ${stock} units remaining.`,
        time: 'Inventory alert'
      });
    }
  });

  // 4. New unread contact message alert
  const messages = db.getMessages();
  const unreadMessages = messages.filter(m => m.status === 'Unread');
  if (unreadMessages.length > 0) {
    alerts.push({
      id: 'notif-msgs',
      type: 'info',
      msg: `You have ${unreadMessages.length} unread customer inquiries.`,
      time: 'Inquiry Inbox'
    });
  }

  // 5. Abandoned checkouts alert
  const events = db.getEvents();
  const recentAbandonments = events.filter(e => e.event_type === 'Checkout Started' && e.status === 'abandoned');
  if (recentAbandonments.length > 0) {
    alerts.push({
      id: 'notif-abandon',
      type: 'warning',
      msg: `${recentAbandonments.length} checkouts were abandoned in the last 90 days.`,
      time: 'Lost Sales'
    });
  }

  // 6. Promo near expiry (simulated)
  alerts.push({
    id: 'notif-promo-exp',
    type: 'warning',
    msg: `Coupon 'WELCOME10' expires in 15 days.`,
    time: 'Promotions'
  });

  activeNotifications = alerts;
}

export function refreshNotifications() {
  generateAlertsFromDB();
  renderNotifications();
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  const badge = document.getElementById('notifBadge');
  
  if (!list || !badge) return;

  const count = activeNotifications.length;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  if (count === 0) {
    list.innerHTML = '<div class="notif-empty">No active notifications</div>';
    return;
  }

  list.innerHTML = activeNotifications.map(n => `
    <div class="notif-item" data-id="${n.id}">
      <div class="notif-icon ${n.type}">
        <i data-lucide="${n.type === 'danger' ? 'alert-octagon' : (n.type === 'warning' ? 'alert-triangle' : 'info')}"></i>
      </div>
      <div class="notif-item-body">
        <p class="notif-msg">${n.msg}</p>
        <span class="notif-time">${n.time}</span>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons({ root: list });
}

// ==========================================
// 5. SKELETON DISPLAY CONTROLLER
// ==========================================

export function showLoader() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="skeleton-container">
      <div class="skeleton-header"></div>
      <div class="skeleton-grid">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
      <div class="skeleton-table"></div>
    </div>
  `;
}
