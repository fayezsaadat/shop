/* =========================================================================
   VOLT ATHLETICS — app.js
   Shared front-end shell: utilities, icon set, header/footer injection,
   drawers, search overlay, toasts, product-card renderer, scroll reveal.

   Load order: products.js → cart.js → wishlist.js → auth.js → app.js → page.js
   The header/footer are injected from one template so every page stays in
   sync (Phase 2 swaps this for a PHP include with the same markup).
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT = global.VOLT || {};

  /* ------------------------------------------------------------ utils -- */
  var util = {
    qs: function (sel, ctx) { return (ctx || document).querySelector(sel); },
    qsa: function (sel, ctx) {
      return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
    },
    money: function (value) {
      var n = Number(value) || 0;
      return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    escape: function (str) {
      return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    param: function (name, fallback) {
      var value = new URLSearchParams(global.location.search).get(name);
      return value === null ? (fallback === undefined ? null : fallback) : value;
    },
    debounce: function (fn, wait) {
      var t;
      return function () {
        var args = arguments, ctx = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(ctx, args); }, wait || 200);
      };
    },
    /* Namespaced localStorage with graceful failure (private mode, quotas). */
    store: {
      key: function (name) { return 'volt.' + name; },
      get: function (name, fallback) {
        try {
          var raw = global.localStorage.getItem(util.store.key(name));
          return raw === null ? fallback : JSON.parse(raw);
        } catch (e) { return fallback; }
      },
      set: function (name, value) {
        try {
          global.localStorage.setItem(util.store.key(name), JSON.stringify(value));
          return true;
        } catch (e) { return false; }
      },
      remove: function (name) {
        try { global.localStorage.removeItem(util.store.key(name)); } catch (e) {}
      }
    },
    emit: function (name, detail) {
      document.dispatchEvent(new CustomEvent(name, { detail: detail }));
    },
    /* Relative path prefix so pages in sub-folders would still resolve. */
    root: '',
    plural: function (n, one, many) { return n === 1 ? one : (many || one + 's'); },
    initials: function (first, last) {
      return ((first || '?').charAt(0) + (last || '').charAt(0)).toUpperCase();
    }
  };
  VOLT.util = util;

  /* ------------------------------------------------------------ icons -- */
  var PATHS = {
    bolt: '<path d="M13 2 4.5 13.2h6L11 22l8.5-11.2h-6L13 2z" fill="currentColor" stroke="none"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    user: '<path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="8" r="4"/>',
    heart: '<path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8c0 5.8-8.5 11.3-8.5 11.3z"/>',
    bag: '<path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevronRight: '<path d="m9 5 7 7-7 7"/>',
    chevronLeft: '<path d="m15 5-7 7 7 7"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    arrowRight: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6.5 7 7.5 20h9L17.5 7"/>',
    star: '<path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9L12 2.6z" fill="currentColor" stroke="none"/>',
    truck: '<path d="M2 7h11v9H2z"/><path d="M13 10h4l3 3v3h-7"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="16.5" cy="18" r="1.8"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>',
    shield: '<path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3z"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M4 4l16 16"/><path d="M9.9 5.9A9.9 9.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.5 4.2"/><path d="M6.3 7.9A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.6-.3 3.7-.8"/>',
    sliders: '<path d="M4 7h11M18 7h2M4 17h4M11 17h9"/><circle cx="16.5" cy="7" r="2"/><circle cx="9.5" cy="17" r="2"/>',
    grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
    rows: '<rect x="4" y="5" width="16" height="6"/><rect x="4" y="14" width="16" height="6"/>',
    ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
    package: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    mapPin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19"/>',
    gift: '<rect x="3" y="8" width="18" height="4"/><path d="M5 12h14v8H5z"/><path d="M12 8v12"/><path d="M12 8S9.5 3.5 7.5 5s1.5 3 4.5 3zM12 8s2.5-4.5 4.5-3-1.5 3-4.5 3z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 4 2.8 20h18.4L12 4z"/><path d="M12 10v4M12 17h.01"/>',
    logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 12h11"/><path d="m13 8-4 4 4 4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.5 12a7.5 7.5 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2-1.2L14.8 3H9.2l-.3 2.7a7.6 7.6 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1c.6.5 1.3.9 2 1.2l.3 2.7h5.6l.3-2.7c.7-.3 1.4-.7 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
    sparkle: '<path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18.1l-1.8-5.5L4.7 10.8 10.2 9 12 3.5z"/>',
    leaf: '<path d="M20 4S9 3 5.5 8.5 7 20 7 20s9 1 12.5-4.5S20 4 20 4z"/><path d="M7 20 17 9"/>',
    headset: '<path d="M4 13v-1a8 8 0 1 1 16 0v1"/><rect x="2.5" y="13" width="4.5" height="6" rx="1.6"/><rect x="17" y="13" width="4.5" height="6" rx="1.6"/><path d="M20 19v.5a3 3 0 0 1-3 3h-3"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M17.2 7h.01"/>',
    x: '<path d="m5 5 14 14M19 5 5 19"/>',
    youtube: '<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="m11 9.5 4 2.5-4 2.5v-5z" fill="currentColor" stroke="none"/>',
    tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.46"/><path d="M14 4c.5 2.5 2 4 4.5 4.2"/>',
    facebook: '<path d="M14.5 8H17V4.6h-2.6c-2.4 0-3.9 1.6-3.9 4V11H8v3.4h2.5V21h3.4v-6.6h2.5l.6-3.4h-3.1V9.2c0-.8.3-1.2 1.1-1.2z"/>'
  };

  function icon(name, size, cls) {
    var d = PATHS[name];
    if (!d) return '';
    return '<svg class="' + (cls || '') + '" width="' + (size || 20) + '" height="' + (size || 20) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      d + '</svg>';
  }
  VOLT.icon = icon;

  /* ------------------------------------------------------- nav config -- */
  var NAV = [
    { label: 'Men', href: 'shop-men.html', key: 'men' },
    { label: 'Women', href: 'shop-women.html', key: 'women' },
    { label: 'New Arrivals', href: 'new-arrivals.html', key: 'new' },
    { label: 'Best Sellers', href: 'best-sellers.html', key: 'best' },
    { label: 'Sale', href: 'sale.html', key: 'sale', sale: true }
  ];
  VOLT.nav = NAV;

  var ANNOUNCEMENTS = [
    'Free express shipping on orders over <b>$75</b>',
    '<b>Season drop</b> — up to 30% off selected training gear',
    'Free 30-day returns. No questions asked.'
  ];

  /* ------------------------------------------------------- templates --- */
  function logoMarkup(cls) {
    return '<a class="logo ' + (cls || '') + '" href="index.html" aria-label="VOLT ATHLETICS home">' +
      '<span class="logo__mark">' + icon('bolt', 18) + '</span>' +
      '<span class="logo__text">VOLT<small>Athletics</small></span></a>';
  }

  function headerMarkup(active) {
    var links = NAV.map(function (item) {
      return '<a class="nav__link' + (item.sale ? ' nav__link--sale' : '') +
        (active === item.key ? ' is-active' : '') + '" href="' + item.href + '">' +
        item.label + '</a>';
    }).join('');

    return '' +
      '<div class="announce" aria-label="Store announcements"><div class="container">' +
        '<div class="announce__track" id="announceTrack">' +
          ANNOUNCEMENTS.map(function (text, i) {
            return '<p class="announce__item' + (i === 0 ? ' is-active' : '') + '">' + text + '</p>';
          }).join('') +
        '</div></div></div>' +
      '<header class="site-header" id="siteHeader"><div class="container"><div class="header__inner">' +
        '<button class="icon-btn burger" id="burgerBtn" aria-label="Open menu" aria-expanded="false" aria-controls="mobileNav">' +
          '<span class="sr-only">Menu</span><span></span><span></span><span></span>' +
        '</button>' +
        logoMarkup() +
        '<nav class="nav" aria-label="Primary">' + links + '</nav>' +
        '<form class="header__search" role="search" action="search.html" method="get">' +
          icon('search', 18) +
          '<input class="input" type="search" name="q" placeholder="Search gear…" aria-label="Search products" autocomplete="off">' +
        '</form>' +
        '<div class="header__actions">' +
          '<button class="icon-btn" id="searchBtn" aria-label="Search" aria-expanded="false">' + icon('search') + '</button>' +
          '<a class="icon-btn" href="account.html" aria-label="Your account">' + icon('user') + '</a>' +
          '<a class="icon-btn icon-btn--count" href="wishlist.html" aria-label="Wishlist">' +
            icon('heart') + '<span class="count" data-wishlist-count>0</span></a>' +
          '<button class="icon-btn icon-btn--count" id="cartBtn" aria-label="Open cart" aria-controls="cartDrawer">' +
            icon('bag') + '<span class="count" data-cart-count>0</span></button>' +
        '</div>' +
      '</div></div></header>' +

      /* Search overlay */
      '<div class="search-panel" id="searchPanel" role="dialog" aria-modal="true" aria-label="Search">' +
        '<div class="overlay" data-close-search></div>' +
        '<div class="search-panel__sheet"><div class="container">' +
          '<form class="search-panel__bar" action="search.html" method="get" role="search">' +
            '<input class="input" type="search" name="q" id="searchInput" placeholder="What are you training in today?" aria-label="Search products" autocomplete="off">' +
            '<button class="btn btn--primary" type="submit">Search</button>' +
            '<button class="icon-btn" type="button" data-close-search aria-label="Close search">' + icon('close') + '</button>' +
          '</form>' +
          '<div class="search-suggest">' +
            '<div><p class="eyebrow" style="margin-bottom:12px">Popular searches</p><ul class="search-suggest__list">' +
              ['Leggings', 'Oversized hoodie', 'Training shorts', 'Sports bra', 'Joggers'].map(function (t) {
                return '<li><a href="search.html?q=' + encodeURIComponent(t) + '">' + t + '</a></li>';
              }).join('') +
            '</ul></div>' +
            '<div><p class="eyebrow" style="margin-bottom:12px" id="searchPreviewLabel">Trending now</p>' +
              '<div class="search-results-mini" id="searchPreview"></div></div>' +
          '</div>' +
        '</div></div>' +
      '</div>' +

      /* Mobile navigation drawer */
      '<div class="overlay" data-overlay></div>' +
      '<aside class="drawer drawer--left" id="mobileNav" aria-label="Menu" aria-hidden="true">' +
        '<div class="drawer__head">' + logoMarkup() +
          '<button class="icon-btn" data-drawer-close aria-label="Close menu">' + icon('close') + '</button>' +
        '</div>' +
        '<div class="drawer__body">' +
          '<form class="header__search" style="display:block;max-width:none;margin-bottom:20px" action="search.html" method="get" role="search">' +
            icon('search', 18) +
            '<input class="input" type="search" name="q" placeholder="Search gear…" aria-label="Search products">' +
          '</form>' +
          '<nav class="mobile-nav__links" aria-label="Mobile">' +
            NAV.map(function (item) {
              return '<a href="' + item.href + '"' + (item.sale ? ' class="is-sale"' : '') + '>' +
                item.label + icon('chevronRight', 16) + '</a>';
            }).join('') +
          '</nav>' +
          '<div class="mobile-nav__sub">' +
            '<a href="account.html">' + icon('user', 17) + ' My account</a>' +
            '<a href="wishlist.html">' + icon('heart', 17) + ' Wishlist</a>' +
            '<a href="cart.html">' + icon('bag', 17) + ' Cart</a>' +
            '<a href="info.html?topic=size-guide">' + icon('ruler', 17) + ' Size guide</a>' +
            '<a href="info.html?topic=shipping">' + icon('truck', 17) + ' Shipping &amp; returns</a>' +
            '<a href="info.html?topic=contact">' + icon('headset', 17) + ' Help &amp; contact</a>' +
          '</div>' +
        '</div>' +
        '<div class="drawer__foot"><a class="btn btn--primary btn--block" href="login.html">Sign in</a></div>' +
      '</aside>' +

      /* Mini cart drawer */
      '<aside class="drawer" id="cartDrawer" aria-label="Shopping cart" aria-hidden="true">' +
        '<div class="drawer__head">' +
          '<p class="drawer__title">Your cart <span data-cart-count-text>(0)</span></p>' +
          '<button class="icon-btn" data-drawer-close aria-label="Close cart">' + icon('close') + '</button>' +
        '</div>' +
        '<div class="drawer__body" id="cartDrawerBody"></div>' +
        '<div class="drawer__foot" id="cartDrawerFoot"></div>' +
      '</aside>' +

      '<div class="toast-stack" id="toastStack" role="status" aria-live="polite"></div>';
  }

  function footerMarkup() {
    var cols = [
      { title: 'Shop', links: [
        ['Men', 'shop-men.html'], ['Women', 'shop-women.html'], ['New Arrivals', 'new-arrivals.html'],
        ['Best Sellers', 'best-sellers.html'], ['Sale', 'sale.html']
      ] },
      { title: 'Help', links: [
        ['Contact Us', 'info.html?topic=contact'], ['Shipping', 'info.html?topic=shipping'],
        ['Returns', 'info.html?topic=returns'], ['Size Guide', 'info.html?topic=size-guide'],
        ['FAQs', 'info.html?topic=faq']
      ] },
      { title: 'Company', links: [
        ['Our Story', 'info.html?topic=about'], ['Sustainability', 'info.html?topic=sustainability'],
        ['Careers', 'info.html?topic=careers'], ['Athletes', 'info.html?topic=athletes'],
        ['Store Locator', 'info.html?topic=stores']
      ] }
    ];

    return '<footer class="site-footer"><div class="container">' +
      '<div class="footer__top">' +
        '<div class="footer__brand">' + logoMarkup() +
          '<p>Performance sportswear engineered for people who show up. Designed in-house, ' +
          'tested by athletes, built to outlast the season.</p>' +
          '<div class="socials">' +
            ['instagram', 'x', 'youtube', 'tiktok', 'facebook'].map(function (s) {
              return '<a href="#" aria-label="' + s + '" rel="noopener">' + icon(s, 17) + '</a>';
            }).join('') +
          '</div>' +
        '</div>' +
        cols.map(function (col) {
          return '<div class="footer__col"><h4>' + col.title + '</h4><ul>' +
            col.links.map(function (l) { return '<li><a href="' + l[1] + '">' + l[0] + '</a></li>'; }).join('') +
            '</ul></div>';
        }).join('') +
        '<div class="footer__news"><h4 style="font-size:.72rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase">Join the club</h4>' +
          '<p>Early access to drops, training content and member-only pricing.</p>' +
          '<form class="footer__form" data-newsletter novalidate>' +
            '<input class="input" type="email" name="email" placeholder="Email address" aria-label="Email address" required>' +
            '<button class="btn btn--accent" type="submit">Join</button>' +
          '</form>' +
          '<p class="small" style="margin-top:10px;color:var(--gray-500)">By subscribing you agree to our ' +
            '<a href="info.html?topic=privacy" style="text-decoration:underline">Privacy Policy</a>.</p>' +
        '</div>' +
      '</div>' +
      '<div class="footer__bottom">' +
        '<p>© ' + new Date().getFullYear() + ' VOLT ATHLETICS. Demo store — Phase 1 front-end.</p>' +
        '<nav aria-label="Legal">' +
          '<a href="info.html?topic=privacy">Privacy</a>' +
          '<a href="info.html?topic=terms">Terms</a>' +
          '<a href="info.html?topic=cookies">Cookies</a>' +
          '<a href="info.html?topic=accessibility">Accessibility</a>' +
        '</nav>' +
        '<div class="pay-list"><span>VISA</span><span>MC</span><span>AMEX</span><span>PAYPAL</span><span>APPLE</span></div>' +
      '</div>' +
    '</div></footer>';
  }

  /* --------------------------------------------------------- ui layer -- */
  var ui = {
    toast: function (message, opts) {
      opts = opts || {};
      var stack = document.getElementById('toastStack');
      if (!stack) return;
      var node = document.createElement('div');
      node.className = 'toast';
      node.innerHTML = icon(opts.icon || 'checkCircle', 19) +
        '<span>' + message + '</span>' +
        (opts.action ? '<a href="' + opts.action.href + '">' + opts.action.label + '</a>' : '');
      stack.appendChild(node);
      requestAnimationFrame(function () { node.classList.add('is-in'); });
      setTimeout(function () {
        node.classList.remove('is-in');
        setTimeout(function () { node.remove(); }, 320);
      }, opts.duration || 3200);
    },

    openDrawer: function (id) {
      var drawer = document.getElementById(id);
      if (!drawer) return;
      util.qsa('[data-overlay]').forEach(function (o) { o.classList.add('is-open'); });
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      var focusable = drawer.querySelector('button, a, input');
      if (focusable) setTimeout(function () { focusable.focus(); }, 120);
    },

    closeDrawers: function () {
      util.qsa('.drawer.is-open').forEach(function (d) {
        d.classList.remove('is-open');
        d.setAttribute('aria-hidden', 'true');
      });
      util.qsa('[data-overlay]').forEach(function (o) { o.classList.remove('is-open'); });
      var burger = document.getElementById('burgerBtn');
      if (burger) { burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
      if (!util.qs('.search-panel.is-open') && !util.qs('.modal.is-open')) {
        document.body.classList.remove('is-locked');
      }
    },

    openModal: function (id) {
      var modal = document.getElementById(id);
      if (!modal) return;
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
      var close = modal.querySelector('[data-modal-close]');
      if (close) setTimeout(function () { close.focus(); }, 120);
    },

    closeModal: function (id) {
      var modal = id ? document.getElementById(id) : util.qs('.modal.is-open');
      if (!modal) return;
      modal.classList.remove('is-open');
      if (!util.qs('.drawer.is-open')) document.body.classList.remove('is-locked');
    },

    stars: function (rating, count) {
      var pct = Math.max(0, Math.min(100, (Number(rating) / 5) * 100));
      var one = icon('star', 13);
      var row = one + one + one + one + one;
      return '<span class="rating">' +
        '<span class="stars" role="img" aria-label="Rated ' + rating + ' out of 5">' +
          '<span class="stars__bg">' + row + '</span>' +
          '<span class="stars__fg" style="width:' + pct + '%">' + row + '</span>' +
        '</span>' +
        '<span>' + Number(rating).toFixed(1) + '</span>' +
        (count != null ? '<span class="count">(' + count + ')</span>' : '') +
        '</span>';
    },

    /* Reusable product card used by every listing on the site. */
    productCard: function (product, options) {
      options = options || {};
      var cat = VOLT.catalog;
      var color = options.color || product.colors[0].key;
      var images = cat.gallery(product, color);
      var href = 'product.html?id=' + encodeURIComponent(product.slug);
      var price = cat.currentPrice(product);
      var off = cat.discountPct(product);
      var wished = VOLT.wishlist && VOLT.wishlist.has(product.id);

      var flags = '';
      if (off) flags += '<span class="badge badge--sale">-' + off + '%</span>';
      if (product.isNew) flags += '<span class="badge badge--new">New</span>';
      if (!off && !product.isNew && product.bestSeller) flags += '<span class="badge">Best seller</span>';

      var swatches = product.colors.slice(0, 4).map(function (c, i) {
        return '<button class="swatch' + (c.key === color ? ' is-active' : '') + '" type="button" ' +
          'style="background:' + c.hex + '" data-swatch="' + c.key + '" ' +
          'aria-label="View in ' + util.escape(c.name) + '"' + (i === 0 ? '' : '') + '></button>';
      }).join('');
      var more = product.colors.length > 4 ?
        '<span class="swatch--more">+' + (product.colors.length - 4) + '</span>' : '';

      return '<article class="card" data-product="' + product.id + '" data-color="' + color + '">' +
        '<div class="card__media">' +
          '<a href="' + href + '" aria-label="' + util.escape(product.name) + '">' +
            '<img class="card__img card__img--main" src="' + images[0] + '" alt="' +
              util.escape(product.name) + ' in ' + util.escape(product.colors[0].name) + '" loading="lazy" width="600" height="750">' +
            '<img class="card__img card__img--hover" src="' + images[3] + '" alt="" loading="lazy" aria-hidden="true" width="600" height="750">' +
          '</a>' +
          '<div class="card__flags">' + flags + '</div>' +
          '<button class="card__wish' + (wished ? ' is-active' : '') + '" type="button" data-wish="' + product.id + '" ' +
            'aria-label="' + (wished ? 'Remove from' : 'Add to') + ' wishlist" aria-pressed="' + (!!wished) + '">' +
            icon('heart', 18) + '</button>' +
          '<div class="card__quick">' +
            '<button class="btn btn--light btn--sm" type="button" data-quick-add="' + product.id + '">Quick add</button>' +
          '</div>' +
        '</div>' +
        '<div class="card__body">' +
          '<p class="card__cat">' + util.escape(product.category) + '</p>' +
          '<h3 class="card__name"><a href="' + href + '">' + util.escape(product.name) + '</a></h3>' +
          '<div class="card__price">' +
            '<span>' + util.money(price) + '</span>' +
            (off ? '<s>' + util.money(product.price) + '</s><span class="off">Save ' +
              util.money(product.price - price) + '</span>' : '') +
          '</div>' +
          '<div class="card__foot">' +
            ui.stars(product.rating, product.reviews) +
            '<div class="swatches">' + swatches + more + '</div>' +
          '</div>' +
        '</div>' +
      '</article>';
    },

    productGrid: function (products, options) {
      return products.map(function (p) { return ui.productCard(p, options); }).join('');
    },

    /* Quick-add: picks the first in-stock size and drops it in the cart. */
    quickAdd: function (productId) {
      var product = VOLT.catalog.byId(productId);
      if (!product) return;
      var size = (product.sizes.filter(function (s) { return s.inStock; })[0] || product.sizes[0]).size;
      VOLT.cart.add({
        id: product.id, slug: product.slug, name: product.name, price: VOLT.catalog.currentPrice(product),
        compareAt: product.salePrice ? product.price : null, color: product.colors[0].key,
        colorName: product.colors[0].name, size: size, qty: 1,
        image: VOLT.catalog.image(product, product.colors[0].key)
      });
      ui.toast('<b>' + util.escape(product.name) + '</b> added to your cart',
        { action: { href: 'cart.html', label: 'View cart' } });
      ui.openDrawer('cartDrawer');
    },

    emptyState: function (iconName, title, text, cta) {
      return '<div class="empty-state">' + icon(iconName, 46) +
        '<h3 class="h3" style="margin-bottom:8px">' + title + '</h3>' +
        '<p>' + text + '</p>' +
        (cta ? '<a class="btn btn--primary" href="' + cta.href + '">' + cta.label + '</a>' : '') +
        '</div>';
    },

    skeletonGrid: function (count) {
      var one = '<div class="skeleton-card"><div class="skeleton skeleton-card__media"></div>' +
        '<div class="skeleton skeleton-card__line"></div>' +
        '<div class="skeleton skeleton-card__line skeleton-card__line--short"></div></div>';
      return new Array(count || 8).fill(one).join('');
    }
  };
  VOLT.ui = ui;

  /* -------------------------------------------------------- mini cart -- */
  function renderMiniCart() {
    var body = document.getElementById('cartDrawerBody');
    var foot = document.getElementById('cartDrawerFoot');
    if (!body || !foot || !VOLT.cart) return;

    var items = VOLT.cart.items();
    var totals = VOLT.cart.totals();

    if (!items.length) {
      body.innerHTML = ui.emptyState('bag', 'Your cart is empty',
        'Nothing here yet — find your next favourite piece.',
        { href: 'new-arrivals.html', label: 'Shop new arrivals' });
      foot.innerHTML = '<a class="btn btn--outline btn--block" href="best-sellers.html">Browse best sellers</a>';
      return;
    }

    body.innerHTML = items.map(function (item) {
      return '<div class="line-item">' +
        '<a class="line-item__img" href="product.html?id=' + item.slug + '">' +
          '<img src="' + item.image + '" alt="' + util.escape(item.name) + '" loading="lazy"></a>' +
        '<div>' +
          '<a class="line-item__name" href="product.html?id=' + item.slug + '">' + util.escape(item.name) + '</a>' +
          '<p class="line-item__meta">' + util.escape(item.colorName) + ' · Size ' + item.size + '</p>' +
          '<div class="line-item__row">' +
            '<div class="qty" data-line="' + item.key + '">' +
              '<button type="button" data-qty="-1" aria-label="Decrease quantity">' + icon('minus', 15) + '</button>' +
              '<input type="text" inputmode="numeric" value="' + item.qty + '" aria-label="Quantity" data-qty-input>' +
              '<button type="button" data-qty="1" aria-label="Increase quantity">' + icon('plus', 15) + '</button>' +
            '</div>' +
            '<span class="line-item__price">' + util.money(item.price * item.qty) + '</span>' +
          '</div>' +
          '<button class="line-remove" type="button" data-remove="' + item.key + '">Remove</button>' +
        '</div>' +
      '</div>';
    }).join('');

    var freeLeft = VOLT.cart.freeShippingRemaining();
    foot.innerHTML =
      (freeLeft > 0
        ? '<p class="small" style="margin-bottom:12px">Add <b>' + util.money(freeLeft) +
          '</b> more for free express shipping.</p>' +
          '<div style="height:5px;background:var(--gray-200);border-radius:3px;overflow:hidden;margin-bottom:16px">' +
          '<div style="height:100%;width:' + VOLT.cart.freeShippingProgress() +
          '%;background:var(--ink);border-radius:3px;transition:width .4s"></div></div>'
        : '<p class="small" style="margin-bottom:14px;color:var(--success);font-weight:600">' +
          icon('checkCircle', 15) + ' You have unlocked free express shipping</p>') +
      '<div class="summary-row summary-row--total"><span>Subtotal</span><span>' +
        util.money(totals.subtotal) + '</span></div>' +
      '<div style="display:grid;gap:9px;margin-top:14px">' +
        '<a class="btn btn--primary btn--block" href="checkout.html">Checkout</a>' +
        '<a class="btn btn--outline btn--block" href="cart.html">View cart</a>' +
      '</div>';
  }

  /* ---------------------------------------------------------- badges --- */
  function updateBadges() {
    var cartCount = VOLT.cart ? VOLT.cart.count() : 0;
    var wishCount = VOLT.wishlist ? VOLT.wishlist.count() : 0;

    util.qsa('[data-cart-count]').forEach(function (el) {
      el.textContent = cartCount;
      el.classList.toggle('is-visible', cartCount > 0);
      el.classList.add('is-bump');
      setTimeout(function () { el.classList.remove('is-bump'); }, 460);
    });
    util.qsa('[data-cart-count-text]').forEach(function (el) { el.textContent = '(' + cartCount + ')'; });
    util.qsa('[data-wishlist-count]').forEach(function (el) {
      el.textContent = wishCount;
      el.classList.toggle('is-visible', wishCount > 0);
    });
  }

  /* ----------------------------------------------------- interactions -- */
  function bindHeader() {
    var header = document.getElementById('siteHeader');
    var burger = document.getElementById('burgerBtn');
    var searchBtn = document.getElementById('searchBtn');
    var searchPanel = document.getElementById('searchPanel');
    var cartBtn = document.getElementById('cartBtn');

    if (burger) {
      burger.addEventListener('click', function () {
        var open = burger.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
        if (open) ui.openDrawer('mobileNav'); else ui.closeDrawers();
      });
    }
    if (cartBtn) cartBtn.addEventListener('click', function () { ui.openDrawer('cartDrawer'); });

    if (searchBtn && searchPanel) {
      var input = document.getElementById('searchInput');
      searchBtn.addEventListener('click', function () {
        searchPanel.classList.add('is-open');
        util.qs('.overlay', searchPanel).classList.add('is-open');
        document.body.classList.add('is-locked');
        searchBtn.setAttribute('aria-expanded', 'true');
        setTimeout(function () { input && input.focus(); }, 140);
        renderSearchPreview('');
      });
      var closeSearch = function () {
        searchPanel.classList.remove('is-open');
        util.qs('.overlay', searchPanel).classList.remove('is-open');
        searchBtn.setAttribute('aria-expanded', 'false');
        if (!util.qs('.drawer.is-open')) document.body.classList.remove('is-locked');
      };
      util.qsa('[data-close-search]', searchPanel).forEach(function (el) {
        el.addEventListener('click', closeSearch);
      });
      if (input) input.addEventListener('input', util.debounce(function () {
        renderSearchPreview(input.value);
      }, 180));
    }

    /* Sticky header: subtle shadow + hide on scroll down (mobile only). */
    var lastY = global.scrollY;
    global.addEventListener('scroll', function () {
      if (!header) return;
      var y = global.scrollY;
      header.classList.toggle('is-stuck', y > 8);
      if (global.innerWidth <= 900 && !document.body.classList.contains('is-locked')) {
        header.classList.toggle('is-hidden', y > lastY && y > 260);
      } else {
        header.classList.remove('is-hidden');
      }
      lastY = y;
    }, { passive: true });
  }

  function renderSearchPreview(query) {
    var wrap = document.getElementById('searchPreview');
    var label = document.getElementById('searchPreviewLabel');
    if (!wrap) return;
    var results = query && query.trim()
      ? VOLT.catalog.search(query).slice(0, 4)
      : VOLT.catalog.bestSellers().slice(0, 4);
    if (label) label.textContent = query && query.trim() ? 'Top matches' : 'Trending now';

    if (!results.length) {
      wrap.innerHTML = '<p class="muted small" style="grid-column:1/-1">No matches for “' +
        util.escape(query) + '”. Try a category like “hoodie” or “leggings”.</p>';
      return;
    }
    wrap.innerHTML = results.map(function (p) {
      return '<a class="mini-card" href="product.html?id=' + p.slug + '">' +
        '<div class="mini-card__img"><img src="' + VOLT.catalog.image(p) + '" alt="' +
          util.escape(p.name) + '" loading="lazy"></div>' +
        '<p class="mini-card__name">' + util.escape(p.name) + '</p>' +
        '<p class="mini-card__price">' + util.money(VOLT.catalog.currentPrice(p)) + '</p></a>';
    }).join('');
  }

  function bindGlobalDelegates() {
    document.addEventListener('click', function (e) {
      var t = e.target;

      var closer = t.closest('[data-drawer-close], [data-overlay]');
      if (closer) { ui.closeDrawers(); return; }

      var modalCloser = t.closest('[data-modal-close]');
      if (modalCloser) { ui.closeModal(); return; }

      var wish = t.closest('[data-wish]');
      if (wish) {
        e.preventDefault();
        var id = wish.getAttribute('data-wish');
        var added = VOLT.wishlist.toggle(id);
        wish.classList.toggle('is-active', added);
        wish.setAttribute('aria-pressed', String(added));
        wish.setAttribute('aria-label', (added ? 'Remove from' : 'Add to') + ' wishlist');
        var product = VOLT.catalog.byId(id);
        ui.toast(added
          ? '<b>' + util.escape(product.name) + '</b> saved to wishlist'
          : '<b>' + util.escape(product.name) + '</b> removed from wishlist',
          { icon: 'heart', action: added ? { href: 'wishlist.html', label: 'View' } : null });
        return;
      }

      var quick = t.closest('[data-quick-add]');
      if (quick) { e.preventDefault(); ui.quickAdd(quick.getAttribute('data-quick-add')); return; }

      /* Colour swatch on a card swaps the preview imagery. */
      var swatch = t.closest('[data-swatch]');
      if (swatch) {
        e.preventDefault();
        var card = swatch.closest('.card');
        var product2 = VOLT.catalog.byId(card.getAttribute('data-product'));
        var key = swatch.getAttribute('data-swatch');
        var imgs = VOLT.catalog.gallery(product2, key);
        card.setAttribute('data-color', key);
        util.qs('.card__img--main', card).src = imgs[0];
        util.qs('.card__img--hover', card).src = imgs[3];
        util.qsa('[data-swatch]', card).forEach(function (s) {
          s.classList.toggle('is-active', s === swatch);
        });
        return;
      }

      /* Mini-cart quantity + remove */
      var qtyBtn = t.closest('[data-qty]');
      if (qtyBtn) {
        var line = qtyBtn.closest('[data-line]');
        VOLT.cart.bump(line.getAttribute('data-line'), Number(qtyBtn.getAttribute('data-qty')));
        return;
      }
      var removeBtn = t.closest('[data-remove]');
      if (removeBtn) { VOLT.cart.remove(removeBtn.getAttribute('data-remove')); return; }

      /* Accordions */
      var accHead = t.closest('.accordion__head');
      if (accHead) {
        var item = accHead.closest('.accordion__item');
        var isOpen = item.classList.toggle('is-open');
        accHead.setAttribute('aria-expanded', String(isOpen));
        return;
      }

      /* Collapsible filter groups */
      var fgHead = t.closest('.filter-group__head');
      if (fgHead) {
        var group = fgHead.closest('.filter-group');
        var collapsed = group.classList.toggle('is-collapsed');
        fgHead.setAttribute('aria-expanded', String(!collapsed));
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        ui.closeDrawers();
        ui.closeModal();
        var sp = util.qs('.search-panel.is-open');
        if (sp) {
          sp.classList.remove('is-open');
          util.qs('.overlay', sp).classList.remove('is-open');
          document.body.classList.remove('is-locked');
        }
      }
      /* "/" focuses search, like a proper storefront */
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        var btn = document.getElementById('searchBtn');
        if (btn) { e.preventDefault(); btn.click(); }
      }
    });

    /* Newsletter forms (footer + homepage) */
    document.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-newsletter]');
      if (!form) return;
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var value = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
        ui.toast('Enter a valid email address', { icon: 'alert' });
        input.focus();
        return;
      }
      var subs = util.store.get('newsletter', []);
      if (subs.indexOf(value) === -1) subs.push(value);
      util.store.set('newsletter', subs);
      form.reset();
      ui.toast('You are on the list. Welcome to VOLT.', { icon: 'sparkle' });
    });
  }

  function bindReveal() {
    var nodes = util.qsa('[data-reveal]');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in global)) {
      nodes.forEach(function (n) { n.classList.add('is-revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    nodes.forEach(function (n) { io.observe(n); });
  }
  VOLT.bindReveal = bindReveal;

  function rotateAnnouncements() {
    var items = util.qsa('#announceTrack .announce__item');
    if (items.length < 2) return;
    var i = 0;
    setInterval(function () {
      items[i].classList.remove('is-active');
      i = (i + 1) % items.length;
      items[i].classList.add('is-active');
    }, 4600);
  }

  /* ------------------------------------------------------------ init --- */
  function mount() {
    var page = document.body.getAttribute('data-page') || '';
    var headerSlot = document.getElementById('site-header');
    var footerSlot = document.getElementById('site-footer');
    if (headerSlot) headerSlot.innerHTML = headerMarkup(document.body.getAttribute('data-nav') || page);
    if (footerSlot) footerSlot.innerHTML = footerMarkup();

    bindHeader();
    bindGlobalDelegates();
    rotateAnnouncements();
    updateBadges();
    renderMiniCart();
    bindReveal();

    document.addEventListener('volt:cart:change', function () {
      updateBadges();
      renderMiniCart();
    });
    document.addEventListener('volt:wishlist:change', updateBadges);

    /* Keep tabs in sync when the cart changes in another window. */
    global.addEventListener('storage', function (e) {
      if (e.key === 'volt.cart' || e.key === 'volt.wishlist') {
        VOLT.cart.reload();
        VOLT.wishlist.reload();
        updateBadges();
        renderMiniCart();
      }
    });

    document.documentElement.classList.add('is-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
}(window));
