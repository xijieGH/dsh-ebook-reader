window.__ModuleLoader__.load({
  id: 'dsh-ebook-reader',
  factory(require) {
    'use strict'

    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useMemo, useCallback } = React
    const useSyncExternalStore = React.useSyncExternalStore

    const NS = 'ebook-reader'
    const PANEL_ID = 'ebook-reader'
    const API_PATH = 'api/ebook-reader/api'
    const DEFAULT_SETTINGS = { fontSize: 18, theme: 'auto', lineHeight: 1.75, maxWidth: 760, lastBookId: null }
    const FONT_MIN = 14
    const FONT_MAX = 28

    // ---------------------------------------------------------------- i18n

    const DICT = {
      en: {
        'panel.title': 'E-books',
        'shelf.title': 'Bookshelf',
        'shelf.summary': '{n} books · stored on this machine',
        'shelf.summaryOne': '1 book · stored on this machine',
        'shelf.searchPlaceholder': 'Search title or author',
        'shelf.sortLabel': 'Sort books',
        'sort.recent': 'Recently read',
        'sort.added': 'Recently added',
        'sort.title': 'Title',
        'sort.author': 'Author',
        'shelf.import': 'Import EPUB',
        'shelf.continue': 'Continue reading',
        'shelf.unknownAuthor': 'Unknown author',
        'shelf.untitled': 'Untitled book',
        'shelf.unread': 'Unread',
        'shelf.chapterCount': '{n} chapters',
        'shelf.noResults': 'No matching books',
        'shelf.noResultsHint': 'Try another title or author.',
        'shelf.loading': 'Loading the bookshelf…',
        'shelf.loadError': 'The bookshelf could not be loaded.',
        'shelf.retry': 'Try again',
        'empty.title': 'Your bookshelf is empty',
        'empty.body': 'Import EPUB files from this computer. They stay on this machine and appear here next time.',
        'empty.hint': 'You can also drag EPUB files onto this panel.',
        'card.open': 'Open “{title}”',
        'card.edit': 'Edit details',
        'card.delete': 'Remove from shelf',
        'dialog.cancel': 'Cancel',
        'dialog.delete.title': 'Remove this book?',
        'dialog.delete.body': '“{title}” and its reading position will be deleted from this machine. This cannot be undone.',
        'dialog.delete.confirm': 'Remove',
        'dialog.edit.title': 'Edit details',
        'dialog.edit.titleLabel': 'Title',
        'dialog.edit.authorLabel': 'Author',
        'dialog.save': 'Save',
        'reader.back': 'Back to bookshelf',
        'reader.toc': 'Table of contents',
        'reader.closeToc': 'Close table of contents',
        'reader.fontSmaller': 'Smaller text',
        'reader.fontLarger': 'Larger text',
        'reader.theme': 'Reading theme',
        'reader.prev': 'Previous chapter',
        'reader.next': 'Next chapter',
        'reader.chapterN': 'Chapter {n}',
        'reader.chapterOf': 'Chapter {n} of {total}',
        'reader.progressTitle': 'Reading progress',
        'reader.loading': 'Opening the book…',
        'reader.error': 'This book could not be opened',
        'reader.retry': 'Try again',
        'reader.missingChapter': 'This chapter is empty or missing.',
        'reader.noToc': 'This book has no table of contents.',
        'theme.auto': 'Auto',
        'theme.light': 'Light',
        'theme.sepia': 'Sepia',
        'theme.dark': 'Dark',
        'import.reading': 'Reading file…',
        'import.parsing': 'Parsing EPUB…',
        'import.saving': 'Saving…',
        'import.done': 'Added',
        'import.duplicate': 'Already on the shelf',
        'import.failed': 'Failed',
        'toast.imported': 'Added “{title}”',
        'toast.exists': '“{title}” is already on the shelf',
        'toast.deleted': 'Removed “{title}”',
        'toast.saved': 'Details saved',
        'toast.notEpub': 'Choose an EPUB file.',
        'error.invalidEpub': 'This file is not a valid EPUB.',
        'error.drm': 'This EPUB is protected by DRM and cannot be opened here.',
        'error.zip': 'This EPUB archive is damaged or uses an unsupported format.',
        'error.noInflate': 'This environment cannot decompress the EPUB.',
        'error.notFound': 'The book file is missing from this machine.',
        'error.tooLarge': 'The file is too large for the local bookshelf.',
        'error.network': 'The local book storage could not be reached.',
        'error.generic': 'Something went wrong: {message}',
      },
      zh: {
        'panel.title': '电子书',
        'shelf.title': '书架',
        'shelf.summary': '共 {n} 本 · 保存在本机',
        'shelf.summaryOne': '共 1 本 · 保存在本机',
        'shelf.searchPlaceholder': '搜索书名或作者',
        'shelf.sortLabel': '书架排序',
        'sort.recent': '最近阅读',
        'sort.added': '最近添加',
        'sort.title': '书名',
        'sort.author': '作者',
        'shelf.import': '导入 EPUB',
        'shelf.continue': '继续阅读',
        'shelf.unknownAuthor': '未知作者',
        'shelf.untitled': '未命名电子书',
        'shelf.unread': '未读',
        'shelf.chapterCount': '{n} 章',
        'shelf.noResults': '没有匹配的电子书',
        'shelf.noResultsHint': '换个书名或作者试试。',
        'shelf.loading': '正在加载书架…',
        'shelf.loadError': '书架加载失败。',
        'shelf.retry': '重试',
        'empty.title': '书架还是空的',
        'empty.body': '导入本机的 EPUB 文件，它们会保存在这台电脑上，下次打开仍然在这里。',
        'empty.hint': '也可以把 EPUB 文件直接拖到这个面板。',
        'card.open': '打开《{title}》',
        'card.edit': '编辑信息',
        'card.delete': '从书架删除',
        'dialog.cancel': '取消',
        'dialog.delete.title': '删除这本书？',
        'dialog.delete.body': '《{title}》及其阅读进度将从本机删除，且无法恢复。',
        'dialog.delete.confirm': '删除',
        'dialog.edit.title': '编辑信息',
        'dialog.edit.titleLabel': '书名',
        'dialog.edit.authorLabel': '作者',
        'dialog.save': '保存',
        'reader.back': '返回书架',
        'reader.toc': '目录',
        'reader.closeToc': '关闭目录',
        'reader.fontSmaller': '缩小字号',
        'reader.fontLarger': '放大字号',
        'reader.theme': '阅读配色',
        'reader.prev': '上一章',
        'reader.next': '下一章',
        'reader.chapterN': '第 {n} 章',
        'reader.chapterOf': '第 {n} 章 / 共 {total} 章',
        'reader.progressTitle': '阅读进度',
        'reader.loading': '正在打开电子书…',
        'reader.error': '这本书无法打开',
        'reader.retry': '重试',
        'reader.missingChapter': '本章内容为空或缺失。',
        'reader.noToc': '这本书没有目录。',
        'theme.auto': '跟随',
        'theme.light': '浅色',
        'theme.sepia': '护眼',
        'theme.dark': '深色',
        'import.reading': '读取文件…',
        'import.parsing': '解析 EPUB…',
        'import.saving': '保存中…',
        'import.done': '已加入',
        'import.duplicate': '书架中已有',
        'import.failed': '失败',
        'toast.imported': '已加入《{title}》',
        'toast.exists': '《{title}》已在书架中',
        'toast.deleted': '已删除《{title}》',
        'toast.saved': '信息已保存',
        'toast.notEpub': '请选择 EPUB 文件。',
        'error.invalidEpub': '这个文件不是有效的 EPUB。',
        'error.drm': '这本 EPUB 受 DRM 保护，无法在这里打开。',
        'error.zip': 'EPUB 压缩包损坏，或使用了暂不支持的格式。',
        'error.noInflate': '当前环境无法解压这本电子书。',
        'error.notFound': '本机上的书籍文件已丢失。',
        'error.tooLarge': '文件太大，无法保存到本地书架。',
        'error.network': '无法连接本地书籍存储。',
        'error.generic': '出了点问题：{message}',
      },
    }

    function languageOf(localeId) {
      return String(localeId || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
    }

    function translate(localeId, key, vars) {
      const language = languageOf(localeId)
      let text = DICT[language][key] ?? DICT.en[key] ?? key
      if (vars) {
        text = text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] === undefined ? match : String(vars[name])))
      }
      return text
    }

    function useLocaleId(locale) {
      const subscribe = useCallback((callback) => locale.subscribe(callback), [locale])
      const snapshot = useCallback(() => locale.getSnapshot(), [locale])
      const state = useSyncExternalStore(subscribe, snapshot, snapshot)
      return (state && (state.active || state.locale)) || 'en'
    }

    // ------------------------------------------------------------- helpers

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    }

    function classNames(...values) {
      return values.filter(Boolean).join(' ')
    }

    function percentOf(book) {
      const total = book && book.spineCount > 0 ? book.spineCount : 0
      const progress = book && book.progress
      if (!total || !progress) return 0
      const raw = ((clamp(progress.chapter, 0, total - 1) + clamp(progress.ratio, 0, 1)) / total) * 100
      return raw >= 99.5 ? 100 : Math.max(0, Math.round(raw))
    }

    function initialOf(title) {
      const value = String(title || '').trim()
      if (!value) return '?'
      const first = Array.from(value)[0]
      return /[a-z]/i.test(first) ? first.toUpperCase() : first
    }

    function decodeBytes(bytes) {
      let text = new TextDecoder('utf-8').decode(bytes)
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
      return text
    }

    function isEpubFile(name) {
      return /\.epub$/i.test(String(name || ''))
    }

    // The value reset clears the live FileList, so copy it before resetting:
    // otherwise a file picked through the native input imports nothing.
    function takePickedFiles(input) {
      const files = Array.from((input && input.files) || [])
      if (input) input.value = ''
      return files
    }

    function localNameOf(element) {
      const name = (element && (element.localName || element.tagName)) || ''
      return String(name).toLowerCase().split(':').pop()
    }

    function elements(root, name) {
      if (!root) return []
      const wanted = String(name).toLowerCase()
      if (typeof root.getElementsByTagNameNS === 'function') {
        try {
          const list = root.getElementsByTagNameNS('*', name)
          if (list && list.length) return Array.from(list)
        } catch {
          /* fall through */
        }
      }
      try {
        const list = root.getElementsByTagName(name)
        if (list && list.length) return Array.from(list)
      } catch {
        /* fall through */
      }
      try {
        return Array.from(root.getElementsByTagName('*')).filter((element) => localNameOf(element) === wanted)
      } catch {
        return []
      }
    }

    function attr(element, name) {
      if (!element || typeof element.getAttribute !== 'function') return null
      const value = element.getAttribute(name)
      return value === null || value === undefined ? null : String(value).trim()
    }

    function textOf(element) {
      if (!element) return ''
      return String(element.textContent || '').replace(/\s+/g, ' ').trim()
    }

    function directChild(element, name) {
      if (!element || !element.childNodes) return null
      const wanted = String(name).toLowerCase()
      for (let index = 0; index < element.childNodes.length; index += 1) {
        const node = element.childNodes[index]
        if (node && node.nodeType === 1 && localNameOf(node) === wanted) return node
      }
      return null
    }

    function childElements(element) {
      if (!element || !element.childNodes) return []
      const result = []
      for (let index = 0; index < element.childNodes.length; index += 1) {
        const node = element.childNodes[index]
        if (node && node.nodeType === 1) result.push(node)
      }
      return result
    }

    function dirOf(path) {
      const value = String(path || '')
      const index = value.lastIndexOf('/')
      return index < 0 ? '' : value.slice(0, index + 1)
    }

    function splitHref(href) {
      const raw = String(href || '')
      const hashIndex = raw.indexOf('#')
      const fragment = hashIndex >= 0 ? raw.slice(hashIndex + 1) : ''
      const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw
      const queryIndex = withoutHash.indexOf('?')
      const file = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash
      let decodedFragment = fragment
      try {
        decodedFragment = decodeURIComponent(fragment)
      } catch {
        /* keep the raw fragment */
      }
      return { file, fragment: decodedFragment }
    }

    function resolveHref(baseDir, href) {
      const { file, fragment } = splitHref(href)
      const value = String(file || '').trim()
      if (!value) {
        return { external: false, path: '', fragment: fragment || null }
      }
      let decoded = value
      try {
        decoded = decodeURIComponent(value)
      } catch {
        /* keep the raw value */
      }
      if (/^[a-z][a-z0-9+.-]*:/i.test(decoded) || decoded.startsWith('//')) {
        return { external: true, path: decoded, fragment: fragment || null }
      }
      const joined = decoded.startsWith('/') ? decoded.slice(1) : `${baseDir || ''}${decoded}`
      const segments = []
      for (const part of joined.split('/')) {
        if (!part || part === '.') continue
        if (part === '..') segments.pop()
        else segments.push(part)
      }
      return { external: false, path: segments.join('/'), fragment: fragment || null }
    }

    function mediaTypeOf(path) {
      const lower = String(path || '').toLowerCase()
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
      if (lower.endsWith('.png')) return 'image/png'
      if (lower.endsWith('.gif')) return 'image/gif'
      if (lower.endsWith('.webp')) return 'image/webp'
      if (lower.endsWith('.svg')) return 'image/svg+xml'
      if (lower.endsWith('.bmp')) return 'image/bmp'
      if (lower.endsWith('.avif')) return 'image/avif'
      if (lower.endsWith('.woff')) return 'font/woff'
      if (lower.endsWith('.woff2')) return 'font/woff2'
      if (lower.endsWith('.ttf')) return 'font/ttf'
      if (lower.endsWith('.otf')) return 'font/otf'
      if (lower.endsWith('.css')) return 'text/css'
      return 'application/octet-stream'
    }

    function animationFrame(win, callback) {
      if (win && typeof win.requestAnimationFrame === 'function') return win.requestAnimationFrame(callback)
      return setTimeout(callback, 16)
    }

    function cancelFrame(win, handle) {
      if (win && typeof win.cancelAnimationFrame === 'function') win.cancelAnimationFrame(handle)
      else clearTimeout(handle)
    }

    // ----------------------------------------------------------- ZIP/EPUB

    class EpubError extends Error {
      constructor(code, message) {
        super(message)
        this.code = code
        this.name = 'EpubError'
      }
    }

    class RequestError extends Error {
      constructor(code, message) {
        super(message)
        this.code = code
        this.name = 'RequestError'
      }
    }

    function createZipReader(input) {
      const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      let eocd = -1
      const stop = Math.max(0, bytes.length - 22 - 0xffff)
      for (let index = bytes.length - 22; index >= stop; index -= 1) {
        if (view.getUint32(index, true) === 0x06054b50) {
          eocd = index
          break
        }
      }
      if (eocd < 0) throw new EpubError('not-zip', 'the file is not a ZIP archive')
      const count = view.getUint16(eocd + 10, true)
      const directoryOffset = view.getUint32(eocd + 16, true)
      if (directoryOffset >= bytes.length) throw new EpubError('zip-corrupt', 'the ZIP directory is out of range')
      const entries = new Map()
      let pointer = directoryOffset
      for (let index = 0; index < count; index += 1) {
        if (pointer + 46 > bytes.length) throw new EpubError('zip-corrupt', 'the ZIP directory is truncated')
        if (view.getUint32(pointer, true) !== 0x02014b50) throw new EpubError('zip-corrupt', 'invalid ZIP directory entry')
        const method = view.getUint16(pointer + 10, true)
        const compressedSize = view.getUint32(pointer + 20, true)
        const uncompressedSize = view.getUint32(pointer + 24, true)
        const nameLength = view.getUint16(pointer + 28, true)
        const extraLength = view.getUint16(pointer + 30, true)
        const commentLength = view.getUint16(pointer + 32, true)
        const localOffset = view.getUint32(pointer + 42, true)
        const nameBytes = bytes.subarray(pointer + 46, pointer + 46 + nameLength)
        const name = new TextDecoder('utf-8').decode(nameBytes)
        entries.set(name, { name, method, compressedSize, uncompressedSize, localOffset })
        pointer += 46 + nameLength + extraLength + commentLength
      }

      const cache = new Map()

      async function read(name) {
        if (cache.has(name)) return cache.get(name)
        const entry = entries.get(name)
        if (!entry) {
          cache.set(name, null)
          return null
        }
        const promise = (async () => {
          const localOffset = entry.localOffset
          if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034b50) {
            throw new EpubError('zip-corrupt', `invalid local header for ${name}`)
          }
          if (entry.compressedSize === 0xffffffff || entry.uncompressedSize === 0xffffffff) {
            throw new EpubError('zip64', 'ZIP64 archives are not supported')
          }
          const nameLength = view.getUint16(localOffset + 26, true)
          const extraLength = view.getUint16(localOffset + 28, true)
          const start = localOffset + 30 + nameLength + extraLength
          const raw = bytes.subarray(start, start + entry.compressedSize)
          if (raw.length !== entry.compressedSize) throw new EpubError('zip-corrupt', `truncated entry ${name}`)
          let output
          if (entry.method === 0) {
            output = raw
          } else if (entry.method === 8) {
            if (typeof DecompressionStream !== 'function') {
              throw new EpubError('no-inflate', 'DecompressionStream is unavailable')
            }
            const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
            output = new Uint8Array(await new Response(stream).arrayBuffer())
          } else {
            throw new EpubError('zip-method', `unsupported compression method ${entry.method}`)
          }
          return { bytes: output }
        })()
        cache.set(name, promise)
        return promise
      }

      async function text(name) {
        const record = await read(name)
        return record ? decodeBytes(record.bytes) : null
      }

      return {
        entries,
        has: (name) => entries.has(name),
        readBytes: read,
        text,
      }
    }

    function parseXmlStrict(source) {
      const parser = new DOMParser()
      let doc = null
      try {
        doc = parser.parseFromString(source, 'application/xhtml+xml')
      } catch {
        doc = null
      }
      if (!doc || elements(doc, 'parsererror').length > 0) {
        try {
          doc = parser.parseFromString(source, 'text/html')
        } catch {
          doc = null
        }
      }
      if (!doc) throw new EpubError('invalid-xml', 'the document could not be parsed')
      return doc
    }

    function parseXmlSafe(source) {
      try {
        return parseXmlStrict(source)
      } catch {
        return null
      }
    }

    function extractMetadata(opf) {
      const metadata = elements(opf, 'metadata')[0] || opf
      const title = textOf(elements(metadata, 'title')[0])
      const authors = elements(metadata, 'creator')
        .map((element) => textOf(element))
        .filter(Boolean)
      const language = textOf(elements(metadata, 'language')[0])
      const identifier = textOf(elements(metadata, 'identifier')[0])
      return { title, author: authors.join(' / '), language, identifier }
    }

    function findCoverItem(opf, manifest) {
      for (const meta of elements(opf, 'meta')) {
        if (String(attr(meta, 'name') || '').toLowerCase() === 'cover') {
          const id = attr(meta, 'content')
          if (id && manifest.has(id)) return manifest.get(id)
        }
      }
      for (const item of manifest.values()) {
        if (item.properties.includes('cover-image')) return item
      }
      for (const item of manifest.values()) {
        if (!/(^|[^a-z])(cover|front)/i.test(`${item.id} ${item.path}`)) continue
        if (/^image\//.test(item.mediaType) || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(item.path)) return item
      }
      return null
    }

    async function findCoverByScan(zip, spine) {
      for (const item of spine.slice(0, 3)) {
        const source = await zip.text(item.path)
        if (!source) continue
        const doc = parseXmlSafe(source)
        if (!doc) continue
        const body = doc.body || doc.documentElement
        if (!body) continue
        const candidate = body.querySelector ? body.querySelector('img, image') : null
        if (!candidate) continue
        const href = attr(candidate, 'src') || attr(candidate, 'xlink:href') || attr(candidate, 'href')
        if (!href) continue
        const resolved = resolveHref(dirOf(item.path), href)
        if (resolved.external || !zip.has(resolved.path)) continue
        const record = await zip.readBytes(resolved.path)
        if (record) return { bytes: record.bytes, mediaType: mediaTypeOf(resolved.path) }
      }
      return null
    }

    function pickTocNav(doc) {
      const navs = elements(doc, 'nav')
      for (const nav of navs) {
        const type = attr(nav, 'epub:type') || attr(nav, 'type') || ''
        const role = attr(nav, 'role') || ''
        if (/\btoc\b/.test(type) || role === 'doc-toc') return nav
      }
      return navs[0] || null
    }

    function walkNavList(list, depth, out) {
      if (!list) return
      for (const item of childElements(list)) {
        if (localNameOf(item) !== 'li') continue
        const link = directChild(item, 'a')
        const span = directChild(item, 'span')
        const labelElement = link || span
        const label = textOf(labelElement)
        const href = link ? attr(link, 'href') : null
        const sublist = directChild(item, 'ol') || directChild(item, 'ul')
        if (label) out.push({ label, href, depth })
        if (sublist) walkNavList(sublist, depth + 1, out)
        if (!label && !sublist) {
          const fallback = textOf(item)
          if (fallback) out.push({ label: fallback, href: null, depth })
        }
      }
    }

    function parseNcx(ncx) {
      const out = []
      const navMap = elements(ncx, 'navMap')[0]
      if (!navMap) return out
      const walk = (parent, depth) => {
        for (const point of childElements(parent)) {
          if (localNameOf(point) !== 'navpoint') continue
          const navLabel = directChild(point, 'navLabel')
          const label = textOf(navLabel ? directChild(navLabel, 'text') : null)
          const content = directChild(point, 'content')
          const src = attr(content, 'src')
          if (label) out.push({ label, href: src, depth })
          walk(point, depth + 1)
        }
      }
      walk(navMap, 0)
      return out
    }

    function mapTocEntries(entries, tocPath, spineIndexByPath) {
      const mapped = []
      for (const entry of entries) {
        if (!entry.href) continue
        const resolved = resolveHref(dirOf(tocPath), entry.href)
        if (resolved.external || !resolved.path) continue
        const chapter = spineIndexByPath.get(resolved.path)
        if (chapter === undefined) continue
        mapped.push({
          label: entry.label || '',
          chapter,
          fragment: resolved.fragment || null,
          depth: Math.max(0, entry.depth || 0),
        })
      }
      return mapped
    }

    async function detectDrm(zip, spine) {
      const source = await zip.text('META-INF/encryption.xml')
      if (!source) return false
      const doc = parseXmlSafe(source)
      if (!doc) return false
      const spinePaths = new Set(spine.map((item) => item.path))
      for (const reference of elements(doc, 'CipherReference')) {
        const uri = attr(reference, 'URI')
        if (!uri) continue
        const resolved = resolveHref('', uri)
        if (!resolved.external && spinePaths.has(resolved.path)) return true
      }
      return false
    }

    async function parseEpub(input) {
      const buffer = input instanceof ArrayBuffer
        ? input
        : input && input.buffer
          ? input.buffer.slice(input.byteOffset || 0, (input.byteOffset || 0) + input.byteLength)
          : input
      const zip = createZipReader(buffer)

      const containerSource = await zip.text('META-INF/container.xml')
      if (!containerSource) throw new EpubError('missing-container', 'META-INF/container.xml is missing')
      const container = parseXmlStrict(containerSource)
      const rootfile = elements(container, 'rootfile').find((element) => attr(element, 'full-path'))
      const opfPath = rootfile ? attr(rootfile, 'full-path') : null
      if (!opfPath) throw new EpubError('missing-opf', 'the EPUB package document is not declared')

      const opfSource = await zip.text(opfPath)
      if (!opfSource) throw new EpubError('missing-opf', 'the EPUB package document is missing')
      const opf = parseXmlStrict(opfSource)
      const baseDir = dirOf(opfPath)
      const metadata = extractMetadata(opf)

      const manifest = new Map()
      for (const item of elements(opf, 'item')) {
        const id = attr(item, 'id')
        const href = attr(item, 'href')
        if (!id || !href) continue
        manifest.set(id, {
          id,
          href,
          path: resolveHref(baseDir, href).path,
          mediaType: String(attr(item, 'media-type') || '').toLowerCase(),
          properties: String(attr(item, 'properties') || '')
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean),
        })
      }

      const spine = []
      for (const reference of elements(opf, 'itemref')) {
        const linear = String(attr(reference, 'linear') || 'yes').toLowerCase()
        if (linear === 'no') continue
        const item = manifest.get(attr(reference, 'idref'))
        if (!item) continue
        const isHtml = /xhtml|html/.test(item.mediaType) || /\.x?html?$/i.test(item.path)
        if (!isHtml && item.mediaType && !item.mediaType.includes('xml')) continue
        spine.push(item)
      }
      if (spine.length === 0) throw new EpubError('empty-spine', 'the EPUB has no readable chapters')

      if (await detectDrm(zip, spine)) {
        throw new EpubError('drm', 'the EPUB content is encrypted')
      }

      const spineIndexByPath = new Map(spine.map((item, index) => [item.path, index]))
      let toc = []
      const navItem = Array.from(manifest.values()).find((item) => item.properties.includes('nav'))
      if (navItem) {
        const source = await zip.text(navItem.path)
        const doc = source ? parseXmlSafe(source) : null
        const nav = doc ? pickTocNav(doc) : null
        if (nav) {
          const entries = []
          let list = localNameOf(nav) === 'ol' || localNameOf(nav) === 'ul' ? nav : null
          if (!list && nav.querySelector) list = nav.querySelector('ol, ul')
          walkNavList(list, 0, entries)
          toc = mapTocEntries(entries, navItem.path, spineIndexByPath)
        }
      }
      if (toc.length === 0) {
        const ncxItem = Array.from(manifest.values()).find((item) => item.mediaType.includes('dtbncx') || /\.ncx$/i.test(item.path))
        if (ncxItem) {
          const source = await zip.text(ncxItem.path)
          const doc = source ? parseXmlSafe(source) : null
          if (doc) toc = mapTocEntries(parseNcx(doc), ncxItem.path, spineIndexByPath)
        }
      }

      const titles = new Array(spine.length).fill('')
      for (const entry of toc) {
        if (entry.chapter >= 0 && entry.chapter < titles.length && !titles[entry.chapter]) titles[entry.chapter] = entry.label
      }

      let cover = null
      const coverItem = findCoverItem(opf, manifest)
      if (coverItem) {
        const record = await zip.readBytes(coverItem.path)
        if (record) cover = { bytes: record.bytes, mediaType: mediaTypeOf(coverItem.path) }
      }
      if (!cover) cover = await findCoverByScan(zip, spine)

      return {
        buffer,
        zip,
        opfPath,
        baseDir,
        manifest,
        spine,
        toc,
        titles,
        cover,
        title: metadata.title || '',
        author: metadata.author || '',
        language: metadata.language || '',
        identifier: metadata.identifier || '',
      }
    }

    // -------------------------------------------------------- chapter view

    const PALETTES = {
      light: { bg: '#f7f6f2', fg: '#26272b', muted: '#6d6b66', line: '#e2ded4', accent: '#2f5f9e', mark: '#f1c56b' },
      sepia: { bg: '#f4ecd8', fg: '#4a3a28', muted: '#7c6a51', line: '#e2d3b4', accent: '#8a5a2b', mark: '#d9b56d' },
      dark: { bg: '#17181b', fg: '#d9d6cf', muted: '#9a968e', line: '#2c2e33', accent: '#8ab4e8', mark: '#9b7a3f' },
    }

    function isHostDark() {
      try {
        if (document.body && document.body.hasAttribute('data-ds-dark-theme')) return true
        if (document.documentElement && document.documentElement.getAttribute('data-theme') === 'dark') return true
      } catch {
        /* ignore */
      }
      return false
    }

    function paletteFor(settings, hostDark) {
      const theme = settings.theme === 'auto' ? (hostDark ? 'dark' : 'light') : settings.theme
      return PALETTES[theme] || PALETTES.light
    }

    function readerCss(settings, hostDark) {
      const palette = paletteFor(settings, hostDark)
      const dark = palette === PALETTES.dark
      const fontSize = clamp(Number(settings.fontSize) || 18, FONT_MIN, FONT_MAX)
      const lineHeight = clamp(Number(settings.lineHeight) || 1.75, 1.3, 2.2)
      const maxWidth = clamp(Number(settings.maxWidth) || 760, 480, 1100)
      return `
:root{color-scheme:${dark ? 'dark' : 'light'};--ere-bg:${palette.bg};--ere-fg:${palette.fg};--ere-muted:${palette.muted};--ere-line:${palette.line};--ere-accent:${palette.accent};--ere-mark:${palette.mark}}
html{background:var(--ere-bg)}
body{margin:0;background:var(--ere-bg);color:var(--ere-fg);font-family:Georgia,"Times New Roman","Songti SC","Noto Serif CJK SC",serif;font-size:${fontSize}px;line-height:${lineHeight};-webkit-text-size-adjust:100%;overflow-wrap:break-word}
.ere-page{max-width:${maxWidth}px;margin:0 auto;padding:40px clamp(18px,5vw,56px) 84px;box-sizing:border-box}
p{margin:0 0 .9em;text-align:justify}
h1,h2,h3,h4,h5,h6{line-height:1.32;margin:1.7em 0 .7em;font-weight:600;letter-spacing:.01em}
h1{font-size:1.6em}h2{font-size:1.36em}h3{font-size:1.18em}h4,h5,h6{font-size:1.05em}
a{color:var(--ere-accent);text-decoration:underline;text-underline-offset:2px;cursor:pointer}
img,svg,video{max-width:100%;height:auto}
figure{margin:1.4em 0;text-align:center}
figcaption{font-size:.85em;color:var(--ere-muted);margin-top:.5em}
blockquote{margin:1.2em 0;padding:.2em 1em;border-left:3px solid var(--ere-line);color:var(--ere-muted)}
pre,code,kbd,samp{font-family:"Cascadia Code",Menlo,Consolas,monospace}
pre{white-space:pre-wrap;background:color-mix(in srgb,var(--ere-fg) 6%,transparent);padding:12px 14px;border-radius:6px;font-size:.86em;line-height:1.55;overflow-x:auto}
code{font-size:.9em}
hr{border:0;border-top:1px solid var(--ere-line);margin:2.2em 0}
table{border-collapse:collapse;max-width:100%;margin:1.2em 0;font-size:.94em}
th,td{border:1px solid var(--ere-line);padding:.4em .6em;text-align:left}
ul,ol{margin:0 0 1em;padding-left:1.6em}
li{margin:.25em 0}
small{color:var(--ere-muted)}
sup,sub{line-height:0}
ruby{ruby-align:center}
rt{font-size:.55em}
::selection{background:color-mix(in srgb,var(--ere-mark) 55%,transparent)}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--ere-fg) 22%,transparent);border-radius:6px;border:3px solid var(--ere-bg)}
::-webkit-scrollbar-track{background:transparent}
.ere-missing{color:var(--ere-muted);font-style:italic;padding:40px 0;text-align:center}
`
    }

    function pageHtml(bodyHtml, extraCss, settings, hostDark) {
      return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style id="ere-reader-style">${readerCss(settings, hostDark)}</style>${extraCss ? `<style>${extraCss}</style>` : ''}</head><body><div class="ere-page">${bodyHtml}</div></body></html>`
    }

    async function assetUrl(raw, baseDir, zip, registerUrl) {
      const value = String(raw || '').trim()
      if (!value || value.startsWith('#') || /^data:/i.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) {
        return value ? `url("${value.replace(/"/g, '\\"')}")` : 'none'
      }
      const resolved = resolveHref(baseDir, value)
      if (resolved.external || !resolved.path) return 'none'
      const record = await zip.readBytes(resolved.path)
      if (!record) return 'none'
      return `url("${registerUrl(record.bytes, mediaTypeOf(resolved.path))}")`
    }

    async function processCss(css, baseDir, zip, registerUrl, depth) {
      if (!css) return ''
      let output = css
      if (depth < 3) {
        const importPattern = /@import\s+(?:url\(\s*(['"]?)([^'")]+)\1\s*\)|(['"])([^'"]+)\3)\s*([^;]*);/gi
        const imports = []
        let match
        while ((match = importPattern.exec(css)) !== null) {
          imports.push({ full: match[0], href: (match[2] || match[4] || '').trim(), media: String(match[5] || '').trim() })
        }
        for (const item of imports) {
          const resolved = resolveHref(baseDir, item.href)
          const source = resolved.external || !resolved.path ? null : await zip.text(resolved.path)
          let replacement = ''
          if (source) {
            const nested = await processCss(source, dirOf(resolved.path), zip, registerUrl, depth + 1)
            replacement = item.media ? `@media ${item.media}{${nested}}` : nested
          }
          output = output.replace(item.full, () => replacement)
        }
      }
      const urlPattern = /url\(\s*(?:'([^']*)'|"([^"]*)"|([^)'"\s]+))\s*\)/gi
      const chunks = []
      let cursor = 0
      let found
      while ((found = urlPattern.exec(output)) !== null) {
        const raw = (found[1] ?? found[2] ?? found[3] ?? '').trim()
        const replacement = await assetUrl(raw, baseDir, zip, registerUrl)
        chunks.push(output.slice(cursor, found.index), replacement)
        cursor = found.index + found[0].length
      }
      chunks.push(output.slice(cursor))
      return chunks.join('')
    }

    function imageSourceOf(element) {
      const tag = localNameOf(element)
      if (tag === 'img') return attr(element, 'src') || attr(element, 'data-src') || null
      return attr(element, 'xlink:href') || attr(element, 'href') || null
    }

    async function buildChapterHtml(epub, index, settings, hostDark, t) {
      const missing = `<p class="ere-missing">${t('reader.missingChapter')}</p>`
      const item = epub.spine[index]
      if (!item) return { html: pageHtml(missing, '', settings, hostDark), urls: [] }
      const source = await epub.zip.text(item.path)
      if (!source) {
        return { html: pageHtml(missing, '', settings, hostDark), urls: [] }
      }

      const urls = []
      const registerUrl = (bytes, mediaType) => {
        const url = URL.createObjectURL(new Blob([bytes], { type: mediaType || 'application/octet-stream' }))
        urls.push(url)
        return url
      }

      let doc = null
      try {
        doc = parseXmlStrict(source)
      } catch {
        doc = null
      }
      if (!doc) {
        const escaped = source.replace(/[<>&]/g, (value) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[value])
        return { html: pageHtml(`<pre>${escaped}</pre>`, '', settings, hostDark), urls }
      }

      for (const element of Array.from(doc.querySelectorAll('script, noscript, iframe, frameset, object, embed, form, meta, base'))) {
        element.remove()
      }

      const styleChunks = []
      for (const link of Array.from(doc.querySelectorAll('link'))) {
        const rel = String(attr(link, 'rel') || '').toLowerCase()
        if (!rel.includes('stylesheet')) continue
        const href = attr(link, 'href')
        if (href) {
          const resolved = resolveHref(dirOf(item.path), href)
          const css = resolved.external || !resolved.path ? null : await epub.zip.text(resolved.path)
          if (css) styleChunks.push(await processCss(css, dirOf(resolved.path), epub.zip, registerUrl, 0))
        }
        link.remove()
      }
      for (const style of Array.from(doc.querySelectorAll('style'))) {
        const css = await processCss(style.textContent || '', dirOf(item.path), epub.zip, registerUrl, 0)
        if (css.trim()) styleChunks.push(css)
        style.remove()
      }

      const body = doc.body || doc.documentElement
      if (!body) {
        return { html: pageHtml('<p class="ere-missing">Chapter</p>', '', settings, hostDark), urls }
      }

      for (const element of Array.from(body.querySelectorAll('img, image'))) {
        const sourceValue = imageSourceOf(element)
        if (!sourceValue) continue
        const resolved = resolveHref(dirOf(item.path), sourceValue)
        if (resolved.external) continue
        const record = resolved.path ? await epub.zip.readBytes(resolved.path) : null
        if (!record) {
          element.remove()
          continue
        }
        const url = registerUrl(record.bytes, mediaTypeOf(resolved.path))
        if (localNameOf(element) === 'img') {
          element.setAttribute('src', url)
          element.removeAttribute('srcset')
          element.removeAttribute('loading')
        } else {
          element.setAttribute('href', url)
          element.setAttribute('xlink:href', url)
        }
      }

      for (const element of body.querySelectorAll('[background]')) {
        const value = attr(element, 'background')
        if (!value) continue
        const resolved = resolveHref(dirOf(item.path), value)
        if (resolved.external) continue
        const record = resolved.path ? await epub.zip.readBytes(resolved.path) : null
        if (record) element.setAttribute('background', registerUrl(record.bytes, mediaTypeOf(resolved.path)))
      }

      for (const element of body.querySelectorAll('[style]')) {
        const value = element.getAttribute('style')
        if (!value || !value.includes('url(')) continue
        element.setAttribute('style', await processCss(value, dirOf(item.path), epub.zip, registerUrl, 0))
      }

      return { html: pageHtml(body.innerHTML, styleChunks.join('\n'), settings, hostDark), urls }
    }

    function applyReaderStyle(doc, settings, hostDark) {
      if (!doc) return
      const style = doc.getElementById('ere-reader-style')
      if (style) style.textContent = readerCss(settings, hostDark)
    }

    function readScrollRatio(doc, win) {
      const scrolling = doc.scrollingElement || doc.documentElement || doc.body
      const max = Math.max(0, (scrolling ? scrolling.scrollHeight : 0) - (win.innerHeight || 0))
      return max > 0 ? clamp(win.scrollY / max, 0, 1) : 0
    }

    function attachChapter(iframe, epub, chapterIndex, target, handlers) {
      const doc = iframe.contentDocument
      const win = iframe.contentWindow
      if (!doc || !win) return null
      applyReaderStyle(doc, handlers.settings, handlers.hostDark)

      const item = epub.spine[chapterIndex]
      const itemPath = item ? item.path : ''
      const spineIndexByPath = new Map(epub.spine.map((entry, index) => [entry.path, index]))

      const restore = () => {
        if (target && target.fragment) {
          let id = target.fragment
          try {
            id = decodeURIComponent(id)
          } catch {
            /* keep the raw fragment */
          }
          const element = doc.getElementById(id) || (doc.getElementsByName && doc.getElementsByName(id)[0])
          if (element && typeof element.scrollIntoView === 'function') {
            element.scrollIntoView()
            return
          }
        }
        if (target && target.ratio > 0) {
          const scrolling = doc.scrollingElement || doc.documentElement
          const max = Math.max(0, (scrolling ? scrolling.scrollHeight : 0) - (win.innerHeight || 0))
          win.scrollTo(0, max * target.ratio)
        }
      }
      restore()
      let restoredTop = win.scrollY

      // Images and fonts finish after load and change scrollHeight. Re-apply the
      // saved position only while the reader has not moved from the restored spot.
      const reapply = () => {
        if (Math.abs(win.scrollY - restoredTop) > 4) return
        restore()
        restoredTop = win.scrollY
      }
      const timers = []
      const imageCleanups = []
      const images = doc.images ? Array.from(doc.images) : []
      for (const image of images) {
        if (image.complete) continue
        const onSettled = () => reapply()
        image.addEventListener('load', onSettled, { once: true })
        image.addEventListener('error', onSettled, { once: true })
        imageCleanups.push(() => {
          image.removeEventListener('load', onSettled)
          image.removeEventListener('error', onSettled)
        })
      }
      timers.push(window.setTimeout(reapply, 120))
      timers.push(window.setTimeout(reapply, 500))

      let frame = 0
      const onScroll = () => {
        if (frame) return
        frame = animationFrame(win, () => {
          frame = 0
          handlers.onRatio(readScrollRatio(doc, win))
        })
      }
      win.addEventListener('scroll', onScroll, { passive: true })

      const onKeyDown = (event) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        const tag = event.target && event.target.tagName ? String(event.target.tagName).toLowerCase() : ''
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          handlers.onPrev()
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          handlers.onNext()
        } else if (event.key === 'Escape' && handlers.onEscape) {
          event.preventDefault()
          handlers.onEscape()
        }
      }
      doc.addEventListener('keydown', onKeyDown)

      const onClick = (event) => {
        const targetElement = event.target
        const anchor = targetElement && targetElement.closest ? targetElement.closest('a[href]') : null
        if (!anchor) return
        event.preventDefault()
        event.stopPropagation()
        const href = anchor.getAttribute('href')
        if (!href) return
        if (href.startsWith('#')) {
          let id = href.slice(1)
          try {
            id = decodeURIComponent(id)
          } catch {
            /* keep the raw fragment */
          }
          const element = doc.getElementById(id)
          if (element && typeof element.scrollIntoView === 'function') element.scrollIntoView()
          return
        }
        const resolved = resolveHref(dirOf(itemPath), href)
        if (resolved.external) return
        const index = spineIndexByPath.get(resolved.path)
        if (index !== undefined) handlers.onNavigate(index, resolved.fragment || null)
      }
      doc.addEventListener('click', onClick)

      handlers.onRatio(readScrollRatio(doc, win))

      return () => {
        win.removeEventListener('scroll', onScroll)
        doc.removeEventListener('click', onClick)
        doc.removeEventListener('keydown', onKeyDown)
        for (const timer of timers) window.clearTimeout(timer)
        for (const cleanup of imageCleanups) cleanup()
        if (frame) cancelFrame(win, frame)
      }
    }

    function revokeUrls(urls) {
      if (!Array.isArray(urls)) return
      for (const url of urls) {
        try {
          URL.revokeObjectURL(url)
        } catch {
          /* ignore */
        }
      }
    }

    async function makeCoverDataUrl(cover) {
      if (!cover || !cover.bytes || !cover.bytes.byteLength) return null
      let objectUrl = null
      try {
        objectUrl = URL.createObjectURL(new Blob([cover.bytes], { type: cover.mediaType || 'image/jpeg' }))
        const image = await new Promise((resolve, reject) => {
          const element = new Image()
          element.onload = () => resolve(element)
          element.onerror = () => reject(new Error('cover image could not be decoded'))
          element.src = objectUrl
        })
        const naturalWidth = image.naturalWidth || image.width || 600
        const naturalHeight = image.naturalHeight || image.height || 900
        const scale = Math.min(360 / naturalWidth, 540 / naturalHeight, 1)
        const width = Math.max(1, Math.round(naturalWidth * scale))
        const height = Math.max(1, Math.round(naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        context.fillStyle = '#f4f1e8'
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        return canvas.toDataURL('image/jpeg', 0.82)
      } catch {
        return null
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }

    async function hashBytes(buffer) {
      try {
        if (!globalThis.crypto || !globalThis.crypto.subtle) return null
        const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer)
        return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
      } catch {
        return null
      }
    }

    function describeError(error, t) {
      const code = error && error.code
      const map = {
        'not-zip': 'error.invalidEpub',
        'missing-container': 'error.invalidEpub',
        'missing-opf': 'error.invalidEpub',
        'empty-spine': 'error.invalidEpub',
        'invalid-xml': 'error.invalidEpub',
        'invalid-epub': 'error.invalidEpub',
        drm: 'error.drm',
        'zip-corrupt': 'error.zip',
        zip64: 'error.zip',
        'zip-method': 'error.zip',
        'no-inflate': 'error.noInflate',
        'not-found': 'error.notFound',
        'too-large': 'error.tooLarge',
        network: 'error.network',
      }
      return t(map[code] || 'error.generic', { message: (error && error.message) || 'unknown' })
    }

    // ---------------------------------------------------------------- API

    function createApi() {
      const endpoint = new URL(API_PATH, document.baseURI).toString()

      async function call(operation, options) {
        const request = options || {}
        const headers = { 'x-ebook-op': operation }
        if (request.json !== undefined) headers['content-type'] = 'application/json'
        if (request.headers) Object.assign(headers, request.headers)
        let body
        if (request.json !== undefined) body = JSON.stringify(request.json)
        else if (request.body !== undefined) body = request.body
        let response
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body,
            credentials: 'same-origin',
            cache: 'no-store',
          })
        } catch (error) {
          throw new RequestError('network', String((error && error.message) || error))
        }
        if (!response.ok) throw new RequestError('network', `HTTP ${response.status}`)
        if (request.binary) return new Uint8Array(await response.arrayBuffer())
        let payload
        try {
          payload = await response.json()
        } catch {
          throw new RequestError('network', 'malformed response')
        }
        if (!payload || payload.ok !== true) {
          const failure = payload && payload.error ? payload.error : {}
          throw new RequestError(failure.code || 'internal', failure.message || 'request failed')
        }
        return payload.value
      }

      return {
        list: async () => {
          const value = await call('list')
          return value && Array.isArray(value.books) ? value.books : []
        },
        importMeta: (meta) => call('import-meta', { json: { meta } }),
        importFile: (id, buffer) => call('import-file', { body: buffer, headers: { 'x-ebook-id': id, 'content-type': 'application/epub+zip' } }),
        getFile: (id) => call('file', { headers: { 'x-ebook-id': id }, binary: true }),
        remove: (id) => call('delete', { json: { id } }),
        update: (id, patch) => call('update', { json: { id, title: patch.title, author: patch.author } }),
        progress: (id, chapter, ratio) => call('progress', { json: { id, chapter, ratio } }),
        getSettings: () => call('settings-get'),
        putSettings: (settings) => call('settings-put', { json: { settings } }),
      }
    }

    // -------------------------------------------------------------- icons

    function icon(paths, size) {
      return h('svg', {
        width: size || 16,
        height: size || 16,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        focusable: 'false',
      }, paths.map((path, index) => h('path', { key: index, d: path })))
    }

    function SidebarIcon(props) {
      const size = typeof props.size === 'number' && props.size > 0 ? props.size : 16
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        focusable: 'false',
      }, [
        h('path', { key: 'left', d: 'M3.5 5.4c3-1.1 5.8-1 8.5.6 2.7-1.6 5.5-1.7 8.5-.6v12.8c-3-1.1-5.8-1-8.5.6-2.7-1.6-5.5-1.7-8.5-.6V5.4Z' }),
        h('path', { key: 'spine', d: 'M12 6v12.8' }),
      ])
    }

    const ICONS = {
      search: icon(['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z', 'm16.2 16.2 4 4']),
      plus: icon(['M12 5v14', 'M5 12h14']),
      trash: icon(['M4 7h16', 'M9 7V4.8h6V7', 'M6.5 7l.8 12.2h9.4L17.5 7', 'M10 11v5', 'M14 11v5']),
      pencil: icon(['m4 20 4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z', 'm13.6 6.6 3.8 3.8']),
      x: icon(['M6 6l12 12', 'M18 6 6 18']),
      chevronLeft: icon(['m14.5 5.5-6.5 6.5 6.5 6.5']),
      chevronRight: icon(['m9.5 5.5 6.5 6.5-6.5 6.5']),
      arrowLeft: icon(['M20 12H5', 'm10 6-6 6 6 6']),
      list: icon(['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01']),
      book: icon(['M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z', 'M4 18.5A2.5 2.5 0 0 1 6.5 16H19']),
      upload: icon(['M12 16V4', 'm7 9 5-5 5 5', 'M4.5 15.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-3.5']),
    }

    // ------------------------------------------------------------- dialog

    function Dialog({ title, description, children, footer, onClose }) {
      const boxRef = useRef(null)
      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
          }
        }
        document.addEventListener('keydown', onKeyDown, true)
        const first = boxRef.current ? boxRef.current.querySelector('input, button') : null
        if (first) first.focus()
        return () => document.removeEventListener('keydown', onKeyDown, true)
      }, [onClose])
      return h('div', {
        className: 'ere-backdrop',
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose()
        },
      }, h('div', {
        className: 'ere-dialog',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': title,
        ref: boxRef,
      },
      h('h2', null, title),
      description ? h('p', null, description) : null,
      children,
      h('div', { className: 'ere-dialog-foot' }, footer)))
    }

    function EditDialog({ book, t, onSave, onClose }) {
      const [title, setTitle] = useState(book.title || '')
      const [author, setAuthor] = useState(book.author || '')
      const invalid = title.trim() === ''
      const submit = () => {
        if (invalid) return
        onSave({ title: title.trim(), author: author.trim() })
      }
      return h(Dialog, {
        title: t('dialog.edit.title'),
        onClose,
        footer: [
          h('button', { key: 'cancel', type: 'button', className: 'ere-btn', onClick: onClose }, t('dialog.cancel')),
          h('button', { key: 'save', type: 'button', className: 'ere-btn ere-btn-primary', disabled: invalid, onClick: submit }, t('dialog.save')),
        ],
      },
      h('label', null, t('dialog.edit.titleLabel')),
      h('input', {
        value: title,
        maxLength: 400,
        'aria-invalid': invalid ? 'true' : 'false',
        onChange: (event) => setTitle(event.target.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter') submit()
        },
      }),
      h('label', null, t('dialog.edit.authorLabel')),
      h('input', {
        value: author,
        maxLength: 400,
        onChange: (event) => setAuthor(event.target.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter') submit()
        },
      }))
    }

    // --------------------------------------------------------------- shelf

    function BookCard({ book, t, onOpen, onEdit, onDelete }) {
      const percent = percentOf(book)
      const author = book.author || t('shelf.unknownAuthor')
      return h('div', { className: 'ere-card' },
        h('button', {
          type: 'button',
          className: 'ere-cover',
          title: t('card.open', { title: book.title }),
          'aria-label': t('card.open', { title: book.title }),
          onClick: onOpen,
        },
        book.cover
          ? h('img', { src: book.cover, alt: '', draggable: false })
          : h('span', { className: 'ere-cover-fallback', 'aria-hidden': 'true' }, initialOf(book.title)),
        percent > 0
          ? h('span', { className: 'ere-cover-progress', 'aria-hidden': 'true' }, h('span', { style: { width: `${percent}%` } }))
          : null),
        h('div', { className: 'ere-card-actions' },
          h('button', {
            type: 'button',
            className: 'ere-card-action',
            title: t('card.edit'),
            'aria-label': t('card.edit'),
            onClick: onEdit,
          }, ICONS.pencil),
          h('button', {
            type: 'button',
            className: 'ere-card-action',
            title: t('card.delete'),
            'aria-label': t('card.delete'),
            onClick: onDelete,
          }, ICONS.trash)),
        h('div', { className: 'ere-card-meta' },
          h('div', { className: 'ere-card-title', title: book.title }, book.title),
          h('div', { className: 'ere-card-sub', title: author }, author),
          h('div', { className: 'ere-card-progress' }, book.progress
            ? `${percent}% · ${t('shelf.chapterCount', { n: book.spineCount || 0 })}`
            : `${t('shelf.unread')} · ${t('shelf.chapterCount', { n: book.spineCount || 0 })}`)))
    }

    function Shelf({ books, loading, error, api, t, onOpen, onRefresh, onEdit, onDelete }) {
      const [query, setQuery] = useState('')
      const [sort, setSort] = useState('recent')
      const [dragging, setDragging] = useState(false)
      const [imports, setImports] = useState([])
      const inputRef = useRef(null)
      const dragDepth = useRef(0)
      const fileInputRef = useRef(null)
      const aliveRef = useRef(true)

      useEffect(() => {
        aliveRef.current = true
        return () => {
          aliveRef.current = false
        }
      }, [])

      const visible = useMemo(() => {
        const needle = query.trim().toLowerCase()
        const list = needle
          ? books.filter((book) => `${book.title} ${book.author}`.toLowerCase().includes(needle))
          : books.slice()
        if (sort === 'title') list.sort((a, b) => String(a.title).localeCompare(String(b.title), 'zh-Hans-CN'))
        else if (sort === 'author') list.sort((a, b) => String(a.author || '').localeCompare(String(b.author || ''), 'zh-Hans-CN'))
        else if (sort === 'added') list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
        else list.sort((a, b) => ((b.lastReadAt || b.addedAt || 0) - (a.lastReadAt || a.addedAt || 0)))
        return list
      }, [books, query, sort])

      const resume = useMemo(() => {
        const read = books.filter((book) => book.progress).slice()
        read.sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))
        return read[0] || null
      }, [books])

      const updateImport = useCallback((key, patch) => {
        setImports((current) => current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)))
      }, [])

      const importFiles = useCallback(async (fileList) => {
        const files = Array.from(fileList || []).filter((file) => isEpubFile(file.name))
        setImports((current) => current.filter((entry) => entry.status !== 'done' && entry.status !== 'error'))
        if (files.length === 0) {
          setImports((current) => [...current, {
            key: `not-epub:${Date.now()}`,
            name: t('toast.notEpub'),
            status: 'error',
            message: '',
          }])
          return
        }
        for (const file of files) {
          const key = `${file.name}:${file.size}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`
          setImports((current) => [...current, { key, name: file.name, status: 'reading', message: '' }])
          try {
            const buffer = await file.arrayBuffer()
            updateImport(key, { status: 'parsing' })
            const epub = await parseEpub(buffer)
            const cover = await makeCoverDataUrl(epub.cover)
            updateImport(key, { status: 'saving' })
            const hash = await hashBytes(buffer)
            const created = await api.importMeta({
              title: epub.title || t('shelf.untitled'),
              author: epub.author,
              cover,
              spineCount: epub.spine.length,
              size: buffer.byteLength,
              hash,
            })
            if (!created.duplicate || !created.fileExists) {
              try {
                await api.importFile(created.id, buffer)
              } catch (uploadError) {
                if (!created.duplicate) await api.remove(created.id).catch(() => {})
                throw uploadError
              }
            }
            if (!aliveRef.current) return
            updateImport(key, { status: 'done', message: created.duplicate ? t('import.duplicate') : t('import.done') })
          } catch (failure) {
            if (!aliveRef.current) return
            updateImport(key, { status: 'error', message: describeError(failure, t) })
          }
        }
        if (aliveRef.current) onRefresh()
      }, [onRefresh, t, updateImport])

      const openPicker = useCallback(() => {
        if (fileInputRef.current) fileInputRef.current.click()
      }, [])

      const onDragEnter = useCallback((event) => {
        if (!event.dataTransfer || !Array.from(event.dataTransfer.types || []).includes('Files')) return
        event.preventDefault()
        dragDepth.current += 1
        setDragging(true)
      }, [])

      const onDragOver = useCallback((event) => {
        if (!event.dataTransfer || !Array.from(event.dataTransfer.types || []).includes('Files')) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }, [])

      const onDragLeave = useCallback((event) => {
        event.preventDefault()
        dragDepth.current = Math.max(0, dragDepth.current - 1)
        if (dragDepth.current === 0) setDragging(false)
      }, [])

      const onDrop = useCallback((event) => {
        if (!event.dataTransfer) return
        event.preventDefault()
        dragDepth.current = 0
        setDragging(false)
        void importFiles(event.dataTransfer.files)
      }, [importFiles])

      const pendingImports = imports.some((entry) => entry.status !== 'done' && entry.status !== 'error')
      const hasImportError = imports.some((entry) => entry.status === 'error')
      useEffect(() => {
        if (pendingImports || imports.length === 0) return
        const timer = window.setTimeout(() => {
          if (aliveRef.current) setImports([])
        }, hasImportError ? 12000 : 2600)
        return () => window.clearTimeout(timer)
      }, [pendingImports, hasImportError, imports.length])

      const summary = books.length === 1 ? t('shelf.summaryOne') : t('shelf.summary', { n: books.length })

      return h('div', {
        className: 'ere-shelf',
        onDragEnter,
        onDragOver,
        onDragLeave,
        onDrop,
      },
      h('input', {
        ref: fileInputRef,
        type: 'file',
        accept: '.epub,application/epub+zip',
        multiple: true,
        style: { display: 'none' },
        onChange: (event) => {
          void importFiles(takePickedFiles(event.target))
        },
      }),
      h('div', { className: 'ere-shelf-head' },
        h('div', { className: 'ere-heading' },
          h('h1', null, t('shelf.title')),
          h('p', null, loading ? t('shelf.loading') : summary)),
        h('div', { className: 'ere-toolbar' },
          h('label', { className: 'ere-search' },
            ICONS.search,
            h('input', {
              ref: inputRef,
              type: 'search',
              value: query,
              placeholder: t('shelf.searchPlaceholder'),
              'aria-label': t('shelf.searchPlaceholder'),
              onChange: (event) => setQuery(event.target.value),
            })),
          h('select', {
            className: 'ere-select',
            value: sort,
            'aria-label': t('shelf.sortLabel'),
            title: t('shelf.sortLabel'),
            onChange: (event) => setSort(event.target.value),
          },
          h('option', { value: 'recent' }, t('sort.recent')),
          h('option', { value: 'added' }, t('sort.added')),
          h('option', { value: 'title' }, t('sort.title')),
          h('option', { value: 'author' }, t('sort.author'))),
          h('button', { type: 'button', className: 'ere-btn ere-btn-primary', onClick: openPicker },
            ICONS.upload, t('shelf.import')))),
      h('div', { className: 'ere-shelf-scroll' },
        imports.length > 0
          ? h('div', { className: 'ere-imports', role: 'status', 'aria-live': 'polite' },
            imports.map((entry) => h('div', { key: entry.key, className: 'ere-import-row' },
              entry.status === 'done' || entry.status === 'error'
                ? null
                : h('span', { className: 'ere-spinner', 'aria-hidden': 'true' }),
              h('span', { className: 'ere-import-name', title: entry.name }, entry.name),
              h('span', {
                className: classNames('ere-import-status', entry.status === 'error' && 'ere-import-error'),
                title: entry.message || '',
              }, entry.status === 'error'
                ? (entry.message || t('import.failed'))
                : entry.status === 'done'
                  ? entry.message || t('import.done')
                  : t(`import.${entry.status}`)))))
          : null,

        loading
          ? h('div', { className: 'ere-loading-row' }, h('span', { className: 'ere-spinner ere-spinner-lg', 'aria-hidden': 'true' }), t('shelf.loading'))
          : null,

        !loading && error && books.length === 0
          ? h('div', { className: 'ere-empty' },
            h('h2', null, t('shelf.loadError')),
            h('p', null, error),
            h('button', { type: 'button', className: 'ere-btn', onClick: onRefresh }, t('shelf.retry')))
          : null,

        !loading && !error && books.length === 0
          ? h('div', { className: 'ere-empty' },
            h('div', { className: 'ere-empty-icon' }, ICONS.book),
            h('h2', null, t('empty.title')),
            h('p', null, t('empty.body')),
            h('button', { type: 'button', className: 'ere-btn ere-btn-primary', onClick: openPicker },
              ICONS.upload, t('shelf.import')),
            h('p', { className: 'ere-empty-hint' }, t('empty.hint')))
          : null,

        !loading && books.length > 0
          ? h(React.Fragment, null,
            error
              ? h('div', { className: 'ere-banner', role: 'status' },
                h('span', null, error),
                h('button', { type: 'button', className: 'ere-btn', onClick: onRefresh }, t('shelf.retry')))
              : null,
            query.trim() === '' && resume
              ? h('button', { type: 'button', className: 'ere-resume', onClick: () => onOpen(resume) },
                ICONS.book,
                h('span', { className: 'ere-resume-label' }, t('shelf.continue')),
                h('span', { className: 'ere-resume-title' }, resume.title),
                h('span', { className: 'ere-resume-pct' }, `${percentOf(resume)}%`))
              : null,
            visible.length === 0
              ? h('div', { className: 'ere-empty' },
                h('h2', null, t('shelf.noResults')),
                h('p', null, t('shelf.noResultsHint')))
              : h('div', { className: 'ere-grid' },
                visible.map((book) => h(BookCard, {
                  key: book.id,
                  book,
                  t,
                  onOpen: () => onOpen(book),
                  onEdit: () => onEdit(book),
                  onDelete: () => onDelete(book),
                }))))
          : null),

      dragging
        ? h('div', { className: 'ere-drop' }, ICONS.upload, t('shelf.import'))
        : null)
    }

    // -------------------------------------------------------------- reader

    function Reader({ book, api, t, settings, onSettingsChange, onClose, onProgress }) {
      const [phase, setPhase] = useState('loading')
      const [failure, setFailure] = useState(null)
      const [epub, setEpub] = useState(null)
      const [chapter, setChapter] = useState(0)
      const [percent, setPercent] = useState(0)
      const [tocOpen, setTocOpen] = useState(true)
      const [narrow, setNarrow] = useState(false)
      const [chapterBusy, setChapterBusy] = useState(false)
      const [attempt, setAttempt] = useState(0)
      const iframeRef = useRef(null)
      const readerRef = useRef(null)
      const urlsRef = useRef([])
      const styleCleanupRef = useRef(null)
      const activeTocRef = useRef(null)
      const tocOpenRef = useRef(tocOpen)
      const saveTimerRef = useRef(0)
      const lastSaveRef = useRef(0)
      const posRef = useRef({ chapter: 0, ratio: 0 })
      const pendingRef = useRef({ chapter: 0, ratio: 0, fragment: null })
      const settingsRef = useRef(settings)

      settingsRef.current = settings
      tocOpenRef.current = tocOpen

      const saveNow = useCallback(() => {
        const position = posRef.current
        onProgress(book.id, { chapter: position.chapter, ratio: position.ratio, updatedAt: Date.now() })
        return api.progress(book.id, position.chapter, position.ratio).catch(() => {})
      }, [api, book.id, onProgress])

      const scheduleSave = useCallback(() => {
        const now = Date.now()
        if (now - lastSaveRef.current >= 5000) {
          lastSaveRef.current = now
          saveNow()
          return
        }
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = window.setTimeout(() => {
          lastSaveRef.current = Date.now()
          saveNow()
        }, 900)
      }, [saveNow])

      useEffect(() => {
        let cancelled = false
        setPhase('loading')
        setFailure(null)
        ;(async () => {
          try {
            const bytes = await api.getFile(book.id)
            if (cancelled) return
            const parsed = await parseEpub(bytes)
            if (cancelled) return
            const total = parsed.spine.length
            const startChapter = clamp(book.progress ? book.progress.chapter : 0, 0, total - 1)
            const startRatio = book.progress ? clamp(book.progress.ratio, 0, 1) : 0
            posRef.current = { chapter: startChapter, ratio: startRatio }
            pendingRef.current = { chapter: startChapter, ratio: startRatio, fragment: null }
            setChapter(startChapter)
            setPercent(Math.round(((startChapter + startRatio) / Math.max(1, total)) * 100))
            setEpub(parsed)
            setPhase('ready')
          } catch (error) {
            if (cancelled) return
            setFailure(describeError(error, t))
            setPhase('error')
          }
        })()
        return () => {
          cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [book.id, attempt])

      const navigate = useCallback((index, fragment) => {
        if (!epub) return
        const total = epub.spine.length
        if (total === 0) return
        const next = clamp(index, 0, total - 1)
        saveNow()
        posRef.current = { chapter: next, ratio: 0 }
        pendingRef.current = { chapter: next, ratio: 0, fragment: fragment || null }
        setChapter(next)
        setPercent(Math.round((next / Math.max(1, total)) * 100))
      }, [epub, saveNow])

      useEffect(() => {
        if (phase !== 'ready' || !epub) return undefined
        const iframe = iframeRef.current
        if (!iframe) return undefined
        let cancelled = false
        setChapterBusy(true)
        ;(async () => {
          try {
            const built = await buildChapterHtml(epub, chapter, settingsRef.current, isHostDark(), t)
            if (cancelled) {
              revokeUrls(built.urls)
              return
            }
            revokeUrls(urlsRef.current)
            urlsRef.current = built.urls
            iframe.onload = () => {
              if (cancelled) return
              if (styleCleanupRef.current) {
                styleCleanupRef.current()
                styleCleanupRef.current = null
              }
              styleCleanupRef.current = attachChapter(iframe, epub, chapter, pendingRef.current, {
                settings: settingsRef.current,
                hostDark: isHostDark(),
                onRatio: (value) => {
                  posRef.current = { chapter, ratio: value }
                  const next = Math.round(((chapter + value) / Math.max(1, epub.spine.length)) * 100)
                  setPercent((current) => (current === next ? current : next))
                  scheduleSave()
                },
                onNavigate: (index, fragment) => navigate(index, fragment),
                onPrev: () => {
                  if (posRef.current.chapter > 0) navigate(posRef.current.chapter - 1, null)
                },
                onNext: () => {
                  if (epub && posRef.current.chapter < epub.spine.length - 1) navigate(posRef.current.chapter + 1, null)
                },
                onEscape: () => {
                  if (tocOpenRef.current) setTocOpen(false)
                  else void closeReader()
                },
              })
              setChapterBusy(false)
            }
            iframe.srcdoc = built.html
          } catch (error) {
            if (cancelled) return
            setChapterBusy(false)
            setFailure(describeError(error, t))
            setPhase('error')
          }
        })()
        return () => {
          cancelled = true
          if (styleCleanupRef.current) {
            styleCleanupRef.current()
            styleCleanupRef.current = null
          }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [epub, chapter, phase])

      useEffect(() => () => {
        revokeUrls(urlsRef.current)
        window.clearTimeout(saveTimerRef.current)
        saveNow()
      }, [saveNow])

      useEffect(() => {
        const flush = () => {
          void saveNow()
        }
        const onVisibilityChange = () => {
          if (document.visibilityState === 'hidden') flush()
        }
        window.addEventListener('pagehide', flush)
        document.addEventListener('visibilitychange', onVisibilityChange)
        return () => {
          window.removeEventListener('pagehide', flush)
          document.removeEventListener('visibilitychange', onVisibilityChange)
        }
      }, [saveNow])

      useEffect(() => {
        if (phase !== 'ready' || !iframeRef.current || !iframeRef.current.contentDocument) return
        const doc = iframeRef.current.contentDocument
        const win = iframeRef.current.contentWindow
        const before = win ? readScrollRatio(doc, win) : 0
        applyReaderStyle(doc, settings, isHostDark())
        if (!win || before <= 0) return
        const scrolling = doc.scrollingElement || doc.documentElement
        const max = Math.max(0, (scrolling ? scrolling.scrollHeight : 0) - (win.innerHeight || 0))
        if (max > 0) win.scrollTo(0, max * before)
      }, [settings, phase])

      useEffect(() => {
        if (settings.theme !== 'auto' || phase !== 'ready') return undefined
        const applyHostTheme = () => {
          const iframe = iframeRef.current
          const doc = iframe && iframe.contentDocument
          const win = iframe && iframe.contentWindow
          if (!doc || !win) return
          const before = readScrollRatio(doc, win)
          applyReaderStyle(doc, settingsRef.current, isHostDark())
          const scrolling = doc.scrollingElement || doc.documentElement
          const max = Math.max(0, (scrolling ? scrolling.scrollHeight : 0) - (win.innerHeight || 0))
          if (before > 0 && max > 0) win.scrollTo(0, max * before)
        }
        const observer = new MutationObserver(applyHostTheme)
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
        return () => observer.disconnect()
      }, [settings.theme, phase])

      useEffect(() => {
        const element = readerRef.current
        if (!element || typeof ResizeObserver !== 'function') return undefined
        const observer = new ResizeObserver((entries) => {
          const width = entries[0] && entries[0].contentRect ? entries[0].contentRect.width : 0
          setNarrow(width > 0 && width < 720)
        })
        observer.observe(element)
        return () => observer.disconnect()
      }, [phase])

      const go = useCallback((delta) => {
        if (!epub) return
        const next = posRef.current.chapter + delta
        if (next < 0 || next >= epub.spine.length) return
        navigate(next, null)
      }, [epub, navigate])

      const closeReader = useCallback(async () => {
        await saveNow()
        onClose()
      }, [saveNow, onClose])

      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
          const tag = event.target && event.target.tagName ? String(event.target.tagName).toLowerCase() : ''
          if (tag === 'input' || tag === 'textarea' || tag === 'select') return
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            go(-1)
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            go(1)
          } else if (event.key === 'Escape') {
            event.preventDefault()
            if (tocOpen) setTocOpen(false)
            else void closeReader()
          }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
      }, [go, tocOpen, closeReader])

      const total = epub ? epub.spine.length : book.spineCount || 0
      const chapterLabel = epub
        ? (epub.titles[chapter] || t('reader.chapterN', { n: chapter + 1 }))
        : book.title
      const tocEntries = useMemo(() => {
        if (!epub) return []
        if (epub.toc.length > 0) return epub.toc
        return epub.spine.map((item, index) => ({
          label: epub.titles[index] || t('reader.chapterN', { n: index + 1 }),
          chapter: index,
          fragment: null,
          depth: 0,
        }))
      }, [epub, t])

      useEffect(() => {
        if (!tocOpen || !activeTocRef.current) return
        activeTocRef.current.scrollIntoView({ block: 'nearest' })
      }, [chapter, tocOpen])

      if (phase === 'loading') {
        return h('div', { className: 'ere-reader', ref: readerRef, 'data-narrow': narrow ? 'true' : 'false' },
          h('div', { className: 'ere-reader-head' },
            h('button', {
              type: 'button',
              className: 'ere-btn ere-icon-btn',
              title: t('reader.back'),
              'aria-label': t('reader.back'),
              onClick: onClose,
            }, ICONS.arrowLeft),
            h('div', { className: 'ere-reader-title' },
              h('strong', null, book.title),
              h('span', null, t('reader.loading')))),
          h('div', { className: 'ere-reader-loading' },
            h('span', { className: 'ere-spinner ere-spinner-lg', 'aria-hidden': 'true' }),
            h('p', null, t('reader.loading'))))
      }
      if (phase === 'error' || !epub) {
        return h('div', { className: 'ere-reader', ref: readerRef, 'data-narrow': narrow ? 'true' : 'false' },
          h('div', { className: 'ere-reader-head' },
            h('button', { type: 'button', className: 'ere-btn ere-icon-btn', title: t('reader.back'), 'aria-label': t('reader.back'), onClick: () => { void closeReader() } }, ICONS.arrowLeft),
            h('div', { className: 'ere-reader-title' }, h('strong', null, book.title))),
          h('div', { className: 'ere-reader-error' },
            h('h2', null, t('reader.error')),
            h('p', null, failure || ''),
            h('button', { type: 'button', className: 'ere-btn', onClick: () => { setPhase('loading'); setFailure(null); setAttempt((value) => value + 1) } }, t('reader.retry')),
            h('button', { type: 'button', className: 'ere-btn', onClick: () => { void closeReader() } }, t('reader.back'))))
      }

      return h('div', { className: 'ere-reader', ref: readerRef, 'data-narrow': narrow ? 'true' : 'false' },
        h('div', { className: 'ere-reader-head' },
          h('button', { type: 'button', className: 'ere-btn ere-icon-btn', title: t('reader.back'), 'aria-label': t('reader.back'), onClick: () => { void closeReader() } }, ICONS.arrowLeft),
          h('div', { className: 'ere-reader-title' },
            h('strong', { title: book.title }, book.title),
            h('span', { title: book.author || '' }, `${chapterLabel}${book.author ? ` · ${book.author}` : ''}`)),
          h('div', { className: 'ere-reader-tools' },
            h('button', {
              type: 'button',
              className: 'ere-btn ere-icon-btn',
              title: t('reader.fontSmaller'),
              'aria-label': t('reader.fontSmaller'),
              disabled: settings.fontSize <= FONT_MIN,
              onClick: () => onSettingsChange({ fontSize: clamp(settings.fontSize - 1, FONT_MIN, FONT_MAX) }),
            }, h('span', { 'aria-hidden': 'true', style: { fontSize: '12px' } }, 'A−')),
            h('span', { className: 'ere-font-size' }, settings.fontSize),
            h('button', {
              type: 'button',
              className: 'ere-btn ere-icon-btn',
              title: t('reader.fontLarger'),
              'aria-label': t('reader.fontLarger'),
              disabled: settings.fontSize >= FONT_MAX,
              onClick: () => onSettingsChange({ fontSize: clamp(settings.fontSize + 1, FONT_MIN, FONT_MAX) }),
            }, h('span', { 'aria-hidden': 'true', style: { fontSize: '14px' } }, 'A+')),
            h('select', {
              className: 'ere-select ere-theme-select',
              value: settings.theme,
              title: t('reader.theme'),
              'aria-label': t('reader.theme'),
              onChange: (event) => onSettingsChange({ theme: event.target.value }),
            },
            h('option', { value: 'auto' }, t('theme.auto')),
            h('option', { value: 'light' }, t('theme.light')),
            h('option', { value: 'sepia' }, t('theme.sepia')),
            h('option', { value: 'dark' }, t('theme.dark'))),
            h('button', {
              type: 'button',
              className: 'ere-btn ere-icon-btn',
              title: t('reader.toc'),
              'aria-label': t('reader.toc'),
              'aria-pressed': tocOpen,
              onClick: () => setTocOpen((open) => !open),
            }, ICONS.list))),
        h('div', { className: 'ere-reader-main' },
          h('iframe', {
            ref: iframeRef,
            className: 'ere-frame',
            title: book.title,
            sandbox: 'allow-same-origin',
            tabIndex: 0,
          }),
          chapterBusy ? h('div', { className: 'ere-chapter-busy' }, h('span', { className: 'ere-spinner', 'aria-hidden': 'true' })) : null,
          tocOpen
            ? h('aside', { className: 'ere-reader-side', role: 'navigation', 'aria-label': t('reader.toc') },
              h('div', { className: 'ere-progress-card' },
                h('div', { className: 'ere-progress-top' },
                  h('span', null, t('reader.progressTitle')),
                  h('strong', null, `${percent}%`)),
                h('div', { className: 'ere-progress-track', 'aria-hidden': 'true' }, h('span', { style: { width: `${percent}%` } })),
                h('div', { className: 'ere-progress-sub' }, t('reader.chapterOf', { n: chapter + 1, total }))),
              h('div', { className: 'ere-toc-panel' },
                h('div', { className: 'ere-toc-head' },
                  h('span', null, t('reader.toc')),
                  h('button', { type: 'button', className: 'ere-btn ere-icon-btn', title: t('reader.closeToc'), 'aria-label': t('reader.closeToc'), onClick: () => setTocOpen(false) }, ICONS.x)),
                h('div', { className: 'ere-toc-list' },
                  tocEntries.length === 0
                    ? h('div', { className: 'ere-toc-empty' }, t('reader.noToc'))
                    : tocEntries.map((entry, index) => h('button', {
                      key: `${entry.chapter}:${entry.fragment || ''}:${index}`,
                      ref: entry.chapter === chapter ? activeTocRef : null,
                      type: 'button',
                      className: 'ere-toc-item',
                      'data-active': entry.chapter === chapter ? 'true' : 'false',
                      style: { paddingLeft: `${10 + Math.min(4, entry.depth) * 14}px` },
                      title: entry.label,
                      onClick: () => {
                        if (entry.chapter === chapter && entry.fragment) {
                          const doc = iframeRef.current ? iframeRef.current.contentDocument : null
                          if (doc) {
                            const element = doc.getElementById(entry.fragment)
                            if (element && typeof element.scrollIntoView === 'function') element.scrollIntoView()
                          }
                        } else {
                          navigate(entry.chapter, entry.fragment)
                        }
                      },
                    }, entry.label || t('reader.chapterN', { n: entry.chapter + 1 }))))))
            : null),
        h('div', { className: 'ere-reader-foot' },
          h('button', {
            type: 'button',
            className: 'ere-btn ere-icon-btn',
            title: t('reader.prev'),
            'aria-label': t('reader.prev'),
            disabled: chapter <= 0,
            onClick: () => go(-1),
          }, ICONS.chevronLeft),
          h('div', { className: 'ere-foot-meta' },
            h('span', null, t('reader.chapterOf', { n: chapter + 1, total })),
            h('span', { className: 'ere-foot-bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${percent}%` } })),
            h('span', null, `${percent}%`)),
          h('button', {
            type: 'button',
            className: 'ere-btn ere-icon-btn',
            title: t('reader.next'),
            'aria-label': t('reader.next'),
            disabled: chapter >= total - 1,
            onClick: () => go(1),
          }, ICONS.chevronRight)))
    }

    // ----------------------------------------------------------------- app

    function App({ locale }) {
      const localeId = useLocaleId(locale)
      const t = useCallback((key, vars) => translate(localeId, key, vars), [localeId])
      const api = useMemo(() => createApi(), [])
      const [books, setBooks] = useState([])
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState(null)
      const [settings, setSettings] = useState(DEFAULT_SETTINGS)
      const [reading, setReading] = useState(null)
      const [toast, setToast] = useState(null)
      const [deleteTarget, setDeleteTarget] = useState(null)
      const [editTarget, setEditTarget] = useState(null)
      const settingsRef = useRef(settings)
      const settingsTimer = useRef(0)
      const toastTimer = useRef(0)
      const deletingRef = useRef(false)
      const savingRef = useRef(false)

      settingsRef.current = settings

      const refresh = useCallback(async () => {
        try {
          const list = await api.list()
          setBooks(list)
          setError(null)
        } catch (failure) {
          setError(describeError(failure, t))
        } finally {
          setLoading(false)
        }
      }, [api, t])

      useEffect(() => {
        let cancelled = false
        ;(async () => {
          try {
            const [list, stored] = await Promise.all([api.list(), api.getSettings().catch(() => null)])
            if (cancelled) return
            setBooks(list)
            const merged = { ...DEFAULT_SETTINGS, ...(stored || {}) }
            setSettings(merged)
            settingsRef.current = merged
            if (merged.lastBookId) {
              const last = list.find((book) => book.id === merged.lastBookId)
              if (last) {
                setReading(last)
              } else {
                const cleared = { ...merged, lastBookId: null }
                setSettings(cleared)
                settingsRef.current = cleared
                api.putSettings(cleared).catch(() => {})
              }
            }
          } catch (failure) {
            if (!cancelled) setError(describeError(failure, t))
          } finally {
            if (!cancelled) setLoading(false)
          }
        })()
        return () => {
          cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [api])

      const showToast = useCallback((message, kind) => {
        window.clearTimeout(toastTimer.current)
        setToast({ message, kind: kind || 'info', id: Date.now() })
      }, [])

      useEffect(() => {
        if (!toast) return undefined
        const timer = window.setTimeout(() => setToast(null), 2800)
        return () => window.clearTimeout(timer)
      }, [toast])

      const updateSettings = useCallback((patch) => {
        const next = { ...settingsRef.current, ...patch }
        settingsRef.current = next
        setSettings(next)
        window.clearTimeout(settingsTimer.current)
        settingsTimer.current = window.setTimeout(() => {
          api.putSettings(next).catch(() => {})
        }, 400)
      }, [api])

      const persistSettingsNow = useCallback((patch) => {
        const next = { ...settingsRef.current, ...patch }
        settingsRef.current = next
        setSettings(next)
        api.putSettings(next).catch(() => {})
      }, [api])

      const openBook = useCallback((book) => {
        persistSettingsNow({ lastBookId: book.id })
        setReading(book)
      }, [persistSettingsNow])

      const closeBook = useCallback(() => {
        persistSettingsNow({ lastBookId: null })
        setReading(null)
        void refresh()
      }, [persistSettingsNow, refresh])

      const deleteBook = useCallback(async (book) => {
        if (deletingRef.current) return
        deletingRef.current = true
        try {
          await api.remove(book.id)
          setBooks((current) => current.filter((entry) => entry.id !== book.id))
          if (settingsRef.current.lastBookId === book.id) persistSettingsNow({ lastBookId: null })
          showToast(t('toast.deleted', { title: book.title }), 'info')
        } catch (failure) {
          showToast(describeError(failure, t), 'error')
        } finally {
          deletingRef.current = false
          setDeleteTarget(null)
        }
      }, [api, persistSettingsNow, showToast, t])

      const saveEdit = useCallback(async (patch) => {
        const book = editTarget
        if (!book || savingRef.current) return
        savingRef.current = true
        try {
          const result = await api.update(book.id, patch)
          const updated = result && result.book ? result.book : { ...book, ...patch }
          setBooks((current) => current.map((entry) => (entry.id === book.id ? updated : entry)))
          showToast(t('toast.saved'), 'info')
        } catch (failure) {
          showToast(describeError(failure, t), 'error')
        } finally {
          savingRef.current = false
          setEditTarget(null)
        }
      }, [api, editTarget, showToast, t])

      const handleProgress = useCallback((id, progress) => {
        setBooks((current) => current.map((entry) => (entry.id === id ? { ...entry, progress, lastReadAt: progress.updatedAt || Date.now() } : entry)))
      }, [])

      return h('div', { className: 'ere-root', 'data-ebook-reader': '' },
        h('style', null, CSS_TEXT),
        reading
          ? h(Reader, {
            key: reading.id,
            book: reading,
            api,
            t,
            settings,
            onSettingsChange: updateSettings,
            onClose: closeBook,
            onProgress: handleProgress,
          })
          : h(Shelf, {
            books,
            loading,
            error,
            api,
            t,
            onRefresh: refresh,
            onOpen: openBook,
            onEdit: (book) => setEditTarget(book),
            onDelete: (book) => setDeleteTarget(book),
          }),
        toast
          ? h('div', { className: 'ere-toast', 'data-kind': toast.kind, role: 'status', 'aria-live': 'polite' }, toast.message)
          : null,
        deleteTarget
          ? h(Dialog, {
            title: t('dialog.delete.title'),
            description: t('dialog.delete.body', { title: deleteTarget.title }),
            onClose: () => setDeleteTarget(null),
            footer: [
              h('button', { key: 'cancel', type: 'button', className: 'ere-btn', onClick: () => setDeleteTarget(null) }, t('dialog.cancel')),
              h('button', {
                key: 'remove',
                type: 'button',
                className: 'ere-btn ere-btn-danger',
                onClick: () => void deleteBook(deleteTarget),
              }, t('dialog.delete.confirm')),
            ],
          })
          : null,
        editTarget
          ? h(EditDialog, {
            book: editTarget,
            t,
            onSave: (patch) => void saveEdit(patch),
            onClose: () => setEditTarget(null),
          })
          : null)
    }

    // ----------------------------------------------------------------- css

    const CSS_TEXT = `
.ere-root{position:relative;height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}
.ere-root *,.ere-root *::before,.ere-root *::after{box-sizing:border-box}
.ere-shelf{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 clamp(20px,4vw,44px)}
.ere-shelf-head{flex:none;display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:16px 20px;padding:26px 0 18px}
[data-platform=darwin] .ere-shelf-head{padding-top:calc(26px + var(--dsh-frame-top-clearance,0px))}
.ere-heading{min-width:0}
.ere-heading h1{margin:0;font-size:20px;line-height:28px;font-weight:500}
.ere-heading p{margin:4px 0 0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.ere-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ere-search{position:relative;display:flex;align-items:center;color:var(--dsw-alias-label-secondary)}
.ere-search svg{position:absolute;left:9px;pointer-events:none}
.ere-search input{width:190px;height:32px;border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:0 10px 0 30px;outline:none}
.ere-search input::placeholder{color:var(--dsw-alias-label-secondary)}
.ere-search input:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 .5px var(--dsw-alias-brand-primary)}
.ere-select{height:32px;border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:0 8px;outline:none;cursor:pointer}
.ere-select:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:2px}
.ere-btn{height:32px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1;white-space:nowrap;cursor:pointer}
.ere-btn:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2))}
.ere-btn:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:2px}
.ere-btn[disabled]{opacity:.45;cursor:default}
.ere-btn[disabled]:hover{background:transparent}
.ere-btn-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,#fff)}
.ere-btn-primary:hover{background:var(--dsw-alias-brand-primary);filter:brightness(1.06)}
.ere-btn-danger{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 36%,transparent)}
.ere-btn-danger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent)}
.ere-icon-btn{width:28px;height:28px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary)}
.ere-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-label-primary)}
.ere-shelf-scroll{flex:1;min-height:0;display:flex;flex-direction:column;overflow-y:auto;padding:2px 2px 56px}
.ere-resume{flex:none;display:flex;align-items:center;gap:10px;width:100%;margin:0 0 22px;padding:10px 14px;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.ere-resume:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2))}
.ere-resume:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:2px}
.ere-resume svg{flex:none;color:var(--dsw-alias-label-secondary)}
.ere-resume-label{color:var(--dsw-alias-label-secondary);flex:none}
.ere-resume-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.ere-resume-pct{flex:none;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.ere-grid{flex:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(146px,1fr));gap:24px 20px}
.ere-card{position:relative;min-width:0}
.ere-cover{position:relative;display:block;width:100%;aspect-ratio:2/3;padding:0;overflow:hidden;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);cursor:pointer}
.ere-cover img{display:block;width:100%;height:100%;object-fit:cover}
.ere-cover:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:2px}
.ere-cover-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,color-mix(in srgb,var(--dsw-alias-brand-primary) 20%,var(--dsw-alias-bg-layer-2)),var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-label-secondary);font-size:34px;font-weight:600;letter-spacing:.02em}
.ere-cover-progress{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(0,0,0,.24)}
.ere-cover-progress>span{display:block;height:100%;background:var(--dsw-alias-brand-primary)}
.ere-card-actions{position:absolute;top:6px;right:6px;display:flex;gap:4px;opacity:0;pointer-events:none;transition:opacity .12s ease}
.ere-card:hover .ere-card-actions,.ere-card:focus-within .ere-card-actions{opacity:1;pointer-events:auto}
.ere-card-action{width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:6px;background:rgba(16,19,24,.58);color:#fff;cursor:pointer;backdrop-filter:blur(2px)}
.ere-card-action:hover{background:rgba(16,19,24,.82)}
.ere-card-action:focus-visible{outline:2px solid #fff;outline-offset:1px}
.ere-card-meta{margin-top:8px;min-width:0}
.ere-card-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;line-height:18px;font-weight:500;overflow-wrap:anywhere}
.ere-card-sub{margin-top:3px;font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ere-card-progress{margin-top:3px;font-size:11.5px;line-height:15px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.ere-empty{flex:1;min-height:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:40px 20px 80px;text-align:center;color:var(--dsw-alias-label-secondary)}
.ere-empty-icon{color:var(--dsw-alias-label-secondary);opacity:.85}
.ere-empty h2{margin:12px 0 0;font-size:15px;line-height:22px;font-weight:500;color:var(--dsw-alias-label-primary)}
.ere-empty p{margin:0;max-width:360px;font-size:13px;line-height:20px}
.ere-empty .ere-btn{margin-top:14px}
.ere-empty-hint{margin-top:12px!important;font-size:12px!important;color:var(--dsw-alias-label-secondary)}
.ere-loading-row{display:flex;align-items:center;gap:8px;padding:28px 4px;color:var(--dsw-alias-label-secondary);font-size:13px}
.ere-imports{flex:none;display:flex;flex-direction:column;gap:6px;margin:0 0 18px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);font-size:12.5px}
.ere-import-row{display:flex;align-items:center;gap:8px;min-width:0}
.ere-import-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ere-import-status{flex:none;max-width:52%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary)}
.ere-import-error{color:var(--dsw-alias-state-error-primary)}
.ere-banner{flex:none;display:flex;align-items:center;gap:10px;margin:0 0 16px;padding:8px 12px;border:.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 34%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12.5px;line-height:18px}
.ere-banner>span{flex:1;min-width:0;overflow-wrap:anywhere}
.ere-banner .ere-btn{height:26px;padding:0 10px;color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 34%,transparent)}
.ere-spinner{flex:none;width:12px;height:12px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,transparent);border-top-color:var(--dsw-alias-brand-primary);animation:ere-spin .8s linear infinite}
.ere-spinner-lg{width:20px;height:20px;border-width:2px}
@keyframes ere-spin{to{transform:rotate(360deg)}}
.ere-drop{position:absolute;inset:10px;z-index:20;display:flex;align-items:center;justify-content:center;gap:10px;border:1.5px dashed var(--dsw-alias-brand-primary);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 84%,transparent);color:var(--dsw-alias-brand-primary);font-size:14px;pointer-events:none}
.ere-backdrop{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.32)}
.ere-dialog{width:min(430px,100%);padding:18px 18px 14px;border:.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:0 14px 36px rgba(0,0,0,.26)}
.ere-dialog h2{margin:0 0 6px;font-size:15px;line-height:22px;font-weight:600}
.ere-dialog p{margin:0 0 10px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.ere-dialog label{display:block;margin:12px 0 4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.ere-dialog input{width:100%;height:32px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;outline:none}
.ere-dialog input:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 .5px var(--dsw-alias-brand-primary)}
.ere-dialog-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
.ere-toast{position:absolute;left:50%;bottom:22px;z-index:40;display:flex;align-items:center;gap:8px;max-width:calc(100% - 40px);padding:8px 14px;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;box-shadow:0 10px 28px rgba(0,0,0,.2);transform:translateX(-50%)}
.ere-toast[data-kind=error]{color:var(--dsw-alias-state-error-primary)}
.ere-reader{flex:1;min-height:0;display:flex;flex-direction:column}
.ere-reader-head{flex:none;height:52px;display:flex;align-items:center;gap:8px;padding:0 12px 0 10px;border-bottom:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
[data-platform=darwin] .ere-reader-head{height:calc(52px + var(--dsh-frame-top-clearance,0px));padding-top:var(--dsh-frame-top-clearance,0px)}
.ere-reader-title{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}
.ere-reader-title strong{font-size:13.5px;line-height:18px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ere-reader-title span{font-size:11.5px;line-height:15px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ere-reader-tools{flex:none;display:flex;align-items:center;gap:2px}
.ere-font-size{min-width:20px;text-align:center;font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.ere-theme-select{height:28px;font-size:12px;padding:0 4px;margin-left:4px}
.ere-reader-main{position:relative;flex:1;min-height:0;min-width:0;display:flex}
.ere-frame{flex:1 1 0%;width:0;min-width:0;height:100%;border:0;display:block;background:var(--dsw-alias-bg-base)}
.ere-frame:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:-2px}
.ere-chapter-busy{position:absolute;top:10px;right:10px;z-index:5;display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:var(--dsw-alias-bg-overlay);border:.5px solid var(--dsw-alias-border-l1)}
.ere-reader-side{flex:none;width:264px;min-width:0;min-height:0;margin:12px 12px 12px 0;display:flex;flex-direction:column;overflow:hidden;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}
.ere-progress-card{flex:none;padding:14px 16px 10px}
.ere-progress-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:11.5px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.ere-progress-top strong{font-size:20px;line-height:24px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.ere-progress-track{height:4px;margin-top:9px;overflow:hidden;border-radius:2px;background:var(--dsw-alias-bg-layer-2)}
.ere-progress-track>span{display:block;height:100%;border-radius:2px;background:var(--dsw-alias-brand-primary)}
.ere-progress-sub{margin-top:7px;font-size:11.5px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.ere-toc-panel{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.ere-toc-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 8px 8px 12px;border-bottom:.5px solid var(--dsw-alias-border-l1);font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.ere-toc-list{flex:1;min-height:0;overflow-y:auto;padding:6px 0 12px}
.ere-toc-item{display:block;width:calc(100% - 12px);margin:1px 6px;padding:6px 10px;overflow:hidden;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;line-height:18px;text-align:left;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.ere-toc-item:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2))}
.ere-toc-item:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:-2px}
.ere-toc-item[data-active=true]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary);font-weight:600}
.ere-toc-empty{padding:16px 14px;font-size:12.5px;line-height:19px;color:var(--dsw-alias-label-secondary)}
.ere-reader[data-narrow=true] .ere-reader-side{position:absolute;top:12px;right:12px;bottom:12px;z-index:10;width:min(300px,calc(100% - 24px));margin:0;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-overlay);box-shadow:0 12px 32px rgba(0,0,0,.2)}
.ere-reader-foot{flex:none;height:42px;display:flex;align-items:center;gap:10px;padding:0 12px;border-top:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.ere-foot-meta{flex:1;min-width:0;display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;font-variant-numeric:tabular-nums}
.ere-foot-bar{width:90px;height:3px;flex:none;overflow:hidden;border-radius:2px;background:var(--dsw-alias-bg-layer-2)}
.ere-foot-bar>span{display:block;height:100%;background:var(--dsw-alias-brand-primary)}
.ere-reader-loading,.ere-reader-error{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:40px;text-align:center;color:var(--dsw-alias-label-secondary)}
.ere-reader-loading p{margin:0;font-size:13px}
.ere-reader-error h2{margin:0;font-size:15px;line-height:22px;font-weight:500;color:var(--dsw-alias-label-primary)}
.ere-reader-error p{margin:0;max-width:420px;font-size:13px;line-height:20px;overflow-wrap:anywhere}
.ere-reader-error .ere-btn{margin-top:2px}
@media (hover:none){.ere-card-actions{opacity:1;pointer-events:auto}}
@media (max-width:560px){.ere-search input{width:150px}.ere-theme-select{max-width:80px}}
`

    // ----------------------------------------------------------- register

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, 'en', DICT.en), 'ebook-reader: locale en')
        ctx.effect(() => ctx.locale.register(NS, 'zh', DICT.zh), 'ebook-reader: locale zh')
        const currentLocale = () => ctx.locale.getLocale().active
        const t = (key, vars) => translate(currentLocale(), key, vars)

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 25,
          label: () => t('panel.title'),
        }, (props) => h(SidebarIcon, { size: props.size })))

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, () => h(App, { locale: ctx.locale })))
      },
      __test: {
        createZipReader,
        parseEpub,
        buildChapterHtml,
        resolveHref,
        translate,
        DICT,
        takePickedFiles,
        Shelf,
        Reader,
        BookCard,
        Dialog,
        EditDialog,
        SidebarIcon,
      },
    }
  },
})
