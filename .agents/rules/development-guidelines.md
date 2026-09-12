# 專案開發規範 (Development Guidelines)

本規範依據本專案當前的架構現狀（純原生 Web 技術、無打包依賴、直出靜態網頁、GitHub Pages 自動部署）訂定，旨在保持程式碼乾淨、可靠且易於維護。

---

## 1. 架構原則

- **極簡至上，拒絕過度工程**：
  - 現階段採用純原生 HTML5、CSS3 與 ES6+ JavaScript，不隨意引入重量級框架或打包工具。
  - 能用三行原生代碼解決的事情，絕不安裝一個動輒幾十 MB 的 npm 套件。
- **職責分離 (Separation of Concerns)**：
  - [index.html](file:///c:/Users/linda_lin/Desktop/aia0912/index.html)：只負責「骨架結構與語意化內容」。
  - [style.css](file:///c:/Users/linda_lin/Desktop/aia0912/style.css)：只負責「視覺呈現與版面佈局」。
  - [app.js](file:///c:/Users/linda_lin/Desktop/aia0912/app.js)：只負責「互動邏輯與狀態處理」。
  - 嚴禁在 HTML 內混入行內樣式（inline style）或行內 JavaScript（如 `onclick="..."`）。

---

## 2. HTML 規範

- **語意化標籤優先**：
  - 優先使用 `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` 等語意標籤。
  - 避免將整份網頁寫成層層巢狀的「`<div>` 瀑布」。
- **標準骨架維護**：
  - 必須包含完整的 `<!DOCTYPE html>`, `<meta charset="UTF-8">` 與 `viewport` 設定。
  - 外連樣式統一置於 `<head>` 內部，JavaScript 腳本統一放在 `<body>` 閉合標籤前，或使用 `defer` 屬性。
- **無障礙友好 (Accessibility)**：
  - 圖片必須提供具實質意義的 `alt` 屬性。
  - 表單元素需搭配對應的 `<label>`。

---

## 3. CSS 規範

- **字型基準**：
  - 嚴格遵守文件規範，未特別指定時，全域字型優先使用「微軟正黑體」：
    ```css
    body {
      font-family: "Microsoft JhengHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    ```
- **重設與盒模型**：
  - 全域預設採用 `box-sizing: border-box;`。
- **命名與維護**：
  - 類別名稱（class name）採用簡潔明瞭的 kebab-case（例如：`task-card`, `btn-primary`）。
  - 樣式權重保持扁平，嚴禁濫用 `!important`（除非你想讓未來的自己痛苦）。
- **響應式佈局 (RWD)**：
  - 採用 Flexbox 或 CSS Grid 佈局。
  - 確保在手機端（窄螢幕）與桌面端皆能正常閱讀與操作，不得出現未受控的水平破版捲軸。

---

## 4. JavaScript 規範

- **變數宣告**：
  - 一律使用 `const` 與 `let`，全面棄用 `var`（讓它留在歷史教材裡即可）。
  - 預設先用 `const`，確定需要重新指派時才用 `let`。
- **DOM 操作與事件生命週期**：
  - 邏輯初始化必須等待 DOM 就緒後執行（例如監聽 `DOMContentLoaded` 事件）。
  - 事件處理統一使用 `addEventListener`，避免覆蓋原生屬性。
- **狀態管理與持久化**：
  - 資料狀態以原生 JavaScript 物件或陣列管理，避免直接將 DOM 作為唯一的狀態儲存容器。
  - 若需要本地持久化，直接使用瀏覽器原生 `localStorage`，並記得妥善處理 `JSON.parse` 可能拋出的異常。
- **乾淨的 Console**：
  - 開發階段使用的除錯日誌（`console.log`），在功能確認無誤或準備提交前應隨手清理，只保留必要的警告或錯誤輸出（`console.warn`, `console.error`）。

---

## 5. Git 與部署規範

- **分支與部署連動**：
  - `main` 為產品發布與 GitHub Pages 連動的主分支。任何推送到 `main` 的程式碼都會直接反映於線上網址，請確認能正常運行再 push。
- **提交訊息 (Conventional Commits)**：
  - 提交訊息簡潔清楚，推薦使用前綴格式：
    - `feat:` 新增功能
    - `fix:` 修復問題
    - `docs:` 文件修改
    - `style:` 不影響邏輯的樣式或程式碼格式調整
    - `refactor:` 重構代碼
- **原子化提交 (Atomic Commit)**：
  - 每次 commit 只專注解決一個問題或完成一項功能，不要把改了一整天且互不相干的十個修改揉成一個叫 "update" 的巨大謎團。
- **機密與敏感資訊**：
  - 本專案公開於 GitHub，嚴禁將 API Key、個人密碼或測試 Token 寫入任何被 Git 追蹤的檔案中。
