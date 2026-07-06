/* HABÄNE — shared product & content data */

window.HABANE = window.HABANE || {};

const FREE_SHIP = 4999;

const SMART_FEATURES = [
  { id: 'usb', title: 'USB Charging Port', desc: 'Built-in USB-A and USB-C pass-through keeps devices charged on the move.', icon: 'usb' },
  { id: 'power', title: 'Power Bank Compartment', desc: 'Dedicated padded slot for a 10,000mAh power bank with cable routing.', icon: 'battery-charging' },
  { id: 'fingerprint', title: 'Fingerprint Lock', desc: 'Biometric access on the main compartment — unlock in under 0.3s.', icon: 'fingerprint' },
  { id: 'tsa', title: 'TSA Lock', desc: 'Travel Sentry approved combination lock for hassle-free airport security.', icon: 'lock' },
  { id: 'gps', title: 'GPS Tracking', desc: 'Discreet tracker pocket compatible with Apple AirTag and Tile devices.', icon: 'map-pin' },
  { id: 'antitheft', title: 'Anti-Theft Protection', desc: 'Hidden zippers, slash-resistant panels and lockable pullers.', icon: 'shield' },
  { id: 'laptop', title: 'Laptop Compartment', desc: 'Suspended 16" laptop sleeve with soft-touch lining and corner guards.', icon: 'laptop' },
  { id: 'hidden', title: 'Hidden Pockets', desc: 'Concealed interior pockets for passport, cards and valuables.', icon: 'eye-off' },
  { id: 'water', title: 'Water-Resistant Material', desc: 'DWR-coated tech canvas sheds rain and spills without bulk.', icon: 'droplets' },
  { id: 'expand', title: 'Expandable Storage', desc: 'Compression straps and expandable gussets add up to 8L when you need it.', icon: 'maximize-2' },
  { id: 'org', title: 'Smart Organization', desc: 'Modular interior with labelled zones for tech, clothes and essentials.', icon: 'layout-grid' },
  { id: 'rfid', title: 'RFID Protection', desc: 'RFID-blocking pocket shields cards from contactless skimming.', icon: 'radio' },
];

const FAQ_ITEMS = [
  { q: 'Is the smart duffel actually smart or is it just vibes?', a: 'Genuinely smart. 10,000mAh fast-charge core, RGB trim and a device check-in panel. The vibes are just a bonus. ⚡', img: 'assets/products/p4-smart-duffel-ivory.jpg', tag: 'SMART SERIES' },
  { q: "How fast is shipping? I'm impatient", a: "Same, valid. Metro cities 2–4 days, rest of India 4–7. Free over ₹4,999, and you'll get tracking the second it ships. 🚚", img: 'assets/products/p2-navy-metropolitan-duffel.jpg', tag: 'SHIPPING' },
  { q: "What if it doesn't hit the same in person?", a: "7-day no-drama returns. If it's not giving what you wanted, send it back. Refund or swap, your call. ↩️", img: 'assets/products/p1-olive-skyline-duffel.jpg', tag: 'RETURNS' },
  { q: 'Are these gonna fall apart in a month?', a: 'Absolutely not. Lifetime zipper warranty, reinforced stitching, water-repellent canvas. Built to outlive your situationships. ♾️', img: 'assets/products/p7-heritage-backpack.jpg', tag: 'QUALITY' },
  { q: "Do you do COD? I don't trust the internet", a: 'Yep, cash on delivery available nationwide. Pay when it physically lands in your hands. 💸', img: 'assets/products/p5-steel-blue-weekender.jpg', tag: 'PAYMENTS' },
];

// rate = target currency per 1 INR (approx, for on-site price conversion)
const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳', symbol: '₹', rate: 1, locale: 'en-IN' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸', symbol: '$', rate: 0.012, locale: 'en-US' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', symbol: '£', rate: 0.0095, locale: 'en-GB' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪', symbol: 'د.إ ', rate: 0.044, locale: 'en-US' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬', symbol: 'S$', rate: 0.016, locale: 'en-US' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺', symbol: 'A$', rate: 0.018, locale: 'en-US' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦', symbol: 'C$', rate: 0.016, locale: 'en-US' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪', symbol: '€', rate: 0.011, locale: 'de-DE' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷', symbol: '€', rate: 0.011, locale: 'fr-FR' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵', symbol: '¥', rate: 1.8, locale: 'ja-JP' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', flag: '🇰🇷', symbol: '₩', rate: 16, locale: 'ko-KR' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', flag: '🇳🇿', symbol: 'NZ$', rate: 0.02, locale: 'en-NZ' },
];

const PRODUCTS = [
  { id: 'p1', name: 'Skyline Duffel', cat: 'duffel', catLabel: 'Duffel', price: 6499, was: 7999,
    img: 'assets/products/p1-olive-skyline-duffel.jpg', img2: 'assets/products/alt-white-duffel.jpg',
    images: ['assets/products/p1-olive-skyline-duffel.jpg', 'assets/products/alt-white-duffel.jpg'],
    badge: 'BESTSELLER', stars: 5, new: false, bestSelling: true, featured: true,
    colors: [{ name: 'Olive', hex: '#5a6b3f' }, { name: 'Midnight', hex: '#0b1240' }, { name: 'Silver', hex: '#9a9ea8' }],
    sizes: ['35L', '45L', '55L'],
    desc: 'Our hero carry. Hand-drawn skyline print on water-repellent canvas, leather-trim handles and a vault-grade zipper.',
    specs: { material: 'Water-repellent canvas', capacity: '35–55L', weight: '1.4 kg', warranty: 'Lifetime zipper' },
    smartFeatures: [] },

  { id: 'p2', name: 'Metropolitan Duffel', cat: 'duffel', catLabel: 'Duffel', price: 6999, was: null,
    img: 'assets/products/p2-navy-metropolitan-duffel.jpg', img2: 'assets/products/alt-steel-duffel.jpg',
    images: ['assets/products/p2-navy-metropolitan-duffel.jpg', 'assets/products/alt-steel-duffel.jpg'],
    badge: 'NEW', stars: 5, new: true, bestSelling: true, featured: true,
    colors: [{ name: 'Navy', hex: '#0b1240' }, { name: 'Ice', hex: '#bfe8f5' }],
    sizes: ['40L', '50L'],
    desc: 'Midnight navy with an ice-blue cityscape and contrast webbing handles. Cabin-friendly with shoulder strap.',
    specs: { material: 'Tech canvas', capacity: '40–50L', weight: '1.5 kg', warranty: 'Lifetime zipper' },
    smartFeatures: [] },

  { id: 'p3', name: 'Voyager Duffel', cat: 'duffel', catLabel: 'Duffel', price: 6799, was: null,
    img: 'assets/products/p3-navy-voyager-duffel.jpg', img2: 'assets/products/p2-navy-metropolitan-duffel.jpg',
    images: ['assets/products/p3-navy-voyager-duffel.jpg', 'assets/products/p2-navy-metropolitan-duffel.jpg'],
    badge: null, stars: 4, new: true, bestSelling: false, featured: true,
    colors: [{ name: 'Navy', hex: '#0b1240' }, { name: 'Sky', hex: '#8fd4ec' }],
    sizes: ['40L', '50L'],
    desc: 'Nautical line-art print across deep navy canvas. Travel duffel for overhead bins and boat decks alike.',
    specs: { material: 'Canvas + leather trim', capacity: '40–50L', weight: '1.45 kg', warranty: 'Lifetime zipper' },
    smartFeatures: [] },

  { id: 'p4', name: 'SMART Duffel — Ivory', cat: 'smart', catLabel: 'Smart Series', price: 12999, was: 14999,
    img: 'assets/products/p4-smart-duffel-ivory.jpg', img2: 'assets/products/alt-white-duffel.jpg',
    images: ['assets/products/p4-smart-duffel-ivory.jpg', 'assets/products/alt-white-duffel.jpg', 'assets/products/p2-navy-metropolitan-duffel.jpg'],
    badge: 'SMART', stars: 5, new: true, bestSelling: true, featured: true,
    colors: [{ name: 'Ivory', hex: '#f6f7f9' }, { name: 'Navy', hex: '#0b1240' }],
    sizes: ['45L'],
    desc: 'The bag that thinks. Fast-charge core, reactive RGB trim, touch media strip and smart check-in panel.',
    specs: { material: 'Tech canvas DWR', capacity: '45L', weight: '1.8 kg', warranty: 'Lifetime + 2yr electronics' },
    smartFeatures: ['usb', 'power', 'fingerprint', 'tsa', 'gps', 'antitheft', 'laptop', 'hidden', 'water', 'expand', 'org', 'rfid'] },

  { id: 'p5', name: 'Steel Weekender', cat: 'duffel', catLabel: 'Duffel', price: 5999, was: null,
    img: 'assets/products/p5-steel-blue-weekender.jpg', img2: 'assets/products/alt-steel-duffel.jpg',
    images: ['assets/products/p5-steel-blue-weekender.jpg', 'assets/products/alt-steel-duffel.jpg'],
    badge: null, stars: 4, new: false, bestSelling: false, featured: false,
    colors: [{ name: 'Steel Blue', hex: '#4a6b8a' }, { name: 'Tan', hex: '#8e6b4a' }],
    sizes: ['38L', '48L'],
    desc: 'Vintage-washed canvas with full-grain leather handles and antique-brass crossbody strap.',
    specs: { material: 'Washed canvas', capacity: '38–48L', weight: '1.3 kg', warranty: 'Lifetime zipper' },
    smartFeatures: [] },

  { id: 'p6', name: 'Midnight Rolltop', cat: 'backpack', catLabel: 'Backpack', price: 5499, was: 6499,
    img: 'assets/products/p6-midnight-rolltop.jpg', img2: 'assets/products/alt-black-backpack.jpg',
    images: ['assets/products/p6-midnight-rolltop.jpg', 'assets/products/alt-black-backpack.jpg'],
    badge: 'SALE', stars: 5, new: false, bestSelling: true, featured: false,
    colors: [{ name: 'Midnight', hex: '#0b1240' }, { name: 'Charcoal', hex: '#14163a' }],
    sizes: ['18L', '24L'],
    desc: 'Roll-top commuter with padded 16" laptop sleeve, magnetic buckle and hidden anti-theft zip.',
    specs: { material: 'Ballistic nylon', capacity: '18–24L', weight: '0.9 kg', warranty: 'Lifetime zipper' },
    smartFeatures: ['laptop', 'antitheft', 'hidden', 'usb'] },

  { id: 'p7', name: 'Heritage Backpack', cat: 'backpack', catLabel: 'Backpack', price: 6299, was: null,
    img: 'assets/products/p7-heritage-backpack.jpg', img2: 'assets/products/alt-black-backpack-art.jpg',
    images: ['assets/products/p7-heritage-backpack.jpg', 'assets/products/alt-black-backpack-art.jpg'],
    badge: null, stars: 4, new: false, bestSelling: false, featured: false,
    colors: [{ name: 'Olive', hex: '#5a6b3f' }, { name: 'Tan', hex: '#8e6b4a' }],
    sizes: ['20L', '28L'],
    desc: 'Waxed canvas, dual cargo pockets and leather buckle straps. Built like luggage from another era.',
    specs: { material: 'Waxed canvas', capacity: '20–28L', weight: '1.1 kg', warranty: 'Lifetime zipper' },
    smartFeatures: [] },

  { id: 'p8', name: 'City Sling', cat: 'sling', catLabel: 'Sling', price: 3499, was: 4299,
    img: 'assets/products/p8-grey-sling.jpg', img2: 'assets/products/alt-black-crossbody.jpg',
    images: ['assets/products/p8-grey-sling.jpg', 'assets/products/alt-black-crossbody.jpg'],
    badge: 'SALE', stars: 4, new: false, bestSelling: false, featured: false,
    colors: [{ name: 'Grey', hex: '#7d818c' }, { name: 'Navy', hex: '#0b1240' }],
    sizes: ['One Size'],
    desc: 'Compact crossbody for essentials — phone, wallet, keys, charger.',
    specs: { material: 'Canvas + leather', capacity: '4L', weight: '0.35 kg', warranty: 'Lifetime zipper' },
    smartFeatures: ['rfid', 'hidden'] },

  { id: 'p9', name: 'Aero Gym Duffel', cat: 'duffel', catLabel: 'Duffel', price: 4999, was: 5999,
    img: 'assets/products/p1-olive-skyline-duffel.jpg', img2: 'assets/products/alt-white-duffel.jpg',
    images: ['assets/products/p1-olive-skyline-duffel.jpg', 'assets/products/alt-white-duffel.jpg'],
    badge: 'SALE', stars: 4, new: true, bestSelling: false, featured: false,
    colors: [{ name: 'Olive', hex: '#5a6b3f' }, { name: 'Black', hex: '#14163a' }],
    sizes: ['30L', '40L'],
    desc: 'Lightweight gym-to-office duffel with ventilated shoe garage and wet pocket.',
    specs: { material: 'Poly canvas', capacity: '30–40L', weight: '1.0 kg', warranty: 'Lifetime zipper' },
    smartFeatures: ['water', 'org'] },

  { id: 'p10', name: 'Transit Daypack', cat: 'backpack', catLabel: 'Backpack', price: 4799, was: null,
    img: 'assets/products/p6-midnight-rolltop.jpg', img2: 'assets/products/alt-black-backpack.jpg',
    images: ['assets/products/p6-midnight-rolltop.jpg', 'assets/products/alt-black-backpack.jpg'],
    badge: 'NEW', stars: 5, new: true, bestSelling: false, featured: false,
    colors: [{ name: 'Midnight', hex: '#0b1240' }, { name: 'Ice', hex: '#bfe8f5' }],
    sizes: ['16L', '22L'],
    desc: 'Minimal daypack with quick-access top pocket, USB pass-through and luggage pass-through strap.',
    specs: { material: 'Recycled nylon', capacity: '16–22L', weight: '0.75 kg', warranty: 'Lifetime zipper' },
    smartFeatures: ['usb', 'laptop', 'org'] },

  { id: 'p11', name: 'Voyager Smart Edition', cat: 'smart', catLabel: 'Smart Series', price: 13999, was: null,
    img: 'assets/products/p3-navy-voyager-duffel.jpg', img2: 'assets/products/p2-navy-metropolitan-duffel.jpg',
    images: ['assets/products/p3-navy-voyager-duffel.jpg', 'assets/products/p2-navy-metropolitan-duffel.jpg', 'assets/products/p4-smart-duffel-ivory.jpg'],
    badge: 'SMART', stars: 5, new: true, bestSelling: true, featured: false,
    colors: [{ name: 'Navy', hex: '#0b1240' }, { name: 'Sky', hex: '#8fd4ec' }],
    sizes: ['45L'],
    desc: 'The Voyager, upgraded. Integrated power bank, GPS tracker pocket and reactive trim lighting.',
    specs: { material: 'Tech canvas DWR', capacity: '45L', weight: '1.85 kg', warranty: 'Lifetime + 2yr electronics' },
    smartFeatures: ['usb', 'power', 'gps', 'tsa', 'antitheft', 'laptop', 'water', 'expand', 'org', 'rfid'] },

  { id: 'p12', name: 'Compact Sling Mini', cat: 'sling', catLabel: 'Sling', price: 2799, was: 3499,
    img: 'assets/products/p8-grey-sling.jpg', img2: 'assets/products/alt-black-crossbody-front.jpg',
    images: ['assets/products/p8-grey-sling.jpg', 'assets/products/alt-black-crossbody-front.jpg'],
    badge: 'SALE', stars: 4, new: false, bestSelling: false, featured: false,
    colors: [{ name: 'Grey', hex: '#7d818c' }, { name: 'Tan', hex: '#8e6b4a' }],
    sizes: ['One Size'],
    desc: 'The going-out sling for nights when you only need the essentials.',
    specs: { material: 'Canvas', capacity: '2.5L', weight: '0.28 kg', warranty: 'Lifetime zipper' },
    smartFeatures: ['rfid'] },

  { id: 'p13', name: 'Metropolitan XL', cat: 'duffel', catLabel: 'Duffel', price: 7999, was: null,
    img: 'assets/products/p2-navy-metropolitan-duffel.jpg', img2: 'assets/products/alt-steel-duffel.jpg',
    images: ['assets/products/p2-navy-metropolitan-duffel.jpg', 'assets/products/alt-steel-duffel.jpg'],
    badge: null, stars: 5, new: false, bestSelling: false, featured: false,
    colors: [{ name: 'Navy', hex: '#0b1240' }, { name: 'Ice', hex: '#bfe8f5' }],
    sizes: ['60L', '70L'],
    desc: 'Two-week capacity Metropolitan with compression straps and separate shoe compartment.',
    specs: { material: 'Tech canvas', capacity: '60–70L', weight: '2.1 kg', warranty: 'Lifetime zipper' },
    smartFeatures: ['expand', 'org'] },

  { id: 'p14', name: 'Trailhead Backpack', cat: 'backpack', catLabel: 'Backpack', price: 5899, was: null,
    img: 'assets/products/p7-heritage-backpack.jpg', img2: 'assets/products/alt-black-backpack-art.jpg',
    images: ['assets/products/p7-heritage-backpack.jpg', 'assets/products/alt-black-backpack-art.jpg'],
    badge: null, stars: 4, new: true, bestSelling: false, featured: false,
    colors: [{ name: 'Olive', hex: '#5a6b3f' }, { name: 'Charcoal', hex: '#14163a' }],
    sizes: ['24L', '32L'],
    desc: 'Weekend-trail ready: hydration sleeve, top-load main and weatherproof base.',
    specs: { material: 'Ripstop nylon', capacity: '24–32L', weight: '1.05 kg', warranty: 'Lifetime zipper' },
    smartFeatures: ['water', 'laptop', 'hidden'] },
];

// Merge local storage overrides before exposing window.HABANE
(function mergeOverrides() {
  try {
    // 1. Catalog Overrides
    const catOverrides = JSON.parse(localStorage.getItem('habane_catalog_overrides'));
    if (catOverrides) {
      const existingIds = new Set(PRODUCTS.map(p => p.id));
      Object.entries(catOverrides).forEach(([id, over]) => {
        if (existingIds.has(id)) {
          const p = PRODUCTS.find(x => x.id === id);
          if (p) {
            Object.assign(p, over);
            if (over.price !== undefined) p.price = Number(over.price);
            if (over.was !== undefined) p.was = over.was === null ? null : Number(over.was);
            if (over.stock !== undefined) p.stock = Number(over.stock);
            if (over.featured !== undefined) p.featured = over.featured === true || over.featured === 'true';
            if (over.cat !== undefined) {
              p.catLabel = over.cat === 'duffel' ? 'Duffel' : 
                           (over.cat === 'backpack' ? 'Backpack' : 
                           (over.cat === 'smart' ? 'Smart Series' : over.cat.charAt(0).toUpperCase() + over.cat.slice(1)));
            }
          }
        } else {
          // Append new admin-created custom products
          const catLabel = over.cat === 'duffel' ? 'Duffel' : 
                           (over.cat === 'backpack' ? 'Backpack' : 
                           (over.cat === 'smart' ? 'Smart Series' : 'Sling'));
          PRODUCTS.push({
            id: id,
            name: over.name || 'New Custom Bag',
            price: Number(over.price) || 0,
            was: over.was ? Number(over.was) : null,
            badge: over.badge || null,
            stock: over.stock !== undefined ? Number(over.stock) : 10,
            featured: over.featured === true || over.featured === 'true',
            cat: over.cat || 'duffel',
            catLabel: catLabel,
            img: over.img || 'assets/products/p1-olive-skyline-duffel.jpg',
            img2: over.img2 || null,
            images: over.images || ['assets/products/p1-olive-skyline-duffel.jpg'],
            colors: over.colors || [{ name: 'Midnight', hex: '#0b1240' }],
            sizes: over.sizes || ['45L'],
            desc: over.desc || 'Premium custom carry bag.',
            specs: over.specs || { material: 'Tech Canvas', capacity: '45L', weight: '1.3 kg', warranty: 'Lifetime zipper' },
            smartFeatures: over.smartFeatures || []
          });
        }
      });
    }

    // 2. Settings Overrides
    const settings = JSON.parse(localStorage.getItem('habane_settings'));
    if (settings && settings.countries) {
      const updatedCountries = COUNTRIES.map(c => {
        const cSet = settings.countries[c.code];
        if (cSet) {
          return {
            ...c,
            currency: cSet.currency ?? c.currency,
            rate: cSet.rate !== undefined ? Number(cSet.rate) : c.rate,
            symbol: cSet.symbol ?? c.symbol,
            enabled: cSet.enabled !== false
          };
        }
        return { ...c, enabled: true };
      }).filter(c => c.enabled);

      COUNTRIES.length = 0;
      COUNTRIES.push(...updatedCountries);
    }
  } catch (e) {
    console.error("Error applying Habäne overrides inside data.js:", e);
  }
})();

Object.assign(window.HABANE, { FREE_SHIP, PRODUCTS, SMART_FEATURES, FAQ_ITEMS, COUNTRIES,
  byId: id => PRODUCTS.find(p => p.id === id),
  // currency-aware price formatter (converts INR → selected region)
  inr: n => {
    const H = window.HABANE;
    const c = (H.getLocation && H.getLocation()) || { symbol: '₹', rate: 1, locale: 'en-IN' };
    const v = Math.round(n * (c.rate || 1));
    return (c.symbol || '₹') + v.toLocaleString(c.locale || 'en-US');
  },
  stars: n => '★'.repeat(n) + '☆'.repeat(5 - n),
});

// Dynamic injection of the tracking layer (js/track.js) for storefront pages
if (typeof document !== 'undefined' && !window.location.pathname.includes('/admin/')) {
  const trackScript = document.createElement('script');
  trackScript.src = 'js/track.js';
  trackScript.defer = true;
  document.head.appendChild(trackScript);
}

