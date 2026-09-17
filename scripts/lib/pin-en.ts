// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Pin a rig's chrome to English.
//
// The rigs that import this assert on the SOURCE STRINGS — the English keys.
// That is the right thing for them to pin: they test undo semantics, menu
// order, number formats, paint — not translation; the per-app i18n rigs own
// translation. But bento-farsi resolves to fa by default (the kernel's
// fallback lands on fa whenever it is carried, and node's unstubbed navigator
// matches nothing), so an unpinned rig suddenly read Persian strings and
// failed 22 rigs' worth of English `includes(...)` at once. English is not
// reachable from navigator.language any more — no 'en' column exists — so the
// saved-override path is the one honest way in.
//
// Call pinEnglish() in the rig body, AFTER the imports (the app facade must
// have registered first; setLocale then pins the kernel's single locale state
// every facade shares, and t() runs at call time, never at import).
import { setLocale } from '../../kernel/src/i18n.ts'

export const pinEnglish = (): void => setLocale('en')
