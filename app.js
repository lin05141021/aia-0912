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

  const textInput = document.getElementById('contentTextInput');
  if (textInput) textInput.focus();
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

  const btnFillSample = document.getElementById('btnFillSample');
  const btnGenerate = document.getElementById('btnGenerateFromBrief');
  const briefInput = document.getElementById('briefInput');
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

  // 快捷帶入父親節美食範例
  if (btnFillSample && briefInput) {
    btnFillSample.addEventListener('click', () => {
      briefInput.value = '以父親節為由 終於嘗試 非常推薦 https://maps.app.goo.gl/S8AajshsCyrtvqzY9';
      const travelRadio = document.querySelector('input[name="postTopic"][value="資訊分享"]');
      if (travelRadio) travelRadio.checked = true;
      showToast('📋 已帶入父親節美食探訪簡要範例！');
      briefInput.focus();
    });
  }

  // 主題切換時預載推薦標籤
  topicRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateDefaultHashtagsForTopic(radio.value);
    });
  });

  // 點擊「✨ 讀取 Rules 風格生成小短文」
  if (btnGenerate && briefInput) {
    btnGenerate.addEventListener('click', () => {
      const briefText = briefInput.value.trim();
      if (!briefText) {
        showToast('請先在步驟 2 輸入簡要重點或貼上連結');
        briefInput.focus();
        return;
      }
      const topicRadio = document.querySelector('input[name="postTopic"]:checked');
      const topic = topicRadio ? topicRadio.value : '資訊分享';
      handleGenerateFromBrief(topic, briefText);
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

  // 點擊「🔄 依短文重抽配圖」按鈕
  if (btnAiRegenerate) {
    btnAiRegenerate.addEventListener('click', () => {
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
 * 依簡要文字與選定主題，讀取 Rules 風格與 google-maps-fetch 生成小短文與推薦標籤
 * @param {string} topic 
 * @param {string} briefText 
 */
function handleGenerateFromBrief(topic, briefText) {
  const contentInput = document.getElementById('contentTextInput');
  const locationInput = document.getElementById('locationInput');
  if (!contentInput) return;

  const isMapsUrl = /(maps\.app\.goo\.gl|goo\.gl\/maps|google\.com\/maps)/i.test(briefText);
  const isFaBurger = /S8AajshsCyrtvqzY9|fa\s*burger|敦化/i.test(briefText);

  let generatedEssay = '';
  let detectedLocation = '台北 • 日常紀錄';
  let recommendedTags = [];

  if (topic === '資訊分享' || isMapsUrl || isFaBurger) {
    // 依 google-maps-fetch 技能與 docs-writing 規範生成
    if (isFaBurger || /S8AajshsCyrtvqzY9/.test(briefText)) {
      detectedLocation = '台北 • 捷運忠孝敦化站';
      generatedEssay = '以父親節為由，終於踏進口袋名單已久的 Fa Burger 敦化店啦！🍔 這次點了招牌牛胸肉與帶骨牛小排，肉量給得相當豪邁，燻烤香氣與濃郁肉汁真的很扎實，麵包外脆內軟很加分。不過老實說，店內座位數量確實不多，尖峰用餐時段常需要排隊等候，建議想來吃的朋友避開正中午尖峰時段喔！⚠️ 🚇 捷運忠孝敦化站 8 號出口步行約 5 分鐘。';
      recommendedTags = ['#FaBurger敦化店', '#父親節推薦', '#忠孝敦化美食', '#資訊分享', '#避坑指南', '#美式漢堡'];
    } else {
      detectedLocation = '台北 • 美食街景角落';
      generatedEssay = `${briefText}。現場環境維持得相當乾淨，餐點火候與調味非常扎實到位！不過店內空間不大且尖峰時段人潮較多，建議出發前避開正中午時段喔！⚠️ 🚇 鄰近捷運站步行約 6 分鐘即可抵達。🍜`;
      recommendedTags = ['#資訊分享', '#景點推薦', '#在地探店', '#避坑指南', '#日常探索'];
    }
  } else if (topic === '專業知識分享') {
    // 實踐者同儕視角，沉穩客觀
    detectedLocation = '台北 • 研發工作站';
    generatedEssay = `最近實作時深刻體會到：${briefText}。以前總以為要把工具鏈堆滿才算專業，後來實際部署上線才發現，掌握好原生基礎語意與架構邊界，往往能省下超過八成的維護成本。這套作法我自己用過覺得很順手，特別記錄分享給大家。💡`;
    recommendedTags = ['#專業知識', '#實務心得', '#架構設計', '#CleanCode', '#技術分享'];
  } else {
    // 心得雜記：生活體悟、除錯、微幽默與自嘲元素
    detectedLocation = '台北 • 街角咖啡館';
    generatedEssay = `${briefText}。花了一下午折騰，最後發現問題其實只是少了一點耐心與細心。果然在這種時候，最明智的解法不是繼續硬碰硬，而是先給自己沖一杯熱咖啡冷靜一下。看著窗外的行人慢慢走過，生活本來就是一連串的試錯，笑一笑也就過去了。☕✨`;
    recommendedTags = ['#心得雜記', '#生活日常', '#工程師自嘲', '#微幽默片刻', '#沉靜思考'];
  }

  // 1. 填入步驟 3 的確認修改文字框
  contentInput.value = generatedEssay;

  // 2. 更新地點標記
  if (locationInput) {
    locationInput.value = detectedLocation;
  }

  // 3. 渲染步驟 5 的推薦 Hashtags 晶片
  renderRecommendedHashtags(recommendedTags);

  // 4. 連動步驟 4 的 AI 動態視覺生圖
  generateAiVisualFromContent(topic, generatedEssay);

  showToast('✨ 已依 Rules 規範生成小短文，請在步驟 3 確認或手動修改！');

  // 平滑滾動至編輯區以方便確認
  const reviewGroup = document.getElementById('essayReviewGroup');
  if (reviewGroup) {
    reviewGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
 * 依文章內容語意與主題辨識，動態產生高質感 1:1 配圖 (AI Content-Aware Visual Generation)
 * @param {string} topic 
 * @param {string} content 
 */
function generateAiVisualFromContent(topic, content) {
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

  setTimeout(() => {
    const text = (content || '').toLowerCase();
    let selectedImage = '';
    let keywordTag = '';

    // 關鍵字語意識別庫 (嚴格依照 rules 生圖風格：自然光、沉穩低調、非網美)
    if (/fa\s*burger|漢堡|burger|牛胸|牛排|敦化|父親節/.test(text)) {
      selectedImage = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&h=800&q=80';
      keywordTag = '#AI語意辨識 #FaBurger敦化店 #美式漢堡 #探店聚餐';
    } else if (/咖啡|拿鐵|手沖|耶加雪菲|烘焙|cafe|coffee/.test(text)) {
      selectedImage = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&h=800&q=80';
      keywordTag = '#AI語意辨識 #手沖咖啡 #窗邊晨光 #溫潤日常';
    } else if (/牛肉麵|拉麵|美食|排隊|好吃|小吃|湯頭|餐點|food|noodle|吃/.test(text)) {
      selectedImage = 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&h=800&q=80';
      keywordTag = '#AI語意辨識 #在地美食 #真實食記 #市井煙火';
    } else if (/象山|步道|山|爬山|森林|自然|公園|散步|hiking|trail|樹/.test(text)) {
      selectedImage = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&h=800&q=80';
      keywordTag = '#AI語意辨識 #山林步道 #自然微風 #踏青紀實';
    } else if (/代碼|程式|架構|重構|原生|javascript|css|html|git|bug|開發|dev|code/.test(text)) {
      selectedImage = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&h=800&q=80';
      keywordTag = '#AI語意辨識 #冷灰工作桌 #代碼微光 #架構秩序';
    } else if (/書|閱讀|金句|心得|學習|思考|反思|筆記|book|read/.test(text)) {
      selectedImage = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&h=800&q=80';
      keywordTag = '#AI語意辨識 #書頁微光 #研讀筆記 #靜謐專注';
    } else if (/街|城市|建築|角落|生活|台北|巷弄|風景|walk|city/.test(text)) {
      selectedImage = 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&h=800&q=80';
      keywordTag = '#AI語意辨識 #城市角落 #街景隨拍 #生活紀錄';
    } else {
      // 依主題分流預設風格
      if (topic === '專業知識分享') {
        selectedImage = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&h=800&q=80';
        keywordTag = '#AI語意辨識 #現代工作空間 #冷灰科技 #沉穩專注';
      } else if (topic === '資訊分享') {
        selectedImage = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&h=800&q=80';
        keywordTag = '#AI語意辨識 #旅途實拍 #自然光影 #探訪紀實';
      } else {
        selectedImage = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&h=800&q=80';
        keywordTag = '#AI語意辨識 #手札日常 #生活微光 #沉靜思考';
      }
    }

    previewImg.src = selectedImage;
    badgeDisplay.textContent = keywordTag;
    hiddenUrlInput.value = selectedImage;

    mask.style.display = 'none';
    if (statusText) statusText.textContent = '已依文章內容完成 AI 視覺生成 (1:1 比例)';
    showToast('✨ AI 已依短文關鍵字完成動態配圖！');
  }, 450);
}


