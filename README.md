# aia-0912

一個樸實無華的輕量前端專案，採用原生 HTML、CSS 與 JavaScript 建構。目前設計為個人生活與社群風格的圖文心得卡片，並透過 GitHub Pages 提供線上預覽。

沒有引入龐大的現代前端框架，也沒有複雜的打包流程——有時候最單純的架構，往往也是最不容易在半夜報錯的架構。

---

## 功能特色

- **Instagram 經典發文格式 (IG Card Format)**：
  - **版面比例**：主圖採 1:1 正方形黃金比例，搭配雙擊（Double-tap）浮動大愛心動畫。
  - **完整互動**：愛心按讚、留言聚焦、紙飛機分享（複製連結）與書籤收藏。
  - **社群排版**：帳號首行展開、`#` 主題標籤、讚數統計、留言列表與底部快捷留言列。
- **PANTONE 莫蘭迪柔和色彩體系**：
  - 全站基礎：`Cloud Dancer` (溫柔米白底) 與 `Nimbus Cloud` (微霧灰邊框)。
  - 三大主題色彩映射：
    - 💡 **心得雜記**：`Orchid Tint` (淡蘭紫霧) + `Raindrops on Roses` (柔粉)
    - 📘 **專業知識分享**：`Ice Melt` (融冰水藍) + `Almost Aqua` (薄霧水綠)
    - 🗺️ **資訊分享（景點）**：`Peach Dust` (蜜桃粉杏) + `Lemon Icing` (檸檬淡黃)
- **無依賴純淨架構**：零外部框架，所有圖示與互動皆以原生技術打造。

---

## 線上展示

專案已透過 GitHub Pages 自動部署，可直接點擊下方連結瀏覽：

- **線上網址**：[https://lin05141021.github.io/aia-0912/](https://lin05141021.github.io/aia-0912/)

---

## 專案結構

目錄維持簡潔清晰，所有檔案各司其職：

```text
aia-0912/
├── .agents/
│   ├── rules/
│   │   ├── docs-writing.md            # 文件撰寫與風格規範
│   │   └── development-guidelines.md  # 專案開發規範
│   └── workflows/
│       └── ux-check.md                # 日記卡片新增 UX 流程檢核規範
├── index.html                         # 網頁主結構與進入點
├── style.css                          # 樣式定義（預設採用微軟正黑體）
├── app.js                             # 核心邏輯與互動行為
└── README.md                          # 專案說明文件
```

---

## 本地開發與使用

本專案無需任何繁瑣的 `npm install` 流程即可直接運行：

1. **複製專案到本地**：
   ```bash
   git clone https://github.com/lin05141021/aia-0912.git
   cd aia-0912
   ```

2. **開啟網頁**：
   - 使用瀏覽器直接連按兩下開啟 `index.html`。
   - 或使用 VS Code 的 `Live Server` 延伸模組啟動本機伺服器。

---

## 技術棧

- **標記語言**：HTML5（語意化標籤）
- **樣式設計**：CSS3（以微軟正黑體為基準，搭配乾淨簡約的配色）
- **程式邏輯**：原生 JavaScript（ES6+）
- **版本控制**：Git & GitHub
- **部署平台**：GitHub Pages

---

## 開發規範

本專案遵循以下規範文件：

- [docs-writing.md](.agents/rules/docs-writing.md)：文件撰寫、排版、中英混排與語調規範。
- [development-guidelines.md](.agents/rules/development-guidelines.md)：前端架構、HTML/CSS/JS 程式碼撰寫與 Git 提交流程規範。

