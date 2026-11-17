# Vendored: lossless-json `parse`

`parse.ts` and `revive.ts` are copied from [lossless-json](https://github.com/josdejong/lossless-json) 4.3.3 (MIT, see `LICENSE.md`), with one change: the string-run fix from [josdejong/lossless-json#293](https://github.com/josdejong/lossless-json/pull/293).

## Why

lossless-json 4.3.3 and earlier build each string value one character at a time (`result += text[i]`). V8 stores that as a cons-string rope with one node per character, which keeps about 30 bytes of heap per character alive until the string is flattened. A 10 KB string variable costs about 300 KB of heap, so workers that receive large variables spend their time in GC (see [#890](https://github.com/camunda/camunda-8-js-sdk/issues/890)).

The fix appends each run of unescaped characters with a single `text.slice(start, i)`. Output and error messages don't change.

`LosslessJsonParser.ts` already parses with native `JSON.parse` when that is lossless (#893). The vendored `parse` covers the cases that still need lossless-json: numbers that don't fit in a JS number (for example int64 keys), duplicate keys, and `__proto__` keys. REST responses (`CamundaRestClient`) and Operate search results go through it as well.

## Rules

- Only `parse` (and its private helper `revive`) are vendored. Everything else, in particular `LosslessNumber`, `isLosslessNumber` and `stringify`, comes from the `lossless-json` package, so `instanceof LosslessNumber` checks in user code keep working.
- Keep the code identical to upstream apart from the imports, the fix and the strict-mode edits below, so it can be compared with a release using `diff -w -B` (the files use the SDK's prettier formatting).
- Strict-mode edits (the SDK compiles with `noImplicitReturns`): an explicit `return undefined` at the end of five inner functions in `parse.ts`, and `const array: unknown[]`. Each is marked `// vendored:`.
- Remove this directory and import `parse` from `lossless-json` again once a release containing #293 is published, and raise the `lossless-json` dependency to that version.
