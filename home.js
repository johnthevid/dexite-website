/* Play on a fresh homepage entry or reload; skip navigation back from inquiry. */
(() => {
  const intro = document.getElementById('site-intro');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const navigationType = performance.getEntriesByType?.('navigation')[0]?.type;
  const fromInquiry = (() => { try { const url = new URL(document.referrer); return url.origin === location.origin && (url.pathname === '/inquiry' || url.pathname.startsWith('/inquiry/')); } catch (_) { return false; } })();
  const returningFromInquiry = fromInquiry && navigationType !== 'reload';
  if (!intro || returningFromInquiry || reduced.matches) { intro?.remove(); return; }
  const canvas = intro.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) { intro.remove(); return; }
  const page = document.querySelector('.page');
  const HOLD = 880; // Original 780ms + the requested extra 100ms.
  const DURATION = 650;
  let width, height, frame, fallback, finished = false;
  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#090a09'; context.fillRect(0, 0, width, height);
  }
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame); clearTimeout(fallback);
    document.documentElement.classList.remove('intro-playing');
    page.inert = false;
    intro.remove();
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKey);
    reduced.removeEventListener('change', onMotion);
  }
  function onKey(event) { if (event.key === 'Escape') finish(); }
  function onMotion(event) { if (event.matches) finish(); }
  resize();
  page.inert = true;
  document.documentElement.classList.add('intro-playing');
  const start = performance.now();
  function draw(now) {
    if (finished) return;
    const elapsed = now - start;
    if (elapsed >= HOLD) {
      const progress = Math.min(1, (elapsed - HOLD) / DURATION);
      // Smooth acceleration and deceleration; never overshoot the viewport diagonal.
      const eased = progress < .5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const feather = Math.min(width, height) * .10;
      const radius = eased * (Math.hypot(width, height) / 2 + feather);
      context.globalCompositeOperation = 'source-over';
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#090a09'; context.fillRect(0, 0, width, height);
      if (radius > 0) {
        context.globalCompositeOperation = 'destination-out';
        const softEdge = Math.min(feather, radius * .5);
        const gradient = context.createRadialGradient(width / 2, height / 2, Math.max(0, radius - softEdge), width / 2, height / 2, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(.5, 'rgba(0,0,0,.7)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.beginPath(); context.arc(width / 2, height / 2, radius, 0, Math.PI * 2); context.fill();
      }
      if (progress === 1) { finish(); return; }
    }
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  fallback = setTimeout(finish, HOLD + DURATION + 500);
  intro.addEventListener('click', finish, { once:true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
  reduced.addEventListener('change', onMotion);
})();

(() => {
  const stack = document.querySelector('.studio-cards');
  const cards = [...stack.querySelectorAll('[data-card]')];
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  let pinned = null, hovered = null, focused = null, lastX = null, lastY = null;
  let hoverSettlesAt = 0;
  const reducedPanels = matchMedia('(prefers-reduced-motion: reduce)');
  function render() {
    const active = focused || hovered || pinned;
    const nextState = active || 'idle';
    if (stack.dataset.state && stack.dataset.state !== nextState) {
      // Keep a moving sibling from stealing hover before the current transition settles.
      hoverSettlesAt = performance.now() + (reducedPanels.matches ? 0 : 460);
    }
    stack.dataset.state = nextState;
    cards.forEach(card => {
      const open = card.dataset.card === active;
      const collapsed = Boolean(active && !open);
      card.classList.toggle('is-open', open);
      card.querySelector('.card-toggle').setAttribute('aria-expanded', String(open));
      const body = card.querySelector('.card-body');
      body.inert = collapsed;
      body.setAttribute('aria-hidden', String(collapsed));
      const details = card.querySelector('.card-details');
      if (details) {
        details.inert = !open;
        details.setAttribute('aria-hidden', String(!open));
      }
      card.querySelector('.idle-title')?.setAttribute('aria-hidden', String(open));
      card.querySelector('.reveal-title')?.setAttribute('aria-hidden', String(!open));
    });
  }
  // Respond to physical pointer movement, not enter/leave events caused by moving rows.
  stack.addEventListener('pointermove', event => {
    if (!hover.matches || event.pointerType === 'touch') return;
    if (event.clientX === lastX && event.clientY === lastY) return;
    const movement = lastX === null ? Infinity : Math.hypot(event.clientX - lastX, event.clientY - lastY);
    if (movement < 4) return;
    lastX = event.clientX; lastY = event.clientY;
    if (performance.now() < hoverSettlesAt) return;
    const card = event.target.closest('[data-card]');
    if (!card || !stack.contains(card) || hovered === card.dataset.card) return;
    hovered = card.dataset.card;
    render();
  });
  stack.addEventListener('pointerleave', () => {
    hovered = null; lastX = lastY = null; render();
  });
  cards.forEach(card => {
    const key = card.dataset.card;
    card.addEventListener('focusin', event => {
      if (!event.target.matches('.card-toggle')) { focused = key; render(); }
    });
    card.addEventListener('focusout', event => {
      if (!card.contains(event.relatedTarget)) { focused = null; render(); }
    });
    card.querySelector('.card-toggle').addEventListener('click', () => {
      pinned = pinned === key ? null : key;
      hovered = focused = null;
      render();
    });
  });
  stack.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const current = cards.find(card => card.classList.contains('is-open'));
      current?.querySelector('.card-toggle').focus();
      pinned = hovered = focused = null; render();
    }
  });
  render();
})();
