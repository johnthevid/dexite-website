(() => {
  const browser = document.querySelector('.client-browser');
  if (!browser) return;
  const projects = {
    techouse: {
      name:'Techouse', type:'Construction & solar',
      aim:'Bring its construction and solar offerings into one clear website, with a simple path to customer inquiries.',
      url:'https://techouse.johndavidceasar.workers.dev',
      slides:['Home','Services','Inquiries']
    },
    '10tacles': {
      name:'10Tacles Seafood House', type:'Seafood & cloud kitchen',
      aim:'Put the menu front and centre, make signature dishes easy to discover, and guide customers toward ordering.',
      url:'https://10tacles-staging.johndavidceasar.workers.dev',
      slides:['Home','Menu','Ordering']
    }
  };
  const buttons = [...browser.querySelectorAll('[data-company]')];
  const frame = browser.querySelector('.snapshot-frame');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let company = 'techouse', slide = 0, animation;
  function renderSlide() {
    const project = projects[company];
    frame.dataset.slide = String(slide);
    frame.querySelector('[role="img"]').setAttribute('aria-label', project.name + ' ' + project.slides[slide] + ' snapshot placeholder, not a finished design');
    document.getElementById('snapshot-label').textContent = project.slides[slide] + ' · ' + (slide + 1) + ' / ' + project.slides.length;
  }
  function animateChange() {
    if (reduced.matches || typeof frame.animate !== 'function') return;
    animation?.cancel();
    animation = frame.animate([{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.22,.7,.2,1)'});
  }
  function selectCompany(key) {
    if (!Object.hasOwn(projects,key)) return;
    const changed = company !== key;
    company = key; slide = 0;
    const project = projects[key];
    buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.company === key)));
    document.getElementById('company-name').textContent = project.name;
    document.getElementById('company-type').textContent = project.type;
    document.getElementById('company-aim').textContent = project.aim;
    const link = document.getElementById('company-link');
    link.href = project.url;
    link.setAttribute('aria-label','Visit '+project.name+' project preview (opens in a new tab)');
    renderSlide();
    if (changed) animateChange();
  }
  function moveSlide(direction) {
    slide = (slide + direction + projects[company].slides.length) % projects[company].slides.length;
    renderSlide(); animateChange();
  }
  buttons.forEach(button => button.addEventListener('click',()=>selectCompany(button.dataset.company)));
  document.getElementById('snapshot-prev').addEventListener('click',()=>moveSlide(-1));
  document.getElementById('snapshot-next').addEventListener('click',()=>moveSlide(1));
  browser.querySelector('.snapshot-slideshow').addEventListener('keydown',event=>{
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); moveSlide(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  selectCompany(company);
})();
