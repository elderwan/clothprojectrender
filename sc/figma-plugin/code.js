// ============================================================
// CLOTH SHOP WIREFRAMES — Figma Plugin
// Luxury Minimalist E-Commerce | Zara / Chanel Style | 1440px
// ui-ux-pro-max: Bodoni Moda / Georgia + Jost / Inter
// Monochrome palette | High whitespace | Editorial layout
// ============================================================

(async () => {
  // ── FONTS ─────────────────────────────────────────────────
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  let hasSerif = false;
  try {
    await figma.loadFontAsync({ family: 'Georgia', style: 'Regular' });
    hasSerif = true;
  } catch (e) { /* Georgia unavailable, fall back to Inter */ }

  // ── FIND OR CREATE TARGET PAGE ─────────────────────────────
  const PAGE_NAME = 'cloth shop pages';
  let page = figma.root.children.find(p => p.name === PAGE_NAME);
  if (!page) { page = figma.createPage(); page.name = PAGE_NAME; }
  figma.currentPage = page;

  // ── CONSTANTS ──────────────────────────────────────────────
  const W        = 1440;
  const MARGIN   = 140;
  const CONTENT_W = W - MARGIN * 2; // 1160
  const GAP      = 120;
  const NAV_H    = 76;
  const SIDE_W   = 260;
  const IMG_H    = 280; // standard product image height

  // ── COLOURS ────────────────────────────────────────────────
  const BLACK    = { r: 0,    g: 0,    b: 0    };
  const WHITE    = { r: 1,    g: 1,    b: 1    };
  const G_LIGHT  = { r: 0.96, g: 0.96, b: 0.96 };
  const G_DARK   = { r: 0.45, g: 0.45, b: 0.45 };
  const BORDER   = { r: 0.88, g: 0.88, b: 0.88 };
  const DARK_BG  = { r: 0.08, g: 0.08, b: 0.08 };
  const DARK_HL  = { r: 0.18, g: 0.18, b: 0.18 };
  const WHITE_DIM= { r: 0.55, g: 0.55, b: 0.55 };

  // ── LAYOUT STATE ───────────────────────────────────────────
  let curY = 0;

  // ─────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────

  function mkFrame(name, height) {
    const f = figma.createFrame();
    f.name = name;
    f.resize(W, height);
    f.x = 0; f.y = curY;
    f.fills = [{ type: 'SOLID', color: WHITE }];
    f.clipsContent = true;
    curY += height + GAP;
    page.appendChild(f);
    return f;
  }

  function addRect(parent, x, y, w, h, opts = {}) {
    const r = figma.createRectangle();
    r.x = x; r.y = y;
    r.resize(Math.max(w, 2), Math.max(h, 1));
    if (opts.name) r.name = opts.name;
    r.fills = opts.fill !== undefined ? [{ type: 'SOLID', color: opts.fill }] : [];
    if (opts.stroke) {
      r.strokes = [{ type: 'SOLID', color: opts.stroke }];
      r.strokeWeight = opts.sw || 1;
      r.strokeAlign = 'INSIDE';
    }
    parent.appendChild(r);
    return r;
  }

  function addText(parent, x, y, str, opts = {}) {
    if (!str) return null;
    const t = figma.createText();
    if (opts.serif && hasSerif) {
      t.fontName = { family: 'Georgia', style: 'Regular' };
    } else {
      t.fontName = { family: 'Inter', style: opts.bold ? 'Bold' : opts.medium ? 'Medium' : 'Regular' };
    }
    t.fontSize = opts.size || 13;
    t.characters = String(str);
    t.fills = [{ type: 'SOLID', color: opts.color || BLACK }];
    t.x = x; t.y = y;
    if (opts.w) { t.textAutoResize = 'HEIGHT'; t.resize(Math.max(opts.w, 1), Math.max(t.height, 16)); }
    if (opts.align) t.textAlignHorizontal = opts.align;
    parent.appendChild(t);
    return t;
  }

  function hLine(parent, x, y, w) {
    addRect(parent, x, y, w, 1, { fill: BORDER });
  }

  function imgBox(parent, x, y, w, h, label) {
    addRect(parent, x, y, w, h, { fill: G_LIGHT });
    if (label) {
      addText(parent, x, y + Math.round(h / 2) - 7,
        '[ ' + label + ' ]', { size: 10, color: G_DARK, align: 'CENTER', w: w });
    }
  }

  // Zara-style 3-zone navigation: left categories | center logo | right actions
  function nav(parent, leftLinks, rightLinks) {
    const left  = leftLinks  || ['WOMEN', 'MEN', 'KIDS'];
    const right = rightLinks || ['Search', 'Account', 'Cart'];
    addRect(parent, 0, 0, W, NAV_H, { fill: WHITE });
    hLine(parent, 0, NAV_H, W);
    // Center logo using textAlignHorizontal so it's pixel-perfect regardless of label length
    addText(parent, 0, 27, 'MAISON', { serif: true, size: 20, align: 'CENTER', w: W });
    let lx = MARGIN;
    for (const l of left) {
      addText(parent, lx, 29, l, { size: 11, bold: true });
      lx += l.length * 9 + 28;
    }
    // Right links spaced from the right edge
    let rx = W - MARGIN;
    for (let i = right.length - 1; i >= 0; i--) {
      const tw = right[i].length * 7 + 4;
      rx -= tw;
      addText(parent, rx, 29, right[i], { size: 11 });
      rx -= 28;
    }
  }

  // Multi-column editorial footer
  function foot(parent, fH) {
    const fY = fH - 120;
    hLine(parent, 0, fY, W);
    addText(parent, MARGIN,       fY + 28, 'MAISON',               { serif: true, size: 16 });
    addText(parent, MARGIN,       fY + 54, 'Luxury since 2026',    { size: 11, color: G_DARK });
    addText(parent, MARGIN + 480, fY + 28, 'EXPLORE',              { size: 11, bold: true });
    addText(parent, MARGIN + 480, fY + 48, 'Women  Men  Kids',     { size: 11, color: G_DARK });
    addText(parent, MARGIN + 840, fY + 28, 'ACCOUNT',              { size: 11, bold: true });
    addText(parent, MARGIN + 840, fY + 48, 'Sign In  Register  Orders', { size: 11, color: G_DARK });
    addText(parent, MARGIN,       fY + 90, '© 2026 MAISON. All rights reserved.', { size: 10, color: G_DARK });
  }

  // Section overline label + rule; returns next content y
  // lineW defaults to CONTENT_W but can be overridden (e.g. ADM_MW for admin pages)
  function secTitle(parent, x, y, label, lineW) {
    addText(parent, x, y, label, { size: 11, bold: true, color: G_DARK });
    hLine(parent, x, y + 22, lineW || CONTENT_W);
    return y + 44;
  }

  // Black fill primary button (Zara style) — text centered via textAlignHorizontal
  function btnPrimary(parent, x, y, label, w, h) {
    const bw = w || 200; const bh = h || 48;
    addRect(parent, x, y, bw, bh, { fill: BLACK });
    addText(parent, x, y + Math.round((bh - 13) / 2), label,
      { size: 11, bold: true, color: WHITE, align: 'CENTER', w: bw });
  }

  // Outline ghost button (Chanel style) — text centered
  function btn(parent, x, y, label, w, h) {
    const bw = w || 160; const bh = h || 44;
    addRect(parent, x, y, bw, bh, { stroke: BLACK, sw: 1 });
    addText(parent, x, y + Math.round((bh - 13) / 2), label,
      { size: 11, bold: true, align: 'CENTER', w: bw });
  }

  // Form input field
  function field(parent, x, y, label, w) {
    const fw = w || 360;
    addText(parent, x, y, label, { size: 10, color: G_DARK });
    addRect(parent, x, y + 16, fw, 44, { stroke: BORDER });
  }

  // Borderless portrait product card (Zara style)
  function productCard(parent, x, y, cardW, name, price) {
    imgBox(parent, x, y, cardW, IMG_H, '');
    addText(parent, x, y + IMG_H + 12, name, { size: 13 });
    addText(parent, x, y + IMG_H + 30, price, { size: 13, color: G_DARK });
  }

  // Dark sidebar for admin pages
  function adminSidebar(parent, H, activeIdx) {
    const ai = activeIdx || 0;
    addRect(parent, 0, 0, SIDE_W, H, { fill: DARK_BG });
    // Logo and subtitle centered in sidebar
    addText(parent, 0, 30, 'MAISON',      { serif: true, size: 16, color: WHITE, align: 'CENTER', w: SIDE_W });
    addText(parent, 0, 56, 'BACK OFFICE', { size: 9, bold: true, color: WHITE_DIM, align: 'CENTER', w: SIDE_W });
    hLine(parent, 0, 78, SIDE_W);
    ['Dashboard', 'Products', 'Orders', 'Customers', 'Settings'].forEach((item, i) => {
      if (i === ai) addRect(parent, 0, 88 + i * 52, SIDE_W, 44, { fill: DARK_HL });
      addText(parent, 28, 99 + i * 52, item, { size: 13, color: WHITE });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 01 — HOME PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 1320;
    const f = mkFrame('01 — Home Page', H);
    nav(f);

    // Full-bleed editorial hero
    imgBox(f, 0, NAV_H, W, 580, 'Hero Campaign');
    addText(f, MARGIN, NAV_H + 440, 'NEW COLLECTION', { size: 11, bold: true, color: WHITE });
    addText(f, MARGIN, NAV_H + 464, 'Spring / Summer 2026', { serif: true, size: 48, color: WHITE });
    addText(f, MARGIN, NAV_H + 528, 'DISCOVER', { size: 11, bold: true, color: WHITE });
    addRect(f, MARGIN, NAV_H + 548, 64, 1, { fill: WHITE });

    // New Arrivals: 4-column borderless grid
    let y = NAV_H + 580 + 80;
    y = secTitle(f, MARGIN, y, 'NEW ARRIVALS');
    const col4W = Math.floor((CONTENT_W - 3 * 24) / 4);
    const names4 = ['Cashmere Coat', 'Silk Blouse', 'Wide Trousers', 'Wool Blazer'];
    const prices4 = ['$285.00', '$165.00', '$195.00', '$245.00'];
    names4.forEach((name, i) => {
      productCard(f, MARGIN + i * (col4W + 24), y, col4W, name, prices4[i]);
    });
    y += IMG_H + 56;

    // Featured editorial: 2-column asymmetric
    y = secTitle(f, MARGIN, y, 'THE EDIT');
    imgBox(f, MARGIN, y, 560, 320, 'Editorial 1');
    imgBox(f, MARGIN + 600, y, 440, 148, 'Editorial 2');
    imgBox(f, MARGIN + 600, y + 172, 440, 148, 'Editorial 3');
    addText(f, MARGIN, y + 332, 'The New Classics', { serif: true, size: 24 });
    addText(f, MARGIN, y + 364, 'Elevated everyday essentials for the modern wardrobe.',
      { size: 13, color: G_DARK });

    foot(f, H);
  }

  // ═══════════════════════════════════════════════════════════
  // 02 — PRODUCT LIST PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 1140;
    const f = mkFrame('02 — Product List Page', H);
    nav(f);

    addText(f, MARGIN, NAV_H + 32, 'Home  /  Women', { size: 11, color: G_DARK });
    addText(f, MARGIN, NAV_H + 52, 'WOMEN', { serif: true, size: 36 });

    // Horizontal filter bar (Zara style, no sidebar)
    const filterY = NAV_H + 104;
    hLine(f, MARGIN, filterY, CONTENT_W);
    const filters = ['All', 'Coats', 'Dresses', 'Tops', 'Trousers', 'Accessories'];
    let fx = MARGIN;
    filters.forEach((filter, i) => {
      const fw = filter.length * 8 + 28;
      if (i === 0) {
        addRect(f, fx, filterY + 8, fw, 32, { fill: BLACK });
        addText(f, fx + 10, filterY + 16, filter, { size: 11, bold: true, color: WHITE });
      } else {
        addText(f, fx + 10, filterY + 16, filter, { size: 11 });
      }
      fx += fw + 8;
    });
    addText(f, W - MARGIN - 100, filterY + 16, 'Sort: Newest', { size: 11, color: G_DARK });
    hLine(f, MARGIN, filterY + 48, CONTENT_W);

    // 4-column x 2-row grid
    const col4W = Math.floor((CONTENT_W - 3 * 24) / 4);
    let gy = filterY + 72;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const n = row * 4 + col + 1;
        productCard(f, MARGIN + col * (col4W + 24), gy, col4W,
          'Product Name ' + n, '$' + (n * 45 + 40) + '.00');
      }
      gy += IMG_H + 52 + (row === 0 ? 28 : 0);
    }
    gy += 16;

    // Pagination
    hLine(f, MARGIN, gy, CONTENT_W);
    [1, 2, 3].forEach((p, i) => {
      if (i === 0) {
        addRect(f, MARGIN + i * 44, gy + 20, 36, 36, { fill: BLACK });
        addText(f, MARGIN + i * 44, gy + 26, String(p), { size: 13, color: WHITE, align: 'CENTER', w: 36 });
      } else {
        addRect(f, MARGIN + i * 44, gy + 20, 36, 36, { stroke: BORDER });
        addText(f, MARGIN + i * 44, gy + 26, String(p), { size: 13, align: 'CENTER', w: 36 });
      }
    });

    foot(f, H);
  }

  // ═══════════════════════════════════════════════════════════
  // 03 — PRODUCT DETAIL PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 1440;
    const f = mkFrame('03 — Product Detail Page', H);
    nav(f);

    addText(f, MARGIN, NAV_H + 24, 'Home  /  Women  /  Coats', { size: 11, color: G_DARK });

    // Left: large portrait product image
    const pImgW = 620; const pImgH = 720;
    imgBox(f, MARGIN, NAV_H + 56, pImgW, pImgH, 'Product Image');
    for (let t = 0; t < 4; t++) {
      imgBox(f, MARGIN + t * 96, NAV_H + 56 + pImgH + 16, 80, 80, '');
    }

    // Right: product info panel
    const rX = MARGIN + pImgW + 80;
    const rW = CONTENT_W - pImgW - 80;
    let ry = NAV_H + 56;

    addText(f, rX, ry, 'MAISON', { size: 10, bold: true, color: G_DARK });
    ry += 24;
    addText(f, rX, ry, 'Oversized Wool Coat', { serif: true, size: 28 });
    ry += 44;
    addText(f, rX, ry, '$285.00', { size: 20 });
    ry += 40;
    hLine(f, rX, ry, rW);
    ry += 24;

    // Size selector
    addText(f, rX, ry, 'SIZE', { size: 11, bold: true });
    addText(f, rX, ry, 'Size Guide', { size: 11, color: G_DARK, align: 'RIGHT', w: rW });
    ry += 24;
    ['XS', 'S', 'M', 'L', 'XL'].forEach((sz, i) => {
      const sx = rX + i * 52;
      if (i === 2) {
        addRect(f, sx, ry, 44, 44, { fill: BLACK });
        addText(f, sx, ry + 14, sz, { size: 12, color: WHITE, align: 'CENTER', w: 44 });
      } else {
        addRect(f, sx, ry, 44, 44, { stroke: BORDER });
        addText(f, sx, ry + 14, sz, { size: 12, align: 'CENTER', w: 44 });
      }
    });
    ry += 64;

    btnPrimary(f, rX, ry, 'ADD TO CART', rW, 52);
    ry += 68;
    btn(f, rX, ry, 'ADD TO WISHLIST', rW, 44);
    ry += 60;
    hLine(f, rX, ry, rW);
    ry += 24;

    addText(f, rX, ry, 'DESCRIPTION', { size: 11, bold: true });
    ry += 22;
    addText(f, rX, ry,
      'A relaxed oversized silhouette in Italian wool blend. Drop shoulders, single-button closure, full lining.',
      { size: 13, color: G_DARK, w: rW });
    ry += 56;

    addText(f, rX, ry, 'COMPOSITION & CARE', { size: 11, bold: true });
    ry += 22;
    addText(f, rX, ry, '90% Wool  10% Polyamide  —  Dry clean only.', { size: 13, color: G_DARK });

    // Related products row
    const relY = NAV_H + 56 + pImgH + 80 + 120;
    hLine(f, MARGIN, relY - 16, CONTENT_W);
    const relStart = secTitle(f, MARGIN, relY, 'YOU MAY ALSO LIKE');
    const rel4W = Math.floor((CONTENT_W - 3 * 24) / 4);
    for (let i = 0; i < 4; i++) {
      productCard(f, MARGIN + i * (rel4W + 24), relStart,
        rel4W, 'Related Product ' + (i + 1), '$' + (i + 1) * 95 + '.00');
    }

    foot(f, H);
  }

  // ═══════════════════════════════════════════════════════════
  // 04 — LOGIN PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 760;
    const f = mkFrame('04 — Login Page', H);
    nav(f, ['Shop'], ['Register', 'Cart']);

    const fX = W / 2 - 220;
    const fW = 440;

    addText(f, W / 2 - 36, NAV_H + 48, 'MAISON', { serif: true, size: 20 });
    hLine(f, fX, NAV_H + 88, fW);
    addText(f, fX, NAV_H + 108, 'SIGN IN', { bold: true, size: 18 });
    addText(f, fX, NAV_H + 134, 'Welcome back', { size: 13, color: G_DARK });

    field(f, fX, NAV_H + 172, 'Email Address', fW);
    field(f, fX, NAV_H + 252, 'Password', fW);
    addText(f, fX + fW - 112, NAV_H + 308, 'Forgot password?', { size: 11, color: G_DARK });

    btnPrimary(f, fX, NAV_H + 336, 'SIGN IN', fW, 52);

    hLine(f, fX, NAV_H + 412, fW);
    addText(f, fX, NAV_H + 432, 'New to MAISON?', { size: 13, color: G_DARK });
    addText(f, fX, NAV_H + 456, 'Create an account', { size: 13, bold: true });

    foot(f, H);
  }

  // ═══════════════════════════════════════════════════════════
  // 05 — REGISTER PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 880;
    const f = mkFrame('05 — Register Page', H);
    nav(f, ['Shop'], ['Sign In', 'Cart']);

    const fX = W / 2 - 220;
    const fW = 440;

    addText(f, W / 2 - 36, NAV_H + 48, 'MAISON', { serif: true, size: 20 });
    hLine(f, fX, NAV_H + 88, fW);
    addText(f, fX, NAV_H + 108, 'CREATE ACCOUNT', { bold: true, size: 18 });
    addText(f, fX, NAV_H + 134, 'Join MAISON today', { size: 13, color: G_DARK });

    field(f, fX, NAV_H + 172, 'Full Name', fW);
    field(f, fX, NAV_H + 252, 'Email Address', fW);
    field(f, fX, NAV_H + 332, 'Password', fW);
    field(f, fX, NAV_H + 412, 'Confirm Password', fW);

    btnPrimary(f, fX, NAV_H + 496, 'CREATE ACCOUNT', fW, 52);

    hLine(f, fX, NAV_H + 572, fW);
    addText(f, fX, NAV_H + 592, 'Already a member?', { size: 13, color: G_DARK });
    addText(f, fX, NAV_H + 616, 'Sign In', { size: 13, bold: true });

    foot(f, H);
  }

  // ═══════════════════════════════════════════════════════════
  // 06 — USER PROFILE PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 880;
    const f = mkFrame('06 — User Profile Page', H);
    nav(f, ['WOMEN', 'MEN', 'KIDS'], ['Account', 'Cart (0)']);

    addText(f, MARGIN, NAV_H + 32, 'MY ACCOUNT', { serif: true, size: 36 });
    hLine(f, MARGIN, NAV_H + 80, CONTENT_W);

    // Account info block
    addText(f, MARGIN, NAV_H + 104, 'ACCOUNT INFORMATION', { size: 11, bold: true });
    hLine(f, MARGIN, NAV_H + 126, 440);
    [
      ['Full Name', 'John Doe'],
      ['Email', 'john.doe@email.com'],
      ['Phone', '+1 (555) 000-0000'],
      ['Member Since', 'January 2026'],
    ].forEach(([lbl, val], i) => {
      addText(f, MARGIN, NAV_H + 140 + i * 44, lbl, { size: 10, color: G_DARK });
      addText(f, MARGIN, NAV_H + 156 + i * 44, val, { size: 13 });
    });
    btn(f, MARGIN, NAV_H + 332, 'EDIT PROFILE', 180, 44);
    btn(f, MARGIN + 196, NAV_H + 332, 'CHANGE PASSWORD', 208, 44);

    // Recent orders table
    let y = NAV_H + 412;
    addText(f, MARGIN, y, 'RECENT ORDERS', { size: 11, bold: true });
    hLine(f, MARGIN, y + 22, CONTENT_W);
    y += 38;

    const roCols = ['Order #', 'Date', 'Items', 'Total', 'Status'];
    const roXs = [MARGIN, MARGIN+160, MARGIN+340, MARGIN+500, MARGIN+660];
    addRect(f, MARGIN, y, CONTENT_W, 40, { fill: G_LIGHT });
    roCols.forEach((c, i) => addText(f, roXs[i] + 8, y + 13, c, { size: 11, bold: true }));
    addText(f, MARGIN + CONTENT_W - 96, y + 13, 'Action', { size: 11, bold: true });
    y += 40;

    [
      ['#00120', 'Jan 15, 2026', '3', '$285.00', 'Delivered'],
      ['#00118', 'Jan 10, 2026', '1', '$95.00',  'Delivered'],
      ['#00112', 'Dec 28, 2025', '2', '$190.00', 'Delivered'],
    ].forEach(row => {
      hLine(f, MARGIN, y, CONTENT_W);
      row.forEach((v, i) => addText(f, roXs[i] + 8, y + 14, v, { size: 12 }));
      btn(f, MARGIN + CONTENT_W - 96, y + 6, 'View', 88, 28);
      y += 48;
    });

    btn(f, MARGIN, y + 24, 'VIEW ALL ORDERS', 200, 44);

    foot(f, H);
  }

  // ═══════════════════════════════════════════════════════════
  // 07 — ORDER HISTORY PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 860;
    const f = mkFrame('07 — Order History Page', H);
    nav(f, ['WOMEN', 'MEN', 'KIDS'], ['Account', 'Cart (0)']);

    addText(f, MARGIN, NAV_H + 32, 'ORDER HISTORY', { serif: true, size: 36 });
    hLine(f, MARGIN, NAV_H + 80, CONTENT_W);

    const ohCols = ['Order #', 'Date', 'Items', 'Total', 'Status'];
    const ohXs   = [MARGIN, MARGIN+160, MARGIN+340, MARGIN+500, MARGIN+660];
    addRect(f, MARGIN, NAV_H + 100, CONTENT_W, 40, { fill: G_LIGHT });
    ohCols.forEach((c, i) => addText(f, ohXs[i] + 8, NAV_H + 112, c, { size: 11, bold: true }));
    addText(f, MARGIN + CONTENT_W - 96, NAV_H + 112, 'Action', { size: 11, bold: true });

    const ohStatus = ['Delivered', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Processing'];
    for (let row = 0; row < 6; row++) {
      const ry = NAV_H + 140 + row * 52;
      hLine(f, MARGIN, ry, CONTENT_W);
      ['#001' + (20 + row), 'Jan ' + (row + 5) + ', 2026',
       String(row + 1), '$' + (row + 1) * 95 + '.00', ohStatus[row]]
        .forEach((v, i) => addText(f, ohXs[i] + 8, ry + 18, v, { size: 12 }));
      btn(f, MARGIN + CONTENT_W - 96, ry + 11, 'View', 84, 30);
    }

    // Pagination
    const pgY = NAV_H + 460;
    hLine(f, MARGIN, pgY, CONTENT_W);
    [1, 2, 3].forEach((p, i) => {
      if (i === 0) {
        addRect(f, MARGIN + i * 44, pgY + 20, 36, 36, { fill: BLACK });
        addText(f, MARGIN + i * 44, pgY + 26, String(p), { size: 13, color: WHITE, align: 'CENTER', w: 36 });
      } else {
        addRect(f, MARGIN + i * 44, pgY + 20, 36, 36, { stroke: BORDER });
        addText(f, MARGIN + i * 44, pgY + 26, String(p), { size: 13, align: 'CENTER', w: 36 });
      }
    });

    foot(f, H);
  }

  // ═══════════════════════════════════════════════════════════
  // 08 — CART PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 960;
    const f = mkFrame('08 — Cart Page', H);
    nav(f, ['WOMEN', 'MEN', 'KIDS'], ['Account', 'Cart (3)']);

    addText(f, MARGIN, NAV_H + 32, 'SHOPPING BAG', { serif: true, size: 36 });
    addText(f, MARGIN, NAV_H + 80, '3 items', { size: 11, color: G_DARK });
    hLine(f, MARGIN, NAV_H + 100, CONTENT_W);

    const cartW = 700;
    const sumX  = MARGIN + cartW + 80;
    const sumW  = CONTENT_W - cartW - 80;

    // Cart line items
    for (let i = 0; i < 3; i++) {
      const iy = NAV_H + 120 + i * 168;
      imgBox(f, MARGIN, iy, 120, 150, '');
      addText(f, MARGIN + 144, iy,      'MAISON',                     { size: 10, bold: true, color: G_DARK });
      addText(f, MARGIN + 144, iy + 20, 'Product Name ' + (i + 1),    { size: 15 });
      addText(f, MARGIN + 144, iy + 44, 'Size: M   Colour: Black',    { size: 12, color: G_DARK });
      addText(f, MARGIN + 144, iy + 68, '$' + (i + 1) * 95 + '.00',   { size: 14 });
      // Qty stepper — centered glyphs in box
      addText(f, MARGIN + 144, iy + 100, 'Qty:', { size: 11, color: G_DARK });
      addRect(f, MARGIN + 182, iy + 96, 36, 36, { stroke: BORDER });
      addText(f, MARGIN + 182, iy + 102, '-', { size: 16, align: 'CENTER', w: 36 });
      addText(f, MARGIN + 224, iy + 104, '1', { size: 13, align: 'CENTER', w: 20 });
      addRect(f, MARGIN + 248, iy + 96, 36, 36, { stroke: BORDER });
      addText(f, MARGIN + 248, iy + 102, '+', { size: 16, align: 'CENTER', w: 36 });
      addText(f, MARGIN + cartW - 56, iy, 'Remove', { size: 11, color: G_DARK });
      hLine(f, MARGIN, iy + 158, cartW);
    }

    // Order summary
    addText(f, sumX, NAV_H + 120, 'ORDER SUMMARY', { size: 11, bold: true });
    hLine(f, sumX, NAV_H + 142, sumW);
    [['Subtotal', '$285.00'], ['Shipping', 'Complimentary'], ['Tax (10%)', '$28.50']].forEach(([lbl, val], i) => {
      const ry = NAV_H + 162 + i * 40;
      addText(f, sumX, ry, lbl, { size: 12 });
      addText(f, sumX, ry, val, { size: 12, align: 'RIGHT', w: sumW });
    });
    hLine(f, sumX, NAV_H + 296, sumW);
    addText(f, sumX, NAV_H + 312, 'Total',    { bold: true, size: 16 });
    addText(f, sumX, NAV_H + 312, '$313.50',  { bold: true, size: 16, align: 'RIGHT', w: sumW });
    btnPrimary(f, sumX, NAV_H + 364, 'CONFIRM ORDER', sumW, 52);
    addText(f, sumX, NAV_H + 432, 'Complimentary delivery on orders above $200',
      { size: 11, color: G_DARK, w: sumW });

    foot(f, H);
  }

  // ═══════════════════════════════════════════════════════════
  // 09 — ORDER CONFIRMATION PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 680;
    const f = mkFrame('09 — Order Confirmation Page', H);
    nav(f, ['WOMEN', 'MEN', 'KIDS'], ['My Account']);

    const cx = W / 2;

    addText(f, cx - 220, NAV_H + 60, 'ORDER CONFIRMED',
      { serif: true, size: 40, align: 'CENTER', w: 440 });
    hLine(f, cx - 200, NAV_H + 116, 400);
    addText(f, cx - 220, NAV_H + 132, 'Thank you for shopping with MAISON.',
      { size: 14, color: G_DARK, align: 'CENTER', w: 440 });
    addText(f, cx - 220, NAV_H + 162, 'Order Number: #001234',
      { size: 14, bold: true, align: 'CENTER', w: 440 });
    addText(f, cx - 220, NAV_H + 190,
      'A confirmation has been sent to your email address.',
      { size: 12, color: G_DARK, align: 'CENTER', w: 440 });

    btnPrimary(f, cx - 120, NAV_H + 248, 'CONTINUE SHOPPING', 240, 52);
    btn(f, cx - 100, NAV_H + 320, 'VIEW MY ORDERS', 200, 44);

    foot(f, H);
  }

  // ═══════════════════════════════════════════════════════════
  // 10 — ADMIN LOGIN PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 660;
    const f = mkFrame('10 — Admin Login Page', H);
    addRect(f, 0, 0, W, H, { fill: G_LIGHT });

    const cX = W / 2 - 240; const cW = 480;
    addRect(f, cX, 80, cW, 480, { fill: WHITE, stroke: BORDER });

    addText(f, cX, 116, 'MAISON',      { serif: true, size: 20, align: 'CENTER', w: cW });
    addText(f, cX, 148, 'Back Office', { size: 11, color: G_DARK, align: 'CENTER', w: cW });
    hLine(f, cX + 28, 174, cW - 56);

    addText(f, cX + 28, 196, 'ADMINISTRATOR SIGN IN', { bold: true, size: 14 });

    field(f, cX + 28, 232, 'Admin Email', cW - 56);
    field(f, cX + 28, 316, 'Password', cW - 56);

    btnPrimary(f, cX + 28, 400, 'ACCESS DASHBOARD', cW - 56, 52);

    hLine(f, cX + 28, 476, cW - 56);
    addText(f, cX + 28, 494, 'Back to main site', { size: 11, color: G_DARK });
  }

  // ═══════════════════════════════════════════════════════════
  // 11 — ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════
  {
    const H = 920;
    const f = mkFrame('11 — Admin Dashboard', H);
    adminSidebar(f, H, 0);

    const MX = SIDE_W + 40;
    const MW = W - SIDE_W - 80;

    addText(f, MX, 32, 'Dashboard', { serif: true, size: 26 });
    hLine(f, MX, 68, MW);

    // KPI summary cards
    const kpiData = [
      ['TOTAL PRODUCTS', '48'],
      ['TOTAL ORDERS', '127'],
      ['TOTAL USERS', '89'],
      ['REVENUE', '$9,240'],
    ];
    const kW = Math.floor((MW - 60) / 4);
    kpiData.forEach(([lbl, val], i) => {
      const cx = MX + i * (kW + 20);
      addRect(f, cx, 84, kW, 100, { stroke: BORDER });
      addText(f, cx + 16, 104, lbl, { size: 9, bold: true, color: G_DARK });
      addText(f, cx + 16, 126, val, { serif: true, size: 28 });
    });

    // Recent orders table
    let y = 220;
    addText(f, MX, y, 'RECENT ORDERS', { size: 11, bold: true });
    hLine(f, MX, y + 22, MW);
    y += 38;

    const dCols = ['Order #', 'Customer', 'Date', 'Total', 'Status'];
    const dXs   = [MX, MX+130, MX+310, MX+470, MX+620];
    addRect(f, MX, y, MW, 40, { fill: G_LIGHT });
    dCols.forEach((c, i) => addText(f, dXs[i] + 8, y + 13, c, { size: 11, bold: true }));
    addText(f, MX + MW - 84, y + 13, 'Action', { size: 11, bold: true });
    y += 40;

    const dSts = ['Processing', 'Shipped', 'Delivered', 'Processing', 'Shipped'];
    for (let row = 0; row < 5; row++) {
      hLine(f, MX, y, MW);
      ['#001' + (20 + row), 'Jane Doe', 'Jan 2026', '$' + (row + 1) * 95 + '.00', dSts[row]]
        .forEach((v, i) => addText(f, dXs[i] + 8, y + 14, v, { size: 12 }));
      btn(f, MX + MW - 84, y + 8, 'View', 76, 28);
      y += 48;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 12 — PRODUCT MANAGEMENT PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 940;
    const f = mkFrame('12 — Product Management', H);
    adminSidebar(f, H, 1);

    const MX = SIDE_W + 40;
    const MW = W - SIDE_W - 80;

    addText(f, MX, 32, 'Product Management', { serif: true, size: 26 });
    btnPrimary(f, MX + MW - 168, 28, '+ ADD PRODUCT', 166, 40);
    hLine(f, MX, 72, MW);

    field(f, MX, 86, 'Search products...', 300);

    const pmCols = ['', 'Name', 'Category', 'Price', 'Stock'];
    const pmXs   = [MX, MX+80, MX+320, MX+540, MX+700];
    addRect(f, MX, 152, MW, 40, { fill: G_LIGHT });
    pmCols.forEach((c, i) => addText(f, pmXs[i] + 8, 164, c, { size: 11, bold: true }));
    addText(f, MX + MW - 152, 164, 'Actions', { size: 11, bold: true });

    const cats = ['Coats', 'Dresses', 'Tops', 'Trousers', 'Accessories', 'Knitwear', 'Shoes'];
    for (let row = 0; row < 7; row++) {
      const ry = 192 + row * 60;
      hLine(f, MX, ry, MW);
      imgBox(f, pmXs[0] + 8, ry + 8, 50, 44, '');
      ['Product ' + (row + 1), cats[row], '$' + (row + 1) * 95 + '.00', String((row + 1) * 4)]
        .forEach((v, i) => addText(f, pmXs[i + 1] + 8, ry + 22, v, { size: 12 }));
      btn(f, MX + MW - 152, ry + 16, 'Edit',   64, 30);
      btn(f, MX + MW -  80, ry + 16, 'Delete', 72, 30);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 13 — ADD PRODUCT PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 980;
    const f = mkFrame('13 — Add Product Page', H);
    adminSidebar(f, H, 1);

    const MX = SIDE_W + 40;
    const MW = W - SIDE_W - 80;
    const fW = 520;

    addText(f, MX, 32, 'Add New Product', { serif: true, size: 26 });
    hLine(f, MX, 68, MW);

    field(f, MX, 90, 'Product Name *', fW);
    addText(f, MX, 166, 'Description *', { size: 10, color: G_DARK });
    addRect(f, MX, 182, fW, 108, { stroke: BORDER });

    field(f, MX, 314, 'Price ($) *', fW);
    field(f, MX, 394, 'Category *', fW);
    field(f, MX, 474, 'Stock Quantity *', fW);

    addText(f, MX, 562, 'Product Image *', { size: 10, color: G_DARK });
    addRect(f, MX, 578, fW, 188, { stroke: BORDER });
    imgBox(f, MX + Math.round((fW - 144) / 2), 616, 144, 88, 'Upload Image');
    addText(f, MX, 714, 'Click to upload or drag and drop',
      { size: 11, color: G_DARK, align: 'CENTER', w: fW });

    btnPrimary(f, MX, 806, 'SAVE PRODUCT', 200, 48);
    btn(f, MX + 216, 806, 'CANCEL', 120, 48);
  }

  // ═══════════════════════════════════════════════════════════
  // 14 — ORDER MANAGEMENT PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 940;
    const f = mkFrame('14 — Order Management', H);
    adminSidebar(f, H, 2);

    const MX = SIDE_W + 40;
    const MW = W - SIDE_W - 80;

    addText(f, MX, 32, 'Order Management', { serif: true, size: 26 });
    hLine(f, MX, 68, MW);

    // Status filter tabs
    const tabs = ['All (127)', 'Processing (12)', 'Shipped (34)', 'Delivered (68)', 'Cancelled (13)'];
    let tabX = MX;
    tabs.forEach((tab, i) => {
      const tw = tab.length * 7 + 28;
      if (i === 0) {
        addRect(f, tabX, 82, tw, 36, { fill: BLACK });
        addText(f, tabX + 10, 92, tab, { size: 11, bold: true, color: WHITE });
      } else {
        addRect(f, tabX, 82, tw, 36, { stroke: BORDER });
        addText(f, tabX + 10, 92, tab, { size: 11 });
      }
      tabX += tw + 8;
    });

    const omCols = ['Order #', 'Customer', 'Date', 'Items', 'Total', 'Status'];
    const omXs   = [MX, MX+120, MX+290, MX+440, MX+560, MX+700];
    addRect(f, MX, 132, MW, 40, { fill: G_LIGHT });
    omCols.forEach((c, i) => addText(f, omXs[i] + 8, 144, c, { size: 11, bold: true }));
    addText(f, MX + MW - 84, 144, 'Action', { size: 11, bold: true });

    const omSts = ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Processing', 'Shipped', 'Delivered'];
    for (let row = 0; row < 7; row++) {
      const ry = 172 + row * 52;
      hLine(f, MX, ry, MW);
      ['#001' + (row + 20), 'Customer Name', 'Jan 2026',
       String(row + 1), '$' + (row + 1) * 95 + '.00', omSts[row]]
        .forEach((v, i) => addText(f, omXs[i] + 8, ry + 18, v, { size: 12 }));
      btn(f, MX + MW - 84, ry + 12, 'View', 74, 28);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 15 — CUSTOMER MANAGEMENT PAGE
  // ═══════════════════════════════════════════════════════════
  {
    const H = 920;
    const f = mkFrame('15 — Customer Management', H);
    adminSidebar(f, H, 3);

    const MX = SIDE_W + 40;
    const MW = W - SIDE_W - 80;

    addText(f, MX, 32, 'Customer Management', { serif: true, size: 26 });
    hLine(f, MX, 68, MW);

    field(f, MX, 82, 'Search customers...', 320);

    const cmCols = ['#', 'Full Name', 'Email', 'Joined', 'Orders'];
    const cmXs   = [MX, MX+60, MX+260, MX+540, MX+720];
    addRect(f, MX, 152, MW, 40, { fill: G_LIGHT });
    cmCols.forEach((c, i) => addText(f, cmXs[i] + 8, 164, c, { size: 11, bold: true }));
    addText(f, MX + MW - 88, 164, 'Action', { size: 11, bold: true });

    for (let row = 0; row < 8; row++) {
      const ry = 192 + row * 52;
      hLine(f, MX, ry, MW);
      [String(row + 1), 'Customer ' + (row + 1),
       'user' + (row + 1) + '@email.com', 'Jan 2026', String(row + 2)]
        .forEach((v, i) => addText(f, cmXs[i] + 8, ry + 18, v, { size: 12 }));
      btn(f, MX + MW - 88, ry + 12, 'View', 80, 28);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 16 — USER FLOW DIAGRAM
  // ═══════════════════════════════════════════════════════════
  {
    const H = 900;
    const f = mkFrame('16 — User Flow Diagram', H);

    addText(f, MARGIN, 40, 'User Flow Diagram', { serif: true, size: 32 });
    hLine(f, MARGIN, 84, CONTENT_W);

    const BOX_W = 140; const BOX_H = 48;

    function flowBox(parent, x, y, label) {
      addRect(parent, x, y, BOX_W, BOX_H, { stroke: BLACK, sw: 1.5 });
      addText(parent, x + 12, y + 16, label, { size: 11, medium: true });
    }
    function arrow(parent, fromX, fromY, toX) {
      const midY = fromY + BOX_H / 2;
      addRect(parent, fromX + BOX_W, midY - 1, toX - fromX - BOX_W, 2, { fill: BLACK });
      addText(parent, toX - 12, midY - 8, '>', { size: 11, bold: true });
    }
    function vArrow(parent, x, fromY, toY) {
      addRect(parent, x - 1, fromY + BOX_H, 2, toY - fromY - BOX_H, { fill: BLACK });
      addText(parent, x - 6, toY - 12, 'v', { size: 11, bold: true });
    }

    // Web store flow
    addText(f, MARGIN, 108, 'WEB STORE FLOW', { size: 11, bold: true, color: G_DARK });
    addRect(f, MARGIN - 8, 124, CONTENT_W + 16, 112, { stroke: BORDER });
    const wsFlow = ['Home', 'Product List', 'Product Detail', 'Login', 'Cart', 'Confirm', 'Confirmed'];
    const wsStep = Math.floor((CONTENT_W - BOX_W) / (wsFlow.length - 1));
    wsFlow.forEach((label, i) => {
      const bx = MARGIN + i * wsStep;
      flowBox(f, bx, 144, label);
      if (i < wsFlow.length - 1) arrow(f, bx, 144, bx + wsStep);
    });

    // Back office flow
    addText(f, MARGIN, 284, 'BACK OFFICE FLOW', { size: 11, bold: true, color: G_DARK });
    addRect(f, MARGIN - 8, 300, CONTENT_W + 16, 310, { stroke: BORDER });
    const boFlow = ['Admin Login', 'Dashboard', 'Product Mgmt', 'Add/Edit Product'];
    const boStep = 224;
    boFlow.forEach((label, i) => {
      const bx = MARGIN + i * boStep;
      flowBox(f, bx, 320, label);
      if (i < boFlow.length - 1) arrow(f, bx, 320, bx + boStep);
    });
    // Branch: Dashboard -> Order Management
    const dashX = MARGIN + boStep;
    vArrow(f, dashX + BOX_W / 2, 320, 432);
    flowBox(f, dashX, 432, 'Order Management');
    // Branch: Dashboard -> Customer Management
    const custX = MARGIN + boStep * 2;
    vArrow(f, custX + BOX_W / 2, 320, 432);
    flowBox(f, custX, 432, 'Customer Mgmt');

    // Legend
    addRect(f, MARGIN, 652, 500, 144, { stroke: BORDER });
    addText(f, MARGIN + 24, 672, 'LEGEND', { size: 11, bold: true });
    hLine(f, MARGIN + 24, 694, 452);
    addRect(f, MARGIN + 24, 710, 84, 40, { stroke: BLACK, sw: 1.5 });
    addText(f, MARGIN + 120, 722, '= Page / Screen', { size: 12 });
    addRect(f, MARGIN + 24, 764, 64, 2, { fill: BLACK });
    addText(f, MARGIN + 76, 756, '>', { size: 11, bold: true });
    addText(f, MARGIN + 120, 754, '= Navigation / User action', { size: 12 });

    addText(f, W - MARGIN - 300, 672, '15 screens total', { serif: true, size: 16 });
    addText(f, W - MARGIN - 300, 698, '9 client   6 back-office', { size: 12, color: G_DARK });
  }

  // ════════════════════════════════════════════════════════════
  // MOBILE WIREFRAMES  (390px — iPhone / Android standard)
  // Placed to the right of the desktop column  (x = W + 200)
  // ════════════════════════════════════════════════════════════

  const MOB_W   = 390;
  const MOB_M   = 20;
  const MOB_CW  = MOB_W - MOB_M * 2; // 350
  const MOB_NH  = 56;
  const MOB_BOT = 60;
  const MOB_GAP = 80;
  const MOB_X   = W + 200;
  const MOB_IH  = 180; // mobile product card image height

  let mobY = 0;

  function mkMF(name, height) {
    const f = figma.createFrame();
    f.name = name;
    f.resize(MOB_W, height);
    f.x = MOB_X; f.y = mobY;
    f.fills = [{ type: 'SOLID', color: WHITE }];
    f.clipsContent = true;
    mobY += height + MOB_GAP;
    page.appendChild(f);
    return f;
  }

  // Mobile top nav: hamburger | logo | search + bag
  function mNav(parent, cartN) {
    addRect(parent, 0, 0, MOB_W, MOB_NH, { fill: WHITE });
    hLine(parent, 0, MOB_NH, MOB_W);
    [0, 7, 14].forEach(dy => addRect(parent, MOB_M, 19 + dy, 22, 2, { fill: BLACK }));
    addText(parent, 0, 17, 'MAISON', { serif: true, size: 16, align: 'CENTER', w: MOB_W });
    addRect(parent, MOB_W - MOB_M - 56, 16, 18, 18, { stroke: BLACK, sw: 1 });
    addText(parent, MOB_W - MOB_M - 32, 18,
      cartN != null ? 'Bag(' + cartN + ')' : 'Bag', { size: 9 });
  }

  // Admin top bar (dark background)
  function mAdminNav(parent) {
    addRect(parent, 0, 0, MOB_W, MOB_NH, { fill: DARK_BG });
    [0, 7, 14].forEach(dy => addRect(parent, MOB_M, 19 + dy, 22, 2, { fill: WHITE }));
    addText(parent, 0, 17, 'MAISON', { serif: true, size: 15, color: WHITE, align: 'CENTER', w: MOB_W });
    addText(parent, MOB_W - MOB_M - 60, 20, 'Back Office', { size: 9, color: WHITE_DIM });
  }

  // Bottom nav bar (5 tabs)
  function mBotNav(parent, H, activeIdx) {
    const bY = H - MOB_BOT;
    hLine(parent, 0, bY, MOB_W);
    addRect(parent, 0, bY, MOB_W, MOB_BOT, { fill: WHITE });
    const tabs = ['Home', 'Shop', 'Search', 'Account', 'Bag'];
    const tabW = Math.floor(MOB_W / 5);
    tabs.forEach((tab, i) => {
      const tx = i * tabW;
      if (i === activeIdx) {
        addRect(parent, tx + Math.round((tabW - 24) / 2), bY + 8, 24, 2, { fill: BLACK });
        addText(parent, tx, bY + 16, tab, { size: 9, bold: true, align: 'CENTER', w: tabW });
      } else {
        addText(parent, tx, bY + 18, tab, { size: 9, color: G_DARK, align: 'CENTER', w: tabW });
      }
    });
  }

  // Mobile product card image placeholder
  function mCard(parent, x, y, cardW, name, price) {
    imgBox(parent, x, y, cardW, MOB_IH, '');
    addText(parent, x, y + MOB_IH + 10, name,  { size: 11, w: cardW });
    addText(parent, x, y + MOB_IH + 26, price, { size: 11, color: G_DARK });
  }

  // Section overline for mobile
  function mSec(parent, y, label) {
    addText(parent, MOB_M, y, label, { size: 10, bold: true, color: G_DARK });
    hLine(parent, MOB_M, y + 20, MOB_CW);
    return y + 38;
  }

  // Full-width primary button — returns bottom y
  function mPrimary(parent, y, label, w) {
    const bw = w || MOB_CW;
    addRect(parent, MOB_M, y, bw, 52, { fill: BLACK });
    addText(parent, MOB_M, y + 18, label,
      { size: 11, bold: true, color: WHITE, align: 'CENTER', w: bw });
    return y + 52;
  }

  // Outline ghost button — returns bottom y
  function mGhost(parent, x, y, label, w) {
    const bw = w || MOB_CW;
    addRect(parent, x, y, bw, 44, { stroke: BLACK, sw: 1 });
    addText(parent, x, y + 14, label, { size: 11, bold: true, align: 'CENTER', w: bw });
    return y + 44;
  }

  // Form field — returns next y
  function mField(parent, y, label, h) {
    const fh = h || 48;
    addText(parent, MOB_M, y, label, { size: 10, color: G_DARK });
    addRect(parent, MOB_M, y + 16, MOB_CW, fh, { stroke: BORDER });
    return y + fh + 28;
  }

  // ─────────────────────────────────────────────────────────
  // M01 — HOME PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 1300;
    const f = mkMF('M01 — Home Page (Mobile)', H);
    mNav(f);

    imgBox(f, 0, MOB_NH, MOB_W, 280, 'Hero Campaign');
    addText(f, MOB_M, MOB_NH + 196, 'NEW COLLECTION', { size: 9, bold: true, color: WHITE });
    addText(f, MOB_M, MOB_NH + 216, 'Spring 2026', { serif: true, size: 26, color: WHITE });
    addText(f, MOB_M, MOB_NH + 258, 'DISCOVER', { size: 9, bold: true, color: WHITE });
    addRect(f, MOB_M, MOB_NH + 274, 56, 1, { fill: WHITE });

    let y = MOB_NH + 280 + 32;
    const c2W = Math.floor((MOB_CW - 12) / 2);

    y = mSec(f, y, 'NEW ARRIVALS');
    [['Cashmere Coat', '$285.00'], ['Silk Blouse', '$165.00']].forEach(([n, p], i) => {
      mCard(f, MOB_M + i * (c2W + 12), y, c2W, n, p);
    });
    y += MOB_IH + 46 + 12;
    [['Wide Trousers', '$195.00'], ['Wool Blazer', '$245.00']].forEach(([n, p], i) => {
      mCard(f, MOB_M + i * (c2W + 12), y, c2W, n, p);
    });
    y += MOB_IH + 46 + 32;

    y = mSec(f, y, 'THE EDIT');
    imgBox(f, MOB_M, y, MOB_CW, 200, 'Editorial');
    y += 216;
    addText(f, MOB_M, y, 'The New Classics', { serif: true, size: 20 });
    addText(f, MOB_M, y + 28, 'Elevated everyday essentials.', { size: 12, color: G_DARK, w: MOB_CW });
    y += 72;

    hLine(f, 0, y, MOB_W);
    addText(f, MOB_M, y + 18, 'MAISON', { serif: true, size: 14 });
    addText(f, MOB_M, y + 42, '© 2026 MAISON. All rights reserved.', { size: 9, color: G_DARK });

    mBotNav(f, H, 0);
  }

  // ─────────────────────────────────────────────────────────
  // M02 — PRODUCT LIST PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 1040;
    const f = mkMF('M02 — Product List Page (Mobile)', H);
    mNav(f);

    addText(f, MOB_M, MOB_NH + 20, 'WOMEN', { serif: true, size: 26 });
    addText(f, MOB_M, MOB_NH + 54, '32 items', { size: 11, color: G_DARK });

    const chipY = MOB_NH + 80;
    hLine(f, MOB_M, chipY, MOB_CW);
    const chips = ['All', 'Coats', 'Dresses', 'Tops', 'Trousers'];
    let chipX = MOB_M;
    chips.forEach((chip, i) => {
      const cw = chip.length * 8 + 20;
      if (i === 0) {
        addRect(f, chipX, chipY + 8, cw, 32, { fill: BLACK });
        addText(f, chipX, chipY + 16, chip,
          { size: 10, bold: true, color: WHITE, align: 'CENTER', w: cw });
      } else {
        addRect(f, chipX, chipY + 8, cw, 32, { stroke: BORDER });
        addText(f, chipX, chipY + 16, chip, { size: 10, align: 'CENTER', w: cw });
      }
      chipX += cw + 8;
    });
    hLine(f, MOB_M, chipY + 48, MOB_CW);

    const c2W = Math.floor((MOB_CW - 12) / 2);
    let gy = chipY + 64;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const n = row * 2 + col + 1;
        mCard(f, MOB_M + col * (c2W + 12), gy, c2W,
          'Product ' + n, '$' + (n * 45 + 40) + '.00');
      }
      gy += MOB_IH + 48 + 16;
    }

    hLine(f, MOB_M, gy + 8, MOB_CW);
    [1, 2, 3].forEach((p, i) => {
      if (i === 0) {
        addRect(f, MOB_M + i * 44, gy + 24, 36, 36, { fill: BLACK });
        addText(f, MOB_M + i * 44, gy + 30, String(p),
          { size: 13, color: WHITE, align: 'CENTER', w: 36 });
      } else {
        addRect(f, MOB_M + i * 44, gy + 24, 36, 36, { stroke: BORDER });
        addText(f, MOB_M + i * 44, gy + 30, String(p),
          { size: 13, align: 'CENTER', w: 36 });
      }
    });

    mBotNav(f, H, 1);
  }

  // ─────────────────────────────────────────────────────────
  // M03 — PRODUCT DETAIL PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 1540;
    const f = mkMF('M03 — Product Detail Page (Mobile)', H);
    mNav(f, 0);

    addText(f, MOB_M, MOB_NH + 14, 'Home / Women / Coats', { size: 10, color: G_DARK });

    const pImgH = 400;
    imgBox(f, 0, MOB_NH + 36, MOB_W, pImgH, 'Product Image');

    for (let t = 0; t < 4; t++) {
      imgBox(f, MOB_M + t * 76, MOB_NH + 36 + pImgH + 12, 64, 64, '');
    }

    let py = MOB_NH + 36 + pImgH + 88;
    addText(f, MOB_M, py, 'MAISON', { size: 9, bold: true, color: G_DARK }); py += 18;
    addText(f, MOB_M, py, 'Oversized Wool Coat', { serif: true, size: 22, w: MOB_CW }); py += 36;
    addText(f, MOB_M, py, '$285.00', { size: 18 }); py += 36;
    hLine(f, MOB_M, py, MOB_CW); py += 20;

    addText(f, MOB_M, py, 'SIZE', { size: 10, bold: true });
    addText(f, MOB_M, py, 'Size Guide', { size: 10, color: G_DARK, align: 'RIGHT', w: MOB_CW });
    py += 24;
    ['XS', 'S', 'M', 'L', 'XL'].forEach((sz, i) => {
      const sx = MOB_M + i * 60;
      if (i === 2) {
        addRect(f, sx, py, 52, 52, { fill: BLACK });
        addText(f, sx, py + 18, sz, { size: 12, color: WHITE, align: 'CENTER', w: 52 });
      } else {
        addRect(f, sx, py, 52, 52, { stroke: BORDER });
        addText(f, sx, py + 18, sz, { size: 12, align: 'CENTER', w: 52 });
      }
    });
    py += 68;

    mPrimary(f, py, 'ADD TO CART'); py += 64;
    mGhost(f, MOB_M, py, 'ADD TO WISHLIST'); py += 60;
    hLine(f, MOB_M, py, MOB_CW); py += 20;

    addText(f, MOB_M, py, 'DESCRIPTION', { size: 10, bold: true }); py += 20;
    addText(f, MOB_M, py,
      'Relaxed oversized silhouette in Italian wool blend. Drop shoulders, single-button closure.',
      { size: 12, color: G_DARK, w: MOB_CW }); py += 52;
    hLine(f, MOB_M, py, MOB_CW); py += 20;
    addText(f, MOB_M, py, 'COMPOSITION & CARE', { size: 10, bold: true }); py += 20;
    addText(f, MOB_M, py, '90% Wool  10% Polyamide  —  Dry clean only.',
      { size: 12, color: G_DARK }); py += 52;

    py = mSec(f, py, 'YOU MAY ALSO LIKE');
    const c2W = Math.floor((MOB_CW - 12) / 2);
    [['Related Product 1', '$95.00'], ['Related Product 2', '$190.00']].forEach(([n, p], i) => {
      mCard(f, MOB_M + i * (c2W + 12), py, c2W, n, p);
    });

    mBotNav(f, H, 1);
  }

  // ─────────────────────────────────────────────────────────
  // M04 — LOGIN PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 680;
    const f = mkMF('M04 — Login Page (Mobile)', H);
    mNav(f);

    addText(f, 0, MOB_NH + 36, 'MAISON',
      { serif: true, size: 18, align: 'CENTER', w: MOB_W });
    hLine(f, MOB_M, MOB_NH + 68, MOB_CW);
    addText(f, MOB_M, MOB_NH + 88, 'SIGN IN', { bold: true, size: 18 });
    addText(f, MOB_M, MOB_NH + 114, 'Welcome back', { size: 13, color: G_DARK });

    let fy = MOB_NH + 148;
    fy = mField(f, fy, 'Email Address');
    fy = mField(f, fy, 'Password');
    addText(f, MOB_M + MOB_CW - 108, fy - 14, 'Forgot password?', { size: 11, color: G_DARK });
    mPrimary(f, fy, 'SIGN IN'); fy += 64;

    hLine(f, MOB_M, fy, MOB_CW); fy += 20;
    addText(f, MOB_M, fy, 'New to MAISON?', { size: 13, color: G_DARK });
    addText(f, MOB_M, fy + 24, 'Create an account', { size: 13, bold: true });

    mBotNav(f, H, 3);
  }

  // ─────────────────────────────────────────────────────────
  // M05 — REGISTER PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 820;
    const f = mkMF('M05 — Register Page (Mobile)', H);
    mNav(f);

    addText(f, 0, MOB_NH + 36, 'MAISON',
      { serif: true, size: 18, align: 'CENTER', w: MOB_W });
    hLine(f, MOB_M, MOB_NH + 68, MOB_CW);
    addText(f, MOB_M, MOB_NH + 88, 'CREATE ACCOUNT', { bold: true, size: 18 });
    addText(f, MOB_M, MOB_NH + 114, 'Join MAISON today', { size: 13, color: G_DARK });

    let fy = MOB_NH + 148;
    fy = mField(f, fy, 'Full Name');
    fy = mField(f, fy, 'Email Address');
    fy = mField(f, fy, 'Password');
    fy = mField(f, fy, 'Confirm Password');
    mPrimary(f, fy, 'CREATE ACCOUNT'); fy += 64;

    hLine(f, MOB_M, fy, MOB_CW); fy += 20;
    addText(f, MOB_M, fy, 'Already a member?', { size: 13, color: G_DARK });
    addText(f, MOB_M, fy + 24, 'Sign In', { size: 13, bold: true });

    mBotNav(f, H, 3);
  }

  // ─────────────────────────────────────────────────────────
  // M06 — USER PROFILE PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 980;
    const f = mkMF('M06 — User Profile Page (Mobile)', H);
    mNav(f);

    addText(f, MOB_M, MOB_NH + 24, 'MY ACCOUNT', { serif: true, size: 24 });
    hLine(f, MOB_M, MOB_NH + 60, MOB_CW);
    addText(f, MOB_M, MOB_NH + 80, 'ACCOUNT INFORMATION', { size: 10, bold: true });
    hLine(f, MOB_M, MOB_NH + 100, MOB_CW);

    [
      ['Full Name', 'John Doe'],
      ['Email', 'john.doe@email.com'],
      ['Phone', '+1 (555) 000-0000'],
      ['Member Since', 'January 2026'],
    ].forEach(([lbl, val], i) => {
      addText(f, MOB_M, MOB_NH + 116 + i * 52, lbl, { size: 10, color: G_DARK });
      addText(f, MOB_M, MOB_NH + 132 + i * 52, val, { size: 13 });
    });

    let by = MOB_NH + 340;
    mGhost(f, MOB_M, by, 'EDIT PROFILE'); by += 56;
    mGhost(f, MOB_M, by, 'CHANGE PASSWORD'); by += 72;

    addText(f, MOB_M, by, 'RECENT ORDERS', { size: 10, bold: true });
    hLine(f, MOB_M, by + 20, MOB_CW); by += 36;

    [
      ['#00120', 'Jan 15, 2026', '$285.00', 'Delivered'],
      ['#00118', 'Jan 10, 2026', '$95.00',  'Delivered'],
    ].forEach(([num, date, total, status]) => {
      addRect(f, MOB_M, by, MOB_CW, 80, { stroke: BORDER });
      addText(f, MOB_M + 12, by + 12, num,   { size: 12, bold: true });
      addText(f, MOB_M + 12, by + 32, date,  { size: 11, color: G_DARK });
      addText(f, MOB_M + 12, by + 52, total, { size: 12 });
      addText(f, MOB_M + 12, by + 52, status,
        { size: 10, color: G_DARK, align: 'RIGHT', w: MOB_CW - 100 });
      mGhost(f, MOB_M + MOB_CW - 80, by + 18, 'View', 68);
      by += 92;
    });

    mBotNav(f, H, 3);
  }

  // ─────────────────────────────────────────────────────────
  // M07 — ORDER HISTORY PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 1020;
    const f = mkMF('M07 — Order History Page (Mobile)', H);
    mNav(f);

    addText(f, MOB_M, MOB_NH + 24, 'ORDER HISTORY', { serif: true, size: 24 });
    hLine(f, MOB_M, MOB_NH + 60, MOB_CW);

    const ohSts = ['Delivered', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Processing'];
    let oy = MOB_NH + 80;
    for (let row = 0; row < 6; row++) {
      addRect(f, MOB_M, oy, MOB_CW, 80, { stroke: BORDER });
      addText(f, MOB_M + 12, oy + 12, '#001' + (20 + row), { size: 12, bold: true });
      addText(f, MOB_M + 12, oy + 32, 'Jan ' + (row + 5) + ', 2026', { size: 11, color: G_DARK });
      addText(f, MOB_M + 12, oy + 52, '$' + (row + 1) * 95 + '.00', { size: 12 });
      addText(f, MOB_M + 12, oy + 52, ohSts[row],
        { size: 10, color: G_DARK, align: 'RIGHT', w: MOB_CW - 100 });
      mGhost(f, MOB_M + MOB_CW - 80, oy + 18, 'View', 68);
      oy += 92;
    }

    hLine(f, MOB_M, oy + 8, MOB_CW);
    [1, 2, 3].forEach((p, i) => {
      if (i === 0) {
        addRect(f, MOB_M + i * 44, oy + 24, 36, 36, { fill: BLACK });
        addText(f, MOB_M + i * 44, oy + 30, String(p),
          { size: 13, color: WHITE, align: 'CENTER', w: 36 });
      } else {
        addRect(f, MOB_M + i * 44, oy + 24, 36, 36, { stroke: BORDER });
        addText(f, MOB_M + i * 44, oy + 30, String(p),
          { size: 13, align: 'CENTER', w: 36 });
      }
    });

    mBotNav(f, H, 3);
  }

  // ─────────────────────────────────────────────────────────
  // M08 — CART PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 1100;
    const f = mkMF('M08 — Cart Page (Mobile)', H);
    mNav(f, 3);

    addText(f, MOB_M, MOB_NH + 24, 'SHOPPING BAG', { serif: true, size: 22 });
    addText(f, MOB_M, MOB_NH + 54, '3 items', { size: 11, color: G_DARK });
    hLine(f, MOB_M, MOB_NH + 76, MOB_CW);

    let cy = MOB_NH + 88;
    for (let i = 0; i < 3; i++) {
      imgBox(f, MOB_M, cy, 96, 120, '');
      addText(f, MOB_M + 112, cy,      'MAISON',                  { size: 9, bold: true, color: G_DARK });
      addText(f, MOB_M + 112, cy + 16, 'Product Name ' + (i + 1), { size: 13, w: MOB_CW - 112 });
      addText(f, MOB_M + 112, cy + 36, 'Size: M  |  Black',       { size: 11, color: G_DARK });
      addText(f, MOB_M + 112, cy + 56, '$' + (i + 1) * 95 + '.00', { size: 13 });
      addRect(f, MOB_M + 112, cy + 80, 28, 28, { stroke: BORDER });
      addText(f, MOB_M + 112, cy + 84, '-', { size: 14, align: 'CENTER', w: 28 });
      addText(f, MOB_M + 148, cy + 84, '1', { size: 12, align: 'CENTER', w: 20 });
      addRect(f, MOB_M + 172, cy + 80, 28, 28, { stroke: BORDER });
      addText(f, MOB_M + 172, cy + 84, '+', { size: 14, align: 'CENTER', w: 28 });
      addText(f, MOB_M + MOB_CW - 44, cy, 'Remove', { size: 10, color: G_DARK });
      hLine(f, MOB_M, cy + 128, MOB_CW);
      cy += 140;
    }

    let sy = cy + 16;
    addText(f, MOB_M, sy, 'ORDER SUMMARY', { size: 11, bold: true });
    hLine(f, MOB_M, sy + 22, MOB_CW);
    [['Subtotal', '$285.00'], ['Shipping', 'Complimentary'], ['Tax (10%)', '$28.50']].forEach(([lbl, val], i) => {
      const ry = sy + 40 + i * 36;
      addText(f, MOB_M, ry, lbl, { size: 12 });
      addText(f, MOB_M, ry, val, { size: 12, align: 'RIGHT', w: MOB_CW });
    });
    hLine(f, MOB_M, sy + 152, MOB_CW);
    addText(f, MOB_M, sy + 168, 'Total',   { bold: true, size: 15 });
    addText(f, MOB_M, sy + 168, '$313.50', { bold: true, size: 15, align: 'RIGHT', w: MOB_CW });
    mPrimary(f, sy + 200, 'CONFIRM ORDER');

    mBotNav(f, H, 4);
  }

  // ─────────────────────────────────────────────────────────
  // M09 — ORDER CONFIRMATION PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 580;
    const f = mkMF('M09 — Order Confirmation Page (Mobile)', H);
    mNav(f);

    addText(f, 0, MOB_NH + 64, 'ORDER CONFIRMED',
      { serif: true, size: 28, align: 'CENTER', w: MOB_W });
    hLine(f, MOB_M, MOB_NH + 108, MOB_CW);
    addText(f, 0, MOB_NH + 124, 'Thank you for shopping with MAISON.',
      { size: 12, color: G_DARK, align: 'CENTER', w: MOB_W });
    addText(f, 0, MOB_NH + 148, 'Order Number: #001234',
      { size: 13, bold: true, align: 'CENTER', w: MOB_W });
    addText(f, 0, MOB_NH + 172, 'A confirmation was sent to your email.',
      { size: 11, color: G_DARK, align: 'CENTER', w: MOB_W });

    mPrimary(f, MOB_NH + 220, 'CONTINUE SHOPPING');
    mGhost(f, MOB_M, MOB_NH + 284, 'VIEW MY ORDERS');

    mBotNav(f, H, 0);
  }

  // ─────────────────────────────────────────────────────────
  // M10 — ADMIN LOGIN PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 620;
    const f = mkMF('M10 — Admin Login Page (Mobile)', H);
    addRect(f, 0, 0, MOB_W, H, { fill: G_LIGHT });

    addRect(f, MOB_M, 56, MOB_CW, 484, { fill: WHITE, stroke: BORDER });
    addText(f, MOB_M, 92,  'MAISON',      { serif: true, size: 18, align: 'CENTER', w: MOB_CW });
    addText(f, MOB_M, 118, 'Back Office', { size: 10, color: G_DARK, align: 'CENTER', w: MOB_CW });
    hLine(f, MOB_M + 20, 144, MOB_CW - 40);
    addText(f, MOB_M + 16, 164, 'ADMINISTRATOR SIGN IN', { bold: true, size: 13 });

    let fy = 198;
    addText(f, MOB_M + 16, fy, 'Admin Email', { size: 10, color: G_DARK });
    addRect(f, MOB_M + 16, fy + 16, MOB_CW - 32, 48, { stroke: BORDER }); fy += 80;
    addText(f, MOB_M + 16, fy, 'Password', { size: 10, color: G_DARK });
    addRect(f, MOB_M + 16, fy + 16, MOB_CW - 32, 48, { stroke: BORDER }); fy += 80;
    addRect(f, MOB_M + 16, fy, MOB_CW - 32, 52, { fill: BLACK });
    addText(f, MOB_M + 16, fy + 18, 'ACCESS DASHBOARD',
      { size: 11, bold: true, color: WHITE, align: 'CENTER', w: MOB_CW - 32 });
    fy += 68;
    hLine(f, MOB_M + 20, fy, MOB_CW - 40);
    addText(f, MOB_M + 16, fy + 16, 'Back to main site', { size: 11, color: G_DARK });
  }

  // ─────────────────────────────────────────────────────────
  // M11 — ADMIN DASHBOARD (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 960;
    const f = mkMF('M11 — Admin Dashboard (Mobile)', H);
    mAdminNav(f);

    addText(f, MOB_M, MOB_NH + 24, 'Dashboard', { serif: true, size: 22 });
    hLine(f, MOB_M, MOB_NH + 54, MOB_CW);

    const kW = Math.floor((MOB_CW - 12) / 2);
    [['PRODUCTS', '48'], ['ORDERS', '127'], ['USERS', '89'], ['REVENUE', '$9,240']].forEach(([lbl, val], i) => {
      const kx = MOB_M + (i % 2) * (kW + 12);
      const ky = MOB_NH + 74 + Math.floor(i / 2) * 108;
      addRect(f, kx, ky, kW, 96, { stroke: BORDER });
      addText(f, kx + 12, ky + 16, lbl, { size: 9, bold: true, color: G_DARK });
      addText(f, kx + 12, ky + 38, val, { serif: true, size: 24 });
    });

    let oy = MOB_NH + 74 + 216 + 24;
    addText(f, MOB_M, oy, 'RECENT ORDERS', { size: 10, bold: true });
    hLine(f, MOB_M, oy + 20, MOB_CW); oy += 36;

    ['Processing', 'Shipped', 'Delivered'].forEach((st, row) => {
      addRect(f, MOB_M, oy, MOB_CW, 80, { stroke: BORDER });
      addText(f, MOB_M + 12, oy + 12, '#001' + (20 + row), { size: 12, bold: true });
      addText(f, MOB_M + 12, oy + 30, 'Jane Doe  |  Jan 2026', { size: 11, color: G_DARK });
      addText(f, MOB_M + 12, oy + 50, '$' + (row + 1) * 95 + '.00', { size: 12 });
      addText(f, MOB_M + 12, oy + 50, st,
        { size: 10, color: G_DARK, align: 'RIGHT', w: MOB_CW - 100 });
      mGhost(f, MOB_M + MOB_CW - 80, oy + 18, 'View', 68);
      oy += 92;
    });
  }

  // ─────────────────────────────────────────────────────────
  // M12 — PRODUCT MANAGEMENT (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 900;
    const f = mkMF('M12 — Product Management (Mobile)', H);
    mAdminNav(f);

    addText(f, MOB_M, MOB_NH + 20, 'Product Management', { serif: true, size: 20 });
    addRect(f, MOB_M, MOB_NH + 54, MOB_CW, 48, { fill: BLACK });
    addText(f, MOB_M, MOB_NH + 72, '+ ADD PRODUCT',
      { size: 11, bold: true, color: WHITE, align: 'CENTER', w: MOB_CW });
    hLine(f, MOB_M, MOB_NH + 112, MOB_CW);

    addText(f, MOB_M, MOB_NH + 124, 'Search products...', { size: 10, color: G_DARK });
    addRect(f, MOB_M, MOB_NH + 140, MOB_CW, 44, { stroke: BORDER });

    const cats = ['Coats', 'Dresses', 'Tops', 'Trousers', 'Accessories'];
    let py = MOB_NH + 200;
    for (let row = 0; row < 5; row++) {
      addRect(f, MOB_M, py, MOB_CW, 80, { stroke: BORDER });
      imgBox(f, MOB_M + 12, py + 12, 56, 56, '');
      addText(f, MOB_M + 80, py + 16, 'Product ' + (row + 1),     { size: 12, bold: true });
      addText(f, MOB_M + 80, py + 34, cats[row],                   { size: 11, color: G_DARK });
      addText(f, MOB_M + 80, py + 52, '$' + (row + 1) * 95 + '.00', { size: 12 });
      mGhost(f, MOB_M + MOB_CW - 144, py + 20, 'Edit', 60);
      mGhost(f, MOB_M + MOB_CW - 76,  py + 20, 'Del',  60);
      py += 92;
    }
  }

  // ─────────────────────────────────────────────────────────
  // M13 — ADD PRODUCT PAGE (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 1040;
    const f = mkMF('M13 — Add Product Page (Mobile)', H);
    mAdminNav(f);

    addText(f, MOB_M, MOB_NH + 20, 'Add New Product', { serif: true, size: 20 });
    hLine(f, MOB_M, MOB_NH + 52, MOB_CW);

    let fy = MOB_NH + 68;
    fy = mField(f, fy, 'Product Name *');
    addText(f, MOB_M, fy, 'Description *', { size: 10, color: G_DARK });
    addRect(f, MOB_M, fy + 16, MOB_CW, 100, { stroke: BORDER }); fy += 132;
    fy = mField(f, fy, 'Price ($) *');
    fy = mField(f, fy, 'Category *');
    fy = mField(f, fy, 'Stock Quantity *');

    addText(f, MOB_M, fy, 'Product Image *', { size: 10, color: G_DARK });
    addRect(f, MOB_M, fy + 16, MOB_CW, 160, { stroke: BORDER });
    imgBox(f, MOB_M + Math.round((MOB_CW - 100) / 2), fy + 36, 100, 72, 'Upload');
    addText(f, MOB_M, fy + 124, 'Tap to upload or drag and drop',
      { size: 10, color: G_DARK, align: 'CENTER', w: MOB_CW }); fy += 192;

    mPrimary(f, fy, 'SAVE PRODUCT'); fy += 64;
    mGhost(f, MOB_M, fy, 'CANCEL');
  }

  // ─────────────────────────────────────────────────────────
  // M14 — ORDER MANAGEMENT (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 1040;
    const f = mkMF('M14 — Order Management (Mobile)', H);
    mAdminNav(f);

    addText(f, MOB_M, MOB_NH + 20, 'Order Management', { serif: true, size: 20 });
    hLine(f, MOB_M, MOB_NH + 52, MOB_CW);

    const tabs2 = ['All', 'Processing', 'Shipped', 'Delivered'];
    let chipX2 = MOB_M;
    const chipY2 = MOB_NH + 68;
    tabs2.forEach((tab, i) => {
      const cw = tab.length * 8 + 20;
      if (i === 0) {
        addRect(f, chipX2, chipY2, cw, 32, { fill: BLACK });
        addText(f, chipX2, chipY2 + 9, tab,
          { size: 10, bold: true, color: WHITE, align: 'CENTER', w: cw });
      } else {
        addRect(f, chipX2, chipY2, cw, 32, { stroke: BORDER });
        addText(f, chipX2, chipY2 + 9, tab, { size: 10, align: 'CENTER', w: cw });
      }
      chipX2 += cw + 8;
    });

    const omSts = ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Processing', 'Shipped', 'Delivered'];
    let oy = chipY2 + 48;
    for (let row = 0; row < 7; row++) {
      addRect(f, MOB_M, oy, MOB_CW, 80, { stroke: BORDER });
      addText(f, MOB_M + 12, oy + 12, '#001' + (row + 20), { size: 12, bold: true });
      addText(f, MOB_M + 12, oy + 30, 'Customer  |  Jan 2026', { size: 11, color: G_DARK });
      addText(f, MOB_M + 12, oy + 50, '$' + (row + 1) * 95 + '.00', { size: 12 });
      addText(f, MOB_M + 12, oy + 50, omSts[row],
        { size: 10, color: G_DARK, align: 'RIGHT', w: MOB_CW - 100 });
      mGhost(f, MOB_M + MOB_CW - 80, oy + 18, 'View', 68);
      oy += 92;
    }
  }

  // ─────────────────────────────────────────────────────────
  // M15 — CUSTOMER MANAGEMENT (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 960;
    const f = mkMF('M15 — Customer Management (Mobile)', H);
    mAdminNav(f);

    addText(f, MOB_M, MOB_NH + 20, 'Customer Management', { serif: true, size: 20, w: MOB_CW });
    hLine(f, MOB_M, MOB_NH + 52, MOB_CW);
    addText(f, MOB_M, MOB_NH + 64, 'Search customers...', { size: 10, color: G_DARK });
    addRect(f, MOB_M, MOB_NH + 80, MOB_CW, 44, { stroke: BORDER });

    let cy = MOB_NH + 140;
    for (let row = 0; row < 8; row++) {
      addRect(f, MOB_M, cy, MOB_CW, 80, { stroke: BORDER });
      addText(f, MOB_M + 12, cy + 12, 'Customer ' + (row + 1), { size: 12, bold: true });
      addText(f, MOB_M + 12, cy + 30, 'user' + (row + 1) + '@email.com', { size: 11, color: G_DARK });
      addText(f, MOB_M + 12, cy + 50, 'Jan 2026  |  ' + (row + 2) + ' orders',
        { size: 10, color: G_DARK });
      mGhost(f, MOB_M + MOB_CW - 80, cy + 18, 'View', 68);
      cy += 92;
    }
  }

  // ─────────────────────────────────────────────────────────
  // M16 — USER FLOW DIAGRAM (Mobile)
  // ─────────────────────────────────────────────────────────
  {
    const H = 960;
    const f = mkMF('M16 — User Flow Diagram (Mobile)', H);

    addText(f, MOB_M, 28, 'User Flow Diagram', { serif: true, size: 22 });
    addText(f, MOB_M, 58, 'Mobile  390px', { size: 10, bold: true, color: G_DARK });
    hLine(f, MOB_M, 78, MOB_CW);

    const BW = 150; const BH = 44; const vstep = 72;
    const bx = MOB_M + Math.round((MOB_CW - BW) / 2);

    function mFlowBox(parent, x, y, label) {
      addRect(parent, x, y, BW, BH, { stroke: BLACK, sw: 1.5 });
      addText(parent, x, y + 14, label, { size: 11, align: 'CENTER', w: BW });
    }
    function mVArr(parent, x, y) {
      addRect(parent, x + Math.round(BW / 2) - 1, y + BH, 2, vstep - BH, { fill: BLACK });
      addText(parent, x + Math.round(BW / 2) - 5, y + BH + vstep - BH - 16, 'v',
        { size: 10, bold: true });
    }

    // Web store flow — vertical single column
    addText(f, MOB_M, 98, 'WEB STORE FLOW', { size: 10, bold: true, color: G_DARK });
    addRect(f, MOB_M - 8, 114, MOB_CW + 16, BH * 7 + vstep * 6 + 24, { stroke: BORDER });
    ['Home', 'Product List', 'Product Detail', 'Login', 'Cart', 'Confirm', 'Confirmed']
      .forEach((label, i) => {
        const y = 126 + i * vstep;
        mFlowBox(f, bx, y, label);
        if (i < 6) mVArr(f, bx, y);
      });

    // Back office flow
    const boY0 = 126 + 7 * vstep + 48;
    addText(f, MOB_M, boY0 - 16, 'BACK OFFICE FLOW', { size: 10, bold: true, color: G_DARK });
    addRect(f, MOB_M - 8, boY0, MOB_CW + 16, BH * 4 + vstep * 3 + 24, { stroke: BORDER });
    ['Admin Login', 'Dashboard', 'Product Mgmt', 'Add/Edit'].forEach((label, i) => {
      const y = boY0 + 12 + i * vstep;
      mFlowBox(f, bx, y, label);
      if (i < 3) mVArr(f, bx, y);
    });
  }

  // ── ZOOM TO FIT ─────────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView(Array.from(page.children));
  figma.notify('Wireframes ready — Desktop (1440px) + Mobile (390px) | 32 frames total!', { timeout: 6000 });
  figma.closePlugin();

})().catch(err => {
  figma.notify('Plugin error: ' + err.message, { error: true });
  figma.closePlugin();
});