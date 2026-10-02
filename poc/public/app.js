// Celestra UI. Every reading comes from the server API; nothing here computes
// astrology. The only client state is UI state under the "dc:" localStorage prefix.
const $ = selector => document.querySelector(selector);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok';
const todayISO = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/* ---------- storage: only dc:* keys, all removable with one click ---------- */
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
  clear() {
    try {
      Object.keys(localStorage).filter(key => key.startsWith('dc:')).forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('daily-compass-poc-v1'); // key used by the previous build
    } catch { /* ignore */ }
  }
};
const aiOn = () => store.get('dc:consent') === true;

function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}
const esc = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function api(path, body) {
  const response = await fetch(path, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'ขออภัย ระบบตอบไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง');
  return data;
}

/* ---------- labels ---------- */
const T = { general: 'ภาพรวม', love: 'ความรัก', career: 'การงาน', money: 'การเงิน', study: 'การเรียน' };
const H = { day: 'วันนี้', week: '7 วันนี้', month: '30 วันนี้', year: '365 วันนี้' };
const SIGNS = [['aries', 'เมษ', 'Aries'], ['taurus', 'พฤษภ', 'Taurus'], ['gemini', 'เมถุน', 'Gemini'], ['cancer', 'กรกฎ', 'Cancer'], ['leo', 'สิงห์', 'Leo'], ['virgo', 'กันย์', 'Virgo'], ['libra', 'ตุลย์', 'Libra'], ['scorpio', 'พิจิก', 'Scorpio'], ['sagittarius', 'ธนู', 'Sagittarius'], ['capricorn', 'มังกร', 'Capricorn'], ['aquarius', 'กุมภ์', 'Aquarius'], ['pisces', 'มีน', 'Pisces']];
const PLANET_TH = { Sun: 'อาทิตย์', Moon: 'จันทร์', Mercury: 'พุธ', Venus: 'ศุกร์', Mars: 'อังคาร', Jupiter: 'พฤหัสบดี', Saturn: 'เสาร์', Ketu: 'เกตุ', Rahu: 'ราหู' };
const POPULAR = ['งานที่เพิ่งสัมภาษณ์ไปจะได้ไหม', 'เดือนนี้จะมีงานทำไหม', 'คนเก่าจะกลับมาไหม', 'วันนี้ใส่สีอะไรดี', 'ช่วงนี้โชคไม่ดี แก้เคล็ดยังไง', 'ควรบูชาอะไรแล้วชีวิตดี', 'อีก 5 ปีชีวิตจะเป็นยังไง', 'ศาสตร์ไหนแม่นสุด', 'เครียดมาก ขอคำแนะนำ', 'สอบเดือนหน้าจะผ่านไหม'];
const METHODS = [
  ['โหราศาสตร์ตะวันตก', 'ธีมช่วงเวลา วัน เดือน ปี คำนวณตำแหน่งดาวได้ แต่ความหมายเป็นการตีความ', 3, 'หลัก'],
  ['ไพ่ทาโรต์', 'คำถามเฉพาะเรื่อง ใช้ไพ่เป็นกระจกมองสถานการณ์หลายมุม', 0, 'หลัก'],
  ['อี้จิง', 'การเลือกระหว่างทางเลือก หรือวางแผนรับมือการเปลี่ยนแปลง', 0, 'ทดลอง'],
  ['เวทิก / มหาทศา', 'สำรวจธีมระยะยาว หลายปีข้างหน้า', 2, 'ทดลอง']
];

const state = { topic: 'career', horizon: 'day', draws: store.get('dc:draws:' + todayISO) || {}, profile: null, table: null, ritual: null };

/* ---------- kinetic headline: word granularity only, never per character ---------- */
function kinetic(el) {
  if (reduce || !('Segmenter' in Intl)) return;
  const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
  let index = 0;
  const walk = node => [...node.childNodes].forEach(child => {
    if (child.nodeType === 3) {
      const fragment = document.createDocumentFragment();
      for (const { segment } of segmenter.segment(child.textContent)) {
        if (!segment.trim()) { fragment.append(segment); continue; }
        const span = document.createElement('span'); span.className = 'w'; span.style.setProperty('--i', index++); span.textContent = segment; fragment.append(span);
      }
      child.replaceWith(fragment);
    } else walk(child);
  });
  walk(el);
}
function fadeWords(el, text) {
  if (reduce || !('Segmenter' in Intl)) { el.textContent = text; return; }
  el.textContent = '';
  const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
  let index = 0;
  for (const { segment } of segmenter.segment(text)) {
    const span = document.createElement('span'); span.textContent = segment; span.style.cssText = `opacity:.001;transition:opacity .35s ${index++ * 28}ms`; el.append(span);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('span').forEach(span => { span.style.opacity = 1; })));
}

/* ---------- today ---------- */
const shortName = name => name.split(' (')[0];
async function renderToday() {
  const query = new URLSearchParams({ date: todayISO, timezone: TZ, lang: 'th', ai: aiOn() ? '1' : '0' });
  try {
    const { reading, ritual, dailyCard } = await api('/api/today?' + query);
    state.ritual = ritual;
    const th = reading.contentTh;
    $('#todayDate').textContent = new Intl.DateTimeFormat('th-TH', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(todayISO + 'T12:00:00Z'));
    $('#phaseName').textContent = th.name; $('#phaseDeg').textContent = Math.round(reading.source.phaseAngle) + '°';
    $('#readSignal').textContent = th.signal; $('#readText').textContent = th.reading;
    $('#readAction').textContent = 'ลองทำ: ' + th.action; $('#readPrompt').textContent = th.prompt;
    $('#readTag').textContent = reading.narrativeSource.startsWith('OpenAI') ? 'AI เรียบเรียงจากข้อความที่อนุมัติแล้ว' : 'คำนวณจากเฟสดวงจันทร์ · ข้อความแม่แบบ';
    $('#swatch').style.background = `linear-gradient(135deg,${ritual.today.hex},${ritual.today.hex}aa)`;
    $('#colorName').textContent = `สี${ritual.today.colorTh} · ${ritual.today.dayTh}`;
    $('#dailyMini').innerHTML = `<img src="assets/cards/${dailyCard.id}.webp" alt="${esc(dailyCard.nameTh)}" width="84" height="206">`;
    $('#dailyName').textContent = shortName(dailyCard.nameTh); $('#dailyMeaning').textContent = dailyCard.interpretationTh;
    $('#warnList').innerHTML = ritual.reminders.th.map(item => `<li>${esc(item)}</li>`).join('');
    $('#doList').innerHTML = [th.action, ...ritual.practices.th.slice(0, 2)].map(item => `<li>${esc(item)}</li>`).join('');
    renderDays(ritual);
  } catch (error) {
    $('#readSignal').textContent = 'ยังอ่านวันนี้ไม่ได้'; $('#readText').textContent = error.message;
  }
}

/* ---------- answer view model: server answer -> what the panel shows ---------- */
const LEVEL = { low: 1, medium: 2, good: 3 };
const LEVEL_TH = ['', 'ต่ำ', 'ปานกลาง', 'ดี'];
const levelHtml = level => { const n = LEVEL[level] || 0; return `<span class="conf" title="ระดับความเหมาะของข้อมูล ไม่ใช่ความน่าจะเป็น">${[0, 1, 2].map(i => `<i class="d ${i < n ? 'f' : ''}"></i>`).join('')} ${LEVEL_TH[n]}</span>`; };
const TITLES = { accuracy: 'ไม่มีศาสตร์ไหนพิสูจน์ได้ว่าแม่นที่สุด', support: 'ความเครียดเป็นสัญญาณที่ควรรับฟัง', ritual: 'สี ธรรมเนียม และข้อควรระวัง', 'life-timeline': 'ธีมหลายปีข้างหน้า', 'needs-profile': 'ภาพหลายปีต้องใช้วัน เวลา และสถานที่เกิด', belief: 'ไม่มีระบบไหนบอกได้ว่าคุณต้องบูชาองค์ไหน' };
const JUMP = { accuracy: '#honest', support: '#care', 'needs-profile': '#chart' };

function view(res) {
  const a = res.answer;
  const title = TITLES[a.type] || (a.type === 'period' ? a.th?.signal || a.signal : a.primaryHexagram ? `${a.primaryHexagram.hanzi} ${a.primaryHexagram.title}` : a.cards ? a.cards.map(card => card.themeTh.split(' · ')[0]).join(' · ') : a.signal || 'มุมมองสำหรับคำถามของคุณ');
  const prep = a.steps || (a.type === 'life-timeline' ? [a.action] : [a.actionTh || a.th?.action || a.action]);
  const watch = [a.guidance?.avoid, ...(a.reminders || []), a.type === 'support' ? a.care : null].filter(Boolean);
  return {
    a, title,
    maybe: a.message || a.scenario || '',
    watch: watch.length ? watch : ['อย่าตัดสินใจเรื่องใหญ่ตอนเหนื่อยหรือโกรธ'],
    prep: prep.filter(Boolean),
    experimental: a.type === 'life-timeline' || Boolean(a.primaryHexagram),
    why: [...(a.sources || []).map(src => `<b>${esc(src.label)}</b> ${esc(src.detail)}`), ...(a.confidence?.reasons || []).map(reason => `<b>เหตุผลของระดับความมั่นใจ</b> ${esc(reason)}`)],
    jump: JUMP[a.type]
  };
}

function yearRows(rows) {
  return rows.map(row => {
    const contacts = row.contacts.map(c => c.textTh).join(' ');
    const pill = { open: ['open', 'เปิดกว้าง'], review: ['review', 'ทบทวน'], quiet: ['quiet', 'เงียบ'] }[row.emphasis];
    return `<div class="yr"><div><div class="y">${row.start.slice(0, 4)}</div><div class="e">มหาทศา${PLANET_TH[row.dasha.lord] || row.dasha.lord}</div></div><p><span class="pill ${pill[0]}">${pill[1]}</span>${esc(contacts || 'ไม่พบมุมดาวช้าที่เด่นชัดในปีนี้ เป็นปีที่เหมาะกับการสะสมทักษะ')}</p></div>`;
  }).join('');
}

async function ask(question) {
  question = question.trim();
  if (!question) return;
  const thread = $('#thread'), answerEl = $('#answer');
  thread.innerHTML = `<div class="bub me">${esc(question)}</div><div class="bub ai" id="aiBub">กำลังอ่านให้ …</div>`;
  let res;
  try {
    res = await api('/api/ask', { question, topic: state.topic, horizon: state.horizon, date: todayISO, timezone: TZ, lang: 'th', ai: aiOn(), birthTimeKnown: !$('#bunknown').checked, ...(state.profile ? { birthProfile: state.profile } : {}) });
  } catch (error) { $('#aiBub').textContent = error.message; return; }

  if (res.answer.type === 'crisis') {
    // Crisis: only the support panel. No reading, cards, colour or confidence.
    const a = res.answer;
    $('#aiBub')?.remove();
    answerEl.className = 'crisis ans';
    answerEl.innerHTML = `<span class="eyebrow" style="color:var(--calm)">ไม่ได้ดูดวงให้ในคำถามนี้</span><h3>${esc(a.title)}</h3><p>${esc(a.message)}</p>
      <div class="copy"><span class="num">${esc(a.hotline.number)}</span><span>${esc(a.hotline.nameTh)} · ${esc(a.hotline.hoursTh)}</span></div>
      <p>${esc(a.urgent)}</p><ul class="list calm">${a.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ul>`;
    return;
  }

  const v = view(res), a = v.a;
  answerEl.className = 'glass ans';
  fadeWords($('#aiBub'), v.maybe);
  const cards = a.cards ? `<div class="cards3">${a.cards.map(card => `<figure><div class="mini"><img src="assets/cards/${card.id}.webp" alt="${esc(card.nameTh)}" width="96" height="235"></div><figcaption>${esc(card.roleTh)}<br><b style="color:var(--ink);font-weight:500">${esc(shortName(card.nameTh))}</b></figcaption></figure>`).join('')}</div>` : '';
  const fit = a.methodFit ? `<div class="box" style="grid-column:1/-1"><h4>แต่ละศาสตร์เหมาะกับอะไร</h4><ul class="list" style="font-size:var(--s-1)">${a.methodFit.map(([name, text]) => `<li><span><b>${esc(name)}</b> ${esc(text)}</span></li>`).join('')}</ul></div>` : '';
  const years = a.rows ? `<div class="box" style="grid-column:1/-1"><h4>ธีมรายปี</h4><div class="timeline">${yearRows(a.rows)}</div></div>` : '';
  const topic = res.route.topic, horizon = res.route.horizon;
  answerEl.innerHTML = `<div class="ans-top"><span class="tag">${T[topic] || 'ภาพรวม'} · ${H[horizon] || H.day}</span>${v.experimental ? '<span class="tag exp">ทดลอง</span>' : ''}${a.confidence ? levelHtml(a.confidence.level) : ''}</div>
    <h3>${esc(v.title)}</h3>
    ${a.safety ? `<div class="notice" role="note"><b>โปรดทราบ</b> ${esc(a.safety.notice)}</div>` : ''}
    ${cards}
    <div class="grid2">
      <div class="box"><h4>สิ่งที่อาจเกิดขึ้น</h4><p style="font-size:var(--s-1)">${esc(v.maybe)}</p></div>
      <div class="box"><h4>ควรระวัง</h4><ul class="list warn" style="font-size:var(--s-1)">${v.watch.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
      <div class="box" style="grid-column:1/-1"><h4>เตรียมตัวยังไงดี</h4><ul class="list" style="font-size:var(--s-1)">${v.prep.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
      ${fit}${years}
    </div>
    ${v.jump ? `<a class="btn ghost" href="${v.jump}" style="justify-self:start;text-decoration:none">ดูรายละเอียด</a>` : ''}
    <div class="why"><span class="eyebrow" style="font-size:.7rem">ทำไมถึงตอบแบบนี้</span>${v.why.map(item => `<span>${item}</span>`).join('')}<span>ระดับความมั่นใจคือความเหมาะของข้อมูล ไม่ใช่ความน่าจะเป็นว่าจะเกิดขึ้นจริง</span></div>`;
  if (a.cards && topic !== state.topic) { state.topic = topic; setSeg('#topicSeg', topic); renderTarot(); }
}

/* ---------- tarot table: the server shuffles with a seed; the fan is the ritual ---------- */
const drawRecord = () => state.draws[state.topic] || { re: 0, picked: 0 };
const saveDraws = () => store.set('dc:draws:' + todayISO, state.draws);
async function loadTable() {
  const { re } = drawRecord(), topic = state.topic;
  if (state.table && state.table.topic === topic && state.table.re === re) return state.table;
  const data = await api('/api/tarot', { date: todayISO, topic, reshuffle: re });
  state.table = { topic, re, cards: data.cards, spreadName: data.spreadNameTh };
  return state.table;
}
async function renderTarot() {
  const topic = state.topic;
  let table;
  try { table = await loadTable(); } catch (error) { $('#spreadDesc').textContent = error.message; return; }
  if (topic !== state.topic) return; // the user switched topic while loading
  const rec = drawRecord();
  $('#spreadDesc').textContent = table.spreadName;
  $('#spread').innerHTML = table.cards.map((card, i) => {
    const open = i < rec.picked;
    return `<div class="slot"><small>${esc(card.roleTh)}</small>
      <div class="flip ${open ? 'open' : 'empty'}" id="slot${i}"><div class="in"><div class="face back"><img src="assets/back.webp" alt="" width="170" height="416"></div><div class="face front"><img src="assets/cards/${card.id}.webp" alt="${esc(card.nameTh)}" width="170" height="416" loading="lazy"></div></div></div>
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
  state.draws[state.topic] = rec; saveDraws();
  const card = state.table.cards[index], slot = $('#slot' + index);
  slot.classList.remove('empty'); requestAnimationFrame(() => requestAnimationFrame(() => slot.classList.add('open')));
  slot.parentElement.querySelector('.meaning').innerHTML = `<b>${esc(shortName(card.nameTh))}</b>${esc(card.interpretationTh)}`;
  if (rec.picked >= 3) $('#fan').querySelectorAll('button').forEach(b => { b.disabled = true; });
}
$('#reshuffle').onclick = () => {
  const rec = drawRecord(); if (rec.re >= 1) return;
  state.draws[state.topic] = { re: rec.re + 1, picked: 0 }; saveDraws();
  renderTarot(); toast('สับไพ่ใหม่แล้ว ใช้ได้วันละครั้งต่อหัวข้อ');
};

/* ---------- birth chart: every number comes from /api/natal-chart, /api/ritual, /api/life-timeline ---------- */
function paintWheel(activeId) {
  $('#wheel').classList.toggle('idle', !activeId);
  $('#wheel').innerHTML = SIGNS.map(([id, th]) => `<figure class="${id === activeId ? 'on' : ''}"><img src="assets/zodiac/${id}.webp" alt="ราศี${th}" width="72" height="72" loading="lazy"><figcaption>${th}</figcaption></figure>`).join('');
}
async function calculateChart(event) {
  event.preventDefault();
  const unknown = $('#bunknown').checked;
  const [latitude, longitude] = $('#bplace').value.split(',').map(Number);
  const profile = { birthDate: $('#bdate').value, birthTime: unknown ? '12:00' : $('#btime').value, timezone: 'Asia/Bangkok', latitude, longitude };
  const years = Number($('#byears').value);
  $('#timeline').innerHTML = '<p class="empty-note">กำลังคำนวณ …</p>';
  try {
    const [chart, ritual, life] = await Promise.all([
      api('/api/natal-chart', profile),
      api('/api/ritual', { date: todayISO, timezone: TZ, birthDate: profile.birthDate }),
      api('/api/life-timeline', { birthProfile: profile, date: todayISO, timezone: TZ, years, topic: 'general' })
    ]);
    state.profile = profile;
    const sun = chart.placements.find(p => p.body === 'Sun').sign, asc = chart.placements.find(p => p.body === 'Ascendant').sign;
    const sunSign = SIGNS.find(s => s[2] === sun), ascSign = SIGNS.find(s => s[2] === asc);
    paintWheel(sunSign[0]);
    $('#facts').innerHTML = [['ราศีอาทิตย์ (ตะวันตก)', sunSign[1]], ['เกิดวัน', ritual.birthDay.dayTh], ['เลขชีวิต', ritual.lifeNumber], ['สีวันเกิด', ritual.birthDay.colorTh], ['พระประจำวันเกิด', ritual.birthDay.postureTh], ['ลัคนา', unknown ? 'ไม่ทราบเวลา' : ascSign[1]]]
      .map(([k, v]) => `<div class="fact"><span>${k}</span><b>${esc(v)}</b></div>`).join('');
    $('#timeline').innerHTML = yearRows(life.rows);
    $('#tlNote').textContent = (unknown ? 'ไม่ทราบเวลาเกิด: มหาทศาคำนวณจากเที่ยงวัน อาจคลาดเคลื่อนมาก · ' : '') + 'เป็นธีมเชิงตีความจากมุมดาวพฤหัสบดี/เสาร์และมหาทศา (ระบบเวทิกยังรอผู้เชี่ยวชาญตรวจ) ไม่ใช่การทำนายเหตุการณ์ อย่าใช้ตัดสินใจเรื่องสุขภาพ กฎหมาย การเงิน หรือความสัมพันธ์';
    renderDays(ritual);
    toast('คำนวณแล้ว ข้อมูลเกิดไม่ถูกบันทึก');
  } catch (error) {
    $('#timeline').innerHTML = `<p class="empty-note">${esc(error.message)}</p>`;
  }
}

/* ---------- ritual days ---------- */
function renderDays(ritual) {
  const today = ritual.today.id, birth = ritual.birthDay?.id;
  $('#days').innerHTML = ritual.allDays.map(day => `<div class="day ${day.id === today ? 'today' : ''} ${day.id === birth ? 'birth' : ''}"><i style="background:${day.hex}"></i><b style="font-weight:500">${esc(day.dayTh.replace('วัน', ''))}</b><span class="muted">${esc(day.colorTh)}</span></div>`).join('');
  $('#postureLine').textContent = ritual.birthDay
    ? `คุณเกิด${ritual.birthDay.dayTh} พระประจำวันเกิดคือ${ritual.birthDay.postureTh} สีประจำวันเกิดคือสี${ritual.birthDay.colorTh} · เป็นธรรมเนียมไทย ยังไม่ได้ตรวจกับแหล่งอ้างอิงในต้นแบบนี้`
    : 'กรอกวันเกิดเพื่อดูพระและสีประจำวันเกิด';
}

/* ---------- controls ---------- */
function setSeg(selector, value) { document.querySelectorAll(selector + ' button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === value)); }
$('#topicSeg').onclick = event => { const v = event.target.dataset?.v; if (!v) return; state.topic = v; setSeg('#topicSeg', v); renderTarot(); };
$('#horizonSeg').onclick = event => { const v = event.target.dataset?.v; if (!v) return; state.horizon = v; setSeg('#horizonSeg', v); };
$('#popular').innerHTML = POPULAR.map(item => `<button type="button" class="chip">${esc(item)}</button>`).join('');
$('#popular').onclick = event => { if (event.target.classList.contains('chip')) { $('#q').value = event.target.textContent; ask(event.target.textContent); $('#ask').scrollIntoView(); } };
$('#askForm').addEventListener('submit', event => { event.preventDefault(); ask($('#q').value); $('#ask').scrollIntoView(); });
$('#birthForm').addEventListener('submit', calculateChart);
$('#bunknown').onchange = () => { $('#btime').disabled = $('#bunknown').checked; };
$('#copyHot').onclick = async () => {
  const number = $('#hotline').textContent;
  try { await navigator.clipboard.writeText(number); toast(`คัดลอก ${number} แล้ว`); }
  catch { const range = document.createRange(); range.selectNodeContents($('#hotline')); getSelection().removeAllRanges(); getSelection().addRange(range); toast('เลือกเบอร์ไว้แล้ว กดคัดลอกได้เลย'); }
};
const consent = $('#aiConsent');
consent.checked = aiOn();
consent.onchange = () => { store.set('dc:consent', consent.checked); toast(consent.checked ? 'เปิดให้ AI เรียบเรียงข้อความรายวันแล้ว' : 'ปิดแล้ว ใช้ข้อความแม่แบบ'); renderToday(); };
$('#wipe').onclick = () => {
  store.clear();
  state.draws = {}; state.profile = null; state.table = null;
  consent.checked = false;
  $('#facts').innerHTML = ''; $('#timeline').innerHTML = '<p class="empty-note">กรอกข้อมูลเกิดแล้วกดคำนวณ เพื่อดูธีมรายปี</p>'; paintWheel(null);
  if (state.ritual) renderDays({ ...state.ritual, birthDay: null });
  $('#thread').innerHTML = ''; $('#answer').className = 'glass ans'; $('#answer').innerHTML = '';
  renderTarot(); renderToday();
  toast('ลบข้อมูลของคุณในเครื่องนี้แล้ว');
};

/* ---------- static sections ---------- */
$('#methods').innerHTML = METHODS.map(([name, desc, calc, tag]) => `<article class="glass method reveal"><span class="tag ${tag === 'ทดลอง' ? 'exp' : ''}">${tag}</span><h3>${name}</h3><p class="muted" style="font-size:var(--s-1)">${desc}</p><div class="meter" role="img" aria-label="ส่วนที่คำนวณได้ ${calc} จาก 5">${[0, 1, 2, 3, 4].map(i => `<i class="${i < calc ? 'c' : 't'}"></i>`).join('')}</div></article>`).join('');

/* ---------- nav highlight + hero parallax ---------- */
const links = [...document.querySelectorAll('.nav a.l')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) links.forEach(link => link.classList.toggle('on', link.getAttribute('href') === '#' + entry.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section').forEach(section => observer.observe(section));
}
const heroBg = $('#heroBg');
if (!reduce) addEventListener('scroll', () => { heroBg.style.transform = `translate3d(0,${scrollY * 0.25}px,0)`; }, { passive: true });
addEventListener('resize', () => { if (state.table) renderTarot(); });

/* ---------- boot ---------- */
kinetic($('#heroTitle'));
paintWheel(null);
(async () => {
  api('/api/safety').then(({ hotline }) => { $('#hotline').textContent = hotline.number; }).catch(() => { /* keep the static number */ });
  await Promise.all([renderToday(), renderTarot()]);
  ask($('#q').value);
})();
