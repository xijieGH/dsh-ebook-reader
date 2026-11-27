"""Build a small but realistic EPUB 3 fixture for parser tests."""

import base64
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "sample.epub"

# 1x1 transparent PNG
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)

CONTAINER = """<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
"""

OPF = """<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:6f6c2c33-0000-4000-8000-000000000001</dc:identifier>
    <dc:title>测试之书</dc:title>
    <dc:creator>张三</dc:creator>
    <dc:creator>李四</dc:creator>
    <dc:language>zh-CN</dc:language>
    <meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ch1" href="text/ch1.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch2" href="text/ch2.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="styles/book.css" media-type="text/css"/>
    <item id="cover" href="images/cover.png" media-type="image/png" properties="cover-image"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
    <itemref idref="ch2"/>
  </spine>
</package>
"""

NAV = """<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>目录</title></head>
<body>
  <nav epub:type="toc">
    <h1>目录</h1>
    <ol>
      <li><a href="text/ch1.xhtml">第一章 开始</a>
        <ol>
          <li><a href="text/ch1.xhtml#sec1">第一节 细节</a></li>
        </ol>
      </li>
      <li><a href="text/ch2.xhtml">第二章 结束</a></li>
    </ol>
  </nav>
</body>
</html>
"""

CH1 = """<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>第一章</title>
  <link rel="stylesheet" type="text/css" href="../styles/book.css"/>
</head>
<body>
  <h1 id="sec1">第一章 开始</h1>
  <p>这是<strong>第一章</strong>的正文，用来验证 <a href="ch2.xhtml#end">跨章链接</a> 与目录定位。</p>
  <p><img src="../images/cover.png" alt="插图"/></p>
  <blockquote>引用一段话。</blockquote>
  <p>结尾。</p>
</body>
</html>
"""

CH2 = """<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>第二章</title></head>
<body>
  <h1 id="end">第二章 结束</h1>
  <p>最后一章的正文。</p>
</body>
</html>
"""

CSS = """body { color: #222; }
p { text-indent: 2em; }
.cover { background-image: url(../images/cover.png); }
"""


def main() -> None:
    with zipfile.ZipFile(OUT, "w") as book:
        book.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        book.writestr("META-INF/container.xml", CONTAINER, compress_type=zipfile.ZIP_DEFLATED)
        book.writestr("OEBPS/content.opf", OPF, compress_type=zipfile.ZIP_DEFLATED)
        book.writestr("OEBPS/nav.xhtml", NAV, compress_type=zipfile.ZIP_DEFLATED)
        book.writestr("OEBPS/text/ch1.xhtml", CH1, compress_type=zipfile.ZIP_DEFLATED)
        book.writestr("OEBPS/text/ch2.xhtml", CH2, compress_type=zipfile.ZIP_DEFLATED)
        book.writestr("OEBPS/styles/book.css", CSS, compress_type=zipfile.ZIP_DEFLATED)
        book.writestr("OEBPS/images/cover.png", PNG, compress_type=zipfile.ZIP_DEFLATED)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
