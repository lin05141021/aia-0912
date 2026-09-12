---
name: code-review
description: 當需要對專案程式碼變更進行審查、評估是否符合架構規範、檢查效能隱患、安全性漏洞、文風合規度或發起 PR 審查時使用。
---

# 程式碼審查與品質把關規範 Skill (Code Review)

本 Skill 定義針對前端 Pull Request 或程式碼修改的審查標準、回饋維度與放行門檻，確保每一筆變更皆維持極簡、強固與規範一致。

---

## 審查五大核心維度

### 1. 架構與職責分離 (Architecture & Separation)
- 是否嚴格遵守 `index.html`（結構）、`style.css`（視覺）、`app.js`（行為）三者分離？
- 是否避免了不必要的第三方套件安裝？能用原生實現者是否過度引入相依性？
- 是否存在將 DOM 節點當作唯一資料儲存容器的反模式？

### 2. 健壯性與資料持久化 (Robustness & State)
- `localStorage` 的存取是否皆有 `try...catch` 保護？
- 在無資料（全新使用者）或儲存被清空時，是否正確顯示「空狀態提示（Empty State）」而非畫面破裂？
- 樂觀更新（Optimistic UI）後，背景持久化邏輯是否具備一致性？

### 3. 安全性防禦 (Security & Sanitation)
- 使用者輸入的文字在渲染至 DOM 前，是否有進行 `escapeHTML` 或採用安全的 `textContent`？
- 是否有任何 API Key、私人 Token 或機密密鑰被意外 commit 到版本庫？

### 4. 樣式與排版細節 (CSS & Typography)
- 是否嚴格遵循「微軟正黑體」為全域預設字型？
- 是否存在濫用 `!important` 破壞權重體系的危險行為？
- 中英文字與數字之間是否保留半形空格？中文標點是否皆為全形？
- 文風是否沉穩務實，無「地表最強」等誇張不實詞藻？

### 5. 部署相容性 (Deployment Safety)
- 外連 CSS 與 JS 是否具備相對路徑防禦（`./`）與快取版本號參數（`?v=...`）？
- 提交訊息是否符合 Conventional Commits 格式（`feat:`, `fix:`, `docs:`）？

---

## 審查回饋等級標籤

審查者在提出 Review Comments 時，應標明嚴重等級以利溝通：

- `[BLOCKER]`：阻礙性問題（如安全性 XSS 漏洞、重大破版、硬編碼金鑰），必須修正後方可合併。
- `[WARNING]`：強烈建議調整（如遺漏快取版本號、缺乏異常處理、未遵循微軟正黑體規範）。
- `[NIT]`：微小優化或程式碼美化（如變數命名建議、微調中英空格），不阻礙上線。

---

## 放行簽核清單 (Merge Checklist)

- [ ] 通過所有 `[BLOCKER]` 項目排查。
- [ ] 本地測試與線上靜態預覽無報錯。
- [ ] 提交紀錄乾淨、原子化，無冗餘除錯日誌（`console.log`）。
