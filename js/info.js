/* =========================================================================
   VOLT ATHLETICS — info.js
   One templated page for every supporting/help topic, driven by ?topic=.
   Keeps the footer and mobile menu free of dead links in Phase 1.
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT;
  if (!VOLT) return;
  var util = VOLT.util, icon = VOLT.icon;

  var SIZE_ROWS = [
    ['XS', '32–34"', '26–28"', '34–36"', '6'],
    ['S',  '35–37"', '29–31"', '37–39"', '8'],
    ['M',  '38–40"', '32–34"', '40–42"', '10'],
    ['L',  '41–43"', '35–37"', '43–45"', '12'],
    ['XL', '44–46"', '38–40"', '46–48"', '14'],
    ['XXL','47–49"', '41–43"', '49–51"', '16']
  ];

  function sizeTable() {
    return '<div style="overflow-x:auto"><table class="size-table"><thead><tr>' +
      '<th>Size</th><th>Chest</th><th>Waist</th><th>Hips</th><th>UK equiv.</th></tr></thead><tbody>' +
      SIZE_ROWS.map(function (r) {
        return '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td>' + r[2] +
          '</td><td>' + r[3] + '</td><td>' + r[4] + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  VOLT.sizeTable = sizeTable;

  function faqList(items) {
    return '<div class="accordion" style="margin-top:20px">' + items.map(function (item, i) {
      return '<div class="accordion__item' + (i === 0 ? ' is-open' : '') + '">' +
        '<button class="accordion__head" type="button" aria-expanded="' + (i === 0) + '">' +
        '<span>' + item[0] + '</span>' + icon('plus', 17) + '</button>' +
        '<div class="accordion__body"><div class="accordion__inner"><p>' + item[1] + '</p></div></div></div>';
    }).join('') + '</div>';
  }

  var TOPICS = {
    'about': {
      title: 'Our story',
      lede: 'VOLT ATHLETICS started in a converted warehouse gym with one idea: training kit should be as considered as the training itself.',
      body: '<p>We design every piece in-house, prototype it on real athletes, and refuse to ship anything that has not survived a full training block. That means fewer drops per year and a range that earns its place in your bag.</p>' +
        '<p>Today we make performance sportswear for lifters, runners and everyone who quietly shows up at 6am. Same standard, whatever you train for.</p>' +
        '<div class="stat-grid" style="margin-top:32px">' +
          '<div class="stat"><p class="stat__num">2019</p><p class="stat__label">Founded</p></div>' +
          '<div class="stat"><p class="stat__num">180k+</p><p class="stat__label">Athletes served</p></div>' +
          '<div class="stat"><p class="stat__num">92%</p><p class="stat__label">Recycled fibres</p></div>' +
          '<div class="stat"><p class="stat__num">4.8</p><p class="stat__label">Average rating</p></div>' +
        '</div>'
    },
    'contact': {
      title: 'Help & contact',
      lede: 'Real people, same-day replies on working days.',
      body: '<div class="feature-row" style="margin-bottom:32px">' +
          feature('headset', 'Live chat', 'Mon–Fri, 8am–8pm. Fastest way to reach us.') +
          feature('info', 'Email', 'help@voltathletics.com — we reply within 24 hours.') +
          feature('truck', 'Order help', 'Track, change or return an order from your account.') +
          feature('mapPin', 'Head office', '218 Harrison Street, San Francisco, CA 94105') +
        '</div>' +
        '<div class="panel"><p class="panel__title">Send us a message</p>' +
        '<form id="contactForm">' +
          '<div class="field-row">' +
            '<div class="field"><label for="c-name">Your name</label>' +
              '<input class="input" id="c-name" name="name" type="text" data-rules="required|name" placeholder="Alex Rivera"><p class="error-text"></p></div>' +
            '<div class="field"><label for="c-email">Email</label>' +
              '<input class="input" id="c-email" name="email" type="email" data-rules="required|email" placeholder="you@example.com"><p class="error-text"></p></div>' +
          '</div>' +
          '<div class="field"><label for="c-subject">Subject</label>' +
            '<select class="select" id="c-subject" name="subject" data-rules="required">' +
              '<option value="">Choose a topic…</option><option>Order enquiry</option>' +
              '<option>Returns &amp; exchanges</option><option>Product question</option>' +
              '<option>Something else</option></select><p class="error-text"></p></div>' +
          '<div class="field"><label for="c-message">Message</label>' +
            '<textarea class="textarea" id="c-message" name="message" data-rules="required|min:12" ' +
            'placeholder="How can we help?"></textarea><p class="error-text"></p></div>' +
          '<button class="btn btn--primary" type="submit">Send message</button>' +
        '</form></div>'
    },
    'shipping': {
      title: 'Shipping',
      lede: 'Dispatched same day on orders placed before 6pm local time.',
      body: '<div style="overflow-x:auto"><table class="size-table"><thead><tr>' +
          '<th>Method</th><th>Speed</th><th>Cost</th></tr></thead><tbody>' +
          '<tr><td><b>Standard</b></td><td>3–5 working days</td><td>$6.95 — free over $75</td></tr>' +
          '<tr><td><b>Express</b></td><td>1–2 working days</td><td>$12.95</td></tr>' +
          '<tr><td><b>Next day</b></td><td>Order before 6pm</td><td>$19.95</td></tr>' +
          '<tr><td><b>International</b></td><td>5–10 working days</td><td>From $16.95</td></tr>' +
          '</tbody></table></div>' +
        '<p style="margin-top:22px">Every parcel ships with tracking. You will get an email the moment it leaves the warehouse, plus delivery-day updates if you opt into SMS at checkout.</p>' +
        '<p>We currently ship to 16 countries. Duties and taxes for international orders are calculated at checkout so there is nothing to pay on arrival.</p>'
    },
    'returns': {
      title: 'Returns & exchanges',
      lede: 'Free 30-day returns on everything. No forms, no phone calls.',
      body: '<ol style="display:grid;gap:14px;counter-reset:step;margin:22px 0;padding:0;list-style:none">' +
          step(1, 'Start your return', 'Open the order in your account and pick the items going back.') +
          step(2, 'Print the free label', 'We email a prepaid label instantly — or use the QR code at a drop-off point.') +
          step(3, 'Send it back', 'Any carrier drop-off point. Keep the receipt until your refund lands.') +
          step(4, 'Get refunded', 'Refunds are processed within 3 working days of arrival at our warehouse.') +
        '</ol>' +
        '<p>Items must be unworn with tags attached. For hygiene reasons we cannot accept returns on underwear or opened accessories. Exchanges are free and can be made for any size or colour in stock.</p>'
    },
    'size-guide': {
      title: 'Size guide',
      lede: 'Measurements are body measurements, not garment measurements. Between sizes? Size up for a relaxed fit, down for compression.',
      body: sizeTable() +
        '<h3 class="h3" style="margin:30px 0 12px">How to measure</h3>' +
        '<ul style="display:grid;gap:10px">' +
          '<li><b>Chest</b> — around the fullest part, under the arms, tape level.</li>' +
          '<li><b>Waist</b> — around your natural waist, just above the hip bone.</li>' +
          '<li><b>Hips</b> — around the widest part of the hips and seat.</li>' +
        '</ul>' +
        '<p style="margin-top:20px">Still unsure? Live chat can pull up the exact garment spec for any style.</p>'
    },
    'faq': {
      title: 'Frequently asked questions',
      lede: 'The things people ask us most.',
      body: faqList([
        ['How long does delivery take?', 'Standard delivery is 3–5 working days and free over $75. Express is 1–2 working days, and next-day is available on orders placed before 6pm.'],
        ['Can I change or cancel my order?', 'Yes, within 60 minutes of ordering. Open the order in your account and choose Amend — after that it is already being picked.'],
        ['What is your returns policy?', 'Free returns for 30 days from delivery on unworn items with tags attached. Exchanges are free too.'],
        ['Do you ship internationally?', 'We ship to 16 countries with duties calculated at checkout, so there is nothing extra to pay on delivery.'],
        ['How do your sizes run?', 'True to size for most people. Oversized styles are cut deliberately roomy — size down if you want a closer fit.'],
        ['How should I wash my gear?', 'Cold machine wash with like colours, no fabric softener, and hang to dry. Softener clogs technical fibres and kills wicking.'],
        ['Do you restock sold-out items?', 'Core range styles restock every 4–6 weeks. Sign in and use Notify me to get an alert first.']
      ])
    },
    'sustainability': {
      title: 'Sustainability',
      lede: 'Fewer, better products — made with materials we can account for.',
      body: '<p>92% of the fibres in our current range are recycled or organic, and every mill we work with is audited annually against Fair Wear standards. Our packaging is paper-based, plastic-free and curbside recyclable.</p>' +
        '<p>We publish our factory list once a year, including facility names and audit outcomes. Perfect is not the claim — measurable improvement is.</p>' +
        '<div class="feature-row" style="margin-top:30px">' +
          feature('leaf', 'Recycled fibres', 'Post-consumer polyester and nylon across the core range.') +
          feature('package', 'Plastic-free packaging', 'Paper mailers, paper tape, no polybags.') +
          feature('refresh', 'Repair, do not replace', 'Free seam repairs for two years from purchase.') +
          feature('shield', 'Audited factories', 'Annual third-party audits at every partner mill.') +
        '</div>'
    },
    'careers': {
      title: 'Careers',
      lede: 'We hire people who train and people who do not — but everyone here cares about craft.',
      body: '<p>We are a small team split between San Francisco and Lisbon. Roles are posted here first and we always reply, even when the answer is no.</p>' +
        '<div class="panel" style="margin-top:24px"><p class="panel__title">Open roles</p>' +
        '<ul style="display:grid;gap:14px">' +
          '<li><b>Senior Apparel Designer</b> — San Francisco, full time</li>' +
          '<li><b>Front-end Engineer</b> — Remote (EU timezones)</li>' +
          '<li><b>Customer Experience Lead</b> — Lisbon, full time</li>' +
        '</ul><p class="small muted" style="margin-top:18px">Applications open in Phase 2 of this demo build.</p></div>'
    },
    'athletes': {
      title: 'The VOLT roster',
      lede: 'The people who break our samples before you ever see them.',
      body: '<p>Our roster is deliberately small: twelve athletes across strength, endurance and team sport who wear-test every prototype for a full training block before it goes near production.</p>' +
        '<p>They are paid for their time, they keep the gear, and they get a veto. More than one style has been killed at the last minute because the roster said it did not hold up.</p>'
    },
    'stores': {
      title: 'Store locator',
      lede: 'Three flagship spaces, each with a training floor you can actually use.',
      body: '<div class="address-grid" style="margin-top:24px">' +
          storeCard('San Francisco', '218 Harrison Street', 'Mon–Sat 10–8, Sun 11–6') +
          storeCard('London', '44 Redchurch Street', 'Mon–Sat 10–7, Sun 12–6') +
          storeCard('Lisbon', 'Rua da Boavista 112', 'Mon–Sat 10–8, Sun closed') +
        '</div>'
    },
    'privacy': {
      title: 'Privacy policy',
      lede: 'What we collect, why we collect it, and how to get it deleted.',
      body: policyBody([
        ['What we collect', 'Account details you give us (name, email, addresses), order history, and anonymous analytics about how the site is used.'],
        ['Why we collect it', 'To process orders, provide support, and improve the store. We do not sell personal data to third parties.'],
        ['Cookies', 'Essential cookies keep your cart and session working. Analytics cookies are optional and can be turned off at any time.'],
        ['Your rights', 'You can request a copy of your data or ask us to delete it by emailing privacy@voltathletics.com. We respond within 30 days.'],
        ['Demo notice', 'This Phase 1 build stores everything locally in your own browser. Nothing is transmitted to a server.']
      ])
    },
    'terms': {
      title: 'Terms of sale',
      lede: 'The agreement between you and VOLT ATHLETICS.',
      body: policyBody([
        ['Orders', 'An order is accepted when we email your dispatch confirmation. We may decline an order if an item is out of stock or mispriced.'],
        ['Pricing', 'Prices include applicable taxes where shown. Promotional codes cannot be combined unless stated.'],
        ['Delivery', 'Delivery estimates are estimates, not guarantees. Risk passes to you on delivery.'],
        ['Returns', 'Statutory rights are unaffected by our 30-day returns policy.'],
        ['Demo notice', 'This is a demonstration storefront. No payment is taken and no goods are shipped.']
      ])
    },
    'cookies': {
      title: 'Cookie policy',
      lede: 'Small files that keep the store working properly.',
      body: policyBody([
        ['Essential', 'Cart contents, session state and security. These cannot be switched off.'],
        ['Preferences', 'Remembering your size, country and recently viewed products.'],
        ['Analytics', 'Aggregated usage data so we know which pages need work. Optional.'],
        ['Managing cookies', 'You can clear local demo data at any time from Account → Settings.']
      ])
    },
    'accessibility': {
      title: 'Accessibility',
      lede: 'We build to WCAG 2.1 AA and treat gaps as bugs.',
      body: policyBody([
        ['Keyboard', 'Every interactive element is reachable and operable by keyboard, with a visible focus ring.'],
        ['Screen readers', 'Landmarks, labels and live regions are used throughout, including cart and wishlist updates.'],
        ['Motion', 'All animation respects prefers-reduced-motion.'],
        ['Contrast', 'Body text meets or exceeds a 4.5:1 contrast ratio.'],
        ['Found a problem?', 'Email access@voltathletics.com and we will prioritise a fix.']
      ])
    }
  };

  function feature(iconName, title, text) {
    return '<div class="feature"><span class="feature__icon">' + icon(iconName, 20) + '</span>' +
      '<div><h4>' + title + '</h4><p>' + text + '</p></div></div>';
  }

  function step(n, title, text) {
    return '<li style="display:flex;gap:14px;align-items:flex-start">' +
      '<span style="flex:none;width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;' +
      'display:grid;place-items:center;font-size:.78rem;font-weight:700">' + n + '</span>' +
      '<span><b>' + title + '</b><br><span class="muted">' + text + '</span></span></li>';
  }

  function storeCard(city, address, hours) {
    return '<div class="address-card"><p class="strong">' + city + '</p>' +
      '<p>' + address + '<br>' + hours + '</p>' +
      '<div class="address-card__actions"><button type="button" data-store="' + city + '">Get directions</button></div></div>';
  }

  function policyBody(sections) {
    return sections.map(function (s) {
      return '<h3 class="h3" style="margin:26px 0 8px">' + s[0] + '</h3><p>' + s[1] + '</p>';
    }).join('');
  }

  function init() {
    var root = document.getElementById('infoRoot');
    if (!root) return;

    var key = util.param('topic', 'faq');
    var topic = TOPICS[key] || TOPICS.faq;

    document.title = topic.title + ' — VOLT ATHLETICS';
    var crumb = document.getElementById('infoBreadcrumb');
    if (crumb) {
      crumb.innerHTML = '<a href="index.html">Home</a>' + icon('chevronRight', 13) +
        '<span class="muted">' + util.escape(topic.title) + '</span>';
    }
    var titleEl = document.getElementById('infoTitle');
    if (titleEl) titleEl.textContent = topic.title;
    var ledeEl = document.getElementById('infoLede');
    if (ledeEl) ledeEl.textContent = topic.lede;

    root.innerHTML = topic.body;

    /* Sibling topic links so nothing is a dead end */
    var nav = document.getElementById('infoNav');
    if (nav) {
      nav.innerHTML = Object.keys(TOPICS).map(function (k) {
        return '<a class="account-nav__link' + (k === key ? ' is-active' : '') +
          '" href="info.html?topic=' + k + '">' + TOPICS[k].title + '</a>';
      }).join('');
    }

    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
      VOLT.validate.bindForm(contactForm, function (data, form) {
        form.reset();
        VOLT.ui.toast('Thanks ' + util.escape(data.name.split(' ')[0]) + ' — we will reply within 24 hours.',
          { icon: 'checkCircle' });
      });
    }

    root.addEventListener('click', function (e) {
      var store = e.target.closest('[data-store]');
      if (store) VOLT.ui.toast('Maps open in Phase 2.', { icon: 'mapPin' });
    });

    VOLT.bindReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}(window));
