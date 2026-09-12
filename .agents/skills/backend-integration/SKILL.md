---
name: backend-integration
description: 當需要為前端應用串接後端 API、第三方服務、BaaS（Firebase/Supabase）、靜態 Mock API 或處理非同步網路請求、錯誤重試與離線降級時使用。
---

# 後端整合與網路通訊規範 Skill (Backend Integration)

本 Skill 定義前端與遠端服務進行資料交換的架構模式、非同步請求封裝標準、Mock 資料降級機制與安全防禦策略。

---

## 核心整合架構

1. **適配器模式 (Adapter Pattern / API Client)**：
   - 商業邏輯絕不直接散落呼叫原生 `fetch`，統一由 API 模組或 Client 類別集中處理 URL、Headers、Token 與錯誤解析。
2. **無後端優先與 Mock 降級 (Offline First & Mock Fallback)**：
   - 在原型開發或無伺服器環境下，以靜態 JSON 或 `localStorage` 作為 Mock 實作。
   - 當網路斷線或 API 回傳異常時，系統平滑切換至本機快取資料，不跳出致命崩潰視窗。
3. **請求取消與逾時控制 (Timeout & AbortController)**：
   - 所有網路請求皆配置合理的 Timeout 控制（預設 8~10 秒），避免連線無限懸掛。

---

## 原生 Fetch 安全封裝範例

```javascript
/**
 * 輕量非同步 API 請求封裝
 */
async function apiClient(endpoint, options = {}) {
  const { timeout = 8000, ...customConfig } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...customConfig.headers,
    },
    signal: controller.signal,
    ...customConfig,
  };

  try {
    const response = await fetch(endpoint, config);
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`HTTP 錯誤：${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      console.warn('請求逾時已自動取消');
    }
    throw error;
  }
}
```

---

## 安全與資料防護準則

1. **XSS 跨站腳本注入防禦**：
   - 從後端或外部 API 取得的任何文字，在插入 DOM 前必須經過 HTML 轉義：
     ```javascript
     function escapeHTML(str) {
       return String(str).replace(/[&<>'"]/g, tag => ({
         '&': '&amp;',
         '<': '&lt;',
         '>': '&gt;',
         "'": '&#39;',
         '"': '&quot;'
       }[tag] || tag));
     }
     ```
2. **機密資訊嚴格隔離**：
   - 本專案程式碼皆託管於公開 Git 儲存庫，嚴禁將 API Key、私密 Token、後端連線密碼硬編碼（Hardcode）於前端代碼中。
   - 若必須串接付費或私有服務，需透過後端 Proxy 或 Cloud Functions 代理轉發。

---

## 檢核標準

- [ ] API 請求皆有完整的逾時控制與錯誤捕獲機制（`try...catch`）。
- [ ] 外部資料進入畫面時均進行轉義處理，無直接 `innerHTML = rawData` 的漏洞。
- [ ] 離線或網路不佳時，具備友善的 Toast 或 Fallback 提示。
- [ ] 提交的代碼中絕無外洩之機密金鑰或敏感連線字串。
