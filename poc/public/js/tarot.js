// Tarot table. The server shuffles with a seed (date, topic, spread, reshuffle), so the cards
// are already fixed; choosing from the fan is the ritual and never changes which cards you get.
// Flow: pick 3 cards (each flies into a slot, face down) -> press "ทำนายไพ่" -> cards flip and
// the reading appears.
import { $, api, aiOn, esc, store, toast, todayISO, TZ, T, prefs, bindSeg, shortName, profile, reduce, levelHtml } from './common.js';

let topic = prefs.topic;
const requested = new URLSearchParams(location.search).get('topic');
if (requested in T) topic = prefs.topic = requested;

const NEED = 3;
const state = { draws: store.get('dc:draws:' + todayISO) || {}, table: null, busy: false, renderId: 0 };
// per-topic UI record: how many times it was reshuffled, which fan cards were taken, whether it was revealed
const record = () => ({ re: 0, taken: [], revealed: false, ...(state.draws[topic] || {}) });
const save = rec => { state.draws[topic] = rec; store.set('dc:draws:' + todayISO, state.draws); };

async function loadTable() {
  const { re } = record();
  if (state.table && state.table.topic === topic && state.table.re === re) return state.table;
  const data = await api('/api/tarot', { date: todayISO, topic, reshuffle: re });
  state.table = { topic, re, cards: data.cards, spreadName: data.spreadNameTh };
  return state.table;
}

function updateLine(rec) {
  const left = NEED - rec.taken.length;
  $('#pickLine').textContent = rec.revealed ? 'เปิดไพ่แล้ว อ่านคำทำนายด้านล่าง'
    : left > 0 ? `เลือกไพ่จากกองด้านล่างอีก ${left} ใบ ไพ่ที่เลือกจะบินเข้าช่องแบบคว่ำไว้`
      : 'เลือกครบแล้ว กด “ทำนายไพ่” เพื่อเปิดไพ่ทั้งสามใบ';
  $('#predict').hidden = !(rec.taken.length === NEED && !rec.revealed);
  const shuffle = $('#reshuffle');
  shuffle.disabled = rec.re >= 1 || state.busy;
  shuffle.textContent = rec.re >= 1 ? 'ใช้สิทธิ์สับใหม่ของวันนี้แล้ว' : 'สับใหม่ (เหลือ 1 ครั้งวันนี้)';
  $('#seedInfo').textContent = `ไพ่ถูกสับไว้ที่เซิร์ฟเวอร์ตามวันที่ + หัวข้อ${T[topic]} ถามซ้ำวันนี้จะได้ชุดเดิม การเลือกใบเป็นพิธีกรรม ไม่ได้เปลี่ยนไพ่ที่ได้`;
}

async function render() {
  const id = ++state.renderId, current = topic;
  let table;
  try { table = await loadTable(); } catch (error) { $('#pickLine').textContent = error.message; return; }
  if (id !== state.renderId || current !== topic) return; // a newer render or topic switch took over
  const rec = record();
  $('#spreadDesc').textContent = table.spreadName;
  $('#spread').innerHTML = table.cards.map((card, i) => {
    const placed = i < rec.taken.length, open = placed && rec.revealed;
    return `<div class="slot"><small>${esc(card.roleTh)}</small>
      <div class="flip ${open ? 'open placed' : placed ? 'placed' : 'empty'}" id="slot${i}"><div class="in"><div class="face back"><img src="/assets/back.webp" alt="" width="170" height="416"></div><div class="face front"><img src="/assets/cards/${card.id}.webp" alt="${esc(card.nameTh)}" width="170" height="416" loading="lazy"></div></div></div>
      <p class="meaning">${open ? `<b>${esc(shortName(card.nameTh))}</b>${esc(card.interpretationTh)}` : '&nbsp;'}</p></div>`;
  }).join('');
  document.querySelector(`#slot${rec.taken.length}`)?.classList.add('target');
  buildFan(rec);
  updateLine(rec);
  if (rec.revealed) await predict({ instant: true });
  else $('#reading').hidden = true;
}

/* ---------- the fan: large, evenly spread, every card clearly visible ---------- */
function buildFan(rec) {
  const fan = $('#fan'); fan.innerHTML = '';
  const count = 22, width = fan.clientWidth || 600;
  const cw = parseFloat(getComputedStyle(fan).getPropertyValue('--cw')) || 90;
  const ch = cw * 490 / 200, radius = ch * 1.7;
  const maxX = width / 2 - cw / 2 - 6;
  const half = Math.min(58, Math.asin(Math.min(1, maxX / radius)) * 180 / Math.PI);
  for (let i = 0; i < count; i++) {
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-label', `หยิบไพ่ใบที่ ${i + 1}`);
    const angle = -half + (2 * half * i) / (count - 1);
    button.dataset.angle = angle;
    button.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    if (rec.taken.includes(i)) button.classList.add('taken');
    button.disabled = rec.taken.length >= NEED || rec.revealed || state.busy;
    button.onmouseenter = () => { if (!button.disabled) button.style.transform = `translateX(-50%) rotate(${angle}deg) translateY(-26px)`; };
    button.onmouseleave = () => { button.style.transform = `translateX(-50%) rotate(${angle}deg)`; };
    button.onclick = () => pick(button, i);
    fan.append(button);
  }
}

/** The chosen card travels from the fan into the next empty slot, face down. */
function fly(button, slot, done) {
  if (reduce) { done(); return; }
  const from = button.getBoundingClientRect(), to = slot.getBoundingClientRect();
  const w = button.offsetWidth, h = button.offsetHeight, angle = Number(button.dataset.angle) || 0;
  const cx = from.left + from.width / 2, cy = from.top + from.height / 2;
  const dx = to.left + to.width / 2 - cx, dy = to.top + to.height / 2 - cy, scale = to.width / w;
  const flyer = document.createElement('div');
  flyer.className = 'flyer';
  flyer.style.cssText = `left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px`;
  document.body.append(flyer);
  const animation = flyer.animate([
    { transform: `translate(0,0) rotate(${angle}deg) scale(1)` },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 80}px) rotate(${angle * 0.35}deg) scale(${(1 + scale) / 2 * 1.12})`, offset: 0.5 },
    { transform: `translate(${dx}px,${dy}px) rotate(0deg) scale(${scale})` }
  ], { duration: 800, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
  animation.onfinish = () => { flyer.remove(); done(); };
  animation.oncancel = () => { flyer.remove(); done(); };
}

function pick(button, index) {
  const rec = record();
  if (state.busy || rec.taken.length >= NEED || rec.revealed || rec.taken.includes(index)) return;
  const slot = $('#slot' + rec.taken.length);
  state.busy = true;
  document.querySelectorAll('#fan button').forEach(b => { b.disabled = true; });
  button.classList.add('taken');
  slot.classList.remove('target');
  fly(button, slot, () => {
    const next = { ...rec, taken: [...rec.taken, index] };
    save(next);
    slot.classList.remove('empty'); slot.classList.add('placed');
    state.busy = false;
    document.querySelector(`#slot${next.taken.length}`)?.classList.add('target');
    document.querySelectorAll('#fan button').forEach(b => { b.disabled = next.taken.length >= NEED; });
    updateLine(next);
  });
}

/* ---------- predict: flip the cards one by one, then show the reading ---------- */
async function predict({ instant = false } = {}) {
  const rec = record();
  if (rec.taken.length < NEED) return;
  const button = $('#predict');
  button.disabled = true; button.textContent = 'กำลังอ่านไพ่ …';
  const birth = profile.get();
  let res;
  try {
    res = await api('/api/ask', { question: 'ขอไพ่ประจำหัวข้อนี้', method: 'tarot', topic, date: todayISO, timezone: TZ, lang: 'th', ai: aiOn(), reshuffle: rec.re, birthTimeKnown: !birth?.timeUnknown, ...(birth ? { birthProfile: { birthDate: birth.birthDate, birthTime: birth.birthTime, timezone: birth.timezone, latitude: birth.latitude, longitude: birth.longitude } } : {}) });
  } catch (error) { $('#pickLine').textContent = error.message; button.disabled = false; button.textContent = 'ทำนายไพ่'; return; }
  const a = res.answer, cards = state.table.cards;
  button.disabled = false; button.textContent = 'ทำนายไพ่';
  for (let i = 0; i < cards.length; i++) {
    if (!instant && !reduce) await new Promise(resolve => setTimeout(resolve, i === 0 ? 150 : 650));
    const slot = $('#slot' + i);
    slot.classList.add('open');
    slot.parentElement.classList.add('revealed');
    slot.parentElement.querySelector('.meaning').innerHTML = `<b>${esc(shortName(cards[i].nameTh))}</b>${esc(cards[i].interpretationTh)}`;
  }
  if (!rec.revealed) save({ ...rec, revealed: true });
  const watch = [a.guidance?.avoid].filter(Boolean), prep = a.steps || [a.actionTh || a.action];
  const reading = $('#reading');
  reading.innerHTML = `<div class="ans-top"><span class="tag">${T[topic]} · ไพ่ 3 ใบ</span>${a.confidence ? levelHtml(a.confidence.level) : ''}</div>
    <h3>คำทำนายจากไพ่</h3>
    ${a.safety ? `<div class="notice" role="note"><b>โปรดทราบ</b> ${esc(a.safety.notice)}</div>` : ''}
    <div class="grid2">
      <div class="box" style="grid-column:1/-1"><h4>สิ่งที่อาจเกิดขึ้น</h4><p>${esc(a.message || a.scenario || '')}</p></div>
      <div class="box"><h4>ควรระวัง</h4><ul class="list warn" style="font-size:var(--s-1)">${(watch.length ? watch : ['อย่าตัดสินใจเรื่องใหญ่ตอนเหนื่อยหรือโกรธ']).map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
      <div class="box"><h4>เตรียมตัวยังไงดี</h4><ul class="list" style="font-size:var(--s-1)">${prep.filter(Boolean).map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
    </div>
    <div class="why"><span class="eyebrow" style="font-size:.7rem">ทำไมถึงตอบแบบนี้</span>${(a.sources || []).map(src => `<span><b>${esc(src.label)}</b> ${esc(src.detail)}</span>`).join('')}${(a.confidence?.reasons || []).map(reason => `<span><b>เหตุผลของระดับความมั่นใจ</b> ${esc(reason)}</span>`).join('')}<span>${esc(a.whyTh || '')} ระดับความมั่นใจคือความเหมาะของข้อมูล ไม่ใช่ความน่าจะเป็นว่าจะเกิดขึ้นจริง</span></div>`;
  reading.hidden = false;
  updateLine(record());
  if (!instant) reading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
}

$('#predict').onclick = () => predict();
$('#reshuffle').onclick = () => {
  const rec = record(); if (rec.re >= 1 || state.busy) return;
  save({ re: rec.re + 1, taken: [], revealed: false });
  $('#reading').hidden = true;
  render(); toast('สับไพ่ใหม่แล้ว ใช้ได้วันละครั้งต่อหัวข้อ');
};
bindSeg('#topicSeg', topic, v => { topic = prefs.topic = v; $('#reading').hidden = true; render(); });
let resizeTimer;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (state.table && !state.busy) buildFan(record()); }, 150); });
addEventListener('dc:wiped', () => { state.draws = {}; state.table = null; $('#reading').hidden = true; render(); });
render();
