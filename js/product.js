/* =========================================================================
   VOLT ATHLETICS — product.js
   Product detail page: gallery, colour/size selection, quantity, add to
   cart / buy now, wishlist, size guide, information accordions, reviews,
   related products and a "recently viewed" rail.
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT;
  if (!VOLT) return;

  var util = VOLT.util, ui = VOLT.ui, cat = VOLT.catalog, icon = VOLT.icon;

  var product = null;
  var view = { color: null, image: 0, size: null, qty: 1 };

  /* ------------------------------------------------------- fake reviews -- */
  var REVIEW_NAMES = ['Jordan M.', 'Priya S.', 'Marcus L.', 'Elena K.', 'Tomás R.', 'Aisha N.',
    'Dan W.', 'Sofia B.', 'Kai T.', 'Nina H.', 'Owen P.', 'Lucia F.'];
  var REVIEW_TITLES = ['Exactly what I wanted', 'Worth every cent', 'My new go-to',
    'Great fit, great fabric', 'Better than expected', 'Buying a second one',
    'Perfect for heavy training', 'Premium feel'];
  var REVIEW_BODIES = [
    'Fit is spot on and the fabric feels genuinely premium — holds shape after a dozen washes with zero pilling.',
    'Wore this through four sessions in a week. No chafing, no stretching out, and it dries fast between workouts.',
    'Sizing is true to size. I am usually between sizes and went with the larger one; the drape is exactly right.',
    'The finish on the seams is a step above what I expected at this price. Feels built to last a couple of seasons.',
    'Ordered on a Tuesday, arrived Thursday. Packaging was minimal which I appreciate, and the colour matches the photos.',
    'Comfortable enough that I wear it outside the gym. Gets compliments most weeks.',
    'Only note: I would like a slightly longer cut, but that is personal preference. Quality is excellent.',
    'Great for lifting and conditioning both. Enough stretch for deep positions without feeling loose.'
  ];

  function hashCode(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function buildReviews(p) {
    var seed = hashCode(p.id);
    var count = Math.min(6, 3 + (seed % 4));
    var out = [];
    for (var i = 0; i < count; i++) {
      var s = seed + i * 7919;
      var stars = i === 0 ? 5 : (s % 10 < 7 ? 5 : (s % 10 < 9 ? 4 : 3));
      var date = new Date(Date.now() - ((s % 120) + i * 9) * 86400000);
      out.push({
        name: REVIEW_NAMES[s % REVIEW_NAMES.length],
        title: REVIEW_TITLES[(s >> 3) % REVIEW_TITLES.length],
        body: REVIEW_BODIES[(s >> 5) % REVIEW_BODIES.length],
        rating: stars,
        verified: s % 5 !== 0,
        size: p.sizes[(s >> 2) % p.sizes.length].size,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }
    return out;
  }

  function distribution(p, reviews) {
    var buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(function (r) { buckets[r.rating]++; });
    /* Weight up to the product's headline review count for a believable graph */
    var scale = Math.max(1, Math.round(p.reviews / Math.max(1, reviews.length)));
    Object.keys(buckets).forEach(function (k) { buckets[k] = buckets[k] * scale; });
    return buckets;
  }

  /* -------------------------------------------------------------- render */
  function renderBreadcrumb() {
    var el = document.getElementById('pdpBreadcrumb');
    if (!el) return;
    var genderHref = product.gender === 'women' ? 'shop-women.html' : 'shop-men.html';
    var genderLabel = product.gender === 'women' ? 'Women' : 'Men';
    el.innerHTML = '<a href="index.html">Home</a>' + icon('chevronRight', 13) +
      '<a href="' + genderHref + '">' + genderLabel + '</a>' + icon('chevronRight', 13) +
      '<a href="' + genderHref + '?category=' + encodeURIComponent(product.category) + '">' +
        util.escape(product.category) + '</a>' + icon('chevronRight', 13) +
      '<span class="muted">' + util.escape(product.name) + '</span>';
  }

  function renderGallery() {
    var images = cat.gallery(product, view.color);
    var main = document.getElementById('galleryMain');
    var thumbs = document.getElementById('galleryThumbs');
    var dots = document.getElementById('galleryDots');
    var off = cat.discountPct(product);
    var colorName = colorObj().name;

    if (main) {
      main.innerHTML =
        '<img id="galleryImage" src="' + images[view.image] + '" alt="' + util.escape(product.name) +
          ' in ' + util.escape(colorName) + '" width="600" height="750">' +
        '<div class="gallery__flags">' +
          (off ? '<span class="badge badge--sale">-' + off + '%</span>' : '') +
          (product.isNew ? '<span class="badge badge--new">New</span>' : '') +
          (product.bestSeller ? '<span class="badge">Best seller</span>' : '') +
        '</div>' +
        '<button class="gallery__nav gallery__nav--prev" type="button" data-slide="-1" aria-label="Previous image">' +
          icon('chevronLeft', 18) + '</button>' +
        '<button class="gallery__nav gallery__nav--next" type="button" data-slide="1" aria-label="Next image">' +
          icon('chevronRight', 18) + '</button>';
    }
    if (thumbs) {
      thumbs.innerHTML = images.map(function (src, i) {
        return '<button class="gallery__thumb' + (i === view.image ? ' is-active' : '') +
          '" type="button" data-thumb="' + i + '" aria-label="View image ' + (i + 1) + '">' +
          '<img src="' + src + '" alt="" loading="lazy"></button>';
      }).join('');
    }
    if (dots) {
      dots.innerHTML = images.map(function (_, i) {
        return '<button type="button" class="' + (i === view.image ? 'is-active' : '') +
          '" data-thumb="' + i + '" aria-label="Image ' + (i + 1) + '"></button>';
      }).join('');
    }
  }

  function colorObj() {
    return product.colors.filter(function (c) { return c.key === view.color; })[0] || product.colors[0];
  }

  function renderInfo() {
    var el = document.getElementById('pdpInfo');
    if (!el) return;
    var price = cat.currentPrice(product);
    var off = cat.discountPct(product);
    var wished = VOLT.wishlist.has(product.id);
    var reviews = buildReviews(product);

    el.innerHTML =
      '<p class="eyebrow">' + util.escape(product.category) + ' · ' +
        (product.gender === 'women' ? "Women's" : "Men's") + '</p>' +
      '<h1 class="pdp__title">' + util.escape(product.name) + '</h1>' +
      '<div class="flex items-center gap-12 wrap">' +
        ui.stars(product.rating, product.reviews) +
        '<a href="#reviews" class="small" style="text-decoration:underline;text-underline-offset:3px">Read reviews</a>' +
        '<span class="badge badge--soft">' + product.id + '</span>' +
      '</div>' +

      '<div class="pdp__price">' +
        '<span class="now">' + util.money(price) + '</span>' +
        (off ? '<s>' + util.money(product.price) + '</s>' +
          '<span class="badge badge--sale">Save ' + util.money(product.price - price) + ' (' + off + '%)</span>' : '') +
      '</div>' +
      '<p class="small muted">Or 4 interest-free payments of ' + util.money(price / 4) + '</p>' +

      '<p class="lede" style="margin-top:18px;font-size:.95rem">' + util.escape(product.tagline) + '</p>' +

      /* Colour */
      '<div class="pdp__option">' +
        '<div class="pdp__option-head"><span class="label">Colour</span>' +
          '<span class="value" id="colorLabel">' + util.escape(colorObj().name) + '</span></div>' +
        '<div class="color-options">' + product.colors.map(function (c) {
          return '<button class="color-dot color-dot--lg' + (c.key === view.color ? ' is-active' : '') +
            '" type="button" data-color="' + c.key + '" style="background:' + c.hex +
            '" title="' + util.escape(c.name) + '" aria-label="Colour: ' + util.escape(c.name) +
            '" aria-pressed="' + (c.key === view.color) + '"></button>';
        }).join('') + '</div>' +
      '</div>' +

      /* Size */
      '<div class="pdp__option">' +
        '<div class="pdp__option-head"><span class="label">Size</span>' +
          '<button class="size-guide-btn" type="button" id="sizeGuideBtn">' + icon('ruler', 15) + ' Size guide</button>' +
        '</div>' +
        '<div class="size-options">' + product.sizes.map(function (s) {
          return '<button class="size-chip' + (s.size === view.size ? ' is-active' : '') +
            (s.inStock ? '' : ' is-disabled') + '" type="button" data-size="' + s.size + '"' +
            (s.inStock ? '' : ' aria-disabled="true"') + ' aria-pressed="' + (s.size === view.size) + '">' +
            s.size + '</button>';
        }).join('') + '</div>' +
        '<p class="hint" id="sizeHint">' + (product.fit) + '</p>' +
      '</div>' +

      /* Quantity + actions */
      '<div class="pdp__option">' +
        '<span class="label">Quantity</span>' +
        '<div class="pdp__actions-row" style="margin-top:4px">' +
          '<div class="qty qty--lg" id="pdpQty">' +
            '<button type="button" data-pdp-qty="-1" aria-label="Decrease quantity">' + icon('minus', 16) + '</button>' +
            '<input type="text" inputmode="numeric" value="' + view.qty + '" aria-label="Quantity" id="pdpQtyInput">' +
            '<button type="button" data-pdp-qty="1" aria-label="Increase quantity">' + icon('plus', 16) + '</button>' +
          '</div>' +
          '<button class="btn btn--primary" type="button" id="addToCart">' + icon('bag', 17) + ' Add to cart</button>' +
          '<button class="pdp__wish' + (wished ? ' is-active' : '') + '" type="button" data-wish="' + product.id +
            '" aria-label="' + (wished ? 'Remove from' : 'Add to') + ' wishlist" aria-pressed="' + wished + '">' +
            icon('heart', 20) + '</button>' +
        '</div>' +
        '<button class="btn btn--accent btn--block" type="button" id="buyNow" style="margin-top:10px">Buy it now</button>' +
      '</div>' +

      '<ul class="usp-list">' +
        '<li>' + icon('truck', 18) + '<span>Free express shipping over $' + VOLT.cart.freeShippingThreshold + '</span></li>' +
        '<li>' + icon('refresh', 18) + '<span>Free 30-day returns — no questions asked</span></li>' +
        '<li>' + icon('shield', 18) + '<span>Two-year stitching &amp; seam guarantee</span></li>' +
      '</ul>' +

      /* Information accordions */
      '<div class="accordion" style="margin-top:26px">' +
        accordionItem('Description', '<p>' + util.escape(product.description) + '</p>' +
          '<ul>' + product.features.map(function (f) { return '<li><span>' + util.escape(f) + '</span></li>'; }).join('') + '</ul>', true) +
        accordionItem('Product information',
          '<table class="spec-table"><tbody>' +
            row('Product code', product.id) +
            row('Category', product.category) +
            row('Fabric', product.fabric) +
            row('Fit', product.fit) +
            row('Colour shown', colorObj().name) +
            row('Care', product.care) +
          '</tbody></table>') +
        accordionItem('Shipping',
          '<p>Orders placed before 6pm local time are dispatched the same working day.</p><ul>' +
          '<li><span><b>Standard</b> — 3–5 working days, ' + util.money(6.95) + ' (free over ' + util.money(75) + ')</span></li>' +
          '<li><span><b>Express</b> — 1–2 working days, ' + util.money(12.95) + '</span></li>' +
          '<li><span><b>Next day</b> — order before 6pm, ' + util.money(19.95) + '</span></li>' +
          '<li><span>Tracking is emailed the moment your parcel leaves our warehouse.</span></li></ul>') +
        accordionItem('Returns',
          '<p>Not right? Send it back within 30 days of delivery for a full refund, provided the item is unworn with tags attached.</p><ul>' +
          '<li><span>Free returns label included in every parcel</span></li>' +
          '<li><span>Refunds processed within 3 working days of arrival</span></li>' +
          '<li><span>Exchanges available on any size or colour in stock</span></li></ul>') +
      '</div>';

    renderReviews(reviews);
  }

  function row(label, value) {
    return '<tr><th>' + util.escape(label) + '</th><td>' + util.escape(value) + '</td></tr>';
  }

  function accordionItem(title, body, open) {
    return '<div class="accordion__item' + (open ? ' is-open' : '') + '">' +
      '<button class="accordion__head" type="button" aria-expanded="' + !!open + '">' +
        '<span>' + title + '</span>' + icon('plus', 17) + '</button>' +
      '<div class="accordion__body"><div class="accordion__inner">' + body + '</div></div></div>';
  }

  function renderReviews(reviews) {
    var wrap = document.getElementById('pdpReviews');
    if (!wrap) return;
    var dist = distribution(product, reviews);
    var total = Object.keys(dist).reduce(function (s, k) { return s + dist[k]; }, 0) || 1;

    wrap.innerHTML =
      '<div class="review-score">' +
        '<div><p class="review-score__num">' + product.rating.toFixed(1) + '</p>' +
        ui.stars(product.rating) +
        '<p class="small muted" style="margin-top:8px">Based on ' + product.reviews + ' reviews</p></div>' +
        '<div class="review-bars">' + [5, 4, 3, 2, 1].map(function (star) {
          var pct = Math.round((dist[star] / total) * 100);
          return '<div class="review-bar"><span>' + star + '★</span>' +
            '<span class="review-bar__track"><span class="review-bar__fill" style="width:' + pct + '%"></span></span>' +
            '<span>' + pct + '%</span></div>';
        }).join('') + '</div>' +
      '</div>' +
      '<div><div class="flex between items-center" style="margin-bottom:18px">' +
        '<h3 class="h3">What athletes say</h3>' +
        '<button class="btn btn--outline btn--sm" type="button" id="writeReview">Write a review</button></div>' +
        reviews.map(function (r) {
          return '<article class="review">' +
            '<div class="review__head">' +
              '<span class="review__avatar">' + r.name.charAt(0) + '</span>' +
              '<div><p class="review__name">' + r.name + '</p>' +
                '<p class="review__meta">' + (r.verified ? 'Verified buyer · ' : '') + 'Size ' + r.size + ' · ' + r.date + '</p></div>' +
              '<div style="margin-left:auto">' + ui.stars(r.rating) + '</div>' +
            '</div>' +
            '<p class="review__title">' + r.title + '</p>' +
            '<p>' + r.body + '</p></article>';
        }).join('') +
      '</div>';
  }

  function renderRelated() {
    var wrap = document.getElementById('relatedGrid');
    if (!wrap) return;
    wrap.innerHTML = ui.productGrid(cat.related(product, 4));
  }

  function renderRecentlyViewed() {
    var wrap = document.getElementById('recentGrid');
    var section = document.getElementById('recentSection');
    if (!wrap) return;
    var seen = util.store.get('recentlyViewed', []).filter(function (id) { return id !== product.id; });
    var list = seen.map(cat.byId).filter(Boolean).slice(0, 4);
    if (!list.length) { if (section) section.style.display = 'none'; return; }
    if (section) section.style.display = '';
    wrap.innerHTML = ui.productGrid(list);
  }

  function trackView() {
    var seen = util.store.get('recentlyViewed', []).filter(function (id) { return id !== product.id; });
    seen.unshift(product.id);
    util.store.set('recentlyViewed', seen.slice(0, 8));
  }

  /* -------------------------------------------------------------- events */
  function selectColor(key) {
    view.color = key;
    view.image = 0;
    renderGallery();
    var label = document.getElementById('colorLabel');
    if (label) label.textContent = colorObj().name;
    util.qsa('[data-color]').forEach(function (b) {
      var on = b.getAttribute('data-color') === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    var url = new URL(global.location.href);
    url.searchParams.set('color', key);
    global.history.replaceState({}, '', url);
  }

  function selectSize(size) {
    var entry = product.sizes.filter(function (s) { return s.size === size; })[0];
    if (!entry || !entry.inStock) return;
    view.size = size;
    util.qsa('[data-size]').forEach(function (b) {
      var on = b.getAttribute('data-size') === size;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    var hint = document.getElementById('sizeHint');
    if (hint) hint.textContent = product.fit;
    var addBtn = document.getElementById('addToCart');
    if (addBtn) addBtn.classList.remove('is-disabled');
  }

  function requireSize() {
    if (view.size) return true;
    var hint = document.getElementById('sizeHint');
    if (hint) {
      hint.textContent = 'Please choose a size first';
      hint.style.color = 'var(--danger)';
      hint.style.fontWeight = '600';
    }
    var options = util.qs('.size-options');
    if (options) {
      options.animate([
        { transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }
      ], { duration: 320, easing: 'ease-in-out' });
      options.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return false;
  }

  function addToCart() {
    if (!requireSize()) return false;
    VOLT.cart.add({
      id: product.id, slug: product.slug, name: product.name,
      price: cat.currentPrice(product),
      compareAt: product.salePrice ? product.price : null,
      color: view.color, colorName: colorObj().name,
      size: view.size, qty: view.qty,
      image: cat.image(product, view.color)
    });
    return true;
  }

  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target;

      var colorBtn = t.closest('[data-color]');
      if (colorBtn) { selectColor(colorBtn.getAttribute('data-color')); return; }

      var sizeBtn = t.closest('[data-size]');
      if (sizeBtn) { selectSize(sizeBtn.getAttribute('data-size')); return; }

      var thumb = t.closest('[data-thumb]');
      if (thumb) {
        view.image = Number(thumb.getAttribute('data-thumb'));
        renderGallery();
        return;
      }

      var slide = t.closest('[data-slide]');
      if (slide) {
        var total = cat.gallery(product, view.color).length;
        view.image = (view.image + Number(slide.getAttribute('data-slide')) + total) % total;
        renderGallery();
        return;
      }

      var qtyBtn = t.closest('[data-pdp-qty]');
      if (qtyBtn) {
        view.qty = Math.max(1, Math.min(99, view.qty + Number(qtyBtn.getAttribute('data-pdp-qty'))));
        document.getElementById('pdpQtyInput').value = view.qty;
        return;
      }

      if (t.closest('#addToCart')) {
        if (addToCart()) {
          ui.toast('<b>' + util.escape(product.name) + '</b> (' + view.size + ') added to cart',
            { action: { href: 'cart.html', label: 'View cart' } });
          ui.openDrawer('cartDrawer');
        }
        return;
      }

      if (t.closest('#buyNow')) {
        if (addToCart()) global.location.href = 'checkout.html';
        return;
      }

      if (t.closest('#sizeGuideBtn')) { ui.openModal('sizeGuideModal'); return; }

      if (t.closest('#writeReview')) {
        ui.toast('Reviews open once your order is delivered.', { icon: 'info' });
        return;
      }

      /* Click-to-zoom on the main image */
      var mainImg = t.closest('#galleryMain');
      if (mainImg && t.tagName === 'IMG') {
        mainImg.classList.toggle('is-zoomed');
      }
    });

    var qtyInput = document.getElementById('pdpQtyInput');
    document.addEventListener('change', function (e) {
      if (e.target.id === 'pdpQtyInput') {
        view.qty = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1));
        e.target.value = view.qty;
      }
    });

    /* Swipe the gallery on touch devices */
    var main = document.getElementById('galleryMain');
    if (main) {
      var startX = 0;
      main.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      main.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) < 45) return;
        var total = cat.gallery(product, view.color).length;
        view.image = (view.image + (dx < 0 ? 1 : -1) + total) % total;
        renderGallery();
      }, { passive: true });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (document.activeElement && document.activeElement.closest('.gallery')) {
          var total = cat.gallery(product, view.color).length;
          view.image = (view.image + (e.key === 'ArrowRight' ? 1 : -1) + total) % total;
          renderGallery();
        }
      }
    });
  }

  /* ---------------------------------------------------------------- init */
  function init() {
    if (document.body.getAttribute('data-page') !== 'product') return;

    var id = util.param('id', '');
    product = cat.byId(id) || cat.bestSellers()[0];

    if (!cat.byId(id)) {
      var notice = document.getElementById('pdpNotice');
      if (notice && id) {
        notice.innerHTML = '<div class="alert alert--info">' + icon('info', 18) +
          '<span>We could not find that product, so here is one of our best sellers instead.</span></div>';
      }
    }

    document.title = product.name + ' — VOLT ATHLETICS';
    var colorParam = util.param('color', '');
    view.color = product.colors.some(function (c) { return c.key === colorParam; })
      ? colorParam : product.colors[0].key;
    var firstInStock = product.sizes.filter(function (s) { return s.inStock; })[0];
    view.size = null;

    renderBreadcrumb();
    renderGallery();
    renderInfo();
    renderRelated();
    renderRecentlyViewed();
    trackView();
    bind();
    VOLT.bindReveal();

    /* Preselect a size only when a single option is available */
    var inStockSizes = product.sizes.filter(function (s) { return s.inStock; });
    if (inStockSizes.length === 1) selectSize(inStockSizes[0].size);
    else if (firstInStock) { /* leave unselected so the user makes a choice */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(window));
