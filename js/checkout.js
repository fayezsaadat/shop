/* =========================================================================
   VOLT ATHLETICS — checkout.js
   Checkout UI: contact details, shipping address, delivery method, payment
   panel and a live order summary. Nothing is charged in Phase 1 — placing an
   order archives it locally and hands off to the confirmation page.
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT;
  if (!VOLT) return;
  var util = VOLT.util, ui = VOLT.ui, icon = VOLT.icon;

  var COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Ireland', 'Germany', 'France',
    'Spain', 'Italy', 'Netherlands', 'Sweden', 'Denmark', 'Australia', 'New Zealand',
    'United Arab Emirates', 'Japan', 'Singapore'];

  var STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
    'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
    'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

  /* --------------------------------------------------------- summary ---- */
  function renderSummary() {
    var wrap = document.getElementById('checkoutSummary');
    if (!wrap) return;
    var items = VOLT.cart.items();
    var t = VOLT.cart.totals();
    var promo = VOLT.cart.promo();

    wrap.innerHTML =
      '<div class="flex between items-center" style="margin-bottom:18px">' +
        '<p class="panel__title" style="margin:0">Order summary</p>' +
        '<a class="small" href="cart.html" style="text-decoration:underline;text-underline-offset:3px">Edit cart</a>' +
      '</div>' +
      '<div class="summary-items">' + items.map(function (i) {
        return '<div class="summary-item">' +
          '<div class="summary-item__img"><img src="' + i.image + '" alt="" loading="lazy">' +
            '<span class="summary-item__qty">' + i.qty + '</span></div>' +
          '<div><p class="summary-item__name">' + util.escape(i.name) + '</p>' +
            '<p class="summary-item__meta">' + util.escape(i.colorName) + ' · ' + i.size + '</p></div>' +
          '<span class="strong">' + util.money(i.price * i.qty) + '</span>' +
        '</div>';
      }).join('') + '</div>' +

      '<form class="promo-form" id="promoForm">' +
        '<input class="input" type="text" name="code" placeholder="Promo code" aria-label="Promo code"' +
          (promo ? ' value="' + promo.code + '" readonly' : '') + '>' +
        (promo ? '<button class="btn btn--outline" type="button" id="promoRemove">Remove</button>'
               : '<button class="btn btn--outline" type="submit">Apply</button>') +
      '</form>' +
      '<p class="hint" id="promoMsg">' + (promo
        ? '<span style="color:var(--success)">' + promo.label + ' applied</span>'
        : 'Demo codes: VOLT10, WELCOME15, TRAIN20, FREESHIP') + '</p>' +

      '<div style="margin-top:18px">' +
        '<div class="summary-row"><span>Subtotal</span><span>' + util.money(t.subtotal) + '</span></div>' +
        (t.savings > 0 ? '<div class="summary-row"><span>Product savings</span><span class="save">−' +
          util.money(t.savings) + '</span></div>' : '') +
        (t.promoDiscount > 0 ? '<div class="summary-row"><span>Promo ' + t.promoCode + '</span>' +
          '<span class="save">−' + util.money(t.promoDiscount) + '</span></div>' : '') +
        '<div class="summary-row"><span>Shipping (' + t.shippingMethod.label + ')</span><span>' +
          (t.shipping === 0 ? '<span class="save">Free</span>' : util.money(t.shipping)) + '</span></div>' +
        '<div class="summary-row"><span>Estimated tax</span><span>' + util.money(t.tax) + '</span></div>' +
        '<div class="summary-row summary-row--total"><span>Total</span><span>' + util.money(t.total) + '</span></div>' +
      '</div>' +

      '<div class="trust-row" style="margin-top:20px">' +
        '<span>' + icon('lock', 15) + ' SSL secured</span>' +
        '<span>' + icon('truck', 15) + ' Tracked delivery</span>' +
        '<span>' + icon('refresh', 15) + ' 30-day returns</span>' +
      '</div>';
  }

  /* ----------------------------------------------------------- form ----- */
  function renderForm() {
    var wrap = document.getElementById('checkoutForm');
    if (!wrap) return;
    var user = VOLT.auth.current();
    var saved = util.store.get('checkoutDraft', {}) || {};
    var address = (user && (user.addresses || []).filter(function (a) { return a.default; })[0]) || {};

    function val(name, fallback) {
      return util.escape(saved[name] || address[name] || fallback || '');
    }

    wrap.innerHTML =
      /* 1. Contact */
      '<section class="checkout-section">' +
        '<h2 class="checkout-section__title"><span>1</span><span>Contact information</span></h2>' +
        (user ? '' :
          '<div class="alert alert--info" style="margin-bottom:18px">' + icon('info', 18) +
          '<span>Already have an account? <a href="login.html?redirect=checkout.html" style="text-decoration:underline;font-weight:600">Sign in</a> for faster checkout.</span></div>') +
        '<div class="field-row">' +
          field('email', 'Email address', 'email', 'required|email',
            val('email', user ? user.email : ''), 'you@example.com') +
          field('phone', 'Phone number', 'tel', 'required|phone', val('phone', user ? user.phone : ''), '+1 555 000 0000') +
        '</div>' +
        '<label class="check"><input type="checkbox" name="marketing" checked><span class="box"></span>' +
          '<span>Email me with news, drops and member offers</span></label>' +
      '</section>' +

      /* 2. Shipping address */
      '<section class="checkout-section">' +
        '<h2 class="checkout-section__title"><span>2</span><span>Shipping address</span></h2>' +
        (user && (user.addresses || []).length
          ? '<div class="alert" style="margin-bottom:18px">' + icon('mapPin', 18) +
            '<span>Using your saved <b>' + util.escape(address.label || 'default') + '</b> address — edit any field below.</span></div>'
          : '') +
        '<div class="field-row">' +
          field('firstName', 'First name', 'text', 'required|name', val('firstName', user ? user.firstName : ''), 'Alex') +
          field('lastName', 'Last name', 'text', 'required|name', val('lastName', user ? user.lastName : ''), 'Rivera') +
        '</div>' +
        field('line1', 'Address', 'text', 'required|min:4', val('line1'), 'Street address') +
        field('line2', 'Apartment, suite (optional)', 'text', '', val('line2'), 'Apt, floor, unit') +
        '<div class="field-row">' +
          field('city', 'City', 'text', 'required|min:2', val('city'), 'San Francisco') +
          '<div class="field"><label for="ck-state">State / Region</label>' +
            '<select class="select" id="ck-state" name="state" data-rules="required" data-label="State">' +
              '<option value="">Select…</option>' +
              STATES.map(function (s) {
                return '<option value="' + s + '"' + (val('state') === s ? ' selected' : '') + '>' + s + '</option>';
              }).join('') +
            '</select><p class="error-text"></p></div>' +
        '</div>' +
        '<div class="field-row">' +
          field('postcode', 'ZIP / Postal code', 'text', 'required|postcode', val('postcode'), '94105') +
          '<div class="field"><label for="ck-country">Country</label>' +
            '<select class="select" id="ck-country" name="country" data-rules="required" data-label="Country">' +
              COUNTRIES.map(function (c) {
                var selected = (val('country') || 'United States') === c;
                return '<option value="' + c + '"' + (selected ? ' selected' : '') + '>' + c + '</option>';
              }).join('') +
            '</select><p class="error-text"></p></div>' +
        '</div>' +
        '<label class="check"><input type="checkbox" name="saveAddress"' + (user ? ' checked' : '') +
          '><span class="box"></span><span>Save this address to my account</span></label>' +
      '</section>' +

      /* 3. Delivery */
      '<section class="checkout-section">' +
        '<h2 class="checkout-section__title"><span>3</span><span>Delivery method</span></h2>' +
        VOLT.cart.shippingOptions().map(function (opt) {
          var free = opt.id === 'standard' && VOLT.cart.subtotal() >= VOLT.cart.freeShippingThreshold;
          return '<label class="option-card">' +
            '<input type="radio" name="shipping" value="' + opt.id + '"' +
              (VOLT.cart.shippingMethod().id === opt.id ? ' checked' : '') + ' data-shipping>' +
            '<span class="radio"></span>' +
            '<span class="option-card__main"><span class="option-card__title">' + opt.label + '</span>' +
              '<span class="option-card__desc">' + opt.eta + ' · ' + estimate(opt.id) + '</span></span>' +
            '<span class="option-card__price">' + (free ? 'Free' : util.money(opt.price)) + '</span>' +
          '</label>';
        }).join('') +
      '</section>' +

      /* 4. Payment */
      '<section class="checkout-section">' +
        '<h2 class="checkout-section__title"><span>4</span><span>Payment</span></h2>' +
        '<div class="alert alert--info" style="margin-bottom:16px">' + icon('lock', 18) +
          '<span><b>Demo only.</b> No payment is processed in Phase 1 — use any test details.</span></div>' +

        '<label class="option-card">' +
          '<input type="radio" name="payment" value="card" checked data-payment>' +
          '<span class="radio"></span>' +
          '<span class="option-card__main"><span class="option-card__title">Credit or debit card</span>' +
            '<span class="option-card__desc">Visa, Mastercard, Amex</span></span>' +
          '<span class="option-card__icons"><span>VISA</span><span>MC</span><span>AMEX</span></span>' +
        '</label>' +
        '<div id="cardFields" class="card-fields">' +
          field('cardName', 'Name on card', 'text', 'required|name', val('cardName'), 'Alex Rivera') +
          field('cardNumber', 'Card number', 'text', 'required|card', '', '4242 4242 4242 4242', 'inputmode="numeric" autocomplete="cc-number" maxlength="23"') +
          '<div class="field-row">' +
            field('cardExpiry', 'Expiry (MM/YY)', 'text', 'required|expiry', '', '12/28', 'inputmode="numeric" maxlength="5"') +
            field('cardCvc', 'Security code', 'text', 'required|cvc', '', '123', 'inputmode="numeric" maxlength="4"') +
          '</div>' +
        '</div>' +

        '<label class="option-card" style="margin-top:10px">' +
          '<input type="radio" name="payment" value="paypal" data-payment>' +
          '<span class="radio"></span>' +
          '<span class="option-card__main"><span class="option-card__title">PayPal</span>' +
            '<span class="option-card__desc">You would be redirected to approve the payment</span></span>' +
          '<span class="option-card__icons"><span>PAYPAL</span></span>' +
        '</label>' +
        '<label class="option-card">' +
          '<input type="radio" name="payment" value="applepay" data-payment>' +
          '<span class="radio"></span>' +
          '<span class="option-card__main"><span class="option-card__title">Apple Pay</span>' +
            '<span class="option-card__desc">Fast checkout with Face ID or Touch ID</span></span>' +
          '<span class="option-card__icons"><span>APPLE</span></span>' +
        '</label>' +

        '<label class="check" style="margin-top:20px"><input type="checkbox" name="terms" ' +
          'data-rules="checked" data-label="terms and conditions"><span class="box"></span>' +
          '<span>I agree to the <a href="info.html?topic=terms" style="text-decoration:underline">Terms of Sale</a> ' +
          'and <a href="info.html?topic=privacy" style="text-decoration:underline">Privacy Policy</a></span></label>' +
        '<p class="error-text" data-terms-error></p>' +

        '<button class="btn btn--primary btn--block btn--lg" type="submit" id="placeOrder" style="margin-top:22px">' +
          icon('lock', 17) + ' Place order · <span id="placeOrderTotal">' +
          util.money(VOLT.cart.totals().total) + '</span></button>' +
        '<p class="small muted center" style="margin-top:12px">' +
          'By placing this order you confirm you have read our returns policy.</p>' +
      '</section>';

    VOLT.validate.enhancePasswords(wrap);
  }

  function field(name, label, type, rules, value, placeholder, extra) {
    var id = 'ck-' + name;
    return '<div class="field">' +
      '<label for="' + id + '">' + label + '</label>' +
      '<input class="input" id="' + id + '" name="' + name + '" type="' + type + '"' +
        (rules ? ' data-rules="' + rules + '"' : '') +
        ' value="' + (value || '') + '" placeholder="' + (placeholder || '') + '"' +
        (extra ? ' ' + extra : '') + '>' +
      '<p class="error-text"></p></div>';
  }

  function estimate(methodId) {
    var days = methodId === 'nextday' ? 1 : methodId === 'express' ? 2 : 5;
    var date = new Date(Date.now() + days * 86400000);
    return 'Estimated ' + date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /* ------------------------------------------------------------ steps --- */
  function renderSteps(current) {
    var wrap = document.getElementById('checkoutSteps');
    if (!wrap) return;
    var steps = ['Cart', 'Information', 'Payment', 'Confirmation'];
    wrap.innerHTML = steps.map(function (label, i) {
      var index = i + 1;
      var cls = index < current ? 'is-done' : index === current ? 'is-active' : '';
      return '<span class="step ' + cls + '"><span class="step__num">' +
        (index < current ? VOLT.icon('check', 13) : index) + '</span><span>' + label + '</span></span>' +
        (i < steps.length - 1 ? '<span class="step__sep"></span>' : '');
    }).join('');
  }

  /* ------------------------------------------------------------- bind --- */
  function bind() {
    var form = document.getElementById('checkoutForm');
    if (!form) return;

    VOLT.validate.bindForm(form, function (data) {
      var payment = form.querySelector('[data-payment]:checked');
      data.paymentMethod = payment ? payment.value : 'card';

      var button = document.getElementById('placeOrder');
      button.classList.add('is-disabled');
      button.innerHTML = 'Processing…';

      /* Simulated network latency so the UI reads as real. */
      setTimeout(function () {
        if (data.saveAddress && VOLT.auth.isLoggedIn()) {
          VOLT.auth.saveAddress({
            label: 'Shipping', default: true, firstName: data.firstName, lastName: data.lastName,
            line1: data.line1, line2: data.line2, city: data.city, state: data.state,
            postcode: data.postcode, country: data.country, phone: data.phone
          });
        }
        util.store.remove('checkoutDraft');
        var order = VOLT.cart.placeOrder({
          email: data.email, phone: data.phone,
          name: data.firstName + ' ' + data.lastName,
          address: [data.line1, data.line2, data.city, data.state, data.postcode, data.country]
            .filter(Boolean).join(', '),
          paymentMethod: data.paymentMethod,
          cardLast4: (data.cardNumber || '').replace(/\D/g, '').slice(-4)
        });
        if (order) global.location.href = 'order-confirmation.html?ref=' + order.reference;
      }, 900);
    });

    /* Persist a draft so a refresh does not wipe the form. */
    form.addEventListener('input', util.debounce(function () {
      var data = VOLT.validate.collect(form);
      delete data.cardNumber; delete data.cardCvc; delete data.cardExpiry;
      util.store.set('checkoutDraft', data);
    }, 400));

    form.addEventListener('change', function (e) {
      if (e.target.matches('[data-shipping]')) {
        VOLT.cart.setShipping(e.target.value);
      }
      if (e.target.matches('[data-payment]')) {
        var isCard = e.target.value === 'card';
        var fields = document.getElementById('cardFields');
        fields.hidden = !isCard;
        util.qsa('input', fields).forEach(function (input) {
          input.disabled = !isCard;
          if (!isCard) VOLT.validate.clearError(input);
        });
      }
    });

    /* Card number / expiry formatting */
    form.addEventListener('input', function (e) {
      if (e.target.name === 'cardNumber') {
        var digits = e.target.value.replace(/\D/g, '').slice(0, 19);
        e.target.value = digits.replace(/(.{4})/g, '$1 ').trim();
      }
      if (e.target.name === 'cardExpiry') {
        var v = e.target.value.replace(/\D/g, '').slice(0, 4);
        e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
      }
      if (e.target.name === 'cardCvc') {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
      }
    });

    document.addEventListener('submit', function (e) {
      var promoForm = e.target.closest('#promoForm');
      if (!promoForm) return;
      e.preventDefault();
      var result = VOLT.cart.applyPromo(promoForm.querySelector('input').value);
      var msg = document.getElementById('promoMsg');
      if (!result.ok && msg) msg.innerHTML = '<span style="color:var(--danger)">' + result.message + '</span>';
      else if (result.ok) ui.toast(result.message, { icon: 'sparkle' });
    });

    document.addEventListener('click', function (e) {
      if (e.target.closest('#promoRemove')) VOLT.cart.removePromo();
    });

    document.addEventListener('volt:cart:change', function () {
      renderSummary();
      var totalEl = document.getElementById('placeOrderTotal');
      if (totalEl) totalEl.textContent = util.money(VOLT.cart.totals().total);
    });
  }

  /* ------------------------------------------------------------- init --- */
  function initCheckout() {
    if (!VOLT.cart.items().length) {
      var main = document.getElementById('checkoutMain');
      if (main) {
        main.innerHTML = '<div class="panel" style="text-align:center;padding:60px 24px">' +
          ui.emptyState('bag', 'Your cart is empty',
            'Add something to your cart before heading to checkout.',
            { href: 'best-sellers.html', label: 'Shop best sellers' }) + '</div>';
      }
      var aside = document.getElementById('checkoutAside');
      if (aside) aside.style.display = 'none';
      var layout = document.querySelector('.checkout-layout');
      if (layout) layout.classList.add('is-single');
      renderSteps(1);
      return;
    }
    renderSteps(2);
    renderForm();
    renderSummary();
    bind();
  }

  /* Order confirmation page */
  function initConfirmation() {
    var wrap = document.getElementById('confirmation');
    if (!wrap) return;
    var ref = util.param('ref', '');
    var order = (VOLT.cart.orders().filter(function (o) { return o.reference === ref; })[0]) ||
      VOLT.cart.lastOrder();
    renderSteps(4);

    if (!order) {
      wrap.innerHTML = ui.emptyState('package', 'No recent order found',
        'Once you place an order its confirmation will appear here.',
        { href: 'index.html', label: 'Back to home' });
      return;
    }

    var eta = new Date(new Date(order.placedAt).getTime() +
      (order.shipping.id === 'nextday' ? 1 : order.shipping.id === 'express' ? 2 : 5) * 86400000);

    wrap.innerHTML =
      '<div class="center" style="max-width:640px;margin-inline:auto">' +
        '<div style="width:68px;height:68px;border-radius:50%;background:var(--accent);color:var(--accent-ink);' +
          'display:grid;place-items:center;margin:0 auto 22px">' + icon('check', 32) + '</div>' +
        '<p class="eyebrow">Order ' + order.reference + '</p>' +
        '<h1 class="h1" style="margin:10px 0 14px">Thank you<br>for your order</h1>' +
        '<p class="lede">We have emailed a receipt to <b>' + util.escape(order.customer.email || 'you') +
          '</b>. Your gear is being picked and packed now.</p>' +
      '</div>' +

      '<div class="panel" style="margin-top:40px">' +
        '<div class="stat-grid" style="margin-bottom:26px">' +
          stat('Order', order.reference) +
          stat('Placed', new Date(order.placedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })) +
          stat('Delivery', order.shipping.label) +
          stat('Arrives by', eta.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })) +
        '</div>' +
        '<div class="summary-items" style="max-height:none">' + order.items.map(function (i) {
          return '<div class="summary-item">' +
            '<div class="summary-item__img"><img src="' + i.image + '" alt="" loading="lazy">' +
              '<span class="summary-item__qty">' + i.qty + '</span></div>' +
            '<div><p class="summary-item__name">' + util.escape(i.name) + '</p>' +
              '<p class="summary-item__meta">' + util.escape(i.colorName) + ' · ' + i.size + '</p></div>' +
            '<span class="strong">' + util.money(i.price * i.qty) + '</span></div>';
        }).join('') + '</div>' +
        '<div style="margin-top:20px;border-top:1px solid var(--gray-200);padding-top:16px">' +
          '<div class="summary-row"><span>Subtotal</span><span>' + util.money(order.totals.subtotal) + '</span></div>' +
          (order.totals.discount > 0 ? '<div class="summary-row"><span>Discounts</span><span class="save">−' +
            util.money(order.totals.discount) + '</span></div>' : '') +
          '<div class="summary-row"><span>Shipping</span><span>' +
            (order.totals.shipping === 0 ? 'Free' : util.money(order.totals.shipping)) + '</span></div>' +
          '<div class="summary-row"><span>Tax</span><span>' + util.money(order.totals.tax) + '</span></div>' +
          '<div class="summary-row summary-row--total"><span>Total paid</span><span>' +
            util.money(order.totals.total) + '</span></div>' +
        '</div>' +
        '<div class="field-row" style="margin-top:26px;gap:16px">' +
          '<div><p class="order-card__label">Shipping to</p><p class="order-card__value">' +
            util.escape(order.customer.name || '') + '<br><span class="muted small">' +
            util.escape(order.customer.address || '') + '</span></p></div>' +
          '<div><p class="order-card__label">Payment</p><p class="order-card__value">' +
            (order.customer.paymentMethod === 'card'
              ? 'Card ending ' + (order.customer.cardLast4 || '••••')
              : order.customer.paymentMethod === 'paypal' ? 'PayPal' : 'Apple Pay') + '</p></div>' +
        '</div>' +
      '</div>' +
      '<div class="flex gap-12 wrap" style="margin-top:24px;justify-content:center">' +
        '<a class="btn btn--primary" href="account.html?tab=orders">Track your order</a>' +
        '<a class="btn btn--outline" href="index.html">Continue shopping</a>' +
      '</div>';
  }

  function stat(label, value) {
    return '<div class="stat"><p class="stat__label" style="margin:0 0 6px">' + label + '</p>' +
      '<p class="strong">' + util.escape(String(value)) + '</p></div>';
  }

  function init() {
    var page = document.body.getAttribute('data-page');
    if (page === 'checkout') initCheckout();
    if (page === 'confirmation') initConfirmation();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}(window));
