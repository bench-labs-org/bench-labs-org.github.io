(() => {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;

  const viewport = carousel.querySelector('.partnership-carousel__viewport');
  const track = carousel.querySelector('.partnership-carousel__track');
  const originalSlides = [...track.children];
  const prev = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  const dots = carousel.querySelector('[data-carousel-dots]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let offset = 0;
  let setWidth = 0;
  let step = 0;
  let lastTime = 0;
  let paused = reduceMotion.matches;
  let dragging = false;
  let pointerStart = 0;
  let offsetStart = 0;
  let lastPointerX = 0;
  let lastPointerTime = 0;
  let userVelocity = 0;
  let momentumUntil = 0;

  originalSlides.forEach((slide) => {
    slide.querySelectorAll('img').forEach((image) => { image.draggable = false; });
    const clone = slide.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach((image) => { image.draggable = false; });
    clone.querySelectorAll('a, button').forEach((element) => element.setAttribute('tabindex', '-1'));
    track.appendChild(clone);
  });

  carousel.tabIndex = 0;
  carousel.setAttribute('aria-roledescription', 'carousel');

  const perView = () => window.innerWidth <= 640 ? 1 : window.innerWidth <= 900 ? 2 : 3;
  const pageCount = () => Math.max(1, originalSlides.length - perView() + 1);
  const activeIndex = () => Math.floor((offset + step * 0.35) / step) % originalSlides.length;

  const renderDots = () => {
    dots.innerHTML = '';
    for (let i = 0; i < pageCount(); i += 1) {
      const dot = document.createElement('button');
      dot.className = 'partnership-carousel__dot';
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Focus partner ${i + 1}`);
      dot.addEventListener('click', () => {
        offset = i * step;
        paused = true;
        update();
        window.setTimeout(() => { paused = reduceMotion.matches; }, 2200);
      });
      dots.appendChild(dot);
    }
  };

  const measure = () => {
    const first = track.children[0];
    const second = track.children[1];
    step = second.offsetLeft - first.offsetLeft;
    setWidth = track.children[originalSlides.length].offsetLeft - first.offsetLeft;
    offset %= setWidth || 1;
    renderDots();
    update();
  };

  const update = () => {
    track.style.transform = `translate3d(-${offset}px, 0, 0)`;
    const active = activeIndex();
    [...dots.children].forEach((dot, i) => dot.setAttribute('aria-selected', String(i === active)));
  };

  const tick = (time) => {
    const delta = lastTime ? Math.min(time - lastTime, 32) : 0;
    lastTime = time;
    if (!dragging && setWidth) {
      const momentumActive = performance.now() < momentumUntil;
      if (!paused || momentumActive) {
        const drift = momentumActive ? 0 : 0.018;
        offset = (offset + delta * (drift + userVelocity)) % setWidth;
        userVelocity *= Math.pow(0.975, delta / 16.67);
        if (Math.abs(userVelocity) < 0.001) userVelocity = 0;
        update();
      }
    }
    window.requestAnimationFrame(tick);
  };

  const nudge = (direction) => {
    userVelocity = Math.max(-0.65, Math.min(0.65, userVelocity + direction * 0.32));
    paused = true;
    momentumUntil = performance.now() + 2200;
    update();
    window.setTimeout(() => { paused = reduceMotion.matches; }, 2400);
  };

  prev.addEventListener('click', () => nudge(-1));
  next.addEventListener('click', () => nudge(1));
  carousel.addEventListener('mouseenter', () => { paused = true; });
  carousel.addEventListener('mouseleave', () => { paused = reduceMotion.matches; });
  carousel.addEventListener('focusin', () => { paused = true; });
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) paused = reduceMotion.matches;
  });
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); nudge(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); nudge(1); }
  });
  viewport.addEventListener('pointerdown', (event) => {
    if (event.target.closest('a, button')) return;
    dragging = true;
    pointerStart = event.clientX;
    lastPointerX = event.clientX;
    lastPointerTime = performance.now();
    userVelocity = 0;
    offsetStart = offset;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const now = performance.now();
    const elapsed = Math.max(8, now - lastPointerTime);
    const movement = lastPointerX - event.clientX;
    userVelocity = Math.max(-0.9, Math.min(0.9, movement / elapsed));
    lastPointerX = event.clientX;
    lastPointerTime = now;
    offset = (offsetStart - (event.clientX - pointerStart) + setWidth) % setWidth;
    update();
  });
  viewport.addEventListener('pointerup', (event) => {
    dragging = false;
    viewport.releasePointerCapture(event.pointerId);
    viewport.classList.remove('is-dragging');
    paused = true;
    momentumUntil = performance.now() + 2200;
    window.setTimeout(() => { paused = reduceMotion.matches; }, 2400);
  });
  viewport.addEventListener('pointercancel', () => { dragging = false; viewport.classList.remove('is-dragging'); });
  reduceMotion.addEventListener?.('change', (event) => { paused = event.matches; });
  window.addEventListener('resize', measure);
  measure();
  window.requestAnimationFrame(tick);
})();