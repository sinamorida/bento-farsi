#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Authored Persian typography, not viewer-locale-dependent document rewriting.
// Run: node scripts/test-slides-farsi.ts (pure model/starter; no browser).

import { builtinLayouts, defaultText, instantiateLayout, type TextElement } from '../slides/src/model.ts'
import { starterDoc } from '../slides/src/starterdeck.ts'

let checks = 0
let failures = 0
function ok(condition: boolean, message: string) {
  checks++
  console.log(`  ${condition ? 'ok  ' : 'FAIL'}  ${message}`)
  if (!condition) failures++
}

const doc = starterDoc()
const texts = doc.slides.flatMap((s) => s.elements.filter((e): e is TextElement => e.type === 'text'))
const persian = texts.filter((e) => /\p{Script=Arabic}/u.test(e.html.replace(/<[^>]*>/g, '')))
const leftProse = persian.filter((e) => e.align !== 'right' && e.align !== 'center')
ok(persian.length > 0 && leftProse.length === 0,
  `Persian starter prose is right-aligned or intentionally centered (${leftProse.length}/${persian.length} incorrect)`)
const kickers = persian.filter((e) => e.id === 'sd-kicker')
ok(kickers.length > 0 && kickers.every((e) => e.letterSpacing === 0),
  `Persian kickers have zero tracking (${kickers.filter((e) => e.letterSpacing !== 0).length} incorrect)`)

// Explicit centered compositions must win over the authored-script default.
for (const html of ['مورف.', 'انیمیشن اختصاصی']) {
  const matches = texts.filter((e) => e.html === html)
  ok(matches.length > 0 && matches.every((e) => e.align === 'center'), `centered composition stays centered: ${html}`)
}
for (const html of ['1', '0', '100%', 'BENTO/SLIDES']) {
  const matches = texts.filter((e) => e.html === html)
  ok(matches.length > 0 && matches.every((e) => e.align === 'left'), `Latin/numeric text stays left-aligned: ${html}`)
}
const latinKicker = texts.find((e) => e.id === 'sd-kicker' && e.html === 'BENTO/SLIDES')
ok(latinKicker?.letterSpacing === 4, 'Latin kicker retains its authored tracking')
const code = doc.slides.flatMap((s) => s.elements.filter((e) => e.type === 'code'))
ok(code.length > 0 && code.every((e) => e.align === 'left'), 'code demos remain left-aligned')

const inserted = defaultText()
ok(inserted.align === 'right' && inserted.lineHeight === 1.35, 'Farsi editor insert baseline is right-aligned with line height 1.35')
for (const size of [{ width: 1600, height: 900 }, { width: 1280, height: 720 }]) {
  const placeholders = builtinLayouts(size).flatMap((layout) =>
    instantiateLayout(layout).elements.filter((e): e is TextElement => e.type === 'text' && !!e.placeholder))
  ok(placeholders.length > 0 && placeholders.every((e) => e.align === (e.role === 'image' ? 'center' : 'right')),
    `text placeholders match Farsi alignment and image slots stay centered at ${size.width}×${size.height}`)
  const headings = placeholders.filter((e) => ['title', 'subtitle', 'kicker', 'attribution', 'image'].includes(e.role ?? ''))
  ok(headings.length > 0 && headings.every((e) => e.lineHeight === 1.35),
    `placeholder default line height matches Farsi inserts at ${size.width}×${size.height}`)
  const bodies = placeholders.filter((e) => e.role === 'body')
  ok(bodies.length > 0 && bodies.every((e) => e.lineHeight === 1.5),
    `explicit body line-height overrides survive at ${size.width}×${size.height}`)
}

console.log(`\n${checks - failures}/${checks} checks passed`)
if (failures) process.exit(1)
