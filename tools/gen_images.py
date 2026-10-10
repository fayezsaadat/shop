#!/usr/bin/env python3
"""
VOLT ATHLETICS - placeholder product imagery generator.

Produces lightweight, dependency-free SVG "studio flat-lay" placeholders for
every product / colourway / view combination used by the Phase 1 front-end.

Output: images/products/{slug}-{color-slug}-{view}.svg
Views : front | back | detail | studio
"""

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "products"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 600, 750

# --------------------------------------------------------------- geometry --
# Each garment: body outline + decoration layers.
# Decoration entry: (path, fill token, opacity, kind)
#   fill tokens: shade | base | hi | ink
#   kind: 'fill' or 'stroke'

GARMENTS = {
    "tshirt": {
        "body": "M228,152 L182,170 L96,226 L154,312 L188,280 L188,566 "
                "Q300,590 412,566 L412,280 L446,312 L504,226 L418,170 L372,152 "
                "Q300,222 228,152 Z",
        "neck_front": "M228,152 Q300,222 372,152",
        "neck_back": "M236,152 Q300,190 364,152",
        "emblem": (300, 262),
        "emblem_back": (300, 316),
        "decor": [
            ("M188,280 L188,566", "ink", .14, "stroke"),
            ("M412,280 L412,566", "ink", .14, "stroke"),
            ("M154,312 L188,280 L188,318 L168,336 Z", "shade", .9, "fill"),
            ("M446,312 L412,280 L412,318 L432,336 Z", "shade", .9, "fill"),
            ("M188,542 Q300,566 412,542", "ink", .12, "stroke"),
        ],
    },
    "tank": {
        "body": "M258,152 L220,170 Q182,220 198,282 L186,536 "
                "Q300,562 414,536 L402,282 Q418,220 380,170 L342,152 "
                "Q300,218 258,152 Z",
        "neck_front": "M256,152 Q300,218 344,152",
        "neck_back": "M262,152 Q300,272 338,152",
        "emblem": (300, 268),
        "emblem_back": (300, 330),
        "decor": [
            ("M220,170 Q182,220 198,282", "ink", .22, "stroke"),
            ("M380,170 Q418,220 402,282", "ink", .22, "stroke"),
            ("M186,514 Q300,540 414,514", "ink", .12, "stroke"),
        ],
    },
    "hoodie": {
        "body": "M226,190 L172,212 L118,274 L152,504 L206,496 L196,336 L198,646 "
                "Q300,670 402,646 L404,336 L394,496 L448,504 L482,274 L428,212 "
                "L374,190 Q300,258 226,190 Z",
        "neck_front": "",
        "neck_back": "",
        "emblem": (300, 330),
        "emblem_back": (300, 386),
        "decor": [
            ("M226,190 Q300,112 374,190 Q350,272 300,278 Q250,272 226,190 Z", "shade", 1, "fill"),
            ("M242,200 Q300,142 358,200", "ink", .18, "stroke"),
            ("M272,268 C266,316 260,348 256,388", "ink", .30, "stroke"),
            ("M328,268 C334,316 340,348 344,388", "ink", .30, "stroke"),
            ("M222,468 L378,468 L390,566 Q300,584 210,566 Z", "shade", .85, "fill"),
            ("M222,468 L378,468", "ink", .18, "stroke"),
            ("M152,504 L206,496 L200,448 L146,456 Z", "shade", 1, "fill"),
            ("M448,504 L394,496 L400,448 L454,456 Z", "shade", 1, "fill"),
            ("M198,610 Q300,634 402,610 L402,646 Q300,670 198,646 Z", "shade", .8, "fill"),
            ("M198,336 L198,646", "ink", .10, "stroke"),
            ("M402,336 L402,646", "ink", .10, "stroke"),
        ],
    },
    "jacket": {
        "body": "M226,186 L172,208 L118,270 L152,500 L206,492 L196,332 L198,632 "
                "Q300,654 402,632 L404,332 L394,492 L448,500 L482,270 L428,208 "
                "L374,186 Q300,244 226,186 Z",
        "neck_front": "",
        "neck_back": "",
        "emblem": (358, 314),
        "emblem_back": (300, 380),
        "decor": [
            ("M226,186 Q300,150 374,186 L362,232 Q300,204 238,232 Z", "shade", 1, "fill"),
            ("M300,218 L300,642", "ink", .34, "stroke"),
            ("M226,470 L272,470", "ink", .20, "stroke"),
            ("M328,470 L374,470", "ink", .20, "stroke"),
            ("M152,500 L206,492 L200,446 L146,454 Z", "shade", 1, "fill"),
            ("M448,500 L394,492 L400,446 L454,454 Z", "shade", 1, "fill"),
            ("M198,598 Q300,620 402,598 L402,632 Q300,654 198,632 Z", "shade", .8, "fill"),
        ],
    },
    "shorts": {
        "body": "M186,268 L414,268 L432,516 Q368,538 316,516 L300,388 L284,516 "
                "Q232,538 168,516 Z",
        "neck_front": "",
        "neck_back": "",
        "emblem": (226, 330),
        "emblem_back": (374, 330),
        "decor": [
            ("M186,268 L414,268 L416,318 L184,318 Z", "shade", 1, "fill"),
            ("M254,300 L346,300", "ink", .24, "stroke"),
            ("M300,318 L300,388", "ink", .18, "stroke"),
            ("M168,494 Q250,512 284,494", "ink", .12, "stroke"),
            ("M316,494 Q350,512 432,494", "ink", .12, "stroke"),
        ],
    },
    "joggers": {
        "body": "M192,268 L408,268 L420,468 L398,672 Q356,690 320,672 L300,432 "
                "L280,672 Q244,690 202,672 L180,468 Z",
        "neck_front": "",
        "neck_back": "",
        "emblem": (230, 336),
        "emblem_back": (370, 336),
        "decor": [
            ("M192,268 L408,268 L410,316 L190,316 Z", "shade", 1, "fill"),
            ("M256,298 L344,298", "ink", .24, "stroke"),
            ("M300,316 L300,432", "ink", .16, "stroke"),
            ("M204,628 L282,628 L280,672 Q244,690 202,672 Z", "shade", 1, "fill"),
            ("M318,628 L396,628 L398,672 Q356,690 320,672 Z", "shade", 1, "fill"),
        ],
    },
    "leggings": {
        "body": "M202,268 L398,268 L404,452 L382,688 Q354,702 328,688 L300,436 "
                "L272,688 Q246,702 218,688 L196,452 Z",
        "neck_front": "",
        "neck_back": "",
        "emblem": (234, 336),
        "emblem_back": (366, 336),
        "decor": [
            ("M202,268 L398,268 L400,326 L200,326 Z", "shade", 1, "fill"),
            ("M300,326 L300,436", "ink", .16, "stroke"),
            ("M232,352 Q300,388 368,352 L362,470 Q300,498 238,470 Z", "shade", .5, "fill"),
            ("M214,560 Q246,576 268,560", "ink", .12, "stroke"),
            ("M332,560 Q354,576 386,560", "ink", .12, "stroke"),
        ],
    },
    "bra": {
        "body": "M158,362 Q166,302 226,292 Q300,336 374,292 Q434,302 442,362 "
                "Q428,470 300,500 Q172,470 158,362 Z",
        "neck_front": "",
        "neck_back": "",
        "emblem": (300, 448),
        "emblem_back": (300, 448),
        "decor": [
            ("M158,446 Q300,490 442,446 L442,362 Q300,406 158,362 Z", "shade", .45, "fill"),
            ("M300,314 L300,496", "ink", .12, "stroke"),
            ("M226,298 Q300,344 374,298", "ink", .20, "stroke"),
        ],
        "outside": [   # straps drawn behind/above the band, outside the clip
            ("M208,326 L236,180 L262,184 L240,332 Z", "base", 1, "fill"),
            ("M392,326 L364,180 L338,184 L360,332 Z", "base", 1, "fill"),
            ("M236,180 L262,184", "ink", .18, "stroke"),
            ("M364,180 L338,184", "ink", .18, "stroke"),
        ],
    },
}

# ------------------------------------------------------------------ colors --

COLORS = {
    "black":    "#1b1c1f", "graphite": "#4a4d55", "slate":  "#5d6b7a",
    "stone":    "#c8c2b8", "sand":     "#d9cbb6", "white":  "#f4f4f5",
    "volt":     "#d3f83a", "navy":     "#243044", "olive":  "#5f6a4a",
    "burgundy": "#5e2733", "rose":     "#d9a9a4", "mocha":  "#8a6f5e",
    "ice":      "#cdd8de", "teal":     "#2b5c58", "lilac":  "#b6aecb",
    "crimson":  "#8f2231",
}

LIGHT_COLORS = ("stone", "sand", "white", "volt", "rose", "ice", "lilac")

BACKDROPS = {
    "front":  ("#f5f5f6", "#e7e7ea"),
    "back":   ("#f2f2f4", "#e3e3e6"),
    "detail": ("#eeeef1", "#dddde1"),
    "studio": ("#212429", "#3d424a"),
}


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def mix(hex_color, target, amount):
    hex_color, target = hex_color.lstrip("#"), target.lstrip("#")
    out = []
    for i in (0, 2, 4):
        a = int(hex_color[i:i + 2], 16)
        b = int(target[i:i + 2], 16)
        out.append(int(a + (b - a) * amount))
    return "#%02x%02x%02x" % tuple(out)


def light(c, a):
    return mix(c, "#ffffff", a)


def dark(c, a):
    return mix(c, "#000000", a)


def emblem(x, y, ink, scale=1.0, opacity=.5):
    """Small abstract bolt mark standing in for an embroidered logo."""
    return (f'<g transform="translate({x},{y}) scale({scale})" fill="{ink}" '
            f'fill-opacity="{opacity}">'
            f'<path d="M-9,-15 L8,-15 L-1,-2 L11,-2 L-9,17 L-2,1 L-12,1 Z"/></g>')


def decor_svg(items, palette):
    out = []
    for path, token, opacity, kind in items:
        color = palette[token]
        if kind == "stroke":
            out.append(f'<path d="{path}" fill="none" stroke="{color}" '
                       f'stroke-opacity="{opacity}" stroke-width="2.6" stroke-linecap="round"/>')
        else:
            out.append(f'<path d="{path}" fill="{color}" fill-opacity="{opacity}"/>')
    return "".join(out)


def folds(ink):
    """Soft fabric folds - always clipped to the garment outline."""
    return (
        f'<g fill="{ink}" fill-opacity=".08">'
        f'<path d="M250,120 C266,300 260,500 244,700 L214,700 C232,500 238,300 228,120 Z"/>'
        f'<path d="M368,120 C356,320 362,520 378,700 L404,700 C388,520 382,320 392,120 Z"/>'
        f'</g>'
        f'<g fill="#ffffff" fill-opacity=".12">'
        f'<path d="M312,120 C326,320 324,520 312,700 L292,700 C304,520 306,320 294,120 Z"/>'
        f'</g>'
    )


def esc(text):
    return (text.replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def build_svg(garment, color_key, view, title):
    g = GARMENTS[garment]
    base = COLORS.get(color_key, COLORS["black"])
    bg1, bg2 = BACKDROPS[view]
    ink = "#ffffff" if color_key not in LIGHT_COLORS else "#111111"
    palette = {
        "base": base,
        "shade": dark(base, .16) if color_key not in LIGHT_COLORS else dark(base, .10),
        "hi": light(base, .18),
        "ink": ink,
    }
    uid = f"{garment}{color_key}{view}"

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" '
        f'height="{H}" role="img" aria-label="{esc(title)}">',
        '<defs>',
        f'<linearGradient id="bg{uid}" x1="0" y1="0" x2=".35" y2="1">'
        f'<stop offset="0" stop-color="{bg1}"/><stop offset="1" stop-color="{bg2}"/></linearGradient>',
        f'<linearGradient id="cloth{uid}" x1=".12" y1="0" x2=".88" y2="1">'
        f'<stop offset="0" stop-color="{light(base, .14)}"/>'
        f'<stop offset=".52" stop-color="{base}"/>'
        f'<stop offset="1" stop-color="{dark(base, .20)}"/></linearGradient>',
        f'<radialGradient id="vig{uid}" cx=".5" cy=".4" r=".78">'
        f'<stop offset=".55" stop-color="#000" stop-opacity="0"/>'
        f'<stop offset="1" stop-color="#000" stop-opacity=".12"/></radialGradient>',
        f'<filter id="soft{uid}" x="-25%" y="-25%" width="150%" height="150%">'
        f'<feGaussianBlur stdDeviation="16"/></filter>',
        f'<clipPath id="clip{uid}"><path d="{g["body"]}"/></clipPath>',
        '</defs>',
        f'<rect width="100%" height="100%" fill="url(#bg{uid})"/>',
    ]

    if view == "detail":
        weave = "".join(
            f'<line x1="{i}" y1="-20" x2="{i - 130}" y2="{H + 20}" stroke="{ink}" '
            f'stroke-opacity=".055" stroke-width="8"/>' for i in range(0, W + 160, 20))
        parts += [
            f'<rect width="{W}" height="{H}" fill="url(#cloth{uid})"/>',
            weave,
            f'<path d="M-20,530 Q150,452 320,548 Q470,636 620,556 L620,780 L-20,780 Z" '
            f'fill="{dark(base, .24)}" fill-opacity=".5"/>',
            f'<path d="M-20,530 Q150,452 320,548 Q470,636 620,556" fill="none" '
            f'stroke="#ffffff" stroke-opacity=".10" stroke-width="3"/>',
            emblem(300, 322, ink, 4.4, .55),
            f'<rect x="226" y="404" width="148" height="2" fill="{ink}" fill-opacity=".3"/>',
            f'<text x="300" y="448" text-anchor="middle" font-family="Inter,Helvetica,Arial,'
            f'sans-serif" font-size="20" letter-spacing="8" fill="{ink}" fill-opacity=".45">'
            f'VOLT</text>',
            f'<rect width="{W}" height="{H}" fill="url(#vig{uid})"/>',
        ]
    else:
        scale = .88 if view == "studio" else 1.0
        if view == "studio":
            parts.append('<rect y="452" width="600" height="298" fill="#fff" fill-opacity=".05"/>')
            parts.append(f'<ellipse cx="300" cy="300" rx="300" ry="270" fill="#fff" '
                         f'fill-opacity=".05" filter="url(#soft{uid})"/>')
            parts.append(f'<ellipse cx="300" cy="686" rx="168" ry="26" fill="#000" '
                         f'fill-opacity=".6" filter="url(#soft{uid})"/>')
        else:
            parts.append(f'<ellipse cx="308" cy="676" rx="190" ry="30" fill="#000" '
                         f'fill-opacity=".10" filter="url(#soft{uid})"/>')

        inner = []
        for path, token, opacity, kind in g.get("outside", []):
            inner.append(f'<path d="{path}" fill="{palette[token]}" fill-opacity="{opacity}"/>')
        inner.append(f'<path d="{g["body"]}" fill="url(#cloth{uid})"/>')
        inner.append(f'<g clip-path="url(#clip{uid})">{folds(ink)}'
                     f'{decor_svg(g["decor"], palette)}</g>')

        neck = g["neck_front"] if view != "back" else g["neck_back"]
        if neck:
            inner.append(f'<path d="{neck}" fill="none" stroke="{ink}" stroke-opacity=".26" '
                         f'stroke-width="8" stroke-linecap="round"/>')
        ex, ey = g["emblem_back"] if view == "back" else g["emblem"]
        inner.append(emblem(ex, ey, ink, 1.5, .5))

        offset = (1 - scale) * 300
        parts.append(f'<g transform="translate({offset:.1f},{18 if view == "studio" else 0}) '
                     f'scale({scale})">{"".join(inner)}</g>')
        parts.append(f'<rect width="{W}" height="{H}" fill="url(#vig{uid})"/>')

    parts.append('</svg>')
    return "\n".join(parts)


def main():
    catalog = json.loads((ROOT / "tools" / "catalog.json").read_text())
    count = 0
    for p in catalog:
        for c in p["colors"]:
            for view in ("front", "back", "detail", "studio"):
                name = f'{p["slug"]}-{slugify(c["name"])}-{view}.svg'
                (OUT / name).write_text(
                    build_svg(p["garment"], c["key"], view,
                              f'{p["name"]} in {c["name"]}, {view} view'))
                count += 1
    print(f"wrote {count} svg files -> {OUT}")


if __name__ == "__main__":
    main()
