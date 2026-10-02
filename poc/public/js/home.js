import { $, reduce, prefs, bindSeg, renderPopular, kinetic } from './common.js';

kinetic($('#heroTitle'));
let topic = prefs.topic, horizon = prefs.horizon;
bindSeg('#topicSeg', topic, v => { topic = prefs.topic = v; });
bindSeg('#horizonSeg', horizon, v => { horizon = prefs.horizon = v; });

// The home page only collects the question; the answer is shown on its own page.
function goAsk(question) {
  question = question.trim();
  if (!question) { $('#q').focus(); return; }
  location.href = '/ask?' + new URLSearchParams({ q: question, topic, horizon });
}
$('#askForm').addEventListener('submit', event => { event.preventDefault(); goAsk($('#q').value); });
renderPopular(goAsk);

const heroBg = $('#heroBg');
if (!reduce) addEventListener('scroll', () => { heroBg.style.transform = `translate3d(0,${scrollY * 0.25}px,0)`; }, { passive: true });

/* ---- scrollytelling: step and video follow scroll position ---- */
const story = $('#story');
if (story && !reduce) {
  const steps = [...story.querySelectorAll('.step')], reels = [...story.querySelectorAll('.reel')], dots = [...story.querySelectorAll('.rail button')];
  const saveData = navigator.connection && navigator.connection.saveData;
  const canWebm = document.createElement('video').canPlayType('video/webm; codecs="vp9"');
  steps.forEach(step => kinetic(step.querySelector('h2')));
  let active = -1, inView = false;
  const load = reel => {
    if (reel.dataset.ready || saveData) return;
    reel.dataset.ready = '1';
    const name = reel.dataset.src;
    reel.innerHTML = (canWebm ? `<source src="/assets/video/${name}.webm" type="video/webm">` : '') + `<source src="/assets/video/${name}.mp4" type="video/mp4">`;
    reel.load();
  };
  const play = () => reels.forEach((reel, i) => {
    if (!reel.dataset.ready) return;
    if (inView && i === active) reel.play().catch(() => {}); else reel.pause();
  });
  function setActive(i) {
    if (i === active) return;
    active = i;
    steps.forEach((el, k) => el.classList.toggle('on', k === i));
    reels.forEach((el, k) => el.classList.toggle('on', k === i));
    dots.forEach((el, k) => { if (k === i) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); });
    [i, i + 1].forEach(k => reels[k] && load(reels[k]));
    play();
  }
  function update() {
    const rect = story.getBoundingClientRect(), span = story.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, span)));
    story.style.setProperty('--p', p.toFixed(4));
    setActive(Math.min(steps.length - 1, Math.floor(p * steps.length)));
  }
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) load(reels[0]); play(); }, { rootMargin: '200px 0px' }).observe(story);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  dots.forEach(dot => dot.addEventListener('click', () => {
    const span = story.offsetHeight - innerHeight, i = Number(dot.dataset.go);
    scrollTo({ top: story.offsetTop + span * (i + 0.5) / steps.length, behavior: 'smooth' });
  }));
  update();
}

/* ---- pointer glow on feature cards ---- */
document.querySelectorAll('.feature').forEach(card => card.addEventListener('pointermove', event => {
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${event.clientX - r.left}px`);
  card.style.setProperty('--my', `${event.clientY - r.top}px`);
}));
