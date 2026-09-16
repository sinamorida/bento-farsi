// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// The starter deck — what a freshly built bento/slides file opens with.
//
// It is the product demo, the launch asset and the feature tour in one: every
// claim it makes is proven by the feature making it. A cast of four "bento
// tiles" (a amber, b blue, c paper, d ink) carries the SAME element ids
// through every slide, so each transition morphs them — position, size,
// color, solid⇄gradient. One deliberate 'fade' beat (the stats slide) exists
// because entrance staggers + count-ups only run on non-morph entries.
//
// Art direction: ink #0F1724 and warm paper #F6F4EF grounds with a dotted
// texture, Fraunces Black for display (embedded, OFL), Instrument Sans for
// everything else (embedded variable, OFL). Editorial furniture on content
// slides — tracked kicker top-left, index numeral top-right, hairline rule —
// plus 300px ghost numerals on paper slides. Cards are 1px-stroked panels.
// Never let system-font defaults show: every text sets a face on purpose.

import {
  newDoc, uid, defaultText, defaultShape, defaultChart, defaultTable, defaultCode,
  type BentoDoc, type Slide, type SlideElement, type TextElement, type ShapeElement,
  type SvgElement, type TableElement,
} from './model.ts'

/** Display face — Persian display face with Fraunces fallback. */
const DISPLAY = "'Vazirmatn', 'B Titr', 'Fraunces', Georgia, serif"
/** Text face — Vazirmatn and Persian font stacks. */
const BODY = "'Vazirmatn', 'Vazir', 'IRANSans', 'Sahel', 'Instrument Sans', -apple-system, 'Segoe UI', Helvetica, sans-serif"

const INK = '#0D1B2E'
const PANEL = '#16273E'
const PAPER = '#F2F0EA'
// Midnight & peach: deep navy-ink ground, one luminous peach accent, muted
// steel-blue support. Warm-on-cool, nothing like default chart colors.
const PEACH = '#FF9E8A'
const PEACH_SOFT = '#FFBCA8'
const PEACH_DEEP = '#C25A43'
const STEEL = '#5E7699'
const STEEL_SOFT = '#8FA3BF'
const MIST = '#B6C1D2'
const TILE_PAPER = '#EFECE3'

// gradient-lit tile fills (light falls from above) — kills the flat-vector look
const GRAD_PEACH = { angle: 0, stops: [{ at: 0, color: '#ED8266' }, { at: 1, color: '#FFB29B' }] }
const GRAD_STEEL = { angle: 0, stops: [{ at: 0, color: '#48607F' }, { at: 1, color: '#7089A8' }] }
const GRAD_PAPER = { angle: 0, stops: [{ at: 0, color: '#DDD9CD' }, { at: 1, color: '#F6F3EB' }] }
const GRAD_CARD = { angle: 0, stops: [{ at: 0, color: '#101F33' }, { at: 1, color: '#1D3049' }] }
const INK_SOFT = 'rgba(20, 34, 54, 0.75)'
const CARD_STROKE = '#E7E1D2'
const GLASS = 'rgba(255, 255, 255, 0.09)'

// the morphing cast — same ids on every slide
const T_A = 'sd-tile-a' // amber
const T_B = 'sd-tile-b' // blue
const T_C = 'sd-tile-c' // paper/white
const T_D = 'sd-tile-d' // ink panel / card
/** The formula that rearranges across the morph beat — one id, two slides. */
const EQ = 'sd-eq'
const CODE_ID = 'sd-code'
const TITLE = 'sd-title'
const KICKER = 'sd-kicker'
const GLOW = 'sd-glow'
const CHART_MAIN = 'sd-main-chart'

const S_CHARTS = 'sd-s-charts'
const S_CHARTS_PIE = 'sd-s-charts-pie'
const S_CHARTS_SCATTER = 'sd-s-charts-scatter'
const S_CHOREO = 'sd-s-choreo'
const S_CHOREO_2 = 'sd-s-choreo-2'
const S_CHOREO_3 = 'sd-s-choreo-3'

// --- builders ---------------------------------------------------------------

const text = (p: Partial<TextElement>): TextElement =>
  ({ ...defaultText({ align: 'left', valign: 'top', fontFamily: BODY }), ...p }) as TextElement

const shape = (kind: Parameters<typeof defaultShape>[0], p: Partial<ShapeElement>): ShapeElement =>
  ({ ...defaultShape(kind), stroke: 'transparent', strokeWidth: 0, ...p }) as ShapeElement

const kicker = (label: string, p: Partial<TextElement> = {}): TextElement =>
  text({
    id: KICKER, x: 96, y: 54, w: 700, h: 26, html: label,
    fontSize: 13, fontWeight: 700, color: PEACH, letterSpacing: 4, ...p,
  })

const title = (html: string, p: Partial<TextElement> = {}): TextElement =>
  text({
    id: TITLE, x: 92, y: 112, w: 1000, h: 92, html,
    fontSize: 54, fontWeight: 900, fontFamily: DISPLAY, color: INK, lineHeight: 1.06, ...p,
  })

/** Content-slide furniture: auto page numeral ({{page}}) + hairline rule.
 *  The {{page:2}} field re-numbers itself as slides are inserted/removed. */
const furniture = (dark: boolean): SlideElement[] => [
  text({
    x: 1024, y: 54, w: 160, h: 26, html: '{{page:2}}', align: 'right',
    fontSize: 13, fontWeight: 700, letterSpacing: 2,
    color: dark ? 'rgba(185,196,212,0.5)' : 'rgba(30,42,58,0.4)',
  }),
  shape('rect', {
    x: 96, y: 86, w: 1088, h: 1.5, radius: 0,
    fill: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,36,0.12)',
  }),
]

/** 300px ghost numeral (paper slides) — editorial depth, sits behind content.
 *  Also the auto page number, so it can never drift out of sync. */
const ghost = (): TextElement =>
  text({
    x: 780, y: -30, w: 420, h: 340, html: '{{page:2}}', align: 'right',
    fontSize: 300, fontWeight: 900, fontFamily: DISPLAY, color: 'rgba(13,27,46,0.05)',
  })

const dots = (dark: boolean, fx?: SvgElement['fx']): SvgElement => ({
  id: uid('sv'), type: 'svg', x: 0, y: 0, w: 1280, h: 720, rotation: 0, opacity: 1,
  asset: dark ? 'dots-ink' : 'dots-paper', ...(fx ? { fx } : {}),
})

/**
 * Seamless closed-loop drift path: a circle of radius r through the element's
 * rest position. `phase` (degrees) rotates the starting point around the loop
 * so a field of drifters de-syncs WITHOUT start delays — everything moves
 * from the first frame (tween delays left particles frozen at entry).
 */
const floatPath = (r: number, phase = 0): string => {
  const h = r * 0.5523
  const a0 = ((phase - 90) * Math.PI) / 180
  const C = { x: -r * Math.cos(a0), y: -r * Math.sin(a0) }
  const P = (a: number) => ({ x: C.x + r * Math.cos(a), y: C.y + r * Math.sin(a) })
  const T = (a: number) => ({ x: -Math.sin(a), y: Math.cos(a) })
  const f = (n: number) => Math.round(n * 10) / 10
  let d = 'M 0 0'
  for (let k = 0; k < 4; k++) {
    const aA = a0 + (k * Math.PI) / 2
    const aB = a0 + ((k + 1) * Math.PI) / 2
    const A = P(aA), B = P(aB), tA = T(aA), tB = T(aB)
    d += ` C ${f(A.x + h * tA.x)} ${f(A.y + h * tA.y)} ${f(B.x - h * tB.x)} ${f(B.y - h * tB.y)} ${f(B.x)} ${f(B.y)}`
  }
  return d
}

/** Soft aurora blob — svg radial-gradient glow (edge-free), breathing on ken drift. */
const aurora = (
  x: number, y: number, size: number, asset: string, dur: number,
  roam = 0, roamDur = 50, delay = 0,
): SvgElement => ({
  id: uid('sv'), type: 'svg', x, y, w: size, h: size, rotation: 0, opacity: 1, asset,
  fx: {
    ambient: 'kenburns', ken: { dir: 'drift', scale: 1.22, duration: dur },
    ...(roam ? { loop: { type: 'motion-path' as const, path: floatPath(roam, (delay / roamDur) * 360), duration: roamDur } } : {}),
  },
})

/** Out-of-focus light speck (blurred svg disc) adrift on a slow closed loop. */
const bokeh = (
  x: number, y: number, s: number, warm: boolean, opacity: number,
  r: number, dur: number, stagger = 0,
): SvgElement => ({
  id: uid('sv'), type: 'svg', x, y, w: s, h: s, rotation: 0, opacity,
  asset: warm ? 'bokeh-warm' : 'bokeh-cool',
  fx: { loop: { type: 'motion-path', path: floatPath(r, (stagger / dur) * 360), duration: dur } },
})

/** Film grain for ink grounds (feTurbulence) — texture without a visible grid. */
const grain = (): SvgElement => ({
  id: uid('sv'), type: 'svg', x: 0, y: 0, w: 1280, h: 720, rotation: 0, opacity: 1,
  asset: 'grain',
})

const glow = (angle: number, stops: Array<{ at: number; color: string }>): ShapeElement =>
  shape('rect', {
    id: GLOW, x: 0, y: 0, w: 1280, h: 720, radius: 0,
    fill: 'transparent', fillGradient: { angle, stops },
    fx: { ambient: 'kenburns', ken: { dir: 'drift', scale: 1.06, duration: 34 } },
  })

// --- chart options (pure JSON, brand-styled, embedded text face) ------------

const barOption = () => ({
  color: [PEACH, STEEL],
  textStyle: { fontFamily: 'Instrument Sans' },
  tooltip: { trigger: 'axis' },
  legend: { bottom: 0, textStyle: { color: '#6B7280' } },
  grid: { left: 48, right: 16, top: 24, bottom: 56 },
  xAxis: {
    type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    axisLine: { lineStyle: { color: '#D8D2C4' } },
    axisLabel: { color: '#6B7280' },
  },
  yAxis: { type: 'value', axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#EAE4D6' } } },
  dataZoom: [{ type: 'inside' }],
  series: [
    { type: 'bar', name: 'Views', itemStyle: { borderRadius: [6, 6, 0, 0] }, data: [42, 68, 54, 86, 73] },
    { type: 'bar', name: 'Edits', itemStyle: { borderRadius: [6, 6, 0, 0] }, data: [28, 35, 42, 51, 64] },
  ],
})

const pieOption = () => ({
  color: [PEACH, PEACH_SOFT, STEEL, STEEL_SOFT, PANEL],
  textStyle: { fontFamily: 'Instrument Sans' },
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#6B7280' } },
  series: [{
    type: 'pie', radius: ['34%', '62%'],
    label: { formatter: '{b} {d}%', color: '#4A5568' },
    itemStyle: { borderColor: '#FFFFFF', borderWidth: 3 },
    data: [
      { name: 'Mon', value: 42 }, { name: 'Tue', value: 68 }, { name: 'Wed', value: 54 },
      { name: 'Thu', value: 86 }, { name: 'Fri', value: 73 },
    ],
  }],
})

const trendOption = () => ({
  textStyle: { fontFamily: 'Instrument Sans' },
  tooltip: { trigger: 'axis' },
  grid: { left: 52, right: 24, top: 20, bottom: 40 },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    axisLine: { lineStyle: { color: 'rgba(185,196,212,0.25)' } },
    axisLabel: { color: 'rgba(185,196,212,0.8)' },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: 'rgba(185,196,212,0.8)' },
    splitLine: { lineStyle: { color: 'rgba(185,196,212,0.08)' } },
  },
  dataZoom: [{ type: 'inside' }],
  series: [{
    type: 'line', name: 'Momentum', smooth: true, symbol: 'none',
    lineStyle: { color: PEACH, width: 3 },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(255,158,138,0.35)' },
          { offset: 1, color: 'rgba(255,158,138,0)' },
        ],
      },
    },
    data: [8, 9, 12, 14, 19, 24, 30, 38, 47, 58, 71, 86],
  }],
})

const scatterOption = () => ({
  color: [PEACH, STEEL],
  textStyle: { fontFamily: 'Instrument Sans' },
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#6B7280' } },
  grid: { left: 52, right: 24, top: 24, bottom: 56 },
  xAxis: {
    type: 'value', name: 'Reach',
    axisLine: { lineStyle: { color: '#D8D2C4' } },
    axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#EAE4D6' } },
  },
  yAxis: {
    type: 'value', name: 'Engagement',
    axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#EAE4D6' } },
  },
  series: [
    { type: 'scatter', name: 'Owned', symbolSize: 15, data: [[12, 8], [20, 15], [28, 12], [35, 26], [44, 22]] },
    { type: 'scatter', name: 'Paid', symbolSize: 15, data: [[52, 34], [63, 40], [71, 52], [82, 61], [92, 74]] },
  ],
})

// --- the deck ---------------------------------------------------------------

const DOTS_INK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="none">' +
  '<defs><pattern id="bp-dots-i" width="28" height="28" patternUnits="userSpaceOnUse">' +
  '<circle cx="1.5" cy="1.5" r="1.4" fill="#FFFFFF" opacity="0.07"/></pattern></defs>' +
  '<rect width="1280" height="720" fill="url(#bp-dots-i)"/></svg>'

const GRAIN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="none">' +
  '<filter id="bp-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>' +
  '<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/></filter>' +
  '<rect width="1280" height="720" filter="url(#bp-grain)"/></svg>'

const BOKEH_WARM =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
  '<defs><filter id="bp-bk-w" x="-60%" y="-60%" width="220%" height="220%">' +
  '<feGaussianBlur stdDeviation="7"/></filter></defs>' +
  '<circle cx="40" cy="40" r="21" fill="#FFE3BD" filter="url(#bp-bk-w)"/></svg>'

const BOKEH_COOL =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
  '<defs><filter id="bp-bk-c" x="-60%" y="-60%" width="220%" height="220%">' +
  '<feGaussianBlur stdDeviation="7"/></filter></defs>' +
  '<circle cx="40" cy="40" r="21" fill="#DCE6F5" filter="url(#bp-bk-c)"/></svg>'

const AURORA_PEACH =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">' +
  '<defs><radialGradient id="bp-ga-am"><stop offset="0" stop-color="#FFEED6" stop-opacity="0.15"/>' +
  '<stop offset="0.55" stop-color="#FFEED6" stop-opacity="0.05"/>' +
  '<stop offset="1" stop-color="#FFEED6" stop-opacity="0"/></radialGradient></defs>' +
  '<circle cx="300" cy="300" r="300" fill="url(#bp-ga-am)"/></svg>'

const AURORA_STEEL =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">' +
  '<defs><radialGradient id="bp-ga-bl"><stop offset="0" stop-color="#DDE7F5" stop-opacity="0.12"/>' +
  '<stop offset="0.55" stop-color="#DDE7F5" stop-opacity="0.04"/>' +
  '<stop offset="1" stop-color="#DDE7F5" stop-opacity="0"/></radialGradient></defs>' +
  '<circle cx="300" cy="300" r="300" fill="url(#bp-ga-bl)"/></svg>'

const DOTS_PAPER =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="none">' +
  '<defs><pattern id="bp-dots-p" width="28" height="28" patternUnits="userSpaceOnUse">' +
  '<circle cx="1.5" cy="1.5" r="1.4" fill="#0D1B2E" opacity="0.07"/></pattern></defs>' +
  '<rect width="1280" height="720" fill="url(#bp-dots-p)"/></svg>'

export function starterDoc(): BentoDoc {
  const doc = newDoc()
  // The DECK's title, not the app's — it reads as a document name (window title,
  // suggested filename), so it stays in title case. The lowercase `bento/slides`
  // wordmark is app chrome and is unaffected.
  doc.title = 'معرفی اسلایدهای بنتو'
  doc.theme.fontFamily = BODY
  doc.theme.headingFamily = DISPLAY
  doc.theme.accent = PEACH
  // new charts (＋ Chart, table→chart) inherit the deck's midnight-&-peach family
  doc.theme.chartPalette = [PEACH, STEEL, PEACH_SOFT, STEEL_SOFT, MIST, PEACH_DEEP]
  /**
   * Code Palette:
   * 8 colours, not four hundred scopes — the zero-cost tier. When the
   * signed-extension tier lands, grammarAssetId/themeAssetId select real
   * TextMate rendering and this map becomes the fallback.
   */
  doc.theme.codePalette = {
    c: '#6b7f8f', // comment
    s: '#c98a3e', // string
    n: '#b0688f', // number
    k: '#5b8def', // keyword
    f: '#3fa9a0', // call
    p: '#7c8794', // punctuation
    a: '#3f9142', // diff: added
    d: '#c25a43', // diff: removed
  }
  // The faces are the shell's own (fonts.ts BUILTIN_FONTS): named, not
  // embedded — 86 KB that every saved deck used to carry twice.
  doc.fonts = [
    { family: 'Vazirmatn', asset: 'builtin:vazirmatn', weight: '100 900' },
    { family: 'Fraunces', asset: 'builtin:fraunces-900', weight: '900' },
    { family: 'Instrument Sans', asset: 'builtin:instrument-sans', weight: '400 700' },
  ]
  doc.assets = {
    'dots-ink': DOTS_INK,
    'dots-paper': DOTS_PAPER,
    'aurora-amber': AURORA_PEACH,
    'aurora-blue': AURORA_STEEL,
    'grain': GRAIN,
    'bokeh-warm': BOKEH_WARM,
    'bokeh-cool': BOKEH_COOL,
  }

  const slide = (p: Partial<Slide> & { elements: SlideElement[] }): Slide => ({
    id: uid('slide'), background: INK, transition: 'morph', notes: '', ...p,
  })

  doc.slides = [
    // ── 1 · TITLE ──────────────────────────────────────────────────────────
    slide({
      transition: 'fade',
      notes:
        'Welcome! This whole deck — data, viewer, editor — lives in one HTML file. ' +
        '→ advances, Esc edits, S opens the speaker view. Watch the tiles: they morph through every slide.',
      elements: [
        grain(),
        glow(135, [
          { at: 0, color: 'rgba(94,118,153,0.22)' },
          { at: 0.55, color: 'rgba(15,23,36,0)' },
          { at: 1, color: 'rgba(255,158,138,0.16)' },
        ]),
        shape('rect', {
          x: 0, y: 0, w: 1280, h: 720, radius: 0, fill: 'transparent',
          fillGradient: {
            angle: 250,
            stops: [
              { at: 0, color: 'rgba(255,158,138,0.10)' },
              { at: 0.5, color: 'rgba(15,23,36,0)' },
              { at: 1, color: 'rgba(62,86,120,0.10)' },
            ],
          },
        }),
        // atmosphere: breathing aurora blobs + bento tiles adrift around the logo
        dots(true, { ambient: 'kenburns', ken: { dir: 'out', scale: 1.35, duration: 3.2 } }),
        aurora(700, -80, 680, 'aurora-amber', 24, 80, 52),
        aurora(880, 220, 560, 'aurora-blue', 32, 70, 44, 10),
        // near field — large, bright, biggest drift
        bokeh(770, 128, 44, true, 0.5, 39, 17),
        bokeh(1198, 208, 30, false, 0.42, 48, 14, 5),
        bokeh(1174, 468, 36, true, 0.34, 60, 20, 11),
        bokeh(1226, 600, 26, true, 0.3, 45, 16, 7),
        bokeh(716, 560, 28, false, 0.3, 51, 18, 13),
        // mid field
        bokeh(902, 108, 20, false, 0.38, 36, 12, 8),
        bokeh(812, 520, 18, true, 0.3, 39, 14, 15),
        bokeh(1080, 88, 16, true, 0.32, 33, 11, 3),
        bokeh(960, 604, 18, false, 0.28, 42, 12, 9),
        bokeh(656, 78, 14, false, 0.3, 30, 10, 12),
        // far field — small, dim, may pass over the text column
        bokeh(200, 138, 10, false, 0.22, 24, 9, 2),
        bokeh(420, 88, 8, true, 0.2, 21, 10, 6),
        bokeh(300, 566, 10, true, 0.22, 27, 8, 10),
        bokeh(522, 622, 8, false, 0.2, 22, 11, 4),
        bokeh(138, 424, 8, false, 0.18, 21, 10, 14),
        bokeh(624, 296, 7, true, 0.16, 18, 10, 18),
        // the bento logo, built from the cast
        shape('rect', {
          id: T_D, x: 850, y: 170, w: 320, h: 320, radius: 40, fill: PANEL, fillGradient: GRAD_CARD,
          shadow: [{ blur: 56, color: 'rgba(255,240,220,0.18)' }, { y: 28, blur: 60, color: 'rgba(0,0,0,0.5)' }],
          fx: { enter: 'fade', order: 1 },
        }),
        shape('rect', { id: T_B, x: 886, y: 206, w: 84, h: 248, radius: 16, fill: STEEL, fillGradient: GRAD_STEEL, fx: { enter: 'fade-up', order: 2 } }),
        shape('rect', { id: T_A, x: 986, y: 206, w: 148, h: 112, radius: 16, fill: PEACH, fillGradient: GRAD_PEACH, fx: { enter: 'fade-up', order: 3 } }),
        shape('rect', { id: T_C, x: 986, y: 334, w: 148, h: 120, radius: 16, fill: TILE_PAPER, fillGradient: GRAD_PAPER, fx: { enter: 'fade-up', order: 4 } }),
        kicker('BENTO/SLIDES', { fx: { enter: 'fade-up', order: 0 } }),
        shape('rect', { x: 96, y: 86, w: 1088, h: 1.5, radius: 0, fill: 'rgba(255,255,255,0.12)', fx: { enter: 'fade', order: 0 } }),
        title('خود فایل،<br>نرم‌افزار<br>است.', {
          x: 88, y: 122, w: 660, h: 372, fontSize: 112, lineHeight: 1.02, color: '#FFFFFF',
          fx: { enter: 'fade-up', order: 1, ambient: 'kenburns', ken: { dir: 'out', scale: 1.05, duration: 2.6 } },
        }),
        text({
          x: 96, y: 524, w: 520, h: 76,
          html: 'یک فایل HTML — اسلاید، بیننده و ویرایشگر در یک‌جا.<br>در هر کجا باز کنید. خودش خودش را ذخیره می‌کند.',
          fontSize: 20, fontWeight: 500, color: MIST, lineHeight: 1.6,
          fx: { enter: 'fade-up', order: 3 },
        }),
        // keycap hints — real keys, not a text string
        ...([
          [96, 36, '→', 'بعدی', 60],
          [218, 46, 'ESC', 'ویرایش', 60],
          [350, 32, 'S', 'نمای گوینده', 110],
        ] as Array<[number, number, string, string, number]>).flatMap(([kx, kw, key, label, lw]) => [
          shape('rect', {
            x: kx, y: 630, w: kw, h: 30, radius: 8, fill: 'rgba(255,255,255,0.055)',
            stroke: 'rgba(255,255,255,0.22)', strokeWidth: 1, fx: { enter: 'fade', order: 6 },
          }),
          text({
            x: kx, y: 637, w: kw, h: 18, html: key, align: 'center',
            fontSize: 12.5, fontWeight: 600, color: 'rgba(230,237,247,0.85)',
            fx: { enter: 'fade', order: 6 },
          }),
          text({
            x: kx + kw + 12, y: 639, w: lw, h: 16, html: label,
            fontSize: 11.5, fontWeight: 600, letterSpacing: 1.8, color: 'rgba(182,193,210,0.55)',
            fx: { enter: 'fade', order: 6 },
          }),
        ]),
      ],
    }),

    // ── 2 · ONE FILE ───────────────────────────────────────────────────────
    slide({
      background: PAPER,
      notes:
        'The tiles just morphed into the file anatomy. The dashed outline marches — a one-select loop effect. ' +
        'Everything on the right is ordinary rich text.',
      elements: [
        dots(false),
        glow(180, [
          { at: 0, color: 'rgba(255,158,138,0.07)' },
          { at: 1, color: 'rgba(94,118,153,0.05)' },
        ]),
        ghost(),
        kicker('یک فایل مستقل', { color: PEACH_DEEP }),
        ...furniture(false),
        title('همه چیز در یک فایل.'),
        shape('rect', {
          x: 84, y: 208, w: 444, h: 420, radius: 26, fill: 'transparent',
          stroke: PEACH, strokeWidth: 2, strokeStyle: 'dashed',
          fx: { loop: { type: 'dash-march', distance: 18, duration: 1.6 } },
        }),
        shape('rect', { id: T_D, x: 96, y: 220, w: 420, h: 396, radius: 20, fill: '#FFFFFF', stroke: CARD_STROKE, strokeWidth: 1.5 }),
        shape('rect', { id: T_A, x: 120, y: 244, w: 372, h: 104, radius: 12, fill: PEACH }),
        shape('rect', { id: T_B, x: 120, y: 364, w: 372, h: 124, radius: 12, fill: STEEL }),
        shape('rect', { id: T_C, x: 120, y: 504, w: 372, h: 88, radius: 12, fill: TILE_PAPER }),
        text({ x: 144, y: 270, w: 330, h: 58, html: '<b>اسلایدهای شما</b> — به شکل JSON درون فایل', fontSize: 18, fontWeight: 500, color: INK, lineHeight: 1.45 }),
        text({ x: 144, y: 394, w: 330, h: 70, html: '<b>بیننده و ارائه</b> — مورف، نمودار، نمای گوینده', fontSize: 18, fontWeight: 500, color: '#FFFFFF', lineHeight: 1.45 }),
        text({ x: 144, y: 524, w: 330, h: 50, html: '<b>خود ویرایشگر</b> — با کلید Esc، همین‌جاست', fontSize: 18, fontWeight: 500, color: INK_SOFT, lineHeight: 1.45 }),
        text({
          x: 600, y: 236, w: 584, h: 300,
          html:
            '<b>ذخیره‌سازی خودکار</b> — با ⌘S همین فایل بازنویسی می‌شود<br>' +
            '<b>بدون نیاز به نصب</b> — یک مرورگر تمام نیاز شماست<br>' +
            '<b>دارایی‌های درون‌ساز</b> — تصاویر و فونت‌ها در خود فایل ذخیره می‌شوند<br>' +
            '<b>شفاف و صادق</b> — سند شما یک فایل JSON خواناست',
          fontSize: 20, fontWeight: 500, color: INK, lineHeight: 2.1,
        }),
        text({
          x: 600, y: 556, w: 560, h: 50,
          html: 'به‌روزرسانی؟ فایل هنگام باز شدن نسخه جدید را بررسی می‌کند — <b>می‌توانید خاموشش کنید</b> — و خود را به‌روز می‌کند.',
          fontSize: 15, fontWeight: 500, color: INK_SOFT, lineHeight: 1.55,
        }),
      ],
    }),

    // ── 3 · NO MOVING PARTS (staggers + count-ups, arriving by morph) ─────
    // This was a 'fade' because entrance fx and count-ups once needed a
    // non-morph arrival. Both have worked on morph arrivals since #197 —
    // runMorph gives every unpartnered element its fx.enter, and
    // runMorphArrivalCountUps counts up anything not carried from the previous
    // slide — so the fade only cost the deck its best tile moment: the four
    // scattered tiles collapsing into the row of chips at the top-left.
    slide({
      background: PEACH,
      notes:
        'The four tiles just collapsed into that row of chips — same four shapes, all deck long. ' +
        'The numbers counted up as the slide entered; ' +
        'that’s one checkbox on any text element. The little lines show line endings: arrow, dot, bar.',
      elements: [
        shape('rect', { id: T_D, x: 96, y: 54, w: 34, h: 34, radius: 9, fill: INK }),
        shape('rect', { id: T_B, x: 140, y: 54, w: 34, h: 34, radius: 9, fill: STEEL }),
        shape('rect', { id: T_A, x: 184, y: 54, w: 34, h: 34, radius: 9, fill: PEACH_SOFT }),
        shape('rect', { id: T_C, x: 228, y: 54, w: 34, h: 34, radius: 9, fill: PAPER }),
        text({
          x: 1024, y: 54, w: 160, h: 26, html: '{{page:2}}', align: 'right',
          fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'rgba(15,23,36,0.45)',
        }),
        shape('rect', { x: 96, y: 108, w: 1088, h: 1.5, radius: 0, fill: 'rgba(15,23,36,0.18)' }),
        // No fx on these two: the kicker and title carry the SAME ids as the
        // slide before, so they morph across and are already in motion. An
        // fx.enter here would be silently skipped — the entrance only runs for
        // elements with no partner on the previous slide.
        kicker('بدون وابستگی', { y: 132, color: INK }),
        title('نرم‌افزاری بدون نیاز به نصب،<br>بدون خرابی و بدون تاریخ انقضا.', {
          y: 170, w: 1060, h: 150, color: INK, fontSize: 50,
        }),
        text({ x: 96, y: 356, w: 352, h: 180, html: '1', fontSize: 150, fontWeight: 900, fontFamily: DISPLAY, color: INK, fx: { enter: 'fade-up', order: 2, countUp: true } }),
        text({ x: 464, y: 356, w: 352, h: 180, html: '0', fontSize: 150, fontWeight: 900, fontFamily: DISPLAY, color: INK, fx: { enter: 'fade-up', order: 3, countUp: true } }),
        text({ x: 832, y: 356, w: 352, h: 180, html: '100%', fontSize: 130, fontWeight: 900, fontFamily: DISPLAY, color: INK, fx: { enter: 'fade-up', order: 4, countUp: true } }),
        shape('line', { x: 100, y: 542, w: 150, h: 8, fill: INK, strokeWidth: 3, lineEnd: 'arrow', fx: { enter: 'fade', order: 5 } }),
        shape('line', { x: 468, y: 542, w: 150, h: 8, fill: INK, strokeWidth: 3, lineStart: 'dot', lineEnd: 'dot', fx: { enter: 'fade', order: 5 } }),
        shape('line', { x: 836, y: 542, w: 150, h: 8, fill: INK, strokeWidth: 3, lineStart: 'bar', lineEnd: 'bar', fx: { enter: 'fade', order: 5 } }),
        text({ x: 96, y: 570, w: 352, h: 30, html: 'فایل برای ارسال', fontSize: 14, fontWeight: 700, letterSpacing: 2, color: INK_SOFT, fx: { enter: 'fade', order: 6 } }),
        text({ x: 464, y: 570, w: 352, h: 30, html: 'سرور مورد نیاز', fontSize: 14, fontWeight: 700, letterSpacing: 2, color: INK_SOFT, fx: { enter: 'fade', order: 6 } }),
        text({ x: 832, y: 570, w: 352, h: 30, html: 'همیشه مال شما', fontSize: 14, fontWeight: 700, letterSpacing: 2, color: INK_SOFT, fx: { enter: 'fade', order: 6 } }),
      ],
    }),

    // ── 4 · MORPH MANIFESTO ────────────────────────────────────────────────
    slide({
      notes:
        'The tiles scattered and grew — and picked up GRADIENT fills mid-morph (solid⇄gradient tweening). ' +
        'Press ← and → to replay it. Nothing here is a video; it’s the same four elements.',
      elements: [
        grain(),
        glow(20, [
          { at: 0, color: 'rgba(62,86,120,0.24)' },
          { at: 0.6, color: 'rgba(15,23,36,0)' },
          { at: 1, color: 'rgba(255,158,138,0.18)' },
        ]),
        shape('rect', {
          id: T_A, x: -140, y: -160, w: 520, h: 520, radius: 130, fill: PEACH,
          fillGradient: { angle: 135, stops: [{ at: 0, color: PEACH }, { at: 1, color: PEACH_SOFT }] },
        }),
        shape('rect', {
          id: T_B, x: 980, y: -120, w: 420, h: 420, radius: 110, fill: STEEL,
          fillGradient: { angle: 225, stops: [{ at: 0, color: '#41597A' }, { at: 1, color: STEEL_SOFT }] },
        }),
        shape('rect', {
          id: T_C, x: 1040, y: 520, w: 360, h: 360, radius: 96, fill: TILE_PAPER, opacity: 0.9,
          fillGradient: { angle: 315, stops: [{ at: 0, color: '#FFFFFF' }, { at: 1, color: '#D8D3C6' }] },
        }),
        shape('rect', {
          id: T_D, x: -70, y: 510, w: 290, h: 290, radius: 80, fill: 'transparent',
          stroke: 'rgba(185,196,212,0.4)', strokeWidth: 2, strokeStyle: 'dashed',
        }),
        kicker('انیمیشن اختصاصی', { x: 340, y: 168, w: 600, h: 26, align: 'center' }),
        title('مورف.', {
          x: 140, y: 200, w: 1000, h: 280, fontSize: 216, color: '#FFFFFF', align: 'center', lineHeight: 1,
        }),
        text({
          x: 340, y: 512, w: 600, h: 80,
          html: 'المان‌های با شناسه یکسان بین اسلایدها جابه‌جا می‌شوند — موقعیت، اندازه، رنگ و <b>حتی گرادیان‌ها</b>.<br>کلید ← و سپس → را بزنید.',
          fontSize: 19, fontWeight: 500, color: MIST, align: 'center', lineHeight: 1.65,
        }),
      ],
    }),

    // ── 5 · SYMBOL MORPH, SIDE BY SIDE (maths and code, one mechanism) ────
    // The deck's sub-element morph, shown on BOTH content types at once: a
    // quadratic derivation on the left, three eras of JavaScript on the right.
    // Same engine underneath (tokens carry identities across slides and travel
    // to their new positions), two very different surfaces on top — which is
    // the claim this pair of columns is here to make.
    //
    // The maths is the classic three-step derivation, so the beats line up
    // with the code's callbacks -> promises (ES2015) -> async/await (ES2017):
    // a, b and c survive all three on the left while load, render, present and
    // confetti survive all three on the right. Both probed before authoring.
    slide({
      transition: 'morph',
      notes:
        'Two token streams, one mechanism. Both sides of this slide morph symbol by symbol: the maths is plain \u0024\u2026\u0024 in an ordinary text box, the code is a code element with 77 languages built in (about 7KB of rules, no highlighter library). Press \u2192 and watch BOTH at once \u2014 a, b and c travel through the derivation while the callback pyramid flattens into promises.',
      elements: [
        grain(),
        glow(20, [
          { at: 0, color: 'rgba(62,86,120,0.24)' },
          { at: 0.55, color: 'rgba(15,23,36,0)' },
          { at: 1, color: 'rgba(255,158,138,0.16)' },
        ]),
        shape('rect', {
          id: T_A, x: -130, y: 470, w: 300, h: 300, radius: 92, fill: PEACH,
          fillGradient: { angle: 45, stops: [{ at: 0, color: PEACH }, { at: 1, color: PEACH_SOFT }] },
        }),
        shape('rect', {
          id: T_B, x: 1060, y: -150, w: 340, h: 340, radius: 100, fill: STEEL,
          fillGradient: { angle: 200, stops: [{ at: 0, color: '#41597A' }, { at: 1, color: STEEL_SOFT }] },
        }),
        shape('rect', {
          id: T_C, x: 1080, y: 520, w: 260, h: 260, radius: 78, fill: TILE_PAPER, opacity: 0.85,
          fillGradient: { angle: 30, stops: [{ at: 0, color: '#FFFFFF' }, { at: 1, color: '#D8D3C6' }] },
        }),
        shape('rect', {
          id: T_D, x: -80, y: -120, w: 240, h: 240, radius: 68, fill: 'transparent',
          stroke: 'rgba(185,196,212,0.4)', strokeWidth: 2, strokeStyle: 'dashed',
        }),
        kicker('یک سازوکار، دو زبان', { x: 340, y: 128, w: 600, h: 26, align: 'center' }),
        // Column labels — small, so the two halves read as a comparison.
        text({
          x: 96, y: 186, w: 480, h: 24, html: 'ریاضیات — نوشتن مستقیم <b>\\$\u2026\\$</b> درون جعبه متن',
          fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(185,196,212,0.62)',
          align: 'left', valign: 'middle',
        }),
        text({
          x: 640, y: 186, w: 544, h: 24, html: 'کد برنامه — <b>۷۷ زبان</b> به‌صورت توکار',
          fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(185,196,212,0.62)',
          align: 'left', valign: 'middle',
        }),
        // LEFT: the derivation. Display mode so fractions and the radical set
        // at full size; a, b and c travel between the three beats.
        text({
          id: EQ, x: 96, y: 226, w: 480, h: 280,
          html: '$$ax^2 + bx + c = 0$$',
          fontSize: 30, color: '#FFFFFF', align: 'center', valign: 'middle',
        }),
        // RIGHT: the same trick on code, running at the same time.
        {
          ...defaultCode({ id: CODE_ID, x: 640, y: 226, w: 544, h: 280 }),
          content: "load(deck, (slides) => {\n  render(slides, (frame) => {\n    present(frame)\n  })\n})\nconfetti()",
          grammarName: 'js', fontSize: 19, lineHeight: 1.62, color: '#DCE3EC',
          align: 'left', valign: 'middle',
        },
        text({
          x: 190, y: 560, w: 900, h: 60,
          html: 'فرمول در چپ، دو نسخه از کد در راست. دو بار کلید <b>→</b> را بزنید.',
          fontSize: 19, fontWeight: 500, color: MIST, align: 'center', lineHeight: 1.65,
        }),
      ],
    }),

    slide({
      transition: 'morph',
      notes:
        'Left: completing the square \u2014 a, b and c did not crossfade, they moved into their new places. Right: the pyramid flattened and confetti() rose two lines to meet it. Point-free promises really did drop the parameter names, so slides and frame fading out is the diff being honest. One more \u2192.',
      elements: [
        grain(),
        glow(200, [
          { at: 0, color: 'rgba(62,86,120,0.24)' },
          { at: 0.55, color: 'rgba(15,23,36,0)' },
          { at: 1, color: 'rgba(255,158,138,0.16)' },
        ]),
        shape('rect', {
          id: T_A, x: -100, y: 500, w: 270, h: 270, radius: 84, fill: PEACH,
          fillGradient: { angle: 45, stops: [{ at: 0, color: PEACH }, { at: 1, color: PEACH_SOFT }] },
        }),
        shape('rect', {
          id: T_B, x: 1084, y: -128, w: 310, h: 310, radius: 92, fill: STEEL,
          fillGradient: { angle: 200, stops: [{ at: 0, color: '#41597A' }, { at: 1, color: STEEL_SOFT }] },
        }),
        shape('rect', {
          id: T_C, x: 1054, y: 500, w: 286, h: 286, radius: 84, fill: TILE_PAPER, opacity: 0.85,
          fillGradient: { angle: 30, stops: [{ at: 0, color: '#FFFFFF' }, { at: 1, color: '#D8D3C6' }] },
        }),
        shape('rect', {
          id: T_D, x: -90, y: -134, w: 260, h: 260, radius: 74, fill: 'transparent',
          stroke: 'rgba(185,196,212,0.4)', strokeWidth: 2, strokeStyle: 'dashed',
        }),
        kicker('هر عبارت در جای خود', { x: 340, y: 128, w: 600, h: 26, align: 'center' }),
        // Column labels — small, so the two halves read as a comparison.
        text({
          x: 96, y: 186, w: 480, h: 24, html: 'ریاضیات — نوشتن مستقیم <b>\\$\u2026\\$</b> درون جعبه متن',
          fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(185,196,212,0.62)',
          align: 'left', valign: 'middle',
        }),
        text({
          x: 640, y: 186, w: 544, h: 24, html: 'کد برنامه — <b>۷۷ زبان</b> به‌صورت توکار',
          fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(185,196,212,0.62)',
          align: 'left', valign: 'middle',
        }),
        // LEFT: the derivation. Display mode so fractions and the radical set
        // at full size; a, b and c travel between the three beats.
        text({
          id: EQ, x: 96, y: 226, w: 480, h: 280,
          html: '$$\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}$$',
          fontSize: 30, color: '#FFFFFF', align: 'center', valign: 'middle',
        }),
        // RIGHT: the same trick on code, running at the same time.
        {
          ...defaultCode({ id: CODE_ID, x: 640, y: 226, w: 544, h: 280 }),
          content: "load(deck)\n  .then(render)\n  .then(present)\nconfetti()",
          grammarName: 'js', fontSize: 19, lineHeight: 1.62, color: '#DCE3EC',
          align: 'left', valign: 'middle',
        },
        text({
          x: 190, y: 560, w: 900, h: 60,
          html: 'فرمول مربع کامل و ساده شدن کد — <b>هر دو همزمان جابه‌جا می‌شوند</b>.',
          fontSize: 19, fontWeight: 500, color: MIST, align: 'center', lineHeight: 1.65,
        }),
      ],
    }),

    slide({
      transition: 'morph',
      notes:
        'async/await on the right, the quadratic formula on the left \u2014 and every symbol that survived the rewrite kept its identity the whole way. This is what a walkthrough is in Bento: duplicate the slide, edit the content, and the transition explains the change for you. No recording, no screenshots.',
      elements: [
        grain(),
        glow(20, [
          { at: 0, color: 'rgba(62,86,120,0.24)' },
          { at: 0.55, color: 'rgba(15,23,36,0)' },
          { at: 1, color: 'rgba(255,158,138,0.16)' },
        ]),
        shape('rect', {
          id: T_A, x: -70, y: 520, w: 250, h: 250, radius: 78, fill: PEACH,
          fillGradient: { angle: 45, stops: [{ at: 0, color: PEACH }, { at: 1, color: PEACH_SOFT }] },
        }),
        shape('rect', {
          id: T_B, x: 1100, y: -110, w: 290, h: 290, radius: 88, fill: STEEL,
          fillGradient: { angle: 200, stops: [{ at: 0, color: '#41597A' }, { at: 1, color: STEEL_SOFT }] },
        }),
        shape('rect', {
          id: T_C, x: 1030, y: 480, w: 310, h: 310, radius: 92, fill: TILE_PAPER, opacity: 0.85,
          fillGradient: { angle: 30, stops: [{ at: 0, color: '#FFFFFF' }, { at: 1, color: '#D8D3C6' }] },
        }),
        shape('rect', {
          id: T_D, x: -100, y: -150, w: 280, h: 280, radius: 80, fill: 'transparent',
          stroke: 'rgba(185,196,212,0.4)', strokeWidth: 2, strokeStyle: 'dashed',
        }),
        kicker('هیچ چیز دوباره رسم نشد', { x: 340, y: 128, w: 600, h: 26, align: 'center' }),
        // Column labels — small, so the two halves read as a comparison.
        text({
          x: 96, y: 186, w: 480, h: 24, html: 'ریاضیات — نوشتن مستقیم <b>\\$\u2026\\$</b> درون جعبه متن',
          fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(185,196,212,0.62)',
          align: 'left', valign: 'middle',
        }),
        text({
          x: 640, y: 186, w: 544, h: 24, html: 'کد برنامه — <b>۷۷ زبان</b> به‌صورت توکار',
          fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(185,196,212,0.62)',
          align: 'left', valign: 'middle',
        }),
        // LEFT: the derivation. Display mode so fractions and the radical set
        // at full size; a, b and c travel between the three beats.
        text({
          id: EQ, x: 96, y: 226, w: 480, h: 280,
          html: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
          fontSize: 30, color: '#FFFFFF', align: 'center', valign: 'middle',
        }),
        // RIGHT: the same trick on code, running at the same time.
        {
          ...defaultCode({ id: CODE_ID, x: 640, y: 226, w: 544, h: 280 }),
          content: "const slides = await load(deck)\nconst frame = await render(slides)\npresent(frame)\nconfetti()",
          grammarName: 'js', fontSize: 19, lineHeight: 1.62, color: '#DCE3EC',
          align: 'left', valign: 'middle',
        },
        text({
          x: 190, y: 560, w: 900, h: 60,
          html: 'همان <b>a</b>، <b>b</b>، <b>c</b>. همان توابع کد. تفاوت فقط در انیمیشن انتقال است.',
          fontSize: 19, fontWeight: 500, color: MIST, align: 'center', lineHeight: 1.65,
        }),
      ],
    }),

    // ── 6 · CHARTS ALIVE (+ hidden pie state) ──────────────────────────────
    slide({
      id: S_CHARTS,
      background: PAPER,
      notes:
        'The chart is a live ECharts instance while presenting: hover for tooltips, scroll to zoom. ' +
        'Click “See the split” — it jumps to a hidden state slide and the bars MORPH into a pie.',
      elements: [
        dots(false),
        kicker('داده‌های زنده', { color: PEACH_DEEP }),
        ...furniture(false),
        title('نمودارهایی با ضربان حیات.'),
        shape('rect', { id: T_C, x: 72, y: 196, w: 828, h: 458, radius: 20, fill: '#FFFFFF', stroke: CARD_STROKE, strokeWidth: 1.5, shadow: { y: 14, blur: 34, color: 'rgba(30,42,58,0.10)' } }),
        { ...defaultChart(barOption()), id: CHART_MAIN, x: 96, y: 220, w: 780, h: 410, preset: 'bar' },
        shape('rect', { id: T_D, x: 920, y: 196, w: 264, h: 458, radius: 18, fill: PANEL, shadow: { y: 14, blur: 34, color: 'rgba(30,42,58,0.18)' } }),
        shape('rect', { id: T_A, x: 944, y: 222, w: 44, h: 6, radius: 3, fill: PEACH }),
        text({
          x: 944, y: 248, w: 216, h: 210,
          html: '<b>ماوس را روی ستون‌ها ببرید</b> — تولتیپ‌ها زنده هستند.<br><br>برای بزرگ‌نمایی داخل نمودار اسکرول کنید.',
          fontSize: 16.5, fontWeight: 500, color: MIST, lineHeight: 1.7,
        }),
        shape('rect', {
          id: T_B, x: 944, y: 560, w: 216, h: 52, radius: 26, fill: STEEL, fillGradient: GRAD_STEEL,
          stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1,
        }),
        text({
          x: 944, y: 574, w: 216, h: 28, html: 'نمایش دایره‌ای ←', fontSize: 17, fontWeight: 700,
          color: '#FFFFFF', align: 'center',
        }),
        // ONE interactive surface per control: an invisible hit rect above
        // button + label — a single, coherent hover outline, and the label
        // never swallows the click (hard-won detail #7)
        shape('rect', {
          id: 'sd-hit-charts', x: 944, y: 560, w: 216, h: 52, radius: 26,
          fill: 'rgba(0,0,0,0)', link: S_CHARTS_PIE,
        }),
      ],
    }),
    slide({
      id: S_CHARTS_PIE,
      stateOf: S_CHARTS,
      background: PAPER,
      name: 'pie split',
      notes:
        'A hidden STATE slide — linear navigation skips it; only the click reaches it. Same chart element id, ' +
        'different option: ECharts’ universal transition morphs bar→pie in place. Click back.',
      elements: [
        dots(false),
        kicker('داده‌های زنده', { color: PEACH_DEEP }),
        ...furniture(false),
        title('همان نمودار، در قالبی نو.'),
        shape('rect', { id: T_C, x: 72, y: 196, w: 828, h: 458, radius: 20, fill: '#FFFFFF', stroke: CARD_STROKE, strokeWidth: 1.5, shadow: { y: 14, blur: 34, color: 'rgba(30,42,58,0.10)' } }),
        { ...defaultChart(pieOption()), id: CHART_MAIN, x: 96, y: 220, w: 780, h: 410, preset: 'pie' },
        shape('rect', { id: T_D, x: 920, y: 196, w: 264, h: 458, radius: 18, fill: PANEL, shadow: { y: 14, blur: 34, color: 'rgba(30,42,58,0.18)' } }),
        shape('rect', { id: T_A, x: 944, y: 222, w: 44, h: 6, radius: 3, fill: PEACH }),
        text({
          x: 944, y: 248, w: 216, h: 210,
          html: 'این یک <b>حالت پنهان</b> است — کلیدهای جهت‌نما از آن رد می‌شوند و با کلیک باز می‌شود.<br><br>داده‌ها در جای خود دگرگون شدند.',
          fontSize: 16.5, fontWeight: 500, color: MIST, lineHeight: 1.7,
        }),
        shape('rect', {
          id: T_B, x: 944, y: 560, w: 216, h: 52, radius: 26, fill: STEEL, fillGradient: GRAD_STEEL,
          stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1,
        }),
        text({
          x: 944, y: 574, w: 216, h: 28, html: 'نمایش پراکندگی ←', fontSize: 17, fontWeight: 700,
          color: '#FFFFFF', align: 'center',
        }),
        shape('rect', {
          id: 'sd-hit-charts', x: 944, y: 560, w: 216, h: 52, radius: 26,
          fill: 'rgba(0,0,0,0)', link: S_CHARTS_SCATTER,
        }),
      ],
    }),
    slide({
      id: S_CHARTS_SCATTER,
      stateOf: S_CHARTS,
      background: PAPER,
      name: 'scatter',
      notes:
        'A third hidden state — the same chart element id becomes a SCATTER plot (bar⇄pie⇄scatter all morph in place). ' +
        'Two clusters show a reach↔engagement correlation. Click to cycle back to the bars.',
      elements: [
        dots(false),
        kicker('داده‌های زنده', { color: PEACH_DEEP }),
        ...furniture(false),
        title('و نمودار پراکندگی.'),
        shape('rect', { id: T_C, x: 72, y: 196, w: 828, h: 458, radius: 20, fill: '#FFFFFF', stroke: CARD_STROKE, strokeWidth: 1.5, shadow: { y: 14, blur: 34, color: 'rgba(30,42,58,0.10)' } }),
        { ...defaultChart(scatterOption()), id: CHART_MAIN, x: 96, y: 220, w: 780, h: 410, preset: 'scatter' },
        shape('rect', { id: T_D, x: 920, y: 196, w: 264, h: 458, radius: 18, fill: PANEL, shadow: { y: 14, blur: 34, color: 'rgba(30,42,58,0.18)' } }),
        shape('rect', { id: T_A, x: 944, y: 222, w: 44, h: 6, radius: 3, fill: PEACH }),
        text({
          x: 944, y: 248, w: 216, h: 210,
          html: 'همان المان نمودار — در <b>حالت سوم</b>. هر نقطه یک شاخص است.',
          fontSize: 16.5, fontWeight: 500, color: MIST, lineHeight: 1.7,
        }),
        shape('rect', {
          id: T_B, x: 944, y: 560, w: 216, h: 52, radius: 26, fill: STEEL, fillGradient: GRAD_STEEL,
          stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1,
        }),
        text({
          x: 944, y: 574, w: 216, h: 28, html: '↺ بازگشت به ستونی', fontSize: 17, fontWeight: 700,
          color: '#FFFFFF', align: 'center',
        }),
        shape('rect', {
          id: 'sd-hit-charts', x: 944, y: 560, w: 216, h: 52, radius: 26,
          fill: 'rgba(0,0,0,0)', link: S_CHARTS,
        }),
      ],
    }),

    // ── 7 · TABLES (real HTML table) ───────────────────────────────────────
    slide({
      background: PAPER,
      notes:
        'Tables are first-class — a real HTML table rendered the same in the editor, here, and in print. ' +
        'Double-click a cell to edit, Tab moves across and Enter down, drag the dividers to resize columns. ' +
        'The little chart on the right is LIVE-LINKED to the table — edit a Signups cell and it updates instantly. ' +
        '(“Make a chart from this table” in the panel builds a linked chart like it in one click.)',
      elements: [
        dots(false),
        kicker('داده‌های ساختاریافته', { color: PEACH_DEEP }),
        ...furniture(false),
        title('واقعیت‌ها، منظم و ردیف.'),
        shape('rect', {
          id: T_C, x: 72, y: 196, w: 828, h: 458, radius: 20, fill: '#FFFFFF',
          stroke: CARD_STROKE, strokeWidth: 1.5, shadow: { y: 14, blur: 34, color: 'rgba(30,42,58,0.10)' },
        }),
        {
          ...defaultTable(),
          id: 'sd-table', x: 100, y: 240, w: 772, h: 370, header: true,
          columns: [{ w: 1.5 }, { w: 1 }, { w: 1 }],
          rows: [
            { cells: [{ html: 'فصل' }, { html: 'ثبت‌نام', align: 'right' }, { html: 'رشد', align: 'right' }] },
            { cells: [{ html: 'بهار' }, { html: '1,204', align: 'right' }, { html: '—', align: 'right' }] },
            { cells: [{ html: 'تابستان' }, { html: '3,880', align: 'right' }, { html: '+222%', align: 'right' }] },
            { cells: [{ html: 'پاییز' }, { html: '9,140', align: 'right' }, { html: '+136%', align: 'right' }] },
            { cells: [{ html: 'زمستان' }, { html: '21,500', align: 'right' }, { html: '+135%', align: 'right' }] },
          ],
          style: {
            headerBg: INK, headerColor: '#FFFFFF', zebra: 'rgba(30,42,58,0.05)',
            borderColor: 'rgba(30,42,58,0.10)', borderWidth: 1,
            cellPadX: 18, cellPadY: 12, fontSize: 18, color: '#26303E', radius: 12,
          },
        } as TableElement,
        shape('rect', {
          id: T_D, x: 920, y: 196, w: 264, h: 458, radius: 18, fill: PANEL,
          shadow: { y: 14, blur: 34, color: 'rgba(30,42,58,0.18)' },
        }),
        shape('rect', { id: T_A, x: 944, y: 222, w: 44, h: 6, radius: 3, fill: PEACH }),
        text({
          x: 944, y: 244, w: 216, h: 20, html: 'ثبت‌نام‌ها · زنده',
          fontSize: 11, fontWeight: 700, letterSpacing: 2, color: STEEL_SOFT,
        }),
        // a small DUAL-AXIS chart LINKED to the table (source): Signups bars on
        // the left axis, Growth % as a line on the right axis. Editing a cell
        // updates it (series map to numeric columns by position).
        defaultChart(
          {
            color: [PEACH, STEEL],
            grid: { left: 48, right: 42, top: 16, bottom: 26 },
            xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'], axisLabel: { color: MIST } },
            // MIST, not a half-transparent MIST. The engine used to ignore a
            // y-axis's own label colour and reuse the x-axis one, so these read
            // as MIST however they were written; once charts started honouring
            // each axis, the declared 50% alpha became visible and dropped
            // these numbers to 3.17:1 on the #16273E panel — under AA. The deck
            // had been tuned against the old behaviour, so it now says what it
            // always looked like: 8.28:1.
            yAxis: [
              { type: 'value', axisLabel: { color: MIST }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
              { type: 'value', name: 'Growth', axisLabel: { color: MIST, formatter: '{value}%' }, splitLine: { show: false } },
            ],
            series: [
              { type: 'bar', name: 'Signups', yAxisIndex: 0, data: [1204, 3880, 9140, 21500], itemStyle: { borderRadius: [4, 4, 0, 0] } },
              { type: 'line', name: 'Growth', yAxisIndex: 1, data: [0, 222, 136, 135], smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2 } },
            ],
            tooltip: { trigger: 'axis' },
          },
          { id: 'sd-tbl-chart', x: 922, y: 266, w: 262, h: 224, preset: 'bar', source: { tableId: 'sd-table' } },
        ),
        text({
          x: 944, y: 504, w: 216, h: 56,
          html: '<b>جدول را ویرایش کنید</b> — ستون‌ها و خط رشد همزمان آپدیت می‌شوند.',
          fontSize: 14, fontWeight: 500, color: MIST, lineHeight: 1.5,
        }),
        shape('rect', {
          id: T_B, x: 944, y: 588, w: 216, h: 42, radius: 21, fill: STEEL, fillGradient: GRAD_STEEL,
          stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1,
        }),
        text({
          x: 944, y: 600, w: 216, h: 22, html: 'پیوند زنده', fontSize: 13, fontWeight: 700,
          letterSpacing: 2, color: '#FFFFFF', align: 'center',
        }),
      ],
    }),

    // ── 8 · MOMENTUM (line-chart hero) ─────────────────────────────────────
    slide({
      notes:
        'A chart as scenery: full-width live area chart on ink. Drag horizontally inside it to zoom — ' +
        'dataZoom is on. The +975% is honest: it’s the data’s own range.',
      elements: [
        grain(),
        glow(200, [
          { at: 0, color: 'rgba(255,158,138,0.12)' },
          { at: 0.5, color: 'rgba(15,23,36,0)' },
          { at: 1, color: 'rgba(62,86,120,0.18)' },
        ]),
        kicker('روایت با داده‌ها'),
        ...furniture(true),
        title('رشدی که لمس می‌شود.', { color: '#FFFFFF', w: 700 }),
        text({
          x: 800, y: 96, w: 384, h: 110, html: '+975%', fontSize: 92, fontWeight: 900,
          fontFamily: DISPLAY, color: PEACH, align: 'right',
        }),
        shape('rect', { id: T_D, x: 1096, y: 208, w: 20, h: 20, radius: 6, fill: PANEL, stroke: 'rgba(185,196,212,0.3)', strokeWidth: 1 }),
        shape('rect', { id: T_B, x: 1124, y: 208, w: 20, h: 20, radius: 6, fill: STEEL }),
        shape('rect', { id: T_A, x: 1152, y: 208, w: 20, h: 20, radius: 6, fill: PEACH }),
        shape('rect', { id: T_C, x: 1180, y: 208, w: 4, h: 20, radius: 2, fill: TILE_PAPER }),
        { ...defaultChart(trendOption()), x: 64, y: 244, w: 1152, h: 420 },
      ],
    }),

    // ── 9 · MOTION & LINES ─────────────────────────────────────────────────
    slide({
      background: PAPER,
      notes:
        'The dot rides a motion path drawn with the on-canvas path editor; the dashes march underneath it. ' +
        'Paths are stored relative to the element, so you can drag the whole flow around.',
      elements: [
        dots(false),
        ghost(),
        kicker('حرکت', { color: PEACH_DEEP }),
        ...furniture(false),
        title('خطوطی که نگاه را هدایت می‌کنند.'),
        // the flow: a dashed path with a dot riding it, milestones as nodes
        shape('path', {
          x: 140, y: 240, w: 1000, h: 340, fill: 'transparent',
          stroke: 'rgba(30,42,58,0.55)', strokeWidth: 2.5, strokeStyle: 'dashed',
          d: 'M 20 300 C 260 40 520 40 640 190 C 730 305 900 305 980 110',
          pathBox: [0, 0, 1000, 340],
          fx: { loop: { type: 'dash-march', distance: 20, duration: 1.8 } },
        }),
        shape('ellipse', {
          x: 150, y: 530, w: 20, h: 20, fill: PEACH,
          fx: { loop: { type: 'motion-path', duration: 8,
            path: 'M 0 0 C 240 -260 500 -260 620 -110 C 710 5 880 5 960 -190' } },
        }),
        shape('ellipse', { x: 505, y: 321, w: 20, h: 20, fill: '#FFFFFF', stroke: INK, strokeWidth: 2.5 }),
        shape('ellipse', { x: 944, y: 496, w: 20, h: 20, fill: '#FFFFFF', stroke: INK, strokeWidth: 2.5 }),
        shape('ellipse', { x: 1106, y: 336, w: 24, h: 24, fill: PEACH, stroke: INK, strokeWidth: 2.5 }),
        text({ x: 435, y: 280, w: 160, h: 26, html: 'پیش‌نویس', fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: INK_SOFT, align: 'center' }),
        text({ x: 874, y: 532, w: 160, h: 26, html: 'بازبینی', fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: INK_SOFT, align: 'center' }),
        text({ x: 1038, y: 292, w: 160, h: 26, html: 'انتشار', fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: PEACH_DEEP, align: 'center' }),
        // tiles parked as a pill, bottom-right
        shape('rect', { id: T_D, x: 1044, y: 612, w: 140, h: 44, radius: 22, fill: '#FFFFFF', stroke: CARD_STROKE, strokeWidth: 1.5 }),
        shape('rect', { id: T_B, x: 1062, y: 626, w: 18, h: 18, radius: 6, fill: STEEL }),
        shape('rect', { id: T_A, x: 1088, y: 626, w: 18, h: 18, radius: 6, fill: PEACH }),
        shape('rect', { id: T_C, x: 1114, y: 626, w: 18, h: 18, radius: 6, fill: TILE_PAPER }),
        text({
          x: 96, y: 624, w: 800, h: 26,
          html: 'ترسیم‌شده با ویرایشگر برداری روی بوم — نقاط را بکشید تا مسیر تغییر کند.',
          fontSize: 14, fontWeight: 500, color: INK_SOFT,
        }),
      ],
    }),


    // ── 10 · CHOREOGRAPHY (base + two hidden states) ──────────────────────
    ...(() => {
      type Scene = {
        id: string; step: string; label: string; chip: string; to: string
        blocks: Array<Partial<ShapeElement> & { id: string }>
      }
      const SCENES: Scene[] = [
        {
          id: S_CHOREO, step: '01', label: 'شبکه منظم', chip: 'اجرای صحنه ۲ ←', to: S_CHOREO_2,
          blocks: [
            { id: T_D, x: 96, y: 240, w: 200, h: 170, radius: 18, fill: PANEL, fillGradient: GRAD_CARD },
            { id: T_B, x: 316, y: 240, w: 200, h: 170, radius: 18, fill: STEEL, fillGradient: GRAD_STEEL },
            { id: T_A, x: 536, y: 240, w: 200, h: 170, radius: 18, fill: PEACH, fillGradient: GRAD_PEACH },
            { id: T_C, x: 96, y: 430, w: 200, h: 170, radius: 18, fill: TILE_PAPER, fillGradient: GRAD_PAPER },
            { id: 'sd-ch-e', x: 316, y: 430, w: 200, h: 170, radius: 18, fill: PEACH_SOFT },
            { id: 'sd-ch-f', x: 536, y: 430, w: 200, h: 170, radius: 18, fill: STEEL_SOFT },
          ],
        },
        {
          id: S_CHOREO_2, step: '02', label: 'آبشار پویا', chip: 'اجرای صحنه ۳ ←', to: S_CHOREO_3,
          blocks: [
            { id: T_D, x: 110, y: 216, w: 110, h: 110, radius: 30, fill: PANEL, fillGradient: GRAD_CARD },
            { id: T_B, x: 252, y: 286, w: 150, h: 150, radius: 38, fill: STEEL, fillGradient: GRAD_STEEL },
            { id: T_A, x: 430, y: 372, w: 210, h: 150, radius: 24, fill: PEACH, fillGradient: GRAD_PEACH, rotation: 7 },
            { id: T_C, x: 188, y: 476, w: 84, h: 84, radius: 24, fill: TILE_PAPER, fillGradient: GRAD_PAPER },
            { id: 'sd-ch-e', x: 620, y: 236, w: 120, h: 190, radius: 34, fill: PEACH_SOFT, rotation: -6 },
            { id: 'sd-ch-f', x: 520, y: 566, w: 240, h: 70, radius: 22, fill: STEEL_SOFT },
          ],
        },
        {
          id: S_CHOREO_3, step: '03', label: 'نمودار داده', chip: '↺ بازگشت به صحنه ۱', to: S_CHOREO,
          blocks: [
            { id: T_D, x: 96, y: 420, w: 104, h: 220, radius: 12, fill: '#22344E' },
            { id: T_B, x: 224, y: 330, w: 104, h: 310, radius: 12, fill: STEEL_SOFT },
            { id: T_A, x: 352, y: 240, w: 104, h: 400, radius: 12, fill: PEACH, fillGradient: GRAD_PEACH },
            { id: T_C, x: 480, y: 460, w: 104, h: 180, radius: 12, fill: '#FFFFFF' },
            { id: 'sd-ch-e', x: 608, y: 360, w: 104, h: 280, radius: 12, fill: PEACH_SOFT },
            { id: 'sd-ch-f', x: 736, y: 500, w: 104, h: 140, radius: 12, fill: STEEL },
          ],
        },
      ]
      return SCENES.map((scene, si) =>
        slide({
          id: scene.id,
          ...(si > 0 ? { stateOf: S_CHOREO, name: `scene ${scene.step}` } : {}),
          notes: si === 0
            ? 'Click the button: each scene is a hidden STATE slide — same six elements, a new arrangement, ' +
              'and morph animates the whole choreography. Arrow keys skip the states; only clicks reach them.'
            : `Scene ${scene.step}. Same elements as scene 1 — position, size, color, radius and rotation all morphing at once.`,
          elements: [
            grain(),
            glow(105, [
              { at: 0, color: 'rgba(255,158,138,0.12)' },
              { at: 0.55, color: 'rgba(15,23,36,0)' },
              { at: 1, color: 'rgba(94,118,153,0.16)' },
            ]),
            kicker('حالت‌های تعاملی'),
            ...furniture(true),
            title('یک گروه. سه صحنه.', { color: '#FFFFFF' }),
            ...scene.blocks.map((b) => shape('rect', { shadow: { y: 12, blur: 30, color: 'rgba(0,0,0,0.35)' }, ...b } as Partial<ShapeElement>)),
            text({
              id: 'sd-ch-step', x: 864, y: 216, w: 320, h: 170, html: scene.step, align: 'right',
              fontSize: 140, fontWeight: 900, fontFamily: DISPLAY, color: 'rgba(255,255,255,0.14)',
            }),
            text({
              id: 'sd-ch-cap', x: 864, y: 400, w: 320, h: 30, html: scene.label, align: 'right',
              fontSize: 19, fontWeight: 600, color: MIST,
            }),
            shape('rect', {
              id: 'sd-ch-btn', x: 964, y: 452, w: 220, h: 52, radius: 26, fill: PEACH, fillGradient: GRAD_PEACH,
              shadow: { y: 10, blur: 26, color: 'rgba(0,0,0,0.4)' },
            }),
            text({
              id: 'sd-ch-btnlabel', x: 964, y: 466, w: 220, h: 28, html: scene.chip, align: 'center',
              fontSize: 16, fontWeight: 700, color: INK,
            }),
            shape('rect', {
              id: 'sd-ch-hit', x: 964, y: 452, w: 220, h: 52, radius: 26,
              fill: 'rgba(0,0,0,0)', link: scene.to,
            }),
            text({
              x: 96, y: 660, w: 800, h: 26,
              html: 'هر صحنه یک اسلاید معمولی است — المان‌ها را بچینید و دکمه را پیوند دهید.',
              fontSize: 14, fontWeight: 500, color: 'rgba(182,193,210,0.6)',
            }),
          ],
        }),
      )
    })(),

    // ── 11 · HOVER FOCUS ───────────────────────────────────────────────────
    slide({
      hover: { type: 'focus-group', dim: 0.22 },
      notes:
        'Hover any card — everything else dims. That’s a per-slide switch plus a group tag on the elements. ' +
        'Use it for dense diagrams where pointing should focus the room.',
      elements: [
        grain(),
        glow(160, [
          { at: 0, color: 'rgba(94,118,153,0.16)' },
          { at: 1, color: 'rgba(255,158,138,0.12)' },
        ]),
        kicker('تمرکز'),
        ...furniture(true),
        title('اشاره کنید؛ بقیه محو می‌شوند.', { color: '#FFFFFF' }),
        shape('rect', { id: T_D, x: 96, y: 186, w: 64, h: 6, radius: 3, fill: PEACH }),
        // card 1 — one file
        shape('rect', { x: 96, y: 228, w: 336, h: 336, radius: 18, fill: PANEL, stroke: GLASS, strokeWidth: 1, group: 'g-file' }),
        shape('rect', { id: T_A, x: 128, y: 260, w: 52, h: 52, radius: 14, fill: PEACH, group: 'g-file' }),
        text({ x: 128, y: 342, w: 272, h: 32, html: 'یک فایل', fontSize: 21, fontWeight: 700, color: '#FFFFFF', group: 'g-file' }),
        text({
          x: 128, y: 384, w: 272, h: 140,
          html: 'ارسال کنید، ذخیره کنید یا ۱۰ سال دیگر باز کنید. فایل هرگز منقضی نمی‌شود.',
          fontSize: 16, fontWeight: 500, color: MIST, lineHeight: 1.7, group: 'g-file',
        }),
        // card 2 — morph
        shape('rect', { x: 472, y: 228, w: 336, h: 336, radius: 18, fill: PANEL, stroke: GLASS, strokeWidth: 1, group: 'g-morph' }),
        shape('rect', { id: T_B, x: 504, y: 260, w: 52, h: 52, radius: 14, fill: STEEL, group: 'g-morph' }),
        text({ x: 504, y: 342, w: 272, h: 32, html: 'مورف همه‌چیز', fontSize: 21, fontWeight: 700, color: '#FFFFFF', group: 'g-morph' }),
        text({
          x: 504, y: 384, w: 272, h: 140,
          html: 'اسلایدها المان‌ها را بر اساس شناسه متصل می‌کنند و تفاوت‌ها متحرک می‌شوند.',
          fontSize: 16, fontWeight: 500, color: MIST, lineHeight: 1.7, group: 'g-morph',
        }),
        // card 3 — data
        shape('rect', { x: 848, y: 228, w: 336, h: 336, radius: 18, fill: PANEL, stroke: GLASS, strokeWidth: 1, group: 'g-data' }),
        shape('rect', { id: T_C, x: 880, y: 260, w: 52, h: 52, radius: 14, fill: TILE_PAPER, group: 'g-data' }),
        text({ x: 880, y: 342, w: 272, h: 32, html: 'داده‌های زنده', fontSize: 21, fontWeight: 700, color: '#FFFFFF', group: 'g-data' }),
        text({
          x: 880, y: 384, w: 272, h: 140,
          html: 'نمودارها کاملاً زنده هستند — دارای تولتیپ، زوم و انیمیشن بین حالت‌ها.',
          fontSize: 16, fontWeight: 500, color: MIST, lineHeight: 1.7, group: 'g-data',
        }),
        text({
          x: 96, y: 608, w: 700, h: 26, html: 'ماوس را روی کارت‌ها ببرید — همین الان حین ارائه کار می‌کند.',
          fontSize: 14, fontWeight: 500, color: 'rgba(185,196,212,0.6)',
        }),
      ],
    }),

    // ── 12 · MARKDOWN ──────────────────────────────────────────────────────
    slide({
      background: PAPER,
      notes:
        'Text editing converts markdown as you type — both panels here are ordinary text elements. ' +
        '⌘B/I/U work too, backslash escapes, and ⌘Z right after a conversion restores your literal characters.',
      elements: [
        dots(false),
        ghost(),
        kicker('نگارش', { color: PEACH_DEEP }),
        ...furniture(false),
        title('مارک‌داون بنویسید، تایپوگرافی زیبا بگیرید.'),
        shape('rect', { id: T_A, x: 96, y: 186, w: 64, h: 6, radius: 3, fill: PEACH }),
        shape('rect', { id: T_C, x: 96, y: 228, w: 520, h: 372, radius: 18, fill: '#FFFFFF', stroke: CARD_STROKE, strokeWidth: 1.5, shadow: { y: 12, blur: 30, color: 'rgba(30,42,58,0.10)' } }),
        text({ x: 128, y: 256, w: 300, h: 22, html: 'آنچه می‌نویسید', fontSize: 12, fontWeight: 700, color: PEACH_DEEP, letterSpacing: 3 }),
        text({
          x: 128, y: 300, w: 460, h: 260,
          html: '<code>**instant** *formatting*</code><br><code>- bullets as you type</code><br><code>`code` and ~~strike~~</code>',
          fontSize: 21, color: INK, lineHeight: 2.15,
        }),
        shape('line', { x: 636, y: 400, w: 116, h: 8, fill: 'rgba(30,42,58,0.5)', strokeWidth: 2.5, lineEnd: 'arrow' }),
        shape('rect', { id: T_D, x: 772, y: 228, w: 412, h: 372, radius: 18, fill: PANEL, shadow: { y: 12, blur: 30, color: 'rgba(30,42,58,0.16)' } }),
        text({ x: 804, y: 256, w: 300, h: 22, html: 'آنچه می‌بینید', fontSize: 12, fontWeight: 700, color: PEACH, letterSpacing: 3 }),
        text({
          x: 804, y: 300, w: 350, h: 260,
          html: '<b>instant</b> <i>formatting</i><br>•&nbsp; bullets as you type<br><code>code</code> and <s>strike</s>',
          fontSize: 21, fontWeight: 500, color: '#FFFFFF', lineHeight: 2.15,
        }),
        shape('rect', { id: T_B, x: 1130, y: 116, w: 54, h: 30, radius: 15, fill: STEEL }),
        text({ x: 1130, y: 122, w: 54, h: 20, html: '⌘B', fontSize: 13, fontWeight: 700, color: '#FFFFFF', align: 'center' }),
      ],
    }),

    // ── 13 · CLOSE ─────────────────────────────────────────────────────────
    slide({
      notes:
        'The cast reassembles into the logo. Press Esc — this deck is already your copy of the app: ' +
        'edit it, save it, send it. bento.page has the latest build and the story.',
      elements: [
        grain(),
        glow(0, [
          { at: 0, color: 'rgba(255,158,138,0.14)' },
          { at: 0.55, color: 'rgba(15,23,36,0)' },
          { at: 1, color: 'rgba(94,118,153,0.16)' },
        ]),
        // atmosphere mirrors the title: auroras breathing, tiles adrift
        dots(true, { ambient: 'kenburns', ken: { dir: 'out', scale: 1.35, duration: 3.2 } }),
        aurora(320, -60, 660, 'aurora-amber', 26, 80, 56),
        aurora(600, 80, 560, 'aurora-blue', 34, 70, 48, 12),
        // near field
        bokeh(404, 140, 44, true, 0.5, 39, 17),
        bokeh(872, 122, 30, false, 0.42, 48, 14, 5),
        bokeh(846, 372, 32, true, 0.34, 60, 20, 11),
        bokeh(160, 180, 26, true, 0.3, 51, 16, 3),
        bokeh(1156, 420, 28, true, 0.3, 54, 18, 9),
        // mid field
        bokeh(508, 82, 18, false, 0.36, 36, 12, 8),
        bokeh(438, 420, 18, true, 0.3, 39, 14, 15),
        bokeh(1090, 148, 24, false, 0.32, 45, 15, 7),
        bokeh(200, 520, 22, false, 0.28, 45, 13, 13),
        bokeh(1058, 600, 20, true, 0.26, 39, 12, 6),
        // far field
        bokeh(320, 300, 12, false, 0.22, 27, 10, 2),
        bokeh(958, 282, 12, true, 0.24, 30, 10, 10),
        bokeh(118, 358, 10, false, 0.2, 24, 9, 12),
        bokeh(1222, 258, 10, true, 0.22, 24, 11, 4),
        bokeh(640, 58, 10, false, 0.24, 27, 10, 16),
        bokeh(900, 478, 8, true, 0.18, 20, 9, 18),
        shape('rect', {
          id: T_D, x: 500, y: 120, w: 280, h: 280, radius: 52, fill: PANEL, fillGradient: GRAD_CARD,
          shadow: [{ blur: 56, color: 'rgba(255,240,220,0.18)' }, { y: 28, blur: 60, color: 'rgba(0,0,0,0.5)' }],
        }),
        shape('rect', { id: T_B, x: 532, y: 152, w: 70, h: 216, radius: 14, fill: STEEL, fillGradient: GRAD_STEEL }),
        shape('rect', { id: T_A, x: 618, y: 152, w: 130, h: 96, radius: 14, fill: PEACH, fillGradient: GRAD_PEACH }),
        shape('rect', { id: T_C, x: 618, y: 264, w: 130, h: 104, radius: 14, fill: TILE_PAPER, fillGradient: GRAD_PAPER }),
        kicker('نوبت شماست', { x: 340, y: 452, w: 600, h: 24, align: 'center' }),
        title('ارائه‌های خود را بسازید.', {
          x: 240, y: 484, w: 800, h: 104, fontSize: 88, color: '#FFFFFF', align: 'center',
          fx: { ambient: 'kenburns', ken: { dir: 'out', scale: 1.05, duration: 2.6 } },
        }),
        text({
          x: 290, y: 600, w: 700, h: 28,
          html: 'کلید <b>Esc</b> را بزنید — این فایل از همین لحظه ویرایشگر شخصی شماست.',
          fontSize: 17, fontWeight: 500, color: MIST, align: 'center',
        }),
        shape('rect', { x: 562, y: 644, w: 156, h: 44, radius: 22, fill: PEACH, fillGradient: GRAD_PEACH, shadow: { y: 10, blur: 26, color: 'rgba(0,0,0,0.4)' } }),
        text({
          x: 562, y: 655, w: 156, h: 24, html: 'bento.page', fontSize: 16, fontWeight: 700,
          color: INK, align: 'center',
        }),
      ],
    }),
  ]

  return doc
}
