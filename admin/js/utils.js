/* HABÄNE ADMIN — Data Adapter and Utility Helpers */

// ==========================================
// 1. DATA ADAPTER INTERFACE (LocalStorage CRUD)
// ==========================================

const STATIC_ORDERS = [
  {
    id: "HB-1001",
    customer_name: "Bhavya Chandana",
    customer_email: "bhavya.chandana@gmail.com",
    phone: "+91 9848022334",
    address: "Plot 45, Jubilee Hills, Hyderabad, India",
    country: "IN",
    currency: "INR",
    products: [
      { id: "p4", name: "SMART Duffel — Ivory", color: "Ivory", size: "45L", qty: 1, price: 12999 },
      { id: "p8", name: "City Sling", color: "Grey", size: "One Size", qty: 1, price: 3499 }
    ],
    quantity: 2,
    subtotal: 16498,
    discount: 1650,
    shipping_fee: 0,
    total: 14848,
    status: "Delivered",
    promo_code: "WELCOME10",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "HB-1002",
    customer_name: "Sai Charan",
    customer_email: "sai.charan@yahoo.com",
    phone: "+91 8123456789",
    address: "Villa 12, Nanakramguda, Hyderabad, India",
    country: "IN",
    currency: "INR",
    products: [
      { id: "p1", name: "Skyline Duffel", color: "Olive", size: "35L", qty: 1, price: 6499 },
      { id: "p2", name: "Metropolitan Duffel", color: "Navy", size: "40L", qty: 1, price: 6999 }
    ],
    quantity: 2,
    subtotal: 13498,
    discount: 0,
    shipping_fee: 0,
    total: 13498,
    status: "Shipped",
    promo_code: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "HB-1003",
    customer_name: "Pravallika",
    customer_email: "pravallika.p@outlook.com",
    phone: "+91 7890123456",
    address: "Flat 302, Gachibowli, Hyderabad, India",
    country: "IN",
    currency: "INR",
    products: [
      { id: "p6", name: "Midnight Rolltop", color: "Midnight", size: "24L", qty: 1, price: 5499 }
    ],
    quantity: 1,
    subtotal: 5499,
    discount: 0,
    shipping_fee: 150,
    total: 5649,
    status: "New",
    promo_code: null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  }
];

const STATIC_EVENTS = [
  // Wishlist Added for Bhavya Chandana
  { id: "EV-W1", event_type: "Wishlist Added", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), country: "IN", currency: "INR", product_id: "p6", quantity: null, search_query: null, order_total: null, customer_email: "bhavya.chandana@gmail.com", status: null },
  { id: "EV-W2", event_type: "Wishlist Added", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), country: "IN", currency: "INR", product_id: "p5", quantity: null, search_query: null, order_total: null, customer_email: "bhavya.chandana@gmail.com", status: null },

  // Wishlist Added for Sai Charan
  { id: "EV-W3", event_type: "Wishlist Added", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), country: "IN", currency: "INR", product_id: "p7", quantity: null, search_query: null, order_total: null, customer_email: "sai.charan@yahoo.com", status: null }
];

const STATIC_MESSAGES = [
  { id: "MSG-1", name: "Bhavya Chandana", email: "bhavya.chandana@gmail.com", message: "Hello Habäne team, can I register my lifetime zipper warranty for the SMART Duffel online?", status: "Unread", created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), country: "IN" },
  { id: "MSG-2", name: "Sai Charan", email: "sai.charan@yahoo.com", message: "Is the internal power bank TSA-approved for international flights?", status: "Replied", created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), country: "IN" }
];

const STATIC_NEWSLETTERS = [
  { id: "NL-1", email: "bhavya.chandana@gmail.com", created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), country: "IN" },
  { id: "NL-2", email: "sai.charan@yahoo.com", created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), country: "IN" },
  { id: "NL-3", email: "pravallika.p@outlook.com", created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), country: "IN" }
];

export const db = {
  // Orders
  getOrders() {
    const stored = localStorage.getItem('habane_orders');
    const localOrders = stored ? JSON.parse(stored) : [];
    const merged = [...STATIC_ORDERS];
    localOrders.forEach(lo => {
      if (!merged.some(so => so.id.toLowerCase() === lo.id.toLowerCase())) {
        merged.push(lo);
      }
    });
    return merged;
  },
  saveOrder(order) {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx > -1) orders[idx] = order;
    else orders.push(order);
    localStorage.setItem('habane_orders', JSON.stringify(orders));
  },
  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      orders[idx].status = status;
      localStorage.setItem('habane_orders', JSON.stringify(orders));
      return true;
    }
    return false;
  },

  // Events / Analytics logs
  getEvents() {
    const stored = localStorage.getItem('habane_events');
    const localEvents = stored ? JSON.parse(stored) : [];
    const merged = [...STATIC_EVENTS];
    localEvents.forEach(le => {
      if (!merged.some(se => se.id.toLowerCase() === le.id.toLowerCase())) {
        merged.push(le);
      }
    });
    return merged;
  },

  // Newsletter Subscribers
  getNewsList() {
    const stored = localStorage.getItem('habane_news_list');
    const localNews = stored ? JSON.parse(stored) : [];
    const merged = [...STATIC_NEWSLETTERS];
    localNews.forEach(ln => {
      if (!merged.some(sn => sn.id.toLowerCase() === ln.id.toLowerCase())) {
        merged.push(ln);
      }
    });
    return merged;
  },

  // Contact Messages
  getMessages() {
    const stored = localStorage.getItem('habane_msgs');
    const localMsgs = stored ? JSON.parse(stored) : [];
    const merged = [...STATIC_MESSAGES];
    localMsgs.forEach(lm => {
      if (!merged.some(sm => sm.id.toLowerCase() === lm.id.toLowerCase())) {
        merged.push(lm);
      }
    });
    return merged;
  },
  updateMessageStatus(msgId, status) {
    const msgs = this.getMessages();
    const idx = msgs.findIndex(m => m.id === msgId);
    if (idx > -1) {
      msgs[idx].status = status;
      localStorage.setItem('habane_msgs', JSON.stringify(msgs));
      return true;
    }
    return false;
  },

  // Catalog Overrides
  getCatalogOverrides() {
    return JSON.parse(localStorage.getItem('habane_catalog_overrides')) || {};
  },
  saveCatalogOverride(prodId, data) {
    const overrides = this.getCatalogOverrides();
    overrides[prodId] = { ...(overrides[prodId] || {}), ...data };
    localStorage.setItem('habane_catalog_overrides', JSON.stringify(overrides));
  },
  clearCatalogOverrides() {
    localStorage.removeItem('habane_catalog_overrides');
  },

  // Content Overrides
  getContentOverrides() {
    return JSON.parse(localStorage.getItem('habane_content_overrides')) || {};
  },
  saveContentOverrides(data) {
    localStorage.setItem('habane_content_overrides', JSON.stringify(data));
  },

  // Settings
  getSettings() {
    // Return custom settings or create default structure
    const defaultSettings = {
      default_currency: 'INR',
      landing_country: 'IN',
      countries: {}
    };
    return JSON.parse(localStorage.getItem('habane_settings')) || defaultSettings;
  },
  saveSettings(settings) {
    localStorage.setItem('habane_settings', JSON.stringify(settings));
  },

  // Promotions
  getPromotions() {
    const defaultPromos = [
      { code: "WELCOME10", type: "pct", value: 10, usage_count: 124, revenue_generated: 720000, enabled: true, active_dates: "2026-01-01 to 2026-12-31" },
      { code: "FREESHIP", type: "ship", value: 0, usage_count: 52, revenue_generated: 345000, enabled: true, active_dates: "2026-01-01 to 2026-12-31" },
      { code: "SMARTLIFE", type: "pct", value: 15, usage_count: 45, revenue_generated: 410000, enabled: true, active_dates: "2026-01-01 to 2026-12-31" }
    ];
    const stored = localStorage.getItem('habane_promotions');
    if (!stored) {
      localStorage.setItem('habane_promotions', JSON.stringify(defaultPromos));
      return defaultPromos;
    }
    return JSON.parse(stored);
  },
  savePromotions(promos) {
    localStorage.setItem('habane_promotions', JSON.stringify(promos));
  }
};

// ==========================================
// 2. REVENUE NORMALIZATION (To INR)
// ==========================================

export function normalizeRevenue(amount, currencyCode) {
  if (!amount) return 0;
  if (currencyCode === 'INR') return Number(amount);

  // Look up current rates in window.HABANE.COUNTRIES
  const countries = window.HABANE?.COUNTRIES || [];
  const country = countries.find(c => c.currency === currencyCode);
  
  if (country && country.rate) {
    // INR = Foreign Amount / Rate
    return Math.round(Number(amount) / country.rate);
  }
  
  // Fallback rates if not loaded
  const fallbacks = { USD: 0.012, GBP: 0.0095, AED: 0.044, SGD: 0.016, AUD: 0.018, CAD: 0.016, EUR: 0.011, JPY: 1.8, KRW: 16, NZD: 0.02 };
  const rate = fallbacks[currencyCode] || 1;
  return Math.round(Number(amount) / rate);
}

// ==========================================
// 3. SECURITY & ESCAPING UTILS (XSS & CSV)
// ==========================================

// Escape user text before rendering in HTML
export function escHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Protect against CSV Formula Injection (DDE)
export function escCSV(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // If the cell value starts with critical DDE command characters
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    // Prefix with single quote to treat as plain text in spreadsheet editors
    return `'${str}`;
  }
  return str;
}

// Generate CSV string and trigger download
export function downloadCSV(filename, dataRows, headers) {
  // Map rows, escaping formula injections and surrounding with quotes
  const csvContent = [
    headers.map(h => `"${escCSV(h)}"`).join(','),
    ...dataRows.map(row => row.map(cell => `"${escCSV(cell)}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
