/* HABÄNE — cart, wishlist, location state */

(function () {
  const H = window.HABANE;
  const { FREE_SHIP, byId } = H;

  let cart = load('habane_cart', []);
  let wish = load('habane_wish', []);
  let promo = load('habane_promo', null);
  let location = load('habane_location', H.COUNTRIES[0]);
  let user = load('habane_user', null); // demo session: { name, email, since } — never a password

  function load(k, fb) {
    try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; }
  }

  function save() {
    localStorage.setItem('habane_cart', JSON.stringify(cart));
    localStorage.setItem('habane_wish', JSON.stringify(wish));
    localStorage.setItem('habane_promo', JSON.stringify(promo));
    localStorage.setItem('habane_location', JSON.stringify(location));
  }

  const COUNTRIES = H.COUNTRIES;

  const discountValue = sub =>
    (promo && promo.type === 'pct' && promo.value > 0 && sub > 0)
      ? Math.round(sub * promo.value / 100) : 0;

  const cartQty = () => cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = () => cart.reduce((s, i) => s + byId(i.id).price * i.qty, 0);

  function addToCart(id, color, size, qty) {
    const key = `${id}|${color}|${size}`;
    const found = cart.find(i => i.key === key);
    if (found) found.qty += qty;
    else cart.push({ key, id, color, size, qty });
    save();
    H.events?.dispatchEvent(new CustomEvent('cart:update'));
    return byId(id);
  }

  function changeQty(key, d) {
    const it = cart.find(i => i.key === key);
    if (!it) return;
    it.qty += d;
    if (it.qty <= 0) cart = cart.filter(i => i.key !== key);
    save();
    H.events?.dispatchEvent(new CustomEvent('cart:update'));
  }

  function removeItem(key) {
    cart = cart.filter(i => i.key !== key);
    save();
    H.events?.dispatchEvent(new CustomEvent('cart:update'));
  }

  function clearCart() {
    cart = [];
    promo = null;
    save();
    H.events?.dispatchEvent(new CustomEvent('cart:update'));
  }

  function toggleWish(id) {
    const i = wish.indexOf(id);
    if (i > -1) wish.splice(i, 1);
    else wish.push(id);
    save();
    H.events?.dispatchEvent(new CustomEvent('wish:update', { detail: { id } }));
    return wish.includes(id);
  }

  function isWish(id) { return wish.includes(id); }

  function setLocation(c) {
    location = c;
    save();
    H.events?.dispatchEvent(new CustomEvent('location:update', { detail: c }));
  }

  function getLocation() { return location; }

  function getUser() { return user; }

  function setUser(u) {
    user = u;
    localStorage.setItem('habane_user', JSON.stringify(u));
    H.events?.dispatchEvent(new CustomEvent('user:update', { detail: u }));
  }

  function logout() {
    user = null;
    localStorage.removeItem('habane_user');
    H.events?.dispatchEvent(new CustomEvent('user:update', { detail: null }));
  }

  Object.assign(H, {
    cart, wish, promo,
    discountValue, cartQty, cartSubtotal,
    addToCart, changeQty, removeItem, clearCart,
    toggleWish, isWish, setLocation, getLocation, save,
    getUser, setUser, logout,
  });

  // defineProperties (not object-literal getters via Object.assign, which
  // flattens accessors into plain snapshot values) so these stay live.
  Object.defineProperties(H, {
    cartData: { get: () => cart, configurable: true },
    wishData: { get: () => wish, configurable: true },
    promoData: {
      get: () => promo,
      set: v => { promo = v; save(); },
      configurable: true,
    },
  });
})();
