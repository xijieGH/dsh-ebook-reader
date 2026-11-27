// Host-route smoke test for the e-book reader: registers the route against a
// fake Cordis context, drives it with Request objects, and checks the files
// that persistence writes under a temporary DSH_HOME.

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply } from '../index.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-ebook-test-'))
process.env.DSH_HOME = sandbox

const routes = []
const ctx = {
  inject(dependencies, callback) {
    assert.deepEqual(dependencies, ['connection'])
    const scope = {
      get(name) {
        assert.equal(name, 'connection')
        return {
          fetch: {
            register(route) {
              routes.push(route)
              return async () => {}
            },
          },
        }
      },
      logger: { warn: () => {} },
    }
    callback(scope)
  },
  logger: { warn: () => {} },
}

apply(ctx)
assert.equal(routes.length, 1, 'the host half must register exactly one route')
const route = routes[0]
assert.equal(route.path, '/api/ebook-reader/api')
assert.deepEqual(route.methods, ['POST'])
assert.equal(route.requestBody, 'buffered')

function call(operation, headers, body) {
  const request = new Request('http://127.0.0.1:1/api/ebook-reader/api', {
    method: 'POST',
    headers: { 'x-ebook-op': operation, ...(headers || {}) },
    body,
  })
  return route.fetch(request)
}

async function payload(operation, headers, body) {
  const response = await call(operation, headers, body)
  assert.equal(response.status, 200)
  return response.json()
}

const epub = new Uint8Array(fs.readFileSync(path.join(here, 'sample.epub')))
const hash = 'a'.repeat(64)

let result = await payload('list')
assert.deepEqual(result.value, { books: [] })

result = await payload('import-meta', { 'content-type': 'application/json' }, JSON.stringify({
  meta: {
    title: '测试之书',
    author: '张三',
    cover: 'data:image/png;base64,AAAA',
    spineCount: 2,
    size: epub.byteLength,
    hash,
  },
}))
assert.equal(result.ok, true)
assert.equal(result.value.duplicate, false)
assert.equal(result.value.fileExists, false)
const id = result.value.id
assert.match(id, /^eb_[a-z0-9]{16}$/)

result = await payload('import-meta', { 'content-type': 'application/json' }, JSON.stringify({
  meta: { title: '重复', hash },
}))
assert.equal(result.value.duplicate, true)
assert.equal(result.value.id, id)
assert.equal(result.value.fileExists, false)

result = await payload('import-file', { 'x-ebook-id': id, 'content-type': 'application/epub+zip' }, epub)
assert.equal(result.ok, true)
assert.equal(result.value.size, epub.byteLength)
assert.ok(fs.existsSync(path.join(sandbox, 'storages', 'ebook-reader', 'books', `${id}.epub`)))

result = await payload('import-meta', { 'content-type': 'application/json' }, JSON.stringify({
  meta: { title: '重复', hash },
}))
assert.equal(result.value.duplicate, true)
assert.equal(result.value.fileExists, true)

const fileResponse = await call('file', { 'x-ebook-id': id })
assert.equal(fileResponse.status, 200)
assert.equal(fileResponse.headers.get('content-type'), 'application/epub+zip')
assert.equal(new Uint8Array(await fileResponse.arrayBuffer()).byteLength, epub.byteLength)

result = await payload('progress', { 'content-type': 'application/json' }, JSON.stringify({ id, chapter: 1, ratio: 0.5 }))
assert.equal(result.value.progress.chapter, 1)
assert.equal(result.value.progress.ratio, 0.5)

result = await payload('list')
assert.equal(result.value.books.length, 1)
assert.equal(result.value.books[0].progress.chapter, 1)
assert.ok(result.value.books[0].lastReadAt > 0)

result = await payload('update', { 'content-type': 'application/json' }, JSON.stringify({ id, title: '改名之书', author: '王五' }))
assert.equal(result.value.book.title, '改名之书')
assert.equal(result.value.book.author, '王五')

result = await payload('settings-put', { 'content-type': 'application/json' }, JSON.stringify({
  settings: { fontSize: 99, theme: 'sepia', lineHeight: 1.6, maxWidth: 700, lastBookId: 'eb_0123456789abcdef' },
}))
assert.equal(result.value.fontSize, 30)
assert.equal(result.value.theme, 'sepia')
assert.equal(result.value.lastBookId, 'eb_0123456789abcdef')

result = await payload('settings-get')
assert.deepEqual(result.value, {
  fontSize: 30,
  theme: 'sepia',
  lineHeight: 1.6,
  maxWidth: 700,
  lastBookId: 'eb_0123456789abcdef',
})

result = await payload('delete', { 'content-type': 'application/json' }, JSON.stringify({ id }))
assert.equal(result.value.title, '改名之书')
assert.equal(fs.existsSync(path.join(sandbox, 'storages', 'ebook-reader', 'books', `${id}.epub`)), false)
result = await payload('list')
assert.equal(result.value.books.length, 0)
const progressFile = JSON.parse(fs.readFileSync(path.join(sandbox, 'storages', 'ebook-reader', 'progress.json'), 'utf8'))
assert.equal(progressFile.items[id], undefined)

result = await payload('import-file', { 'x-ebook-id': id }, epub)
assert.equal(result.ok, false)
assert.equal(result.error.code, 'not-found')

result = await payload('bogus')
assert.equal(result.ok, false)
assert.equal(result.error.code, 'bad-request')

const library = JSON.parse(fs.readFileSync(path.join(sandbox, 'storages', 'ebook-reader', 'library.json'), 'utf8'))
assert.equal(library.version, 1)
assert.deepEqual(library.books, [])

fs.rmSync(sandbox, { recursive: true, force: true })
console.log('host route smoke test passed')
