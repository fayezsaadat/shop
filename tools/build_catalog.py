#!/usr/bin/env python3
"""
VOLT ATHLETICS - catalog builder.

Defines the Phase 1 demo catalogue in one place and emits:
  tools/catalog.json   (used by the image generator)
  js/products.js       (used by the front-end)
"""

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]

SWATCH = {
    "black": "#17181b", "graphite": "#4a4d55", "slate": "#5d6b7a", "stone": "#c8c2b8",
    "sand": "#d9cbb6", "white": "#f2f2f3", "volt": "#d8ff3c", "navy": "#243044",
    "olive": "#5f6a4a", "burgundy": "#5e2733", "rose": "#d9a9a4", "mocha": "#8a6f5e",
    "ice": "#cdd8de", "teal": "#2b5c58", "lilac": "#b6aecb", "crimson": "#8f2231",
}

LABEL = {
    "black": "Black", "graphite": "Graphite", "slate": "Slate Blue", "stone": "Stone",
    "sand": "Desert Sand", "white": "Off White", "volt": "Volt", "navy": "Midnight Navy",
    "olive": "Olive", "burgundy": "Burgundy", "rose": "Dusty Rose", "mocha": "Mocha",
    "ice": "Ice Grey", "teal": "Deep Teal", "lilac": "Lilac", "crimson": "Crimson",
}

APPAREL = ["XS", "S", "M", "L", "XL", "XXL"]

# name, garment, category, gender, price, sale, rating, reviews, popularity, days_old,
# colors, sold_out_sizes, tagline
P = [
    ("Apex Performance Tee", "tshirt", "T-Shirts", "men", 42, 32, 4.8, 412, 96, 34,
     ["black", "graphite", "volt", "white"], ["XS"],
     "A featherweight training tee engineered for high-output sessions."),
    ("Vertex Oversized Hoodie", "hoodie", "Hoodies", "men", 88, None, 4.9, 286, 92, 12,
     ["black", "stone", "navy"], ["XXL"],
     "Relaxed, heavyweight and built to be lived in on and off the gym floor."),
    ("Drift 7\" Training Shorts", "shorts", "Shorts", "men", 46, 34, 4.6, 198, 81, 58,
     ["black", "olive", "slate"], [],
     "Four-way stretch shorts with a locked-in liner for unrestricted movement."),
    ("Momentum Tapered Joggers", "joggers", "Joggers", "men", 72, None, 4.7, 233, 88, 21,
     ["black", "graphite", "sand"], ["XS"],
     "A tapered jogger cut close through the leg with a clean, tailored drape."),
    ("Kinetic Seamless Tee", "tshirt", "T-Shirts", "men", 48, None, 4.5, 141, 66, 8,
     ["navy", "volt", "black"], [],
     "Knitted in one piece with zoned ventilation exactly where you heat up."),
    ("Storm Shell Windbreaker", "jacket", "Jackets", "men", 118, 89, 4.7, 176, 74, 46,
     ["black", "olive", "ice"], ["XS", "XXL"],
     "A packable water-repellent shell for cold starts and wet finishes."),
    ("Baseline Training Tank", "tank", "Tank Tops", "men", 34, None, 4.4, 122, 58, 74,
     ["black", "white", "graphite"], [],
     "A dropped-armhole tank that stays out of the way when the bar comes down."),
    ("Forge Heavyweight Hoodie", "hoodie", "Hoodies", "men", 96, None, 4.9, 351, 95, 65,
     ["graphite", "black", "burgundy"], ["S"],
     "480gsm brushed-back fleece with a structured hood that holds its shape."),
    ("Pulse 5\" Running Shorts", "shorts", "Shorts", "men", 42, None, 4.5, 164, 69, 17,
     ["black", "navy", "volt"], [],
     "Ultralight woven shorts with a laser-cut hem and zip valuables pocket."),
    ("Grid Training Tee", "tshirt", "T-Shirts", "men", 38, 29, 4.3, 98, 52, 88,
     ["slate", "black", "sand"], ["XL"],
     "A textured grid knit that moves air fast and dries even faster."),
    ("Ascend Track Jacket", "jacket", "Jackets", "men", 105, None, 4.6, 132, 63, 26,
     ["black", "navy", "stone"], [],
     "A retro-cut track jacket rebuilt in a modern matte technical twill."),
    ("Core Fleece Joggers", "joggers", "Joggers", "men", 78, 62, 4.8, 267, 90, 52,
     ["graphite", "black", "olive"], ["XS"],
     "Soft-brushed fleece joggers with a tapered ankle and deep side pockets."),
    ("Flux Sculpt Leggings", "leggings", "Leggings", "women", 68, None, 4.9, 604, 99, 30,
     ["black", "mocha", "teal", "rose"], ["XS"],
     "Sculpting compression knit with a contoured waistband that never rolls."),
    ("Halo Seamless Sports Bra", "bra", "Sports Bras", "women", 44, None, 4.8, 388, 94, 19,
     ["black", "rose", "ice"], ["XXL"],
     "Medium-support seamless bra with a racerback and removable cups."),
    ("Aria Cropped Hoodie", "hoodie", "Hoodies", "women", 82, 66, 4.7, 245, 86, 41,
     ["stone", "black", "lilac"], [],
     "A cropped, boxy hoodie in a soft loopback cotton blend."),
    ("Solstice Ribbed Tank", "tank", "Tank Tops", "women", 36, None, 4.6, 157, 71, 9,
     ["white", "black", "sand"], ["XS"],
     "A fitted rib tank with a scooped back and buttery hand-feel."),
    ("Vapor High-Rise Leggings", "leggings", "Leggings", "women", 74, 56, 4.8, 421, 93, 63,
     ["black", "graphite", "burgundy"], ["S"],
     "Weightless second-skin leggings with a squat-proof high rise."),
    ("Echo Longline Bra", "bra", "Sports Bras", "women", 48, None, 4.7, 202, 78, 14,
     ["black", "teal", "mocha"], [],
     "Longline coverage and high support for the heaviest training days."),
    ("Luxe Lounge Joggers", "joggers", "Joggers", "women", 76, None, 4.6, 188, 73, 36,
     ["sand", "black", "lilac"], ["XXL"],
     "A relaxed lounge jogger with a drawcord waist and cropped ankle."),
    ("Motion Flow Shorts", "shorts", "Shorts", "women", 40, 30, 4.5, 173, 67, 71,
     ["black", "rose", "olive"], [],
     "Flowy two-in-one shorts over a bonded compression short liner."),
    ("Aura Oversized Tee", "tshirt", "T-Shirts", "women", 40, None, 4.5, 149, 64, 6,
     ["white", "black", "mocha"], [],
     "An oversized boyfriend tee cut from heavyweight combed cotton."),
    ("Trail Lightweight Jacket", "jacket", "Jackets", "women", 112, None, 4.6, 118, 60, 24,
     ["ice", "black", "teal"], ["XS"],
     "A wind-resistant running shell that folds into its own chest pocket."),
    ("Prism Training Leggings", "leggings", "Leggings", "women", 70, None, 4.7, 264, 84, 11,
     ["navy", "black", "crimson"], [],
     "Panelled training leggings with mesh vents behind the knee."),
    ("Bloom Strappy Bra", "bra", "Sports Bras", "women", 42, 33, 4.4, 131, 56, 79,
     ["rose", "black", "lilac"], ["XXL"],
     "A light-support strappy bra designed for studio work and rest days."),
]

FIT_BY_GARMENT = {
    "tshirt": "Regular fit. Model is 6'0\" / 183cm and wears a size M.",
    "tank": "Relaxed fit. Model is 5'9\" / 175cm and wears a size S.",
    "hoodie": "Oversized fit. Size down for a closer silhouette.",
    "jacket": "Regular fit with room to layer a mid-weight top underneath.",
    "shorts": "Regular fit. Sits on the natural waist.",
    "joggers": "Tapered fit through the thigh and calf.",
    "leggings": "Compressive fit. True to size.",
    "bra": "Snug support fit. Size up between sizes for comfort.",
}

FABRIC_BY_GARMENT = {
    "tshirt": "82% recycled polyester, 18% elastane. 145gsm.",
    "tank": "60% cotton, 35% recycled polyester, 5% elastane. 180gsm.",
    "hoodie": "80% organic cotton, 20% recycled polyester. Brushed back fleece.",
    "jacket": "100% recycled ripstop nylon with a PFC-free DWR finish.",
    "shorts": "88% recycled polyester, 12% elastane. Bonded mesh liner.",
    "joggers": "75% organic cotton, 21% recycled polyester, 4% elastane.",
    "leggings": "76% recycled nylon, 24% elastane. 240gsm sculpt knit.",
    "bra": "78% recycled nylon, 22% elastane. Seamless circular knit.",
}

FEATURES_BY_GARMENT = {
    "tshirt": ["Sweat-wicking quick-dry knit", "Flatlock seams to stop chafing",
               "Anti-odour finish", "Reflective heat-pressed bolt at the back neck"],
    "tank": ["Dropped armholes for full range of motion", "Ribbed, shape-retaining knit",
             "Tagless neck print", "Scooped hem"],
    "hoodie": ["Double-layer structured hood", "Kangaroo pocket with hidden phone sleeve",
               "Ribbed cuffs and hem", "Matte woven bolt label at the hem"],
    "jacket": ["Water-repellent PFC-free finish", "Full-length reverse-coil zip",
               "Elasticated storm cuffs", "Packs into its own pocket"],
    "shorts": ["Bonded compression liner", "Zip valuables pocket",
               "Laser-cut ventilation", "Internal drawcord"],
    "joggers": ["Tapered leg with cuffed ankle", "Two deep side pockets and a zip back pocket",
                "Flat drawcord waistband", "Pre-shrunk fabric"],
    "leggings": ["Squat-proof opaque knit", "Contoured no-roll waistband",
                 "Hidden waistband pocket", "Bonded gusset for comfort"],
    "bra": ["Removable moulded cups", "Seamless zoned support knit",
            "Wide underband for stability", "Racerback straps"],
}


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def build():
    products = []
    for i, (name, garment, cat, gender, price, sale, rating, reviews, pop, days,
            colors, sold_out, tagline) in enumerate(P, start=1):
        slug = slugify(name)
        sizes = [{"size": s, "inStock": s not in sold_out} for s in APPAREL]
        color_objs = [{"key": c, "name": LABEL[c], "hex": SWATCH[c]} for c in colors]
        products.append({
            "id": f"VA-{1000 + i}",
            "slug": slug,
            "name": name,
            "garment": garment,
            "category": cat,
            "gender": gender,
            "price": price,
            "salePrice": sale,
            "rating": rating,
            "reviews": reviews,
            "popularity": pop,
            "daysOld": days,
            "isNew": days <= 30,
            "bestSeller": pop >= 84,
            "colors": color_objs,
            "sizes": sizes,
            "tagline": tagline,
            "description": (
                f"{tagline} The {name} is part of the VOLT ATHLETICS core range, "
                "developed with athletes over eighteen months of wear testing and refined "
                "down to the last seam. Cut from a premium performance fabric that holds "
                "its shape wash after wash, it is designed to feel as considered on the "
                "street as it does under load."
            ),
            "fit": FIT_BY_GARMENT[garment],
            "fabric": FABRIC_BY_GARMENT[garment],
            "features": FEATURES_BY_GARMENT[garment],
            "care": "Machine wash cold with like colours. Do not tumble dry. Do not iron print.",
        })
    return products


def main():
    products = build()
    (ROOT / "tools" / "catalog.json").write_text(json.dumps(products, indent=1))

    for p in products:
        p["images"] = {
            c["key"]: [f'images/products/{p["slug"]}-{slugify(c["name"])}-{v}.svg'
                       for v in ("front", "back", "detail", "studio")]
            for c in p["colors"]
        }

    body = json.dumps(products, indent=2)
    js = f"""/* =========================================================================
   VOLT ATHLETICS - products.js
   Phase 1 demo catalogue. This file is generated from tools/build_catalog.py.
   In Phase 2 the PRODUCTS array is replaced by a JSON response from PHP/MySQL,
   every consumer below reads through VOLT.catalog.* so nothing else changes.
   ========================================================================= */
(function (global) {{
  'use strict';

  var PRODUCTS = {body};

  var CATEGORIES = ['T-Shirts', 'Tank Tops', 'Hoodies', 'Jackets', 'Shorts', 'Joggers',
    'Leggings', 'Sports Bras'];

  var SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  /* Unique colour swatches across the whole catalogue (for filter UIs). */
  function allColors() {{
    var seen = {{}};
    var out = [];
    PRODUCTS.forEach(function (p) {{
      p.colors.forEach(function (c) {{
        if (!seen[c.key]) {{ seen[c.key] = true; out.push(c); }}
      }});
    }});
    return out.sort(function (a, b) {{ return a.name.localeCompare(b.name); }});
  }}

  function all() {{ return PRODUCTS.slice(); }}

  function byId(id) {{
    for (var i = 0; i < PRODUCTS.length; i++) {{
      if (PRODUCTS[i].id === id || PRODUCTS[i].slug === id) return PRODUCTS[i];
    }}
    return null;
  }}

  function byGender(gender) {{
    if (!gender) return all();
    return PRODUCTS.filter(function (p) {{
      return p.gender === gender || p.gender === 'unisex';
    }});
  }}

  function newArrivals() {{
    return all().sort(function (a, b) {{ return a.daysOld - b.daysOld; }});
  }}

  function bestSellers() {{
    return all().sort(function (a, b) {{ return b.popularity - a.popularity; }});
  }}

  function onSale() {{
    return all().filter(function (p) {{ return !!p.salePrice; }})
      .sort(function (a, b) {{ return discountPct(b) - discountPct(a); }});
  }}

  function related(product, limit) {{
    return all().filter(function (p) {{
      return p.id !== product.id &&
        (p.category === product.category || p.gender === product.gender);
    }}).sort(function (a, b) {{
      var sa = (a.category === product.category ? 2 : 0) + (a.gender === product.gender ? 1 : 0);
      var sb = (b.category === product.category ? 2 : 0) + (b.gender === product.gender ? 1 : 0);
      return sb - sa || b.popularity - a.popularity;
    }}).slice(0, limit || 4);
  }}

  function currentPrice(p) {{ return p.salePrice || p.price; }}

  function discountPct(p) {{
    if (!p.salePrice) return 0;
    return Math.round((1 - p.salePrice / p.price) * 100);
  }}

  /* Primary image for a product, optionally for a specific colourway. */
  function image(p, colorKey, index) {{
    var key = colorKey && p.images[colorKey] ? colorKey : p.colors[0].key;
    var set = p.images[key];
    return set[index || 0];
  }}

  function gallery(p, colorKey) {{
    var key = colorKey && p.images[colorKey] ? colorKey : p.colors[0].key;
    return p.images[key].slice();
  }}

  /* Simple weighted keyword search across name, category, colours and copy. */
  function search(query) {{
    var q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    var terms = q.split(/\\s+/);
    return all().map(function (p) {{
      var haystackTop = (p.name + ' ' + p.category + ' ' + p.gender).toLowerCase();
      var haystackAll = (haystackTop + ' ' + p.tagline + ' ' + p.garment + ' ' +
        p.colors.map(function (c) {{ return c.name; }}).join(' ')).toLowerCase();
      var score = 0;
      terms.forEach(function (t) {{
        if (haystackTop.indexOf(t) > -1) score += 3;
        else if (haystackAll.indexOf(t) > -1) score += 1;
      }});
      return {{ product: p, score: score }};
    }}).filter(function (r) {{ return r.score > 0; }})
      .sort(function (a, b) {{ return b.score - a.score || b.product.popularity - a.product.popularity; }})
      .map(function (r) {{ return r.product; }});
  }}

  global.VOLT = global.VOLT || {{}};
  global.VOLT.catalog = {{
    all: all,
    byId: byId,
    byGender: byGender,
    newArrivals: newArrivals,
    bestSellers: bestSellers,
    onSale: onSale,
    related: related,
    search: search,
    image: image,
    gallery: gallery,
    currentPrice: currentPrice,
    discountPct: discountPct,
    categories: CATEGORIES,
    sizes: SIZES,
    colors: allColors
  }};
}}(window));
"""
    (ROOT / "js" / "products.js").write_text(js)
    print("catalog:", len(products), "products ->", ROOT / "js" / "products.js")


if __name__ == "__main__":
    main()
