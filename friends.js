/* E-ID 交友收藏 — 纯前端 localStorage 实现，零后端改动 */
(() => {
  const KEY = 'eid-favs';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} };
  const has = id => read().some(f => f.id === id);
  const toggle = user => {
    const list = read();
    const i = list.findIndex(f => f.id === user.id);
    if (i >= 0) list.splice(i, 1); else list.unshift({ id: user.id, name: user.name, job: user.job, avatar: user.avatar, ts: Date.now() });
    write(list);
    return i < 0; // true = 新增收藏
  };
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.6 2.5 5.2 5.7.7-4.2 4 1.1 5.6L12 16.4l-5.1 2.7 1.1-5.6-4.2-4 5.7-.7z"/></svg>';

  /* ---------- 名片广场：每张卡片右上角星标 ---------- */
  const userList = document.getElementById('userList');
  if (userList) {
    const decorate = card => {
      if (card.nodeType !== 1 || !card.classList?.contains('user-card') || card.querySelector('.fav-star')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fav-star' + (has(card.dataset.id) ? ' is-fav' : '');
      btn.setAttribute('aria-label', '收藏这张名片');
      btn.innerHTML = STAR;
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle({
          id: card.dataset.id,
          name: card.querySelector('.card-name')?.textContent || '未命名',
          job: card.querySelector('.card-job')?.textContent || '',
          avatar: card.querySelector('.card-avatar')?.getAttribute('src') || ''
        });
        btn.classList.toggle('is-fav', added);
      });
      card.appendChild(btn);
    };
    userList.querySelectorAll('.user-card').forEach(decorate);
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      decorate(n);
      n.querySelectorAll?.('.user-card').forEach(decorate);
    }))).observe(userList, { childList: true, subtree: true });
  }

  /* ---------- 名片详情页 ---------- */
  if (!document.body.classList.contains('profile-body')) return;
  const viewId = new URLSearchParams(location.search).get('id');
  const wait = (cond, cb, tries = 40) => {
    if (cond()) return cb();
    if (tries > 0) setTimeout(() => wait(cond, cb, tries - 1), 250);
  };
  wait(() => {
    const n = document.getElementById('name');
    return n && n.textContent && n.textContent !== '加载中...';
  }, () => {
    /* 他人名片：侧栏加“收藏名片”按钮 */
    const sidebar = document.querySelector('.sidebar-card');
    if (viewId && sidebar && !document.getElementById('favViewBtn')) {
      const name = document.getElementById('name').textContent;
      const job = document.getElementById('job').textContent;
      const avatar = document.getElementById('avatar').getAttribute('src') || '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'favViewBtn';
      btn.className = 'fav-view-btn';
      const paint = () => {
        const f = has(viewId);
        btn.classList.toggle('is-fav', f);
        btn.textContent = f ? '★ 已收藏，再去广场看看' : '☆ 收藏这张名片';
        btn.setAttribute('aria-pressed', String(f));
      };
      paint();
      btn.addEventListener('click', () => { toggle({ id: viewId, name, job, avatar }); paint(); });
      sidebar.appendChild(btn);
    }

    /* 本人面板：收藏列表（退出登录按钮可见 = 本人视图） */
    const logout = document.getElementById('logoutBtn');
    if (logout && getComputedStyle(logout).display !== 'none') renderFavBlock();
  });

  function renderFavBlock() {
    const main = document.querySelector('.profile-main');
    if (!main || document.getElementById('favBlock')) return;
    const favs = read();
    const block = document.createElement('section');
    block.className = 'info-block fav-block';
    block.id = 'favBlock';
    block.innerHTML =
      '<div class="block-header">' +
        '<span class="block-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3.6 2.5 5.2 5.7.7-4.2 4 1.1 5.6L12 16.4l-5.1 2.7 1.1-5.6-4.2-4 5.7-.7z"/></svg></span>' +
        '<span class="block-title">我的收藏 · ' + favs.length + '</span>' +
      '</div>' +
      '<div class="block-body fav-list"></div>';
    const listEl = block.querySelector('.fav-list');
    if (!favs.length) {
      listEl.innerHTML = '<p class="fav-empty">还没有收藏名片，去 <a href="users.html">名片广场</a> 转转 ↗</p>';
    } else {
      favs.forEach(f => {
        const row = document.createElement('div');
        row.className = 'fav-row';
        row.innerHTML =
          '<a class="fav-main" href="card.html?id=' + encodeURIComponent(f.id) + '">' +
            (f.avatar
              ? '<img class="fav-avatar" src="' + esc(f.avatar) + '" alt="">'
              : '<span class="fav-avatar fav-avatar-empty" aria-hidden="true"></span>') +
            '<span class="fav-info"><strong>' + esc(f.name) + '</strong><small>' + esc(f.job || '暂无职位') + '</small></span>' +
            '<span class="fav-go" aria-hidden="true">→</span>' +
          '</a>' +
          '<button type="button" class="fav-remove" aria-label="取消收藏">×</button>';
        row.querySelector('.fav-remove').addEventListener('click', () => {
          toggle({ id: f.id });
          document.getElementById('favBlock')?.remove();
          renderFavBlock();
        });
        listEl.appendChild(row);
      });
    }
    const action = document.getElementById('actionBlock');
    main.insertBefore(block, action && action.style.display !== 'none' ? action : null);
  }
})();
