/* =========================================================================
   VOLT ATHLETICS — account.js
   Page controllers for the customer-facing account surfaces:
     login.html · register.html · account.html · wishlist.html
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT;
  if (!VOLT) return;
  var util = VOLT.util, ui = VOLT.ui, cat = VOLT.catalog, icon = VOLT.icon;

  /* ============================================================ login === */
  function initLogin() {
    var form = document.getElementById('loginForm');
    if (!form) return;
    var alertBox = document.getElementById('loginAlert');
    var redirect = util.param('redirect', 'account.html');

    if (VOLT.auth.isLoggedIn()) {
      alertBox.innerHTML = '<div class="alert alert--success">' + icon('checkCircle', 18) +
        '<span>You are already signed in. <a href="account.html" style="text-decoration:underline;font-weight:600">Go to your account</a></span></div>';
    }

    VOLT.validate.enhancePasswords(document);

    VOLT.validate.bindForm(form, function (data) {
      var button = form.querySelector('[type="submit"]');
      button.classList.add('is-disabled');
      button.textContent = 'Signing in…';

      setTimeout(function () {
        var result = VOLT.auth.login(data.email, data.password, data.remember);
        button.classList.remove('is-disabled');
        button.textContent = 'Sign in';
        if (!result.ok) {
          alertBox.innerHTML = '<div class="alert alert--error">' + icon('alert', 18) +
            '<span>' + result.message + '</span></div>';
          alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        ui.toast('Welcome back, ' + result.user.firstName + '.');
        global.location.href = redirect;
      }, 550);
    });

    var demoBtn = document.getElementById('useDemo');
    if (demoBtn) {
      demoBtn.addEventListener('click', function () {
        form.querySelector('[name="email"]').value = VOLT.auth.demo.email;
        form.querySelector('[name="password"]').value = VOLT.auth.demo.password;
        ui.toast('Demo credentials filled in — hit sign in.', { icon: 'info' });
      });
    }

    var forgot = document.getElementById('forgotLink');
    if (forgot) {
      forgot.addEventListener('click', function (e) {
        e.preventDefault();
        ui.openModal('forgotModal');
      });
    }

    var forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
      VOLT.validate.bindForm(forgotForm, function (data) {
        ui.closeModal('forgotModal');
        ui.toast('If ' + util.escape(data.email) + ' exists we have sent a reset link.', { icon: 'info' });
        forgotForm.reset();
      });
    }
  }

  /* ========================================================= register === */
  function initRegister() {
    var form = document.getElementById('registerForm');
    if (!form) return;
    var alertBox = document.getElementById('registerAlert');

    VOLT.validate.enhancePasswords(document);

    VOLT.validate.bindForm(form, function (data) {
      var button = form.querySelector('[type="submit"]');
      button.classList.add('is-disabled');
      button.textContent = 'Creating account…';

      setTimeout(function () {
        var result = VOLT.auth.register(data);
        button.classList.remove('is-disabled');
        button.textContent = 'Create account';
        if (!result.ok) {
          alertBox.innerHTML = '<div class="alert alert--error">' + icon('alert', 18) +
            '<span>' + result.message + ' <a href="login.html" style="text-decoration:underline;font-weight:600">Sign in instead</a></span></div>';
          if (result.field) {
            VOLT.validate.showError(form.querySelector('[name="' + result.field + '"]'), result.message);
          }
          alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        ui.toast('Account created. Welcome to VOLT, ' + result.user.firstName + '.', { icon: 'sparkle' });
        global.location.href = 'account.html';
      }, 650);
    });
  }

  /* ========================================================== account === */
  var TABS = [
    { id: 'overview',  label: 'Overview',  icon: 'grid' },
    { id: 'orders',    label: 'Orders',    icon: 'package' },
    { id: 'wishlist',  label: 'Wishlist',  icon: 'heart' },
    { id: 'addresses', label: 'Addresses', icon: 'mapPin' },
    { id: 'settings',  label: 'Settings',  icon: 'settings' }
  ];

  function seedOrders(user) {
    if (util.store.get('ordersSeeded', false)) return;
    if (VOLT.cart.orders().length) { util.store.set('ordersSeeded', true); return; }

    var picks = cat.bestSellers();
    var sample = [
      { ref: 'VA20481166', days: 6, status: 'Delivered', items: [picks[0], picks[3]] },
      { ref: 'VA20455902', days: 27, status: 'Delivered', items: [picks[1]] }
    ];
    var orders = sample.map(function (s) {
      var items = s.items.map(function (p) {
        return {
          key: p.id + '|' + p.colors[0].key + '|M', id: p.id, slug: p.slug, name: p.name,
          price: cat.currentPrice(p), compareAt: p.salePrice ? p.price : null,
          color: p.colors[0].key, colorName: p.colors[0].name, size: 'M', qty: 1,
          image: cat.image(p, p.colors[0].key)
        };
      });
      var subtotal = items.reduce(function (sum, i) { return sum + i.price; }, 0);
      return {
        reference: s.ref,
        placedAt: new Date(Date.now() - s.days * 86400000).toISOString(),
        status: s.status,
        items: items,
        totals: {
          count: items.length, subtotal: subtotal, savings: 0, discount: 0,
          shipping: 0, tax: subtotal * VOLT.cart.taxRate, total: subtotal * (1 + VOLT.cart.taxRate)
        },
        customer: {
          email: user.email, name: user.firstName + ' ' + user.lastName,
          address: '218 Harrison Street, San Francisco, CA 94105',
          paymentMethod: 'card', cardLast4: '4242'
        },
        shipping: { id: 'standard', label: 'Standard delivery', eta: '3–5 working days', price: 0 }
      };
    });
    var existing = util.store.get('orders', []);
    util.store.set('orders', existing.concat(orders));
    util.store.set('ordersSeeded', true);
  }

  function initAccount() {
    var root = document.getElementById('accountRoot');
    if (!root) return;

    var user = VOLT.auth.current();
    if (!user) { renderSignedOut(root); return; }

    seedOrders(user);

    var active = util.param('tab', 'overview');
    if (!TABS.some(function (t) { return t.id === active; })) active = 'overview';

    root.innerHTML =
      '<div class="account-layout">' +
        '<aside class="account-nav">' +
          '<div class="account-user">' +
            '<span class="account-user__avatar">' + util.initials(user.firstName, user.lastName) + '</span>' +
            '<div><p class="account-user__name">' + util.escape(user.firstName + ' ' + user.lastName) + '</p>' +
              '<p class="small muted">' + util.escape(user.email) + '</p></div>' +
          '</div>' +
          '<div class="account-nav__list">' +
            TABS.map(function (t) {
              var badge = t.id === 'wishlist' ? VOLT.wishlist.count()
                : t.id === 'orders' ? VOLT.cart.orders().length : null;
              return '<button class="account-nav__link' + (t.id === active ? ' is-active' : '') +
                '" type="button" data-tab="' + t.id + '">' + icon(t.icon, 18) + '<span>' + t.label + '</span>' +
                (badge ? '<span class="count">' + badge + '</span>' : '') + '</button>';
            }).join('') +
            '<button class="account-nav__link" type="button" id="logoutBtn">' + icon('logout', 18) +
              '<span>Sign out</span></button>' +
          '</div>' +
        '</aside>' +
        '<div id="accountPanels"></div>' +
      '</div>';

    renderPanels(user, active);
    bindAccount(user);
  }

  function renderSignedOut(root) {
    root.innerHTML =
      '<div class="panel" style="max-width:560px;margin-inline:auto;text-align:center;padding:48px 28px">' +
        icon('user', 46) +
        '<h2 class="h2" style="margin:16px 0 10px">Sign in to your account</h2>' +
        '<p class="lede" style="margin-bottom:26px">Track orders, save addresses and sync your wishlist across devices.</p>' +
        '<div class="flex gap-12" style="justify-content:center;flex-wrap:wrap">' +
          '<a class="btn btn--primary" href="login.html?redirect=account.html">Sign in</a>' +
          '<a class="btn btn--outline" href="register.html">Create account</a>' +
        '</div>' +
        '<p class="small muted" style="margin-top:22px">Demo login — <b>demo@voltathletics.com</b> / <b>Volt1234</b></p>' +
      '</div>';
  }

  function renderPanels(user, active) {
    var wrap = document.getElementById('accountPanels');
    if (!wrap) return;
    var orders = VOLT.cart.orders();

    wrap.innerHTML =
      panel('overview', active, overviewMarkup(user, orders)) +
      panel('orders', active, ordersMarkup(orders)) +
      panel('wishlist', active, wishlistMarkup()) +
      panel('addresses', active, addressesMarkup(user)) +
      panel('settings', active, settingsMarkup(user));
  }

  function panel(id, active, body) {
    return '<section class="tab-panel' + (id === active ? ' is-active' : '') +
      '" data-panel="' + id + '">' + body + '</section>';
  }

  function overviewMarkup(user, orders) {
    var spend = orders.reduce(function (sum, o) { return sum + o.totals.total; }, 0);
    var last = orders[0];
    return '<h1 class="h2" style="margin-bottom:8px">Hey ' + util.escape(user.firstName) + '</h1>' +
      '<p class="lede" style="margin-bottom:26px">Member since ' +
        new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + '.</p>' +
      '<div class="stat-grid" style="margin-bottom:26px">' +
        '<div class="stat"><p class="stat__num">' + orders.length + '</p><p class="stat__label">Orders</p></div>' +
        '<div class="stat"><p class="stat__num">' + util.money(spend).replace('.00', '') + '</p><p class="stat__label">Lifetime spend</p></div>' +
        '<div class="stat"><p class="stat__num">' + VOLT.wishlist.count() + '</p><p class="stat__label">Saved items</p></div>' +
        '<div class="stat"><p class="stat__num">' + Math.round(spend / 10) + '</p><p class="stat__label">Volt points</p></div>' +
      '</div>' +
      (last
        ? '<div class="panel"><div class="flex between items-center" style="margin-bottom:16px">' +
            '<p class="panel__title" style="margin:0">Latest order</p>' +
            '<button class="link-underline" type="button" data-tab="orders">View all</button></div>' +
            orderCard(last) + '</div>'
        : '<div class="panel">' + ui.emptyState('package', 'No orders yet',
            'When you place your first order it will show up here.',
            { href: 'new-arrivals.html', label: 'Start shopping' }) + '</div>') +
      '<div class="panel" style="margin-top:16px">' +
        '<p class="panel__title">Recommended for you</p>' +
        '<div class="product-grid product-grid--4">' +
          ui.productGrid(cat.byGender(user.gender || 'men').slice(0, 4)) + '</div>' +
      '</div>';
  }

  function ordersMarkup(orders) {
    if (!orders.length) {
      return '<h1 class="h2" style="margin-bottom:20px">Your orders</h1><div class="panel">' +
        ui.emptyState('package', 'No orders yet', 'Your order history will appear here.',
          { href: 'best-sellers.html', label: 'Shop best sellers' }) + '</div>';
    }
    return '<h1 class="h2" style="margin-bottom:20px">Your orders</h1>' +
      orders.map(orderCard).join('');
  }

  function orderCard(order) {
    var placed = new Date(order.placedAt);
    var statusColor = order.status === 'Delivered' ? 'var(--success)'
      : order.status === 'Processing' ? 'var(--ink)' : 'var(--gray-500)';
    return '<article class="order-card">' +
      '<div class="order-card__head">' +
        '<div><p class="order-card__label">Order</p><p class="order-card__value">' + order.reference + '</p></div>' +
        '<div><p class="order-card__label">Placed</p><p class="order-card__value">' +
          placed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '</p></div>' +
        '<div><p class="order-card__label">Total</p><p class="order-card__value">' +
          util.money(order.totals.total) + '</p></div>' +
        '<div><p class="order-card__label">Status</p><p class="order-card__value" style="color:' + statusColor + '">' +
          order.status + '</p></div>' +
      '</div>' +
      '<div class="order-card__body">' +
        '<div class="order-thumbs">' + order.items.slice(0, 4).map(function (i) {
          return '<img src="' + i.image + '" alt="' + util.escape(i.name) + '" loading="lazy">';
        }).join('') + '</div>' +
        '<div style="flex:1;min-width:160px"><p class="small muted">' +
          order.items.length + ' ' + util.plural(order.items.length, 'item') + ' · ' +
          util.escape(order.shipping.label) + '</p></div>' +
        '<div class="flex gap-8 wrap">' +
          '<button class="btn btn--outline btn--sm" type="button" data-track="' + order.reference + '">Track order</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-reorder="' + order.reference + '">Buy again</button>' +
        '</div>' +
      '</div></article>';
  }

  function wishlistMarkup() {
    var products = VOLT.wishlist.products();
    return '<div class="flex between items-center wrap gap-12" style="margin-bottom:20px">' +
        '<h1 class="h2">Wishlist</h1>' +
        (products.length ? '<button class="btn btn--ghost btn--sm" type="button" id="clearWishlist">Clear all</button>' : '') +
      '</div>' +
      (products.length
        ? '<div class="product-grid product-grid--3">' + ui.productGrid(products) + '</div>'
        : '<div class="panel">' + ui.emptyState('heart', 'Nothing saved yet',
            'Tap the heart on any product to keep it here for later.',
            { href: 'new-arrivals.html', label: 'Find something' }) + '</div>');
  }

  function addressesMarkup(user) {
    var list = user.addresses || [];
    return '<div class="flex between items-center wrap gap-12" style="margin-bottom:20px">' +
        '<h1 class="h2">Addresses</h1>' +
        '<button class="btn btn--outline btn--sm" type="button" id="addAddress">' + icon('plus', 15) + ' Add address</button>' +
      '</div>' +
      (list.length
        ? '<div class="address-grid">' + list.map(function (a) {
            return '<div class="address-card' + (a.default ? ' is-default' : '') + '">' +
              (a.default ? '<span class="badge badge--soft">Default</span>' : '') +
              '<p class="strong" style="margin-top:8px">' + util.escape(a.label || 'Address') + '</p>' +
              '<p>' + [a.firstName + ' ' + a.lastName, a.line1, a.line2, a.city + ', ' + a.state + ' ' + a.postcode, a.country]
                .filter(Boolean).map(util.escape).join('<br>') + '</p>' +
              '<div class="address-card__actions">' +
                (a.default ? '' : '<button type="button" data-default-address="' + a.id + '">Make default</button>') +
                '<button type="button" data-remove-address="' + a.id + '">Remove</button>' +
              '</div></div>';
          }).join('') + '</div>'
        : '<div class="panel">' + ui.emptyState('mapPin', 'No saved addresses',
            'Save an address to check out faster next time.') + '</div>') +

      '<div class="panel" id="addressFormPanel" hidden style="margin-top:18px">' +
        '<p class="panel__title">New address</p>' +
        '<form id="addressForm">' +
          '<div class="field-row">' +
            inputField('label', 'Label', 'text', '', 'Home') +
            inputField('phone', 'Phone', 'tel', 'phone', '+1 555 000 0000') +
          '</div>' +
          '<div class="field-row">' +
            inputField('firstName', 'First name', 'text', 'required|name', 'Alex') +
            inputField('lastName', 'Last name', 'text', 'required|name', 'Rivera') +
          '</div>' +
          inputField('line1', 'Address', 'text', 'required|min:4', 'Street address') +
          inputField('line2', 'Apartment, suite (optional)', 'text', '', '') +
          '<div class="field-row">' +
            inputField('city', 'City', 'text', 'required|min:2', 'San Francisco') +
            inputField('state', 'State / Region', 'text', 'required', 'CA') +
          '</div>' +
          '<div class="field-row">' +
            inputField('postcode', 'ZIP / Postal code', 'text', 'required|postcode', '94105') +
            inputField('country', 'Country', 'text', 'required', 'United States') +
          '</div>' +
          '<label class="check" style="margin-bottom:18px"><input type="checkbox" name="default" checked>' +
            '<span class="box"></span><span>Set as my default address</span></label>' +
          '<div class="flex gap-12 wrap">' +
            '<button class="btn btn--primary" type="submit">Save address</button>' +
            '<button class="btn btn--ghost" type="button" id="cancelAddress">Cancel</button>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  function settingsMarkup(user) {
    return '<h1 class="h2" style="margin-bottom:20px">Settings</h1>' +
      '<div class="panel" style="margin-bottom:16px">' +
        '<p class="panel__title">Personal details</p>' +
        '<form id="profileForm">' +
          '<div class="field-row">' +
            inputField('firstName', 'First name', 'text', 'required|name', '', user.firstName) +
            inputField('lastName', 'Last name', 'text', 'required|name', '', user.lastName) +
          '</div>' +
          '<div class="field-row">' +
            inputField('email', 'Email address', 'email', 'required|email', '', user.email) +
            inputField('phone', 'Phone', 'tel', 'phone', '', user.phone) +
          '</div>' +
          '<button class="btn btn--primary" type="submit">Save changes</button>' +
        '</form>' +
      '</div>' +
      '<div class="panel" style="margin-bottom:16px">' +
        '<p class="panel__title">Password</p>' +
        '<form id="passwordForm">' +
          '<div class="field"><label for="pw-current">Current password</label>' +
            '<div class="password-field"><input class="input" id="pw-current" name="current" type="password" ' +
            'data-rules="required" data-label="Current password" autocomplete="current-password">' +
            '<button class="password-toggle" type="button"></button></div><p class="error-text"></p></div>' +
          '<div class="field"><label for="pw-next">New password</label>' +
            '<div class="password-field"><input class="input" id="pw-next" name="next" type="password" ' +
            'data-rules="required|password" data-label="New password" autocomplete="new-password">' +
            '<button class="password-toggle" type="button"></button></div>' +
            '<div class="meter"><span></span><span></span><span></span><span></span></div>' +
            '<p class="error-text"></p></div>' +
          '<button class="btn btn--primary" type="submit">Update password</button>' +
        '</form>' +
      '</div>' +
      '<div class="panel">' +
        '<p class="panel__title">Preferences</p>' +
        '<label class="check" style="margin-bottom:14px"><input type="checkbox" id="prefNews"' +
          (user.newsletter ? ' checked' : '') + '><span class="box"></span>' +
          '<span>Email me about drops, restocks and member pricing</span></label><br>' +
        '<label class="check"><input type="checkbox" id="prefSms"><span class="box"></span>' +
          '<span>Text me delivery updates</span></label>' +
        '<hr style="margin:22px 0">' +
        '<p class="small muted" style="margin-bottom:12px">Clearing local data removes your demo cart, ' +
          'wishlist and order history from this browser.</p>' +
        '<button class="btn btn--outline btn--sm" type="button" id="clearData">Clear local demo data</button>' +
      '</div>';
  }

  function inputField(name, label, type, rules, placeholder, value) {
    var id = 'ac-' + name;
    return '<div class="field"><label for="' + id + '">' + label + '</label>' +
      '<input class="input" id="' + id + '" name="' + name + '" type="' + type + '"' +
      (rules ? ' data-rules="' + rules + '"' : '') +
      ' placeholder="' + util.escape(placeholder || '') + '" value="' + util.escape(value || '') + '">' +
      '<p class="error-text"></p></div>';
  }

  function bindAccount(user) {
    var root = document.getElementById('accountRoot');

    root.addEventListener('click', function (e) {
      var tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        var id = tabBtn.getAttribute('data-tab');
        util.qsa('[data-panel]').forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-panel') === id);
        });
        util.qsa('.account-nav__link[data-tab]').forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-tab') === id);
        });
        var url = new URL(global.location.href);
        url.searchParams.set('tab', id);
        global.history.replaceState({}, '', url);
        global.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (e.target.closest('#logoutBtn')) {
        VOLT.auth.logout();
        ui.toast('You have been signed out.');
        setTimeout(function () { global.location.href = 'index.html'; }, 600);
        return;
      }

      if (e.target.closest('#addAddress')) {
        var pnl = document.getElementById('addressFormPanel');
        pnl.hidden = false;
        pnl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (e.target.closest('#cancelAddress')) {
        document.getElementById('addressFormPanel').hidden = true;
        return;
      }

      var removeAddr = e.target.closest('[data-remove-address]');
      if (removeAddr) {
        VOLT.auth.removeAddress(removeAddr.getAttribute('data-remove-address'));
        ui.toast('Address removed', { icon: 'trash' });
        refresh();
        return;
      }
      var defAddr = e.target.closest('[data-default-address]');
      if (defAddr) {
        var id2 = defAddr.getAttribute('data-default-address');
        var current = VOLT.auth.current();
        VOLT.auth.updateProfile({
          addresses: current.addresses.map(function (a) {
            return Object.assign({}, a, { default: a.id === id2 });
          })
        });
        ui.toast('Default address updated');
        refresh();
        return;
      }

      var track = e.target.closest('[data-track]');
      if (track) {
        ui.toast('Tracking for ' + track.getAttribute('data-track') + ' opens in Phase 2.', { icon: 'truck' });
        return;
      }

      var reorder = e.target.closest('[data-reorder]');
      if (reorder) {
        var order = VOLT.cart.orders().filter(function (o) {
          return o.reference === reorder.getAttribute('data-reorder');
        })[0];
        if (order) {
          order.items.forEach(function (i) { VOLT.cart.add(i, i.qty); });
          ui.toast('Added ' + order.items.length + ' ' + util.plural(order.items.length, 'item') + ' to your cart',
            { action: { href: 'cart.html', label: 'View cart' } });
          ui.openDrawer('cartDrawer');
        }
        return;
      }

      if (e.target.closest('#clearWishlist')) {
        VOLT.wishlist.clear();
        ui.toast('Wishlist cleared', { icon: 'heart' });
        refresh();
        return;
      }

      if (e.target.closest('#clearData')) {
        ['cart', 'cartMeta', 'wishlist', 'orders', 'ordersSeeded', 'recentlyViewed', 'checkoutDraft']
          .forEach(util.store.remove);
        ui.toast('Local demo data cleared. Reloading…', { icon: 'info' });
        setTimeout(function () { global.location.reload(); }, 900);
      }
    });

    /* Address form */
    var addressForm = document.getElementById('addressForm');
    if (addressForm) {
      VOLT.validate.bindForm(addressForm, function (data) {
        VOLT.auth.saveAddress(data);
        ui.toast('Address saved', { icon: 'mapPin' });
        refresh();
      });
    }

    var profileForm = document.getElementById('profileForm');
    if (profileForm) {
      VOLT.validate.bindForm(profileForm, function (data) {
        VOLT.auth.updateProfile(data);
        ui.toast('Your details have been updated');
        refresh();
      });
    }

    var passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      VOLT.validate.enhancePasswords(passwordForm.parentElement);
      VOLT.validate.bindForm(passwordForm, function (data, form) {
        var result = VOLT.auth.changePassword(data.current, data.next);
        if (!result.ok) {
          VOLT.validate.showError(form.querySelector('[name="current"]'), result.message);
          return;
        }
        form.reset();
        util.qsa('.meter', form).forEach(function (m) { m.className = 'meter'; });
        ui.toast('Password updated');
      });
    }

    document.addEventListener('volt:wishlist:change', function () {
      var panelEl = util.qs('[data-panel="wishlist"]');
      if (panelEl) panelEl.innerHTML = wishlistMarkup();
    });

    function refresh() {
      var active = util.param('tab', 'overview');
      var fresh = VOLT.auth.current();
      if (!fresh) { renderSignedOut(root); return; }
      renderPanels(fresh, active);
      bindAccount(fresh);
    }
  }

  /* ========================================================= wishlist === */
  function initWishlist() {
    var root = document.getElementById('wishlistRoot');
    if (!root) return;

    function render() {
      var products = VOLT.wishlist.products();
      var countEl = document.getElementById('wishlistCount');
      if (countEl) {
        countEl.textContent = products.length
          ? products.length + ' saved ' + util.plural(products.length, 'item')
          : 'Nothing saved yet';
      }

      if (!products.length) {
        root.innerHTML = ui.emptyState('heart', 'Your wishlist is empty',
          'Tap the heart on any product and it will be waiting for you here.',
          { href: 'new-arrivals.html', label: 'Browse new arrivals' }) +
          '<div style="margin-top:48px"><p class="eyebrow center" style="margin-bottom:20px">Popular right now</p>' +
          '<div class="product-grid">' + ui.productGrid(cat.bestSellers().slice(0, 4)) + '</div></div>';
        return;
      }

      root.innerHTML =
        '<div class="toolbar">' +
          '<p class="toolbar__count"><b>' + products.length + '</b> saved ' + util.plural(products.length, 'item') + '</p>' +
          '<div class="toolbar__right">' +
            '<button class="btn btn--outline btn--sm" type="button" id="addAllToCart">Add all to cart</button>' +
            '<button class="btn btn--ghost btn--sm" type="button" id="clearWishlistPage">Clear wishlist</button>' +
          '</div>' +
        '</div>' +
        '<div class="product-grid">' + ui.productGrid(products) + '</div>' +
        '<div style="margin-top:64px"><div class="section-head"><div>' +
          '<p class="eyebrow">Complete the kit</p><h2 class="h2">You might also like</h2></div></div>' +
          '<div class="product-grid">' +
            ui.productGrid(cat.bestSellers().filter(function (p) { return !VOLT.wishlist.has(p.id); }).slice(0, 4)) +
          '</div></div>';
    }

    root.addEventListener('click', function (e) {
      if (e.target.closest('#clearWishlistPage')) {
        VOLT.wishlist.clear();
        ui.toast('Wishlist cleared', { icon: 'heart' });
      }
      if (e.target.closest('#addAllToCart')) {
        var products = VOLT.wishlist.products();
        products.forEach(function (p) {
          var size = (p.sizes.filter(function (s) { return s.inStock; })[0] || p.sizes[0]).size;
          VOLT.cart.add({
            id: p.id, slug: p.slug, name: p.name, price: cat.currentPrice(p),
            compareAt: p.salePrice ? p.price : null, color: p.colors[0].key,
            colorName: p.colors[0].name, size: size, qty: 1,
            image: cat.image(p, p.colors[0].key)
          });
        });
        ui.toast(products.length + ' ' + util.plural(products.length, 'item') + ' added to your cart',
          { action: { href: 'cart.html', label: 'View cart' } });
        ui.openDrawer('cartDrawer');
      }
    });

    document.addEventListener('volt:wishlist:change', render);
    render();
  }

  /* ============================================================= init === */
  function init() {
    var page = document.body.getAttribute('data-page');
    if (page === 'login') initLogin();
    if (page === 'register') initRegister();
    if (page === 'account') initAccount();
    if (page === 'wishlist') initWishlist();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}(window));
