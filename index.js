/**
 * Host half of the e-book reader.
 *
 * It serves one exact Fetch route under the page's shared `/api` channel and
 * keeps the bookshelf on disk, so books and reading positions survive Desktop
 * restarts even though the Desktop Host listens on a fresh port per launch.
 *
 * Files:
 *   $DSH_HOME/storages/ebook-reader/library.json
 *   $DSH_HOME/storages/ebook-reader/settings.json
 *   $DSH_HOME/storages/ebook-reader/books/<id>.epub
 */

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

const ROUTE_PATH = '/api/ebook-reader/api'
const MAX_EPUB_BYTES = 300 * 1024 * 1024
const MAX_JSON_BYTES = 2 * 1024 * 1024
const MAX_COVER_CHARS = 900 * 1024
const DEFAULT_SETTINGS = { fontSize: 18, theme: 'auto', lineHeight: 1.75, maxWidth: 760, lastBookId: null }

const EPUB_MAGIC = [0x50, 0x4b, 0x03, 0x04]

/** @param {unknown} value */
function text(value) {
  return typeof value === 'string' ? value : ''
}

/** @param {unknown} value @param {number} max */
function clip(value, max) {
  const s = text(value).replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max) : s
}

/** @param {unknown} value */
function int(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback
}

/** @param {unknown} value */
function ratio(value) {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return Math.min(1, Math.max(0, n))
}

/** @param {string} id */
function validId(id) {
  return /^eb_[a-z0-9]{8,40}$/.test(id)
}

/** @param {unknown} value */
function validCover(value) {
  return typeof value === 'string' && value.startsWith('data:image/') && value.length <= MAX_COVER_CHARS
}

/** @param {unknown} value */
function validHash(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

/** @param {unknown} value */
function sanitizeBook(value) {
  if (!value || typeof value !== 'object') return null
  const book = value
  if (!validId(book.id)) return null
  const progress = book.progress && typeof book.progress === 'object' ? book.progress : null
  return {
    id: book.id,
    title: clip(book.title, 400) || 'Untitled',
    author: clip(book.author, 400),
    cover: validCover(book.cover) ? book.cover : null,
    spineCount: Math.max(0, int(book.spineCount)),
    size: Math.max(0, int(book.size)),
    hash: validHash(book.hash) ? book.hash : null,
    addedAt: Math.max(0, int(book.addedAt)),
    lastReadAt: Math.max(0, int(book.lastReadAt)),
    progress: progress === null ? null : {
      chapter: Math.max(0, int(progress.chapter)),
      ratio: ratio(progress.ratio),
      updatedAt: Math.max(0, int(progress.updatedAt)),
    },
  }
}

/** @param {unknown} value */
function sanitizeSettings(value) {
  const input = value && typeof value === 'object' ? value : {}
  const theme = ['auto', 'light', 'sepia', 'dark'].includes(input.theme) ? input.theme : DEFAULT_SETTINGS.theme
  return {
    fontSize: Math.min(30, Math.max(14, int(input.fontSize, DEFAULT_SETTINGS.fontSize))),
    theme,
    lineHeight: Math.min(2.2, Math.max(1.3, Number(input.lineHeight) || DEFAULT_SETTINGS.lineHeight)),
    maxWidth: Math.min(1100, Math.max(480, int(input.maxWidth, DEFAULT_SETTINGS.maxWidth))),
    lastBookId: typeof input.lastBookId === 'string' && /^eb_[a-z0-9]{8,40}$/.test(input.lastBookId)
      ? input.lastBookId
      : null,
  }
}

/** @param {number} status @param {unknown} body */
function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/** @param {string} code @param {string} message */
function failure(code, message) {
  return jsonResponse(200, { ok: false, error: { code, message } })
}

/** @param {unknown} value */
function success(value) {
  return jsonResponse(200, { ok: true, value })
}

/** @param {string} code @param {string} message */
class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

/** @param {Request} request */
async function readJson(request) {
  const textBody = await request.text()
  if (textBody.length > MAX_JSON_BYTES) throw new ApiError('too-large', 'request body is too large')
  if (textBody.trim() === '') return {}
  try {
    return JSON.parse(textBody)
  } catch {
    throw new ApiError('bad-request', 'body is not JSON')
  }
}

/** @param {string} path */
async function readOptional(path) {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (error && error.code === 'ENOENT') return null
    throw error
  }
}

/** @param {string} path @param {string} content */
async function writeAtomic(path, content) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, content, 'utf8')
  await rename(temporary, path)
}

/**
 * @param {{ logger?: { warn?: (message: string) => void } }} ctx
 */
function createStore(ctx) {
  const home = text(process.env.DSH_HOME).trim() || join(homedir(), '.dsh')
  const root = join(home, 'storages', 'ebook-reader')
  const libraryPath = join(root, 'library.json')
  const progressPath = join(root, 'progress.json')
  const settingsPath = join(root, 'settings.json')
  const booksDir = join(root, 'books')

  /** @type {{ version: number, books: any[] } | null} */
  let library = null
  /** @type {Record<string, { chapter: number, ratio: number, updatedAt: number }> | null} */
  let progress = null
  /** @type {ReturnType<typeof sanitizeSettings> | null} */
  let settings = null
  let queue = Promise.resolve()

  const warn = (message) => {
    try {
      ctx.logger?.warn?.(`dsh-ebook-reader: ${message}`)
    } catch {
      /* logging must not break the route */
    }
  }

  async function loadLibrary() {
    if (library !== null) return library
    await mkdir(booksDir, { recursive: true })
    const raw = await readOptional(libraryPath)
    if (raw === null) {
      library = { version: 1, books: [] }
      return library
    }
    try {
      const parsed = JSON.parse(raw)
      const books = Array.isArray(parsed?.books) ? parsed.books.map(sanitizeBook).filter(Boolean) : []
      library = { version: 1, books }
    } catch (error) {
      warn(`library.json is unreadable, starting a new shelf: ${String(error?.message ?? error)}`)
      try {
        await rename(libraryPath, `${libraryPath}.corrupt-${Date.now()}`)
      } catch {
        /* keep the original file when the backup cannot be written */
      }
      library = { version: 1, books: [] }
    }
    return library
  }

  async function loadProgress() {
    if (progress !== null) return progress
    const shelf = await loadLibrary()
    const items = {}
    for (const book of shelf.books) {
      if (book.progress) {
        items[book.id] = {
          chapter: Math.max(0, int(book.progress.chapter)),
          ratio: ratio(book.progress.ratio),
          updatedAt: Math.max(0, int(book.progress.updatedAt)),
        }
      }
    }
    const raw = await readOptional(progressPath)
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw)
        const stored = parsed && typeof parsed.items === 'object' && parsed.items !== null ? parsed.items : {}
        for (const [id, value] of Object.entries(stored)) {
          if (!validId(id) || value === null || typeof value !== 'object') continue
          items[id] = {
            chapter: Math.max(0, int(value.chapter)),
            ratio: ratio(value.ratio),
            updatedAt: Math.max(0, int(value.updatedAt)),
          }
        }
      } catch (error) {
        warn(`progress.json is unreadable, using saved book progress: ${String(error?.message ?? error)}`)
      }
    }
    progress = items
    return progress
  }

  async function persistProgress() {
    if (progress === null) return
    await writeAtomic(progressPath, JSON.stringify({ version: 1, items: progress }))
  }

  async function loadSettings() {    if (settings !== null) return settings
    const raw = await readOptional(settingsPath)
    if (raw !== null) {
      try {
        settings = sanitizeSettings(JSON.parse(raw))
        return settings
      } catch {
        warn('settings.json is unreadable, using defaults')
      }
    }
    settings = { ...DEFAULT_SETTINGS }
    return settings
  }

  async function persistLibrary() {
    if (library === null) return
    await writeAtomic(libraryPath, JSON.stringify(library))
  }

  async function persistSettings() {
    if (settings === null) return
    await writeAtomic(settingsPath, JSON.stringify(settings))
  }

  /** @template T @param {() => Promise<T>} operation */
  function mutate(operation) {
    const run = queue.then(operation, operation)
    queue = run.then(() => undefined, () => undefined)
    return run
  }

  async function list() {
    await queue.catch(() => {})
    const shelf = await loadLibrary()
    const saved = await loadProgress()
    return {
      books: shelf.books.map((book) => {
        const entry = saved[book.id] || book.progress || null
        return {
          ...book,
          progress: entry
            ? { chapter: entry.chapter, ratio: entry.ratio, updatedAt: entry.updatedAt }
            : null,
          lastReadAt: entry ? entry.updatedAt : book.lastReadAt || 0,
        }
      }),
    }
  }

  async function importMeta(meta) {
    const input = meta && typeof meta === 'object' ? meta : {}
    const hash = validHash(input.hash) ? input.hash : null
    return mutate(async () => {
      const shelf = await loadLibrary()
      if (hash !== null) {
        const existing = shelf.books.find((book) => book.hash === hash)
        if (existing) {
          return {
            id: existing.id,
            duplicate: true,
            fileExists: existsSync(join(booksDir, `${existing.id}.epub`)),
            book: { ...existing },
          }
        }
      }
      const id = `eb_${randomUUID().replaceAll('-', '').slice(0, 16)}`
      const now = Date.now()
      const book = {
        id,
        title: clip(input.title, 400) || 'Untitled',
        author: clip(input.author, 400),
        cover: validCover(input.cover) ? input.cover : null,
        spineCount: Math.max(0, int(input.spineCount)),
        size: Math.max(0, int(input.size)),
        hash,
        addedAt: now,
        lastReadAt: 0,
        progress: null,
      }
      shelf.books.unshift(book)
      await persistLibrary()
      return { id, duplicate: false, fileExists: false, book: { ...book } }
    })
  }

  async function importFile(id, bytes) {
    if (!validId(id)) throw new ApiError('bad-request', 'unknown book id')
    if (bytes.byteLength === 0) throw new ApiError('bad-request', 'empty file')
    if (bytes.byteLength > MAX_EPUB_BYTES) throw new ApiError('too-large', 'file is too large')
    if (!EPUB_MAGIC.every((byte, index) => bytes[index] === byte)) {
      throw new ApiError('bad-request', 'file is not an EPUB archive')
    }
    return mutate(async () => {
      const shelf = await loadLibrary()
      const book = shelf.books.find((entry) => entry.id === id)
      if (!book) throw new ApiError('not-found', 'book metadata is missing')
      try {
        await mkdir(booksDir, { recursive: true })
        await writeFile(join(booksDir, `${id}.epub`), bytes)
      } catch (error) {
        shelf.books = shelf.books.filter((entry) => entry.id !== id)
        await persistLibrary()
        throw error
      }
      book.size = bytes.byteLength
      await persistLibrary()
      return { id, size: book.size }
    })
  }

  async function getFile(id) {
    const shelf = await loadLibrary()
    const book = shelf.books.find((entry) => entry.id === id)
    if (!book) throw new ApiError('not-found', 'book is not on the shelf')
    try {
      return await readFile(join(booksDir, `${id}.epub`))
    } catch (error) {
      if (error && error.code === 'ENOENT') throw new ApiError('not-found', 'book file is missing')
      throw error
    }
  }

  async function remove(id) {
    return mutate(async () => {
      const shelf = await loadLibrary()
      const index = shelf.books.findIndex((entry) => entry.id === id)
      if (index < 0) throw new ApiError('not-found', 'book is not on the shelf')
      const [book] = shelf.books.splice(index, 1)
      const saved = await loadProgress()
      delete saved[id]
      await persistLibrary()
      await persistProgress()
      try {
        await rm(join(booksDir, `${id}.epub`), { force: true })
      } catch (error) {
        warn(`book file could not be removed: ${String(error?.message ?? error)}`)
      }
      return { id, title: book.title }
    })
  }

  async function update(id, patch) {
    return mutate(async () => {
      const shelf = await loadLibrary()
      const book = shelf.books.find((entry) => entry.id === id)
      if (!book) throw new ApiError('not-found', 'book is not on the shelf')
      if (patch.title !== undefined) book.title = clip(patch.title, 400) || book.title
      if (patch.author !== undefined) book.author = clip(patch.author, 400)
      await persistLibrary()
      return { book: { ...book } }
    })
  }

  async function saveProgress(id, chapter, value) {
    return mutate(async () => {
      const shelf = await loadLibrary()
      const book = shelf.books.find((entry) => entry.id === id)
      if (!book) throw new ApiError('not-found', 'book is not on the shelf')
      const now = Date.now()
      const nextChapter = Math.max(0, Math.min(Math.max(0, book.spineCount - 1), int(chapter)))
      const saved = await loadProgress()
      saved[id] = { chapter: nextChapter, ratio: ratio(value), updatedAt: now }
      await persistProgress()
      return { id, progress: { ...saved[id] } }
    })
  }

  async function readSettings() {
    return { ...(await loadSettings()) }
  }

  async function writeSettings(patch) {
    return mutate(async () => {
      const current = await loadSettings()
      settings = sanitizeSettings({ ...current, ...(patch && typeof patch === 'object' ? patch : {}) })
      await persistSettings()
      return { ...settings }
    })
  }

  return { list, importMeta, importFile, getFile, remove, update, saveProgress, readSettings, writeSettings }
}

/** @param {Request} request @param {ReturnType<typeof createStore>} store */
async function handleRequest(request, store) {
  try {
    const op = text(request.headers.get('x-ebook-op'))
    switch (op) {
      case 'list':
        return success(await store.list())

      case 'import-meta': {
        const body = await readJson(request)
        return success(await store.importMeta(body.meta))
      }

      case 'import-file': {
        const id = text(request.headers.get('x-ebook-id'))
        if (!validId(id)) return failure('bad-request', 'unknown book id')
        const length = Number(request.headers.get('content-length') || 0)
        if (length > MAX_EPUB_BYTES) return failure('too-large', 'file is too large')
        const bytes = new Uint8Array(await request.arrayBuffer())
        return success(await store.importFile(id, bytes))
      }

      case 'file': {
        const id = text(request.headers.get('x-ebook-id'))
        if (!validId(id)) return failure('bad-request', 'unknown book id')
        const bytes = await store.getFile(id)
        return new Response(bytes, {
          status: 200,
          headers: {
            'content-type': 'application/epub+zip',
            'content-length': String(bytes.byteLength),
            'cache-control': 'no-store',
          },
        })
      }

      case 'delete': {
        const body = await readJson(request)
        return success(await store.remove(text(body.id)))
      }

      case 'update': {
        const body = await readJson(request)
        const id = text(body.id)
        if (!validId(id)) return failure('bad-request', 'unknown book id')
        return success(await store.update(id, { title: body.title, author: body.author }))
      }

      case 'progress': {
        const body = await readJson(request)
        const id = text(body.id)
        if (!validId(id)) return failure('bad-request', 'unknown book id')
        return success(await store.saveProgress(id, body.chapter, body.ratio))
      }

      case 'settings-get':
        return success(await store.readSettings())

      case 'settings-put': {
        const body = await readJson(request)
        return success(await store.writeSettings(body.settings))
      }

      default:
        return failure('bad-request', `unknown operation: ${op || '(empty)'}`)
    }
  } catch (error) {
    if (error instanceof ApiError) return failure(error.code, error.message)
    return failure('internal', String(error?.message ?? error))
  }
}

/**
 * Host half: register the bookshelf route on the shared `/api` channel.
 * @param {any} ctx
 */
export function apply(ctx) {
  ctx.inject(['connection'], (scope) => {
    const connection = scope.get('connection')
    const register = connection?.fetch?.register
    if (typeof register !== 'function') {
      scope.logger?.warn?.('dsh-ebook-reader: the connection service does not expose fetch.register')
      return
    }
    const store = createStore(ctx)
    try {
      const dispose = register({
        path: ROUTE_PATH,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: (request) => handleRequest(request, store),
      })
      return () => {
        void dispose()
      }
    } catch (error) {
      scope.logger?.warn?.(`dsh-ebook-reader: route registration failed: ${String(error?.message ?? error)}`)
      return
    }
  })
}

export const __test = {
  createStore,
  handleRequest,
  sanitizeBook,
  sanitizeSettings,
  ROUTE_PATH,
}
