/* HABÄNE — Deterministic Sample Data Seeding */

(function () {
  const PROMO_CODES = [
    { code: "WELCOME10", type: "pct", value: 10, usage_count: 1, revenue_generated: 14848, enabled: true, active_dates: "2026-01-01 to 2026-12-31" },
    { code: "FREESHIP", type: "ship", value: 0, usage_count: 0, revenue_generated: 0, enabled: true, active_dates: "2026-01-01 to 2026-12-31" },
    { code: "SMARTLIFE", type: "pct", value: 15, usage_count: 0, revenue_generated: 0, enabled: true, active_dates: "2026-01-01 to 2026-12-31" }
  ];

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
    { id: "EV-W1", event_type: "Wishlist Added", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), country: "IN", currency: "INR", product_id: "p6", quantity: null, search_query: null, order_total: null, customer_email: "bhavya.chandana@gmail.com", status: null },
    { id: "EV-W2", event_type: "Wishlist Added", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), country: "IN", currency: "INR", product_id: "p5", quantity: null, search_query: null, order_total: null, customer_email: "bhavya.chandana@gmail.com", status: null },
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

  window.generateSeedData = function (force = false) {
    if (!force && localStorage.getItem('habane_orders')) {
      console.log("Habäne: Data already exists, skipping seed generator.");
      return;
    }

    console.log("Habäne: Seeding static dashboard data...");

    localStorage.setItem('habane_orders', JSON.stringify(STATIC_ORDERS));
    localStorage.setItem('habane_events', JSON.stringify(STATIC_EVENTS));
    localStorage.setItem('habane_news_list', JSON.stringify(STATIC_NEWSLETTERS));
    localStorage.setItem('habane_msgs', JSON.stringify(STATIC_MESSAGES));
    localStorage.setItem('habane_promotions', JSON.stringify(PROMO_CODES));

    console.log("Habäne: Static seeding completed successfully!");
  };

  if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!localStorage.getItem('habane_orders')) {
        window.generateSeedData(false);
      }
    });
  }
})();
