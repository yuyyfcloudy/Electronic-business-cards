(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;
  let visited = false;
  try { visited = sessionStorage.getItem('eid-intro-seen') === '1'; } catch {}
  body.classList.add('motion-ready');
  if (!visited && !reducedMotion.matches) {
    body.style.setProperty('--entry-offset', '1050ms');
    body.classList.add('intro-active');
    try { sessionStorage.setItem('eid-intro-seen', '1'); } catch {}
    const finishIntro = () => {
      body.classList.remove('intro-active');
      document.getElementById('siteIntro')?.remove();
      document.removeEventListener('keydown', skipIntro);
    };
    const skipIntro = event => { if (event.key === 'Escape' || event.key === 'Tab') finishIntro(); };
    document.addEventListener('keydown', skipIntro);
    setTimeout(finishIntro, 1200);
  } else document.getElementById('siteIntro')?.remove();

  const toggle = document.getElementById('passwordToggle');
  const password = document.getElementById('password');
  toggle?.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
    toggle.setAttribute('aria-pressed', String(show));
  });
  const form = document.getElementById('loginForm');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('loginSubmit');
    const feedback = document.getElementById('loginFeedback');
    if (button.disabled) return;
    feedback.textContent = '';
    if (typeof window.login !== 'function') {
      feedback.textContent = '登录服务正在连接，请稍后再试。';
      return;
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.firstElementChild.textContent = '正在连接…';
    try { await window.login(); }
    catch { feedback.textContent = '暂时无法连接，请检查网络后重试。'; }
    finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.firstElementChild.textContent = '进入我的空间';
    }
  });
  const card = document.getElementById('identityCard');
  const scene = document.querySelector('.card-scene');
  const finePointer = matchMedia('(pointer: fine)');
  let frame;
  const resetCard = () => { cancelAnimationFrame(frame); card?.style.removeProperty('--card-rx'); card?.style.removeProperty('--card-ry'); };
  scene?.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = scene.getBoundingClientRect();
      card.style.setProperty('--card-rx', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 10}deg`);
      card.style.setProperty('--card-ry', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 13}deg`);
    });
  }, { passive: true });
  scene?.addEventListener('pointerleave', resetCard);
  window.addEventListener('blur', resetCard);
  reducedMotion.addEventListener('change', resetCard);
})();

