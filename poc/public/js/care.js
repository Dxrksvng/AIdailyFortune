import { $, api, toast } from './common.js';

api('/api/safety').then(({ hotline }) => { $('#hotline').textContent = hotline.number; }).catch(() => { /* keep the static number */ });
$('#copyHot').onclick = async () => {
  const number = $('#hotline').textContent;
  try { await navigator.clipboard.writeText(number); toast(`คัดลอก ${number} แล้ว`); }
  catch { const range = document.createRange(); range.selectNodeContents($('#hotline')); getSelection().removeAllRanges(); getSelection().addRange(range); toast('เลือกเบอร์ไว้แล้ว กดคัดลอกได้เลย'); }
};
