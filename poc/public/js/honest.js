import { $ } from './common.js';

const METHODS = [
  ['โหราศาสตร์ตะวันตก', 'ธีมช่วงเวลา วัน เดือน ปี คำนวณตำแหน่งดาวได้ แต่ความหมายเป็นการตีความ', 3, 'หลัก'],
  ['ไพ่ทาโรต์', 'คำถามเฉพาะเรื่อง ใช้ไพ่เป็นกระจกมองสถานการณ์หลายมุม', 0, 'หลัก'],
  ['อี้จิง', 'การเลือกระหว่างทางเลือก หรือวางแผนรับมือการเปลี่ยนแปลง', 0, 'ทดลอง'],
  ['เวทิก / มหาทศา', 'สำรวจธีมระยะยาว หลายปีข้างหน้า', 2, 'ทดลอง']
];
$('#methods').innerHTML = METHODS.map(([name, desc, calc, tag]) => `<article class="glass method reveal"><span class="tag ${tag === 'ทดลอง' ? 'exp' : ''}">${tag}</span><h3>${name}</h3><p class="muted" style="font-size:var(--s-1)">${desc}</p><div class="meter" role="img" aria-label="ส่วนที่คำนวณได้ ${calc} จาก 5">${[0, 1, 2, 3, 4].map(i => `<i class="${i < calc ? 'c' : 't'}"></i>`).join('')}</div></article>`).join('');
