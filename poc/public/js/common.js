// Shared helpers for every Celestra page. Nothing here computes astrology: readings come
// from the server API. Client state is UI state only: localStorage keys start with "dc:",
// and the birth profile lives in sessionStorage so it disappears when the tab closes.
export const $ = selector => document.querySelector(selector);
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok';
export const todayISO = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
  clear() {
    try {
      Object.keys(localStorage).filter(key => key.startsWith('dc:')).forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('daily-compass-poc-v1'); // key used by an earlier build
      sessionStorage.removeItem('dc:profile');
    } catch { /* ignore */ }
  }
};
export const aiOn = () => store.get('dc:consent') === true;

/** The birth profile is kept for this tab only (sessionStorage) so the other pages can use it. */
export const profile = {
  get() { try { return JSON.parse(sessionStorage.getItem('dc:profile')); } catch { return null; } },
  set(value) { try { sessionStorage.setItem('dc:profile', JSON.stringify(value)); } catch { /* ignore */ } },
  clear() { try { sessionStorage.removeItem('dc:profile'); } catch { /* ignore */ } }
};

export function toast(message) {
  const el = $('#toast'); if (!el) return;
  el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}
export const esc = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function api(path, body) {
  const response = await fetch(path, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'ขออภัย ระบบตอบไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง');
  return data;
}

/* ---------- labels ---------- */
export const T = { general: 'ภาพรวม', love: 'ความรัก', career: 'การงาน', money: 'การเงิน', study: 'การเรียน' };
export const H = { day: 'วันนี้', week: '7 วันนี้', month: '30 วันนี้', year: '365 วันนี้' };
export const SIGNS = [['aries', 'เมษ', 'Aries'], ['taurus', 'พฤษภ', 'Taurus'], ['gemini', 'เมถุน', 'Gemini'], ['cancer', 'กรกฎ', 'Cancer'], ['leo', 'สิงห์', 'Leo'], ['virgo', 'กันย์', 'Virgo'], ['libra', 'ตุลย์', 'Libra'], ['scorpio', 'พิจิก', 'Scorpio'], ['sagittarius', 'ธนู', 'Sagittarius'], ['capricorn', 'มังกร', 'Capricorn'], ['aquarius', 'กุมภ์', 'Aquarius'], ['pisces', 'มีน', 'Pisces']];
export const PLANET_TH = { Sun: 'อาทิตย์', Moon: 'จันทร์', Mercury: 'พุธ', Venus: 'ศุกร์', Mars: 'อังคาร', Jupiter: 'พฤหัสบดี', Saturn: 'เสาร์', Ketu: 'เกตุ', Rahu: 'ราหู' };
export const POPULAR = ['งานที่เพิ่งสัมภาษณ์ไปจะได้ไหม', 'เดือนนี้จะมีงานทำไหม', 'คนเก่าจะกลับมาไหม', 'วันนี้ใส่สีอะไรดี', 'ช่วงนี้โชคไม่ดี แก้เคล็ดยังไง', 'ควรบูชาอะไรแล้วชีวิตดี', 'อีก 5 ปีชีวิตจะเป็นยังไง', 'ศาสตร์ไหนแม่นสุด', 'เครียดมาก ขอคำแนะนำ', 'สอบเดือนหน้าจะผ่านไหม'];
export const shortName = name => name.split(' (')[0];

/** Selected topic/horizon survive page changes as UI state. */
export const prefs = {
  get topic() { const v = store.get('dc:topic'); return v in T ? v : 'career'; },
  set topic(v) { store.set('dc:topic', v); },
  get horizon() { const v = store.get('dc:horizon'); return v in H ? v : 'day'; },
  set horizon(v) { store.set('dc:horizon', v); }
};
export function setSeg(selector, value) { document.querySelectorAll(selector + ' button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === value)); }
export function bindSeg(selector, current, onChange) {
  setSeg(selector, current);
  const seg = $(selector); if (!seg) return;
  seg.onclick = event => { const v = event.target.dataset?.v; if (!v) return; setSeg(selector, v); onChange(v); };
}
export function renderPopular(onPick) {
  const box = $('#popular'); if (!box) return;
  box.innerHTML = POPULAR.map(item => `<button type="button" class="chip">${esc(item)}</button>`).join('');
  box.onclick = event => { if (event.target.classList.contains('chip')) onPick(event.target.textContent); };
}

/* ---------- Thai text animation: word granularity only, never per character ---------- */
export function kinetic(el) {
  if (!el || reduce || !('Segmenter' in Intl)) return;
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
export function fadeWords(el, text) {
  if (reduce || !('Segmenter' in Intl)) { el.textContent = text; return; }
  el.textContent = '';
  const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
  let index = 0;
  for (const { segment } of segmenter.segment(text)) {
    const span = document.createElement('span'); span.textContent = segment; span.style.cssText = `opacity:.001;transition:opacity .35s ${index++ * 28}ms`; el.append(span);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('span').forEach(span => { span.style.opacity = 1; })));
}

const LEVEL = { low: 1, medium: 2, good: 3 };
const LEVEL_TH = ['', 'ต่ำ', 'ปานกลาง', 'ดี'];
/** Qualitative confidence badge: how much the inputs support the reading, never a probability. */
export const levelHtml = level => { const n = LEVEL[level] || 0; return `<span class="conf" title="ระดับความเหมาะของข้อมูล ไม่ใช่ความน่าจะเป็น">${[0, 1, 2].map(i => `<i class="d ${i < n ? 'f' : ''}"></i>`).join('')} ${LEVEL_TH[n]}</span>`; };

/** One row per year of the life timeline (used by the chart page and by Ask answers). */
export function yearRows(rows) {
  return rows.map(row => {
    const contacts = row.contacts.map(c => c.textTh).join(' ');
    const pill = { open: ['open', 'เปิดกว้าง'], review: ['review', 'ทบทวน'], quiet: ['quiet', 'เงียบ'] }[row.emphasis];
    return `<div class="yr"><div><div class="y">${row.start.slice(0, 4)}</div><div class="e">มหาทศา${PLANET_TH[row.dasha.lord] || row.dasha.lord}</div></div><p><span class="pill ${pill[0]}">${pill[1]}</span>${esc(contacts || 'ไม่พบมุมดาวช้าที่เด่นชัดในปีนี้ เป็นปีที่เหมาะกับการสะสมทักษะ')}</p></div>`;
  }).join('');
}

/** Weekday strip: today, and the birth day when known. */
export function renderDays(ritual) {
  const box = $('#days'); if (!box) return;
  const today = ritual.today.id, birth = ritual.birthDay?.id;
  box.innerHTML = ritual.allDays.map(day => `<div class="day ${day.id === today ? 'today' : ''} ${day.id === birth ? 'birth' : ''}"><i style="background:${day.hex}"></i><b style="font-weight:500">${esc(day.dayTh.replace('วัน', ''))}</b><span class="muted">${esc(day.colorTh)}</span></div>`).join('');
  const line = $('#postureLine');
  if (line) line.textContent = ritual.birthDay
    ? `คุณเกิด${ritual.birthDay.dayTh} พระประจำวันเกิดคือ${ritual.birthDay.postureTh} สีประจำวันเกิดคือสี${ritual.birthDay.colorTh} · เป็นธรรมเนียมไทย ยังไม่ได้ตรวจกับแหล่งอ้างอิงในต้นแบบนี้`
    : 'กรอกวันเกิดที่หน้าดวงกำเนิด เพื่อดูพระและสีประจำวันเกิด';
}

/* ---------- shared shell: nav highlight, footer consent and wipe ---------- */
export function initShell() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav a.l').forEach(link => {
    const on = link.getAttribute('href') === path;
    link.classList.toggle('on', on);
    if (on) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  const consent = $('#aiConsent');
  if (consent) {
    consent.checked = aiOn();
    consent.onchange = () => { store.set('dc:consent', consent.checked); toast(consent.checked ? 'เปิดให้ AI เรียบเรียงข้อความรายวันแล้ว' : 'ปิดแล้ว ใช้ข้อความแม่แบบ'); window.dispatchEvent(new Event('dc:consent')); };
  }
  const wipe = $('#wipe');
  if (wipe) wipe.onclick = () => {
    store.clear();
    if (consent) consent.checked = false;
    window.dispatchEvent(new Event('dc:wiped'));
    toast('ลบข้อมูลของคุณในเครื่องนี้แล้ว');
  };
}
initShell();
