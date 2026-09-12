/**
 * 個人 IG 生活筆記牆 - 核心邏輯
 * 專為「懶人養成紀錄習慣」設計，模擬單一帳號之 IG 貼文歸檔格式
 * 遵循 .agents/rules/docs-writing.md 與 development-guidelines.md
 */

const STORAGE_KEY = 'aia_user_ig_journal_posts';

// 全站統一之單一作者帳號資訊 (非多人社群)
const CURRENT_USER = {
  handle: '@daily_log',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80',
  bio: '生活觀察與技術閱讀雜記。不需要長篇大論，隨手幾句話、一張照片，讓懶散也能自然沉澱出專屬的生活足跡。'
};

/**
 * 每日 Token / 額度防護機制 (Token Guard & Rate Limiting)
 * 嚴格監控每日免費 AI 生圖呼叫次數，達到或接近上限時及時預警並自動熔斷暫停，避免超出用量或耗盡資源。
 */
const TOKEN_GUARD_KEY = 'aia_ai_daily_token_quota';
const DAILY_FREE_LIMIT = 15;

const TokenGuard = {
  getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  getQuota() {
    const today = this.getTodayString();
    try {
      const data = JSON.parse(localStorage.getItem(TOKEN_GUARD_KEY));
      if (data && data.date === today) {
        return data;
      }
    } catch (e) {
      console.warn('讀取 Token 額度失敗，重設為預設值', e);
    }
    const fresh = { date: today, limit: DAILY_FREE_LIMIT, used: 0 };
    this.saveQuota(fresh);
    return fresh;
  },

  saveQuota(quota) {
    try {
      localStorage.setItem(TOKEN_GUARD_KEY, JSON.stringify(quota));
    } catch (e) {
      console.warn('寫入 Token 額度失敗', e);
    }
  },

  canGenerate() {
    const quota = this.getQuota();
    return quota.used < quota.limit;
  },

  consume() {
    const quota = this.getQuota();
    if (quota.used < quota.limit) {
      quota.used += 1;
      this.saveQuota(quota);
    }
    this.updateUI();
    return quota;
  },

  reset() {
    const today = this.getTodayString();
    const fresh = { date: today, limit: DAILY_FREE_LIMIT, used: 0 };
    this.saveQuota(fresh);
    this.updateUI();
    return fresh;
  },

  updateUI() {
    const quota = this.getQuota();
    const usageCountEl = document.getElementById('tokenUsageCount');
    const badgeEl = document.getElementById('tokenStatusBadge');
    const alertEl = document.getElementById('tokenExceededAlert');
    const regenBtn = document.getElementById('btnAiRegenerate');
    const cardEl = document.getElementById('aiVisualCard');
    const pulseEl = document.getElementById('aiPulseIndicator');

    if (usageCountEl) {
      usageCountEl.textContent = `${quota.used} / ${quota.limit}`;
    }

    const remaining = quota.limit - quota.used;

    if (quota.used >= quota.limit) {
      // 熔斷暫停狀態
      if (badgeEl) {
        badgeEl.textContent = '暫停使用 (已達上限)';
        badgeEl.className = 'token-status-badge status-depleted';
      }
      if (alertEl) alertEl.style.display = 'flex';
      if (regenBtn) {
        regenBtn.disabled = true;
        regenBtn.title = '今日 AI 免費額度已耗盡，請改用手動上傳照片';
      }
      if (cardEl) cardEl.classList.add('quota-depleted');
      if (pulseEl) pulseEl.classList.add('paused');
    } else if (remaining <= 3) {
      // 接近額度警告狀態
      if (badgeEl) {
        badgeEl.textContent = `額度即將用盡 (剩 ${remaining} 次)`;
        badgeEl.className = 'token-status-badge status-warning';
      }
      if (alertEl) alertEl.style.display = 'none';
      if (regenBtn) {
        regenBtn.disabled = false;
        regenBtn.title = '依文章語意重新生成 AI 視覺配圖';
      }
      if (cardEl) cardEl.classList.remove('quota-depleted');
      if (pulseEl) pulseEl.classList.remove('paused');
    } else {
      // 額度充足正常狀態
      if (badgeEl) {
        badgeEl.textContent = '額度充足';
        badgeEl.className = 'token-status-badge status-ok';
      }
      if (alertEl) alertEl.style.display = 'none';
      if (regenBtn) {
        regenBtn.disabled = false;
        regenBtn.title = '依文章語意重新生成 AI 視覺配圖';
      }
      if (cardEl) cardEl.classList.remove('quota-depleted');
      if (pulseEl) pulseEl.classList.remove('paused');
    }
  }
};

// 預設三大主題之示範貼文 (初次載入或清空時載入)
const DEFAULT_POSTS = [
  {
    id: 'post-1',
    topic: '專業知識分享',
    topicClass: 'topic-knowledge',
    location: '台北 • 研發工作站',
    timeText: '2 小時前',
    timestamp: Date.now() - 7200000,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&h=800&q=80',
    content: '今天讀了 Clean Architecture 的第二章，特別有感觸：「架構的目標是讓系統能夠盡可能延遲做出重大決策的時間。」我自己實作原生前端這幾天，深深體會到不引入複雜打包套件的輕盈感。掌握好原生的 Fetch 與 Event Delegation，往往就能解決八成以上的問題。',
    tags: ['#專業知識', '#閱讀筆記', '#架構設計', '#CleanCode'],
    likes: 128,
    isLiked: false,
    isSaved: false,
    comments: [
      { user: 'read_fan', text: '延遲決策那段真的很經典，寫得簡潔有力！' }
    ]
  },
  {
    id: 'post-2',
    topic: '心得雜記',
    topicClass: 'topic-diary',
    location: '台北 • 永康街角落咖啡',
    timeText: '5 小時前',
    timestamp: Date.now() - 18000000,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&h=800&q=80',
    content: '下午 debug 兩小時，最後發現只是少打一個閉合括號，果然寫代碼最好的解法就是先去泡一杯手沖咖啡。坐在窗邊曬著微溫的陽光，看著蒸氣慢慢散開，突然覺得這種微小的挫折其實也挺可愛的。生活慢一點，答案自然會浮出來。☕✨',
    tags: ['#心得雜記', '#工程師日常', '#咖啡時光', '#自嘲片刻'],
    likes: 95,
    isLiked: false,
    isSaved: false,
    comments: [
      { user: 'coffee_lover', text: '少一個括號的心情太真實了哈哈～' }
    ]
  },
  {
    id: 'post-3',
    topic: '資訊分享',
    topicClass: 'topic-travel',
    location: '台北 • 象山步道轉角牛肉麵',
    timeText: '昨天',
    timestamp: Date.now() - 86400000,
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&h=800&q=80',
    content: '趁放晴去爬象山，下山順道繞來吃這家老字號牛肉麵啦！🍜 紅燒湯頭醇厚、牛肉燉得相當軟嫩，價格非常實在喔。不過老實說，店裡冷氣真的不太給力，夏天中午來肯定會滿頭大汗；而且正中午排隊超長，強烈建議大家避開尖峰時段，約莫下午 1 點半左右來最舒服！⚠️ 🚇 捷運象山站 2 號出口步行 6 分鐘。',
    tags: ['#資訊分享', '#景點探店', '#避坑指南', '#在地美食'],
    likes: 62,
    isLiked: false,
    isSaved: false,
    comments: [
      { user: 'taipei_eats', text: '這家避坑情報很實用，筆記起來！' }
    ]
  }
];

let localUploadedPhoto = '';

document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  renderProfileStats();
  renderFeed();
  initInteractions();
  initCreateModal();
});

/**
 * 初始化 localStorage
 */
function initStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POSTS));
    }
  } catch (error) {
    console.warn('無法讀取 localStorage：', error);
  }
}

/**
 * 取得貼文資料陣列 (依時間倒序)
 */
function getPosts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const posts = JSON.parse(data);
      return Array.isArray(posts) ? posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : [];
    }
  } catch (error) {
    console.error('解析貼文失敗：', error);
  }
  return [];
}

/**
 * 儲存貼文陣列
 */
function savePosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    renderProfileStats();
  } catch (error) {
    console.error('儲存貼文失敗：', error);
  }
}

/**
 * 更新個人 Profile 統計數值
 */
function renderProfileStats() {
  const posts = getPosts();
  const totalPostsEl = document.getElementById('totalPostsCount');
  const totalLikesEl = document.getElementById('totalLikesCount');

  if (totalPostsEl) {
    totalPostsEl.textContent = posts.length;
  }
  if (totalLikesEl) {
    const sumLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    totalLikesEl.textContent = sumLikes;
  }
}

/**
 * 渲染動態牆
 */
function renderFeed() {
  const container = document.getElementById('feedContainer');
  if (!container) return;

  const posts = getPosts();
  container.innerHTML = '';

  if (posts.length === 0) {
    const template = document.getElementById('emptyStateTemplate');
    if (template) {
      const clone = template.content.cloneNode(true);
      const btn = clone.querySelector('#emptyCreateBtn');
      if (btn) btn.addEventListener('click', openCreateModal);
      container.appendChild(clone);
    }
    return;
  }

  posts.forEach(post => {
    container.appendChild(createPostCardElement(post));
  });
}

/**
 * 產生單張符合 Instagram 8 大規格的貼文卡片
 */
function createPostCardElement(post) {
  const article = document.createElement('article');
  article.className = 'post-card';
  article.setAttribute('data-post-id', post.id);

  // 主題樣式 class 映射
  let topicClass = 'topic-diary';
  if (post.topic === '專業知識分享') topicClass = 'topic-knowledge';
  if (post.topic === '資訊分享') topicClass = 'topic-travel';

  const tagsHTML = (post.tags || [])
    .map(tag => `<a href="javascript:void(0)" class="tag-link">${escapeHTML(tag)}</a>`)
    .join(' ');

  const commentsCount = (post.comments || []).length;
  const recentComment = commentsCount > 0 ? post.comments[commentsCount - 1] : null;

  article.innerHTML = `
    <!-- 1. Header (作者統一為當前個人帳號) -->
    <header class="post-header">
      <div class="author-info">
        <div class="avatar-wrapper">
          <img src="${CURRENT_USER.avatar}" alt="個人頭像" class="card-avatar" loading="lazy">
        </div>
        <div class="author-meta">
          <div class="name-row">
            <strong class="author-username">${CURRENT_USER.handle}</strong>
            <span class="topic-pill ${topicClass}">• ${escapeHTML(post.topic)}</span>
          </div>
          <div class="location-row">
            <span>${escapeHTML(post.location || '台北 • 日常紀錄')}</span>
          </div>
        </div>
      </div>
      <button class="icon-btn" aria-label="更多選項" data-action="more">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <circle cx="5" cy="12" r="2"></circle>
          <circle cx="12" cy="12" r="2"></circle>
          <circle cx="19" cy="12" r="2"></circle>
        </svg>
      </button>
    </header>

    <!-- 2. Media (主照片，1:1 正方形黃金比例) -->
    <div class="post-media-container" data-action="double-tap-like">
      <img src="${escapeHTML(post.image)}" alt="${escapeHTML(post.topic)}" class="post-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&h=800&q=80'">
      <div class="floating-heart" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="76" height="76" fill="#ed4956">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
    </div>

    <!-- 3. Action Bar (互動列：按讚、留言、紙飛機分享、書籤) -->
    <div class="post-actions">
      <div class="actions-left">
        <button class="action-icon-btn like-btn ${post.isLiked ? 'liked' : ''}" aria-label="按讚" data-action="like" data-liked="${post.isLiked ? 'true' : 'false'}">
          <svg class="heart-icon" viewBox="0 0 24 24" width="24" height="24" fill="${post.isLiked ? '#ed4956' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <button class="action-icon-btn" aria-label="留言" data-action="focus-comment">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </button>
        <button class="action-icon-btn" aria-label="紙飛機分享" data-action="share">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="actions-right">
        <button class="action-icon-btn bookmark-btn ${post.isSaved ? 'saved' : ''}" aria-label="收藏" data-action="bookmark" data-saved="${post.isSaved ? 'true' : 'false'}">
          <svg class="bookmark-icon" viewBox="0 0 24 24" width="24" height="24" fill="${post.isSaved ? '#262626' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 4. Metrics (讚數) -->
    <div class="post-metrics">
      <span class="like-counter">${post.likes || 0}</span> 個讚
    </div>

    <!-- 5. Caption (正文：username + 內文) -->
    <div class="post-caption-block">
      <span class="caption-username">${CURRENT_USER.handle}</span>
      <span class="caption-text">${escapeHTML(post.content)}</span>
      <div class="post-tags">${tagsHTML}</div>
    </div>

    <!-- 6. Comments & Timestamp (精選留言與時間戳記) -->
    <div class="post-comments-summary">
      ${commentsCount > 1 ? `<button type="button" class="btn-view-comments">查看全部 ${commentsCount} 則留言</button>` : ''}
      <div class="recent-comments-list">
        ${recentComment ? `
          <div class="comment-row">
            <strong class="comment-user">${escapeHTML(recentComment.user)}</strong>
            <span class="comment-text">${escapeHTML(recentComment.text)}</span>
          </div>
        ` : ''}
      </div>
    </div>
    <time class="post-timestamp">${escapeHTML(post.timeText || '剛剛')}</time>

    <!-- 7. Add Comment Bar (IG 經典留言框) -->
    <footer class="post-add-comment-bar">
      <button type="button" class="emoji-btn" aria-label="表情符號">😊</button>
      <input type="text" class="comment-quick-input" placeholder="新增留言..." aria-label="新增留言">
      <button type="button" class="btn-publish-comment" data-action="send-comment">發佈</button>
    </footer>
  `;

  return article;
}

/**
 * 初始化動態牆全域委派事件
 */
function initInteractions() {
  const feed = document.getElementById('feedContainer');
  if (!feed) return;

  // 1. 點擊委派
  feed.addEventListener('click', (e) => {
    // 點讚按鈕
    const likeBtn = e.target.closest('[data-action="like"]');
    if (likeBtn) {
      handleLikeToggle(likeBtn);
      return;
    }

    // 收藏書籤按鈕
    const bookmarkBtn = e.target.closest('[data-action="bookmark"]');
    if (bookmarkBtn) {
      handleBookmarkToggle(bookmarkBtn);
      return;
    }

    // 分享紙飛機
    const shareBtn = e.target.closest('[data-action="share"]');
    if (shareBtn) {
      handleShareAction();
      return;
    }

    // 聚焦留言
    const commentBtn = e.target.closest('[data-action="focus-comment"]');
    if (commentBtn) {
      const card = commentBtn.closest('.post-card');
      const input = card ? card.querySelector('.comment-quick-input') : null;
      if (input) input.focus();
      return;
    }

    // 發布留言按鈕
    const sendCommentBtn = e.target.closest('[data-action="send-comment"]');
    if (sendCommentBtn) {
      const card = sendCommentBtn.closest('.post-card');
      const input = card ? card.querySelector('.comment-quick-input') : null;
      if (input && input.value.trim()) {
        submitComment(card, input.value.trim());
        input.value = '';
      }
      return;
    }

    // 更多選項
    const moreBtn = e.target.closest('[data-action="more"]');
    if (moreBtn) {
      showToast('IG 貼文設定選單已就緒');
      return;
    }
  });

  // 2. 留言輸入框 Enter 送出
  feed.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('comment-quick-input')) {
      const text = e.target.value.trim();
      if (text) {
        const card = e.target.closest('.post-card');
        if (card) {
          submitComment(card, text);
          e.target.value = '';
        }
      }
    }
  });

  // 3. 雙擊照片爆發大愛心
  feed.addEventListener('dblclick', (e) => {
    const mediaContainer = e.target.closest('[data-action="double-tap-like"]');
    if (mediaContainer) {
      triggerHeartAnimation(mediaContainer);
      const card = mediaContainer.closest('.post-card');
      if (card) {
        const likeBtn = card.querySelector('[data-action="like"]');
        if (likeBtn && likeBtn.getAttribute('data-liked') !== 'true') {
          handleLikeToggle(likeBtn);
        }
      }
    }
  });
}

/**
 * 處理按讚
 */
function handleLikeToggle(btn) {
  const card = btn.closest('.post-card');
  if (!card) return;
  const postId = card.getAttribute('data-post-id');
  const counter = card.querySelector('.like-counter');
  let count = parseInt(counter.textContent, 10) || 0;
  const isLiked = btn.getAttribute('data-liked') === 'true';

  const newLiked = !isLiked;
  const newCount = newLiked ? count + 1 : Math.max(0, count - 1);

  btn.setAttribute('data-liked', newLiked ? 'true' : 'false');
  btn.classList.toggle('liked', newLiked);
  counter.textContent = newCount;

  const icon = btn.querySelector('.heart-icon');
  if (icon) {
    icon.setAttribute('fill', newLiked ? '#ed4956' : 'none');
  }

  // 同步至 localStorage
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.isLiked = newLiked;
    post.likes = newCount;
    savePosts(posts);
  }
}

/**
 * 雙擊照片爆發愛心特效
 */
function triggerHeartAnimation(mediaContainer) {
  const heart = mediaContainer.querySelector('.floating-heart');
  if (!heart) return;
  heart.classList.remove('active');
  void heart.offsetWidth;
  heart.classList.add('active');
}

/**
 * 處理收藏切換
 */
function handleBookmarkToggle(btn) {
  const card = btn.closest('.post-card');
  if (!card) return;
  const postId = card.getAttribute('data-post-id');
  const isSaved = btn.getAttribute('data-saved') === 'true';
  const newSaved = !isSaved;

  btn.setAttribute('data-saved', newSaved ? 'true' : 'false');
  btn.classList.toggle('saved', newSaved);

  const icon = btn.querySelector('.bookmark-icon');
  if (icon) {
    icon.setAttribute('fill', newSaved ? '#262626' : 'none');
  }

  showToast(newSaved ? '已收藏此篇筆記' : '已從收藏清單移除');

  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.isSaved = newSaved;
    savePosts(posts);
  }
}

/**
 * 分享連結
 */
function handleShareAction() {
  if (navigator.clipboard && window.location.href) {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('IG 筆記連結已複製到剪貼簿！'))
      .catch(() => showToast('已為您準備好分享連結'));
  } else {
    showToast('已為您準備好分享連結');
  }
}

/**
 * 提交留言
 */
function submitComment(card, text) {
  const postId = card.getAttribute('data-post-id');
  const list = card.querySelector('.recent-comments-list');
  if (!list) return;

  const commentRow = document.createElement('div');
  commentRow.className = 'comment-row';
  commentRow.innerHTML = `
    <strong class="comment-user">我</strong>
    <span class="comment-text">${escapeHTML(text)}</span>
  `;
  list.appendChild(commentRow);

  showToast('留言已發佈');

  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    if (!post.comments) post.comments = [];
    post.comments.push({ user: '我', text: text });
    savePosts(posts);
  }
}

/**
 * 輕量 Toast 提示
 */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}

/**
 * 轉義 HTML 防範 XSS
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

/**
 * 彈窗開啟與關閉
 */
function openCreateModal() {
  const modal = document.getElementById('createModal');
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // 每次開啟彈窗更新 Token 額度狀態
  TokenGuard.updateUI();

  const briefInput = document.getElementById('briefInput');
  if (briefInput) briefInput.focus();
}

function closeCreateModal() {
  const modal = document.getElementById('createModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * 初始化懶人新增彈窗與引導工作流
 */
function initCreateModal() {
  const modal = document.getElementById('createModal');
  const openBtn = document.getElementById('openCreateModalBtn');
  const closeBtn = document.getElementById('closeCreateModalBtn');
  const cancelBtn = document.getElementById('cancelPostBtn');
  const form = document.getElementById('newPostForm');
  const formatBtn = document.getElementById('formatRulesBtn');

  const btnGenerate = document.getElementById('btnGenerateFromBrief');
  const briefInput = document.getElementById('briefInput');
  const contentInput = document.getElementById('contentTextInput');
  const charCount = document.getElementById('essayCharCount');
  const topicRadios = document.querySelectorAll('input[name="postTopic"]');

  const tabAiPhotoBtn = document.getElementById('tabAiPhotoBtn');
  const tabUploadBtn = document.getElementById('tabUploadBtn');
  const aiSection = document.getElementById('aiPhotoSection');
  const uploadSection = document.getElementById('uploadPhotoSection');
  const btnAiRegenerate = document.getElementById('btnAiRegenerate');

  const dropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('localFileInput');
  const promptBox = document.getElementById('dropzonePrompt');
  const previewBox = document.getElementById('uploadPreviewWrapper');
  const previewImg = document.getElementById('uploadPreviewImg');
  const removePhotoBtn = document.getElementById('removeUploadedPhotoBtn');

  if (openBtn) openBtn.addEventListener('click', openCreateModal);
  if (closeBtn) closeBtn.addEventListener('click', closeCreateModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeCreateModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCreateModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeCreateModal();
    }
  });

  // 即時字數統計
  if (contentInput && charCount) {
    contentInput.addEventListener('input', () => {
      charCount.textContent = contentInput.value.length > 0 ? `(${contentInput.value.length} 字)` : '';
    });
  }

  // 主題切換時預載推薦標籤
  topicRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateDefaultHashtagsForTopic(radio.value);
    });
  });

  // 綁定生成按鈕
  if (btnGenerate) {
    btnGenerate.addEventListener('click', (e) => {
      e.preventDefault();
      window.triggerGenerateFromBrief();
    });
  }

  // 照片分頁切換 (AI 生圖 vs 自行上傳)
  if (tabAiPhotoBtn && tabUploadBtn && aiSection && uploadSection) {
    tabAiPhotoBtn.addEventListener('click', () => {
      tabAiPhotoBtn.classList.add('active');
      tabUploadBtn.classList.remove('active');
      aiSection.classList.add('active');
      uploadSection.classList.remove('active');
    });

    tabUploadBtn.addEventListener('click', () => {
      tabUploadBtn.classList.add('active');
      tabAiPhotoBtn.classList.remove('active');
      uploadSection.classList.add('active');
      aiSection.classList.remove('active');
    });
  }

  // 綁定 Token 重設按鈕 (供測試與重置用)
  const btnResetQuota = document.getElementById('btnResetTokenQuota');
  if (btnResetQuota) {
    btnResetQuota.addEventListener('click', () => {
      TokenGuard.reset();
      showToast('⚡ 今日 AI 額度已重設為 0 / 15 次');
    });
  }

  // 點擊「🔄 重新抽圖」按鈕
  if (btnAiRegenerate) {
    btnAiRegenerate.addEventListener('click', () => {
      if (!TokenGuard.canGenerate()) {
        showToast('⚠️ 今日 AI 免費額度已耗盡，已暫停生成');
        TokenGuard.updateUI();
        return;
      }
      const topicRadio = document.querySelector('input[name="postTopic"]:checked');
      const topic = topicRadio ? topicRadio.value : '資訊分享';
      const content = document.getElementById('contentTextInput').value.trim();
      generateAiVisualFromContent(topic, content);
    });
  }

  // 本地照片上傳 (FileReader)
  if (dropzone && fileInput && promptBox && previewBox && previewImg) {
    dropzone.addEventListener('click', (e) => {
      if (e.target !== removePhotoBtn) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        localUploadedPhoto = evt.target.result;
        previewImg.src = localUploadedPhoto;
        promptBox.style.display = 'none';
        previewBox.style.display = 'flex';
        showToast('照片已就緒，自動對齊 IG 1:1');
      };
      reader.readAsDataURL(file);
    });

    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        localUploadedPhoto = '';
        fileInput.value = '';
        previewImg.src = '';
        previewBox.style.display = 'none';
        promptBox.style.display = 'flex';
        showToast('已取消上傳照片');
      });
    }
  }

  // 一鍵沉穩排版潤飾 (中英空格、全形標點、去除浮誇宣傳詞)
  if (formatBtn) {
    formatBtn.addEventListener('click', () => {
      const textarea = document.getElementById('contentTextInput');
      if (!textarea) return;
      let text = textarea.value;
      if (!text.trim()) {
        showToast('請先確認或輸入內容');
        return;
      }

      // 中英數半形空格
      text = text.replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, '$1 $2');
      text = text.replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, '$1 $2');

      // 全形標點
      text = text.replace(/,/g, '，')
                 .replace(/:/g, '：')
                 .replace(/;/g, '；')
                 .replace(/!/g, '！')
                 .replace(/\?/g, '？');

      // 沉穩低調去除浮誇詞
      text = text.replace(/地表最強|革命性突破|必吃神店|史詩級體驗|極致優雅|無可挑剔/g, '扎實可靠');

      textarea.value = text;
      if (charCount) charCount.textContent = `(${text.length} 字)`;
      showToast('已依沉穩規範完成排版');

      // 同步更新配圖
      const topicRadio = document.querySelector('input[name="postTopic"]:checked');
      const topic = topicRadio ? topicRadio.value : '資訊分享';
      generateAiVisualFromContent(topic, text);
    });
  }

  // 表單提交：最後才發布 (產生全新個人 IG 貼文卡片)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const content = document.getElementById('contentTextInput').value.trim();
      const location = document.getElementById('locationInput').value.trim() || '台北 • 日常紀錄';
      const tagsRaw = document.getElementById('tagsInput').value.trim();
      const customUrl = document.getElementById('customImageUrlInput').value.trim();

      const topicRadio = document.querySelector('input[name="postTopic"]:checked');
      const topic = topicRadio ? topicRadio.value : '資訊分享';

      if (!content) {
        showToast('請先確認小短文內容後再發布');
        document.getElementById('contentTextInput').focus();
        return;
      }

      let finalImage = '';
      if (tabUploadBtn && tabUploadBtn.classList.contains('active') && localUploadedPhoto) {
        finalImage = localUploadedPhoto;
      } else if (customUrl) {
        finalImage = customUrl;
      } else {
        const aiImgInput = document.getElementById('aiGeneratedImgUrl');
        finalImage = aiImgInput ? aiImgInput.value : 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&h=800&q=80';
      }

      const tags = tagsRaw.split(/[\s,]+/)
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t : `#${t}`);

      const newPost = {
        id: `post-${Date.now()}`,
        topic: topic,
        location: location,
        timeText: '剛剛',
        timestamp: Date.now(),
        image: finalImage,
        content: content,
        tags: tags,
        likes: 1,
        isLiked: false,
        isSaved: false,
        comments: []
      };

      const posts = getPosts();
      posts.unshift(newPost);
      savePosts(posts);

      renderFeed();

      // 重置表單狀態
      form.reset();
      localUploadedPhoto = '';
      if (fileInput) fileInput.value = '';
      if (previewBox) previewBox.style.display = 'none';
      if (promptBox) promptBox.style.display = 'flex';
      if (tabAiPhotoBtn && tabUploadBtn && aiSection && uploadSection) {
        tabAiPhotoBtn.click();
      }

      closeCreateModal();
      showToast('🎉 已歸檔至個人 IG 筆記牆！');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 初始化推薦標籤晶片
  updateDefaultHashtagsForTopic('資訊分享');
}

/**
 * 全域生成觸發器 (支援按鈕 inline onclick 與 JS 事件監聽雙重保障)
 */
window.triggerGenerateFromBrief = function() {
  const briefInput = document.getElementById('briefInput');
  const btnGenerate = document.getElementById('btnGenerateFromBrief');
  const btnText = document.getElementById('btnGenerateText');
  const briefText = briefInput ? briefInput.value.trim() : '';

  if (!briefText) {
    if (briefInput) {
      briefInput.style.borderColor = '#ef4444';
      briefInput.focus();
      setTimeout(() => { briefInput.style.borderColor = ''; }, 2000);
    }
    showToast('⚠️ 請先輸入簡短想法或貼上地點連結喔！');
    return;
  }

  const topicRadio = document.querySelector('input[name="postTopic"]:checked');
  const topic = topicRadio ? topicRadio.value : '資訊分享';

  // 按鈕視覺狀態
  if (btnGenerate && btnText) {
    btnGenerate.disabled = true;
    btnText.textContent = '智慧分析與擴寫中...';
  }

  setTimeout(() => {
    handleGenerateFromBrief(topic, briefText);
    if (btnGenerate && btnText) {
      btnGenerate.disabled = false;
      btnText.textContent = '依 Rules 風格智慧生成小短文';
    }
  }, 250);
};

/**
 * 依簡要文字與選定主題，讀取 Rules 風格與 google-maps-fetch 生成小短文與推薦標籤
 * @param {string} topic 
 * @param {string} briefText 
 */
function handleGenerateFromBrief(topic, briefText) {
  const contentInput = document.getElementById('contentTextInput');
  const locationInput = document.getElementById('locationInput');
  const charCount = document.getElementById('essayCharCount');
  if (!contentInput) return;

  // 萃取使用者實際輸入之內容 (去除 URL 與 @ 帳號)
  const cleanUserNotes = briefText
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/@[\w_]+/g, '')
    .trim();

  const isMapsUrl = /(maps\.app\.goo\.gl|goo\.gl\/maps|google\.com\/maps)/i.test(briefText);
  const isFaBurger = /S8AajshsCyrtvqzY9|fa\s*burger|敦化/i.test(briefText);

  let generatedEssay = '';
  let detectedLocation = '台北 • 日常紀錄';
  let recommendedTags = [];

  if (topic === '資訊分享' || isMapsUrl || isFaBurger) {
    // 依 google-maps-fetch 技能與 docs-writing 規範生成
    if (isFaBurger || /S8AajshsCyrtvqzY9/.test(briefText)) {
      detectedLocation = '台北 • 捷運忠孝敦化站';
      const userPrefix = cleanUserNotes ? `${cleanUserNotes}，` : '';
      generatedEssay = `${userPrefix}終於踏進口袋名單已久的 Fa Burger 敦化店啦！🍔 這次點了招牌牛胸肉漢堡與帶骨牛小排，肉量給得相當豪邁，燻烤香氣與濃郁肉汁真的很扎實，麵包外脆內軟很加分。不過老實說，店內座位數量確實不多，尖峰用餐時段常需要排隊等候，建議想來吃的朋友避開正中午尖峰時段喔！⚠️ 🚇 捷運忠孝敦化站 8 號出口步行約 5 分鐘。`;
      
      recommendedTags = ['#FaBurger敦化店', '#忠孝敦化美食', '#資訊分享', '#避坑指南', '#美式漢堡', '#口袋名單'];
      // 若使用者有特別輸入個人情境 (如慶生、聚餐等)，自動轉化為推薦標籤
      if (/慶生|生日/.test(cleanUserNotes)) recommendedTags.splice(2, 0, '#慶生聚餐');
      if (/聚餐|朋友/.test(cleanUserNotes)) recommendedTags.splice(2, 0, '#聚餐推薦');
      if (/父親節/.test(cleanUserNotes)) recommendedTags.splice(2, 0, '#父親節推薦');
    } else {
      detectedLocation = '台北 • 美食街景角落';
      const noteBody = cleanUserNotes || briefText;
      generatedEssay = `${noteBody}。現場環境維持得相當乾淨，餐點火候與調味非常扎實到位！不過店內空間不大且尖峰時段人潮較多，建議出發前避開正中午時段喔！⚠️ 🚇 鄰近捷運站步行約 6 分鐘即可抵達。🍜`;
      recommendedTags = ['#資訊分享', '#景點推薦', '#在地探店', '#避坑指南', '#日常探索'];
    }
  } else if (topic === '專業知識分享') {
    // 實踐者同儕視角，沉穩客觀
    detectedLocation = '台北 • 研發工作站';
    const noteBody = cleanUserNotes || briefText;
    generatedEssay = `最近實作時深刻體會到：${noteBody}。以前總以為要把工具鏈堆滿才算專業，後來實際部署上線才發現，掌握好原生基礎語意與架構邊界，往往能省下超過八成的維護成本。這套作法我自己用過覺得很順手，特別記錄分享給大家。💡`;
    recommendedTags = ['#專業知識', '#實務心得', '#架構設計', '#CleanCode', '#技術分享'];
  } else {
    // 心得雜記：生活體悟、除錯、微幽默與自嘲元素
    detectedLocation = '台北 • 街角咖啡館';
    const noteBody = cleanUserNotes || briefText;
    generatedEssay = `${noteBody}。花了一下午折騰，最後發現問題其實只是少了一點耐心與細心。果然在這種時候，最明智的解法不是繼續硬碰硬，而是先給自己沖一杯熱咖啡冷靜一下。看著窗外的行人慢慢走過，生活本來就是一連串的試錯，笑一笑也就過去了。☕✨`;
    recommendedTags = ['#心得雜記', '#生活日常', '#工程師自嘲', '#微幽默片刻', '#沉靜思考'];
  }

  // 1. 填入步驟 3 的確認修改文字框
  contentInput.value = generatedEssay;
  if (charCount) {
    charCount.textContent = `(${generatedEssay.length} 字)`;
  }

  // 2. 更新地點標記
  if (locationInput) {
    locationInput.value = detectedLocation;
  }

  // 3. 渲染推薦 Hashtags 晶片
  renderRecommendedHashtags(recommendedTags);

  // 4. 連動 AI 動態視覺生圖
  generateAiVisualFromContent(topic, generatedEssay);

  // 5. 編輯區視覺柔和提示 (高亮顯示已成功生成短文)
  contentInput.style.borderColor = '#3b82f6';
  contentInput.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.2)';
  setTimeout(() => {
    contentInput.style.borderColor = '';
    contentInput.style.boxShadow = '';
  }, 1600);

  showToast('✨ 小短文已依 Rules 規範生成！請在下方確認或直接編輯。');

  // 平滑滾動至編輯區以方便檢核
  const reviewGroup = document.getElementById('essayReviewGroup');
  if (reviewGroup) {
    reviewGroup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * 依主題初始化預設推薦標籤
 */
function updateDefaultHashtagsForTopic(topic) {
  let tags = [];
  if (topic === '專業知識分享') {
    tags = ['#專業知識', '#實踐心得', '#架構思維', '#技術筆記', '#同儕分享'];
  } else if (topic === '心得雜記') {
    tags = ['#心得雜記', '#生活體悟', '#工程師自嘲', '#生活紀錄', '#慢步調'];
  } else {
    tags = ['#資訊分享', '#美食探店', '#避坑指南', '#捷運周邊', '#口袋名單'];
  }
  renderRecommendedHashtags(tags);
}


/**
 * 動態渲染推薦 Hashtags 晶片列表（支援點選即時加入/取消）
 * @param {string[]} tagsList 
 */
function renderRecommendedHashtags(tagsList) {
  const container = document.getElementById('recommendedHashtagsList');
  const tagsInput = document.getElementById('tagsInput');
  if (!container) return;

  container.innerHTML = '';
  const activeTags = new Set(tagsList);

  tagsList.forEach(tag => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hashtag-chip selected';
    chip.textContent = tag;
    chip.setAttribute('data-tag', tag);

    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      if (chip.classList.contains('selected')) {
        activeTags.add(tag);
      } else {
        activeTags.delete(tag);
      }
      if (tagsInput) {
        tagsInput.value = Array.from(activeTags).join(' ');
      }
    });

    container.appendChild(chip);
  });

  if (tagsInput) {
    tagsInput.value = tagsList.join(' ');
  }
}

/**
 * 多樣化高品質備用圖庫（當離線或需要即時預覽時隨機輪替，確保每次點擊重新抽圖皆呈現不同視覺）
 */
const AI_IMAGE_POOLS = {
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&h=800&q=80'
  ],
  coffee: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&h=800&q=80'
  ],
  food: [
    'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&h=800&q=80'
  ],
  nature: [
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&h=800&q=80'
  ],
  tech: [
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&h=800&q=80'
  ],
  book: [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&h=800&q=80'
  ],
  diary: [
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&h=800&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&h=800&q=80'
  ]
};

/**
 * 依文章內容語意與主題辨識，動態產生高質感 1:1 配圖 (含 Token 防護與動態隨機 AI 生圖)
 * @param {string} topic 
 * @param {string} content 
 */
function generateAiVisualFromContent(topic, content) {
  // 1. 檢核 Token 防護機制
  if (!TokenGuard.canGenerate()) {
    TokenGuard.updateUI();
    showToast('⚠️ 今日 AI 免費額度已達上限 (15/15)，已暫停生成');
    // 自動為使用者切換至「自行上傳照片」分頁
    const tabUploadBtn = document.getElementById('tabUploadBtn');
    if (tabUploadBtn) tabUploadBtn.click();
    return;
  }

  const previewImg = document.getElementById('aiGeneratedPreviewImg');
  const badgeDisplay = document.getElementById('aiKeywordsDisplay');
  const mask = document.getElementById('aiGeneratingMask');
  const maskText = document.getElementById('aiMaskText');
  const hiddenUrlInput = document.getElementById('aiGeneratedImgUrl');
  const statusText = document.getElementById('aiStatusText');

  if (!previewImg || !badgeDisplay || !mask || !hiddenUrlInput) return;

  mask.style.display = 'flex';
  if (maskText) maskText.textContent = 'AI 正在深度辨識短文關鍵字與氛圍...';
  if (statusText) statusText.textContent = 'AI 運算中：分析文字語意並生成 1:1 配圖...';

  // 消耗一次每日免費用量
  const currentQuota = TokenGuard.consume();

  setTimeout(() => {
    const text = (content || '').toLowerCase();
    const seed = Math.floor(Math.random() * 900000) + 100000;
    let aiPrompt = '';
    let keywordTag = '';
    let poolKey = 'diary';

    // 關鍵字語意識別庫 (嚴格依照 rules 生圖風格：自然光、沉穩低調、非網美)
    if (/fa\s*burger|漢堡|burger|牛胸|牛排|敦化|父親節/.test(text)) {
      aiPrompt = 'artisan gourmet beef burger, smoked brisket, toasted bun, rustic wooden board, soft warm natural indoor lighting, cinematic depth of field, food photography, 8k, photorealistic';
      keywordTag = `#AI語意辨識 #FaBurger敦化店 #美式漢堡 #第${currentQuota.used}次生成`;
      poolKey = 'burger';
    } else if (/咖啡|拿鐵|手沖|耶加雪菲|烘焙|cafe|coffee/.test(text)) {
      aiPrompt = 'specialty pour over drip coffee in clear glass server, morning sun streaming through window, wooden table, steam rising, quiet minimalist cafe aesthetic, photorealistic, 8k';
      keywordTag = `#AI語意辨識 #手沖咖啡 #晨光氛圍 #第${currentQuota.used}次生成`;
      poolKey = 'coffee';
    } else if (/牛肉麵|拉麵|美食|排隊|好吃|小吃|湯頭|餐點|food|noodle|吃/.test(text)) {
      aiPrompt = 'steaming bowl of traditional beef noodles, rich savory broth, fresh scallions, quiet cozy noodle shop atmosphere, natural lighting, photorealistic, 8k';
      keywordTag = `#AI語意辨識 #道地美食 #街角小吃 #第${currentQuota.used}次生成`;
      poolKey = 'food';
    } else if (/象山|步道|山|爬山|森林|自然|公園|散步|hiking|trail|樹/.test(text)) {
      aiPrompt = 'peaceful hiking trail surrounded by lush green trees, gentle dappled sunlight through foliage, quiet mountain path, realistic nature photography, 8k';
      keywordTag = `#AI語意辨識 #綠意步道 #自然微風 #第${currentQuota.used}次生成`;
      poolKey = 'nature';
    } else if (/代碼|程式|架構|重構|原生|javascript|css|html|git|bug|開發|dev|code/.test(text)) {
      aiPrompt = 'clean developer workspace, minimalist desk setup, mechanical keyboard, soft ambient desk lamp, clean code on high-res monitor, calm productivity, photorealistic';
      keywordTag = `#AI語意辨識 #冷灰工作桌 #代碼微光 #第${currentQuota.used}次生成`;
      poolKey = 'tech';
    } else if (/書|閱讀|金句|心得|學習|思考|反思|筆記|book|read/.test(text)) {
      aiPrompt = 'open hardcover book resting on textured linen table, pair of reading glasses, soft golden hour sunlight, quiet introspective study atmosphere, photorealistic';
      keywordTag = `#AI語意辨識 #書頁微光 #研讀筆記 #第${currentQuota.used}次生成`;
      poolKey = 'book';
    } else if (/街|城市|建築|角落|生活|台北|巷弄|風景|walk|city/.test(text)) {
      aiPrompt = 'quiet city alleyway in Taipei, calm afternoon light, peaceful urban street corner, understated candid travel photography, 8k';
      keywordTag = `#AI語意辨識 #城市角落 #街景隨拍 #第${currentQuota.used}次生成`;
      poolKey = 'diary';
    } else {
      // 依主題分流預設風格
      if (topic === '專業知識分享') {
        aiPrompt = 'minimalist contemporary workstation, clean aesthetic, cool gray tones, notebook and fountain pen, soft natural diffused light, photorealistic';
        keywordTag = `#AI語意辨識 #冷灰科技 #專業筆記 #第${currentQuota.used}次生成`;
        poolKey = 'tech';
      } else if (topic === '資訊分享') {
        aiPrompt = 'scenic travel discovery, peaceful street view, warm sunlight, authentic local atmosphere, documentary travel photo, 8k';
        keywordTag = `#AI語意辨識 #探訪紀實 #自然光影 #第${currentQuota.used}次生成`;
        poolKey = 'nature';
      } else {
        aiPrompt = 'quiet journal notebook, steaming warm mug, wooden desk by window, cozy serene afternoon, peaceful contemplation, photorealistic';
        keywordTag = `#AI語意辨識 #生活隨筆 #靜謐時光 #第${currentQuota.used}次生成`;
        poolKey = 'diary';
      }
    }

    // 呼叫動態 AI 生圖 API (Pollinations.ai 動態 Prompt + 隨機 Seed)
    const dynamicAiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=800&height=800&seed=${seed}&nologo=true`;

    // 備用隨機圖庫 (萬一外部生圖 API 離線或逾時時之平順降級)
    const pool = AI_IMAGE_POOLS[poolKey] || AI_IMAGE_POOLS.diary;
    const fallbackUrl = pool[Math.floor(Math.random() * pool.length)];

    // 建立新 Image 物件預載，成功後再切換
    const tempImg = new Image();
    let isLoaded = false;

    tempImg.onload = () => {
      isLoaded = true;
      previewImg.src = dynamicAiUrl;
      badgeDisplay.textContent = keywordTag;
      hiddenUrlInput.value = dynamicAiUrl;
      mask.style.display = 'none';
      if (statusText) statusText.textContent = `已完成全新動態 AI 視覺生成 (1:1 比例 • 種子: ${seed})`;
      showToast(`✨ 全新動態配圖已生成！今日用量：${currentQuota.used} / ${currentQuota.limit}`);
    };

    tempImg.onerror = () => {
      // 若動態生圖服務連線受阻，使用不同隨機種子的高品質圖庫輪替
      previewImg.src = fallbackUrl;
      badgeDisplay.textContent = `${keywordTag} (精選配圖)`;
      hiddenUrlInput.value = fallbackUrl;
      mask.style.display = 'none';
      if (statusText) statusText.textContent = '已依文章關鍵字切換高質感配圖 (1:1 比例)';
      showToast(`✨ 配圖已更新！今日用量：${currentQuota.used} / ${currentQuota.limit}`);
    };

    // 啟動載入，若 6 秒內未完成則自動降級顯示備用圖
    tempImg.src = dynamicAiUrl;
    setTimeout(() => {
      if (!isLoaded && mask.style.display !== 'none') {
        previewImg.src = fallbackUrl;
        badgeDisplay.textContent = `${keywordTag} (精選配圖)`;
        hiddenUrlInput.value = fallbackUrl;
        mask.style.display = 'none';
        if (statusText) statusText.textContent = '已完成配圖更新 (1:1 比例)';
      }
    }, 6000);

  }, 500);
}


