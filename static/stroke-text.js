(() => {
  const textNodes = document.querySelectorAll('[data-stroke-text]');
  textNodes.forEach((node) => {
    const drawDuration = node.dataset.drawDuration || '1.6';
    const fillDelay = node.dataset.fillDelay || '0.2';
    const easing = node.dataset.ease === 'power2.out' ? 'cubic-bezier(.22, 1, .36, 1)' : 'ease-out';
    node.style.setProperty('--stroke-draw-duration', drawDuration + 's');
    node.style.setProperty('--stroke-fill-delay', fillDelay + 's');
    node.style.setProperty('--stroke-ease', easing);
    requestAnimationFrame(() => node.classList.add('is-mounted'));
  });
})();
