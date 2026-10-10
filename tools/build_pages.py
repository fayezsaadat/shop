#!/usr/bin/env python3
"""
VOLT ATHLETICS - listing page builder.

The six listing pages (Men, Women, New Arrivals, Best Sellers, Sale, Search)
share one layout driven by js/shop.js, so they are generated from a single
template here to guarantee they stay identical in structure.
"""

import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0b0d">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="icon" href="images/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/responsive.css">
</head>
<body data-page="shop" data-nav="{nav}" data-shop="{source}">
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>

<main id="main">
"""

HERO = """
  <section class="page-head page-head--hero">
    <div class="page-head__glow" aria-hidden="true"></div>
    <div class="container">
      <div class="page-head__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Home</a>
          <span aria-hidden="true">/</span>
          <span>{heading}</span>
        </nav>
        <h1 class="h1" style="margin:14px 0 12px">{heading}</h1>
        <p class="lede" style="max-width:56ch">{blurb}</p>
        {extra}
      </div>
    </div>
  </section>
"""

SEARCH_HERO = """
  <section class="page-head page-head--hero">
    <div class="page-head__glow" aria-hidden="true"></div>
    <div class="container">
      <div class="page-head__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Home</a>
          <span aria-hidden="true">/</span>
          <span>Search</span>
        </nav>
        <h1 class="h1" style="margin:14px 0 18px" id="searchTitle">Search the store</h1>
        <form id="searchPageForm" role="search" style="display:flex;gap:10px;max-width:620px">
          <input class="input" type="search" name="q" placeholder="Search for hoodies, leggings, shorts…"
                 aria-label="Search products" autocomplete="off"
                 style="min-height:54px;background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.2);color:#fff">
          <button class="btn btn--accent btn--lg" type="submit">Search</button>
        </form>
        <div class="flex gap-8 wrap" style="margin-top:16px">
          <span class="small" style="color:rgba(255,255,255,.55)">Popular:</span>
          <a class="small" href="search.html?q=hoodie" style="color:#fff;text-decoration:underline;text-underline-offset:3px">hoodie</a>
          <a class="small" href="search.html?q=leggings" style="color:#fff;text-decoration:underline;text-underline-offset:3px">leggings</a>
          <a class="small" href="search.html?q=shorts" style="color:#fff;text-decoration:underline;text-underline-offset:3px">shorts</a>
          <a class="small" href="search.html?q=sports+bra" style="color:#fff;text-decoration:underline;text-underline-offset:3px">sports bra</a>
        </div>
      </div>
    </div>
  </section>
"""

BODY = """
  <div class="container">
    <div class="shop-layout">

      <!-- ------------------------------------------------ filters (desktop) -->
      <aside class="filters filters-desktop" aria-label="Product filters">
        <div class="flex between items-center" style="margin-bottom:18px">
          <h2 class="h4" style="font-size:.78rem;letter-spacing:.16em;text-transform:uppercase">Filter</h2>
        </div>
        <div id="filtersDesktop"></div>
      </aside>

      <!-- --------------------------------------------------------- results -->
      <div>
        <div class="toolbar">
          <p class="toolbar__count" id="resultCount">Loading…</p>
          <div class="toolbar__right">
            <button class="btn btn--outline btn--sm filter-toggle" type="button" id="filterToggle"
                    aria-controls="filterDrawer">
              Filter <span data-filter-count></span>
            </button>
            <label class="sr-only" for="sortSelect">Sort products</label>
            <select class="select" id="sortSelect"></select>
          </div>
        </div>

        <div class="active-filters" id="activeFilters"></div>
        <div class="product-grid" id="productGrid"></div>
        <div class="pagination" id="pagination"></div>
      </div>

    </div>
  </div>

  <!-- ---------------------------------------------------- filter drawer -->
  <aside class="drawer drawer--left" id="filterDrawer" aria-label="Filters" aria-hidden="true">
    <div class="drawer__head">
      <p class="drawer__title">Filter <span data-filter-count></span></p>
      <button class="icon-btn" data-drawer-close aria-label="Close filters">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
             stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <div class="drawer__body" id="filtersMobile"></div>
    <div class="drawer__foot" style="display:grid;gap:9px">
      <button class="btn btn--primary btn--block" type="button" id="filterApply">Show products</button>
      <button class="btn btn--ghost btn--block" type="button" id="filterReset">Clear all filters</button>
    </div>
  </aside>

  <section class="section section--gray section--tight" style="margin-top:clamp(40px,6vw,80px)">
    <div class="container">
      <div class="feature-row">
        <div class="feature"><span class="feature__icon" data-icon="truck"></span>
          <div><h4>Free express shipping</h4><p>On orders over $75, dispatched same day.</p></div></div>
        <div class="feature"><span class="feature__icon" data-icon="refresh"></span>
          <div><h4>30-day free returns</h4><p>Prepaid label in every parcel.</p></div></div>
        <div class="feature"><span class="feature__icon" data-icon="ruler"></span>
          <div><h4>True-to-size fits</h4><p>Detailed measurements on every product.</p></div></div>
        <div class="feature"><span class="feature__icon" data-icon="headset"></span>
          <div><h4>Human support</h4><p>Live chat Mon–Fri, 8am–8pm.</p></div></div>
      </div>
    </div>
  </section>

</main>

<div id="site-footer"></div>

<script src="js/products.js"></script>
<script src="js/cart.js"></script>
<script src="js/wishlist.js"></script>
<script src="js/auth.js"></script>
<script src="js/app.js"></script>
<script src="js/shop.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      el.innerHTML = VOLT.icon(el.getAttribute('data-icon'), 20);
    });
  });
</script>
</body>
</html>
"""

CATEGORY_LINKS = """
        <div class="flex gap-8 wrap" style="margin-top:22px">{links}</div>
"""


def cat_links(gender, categories):
    href = 'shop-women.html' if gender == 'women' else 'shop-men.html'
    links = ''.join(
        f'<a class="pill" href="{href}?category={c.replace(" ", "%20")}" '
        f'style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2);color:#fff">{c}</a>'
        for c in categories)
    return CATEGORY_LINKS.format(links=links)


PAGES = [
    {
        'file': 'shop-men.html', 'source': 'men', 'nav': 'men',
        'title': "Men's Collection — VOLT ATHLETICS",
        'description': "Shop men's performance training wear: tees, hoodies, shorts, joggers and jackets built for heavy training.",
        'heading': "Men's Collection",
        'blurb': 'Training essentials cut for range of motion and finished for everywhere else. '
                 'Twelve core styles, no filler.',
        'extra': cat_links('men', ['T-Shirts', 'Hoodies', 'Shorts', 'Joggers', 'Jackets', 'Tank Tops']),
    },
    {
        'file': 'shop-women.html', 'source': 'women', 'nav': 'women',
        'title': "Women's Collection — VOLT ATHLETICS",
        'description': "Shop women's performance training wear: leggings, sports bras, hoodies, tanks and shorts.",
        'heading': "Women's Collection",
        'blurb': 'Sculpting knits, squat-proof leggings and support that stays put — engineered with '
                 'our athlete roster over eighteen months.',
        'extra': cat_links('women', ['Leggings', 'Sports Bras', 'Hoodies', 'Tank Tops', 'Shorts', 'Joggers']),
    },
    {
        'file': 'new-arrivals.html', 'source': 'new', 'nav': 'new',
        'title': 'New Arrivals — VOLT ATHLETICS',
        'description': 'The latest VOLT ATHLETICS drops. New performance sportswear for men and women, just landed.',
        'heading': 'New Arrivals',
        'blurb': 'Freshly landed styles, listed newest first. Every piece wear-tested for a full '
                 'training block before it reaches this page.',
        'extra': '',
    },
    {
        'file': 'best-sellers.html', 'source': 'best', 'nav': 'best',
        'title': 'Best Sellers — VOLT ATHLETICS',
        'description': 'The most-loved VOLT ATHLETICS pieces, ranked by what athletes actually keep buying.',
        'heading': 'Best Sellers',
        'blurb': 'Ranked by what people come back for. If you only buy one thing, start here.',
        'extra': '',
    },
    {
        'file': 'sale.html', 'source': 'sale', 'nav': 'sale',
        'title': 'Sale — Up to 30% Off — VOLT ATHLETICS',
        'description': 'End of season markdowns on VOLT ATHLETICS training wear. Up to 30% off while stock lasts.',
        'heading': 'Sale',
        'blurb': 'End of season markdowns, biggest discounts first. No restocks once they are gone.',
        'extra': '',
    },
]


def main():
    for page in PAGES:
        html = (HEAD.format(**page)
                + HERO.format(heading=page['heading'], blurb=page['blurb'], extra=page['extra'])
                + BODY)
        (ROOT / page['file']).write_text(html)

    search = (HEAD.format(
        title='Search — VOLT ATHLETICS',
        description='Search the VOLT ATHLETICS store for training wear by name, category or colour.',
        nav='', source='search') + SEARCH_HERO + BODY)
    (ROOT / 'search.html').write_text(search)

    print('wrote', len(PAGES) + 1, 'listing pages')


if __name__ == '__main__':
    main()
