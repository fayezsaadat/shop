/* =========================================================================
   VOLT ATHLETICS — cart-page.js
   Full-page cart: line items, quantity control, remove/undo, promo codes,
   shipping method, live order summary and a cross-sell rail.
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT;
  if (!VOLT) return;
  var util = VOLT.util, ui = VOLT.ui, cat = VOLT.catalog, icon = VOLT.icon;

  var lastRemoved = null;

  function renderRows() {
    var wrap = document.getElementById('cartRows');
    var head = document.getElementById('cartHead');
    var empty = document.getElementById('cartEmpty');
    var main = document.getElementById('cartMain');
    if (!wrap) return;

    var items = VOLT.cart.items();

    if (!items.length) {
      if (head) head.style.display = 'none';
      wrap.innerHTML = '';
      if (empty) {
        empty.hidden = false;
        empty.innerHTML = ui.emptyState('bag', 'Your cart is empty',
          'Once you add something it will show up here — and stay saved on this device.',
          { href: 'new-arrivals.html', label: 'Shop new arrivals' });
      }
      if (main) main.classList.add('is-empty');
      return;
    }

    if (empty) empty.hidden = true;
    if (head) head.style.display = '';
    if (main) main.classList.remove('is-empty');

    wrap.innerHTML = items.map(function (item) {
      var product = cat.byId(item.id);
      return '<div class="cart-row" data-row="' + item.key + '">' +
        '<div class="cart-row__product">' +
          '<a class="cart-row__img" href="product.html?id=' + item.slug + '">' +
            '<img src="' + item.image + '" alt="' + util.escape(item.name) + '" loading="lazy"></a>' +
          '<div class="cart-row__details">' +
            '<a class="cart-row__name" href="product.html?id=' + item.slug + '">' + util.escape(item.name) + '</a>' +
            '<div class="cart-row__meta">' +
              '<span>Colour: ' + util.escape(item.colorName) + '</span>' +
              '<span>Size: ' + item.size + '</span>' +
              '<span>' + util.money(item.price) + ' each' +
                (item.compareAt ? ' <s style="color:var(--gray-400)">' + util.money(item.compareAt) + '</s>' : '') +
              '</span>' +
              (product ? '<span style="color:var(--success)">' + icon('checkCircle', 13) + ' In stock</span>' : '') +
            '</div>' +
            '<button class="line-remove" type="button" data-remove-row="' + item.key + '" ' +
              'style="margin-top:10px">Remove</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-row__qty">' +
          '<div class="qty" data-line="' + item.key + '">' +
            '<button type="button" data-qty="-1" aria-label="Decrease quantity">' + icon('minus', 15) + '</button>' +
            '<input type="text" inputmode="numeric" value="' + item.qty + '" aria-label="Quantity for ' +
              util.escape(item.name) + '" data-qty-input="' + item.key + '">' +
            '<button type="button" data-qty="1" aria-label="Increase quantity">' + icon('plus', 15) + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-row__total">' + util.money(item.price * item.qty) + '</div>' +
        '<button class="cart-row__remove" type="button" data-remove-row="' + item.key + '" ' +
          'aria-label="Remove ' + util.escape(item.name) + '">' + icon('trash', 17) + '</button>' +
      '</div>';
    }).join('');
  }

  function renderSummary() {
    var wrap = document.getElementById('cartSummary');
    if (!wrap) return;
    var t = VOLT.cart.totals();
    var promo = VOLT.cart.promo();
    var remaining = VOLT.cart.freeShippingRemaining();
    var hasItems = t.count > 0;

    wrap.innerHTML =
      '<p class="panel__title">Order summary</p>' +

      (hasItems && remaining > 0
        ? '<div style="margin-bottom:18px">' +
            '<p class="small" style="margin-bottom:8px">You are ' + util.money(remaining) +
            ' away from <b>free express shipping</b></p>' +
            '<div style="height:6px;background:var(--gray-200);border-radius:3px;overflow:hidden">' +
              '<div style="height:100%;width:' + VOLT.cart.freeShippingProgress() +
              '%;background:var(--ink);border-radius:3px;transition:width .45s var(--ease)"></div></div></div>'
        : hasItems
          ? '<p class="small" style="margin-bottom:18px;color:var(--success);font-weight:600;display:flex;gap:7px;align-items:center">' +
            icon('checkCircle', 16) + ' Free express shipping unlocked</p>'
          : '') +

      '<div class="summary-row"><span>Subtotal (' + t.count + ' ' + util.plural(t.count, 'item') + ')</span>' +
        '<span>' + util.money(t.subtotal) + '</span></div>' +
      (t.savings > 0 ? '<div class="summary-row"><span>Product savings</span>' +
        '<span class="save">−' + util.money(t.savings) + '</span></div>' : '') +
      (t.promoDiscount > 0 ? '<div class="summary-row"><span>Promo ' + t.promoCode + '</span>' +
        '<span class="save">−' + util.money(t.promoDiscount) + '</span></div>' : '') +
      '<div class="summary-row"><span>Shipping</span><span>' +
        (t.shipping === 0 ? '<span class="save">Free</span>' : util.money(t.shipping)) + '</span></div>' +
      '<div class="summary-row"><span>Estimated tax</span><span>' + util.money(t.tax) + '</span></div>' +
      '<div class="summary-row summary-row--total"><span>Total</span><span>' + util.money(t.total) + '</span></div>' +

      '<form class="promo-form" id="promoForm">' +
        '<input class="input" type="text" name="code" placeholder="Promo code" aria-label="Promo code" ' +
          'value="' + (promo ? promo.code : '') + '"' + (promo ? ' readonly' : '') + '>' +
        (promo
          ? '<button class="btn btn--outline" type="button" id="promoRemove">Remove</button>'
          : '<button class="btn btn--outline" type="submit">Apply</button>') +
      '</form>' +
      '<p class="hint" id="promoMsg">' + (promo
        ? '<span style="color:var(--success)">' + promo.label + ' applied</span>'
        : 'Try <b>VOLT10</b> or <b>TRAIN20</b> for the demo') + '</p>' +

      '<label class="label" style="margin-top:20px">Delivery method</label>' +
      VOLT.cart.shippingOptions().map(function (opt) {
        var free = opt.id === 'standard' && VOLT.cart.subtotal() >= VOLT.cart.freeShippingThreshold;
        return '<label class="option-card">' +
          '<input type="radio" name="shipping" value="' + opt.id + '"' +
            (VOLT.cart.shippingMethod().id === opt.id ? ' checked' : '') + ' data-shipping>' +
          '<span class="radio"></span>' +
          '<span class="option-card__main"><span class="option-card__title">' + opt.label + '</span>' +
            '<span class="option-card__desc">' + opt.eta + '</span></span>' +
          '<span class="option-card__price">' + (free ? 'Free' : util.money(opt.price)) + '</span>' +
        '</label>';
      }).join('') +

      '<a class="btn btn--primary btn--block btn--lg" href="checkout.html" style="margin-top:20px"' +
        (hasItems ? '' : ' aria-disabled="true" tabindex="-1" onclick="return false" class="btn btn--primary btn--block btn--lg is-disabled"') +
        '>Proceed to checkout</a>' +
      '<a class="btn btn--ghost btn--block" href="new-arrivals.html" style="margin-top:8px">Continue shopping</a>' +

      '<div class="trust-row">' +
        '<span>' + icon('lock', 15) + ' Secure checkout</span>' +
        '<span>' + icon('refresh', 15) + ' 30-day returns</span>' +
      '</div>';
  }

  function renderCrossSell() {
    var wrap = document.getElementById('cartCrossSell');
    if (!wrap) return;
    var inCart = VOLT.cart.items().map(function (i) { return i.id; });
    var list = cat.bestSellers().filter(function (p) { return inCart.indexOf(p.id) === -1; }).slice(0, 4);
    wrap.innerHTML = ui.productGrid(list);
  }

  function renderAll() {
    renderRows();
    renderSummary();
    renderCrossSell();
  }

  function bind() {
    document.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('[data-remove-row]');
      if (removeBtn) {
        var key = removeBtn.getAttribute('data-remove-row');
        var line = VOLT.cart.find(key);
        if (!line) return;
        lastRemoved = Object.assign({}, line);
        var row = document.querySelector('[data-row="' + key + '"]');
        if (row) row.classList.add('is-removing');
        setTimeout(function () {
          VOLT.cart.remove(key);
          ui.toast('<b>' + util.escape(lastRemoved.name) + '</b> removed', {
            icon: 'trash',
            action: { href: '#undo', label: 'Undo' }
          });
        }, 180);
        return;
      }

      if (e.target.closest('a[href="#undo"]')) {
        e.preventDefault();
        if (lastRemoved) {
          VOLT.cart.add(lastRemoved, lastRemoved.qty);
          ui.toast('Item restored to your cart');
          lastRemoved = null;
        }
        return;
      }

      if (e.target.closest('#promoRemove')) {
        VOLT.cart.removePromo();
        ui.toast('Promo code removed', { icon: 'info' });
      }
    });

    document.addEventListener('submit', function (e) {
      var form = e.target.closest('#promoForm');
      if (!form) return;
      e.preventDefault();
      var input = form.querySelector('input[name="code"]');
      var result = VOLT.cart.applyPromo(input.value);
      var msg = document.getElementById('promoMsg');
      if (!result.ok && msg) {
        msg.innerHTML = '<span style="color:var(--danger)">' + result.message + '</span>';
        input.focus();
      } else if (result.ok) {
        ui.toast(result.message, { icon: 'sparkle' });
      }
    });

    document.addEventListener('change', function (e) {
      if (e.target.matches('[data-shipping]')) {
        VOLT.cart.setShipping(e.target.value);
      }
      var qtyInput = e.target.closest('[data-qty-input]');
      if (qtyInput) {
        VOLT.cart.setQty(qtyInput.getAttribute('data-qty-input'), qtyInput.value);
      }
    });

    document.addEventListener('volt:cart:change', renderAll);
  }

  function init() {
    if (document.body.getAttribute('data-page') !== 'cart') return;
    renderAll();
    bind();
    VOLT.bindReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}(window));
