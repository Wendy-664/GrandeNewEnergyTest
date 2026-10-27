import os

SITE_DIR = r"C:\Users\huang\WorkBuddy\独立站搭建\gmtne-site"
ASSETS = "assets"

# WhatsApp number placeholder - can be updated later
WHATSAPP = "8612345678900"

def head(title, desc=""):
    return f"""<!DOCTYPE html>
<html lang="en" data-whatsapp="{WHATSAPP}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{ASSETS}/css/styles.css">
</head>
"""

def header(active=""):
    nav = [
        ("index.html", "Home"),
        ("products.html", "Products"),
        ("applications.html", "Applications"),
        ("about.html", "About"),
        ("contact.html", "Contact"),
    ]
    links = "".join(f'<a href="{u}" class="{"active" if l==active else ""}">{l}</a>' for u,l in nav)
    return f"""<header class="header">
  <div class="container header-inner">
    <a href="index.html" class="logo">
      <img src="{ASSETS}/img/logo.png" alt="Grande Micro">
      <span>Grande Micro</span>
    </a>
    <nav class="nav">{links}</nav>
    <div class="header-cta">
      <a href="contact.html" class="btn btn-primary btn-sm">Request Quote</a>
      <button class="menu-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
"""

def footer():
    return f"""<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-logo">
          <img src="{ASSETS}/img/logo.png" alt="Grande Micro">
          <span>Grande Micro</span>
        </div>
        <p style="font-size:0.9rem;line-height:1.6;margin-bottom:1rem;">Power semiconductor IC design company delivering LED drivers, AC-DC, DC-DC, MOSFETs and BLDC solutions for the Indian market.</p>
        <p style="font-size:0.85rem;opacity:0.6;">ISO 9001 quality system · India grid-ready designs</p>
      </div>
      <div>
        <h5>Products</h5>
        <a href="products.html">LED Lighting ICs</a>
        <a href="products.html">AC-DC Converters</a>
        <a href="products.html">DC-DC Converters</a>
        <a href="products.html">Power MOSFETs</a>
        <a href="products.html">BLDC Drivers</a>
      </div>
      <div>
        <h5>Solutions</h5>
        <a href="applications.html">Street Lighting</a>
        <a href="applications.html">Flood Lighting</a>
        <a href="applications.html">Fan Light</a>
        <a href="applications.html">E-Bike Display</a>
        <a href="applications.html">Industrial Power</a>
      </div>
      <div>
        <h5>Contact</h5>
        <a href="mailto:Sales@grandemicro.com">Sales@grandemicro.com</a>
        <a href="tel:+8651085388846">+86-510-85388846</a>
        <p style="font-size:0.85rem;margin-top:0.5rem;">Wuxi Grandemicro Technology Co., Ltd.<br>530 Building A, Taihu Science Park<br>Wuxi, Jiangsu, China</p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; {2026} Wuxi Grandemicro Technology Co., Ltd. All rights reserved.</span>
      <span>Domain: gmtne.com</span>
    </div>
  </div>
</footer>
<a href="https://wa.me/{WHATSAPP}?text=Hello%2C%20I%20am%20interested%20in%20your%20power%20semiconductor%20solutions%20for%20India%20market." class="whatsapp-float" target="_blank" title="Chat on WhatsApp">💬</a>
<script src="{ASSETS}/js/main.js"></script>
"""

# ============================================================
# SVG Helpers
# ============================================================

def ic_svg(model, pkg="SOP7"):
    """Simple isometric IC package SVG."""
    bodies = {
        "ESOP5": ('M140,120 L260,120 L260,180 L140,180 Z', 'M140,120 L120,100 L240,100 L260,120 Z', 'M260,120 L240,100 L240,160 L260,180 Z', 6),
        "SOP7": ('M110,120 L290,120 L290,180 L110,180 Z', 'M110,120 L90,100 L270,100 L290,120 Z', 'M290,120 L270,100 L270,160 L290,180 Z', 7),
        "SOP8": ('M100,120 L300,120 L300,180 L100,180 Z', 'M100,120 L80,100 L280,100 L300,120 Z', 'M300,120 L280,100 L280,160 L300,180 Z', 8),
        "HSOP7": ('M110,120 L290,120 L290,190 L110,190 Z', 'M110,120 L90,100 L270,100 L290,120 Z', 'M290,120 L270,100 L270,170 L290,190 Z', 7),
    }
    top, roof, side, pins = bodies.get(pkg, bodies["SOP7"])
    pin_left = "".join(f'<rect x="{112+i*25}" y="185" width="12" height="25" fill="#B0BEC5" stroke="#78909C" stroke-width="1"/>' for i in range(pins))
    pin_right = "".join(f'<rect x="{112+i*25}" y="185" width="12" height="25" fill="#B0BEC5" stroke="#78909C" stroke-width="1" transform="translate(65,0)"/>' for i in range(pins))
    return f"""<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#37474F"/><stop offset="100%" stop-color="#263238"/></linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#546E7A"/><stop offset="100%" stop-color="#455A64"/></linearGradient>
  </defs>
  <g transform="translate(0,10)">
    {pin_left}{pin_right}
    <path d="{side}" fill="#263238" stroke="#102027" stroke-width="1"/>
    <path d="{top}" fill="url(#bodyGrad)" stroke="#102027" stroke-width="1"/>
    <path d="{roof}" fill="url(#roofGrad)" stroke="#102027" stroke-width="1"/>
    <circle cx="130" cy="110" r="4" fill="#102027"/>
    <text x="200" y="156" text-anchor="middle" fill="#fff" font-size="14" font-weight="700" font-family="Inter, sans-serif">{model}</text>
  </g>
</svg>"""

def exploded_svg(model, pkg="SOP7"):
    bodies = {
        "ESOP5": (140, 260, 120, 180, 120, 100, 240, 160),
        "SOP7": (110, 290, 120, 180, 90, 100, 270, 160),
        "SOP8": (100, 300, 120, 180, 80, 100, 280, 160),
        "HSOP7": (110, 290, 120, 190, 90, 100, 270, 170),
    }
    x1, x2, y1, y2, rx1, ry1, rx2, ry2 = bodies.get(pkg, bodies["SOP7"])
    cx = (x1+x2)/2
    return f"""<svg viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg" class="exploded-ic-svg">
  <defs>
    <linearGradient id="leadGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#90A4AE"/><stop offset="100%" stop-color="#CFD8DC"/></linearGradient>
    <linearGradient id="dieGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#26C6DA"/><stop offset="100%" stop-color="#0097A7"/></linearGradient>
    <linearGradient id="wireGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FFD54F"/><stop offset="100%" stop-color="#FFB300"/></linearGradient>
    <linearGradient id="moldGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#455A64" stop-opacity="0.95"/><stop offset="100%" stop-color="#263238" stop-opacity="0.95"/></linearGradient>
  </defs>

  <!-- Lead Frame -->
  <g data-layer="3">
    <rect x="{x1}" y="{y2+80}" width="{x2-x1}" height="{y2-y1}" fill="url(#leadGrad)" stroke="#546E7A" rx="3"/>
    <text x="{cx}" y="{y2+80+(y2-y1)/2+5}" text-anchor="middle" fill="#37474F" font-size="12" font-weight="700">Lead Frame</text>
  </g>

  <!-- Bonding Wires -->
  <g data-layer="2">
    <path d="M {x1+20} {y2+60} Q {cx} {y2+20} {x2-20} {y2+60}" fill="none" stroke="url(#wireGrad)" stroke-width="3"/>
    <path d="M {x1+50} {y2+60} Q {cx} {y2+25} {x2-50} {y2+60}" fill="none" stroke="url(#wireGrad)" stroke-width="3"/>
    <text x="{cx}" y="{y2+15}" text-anchor="middle" fill="#F59E0B" font-size="12" font-weight="700">Bonding Wires</text>
  </g>

  <!-- Silicon Die -->
  <g data-layer="1">
    <rect x="{cx-45}" y="{y2+5}" width="90" height="55" fill="url(#dieGrad)" stroke="#00838F" stroke-width="1" rx="2"/>
    <text x="{cx}" y="{y2+38}" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">Silicon Die</text>
  </g>

  <!-- Molding Compound -->
  <g data-layer="0">
    <path d="M {x1-10} {y2-60} L {x2+10} {y2-60} L {x2} {y1-80} L {x1} {y1-80} Z" fill="url(#moldGrad)" stroke="#102027" stroke-width="1"/>
    <text x="{cx}" y="{y1-55}" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">Epoxy Molding Compound</text>
    <text x="{cx}" y="{y2-35}" text-anchor="middle" fill="#90A4AE" font-size="13" font-weight="700">{model}</text>
  </g>
</svg>"""

def circuit_svg(model):
    return f"""<svg viewBox="0 0 800 320" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="icBody" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#37474F"/><stop offset="100%" stop-color="#263238"/></linearGradient>
  </defs>
  <text x="60" y="40" fill="#0A2540" font-size="16" font-weight="700">AC Input 100-440Vac</text>
  <rect x="60" y="55" width="60" height="40" fill="#90A4AE" stroke="#546E7A" rx="3"/><text x="90" y="80" text-anchor="middle" fill="#263238" font-size="11" font-weight="700">Bridge</text>
  <line x1="120" y1="75" x2="180" y2="75" stroke="#F59E0B" stroke-width="3"/>
  <rect x="180" y="55" width="50" height="40" fill="#E0F7FA" stroke="#06B6D4" rx="3"/><text x="205" y="80" text-anchor="middle" fill="#006064" font-size="10" font-weight="700">Fuse/Var</text>
  <line x1="230" y1="75" x2="280" y2="75" stroke="#F59E0B" stroke-width="3"/>
  <rect x="280" y="55" width="60" height="50" fill="#FFF3E0" stroke="#F59E0B" rx="3"/><text x="310" y="82" text-anchor="middle" fill="#E65100" font-size="11" font-weight="700">Inductor</text>
  <line x1="340" y1="80" x2="420" y2="80" stroke="#F59E0B" stroke-width="3"/>
  <rect x="420" y="50" width="120" height="60" fill="url(#icBody)" stroke="#102027" rx="4"/><text x="480" y="87" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">{model}</text>
  <line x1="540" y1="80" x2="600" y2="80" stroke="#F59E0B" stroke-width="3"/>
  <rect x="600" y="55" width="50" height="40" fill="#E8F5E9" stroke="#43A047" rx="3"/><text x="625" y="80" text-anchor="middle" fill="#1B5E20" font-size="10" font-weight="700">Filter</text>
  <line x1="650" y1="75" x2="720" y2="75" stroke="#F59E0B" stroke-width="3"/>
  <rect x="720" y="50" width="60" height="50" fill="#FFFDE7" stroke="#FBC02D" rx="3"/><text x="750" y="80" text-anchor="middle" fill="#F57F17" font-size="11" font-weight="700">LEDs</text>
  <text x="480" y="170" text-anchor="middle" fill="#0A2540" font-size="16" font-weight="700">Simplified Reference Schematic</text>
  <g transform="translate(60,200)">
    <rect x="0" y="0" width="18" height="18" fill="#90A4AE"/><text x="28" y="14" fill="#37474F" font-size="13">Input Protection</text>
    <rect x="160" y="0" width="18" height="18" fill="#FFF3E0"/><text x="188" y="14" fill="#37474F" font-size="13">Buck Inductor</text>
    <rect x="320" y="0" width="18" height="18" fill="#37474F"/><text x="348" y="14" fill="#37474F" font-size="13">{model} Driver IC</text>
    <rect x="500" y="0" width="18" height="18" fill="#FFFDE7"/><text x="528" y="14" fill="#37474F" font-size="13">LED Module</text>
  </g>
</svg>"""

# ============================================================
# Page builders
# ============================================================

def write(path, body):
    full = os.path.join(SITE_DIR, path)
    with open(full, "w", encoding="utf-8") as f:
        f.write(body)
    print("Wrote", path)

# Product data
products = [
    {
        "id": "yt2173e8",
        "name": "YT2173E8",
        "category": "LED Lighting",
        "cat_code": "led",
        "tagline": "3-Stage Linear Constant Current LED Driver",
        "pkg": "ESOP8",
        "desc": "Three-stage linear constant-current controller designed for Indian LED bulbs, T-lamps, panels and downlights. Supports parallel connection up to 50W with Iout foldback under low/high line conditions.",
        "specs": [
            ("Topology", "3-Stage Linear Constant Current"),
            ("Input Voltage", "Up to 700V withstand"),
            ("Package", "ESOP8"),
            ("OTP", "120 / 135 / 145 °C selectable"),
            ("Max Power", "Up to 50W (parallel capable)"),
            ("Target Load", "176-265Vac, 10W typical"),
            ("Key Feature", "Iout foldback under low & high line"),
        ],
        "apps": [("LED Bulbs", "unsplash-ceiling-fan-opt.jpg"), ("Panel & Downlight", "unsplash-office-opt.jpg"), ("T-Lamp", "unsplash-streetlight-opt.jpg")],
        "datasheet": "ds-YT2173E8.pdf",
        "svg_pkg": "ESOP8",
    },
    {
        "id": "yt2302ehs7",
        "name": "YT2302EHS7",
        "category": "LED Lighting",
        "cat_code": "led",
        "tagline": "Non-Isolated High-PF Buck LED Driver",
        "pkg": "SOP7",
        "desc": "BUCK controller optimized for India LED drivers with 100~440Vac line input. Built-in 650V/3.7Ω MOSFET, Iout foldback for thermal reliability and excellent surge immunity for Indian grid conditions.",
        "specs": [
            ("Topology", "Non-isolated BUCK, high PF"),
            ("Input Voltage", "100 ~ 440 Vac"),
            ("Package", "SOP7"),
            ("OTP", "145 °C"),
            ("Built-in MOSFET", "650V / 3.7 Ω"),
            ("OVP", "60 / 105 / 120 / 160 V"),
            ("Loading", "90V / 200mA"),
        ],
        "apps": [("India Floodlight", "app-floodlight-opt.jpg"), ("Street Light", "unsplash-streetlight-opt.jpg"), ("Industrial High-Bay", "unsplash-factory-opt.jpg")],
        "datasheet": "ds-YT2302EHS7.pdf",
        "svg_pkg": "SOP7",
    },
    {
        "id": "yt3110ehs7",
        "name": "YT3110EHS7",
        "category": "LED Lighting",
        "cat_code": "led",
        "tagline": "Isolated Single-Stage PSR PFC LED Driver",
        "pkg": "SOP7",
        "desc": "Isolated single-stage PFC constant-current LED driver from the YT3110 series. Purpose-built for India's ultra-wide 90-440Vac line, 4kV/6kV surge and low-BOM requirements up to 150W.",
        "specs": [
            ("Topology", "PSR_CC, isolated single-stage PFC"),
            ("Input Voltage", "90 ~ 440 Vac"),
            ("Package", "SOP7"),
            ("Max Frequency", "120 kHz"),
            ("MOSFET", "650V built-in"),
            ("OTP", "90 / 105 / 120 / 135 / 150 °C"),
            ("Special", "Current foldback & high-line cutoff"),
        ],
        "apps": [("Street Lighting", "unsplash-streetlight-opt.jpg"), ("Flood Lighting", "app-floodlight-opt.jpg"), ("Industrial Lighting", "unsplash-factory-opt.jpg")],
        "datasheet": "",
        "svg_pkg": "SOP7",
    },
    {
        "id": "yt91002nh7",
        "name": "YT91002NH7",
        "category": "AC-DC / BLDC Power",
        "cat_code": "acdc",
        "tagline": "High-PF Constant Voltage for BLDC & Fan-Light",
        "pkg": "HSOP7",
        "desc": "High power-factor constant-voltage controller for BLDC power supplies and ceiling fan-light combos. Integrates 1kV/0.48Ω MOSFET in compact HSOP7, delivering 24V / 1.5A from BUCK or FLYBACK-PSR topology.",
        "specs": [
            ("Topology", "BUCK / FLYBACK-PSR"),
            ("Input Voltage", "Wide AC line (India ready)"),
            ("Package", "HSOP7"),
            ("OTP", "150 °C"),
            ("Built-in MOSFET", "1kV / 0.48 Ω"),
            ("Output", "24V / 1.5A"),
            ("Application", "BLDC, fan-light, smart lighting"),
        ],
        "apps": [("Ceiling Fan Light", "app-fanlight2-opt.png"), ("BLDC Motor Drive", "unsplash-factory-opt.jpg"), ("Smart Home", "unsplash-office-opt.jpg")],
        "datasheet": "ds-YT91002NH7.pdf",
        "svg_pkg": "HSOP7",
    },
]

# ============================================================
# INDEX
# ============================================================
product_cards_html = ""
for p in products:
    img = p["apps"][0][1]
    specs_short = " / ".join([s[1] for s in p["specs"][:3]])
    product_cards_html += f"""
      <div class="card fade-in" data-category="{p['cat_code']}">
        <div class="card-img"><img src="{ASSETS}/img/{img}" alt="{p['name']}"></div>
        <div class="card-body">
          <span class="card-tag">{p['category']}</span>
          <h3>{p['name']}</h3>
          <p>{p['tagline']}</p>
          <div class="card-specs">
            <div class="card-spec"><strong>Package</strong>{p['pkg']}</div>
            <div class="card-spec"><strong>Topology</strong>{p['specs'][0][1]}</div>
            <div class="card-spec"><strong>Input</strong>{p['specs'][1][1]}</div>
            <div class="card-spec"><strong>Best For</strong>{p['apps'][0][0]}</div>
          </div>
          <a href="product-{p['id']}.html" class="btn btn-primary btn-sm">View Details</a>
        </div>
      </div>"""

index_body = f"""{head("Grande Micro - Power Semiconductor Solutions for India", "Grande Micro delivers LED driver ICs, AC-DC, DC-DC, MOSFETs and BLDC solutions optimized for the Indian market. Competitive pricing and custom design support.")}
<body>
{header("Home")}

<section class="hero">
  <div class="container">
    <div class="hero-content fade-in">
      <p class="hero-kicker">Power Semiconductor IC Design House</p>
      <h1>Reliable Power ICs for <span>India's Lighting & Appliance Markets</span></h1>
      <p>LED drivers, AC-DC, DC-DC and BLDC controllers engineered for India's 100-440Vac grid, high surge environment and cost-sensitive assemblies. We combine competitive pricing with flexible customization.</p>
      <div class="hero-btns">
        <a href="products.html" class="btn btn-primary">Explore Products</a>
        <a href="contact.html" class="btn btn-outline" style="color:#fff;border-color:#fff;">Request a Quote</a>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><strong>100-440Vac</strong><span>India Grid Ready</span></div>
        <div class="hero-stat"><strong>4kV/6kV</strong><span>Surge Capability</span></div>
        <div class="hero-stat"><strong>5+</strong><span>Product Lines</span></div>
      </div>
    </div>
  </div>
</section>

<section class="trust-strip">
  <div class="container">
    <div class="trust-grid">
      <div class="trust-item"><div style="font-size:2rem;color:var(--accent);">🏭</div><strong>ISO 9001</strong><span>Quality System</span></div>
      <div class="trust-item"><div style="font-size:2rem;color:var(--accent);">⚡</div><strong>India Grid</strong><span>100-440Vac</span></div>
      <div class="trust-item"><div style="font-size:2rem;color:var(--accent);">🔧</div><strong>Custom Design</strong><span>Per Your BOM</span></div>
      <div class="trust-item"><div style="font-size:2rem;color:var(--accent);">🚚</div><strong>Fast Samples</strong><span>2-4 Weeks</span></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="text-center mb-4 fade-in">
      <h2 class="section-title">Star Products for India</h2>
      <p class="section-subtitle" style="margin:0 auto;">Four battle-tested IC families designed for India's lighting and appliance power requirements.</p>
    </div>
    <div class="card-grid fade-in">
      {product_cards_html}
    </div>
    <div class="text-center mt-2"><a href="products.html" class="btn btn-outline">View Full Product Portfolio</a></div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <div class="text-center mb-4 fade-in">
      <h2 class="section-title">Application Scenarios</h2>
      <p class="section-subtitle" style="margin:0 auto;">From outdoor floodlights to ceiling fan-lights — see where our ICs deliver value.</p>
    </div>
    <div class="app-grid fade-in">
      <div class="app-card"><img src="{ASSETS}/img/app-floodlight-opt.jpg" alt="Floodlight"><div class="app-card-overlay"><h4>Flood & Street Lighting</h4><p>50-200W India-ready drivers with surge protection</p></div></div>
      <div class="app-card"><img src="{ASSETS}/img/app-fanlight2-opt.png" alt="Fan Light"><div class="app-card-overlay"><h4>Ceiling Fan Light</h4><p>High-PF CV supply + fan motor drive combo</p></div></div>
      <div class="app-card"><img src="{ASSETS}/img/app-ebike-display-opt.jpg" alt="E-Bike"><div class="app-card-overlay"><h4>E-Bike & Appliance Display</h4><p>Wide-input DC-DC for 2-wheeler dashboards</p></div></div>
      <div class="app-card"><img src="{ASSETS}/img/unsplash-office-opt.jpg" alt="Panel"><div class="app-card-overlay"><h4>Panel & Downlight</h4><p>Linear and buck drivers for indoor fixtures</p></div></div>
      <div class="app-card"><img src="{ASSETS}/img/unsplash-factory-opt.jpg" alt="Industrial"><div class="app-card-overlay"><h4>Industrial Power</h4><p>Robust MOSFETs and controllers for harsh grids</p></div></div>
      <div class="app-card"><img src="{ASSETS}/img/unsplash-chip-opt.jpg" alt="Semiconductor"><div class="app-card-overlay"><h4>Custom Power Design</h4><p>Tailored IC selection and reference designs</p></div></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="text-center mb-4 fade-in">
      <h2 class="section-title">Why Partner with Grande Micro</h2>
      <p class="section-subtitle" style="margin:0 auto;">We understand the Indian market: tight cost targets, unstable grid voltage and the need for fast local support.</p>
    </div>
    <div class="feature-grid fade-in">
      <div class="feature"><div class="feature-icon">💰</div><div><h4>Competitive Pricing</h4><p>Fabless cost structure and localized BOM optimization to win in price-sensitive India assemblies.</p></div></div>
      <div class="feature"><div class="feature-icon">🎛️</div><div><h4>India-Custom Design</h4><p>We adapt protection thresholds, OTP curves, pinouts and packages to match your India customer specs.</p></div></div>
      <div class="feature"><div class="feature-icon">⚡</div><div><h4>Grid-Hardened Products</h4><p>Built for 100-440Vac input, 4kV/6kV surge, high line-voltage cutoff and thermal foldback.</p></div></div>
      <div class="feature"><div class="feature-icon">🤝</div><div><h4>Local Support</h4><p>India-based agent network and application engineering to shorten your design-in cycle.</p></div></div>
      <div class="feature"><div class="feature-icon">📦</div><div><h4>Fast Delivery</h4><p>Mature wafer, packaging and test supply chain with sample lead times as short as 2-4 weeks.</p></div></div>
      <div class="feature"><div class="feature-icon">🔬</div><div><h4>Proven Expertise</h4><p>Core team from Analog Devices and Giantec with deep analog/mixed-signal design experience.</p></div></div>
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="container">
    <h2 class="fade-in">Ready to source power ICs for India?</h2>
    <p class="fade-in">Send us your target specs, BOM target or reference competitor part. We'll recommend a pin-to-pin or cost-optimized Grande Micro solution.</p>
    <a href="contact.html" class="btn btn-white fade-in">Start Your Inquiry</a>
  </div>
</section>

{footer()}
</body></html>
"""
write("index.html", index_body)

# ============================================================
# PRODUCTS
# ============================================================
product_grid_all = ""
for p in products:
    img = p["apps"][0][1]
    product_grid_all += f"""
      <div class="card fade-in" data-category="{p['cat_code']}">
        <div class="card-img"><img src="{ASSETS}/img/{img}" alt="{p['name']}"></div>
        <div class="card-body">
          <span class="card-tag">{p['category']}</span>
          <h3>{p['name']}</h3>
          <p>{p['tagline']}</p>
          <div class="card-specs">
            <div class="card-spec"><strong>Package</strong>{p['pkg']}</div>
            <div class="card-spec"><strong>Topology</strong>{p['specs'][0][1]}</div>
            <div class="card-spec"><strong>Input</strong>{p['specs'][1][1]}</div>
            <div class="card-spec"><strong>Best For</strong>{p['apps'][0][0]}</div>
          </div>
          <a href="product-{p['id']}.html" class="btn btn-primary btn-sm">View Details</a>
        </div>
      </div>"""

extra_products = [
    ("YT2181GTE5", "LED Lighting", "led", "50-200W India Floodlight Driver", "ESOP5", "Non-isolated BUCK, high PF", "100-440Vac", "app-floodlight-opt.jpg", "India floodlight & high-bay"),
    ("YT2276EH8", "LED Lighting", "led", "200W Non-Isolated Buck Controller", "HSOP8", "BUCK controller", "90-265Vac", "app-floodlight-opt.jpg", "High-power LED"),
    ("YTD2202DE8", "DC-DC", "dcdc", "E-Bike Display DC-DC", "ESOP8", "Synchronous Buck", "25-150Vdc", "app-ebike-display-opt.jpg", "E-bike dashboard"),
    ("YT62501X", "AC-DC", "acdc", "60W Flyback CV/CC with GaN", "QFN", "Flyback PSR", "90-265Vac", "unsplash-factory-opt.jpg", "Adapter & SMPS"),
]
for name, cat, code, tag, pkg, topo, inp, img, best in extra_products:
    product_grid_all += f"""
      <div class="card fade-in" data-category="{code}">
        <div class="card-img"><img src="{ASSETS}/img/{img}" alt="{name}"></div>
        <div class="card-body">
          <span class="card-tag">{cat}</span>
          <h3>{name}</h3>
          <p>{tag}</p>
          <div class="card-specs">
            <div class="card-spec"><strong>Package</strong>{pkg}</div>
            <div class="card-spec"><strong>Topology</strong>{topo}</div>
            <div class="card-spec"><strong>Input</strong>{inp}</div>
            <div class="card-spec"><strong>Best For</strong>{best}</div>
          </div>
          <a href="contact.html" class="btn btn-outline btn-sm">Request Details</a>
        </div>
      </div>"""

products_body = f"""{head("Products - Grande Micro", "Browse Grande Micro LED driver ICs, AC-DC, DC-DC, MOSFETs and BLDC controllers optimized for the Indian market.")}
<body>
{header("Products")}

<section class="page-header">
  <div class="container">
    <h1 class="fade-in">Product Portfolio</h1>
    <p class="fade-in">LED lighting drivers, AC-DC, DC-DC, power MOSFETs and BLDC solutions — designed for India and ready to customize.</p>
  </div>
</section>

<section class="breadcrumb">
  <div class="container">
    <a href="index.html">Home</a> <span class="sep">/</span> <span>Products</span>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="filter-tabs fade-in">
      <button class="active" data-filter="all">All</button>
      <button data-filter="led">LED Lighting</button>
      <button data-filter="acdc">AC-DC / BLDC</button>
      <button data-filter="dcdc">DC-DC</button>
    </div>
    <div class="card-grid fade-in">
      {product_grid_all}
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="container">
    <h2>Looking for a pin-to-pin alternative?</h2>
    <p>Share your current BOM or competitor part number and we'll propose a cost-optimized Grande Micro equivalent.</p>
    <a href="contact.html" class="btn btn-white">Request Cross Reference</a>
  </div>
</section>

{footer()}
</body></html>
"""
write("products.html", products_body)

# ============================================================
# PRODUCT DETAIL PAGES
# ============================================================
for p in products:
    ds_link = f'<a href="{ASSETS}/img/{p["datasheet"]}" class="btn btn-outline" download>Download Datasheet</a>' if p["datasheet"] else '<a href="contact.html" class="btn btn-outline">Request Datasheet</a>'
    specs_rows = "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k,v in p["specs"])
    app_cards = "".join(f"""
      <div class="card fade-in">
        <div class="card-img" style="height:180px;"><img src="{ASSETS}/img/{img}" alt="{name}"></div>
        <div class="card-body"><h4 style="color:var(--primary);margin-bottom:0.25rem;">{name}</h4><p style="font-size:0.9rem;color:var(--text-muted);">Optimized BOM and reference design available.</p></div>
      </div>""" for name, img in p["apps"])

    detail_body = f"""{head(f"{p['name']} - {p['tagline']} | Grande Micro", f"{p['name']} {p['tagline']}. {p['desc']}")}
<body>
{header("Products")}

<section class="page-header" style="padding:140px 0 60px;">
  <div class="container">
    <div class="product-meta fade-in">
      <span>{p['category']}</span>
      <span>{p['pkg']}</span>
      <span>India Ready</span>
    </div>
    <h1 class="fade-in">{p['name']}</h1>
    <p class="fade-in" style="max-width:800px;">{p['tagline']}</p>
  </div>
</section>

<section class="breadcrumb" style="padding-top:24px;">
  <div class="container">
    <a href="index.html">Home</a> <span class="sep">/</span> <a href="products.html">Products</a> <span class="sep">/</span> <span>{p['name']}</span>
  </div>
</section>

<section class="section" style="padding-top:40px;">
  <div class="container">
    <div class="product-hero fade-in">
      <div class="product-hero-img">
        {ic_svg(p['name'], p['svg_pkg'])}
      </div>
      <div>
        <h2 style="font-size:1.75rem;color:var(--primary);margin-bottom:1rem;">{p['tagline']}</h2>
        <p style="font-size:1.05rem;color:var(--text-muted);margin-bottom:1.5rem;">{p['desc']}</p>
        <ul style="list-style:disc;padding-left:1.25rem;color:var(--text-muted);margin-bottom:1.5rem;">
          <li>India grid hardened: wide input range and surge protection</li>
          <li>Cost-optimized package and BOM for high-volume assemblies</li>
          <li>Application reference design and samples available</li>
          <li>Customization support for pinout, OTP and protection thresholds</li>
        </ul>
        <div class="product-actions">
          <a href="contact.html" class="btn btn-primary">Request Quote / Samples</a>
          {ds_link}
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <h2 class="section-title mb-3 fade-in">Technical Specifications</h2>
    <div style="overflow-x:auto;" class="fade-in">
      <table class="specs-table">
        <tbody>
          {specs_rows}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="exploded-wrap fade-in">
      <h3>Inside the Package — Exploded View</h3>
      <p>Hover or click each layer to understand how the IC is built for reliability in Indian operating conditions.</p>
      <div class="exploded-stages">
        <div class="exploded-svg">
          {exploded_svg(p['name'], p['svg_pkg'])}
        </div>
        <ul class="exploded-list">
          <li><strong>Layer 01</strong><span>Epoxy Molding Compound — protects die and wires from moisture, dust and mechanical stress.</span></li>
          <li><strong>Layer 02</strong><span>Silicon Die — contains the controller, power MOSFET and protection circuitry.</span></li>
          <li><strong>Layer 03</strong><span>Bonding Wires — connect die pads to lead frame for power and signal paths.</span></li>
          <li><strong>Layer 04</strong><span>Lead Frame & Pins — copper alloy frame for heat spreading and PCB mounting.</span></li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <h2 class="section-title mb-3 fade-in">Application Circuit Overview</h2>
    <p class="section-subtitle mb-4 fade-in">Simplified reference schematic showing how {p['name']} fits into a typical power stage.</p>
    <div class="circuit-stage fade-in">
      <div class="circuit-svg">
        {circuit_svg(p['name'])}
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2 class="section-title mb-3 fade-in">Application Scenarios</h2>
    <div class="card-grid fade-in">
      {app_cards}
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <h2 class="section-title mb-3 fade-in">Request Information</h2>
    <div style="max-width:720px;" class="fade-in">
      <form action="https://formspree.io/f/xnqevwrb" method="POST">
        <div class="form-row">
          <div class="form-group"><label>Name *</label><input type="text" name="name" required></div>
          <div class="form-group"><label>Email *</label><input type="email" name="email" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Company</label><input type="text" name="company"></div>
          <div class="form-group"><label>Phone / WhatsApp</label><input type="text" name="phone"></div>
        </div>
        <div class="form-group">
          <label>Interested Product</label>
          <select name="product"><option>{p['name']}</option><option>Other / multiple</option></select>
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea name="message" rows="4" placeholder="Tell us your application, target price and annual volume."></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Send Inquiry</button>
      </form>
    </div>
  </div>
</section>

{footer()}
</body></html>
"""
    write(f"product-{p['id']}.html", detail_body)

# ============================================================
# APPLICATIONS
# ============================================================
applications = [
    ("Flood & High-Bay Lighting", "50-200W outdoor drivers with 100-440Vac input and 4kV/6kV surge.", "app-floodlight-opt.jpg", "YT2181GTE5, YT2302EHS7, YT3110EHS7"),
    ("Street Lighting", "Reliable isolated and non-isolated drivers for smart city infrastructure.", "unsplash-streetlight-opt.jpg", "YT2302EHS7, YT3110EHS7"),
    ("Ceiling Fan Light", "High-PF CV supply plus fan motor control for India fan-light combos.", "app-fanlight2-opt.png", "YT91002NH7, YT91011NH7"),
    ("E-Bike Display & Meter", "Wide-input 25-150Vdc buck converters for 2-wheeler dashboards.", "app-ebike-display-opt.jpg", "YTD2202DE8"),
    ("Panel & Downlight", "Linear and buck drivers for clean, flicker-free indoor lighting.", "unsplash-office-opt.jpg", "YT2173E8, YT2276EH8"),
    ("Adapter & SMPS", "Flyback CV/CC chargers and auxiliary supplies.", "unsplash-factory-opt.jpg", "YT62501X, YT5205AT5"),
]
app_cards_html = "".join(f"""
      <div class="app-card fade-in">
        <img src="{ASSETS}/img/{img}" alt="{title}">
        <div class="app-card-overlay">
          <h4>{title}</h4>
          <p>{desc}</p>
          <p style="font-size:0.8rem;margin-top:0.5rem;color:var(--accent);"><strong>Suggested ICs:</strong> {ics}</p>
        </div>
      </div>""" for title, desc, img, ics in applications)

apps_body = f"""{head("Applications - Grande Micro", "Power semiconductor applications for Indian lighting, appliances, e-mobility and industrial power.")}
<body>
{header("Applications")}

<section class="page-header">
  <div class="container">
    <h1 class="fade-in">Application Scenarios</h1>
    <p class="fade-in">Real-world power challenges in the Indian market and the Grande Micro ICs that solve them.</p>
  </div>
</section>

<section class="breadcrumb">
  <div class="container">
    <a href="index.html">Home</a> <span class="sep">/</span> <span>Applications</span>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="app-grid">
      {app_cards_html}
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="container">
    <h2>Have a new application in mind?</h2>
    <p>Our application engineers can tailor protection, thermal and EMI characteristics to your specific fixture or appliance.</p>
    <a href="contact.html" class="btn btn-white">Talk to an Engineer</a>
  </div>
</section>

{footer()}
</body></html>
"""
write("applications.html", apps_body)

# ============================================================
# ABOUT
# ============================================================
about_body = f"""{head("About Us - Grande Micro", "Wuxi Grandemicro Technology is a power semiconductor IC design company serving lighting, adapter, wireless power and energy harvesting markets.")}
<body>
{header("About")}

<section class="page-header">
  <div class="container">
    <h1 class="fade-in">About Grande Micro</h1>
    <p class="fade-in">Power electronics integration technology for a more energy-efficient world.</p>
  </div>
</section>

<section class="breadcrumb">
  <div class="container">
    <a href="index.html">Home</a> <span class="sep">/</span> <span>About</span>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="about-story fade-in">
      <div>
        <h2 class="section-title">Company Profile</h2>
        <p class="mb-2">Wuxi Grandemicro Technology Co., Ltd. (Grande Micro) is a fabless power semiconductor IC design company headquartered in Wuxi, Jiangsu, China. We deliver core control chips and technical solutions for smart lighting, high-efficiency low-power adapters, wireless power and energy harvesting.</p>
        <p class="mb-2">Our founding team comes from Analog Devices, Inc. and Giantec Semiconductor Inc., bringing deep expertise in system integration technology and continuous process improvement. We own multiple invention patents and maintain close partnerships with wafer fabs, packaging houses and test facilities.</p>
        <p>For the Indian market, we focus on LED drivers, AC-DC, DC-DC and BLDC controllers that withstand India's wide grid voltage, high surge conditions and cost-sensitive assembly environment.</p>
      </div>
      <div><img src="{ASSETS}/img/unsplash-factory-opt.jpg" alt="Grande Micro facility"></div>
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <div class="text-center mb-4 fade-in">
      <h2 class="section-title">Our Mission & Values</h2>
    </div>
    <div class="feature-grid fade-in">
      <div class="feature"><div class="feature-icon">🌱</div><div><h4>Mission</h4><p>Continuously improve energy utilization efficiency through innovative power electronics integration.</p></div></div>
      <div class="feature"><div class="feature-icon">🎯</div><div><h4>Customer First</h4><p>We respond quickly, optimize BOM cost and support customers from reference design to mass production.</p></div></div>
      <div class="feature"><div class="feature-icon">🔬</div><div><h4>Innovation</h4><p>Proprietary system integration technology and a growing patent portfolio.</p></div></div>
      <div class="feature"><div class="feature-icon">🤝</div><div><h4>Partnership</h4><p>Long-term relationships with foundries, OSATs and distributors ensure supply continuity.</p></div></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="text-center mb-4 fade-in">
      <h2 class="section-title">Company Milestones</h2>
    </div>
    <div class="timeline fade-in" style="max-width:700px;margin:0 auto;">
      <div class="timeline-item"><strong>2018</strong><p>Grande Micro founded in Wuxi, focusing on power semiconductor integration.</p></div>
      <div class="timeline-item"><strong>2020</strong><p>Launched first-generation LED driver IC families for Chinese and overseas markets.</p></div>
      <div class="timeline-item"><strong>2022</strong><p>Completed Series A financing and expanded R&D team.</p></div>
      <div class="timeline-item"><strong>2024</strong><p>Released India-specific LED driver and BLDC power supply solutions (YT2181GTE5, YT91002NH7 series).</p></div>
      <div class="timeline-item"><strong>2026</strong><p>Expanded India agent network and launched gmtne.com global brand site.</p></div>
    </div>
  </div>
</section>

{footer()}
</body></html>
"""
write("about.html", about_body)

# ============================================================
# CONTACT
# ============================================================
contact_body = f"""{head("Contact Us - Grande Micro", "Contact Grande Micro for power semiconductor samples, quotations and India market support.")}
<body>
{header("Contact")}

<section class="page-header">
  <div class="container">
    <h1 class="fade-in">Contact Us</h1>
    <p class="fade-in">Tell us about your project and we'll respond with product recommendations, samples and pricing.</p>
  </div>
</section>

<section class="breadcrumb">
  <div class="container">
    <a href="index.html">Home</a> <span class="sep">/</span> <span>Contact</span>
  </div>
</section>

<section class="section">
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;">
      <div class="fade-in">
        <h2 class="section-title mb-3">Get in Touch</h2>
        <p class="mb-3" style="color:var(--text-muted);">Our sales and application engineering teams are ready to support distributors, assemblers, lighting brands and appliance manufacturers across India.</p>
        <div class="feature mb-2"><div class="feature-icon">✉️</div><div><h4>Email</h4><p><a href="mailto:Sales@grandemicro.com">Sales@grandemicro.com</a></p></div></div>
        <div class="feature mb-2"><div class="feature-icon">📞</div><div><h4>Phone</h4><p><a href="tel:+8651085388846">+86-510-85388846</a></p></div></div>
        <div class="feature mb-2"><div class="feature-icon">📍</div><div><h4>Headquarters</h4><p>Wuxi Grandemicro Technology Co., Ltd.<br>530 Building A, Taihu Science Park, Wuxi, Jiangsu, China</p></div></div>
        <div class="feature mb-2"><div class="feature-icon">💬</div><div><h4>WhatsApp</h4><p><a href="https://wa.me/{WHATSAPP}" target="_blank">Chat with sales on WhatsApp</a></p></div></div>
      </div>
      <div class="fade-in">
        <form action="https://formspree.io/f/xnqevwrb" method="POST" style="background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:2rem;box-shadow:var(--shadow);">
          <div class="form-row">
            <div class="form-group"><label>Name *</label><input type="text" name="name" required></div>
            <div class="form-group"><label>Email *</label><input type="email" name="email" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Company</label><input type="text" name="company"></div>
            <div class="form-group"><label>Phone / WhatsApp</label><input type="text" name="phone"></div>
          </div>
          <div class="form-group">
            <label>Interested In</label>
            <select name="interest">
              <option>LED Driver ICs</option>
              <option>AC-DC / BLDC Power</option>
              <option>DC-DC Converters</option>
              <option>Power MOSFETs</option>
              <option>Custom Design Service</option>
            </select>
          </div>
          <div class="form-group">
            <label>Message *</label>
            <textarea name="message" rows="5" required placeholder="Please describe your application, target specs, estimated volume and any competitor reference."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Send Inquiry</button>
        </form>
      </div>
    </div>
  </div>
</section>

{footer()}
</body></html>
"""
write("contact.html", contact_body)
