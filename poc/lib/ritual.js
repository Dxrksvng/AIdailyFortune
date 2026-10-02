import { readingFor, validDate, validTimezone } from './compass.js';

// Thai weekday colour and Buddha-image conventions are a cultural tradition
// that circulates widely in Thailand. This POC records them as tradition only:
// no source text was checked here, and nothing below claims an effect on luck.
const WEEKDAYS = [
  { id: 'sun', th: 'วันอาทิตย์', en: 'Sunday', colorTh: 'แดง', colorEn: 'red', hex: '#d64545', postureTh: 'ปางถวายเนตร', postureEn: 'Gazing posture (Pang Thawai Net)' },
  { id: 'mon', th: 'วันจันทร์', en: 'Monday', colorTh: 'เหลือง', colorEn: 'yellow', hex: '#e8c547', postureTh: 'ปางห้ามญาติ', postureEn: 'Calming-relatives posture (Pang Ham Yat)' },
  { id: 'tue', th: 'วันอังคาร', en: 'Tuesday', colorTh: 'ชมพู', colorEn: 'pink', hex: '#e58bb4', postureTh: 'ปางไสยาสน์', postureEn: 'Reclining posture (Pang Sai Yat)' },
  { id: 'wed', th: 'วันพุธ', en: 'Wednesday', colorTh: 'เขียว', colorEn: 'green', hex: '#4caf6d', postureTh: 'ปางอุ้มบาตร (กลางวัน)', postureEn: 'Almsbowl posture (daytime birth)' },
  { id: 'thu', th: 'วันพฤหัสบดี', en: 'Thursday', colorTh: 'ส้ม', colorEn: 'orange', hex: '#e98a3c', postureTh: 'ปางสมาธิ', postureEn: 'Meditation posture (Pang Samathi)' },
  { id: 'fri', th: 'วันศุกร์', en: 'Friday', colorTh: 'ฟ้า', colorEn: 'light blue', hex: '#5aa9e6', postureTh: 'ปางรำพึง', postureEn: 'Contemplation posture (Pang Ramphueng)' },
  { id: 'sat', th: 'วันเสาร์', en: 'Saturday', colorTh: 'ม่วง', colorEn: 'purple', hex: '#8a63d2', postureTh: 'ปางนาคปรก', postureEn: 'Naga-shielded posture (Pang Nak Prok)' }
];

// Practical, non-fear-based reminders keyed to the calculated lunar-phase rule.
// They are everyday safety/communication habits, not predictions of an event.
const REMINDERS = {
  begin: {
    th: ['เลือกเริ่มเรื่องเล็กก่อน แล้วค่อยขยาย', 'ก่อนตัดสินใจเรื่องสำคัญ ให้เช็กข้อมูลจริงอีกครั้ง'],
    en: ['Start with something small, then scale up.', 'Re-check the facts before an important decision.']
  },
  build: {
    th: ['เผื่อเวลาเดินทางและตรวจเส้นทางล่วงหน้า', 'ถ้ารู้สึกเร่งรีบ ให้ทำทีละอย่างแทนการทำหลายอย่างพร้อมกัน'],
    en: ['Leave extra travel time and check your route ahead.', 'If rushed, do one thing at a time instead of many at once.']
  },
  notice: {
    th: ['ก่อนตอบโต้เรื่องที่ตึงเครียด ให้หยุดหายใจสักครู่ เพื่อลดโอกาสเกิดปากเสียง', 'อ่านข้อความสำคัญซ้ำก่อนกดส่ง'],
    en: ['Pause and breathe before replying to a tense topic; it lowers the chance of an argument.', 'Re-read important messages before sending.']
  },
  release: {
    th: ['พักงานที่ไม่เร่งด่วน และนอนให้พอ', 'ถ้าเหนื่อยมากให้หลีกเลี่ยงการตัดสินใจใหญ่ในวันนั้น'],
    en: ['Set aside non-urgent work and get enough sleep.', 'If very tired, avoid big decisions that day.']
  }
};

const SECULAR_PRACTICES = {
  th: ['ทำสิ่งดี ๆ เล็ก ๆ ให้ผู้อื่นตามกำลังของตัวเอง', 'จัดโต๊ะหรือห้องให้เป็นระเบียบสัก 10 นาที', 'เขียนสิ่งที่ขอบคุณ 3 ข้อก่อนนอน', 'ถ้ามีความเชื่อหรือศาสนาที่คุณนับถือ ให้ทำตามแนวทางนั้นด้วยความสบายใจ'],
  en: ['Do one small kind thing for someone within your means.', 'Tidy your desk or room for ten minutes.', 'Write three things you are grateful for before bed.', 'If you follow a faith or tradition, practise it in the way that feels right to you.']
};

const BAD_LUCK_STEPS = {
  th: ['แยกให้ออกว่าอะไรคือเหตุการณ์จริง อะไรคือความรู้สึกว่า "โชคไม่ดี"', 'เลือกเรื่องที่แก้ได้หนึ่งเรื่อง แล้วลงมือเล็ก ๆ วันนี้', 'บอกคนที่ไว้ใจ หรือขอความช่วยเหลือจากผู้เชี่ยวชาญตามเรื่องที่เจอ', 'ถ้าอยากทำพิธีหรือแก้เคล็ดตามความเชื่อ ให้ทำเพื่อให้ใจสงบ โดยไม่ต้องจ่ายเงินก้อนใหญ่หรือกู้เงินมาทำ'],
  en: ['Separate what actually happened from the feeling of “bad luck”.', 'Pick one fixable thing and take a small step today.', 'Tell someone you trust, or get the right professional help for the problem.', 'If you want a ritual from your tradition, do it for calm — never pay a large sum or borrow money for it.']
};

/** Pythagorean-style life-path number from the Gregorian birth date; 11, 22 and 33 are kept. */
export function lifeNumber(birthDate) {
  if (!validDate(birthDate)) throw new Error('Invalid birth date');
  let n = birthDate.replace(/-/g, '').split('').reduce((a, d) => a + Number(d), 0);
  while (n > 9 && ![11, 22, 33].includes(n)) n = String(n).split('').reduce((a, d) => a + Number(d), 0);
  return n;
}

function weekdayOf(date) {
  return WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
}
function view(day) {
  return { id: day.id, dayTh: day.th, dayEn: day.en, colorTh: day.colorTh, colorEn: day.colorEn, hex: day.hex, postureTh: day.postureTh, postureEn: day.postureEn };
}

export function ritualGuide({ birthDate = null, date, timezone }) {
  if (!validDate(date) || !validTimezone(timezone)) throw new Error('Invalid date or timezone');
  if (birthDate !== null && !validDate(birthDate)) throw new Error('Invalid birth date');
  const today = readingFor({ date, timezone });
  const category = today.interpretation.category;
  return {
    type: 'ritual', methodologyVersion: 'thai-weekday-tradition-v1',
    today: view(weekdayOf(date)),
    birthDay: birthDate ? view(weekdayOf(birthDate)) : null,
    lifeNumber: birthDate ? lifeNumber(birthDate) : null,
    allDays: WEEKDAYS.map(view),
    reminders: REMINDERS[category],
    practices: SECULAR_PRACTICES,
    badLuckSteps: BAD_LUCK_STEPS,
    lunarContext: { ruleId: today.interpretation.ruleId, phaseAngle: today.source.phaseAngle },
    provenance: {
      weekdayColourAndPosture: 'Thai cultural tradition; mapping typed from general knowledge and not verified against a source in this POC.',
      reminders: 'Everyday habits chosen by the product team and selected by the calculated lunar-phase rule; not predictions.'
    },
    noteTh: 'สีประจำวันและปางพระประจำวันเกิดเป็นธรรมเนียมทางวัฒนธรรม ไม่มีหลักฐานว่าการใส่สีหรือถือสิ่งของใดเปลี่ยนโชคได้ ใช้เป็นพิธีกรรมสร้างกำลังใจตามที่คุณสบายใจ ระบบไม่ระบุว่าคุณควรนับถือสิ่งใดและไม่เก็บข้อมูลความเชื่อ',
    noteEn: 'Weekday colours and Buddha-image postures are cultural conventions. There is no evidence that wearing a colour or carrying an object changes luck; use them as a comfort ritual if you like. The system does not tell you what to believe and stores no belief data.',
    limits: 'Cultural and reflective suggestions only.'
  };
}
