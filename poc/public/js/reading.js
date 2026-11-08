import { $, esc, profile, store, todayISO, TZ } from './common.js';

// Device id only meters the free AI allowance; it is random, never derived from the person, and is
// removed with the other dc: keys by "delete my data".
function deviceId() {
  let id = store.get('dc:device');
  if (typeof id !== 'string' || id.length < 16) { id = crypto.randomUUID(); store.set('dc:device', id); }
  return id;
}

async function post(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-device-id': deviceId() }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'ขออภัย ระบบตอบไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง');
  return data;
}

const QUOTA_TH = {
  'no-consent': 'ยังไม่ได้ติ๊กยินยอม จึงแสดงเฉพาะผลที่คำนวณได้ ไม่ได้ส่งข้อมูลไปที่ AI',
  'device-limit': 'สิทธิ์ทดลอง AI ของอุปกรณ์นี้ใช้ครบแล้ว แสดงเฉพาะผลที่คำนวณได้',
  'daily-budget': 'วันนี้โควตาทดลอง AI เต็มแล้ว แสดงเฉพาะผลที่คำนวณได้',
  'ai-unavailable': 'ตอนนี้ AI ยังใช้ไม่ได้หรือผลที่ได้ไม่ผ่านการตรวจกับดวง แสดงเฉพาะผลที่คำนวณได้ และไม่หักสิทธิ์ทดลอง',
  'no-device': 'ไม่พบรหัสอุปกรณ์ แสดงเฉพาะผลที่คำนวณได้'
};
const body = () => {
  const saved = profile.get();
  if (!saved) throw new Error('กรอกข้อมูลเกิดและกด “คำนวณดวงกำเนิด” ก่อน');
  const { timeUnknown, ...rest } = saved;
  return { birthProfile: { ...rest, birthTimeKnown: !timeUnknown }, date: todayISO, timezone: TZ, topic: $('#rtopic').value, consent: $('#rconsent').checked };
};
const note = data => { $('#rquota').textContent = data.quota?.aiUsed ? `ใช้สิทธิ์ทดลอง AI แล้ว เหลืออีก ${data.quota.remaining} ครั้งวันนี้` : (QUOTA_TH[data.quota?.reason] || ''); };
const history = [];

function paintReading(data) {
  if (data.type === 'crisis') {
    $('#rout').innerHTML = `<div class="glass"><h3>${esc(data.title)}</h3><p>${esc(data.message)}</p><p><b>โทร ${esc(data.hotline.number)}</b> · ${esc(data.hotline.nameTh)} · ${esc(data.hotline.hoursTh)}</p><p>${esc(data.urgent)}</p></div>`;
    $('#rchat').hidden = true;
    return;
  }
  const label = new Map(data.evidence.map(e => [e.id, e.th]));
  const sections = data.sections.map(s => `<article class="glass" style="margin-bottom:.8rem"><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p><details><summary class="muted" style="font-size:.78rem">หลักฐานที่อ้าง</summary><ul style="font-size:.8rem">${s.evidence_ids.map(id => `<li><code>${esc(id)}</code> ${esc(label.get(id) || '')}</li>`).join('')}</ul></details></article>`).join('');
  const questions = (data.reflection_questions || []).map(q => `<li>${esc(q)}</li>`).join('');
  $('#rout').innerHTML = (data.notice ? `<p class="muted">${esc(data.notice)}</p>` : '') + (data.birthTimeKnown === false ? '<p class="muted">ไม่ทราบเวลาเกิด จึงไม่ใช้ลัคนา เรือน และมหาทศา</p>' : '') + sections + (questions ? `<ul>${questions}</ul>` : '') + `<p>${esc(data.closing)}</p><p class="muted" style="font-size:.75rem">ที่มา: ${esc(data.source)} · ${esc(data.limits)}</p>`;
  $('#rchat').hidden = false;
}

$('#rgo').onclick = async () => {
  $('#rout').innerHTML = '<p class="empty-note">แม่หมอกำลังอ่านดวง …</p>';
  try {
    const request = body();
    const q = $('#rq').value.trim();
    const data = await post('/api/deep-reading', q ? { ...request, question: q } : request);
    note(data); paintReading(data);
  } catch (error) { $('#rout').innerHTML = `<p class="empty-note">${esc(error.message)}</p>`; }
};

$('#rchat').addEventListener('submit', async event => {
  event.preventDefault();
  const message = $('#rmsg').value.trim();
  if (!message) return;
  $('#rmsg').value = '';
  $('#rthread').insertAdjacentHTML('beforeend', `<div class="bub me">${esc(message)}</div>`);
  try {
    const data = await post('/api/persona-chat', { ...body(), message, history: history.slice(-6) });
    note(data);
    const text = data.type === 'crisis' ? `${data.message} โทร ${data.hotline.number}` : data.reply;
    history.push({ role: 'user', text: message }, { role: 'assistant', text });
    $('#rthread').insertAdjacentHTML('beforeend', `<div class="bub ai">${esc(text)}${data.evidence_ids?.length ? `<div class="muted" style="font-size:.7rem">อ้างอิง: ${data.evidence_ids.map(esc).join(', ')}</div>` : ''}</div>`);
  } catch (error) { $('#rthread').insertAdjacentHTML('beforeend', `<div class="bub ai">${esc(error.message)}</div>`); }
});
addEventListener('dc:wiped', () => { $('#rout').innerHTML = ''; $('#rthread').innerHTML = ''; $('#rchat').hidden = true; history.length = 0; });
