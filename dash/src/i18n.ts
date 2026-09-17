// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Facade: the i18n ENGINE lives in the shared kernel; CATALOGS are per-app
// string data and live here. This module registers them at import time and
// re-exports the engine, so registration is guaranteed to precede the first
// t() call by ES module evaluation order. App code imports './i18n', never the
// kernel module directly — that would bypass this registration.
//
// The per-locale catalogs in ./i18n/*.ts are the SOURCE OF TRUTH: that is what
// a translator reviews and what a contributor submits. What SHIPS is the
// key-once packing of them in ./i18n/packed.ts, because English-string-as-key
// means the same English sentence is a key in every catalog and deflate
// cannot dedupe across its 32KB window. Regenerate after editing a catalog:
//
//     node scripts/test-dash-i18n.ts --write
//
// and the same script, run without --write, is the guard: it sweeps every t()
// out of dash/src, fails on a catalog key that no longer matches a source
// string, and fails on a {placeholder} that a translation dropped or renamed.
//
// LANGUAGE NEVER ENTERS THE DOCUMENT. It follows the VIEWER (navigator.language,
// with a per-browser 'bento-lang' override and the picker in About) — a
// platform invariant, not a preference, exactly like the theme. A workbook
// written in Osaka opens with German chrome in Hamburg and the bytes on disk
// are identical.

import { PACKED, PACKED_LOCALES } from './i18n/packed.ts'
import { registerI18n, locale } from '../../kernel/src/i18n.ts'
import type { LocaleChoice } from '../../kernel/src/i18n.ts'

/** Locales offered in the About picker (each label in its own language). */
const CHOICES: LocaleChoice[] = [
  { code: 'fa', label: 'فارسی' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-Hans', label: '简体中文' },
  { code: 'zh-Hant', label: '繁體中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
]

registerI18n({
  packed: {
    locales: PACKED_LOCALES,
    table: PACKED,
    // navigator.language is a full tag. Without these, a zh-TW reader falls
    // back to English rather than to the Traditional column that is right
    // there — the base-language fallback in the kernel only reaches 'zh'.
    alias: {
      fa: 'fa',
      'fa-IR': 'fa',
      'fa-AF': 'fa',
      zh: 'zh-Hans',
      'zh-CN': 'zh-Hans',
      'zh-SG': 'zh-Hans',
      'zh-TW': 'zh-Hant',
      'zh-HK': 'zh-Hant',
      'zh-MO': 'zh-Hant',
      // Brazilian terminology; pt-PT differs enough to deserve its own
      // catalog later (docs/i18n-packs.md) — until then it maps here,
      // the way slides maps it (docs/DECISIONS.md, 2026-08-29).
      'pt-BR': 'pt',
      'pt-PT': 'pt',
    },
  },
  choices: CHOICES,
})

export const LOCALE_CHOICES = CHOICES

export { t, locale, setLocale, i18nApi, localeChoices } from '../../kernel/src/i18n.ts'
export type { Catalog } from '../../kernel/src/i18n.ts'

/** Languages whose CHROME reads right-to-left. */
const RTL = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi'])

export const isRtl = (code: string): boolean => RTL.has(code.split('-')[0].toLowerCase())

/**
 * Point the CHROME at the viewer's language (PLATFORM §8).
 *
 * Deliberately called AFTER capturePristine(): saves re-serialize the pristine
 * clone, so the dir/lang attributes never reach a saved file. Direction follows
 * the VIEWER; the workbook's content does not mirror — a cell lays out its own
 * text by what is in it, and a Persian workbook written by an English reader
 * stays on disk byte-identical either way.
 */
export function applyDirection(): void {
  const code = locale()
  document.documentElement.lang = code
  document.documentElement.dir = isRtl(code) ? 'rtl' : 'ltr'
}
