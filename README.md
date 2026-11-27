# E-book reader for DeepSeek Harness

[中文](README.zh-CN.md) | English

An EPUB reader and local bookshelf plugin for the [DeepSeek Harness](https://github.com/deepseek-ai) Web GUI. It adds an **E-books** panel to the left sidebar.

![The bookshelf beside an open e-book](docs/preview.svg)

## Features

- **Local bookshelf** — import EPUB files with the import button or drag and drop; covers, title/author editing, search, sorting, reading progress and a continue-reading row.
- **EPUB reader** — chapter navigation, nested table of contents, adjustable text size, and light / sepia / dark / auto reading themes.
- **Reading memory** — books, reading positions and preferences stay on this machine and survive app restarts. Reopening the panel returns to the book you had open.
- **Local-first** — books and reading data are stored on your computer; the plugin does not upload them anywhere.
- **Bilingual UI** — Chinese and English, following the DSH locale.

## Requirements

- DeepSeek Harness Desktop or Web `0.2.2-rc.1` or newer.
- A current Chromium-based browser/WebView (the DSH desktop app qualifies).
- EPUB 2/3 files without DRM.

## Install

The plugin is distributed through this repository (not npm).

1. Clone the repository, or download and extract the ZIP:

   ```sh
   git clone https://github.com/xijieGH/dsh-ebook-reader.git
   ```

2. In DeepSeek Harness open **Plugins → Add plugin** and choose the cloned folder — the folder that contains `package.json`.
3. Enable the **dsh-ebook-reader** bundle if it is not enabled yet.
4. Click **E-books** (电子书) in the left sidebar and import an EPUB. If the row is not visible, open **More** in the sidebar and pin it.

> The plugin manager links the folder instead of copying it, so keep the clone in a stable location.

### Update

```sh
cd dsh-ebook-reader
git pull
```

Then disable and re-enable the bundle (or restart DSH) so the new client code is loaded.

## Usage

- Import with **Import EPUB** or drag one or more `.epub` files onto the panel.
- Click a cover to read. The right-hand card shows reading progress and the table of contents; use the list button in the reader header to hide it.
- Edit a book's title/author or remove it from the shelf with the buttons on its cover.
- Keyboard: `←` / `→` switch chapters, `Esc` closes the table of contents or returns to the shelf.
- The reader remembers the last opened book, so switching to another DSH panel and back resumes reading. **Back to bookshelf** clears that memory.

## Where data is stored

`$DSH_HOME/storages/ebook-reader/` — usually `~/.dsh/storages/ebook-reader/` on macOS/Linux and `%USERPROFILE%\.dsh\storages\ebook-reader\` on Windows:

| Path | Contents |
|---|---|
| `library.json` | Shelf metadata and covers |
| `progress.json` | Reading positions |
| `settings.json` | Reader preferences and the last opened book |
| `books/<id>.epub` | Imported book files |

Uninstalling the plugin does not delete this folder. Remove it manually if you want to erase your books.

## Privacy

Books and reading data are written only to the local folder above. The plugin has no telemetry and makes no network requests of its own. EPUB files may reference remote images or links; those can trigger network requests when a chapter is displayed.

## Limitations

- DRM-protected EPUBs cannot be opened.
- Fixed-layout / comic-style EPUBs are shown in flowing-text mode and may look wrong.
- Very large EPUBs are parsed in memory; import them one at a time on low-memory machines.
- The reader relies on the browser's native `DecompressionStream('deflate-raw')`; old browsers without it cannot open EPUBs.
- Books are stored in the DSH profile, not in the workspace. They are personal data — do not commit the storage folder to a repository.

## Development

No build step is required. `client.js` is the browser bundle in the DSH module-loader format, and `index.js` is the Host half.

```sh
npm run check   # syntax-check both halves
npm test        # Host route and persistence test
```

Repository layout:

```text
.
├── index.js              Host half: /api/ebook-reader/api route and disk storage
├── client.js             Browser half: sidebar panel, shelf, EPUB parser, reader
├── cordis.patch.yml      Bundle row that loads the Host plugin
├── locale/{en,zh}.json   Plugin display metadata
├── docs/                 Plugin detail page image and text
├── icon.svg              Plugin icon
└── test/                 Portable Host route test and sample EPUB fixture
```

## Contributing

Issues and pull requests are welcome. For a bug report, include the DSH version, the operating system, the browser console error (if any), and the EPUB's characteristics (EPUB 2/3, fixed-layout, DRM, approximate size). Please do not attach copyrighted books; a minimal reproduction EPUB is enough.

## License

[MIT](LICENSE) © 2026 xijieGH
