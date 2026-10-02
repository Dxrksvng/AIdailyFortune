import { $, api, aiOn, esc, fadeWords, profile, prefs, bindSeg, renderPopular, todayISO, TZ, T, H, yearRows, levelHtml } from './common.js';

const TITLES = { accuracy: 'ไม่มีศาสตร์ไหนพิสูจน์ได้ว่าแม่นที่สุด', support: 'ความเครียดเป็นสัญญาณที่ควรรับฟัง', ritual: 'สี ธรรมเนียม และข้อควรระวัง', 'life-timeline': 'ธีมหลายปีข้างหน้า', 'needs-profile': 'ภาพหลายปีต้องใช้วัน เวลา และสถานที่เกิด', belief: 'ไม่มีระบบไหนบอกได้ว่าคุณต้องบูชาองค์ไหน' };
const JUMP = { accuracy: ['/honest', 'ดูรายละเอียด'], support: ['/care', 'ดูรายละเอียด'], 'needs-profile': ['/chart', 'ไปกรอกข้อมูลเกิด'], 'life-timeline': ['/chart', 'ดูที่หน้าดวงกำเนิด'], ritual: ['/ritual', 'ดูสีและพระประจำวัน'] };
const shortName = name => name.split(' (')[0];

let topic = prefs.topic, horizon = prefs.horizon;

/** Server answer -> what the panel shows. */
function view(res) {
  const a = res.answer;
  const title = TITLES[a.type] || (a.type === 'period' ? a.th?.signal || a.signal : a.primaryHexagram ? `${a.primaryHexagram.hanzi} ${a.primaryHexagram.title}` : a.cards ? a.cards.map(card => card.themeTh.split(' · ')[0]).join(' · ') : a.signal || 'มุมมองสำหรับคำถามของคุณ');
  const prep = a.steps || (a.type === 'life-timeline' ? [a.action] : [a.actionTh || a.th?.action || a.action]);
  const watch = [a.guidance?.avoid, ...(a.reminders || []), a.type === 'support' ? a.care : null].filter(Boolean);
  const jump = a.cards ? [`/tarot?topic=${res.route.topic}`, 'ดูโต๊ะไพ่และหยิบไพ่เอง'] : JUMP[a.type];
  return {
    a, title,
    maybe: a.message || a.scenario || '',
    watch: watch.length ? watch : ['อย่าตัดสินใจเรื่องใหญ่ตอนเหนื่อยหรือโกรธ'],
    prep: prep.filter(Boolean),
    experimental: a.type === 'life-timeline' || Boolean(a.primaryHexagram),
    why: [...(a.sources || []).map(src => `<b>${esc(src.label)}</b> ${esc(src.detail)}`), ...(a.confidence?.reasons || []).map(reason => `<b>เหตุผลของระดับความมั่นใจ</b> ${esc(reason)}`)],
    jump
  };
}

async function ask(question) {
  question = question.trim();
  if (!question) return;
  const thread = $('#thread'), answerEl = $('#answer');
  thread.innerHTML = `<div class="bub me">${esc(question)}</div><div class="bub ai" id="aiBub">กำลังอ่านให้ …</div>`;
  const birth = profile.get();
  let res;
  try {
    res = await api('/api/ask', { question, topic, horizon, date: todayISO, timezone: TZ, lang: 'th', ai: aiOn(), birthTimeKnown: !birth?.timeUnknown, ...(birth ? { birthProfile: { birthDate: birth.birthDate, birthTime: birth.birthTime, timezone: birth.timezone, latitude: birth.latitude, longitude: birth.longitude } } : {}) });
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
  const cards = a.cards ? `<div class="cards3">${a.cards.map(card => `<figure><div class="mini"><img src="/assets/cards/${card.id}.webp" alt="${esc(card.nameTh)}" width="96" height="235"></div><figcaption>${esc(card.roleTh)}<br><b style="color:var(--ink);font-weight:500">${esc(shortName(card.nameTh))}</b></figcaption></figure>`).join('')}</div>` : '';
  const fit = a.methodFit ? `<div class="box" style="grid-column:1/-1"><h4>แต่ละศาสตร์เหมาะกับอะไร</h4><ul class="list" style="font-size:var(--s-1)">${a.methodFit.map(([name, text]) => `<li><span><b>${esc(name)}</b> ${esc(text)}</span></li>`).join('')}</ul></div>` : '';
  const years = a.rows ? `<div class="box" style="grid-column:1/-1"><h4>ธีมรายปี</h4><div class="timeline">${yearRows(a.rows)}</div></div>` : '';
  answerEl.innerHTML = `<div class="ans-top"><span class="tag">${T[res.route.topic] || 'ภาพรวม'} · ${H[res.route.horizon] || H.day}</span>${v.experimental ? '<span class="tag exp">ทดลอง</span>' : ''}${a.confidence ? levelHtml(a.confidence.level) : ''}</div>
    <h3>${esc(v.title)}</h3>
    ${a.safety ? `<div class="notice" role="note"><b>โปรดทราบ</b> ${esc(a.safety.notice)}</div>` : ''}
    ${cards}
    <div class="grid2">
      <div class="box"><h4>สิ่งที่อาจเกิดขึ้น</h4><p style="font-size:var(--s-1)">${esc(v.maybe)}</p></div>
      <div class="box"><h4>ควรระวัง</h4><ul class="list warn" style="font-size:var(--s-1)">${v.watch.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
      <div class="box" style="grid-column:1/-1"><h4>เตรียมตัวยังไงดี</h4><ul class="list" style="font-size:var(--s-1)">${v.prep.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
      ${fit}${years}
    </div>
    ${v.jump ? `<a class="btn ghost" href="${v.jump[0]}" style="justify-self:start;text-decoration:none">${v.jump[1]}</a>` : ''}
    <div class="why"><span class="eyebrow" style="font-size:.7rem">ทำไมถึงตอบแบบนี้</span>${v.why.map(item => `<span>${item}</span>`).join('')}<span>ระดับความมั่นใจคือความเหมาะของข้อมูล ไม่ใช่ความน่าจะเป็นว่าจะเกิดขึ้นจริง</span></div>`;
}

bindSeg('#topicSeg', topic, v => { topic = prefs.topic = v; });
bindSeg('#horizonSeg', horizon, v => { horizon = prefs.horizon = v; });
renderPopular(question => { $('#q').value = question; ask(question); });
$('#askForm').addEventListener('submit', event => { event.preventDefault(); ask($('#q').value); });
addEventListener('dc:wiped', () => { $('#thread').innerHTML = ''; $('#answer').className = 'glass ans'; $('#answer').innerHTML = ''; });

// arriving from the home page (or a shared link) with ?q=...&topic=...&horizon=...
const params = new URLSearchParams(location.search);
if (params.get('topic') in T) { topic = prefs.topic = params.get('topic'); bindSeg('#topicSeg', topic, v => { topic = prefs.topic = v; }); }
if (params.get('horizon') in H) { horizon = prefs.horizon = params.get('horizon'); bindSeg('#horizonSeg', horizon, v => { horizon = prefs.horizon = v; }); }
const initial = params.get('q');
if (initial) { $('#q').value = initial; ask(initial); }
else { $('#q').value = ''; $('#thread').innerHTML = '<p class="empty-note">พิมพ์คำถามด้านบน หรือเลือกคำถามยอดฮิต แล้วกด “ถามดวง”</p>'; }
