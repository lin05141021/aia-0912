/**
 * 社群生活札記 - 核心互動邏輯
 * 具備點讚、雙擊圖片愛心特效、留言、收藏、分享與發布新心得功能
 */

document.addEventListener('DOMContentLoaded', () => {
  initPostInteractions();
  initCreatePostModal();
});

/**
 * 顯示輕量 Toast 提示
 * @param {string} message - 提示文字
 */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.textContent = message;

  container.appendChild(toast);

  // 2.5 秒後自動銷毀
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

/**
 * 初始化動態牆卡片的所有互動事件 (採用事件委派機制)
 */
function initPostInteractions() {
  const feedContainer = document.getElementById('feedContainer');
  if (!feedContainer) return;

  // 1. 點擊事件委派 (點讚、收藏、分享、聚焦留言、更多)
  feedContainer.addEventListener('click', (e) => {
    // 按讚按鈕
    const likeBtn = e.target.closest('[data-action="like"]');
    if (likeBtn) {
      handleLike(likeBtn);
      return;
    }

    // 收藏按鈕
    const bookmarkBtn = e.target.closest('[data-action="bookmark"]');
    if (bookmarkBtn) {
      handleBookmark(bookmarkBtn);
      return;
    }

    // 分享按鈕
    const shareBtn = e.target.closest('[data-action="share"]');
    if (shareBtn) {
      handleShare();
      return;
    }

    // 點擊留言圖示 -> 聚焦留言框
    const focusCommentBtn = e.target.closest('[data-action="focus-comment"]');
    if (focusCommentBtn) {
      const card = focusCommentBtn.closest('.post-card');
      const input = card ? card.querySelector('.comment-input') : null;
      if (input) {
        input.focus();
      }
      return;
    }

    // 更多選項按鈕
    const moreBtn = e.target.closest('[data-action="more"]');
    if (moreBtn) {
      showToast('已複製貼文選單設定');
      return;
    }
  });

  // 2. 雙擊圖片按讚事件
  feedContainer.addEventListener('dblclick', (e) => {
    const mediaContainer = e.target.closest('[data-action="double-tap-like"]');
    if (mediaContainer) {
      triggerHeartAnimation(mediaContainer);
      const card = mediaContainer.closest('.post-card');
      if (card) {
        const likeBtn = card.querySelector('[data-action="like"]');
        if (likeBtn && likeBtn.getAttribute('data-liked') !== 'true') {
          handleLike(likeBtn);
        }
      }
    }
  });

  // 3. 留言表單送出事件
  feedContainer.addEventListener('submit', (e) => {
    const commentForm = e.target.closest('[data-form="comment"]');
    if (commentForm) {
      e.preventDefault();
      handleNewComment(commentForm);
    }
  });
}

/**
 * 處理按讚 / 取消按讚
 * @param {HTMLElement} btn 
 */
function handleLike(btn) {
  const isLiked = btn.getAttribute('data-liked') === 'true';
  const counter = btn.querySelector('.like-counter');
  let currentCount = parseInt(counter.textContent, 10) || 0;

  if (isLiked) {
    btn.setAttribute('data-liked', 'false');
    btn.classList.remove('liked');
    counter.textContent = Math.max(0, currentCount - 1);
  } else {
    btn.setAttribute('data-liked', 'true');
    btn.classList.add('liked');
    counter.textContent = currentCount + 1;
  }
}

/**
 * 觸發雙擊圖片時的大愛心爆發動畫
 * @param {HTMLElement} mediaContainer 
 */
function triggerHeartAnimation(mediaContainer) {
  const heart = mediaContainer.querySelector('.floating-heart');
  if (!heart) return;

  heart.classList.remove('active');
  // 強制重新觸發 CSS 動畫
  void heart.offsetWidth;
  heart.classList.add('active');
}

/**
 * 處理書籤收藏切換
 * @param {HTMLElement} btn 
 */
function handleBookmark(btn) {
  const isSaved = btn.getAttribute('data-saved') === 'true';

  if (isSaved) {
    btn.setAttribute('data-saved', 'false');
    btn.classList.remove('saved');
    showToast('已從收藏清單移除');
  } else {
    btn.setAttribute('data-saved', 'true');
    btn.classList.add('saved');
    showToast('已收藏這篇心得');
  }
}

/**
 * 處理分享功能
 */
function handleShare() {
  if (navigator.clipboard && window.location.href) {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('心得連結已複製到剪貼簿！'))
      .catch(() => showToast('已為您準備分享連結'));
  } else {
    showToast('已為您準備分享連結');
  }
}

/**
 * 處理新增留言
 * @param {HTMLFormElement} form 
 */
function handleNewComment(form) {
  const input = form.querySelector('.comment-input');
  const text = input.value.trim();
  if (!text) return;

  const card = form.closest('.post-card');
  const commentsSection = card.querySelector('.comments-section');
  const commentCounter = card.querySelector('.comment-counter');

  // 建立留言節點
  const commentItem = document.createElement('div');
  commentItem.className = 'comment-item';
  commentItem.innerHTML = `
    <strong class="comment-user">我</strong>
    <span class="comment-text">${escapeHTML(text)}</span>
  `;

  commentsSection.appendChild(commentItem);

  // 更新計數
  if (commentCounter) {
    const count = parseInt(commentCounter.textContent, 10) || 0;
    commentCounter.textContent = count + 1;
  }

  // 清空輸入並提示
  input.value = '';
  showToast('回應發布成功');
}

/**
 * 轉義 HTML 避免 XSS
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
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
 * 初始化「記錄新心得」彈窗與發布功能
 */
function initCreatePostModal() {
  const modal = document.getElementById('createModal');
  const openBtn = document.getElementById('openCreateModalBtn');
  const closeBtn = document.getElementById('closeCreateModalBtn');
  const cancelBtn = document.getElementById('cancelPostBtn');
  const form = document.getElementById('newPostForm');
  const feedContainer = document.getElementById('feedContainer');

  if (!modal || !openBtn || !form) return;

  const openModal = () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const textInput = document.getElementById('contentTextInput');
    if (textInput) textInput.focus();
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // 點擊背景空白處關閉
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC 鍵關閉
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // 發布新心得表單送出
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const author = document.getElementById('authorNameInput').value.trim() || '生活觀察家';
    const location = document.getElementById('locationInput').value.trim() || '日常角落';
    const content = document.getElementById('contentTextInput').value.trim();
    const tagsRaw = document.getElementById('tagsInput').value.trim();
    const customUrl = document.getElementById('customImageUrlInput').value.trim();

    // 取得選中的圖片網址
    let imageUrl = customUrl;
    if (!imageUrl) {
      const checkedPreset = document.querySelector('input[name="presetImg"]:checked');
      imageUrl = checkedPreset ? checkedPreset.value : 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1000&q=80';
    }

    if (!content) return;

    // 解析標籤
    const tags = tagsRaw.split(/[\s,]+/).filter(t => t.length > 0).map(t => t.startsWith('#') ? t : `#${t}`);
    const tagsHTML = tags.map(t => `<a href="javascript:void(0)" class="tag">${escapeHTML(t)}</a>`).join('\n');

    // 建立新卡片
    const newCard = document.createElement('article');
    newCard.className = 'post-card';
    newCard.setAttribute('data-post-id', Date.now().toString());

    newCard.innerHTML = `
      <header class="post-header">
        <div class="author-info">
          <div class="avatar-wrapper">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80" alt="${escapeHTML(author)} 的大頭貼" class="avatar">
            <span class="online-badge"></span>
          </div>
          <div class="author-meta">
            <div class="name-row">
              <strong class="author-name">${escapeHTML(author)}</strong>
              <span class="author-handle">@you_daily</span>
            </div>
            <div class="sub-meta">
              <time class="post-time">剛剛</time>
              <span class="dot-separator">•</span>
              <span class="location-tag">
                <svg class="icon-inline" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${escapeHTML(location)}
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

      <div class="post-media-container" data-action="double-tap-like">
        <img src="${escapeHTML(imageUrl)}" alt="生活隨筆照片" class="post-image" loading="lazy">
        <span class="media-badge">✨ 新發布的心得</span>
        <div class="floating-heart" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="72" height="72" fill="#ff2d55">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>

      <div class="post-actions">
        <div class="actions-left">
          <button class="action-btn like-btn" aria-label="按讚" data-action="like" data-liked="false">
            <svg class="heart-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span class="like-counter">1</span>
          </button>
          <button class="action-btn comment-btn" aria-label="留言" data-action="focus-comment">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span class="comment-counter">0</span>
          </button>
          <button class="action-btn share-btn" aria-label="分享這則心得" data-action="share">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div class="actions-right">
          <button class="action-btn bookmark-btn" aria-label="收藏心得" data-action="bookmark" data-saved="false">
            <svg class="bookmark-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="post-content">
        <p class="post-text">
          <span class="post-author-tag">@you_daily</span>
          ${escapeHTML(content)}
        </p>
        <div class="post-tags">
          ${tagsHTML}
        </div>
        <div class="comments-section"></div>
      </div>

      <footer class="post-footer">
        <form class="comment-input-box" data-form="comment">
          <input type="text" class="comment-input" placeholder="寫下你的溫暖回應..." required aria-label="輸入留言">
          <button type="submit" class="btn-send-comment" aria-label="送出留言">發布</button>
        </form>
      </footer>
    `;

    // 插入至動態牆最頂端
    feedContainer.prepend(newCard);

    // 重設表單並關閉彈窗
    form.reset();
    closeModal();
    showToast('🎉 心得卡片已成功發布！');

    // 平滑滾動至卡片位置
    newCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
