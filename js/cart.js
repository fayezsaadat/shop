/* =========================================================================
   VOLT ATHLETICS — cart.js
   Cart state for the Phase 1 demo. Persisted to localStorage and broadcast
   through the `volt:cart:change` event so every UI surface (header badge,
   mini-cart drawer, cart page, checkout summary) stays in sync.

   Phase 2: swap the read/write helpers for fetch() calls to PHP endpoints —
   the public API below does not need to change.
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT = global.VOLT || {};
  var store = VOLT.util ? VOLT.util.store : null;

  var STORAGE_KEY = 'cart';
  var META_KEY = 'cartMeta';

  var FREE_SHIPPING_THRESHOLD = 75;
  var TAX_RATE = 0.08;

  var SHIPPING = {
    standard: { id: 'standard', label: 'Standard delivery', eta: '3–5 working days', price: 6.95 },
    express:  { id: 'express',  label: 'Express delivery',  eta: '1–2 working days', price: 12.95 },
    nextday:  { id: 'nextday',  label: 'Next day delivery', eta: 'Order before 6pm', price: 19.95 }
  };

  /* Demo promo codes. */
  var PROMOS = {
    VOLT10:    { code: 'VOLT10',    type: 'percent', value: 10, label: '10% off your order' },
    WELCOME15: { code: 'WELCOME15', type: 'percent', value: 15, label: '15% off your first order' },
    TRAIN20:   { code: 'TRAIN20',   type: 'percent', value: 20, min: 100, label: '20% off orders over $100' },
    FREESHIP:  { code: 'FREESHIP',  type: 'shipping', value: 0, label: 'Free shipping' }
  };

  var items = [];
  var meta = { promo: null, shipping: 'standard' };

  /* ------------------------------------------------------------ state -- */
  function safeGet(key, fallback) {
    if (store) return store.get(key, fallback);
    try { return JSON.parse(global.localStorage.getItem('volt.' + key)) || fallback; }
    catch (e) { return fallback; }
  }
  function safeSet(key, value) {
    if (store) return store.set(key, value);
    try { global.localStorage.setItem('volt.' + key, JSON.stringify(value)); } catch (e) {}
  }

  function load() {
    var raw = safeGet(STORAGE_KEY, []);
    items = Array.isArray(raw) ? raw.filter(isValidLine) : [];
    var m = safeGet(META_KEY, null);
    meta = m && typeof m === 'object' ? { promo: m.promo || null, shipping: m.shipping || 'standard' } : { promo: null, shipping: 'standard' };
    if (!SHIPPING[meta.shipping]) meta.shipping = 'standard';
  }

  function isValidLine(line) {
    return line && typeof line === 'object' && line.id && line.size && line.qty > 0;
  }

  function persist(silent) {
    safeSet(STORAGE_KEY, items);
    safeSet(META_KEY, meta);
    if (!silent && VOLT.util) VOLT.util.emit('volt:cart:change', { items: items, totals: totals() });
  }

  function lineKey(item) {
    return [item.id, item.color || 'default', item.size].join('|');
  }

  function find(key) {
    for (var i = 0; i < items.length; i++) if (items[i].key === key) return items[i];
    return null;
  }

  /* --------------------------------------------------------- mutation -- */
  function add(entry, quantity) {
    if (!entry || !entry.id) return null;
    var qty = Math.max(1, Number(quantity || entry.qty || 1));
    var key = lineKey(entry);
    var existing = find(key);

    if (existing) {
      existing.qty = Math.min(99, existing.qty + qty);
    } else {
      items.push({
        key: key,
        id: entry.id,
        slug: entry.slug || entry.id,
        name: entry.name,
        price: Number(entry.price) || 0,
        compareAt: entry.compareAt ? Number(entry.compareAt) : null,
        color: entry.color || 'default',
        colorName: entry.colorName || '',
        size: entry.size,
        qty: Math.min(99, qty),
        image: entry.image || '',
        addedAt: Date.now()
      });
    }
    persist();
    return key;
  }

  function setQty(key, qty) {
    var line = find(key);
    if (!line) return;
    qty = Math.max(0, Math.min(99, Math.floor(Number(qty) || 0)));
    if (qty === 0) return remove(key);
    line.qty = qty;
    persist();
  }

  function bump(key, delta) {
    var line = find(key);
    if (!line) return;
    setQty(key, line.qty + Number(delta || 0));
  }

  function remove(key) {
    var before = items.length;
    items = items.filter(function (i) { return i.key !== key; });
    if (items.length !== before) persist();
  }

  function clear() {
    items = [];
    meta.promo = null;
    persist();
  }

  /* ---------------------------------------------------------- pricing -- */
  function subtotal() {
    return items.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
  }

  function compareSubtotal() {
    return items.reduce(function (sum, i) { return sum + (i.compareAt || i.price) * i.qty; }, 0);
  }

  function count() {
    return items.reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function applyPromo(code) {
    var key = String(code || '').trim().toUpperCase();
    var promo = PROMOS[key];
    if (!promo) return { ok: false, message: 'That code is not valid.' };
    if (promo.min && subtotal() < promo.min) {
      return { ok: false, message: 'Spend ' + VOLT.util.money(promo.min) + ' or more to use ' + key + '.' };
    }
    meta.promo = key;
    persist();
    return { ok: true, message: promo.label + ' applied.', promo: promo };
  }

  function removePromo() {
    meta.promo = null;
    persist();
  }

  function promo() { return meta.promo ? PROMOS[meta.promo] : null; }

  function setShipping(id) {
    if (!SHIPPING[id]) return;
    meta.shipping = id;
    persist();
  }

  function shippingMethod() { return SHIPPING[meta.shipping] || SHIPPING.standard; }

  function shippingOptions() {
    return Object.keys(SHIPPING).map(function (k) { return SHIPPING[k]; });
  }

  function shippingCost() {
    var method = shippingMethod();
    var p = promo();
    if (!items.length) return 0;
    if (p && p.type === 'shipping') return 0;
    if (method.id === 'standard' && subtotal() >= FREE_SHIPPING_THRESHOLD) return 0;
    return method.price;
  }

  function totals() {
    var sub = subtotal();
    var savings = Math.max(0, compareSubtotal() - sub);
    var p = promo();
    var promoDiscount = 0;
    if (p && p.type === 'percent') promoDiscount = sub * (p.value / 100);
    var discounted = Math.max(0, sub - promoDiscount);
    var ship = shippingCost();
    var tax = discounted * TAX_RATE;
    return {
      count: count(),
      subtotal: sub,
      compareSubtotal: compareSubtotal(),
      savings: savings,
      promoCode: p ? p.code : null,
      promoLabel: p ? p.label : null,
      promoDiscount: promoDiscount,
      discount: savings + promoDiscount,
      shipping: ship,
      shippingLabel: ship === 0 ? 'Free' : null,
      shippingMethod: shippingMethod(),
      tax: tax,
      total: discounted + ship + tax
    };
  }

  function freeShippingRemaining() {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal());
  }

  function freeShippingProgress() {
    return Math.min(100, (subtotal() / FREE_SHIPPING_THRESHOLD) * 100);
  }

  /* ------------------------------------------------------------ orders -- */
  /* Placing an order in Phase 1 just archives the cart locally so the
     account page has believable order history to render. */
  function placeOrder(details) {
    if (!items.length) return null;
    var t = totals();
    var order = {
      reference: 'VA' + String(Date.now()).slice(-8),
      placedAt: new Date().toISOString(),
      status: 'Processing',
      items: items.map(function (i) { return Object.assign({}, i); }),
      totals: t,
      customer: details || {},
      shipping: shippingMethod()
    };
    var history = safeGet('orders', []);
    history.unshift(order);
    safeSet('orders', history.slice(0, 20));
    safeSet('lastOrder', order);
    clear();
    return order;
  }

  function orders() { return safeGet('orders', []); }
  function lastOrder() { return safeGet('lastOrder', null); }

  load();

  VOLT.cart = {
    items: function () { return items.slice(); },
    count: count,
    add: add,
    remove: remove,
    setQty: setQty,
    bump: bump,
    clear: clear,
    find: find,
    totals: totals,
    subtotal: subtotal,
    applyPromo: applyPromo,
    removePromo: removePromo,
    promo: promo,
    promoCodes: PROMOS,
    setShipping: setShipping,
    shippingMethod: shippingMethod,
    shippingOptions: shippingOptions,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    freeShippingRemaining: freeShippingRemaining,
    freeShippingProgress: freeShippingProgress,
    taxRate: TAX_RATE,
    placeOrder: placeOrder,
    orders: orders,
    lastOrder: lastOrder,
    reload: load
  };
}(window));
