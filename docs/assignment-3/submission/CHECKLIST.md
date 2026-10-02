# CHECKLIST: Assignment_2_to_3.pdf

สร้างเมื่อ 2 ต.ค. 2569 จาก `ANSWER.md` ของ A2 (`auto-gen` commit `5629c0e`) และ A3 (`as3/ANSWER.md`) ไฟล์เดียว 45 หน้า A4 **ตัด Assignment 4 ออกตามคำสั่ง** (ยังไม่เสร็จ) ถ้าจะรวม A4 ภายหลัง ใส่ใน `SOURCES` ของ `build_submission.py` แล้วสร้างใหม่

**หัวข้อ 3.4 ฝังคู่มือผู้ใช้ฉบับเต็ม (`as3/USER_GUIDE.md`) พร้อมภาพ mockup ไว้ใน PDF เลย** เพื่อให้เป็นไฟล์เดียวที่สมบูรณ์ ตารางรายการไฟล์ที่เดิมอยู่ใน 3.4 ถูกแทนที่ด้วยตัวคู่มือ ส่วนย่อหน้า "สิ่งที่ตรวจแล้ว" และ "ยังไม่ได้ทำ" ของ 3.4 คงไว้ เนื้อหาอื่นไม่ถูกแก้ แก้เฉพาะการจัดรูปแบบ (ดู `build_submission.patch`)

## ผลตรวจอัตโนมัติ (`check_submission.py`)

| Check | Result | Note |
|---|---|---|
| Page size A4 on every page | PASS | 45 pages |
| Title page: name, date, Confidential | PASS |  |
| Table of contents on page 2 | PASS |  |
| Question headings 2.1-2.3, 3.1-3.4 present | PASS |  |
| Assignment 4 excluded (by request) | PASS |  |
| No 'คุณ คุณ' | PASS | 0 hits |
| No TODO | PASS | 0 hits |
| No 'sk-' | PASS | 0 hits |
| No 'api_key' | PASS | 0 hits |
| No absolute paths | PASS |  |
| PDF size < 15 MB | PASS | 2128 KB |
| Thai font embedded (Sarabun) | PASS | MonoT, MonoT-Bold, MonoT-Oblique, SarabunT, SarabunT-Bold, SarabunT-Italic, SymT |
| Forbidden words absent in 3.4 section of ANSWER.md | PASS |  |
| Forbidden words absent in USER_GUIDE.md | PASS |  |
| [TO CONFIRM] list exists after the last section | PASS | starts on page 42; lists 40 entries; source has 50 markers (code-fence markers are summarised) |

Pages: 45

ผ่านทั้ง 15 ข้อ ข้อ "คำต้องห้ามในหัวข้อ 3.4" ตรวจกับ Markdown ที่รวมคู่มือแล้ว (ก่อนหน้านี้ไม่ผ่านเพราะชื่อไฟล์ `message-catalog.json` ในตารางที่ถูกแทนที่แล้ว)

## การตรวจด้วยสายตา

- ดูภาพรวมทุกหน้า (45 หน้า) และดูเต็มหน้าบางหน้า: หน้า 4 (ไดอะแกรม A2), 12 และ 16 (ตารางยาว), 19-20 และ 26 (ไดอะแกรม A3 และรายการ), 31 และ 37 (คู่มือผู้ใช้พร้อม mockup) และหน้ารายการยืนยัน
- ไม่ได้อ่านทุกหน้าที่ความละเอียดเต็ม

## ปัญหารูปแบบที่แก้ตอนสร้าง PDF

| ปัญหา | วิธีแก้ |
|---|---|
| รายการย่อยใต้ข้อที่มีเลขแสดงเป็นบรรทัดเดียว และเลขข้อต่อกันรีเซ็ต | เติมบรรทัดว่างและคงเลขข้อ |
| ชื่อไฟล์ในตารางถูกตัดทีละตัวอักษร | ตัดบรรทัดที่ขอบคำ |
| รายการ "สิ่งที่ต้องยืนยัน" ตัดกลางคำ มีเศษโค้ดและเครื่องหมายอ้างอิงปน | รวบรวมจาก Markdown ตัดที่ขอบคำ จัดกลุ่มตามหัวข้อ (40 รายการ) |
| 3.4 ชี้ไปที่ไฟล์แยก | ฝังคู่มือฉบับเต็มและภาพ mockup |

## สิ่งที่ไม่ได้ตรวจ

- **ข้อความใน PDF ค้นหา/คัดลอกคำที่มีสระ ำ ได้ไม่สมบูรณ์** (WeasyPrint ใส่ชั้นข้อความต่างจากที่เห็น ตัวสกัดข้อความได้ `ท˸า` แทน `ทำ`) การแสดงผลด้วยตาถูกต้อง แต่การค้นหาคำใน PDF อาจไม่เจอ A3 เองก็ระบุปัญหานี้ไว้เป็นเหตุผลที่ไม่เลือก WeasyPrint สำหรับจดหมาย ผมไม่ได้ลองสร้าง PDF ฉบับนี้ด้วย Chrome แทน
- สร้างบน Python 3.11 + Chromium 141 บน Linux (เครื่องคุณใช้ Python 3.13 + Chrome 154 บน macOS) การตัดบรรทัดอาจต่างเล็กน้อย ควรเปิดดูก่อนส่ง
- ตำแหน่งวรรณยุกต์ทุกหน้าด้วยสายตา ไม่ได้ตรวจทุกหน้าที่ขยายเต็ม
- ไม่ได้ตรวจเนื้อหา A2/A3 ว่าถูกต้องทางธุรกิจ ไม่ได้ตรวจสิทธิ์ใช้ฟอนต์/โลโก้ และไม่ได้อ้างอิงกฎหมาย PDPA ตามที่เอกสารระบุ [TO CONFIRM]
- ภาพที่ฝัง: ตรวจจากรายการรูปที่ `ANSWER.md` และ `USER_GUIDE.md` อ้างถึง ได้แก่ ไดอะแกรม จดหมายตัวอย่าง และ mockup ซึ่งเป็นงานของคุณเอง ไม่มีภาพผลิตภัณฑ์อื่น
- ไม่มีผลทดสอบการใช้งานกับคนจริง (มีเพียงแผน ตามที่เอกสารระบุ)

## ไฟล์ในโฟลเดอร์นี้

- `Assignment_2_to_3.pdf` ผลลัพธ์ (ไฟล์เดียวที่ต้องส่ง)
- `check_submission.py`, `build_submission.patch`, `CHECKLIST.md` ไฟล์ประกอบ ไม่ต้องส่ง
