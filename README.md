# aia-0912

一個樸實無華的輕量前端專案，採用原生 HTML、CSS 與 JavaScript 建構。目前設計為個人生活與社群風格的圖文心得卡片，並透過 GitHub Pages 提供線上預覽。

沒有引入龐大的現代前端框架，也沒有複雜的打包流程——有時候最單純的架構，往往也是最不容易在半夜報錯的架構。

---

## 功能特色

- **社群圖文卡片**：包含作者頭像、發布時間、地點標籤、高畫質照片與心得內文排版。
- **互動反饋**：
  - 愛心點讚與讚數即時計算。
  - 雙擊圖片觸發大愛心爆發動畫。
  - 書籤收藏與連結複製提示（Toast）。
  - 即時留言送出與留言列表更新。
- **自訂記錄發布**：提供「記錄新心得」彈窗，可自訂作者、心情地點、文字內容、標籤與挑選封面照片。
- **無依賴純淨架構**：零外部套件，所有圖示均採用輕量向量 SVG，開啟即可流暢操作。

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

