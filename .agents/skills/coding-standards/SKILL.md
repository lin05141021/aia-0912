---
name: coding-standards
description: 當需要規範程式碼撰寫風格、命名規範、文件與標註、Git 提交與分支管理、嚴格遵從微軟正黑體與繁中排版規範時使用。確保程式碼乾淨、團隊協作一致。
---

# 程式碼編寫與工程規範 Skill (Coding Standards)

本 Skill 統整專案的語法標準、命名慣例、排版細節與版本控制規範，與 `.agents/rules/development-guidelines.md` 及 `.agents/rules/docs-writing.md` 保持完全一致。

---

## 程式語言規範

### 1. HTML 規範
- 優先使用語意化標籤（`<header>`, `<main>`, `<article>`, `<section>`, `<footer>`, `<dialog>`）。
- 嚴格禁止在 HTML 標籤內混入行內樣式（`style="..."`）或行內監聽器（`onclick="..."`）。
- 圖片標籤必須提供有實質意涵的 `alt` 屬性與 `loading="lazy"`。
- 表單元素必須搭配對應之 `<label>` 確保無障礙標準。

### 2. CSS 規範
- 類別名稱一律採用 **kebab-case**（例如：`post-card`, `btn-primary`, `topic-box`）。
- 全域預設字型強制採用**微軟正黑體**：
  ```css
  body {
    font-family: "Microsoft JhengHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  ```
- 嚴禁濫用 `!important`，維護階層清晰平坦的 CSS 權重。
- 全域必須宣告 `box-sizing: border-box;`。

### 3. JavaScript 規範
- 全面使用 `const` 與 `let`，嚴格禁止使用 `var`。
- 函式與變數命名採用 **camelCase**，常數與設定鍵採用 **UPPER_SNAKE_CASE**。
- DOM 初始化必須等待生命週期就緒（如監聽 `DOMContentLoaded`）。
- 開發結束並準備提交前，必須徹底清除測試用的 `console.log`，僅保留必要的 `console.warn` 或 `console.error`。

---

## 繁體中文排版與文風規範

- **中英數留空格**：中文字與半形英文單字、數字之間必須保留一個半形空格（例如：`支援 CSS3 與 ES6`、`第 3 次更新`）。
- **全形標點**：中文句子一律採用全形標點符號（`，`、`。`、`！`、`？`、`：`、`；`）。
- **沉穩低調、拒絕浮誇**：文件與 UI 文案禁止使用「地表最強」、「革命性」等自吹自擂口吻，著重事實與具體價值。
- **專有名詞標準大小寫**：如 `GitHub`、`JavaScript`、`HTML`、`CSS`、`Git`、`Node.js`。

---

## Git 提交與分支規範 (Conventional Commits)

每次 commit 必須為原子化提交（Atomic Commit），並採用標準前綴：
- `feat:` 新增功能或元件
- `fix:` 修復錯誤或排版問題
- `docs:` 修改文件、README 或 Agent Rules
- `style:` 不影響邏輯的程式碼格式整理
- `refactor:` 重構程式碼架構

---

## 檢核標準

- [ ] 代碼無任何 `var` 宣告，無行內 style 或行內 JS 監聽器。
- [ ] CSS 類別皆為 kebab-case，字型優先指向微軟正黑體。
- [ ] 中英數混排處皆保有半形空格，中文標點皆為全形。
- [ ] Git commit 訊息結構精準合規，沒有出現含糊不清的 "update" 或 "fix bug"。
