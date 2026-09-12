---
name: state-management
description: 當需要設計前端狀態流轉、資料模型（Data Models）、樂觀更新（Optimistic UI）、本地持久化（localStorage/IndexedDB）或事件委派機制時使用。確保狀態可預測、無殘留與具備容錯力。
---

# 前端狀態管理與持久化規範 Skill (State Management)

本 Skill 定義輕量前端應用的狀態流轉機制、資料持久化實作標準與事件驅動架構，確保應用在無伺服器環境下依然穩定可靠。

---

## 核心設計原則

1. **單一真相來源 (Single Source of Truth)**：
   - 應用資料（如貼文陣列、計數、使用者設定）以 JavaScript 原生物件/陣列儲存於全域記憶體中，DOM 僅作為資料狀態的「投影（Projection）」。
2. **狀態分層管理**：
   - **持久化資料狀態 (Persistent State)**：使用者建立的心得、點讚、留言、書籤（寫入 `localStorage`）。
   - **暫存互動狀態 (Transient UI State)**：彈窗開啟/關閉、圖片上傳預覽、Tab 作用中標籤。
3. **樂觀更新 (Optimistic UI)**：
   - 使用者進行點讚、收藏或發布時，立即更新記憶體模型並反映在畫面（免除等待），背景同步寫入持久化儲存層。

---

## 本地存儲持久化標準實作 (localStorage Wrapper)

```javascript
const STORAGE_KEY = 'aia_user_diary_posts';

/**
 * 安全讀取資料 (含異常處理與備用降級)
 */
function getPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('讀取 localStorage 失敗，使用空陣列降級：', error);
    return [];
  }
}

/**
 * 安全儲存資料 (含配額超限 QuotaExceeded 處理)
 */
function savePosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage 容量超限，建議清理舊紀錄或壓縮圖片');
    } else {
      console.error('寫入 localStorage 發生未預期錯誤：', error);
    }
  }
}
```

---

## 事件委派機制 (Event Delegation)

動態插入的大量卡片或項目，嚴禁為每個節點單獨綁定 `addEventListener`。統一於靜態父容器（如 `#feedContainer`）進行事件委派：

```javascript
feedContainer.addEventListener('click', (e) => {
  const targetBtn = e.target.closest('[data-action]');
  if (!targetBtn) return;

  const action = targetBtn.getAttribute('data-action');
  const card = targetBtn.closest('.post-card');
  const id = card ? card.getAttribute('data-post-id') : null;

  switch (action) {
    case 'like':
      handleLike(id, targetBtn);
      break;
    case 'bookmark':
      handleBookmark(id, targetBtn);
      break;
    case 'share':
      handleShare(id);
      break;
  }
});
```

---

## 檢核標準

- [ ] 所有的狀態異動皆遵循「改模型 ➔ 存資料 ➔ 刷視圖」的順序。
- [ ] 對 `JSON.parse` 與 `localStorage` 調用皆有 `try...catch` 容錯保護。
- [ ] 頁面重新整理（F5）後，所有剛建立的資料、點讚計數與留言能完整復原。
- [ ] 無記憶體洩漏風險，動態元素皆由委派機制處理事件監聽。
