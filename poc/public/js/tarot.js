import { $, api, esc, store, toast, todayISO, T, prefs, bindSeg, shortName } from './common.js';

let topic = prefs.topic;
const requested = new URLSearchParams(location.search).get('topic');
if (requested in T) topic = prefs.topic = requested;

const state = { draws: store.get('dc:draws:' + todayISO) || {}, table: null };
const drawRecord = () => state.draws[topic] || { re: 0, picked: 0 };
const saveDraws = () => store.set('dc:draws:' + todayISO, state.draws);

/** The server shuffles with a seed (date, topic, spread, reshuffle); the fan is only the ritual. */
async function loadTable() {
  const { re } = drawRecord();
  if (state.table && state.table.topic === topic && state.table.re === re) return state.table;
  const data = await api('/api/tarot', { date: todayISO, topic, reshuffle: re });
  state.table = { topic, re, cards: data.cards, spreadName: data.spreadNameTh };
  return state.table;
}
async function render() {
  const current = topic;
  let table;
  try { table = await loadTable(); } catch (error) { $('#spreadDesc').textContent = error.message; return; }
  if (current !== topic) return; // the user switched topic while loading
  const rec = drawRecord();
  $('#spreadDesc').textContent = table.spreadName;
  $('#spread').innerHTML = table.cards.map((card, i) => {
    const open = i < rec.picked;
    return `<div class="slot"><small>${esc(card.roleTh)}</small>
      <div class="flip ${open ? 'open' : 'empty'}" id="slot${i}"><div class="in"><div class="face back"><img src="/assets/back.webp" alt="" width="170" height="416"></div><div class="face front"><img src="/assets/cards/${card.id}.webp" alt="${esc(card.nameTh)}" width="170" height="416" loading="lazy"></div></div></div>
      <p class="meaning">${open ? `<b>${esc(shortName(card.nameTh))}</b>${esc(card.interpretationTh)}` : '&nbsp;'}</p></div>`;
  }).join('');
  const fan = $('#fan'); fan.innerHTML = '';
  const count = 22, spreadDeg = Math.min(70, innerWidth / 12);
  for (let i = 0; i < count; i++) {
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `หยิบไพ่ใบที่ ${i + 1}`);
    const angle = (i - (count - 1) / 2) * (spreadDeg / (count - 1));
    button.style.transform = `translateX(-50%) rotate(${angle}deg)`; button.disabled = rec.picked >= 3;
    button.onmouseenter = () => { if (!button.disabled) button.style.transform = `translateX(-50%) rotate(${angle}deg) translateY(-18px)`; };
    button.onmouseleave = () => { button.style.transform = `translateX(-50%) rotate(${angle}deg)`; };
    button.onclick = () => pick(button);
    fan.append(button);
  }
  $('#seedInfo').textContent = `ไพ่ถูกสับไว้ที่เซิร์ฟเวอร์ตามวันที่ + หัวข้อ${T[topic]} ถามซ้ำวันนี้จะได้ชุดเดิม การเลือกใบเป็นพิธีกรรม ไม่ได้เปลี่ยนไพ่ที่ได้`;
  const shuffle = $('#reshuffle'); shuffle.disabled = rec.re >= 1;
  shuffle.textContent = rec.re >= 1 ? 'ใช้สิทธิ์สับใหม่ของวันนี้แล้ว' : 'สับใหม่ (เหลือ 1 ครั้งวันนี้)';
}
function pick(button) {
  const rec = { ...drawRecord() };
  if (rec.picked >= 3 || !state.table) return;
  button.disabled = true; button.style.opacity = .2;
  const index = rec.picked; rec.picked++;
  state.draws[topic] = rec; saveDraws();
  const card = state.table.cards[index], slot = $('#slot' + index);
  slot.classList.remove('empty'); requestAnimationFrame(() => requestAnimationFrame(() => slot.classList.add('open')));
  slot.parentElement.querySelector('.meaning').innerHTML = `<b>${esc(shortName(card.nameTh))}</b>${esc(card.interpretationTh)}`;
  if (rec.picked >= 3) $('#fan').querySelectorAll('button').forEach(b => { b.disabled = true; });
}
$('#reshuffle').onclick = () => {
  const rec = drawRecord(); if (rec.re >= 1) return;
  state.draws[topic] = { re: rec.re + 1, picked: 0 }; saveDraws();
  render(); toast('สับไพ่ใหม่แล้ว ใช้ได้วันละครั้งต่อหัวข้อ');
};
bindSeg('#topicSeg', topic, v => { topic = prefs.topic = v; render(); });
addEventListener('resize', () => { if (state.table) render(); });
addEventListener('dc:wiped', () => { state.draws = {}; state.table = null; render(); });
render();
