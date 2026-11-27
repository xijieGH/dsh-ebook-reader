# 电子书阅读器（DeepSeek Harness 插件）

中文 | [English](README.md)

一个面向 [DeepSeek Harness](https://github.com/deepseek-ai) Web GUI 的 EPUB 阅读器与本地书架插件，会在左侧边栏加入 **电子书** 面板。

![书架与打开的电子书](docs/preview.svg)

## 功能

- **本地书架**：通过导入按钮或拖拽导入 EPUB；支持封面、书名/作者编辑、搜索、排序、阅读进度与「继续阅读」。
- **EPUB 阅读器**：章节切换、嵌套目录、字号调节，以及浅色 / 护眼 / 深色 / 跟随宿主四种阅读配色。
- **阅读记忆**：书籍、阅读位置和偏好保存在本机，重启 DSH 后仍在；切到其他面板再回来会自动打开上次那本书。
- **本地优先**：书籍和阅读数据只保存在你的电脑上，插件不会上传。
- **中英双语界面**：跟随 DSH 当前语言。

## 环境要求

- DeepSeek Harness Desktop 或 Web `0.2.2-rc.1` 及以上。
- 较新的 Chromium 浏览器/WebView（DSH 桌面端自带）。
- 无 DRM 的 EPUB 2/3 文件。

## 安装

插件通过本仓库分发（暂未发布到 npm）。

1. 克隆仓库，或下载 ZIP 后解压：

   ```sh
   git clone https://github.com/xijieGH/dsh-ebook-reader.git
   ```

2. 在 DeepSeek Harness 中打开 **插件 → 添加插件**，选择克隆下来的目录（包含 `package.json` 的那一层）。
3. 如果 **dsh-ebook-reader** 尚未启用，将它启用。
4. 点击左侧边栏的 **电子书**，导入一本 EPUB 即可。如果没有看到入口，打开侧边栏的 **更多** 并把它固定到侧边栏。

> 插件管理器会以「链接本地目录」的方式安装，不会复制文件，所以请不要移动克隆目录。

### 更新

```sh
cd dsh-ebook-reader
git pull
```

然后在插件页禁用再启用该插件（或重启 DSH），让新的客户端代码生效。

## 使用

- 点击 **导入 EPUB**，或把一个/多个 `.epub` 文件拖到面板上。
- 点击封面开始阅读。右侧卡片显示阅读进度和目录；阅读器右上角的目录按钮可以收起它。
- 鼠标移到封面上，可以编辑书名/作者或从书架删除。
- 键盘：`←` / `→` 切换章节，`Esc` 关闭目录或返回书架。
- 阅读器会记住上次打开的书，切换到其他 DSH 面板再回来会从原位置继续；点击 **返回书架** 会清除这个记忆。

## 数据位置

`$DSH_HOME/storages/ebook-reader/`，通常是 `~/.dsh/storages/ebook-reader/`（Windows 为 `%USERPROFILE%\.dsh\storages\ebook-reader\`）：

| 路径 | 内容 |
|---|---|
| `library.json` | 书架元数据和封面 |
| `progress.json` | 阅读位置 |
| `settings.json` | 阅读偏好和上次打开的书 |
| `books/<id>.epub` | 导入的书籍文件 |

卸载插件不会删除这个目录；如需彻底清空书籍，请手动删除。

## 隐私

书籍和阅读数据只会写入上面的本地目录。插件没有埋点，也不会主动发起网络请求。EPUB 内部如果引用了远程图片或链接，显示章节时可能产生网络请求。

## 限制

- 不支持受 DRM 保护的 EPUB。
- 固定版式 / 漫画类 EPUB 会按流式文字排版显示，效果可能不正确。
- 超大 EPUB 会在内存中解析；内存较小的机器建议一次只导入一本。
- 阅读器依赖浏览器原生的 `DecompressionStream('deflate-raw')`，过旧的浏览器无法打开 EPUB。
- 书籍保存在 DSH 配置目录，而不是工作区；请勿把该目录提交到仓库。

## 开发

不需要构建步骤：`client.js` 是 DSH 模块加载器格式的浏览器端 bundle，`index.js` 是 Host 端插件。

```sh
npm run check   # 检查两端 JavaScript 语法
npm test        # Host 路由与磁盘持久化测试
```

目录结构：

```text
.
├── index.js              Host 端：/api/ebook-reader/api 路由与磁盘存储
├── client.js             浏览器端：侧边栏、书架、EPUB 解析与阅读器
├── cordis.patch.yml      加载 Host 插件的 bundle 行
├── locale/{en,zh}.json   插件显示元数据
├── docs/                 插件详情页图片与说明
├── icon.svg              插件图标
└── test/                 可移植的 Host 路由测试与示例 EPUB
```

## 贡献

欢迎提交 Issue 和 Pull Request。反馈问题时请附上 DSH 版本、操作系统、浏览器控制台报错（如有），以及 EPUB 的特征（EPUB 2/3、是否固定版式、是否 DRM、大致体积）。请勿附带受版权保护的书籍，最小复现文件即可。

## 许可证

[MIT](LICENSE) © 2026 xijieGH
