/* E-ID Aurora — 动态背景与微 3D 交互（纯增强，不触碰业务逻辑） */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');

  /* 1. 注入动态背景层：极光色球 + 网格 + 噪点 */
  const bg = document.createElement('div');
  bg.className = 'fx-bg';
  bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML =
    '<div class="fx-orb o1"></div><div class="fx-orb o2"></div>' +
    '<div class="fx-orb o3"></div><div class="fx-orb o4"></div>' +
    '<div class="fx-grid"></div><div class="fx-noise"></div>';
  document.body.prepend(bg);

  const glow = document.createElement('div');
  glow.className = 'fx-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  if (reduced.matches) return;

  /* 2. 指针光晕 + 背景视差（rAF 节流） */
  let px = 0, py = 0, frame = 0;
  const applyPointer = () => {
    frame = 0;
    glow.style.transform = `translate3d(${px - 260}px, ${py - 260}px, 0)`;
    const nx = (px / innerWidth - .5) * 26, ny = (py / innerHeight - .5) * 26;
    bg.style.setProperty('--px', nx.toFixed(1));
    bg.style.setProperty('--py', ny.toFixed(1));
  };
  if (finePointer.matches) {
    addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY;
      document.body.classList.add('fx-pointer');
      if (!frame) frame = requestAnimationFrame(applyPointer);
    }, { passive: true });
    document.addEventListener('pointerleave', () => document.body.classList.remove('fx-pointer'));
  }

  /* 3. 微 3D 倾斜：事件委托，兼容名片广场的动态卡片 */
  const TILT = '.user-card, .home-login-panel, .sidebar-card, .info-block, .contact-box, body.form-body .box';
  let tiltEl = null, tiltFrame = 0;
  const maxTiltFor = el =>
    el.matches('.home-login-panel, body.form-body .box') ? 2.5 :
    el.matches('.sidebar-card, .info-block') ? 3 : 6;
  const applyTilt = e => {
    tiltFrame = 0;
    const r = tiltEl.getBoundingClientRect();
    const max = maxTiltFor(tiltEl);
    const ry = ((e.clientX - r.left) / r.width - .5) * 2 * max;
    const rx = -((e.clientY - r.top) / r.height - .5) * 2 * max;
    tiltEl.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    tiltEl.style.setProperty('--ry', ry.toFixed(2) + 'deg');
  };
  const clearTilt = () => {
    if (!tiltEl) return;
    tiltEl.style.removeProperty('--rx');
    tiltEl.style.removeProperty('--ry');
    tiltEl = null;
    cancelAnimationFrame(tiltFrame);
    tiltFrame = 0;
  };
  if (finePointer.matches) {
    document.addEventListener('pointerover', e => {
      const t = e.target.closest(TILT);
      if (t !== tiltEl) { clearTilt(); tiltEl = t; }
    }, { passive: true });
    document.addEventListener('pointermove', e => {
      if (!tiltEl) return;
      if (!tiltEl.contains(e.target)) { clearTilt(); return; }
      if (!tiltFrame) tiltFrame = requestAnimationFrame(() => applyTilt(e));
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      if (tiltEl && !tiltEl.contains(e.relatedTarget)) clearTilt();
    }, { passive: true });
    addEventListener('blur', clearTilt);
  }
})();

/* ============================================================
   第二轮增强：主题切换 / 页面转场 / 磁性按钮 / 滚动视差 / 密码强度
   ============================================================ */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* 4. 亮 / 暗主题切换（localStorage 记忆，仅外观） */
  let theme = 'dark';
  try { theme = localStorage.getItem('eid-theme') || 'dark'; } catch {}
  const applyTheme = t => {
    document.documentElement.classList.toggle('fx-light', t === 'light');
    const btn = document.querySelector('.fx-theme-btn');
    if (btn) {
      btn.setAttribute('aria-pressed', String(t === 'light'));
      btn.setAttribute('aria-label', t === 'light' ? '切换到深色模式' : '切换到浅色模式');
    }
  };
  applyTheme(theme);
  const themeBtn = document.createElement('button');
  themeBtn.type = 'button';
  themeBtn.className = 'fx-theme-btn';
  themeBtn.innerHTML =
    '<svg class="fx-icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13.5A8.5 8.5 0 0 1 10.5 4 7 7 0 1 0 20 13.5Z"/></svg>' +
    '<svg class="fx-icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>';
  themeBtn.addEventListener('click', () => {
    theme = document.documentElement.classList.contains('fx-light') ? 'dark' : 'light';
    try { localStorage.setItem('eid-theme', theme); } catch {}
    applyTheme(theme);
  });
  document.body.appendChild(themeBtn);
  applyTheme(theme);

  /* 5. 页面转场：进入淡入，内部链接离开淡出 */
  if (!reduced) {
    document.body.classList.add('fx-enter');
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('fx-enter')));
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) return;
      if (!/\.html([?#].*)?$/.test(href)) return;
      e.preventDefault();
      document.body.classList.add('fx-leaving');
      setTimeout(() => { location.href = a.href; }, 200);
    });
  }

  /* 6. 磁性按钮：指针靠近时轻微吸附 */
  if (!reduced && finePointer) {
    const MAGNET = '.hero-cta, .eid-home .login-btn, .directory-create, .action-mini-btn-primary';
    let magEl = null, magFrame = 0;
    const resetMagnet = () => {
      if (!magEl) return;
      magEl.style.transform = '';
      magEl = null;
      cancelAnimationFrame(magFrame); magFrame = 0;
    };
    document.addEventListener('pointermove', e => {
      const t = e.target.closest(MAGNET);
      if (t !== magEl) { resetMagnet(); magEl = t; }
      if (!magEl || magFrame) return;
      magFrame = requestAnimationFrame(() => {
        magFrame = 0;
        const r = magEl.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * .18;
        const dy = (e.clientY - (r.top + r.height / 2)) * .28;
        const c = v => Math.max(-7, Math.min(7, v));
        magEl.style.transform = `translate(${c(dx).toFixed(1)}px, ${c(dy).toFixed(1)}px)`;
      });
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      if (magEl && !magEl.contains(e.relatedTarget)) resetMagnet();
    }, { passive: true });
  }

  /* 7. 首页滚动视差 */
  if (!reduced && document.body.classList.contains('eid-home')) {
    let scFrame = 0;
    const applyScroll = () => {
      scFrame = 0;
      document.body.style.setProperty('--sc', Math.min(scrollY, 600).toFixed(0) + 'px');
    };
    addEventListener('scroll', () => { if (!scFrame) scFrame = requestAnimationFrame(applyScroll); }, { passive: true });
  }

  /* 8. 注册页密码强度条（纯提示，不参与提交逻辑） */
  const regForm = document.getElementById('registerForm');
  const pwdInput = regForm && regForm.querySelector('#password');
  if (pwdInput) {
    const meter = document.createElement('div');
    meter.className = 'fx-pwd-meter';
    meter.dataset.level = '0';
    meter.setAttribute('aria-hidden', 'true');
    meter.innerHTML = '<span class="fx-pwd-track"><i class="fx-pwd-bar"></i></span><span class="fx-pwd-text"></span>';
    pwdInput.closest('label').appendChild(meter);
    const bar = meter.querySelector('.fx-pwd-bar');
    const text = meter.querySelector('.fx-pwd-text');
    const LABELS = ['', '较弱', '一般', '较强', '极强'];
    pwdInput.addEventListener('input', () => {
      const v = pwdInput.value;
      if (!v) { meter.dataset.level = '0'; bar.style.width = '0'; text.textContent = ''; return; }
      let score = 0;
      if (v.length >= 6) score++;
      if (v.length >= 8) score++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v) || /\d/.test(v) && /[a-zA-Z]/.test(v)) score++;
      if (/[^a-zA-Z0-9]/.test(v)) score++;
      score = Math.max(1, Math.min(4, score));
      meter.dataset.level = String(score);
      bar.style.width = (score * 25) + '%';
      text.textContent = LABELS[score];
    });
  }
})();
