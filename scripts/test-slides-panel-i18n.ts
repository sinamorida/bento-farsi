#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento authors
// Panel tooltip coverage: ROW_TIPS VALUES reach t(), not just their row labels.
// Run: node scripts/test-slides-panel-i18n.ts
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import ts from '../slides/node_modules/typescript/lib/typescript.js'
import { PACKED_LOCALES } from '../slides/src/i18n/packed.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const coreDir = join(root, 'slides/src/i18n')
const source = ts.createSourceFile('panels.ts', readFileSync(join(root, 'slides/src/editor/panels.ts'), 'utf8'), ts.ScriptTarget.Latest, true)
const focusedKeys = [
  'Deck-wide. Show the slide counter to the audience while presenting.',
  'Deck-wide. Show the thin progress bar along the bottom while presenting.',
  'Deck-wide. Reveal’s own navigation arrows. Off by default — links and keys already navigate.',
  'Accent',
  "Add this slide to the document's layout picker (New slide button)",
]
let rowTips: ts.ObjectLiteralExpression | undefined
let translatedLayoutTitle = false
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'ROW_TIPS') {
    assert(node.initializer && ts.isObjectLiteralExpression(node.initializer), 'ROW_TIPS must be an object literal')
    rowTips = node.initializer
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isPropertyAccessExpression(node.left) && ts.isIdentifier(node.left.expression)
      && node.left.expression.text === 'saveLy' && node.left.name.text === 'title') {
    const rhs = node.right
    translatedLayoutTitle = ts.isCallExpression(rhs) && ts.isIdentifier(rhs.expression)
      && rhs.expression.text === 't' && rhs.arguments.length === 1
      && ts.isStringLiteral(rhs.arguments[0]) && rhs.arguments[0].text === focusedKeys[4]
  }
  ts.forEachChild(node, visit)
}
visit(source)
assert(rowTips, 'ROW_TIPS was not found — do not silently skip tooltip coverage')
const tips = rowTips.properties.map(prop => {
  assert(ts.isPropertyAssignment(prop) && ts.isStringLiteral(prop.initializer), 'Every ROW_TIPS value must be a string literal checked by this rig')
  return prop.initializer.text
})
assert(tips.length > 0, 'ROW_TIPS must not be empty')
for (const key of focusedKeys.slice(0, 3)) assert(tips.includes(key), `Expected tooltip VALUE: ${key}`)
assert(PACKED_LOCALES.length > 0, 'PACKED_LOCALES must not be empty')
let failures = 0
let checks = 0
function check(pass: boolean, message: string) {
  checks++
  if (!pass) { failures++; console.error(`FAIL ${message}`) }
}
async function checkCatalog(path: string, keys: string[], pack = false) {
  const mod = await import(pathToFileURL(path).href)
  const catalog = pack ? mod.strings : Object.values(mod).find(value => value && typeof value === 'object')
  assert(catalog && typeof catalog === 'object', `${path}: missing catalog object`)
  for (const key of keys) {
    const value = (catalog as Record<string, unknown>)[key]
    check(Object.hasOwn(catalog, key) && typeof value === 'string' && value.trim().length > 0,
      `${path}: missing translation for ${JSON.stringify(key)}`)
    // “Accent” is also a valid French word; equality alone is not a placeholder.
    if (focusedKeys.includes(key) && key !== 'Accent' && typeof value === 'string') {
      check(value.trim() !== key, `${path}: English placeholder for ${JSON.stringify(key)}`)
    }
  }
}
const coreKeys = [...new Set([...tips, ...focusedKeys])]
for (const locale of PACKED_LOCALES) await checkCatalog(join(coreDir, `${locale}.ts`), coreKeys)
const packs = readdirSync(join(coreDir, 'packs')).filter(file => file.endsWith('.ts'))
for (const file of packs) await checkCatalog(join(coreDir, 'packs', file), focusedKeys, true)
check(translatedLayoutTitle, 'saveLy.title must translate the layout-picker tooltip with t()')
console.log(`Panel i18n: ${tips.length} ROW_TIPS values, ${PACKED_LOCALES.length} core catalogs, ${packs.length} packs; ${checks} checks, ${failures} failures`)
process.exitCode = failures ? 1 : 0
