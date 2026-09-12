/**
 * 社群生活札記 - 核心邏輯與互動行為
 * 遵循 .agents/rules/development-guidelines.md 與 .agents/workflows/ux-check.md 規範
 */

const STORAGE_KEY = 'aia_user_diary_posts';

// 預設示範資料 (初次載入且 localStorage 為空時使用)
const DEFAULT_POSTS = [
  {
    id: 'post-1',
    author: '林小花 • 艾莉絲',
    handle: '@alice_daily',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    topic: '心得雜記',
    location: '台北 • 永康街角落咖啡',
    timeText: '2 小時前',
    timestamp: Date.now() - 7200000,
    mediaBadge: '☕ 今日份溫暖',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
    content: '今天在轉角巷子裡新開的咖啡館待了一下午。點了日曬耶加雪菲，入口帶點清爽的柑橘與茉莉花香。窗邊剛好有陽光灑進來，讀了幾章很久以前買的書，突然體會到「讓步調慢下來」的踏實感。生活裡的很多焦慮，只要給自己一杯咖啡的時間，好像就能慢慢解開。☕✨',
    tags: ['#日常筆記', '#咖啡時光', '#生活碎片', '#慢活練習'],
    likes: 142,
    isLiked: false,
    isSaved: false,
    comments: [
      { user: '陳小宇', text: '這家採光真的很舒服！上週去過一次，手沖真的很專業。' },
      { user: 'Emma_Life', text: '好喜歡這段文字的平靜感，週末也想去坐坐～' }
    ]
  },
  {
    id: 'post-2',
    author: '大衛 • 技術筆記',
    handle: '@david_dev',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    topic: '專業知識分享',
    location: '台北 • 研發工作站',
    timeText: '5 小時前',
    timestamp: Date.now() - 18000000,
    mediaBadge: '💡 架構與原生 Web',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80',
    content: '今天重構前端元件時，再次感受到「極簡至上」的威力。不依賴厚重的第三方套件，用原生的 HTML5、CSS Flexbox 與 ES6+ 事件委派，程式碼不到 300 行就完成了流暢的動態互動。架構越純粹，維護成本就越低。',
    tags: ['#前端開發', '#原生Web', '#架構設計', '#乾貨分享'],
    likes: 89,
    isLiked: false,
    isSaved: false,
    comments: [
      { user: '工程師老李', text: '認同！原生技術掌握好，很多時候根本不需要殺雞用牛刀。' }
    ]
  },
  {
    id: 'post-3',
    author: '阿倫 • 散步筆記',
    handle: '@alan_walk',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    topic: '資訊分享',
    location: '台北 • 象山步道轉角牛肉麵',
    timeText: '8 小時前',
    timestamp: Date.now() - 28800000,
    mediaBadge: '🚶‍♂️ 探店與實訪避坑',
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1000&q=80',
    content: '週末趁天氣放晴去爬象山，下山順道繞去吃這家老字號牛肉麵啦！🍜 牛肉燉得軟嫩入味，紅燒湯頭很順口，價格也很實在喔。不過認真說，店內冷氣真的有點弱，夏天吃完肯定整頭大汗；而且中午 12 點排隊人潮超長，強烈建議大家避開尖峰時段，大約下午 1 點半左右再去吃最舒服！⚠️ 🚇 捷運象山站 2 號出口步行約 6 分鐘。',
    tags: ['#在地情報', '#景點避坑指南', '#捷運美食', '#台北探訪'],
    likes: 64,
    isLiked: false,
    isSaved: false,
    comments: [
      { user: '週末山友', text: '真的！這家一定要避開中午，上次排了半小時熱暈了，但麵確實好吃。' }
    ]
  }
];

// 本地暫存上傳照片的 Base64
let uploadedPhotoBase64 = '';

document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  renderFeed();
  initPostInteractions();
  initCreateModal();
});

/**
 * 初始化 localStorage 資料
 */
function initStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POSTS));
    }
  } catch (error) {
    console.warn('無法存取 localStorage：', error);
  }
}

/**
 * 取得貼文列表 (依時間倒序排列)
 * @returns {Array}
 */
function getPosts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const posts = JSON.parse(data);
      return Array.isArray(posts) ? posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : [];
    }
  } catch (error) {
    console.error('解析貼文資料錯誤：', error);
  }
  return [];
}

/**
 * 儲存貼文列表至 localStorage
 * @param {Array} posts 
 */
function savePosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error('儲存至 localStorage 失敗：', error);
  }
}

/**
 * 渲染動態牆 (Feed)
 */
function renderFeed() {
  const container = document.getElementById('feedContainer');
  if (!container) return;

  const posts = getPosts();
  container.innerHTML = '';

  // 若無任何卡片，呈現空狀態提示
  if (posts.length === 0) {
    const template = document.getElementById('emptyStateTemplate');
    if (template) {
      const clone = template.content.cloneNode(true);
      const btn = clone.querySelector('#emptyCreateBtn');
      if (btn) {
        btn.addEventListener('click', openCreateModal);
      }
      container.appendChild(clone);
    }
    return;
  }

  // 渲染所有卡片
  posts.forEach(post => {
    container.appendChild(createPostCardElement(post));
  });
}

/**
 * 建立單一貼文卡片 DOM 元素
 * @param {Object} post 
 * @returns {HTMLElement}
 */
function createPostCardElement(post) {
  const article = document.createElement('article');
  article.className = 'post-card';
  article.setAttribute('data-post-id', post.id);

  const tagsHTML = (post.tags || [])
    .map(tag => `<a href="javascript:void(0)" class="tag">${escapeHTML(tag)}</a>`)
    .join('\n');

  const commentsHTML = (post.comments || [])
    .map(c => `
      <div class="comment-item">
        <strong class="comment-user">${escapeHTML(c.user)}</strong>
        <span class="comment-text">${escapeHTML(c.text)}</span>
      </div>
    `).join('\n');

  article.innerHTML = `
    <!-- 卡片頭部 -->
    <header class="post-header">
      <div class="author-info">
        <div class="avatar-wrapper">
          <img src="${escapeHTML(post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80')}" alt="${escapeHTML(post.author)} 的頭像" class="avatar" loading="lazy">
          <span class="online-badge"></span>
        </div>
        <div class="author-meta">
          <div class="name-row">
            <strong class="author-name">${escapeHTML(post.author)}</strong>
            <span class="topic-tag-badge">${escapeHTML(post.topic || '心得雜記')}</span>
            <span class="author-handle">${escapeHTML(post.handle || '@user')}</span>
          </div>
          <div class="sub-meta">
            <time class="post-time">${escapeHTML(post.timeText || '剛剛')}</time>
            <span class="dot-separator">•</span>
            <span class="location-tag">
              <svg class="icon-inline" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${escapeHTML(post.location || '生活隨筆')}
            </span>
          </div>
        </div>
      </div>
      <button class="icon-btn more-btn" aria-label="更多選項" data-action="more">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <circle cx="5" cy="12" r="2"></circle>
          <circle cx="12" cy="12" r="2"></circle>
          <circle cx="19" cy="12" r="2"></circle>
        </svg>
      </button>
    </header>

    <!-- 卡片媒體區與雙擊大愛心 -->
    <div class="post-media-container" data-action="double-tap-like">
      <img src="${escapeHTML(post.image)}" alt="${escapeHTML(post.topic || '心得照片')}" class="post-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80'">
      <span class="media-badge">${escapeHTML(post.mediaBadge || '✨ 心得紀錄')}</span>
      <div class="floating-heart" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="72" height="72" fill="#ef4444">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
    </div>

    <!-- 卡片互動列 -->
    <div class="post-actions">
      <div class="actions-left">
        <button class="action-btn like-btn ${post.isLiked ? 'liked' : ''}" aria-label="按讚" data-action="like" data-liked="${post.isLiked ? 'true' : 'false'}">
          <svg class="heart-icon" viewBox="0 0 24 24" width="24" height="24" fill="${post.isLiked ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span class="like-counter">${post.likes || 0}</span>
        </button>
        <button class="action-btn comment-btn" aria-label="留言" data-action="focus-comment">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span class="comment-counter">${(post.comments || []).length}</span>
        </button>
        <button class="action-btn share-btn" aria-label="分享這則心得" data-action="share">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="actions-right">
        <button class="action-btn bookmark-btn ${post.isSaved ? 'saved' : ''}" aria-label="收藏心得" data-action="bookmark" data-saved="${post.isSaved ? 'true' : 'false'}">
          <svg class="bookmark-icon" viewBox="0 0 24 24" width="22" height="22" fill="${post.isSaved ? '#f59e0b' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 卡片內容區 -->
    <div class="post-content">
      <p class="post-text">
        <span class="post-author-tag">${escapeHTML(post.handle || '@user')}</span>
        ${escapeHTML(post.content)}
      </p>
      <div class="post-tags">
        ${tagsHTML}
      </div>
      <div class="comments-section">
        ${commentsHTML}
      </div>
    </div>

    <!-- 底部留言輸入框 -->
    <footer class="post-footer">
      <form class="comment-input-box" data-form="comment">
        <input type="text" class="comment-input" placeholder="寫下你的溫暖回應..." required aria-label="輸入留言">
        <button type="submit" class="btn-send-comment" aria-label="送出留言">發布</button>
      </form>
    </footer>
  `;

  return article;
}

/**
 * 初始化動態牆互動事件 (採用事件委派)
 */
function initPostInteractions() {
  const feed = document.getElementById('feedContainer');
  if (!feed) return;

  // 1. 點擊事件 (點讚、收藏、分享、聚焦留言、更多)
  feed.addEventListener('click', (e) => {
    // 點讚
    const likeBtn = e.target.closest('[data-action="like"]');
    if (likeBtn) {
      handleLikeToggle(likeBtn);
      return;
    }

    // 收藏
    const bookmarkBtn = e.target.closest('[data-action="bookmark"]');
    if (bookmarkBtn) {
      handleBookmarkToggle(bookmarkBtn);
      return;
    }

    // 分享
    const shareBtn = e.target.closest('[data-action="share"]');
    if (shareBtn) {
      handleShareAction();
      return;
    }

    // 聚焦留言框
    const commentBtn = e.target.closest('[data-action="focus-comment"]');
    if (commentBtn) {
      const card = commentBtn.closest('.post-card');
      const input = card ? card.querySelector('.comment-input') : null;
      if (input) input.focus();
      return;
    }

    // 更多選項
    const moreBtn = e.target.closest('[data-action="more"]');
    if (moreBtn) {
      showToast('貼文連結已就緒');
      return;
    }
  });

  // 2. 雙擊照片爆發大愛心並按讚
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

  // 3. 留言表單送出
  feed.addEventListener('submit', (e) => {
    const commentForm = e.target.closest('[data-form="comment"]');
    if (commentForm) {
      e.preventDefault();
      handleCommentSubmit(commentForm);
    }
  });
}

/**
 * 處理按讚切換與持久化
 * @param {HTMLElement} btn 
 */
function handleLikeToggle(btn) {
  const card = btn.closest('.post-card');
  if (!card) return;
  const postId = card.getAttribute('data-post-id');
  const counter = btn.querySelector('.like-counter');
  let count = parseInt(counter.textContent, 10) || 0;
  const isLiked = btn.getAttribute('data-liked') === 'true';

  const newLiked = !isLiked;
  const newCount = newLiked ? count + 1 : Math.max(0, count - 1);

  btn.setAttribute('data-liked', newLiked ? 'true' : 'false');
  btn.classList.toggle('liked', newLiked);
  counter.textContent = newCount;

  // 更新 SVG 填色
  const icon = btn.querySelector('.heart-icon');
  if (icon) {
    icon.setAttribute('fill', newLiked ? '#ef4444' : 'none');
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
 * 雙擊照片浮現大愛心動畫
 * @param {HTMLElement} mediaContainer 
 */
function triggerHeartAnimation(mediaContainer) {
  const heart = mediaContainer.querySelector('.floating-heart');
  if (!heart) return;

  heart.classList.remove('active');
  void heart.offsetWidth; // 強制重繪
  heart.classList.add('active');
}

/**
 * 處理書籤收藏切換與持久化
 * @param {HTMLElement} btn 
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
    icon.setAttribute('fill', newSaved ? '#f59e0b' : 'none');
  }

  showToast(newSaved ? '已加入個人收藏' : '已自收藏清單移除');

  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.isSaved = newSaved;
    savePosts(posts);
  }
}

/**
 * 分享功能：複製連結並跳出 Toast
 */
function handleShareAction() {
  if (navigator.clipboard && window.location.href) {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('心得連結已複製到剪貼簿！'))
      .catch(() => showToast('已為您準備分享連結'));
  } else {
    showToast('已為您準備分享連結');
  }
}

/**
 * 處理新增留言與持久化
 * @param {HTMLFormElement} form 
 */
function handleCommentSubmit(form) {
  const input = form.querySelector('.comment-input');
  const text = input.value.trim();
  if (!text) return;

  const card = form.closest('.post-card');
  if (!card) return;
  const postId = card.getAttribute('data-post-id');
  const commentsSection = card.querySelector('.comments-section');
  const commentCounter = card.querySelector('.comment-counter');

  const newComment = { user: '我', text: text };

  // DOM 插入
  const item = document.createElement('div');
  item.className = 'comment-item';
  item.innerHTML = `
    <strong class="comment-user">我</strong>
    <span class="comment-text">${escapeHTML(text)}</span>
  `;
  commentsSection.appendChild(item);

  // 計數器更新
  if (commentCounter) {
    const count = parseInt(commentCounter.textContent, 10) || 0;
    commentCounter.textContent = count + 1;
  }

  input.value = '';
  showToast('回應發布成功');

  // 同步至 localStorage
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    savePosts(posts);
  }
}

/**
 * 顯示輕量 Toast 提示
 * @param {string} message 
 */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}

/**
 * 轉義 HTML 預防 XSS
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/**
 * 開啟新增心得彈窗
 */
function openCreateModal() {
  const modal = document.getElementById('createModal');
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const contentInput = document.getElementById('contentTextInput');
  if (contentInput) contentInput.focus();
}

/**
 * 關閉新增心得彈窗
 */
function closeCreateModal() {
  const modal = document.getElementById('createModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * 初始化「新增圖文心得」彈窗與完整流程 (UX 規範實作)
 */
function initCreateModal() {
  const modal = document.getElementById('createModal');
  const openBtn = document.getElementById('openCreateModalBtn');
  const closeBtn = document.getElementById('closeCreateModalBtn');
  const cancelBtn = document.getElementById('cancelPostBtn');
  const form = document.getElementById('newPostForm');
  const formatRulesBtn = document.getElementById('formatRulesBtn');

  // 照片切換分頁
  const tabPresetBtn = document.getElementById('tabPresetBtn');
  const tabUploadBtn = document.getElementById('tabUploadBtn');
  const presetPanel = document.getElementById('presetPhotoSection');
  const uploadPanel = document.getElementById('uploadPhotoSection');

  // 本地上傳控制
  const dropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('localFileInput');
  const promptBox = document.getElementById('dropzonePrompt');
  const previewBox = document.getElementById('uploadPreviewWrapper');
  const previewImg = document.getElementById('uploadPreviewImg');
  const removePhotoBtn = document.getElementById('removeUploadedPhotoBtn');

  if (openBtn) openBtn.addEventListener('click', openCreateModal);
  if (closeBtn) closeBtn.addEventListener('click', closeCreateModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeCreateModal);

  // 點擊背景空白處或按 ESC 關閉
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

  // 照片 Tab 切換
  if (tabPresetBtn && tabUploadBtn && presetPanel && uploadPanel) {
    tabPresetBtn.addEventListener('click', () => {
      tabPresetBtn.classList.add('active');
      tabUploadBtn.classList.remove('active');
      presetPanel.classList.add('active');
      uploadPanel.classList.remove('active');
    });

    tabUploadBtn.addEventListener('click', () => {
      tabUploadBtn.classList.add('active');
      tabPresetBtn.classList.remove('active');
      uploadPanel.classList.add('active');
      presetPanel.classList.remove('active');
    });
  }

  // 本地照片上傳與預覽 (FileReader)
  if (dropzone && fileInput && promptBox && previewBox && previewImg) {
    dropzone.addEventListener('click', (e) => {
      if (e.target !== removePhotoBtn) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        uploadedPhotoBase64 = evt.target.result;
        previewImg.src = uploadedPhotoBase64;
        promptBox.style.display = 'none';
        previewBox.style.display = 'flex';
        showToast('照片載入完成');
      };
      reader.readAsDataURL(file);
    });

    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        uploadedPhotoBase64 = '';
        fileInput.value = '';
        previewImg.src = '';
        previewBox.style.display = 'none';
        promptBox.style.display = 'flex';
        showToast('已移除上傳照片');
      });
    }
  }

  // 步驟四：依 Rules 風格自動潤飾排版 (微軟正黑體、中英數留半形空格、全形標點、去除浮誇詞彙)
  if (formatRulesBtn) {
    formatRulesBtn.addEventListener('click', () => {
      const textarea = document.getElementById('contentTextInput');
      if (!textarea) return;
      let text = textarea.value;
      if (!text.trim()) {
        showToast('請先輸入簡短想法再進行潤飾');
        return;
      }

      // 1. 中英/數字混排自動加入半形空格
      text = text.replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, '$1 $2');
      text = text.replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, '$1 $2');

      // 2. 標點轉換為標準全形標點
      text = text.replace(/,/g, '，')
                 .replace(/:/g, '：')
                 .replace(/;/g, '；')
                 .replace(/!/g, '！')
                 .replace(/\?/g, '？');

      // 3. 沉穩低調原則：微量替換或過濾浮誇宣傳字眼
      text = text.replace(/地表最強|革命性突破|極致優雅|無可挑剔/g, '扎實可靠');

      textarea.value = text;
      showToast('已完成沉穩排版風格潤飾');
    });
  }

  // 表單送出：完成並發布卡片 (步驟六：製成卡片與持久化)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const author = document.getElementById('authorNameInput').value.trim() || '生活觀察家';
      const location = document.getElementById('locationInput').value.trim() || '日常隨筆';
      const content = document.getElementById('contentTextInput').value.trim();
      const tagsRaw = document.getElementById('tagsInput').value.trim();
      const customUrl = document.getElementById('customImageUrlInput').value.trim();

      // 主題選擇 (三選一)
      const topicRadio = document.querySelector('input[name="postTopic"]:checked');
      const topic = topicRadio ? topicRadio.value : '心得雜記';

      // 圖片選取判定 (優先使用上傳圖檔，次之自訂網址，再次為精選推薦)
      let finalImage = '';
      if (tabUploadBtn && tabUploadBtn.classList.contains('active') && uploadedPhotoBase64) {
        finalImage = uploadedPhotoBase64;
      } else if (customUrl) {
        finalImage = customUrl;
      } else {
        const checkedPreset = document.querySelector('input[name="presetImg"]:checked');
        finalImage = checkedPreset ? checkedPreset.value : 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80';
      }

      if (!content) return;

      // 解析標籤
      const tags = tagsRaw.split(/[\s,]+/)
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t : `#${t}`);

      const newPost = {
        id: `post-${Date.now()}`,
        author: author,
        handle: `@${author.replace(/\s+/g, '_').toLowerCase()}`,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
        topic: topic,
        location: location,
        timeText: '剛剛',
        timestamp: Date.now(),
        mediaBadge: `✨ ${topic}`,
        image: finalImage,
        content: content,
        tags: tags,
        likes: 1,
        isLiked: false,
        isSaved: false,
        comments: []
      };

      // 儲存至 localStorage 首位
      const currentPosts = getPosts();
      currentPosts.unshift(newPost);
      savePosts(currentPosts);

      // 重新渲染並置頂
      renderFeed();

      // 清除表單與上傳狀態
      form.reset();
      uploadedPhotoBase64 = '';
      if (fileInput) fileInput.value = '';
      if (previewBox) previewBox.style.display = 'none';
      if (promptBox) promptBox.style.display = 'flex';
      if (tabPresetBtn && tabUploadBtn && presetPanel && uploadPanel) {
        tabPresetBtn.click();
      }

      closeCreateModal();
      showToast('🎉 心得卡片已發布並妥善存檔！');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
