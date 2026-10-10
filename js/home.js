/* =========================================================================
   VOLT ATHLETICS — home.js
   Homepage modules: featured categories, new arrivals, best sellers,
   promotional countdown and the collections rail.
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT;
  if (!VOLT) return;
  var util = VOLT.util, ui = VOLT.ui, cat = VOLT.catalog, icon = VOLT.icon;

  function categoryTiles() {
    var wrap = document.getElementById('categoryGrid');
    if (!wrap) return;

    var tiles = [
      { name: 'Hoodies', gender: '' },
      { name: 'Leggings', gender: '' },
      { name: 'T-Shirts', gender: '' },
      { name: 'Shorts', gender: '' },
      { name: 'Sports Bras', gender: '' },
      { name: 'Joggers', gender: '' },
      { name: 'Jackets', gender: '' },
      { name: 'Tank Tops', gender: '' }
    ];

    wrap.innerHTML = tiles.slice(0, 4).map(function (tile) { return tileMarkup(tile); }).join('');
    var wrap2 = document.getElementById('categoryGrid2');
    if (wrap2) wrap2.innerHTML = tiles.slice(4).map(function (tile) { return tileMarkup(tile); }).join('');
  }

  function tileMarkup(tile) {
    var matches = cat.all().filter(function (p) { return p.category === tile.name; });
    var hero = matches.sort(function (a, b) { return b.popularity - a.popularity; })[0];
    if (!hero) return '';
    var href = (hero.gender === 'women' ? 'shop-women.html' : 'shop-men.html') +
      '?category=' + encodeURIComponent(tile.name);
    return '<a class="cat-card" href="' + href + '" data-reveal>' +
      '<img src="' + cat.image(hero, hero.colors[0].key, 0) + '" alt="' + util.escape(tile.name) +
        '" loading="lazy" width="600" height="750">' +
      '<div class="cat-card__body">' +
        '<p class="cat-card__name">' + util.escape(tile.name) + '</p>' +
        '<p class="cat-card__count">' + matches.length + ' ' + util.plural(matches.length, 'style') + '</p>' +
        '<span class="cat-card__go">Shop now ' + icon('arrowRight', 14) + '</span>' +
      '</div></a>';
  }

  function rails() {
    var newWrap = document.getElementById('homeNew');
    if (newWrap) newWrap.innerHTML = ui.productGrid(cat.newArrivals().slice(0, 4));

    var bestWrap = document.getElementById('homeBest');
    if (bestWrap) bestWrap.innerHTML = ui.productGrid(cat.bestSellers().slice(0, 8));

    var saleWrap = document.getElementById('homeSale');
    if (saleWrap) saleWrap.innerHTML = ui.productGrid(cat.onSale().slice(0, 4));
  }

  function heroCards() {
    var wrap = document.getElementById('heroVisual');
    if (!wrap) return;
    var men = cat.byGender('men').sort(function (a, b) { return b.popularity - a.popularity; })[0];
    var women = cat.byGender('women').sort(function (a, b) { return b.popularity - a.popularity; })[0];

    wrap.innerHTML = [men, women].map(function (p, i) {
      return '<figure class="hero__card">' +
        '<a href="product.html?id=' + p.slug + '">' +
          '<img src="' + cat.image(p, p.colors[0].key, 0) + '" alt="' + util.escape(p.name) +
            '" width="600" height="750"' + (i ? ' loading="lazy"' : '') + '>' +
          '<figcaption><span>' + (i === 0 ? 'Men' : 'Women') + ' · ' + util.escape(p.category) + '</span>' +
            icon('arrowRight', 15) + '</figcaption>' +
        '</a></figure>';
    }).join('');
  }

  function collections() {
    var wrap = document.getElementById('collectionsGrid');
    if (!wrap) return;
    var picks = [
      {
        eyebrow: 'Collection 01', title: 'Cold Start', copy: 'Layers built for pre-dawn sessions and outdoor mileage.',
        href: 'shop-men.html?category=Jackets', product: cat.byId('storm-shell-windbreaker')
      },
      {
        eyebrow: 'Collection 02', title: 'Studio Line', copy: 'Second-skin knits with the stretch to go anywhere.',
        href: 'shop-women.html?category=Leggings', product: cat.byId('flux-sculpt-leggings')
      }
    ];
    wrap.innerHTML = picks.map(function (p) {
      if (!p.product) return '';
      return '<a class="split-card" href="' + p.href + '" data-reveal>' +
        '<img src="' + cat.image(p.product, p.product.colors[0].key, 3) + '" alt="' +
          util.escape(p.title) + '" loading="lazy">' +
        '<div class="split-card__body">' +
          '<p class="eyebrow" style="color:rgba(255,255,255,.65)">' + p.eyebrow + '</p>' +
          '<h3 class="h3">' + p.title + '</h3>' +
          '<p style="color:rgba(255,255,255,.76);max-width:34ch;margin-bottom:16px">' + p.copy + '</p>' +
          '<span class="link-underline">Explore ' + icon('arrowRight', 14) + '</span>' +
        '</div></a>';
    }).join('');
  }

  function promoImage() {
    var img = document.getElementById('promoImage');
    if (!img) return;
    var p = cat.onSale()[0];
    if (p) {
      img.src = cat.image(p, p.colors[0].key, 3);
      img.alt = p.name;
    }
  }

  function instaGrid() {
    var wrap = document.getElementById('instaGrid');
    if (!wrap) return;
    var picks = cat.all().sort(function (a, b) { return b.rating - a.rating; }).slice(0, 6);
    wrap.innerHTML = picks.map(function (p) {
      return '<a href="product.html?id=' + p.slug + '" aria-label="' + util.escape(p.name) + '">' +
        '<img src="' + cat.image(p, p.colors[0].key, 2) + '" alt="' + util.escape(p.name) + '" loading="lazy"></a>';
    }).join('');
  }

  /* Countdown for the promotional banner — resets every 3 days. */
  function countdown() {
    var wrap = document.getElementById('promoTimer');
    if (!wrap) return;
    var cycle = 3 * 86400000;
    var end = Math.ceil(Date.now() / cycle) * cycle;

    function tick() {
      var diff = Math.max(0, end - Date.now());
      var d = Math.floor(diff / 86400000);
      var h = Math.floor(diff / 3600000) % 24;
      var m = Math.floor(diff / 60000) % 60;
      var s = Math.floor(diff / 1000) % 60;
      wrap.innerHTML = [[d, 'Days'], [h, 'Hrs'], [m, 'Min'], [s, 'Sec']].map(function (u) {
        return '<div><strong>' + String(u[0]).padStart(2, '0') + '</strong><span>' + u[1] + '</span></div>';
      }).join('');
    }
    tick();
    setInterval(tick, 1000);
  }

  function init() {
    if (document.body.getAttribute('data-page') !== 'home') return;
    heroCards();
    categoryTiles();
    rails();
    collections();
    promoImage();
    instaGrid();
    countdown();
    VOLT.bindReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}(window));
