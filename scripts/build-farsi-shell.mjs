#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Build the Persian standalone shell: Bento_Slides_Farsi.bento.html.
//
//   node scripts/build-farsi-shell.mjs            build slides, verify, copy to the repo root
//   node scripts/build-farsi-shell.mjs --no-build reuse slides/dist-single as-is
//
// WHY THIS SCRIPT EXISTS. The fork ships a Persian-default shell under a
// different name than the upstream build produces, and for a month the only
// recipe was tribal knowledge: build slides, copy the file to the repo root,
// rename it. UPSTREAM.md carried one line about it and nothing checked that
// the copied file was actually Persian. Meanwhile slides/dist-single/ sat
// untracked in working trees and silently fell behind the source (it did,
// once — an old deflate-b64 pre-1.2.0 build). So the rebuild step is a script
// that refuses to copy a shell it cannot prove is Persian.
//
// Why the proof is a BROWSER, not a grep: the whole runtime — the fa catalog,
// the Vazirmatn @font-face, the Persian starter deck — lives inside the
// shell's deflated code block, so an uncompressed grep over the file finds
// not one Arabic-script byte even in a perfect shell. What proves fa is
// BUNDLED (a column, not a pack) is the boot itself: kernel resolve() only
// lands on 'fa' when the fa catalog is registered, and applyDirection then
// writes lang="fa" dir="rtl" onto <html>. So the file is loaded in headless
// Chrome — the same --headless=new --dump-dom trick the sanitizer rig uses —
// and the dumped DOM must carry those two attributes. Chrome is required; a
// refused copy is the point, not an inconvenience.

import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, readFileSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const built = join(root, 'slides/dist-single/Bento_Slides.bento.html')
const dest = join(root, 'Bento_Slides_Farsi.bento.html')

if (!process.argv.includes('--no-build')) {
  console.log('building slides …')
  execFileSync('npm', ['run', 'build:single'], { cwd: join(root, 'slides'), stdio: 'inherit' })
}

const fail = (msg) => { console.error(`REFUSED: ${msg}`); process.exit(1) }

if (!readFileSync(built, 'utf8').includes('deflate-b86')) {
  fail('the built shell is not the current deflated format — stale dist-single? rebuild without --no-build')
}

console.log('running the splice conformance gate …')
execFileSync('node', [join(root, 'scripts/shell-gate.mjs'), built], { stdio: 'inherit' })

console.log('booting the shell in headless Chrome to prove it opens Persian …')
const chrome =
  process.env.BENTO_CHROME ||
  ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find((p) => spawnSync('test', ['-x', p]).status === 0) ||
  (spawnSync('which', ['google-chrome']).status === 0 ? 'google-chrome' : undefined)
if (!chrome) fail('no Chrome found — install Google Chrome or set BENTO_CHROME to a binary')

const profile = mkdtempSync(join(tmpdir(), 'bento-farsi-shell-'))
let dom
try {
  const run = spawnSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=' + profile,
    '--virtual-time-budget=8000', '--dump-dom', 'file://' + built,
  ], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: 60_000 })
  if (run.status !== 0 || !run.stdout) fail(`Chrome could not load the shell (exit ${run.status})`)
  dom = run.stdout
} finally {
  rmSync(profile, { recursive: true, force: true })
}

const lang = dom.match(/<html[^>]*\blang="([^"]*)"/)?.[1]
const dir = dom.match(/<html[^>]*\bdir="([^"]*)"/)?.[1]
if (lang !== 'fa' || dir !== 'rtl') {
  fail(`the shell booted as lang=${lang} dir=${dir} — expected lang="fa" dir="rtl"; the fa catalog or the Persian boot is missing`)
}

copyFileSync(built, dest)
console.log(`booted as lang="fa" dir="rtl" — wrote ${dest} (${readFileSync(dest).length} bytes)`)
console.log('next: commit it if it changed — this file is what the fork publishes.')
