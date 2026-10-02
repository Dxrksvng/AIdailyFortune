import { $, api, aiOn, esc, todayISO, TZ, shortName, renderDays } from './common.js';

async function renderToday() {
  const query = new URLSearchParams({ date: todayISO, timezone: TZ, lang: 'th', ai: aiOn() ? '1' : '0' });
  try {
    const { reading, ritual, dailyCard } = await api('/api/today?' + query);
    const th = reading.contentTh;
    $('#todayDate').textContent = new Intl.DateTimeFormat('th-TH', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(todayISO + 'T12:00:00Z'));
    $('#phaseName').textContent = th.name; $('#phaseDeg').textContent = Math.round(reading.source.phaseAngle) + '°';
    $('#readSignal').textContent = th.signal; $('#readText').textContent = th.reading;
    $('#readAction').textContent = 'ลองทำ: ' + th.action; $('#readPrompt').textContent = th.prompt;
    $('#readTag').textContent = reading.narrativeSource.startsWith('OpenAI') ? 'AI เรียบเรียงจากข้อความที่อนุมัติแล้ว' : 'คำนวณจากเฟสดวงจันทร์ · ข้อความแม่แบบ';
    $('#swatch').style.background = `linear-gradient(135deg,${ritual.today.hex},${ritual.today.hex}aa)`;
    $('#colorName').textContent = `สี${ritual.today.colorTh} · ${ritual.today.dayTh}`;
    $('#dailyMini').innerHTML = `<img src="/assets/cards/${dailyCard.id}.webp" alt="${esc(dailyCard.nameTh)}" width="84" height="206">`;
    $('#dailyName').textContent = shortName(dailyCard.nameTh); $('#dailyMeaning').textContent = dailyCard.interpretationTh;
    $('#warnList').innerHTML = ritual.reminders.th.map(item => `<li>${esc(item)}</li>`).join('');
    $('#doList').innerHTML = [th.action, ...ritual.practices.th.slice(0, 2)].map(item => `<li>${esc(item)}</li>`).join('');
  } catch (error) {
    $('#readSignal').textContent = 'ยังอ่านวันนี้ไม่ได้'; $('#readText').textContent = error.message;
  }
}
renderToday();
addEventListener('dc:consent', renderToday);
addEventListener('dc:wiped', renderToday);
