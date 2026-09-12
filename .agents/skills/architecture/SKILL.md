---
name: architecture
description: 當需要規劃或重構前端應用系統架構、元件劃分、模組邊界、目錄結構或無依賴/微依賴選型決策時使用。確保架構符合極簡、可靠、易維護與職責分離原則。
---

# 前端系統架構規範 Skill (Architecture)

本 Skill 定義輕量級前端應用的架構設計原則、目錄結構組織規範與技術選型決策框架，確保系統在追求極致開發速度（VibeCoding）的同時，仍保有堅實可維護的結構底層。

---

## 核心架構原則

1. **極簡至上，拒絕過度工程 (KISS Principle)**：
   - 優先採用原生 Web 標準（HTML5、CSS3、ES6+ JavaScript）。
   - 能用原生瀏覽器 API 解決的需求，嚴禁隨意安裝龐大的第三方打包工具或重量級框架。
2. **職責分離 (Separation of Concerns)**：
   - **結構層 (`index.html`)**：僅負責語意化標記與結構骨架，嚴禁寫入樣式或商業邏輯。
   - **外觀層 (`style.css`)**：僅負責版面佈局、顏色與視覺動效，保持 CSS 權重扁平。
   - **行為層 (`app.js`)**：僅負責資料流轉、事件監聽與狀態處理，透過 DOM API 驅動介面更新。
3. **單向資料流 (Unidirectional Data Flow)**：
   - 使用者觸發動作 ➔ 更新狀態模型（State/Store） ➔ 持久化（如 `localStorage`） ➔ 重新渲染視圖（View）。
   - 嚴禁直接將 DOM 節點當成唯一的資料儲存容器。

---

## 標準專案目錄結構

```text
project-root/
├── .agents/                    # Agent 規範、工作流程與技能庫
│   ├── rules/                  # 開發與寫作準則
│   ├── skills/                 # 各領域專用 Skill
│   └── workflows/              # UX 與驗收工作流
├── index.html                  # 網頁進入點與語意化骨架
├── style.css                   # 全域樣式定義與設計系統 Token
├── app.js                      # 核心邏輯、狀態管理與事件處理
├── .nojekyll                   # GitHub Pages 靜態直出防禦標記
└── README.md                   # 專案架構與使用手冊
```

---

## 技術選型決策樹

- **UI 框架評估**：
  - 若應用屬於展示型、微工具、輕量打卡或單一功能頁面 ➔ **堅決使用純原生（Vanilla Web）**。
  - 若應用包含多頁路由、超複雜表單驗證或大型團隊協作 ➔ 才考慮引入輕量 Vite + 原生 Web Components 或微型框架。
- **資料儲存評估**：
  - 輕量個人工具（< 5MB 且單機使用） ➔ 優先選用 `localStorage`。
  - 多媒體、圖檔快取或離線富資料 ➔ 選用 `IndexedDB`。
  - 多人協同與雲端同步 ➔ 引入 BaaS（Firebase / Supabase）。

---

## 架構檢核清單 (Architecture Checklist)

- [ ] 核心檔案是否維持三權分立，無任何 inline style 或 inline JS。
- [ ] 是否已設定明確的靜態部署機制（如 `.nojekyll` 與快取版本號）。
- [ ] 狀態資料是否有單一真相來源，不依賴 DOM 暫存資料。
- [ ] 模組切分是否有清晰的進入點與生命週期管理（如 `DOMContentLoaded`）。
