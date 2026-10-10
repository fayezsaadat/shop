# VOLT ATHLETICS — Phase 1 Front-end

A production-quality storefront UI for a premium sportswear brand, built with **HTML5,
CSS3 and vanilla JavaScript only**. No frameworks, no build step, no dependencies —
open `index.html` in a browser (or serve the folder) and it runs.

Phase 2 will connect this exact front-end to PHP + MySQL, so every data access point is
funnelled through a small number of clearly marked modules.

---

## Running it

```bash
# any static server works
python3 -m http.server 8080
# then open http://localhost:8080/index.html
```

Opening the files directly from disk works too, though a server is recommended so that
`history.pushState` (used by the filter/sort URL sync) behaves normally.

**Demo account** — `demo@voltathletics.com` / `Volt1234`
**Demo promo codes** — `VOLT10`, `WELCOME15`, `TRAIN20` (min $100), `FREESHIP`

---

## File structure

```
/index.html                 Home
/shop-men.html              Men's collection      ┐
/shop-women.html            Women's collection    │
/new-arrivals.html          New arrivals          ├ all six share js/shop.js
/best-sellers.html          Best sellers          │  and one generated layout
/sale.html                  Sale                  │
/search.html                Search results        ┘
/product.html               Product detail  (?id=slug&color=key)
/cart.html                  Shopping cart
/checkout.html              Checkout
/order-confirmation.html    Order confirmation (?ref=…)
/login.html                 Sign in
/register.html              Create account
/account.html               Customer account (?tab=overview|orders|wishlist|addresses|settings)
/wishlist.html              Wishlist
/info.html                  Help / policy pages (?topic=…) — 13 topics

/css/style.css              Design system + all components
/css/responsive.css         Every breakpoint, touch and safe-area rule

/js/products.js             Catalogue data + query API   ← Phase 2 swap point
/js/cart.js                 Cart state, pricing, promos, orders
/js/wishlist.js             Saved items
/js/auth.js                 Form validation engine + demo session handling
/js/app.js                  Shared shell: header, footer, drawers, toasts, product card
/js/home.js                 Homepage modules
/js/shop.js                 Listing pages: filters, sort, pagination, search
/js/product.js              Product detail page
/js/cart-page.js            Cart page
/js/checkout.js             Checkout + order confirmation
/js/account.js              Login, register, account, wishlist pages
/js/info.js                 Help/policy content

/images/products/*.svg      296 placeholder product images (4 views × every colourway)
/images/favicon.svg

/tools/                     Generators used to author the demo data + assets
  build_catalog.py            → tools/catalog.json and js/products.js
  gen_images.py               → images/products/*.svg
  build_pages.py              → the six listing pages from one template
```

### Why the header and footer are injected by JavaScript

`app.js` renders the header, nav, search overlay, mobile menu, mini-cart drawer and footer
from a single template into `<div id="site-header">` / `<div id="site-footer">` on every
page. That keeps 15 pages from drifting apart, and it maps one-to-one onto the PHP
`include 'partials/header.php'` you will use in Phase 2 — the markup can be lifted across
verbatim.

---

## What is implemented

### Storefront
- Sticky header that lifts on scroll and auto-hides on mobile scroll-down
- Rotating announcement bar, logo, Men / Women / New Arrivals / Best Sellers / Sale
- Full-screen search overlay with live product preview (also `/` keyboard shortcut)
- Account, wishlist and cart icons with animated live counters
- Slide-out mini cart with quantity control and free-shipping progress bar
- Hero (**TRAIN HARD. LOOK BETTER.** + Shop Men / Shop Women), marquee, featured
  categories, new arrivals, promotional banner with live countdown, best sellers,
  collections, feature strip, social grid, newsletter, four-column footer

### Product listing (all six listing pages)
- Card: image with hover swap, name, category, price, sale price, discount badge,
  rating + review count, colour swatches that re-image the card, wishlist toggle, quick add
- Filters: category, department, size, colour, price (inputs + slider), on-sale, in-stock
- Sort: featured, newest, popularity, price ↑, price ↓, rating, biggest discount
- Facet counts, active-filter chips, clear-all, pagination, empty state with suggestions
- All state is mirrored into the URL, so any filtered view is shareable and survives reload
- Mobile: filter drawer with a live "Show N products" button

### Product detail
- Gallery with thumbnails, arrows, dots, swipe, keyboard arrows and click-to-zoom
- Colour selection (re-images the gallery and updates the URL), size selection with
  out-of-stock states, quantity, Add to cart, Buy now, wishlist, size-guide modal
- Rating, review distribution graph and individual reviews
- Accordions: description, product information, shipping, returns
- Related products and a recently-viewed rail

### Cart / checkout
- Add, remove (with undo), increase/decrease quantity, persistent across reloads and tabs
- Subtotal, product savings, promo discount, shipping, estimated tax, total
- Promo codes, delivery method selection, free-shipping threshold logic
- Checkout: contact, shipping address, delivery method, payment UI (card / PayPal /
  Apple Pay), live order summary, place order → confirmation page with order reference
- Card number, expiry and CVC formatting; Luhn check on the card number
- **No payment is processed.** Placing an order archives it to `localStorage` so the
  account page has real order history to show.

### Accounts
- Login (email, password, remember me, forgot-password modal), register (first name,
  last name, email, password, confirm password, terms) — all validated client-side
- Account UI: overview with stats, orders with reorder, wishlist, addresses (add / remove /
  set default), settings (profile, password change, preferences, clear demo data)
- Wishlist page with add-all-to-cart and recommendations

### Responsive
Verified at 1440 / 1280 / 1080 / 900 / 820 / 768 / 560 / 390 / 380 px.
Mobile gets a hamburger drawer, a 2-column product grid, the filter drawer, 44px+ touch
targets, a stacked cart, a single-column checkout and a swipeable gallery.

### Accessibility
Skip link, landmarks, labelled controls, `aria-expanded` / `aria-pressed` / `aria-hidden`
maintained in JS, visible focus rings, Escape closes every overlay, live region for toasts,
and full `prefers-reduced-motion` support.

---

## Phase 2 notes (PHP + MySQL)

| Replace | With |
|---|---|
| `PRODUCTS` array in `js/products.js` | `fetch('/api/products.php')` — keep the `VOLT.catalog.*` API identical |
| `js/cart.js` localStorage read/write | `POST /api/cart.php` (the public methods can stay unchanged) |
| `js/auth.js` demo sessions | PHP sessions + `password_hash()` / `password_verify()` |
| `VOLT.cart.placeOrder()` | `POST /api/orders.php`, then redirect to `order-confirmation.php?ref=` |
| Header/footer template in `app.js` | `partials/header.php` / `partials/footer.php` |
| `images/products/*.svg` | Real photography; only `product.images` needs to change |

Passwords in Phase 1 are stored with a deliberately simple non-cryptographic digest in
`localStorage` purely so the demo can distinguish a right password from a wrong one. It is
marked as such in `js/auth.js` and must not survive into Phase 2.

### Regenerating the demo assets

```bash
python3 tools/build_catalog.py   # rebuilds tools/catalog.json + js/products.js
python3 tools/gen_images.py      # rebuilds images/products/*.svg
python3 tools/build_pages.py     # rebuilds the six listing pages
```
