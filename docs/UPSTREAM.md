# Upstream integration

- Repository: https://github.com/nyblnet/bento
- Branch: `main`
- Imported through: `986fd53ac4cb353e61c40f243bce0528b42fa9b6` (release 1.2.0)
- Original source baseline: `5bd499713331c915a9c1a37013b8c63b250c9a55`

The initial Persian commit imported a source snapshot without its upstream Git
ancestry. This integration applies the baseline-to-upstream delta with a
three-way merge, retaining the existing fork history. It does not establish
upstream ancestry. For the next integration, use the imported-through commit
above as the base, not the original source baseline or an unrelated-history
merge.

Keep Persian in the bundled catalog (`slides/src/i18n/fa.ts`). Transfer any
upstream `slides/src/i18n/packs/fa.ts` changes there and regenerate `packed.ts`;
do not reintroduce a duplicate Persian pack. Rebuild the root standalone HTML
and versioned language packs after integrating source changes.
