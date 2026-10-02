// Safety classification. Order matters: crisis first, then warn, else normal.
//  - crisis: no reading is produced; only the support panel is returned.
//  - warn:   a reading is produced, with a notice shown above it.
// The regexes err on the side of recall for crisis wording, so a benign phrase
// such as "ไม่อยากตื่นเช้า" can also trigger the support panel. That trade-off
// is deliberate: showing help unnecessarily is cheaper than missing a crisis.

export const HOTLINE = {
  number: '1323',
  nameTh: 'สายด่วนสุขภาพจิต กรมสุขภาพจิต',
  nameEn: 'Mental Health Hotline, Department of Mental Health',
  hoursTh: 'ฟรี ตลอด 24 ชั่วโมง',
  hoursEn: 'free, 24 hours',
  // Not verified from an official source in this POC. Check dmh.go.th before launch.
  verified: false
};

/** Fold evasions (spacing, repeated letters, zero-width characters, leetspeak) before matching. */
export function normalize(text) {
  return String(text)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[​-‍﻿]/g, '')
    .replace(/([฀-๿])[\s.\-_]+(?=[฀-๿])/g, '$1')
    .replace(/(.)\1{2,}/g, '$1')
    .replace(/1/g, 'i').replace(/0/g, 'o').replace(/3/g, 'e').replace(/@/g, 'a').replace(/\$/g, 's');
}

const CRISIS = /ฆ่าตัวตาย|อยากตาย|ไม่อยากอยู่|ไม่อยากมีชีวิต|อยากหายไป|จบชีวิต|ทำร้ายตัวเอง|กรีดข้อมือ|ไม่อยากตื่น|suicid|kill\s*my\s*self|\bkms\b|want\s*to\s*die|end\s*(my\s*life|it\s*all)|self[\s-]*harm|cut\s*my\s*self|unalive/;

const WARN = {
  lottery: /หวย|เลขเด็ด|ลอตเตอรี่|lotter/,
  health: /ป่วย|โรค(?!ง)|หมอ(?!ดู)|มะเร็ง|เบาหวาน|ผ่าตัด|(?:กิน|ทาน|หยุด|เลิก|เปลี่ยน|ปรับ|เพิ่ม|ลด)ยา|ยารักษา|วินิจฉัย|medic|diagnos|cancer/,
  money: /ลงทุน|หุ้น|คริปโต|invest|stock|crypto/,
  legal: /ฟ้อง|คดี|lawsuit|court/,
  death: /จะตายไหม|ตายไหม|อายุสั้น|อายุขัย|when\s*will\s*i\s*die/
};

export const WARN_TEXT = {
  th: {
    lottery: 'ผลหวยเป็นการสุ่ม ดวงบอกเลขไม่ได้ เล่นเท่าที่เสียได้',
    health: 'เรื่องสุขภาพปรึกษาแพทย์ อย่าเริ่ม หยุด หรือเปลี่ยนยาเองเพราะดวง',
    money: 'นี่ไม่ใช่คำแนะนำการลงทุน ตรวจตัวเลขจริงหรือปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจ',
    legal: 'เรื่องคดีความควรปรึกษานักกฎหมาย ดวงใช้แทนข้อเท็จจริงไม่ได้',
    death: 'ดวงบอกวันตายหรืออายุขัยไม่ได้ และไม่ควรใช้คาดเดาเรื่องนี้ หากกังวลเรื่องสุขภาพให้ปรึกษาแพทย์'
  },
  en: {
    lottery: 'Lottery results are random; a chart cannot give numbers. Only play what you can afford to lose.',
    health: 'For health matters see a doctor. Never start, stop or change medication because of a reading.',
    money: 'This is not investment advice. Check real figures or ask a professional before deciding.',
    legal: 'For legal matters consult a lawyer; a reading is no substitute for facts.',
    death: 'A reading cannot tell the date of death or lifespan. If you are worried about your health, see a doctor.'
  }
};

export function classify(text) {
  const t = normalize(text);
  if (CRISIS.test(t)) return { level: 'crisis', cats: [] };
  const cats = Object.keys(WARN).filter(key => WARN[key].test(t));
  return { level: cats.length ? 'warn' : 'normal', cats };
}

export function noticeFor(cats, lang = 'th') {
  return cats.map(cat => WARN_TEXT[lang === 'en' ? 'en' : 'th'][cat]).join(' · ');
}

/** The only content returned for a crisis: no cards, colour, confidence or reading. */
export function crisisAnswer(lang = 'th') {
  const th = lang !== 'en';
  return {
    type: 'crisis',
    method: 'support',
    hotline: HOTLINE,
    title: th ? 'คุณไม่จำเป็นต้องผ่านเรื่องนี้คนเดียว' : 'You do not have to go through this alone',
    message: th
      ? 'ขอบคุณที่บอกนะ ตอนนี้เราขอไม่ดูดวงให้ เพราะเรื่องนี้สำคัญกว่าดวง อยากให้คุณได้คุยกับคนที่ช่วยได้จริง'
      : 'Thank you for telling us. We will not read your chart for this, because this matters more than a reading. We want you to talk to someone who can really help.',
    urgent: th
      ? 'ถ้าอยู่ในอันตรายเร่งด่วน ให้ติดต่อบริการฉุกเฉินในพื้นที่ หรือบอกคนใกล้ตัวตอนนี้'
      : 'If you are in immediate danger, contact local emergency services or tell someone near you now.',
    steps: th
      ? ['หายใจเข้า 4 วินาที ออก 6 วินาที ทำซ้ำ 5 รอบ', 'อยู่ใกล้คนที่ไว้ใจ หรือส่งข้อความหาเขาตอนนี้']
      : ['Breathe in for 4 seconds and out for 6, five times.', 'Stay near someone you trust, or message them now.'],
    limits: 'Supportive information only; not medical or mental-health advice.'
  };
}
