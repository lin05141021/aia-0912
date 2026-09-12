# aia-0912

一個樸實無華的輕量前端專案，採用原生 HTML、CSS 與 JavaScript 建構。目前已完成基礎架構搭建，並透過 GitHub Pages 提供線上預覽。

沒有引入龐大的現代前端框架，也沒有複雜的打包流程——有時候最單純的架構，往往也是最不容易在半夜報錯的架構。

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
│   └── rules/
│       └── docs-writing.md    # 文件撰寫與風格規範
├── index.html                 # 網頁主結構與進入點
├── style.css                  # 樣式定義（預設採用微軟正黑體）
├── app.js                     # 核心邏輯與互動行為
└── README.md                  # 專案說明文件
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

本專案遵循 [.agents/rules/docs-writing.md](.agents/rules/docs-writing.md) 訂定之規範：

- 文件以繁體中文撰寫，中英數混排時保持一個半形空格。
- 文風堅持沉穩、低調、務實，拒絕誇大不實的宣傳口吻。
- 專案未特別指定字型時，優先使用「微軟正黑體」。
