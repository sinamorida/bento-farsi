#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// The gallery decks — four distinct art directions distilled from
// Awwwards Site-of-the-Year style FAMILIES (immersive dark tech,
// editorial typography, premium minimal commerce, playful toy-like).
// All brands and content are FICTIONAL; nothing is copied from any site.
//
//   node scripts/build-example-decks.mjs [outDir]     (default: working/)
//
// Output: <outDir>/<name>.bento.html — each doc carries template:true, so
// every open instantiates a fresh, independent deck (the .dotx semantics).
// release.mjs runs this into site/gallery/ for the landing page's gallery.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const shell = readFileSync(join(root, 'slides/dist-single/Bento_Slides.bento.html'), 'utf8')

// the deck-embedded faces (same technique as the landing build)
const fontSrc = readFileSync(join(root, 'slides/src/fontdata.ts'), 'utf8')
// FRAUNCES/INSTRUMENT are single-quoted in fontdata.ts, VAZIRMATN is
// double-quoted — accept both, the data URI itself never contains a quote.
const font = (name) => fontSrc.match(new RegExp(`export const ${name}\\s*=\\s*['"](data:[^'"]+)['"]`))[1]
const FRAUNCES = font('FRAUNCES_900')
const INSTRUMENT = font('INSTRUMENT_VAR')
const VAZIRMATN = font('VAZIRMATN_VAR')
const FONTS = {
  assets: { 'font-fraunces': FRAUNCES, 'font-instrument': INSTRUMENT, 'font-vazirmatn': VAZIRMATN },
  fonts: [
    { family: 'Fraunces', asset: 'font-fraunces', weight: '900' },
    { family: 'Instrument Sans', asset: 'font-instrument', weight: '100 900' },
    // the Farsi template family rides on one variable Persian face, 100–900
    { family: 'Vazirmatn', asset: 'font-vazirmatn', weight: '100 900' },
  ],
}
const FR = "Fraunces, Georgia, serif"
const IN = "'Instrument Sans', 'Helvetica Neue', sans-serif"
// Robust monospace stack. 'SF Mono' alone falls straight through to an ugly
// 'Courier New' in Chrome on macOS (Apple doesn't expose SF Mono to the web),
// so lead with ui-monospace and name the fonts that ARE reachable per platform.
const MONO_STACK = "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace"
const MONO = MONO_STACK

// public-domain photos (see scripts/gallery-photos/SOURCES.md), embedded as
// data-URI assets so the decks stay fully self-contained
const photo = (name) =>
  'data:image/jpeg;base64,' + readFileSync(join(root, 'scripts/gallery-photos', name)).toString('base64')

// embedded webfont files (woff2) — same technique as photo(), so a deck that
// wants a specific typeface stays self-contained instead of leaning on a
// system font that may not exist in the viewer's browser
const fontFile = (name) =>
  'data:font/woff2;base64,' + readFileSync(join(root, 'scripts/gallery-fonts', name)).toString('base64')

// ——— tiny builders ———————————————————————————————————————————————
let uid = 0
const id = (p) => `${p}-${(++uid).toString(36)}`
const text = (o) => ({
  id: o.id ?? id('t'), type: 'text', x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: o.rotation ?? 0, opacity: o.opacity ?? 1,
  html: o.html, fontSize: o.fontSize ?? 24, fontFamily: o.fontFamily ?? IN,
  fontWeight: o.fontWeight ?? 400, color: o.color ?? '#111',
  align: o.align ?? 'left', valign: o.valign ?? 'top',
  lineHeight: o.lineHeight ?? 1.3,
  ...(o.letterSpacing != null ? { letterSpacing: o.letterSpacing } : {}),
  ...(o.fx ? { fx: o.fx } : {}), ...(o.link ? { link: o.link } : {}),
  ...(o.shadow ? { shadow: o.shadow } : {}), ...(o.group ? { group: o.group } : {}),
})
const shape = (kind, o) => ({
  id: o.id ?? id('s'), type: 'shape', shape: kind, x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: o.rotation ?? 0, opacity: o.opacity ?? 1,
  fill: o.fill ?? '#000', stroke: o.stroke ?? 'none', strokeWidth: o.strokeWidth ?? 0,
  radius: o.radius ?? 0,
  ...(o.fillGradient ? { fillGradient: o.fillGradient } : {}),
  ...(o.strokeStyle ? { strokeStyle: o.strokeStyle } : {}),
  ...(o.d ? { d: o.d, pathBox: o.pathBox } : {}),
  ...(o.lineStart ? { lineStart: o.lineStart } : {}), ...(o.lineEnd ? { lineEnd: o.lineEnd } : {}),
  ...(o.fx ? { fx: o.fx } : {}), ...(o.link ? { link: o.link } : {}),
  ...(o.shadow ? { shadow: o.shadow } : {}), ...(o.group ? { group: o.group } : {}),
})
const chart = (o) => ({
  id: o.id ?? id('c'), type: 'chart', x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: 0, opacity: 1, preset: o.preset ?? 'bar', option: o.option,
  ...(o.fx ? { fx: o.fx } : {}),
})
const img = (o) => ({
  id: o.id ?? id('im'), type: 'image', x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: o.rotation ?? 0, opacity: o.opacity ?? 1,
  src: `asset:${o.asset}`, fit: o.fit ?? 'cover', radius: o.radius ?? 0,
  ...(o.fx ? { fx: o.fx } : {}), ...(o.shadow ? { shadow: o.shadow } : {}),
})
// embedded media (audio/video) as a data URI — same self-contained technique
// as photo(). Small clips embed; big ones should pass a URL in `src` instead.
const mediaFile = (name, mime) =>
  `data:${mime};base64,` + readFileSync(join(root, 'scripts/gallery-media', name)).toString('base64')
const media = (o) => ({
  id: o.id ?? id('m'), type: 'media', kind: o.kind, x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: o.rotation ?? 0, opacity: o.opacity ?? 1, src: o.src,
  ...(o.poster ? { poster: o.poster } : {}),
  ...(o.fit ? { fit: o.fit } : {}), ...(o.radius != null ? { radius: o.radius } : {}),
  ...(o.controls != null ? { controls: o.controls } : {}),
  ...(o.autoplay ? { autoplay: o.autoplay } : {}), ...(o.loop ? { loop: o.loop } : {}),
  ...(o.muted ? { muted: o.muted } : {}),
  ...(o.fx ? { fx: o.fx } : {}), ...(o.shadow ? { shadow: o.shadow } : {}),
})
const slide = (o) => ({
  id: o.id ?? id('sl'), background: o.background, transition: o.transition ?? 'fade',
  notes: o.notes ?? '', elements: o.elements,
  ...(o.name ? { name: o.name } : {}), ...(o.stateOf ? { stateOf: o.stateOf } : {}),
  ...(o.hover ? { hover: o.hover } : {}),
})
const grad = (angle, ...stops) => ({
  angle, stops: stops.map(([at, color]) => ({ at, color })),
})
// orbit path relative to rest position (closed loop through rest).
// phase = where on the circle the rest position sits (0 = right, -PI/2 = top);
// squash < 1 flattens vertically for a floaty wobble, 1 = true circle.
const orbit = (r, phase = 0, squash = 0.6) => {
  const pts = []
  for (let i = 0; i <= 24; i++) {
    const a = phase + (i / 24) * Math.PI * 2
    pts.push(`${(Math.cos(a) - Math.cos(phase)) * r},${(Math.sin(a) - Math.sin(phase)) * r * squash}`)
  }
  return `M0,0 L${pts.slice(1).join(' L')} Z`
}

// organic wander (Lissajous): different x/y frequencies trace a smooth figure-8
// instead of a mechanical circle. Path is relative to rest and closed (returns
// to start). fx/fy must be integers so the curve closes cleanly.
const drift = (ax, ay, fx, fy, px = 0, py = 0) => {
  const N = 72, x0 = ax * Math.sin(px), y0 = ay * Math.sin(py), pts = []
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2
    pts.push(`${(ax * Math.sin(fx * t + px) - x0).toFixed(1)},${(ay * Math.sin(fy * t + py) - y0).toFixed(1)}`)
  }
  return `M0,0 L${pts.slice(1).join(' L')} Z`
}

// ——— Farsi template helpers (RTL) ——————————————————————————————————
// The Farsi decks are laid out MIRRORED: the "start" edge is the right one, so
// kickers sit top-right, page numbers bottom-left, ghost numerals left.
const VZ = "'Vazirmatn', 'Tahoma', sans-serif"
// Latin-digit → Persian-digit, for page furniture and written-out numbers.
const fa = (v) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])
// Persian text: right-aligned Vazirmatn by default. NEVER letterSpacing a
// Persian string — the script's letters are JOINED, and tracking visually
// breaks the joins. Hierarchy comes from weight, size and colour instead.
const ftext = (o) => text({ align: 'right', fontFamily: VZ, ...o })
// table cell with RTL default; bento cells take {html, align, color, bg, bold}
const fcell = (html, o = {}) => ({
  html, align: o.align ?? 'right',
  ...(o.bold ? { bold: true } : {}), ...(o.color ? { color: o.color } : {}), ...(o.bg ? { bg: o.bg } : {}),
})
// data table on the Vazirmatn face — every TableStyle field is required by the
// model, so this fills them all (zebra optional)
const ftable = (o) => ({
  id: o.id ?? id('tb'), type: 'table', x: o.x, y: o.y, w: o.w, h: o.h,
  rotation: 0, opacity: 1, header: o.header ?? true,
  columns: o.columns, rows: o.rows,
  style: {
    headerBg: o.headerBg, headerColor: o.headerColor,
    ...(o.zebra ? { zebra: o.zebra } : {}),
    borderColor: o.borderColor, borderWidth: o.borderWidth ?? 1,
    cellPadX: o.cellPadX ?? 14, cellPadY: o.cellPadY ?? 11,
    fontSize: o.fontSize ?? 15, fontFamily: VZ, color: o.color, radius: o.radius ?? 10,
  },
  ...(o.fx ? { fx: o.fx } : {}),
})


/**
 * The gallery faces a deck actually needs.
 *
 * `withFonts: true` takes every face; a LIST takes only the families named, so
 * a deck that sets one typeface does not ship the bytes of another. Same rule
 * the clipboard follows — carry exactly the faces in use.
 *
 * A face a deck NAMES but does not carry falls back silently: the text simply
 * renders in the next entry of the stack, with no warning anywhere. Orbital and
 * Picnic did that with Instrument Sans until 2026-08-02, which is why they now
 * name what they need instead of relying on an all-or-nothing flag.
 */
const fontsFor = (want) => {
  const families = want === true ? FONTS.fonts.map((f) => f.family) : want
  const picked = FONTS.fonts.filter((f) => families.includes(f.family))
  const missing = families.filter((fam) => !FONTS.fonts.some((f) => f.family === fam))
  if (missing.length) throw new Error(`withFonts names unknown families: ${missing.join(', ')}`)
  return {
    fonts: picked,
    assets: Object.fromEntries(picked.map((f) => [f.asset, FONTS.assets[f.asset]])),
  }
}

const doc = (o) => ({
  format: 'bento/slides', version: 1, title: o.title,
  size: { width: 1280, height: 720 },
  theme: o.theme, template: true,
  ...(o.withFonts
    ? (() => {
        const f = fontsFor(o.withFonts)
        return { assets: { ...f.assets, ...(o.assets ?? {}) }, fonts: [...f.fonts, ...(o.fonts ?? [])] }
      })()
    : (o.assets ? { assets: o.assets, ...(o.fonts ? { fonts: o.fonts } : {}) } : {})),
  ...(o.present ? { present: o.present } : {}),
  slides: o.slides, modified: new Date().toISOString(),
})

// ═══════════════════════════════════════════════════════════════════════
// DECK A · «SIGNAL» — editorial-typographic (Rynzhuk / Locomotive family)
// Bone paper, ink, one violent red. Type IS the layout.
// ═══════════════════════════════════════════════════════════════════════
function deckSignal() {
  const BONE = '#EFEDE4', INK = '#141310', RED = '#E8442E', GREY = 'rgba(20,19,16,0.55)'
  const HAIR = 'rgba(20,19,16,0.22)'
  const kick = (x, y, s, color = RED) => text({ x, y, w: 500, h: 24, html: s, fontSize: 13, fontWeight: 700, letterSpacing: 4, color, fontFamily: IN })
  const rule = (x, y, w) => shape('rect', { x, y, w, h: 2, fill: INK })
  const pageNo = (n) => text({ x: 1150, y: 654, w: 80, h: 24, html: n, fontSize: 13, fontWeight: 600, color: GREY, align: 'right', fontFamily: MONO })

  const s1 = slide({
    id: 'sig-cover', background: INK, transition: 'none',
    notes: 'TEMPLATE — “Signal”, an editorial-typographic deck. The cover is the poster: a full-bleed public-domain photograph under a deep ink scrim (one rect, no filters) with the masthead type reversed to bone. Slide 2 cuts back to paper. The red bar and the title share ids with slide 2 — they MORPH.',
    elements: [
      img({ asset: 'ph-press', x: 0, y: 0, w: 1280, h: 720, fx: { ambient: 'kenburns', ken: { dir: 'drift', scale: 1.07, duration: 24 } } }),
      shape('rect', { x: 0, y: 0, w: 1280, h: 720, fill: 'rgba(20,19,16,0.62)' }),
      kick(96, 84, 'SIGNAL — A FESTIVAL OF GRAPHIC IDEAS', BONE),
      shape('rect', { x: 96, y: 118, w: 1088, h: 2, fill: 'rgba(239,237,228,0.7)' }),
      text({ id: 'sig-title', x: 86, y: 128, w: 1120, h: 330, html: 'Loud<br>letters.', fontSize: 168, fontFamily: FR, fontWeight: 900, color: BONE, lineHeight: 0.92, shadow: { y: 3, blur: 26, color: 'rgba(20,19,16,0.4)' } }),
      shape('rect', { id: 'sig-bar', x: 96, y: 520, w: 320, h: 74, fill: RED }),
      text({ x: 442, y: 524, w: 560, h: 80, html: 'Three days on typography, grids,<br>and the confidence to be simple.', fontSize: 19, color: 'rgba(239,237,228,0.85)', lineHeight: 1.5, fx: { enter: 'fade-up', order: 1 } }),
      text({ x: 96, y: 536, w: 320, h: 40, html: 'OCT 12—14', fontSize: 26, fontWeight: 800, color: BONE, align: 'center', fontFamily: IN, letterSpacing: 3 }),
      text({ x: 96, y: 640, w: 800, h: 24, html: 'HALL 6 · MAKETOWN · TICKETS AT THE DOOR · PHOTO: LIBRARY OF CONGRESS, 1942', fontSize: 12, fontWeight: 600, letterSpacing: 3, color: 'rgba(239,237,228,0.6)' }),
      text({ x: 1150, y: 654, w: 80, h: 24, html: '01', fontSize: 13, fontWeight: 600, color: 'rgba(239,237,228,0.6)', align: 'right', fontFamily: MONO }),
    ],
  })

  const s2 = slide({
    id: 'sig-manifesto', background: BONE, transition: 'morph',
    notes: 'The morph beat: the red bar became a column, the title shrank into a corner. Duplicate-and-rearrange is the entire animation technique.',
    elements: [
      text({ id: 'sig-title', x: 96, y: 84, w: 500, h: 80, html: 'Loud letters.', fontSize: 40, fontFamily: FR, fontWeight: 900, color: GREY, lineHeight: 1 }),
      shape('rect', { id: 'sig-bar', x: 96, y: 170, w: 10, h: 450, fill: RED }),
      text({ x: 150, y: 168, w: 980, h: 380, html: 'We believe a poster can<br>argue, a grid can dance,<br>and <i>restraint</i> is the<br>loudest move of all.', fontSize: 62, fontFamily: FR, fontWeight: 900, color: INK, lineHeight: 1.14, fx: { enter: 'fade-up' } }),
      text({ x: 150, y: 580, w: 700, h: 30, html: '— The programme committee, writing manifestos again', fontSize: 15, color: GREY, fx: { enter: 'fade-up', order: 2 } }),
      pageNo('02'),
    ],
  })

  const speakers = [
    ['A', 'Ada Kessler', 'Grids that misbehave'],
    ['B', 'Bruno Mächler', 'The end of the hero image'],
    ['C', 'Chiyo Tanaka', 'Serifs, sharpened'],
  ]
  const s3 = slide({
    id: 'sig-speakers', background: INK, transition: 'fade',
    notes: 'Inverted spread. The huge index letters are the “image”. Stagger order walks the three rows in.',
    elements: [
      kick(96, 84, 'THE SPEAKERS', RED),
      shape('rect', { x: 96, y: 118, w: 1088, h: 2, fill: 'rgba(239,237,228,0.25)' }),
      ...speakers.flatMap(([ltr, name, topic], i) => [
        text({ x: 80, y: 130 + i * 165, w: 220, h: 180, html: ltr, fontSize: 150, fontFamily: FR, fontWeight: 900, color: 'rgba(239,237,228,0.13)', fx: { enter: 'fade-up', order: i } }),
        text({ x: 270, y: 176 + i * 165, w: 500, h: 60, html: name, fontSize: 40, fontFamily: FR, fontWeight: 900, color: BONE, fx: { enter: 'fade-up', order: i } }),
        text({ x: 800, y: 190 + i * 165, w: 384, h: 40, html: topic.toUpperCase(), fontSize: 14, fontWeight: 600, letterSpacing: 3, color: RED, align: 'right', fx: { enter: 'fade-up', order: i } }),
        shape('rect', { x: 270, y: 268 + i * 165, w: 914, h: 1, fill: 'rgba(239,237,228,0.18)' }),
      ]),
      pageNo('03'),
    ],
  })

  const s3b = slide({
    id: 'sig-floor', background: INK, transition: 'fade',
    notes: 'The photo essay beat. A full-bleed public-domain photograph (Marjory Collins, New York Times pressroom, 1942 — Library of Congress) with a slow ken-burns drift, an ink scrim, and one serif line. A DIFFERENT frame from the cover shot on purpose — the cover sets the type, this beat prints it. Swap the photo, keep the recipe: image → scrim → words.',
    elements: [
      img({ asset: 'ph-press2', x: 0, y: 0, w: 1280, h: 720, fx: { ambient: 'kenburns', ken: { dir: 'drift', scale: 1.09, duration: 22 } } }),
      shape('rect', { x: 0, y: 0, w: 1280, h: 720, fill: 'rgba(15,14,11,0.58)' }),
      shape('rect', { x: 0, y: 430, w: 1280, h: 290, fill: 'rgba(15,14,11,0.4)', fillGradient: grad(180, [0, 'rgba(15,14,11,0)'], [1, 'rgba(15,14,11,0.85)']) }),
      kick(96, 96, 'THE FLOOR'),
      shape('rect', { x: 96, y: 130, w: 220, h: 2, fill: RED }),
      text({ x: 90, y: 420, w: 1000, h: 220, html: 'Set by hand,<br>read by thousands.', fontSize: 76, fontFamily: FR, fontWeight: 900, color: BONE, lineHeight: 1.02, fx: { enter: 'fade-up' } }),
      text({ x: 96, y: 640, w: 900, h: 24, html: 'NEW YORK TIMES PRESSROOM, 1942 · LIBRARY OF CONGRESS — PUBLIC DOMAIN', fontSize: 10, fontWeight: 600, letterSpacing: 3, color: 'rgba(239,237,228,0.55)', fx: { enter: 'fade-up', order: 2 } }),
      text({ x: 1150, y: 654, w: 80, h: 24, html: '04', fontSize: 13, fontWeight: 600, color: 'rgba(239,237,228,0.6)', align: 'right', fontFamily: MONO }),
    ],
  })

  const s4 = slide({
    id: 'sig-schedule', background: BONE, transition: 'fade',
    notes: 'A dead-simple bar chart, art-directed: ink bars, one red. Charts are template JSON — swap the numbers.',
    elements: [
      kick(96, 84, 'ATTENDANCE, FIVE EDITIONS'),
      rule(96, 118, 1088),
      text({ x: 96, y: 148, w: 900, h: 80, html: 'Word travels.', fontSize: 64, fontFamily: FR, fontWeight: 900, color: INK }),
      chart({ x: 96, y: 260, w: 1088, h: 380, preset: 'bar', option: {
        grid: { left: 40, right: 10, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: ['2022', '2023', '2024', '2025', '2026'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [420, 780, 1300, 2450, 4100],
          itemStyle: { color: INK }, barWidth: 90 }],
        color: [INK],
        tooltip: { trigger: 'item', formatter: '{b}: {c} people' },
      }, fx: { enter: 'fade-up', order: 1 } }),
      shape('rect', { x: 996, y: 300, w: 90, h: 24, fill: RED, fx: { enter: 'fade', order: 3 } }),
      text({ x: 940, y: 268, w: 200, h: 30, html: '<b>SOLD OUT</b>', fontSize: 13, letterSpacing: 3, color: RED, align: 'center', fx: { enter: 'fade', order: 3 } }),
      pageNo('05'),
    ],
  })

  const s5 = slide({
    id: 'sig-marquee', background: RED, transition: 'zoom',
    notes: 'The shout slide. Dash-march on the two rules makes the page feel like it is sliding. One background change resets the room.',
    elements: [
      shape('line', { x: 0, y: 140, w: 1280, h: 4, fill: BONE, strokeWidth: 3, strokeStyle: 'dashed', fx: { loop: { type: 'dash-march', distance: 60, duration: 2.4 } } }),
      text({ x: 40, y: 210, w: 1200, h: 300, html: 'SAY IT<br>BIGGER.', fontSize: 150, fontFamily: IN, fontWeight: 900, color: BONE, align: 'center', lineHeight: 0.95, letterSpacing: 2 }),
      shape('line', { x: 0, y: 566, w: 1280, h: 4, fill: BONE, strokeWidth: 3, strokeStyle: 'dashed', fx: { loop: { type: 'dash-march', distance: 60, duration: 2.4 } } }),
      text({ x: 40, y: 600, w: 1200, h: 30, html: 'WORKSHOP TRACK · 40 SEATS · BRING SCISSORS', fontSize: 13, fontWeight: 700, letterSpacing: 5, color: 'rgba(239,237,228,0.8)', align: 'center' }),
    ],
  })

  const s6 = slide({
    id: 'sig-end', background: BONE, transition: 'morph',
    notes: 'Close where you opened — the bar and title morph home. End on the practical line.',
    elements: [
      kick(96, 84, 'SIGNAL — OCT 12—14'),
      rule(96, 118, 1088),
      text({ id: 'sig-title', x: 86, y: 150, w: 1120, h: 300, html: 'See you<br>in Hall 6.', fontSize: 132, fontFamily: FR, fontWeight: 900, color: INK, lineHeight: 0.95 }),
      shape('rect', { id: 'sig-bar', x: 96, y: 520, w: 1088, h: 74, fill: RED }),
      text({ x: 96, y: 540, w: 1088, h: 40, html: 'signal-festival.example — a fictional event for a very real template', fontSize: 16, fontWeight: 600, color: BONE, align: 'center', letterSpacing: 1 }),
      pageNo('07'),
    ],
  })

  return doc({
    title: 'Signal — editorial type template', withFonts: true,
    assets: {
      'ph-press': photo('signal-press.jpg'),
      'ph-press2': photo('signal-press2.jpg'),
    },
    theme: { background: BONE, color: INK, accent: RED, fontFamily: IN },
    slides: [s1, s2, s3, s3b, s4, s5, s6],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK B · «TERRA» — premium minimal commerce (Build-in-Amsterdam family)
// Warm white, clay, sand. Whitespace is the luxury.
// ═══════════════════════════════════════════════════════════════════════
function deckTerra() {
  const WHITE = '#F7F5F0', CLAY = '#C96F4A', SAND = '#D9C9B4', CHAR = '#2A2724'
  const SOFT = 'rgba(42,39,36,0.55)'
  const GRAD_CLAY = grad(20, [0, '#D97E58'], [1, '#B85C38'])
  const GRAD_SAND = grad(0, [0, '#E3D5C2'], [1, '#CDBBA1'])
  const GRAD_MOSS = grad(15, [0, '#8D9376'], [1, '#6F755C'])
  const GRAD_MOSS_LIT = grad(20, [0, '#AEB394'], [1, '#7E846A'])
  const kick = (x, y, s) => text({ x, y, w: 600, h: 22, html: s, fontSize: 12, fontWeight: 600, letterSpacing: 5, color: CLAY })

  const s1 = slide({
    id: 'ter-cover', background: WHITE, transition: 'none',
    notes: 'TEMPLATE — “Terra”, premium product-brand deck. The commerce classic: a SPLIT COVER — copy breathes on white, a full-height product photograph owns the right edge (ken-burns drift), and two photo pills straddle the seam. The three “vessels” morph into the collection grid on slide 3.',
    elements: [
      // big, soft celadon glaze orbs — glide right across the panel on slow,
      // gently-curved arcs (wide flat ellipses), sitting BEHIND the type and the
      // product photo so they pass behind everything: layered ambient depth
      shape('ellipse', { x: 278, y: 108, w: 384, h: 384, opacity: 0.13, fill: '#8D9376', fillGradient: GRAD_MOSS, shadow: { blur: 64, color: 'rgba(141,147,118,0.20)' }, fx: { loop: { type: 'motion-path', path: orbit(320, Math.PI / 2, 0.16), duration: 44 } } }),
      shape('ellipse', { id: 'ter-c', x: 535, y: 305, w: 250, h: 250, opacity: 0.16, fill: '#8D9376', fillGradient: GRAD_MOSS_LIT, shadow: { blur: 52, color: 'rgba(141,147,118,0.18)' }, fx: { loop: { type: 'motion-path', path: orbit(300, -Math.PI / 2, 0.20), duration: 38 } } }),
      shape('ellipse', { x: 584, y: 139, w: 192, h: 192, opacity: 0.18, fill: '#8D9376', fillGradient: GRAD_MOSS_LIT, shadow: { blur: 44, color: 'rgba(141,147,118,0.18)' }, fx: { loop: { type: 'motion-path', path: orbit(340, Math.PI / 2, 0.13), duration: 33 } } }),
      img({ asset: 'ph-vase-goat', x: 800, y: 0, w: 480, h: 720, fx: { ambient: 'kenburns', ken: { dir: 'drift', scale: 1.06, duration: 20 } } }),
      shape('rect', { x: 800, y: 0, w: 480, h: 720, fill: 'rgba(42,39,36,0.08)' }),
      kick(96, 96, 'TERRA OBJECTS — COLLECTION Nº4'),
      text({ x: 90, y: 150, w: 700, h: 260, html: 'Quiet things,<br>well made.', fontSize: 92, fontFamily: FR, fontWeight: 900, color: CHAR, lineHeight: 1.02 }),
      text({ x: 96, y: 430, w: 480, h: 80, html: 'Thrown, glazed and fired in one workshop.<br>Forty-one objects. No two alike.', fontSize: 17, color: SOFT, lineHeight: 1.6, fx: { enter: 'fade-up', order: 1 } }),
      // the two vessel pills slide in from the right edge (from behind the
      // product photo), staggered; each pill + its photo share order so they
      // travel together. The photos keep their ken-burns (scale) — the slide
      // uses the x channel, so the two coexist.
      shape('rect', { id: 'ter-a', x: 700, y: 110, w: 190, h: 280, radius: 95, fill: CLAY, fillGradient: GRAD_CLAY, shadow: { y: 24, blur: 50, color: 'rgba(42,39,36,0.28)' }, fx: { enter: 'slide-down', order: 2 } }),
      img({ asset: 'ph-vase-jay', x: 707, y: 117, w: 176, h: 266, radius: 88, fx: { ambient: 'kenburns', ken: { dir: 'drift', scale: 1.03, duration: 12 }, enter: 'slide-down', order: 2 } }),
      shape('rect', { id: 'ter-b', x: 646, y: 440, w: 140, h: 200, radius: 70, fill: SAND, fillGradient: GRAD_SAND, shadow: { y: 18, blur: 40, color: 'rgba(42,39,36,0.22)' }, fx: { enter: 'slide-up', order: 3 } }),
      img({ asset: 'ph-vase-classic', x: 652, y: 446, w: 128, h: 188, radius: 64, fx: { ambient: 'kenburns', ken: { dir: 'drift', scale: 1.035, duration: 15 }, enter: 'slide-up', order: 3 } }),
      text({ x: 96, y: 620, w: 500, h: 22, html: 'SPRING 2026 · EDITION OF 41', fontSize: 11, fontWeight: 600, letterSpacing: 4, color: SOFT }),
      text({ x: 900, y: 668, w: 360, h: 20, html: 'MET MUSEUM OPEN ACCESS · CC0', fontSize: 9, fontWeight: 600, letterSpacing: 3, color: 'rgba(247,245,240,0.75)', align: 'right' }),
    ],
  })

  const s2 = slide({
    id: 'ter-craft', background: CHAR, transition: 'fade',
    notes: 'The dark interlude — one sentence, one photographed object (Met Museum open access, CC0). The pill mask is just the image element’s radius; ken-burns “out” settles it as the slide enters.',
    elements: [
      img({ asset: 'ph-vase-goat', x: 700, y: 90, w: 380, h: 540, radius: 190, shadow: { blur: 90, color: 'rgba(255,238,214,0.16)' }, fx: { ambient: 'kenburns', ken: { dir: 'out', scale: 1.1, duration: 2.2 } } }),
      kick(96, 120, 'THE WORKSHOP'),
      text({ x: 90, y: 180, w: 560, h: 320, html: 'Each piece<br>spends nine<br>days in fire.', fontSize: 72, fontFamily: FR, fontWeight: 900, color: WHITE, lineHeight: 1.06, fx: { enter: 'fade-up' } }),
      text({ x: 96, y: 540, w: 460, h: 60, html: 'Cone 10 reduction. Ash glaze from our own orchard prunings.', fontSize: 16, color: 'rgba(247,245,240,0.6)', lineHeight: 1.6, fx: { enter: 'fade-up', order: 2 } }),
      text({ x: 700, y: 650, w: 380, h: 20, html: 'MET MUSEUM OPEN ACCESS · CC0', fontSize: 9, fontWeight: 600, letterSpacing: 3, color: 'rgba(247,245,240,0.35)', align: 'center' }),
    ],
  })

  const items = [
    ['Vessel 12', '€240', 'ph-vase-jay', GRAD_CLAY],
    ['Bowl 07', '€120', 'ph-vase-goat', GRAD_SAND],
    ['Vase 31', '€310', 'ph-vase-classic', GRAD_MOSS],
  ]
  const s3 = slide({
    id: 'ter-collection', background: WHITE, transition: 'morph',
    notes: 'The commerce grid — real product photography (Met open access, CC0) in the cards, and the three cover vessels MORPH down into the little glaze swatches beside each price. Same ids, new role.',
    elements: [
      kick(96, 96, 'THE COLLECTION'),
      text({ x: 90, y: 140, w: 700, h: 70, html: 'Forty-one objects.', fontSize: 54, fontFamily: FR, fontWeight: 900, color: CHAR }),
      ...items.flatMap(([name, price, ph, g], i) => {
        const x = 96 + i * 376
        const ids = ['ter-a', 'ter-b', 'ter-c'][i]
        const kind = i === 2 ? 'ellipse' : 'rect'
        return [
          shape('rect', { x, y: 250, w: 336, h: 330, radius: 18, fill: '#FFFFFF', shadow: { y: 16, blur: 38, color: 'rgba(42,39,36,0.1)' }, fx: { enter: 'fade-up', order: i } }),
          img({ asset: ph, x: x + 20, y: 270, w: 296, h: 214, radius: 12, fx: { enter: 'fade-up', order: i } }),
          text({ x: x + 24, y: 500, w: 200, h: 30, html: name, fontSize: 20, fontWeight: 600, color: CHAR, fx: { enter: 'fade-up', order: i } }),
          shape(kind, { id: ids, x: x + 190, y: 502, w: 22, h: 22, radius: i === 0 ? 11 : 6, fill: '#ccc', fillGradient: g, shadow: { y: 3, blur: 8, color: 'rgba(42,39,36,0.3)' } }),
          text({ x: x + 216, y: 500, w: 96, h: 30, html: price, fontSize: 18, fontWeight: 600, color: CLAY, align: 'right', fontFamily: MONO, fx: { enter: 'fade-up', order: i } }),
        ]
      }),
      text({ x: 96, y: 632, w: 700, h: 22, html: 'EVERY OBJECT SHIPS WITH ITS FIRING CARD · PHOTOGRAPHY: MET OPEN ACCESS (CC0)', fontSize: 11, fontWeight: 600, letterSpacing: 4, color: SOFT }),
    ],
  })

  const s4 = slide({
    id: 'ter-materials', background: WHITE, transition: 'fade',
    notes: 'Editorially-styled pie: material sourcing. The template shows how to make charts feel branded — palette + a serif headline beat any default theme.',
    elements: [
      kick(96, 96, 'WHAT THINGS ARE MADE OF'),
      text({ x: 90, y: 140, w: 800, h: 70, html: 'Sourced within 40 km.', fontSize: 54, fontFamily: FR, fontWeight: 900, color: CHAR }),
      chart({ x: 90, y: 240, w: 620, h: 420, preset: 'pie', option: {
        color: [CLAY, '#D9C9B4', '#8D9376', '#2A2724'],
        tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
        legend: { bottom: 0 },
        series: [{ type: 'pie', radius: ['45%', '72%'],
          data: [
            { name: 'River clay', value: 46 }, { name: 'Orchard ash', value: 24 },
            { name: 'Field feldspar', value: 18 }, { name: 'Recycled grog', value: 12 },
          ], label: { show: false } }],
      }, fx: { enter: 'fade-up' } }),
      text({ x: 780, y: 300, w: 400, h: 220, html: 'The glaze palette is literally<br>the landscape — clay from the<br>river bend, ash from winter<br>prunings, feldspar from the<br>neighbour’s field.', fontSize: 19, color: SOFT, lineHeight: 1.65, fx: { enter: 'fade-up', order: 2 } }),
    ],
  })

  const s5 = slide({
    id: 'ter-end', background: SAND, transition: 'fade',
    notes: 'Soft close. Swap the address, keep the hush.',
    elements: [
      text({ x: 140, y: 220, w: 1000, h: 200, html: 'Come hold them.', fontSize: 88, fontFamily: FR, fontWeight: 900, color: CHAR, align: 'center', lineHeight: 1 }),
      text({ x: 140, y: 430, w: 1000, h: 30, html: 'SHOWROOM — KILN LANE 4 · SATURDAYS 10—16', fontSize: 13, fontWeight: 600, letterSpacing: 5, color: 'rgba(42,39,36,0.65)', align: 'center' }),
      shape('rect', { x: 604, y: 500, w: 72, h: 6, radius: 3, fill: CLAY }),
    ],
  })

  return doc({
    title: 'Terra — premium product template', withFonts: true,
    assets: {
      'ph-vase-jay': photo('terra-v1.jpg'),
      'ph-vase-goat': photo('terra-v2.jpg'),
      'ph-vase-classic': photo('terra-v3.jpg'),
    },
    theme: { background: WHITE, color: CHAR, accent: CLAY, fontFamily: IN },
    slides: [s1, s2, s3, s4, s5],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK C · «ORBITAL» — immersive dark tech (Lusion / Active Theory family)
// Void black, electric cyan→violet gradients, glow, orbiting particles.
// ═══════════════════════════════════════════════════════════════════════
function deckOrbital() {
  // Orbital embeds Space Mono (OFL) for its HUD-style technical labels — the
  // deck's mono was the one place a system font ('SF Mono') showed through as
  // Courier in Chrome. Embedding keeps the readouts crisp and on-brand
  // everywhere; MONO shadows the module const for this deck only.
  const MONO = "'Space Mono', " + MONO_STACK
  const VOID = '#05060E', DEEP = '#0B0E1E', CYAN = '#38E1FF', VIOLET = '#7A5CFF', MAG = '#FF4FA3'
  const DIM = 'rgba(178,196,224,0.62)'
  const GRAD_CY = grad(30, [0, CYAN], [1, VIOLET])
  const GRAD_MG = grad(30, [0, VIOLET], [1, MAG])
  const glow = (c, blur = 40) => ({ blur, color: c })
  const mono = (x, y, s, color = DIM, size = 12) => text({ x, y, w: 700, h: 22, html: s, fontSize: size, fontWeight: 500, letterSpacing: 3, color, fontFamily: MONO })
  const star = (x, y, size, dur, phase) => shape('ellipse', {
    x, y, w: size, h: size, fill: 'rgba(184,222,255,0.8)',
    shadow: glow('rgba(56,225,255,0.5)', 10),
    fx: { loop: { type: 'motion-path', path: orbit(14 + size * 2, phase), duration: dur } },
  })
  // A satellite in low orbit: a small craft (a glowing dash) that tracks a wide,
  // shallow arc across the sky — the tiny `squash` flattens the orbit ellipse to
  // an edge-on pass, so it sweeps in from one edge, arcs over the limb, and exits
  // the other (then loops round the far side). Slow, phase-offset so the sky is
  // never crowded; rides behind the ring + wordmark. Beats aimless floating dots.
  const satellite = (x, y, rx, squash, dur, phase) => shape('ellipse', {
    x, y, w: 3, h: 3, fill: 'rgba(233,246,255,1)',
    shadow: glow('rgba(120,215,255,0.9)', 6),
    fx: { loop: { type: 'motion-path', path: orbit(rx, phase, squash), duration: dur } },
  })

  const s1 = slide({
    id: 'orb-cover', background: VOID, transition: 'none',
    notes: 'TEMPLATE — “Orbital”, immersive dark-tech deck. Style family: void black, one luminous gradient — over REAL sky: the backdrop is a sunlit Earth from the ISS (NASA, public domain; ISS007-E-10807), the sun flaring at the top behind the orbit dot, dimmed under a scrim (image opacity 0.6) so the type stays lit. Three satellites track wide low-orbit arcs across the sky behind the ring. The ring and wordmark morph through the whole deck.',
    elements: [
      img({ asset: 'ph-stars', x: 0, y: 0, w: 1280, h: 720, opacity: 0.6, fx: { ambient: 'kenburns', ken: { dir: 'drift', scale: 1.09, duration: 28 } } }),
      shape('rect', { x: 0, y: 0, w: 1280, h: 720, fill: 'rgba(5,6,14,0.45)', fillGradient: grad(180, [0, 'rgba(5,6,14,0.6)'], [0.55, 'rgba(5,6,14,0.25)'], [1, 'rgba(5,6,14,0.7)']) }),
      satellite(560, 168, 540, 0.14, 44, Math.PI / 2),
      satellite(1340, 240, 700, 0.15, 54, 0),
      satellite(-60, 300, 860, 0.10, 62, Math.PI),
      shape('ellipse', { id: 'orb-ring', x: 440, y: 120, w: 400, h: 400, fill: 'rgba(0,0,0,0)', stroke: CYAN, strokeWidth: 2, shadow: glow('rgba(56,225,255,0.45)', 60) }),
      shape('ellipse', { x: 610, y: 90, w: 60, h: 60, fill: CYAN, fillGradient: GRAD_CY, shadow: glow('rgba(56,225,255,0.8)', 30), fx: { loop: { type: 'motion-path', path: orbit(200, -Math.PI / 2, 1), duration: 14 } } }),
      text({ id: 'orb-word', x: 140, y: 260, w: 1000, h: 130, html: 'ORBITAL', fontSize: 110, fontWeight: 800, color: '#EAF4FF', align: 'center', letterSpacing: 30, fontFamily: IN, shadow: glow('rgba(56,225,255,0.35)', 40) }),
      text({ x: 140, y: 400, w: 1000, h: 24, html: 'LOW-ORBIT DATA · A FICTIONAL COMPANY FOR A REAL TEMPLATE', fontSize: 12, fontWeight: 500, letterSpacing: 3, color: DIM, align: 'center', fontFamily: MONO }),
      text({ x: 140, y: 616, w: 1000, h: 24, html: '— PRESS → TO ENTER THE SYSTEM —', fontSize: 11, fontWeight: 500, letterSpacing: 3, color: 'rgba(178,196,224,0.4)', align: 'center', fontFamily: MONO }),
    ],
  })

  const s2 = slide({
    id: 'orb-thesis', background: VOID, transition: 'morph',
    notes: 'Ring morphs off-center and shrinks; the wordmark docks top-left. Big statements sit on the darkness — no boxes needed.',
    elements: [
      text({ id: 'orb-word', x: 96, y: 70, w: 300, h: 40, html: 'ORBITAL', fontSize: 22, fontWeight: 800, color: DIM, letterSpacing: 10, fontFamily: IN }),
      // Faint violet body inside the ring — reads the "earth" as a lit planet the
      // constellation orbits (slide-2 only, no morph id, sits behind ring + sats).
      shape('ellipse', { x: 930, y: 230, w: 520, h: 520, fill: 'rgba(122,92,255,0.06)', shadow: glow('rgba(122,92,255,0.28)', 90) }),
      shape('ellipse', { id: 'orb-ring', x: 880, y: 180, w: 620, h: 620, fill: 'rgba(0,0,0,0)', stroke: VIOLET, strokeWidth: 2, shadow: glow('rgba(122,92,255,0.4)', 70) }),
      mono(96, 170, '01 · THE THESIS', CYAN),
      text({ x: 96, y: 210, w: 900, h: 300, html: 'Every satellite is<br>a sensor. Nobody<br>reads the sky.', fontSize: 76, fontWeight: 800, color: '#EAF4FF', lineHeight: 1.1, fontFamily: IN, fx: { enter: 'fade-up' } }),
      text({ x: 96, y: 540, w: 620, h: 80, html: 'Twelve thousand spacecraft stream telemetry into archives nobody opens. We turn that exhaust into signal.', fontSize: 17, color: DIM, lineHeight: 1.6, fx: { enter: 'fade-up', order: 2 } }),
      // ── Starlink-style mega-constellation: three orbital shells around the
      // violet earth-ring (centre 1190,490). Each shell = evenly phased dots on
      // one radius sharing a duration, so the lane reads as a coordinated train;
      // shells differ in radius + squash (inclination) + speed. Rest centre sits
      // on the shell circle at its phase; orbit() sweeps it round (far/right side
      // passes off-canvas — over-the-limb feel). No morph ids (slide-2 only).
      // shell 1 · inner (r250, incline 0.55, 19s)
      shape('ellipse', { x: 1062, y: 703.5, w: 6, h: 6, fill: '#E9F6FF', shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(250, 120 * Math.PI / 180, 0.55), duration: 19 } } }),
      shape('ellipse', { x: 946, y: 552.2, w: 5, h: 5, fill: CYAN, shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(250, 165 * Math.PI / 180, 0.55), duration: 19 } } }),
      shape('ellipse', { x: 970.5, y: 362, w: 6, h: 6, fill: '#E9F6FF', shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(250, 210 * Math.PI / 180, 0.55), duration: 19 } } }),
      shape('ellipse', { x: 1122.3, y: 245.5, w: 6, h: 6, fill: CYAN, shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(250, 255 * Math.PI / 180, 0.55), duration: 19 } } }),
      shape('ellipse', { x: 1312.5, y: 271, w: 5, h: 5, fill: '#E9F6FF', shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(250, 300 * Math.PI / 180, 0.55), duration: 19 } } }),
      shape('ellipse', { x: 1428.5, y: 422.3, w: 6, h: 6, fill: CYAN, shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(250, 345 * Math.PI / 180, 0.55), duration: 19 } } }),
      // shell 2 · mid, on the ring (r310, near face-on 0.92, 25s)
      shape('ellipse', { x: 995.6, y: 730.8, w: 7, h: 7, fill: CYAN, shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(310, 128 * Math.PI / 180, 0.92), duration: 25 } } }),
      shape('ellipse', { x: 890.5, y: 577.6, w: 6, h: 6, fill: '#E9F6FF', shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(310, 163 * Math.PI / 180, 0.92), duration: 25 } } }),
      shape('ellipse', { x: 891.7, y: 390.7, w: 7, h: 7, fill: CYAN, shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(310, 198 * Math.PI / 180, 0.92), duration: 25 } } }),
      shape('ellipse', { x: 1000.4, y: 239.4, w: 6, h: 6, fill: '#E9F6FF', shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(310, 233 * Math.PI / 180, 0.92), duration: 25 } } }),
      shape('ellipse', { x: 1175.7, y: 176.7, w: 7, h: 7, fill: CYAN, shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(310, 268 * Math.PI / 180, 0.92), duration: 25 } } }),
      shape('ellipse', { x: 1355.8, y: 227, w: 6, h: 6, fill: '#E9F6FF', shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(310, 303 * Math.PI / 180, 0.92), duration: 25 } } }),
      shape('ellipse', { x: 1473.9, y: 370.4, w: 7, h: 7, fill: CYAN, shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(310, 338 * Math.PI / 180, 0.92), duration: 25 } } }),
      // shell 3 · outer, edge-on (r372, incline 0.32, 31s) — a couple tinted violet
      shape('ellipse', { x: 858.5, y: 661.6, w: 6, h: 6, fill: '#E9F6FF', shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(372, 152 * Math.PI / 180, 0.32), duration: 31 } } }),
      shape('ellipse', { x: 830.8, y: 381.8, w: 5, h: 5, fill: VIOLET, shadow: glow('rgba(122,92,255,0.9)', 14), fx: { loop: { type: 'motion-path', path: orbit(372, 196.5 * Math.PI / 180, 0.32), duration: 31 } } }),
      shape('ellipse', { x: 1006.7, y: 161.6, w: 6, h: 6, fill: CYAN, shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(372, 241 * Math.PI / 180, 0.32), duration: 31 } } }),
      shape('ellipse', { x: 1286.9, y: 129, w: 5, h: 5, fill: '#E9F6FF', shadow: glow('rgba(56,225,255,0.85)', 14), fx: { loop: { type: 'motion-path', path: orbit(372, 285.5 * Math.PI / 180, 0.32), duration: 31 } } }),
      shape('ellipse', { x: 1509.2, y: 301, w: 6, h: 6, fill: VIOLET, shadow: glow('rgba(122,92,255,0.9)', 14), fx: { loop: { type: 'motion-path', path: orbit(372, 330 * Math.PI / 180, 0.32), duration: 31 } } }),
    ],
  })

  const s2b = slide({
    id: 'orb-earth', background: VOID, transition: 'fade',
    notes: 'The live-view beat: a real Earth-from-the-ISS clip (Expedition 65, NASA — public domain) plays full-bleed, muted and looping, and AUTOPLAYS the moment you present. Demonstrates the VIDEO media element embedded self-contained in the file (~290 KB, trimmed + downscaled from the 4K original with ffmpeg). One scrim, one line, a HUD “live” tag. On the editor canvas the clip shows its poster frame (inert); it only plays in present.',
    elements: [
      media({ kind: 'video', src: mediaFile('earth.mp4', 'video/mp4'), poster: mediaFile('earth-poster.jpg', 'image/jpeg'), x: 0, y: 0, w: 1280, h: 720, fit: 'cover', controls: false, muted: true, autoplay: true, loop: true }),
      shape('rect', { x: 0, y: 0, w: 1280, h: 720, fill: 'rgba(5,6,14,0.30)', fillGradient: grad(180, [0, 'rgba(5,6,14,0.32)'], [0.5, 'rgba(5,6,14,0.05)'], [1, 'rgba(5,6,14,0.82)']) }),
      mono(96, 84, '01b · THE VIEW FROM 400 KM', CYAN),
      shape('ellipse', { x: 1004, y: 90, w: 10, h: 10, fill: MAG, shadow: glow('rgba(255,79,163,0.9)', 10) }),
      mono(1024, 84, 'LIVE FEED', MAG, 12),
      text({ x: 96, y: 452, w: 1000, h: 180, html: 'Live from<br>low orbit.', fontSize: 66, fontWeight: 800, color: '#EAF4FF', lineHeight: 1.06, fontFamily: IN, shadow: { y: 2, blur: 30, color: 'rgba(0,0,0,0.6)' }, fx: { enter: 'fade-up' } }),
      mono(96, 648, 'EARTH FROM THE ISS · EXPEDITION 65 (4K) · NASA — PUBLIC DOMAIN', 'rgba(178,196,224,0.5)', 10),
    ],
  })

  const s3 = slide({
    id: 'orb-system', background: DEEP, transition: 'fade',
    notes: 'The “system map” — a clickable data pipeline: INGEST → CORE → MODEL, with dashes marching along the links (telemetry flowing) and a satellite orbiting the core. Nodes stagger in on entry. Click a node → a hidden STATE slide zooms that subsystem (link + stateOf). Extend it by duplicating a state slide.',
    elements: [
      mono(96, 84, '02 · THE CONSTELLATION — CLICK A NODE'),
      // orbit ring + a satellite riding it (keeps the map alive)
      shape('ellipse', { x: 500, y: 220, w: 280, h: 280, fill: 'rgba(0,0,0,0)', stroke: 'rgba(56,225,255,0.30)', strokeWidth: 1.5, strokeStyle: 'dashed', fx: { loop: { type: 'dash-march', distance: 40, duration: 7 } } }),
      shape('ellipse', { x: 636, y: 216, w: 8, h: 8, fill: CYAN, fillGradient: GRAD_CY, shadow: glow('rgba(56,225,255,0.85)', 16), fx: { loop: { type: 'motion-path', path: orbit(140, -Math.PI / 2, 1), duration: 12 } } }),
      // links: dashes march INGEST → CORE → MODEL, tips exactly on the node/core edges
      shape('line', { x: 342, y: 359, w: 238, h: 2, fill: 'rgba(132,186,236,0.9)', strokeWidth: 2, strokeStyle: 'dashed', lineEnd: 'arrow', fx: { loop: { type: 'dash-march', distance: 24, duration: 1.6 } } }),
      shape('line', { x: 700, y: 359, w: 238, h: 2, fill: 'rgba(132,186,236,0.9)', strokeWidth: 2, strokeStyle: 'dashed', lineEnd: 'arrow', fx: { loop: { type: 'dash-march', distance: 24, duration: 1.6 } } }),
      // CORE
      shape('ellipse', { x: 580, y: 300, w: 120, h: 120, fill: VOID, fillGradient: GRAD_CY, stroke: CYAN, strokeWidth: 2, shadow: glow('rgba(56,225,255,0.7)', 55), fx: { enter: 'fade-up', order: 0 } }),
      text({ x: 580, y: 351, w: 120, h: 30, html: '<b>CORE</b>', fontSize: 15, color: '#04141c', align: 'center', fontFamily: MONO, letterSpacing: 2, fx: { enter: 'fade-up', order: 0 } }),
      // INGEST node (left) — outer ring + inner glow dot + label, all click-linked
      shape('ellipse', { id: 'orb-n1', x: 258, y: 318, w: 84, h: 84, fill: DEEP, stroke: VIOLET, strokeWidth: 2, shadow: glow('rgba(122,92,255,0.55)', 34), link: 'orb-state-ingest', fx: { enter: 'fade-up', order: 1 } }),
      shape('ellipse', { x: 286, y: 346, w: 28, h: 28, fill: VIOLET, fillGradient: GRAD_MG, shadow: glow('rgba(122,92,255,0.85)', 14), link: 'orb-state-ingest', fx: { enter: 'fade-up', order: 1 } }),
      text({ x: 233, y: 416, w: 134, h: 24, html: 'INGEST', fontSize: 12, letterSpacing: 3, color: DIM, align: 'center', fontFamily: MONO, link: 'orb-state-ingest', fx: { enter: 'fade-up', order: 1 } }),
      // MODEL node (right)
      shape('ellipse', { id: 'orb-n2', x: 938, y: 318, w: 84, h: 84, fill: DEEP, stroke: MAG, strokeWidth: 2, shadow: glow('rgba(255,79,163,0.5)', 34), link: 'orb-state-model', fx: { enter: 'fade-up', order: 2 } }),
      shape('ellipse', { x: 966, y: 346, w: 28, h: 28, fill: MAG, shadow: glow('rgba(255,79,163,0.85)', 14), link: 'orb-state-model', fx: { enter: 'fade-up', order: 2 } }),
      text({ x: 913, y: 416, w: 134, h: 24, html: 'MODEL', fontSize: 12, letterSpacing: 3, color: DIM, align: 'center', fontFamily: MONO, link: 'orb-state-model', fx: { enter: 'fade-up', order: 2 } }),
      text({ x: 96, y: 566, w: 900, h: 60, html: 'Hidden state slides answer the click — arrow keys skip them,<br>so the linear story stays clean.', fontSize: 15, color: 'rgba(178,196,224,0.45)', lineHeight: 1.5, fx: { enter: 'fade', order: 3 } }),
    ],
  })

  const stateBase = (sid, title, body, accent, ph, credit) => slide({
    id: sid, stateOf: 'orb-system', background: DEEP, transition: 'morph', name: title,
    notes: 'A hidden state — reached only by clicking its node on the system map. Each state gets its own NASA backdrop (public domain) under a deep scrim — the photo switch is what makes the zoom-in feel like a place, not a popup.',
    elements: [
      img({ asset: ph, x: 0, y: 0, w: 1280, h: 720, opacity: 0.55, fx: { ambient: 'kenburns', ken: { dir: 'drift', scale: 1.08, duration: 20 } } }),
      shape('rect', { x: 0, y: 0, w: 1280, h: 720, fill: 'rgba(11,14,30,0.62)' }),
      mono(96, 84, `02a · ${title} — CLICK ANYWHERE DIM TO GO BACK`),
      shape('ellipse', { id: sid + '-halo', x: 460, y: 130, w: 360, h: 360, fill: 'rgba(0,0,0,0)', stroke: accent, strokeWidth: 2, shadow: glow(accent === VIOLET ? 'rgba(122,92,255,0.5)' : 'rgba(255,79,163,0.5)', 70) }),
      text({ x: 340, y: 240, w: 600, h: 80, html: title, fontSize: 56, fontWeight: 800, color: '#EAF4FF', align: 'center', letterSpacing: 8, fontFamily: IN }),
      text({ x: 340, y: 330, w: 600, h: 80, html: body, fontSize: 16, color: DIM, align: 'center', lineHeight: 1.6 }),
      mono(96, 648, credit, 'rgba(178,196,224,0.4)', 9),
      shape('rect', { x: 0, y: 0, w: 1280, h: 720, fill: 'rgba(0,0,0,0)', link: 'orb-system' }),
    ],
  })
  const st1 = stateBase('orb-state-ingest', 'INGEST', '4.2 TB of telemetry per orbit,<br>deduplicated at the edge.', VIOLET, 'ph-cubesats', 'CUBESATS DEPLOYED FROM THE ISS, EXPEDITION 72 · NASA — PUBLIC DOMAIN')
  const st2 = stateBase('orb-state-model', 'MODEL', 'Anomaly scores in 90 seconds —<br>before the next ground pass.', MAG, 'ph-jwst', 'JAMES WEBB PRIMARY MIRROR · NASA/MSFC — PUBLIC DOMAIN')

  const s4 = slide({
    id: 'orb-growth', background: VOID, transition: 'fade',
    notes: 'Neon-styled area chart. Note the restraint: one gradient line on darkness reads as “expensive”; three would read as a dashboard.',
    elements: [
      mono(96, 84, '03 · SIGNAL EXTRACTED, PETABYTES'),
      text({ x: 96, y: 120, w: 900, h: 90, html: 'Up and to the right,<br>literally.', fontSize: 54, fontWeight: 800, color: '#EAF4FF', fontFamily: IN, lineHeight: 1.1 }),
      chart({ x: 96, y: 280, w: 1088, h: 370, preset: 'line', option: {
        grid: { left: 46, right: 16, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'] },
        yAxis: { type: 'value' },
        color: [CYAN],
        tooltip: { trigger: 'axis' },
        series: [{ type: 'line', smooth: true, data: [2, 5, 11, 24, 52, 96],
          lineStyle: { width: 3.5, color: CYAN },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(56,225,255,0.35)' }, { offset: 1, color: 'rgba(56,225,255,0)' }] } },
          symbol: 'circle', symbolSize: 8, itemStyle: { color: CYAN } }],
      }, fx: { enter: 'fade-up' } }),
    ],
  })

  const s5 = slide({
    id: 'orb-end', background: VOID, transition: 'morph',
    notes: 'The ring comes home to center; the wordmark grows back on pure void black. Loops keep breathing after the morph settles.',
    elements: [
      shape('ellipse', { id: 'orb-ring', x: 340, y: 60, w: 600, h: 600, fill: 'rgba(0,0,0,0)', stroke: MAG, strokeWidth: 2, shadow: glow('rgba(255,79,163,0.4)', 80) }),
      shape('ellipse', { x: 620, y: 40, w: 44, h: 44, fill: MAG, fillGradient: GRAD_MG, shadow: glow('rgba(255,79,163,0.8)', 26), fx: { loop: { type: 'motion-path', path: orbit(300, -Math.PI / 2, 1), duration: 18 } } }),
      text({ id: 'orb-word', x: 140, y: 300, w: 1000, h: 110, html: 'JOIN THE SWEEP', fontSize: 66, fontWeight: 800, color: '#EAF4FF', align: 'center', letterSpacing: 16, fontFamily: IN, shadow: glow('rgba(255,79,163,0.3)', 40) }),
      mono(390, 430, 'ORBITAL.EXAMPLE · GROUND STATION OPEN HOUSE FRIDAYS', 'rgba(178,196,224,0.5)'),
    ],
  })

  return doc({
    title: 'Orbital — dark immersive template', withFonts: ['Instrument Sans'],
    assets: {
      'ph-stars': photo('orbital-stars.jpg'),
      'ph-cubesats': photo('orbital-cubesats.jpg'), 'ph-jwst': photo('orbital-jwst.jpg'),
      'font-spacemono': fontFile('SpaceMono-400-latin.woff2'),
      'font-spacemono-bold': fontFile('SpaceMono-700-latin.woff2'),
    },
    fonts: [
      { family: 'Space Mono', asset: 'font-spacemono', weight: '400' },
      { family: 'Space Mono', asset: 'font-spacemono-bold', weight: '700' },
    ],
    theme: { background: VOID, color: '#EAF4FF', accent: CYAN, fontFamily: IN },
    present: { progress: true },
    slides: [s1, s2, s2b, s3, st1, st2, s4, s5],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK D · «PICNIC» — playful toy-like (Bruno Simon / Hello Monday family)
// Sunshine, bubblegum, sky. Hard sticker shadows, everything slightly askew.
// ═══════════════════════════════════════════════════════════════════════
function deckPicnic() {
  const SUN = '#FFD43A', GUM = '#FF7BAC', SKY = '#4DC9F0', LIME = '#7BE382', INK = '#201A31', CREAM = '#FFF9EC'
  const sticker = { x: 6, y: 8, blur: 0, color: INK } // hard offset = sticker
  const wobble = (r, dur, phase = 0) => ({ loop: { type: 'motion-path', path: orbit(r, phase), duration: dur } })
  const chunky = (x, y, s, size = 90, color = INK, rot = 0) => text({ x, y, w: 1100, h: size * 1.4, html: s, fontSize: size, fontWeight: 900, color, fontFamily: IN, rotation: rot, lineHeight: 1 })

  const s1 = slide({
    id: 'pic-cover', background: SUN, transition: 'none',
    notes: 'TEMPLATE — “Pixel Picnic”, a playful toy-style deck. The cover is a scrapbook: a full-bleed 1941 carnival Kodachrome (Library of Congress, public domain) washed with the brand yellow, stickers slapped on top. Style family: saturated flats, hard sticker shadows (offset, zero blur), everything 2–4° askew, wobble loops. The blobs morph into the schedule tiles.',
    elements: [
      img({ asset: 'ph-fairwide', x: 0, y: 0, w: 1280, h: 720, fx: { ambient: 'kenburns', ken: { dir: 'drift', scale: 1.06, duration: 22 } } }),
      shape('rect', { x: 0, y: 0, w: 1280, h: 720, fill: 'rgba(255,212,58,0.55)' }),
      shape('ellipse', { id: 'pic-a', x: 950, y: 90, w: 220, h: 220, fill: GUM, stroke: INK, strokeWidth: 5, shadow: sticker, fx: wobble(10, 7) }),
      shape('rect', { id: 'pic-b', x: 560, y: 110, w: 190, h: 190, radius: 40, fill: SKY, stroke: INK, strokeWidth: 5, rotation: -8, shadow: sticker, fx: wobble(8, 9, 2) }),
      shape('triangle', { id: 'pic-c', x: 1010, y: 430, w: 180, h: 160, fill: LIME, stroke: INK, strokeWidth: 5, rotation: 7, shadow: sticker, fx: wobble(9, 8, 4) }),
      chunky(120, 150, 'PIXEL<br>PICNIC', 130, INK, -2),
      text({ x: 130, y: 470, w: 700, h: 60, html: 'a two-day jam for games,<br>toys &amp; gloriously useless websites', fontSize: 24, fontWeight: 700, color: INK, rotation: -2, lineHeight: 1.3 }),
      text({ x: 850, y: 350, w: 340, h: 40, html: 'AUG 22–23 · THE OLD POOL', fontSize: 16, fontWeight: 800, color: INK, rotation: 3, letterSpacing: 1 }),
      shape('rect', { x: 645, y: 405, w: 230, h: 272, radius: 12, fill: '#FFFFFF', stroke: INK, strokeWidth: 4, rotation: -5, shadow: sticker, fx: { enter: 'fade-up', order: 1 } }),
      img({ asset: 'ph-fair', x: 661, y: 421, w: 198, h: 204, radius: 6, rotation: -5, fx: { enter: 'fade-up', order: 1, ambient: 'kenburns', ken: { dir: 'drift', scale: 1.04, duration: 16 } } }),
      text({ x: 661, y: 633, w: 198, h: 30, html: 'last picnic!!', fontSize: 16, fontWeight: 800, color: INK, align: 'center', rotation: -5, fx: { enter: 'fade-up', order: 1 } }),
      // Embedded audio (self-contained) — a short chime synthesised in
      // build-example-decks.mjs, so it's unambiguously public domain. Demos the
      // media element's embed path: the sound travels inside the .bento.html.
      text({ x: 130, y: 556, w: 360, h: 26, html: '▶ press play — the picnic jingle', fontSize: 15, fontWeight: 800, color: INK, rotation: -1 }),
      media({ id: 'pic-jingle', kind: 'audio', src: mediaFile('chime.wav', 'audio/wav'), x: 130, y: 588, w: 300, h: 56, controls: true }),
      text({ x: 130, y: 682, w: 700, h: 20, html: 'PHOTOS: JACK DELANO, 1941 · LIBRARY OF CONGRESS — PUBLIC DOMAIN', fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'rgba(32,26,49,0.55)' }),
    ],
  })

  const s2 = slide({
    id: 'pic-rules', background: CREAM, transition: 'fade',
    notes: 'House rules as stickers. Count-up on the big number. Duplicate a card, rotate it ±3°, done.',
    elements: [
      chunky(110, 90, 'THREE RULES.', 84, INK, -1),
      ...[
        [SUN, 'MAKE IT<br>WEIRD', -3, 0],
        [GUM, 'SHIP IT<br>SILLY', 2, 1],
        [SKY, 'DEMO OR<br>IT DIDN’T<br>HAPPEN', -2, 2],
      ].map(([c, s, rot, i]) => shape('rect', { x: 120 + i * 370, y: 240, w: 320, h: 300, radius: 28, fill: c, stroke: INK, strokeWidth: 5, rotation: rot, shadow: sticker, fx: { enter: 'fade-up', order: i } })),
      ...['MAKE IT<br>WEIRD', 'SHIP IT<br>SILLY', 'DEMO OR IT<br>DIDN’T HAPPEN'].map((s, i) =>
        text({ x: 150 + i * 370, y: 300, w: 260, h: 200, html: s, fontSize: 38, fontWeight: 900, color: INK, align: 'center', rotation: [-3, 2, -2][i], lineHeight: 1.15, fx: { enter: 'fade-up', order: i } })),
      text({ x: 120, y: 590, w: 500, h: 80, html: '48', fontSize: 84, fontWeight: 900, color: GUM, fontFamily: IN, fx: { countUp: true, enter: 'fade', order: 3 } }),
      text({ x: 250, y: 630, w: 500, h: 40, html: 'hours. that’s the whole budget.', fontSize: 20, fontWeight: 700, color: INK, fx: { enter: 'fade', order: 3 } }),
    ],
  })

  const s3 = slide({
    id: 'pic-schedule', background: SKY, transition: 'morph',
    notes: 'The blobs morphed into schedule tiles — same ids as the cover shapes. A schedule that bounces beats a table that bores.',
    elements: [
      chunky(110, 80, 'THE PLAN-ISH', 84, CREAM, -1),
      shape('ellipse', { id: 'pic-a', x: 120, y: 220, w: 330, h: 150, fill: GUM, stroke: INK, strokeWidth: 5, shadow: sticker }),
      text({ x: 140, y: 262, w: 290, h: 70, html: '<b>SAT 10:00</b> — kickoff &amp; pancakes', fontSize: 20, fontWeight: 800, color: INK, align: 'center', lineHeight: 1.3 }),
      shape('rect', { id: 'pic-b', x: 480, y: 300, w: 330, h: 150, radius: 34, fill: SUN, stroke: INK, strokeWidth: 5, rotation: 2, shadow: sticker }),
      text({ x: 500, y: 342, w: 290, h: 70, html: '<b>SAT 22:00</b> — night build, lights off', fontSize: 20, fontWeight: 800, color: INK, align: 'center', rotation: 2, lineHeight: 1.3 }),
      shape('triangle', { id: 'pic-c', x: 850, y: 210, w: 320, h: 260, fill: LIME, stroke: INK, strokeWidth: 5, rotation: -3, shadow: sticker }),
      text({ x: 890, y: 330, w: 240, h: 70, html: '<b>SUN 16:00</b><br>DEMOS!', fontSize: 22, fontWeight: 900, color: INK, align: 'center', rotation: -3, lineHeight: 1.25 }),
      text({ x: 120, y: 560, w: 1000, h: 60, html: 'everything else is officially improvised', fontSize: 22, fontWeight: 700, color: CREAM, rotation: -1 }),
    ],
  })

  const s3b = slide({
    id: 'pic-photo', background: CREAM, transition: 'fade',
    notes: 'The photo-as-sticker recipe: a white frame rect with the ink outline + hard shadow, a photo with a soft ken-burns drift inside it, a marker caption, and one sticker slapped over the corner. Photo: Jack Delano’s 1941 state-fair Kodachrome (Library of Congress — public domain).',
    elements: [
      chunky(100, 180, 'PROOF<br>IT’S FUN.', 96, INK, -2),
      text({ x: 110, y: 460, w: 480, h: 80, html: 'actual footage of the last picnic.<br>nobody shipped anything. 10/10.', fontSize: 21, fontWeight: 700, color: INK, rotation: -2, lineHeight: 1.4, fx: { enter: 'fade-up', order: 1 } }),
      shape('rect', { x: 690, y: 60, w: 490, h: 590, radius: 18, fill: '#FFFFFF', stroke: INK, strokeWidth: 5, rotation: 3, shadow: sticker, fx: { enter: 'fade-up' } }),
      img({ asset: 'ph-fair', x: 716, y: 86, w: 438, h: 470, radius: 10, rotation: 3, fx: { enter: 'fade-up', ambient: 'kenburns', ken: { dir: 'drift', scale: 1.045, duration: 14 } } }),
      text({ x: 716, y: 572, w: 438, h: 40, html: 'the wheel. august. absolute chaos.', fontSize: 19, fontWeight: 800, color: INK, align: 'center', rotation: 3, fx: { enter: 'fade-up' } }),
      shape('ellipse', { x: 640, y: 40, w: 110, h: 110, fill: GUM, stroke: INK, strokeWidth: 5, shadow: sticker, fx: wobble(9, 8, 3) }),
      text({ x: 645, y: 76, w: 100, h: 40, html: '1941!', fontSize: 22, fontWeight: 900, color: INK, align: 'center', rotation: -8 }),
      text({ x: 690, y: 668, w: 490, h: 20, html: 'JACK DELANO · LIBRARY OF CONGRESS — PUBLIC DOMAIN', fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'rgba(32,26,49,0.5)', align: 'center' }),
    ],
  })

  const s4 = slide({
    id: 'pic-snacks', background: CREAM, transition: 'fade',
    notes: 'Yes, a snack chart. Charts don’t have to be serious — brand the palette and let the tooltip do a joke.',
    elements: [
      chunky(110, 80, 'SNACK BUDGET,<br>VISUALIZED', 66, INK, -1),
      chart({ x: 110, y: 260, w: 1060, h: 390, preset: 'bar', option: {
        grid: { left: 44, right: 12, top: 24, bottom: 32 },
        xAxis: { type: 'category', data: ['pizza', 'gummy bears', 'coffee', 'fruit??', 'mystery'] },
        yAxis: { type: 'value' },
        color: [GUM],
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        series: [{ type: 'bar', data: [38, 27, 22, 4, 9],
          itemStyle: { color: GUM, borderRadius: 14 }, barWidth: 110 }],
      }, fx: { enter: 'fade-up' } }),
    ],
  })

  const s5 = slide({
    id: 'pic-end', background: GUM, transition: 'zoom',
    notes: 'Confetti exit — every shape on its own wobble loop, phase-offset so nothing is frozen at entry.',
    elements: [
      ...[[SUN, 160, 120, 60, 0], [SKY, 1060, 140, 50, 1], [LIME, 200, 520, 70, 2],
          [CREAM, 990, 500, 44, 3], [SUN, 640, 80, 36, 4], ['#8A6FE8', 1130, 350, 40, 5]]
        .map(([c, x, y, w, i]) => shape(i % 2 ? 'ellipse' : 'rect', { x, y, w, h: w, radius: 12, fill: c, stroke: INK, strokeWidth: 4, rotation: (i * 17) % 30 - 15, shadow: sticker, fx: wobble(12 + i * 2, 6 + i, i) })),
      chunky(140, 250, 'COME PLAY.', 120, INK, -2),
      text({ x: 140, y: 430, w: 1000, h: 40, html: 'pixelpicnic.example — bring a controller and a sleeping bag', fontSize: 22, fontWeight: 800, color: INK, rotation: -2 }),
    ],
  })

  return doc({
    title: 'Pixel Picnic — playful template', withFonts: ['Instrument Sans'],
    assets: { 'ph-fair': photo('picnic-fair.jpg'), 'ph-fairwide': photo('picnic-fairwide.jpg') },
    theme: { background: SUN, color: INK, accent: GUM, fontFamily: IN },
    slides: [s1, s2, s3, s3b, s4, s5],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK E · «هلال» — گزارش مدیریتی فصلی (executive quarterly, Farsi/RTL)
// Deep navy + brass on warm paper. The FOUR-CAST squares carry the deck:
// cover motif → agenda badges → KPI cards → roadmap chips → closing row.
// All copy RTL, Persian digits, NO letter-spacing (joined script).
// ═══════════════════════════════════════════════════════════════════════
function deckHelal() {
  const NAVY = '#0F1D30', PANEL = '#17293F', PAPER = '#F4F1E9'
  const BRASS = '#C9A24B', BRASS_SOFT = '#E0C583', BRASS_DEEP = '#A67F2E'
  const STEEL = '#8195AD', INKT = '#1C2B40', SOFT = 'rgba(28,43,64,0.6)'
  const UP = '#7FD6A4', DOWN = '#F0907C'
  const GRAD_PANEL = grad(0, [0, '#122238'], [1, '#1B3049'])
  const GRAD_BRASS = grad(20, [0, '#D9B364'], [1, '#B08A3E'])
  const kick = (s, y = 84, color = BRASS_SOFT) => ftext({ x: 284, y, w: 900, h: 26, html: s, fontSize: 15, fontWeight: 600, color })
  const pg = (n) => text({ x: 96, y: 654, w: 80, h: 24, html: fa(n), fontSize: 13, fontWeight: 600, color: STEEL, align: 'left', fontFamily: VZ })
  // the four KPI tiles — same four ids from cover to close
  const cast = ['hl-a', 'hl-b', 'hl-c', 'hl-d']

  const s1 = slide({
    id: 'hl-cover', background: NAVY, transition: 'none',
    notes: 'قالب — «هلال»، گزارش مدیریتی فصلی راست‌به‌چپ. کفِ جوهری سرمه‌ای با اکسنت برنجی؛ چیدمان آینه‌ای: کیکر بالا-راست، شمارهٔ صفحه پایین-چپ. چهار مربع برنجی پایین-چپ «کستِ» morph هستند و تا اسلاید آخر با ما می‌مانند.',
    elements: [
      kick('هلدینگ هلال — گزارش فصلی هیئت‌مدیره'),
      shape('rect', { x: 96, y: 118, w: 1088, h: 2, fill: 'rgba(201,162,75,0.45)' }),
      ftext({ id: 'hl-title', x: 96, y: 190, w: 1088, h: 180, html: 'تابستان ۱۴۰۵', fontSize: 120, fontWeight: 800, color: PAPER, lineHeight: 1.05 }),
      ftext({ x: 296, y: 420, w: 888, h: 44, html: 'مرور عملکرد، شاخص‌های کلیدی و برنامهٔ نیم‌سال دوم', fontSize: 22, color: STEEL, fx: { enter: 'fade-up', order: 1 } }),
      ...cast.map((c, i) => shape('rect', { id: c, x: 96 + i * 34, y: 560, w: 20, h: 20, fill: BRASS, fillGradient: GRAD_BRASS })),
      ftext({ x: 260, y: 560, w: 500, h: 22, html: 'چهار شاخص، یک روایت', fontSize: 14, color: STEEL }),
      ftext({ x: 484, y: 654, w: 700, h: 22, html: 'سند داخلی — محرمانه · نسخهٔ ۱٫۰', fontSize: 12, color: 'rgba(129,149,173,0.65)' }),
      pg(1),
    ],
  })

  const agenda = ['یادداشت مدیرعامل', 'شاخص‌های کلیدی فصل', 'درآمد و اهداف', 'نگاه به نیم‌سال دوم']
  const s2 = slide({
    id: 'hl-agenda', background: PAPER, transition: 'morph',
    notes: 'بیت morph اول: مربع‌های کاور به نشان‌های کنار فهرست می‌رسند و عنوان به گوشه می‌نشیند. جدول‌بندی آینه‌ای — نشان سمت راست، متن از راست.',
    elements: [
      ftext({ id: 'hl-title', x: 784, y: 72, w: 400, h: 64, html: 'فهرست', fontSize: 40, fontWeight: 800, color: SOFT }),
      ...agenda.flatMap((item, i) => [
        shape('rect', { id: cast[i], x: 1152, y: 208 + i * 110, w: 18, h: 18, fill: BRASS, fillGradient: GRAD_BRASS }),
        ftext({ x: 200, y: 188 + i * 110, w: 920, h: 56, html: item, fontSize: 30, fontWeight: 700, color: INKT }),
        shape('rect', { x: 96, y: 256 + i * 110, w: 1074, h: 1, fill: 'rgba(28,43,64,0.14)' }),
      ]),
      pg(2),
    ],
  })

  const kpis = [
    ['۴۸٫۲', 'میلیارد تومان درآمد', '+۱۲٪ نسبت به بهار', UP],
    ['۱۲٬۴۰۰', 'مشتری فعال', '+۸٪ رشد ماهانه', UP],
    ['۳۴٪', 'حاشیه سود ناخالص', '−۲٪ افت نسبت به بهار', DOWN],
    ['۴٫۶', 'رضایت کاربران از ۵', '+۰٫۳ بهبود فصلی', UP],
  ]
  const s3 = slide({
    id: 'hl-kpi', background: NAVY, transition: 'morph',
    notes: 'بیت morph دوم: نشان‌های فهرست به چهار کارت شاخص تبدیل می‌شوند — همان چهار id، نقش تازه. اعداد درشت وزیرمتن؛ دلتاها رنگی، بدون نمودار.',
    elements: [
      kick('شاخص‌های کلیدی — فصل تابستان'),
      ...kpis.flatMap(([num, label, delta, dc], i) => [
        shape('rect', { id: cast[i], x: 96 + (3 - i) * 278, y: 200, w: 254, h: 264, fill: PANEL, fillGradient: GRAD_PANEL, radius: 14, stroke: 'rgba(129,149,173,0.25)', strokeWidth: 1 }),
        shape('rect', { x: 96 + (3 - i) * 278 + 24, y: 226, w: 44, h: 3, fill: BRASS, fillGradient: GRAD_BRASS }),
        ftext({ x: 120 + (3 - i) * 278, y: 256, w: 206, h: 76, html: num, fontSize: 52, fontWeight: 800, color: PAPER }),
        ftext({ x: 120 + (3 - i) * 278, y: 342, w: 206, h: 52, html: label, fontSize: 17, color: STEEL, lineHeight: 1.45 }),
        ftext({ x: 120 + (3 - i) * 278, y: 408, w: 206, h: 30, html: delta, fontSize: 15, fontWeight: 700, color: dc }),
      ]),
      ftext({ x: 96, y: 520, w: 1088, h: 32, html: 'حرکت کلی فصل مثبت بود؛ حاشیه سود نیازمند برنامهٔ مشخص در مهر است.', fontSize: 19, color: STEEL }),
      pg(3),
    ],
  })

  const s4 = slide({
    id: 'hl-revenue', background: PAPER, transition: 'fade',
    notes: 'نمودار ستونی برندشده: یک رنگ برنجی عمیق کافی است؛ تیتر درشت بالای نمودار و tooltip فارسی. اعداد نمونه‌اند — دادهٔ خودتان را جایگزین کنید.',
    elements: [
      ftext({ x: 284, y: 84, w: 900, h: 26, html: 'درآمد — چهار فصل منتهی به تابستان ۱۴۰۵', fontSize: 15, fontWeight: 600, color: BRASS_DEEP }),
      ftext({ x: 96, y: 130, w: 1088, h: 90, html: 'مسیر رشد، بی‌وقفه.', fontSize: 56, fontWeight: 800, color: INKT }),
      chart({ x: 96, y: 250, w: 1088, h: 400, preset: 'bar', option: {
        grid: { left: 56, right: 16, top: 24, bottom: 34 },
        xAxis: { type: 'category', data: ['پاییز ۱۴۰۴', 'زمستان ۱۴۰۴', 'بهار ۱۴۰۵', 'تابستان ۱۴۰۵'] },
        yAxis: { type: 'value' },
        color: [BRASS_DEEP],
        tooltip: { trigger: 'item', formatter: '{b}: {c} میلیارد تومان' },
        series: [{ type: 'bar', data: [31, 38, 43, 48.2], itemStyle: { color: BRASS_DEEP, borderRadius: 6 }, barWidth: 120 }],
      }, fx: { enter: 'fade-up', order: 1 } }),
      pg(4),
    ],
  })

  const s5 = slide({
    id: 'hl-targets', background: PAPER, transition: 'fade',
    notes: 'جدول اهداف — سلول‌ها راست‌چین روی وزیرمتن؛ وضعیت‌ها رنگی و توپر. هدرِ جوهری، زیبرای بسیار ملایم.',
    elements: [
      ftext({ x: 284, y: 84, w: 900, h: 26, html: 'اهداف نیم‌سال دوم', fontSize: 15, fontWeight: 600, color: BRASS_DEEP }),
      ftext({ x: 96, y: 130, w: 1088, h: 80, html: 'چه چیزی را وعده داده‌ایم.', fontSize: 48, fontWeight: 800, color: INKT }),
      ftable({
        x: 96, y: 250, w: 1088, h: 320,
        columns: [{ w: 2 }, { w: 1.2 }, { w: 1.2 }, { w: 1.6 }],
        rows: [
          { cells: [fcell('شاخص', { bold: true }), fcell('هدف', { bold: true }), fcell('وضع فعلی', { bold: true }), fcell('ارزیابی', { bold: true })] },
          { cells: [fcell('درآمد فصل'), fcell('۴۵ میلیارد'), fcell('۴۸٫۲ میلیارد'), fcell('محقق شد', { bold: true, color: '#1F7A5C' })] },
          { cells: [fcell('مشتریان فعال'), fcell('۱۲٬۰۰۰'), fcell('۱۲٬۴۰۰'), fcell('محقق شد', { bold: true, color: '#1F7A5C' })] },
          { cells: [fcell('حاشیه سود ناخالص'), fcell('۳۶٪'), fcell('۳۴٪'), fcell('نیازمند اقدام', { bold: true, color: '#B23B2E' })] },
          { cells: [fcell('رضایت کاربران'), fcell('۴٫۵'), fcell('۴٫۶'), fcell('محقق شد', { bold: true, color: '#1F7A5C' })] },
        ],
        headerBg: INKT, headerColor: PAPER, zebra: 'rgba(28,43,64,0.045)',
        borderColor: 'rgba(28,43,64,0.16)', color: INKT,
      }),
      pg(5),
    ],
  })

  const s6 = slide({
    id: 'hl-quote', background: PAPER, transition: 'fade',
    notes: 'نقل‌قول مدیرعامل. گیومهٔ غول‌آسا سمت چپ (آینهٔ چیدمان)، خط برنجی کوچک پایین-راست — همین خط در اسلاید بعد به ستون فقرات نقشهٔ راه morph می‌شود.',
    elements: [
      ftext({ x: 96, y: 130, w: 220, h: 240, html: '”', fontSize: 220, fontWeight: 800, color: 'rgba(201,162,75,0.35)', align: 'left', lineHeight: 1 }),
      ftext({ x: 256, y: 210, w: 928, h: 220, html: 'رقبای ما سرعت دارند؛ ما جهت داریم.<br>تابستان نشان داد این ترکیب برنده است.', fontSize: 42, fontWeight: 700, color: INKT, lineHeight: 1.55 }),
      ftext({ x: 556, y: 470, w: 628, h: 32, html: '— آرش صالحی، مدیرعامل هلدینگ هلال', fontSize: 18, color: SOFT }),
      shape('rect', { id: 'hl-rule', x: 1088, y: 560, w: 96, h: 3, fill: BRASS, fillGradient: GRAD_BRASS }),
      pg(6),
    ],
  })

  const miles = [
    ['مهر', 'انتقال پلت‌فرم به معماری جدید', 1000],
    ['آبان', 'عرضهٔ اپ موبایل نسخهٔ ۲', 490],
    ['آذر', 'ورود به بازار صادراتی منطقه', 130],
  ]
  const s7 = slide({
    id: 'hl-roadmap', background: NAVY, transition: 'morph',
    notes: 'بیت morph سوم: خط برنجیِ نقل‌قول به ستون فقرات نقشهٔ راه بلند می‌شود. تایم‌لاین از راست به چپ خوانده می‌شود؛ گره‌ها متناوب بالا/پایین خط.',
    elements: [
      kick('نگاه به جلو — نیم‌سال دوم'),
      shape('rect', { id: 'hl-rule', x: 96, y: 380, w: 1088, h: 3, fill: BRASS, fillGradient: GRAD_BRASS }),
      ...miles.flatMap(([month, desc, x], i) => {
        const up = i % 2 === 0
        return [
          shape('ellipse', { x: x - 2, y: 374, w: 16, h: 16, fill: NAVY, stroke: BRASS, strokeWidth: 2, shadow: { blur: 18, color: 'rgba(201,162,75,0.5)' }, fx: { enter: 'fade-up', order: i } }),
          ftext({ x: x - 40, y: up ? 240 : 430, w: 260, h: 40, html: month, fontSize: 26, fontWeight: 800, color: PAPER, align: 'center', fx: { enter: 'fade-up', order: i } }),
          ftext({ x: x - 40, y: up ? 288 : 478, w: 260, h: 56, html: desc, fontSize: 16, color: STEEL, align: 'center', lineHeight: 1.5, fx: { enter: 'fade-up', order: i } }),
        ]
      }),
      ...cast.map((c, i) => shape('rect', { id: c, x: 96 + i * 26, y: 630, w: 14, h: 14, fill: BRASS, fillGradient: GRAD_BRASS })),
      pg(7),
    ],
  })

  const s8 = slide({
    id: 'hl-close', background: NAVY, transition: 'morph',
    notes: 'بستن: چیپ‌های نقشهٔ راه به ردیف مرکزی برمی‌گردند و عنوان بزرگ وسط می‌نشیند. جملهٔ پایانی را با نام سازمان خودتان عوض کنید.',
    elements: [
      ...cast.map((c, i) => shape('rect', { id: c, x: 592 + i * 30, y: 190, w: 18, h: 18, fill: BRASS, fillGradient: GRAD_BRASS })),
      ftext({ x: 96, y: 270, w: 1088, h: 220, html: 'تابستانِ خوبی بود.<br>پاییز، بزرگ‌تر می‌شویم.', fontSize: 84, fontWeight: 800, color: PAPER, align: 'center', lineHeight: 1.3 }),
      ftext({ x: 296, y: 530, w: 688, h: 32, html: 'گزارش کامل در فایل پیوست جلسه منتشر می‌شود.', fontSize: 18, color: STEEL, align: 'center' }),
      ftext({ x: 296, y: 646, w: 688, h: 22, html: 'هلدینگ هلال — سازمانی فرضی برای یک قالب واقعی', fontSize: 12, color: 'rgba(129,149,173,0.55)', align: 'center' }),
      pg(8),
    ],
  })

  return doc({
    title: 'هلال — قالب گزارش مدیریتی', withFonts: ['Vazirmatn'],
    theme: { background: NAVY, color: PAPER, accent: BRASS, fontFamily: VZ },
    present: { progress: true },
    slides: [s1, s2, s3, s4, s5, s6, s7, s8],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK F · «شتاب» — پیچ استارتاپ (startup pitch, Farsi/RTL)
// Violet-black void, mesh-gradient blobs, huge display type. The two mesh
// blobs and the argument PANEL morph through the narrative: pains panel →
// solution card, blobs out to the corners and back for the close.
// NOTE: countUp is deliberately unused here — it animates ASCII digits, and
// Persian numerals would swap, not count.
// ═══════════════════════════════════════════════════════════════════════
function deckShetab() {
  const VOID = '#0B0716', PANEL = '#150E28', LILAC = '#EDE9FF'
  const DIM = 'rgba(196,186,232,0.68)', HOT = '#FF4FA3', VIO = '#8B7BFF'
  const GRAD_VIO = grad(30, [0, '#6D5BFF'], [1, '#9F8BFF'])
  const GRAD_HOT = grad(30, [0, '#FF4FA3'], [1, '#FF8A5C'])
  const glow = (c, blur = 60) => ({ blur, color: c })
  const kick = (s, color = VIO) => ftext({ x: 384, y: 84, w: 800, h: 26, html: s, fontSize: 15, fontWeight: 700, color })
  const pg = (n) => text({ x: 96, y: 654, w: 80, h: 24, html: fa(n), fontSize: 13, fontWeight: 600, color: 'rgba(196,186,232,0.45)', align: 'left', fontFamily: VZ })

  const s1 = slide({
    id: 'sh-cover', background: VOID, transition: 'none',
    notes: 'قالب — «شتاب»، پیچ استارتاپ فارسی. توده‌های گرادیان (mesh) با glow آرام نفس می‌کشند و در کل دک با morph جابه‌جا می‌شوند؛ پنل استدلال اسلاید مسئله در اسلاید راه‌حل به کارت متمرکز تبدیل می‌شود.',
    elements: [
      shape('ellipse', { id: 'sh-a', x: -80, y: -120, w: 560, h: 560, opacity: 0.55, fill: VIO, fillGradient: GRAD_VIO, shadow: glow('rgba(109,91,255,0.45)', 110), fx: { loop: { type: 'motion-path', path: drift(40, 28, 1, 2), duration: 26 } } }),
      shape('ellipse', { id: 'sh-b', x: 880, y: 380, w: 480, h: 480, opacity: 0.5, fill: HOT, fillGradient: GRAD_HOT, shadow: glow('rgba(255,79,163,0.4)', 100), fx: { loop: { type: 'motion-path', path: drift(34, 24, 2, 1, 1), duration: 22 } } }),
      kick('شتاب — پلتفرم تحلیل رشد'),
      ftext({ id: 'sh-title', x: 96, y: 170, w: 1088, h: 300, html: 'رشد را<br>دقیق ببینید.', fontSize: 104, fontWeight: 800, color: LILAC, lineHeight: 1.18 }),
      ftext({ x: 486, y: 500, w: 698, h: 40, html: 'همهٔ داده‌های محصول شما، در یک صفحهٔ قابل فهم', fontSize: 22, color: DIM, fx: { enter: 'fade-up', order: 1 } }),
      shape('rect', { x: 1048, y: 580, w: 136, h: 44, radius: 22, fill: HOT, fillGradient: GRAD_HOT, shadow: glow('rgba(255,79,163,0.5)', 30) }),
      ftext({ x: 1048, y: 590, w: 136, h: 28, html: 'شروع کنید', fontSize: 15, fontWeight: 700, color: '#FFF', align: 'center' }),
      pg(1),
    ],
  })

  const pains = [
    'داشبوردهای شلوغی که هیچ‌کس باز نمی‌کند',
    'گزارش‌های ماهانه‌ای که تا چاپ کهنه شده‌اند',
    'سنجه‌هایی که با رشد واقعی بیگانه‌اند',
  ]
  const s2 = slide({
    id: 'sh-problem', background: VOID, transition: 'morph',
    notes: 'بیت morph اول: توده‌ها به دو گوشه جمع می‌شوند تا حرف اصلی نفس بکشد. پنل بزرگ، هر سه درد را نگه می‌دارد — همین پنل در اسلاید بعد به کارت راه‌حل تبدیل می‌شود.',
    elements: [
      shape('ellipse', { id: 'sh-a', x: 980, y: -160, w: 380, h: 380, opacity: 0.4, fill: VIO, fillGradient: GRAD_VIO, shadow: glow('rgba(109,91,255,0.4)', 90) }),
      shape('ellipse', { id: 'sh-b', x: -140, y: 520, w: 340, h: 340, opacity: 0.38, fill: HOT, fillGradient: GRAD_HOT, shadow: glow('rgba(255,79,163,0.35)', 80) }),
      kick('۰۱ · مسئله'),
      ftext({ x: 96, y: 120, w: 1088, h: 175, html: 'داده دارید.<br>بینش ندارید.', fontSize: 64, fontWeight: 800, color: LILAC, lineHeight: 1.25 }),
      shape('rect', { id: 'sh-card', x: 96, y: 320, w: 1088, h: 290, radius: 20, fill: PANEL, stroke: 'rgba(139,123,255,0.3)', strokeWidth: 1, shadow: glow('rgba(109,91,255,0.18)', 60) }),
      ...pains.flatMap((p, i) => [
        shape('ellipse', { x: 1140, y: 372 + i * 80, w: 12, h: 12, fill: HOT, fillGradient: GRAD_HOT, shadow: glow('rgba(255,79,163,0.7)', 12), fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 300, y: 356 + i * 80, w: 816, h: 44, html: p, fontSize: 24, fontWeight: 600, color: DIM, fx: { enter: 'fade-up', order: i } }),
      ]),
      pg(2),
    ],
  })

  const s3 = slide({
    id: 'sh-solution', background: VOID, transition: 'morph',
    notes: 'بیت morph دوم: پنل دردها جمع می‌شود و به کارت راه‌حل تبدیل می‌شود — همان id «sh-card». تیتر بالای کارت همان جعبهٔ تیتر اسلاید قبل است.',
    elements: [
      ftext({ id: 'sh-title', x: 96, y: 120, w: 1088, h: 90, html: 'داده دارید.', fontSize: 40, fontWeight: 800, color: 'rgba(237,233,255,0.4)' }),
      shape('ellipse', { x: 1060, y: 420, w: 300, h: 300, opacity: 0.35, fill: VIO, fillGradient: GRAD_VIO, shadow: glow('rgba(109,91,255,0.4)', 90) }),
      shape('rect', { id: 'sh-card', x: 340, y: 240, w: 600, h: 360, radius: 24, fill: PANEL, stroke: 'rgba(139,123,255,0.5)', strokeWidth: 1.5, shadow: glow('rgba(109,91,255,0.3)', 80) }),
      ftext({ x: 390, y: 290, w: 500, h: 120, html: '«شتاب» هر سنجه را به یک جواب روشن تبدیل می‌کند.', fontSize: 34, fontWeight: 800, color: LILAC, align: 'center', lineHeight: 1.5 }),
      ...['تحلیل لحظه‌ای', 'هشدار هوشمند', 'پیش‌بینی رشد'].flatMap((f, i) => [
        shape('ellipse', { x: 866, y: 437 + i * 54, w: 10, h: 10, fill: HOT, fillGradient: GRAD_HOT }),
        ftext({ x: 430, y: 424 + i * 54, w: 420, h: 40, html: f, fontSize: 21, fontWeight: 600, color: DIM }),
      ]),
      pg(3),
    ],
  })

  const feats = [
    ['جریان زنده', 'هر رویداد محصول، همان لحظه روی نمودار می‌نشیند.'],
    ['هشدار هوشمند', 'قبل از آن‌که نرخ ریزش بلند شود، پیام می‌گیرید.'],
    ['پیش‌بینی', 'مدل شما را سه ماه جلوتر می‌بیند.'],
  ]
  const s4 = slide({
    id: 'sh-product', background: VOID, transition: 'fade',
    notes: 'ماکاپ محصول بدون تصویر: یک پنل تیره با نوار عنوان و ردیف‌های داده — همه شکل، نه عکس. سه ویژگی سمت راست پلکانی می‌آیند (بیت fade: ورود پلکانی فقط روی اسلاید non-morph اجرا می‌شود).',
    elements: [
      kick('۰۲ · محصول'),
      shape('rect', { x: 96, y: 180, w: 620, h: 430, radius: 16, fill: PANEL, stroke: 'rgba(139,123,255,0.35)', strokeWidth: 1, shadow: glow('rgba(109,91,255,0.2)', 50) }),
      shape('rect', { x: 96, y: 180, w: 620, h: 48, radius: 16, fill: '#1C1338' }),
      ...[0, 1, 2].map((i) => shape('ellipse', { x: 664 - i * 26, y: 198, w: 13, h: 13, fill: [HOT, '#FFC24B', '#54D08A'][i] })),
      ...[0, 1, 2, 3].flatMap((i) => [
        shape('rect', { x: 140, y: 280 + i * 78, w: 220 - i * 30, h: 12, radius: 6, fill: VIO, opacity: 0.55 }),
        shape('rect', { x: 640 - (160 + i * 40), y: 276 + i * 78, w: 150 + i * 40, h: 22, radius: 6, fill: i % 2 ? HOT : VIO, opacity: 0.35 }),
        shape('rect', { x: 400, y: 282 + i * 78, w: 60, h: 10, radius: 5, fill: 'rgba(196,186,232,0.35)' }),
      ]),
      ...feats.flatMap(([t, d], i) => [
        ftext({ x: 770, y: 200 + i * 140, w: 414, h: 44, html: t, fontSize: 28, fontWeight: 800, color: LILAC, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 770, y: 250 + i * 140, w: 414, h: 56, html: d, fontSize: 17, color: DIM, lineHeight: 1.6, fx: { enter: 'fade-up', order: i } }),
      ]),
      pg(4),
    ],
  })

  const s5 = slide({
    id: 'sh-traction', background: VOID, transition: 'fade',
    notes: 'نمودار خطی رشد با گرادیان زیر خط — یک خط روی تاریکی «گران» به‌نظر می‌رسد؛ سه خط، داشبوردی. برچسب‌های محور فارسی.',
    elements: [
      kick('۰۳ · کشش'),
      ftext({ x: 96, y: 120, w: 1088, h: 80, html: 'منحنی، حرف اول را می‌زند.', fontSize: 52, fontWeight: 800, color: LILAC }),
      chart({ x: 96, y: 240, w: 1088, h: 400, preset: 'line', option: {
        grid: { left: 56, right: 20, top: 24, bottom: 34 },
        xAxis: { type: 'category', data: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'] },
        yAxis: { type: 'value' },
        color: [VIO],
        tooltip: { trigger: 'axis' },
        series: [{ type: 'line', smooth: true, data: [320, 780, 1650, 3400, 6900, 12400],
          lineStyle: { width: 3.5, color: VIO },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(139,123,255,0.35)' }, { offset: 1, color: 'rgba(139,123,255,0)' }] } },
          symbol: 'circle', symbolSize: 8, itemStyle: { color: VIO } }],
      }, fx: { enter: 'fade-up' } }),
      pg(5),
    ],
  })

  const tiers = [
    ['پایه', 'رایگان', ['تا ۱٬۰۰۰ رویداد در ماه', 'یک داشبورد', 'پشتیبانی انجمن'], 'rgba(139,123,255,0.25)'],
    ['حرفه‌ای', '۲٫۹ میلیون تومان', ['رویداد نامحدود', 'هشدار هوشمند', 'پشتیبانی ۲۴/۷'], HOT],
    ['سازمانی', 'توافقی', ['استقرار اختصاصی', 'مدل سفارشی', 'مدیر موفقیت'], 'rgba(139,123,255,0.25)'],
  ]
  const s6 = slide({
    id: 'sh-pricing', background: VOID, transition: 'fade',
    notes: 'سه پلن، کارت میانی برجسته با حاشیهٔ داغ. قیمت‌ها با ارقام فارسی — template users خط قیمت را عوض می‌کنند.',
    elements: [
      kick('۰۴ · مدل درآمد'),
      ...tiers.flatMap(([name, price, items, edge], i) => {
        const cx = 96 + (2 - i) * 376
        return [
        shape('rect', { x: cx, y: 170, w: 336, h: 420, radius: 18, fill: PANEL, stroke: edge, strokeWidth: i === 1 ? 2 : 1, shadow: i === 1 ? glow('rgba(255,79,163,0.3)', 50) : undefined, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx + 24, y: 200, w: 288, h: 40, html: name, fontSize: 24, fontWeight: 800, color: i === 1 ? HOT : LILAC }),
        ftext({ x: cx + 24, y: 252, w: 288, h: 60, html: price, fontSize: 34, fontWeight: 800, color: LILAC }),
        ...items.map((it, j) => ftext({ x: cx + 24, y: 330 + j * 52, w: 288, h: 40, html: it, fontSize: 16, color: DIM })),
        shape('rect', { x: cx + 24, y: 524, w: 288, h: 1, fill: 'rgba(196,186,232,0.18)' }),
        ftext({ x: cx + 24, y: 538, w: 288, h: 30, html: ['برای همیشه رایگان', '۱۴ روز بازگشت بی‌قیدوشرط', 'قرارداد سالانه'][i], fontSize: 13, color: 'rgba(196,186,232,0.5)' }),
        ]
      }),
      pg(6),
    ],
  })

  const road = [
    ['پاییز ۱۴۰۵', 'نسخهٔ عمومی ۱٫۰'],
    ['زمستان ۱۴۰۵', 'یکپارچه‌سازی با درگاه‌های پرداخت'],
    ['بهار ۱۴۰۶', 'پیش‌بینی خودکار چرخهٔ عمر'],
    ['تابستان ۱۴۰۶', 'نسخهٔ صادراتی — بازار منطقه'],
  ]
  const s7 = slide({
    id: 'sh-roadmap', background: VOID, transition: 'morph',
    notes: 'ستون فقرات نقشهٔ راه از نوار پایین ماکاپ محصول می‌آید (id مشترک «sh-spine») و در اسلاید پایانی به خط امضا تبدیل می‌شود. گره‌ها راست به چپ.',
    elements: [
      kick('۰۵ · نقشهٔ راه'),
      shape('rect', { id: 'sh-spine', x: 96, y: 390, w: 1088, h: 3, fill: VIO, fillGradient: grad(90, [0, HOT], [1, VIO]), shadow: glow('rgba(139,123,255,0.5)', 24) }),
      ...road.flatMap(([when, what], i) => {
        const x = 1120 - i * 320
        const up = i % 2 === 0
        return [
          shape('ellipse', { x: x - 7, y: 383, w: 16, h: 16, fill: VOID, stroke: i === 0 ? HOT : VIO, strokeWidth: 2.5, fx: { enter: 'fade-up', order: i } }),
          ftext({ x: x - 150, y: up ? 300 : 430, w: 300, h: 36, html: when, fontSize: 21, fontWeight: 800, color: LILAC, align: 'center', fx: { enter: 'fade-up', order: i } }),
          ftext({ x: x - 150, y: up ? 342 : 472, w: 300, h: 44, html: what, fontSize: 15, color: DIM, align: 'center', lineHeight: 1.5, fx: { enter: 'fade-up', order: i } }),
        ]
      }),
      pg(7),
    ],
  })

  const team = [
    ['ن', 'نگار رستمی', 'بنیان‌گذار و مدیرعامل'],
    ['ک', 'کیان مرادی', 'هم‌بنیان‌گذار و مدیر فنی'],
    ['س', 'سحر احمدی', 'مدیر رشد'],
    ['م', 'مهدی طاهری', 'معمار ارشد داده'],
  ]
  const s8 = slide({
    id: 'sh-team', background: VOID, transition: 'fade',
    notes: 'تیم بدون عکس: حرف اول نام در دایرهٔ گرادیان — قالب را بدون نیاز به پرتره تحویل می‌دهد.',
    elements: [
      kick('۰۶ · تیم'),
      ...team.flatMap(([ltr, name, role], i) => {
        const cx = 96 + (3 - i) * 278
        return [
        shape('ellipse', { x: cx + 67, y: 210, w: 120, h: 120, fill: VIO, fillGradient: i % 2 ? GRAD_HOT : GRAD_VIO, shadow: glow(i % 2 ? 'rgba(255,79,163,0.4)' : 'rgba(109,91,255,0.4)', 40), fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx + 67, y: 244, w: 120, h: 56, html: ltr, fontSize: 40, fontWeight: 800, color: '#FFF', align: 'center' }),
        ftext({ x: cx, y: 360, w: 254, h: 36, html: name, fontSize: 21, fontWeight: 700, color: LILAC, align: 'center', fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx, y: 400, w: 254, h: 40, html: role, fontSize: 14, color: DIM, align: 'center', fx: { enter: 'fade-up', order: i } }),
        ]
      }),
      ftext({ x: 96, y: 540, w: 1088, h: 34, html: 'ده سال تجربهٔ داده، یک تیم، یک هدف: تصمیم‌های سریع‌تر.', fontSize: 19, color: DIM, align: 'center' }),
      pg(8),
    ],
  })

  const s9 = slide({
    id: 'sh-ask', background: VOID, transition: 'zoom',
    notes: 'اسلاید درخواست — بزرگ‌ترین عدد دک. تخصیص سرمایه در سه قلم زیرش.',
    elements: [
      shape('ellipse', { x: -60, y: 400, w: 360, h: 360, opacity: 0.4, fill: HOT, fillGradient: GRAD_HOT, shadow: glow('rgba(255,79,163,0.4)', 90) }),
      ftext({ x: 96, y: 150, w: 1088, h: 60, html: '۰۷ · درخواست', fontSize: 16, fontWeight: 700, color: HOT, align: 'center' }),
      ftext({ x: 96, y: 230, w: 1088, h: 140, html: 'جذب سرمایه: ۲ میلیون دلار', fontSize: 76, fontWeight: 800, color: LILAC, align: 'center' }),
      ...[['۶۰٪', 'توسعهٔ محصول و مهندسی'], ['۲۵٪', 'رشد و ورود به بازار'], ['۱۵٪', 'زیرساخت و امنیت']].flatMap(([p, d], i) => [
        ftext({ x: 96 + (2 - i) * 376, y: 440, w: 336, h: 60, html: p, fontSize: 40, fontWeight: 800, color: VIO, align: 'center', fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 96 + (2 - i) * 376, y: 508, w: 336, h: 40, html: d, fontSize: 16, color: DIM, align: 'center', fx: { enter: 'fade-up', order: i } }),
      ]),
      pg(9),
    ],
  })

  const s10 = slide({
    id: 'sh-close', background: VOID, transition: 'morph',
    notes: 'بستن: توده‌ها به مرکز برمی‌گردند و ستون فقرات نقشهٔ راه به خط امضا زیر تیتر تبدیل می‌شود.',
    elements: [
      shape('ellipse', { id: 'sh-a', x: 120, y: 60, w: 300, h: 300, opacity: 0.5, fill: VIO, fillGradient: GRAD_VIO, shadow: glow('rgba(109,91,255,0.45)', 100), fx: { loop: { type: 'motion-path', path: drift(26, 20, 1, 2), duration: 24 } } }),
      shape('ellipse', { id: 'sh-b', x: 860, y: 360, w: 300, h: 300, opacity: 0.45, fill: HOT, fillGradient: GRAD_HOT, shadow: glow('rgba(255,79,163,0.4)', 90), fx: { loop: { type: 'motion-path', path: drift(22, 18, 2, 1, 1), duration: 21 } } }),
      ftext({ id: 'sh-title', x: 96, y: 230, w: 1088, h: 225, html: 'بیایید رشد را<br>دقیق ببینیم.', fontSize: 84, fontWeight: 800, color: LILAC, align: 'center', lineHeight: 1.25 }),
      shape('rect', { id: 'sh-spine', x: 490, y: 470, w: 300, h: 4, radius: 2, fill: HOT, fillGradient: GRAD_HOT, shadow: glow('rgba(255,79,163,0.5)', 20) }),
      ftext({ x: 296, y: 520, w: 688, h: 34, html: 'shetab.example — استارتاپی فرضی برای یک قالب واقعی', fontSize: 16, color: DIM, align: 'center' }),
      pg(10),
    ],
  })

  return doc({
    title: 'شتاب — قالب پیچ استارتاپ', withFonts: ['Vazirmatn'],
    theme: { background: VOID, color: LILAC, accent: HOT, fontFamily: VZ },
    present: { progress: true },
    slides: [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK G · «آتلیه» — درس و کارگاه (education/workshop, Farsi/RTL)
// Warm cream paper with a deep-green chalkboard interlude. The signature
// morph: the rule-of-thirds GRID itself (four line ids + the subject dot)
// slides from the chalkboard to a paper exercise and re-lights itself.
// ═══════════════════════════════════════════════════════════════════════
function deckAtelier() {
  const CREAM = '#F7F3E8', BOARD = '#20402F', INKT = '#26251C'
  const TERRA = '#C96F4A', BLUE = '#4A7BA6', CHALKY = '#E8B84B'
  const SOFT = 'rgba(38,37,28,0.6)', CHALK = 'rgba(240,238,228,0.85)'
  const kick = (s, color = TERRA) => ftext({ x: 384, y: 84, w: 800, h: 26, html: s, fontSize: 15, fontWeight: 700, color })
  const pg = (n, dark) => text({ x: 96, y: 654, w: 80, h: 24, html: fa(n), fontSize: 13, fontWeight: 600, color: dark ? 'rgba(240,238,228,0.55)' : SOFT, align: 'left', fontFamily: VZ })
  // the rule-of-thirds grid — four line ids that travel between boards
  const grid = (chalk, x1 = 426, x2 = 853, y1 = 269, y2 = 451) => [
    shape('rect', { id: 'at-v1', x: x1, y: 100, w: 1.5, h: 520, fill: chalk, opacity: 0.55 }),
    shape('rect', { id: 'at-v2', x: x2, y: 100, w: 1.5, h: 520, fill: chalk, opacity: 0.55 }),
    shape('rect', { id: 'at-h1', x: 90, y: y1, w: 1100, h: 1.5, fill: chalk, opacity: 0.55 }),
    shape('rect', { id: 'at-h2', x: 90, y: y2, w: 1100, h: 1.5, fill: chalk, opacity: 0.55 }),
  ]
  const goals = [
    ['چشم‌تان را قاب بدهد', 'قبل از دوربین، ترکیب‌بندی را ببینید.', TERRA],
    ['شبکه را بفهمید', 'یک‌سوم، تعادل و نقطهٔ طلایی.', BLUE],
    ['شکستن را یاد بگیرید', 'قاعده را که بلد شدید، عمداً بشکنید.', CHALKY],
  ]

  const s1 = slide({
    id: 'at-cover', background: CREAM, transition: 'none',
    notes: 'قالب — «آتلیه»، قالب درس و کارگاه. کاغذ گرم با نوارهای چسب کاج (چرخیده ±۳ درجه) — نوستالژی دفتر مشق. نوارها و نقطهٔ تراکوتا در اسلاید اهداف به نشان‌های شماره‌دار morph می‌شوند.',
    elements: [
      shape('rect', { id: 'at-o1', x: 140, y: 58, w: 130, h: 30, rotation: -4, fill: 'rgba(232,184,75,0.85)' }),
      shape('rect', { id: 'at-o2', x: 990, y: 66, w: 130, h: 30, rotation: 3, fill: 'rgba(74,123,166,0.75)' }),
      kick('کارگاه آتلیه · جلسهٔ سوم'),
      ftext({ id: 'at-title', x: 96, y: 190, w: 1088, h: 260, html: 'ترکیب‌بندی را<br>دیدنی کنید.', fontSize: 92, fontWeight: 800, color: INKT, lineHeight: 1.25 }),
      ftext({ x: 486, y: 470, w: 698, h: 36, html: 'با مهسا کریمی — طراح ارشد و عکاس', fontSize: 21, color: SOFT, fx: { enter: 'fade-up', order: 1 } }),
      shape('rect', { id: 'at-o3', x: 96, y: 480, w: 26, h: 26, fill: TERRA }),
      ftext({ x: 140, y: 482, w: 320, h: 26, html: 'پنجشنبه‌ها، ۱۶ تا ۱۸', fontSize: 16, fontWeight: 600, color: SOFT, align: 'left' }),
      pg(1),
    ],
  })

  const s2 = slide({
    id: 'at-goals', background: CREAM, transition: 'morph',
    notes: 'بیت morph اول: نوارهای چسب و نقطهٔ تراکوتا به دایره‌های شماره‌دار اهداف تبدیل می‌شوند — چرخش‌ها صفر می‌شوند و رنگ‌ها می‌مانند.',
    elements: [
      ftext({ id: 'at-title', x: 684, y: 72, w: 500, h: 64, html: 'ترکیب‌بندی را دیدنی کنید.', fontSize: 32, fontWeight: 800, color: 'rgba(38,37,28,0.45)' }),
      ...goals.flatMap(([t, d, c], i) => [
        shape('ellipse', { id: `at-o${i + 1}`, x: 1098, y: 226 + i * 130, w: 64, h: 64, fill: c, shadow: { y: 4, blur: 16, color: 'rgba(38,37,28,0.18)' } }),
        ftext({ x: 1098, y: 240 + i * 130, w: 64, h: 40, html: fa(i + 1), fontSize: 26, fontWeight: 800, color: '#FFF', align: 'center' }),
        ftext({ x: 340, y: 220 + i * 130, w: 720, h: 44, html: t, fontSize: 30, fontWeight: 800, color: INKT }),
        ftext({ x: 340, y: 270 + i * 130, w: 720, h: 32, html: d, fontSize: 18, color: SOFT }),
      ]),
      pg(2),
    ],
  })

  const s3 = slide({
    id: 'at-board', background: BOARD, transition: 'fade',
    notes: 'تخته‌سیاه: شبکهٔ یک‌سوم با گچ (خطوط سفید نیمه‌شفاف) و سوژهٔ دایره‌ای روی تقاطع راست-بالا — «نقطهٔ طلایی». همین چهار خط در اسلاید بعد به کاغذ می‌آیند.',
    elements: [
      kick('قانون یک‌سوم', CHALKY),
      ...grid(CHALK),
      shape('ellipse', { id: 'at-dot', x: 793, y: 209, w: 120, h: 120, fill: 'rgba(201,111,74,0.9)', stroke: CHALK, strokeWidth: 2 }),
      ftext({ x: 563, y: 606, w: 580, h: 56, html: 'سوژه روی تقاطع — نقطهٔ طلایی', fontSize: 17, color: CHALK, align: 'center' }),
      pg(3, true),
    ],
  })

  const s4 = slide({
    id: 'at-exercise', background: CREAM, transition: 'morph',
    notes: 'بیت morph دوم — امضای این قالب: شبکه گچی از تخته به کاغذ می‌آید (همان چهار id؛ رنگ سفید گچی → جوهر کم‌رنگ) و سوژه به تقاطع چپ-پایین می‌رود تا «تعادل با فضای منفی» را نشان دهد.',
    elements: [
      kick('همان شبکه، این بار روی کاغذ'),
      ...grid('rgba(38,37,28,0.5)'),
      shape('ellipse', { id: 'at-dot', x: 386, y: 411, w: 80, h: 80, fill: BLUE, shadow: { y: 4, blur: 18, color: 'rgba(38,37,28,0.2)' } }),
      ftext({ x: 90, y: 560, w: 700, h: 32, html: 'سوژه کوچک، پایین-چپ؛ تنفس قاب از فضای خالی می‌آید.', fontSize: 17, color: SOFT, align: 'left' }),
      ftext({ x: 660, y: 130, w: 524, h: 44, html: 'یک‌سوم بالا برای آسمان، یک‌سوم پایین برای سوژه.', fontSize: 20, fontWeight: 700, color: INKT, fx: { enter: 'fade-up', order: 2 } }),
      pg(4),
    ],
  })

  const steps = [
    ['قاب را ببندید', 'کل صحنه را ببینید، بعد مرزها را مشخص کنید.'],
    ['شبکه را بیاورید', 'چهار خط ذهنی — گوشه‌ها را رها نکنید.'],
    ['سوژه را جابه‌جا کنید', 'تقاطع‌ها را امتحان کنید؛ وسط، آخرین گزینه است.'],
    ['سه قاب بگیرید', 'مرکزی، یک‌سوم، شکسته — بعد قضاوت کنید.'],
  ]
  const s5 = slide({
    id: 'at-steps', background: CREAM, transition: 'fade',
    notes: 'چهار گام — ردیف‌های شماره‌دار با ورود پلکانی (بیت fade). شماره‌ها با ارقام فارسی داخل مربع‌های تراکوتا.',
    elements: [
      kick('چهار گام تا قاب بهتر'),
      ...steps.flatMap(([t, d], i) => [
        shape('rect', { x: 1128, y: 170 + i * 118, w: 56, h: 56, radius: 12, fill: i % 2 ? BLUE : TERRA, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 1128, y: 182 + i * 118, w: 56, h: 36, html: fa(i + 1), fontSize: 24, fontWeight: 800, color: '#FFF', align: 'center', fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 300, y: 166 + i * 118, w: 800, h: 40, html: t, fontSize: 26, fontWeight: 800, color: INKT, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 300, y: 212 + i * 118, w: 800, h: 32, html: d, fontSize: 17, color: SOFT, fx: { enter: 'fade-up', order: i } }),
      ]),
      pg(5),
    ],
  })

  const s6 = slide({
    id: 'at-drill', background: CHALKY, transition: 'zoom',
    notes: 'اسلاید تمرین — زمزهٔ رنگی کامل، تایپ درشت. زمان تمرین داخل چیپ جوهری.',
    elements: [
      ftext({ x: 96, y: 170, w: 1088, h: 60, html: 'تمرین جلسه', fontSize: 24, fontWeight: 700, color: 'rgba(38,37,28,0.65)', align: 'center' }),
      ftext({ x: 96, y: 240, w: 1088, h: 130, html: 'یک سوژه، سه قاب.', fontSize: 96, fontWeight: 800, color: INKT, align: 'center' }),
      ftext({ x: 240, y: 420, w: 800, h: 44, html: 'قاب مرکزی، قاب یک‌سوم، قاب شکسته — هر سه را کنار هم بگذارید.', fontSize: 22, color: 'rgba(38,37,28,0.75)', align: 'center' }),
      shape('rect', { x: 566, y: 510, w: 148, h: 48, radius: 24, fill: INKT }),
      ftext({ x: 566, y: 522, w: 148, h: 30, html: '۱۰ دقیقه', fontSize: 18, fontWeight: 700, color: CHALKY, align: 'center' }),
      pg(6),
    ],
  })

  const wrongs = [
    ['همیشه وسط', 'وسطِ بی‌دلیل، قاب را بی‌جان می‌کند.'],
    ['شلوغیِ لبه‌ها', 'چیزی که نصفه در قاب است، نجات نمی‌دهد.'],
    ['افقِ کجِ تصادفی', 'کج بودن باید معنا داشته باشد، نه خستگی.'],
  ]
  const s7 = slide({
    id: 'at-mistakes', background: CREAM, transition: 'fade',
    notes: 'سه اشتباه رایج در کارت‌های کاغذی با ضربدر تراکوتا. قالب کارت‌ها را با محتوای درس خودتان عوض کنید.',
    elements: [
      kick('اشتباه‌های رایج'),
      ...wrongs.flatMap(([t, d], i) => {
        const cx = 96 + (2 - i) * 376
        return [
        shape('rect', { x: cx, y: 190, w: 336, h: 340, radius: 16, fill: '#FFFDF7', stroke: 'rgba(38,37,28,0.12)', strokeWidth: 1, shadow: { y: 10, blur: 28, color: 'rgba(38,37,28,0.1)' }, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx + 288, y: 216, w: 24, h: 50, html: '✕', fontSize: 34, fontWeight: 800, color: TERRA, align: 'center', fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx + 24, y: 290, w: 288, h: 44, html: t, fontSize: 26, fontWeight: 800, color: INKT, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx + 24, y: 344, w: 288, h: 80, html: d, fontSize: 16, color: SOFT, lineHeight: 1.65, fx: { enter: 'fade-up', order: i } }),
        shape('rect', { x: cx + 24, y: 468, w: 288, h: 1.5, fill: 'rgba(38,37,28,0.14)' }),
        ftext({ x: cx + 24, y: 482, w: 288, h: 28, html: 'پادزهر: ' + ['سوژه را از مرکز خارج کن', 'نیمهٔ ناقص را کامل حذف کن', 'افق را صاف کن، بعد بشکن'][i], fontSize: 13.5, fontWeight: 600, color: TERRA, fx: { enter: 'fade-up', order: i } }),
        ]
      }),
      pg(7),
    ],
  })

  const s8 = slide({
    id: 'at-recap', background: CREAM, transition: 'morph',
    notes: 'بیت morph سوم: نشان‌های اهداف به ردیف تیکِ جمع‌بندی می‌روند — حلقهٔ روایت بسته می‌شود.',
    elements: [
      ftext({ x: 96, y: 140, w: 1088, h: 80, html: 'چه آموختیم.', fontSize: 54, fontWeight: 800, color: INKT }),
      ...goals.flatMap(([t], i) => [
        shape('ellipse', { id: `at-o${i + 1}`, x: 1020 - i * 320, y: 300, w: 48, h: 48, fill: goals[i][2] }),
        ftext({ x: 1020 - i * 320, y: 308, w: 48, h: 32, html: '✓', fontSize: 22, fontWeight: 800, color: '#FFF', align: 'center' }),
        ftext({ x: 700 - i * 320, y: 306, w: 300, h: 40, html: t, fontSize: 21, fontWeight: 700, color: INKT }),
      ]),
      ftext({ x: 240, y: 470, w: 944, h: 36, html: 'قاعده را بلد باشید تا بشکنیدش — جلسهٔ بعد: نور.', fontSize: 19, color: SOFT, align: 'center' }),
      pg(8),
    ],
  })

  const s9 = slide({
    id: 'at-homework', background: BOARD, transition: 'fade',
    notes: 'تکلیف روی تخته — قالب درس با منبع و ضرب‌الاجل.',
    elements: [
      kick('تکلیف این هفته', CHALKY),
      ftext({ x: 96, y: 170, w: 1088, h: 90, html: 'پنج قاب با شبکهٔ یک‌سوم', fontSize: 54, fontWeight: 800, color: CHALK }),
      ftext({ x: 336, y: 300, w: 848, h: 40, html: 'از یک سوژهٔ ثابت — فقط جای سوژه و افق را عوض کنید.', fontSize: 20, color: 'rgba(240,238,228,0.75)' }),
      shape('rect', { x: 1074, y: 400, w: 110, h: 2, fill: CHALKY }),
      ftext({ x: 336, y: 430, w: 848, h: 36, html: 'تحویل: تا پنجشنبه، ساعت ۱۶ — گروه کارگاه', fontSize: 17, color: 'rgba(240,238,228,0.65)' }),
      ftext({ x: 336, y: 540, w: 848, h: 32, html: 'برای مطالعه: فصل ۳ کتاب «زبان بصری» — نسخهٔ کتابخانهٔ کارگاه', fontSize: 15, color: 'rgba(240,238,228,0.5)' }),
      pg(9, true),
    ],
  })

  return doc({
    title: 'آتلیه — قالب درس و کارگاه', withFonts: ['Vazirmatn'],
    theme: { background: CREAM, color: INKT, accent: TERRA, fontFamily: VZ },
    slides: [s1, s2, s3, s4, s5, s6, s7, s8, s9],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK H · «نمایش» — نمونه‌کار استودیو (design-studio portfolio, Farsi/RTL)
// Charcoal + bone + persimmon. Photography: the gallery's public-domain set
// (Met CC0 vases, LOC pressroom, LOC state fair) re-cast as a fictional
// studio's selected works — three sections, each divider's colour block
// MORPHS down to a small square on its own gallery slide.
// ═══════════════════════════════════════════════════════════════════════
function deckNamayesh() {
  const CHAR = '#191817', BONE = '#EFECE4', PERS = '#D96C3F'
  const CLAY = '#B4744C', GRAPH = '#3A3733'
  const SOFT = 'rgba(239,236,228,0.6)', INKS = 'rgba(25,24,23,0.62)'
  const GRAD_CLAY = grad(0, [0, '#C58158'], [1, '#A5623C'])
  const GRAD_GRAPH = grad(0, [0, '#4A463F'], [1, '#2C2A26'])
  const GRAD_PERS = grad(0, [0, '#E67E4E'], [1, '#C75B31'])
  const kick = (s, color = PERS) => ftext({ x: 384, y: 84, w: 800, h: 26, html: s, fontSize: 15, fontWeight: 700, color })
  const pg = (n, dark) => text({ x: 96, y: 654, w: 80, h: 24, html: fa(n), fontSize: 13, fontWeight: 600, color: dark ? SOFT : INKS, align: 'left', fontFamily: VZ })
  // divider recipe: ghost numeral left, big section title right, colour block
  const divider = (sid, bg, num, title, desc, block, g, trans, page) => slide({
    id: sid, background: bg, transition: trans,
    elements: [
      ftext({ x: 60, y: 170, w: 400, h: 340, html: num, fontSize: 250, fontWeight: 800, color: 'rgba(239,236,228,0.08)', align: 'left', lineHeight: 1 }),
      kick(`${num} · ${title} — نمونه‌کارهای منتخب`),
      ftext({ x: 556, y: 250, w: 628, h: 130, html: title, fontSize: 96, fontWeight: 800, color: BONE }),
      ftext({ x: 556, y: 400, w: 628, h: 60, html: desc, fontSize: 20, color: SOFT, lineHeight: 1.6 }),
      shape('rect', { id: block, x: 116, y: 250, w: 340, h: 400, radius: 20, fill: g[0], fillGradient: g[1], shadow: { y: 20, blur: 60, color: 'rgba(0,0,0,0.45)' } }),
      pg(page, true),
    ],
  })

  const s1 = slide({
    id: 'nm-cover', background: CHAR, transition: 'none',
    notes: 'قالب — «نمایش»، نمونه‌کار استودیو طراحی. تیر کامل با سه فصل: اشیاء، چاپ، فضا. بلوک رنگی هر فصل در گالری همان فصل به مربع کوچک caption morph می‌شود. عکس‌ها پابلیک‌دومین‌اند (مت موزیم CC0 و کتابخانهٔ کنگره) — با آثار خودتان عوضشان کنید.',
    elements: [
      ftext({ id: 'nm-title', x: 96, y: 150, w: 1088, h: 260, html: 'نمایش', fontSize: 200, fontWeight: 800, color: BONE, lineHeight: 1 }),
      shape('rect', { x: 1024, y: 420, w: 160, h: 12, fill: PERS, fillGradient: GRAD_PERS }),
      ftext({ x: 436, y: 460, w: 748, h: 44, html: 'استودیو طراحی — اشیاء، چاپ، فضا', fontSize: 26, fontWeight: 600, color: SOFT }),
      ftext({ x: 436, y: 620, w: 748, h: 26, html: 'نمونه‌کارهای منتخب ۱۴۰۴ · تهران', fontSize: 14, color: 'rgba(239,236,228,0.45)' }),
      pg(1, true),
    ],
  })

  const cats = [
    ['اشیاء', 'دوازده شیء، یک مجموعه', CLAY, GRAD_CLAY, 'nm-a'],
    ['چاپ', 'پوستر و کتاب', GRAPH, GRAD_GRAPH, 'nm-b'],
    ['فضا', 'نمایشگاه و دکور', PERS, GRAD_PERS, 'nm-c'],
  ]
  const s2 = slide({
    id: 'nm-index', background: BONE, transition: 'morph',
    notes: 'بیت morph اول: عنوان کاور به گوشه می‌نشیند. سه ردیف فصل با نشان رنگی — همین نشان‌ها در اسلایدهای بعد بلوک‌های بزرگ می‌شوند.',
    elements: [
      ftext({ id: 'nm-title', x: 784, y: 72, w: 400, h: 64, html: 'نمایش', fontSize: 40, fontWeight: 800, color: INKS }),
      ...cats.flatMap(([t, d, c, g, bid], i) => [
        shape('rect', { id: bid, x: 1108, y: 200 + i * 140, w: 76, h: 76, radius: 16, fill: c, fillGradient: g, shadow: { y: 6, blur: 18, color: 'rgba(25,24,23,0.2)' } }),
        ftext({ x: 300, y: 198 + i * 140, w: 760, h: 48, html: t, fontSize: 34, fontWeight: 800, color: '#191817' }),
        ftext({ x: 300, y: 254 + i * 140, w: 760, h: 32, html: d, fontSize: 18, color: INKS }),
        shape('rect', { x: 96, y: 292 + i * 140, w: 1088, h: 1, fill: 'rgba(25,24,23,0.14)' }),
      ]),
      pg(2),
    ],
  })

  const s3 = divider('nm-div1', CHAR, '۰۱', 'اشیاء', 'مجموعهٔ سفال نما — دوازده شیء دست‌ساز، چرخ و کورهٔ واحد.', 'nm-a', [CLAY, GRAD_CLAY], 'morph', 3)
  s3.notes = 'بیت morph دوم: نشان ردیف «اشیاء» به بلوک بزرگ فصل تبدیل می‌شود. عنوان‌گذاری فصل‌ها با عدد شبحِ بزرگ سمت چپ.'

  const s4 = slide({
    id: 'nm-obj', background: BONE, transition: 'morph',
    notes: 'بیت morph سوم: بلوک بزرگ به مربع کوچک کنار عنوان فصل برمی‌گردد. گرید سه‌تایی عکس با کپشن و اعتبار منبع.',
    elements: [
      shape('rect', { id: 'nm-a', x: 1128, y: 84, w: 56, h: 56, radius: 12, fill: CLAY, fillGradient: GRAD_CLAY }),
      ftext({ x: 384, y: 92, w: 700, h: 44, html: 'اشیاء — مجموعهٔ سفال نما', fontSize: 28, fontWeight: 800, color: '#191817' }),
      ...[['ph-obj1', 'کوزهٔ نوک‌دار', 816], ['ph-obj2', 'ظرف نقاب بز', 456], ['ph-obj3', 'گلدان ۱۸۷۹', 96]].flatMap(([ph, cap, x], i) => [
        img({ asset: ph, x, y: 190, w: 368, h: 360, radius: 12, fx: { enter: 'fade-up', order: i } }),
        ftext({ x, y: 566, w: 368, h: 30, html: cap, fontSize: 17, fontWeight: 700, color: '#191817', align: 'center', fx: { enter: 'fade-up', order: i } }),
      ]),
      ftext({ x: 96, y: 636, w: 1088, h: 24, html: 'عکس‌ها: مت موزیم، open access — CC0', fontSize: 11, color: INKS, align: 'center' }),
      pg(4),
    ],
  })

  const s5 = divider('nm-div2', CHAR, '۰۲', 'چاپ', 'پوسترهای حروفی و کتاب سالانه — جوهر، کاغذ، شبکه.', 'nm-b', [GRAPH, GRAD_GRAPH], 'morph', 5)
  s5.notes = 'بیت morph چهارم: نشان «چاپ» به بلوک فصل. زیر بلوک، عکس چاپخانهٔ ۱۹۴۲ با اسکریم — فصل چاپ روی خودِ چاپ سوار است.'

  const s6 = slide({
    id: 'nm-print', background: BONE, transition: 'morph',
    notes: 'بیت morph پنجم: بلوک به مربع caption. یک عکس بزرگ + یک عمودی — دو قاب با دو نسبت، شبکه را زنده نگه می‌دارد.',
    elements: [
      shape('rect', { id: 'nm-b', x: 1128, y: 84, w: 56, h: 56, radius: 12, fill: GRAPH, fillGradient: GRAD_GRAPH }),
      ftext({ x: 384, y: 92, w: 700, h: 44, html: 'چاپ — سالانهٔ نشر هفت', fontSize: 28, fontWeight: 800, color: '#191817' }),
      img({ asset: 'ph-print1', x: 96, y: 190, w: 700, h: 400, radius: 12, fx: { enter: 'fade-up' } }),
      img({ asset: 'ph-print2', x: 828, y: 190, w: 356, h: 400, radius: 12, fx: { enter: 'fade-up', order: 1 } }),
      ftext({ x: 96, y: 606, w: 700, h: 30, html: 'چاپ حروفِ سربی، همان‌قدر امروزی.', fontSize: 17, fontWeight: 700, color: '#191817' }),
      ftext({ x: 828, y: 606, w: 356, h: 30, html: 'چاپخانهٔ نیویورک‌تایمز، ۱۹۴۲', fontSize: 14, color: INKS }),
      ftext({ x: 96, y: 640, w: 1088, h: 22, html: 'عکس‌ها: کتابخانهٔ کنگره — پابلیک دومین', fontSize: 11, color: INKS, align: 'center' }),
      pg(6),
    ],
  })

  const s7 = divider('nm-div3', CHAR, '۰۳', 'فضا', 'غرفه، نمایشگاه و دکور — از طرح تا اجرا.', 'nm-c', [PERS, GRAD_PERS], 'morph', 7)
  s7.notes = 'بیت morph ششم: نشان «فضا» به بلوک فصل. تصویر چرخ‌وفلک جشنوارهٔ ۱۹۴۱ — مقیاس، موضوع این فصل است.'

  const s8 = slide({
    id: 'nm-space', background: BONE, transition: 'morph',
    notes: 'بیت morph هفتم: بلوک به مربع caption. عکس تمام‌عرض با کپشن روایت‌گونه — عریض‌ترین قاب دک.',
    elements: [
      shape('rect', { id: 'nm-c', x: 1128, y: 84, w: 56, h: 56, radius: 12, fill: PERS, fillGradient: GRAD_PERS }),
      ftext({ x: 384, y: 92, w: 700, h: 44, html: 'فضا — غرفهٔ جشنواره', fontSize: 28, fontWeight: 800, color: '#191817' }),
      img({ asset: 'ph-spc1', x: 96, y: 180, w: 1088, h: 400, radius: 12, fx: { enter: 'fade-up' } }),
      ftext({ x: 96, y: 596, w: 1088, h: 30, html: 'مقیاس بزرگ، جزئیات کوچک — غرفه‌ای که از دور و نزدیک دو حرف متفاوت می‌زند.', fontSize: 17, fontWeight: 700, color: '#191817' }),
      ftext({ x: 96, y: 640, w: 1088, h: 22, html: 'عکس: جک دِلانو، جشنوارهٔ ایالتی ورمانت ۱۹۴۱ — کتابخانهٔ کنگره، پابلیک دومین', fontSize: 11, color: INKS, align: 'center' }),
      pg(8),
    ],
  })

  const servs = [
    ['هویت بصری', 'لوگو، رنگ، حروف — سیستمی که تکرارپذیر است.'],
    ['طراحی آثار', 'از سفال تا چاپ — اشیایی که برند را لمس‌پذیر می‌کنند.'],
    ['اجرای فضا', 'غرفه و نمایشگاه — همان هویت، در مقیاس بدن.'],
  ]
  const s9 = slide({
    id: 'nm-services', background: CHAR, transition: 'fade',
    notes: 'خدمات در سه ستون؛ سه نقطهٔ رنگی پایین — همین نقاط در اسلاید تماس به ردیف امضا morph می‌شوند.',
    elements: [
      kick('کاری که می‌کنیم'),
      ...servs.flatMap(([t, d], i) => [
        ftext({ x: 96 + i * 376, y: 200, w: 336, h: 44, html: t, fontSize: 28, fontWeight: 800, color: BONE, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 96 + i * 376, y: 256, w: 336, h: 90, html: d, fontSize: 17, color: SOFT, lineHeight: 1.7, fx: { enter: 'fade-up', order: i } }),
        shape('rect', { x: 96 + i * 376, y: 176, w: 60, h: 3, fill: [CLAY, GRAPH, PERS][i] }),
      ]),
      ...['nm-a', 'nm-b', 'nm-c'].map((bid, i) => shape('ellipse', { id: bid, x: 620 + i * 20, y: 620, w: 12, h: 12, fill: [CLAY, GRAPH, PERS][i] })),
      shape('rect', { x: 96, y: 560, w: 1088, h: 1, fill: 'rgba(239,236,228,0.16)' }),
      ftext({ x: 486, y: 586, w: 698, h: 28, html: 'از ایده تا اجرا — یک تیم، از ۱۳۹۸ تا امروز', fontSize: 16, color: SOFT }),
      pg(9, true),
    ],
  })

  const s10 = slide({
    id: 'nm-contact', background: BONE, transition: 'morph',
    notes: 'بیت morph هشتم: سه نقطه به ردیف نشان‌های فصل زیر تیتر تماس می‌آیند — امضای پایانی. ایمیل و نشانی را عوض کنید.',
    elements: [
      ftext({ x: 96, y: 180, w: 1088, h: 140, html: 'با ما حرف بزنید.', fontSize: 96, fontWeight: 800, color: '#191817', align: 'center' }),
      ...['nm-a', 'nm-b', 'nm-c'].map((bid, i) => shape('rect', { id: bid, x: 596 + i * 34, y: 350, w: 22, h: 22, radius: 6, fill: [CLAY, GRAPH, PERS][i] })),
      ftext({ x: 296, y: 440, w: 688, h: 40, html: 'hello@namayesh.example · خیابان کریم‌خان، تهران', fontSize: 21, fontWeight: 600, color: INKS, align: 'center' }),
      ftext({ x: 296, y: 640, w: 688, h: 24, html: 'استودیو نمایش — برندی فرضی برای یک قالب واقعی', fontSize: 12, color: 'rgba(25,24,23,0.45)', align: 'center' }),
      pg(10),
    ],
  })

  return doc({
    title: 'نمایش — قالب نمونه‌کار', withFonts: ['Vazirmatn'],
    assets: {
      'ph-obj1': photo('terra-v1.jpg'), 'ph-obj2': photo('terra-v2.jpg'), 'ph-obj3': photo('terra-v3.jpg'),
      'ph-print1': photo('signal-press.jpg'), 'ph-print2': photo('signal-press2.jpg'),
      'ph-spc1': photo('picnic-fair.jpg'),
    },
    theme: { background: CHAR, color: BONE, accent: PERS, fontFamily: VZ },
    slides: [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK I · «جرقه» — لانچ محصول (product launch, Farsi/RTL)
// Near-black with neon lime. The DEVICE mockup (pure shapes, no image) is the
// morph cast: it grows at the reveal, docks left for features, and its UI rows
// rearrange inside the moving frame. One clickable state demos the stateOf
// pattern. All copy RTL.
// ═══════════════════════════════════════════════════════════════════════
function deckJaraghe() {
  const VOID = '#070A08', PANEL = '#0E1611', NEON = '#B8FF3C', CY = '#37F0C2'
  const DIM = 'rgba(178,210,190,0.62)', SCREEN = '#0B120D'
  const GRAD_NEON = grad(160, [0, 'rgba(184,255,60,0.2)'], [1, 'rgba(55,240,194,0.06)'])
  const glow = (c, blur = 50) => ({ blur, color: c })
  const kick = (s, color = NEON) => ftext({ x: 384, y: 84, w: 800, h: 26, html: s, fontSize: 15, fontWeight: 700, color })
  const pg = (n) => text({ x: 96, y: 654, w: 80, h: 24, html: fa(n), fontSize: 13, fontWeight: 600, color: 'rgba(178,210,190,0.4)', align: 'left', fontFamily: VZ })
  // the device: frame + screen + three UI rows (rows carry ids — they morph
  // inside the frame as the device travels)
  const device = (x, y, w, h) => [
    shape('rect', { id: 'jr-device', x, y, w, h, radius: 28, fill: PANEL, stroke: 'rgba(184,255,60,0.35)', strokeWidth: 1.5, shadow: glow('rgba(184,255,60,0.22)', 70) }),
    shape('rect', { id: 'jr-screen', x: x + 16, y: y + 34, w: w - 32, h: h - 68, radius: 16, fill: SCREEN, fillGradient: GRAD_NEON }),
    shape('rect', { x: x + w / 2 - 30, y: y + 12, w: 60, h: 8, radius: 4, fill: 'rgba(178,210,190,0.3)' }),
    shape('rect', { id: 'jr-ui1', x: x + 40, y: y + 70, w: w - 110, h: 14, radius: 7, fill: NEON, opacity: 0.85 }),
    shape('rect', { id: 'jr-ui2', x: x + 40, y: y + 110, w: (w - 110) * 0.6, h: 14, radius: 7, fill: CY, opacity: 0.7 }),
    shape('rect', { id: 'jr-ui3', x: x + 40, y: y + h - 90, w: w - 80, h: 54, radius: 12, fill: 'rgba(184,255,60,0.12)', stroke: 'rgba(184,255,60,0.4)', strokeWidth: 1 }),
  ]

  const s1 = slide({
    id: 'jr-cover', background: VOID, transition: 'none',
    notes: 'قالب — «جرقه»، لانچ محصول. قاب دستگاه کاملاً با شکل کشیده شده (بدون عکس) و «کستِ» morph است: در معرفی بزرگ می‌شود، برای ویژگی‌ها به چپ می‌رسد و ردیف‌های UI داخلش جابه‌جا می‌شوند. اسلاید state نمونهٔ stateOf است.',
    elements: [
      ...device(130, 150, 340, 470),
      kick('رویداد معرفی محصول'),
      ftext({ id: 'jr-title', x: 556, y: 180, w: 628, h: 150, html: 'جرقه', fontSize: 130, fontWeight: 800, color: '#F2FFE8', lineHeight: 1.1, shadow: glow('rgba(184,255,60,0.25)', 50) }),
      ftext({ x: 556, y: 350, w: 628, h: 40, html: 'یادداشت‌هایی که خودشان فکر می‌کنند.', fontSize: 24, color: DIM, fx: { enter: 'fade-up', order: 1 } }),
      ftext({ x: 556, y: 560, w: 628, h: 26, html: 'نسخهٔ دوم — امسال برای همهٔ پلتفرم‌ها', fontSize: 15, color: 'rgba(178,210,190,0.45)' }),
      pg(1),
    ],
  })

  const pains = [
    ['یادداشت می‌نویسید', 'و هیچ‌وقت دوباره‌اش نمی‌خوانید.'],
    ['جست‌وجو کنید', 'و در انبوه متن، خودِ پیام گم شود.'],
    ['برنامه بریزید', 'و یادداشت‌ها هیچ‌کدام را به یاد نیاورند.'],
  ]
  const s2 = slide({
    id: 'jr-problem', background: VOID, transition: 'fade',
    notes: 'سه درد، ساده و بی‌نمودار — لانچ با تایپ نفس می‌کشد.',
    elements: [
      shape('ellipse', { x: -60, y: 420, w: 360, h: 360, opacity: 0.5, fill: 'rgba(184,255,60,0.07)', shadow: glow('rgba(184,255,60,0.2)', 90) }),
      kick('مشکل'),
      ...pains.flatMap(([t, d], i) => [
        shape('ellipse', { x: 1148, y: 234 + i * 130, w: 12, h: 12, fill: NEON, shadow: glow('rgba(184,255,60,0.8)', 14), fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 556, y: 210 + i * 130, w: 560, h: 44, html: t, fontSize: 30, fontWeight: 800, color: '#F2FFE8', fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 556, y: 262 + i * 130, w: 560, h: 36, html: d, fontSize: 19, color: DIM, fx: { enter: 'fade-up', order: i } }),
      ]),
      pg(2),
    ],
  })

  const s3 = slide({
    id: 'jr-reveal', background: VOID, transition: 'morph',
    notes: 'بیت morph اول: دستگاه از گوشهٔ کاور به مرکز می‌آید و بزرگ می‌شود؛ عنوان «جرقه» به راست می‌نشیند.',
    elements: [
      ...device(460, 110, 360, 510),
      kick('معرفی'),
      ftext({ id: 'jr-title', x: 556, y: 190, w: 628, h: 130, html: 'جرقهٔ ۲', fontSize: 96, fontWeight: 800, color: '#F2FFE8', lineHeight: 1.15, shadow: glow('rgba(184,255,60,0.25)', 50) }),
      ftext({ x: 848, y: 330, w: 336, h: 150, html: 'همان سادگی، با مغزی تازه: خلاصه‌سازی، پیوند و پیشنهادِ روز.', fontSize: 20, color: DIM, lineHeight: 1.7, fx: { enter: 'fade-up', order: 1 } }),
      pg(3),
    ],
  })

  const feats = [
    ['خلاصهٔ هوشمند', 'هر یادداشت، سه خطِ قابل فهم.', null],
    ['هشدار پیش‌دست', 'قرارداد، قبل از موعد به یادتان می‌آید.', 'jr-state-alert'],
    ['پیوند دانش', 'یادداشت‌های مرتبط، خودشان هم‌نشین می‌شوند.', null],
  ]
  const s4 = slide({
    id: 'jr-features', background: VOID, transition: 'morph',
    notes: 'بیت morph دوم: دستگاه به لبهٔ چپ می‌رسد و ردیف‌های UI داخل قابِ درحال‌حرکت بازآرایی می‌شوند (سه id مشترک). ویژگیِ میانی کلیک‌پذیر است — به اسلاید state وصل است.',
    elements: [
      ...device(96, 200, 290, 400),
      kick('ویژگی‌ها'),
      ...feats.flatMap(([t, d, link], i) => [
        ftext({ x: 556, y: 170 + i * 140, w: 628, h: 44, html: t, fontSize: 28, fontWeight: 800, color: '#F2FFE8', ...(link ? { link } : {}), fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 556, y: 220 + i * 140, w: 628, h: 36, html: d, fontSize: 18, color: DIM, ...(link ? { link } : {}), fx: { enter: 'fade-up', order: i } }),
        shape('ellipse', { x: 1200, y: 184 + i * 140, w: 12, h: 12, fill: NEON, ...(link ? { link } : {}), shadow: glow('rgba(184,255,60,0.8)', 14) }),
        ...(link ? [ftext({ x: 556, y: 260 + i * 140, w: 628, h: 26, html: '← برای دیدن نمونه، کلیک کنید', fontSize: 13, color: NEON, link })] : []),
      ]),
      pg(4),
    ],
  })

  const st = slide({
    id: 'jr-state-alert', stateOf: 'jr-features', name: 'هشدار پیش‌دست', background: PANEL, transition: 'morph',
    notes: 'اسلاید state — فقط با کلیک روی «هشدار پیش‌دست» باز می‌شود؛ با فلش چپ به اسلاید ویژگی‌ها برمی‌گردید. قالبش را کپی کنید تا state های خودتان را بسازید.',
    elements: [
      kick('نمونهٔ زنده — هشدار پیش‌دست', CY),
      shape('rect', { id: 'jr-alert', x: 440, y: 200, w: 400, h: 260, radius: 18, fill: SCREEN, stroke: 'rgba(55,240,194,0.5)', strokeWidth: 1.5, shadow: glow('rgba(55,240,194,0.3)', 60) }),
      shape('ellipse', { x: 476, y: 232, w: 12, h: 12, fill: NEON, shadow: glow('rgba(184,255,60,0.9)', 14) }),
      ftext({ x: 500, y: 224, w: 310, h: 28, html: 'یادآور جرقه', fontSize: 15, fontWeight: 700, color: NEON }),
      ftext({ x: 476, y: 280, w: 328, h: 76, html: 'قرارداد «آذرخش» تا سه روز دیگر تمام می‌شود.', fontSize: 20, fontWeight: 700, color: '#F2FFE8', lineHeight: 1.6 }),
      shape('rect', { x: 476, y: 380, w: 130, h: 40, radius: 20, fill: NEON }),
      ftext({ x: 476, y: 390, w: 130, h: 26, html: 'تمدید کن', fontSize: 15, fontWeight: 700, color: '#0B120D', align: 'center' }),
      ftext({ x: 620, y: 390, w: 184, h: 26, html: 'امروز نه', fontSize: 15, color: DIM }),
      ftext({ x: 96, y: 560, w: 1088, h: 30, html: 'برای برگشت کلیک کنید یا فلش چپ بزنید', fontSize: 14, color: 'rgba(178,210,190,0.5)', align: 'center' }),
      shape('rect', { x: 0, y: 0, w: 1280, h: 720, fill: 'rgba(0,0,0,0)', link: 'jr-features' }),
    ],
  })

  const stats = [
    ['۳ برابر', 'سریع‌تر از نسخهٔ ۱'],
    ['۹۸٪', 'دقت خلاصه‌سازی در آزمون تیم'],
    ['۴۰ هزار', 'عضو لیست انتظار'],
  ]
  const s5 = slide({
    id: 'jr-stats', background: VOID, transition: 'fade',
    notes: 'اعداد لانچ — درشت، بدون نمودار؛ اعداد شاهد جای روایت را می‌گیرند.',
    elements: [
      kick('اعداد'),
      ...stats.flatMap(([n, d], i) => [
        ftext({ x: 96 + (2 - i) * 376, y: 250, w: 336, h: 90, html: n, fontSize: 66, fontWeight: 800, color: NEON, align: 'center', fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 96 + (2 - i) * 376, y: 360, w: 336, h: 40, html: d, fontSize: 17, color: DIM, align: 'center', fx: { enter: 'fade-up', order: i } }),
      ]),
      shape('rect', { x: 490, y: 480, w: 300, h: 2, fill: 'rgba(184,255,60,0.4)' }),
      ftext({ x: 240, y: 520, w: 800, h: 36, html: '«به‌روزرسانی جرقه، شاید بهترین کاری باشد که امسال برای ذهنتان کنید.»', fontSize: 19, color: DIM, align: 'center' }),
      pg(5),
    ],
  })

  const s6 = slide({
    id: 'jr-pricing', background: VOID, transition: 'zoom',
    notes: 'قیمت‌گذاری تک‌کارت — لانچ‌ها ساده می‌فروشند: یک قیمت، یک CTA.',
    elements: [
      shape('rect', { x: 440, y: 170, w: 400, h: 380, radius: 24, fill: PANEL, stroke: 'rgba(184,255,60,0.5)', strokeWidth: 1.5, shadow: glow('rgba(184,255,60,0.3)', 70) }),
      ftext({ x: 440, y: 210, w: 400, h: 36, html: 'جرقهٔ ۲ — پیش‌ثبت‌نام', fontSize: 18, fontWeight: 700, color: NEON, align: 'center' }),
      ftext({ x: 440, y: 270, w: 400, h: 90, html: '۹۹ هزار تومان', fontSize: 56, fontWeight: 800, color: '#F2FFE8', align: 'center' }),
      ftext({ x: 440, y: 366, w: 400, h: 32, html: 'در ماه — همهٔ پلتفرم‌ها', fontSize: 16, color: DIM, align: 'center' }),
      shape('rect', { x: 530, y: 440, w: 220, h: 52, radius: 26, fill: NEON, shadow: glow('rgba(184,255,60,0.5)', 30) }),
      ftext({ x: 530, y: 454, w: 220, h: 30, html: 'رزرو کنید', fontSize: 18, fontWeight: 800, color: '#0B120D', align: 'center' }),
      ftext({ x: 440, y: 590, w: 400, h: 28, html: 'لغو در هر زمان · ۱۴ روز بازگشت', fontSize: 13, color: 'rgba(178,210,190,0.5)', align: 'center' }),
      pg(6),
    ],
  })

  const s7 = slide({
    id: 'jr-cta', background: VOID, transition: 'morph',
    notes: 'بستن: دستگاه کوچک به مرکز برمی‌گردد و CTA زیرش می‌نشیند.',
    elements: [
      ...device(560, 130, 280, 380),
      ftext({ x: 96, y: 560, w: 1088, h: 60, html: 'جرقه را روشن کنید.', fontSize: 44, fontWeight: 800, color: '#F2FFE8', align: 'center' }),
      ftext({ x: 296, y: 636, w: 688, h: 26, html: 'jaraghe.example — محصولی فرضی برای یک قالب واقعی', fontSize: 12, color: 'rgba(178,210,190,0.45)', align: 'center' }),
      pg(7),
    ],
  })

  return doc({
    title: 'جرقه — قالب لانچ محصول', withFonts: ['Vazirmatn'],
    theme: { background: VOID, color: '#F2FFE8', accent: NEON, fontFamily: VZ },
    present: { progress: true },
    slides: [s1, s2, s3, s4, st, s5, s6, s7],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK J · «همایش» — رویداد و کنفرانس (event/conference, Farsi/RTL)
// Grape poster ground with coral and sun. Three sticker shapes are the cast:
// cover confetti → topic cards → they return for the close. The agenda's
// coral highlight bar is its own morph — it slides down between day 1 and 2.
// ═══════════════════════════════════════════════════════════════════════
function deckHamayesh() {
  const GRAPE = '#31215A', LILAC = '#EDE8F9', CORAL = '#FF6B4A', SUN = '#FFC93C'
  const INKV = '#241746', SOFT = 'rgba(36,23,70,0.62)', LILAC_DIM = 'rgba(237,232,249,0.65)'
  const kick = (s, color = CORAL) => ftext({ x: 384, y: 84, w: 800, h: 26, html: s, fontSize: 15, fontWeight: 700, color })
  const pg = (n, dark) => text({ x: 96, y: 654, w: 80, h: 24, html: fa(n), fontSize: 13, fontWeight: 600, color: dark ? LILAC_DIM : SOFT, align: 'left', fontFamily: VZ })

  const s1 = slide({
    id: 'hm-cover', background: GRAPE, transition: 'none',
    notes: 'قالب — «همایش»، رویداد و کنفرانس. پوستر: تاریخ درشت سمت راست، سه شکل برچسبی چپ (کستِ morph)، خط مکان پایین. اشکال در اسلاید محورها به کارت تبدیل می‌شوند و در پایان برمی‌گردند.',
    elements: [
      shape('triangle', { id: 'hm-a', x: 120, y: 120, w: 190, h: 170, rotation: 8, fill: SUN }),
      shape('ellipse', { id: 'hm-b', x: 330, y: 330, w: 140, h: 140, rotation: -6, fill: CORAL }),
      shape('rect', { id: 'hm-c', x: 140, y: 470, w: 150, h: 150, radius: 34, rotation: -8, fill: LILAC }),
      ftext({ x: 596, y: 110, w: 588, h: 130, html: '۱۲–۱۴ آبان', fontSize: 92, fontWeight: 800, color: SUN, lineHeight: 1.15 }),
      ftext({ x: 596, y: 260, w: 588, h: 172, html: 'همایش<br>طراحی تهران', fontSize: 64, fontWeight: 800, color: LILAC, lineHeight: 1.3 }),
      ftext({ x: 596, y: 440, w: 588, h: 36, html: 'سه روز، سه سالن، چهل سخنران.', fontSize: 20, color: LILAC_DIM, fx: { enter: 'fade-up', order: 1 } }),
      shape('rect', { x: 596, y: 560, w: 588, h: 2, fill: 'rgba(237,232,249,0.25)' }),
      ftext({ x: 596, y: 580, w: 588, h: 28, html: 'مرکز همایش‌های یادمان · ثبت‌نام از اول مهر', fontSize: 15, color: LILAC_DIM }),
      pg(1, true),
    ],
  })

  const topics = [
    ['تایپ و حروف', 'از خوشنویسی تا فونت متغیر — روزی دربارهٔ حروف فارسی.', SUN],
    ['هوش و طراحی', 'ابزارهای مولد، وقتی که طراح فرمان را رها نمی‌کند.', CORAL],
    ['طراحی فارسی', 'چالش‌های راست‌به‌چپ؛ شبکه، اعداد و نیم‌فاصله.', LILAC],
  ]
  const s2 = slide({
    id: 'hm-topics', background: LILAC, transition: 'morph',
    notes: 'بیت morph اول: سه برچسب پوستر به سه کارت محور تبدیل می‌شوند — چرخش صفر، رنگ می‌ماند، متن سواپ می‌شود.',
    elements: [
      kick('محورهای امسال'),
      ...topics.flatMap(([t, d, c], i) => {
        const cx = 96 + (2 - i) * 376
        return [
        shape('rect', { id: ['hm-a', 'hm-b', 'hm-c'][i], x: cx, y: 220, w: 336, h: 300, radius: 22, fill: c, shadow: { y: 12, blur: 34, color: 'rgba(36,23,70,0.18)' } }),
        ftext({ x: cx + 24, y: 260, w: 288, h: 52, html: t, fontSize: 30, fontWeight: 800, color: INKV }),
        ftext({ x: cx + 24, y: 330, w: 288, h: 110, html: d, fontSize: 17, color: 'rgba(36,23,70,0.78)', lineHeight: 1.7 }),
        ]
      }),
      ftext({ x: 96, y: 580, w: 1088, h: 30, html: 'هر محور، یک سالن و یک روز کامل — برنامهٔ دقیق در اسلایدهای بعد.', fontSize: 17, color: SOFT, align: 'center' }),
      pg(2),
    ],
  })

  const day1 = [
    ['۰۹:۰۰', 'پذیرش و قهوه'],
    ['۱۰:۰۰', 'گشایش — حروف، قبل از صفحه‌کلید'],
    ['۱۳:۰۰', 'ناهار و میزگرد استودیوها'],
    ['۱۶:۰۰', 'پنل: آیندهٔ فونت فارسی'],
  ]
  const s3 = slide({
    id: 'hm-day1', background: LILAC, transition: 'fade',
    notes: 'آجندای روز اول — نوار مرجانی پشت نخستین آیتم؛ همین نوار در روز دوم پایین می‌سرد (morph).',
    elements: [
      kick('برنامه — روز اول'),
      shape('rect', { id: 'hm-bar', x: 96, y: 176, w: 1088, h: 84, radius: 16, fill: CORAL, opacity: 0.18 }),
      shape('rect', { x: 1168, y: 176, w: 16, h: 84, radius: 8, fill: CORAL }),
      ...day1.flatMap(([t, what], i) => [
        ftext({ x: 556, y: 192 + i * 110, w: 590, h: 52, html: what, fontSize: 26, fontWeight: i === 0 ? 800 : 600, color: INKV }),
        text({ x: 96, y: 200 + i * 110, w: 400, h: 36, html: t, fontSize: 20, fontWeight: 700, color: CORAL, align: 'left', fontFamily: VZ }),
      ]),
      pg(3),
    ],
  })

  const day2 = [
    ['۰۹:۳۰', 'کارگاه: شبکه در راست‌به‌چپ'],
    ['۱۲:۰۰', 'سخنرانی اصلی — طراحی برای ۸۵ میلیون نفر'],
    ['۱۵:۰۰', 'پنل: قیمت‌گذاری طراحی در ایران'],
    ['۱۸:۰۰', 'پایان‌بندی و ضیافت'],
  ]
  const s4 = slide({
    id: 'hm-day2', background: LILAC, transition: 'morph',
    notes: 'بیت morph دوم: نوار مرجانی از آیتم اول روز اول به آیتم دوم روز دوم می‌سُرد — جهتِ خواندنِ نوار، همان جهت متن است.',
    elements: [
      kick('برنامه — روز دوم'),
      ...day2.flatMap(([t, what], i) => [
        ...(i === 1 ? [
          shape('rect', { id: 'hm-bar', x: 96, y: 286, w: 1088, h: 84, radius: 16, fill: CORAL, opacity: 0.18 }),
          shape('rect', { x: 1168, y: 286, w: 16, h: 84, radius: 8, fill: CORAL }),
        ] : []),
        ftext({ x: 556, y: 192 + i * 110, w: 590, h: 52, html: what, fontSize: 26, fontWeight: i === 1 ? 800 : 600, color: INKV }),
        text({ x: 96, y: 200 + i * 110, w: 400, h: 36, html: t, fontSize: 20, fontWeight: 700, color: CORAL, align: 'left', fontFamily: VZ }),
      ]),
      pg(4),
    ],
  })

  const speakers = [
    ['ر', 'رها نیک‌آیین', 'طراح حروف — استودیو قلم'],
    ['ب', 'بهرام صدر', 'مدیر طراحی — دیجی‌مدیا (فرضی)'],
    ['م', 'مینا کاشانی', 'پژوهشگر طراحی ایرانی'],
    ['ا', 'امید فرهادی', 'طراح تجربه — استودیو نمایش'],
  ]
  const s5 = slide({
    id: 'hm-speakers', background: GRAPE, transition: 'fade',
    notes: 'چهار سخنران با سرفصل حرفِ نام — قالب بدون عکس پرتره تحویل می‌شود؛ اگر عکس داشتید img جای دایره بنشینید.',
    elements: [
      kick('سخنران‌ها', SUN),
      ...speakers.flatMap(([ltr, name, role], i) => {
        const cx = 96 + (3 - i) * 278
        return [
        shape('ellipse', { x: cx + 59, y: 190, w: 136, h: 136, fill: [CORAL, SUN, LILAC, '#8A6FE8'][i], shadow: { y: 8, blur: 26, color: 'rgba(0,0,0,0.3)' }, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx + 59, y: 228, w: 136, h: 64, html: ltr, fontSize: 48, fontWeight: 800, color: i === 2 ? INKV : '#241746', align: 'center', fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx, y: 352, w: 254, h: 40, html: name, fontSize: 21, fontWeight: 700, color: LILAC, align: 'center', fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx, y: 396, w: 254, h: 44, html: role, fontSize: 14, color: LILAC_DIM, align: 'center', lineHeight: 1.5, fx: { enter: 'fade-up', order: i } }),
        ]
      }),
      ftext({ x: 96, y: 540, w: 1088, h: 30, html: 'و ۳۶ سخنران دیگر — در سه سالن، هم‌زمان.', fontSize: 17, color: LILAC_DIM, align: 'center' }),
      pg(5, true),
    ],
  })

  const shops = [
    ['شبکهٔ فارسی در عمل', '۶ ساعت · ۲۰ نفر', SUN],
    ['فونت متغیر بسازید', '۴ ساعت · ۱۶ نفر', CORAL],
    ['پروتوتایپ با کد', '۵ ساعت · ۲۴ نفر', '#8A6FE8'],
  ]
  const s6 = slide({
    id: 'hm-workshops', background: LILAC, transition: 'fade',
    notes: 'کارگاه‌ها — ظرفیت محدود؛ بج ظرفیت روی هر کارت.',
    elements: [
      kick('کارگاه‌ها — روز دوم'),
      ...shops.flatMap(([t, cap, c], i) => {
        const cx = 96 + (2 - i) * 376
        return [
        shape('rect', { x: cx, y: 200, w: 336, h: 280, radius: 20, fill: '#FFFDF8', stroke: 'rgba(36,23,70,0.12)', strokeWidth: 1, shadow: { y: 10, blur: 28, color: 'rgba(36,23,70,0.1)' }, fx: { enter: 'fade-up', order: i } }),
        shape('rect', { x: cx + 258, y: 228, w: 54, h: 54, radius: 14, fill: c }),
        ftext({ x: cx + 24, y: 316, w: 288, h: 76, html: t, fontSize: 24, fontWeight: 800, color: INKV, lineHeight: 1.4 }),
        shape('rect', { x: cx + 162, y: 416, w: 150, h: 36, radius: 18, fill: 'rgba(36,23,70,0.08)' }),
        ftext({ x: cx + 162, y: 424, w: 150, h: 24, html: cap, fontSize: 13, fontWeight: 700, color: SOFT, align: 'center' }),
        ]
      }),
      pg(6),
    ],
  })

  const s7 = slide({
    id: 'hm-venue', background: SUN, transition: 'zoom',
    notes: 'مکان — پوستر زرد با نقشهٔ انتزاعی (دو مسیر و یک نقطه). نشانی و مترو را عوض کنید.',
    elements: [
      shape('rect', { x: 96, y: 150, w: 500, h: 420, radius: 24, fill: '#FFE58A' }),
      shape('line', { x: 130, y: 300, w: 430, h: 3, fill: '#241746', strokeWidth: 3, strokeStyle: 'dashed' }),
      shape('line', { x: 340, y: 180, w: 3, h: 360, fill: '#241746', strokeWidth: 3, strokeStyle: 'dashed' }),
      shape('ellipse', { x: 296, y: 256, w: 34, h: 34, fill: CORAL, stroke: INKV, strokeWidth: 3 }),
      ftext({ x: 130, y: 480, w: 430, h: 30, html: 'مترو: ایستگاه یادمان — خروجی ۲', fontSize: 15, fontWeight: 700, color: 'rgba(36,23,70,0.7)', align: 'center' }),
      ftext({ x: 656, y: 200, w: 528, h: 160, html: 'مرکز همایش‌های<br>یادمان', fontSize: 60, fontWeight: 800, color: INKV, lineHeight: 1.25 }),
      ftext({ x: 656, y: 380, w: 528, h: 36, html: 'بلوار دانش، پلاک ۱۲ — تهران', fontSize: 20, color: 'rgba(36,23,70,0.72)' }),
      shape('rect', { x: 656, y: 430, w: 200, h: 56, radius: 28, fill: INKV }),
      ftext({ x: 656, y: 446, w: 200, h: 30, html: 'مسیر روی نقشه', fontSize: 16, fontWeight: 700, color: SUN, align: 'center' }),
      pg(7),
    ],
  })

  const tickets = [
    ['دانشجویی', '۹۸۰ هزار تومان', 'با کارت معتبر'],
    ['عادی', '۲ میلیون و ۴۰۰', 'دسترسی کامل سه روز'],
    ['ویژه', '۴ میلیون و ۹۰۰', 'همهٔ کارگاه‌ها + ضیافت'],
  ]
  const s8 = slide({
    id: 'hm-tickets', background: GRAPE, transition: 'fade',
    notes: 'بلیط — سه پلن؛ کارت میانی توصیه‌شده. بج‌های برچسبی کوچک هم‌قاعدهٔ کاور (چرخش ملایم) — و کستِ morph روی همین کارت‌ها می‌ماند تا اسلاید بعد.',
    elements: [
      kick('بلیط', SUN),
      ...tickets.flatMap(([t, p, d], i) => {
        const cx = 96 + (2 - i) * 376
        return [
        shape('rect', { x: cx, y: 200, w: 336, h: 300, radius: 20, fill: i === 1 ? CORAL : 'rgba(237,232,249,0.08)', stroke: 'rgba(237,232,249,0.25)', strokeWidth: 1, ...(i === 1 ? { shadow: { y: 14, blur: 40, color: 'rgba(255,107,74,0.35)' } } : {}) }),
        ftext({ x: cx + 24, y: 230, w: 288, h: 40, html: t, fontSize: 22, fontWeight: 700, color: i === 1 ? '#FFF' : LILAC }),
        ftext({ x: cx + 24, y: 290, w: 288, h: 70, html: p, fontSize: 30, fontWeight: 800, color: i === 1 ? '#FFF' : SUN, lineHeight: 1.35 }),
        ftext({ x: cx + 24, y: 380, w: 288, h: 32, html: d, fontSize: 15, color: i === 1 ? 'rgba(255,255,255,0.8)' : LILAC_DIM }),
        shape('rect', { id: ['hm-a', 'hm-b', 'hm-c'][i], x: cx + 292, y: 460, w: 20, h: 20, rotation: 0, fill: [SUN, CORAL, LILAC][i] }),
        ]
      }),
      pg(8, true),
    ],
  })

  const s9 = slide({
    id: 'hm-close', background: CORAL, transition: 'morph',
    notes: 'بیت morph سوم: برچسب‌ها به بالای تیتر پایانی برمی‌گردند (چرخ‌وفلک رنگ‌ها). CTA ثبت‌نام.',
    elements: [
      shape('triangle', { id: 'hm-a', x: 556, y: 130, w: 54, h: 48, rotation: 8, fill: SUN }),
      shape('ellipse', { id: 'hm-b', x: 640, y: 140, w: 44, h: 44, rotation: -6, fill: '#8A6FE8' }),
      shape('rect', { id: 'hm-c', x: 716, y: 138, w: 42, h: 42, radius: 12, rotation: -8, fill: LILAC }),
      ftext({ x: 96, y: 250, w: 1088, h: 135, html: 'می‌بینیمتان، آبان.', fontSize: 96, fontWeight: 800, color: '#FFF', align: 'center' }),
      shape('rect', { x: 512, y: 430, w: 256, h: 60, radius: 30, fill: '#FFF' }),
      ftext({ x: 512, y: 448, w: 256, h: 32, html: 'hamayesh.example — ثبت‌نام', fontSize: 18, fontWeight: 800, color: CORAL, align: 'center' }),
      ftext({ x: 296, y: 640, w: 688, h: 24, html: 'همایش طراحی تهران — رویدادی فرضی برای یک قالب واقعی', fontSize: 12, color: 'rgba(255,255,255,0.65)', align: 'center' }),
      pg(9),
    ],
  })

  return doc({
    title: 'همایش — قالب رویداد و کنفرانس', withFonts: ['Vazirmatn'],
    theme: { background: GRAPE, color: LILAC, accent: CORAL, fontFamily: VZ },
    present: { progress: true },
    slides: [s1, s2, s3, s4, s5, s6, s7, s8, s9],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK K · «نبض» — گزارش داده (data/analytics quarterly, Farsi/RTL)
// Cool fog ground, one slate dark interlude. The four KPI cards are the
// cast: cover dots → KPI row → they FLATTEN into the conversion funnel
// (bars shrinking, right-anchored like the reading direction) → closing row.
// ═══════════════════════════════════════════════════════════════════════
function deckNabz() {
  const FOG = '#EDF0F5', SLATE = '#1B2430', CARD = '#FFFFFF'
  const BLUE = '#2E6BE6', TEAL = '#12A594', AMBER = '#EFA022', ROSE = '#E5484D'
  const INKT = '#1B2430', SOFT = 'rgba(27,36,48,0.58)'
  const kick = (s, color = BLUE) => ftext({ x: 384, y: 84, w: 800, h: 26, html: s, fontSize: 15, fontWeight: 700, color })
  const pg = (n, dark) => text({ x: 96, y: 654, w: 80, h: 24, html: fa(n), fontSize: 13, fontWeight: 600, color: dark ? 'rgba(200,215,235,0.5)' : SOFT, align: 'left', fontFamily: VZ })
  const cast = ['nb-a', 'nb-b', 'nb-c', 'nb-d']
  const castColors = [BLUE, TEAL, AMBER, ROSE]

  const s1 = slide({
    id: 'nb-cover', background: FOG, transition: 'none',
    notes: 'قالب — «نبض»، گزارش داده فصلی. چهار نقطهٔ رنگی کاور، همان چهار کارت KPI می‌شوند و بعد به قیف تبدیل flattening می‌شوند —morph روایتِ اعداد.',
    elements: [
      kick('نبض — پایش محصول دیجیتال'),
      ftext({ x: 96, y: 170, w: 1088, h: 130, html: 'تابستان در یک نگاه', fontSize: 88, fontWeight: 800, color: INKT }),
      ftext({ x: 336, y: 330, w: 848, h: 44, html: 'گزارش دادهٔ فصل تابستان ۱۴۰۵ — تیم رشد', fontSize: 22, color: SOFT, fx: { enter: 'fade-up', order: 1 } }),
      ...cast.map((c, i) => shape('ellipse', { id: c, x: 96 + i * 34, y: 560, w: 22, h: 22, fill: castColors[i] })),
      ftext({ x: 250, y: 562, w: 500, h: 24, html: 'چهار سنجه، یک فصل', fontSize: 14, color: SOFT }),
      pg(1),
    ],
  })

  const kpis = [
    ['۸۴٬۲۰۰', 'کاربر فعال ماهانه', '+۹٪ نسبت به بهار', castColors[0]],
    ['۳٫۴٪', 'نرخ تبدیل بازدید', '+۰٫۳ واحد', castColors[1]],
    ['۱۲٫۸ میلیارد', 'تومان درآمد فصل', '+۱۴٪ رشد', castColors[2]],
    ['۲٫۱٪', 'نرخ ریزش ماهانه', '−۰٫۴ بهبود', castColors[3]],
  ]
  const s2 = slide({
    id: 'nb-kpi', background: FOG, transition: 'morph',
    notes: 'بیت morph اول: نقاط به کارت‌های KPI تبدیل می‌شوند. دلتای ریزش «بهبود» است چون جهتش مثبت است — رنگ‌ها معنا دارند، نه علامت.',
    elements: [
      kick('نمای کلی فصل'),
      ...kpis.flatMap(([n, l, d, c], i) => {
        const cx = 96 + (3 - i) * 278
        return [
        shape('rect', { id: cast[i], x: cx, y: 200, w: 254, h: 260, radius: 16, fill: CARD, shadow: { y: 12, blur: 30, color: 'rgba(27,36,48,0.1)' } }),
        shape('rect', { x: cx + 24, y: 228, w: 40, h: 5, radius: 3, fill: c }),
        ftext({ x: cx + 24, y: 256, w: 206, h: 70, html: n, fontSize: 40, fontWeight: 800, color: INKT }),
        ftext({ x: cx + 24, y: 340, w: 206, h: 48, html: l, fontSize: 16, color: SOFT, lineHeight: 1.5 }),
        ftext({ x: cx + 24, y: 404, w: 206, h: 30, html: d, fontSize: 15, fontWeight: 700, color: TEAL }),
        ]
      }),
      ftext({ x: 96, y: 520, w: 1088, h: 32, html: 'همهٔ سنجه‌های اصلی در مسیر رشد هستند؛ قیف پایین جزئیات می‌گوید.', fontSize: 18, color: SOFT }),
      pg(2),
    ],
  })

  const s3 = slide({
    id: 'nb-growth', background: FOG, transition: 'fade',
    notes: 'خط رشد کاربران — رنگ آبی نبض، tooltip فارسی.',
    elements: [
      kick('رشد کاربران'),
      chart({ x: 96, y: 150, w: 1088, h: 470, preset: 'line', option: {
        grid: { left: 60, right: 20, top: 30, bottom: 36 },
        xAxis: { type: 'category', data: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'] },
        yAxis: { type: 'value' },
        color: [BLUE],
        tooltip: { trigger: 'axis', formatter: '{b}: {c} هزار کاربر' },
        series: [{ type: 'line', smooth: true, data: [52, 56, 61, 68, 76, 84],
          lineStyle: { width: 3.5, color: BLUE },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(46,107,230,0.25)' }, { offset: 1, color: 'rgba(46,107,230,0)' }] } },
          symbol: 'circle', symbolSize: 8, itemStyle: { color: BLUE } }],
      }, fx: { enter: 'fade-up' } }),
      pg(3),
    ],
  })

  const s4 = slide({
    id: 'nb-channels', background: FOG, transition: 'fade',
    notes: 'دوناتِ کانال‌های جذب + خوانش کوتاه سمت راست. پالت نبض، نه پالت پیش‌فرض چارت.',
    elements: [
      kick('کانال‌های جذب'),
      ftext({ x: 96, y: 130, w: 1088, h: 70, html: 'کاربر تازه از کجا می‌آید.', fontSize: 44, fontWeight: 800, color: INKT }),
      chart({ x: 96, y: 230, w: 560, h: 420, preset: 'pie', option: {
        color: [BLUE, TEAL, AMBER, ROSE],
        tooltip: { trigger: 'item', formatter: '{b}: {d}٪' },
        series: [{ type: 'pie', radius: ['45%', '72%'],
          data: [
            { name: 'جست‌وجو', value: 44 }, { name: 'شبکه‌های اجتماعی', value: 26 },
            { name: 'معرفی کاربران', value: 18 }, { name: 'تبلیغات', value: 12 },
          ], label: { show: true } }],
      }, fx: { enter: 'fade-up' } }),
      ftext({ x: 720, y: 260, w: 464, h: 160, html: 'جست‌وجوی ارگانیک، همچنان نصف ورودی‌ها؛<br>معرفیِ کاربران این فصل دو برابر شده —<br>محصول در حال حرف‌زدن است.', fontSize: 20, color: SOFT, lineHeight: 1.8, fx: { enter: 'fade-up', order: 2 } }),
      pg(4),
    ],
  })

  const s5 = slide({
    id: 'nb-hours', background: SLATE, transition: 'fade',
    notes: 'میان‌پردهٔ تیره: ساعات اوج استفاده. روی تاریکی، رنگ محورها را دستی روشن کنید — پیش‌فرض خاکستری چارت در تاریکی گم می‌شود.',
    elements: [
      ftext({ x: 384, y: 84, w: 800, h: 26, html: 'ساعت‌های اوج — تابستان', fontSize: 15, fontWeight: 700, color: AMBER }),
      ftext({ x: 96, y: 130, w: 1088, h: 70, html: 'شب‌ها مالِ ماست.', fontSize: 44, fontWeight: 800, color: '#EDF0F5' }),
      chart({ x: 96, y: 230, w: 1088, h: 400, preset: 'bar', option: {
        grid: { left: 56, right: 16, top: 24, bottom: 32 },
        xAxis: { type: 'category', data: ['۸ صبح', '۱۲ ظهر', '۱۶', '۲۰', 'نیمه‌شب'],
          axisLabel: { color: 'rgba(200,215,235,0.75)' } },
        yAxis: { type: 'value', axisLabel: { color: 'rgba(200,215,235,0.6)' }, splitLine: { lineStyle: { color: 'rgba(200,215,235,0.12)' } } },
        color: [AMBER],
        tooltip: { trigger: 'item', formatter: '{b}: {c}٪ فعالیت' },
        series: [{ type: 'bar', data: [18, 34, 41, 86, 52], itemStyle: { color: AMBER, borderRadius: 6 }, barWidth: 90 }],
      }, fx: { enter: 'fade-up' } }),
      pg(5, true),
    ],
  })

  const funnel = [
    ['بازدید', '۲۸۴ هزار', 900, castColors[0]],
    ['ثبت‌نام', '۱۱۹ هزار — ۴۲٪', 640, castColors[1]],
    ['فعال‌سازی', '۶۸ هزار — ۲۴٪', 430, castColors[2]],
    ['خرید', '۲۵ هزار — ۹٪', 260, castColors[3]],
  ]
  const s6 = slide({
    id: 'nb-funnel', background: FOG, transition: 'morph',
    notes: 'بیت morph دوم — امضای قالب: کارت‌های KPI پخ می‌شوند و به میله‌های قیف تبدیل می‌شوند؛ لبه‌ها راست‌چین‌اند چون متن از راست خوانده می‌شود. عرض میله = نسبت مراحل.',
    elements: [
      kick('قیف تبدیل — از بازدید تا خرید'),
      ...funnel.flatMap(([label, val, w, c], i) => [
        shape('rect', { id: cast[i], x: 1184 - w, y: 180 + i * 110, w, h: 72, radius: 14, fill: c, opacity: 0.88 }),
        ftext({ x: 1184 - w + 24, y: 200 + i * 110, w: w - 48, h: 36, html: label, fontSize: 20, fontWeight: 800, color: '#FFF' }),
        ftext({ x: 96, y: 200 + i * 110, w: 1184 - w - 130, h: 34, html: val, fontSize: 16, color: SOFT }),
      ]),
      ftext({ x: 96, y: 610, w: 1088, h: 30, html: 'افت اصلی بین فعال‌سازی و خرید است — تمرکز پاییز همین‌جاست.', fontSize: 18, color: SOFT }),
      pg(6),
    ],
  })

  const s7 = slide({
    id: 'nb-regions', background: FOG, transition: 'fade',
    notes: 'جدول مناطق — فونت جدول وزیرمتن، ستون‌ها راست‌چین.',
    elements: [
      kick('مناطق'),
      ftable({
        x: 96, y: 160, w: 1088, h: 360,
        columns: [{ w: 1.4 }, { w: 1.2 }, { w: 1.2 }, { w: 1.2 }],
        rows: [
          { cells: [fcell('منطقه', { bold: true }), fcell('کاربر فعال', { bold: true }), fcell('درآمد (میلیارد تومان)', { bold: true }), fcell('رشد فصلی', { bold: true })] },
          { cells: [fcell('تهران'), fcell('۳۱٬۴۰۰'), fcell('۶٫۲'), fcell('+۱۱٪', { color: TEAL, bold: true })] },
          { cells: [fcell('اصفهان'), fcell('۱۸٬۲۰۰'), fcell('۲٫۸'), fcell('+۹٪', { color: TEAL, bold: true })] },
          { cells: [fcell('مشهد'), fcell('۱۴٬۹۰۰'), fcell('۲٫۱'), fcell('+۱۲٪', { color: TEAL, bold: true })] },
          { cells: [fcell('سایر'), fcell('۱۹٬۷۰۰'), fcell('۱٫۷'), fcell('+۴٪', { color: TEAL, bold: true })] },
        ],
        headerBg: SLATE, headerColor: '#EDF0F5', zebra: 'rgba(27,36,48,0.04)',
        borderColor: 'rgba(27,36,48,0.14)', color: INKT,
      }),
      ftext({ x: 96, y: 560, w: 1088, h: 30, html: 'رشد از پایتخت شروع شد، اما کندیِ «سایر» تهدید فصل بعد است.', fontSize: 17, color: SOFT }),
      pg(7),
    ],
  })

  const insights = [
    ['معرفی‌ها داغ‌اند', 'دو برابر شدن دعوت‌های موفق؛ برنامهٔ معرفی را در پاییز وسعت بدهید.'],
    ['شب، وقت طلایی است', 'اوج فعالیت بعد از ساعت ۲۰ — زمان‌بندی اعلان‌ها را جابه‌جا کنید.'],
    ['گلوگاه، خرید است', '۹٪ قیف یعنی بزرگ‌ترین اهرم درآمدی، فعال‌سازی تا پرداخت.'],
  ]
  const s8 = slide({
    id: 'nb-insights', background: FOG, transition: 'fade',
    notes: 'سه بینش — هر کارت یک «پس چه کنیم».',
    elements: [
      kick('بینش‌های فصل'),
      ...insights.flatMap(([t, d], i) => {
        const cx = 96 + (2 - i) * 376
        return [
        shape('rect', { x: cx, y: 190, w: 336, h: 330, radius: 16, fill: CARD, shadow: { y: 10, blur: 28, color: 'rgba(27,36,48,0.1)' }, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx + 24, y: 216, w: 60, h: 44, html: fa(i + 1), fontSize: 30, fontWeight: 800, color: castColors[i], align: 'center', fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx + 24, y: 284, w: 288, h: 80, html: t, fontSize: 23, fontWeight: 800, color: INKT, lineHeight: 1.4, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: cx + 24, y: 380, w: 288, h: 110, html: d, fontSize: 15.5, color: SOFT, lineHeight: 1.7, fx: { enter: 'fade-up', order: i } }),
        ]
      }),
      pg(8),
    ],
  })

  const s9 = slide({
    id: 'nb-close', background: FOG, transition: 'morph',
    notes: 'بیت morph سوم: قیف به ردیف چهار رنگ جمع می‌شود؛ دو هدف پاییز و پایان.',
    elements: [
      ...cast.map((c, i) => shape('rect', { id: c, x: 566 + i * 42, y: 200, w: 26, h: 26, radius: 8, fill: castColors[i] })),
      ftext({ x: 96, y: 280, w: 1088, h: 95, html: 'پاییز: دو هدف، یک گلوگاه.', fontSize: 64, fontWeight: 800, color: INKT, align: 'center' }),
      ftext({ x: 296, y: 430, w: 688, h: 92, html: '۱ — نرخ خرید را از ۹٪ به ۱۲٪ برسانیم<br>۲ — رشد «سایر» مناطق را دو رقمی کنیم', fontSize: 20, color: SOFT, align: 'center', lineHeight: 1.8 }),
      ftext({ x: 296, y: 640, w: 688, h: 24, html: 'نبض — محصولی فرضی برای یک قالب واقعی', fontSize: 12, color: 'rgba(27,36,48,0.4)', align: 'center' }),
      pg(9),
    ],
  })

  return doc({
    title: 'نبض — قالب گزارش داده', withFonts: ['Vazirmatn'],
    theme: { background: FOG, color: INKT, accent: BLUE, fontFamily: VZ },
    present: { progress: true },
    slides: [s1, s2, s3, s4, s5, s6, s7, s8, s9],
  })
}

// ═══════════════════════════════════════════════════════════════════════
// DECK L · «سفید» — مینیمال سوئیسی (Swiss-minimal keynote, Farsi/RTL)
// Broken-white, ink, ONE cobalt accent. The style is restraint: two display
// sizes, hairlines, a strict grid — and exactly three deliberate morphs
// (cover→manifesto, principles→type specimen, quote→close). Restraint is the
// art direction here; the morph bar is the only travelling element.
// ═══════════════════════════════════════════════════════════════════════
function deckSafid() {
  const PAPER = '#F4F3EF', INK = '#141414', COBALT = '#2244EE'
  const SOFT = 'rgba(20,20,20,0.55)', HAIR = 'rgba(20,20,20,0.16)'
  const kick = (s) => ftext({ x: 384, y: 84, w: 800, h: 26, html: s, fontSize: 14, fontWeight: 700, color: COBALT })
  const pg = (n, light) => text({ x: 96, y: 654, w: 80, h: 24, html: fa(n), fontSize: 13, fontWeight: 600, color: light ? 'rgba(244,243,239,0.6)' : SOFT, align: 'left', fontFamily: VZ })

  const s1 = slide({
    id: 'sf-cover', background: PAPER, transition: 'none',
    notes: 'قالب — «سفید»، مینیمال سوئیسی. یک رنگ اکسنت (کبالت)، خطوط مویی، دو اندازهٔ تایپ. morph عمداً کم است — سه بیت دقیق؛ خویشتن‌داری بخشی از جهت هنری این قالب است.',
    elements: [
      ftext({ x: 96, y: 84, w: 500, h: 26, html: 'استودیو سفید — مانیفست طراحی ۱۴۰۵', fontSize: 14, fontWeight: 600, color: SOFT, align: 'left' }),
      shape('rect', { x: 96, y: 130, w: 500, h: 1.5, fill: HAIR }),
      ftext({ id: 'sf-title', x: 96, y: 300, w: 1088, h: 260, html: 'سفید', fontSize: 200, fontWeight: 800, color: INK, lineHeight: 1 }),
      shape('rect', { id: 'sf-bar', x: 96, y: 596, w: 48, h: 16, fill: COBALT }),
      ftext({ x: 660, y: 590, w: 524, h: 30, html: 'فضای خالی، بخشی از جمله است.', fontSize: 16, color: SOFT }),
      pg(1),
    ],
  })

  const s2 = slide({
    id: 'sf-manifesto', background: PAPER, transition: 'morph',
    notes: 'بیت morph اول: «سفید» کوچک می‌شود و بالا می‌نشیند؛ مربع کبالت به خطِ زیرِ جمله تبدیل می‌شود — تنها رنگ صفحه.',
    elements: [
      ftext({ id: 'sf-title', x: 884, y: 72, w: 300, h: 64, html: 'سفید', fontSize: 40, fontWeight: 800, color: SOFT }),
      ftext({ x: 96, y: 240, w: 1088, h: 240, html: 'کم‌تر، ولی بهتر.<br>بقیه‌اش حاشیه است.', fontSize: 76, fontWeight: 800, color: INK, lineHeight: 1.45 }),
      shape('rect', { id: 'sf-bar', x: 96, y: 500, w: 260, h: 10, fill: COBALT }),
      ftext({ x: 460, y: 496, w: 724, h: 30, html: '— این دک هم با همین قاعده چیده شده است', fontSize: 15, color: SOFT }),
      pg(2),
    ],
  })

  const principles = [
    'فاصله، خودش محتواست.',
    'یک فونت، دو وزن.',
    'رنگ باید دلیل داشته باشد.',
    'شبکه را بشکن، اما عمداً.',
  ]
  const s3 = slide({
    id: 'sf-principles', background: PAPER, transition: 'fade',
    notes: 'چهار اصل — شمارهٔ لاتینِ کوچک سمت چپ، جملهٔ درشت راست‌چین، خط مویی زیر هر ردیف. نشان کبالت کنار آخرین اصل؛ در اسلاید بعد به میلهٔ نمونهٔ حروف می‌رود.',
    elements: [
      kick('چهار اصل'),
      ...principles.flatMap((p, i) => [
        text({ x: 96, y: 186 + i * 110, w: 60, h: 40, html: `0${i + 1}`, fontSize: 15, fontWeight: 600, color: SOFT, align: 'left', fontFamily: MONO }),
        ftext({ x: 260, y: 168 + i * 110, w: 924, h: 60, html: p, fontSize: 40, fontWeight: 700, color: INK }),
        shape('rect', { x: 96, y: 240 + i * 110, w: 1088, h: 1.5, fill: HAIR }),
      ]),
      shape('rect', { id: 'sf-bar', x: 1136, y: 498, w: 48, h: 10, fill: COBALT }),
      pg(3),
    ],
  })

  const s4 = slide({
    id: 'sf-type', background: PAPER, transition: 'morph',
    notes: 'بیت morph دوم: نشان کبالت از کنار اصل چهارم به کنار سطر ۴۸ می‌آید — حرکتِ کم اما دیده‌شدنی. نمونهٔ حروف: وزیرمتن از سیاه تا نازک.',
    elements: [
      kick('نمونهٔ حروف — وزیرمتن'),
      ftext({ x: 96, y: 130, w: 1088, h: 220, html: 'الف', fontSize: 190, fontWeight: 800, color: INK, lineHeight: 1 }),
      shape('rect', { x: 96, y: 372, w: 1088, h: 1.5, fill: HAIR }),
      ftext({ x: 96, y: 400, w: 1088, h: 76, html: 'سیاه ۸۰۰ — برای وقتی حرف، خودش پوستر است', fontSize: 44, fontWeight: 800, color: INK }),
      shape('rect', { id: 'sf-bar', x: 1184, y: 512, w: 48, h: 10, fill: COBALT }),
      ftext({ x: 96, y: 500, w: 1040, h: 52, html: 'نیمه‌ضخیم ۶۰۰ — برای تیترهایی که فریاد نمی‌زنند', fontSize: 30, fontWeight: 600, color: INK }),
      ftext({ x: 96, y: 574, w: 1088, h: 40, html: 'معمولی ۴۰۰ — بدنهٔ متن، همان‌قدر مهم', fontSize: 22, fontWeight: 400, color: INK }),
      ftext({ x: 96, y: 630, w: 1088, h: 30, html: 'نازک ۲۰۰ — زیرنویس، فقط برای چشم‌های خسته', fontSize: 16, fontWeight: 200, color: SOFT }),
      pg(4),
    ],
  })

  const s5 = slide({
    id: 'sf-grid', background: PAPER, transition: 'fade',
    notes: 'نمایش شبکه — شش ستون با خط مویی؛ سه بلوک کبالت روی ستون‌ها. شبکه را با محتوای خودتان پر کنید.',
    elements: [
      kick('شبکه — شش ستون'),
      ...[0, 1, 2, 3, 4, 5].map((i) => shape('rect', { x: 96 + i * 181.3, y: 160, w: 1.5, h: 380, fill: HAIR })),
      shape('rect', { x: 1184 - 1.5, y: 160, w: 1.5, h: 380, fill: HAIR }),
      shape('rect', { x: 96, y: 160, w: 1088, h: 1.5, fill: HAIR }),
      shape('rect', { x: 96, y: 540, w: 1088, h: 1.5, fill: HAIR }),
      shape('rect', { x: 1002.7, y: 200, w: 163, h: 300, fill: COBALT, opacity: 0.92 }),
      ftext({ x: 1002.7, y: 330, w: 163, h: 34, html: '۱ ستون', fontSize: 15, fontWeight: 700, color: '#FFF', align: 'center' }),
      shape('rect', { x: 640.1, y: 200, w: 326, h: 300, fill: COBALT, opacity: 0.75 }),
      ftext({ x: 640.1, y: 330, w: 326, h: 34, html: '۲ ستون', fontSize: 15, fontWeight: 700, color: '#FFF', align: 'center' }),
      shape('rect', { x: 96, y: 200, w: 507.4, h: 300, fill: COBALT, opacity: 0.55 }),
      ftext({ x: 96, y: 330, w: 507.4, h: 34, html: '۳ ستون — یا هر ترکیب دیگر', fontSize: 15, fontWeight: 700, color: '#FFF', align: 'center' }),
      ftext({ x: 96, y: 580, w: 1088, h: 30, html: 'عناصر لبه‌به‌لبه روی ستون می‌نشینند؛ فاصله‌ها مضرب شبکه‌اند.', fontSize: 16, color: SOFT }),
      pg(5),
    ],
  })

  const works = [
    ['خانهٔ آبان', 'معماری داخلی', '۱۴۰۴'],
    ['کتابِ شب', 'طراحی جلد و صفحات', '۱۴۰۳'],
    ['کافهٔ مهر', 'هویت بصری', '۱۴۰۳'],
    ['چرم رها', 'بسته‌بندی', '۱۴۰۲'],
  ]
  const s6 = slide({
    id: 'sf-works', background: PAPER, transition: 'fade',
    notes: 'فهرست کارها — ایندکس سوئیسی: نام، زمینه، سال. ردیف‌ها را با پروژه‌های واقعی‌تان عوض کنید.',
    elements: [
      kick('ایندکس کارها'),
      ...works.flatMap(([t, d, y], i) => [
        ftext({ x: 556, y: 172 + i * 108, w: 628, h: 52, html: t, fontSize: 34, fontWeight: 700, color: INK, fx: { enter: 'fade-up', order: i } }),
        ftext({ x: 300, y: 184 + i * 108, w: 400, h: 34, html: d, fontSize: 16, color: SOFT, fx: { enter: 'fade-up', order: i } }),
        text({ x: 96, y: 186 + i * 108, w: 120, h: 34, html: y, fontSize: 18, fontWeight: 700, color: COBALT, align: 'left', fontFamily: VZ, fx: { enter: 'fade-up', order: i } }),
        shape('rect', { x: 96, y: 240 + i * 108, w: 1088, h: 1.5, fill: HAIR }),
      ]),
      pg(6),
    ],
  })

  const s7 = slide({
    id: 'sf-quote', background: COBALT, transition: 'fade',
    notes: 'تنها صفحهٔ رنگی دک — نقل روی کبالت. مربع سفید کوچک پایین، در اسلاید پایان به زیرخطِ تیتر تبدیل می‌شود.',
    elements: [
      ftext({ x: 96, y: 250, w: 1088, h: 140, html: 'سفیدی، صدای طرح است.', fontSize: 88, fontWeight: 800, color: PAPER, align: 'center' }),
      ftext({ x: 296, y: 440, w: 688, h: 32, html: '— دفتر طراحی سفید، ۱۴۰۵', fontSize: 17, color: 'rgba(244,243,239,0.7)', align: 'center' }),
      shape('rect', { id: 'sf-bar', x: 616, y: 600, w: 48, h: 12, fill: PAPER }),
      pg(7, true),
    ],
  })

  const s8 = slide({
    id: 'sf-close', background: PAPER, transition: 'morph',
    notes: 'بیت morph سوم: مربعِ صفحهٔ نقل به زیرخط تیتر پایان می‌رسد و سفیدِ کبالت به کاغذ برمی‌گردد. ایمیل را عوض کنید.',
    elements: [
      ftext({ x: 96, y: 240, w: 1088, h: 140, html: 'پایانِ بخشِ اول.', fontSize: 96, fontWeight: 800, color: INK, align: 'center' }),
      shape('rect', { id: 'sf-bar', x: 560, y: 420, w: 160, h: 10, fill: COBALT }),
      ftext({ x: 296, y: 480, w: 688, h: 34, html: 'hello@safid.example — تهران، خیابان ولیعصر', fontSize: 19, color: SOFT, align: 'center' }),
      ftext({ x: 296, y: 640, w: 688, h: 24, html: 'استودیو سفید — برندی فرضی برای یک قالب واقعی', fontSize: 12, color: 'rgba(20,20,20,0.4)', align: 'center' }),
      pg(8),
    ],
  })

  return doc({
    title: 'سفید — قالب مینیمال سوئیسی', withFonts: ['Vazirmatn'],
    theme: { background: PAPER, color: INK, accent: COBALT, fontFamily: VZ },
    slides: [s1, s2, s3, s4, s5, s6, s7, s8],
  })
}

// ——— splice + write ————————————————————————————————————————————————
const outDir = process.argv[2] ?? join(root, 'working')
mkdirSync(outDir, { recursive: true })
const blockRe = /<script type="application\/bento\+json" id="bento-doc">[\s\S]*?<\/script>/
for (const [file, build] of [
  ['signal-editorial-type.bento.html', deckSignal],
  ['terra-premium-product.bento.html', deckTerra],
  ['orbital-dark-immersive.bento.html', deckOrbital],
  ['picnic-playful.bento.html', deckPicnic],
  // the Farsi template family — RTL, Vazirmatn, every deck morphs
  ['helal-executive-report.bento.html', deckHelal],
  ['shetab-startup-pitch.bento.html', deckShetab],
  ['atelier-lecture.bento.html', deckAtelier],
  ['namayesh-portfolio.bento.html', deckNamayesh],
  ['jaraghe-launch.bento.html', deckJaraghe],
  ['hamayesh-event.bento.html', deckHamayesh],
  ['nabz-data-report.bento.html', deckNabz],
  ['safid-minimal.bento.html', deckSafid],
]) {
  uid = 0
  const d = build()
  const json = JSON.stringify(d).replace(/</g, '\\u003c')
  const out = shell.replace(blockRe, `<script type="application/bento+json" id="bento-doc">\n${json}\n</scr` + 'ipt>')
  if (!out.includes(json)) throw new Error(`splice failed for ${file}`)
  writeFileSync(join(outDir, file), out)
  console.log(`${file} — ${d.slides.length} slides, ${Math.round(out.length / 1024)} KB`)
}
