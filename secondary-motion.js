/* Motion is progressive enhancement: all content stays visible without JS. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function enter(elements) {
    if (reduced) return;
    elements.forEach((element, index) => {
      if (element.dataset.entered) return;
      element.dataset.entered = 'true';
      element.style.setProperty('--entrance-delay', `${Math.min(index, 5) * 75}ms`);
      element.classList.add('secondary-enter');
      element.addEventListener('animationend', () => element.classList.remove('secondary-enter'), { once: true });
    });
  }
  enter([...document.querySelectorAll('.registration-story, .box, .profile-editor-intro, .page-header, .profile-sidebar, .info-block')]);
  const directory = document.getElementById('userList');
  if (directory) {
    const animateCards = () => enter([...directory.querySelectorAll('.user-card')]);
    animateCards();
    new MutationObserver(animateCards).observe(directory, { childList: true });
  }
  document.querySelectorAll('input:not([aria-label]), textarea:not([aria-label])').forEach(input => {
    if (input.placeholder && !input.closest('label')) input.setAttribute('aria-label', input.placeholder);
  });
  document.querySelectorAll('.file-upload').forEach(label => {
    label.tabIndex = 0;
    label.setAttribute('role', 'button');
    label.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        label.querySelector('input[type="file"]')?.click();
      }
    });
  });
})();
