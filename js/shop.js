/* =========================================================================
   VOLT ATHLETICS — shop.js
   One controller for every listing page: Men, Women, New Arrivals,
   Best Sellers, Sale and Search results.

   The page declares its source on <body data-shop="men|women|new|best|sale|search">.
   Filter + sort state is mirrored into the URL so any view can be shared,
   bookmarked or reloaded without losing context.
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT;
  if (!VOLT) return;

  var util = VOLT.util;
  var ui = VOLT.ui;
  var cat = VOLT.catalog;
  var icon = VOLT.icon;

  var PER_PAGE = 12;

  var SORTS = [
    { id: 'featured',   label: 'Featured' },
    { id: 'newest',     label: 'Newest first' },
    { id: 'popular',    label: 'Most popular' },
    { id: 'price-asc',  label: 'Price: low to high' },
    { id: 'price-desc', label: 'Price: high to low' },
    { id: 'rating',     label: 'Top rated' },
    { id: 'discount',   label: 'Biggest discount' }
  ];

  var state = {
    source: 'all',
    q: '',
    categories: [],
    sizes: [],
    colors: [],
    gender: '',
    min: null,
    max: null,
    onSale: false,
    inStock: false,
    sort: 'featured',
    page: 1
  };

  var bounds = { min: 0, max: 200 };

  /* ------------------------------------------------------------ source -- */
  function sourceProducts() {
    switch (state.source) {
      case 'men':    return cat.byGender('men');
      case 'women':  return cat.byGender('women');
      case 'new':    return cat.newArrivals();
      case 'best':   return cat.bestSellers();
      case 'sale':   return cat.onSale();
      case 'search': return state.q ? cat.search(state.q) : [];
      default:       return cat.all();
    }
  }

  /* ------------------------------------------------------------- state -- */
  function readUrl() {
    var p = new URLSearchParams(global.location.search);
    state.q = p.get('q') || '';
    state.categories = splitParam(p.get('category'));
    state.sizes = splitParam(p.get('size'));
    state.colors = splitParam(p.get('color'));
    state.gender = p.get('gender') || '';
    state.min = p.get('min') !== null ? Number(p.get('min')) : null;
    state.max = p.get('max') !== null ? Number(p.get('max')) : null;
    state.onSale = p.get('sale') === '1';
    state.inStock = p.get('stock') === '1';
    state.sort = p.get('sort') || (state.source === 'new' ? 'newest'
      : state.source === 'best' ? 'popular'
      : state.source === 'sale' ? 'discount' : 'featured');
    state.page = Math.max(1, Number(p.get('page')) || 1);
  }

  function splitParam(value) {
    return value ? value.split(',').filter(Boolean) : [];
  }

  function writeUrl(replace) {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.categories.length) p.set('category', state.categories.join(','));
    if (state.sizes.length) p.set('size', state.sizes.join(','));
    if (state.colors.length) p.set('color', state.colors.join(','));
    if (state.gender) p.set('gender', state.gender);
    if (state.min !== null && state.min > bounds.min) p.set('min', state.min);
    if (state.max !== null && state.max < bounds.max) p.set('max', state.max);
    if (state.onSale) p.set('sale', '1');
    if (state.inStock) p.set('stock', '1');
    if (state.sort && state.sort !== 'featured') p.set('sort', state.sort);
    if (state.page > 1) p.set('page', state.page);
    var url = global.location.pathname + (p.toString() ? '?' + p.toString() : '');
    global.history[replace ? 'replaceState' : 'pushState']({}, '', url);
  }

  /* ------------------------------------------------------------ filter -- */
  function matches(product) {
    if (state.categories.length && state.categories.indexOf(product.category) === -1) return false;
    if (state.gender && product.gender !== state.gender) return false;
    if (state.onSale && !product.salePrice) return false;

    if (state.sizes.length) {
      var hasSize = product.sizes.some(function (s) {
        return state.sizes.indexOf(s.size) > -1 && (!state.inStock ? true : s.inStock);
      });
      if (!hasSize) return false;
    }
    if (state.inStock && !product.sizes.some(function (s) { return s.inStock; })) return false;

    if (state.colors.length) {
      var hasColor = product.colors.some(function (c) { return state.colors.indexOf(c.key) > -1; });
      if (!hasColor) return false;
    }

    var price = cat.currentPrice(product);
    if (state.min !== null && price < state.min) return false;
    if (state.max !== null && price > state.max) return false;
    return true;
  }

  function sortList(list) {
    var out = list.slice();
    switch (state.sort) {
      case 'price-asc':  return out.sort(function (a, b) { return cat.currentPrice(a) - cat.currentPrice(b); });
      case 'price-desc': return out.sort(function (a, b) { return cat.currentPrice(b) - cat.currentPrice(a); });
      case 'newest':     return out.sort(function (a, b) { return a.daysOld - b.daysOld; });
      case 'popular':    return out.sort(function (a, b) { return b.popularity - a.popularity; });
      case 'rating':     return out.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });
      case 'discount':   return out.sort(function (a, b) { return cat.discountPct(b) - cat.discountPct(a); });
      default:           return out;  /* source order = curated / relevance */
    }
  }

  function results() { return sortList(sourceProducts().filter(matches)); }

  /* ------------------------------------------------------ filter panel -- */
  function facetCounts() {
    var base = sourceProducts();
    var counts = { category: {}, color: {}, size: {} };
    base.forEach(function (p) {
      counts.category[p.category] = (counts.category[p.category] || 0) + 1;
      p.colors.forEach(function (c) { counts.color[c.key] = (counts.color[c.key] || 0) + 1; });
      p.sizes.forEach(function (s) {
        if (s.inStock) counts.size[s.size] = (counts.size[s.size] || 0) + 1;
      });
    });
    return counts;
  }

  function filtersMarkup() {
    var counts = facetCounts();
    var available = sourceProducts();
    var cats = cat.categories.filter(function (c) { return counts.category[c]; });
    var colors = cat.colors().filter(function (c) { return counts.color[c.key]; });
    var showGender = ['new', 'best', 'sale', 'search', 'all'].indexOf(state.source) > -1;

    var priceMax = Math.max.apply(null, available.map(cat.currentPrice).concat([bounds.max]));

    return '' +
      group('Category', 'category',
        cats.map(function (c) {
          return '<label class="check"><input type="checkbox" data-filter="category" value="' +
            util.escape(c) + '"' + (state.categories.indexOf(c) > -1 ? ' checked' : '') +
            '><span class="box"></span><span>' + c +
            ' <span class="muted small">(' + counts.category[c] + ')</span></span></label>';
        }).join('')) +

      (showGender ? group('Department', 'gender',
        [['', 'All'], ['men', 'Men'], ['women', 'Women']].map(function (g) {
          return '<label class="check"><input type="radio" name="gender" data-filter="gender" value="' +
            g[0] + '"' + (state.gender === g[0] ? ' checked' : '') +
            '><span class="box"></span><span>' + g[1] + '</span></label>';
        }).join('')) : '') +

      group('Size', 'size',
        '<div class="size-options">' + cat.sizes.map(function (s) {
          var disabled = !counts.size[s];
          return '<button class="size-chip' + (state.sizes.indexOf(s) > -1 ? ' is-active' : '') +
            (disabled ? ' is-disabled' : '') + '" type="button" data-filter="size" value="' + s + '"' +
            (disabled ? ' disabled aria-disabled="true"' : '') + '>' + s + '</button>';
        }).join('') + '</div>') +

      group('Colour', 'color',
        '<div class="color-options">' + colors.map(function (c) {
          return '<button class="color-dot' + (state.colors.indexOf(c.key) > -1 ? ' is-active' : '') +
            '" type="button" data-filter="color" value="' + c.key + '" style="background:' + c.hex +
            '" title="' + util.escape(c.name) + '" aria-label="' + util.escape(c.name) +
            ' (' + counts.color[c.key] + ')"></button>';
        }).join('') + '</div>') +

      group('Price', 'price',
        '<div class="price-inputs">' +
          '<input class="input" type="number" inputmode="numeric" min="0" placeholder="Min" ' +
            'data-filter="min" value="' + (state.min !== null ? state.min : '') + '" aria-label="Minimum price">' +
          '<span class="muted">–</span>' +
          '<input class="input" type="number" inputmode="numeric" min="0" placeholder="Max" ' +
            'data-filter="max" value="' + (state.max !== null ? state.max : '') + '" aria-label="Maximum price">' +
        '</div>' +
        '<input class="range" type="range" min="0" max="' + Math.ceil(priceMax) + '" step="5" ' +
          'value="' + (state.max !== null ? state.max : Math.ceil(priceMax)) + '" data-filter="range" ' +
          'aria-label="Maximum price slider">' +
        '<p class="small muted" data-range-label>Up to ' +
          util.money(state.max !== null ? state.max : priceMax) + '</p>') +

      group('Availability', 'misc',
        '<label class="check"><input type="checkbox" data-filter="sale"' + (state.onSale ? ' checked' : '') +
          '><span class="box"></span><span>On sale only</span></label>' +
        '<label class="check" style="margin-top:11px"><input type="checkbox" data-filter="stock"' +
          (state.inStock ? ' checked' : '') + '><span class="box"></span><span>In stock only</span></label>');
  }

  function group(title, key, body) {
    return '<div class="filter-group" data-group="' + key + '">' +
      '<button class="filter-group__head" type="button" aria-expanded="true">' +
        '<span>' + title + '</span>' + icon('chevronDown', 15) +
      '</button>' +
      '<div class="filter-group__body">' + body + '</div></div>';
  }

  function activeChips() {
    var chips = [];
    state.categories.forEach(function (c) { chips.push(chip('category', c, c)); });
    state.sizes.forEach(function (s) { chips.push(chip('size', s, 'Size ' + s)); });
    state.colors.forEach(function (c) {
      var found = cat.colors().filter(function (x) { return x.key === c; })[0];
      chips.push(chip('color', c, found ? found.name : c));
    });
    if (state.gender) chips.push(chip('gender', state.gender, state.gender === 'men' ? 'Men' : 'Women'));
    if (state.onSale) chips.push(chip('sale', '1', 'On sale'));
    if (state.inStock) chips.push(chip('stock', '1', 'In stock'));
    if (state.min !== null || state.max !== null) {
      chips.push(chip('price', '1', util.money(state.min || 0) + ' – ' +
        util.money(state.max !== null ? state.max : bounds.max)));
    }
    if (!chips.length) return '';
    return chips.join('') +
      '<button class="pill" type="button" data-clear-all style="border-style:dashed">Clear all</button>';
  }

  function chip(type, value, label) {
    return '<span class="pill">' + util.escape(label) +
      '<button type="button" data-remove-filter="' + type + '" data-value="' + util.escape(value) +
      '" aria-label="Remove filter ' + util.escape(label) + '">' + icon('close', 13) + '</button></span>';
  }

  /* ------------------------------------------------------------ render -- */
  var els = {};

  function render(scrollTop) {
    var list = results();
    var total = list.length;
    var pages = Math.max(1, Math.ceil(total / PER_PAGE));
    if (state.page > pages) state.page = pages;
    var slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

    if (els.count) {
      els.count.innerHTML = total
        ? '<b>' + total + '</b> ' + util.plural(total, 'product') +
          (state.q ? ' for “' + util.escape(state.q) + '”' : '')
        : 'No products found' + (state.q ? ' for “' + util.escape(state.q) + '”' : '');
    }

    if (els.chips) els.chips.innerHTML = activeChips();

    if (els.grid) {
      if (!total) {
        els.grid.className = '';
        els.grid.innerHTML = emptyMarkup();
      } else {
        els.grid.className = 'product-grid';
        els.grid.innerHTML = ui.productGrid(slice);
      }
    }

    if (els.pagination) els.pagination.innerHTML = total > PER_PAGE ? paginationMarkup(pages) : '';

    if (els.sort) els.sort.value = state.sort;

    if (scrollTop && els.grid) {
      var y = els.grid.getBoundingClientRect().top + global.scrollY - 130;
      global.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  function emptyMarkup() {
    var suggestions = (state.source === 'search' ? cat.bestSellers() : sourceProducts()).slice(0, 4);
    return '<div class="empty-state">' + icon('search', 46) +
      '<h3 class="h3" style="margin-bottom:8px">Nothing matches those filters</h3>' +
      '<p>Try removing a filter or two' + (state.q ? ', or search for something broader' : '') + '.</p>' +
      '<button class="btn btn--primary" type="button" data-clear-all>Clear all filters</button>' +
      (suggestions.length ? '<div style="margin-top:44px;text-align:left">' +
        '<p class="eyebrow" style="margin-bottom:16px">You might like</p>' +
        '<div class="product-grid">' + ui.productGrid(suggestions) + '</div></div>' : '') +
      '</div>';
  }

  function paginationMarkup(pages) {
    var html = '<button type="button" data-goto-page="' + (state.page - 1) + '"' +
      (state.page === 1 ? ' disabled' : '') + ' aria-label="Previous page">' + icon('chevronLeft', 15) + '</button>';
    var list = pageNumbers(state.page, pages);
    list.forEach(function (n) {
      html += n === '…'
        ? '<span class="muted" style="padding:0 4px">…</span>'
        : '<button type="button" data-goto-page="' + n + '" class="' + (n === state.page ? 'is-active' : '') +
          '" aria-label="Page ' + n + '"' + (n === state.page ? ' aria-current="page"' : '') + '>' + n + '</button>';
    });
    html += '<button type="button" data-goto-page="' + (state.page + 1) + '"' +
      (state.page === pages ? ' disabled' : '') + ' aria-label="Next page">' + icon('chevronRight', 15) + '</button>';
    return html;
  }

  function pageNumbers(current, total) {
    var out = [];
    for (var i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - current) <= 1) out.push(i);
      else if (out[out.length - 1] !== '…') out.push('…');
    }
    return out;
  }

  function renderFilters() {
    var markup = filtersMarkup();
    if (els.filtersDesktop) els.filtersDesktop.innerHTML = markup;
    if (els.filtersMobile) els.filtersMobile.innerHTML = markup;
    updateMobileCount();
  }

  function updateMobileCount() {
    var n = state.categories.length + state.sizes.length + state.colors.length +
      (state.gender ? 1 : 0) + (state.onSale ? 1 : 0) + (state.inStock ? 1 : 0) +
      ((state.min !== null || state.max !== null) ? 1 : 0);
    util.qsa('[data-filter-count]').forEach(function (el) {
      el.textContent = n ? '(' + n + ')' : '';
    });
    var applyBtn = document.getElementById('filterApply');
    if (applyBtn) applyBtn.textContent = 'Show ' + results().length + ' products';
  }

  /* ------------------------------------------------------------ events -- */
  function toggleIn(list, value) {
    var i = list.indexOf(value);
    if (i > -1) list.splice(i, 1); else list.push(value);
  }

  function onFilterChange(e) {
    var el = e.target.closest('[data-filter]');
    if (!el) return;
    var type = el.getAttribute('data-filter');
    var value = el.value;

    switch (type) {
      case 'category': toggleIn(state.categories, value); break;
      case 'size':
        if (el.disabled) return;
        toggleIn(state.sizes, value);
        break;
      case 'color': toggleIn(state.colors, value); break;
      case 'gender': state.gender = value; break;
      case 'sale': state.onSale = el.checked; break;
      case 'stock': state.inStock = el.checked; break;
      case 'min': state.min = value === '' ? null : Math.max(0, Number(value)); break;
      case 'max': state.max = value === '' ? null : Math.max(0, Number(value)); break;
      case 'range':
        state.max = Number(value);
        var label = el.parentElement.querySelector('[data-range-label]');
        if (label) label.textContent = 'Up to ' + util.money(state.max);
        break;
      default: return;
    }
    state.page = 1;
    writeUrl(true);
    render(false);
    renderFilters();
  }

  function bind() {
    els.grid = document.getElementById('productGrid');
    els.count = document.getElementById('resultCount');
    els.chips = document.getElementById('activeFilters');
    els.pagination = document.getElementById('pagination');
    els.sort = document.getElementById('sortSelect');
    els.filtersDesktop = document.getElementById('filtersDesktop');
    els.filtersMobile = document.getElementById('filtersMobile');

    if (els.sort) {
      els.sort.innerHTML = SORTS.map(function (s) {
        return '<option value="' + s.id + '"' + (s.id === state.sort ? ' selected' : '') + '>' +
          s.label + '</option>';
      }).join('');
      els.sort.addEventListener('change', function () {
        state.sort = els.sort.value;
        state.page = 1;
        writeUrl(true);
        render(true);
      });
    }

    ['change', 'click'].forEach(function (evt) {
      document.addEventListener(evt, function (e) {
        if (evt === 'click') {
          var chipBtn = e.target.closest('[data-remove-filter]');
          if (chipBtn) {
            removeFilter(chipBtn.getAttribute('data-remove-filter'), chipBtn.getAttribute('data-value'));
            return;
          }
          if (e.target.closest('[data-clear-all]')) { clearAll(); return; }
          var pageBtn = e.target.closest('[data-goto-page]');
          if (pageBtn && !pageBtn.disabled) {
            state.page = Number(pageBtn.getAttribute('data-goto-page'));
            writeUrl(false);
            render(true);
            return;
          }
          /* size chips + colour dots are buttons, not inputs */
          if (e.target.closest('.size-chip[data-filter], .color-dot[data-filter]')) {
            onFilterChange({ target: e.target.closest('[data-filter]') });
          }
          return;
        }
        onFilterChange(e);
      });
    });

    document.addEventListener('input', function (e) {
      if (e.target.matches('[data-filter="range"]')) onFilterChange(e);
    });

    var openFilters = document.getElementById('filterToggle');
    if (openFilters) openFilters.addEventListener('click', function () { ui.openDrawer('filterDrawer'); });
    var apply = document.getElementById('filterApply');
    if (apply) apply.addEventListener('click', function () { ui.closeDrawers(); });
    var reset = document.getElementById('filterReset');
    if (reset) reset.addEventListener('click', clearAll);

    /* In-page search box (search results page) */
    var searchForm = document.getElementById('searchPageForm');
    if (searchForm) {
      searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        state.q = searchForm.querySelector('input[name="q"]').value.trim();
        state.page = 1;
        writeUrl(false);
        renderFilters();
        render(true);
        updateHeadings();
      });
    }

    global.addEventListener('popstate', function () {
      readUrl();
      renderFilters();
      render(false);
      updateHeadings();
    });
  }

  function removeFilter(type, value) {
    switch (type) {
      case 'category': state.categories = state.categories.filter(function (v) { return v !== value; }); break;
      case 'size': state.sizes = state.sizes.filter(function (v) { return v !== value; }); break;
      case 'color': state.colors = state.colors.filter(function (v) { return v !== value; }); break;
      case 'gender': state.gender = ''; break;
      case 'sale': state.onSale = false; break;
      case 'stock': state.inStock = false; break;
      case 'price': state.min = null; state.max = null; break;
    }
    state.page = 1;
    writeUrl(true);
    renderFilters();
    render(false);
  }

  function clearAll() {
    state.categories = [];
    state.sizes = [];
    state.colors = [];
    state.gender = '';
    state.onSale = false;
    state.inStock = false;
    state.min = null;
    state.max = null;
    state.page = 1;
    writeUrl(true);
    renderFilters();
    render(false);
  }

  function updateHeadings() {
    if (state.source !== 'search') return;
    var title = document.getElementById('searchTitle');
    var input = document.querySelector('#searchPageForm input[name="q"]');
    if (input) input.value = state.q;
    if (title) {
      title.textContent = state.q ? 'Results for “' + state.q + '”' : 'Search the store';
    }
    document.title = (state.q ? 'Search: ' + state.q : 'Search') + ' — VOLT ATHLETICS';
  }

  /* -------------------------------------------------------------- init -- */
  function init() {
    var source = document.body.getAttribute('data-shop');
    if (!source) return;
    state.source = source;

    var all = cat.all().map(cat.currentPrice);
    bounds.min = 0;
    bounds.max = Math.ceil(Math.max.apply(null, all) / 10) * 10;

    readUrl();
    bind();
    renderFilters();
    render(false);
    updateHeadings();

    /* Category shortcut links (e.g. "Shop hoodies" tiles) */
    util.qsa('[data-jump-category]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        state.categories = [el.getAttribute('data-jump-category')];
        state.page = 1;
        writeUrl(false);
        renderFilters();
        render(true);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(window));
