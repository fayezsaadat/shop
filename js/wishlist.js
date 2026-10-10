/* =========================================================================
   VOLT ATHLETICS — wishlist.js
   Saved-items state. Mirrors the cart module's shape: localStorage backed,
   change events on `volt:wishlist:change`.
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT = global.VOLT || {};
  var KEY = 'wishlist';
  var ids = [];

  function read() {
    try {
      var raw = JSON.parse(global.localStorage.getItem('volt.' + KEY));
      return Array.isArray(raw) ? raw.filter(function (v) { return typeof v === 'string'; }) : [];
    } catch (e) { return []; }
  }

  function write() {
    try { global.localStorage.setItem('volt.' + KEY, JSON.stringify(ids)); } catch (e) {}
    if (VOLT.util) VOLT.util.emit('volt:wishlist:change', { ids: ids.slice() });
  }

  function load() { ids = read(); }

  function has(id) { return ids.indexOf(id) > -1; }

  function add(id) {
    if (!id || has(id)) return false;
    ids.unshift(id);
    write();
    return true;
  }

  function remove(id) {
    var before = ids.length;
    ids = ids.filter(function (v) { return v !== id; });
    if (ids.length !== before) { write(); return true; }
    return false;
  }

  function toggle(id) { return has(id) ? (remove(id), false) : add(id); }

  function clear() { ids = []; write(); }

  /* Resolved product objects, newest saved first. */
  function products() {
    if (!VOLT.catalog) return [];
    return ids.map(function (id) { return VOLT.catalog.byId(id); })
      .filter(Boolean);
  }

  load();

  VOLT.wishlist = {
    ids: function () { return ids.slice(); },
    products: products,
    count: function () { return ids.length; },
    has: has,
    add: add,
    remove: remove,
    toggle: toggle,
    clear: clear,
    reload: load
  };
}(window));
