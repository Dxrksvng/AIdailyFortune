import { $, api, esc, profile, todayISO, TZ, SIGNS, toast, yearRows } from './common.js';

function paintWheel(activeId) {
  $('#wheel').classList.toggle('idle', !activeId);
  $('#wheel').innerHTML = SIGNS.map(([id, th]) => `<figure class="${id === activeId ? 'on' : ''}"><img src="/assets/zodiac/${id}.webp" alt="ราศี${th}" width="72" height="72" loading="lazy"><figcaption>${th}</figcaption></figure>`).join('');
}
const EMPTY = '<p class="empty-note">กรอกข้อมูลเกิดแล้วกดคำนวณ เพื่อดูธีมรายปี</p>';

async function calculate(birth) {
  const { timeUnknown, years, ...birthProfile } = birth;
  $('#timeline').innerHTML = '<p class="empty-note">กำลังคำนวณ …</p>';
  try {
    const [chart, ritual, life] = await Promise.all([
      api('/api/natal-chart', birthProfile),
      api('/api/ritual', { date: todayISO, timezone: TZ, birthDate: birthProfile.birthDate }),
      api('/api/life-timeline', { birthProfile, date: todayISO, timezone: TZ, years, topic: 'general' })
    ]);
    const sunSign = SIGNS.find(s => s[2] === chart.placements.find(p => p.body === 'Sun').sign);
    const ascSign = SIGNS.find(s => s[2] === chart.placements.find(p => p.body === 'Ascendant').sign);
    paintWheel(sunSign[0]);
    $('#facts').innerHTML = [['ราศีอาทิตย์ (ตะวันตก)', sunSign[1]], ['เกิดวัน', ritual.birthDay.dayTh], ['เลขชีวิต', ritual.lifeNumber], ['สีวันเกิด', ritual.birthDay.colorTh], ['พระประจำวันเกิด', ritual.birthDay.postureTh], ['ลัคนา', timeUnknown ? 'ไม่ทราบเวลา' : ascSign[1]]]
      .map(([k, v]) => `<div class="fact"><span>${k}</span><b>${esc(v)}</b></div>`).join('');
    $('#timeline').innerHTML = yearRows(life.rows);
    $('#tlNote').textContent = (timeUnknown ? 'ไม่ทราบเวลาเกิด: มหาทศาคำนวณจากเที่ยงวัน อาจคลาดเคลื่อนมาก · ' : '') + 'เป็นธีมเชิงตีความจากมุมดาวพฤหัสบดี/เสาร์และมหาทศา (ระบบเวทิกยังรอผู้เชี่ยวชาญตรวจ) ไม่ใช่การทำนายเหตุการณ์ อย่าใช้ตัดสินใจเรื่องสุขภาพ กฎหมาย การเงิน หรือความสัมพันธ์';
    return true;
  } catch (error) {
    $('#timeline').innerHTML = `<p class="empty-note">${esc(error.message)}</p>`;
    return false;
  }
}

$('#birthForm').addEventListener('submit', async event => {
  event.preventDefault();
  const timeUnknown = $('#bunknown').checked;
  const [latitude, longitude] = $('#bplace').value.split(',').map(Number);
  const birth = { birthDate: $('#bdate').value, birthTime: timeUnknown ? '12:00' : $('#btime').value, timezone: 'Asia/Bangkok', latitude, longitude, timeUnknown, years: Number($('#byears').value) };
  if (await calculate(birth)) {
    // kept for this tab only so Ask and Ritual can use it; the server stores nothing
    const { years, ...saved } = birth;
    profile.set(saved);
    toast('คำนวณแล้ว เซิร์ฟเวอร์ไม่บันทึกข้อมูลเกิด');
  }
});
$('#bunknown').onchange = () => { $('#btime').disabled = $('#bunknown').checked; };
function reset() { paintWheel(null); $('#facts').innerHTML = ''; $('#timeline').innerHTML = EMPTY; }
addEventListener('dc:wiped', reset);

paintWheel(null);
const saved = profile.get();
if (saved) { // returning to this tab: refill the form and recompute from the stored profile
  $('#bdate').value = saved.birthDate; $('#btime').value = saved.birthTime;
  $('#bunknown').checked = !!saved.timeUnknown; $('#btime').disabled = !!saved.timeUnknown;
  const place = `${saved.latitude},${saved.longitude}`;
  if ([...$('#bplace').options].some(o => o.value === place)) $('#bplace').value = place;
  $('#bconsent').checked = true;
  calculate({ ...saved, years: Number($('#byears').value) });
}
