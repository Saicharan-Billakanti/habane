/* HABÄNE ADMIN — Main Router and Application Controller */

import { initAuth, logout } from './auth.js';
import { initSidebar, initNotificationEngine, showLoader, showToast } from './ui.js';
import { db, escHTML } from './utils.js';

let currentSection = null;

document.addEventListener('DOMContentLoaded', () => {
  // Boot Authentication Layer
  initAuth(onAuthSuccess);
});

function onAuthSuccess() {
  // Initialize general UI shell systems
  initSidebar();
  initNotificationEngine();
  
  // Set up Sidebar Clicks
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = e.currentTarget.dataset.section;
      navigateTo(section);
    });
  });

  // Set up Logout Button
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  });

  // Set up Global Search Bar
  initGlobalSearch();

  // Support Hash / Deep Linking Routing
  const hash = window.location.hash.replace('#', '');
  const validSections = ['overview', 'orders', 'products', 'promotions', 'customers', 'content', 'settings'];
  
  if (hash.startsWith('order/')) {
    const orderId = hash.split('/')[1];
    navigateTo('order-details', true, orderId);
  } else if (validSections.includes(hash)) {
    navigateTo(hash);
  } else {
    navigateTo('overview');
  }

  // Handle browser back/forward routing
  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.replace('#', '');
    if (newHash.startsWith('order/')) {
      const orderId = newHash.split('/')[1];
      navigateTo('order-details', false, orderId);
    } else if (validSections.includes(newHash) && newHash !== currentSection) {
      navigateTo(newHash, false);
    }
  });
}

// Dynamic Module Loader
async function navigateTo(section, updateHash = true, extraParam = null) {
  if (currentSection === section && section !== 'order-details') return;
  if (currentSection === 'order-details' && section === 'order-details' && window.currentOrderId === extraParam) return;
  
  if (section === 'order-details') {
    window.currentOrderId = extraParam;
  } else {
    window.currentOrderId = null;
  }
  
  // Destroy any active overview chart instances to prevent canvas bugs
  if (currentSection === 'overview') {
    try {
      const overviewModule = await import('./overview.js');
      overviewModule.destroyCharts();
    } catch(e){}
  }

  currentSection = section;
  
  // 1. Update hash URL
  if (updateHash) {
    if (section === 'order-details' && extraParam) {
      window.location.hash = `order/${extraParam}`;
    } else {
      window.location.hash = section;
    }
  }

  // 2. Set active sidebar styling
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const activeSection = (section === 'order-details') ? 'orders' : section;
    if (item.dataset.section === activeSection) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 3. Show dynamic skeletal loaders
  showLoader();

  // Close mobile drawer if open
  document.getElementById('sidebar')?.classList.remove('open');

  // 4. Lazy-load module and render
  try {
    const module = await import(`./${section}.js`);
    const container = document.getElementById('mainContent');
    
    // Add brief artificial delay to show sleek GSAP transition / skeleton loaders
    setTimeout(() => {
      module.render(container, extraParam);
      
      // Animate entry of new content
      if (window.gsap) {
        window.gsap.fromTo(container.firstElementChild, 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
    }, 380);

  } catch (err) {
    console.error(`Failed to load module: ${section}`, err);
    document.getElementById('mainContent').innerHTML = `
      <div class="glass-card stat-card" style="border-color:var(--danger); padding:2rem; text-align:center;">
        <i data-lucide="shield-alert" style="width:48px; height:48px; color:var(--danger); margin:0 auto 1rem;"></i>
        <h3 style="color:var(--danger); font-family:'Conthrax';">Module Error</h3>
        <p style="font-size:0.84rem; color:var(--text-muted); margin-top:0.5rem;">
          Failed to load the administrative module "${section}". Please refresh the page or contact support.
        </p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: document.getElementById('mainContent') });
  }
}

// ==========================================
// LINEAR-STYLE GLOBAL COMMAND PALETTE SEARCH
// ==========================================
function initGlobalSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  const dropdown = document.getElementById('globalSearchDropdown');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (!searchInput || !dropdown) return;

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    
    if (!q) {
      dropdown.style.display = 'none';
      clearBtn.style.display = 'none';
      return;
    }

    clearBtn.style.display = 'block';

    // Fetch lists
    const orders = db.getOrders();
    const catalog = window.HABANE?.PRODUCTS || [];
    const messages = db.getMessages();
    const promos = db.getPromotions();
    const newsletters = db.getNewsList();

    // Collate Unique customers
    const customersMap = {};
    orders.forEach(o => {
      const email = o.customer_email.trim().toLowerCase();
      customersMap[email] = { name: o.customer_name, email: o.customer_email, country: o.country };
    });
    const customers = Object.values(customersMap);

    const matches = { orders: [], products: [], customers: [], promos: [], messages: [] };

    // 1. Match Orders (Limit 3)
    matches.orders = orders.filter(o => 
      o.id.toLowerCase().includes(q) || 
      o.customer_name.toLowerCase().includes(q) || 
      o.customer_email.toLowerCase().includes(q)
    ).slice(0, 3);

    // 2. Match Products (Limit 3)
    matches.products = catalog.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.catLabel.toLowerCase().includes(q)
    ).slice(0, 3);

    // 3. Match Customers (Limit 3)
    matches.customers = customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q)
    ).slice(0, 3);

    // 4. Match Promos (Limit 3)
    matches.promos = promos.filter(p => 
      p.code.toLowerCase().includes(q)
    ).slice(0, 3);

    // 5. Match Inquiries Messages (Limit 3)
    matches.messages = messages.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.email.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    ).slice(0, 3);

    // Render results
    renderSearchResults(matches, q);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    dropdown.style.display = 'none';
    clearBtn.style.display = 'none';
    searchInput.focus();
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== searchInput) {
      dropdown.style.display = 'none';
    }
  });

  // Focus input triggers search show
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      dropdown.style.display = 'block';
    }
  });
}

function renderSearchResults(matches, query) {
  const dropdown = document.getElementById('globalSearchDropdown');
  if (!dropdown) return;

  const totalMatches = Object.values(matches).reduce((sum, list) => sum + list.length, 0);

  if (totalMatches === 0) {
    dropdown.innerHTML = `<div class="search-no-results">No admin records match "${escHTML(query)}"</div>`;
    dropdown.style.display = 'block';
    return;
  }

  let html = '';

  // 1. Render Orders Section
  if (matches.orders.length > 0) {
    html += `
      <div class="search-section">
        <h4>Orders</h4>
        ${matches.orders.map(o => `
          <div class="search-result-item" data-action="orders" data-val="${escHTML(o.id)}">
            <div class="item-details">
              <span class="item-title">${escHTML(o.id)} — ${escHTML(o.customer_name)}</span>
              <span class="item-sub">${o.country} · ${o.currency} ${o.total.toLocaleString()}</span>
            </div>
            <span class="item-badge badge--new">${o.status}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 2. Render Products Section
  if (matches.products.length > 0) {
    html += `
      <div class="search-section">
        <h4>Products</h4>
        ${matches.products.map(p => `
          <div class="search-result-item" data-action="products" data-val="${p.id}">
            <div class="item-details">
              <span class="item-title">${escHTML(p.name)}</span>
              <span class="item-sub">${p.catLabel} · ₹${p.price.toLocaleString('en-IN')}</span>
            </div>
            <span class="item-badge badge--delivered">Catalog</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 3. Render Customers Section
  if (matches.customers.length > 0) {
    html += `
      <div class="search-section">
        <h4>Customers</h4>
        ${matches.customers.map(c => `
          <div class="search-result-item" data-action="customers" data-tab="customers" data-val="${escHTML(c.email)}">
            <div class="item-details">
              <span class="item-title">${escHTML(c.name)}</span>
              <span class="item-sub">${escHTML(c.email)} · ${c.country}</span>
            </div>
            <span class="item-badge badge--packed">User</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 4. Render Promos Section
  if (matches.promos.length > 0) {
    html += `
      <div class="search-section">
        <h4>Promotions</h4>
        ${matches.promos.map(p => `
          <div class="search-result-item" data-action="promotions" data-val="${escHTML(p.code)}">
            <div class="item-details">
              <span class="item-title">${escHTML(p.code)}</span>
              <span class="item-sub">${p.type === 'pct' ? `${p.value}% discount` : 'Free Shipping'}</span>
            </div>
            <span class="item-badge badge--shipped">Promo</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 5. Render Messages Section
  if (matches.messages.length > 0) {
    html += `
      <div class="search-section">
        <h4>Support Messages</h4>
        ${matches.messages.map(m => `
          <div class="search-result-item" data-action="customers" data-tab="messages" data-val="${escHTML(m.id)}">
            <div class="item-details">
              <span class="item-title">From: ${escHTML(m.name)}</span>
              <span class="item-sub">Text: "${escHTML(m.message.slice(0, 45))}..."</span>
            </div>
            <span class="item-badge badge--status ${m.status === 'Unread' ? 'badge--danger' : 'badge--delivered'}" style="margin-left:auto;">${m.status}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  dropdown.innerHTML = html;
  dropdown.style.display = 'block';

  // Attach click listeners to search results to drive routing and prepopulate filters
  dropdown.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      const el = e.currentTarget;
      const section = el.dataset.action;
      const val = el.dataset.val;
      const tab = el.dataset.tab;

      dropdown.style.display = 'none';
      document.getElementById('globalSearchInput').value = '';
      document.getElementById('clearSearchBtn').style.display = 'none';

      // Navigate to target section
      await navigateTo(section);
      
      // If we go to orders or products or promotions, populate their filters!
      if (section === 'orders') {
        const orderSearchInput = document.getElementById('orderSearch');
        if (orderSearchInput) {
          orderSearchInput.value = val;
          // Trigger search input event dynamically to update order list
          orderSearchInput.dispatchEvent(new Event('input'));
        }
      } else if (section === 'products') {
        // If product is found, open its editing drawer directly!
        const productModule = await import('./products.js');
        // Small timeout to ensure elements are rendered
        setTimeout(() => {
          const editBtn = document.querySelector(`.edit-product-btn[data-id="${val}"]`);
          if (editBtn) editBtn.click();
        }, 100);
      } else if (section === 'promotions') {
        // Open the promotion's info or flash a notification
        showToast(`Promo ${val} loaded.`, "info");
      } else if (section === 'customers') {
        // For customer inbox/messages, open the specific tab!
        if (tab) {
          // Import customer module dynamically and trigger tab update
          const custModule = await import('./customers.js');
          // Update the module variables if needed or reload tab
          const custContainer = document.getElementById('mainContent');
          // Wait briefly, toggle tab
          const tabBtn = document.querySelector(`.analytics-tab-btn[data-tab="${tab}"]`);
          if (tabBtn) tabBtn.click();
        }
      }
    });
  });
}
