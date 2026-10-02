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
