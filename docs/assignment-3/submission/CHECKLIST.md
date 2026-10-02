# CHECKLIST: Assignment_2_to_3.pdf

สร้างเมื่อ 2 ต.ค. 2569 จาก `ANSWER.md` ของ A2 (`auto-gen` commit `5629c0e`) และ A3 (`as3/ANSWER.md`) ตามคำสั่ง **ตัด Assignment 4 ออกไว้ก่อน** (ยังไม่เสร็จ) ชื่อไฟล์จึงเป็น `Assignment_2_to_3.pdf` ไม่ใช่ `..._to_4.pdf` เมื่อ A4 พร้อม ให้ใส่ A4 กลับใน `SOURCES` ของ `build_submission.py` และสร้างใหม่

เนื้อหาไม่ถูกแก้ แก้เฉพาะการจัดรูปแบบตอนสร้าง PDF (ดู `build_submission.patch`)

## ผลตรวจอัตโนมัติ (`check_submission.py`)

| Check | Result | Note |
|---|---|---|
| Page size A4 on every page | PASS | 35 pages |
| Title page: name, date, Confidential | PASS |  |
| Table of contents on page 2 | PASS |  |
| Question headings 2.1-2.3, 3.1-3.4 present | PASS |  |
| Assignment 4 excluded (by request) | PASS |  |
| No 'คุณ คุณ' | PASS | 0 hits |
| No TODO | PASS | 0 hits |
| No 'sk-' | PASS | 0 hits |
| No 'api_key' | PASS | 0 hits |
| No absolute paths | PASS |  |
| PDF size < 15 MB | PASS | 1358 KB |
| Thai font embedded (Sarabun) | PASS | MonoT, MonoT-Bold, MonoT-Oblique, SarabunT, SarabunT-Bold, SarabunT-Italic, SymT |
| Forbidden words absent in 3.4 section of ANSWER.md | FAIL | JSON |
| Forbidden words absent in USER_GUIDE.md | PASS |  |
| [TO CONFIRM] list exists after the last section | PASS | starts on page 32; lists 34 entries; source has 42 markers (code-fence markers are summarised) |

Pages: 35

**ผลที่ไม่ผ่าน (รายงานตามจริง):** หัวข้อ 3.4 ใน `as3/ANSWER.md` มีคำว่า `JSON` ในชื่อไฟล์ `docs/message-catalog.json` ที่ใช้ชี้ไฟล์อ้างอิง ส่วนคู่มือผู้ใช้ `USER_GUIDE.md` ผ่านการตรวจคำต้องห้าม (ผู้ใช้ปลายทางไม่เห็นคำนี้) ผมไม่ได้แก้เนื้อหาตามคำสั่ง ถ้าต้องการให้ผ่านทั้งสองที่ ให้เปลี่ยนข้อความในหัวข้อ 3.4 เป็น "ไฟล์รายการข้อความ" แล้วสร้างใหม่

## การตรวจด้วยสายตา

- ดูภาพทุกหน้าของ PDF ฉบับที่สร้างรอบแรก (40 หน้า รวม A4) ผ่านภาพรวมทุกหน้า และดูฉบับเต็มหน้าของหน้าที่มีไดอะแกรม ตารางยาว และหน้ารายการยืนยัน
- ฉบับสุดท้าย (35 หน้า) ดูภาพรวมทุกหน้าและดูเต็มหน้าบางหน้า (หน้า 4, 16, 20, 26 และรายการยืนยัน) ไม่ได้อ่านทุกหน้าที่ความละเอียดเต็ม

## ปัญหารูปแบบที่พบและแก้ไขในขั้นสร้าง PDF

| ปัญหา | วิธีแก้ |
|---|---|
| รายการย่อยใต้ข้อที่มีเลขแสดงเป็นบรรทัดเดียว (หน้า 20) | เติมบรรทัดว่างก่อนรายการย่อยและคงเลขข้อ 5-6 ต่อจากข้อ 4 |
| ชื่อไฟล์ในตารางถูกตัดทีละตัวอักษร (`generate_lette rs.py`) | เปลี่ยนการตัดบรรทัดเป็นตัดที่ขอบคำ |
| หน้ารายการ "สิ่งที่ต้องยืนยัน" ถูกตัดกลางคำและมีเศษโค้ดปน | รวบรวมจาก Markdown ต้นฉบับ ตัดที่ขอบคำ จัดกลุ่มตามหัวข้อ สรุปเครื่องหมายที่อยู่ในโค้ดตัวอย่างเป็นบรรทัดเดียว |
| ไดอะแกรมกว้างเกินไป | ตัวสร้างเดิมสลับเป็นแนวตั้งอัตโนมัติ ตรวจแล้วอ่านได้ที่ประมาณ 80 dpi |

## สิ่งที่ไม่ได้ตรวจ

- **ข้อความใน PDF ค้นหา/คัดลอกได้ไม่สมบูรณ์:** WeasyPrint ใส่สระ ำ และวรรณยุกต์ในชั้นข้อความต่างจากที่เห็น (ตัวสกัดข้อความได้ `ท˸า` แทน `ทำ`) การแสดงผลด้วยตาถูกต้อง แต่การค้นหาคำที่มี ำ ใน PDF อาจไม่เจอ A2_CHANGELOG บันทึกปัญหาแบบเดียวกันไว้ ผมไม่ได้ลองสร้างด้วย Chrome แทน
- ตำแหน่งวรรณยุกต์ทุกหน้าด้วยสายตา ไม่ได้ตรวจทุกหน้าที่ขยายเต็ม
- รันบน Python 3.11 + Chromium 141 บน Linux (เครื่องคุณใช้ Python 3.13 และ Chrome 154 บน macOS) ผลอาจต่างเล็กน้อย (เช่น การตัดบรรทัด) ควรเปิดดู PDF ก่อนส่ง
- ผมไม่ได้ตรวจเนื้อหา A2/A3 ว่าถูกต้องทางธุรกิจ และไม่ได้ตรวจสิทธิ์ใช้โลโก้ ฟอนต์ ตามที่เอกสารระบุ [TO CONFIRM]
- ไม่ได้ตรวจว่าภาพที่ฝัง (จดหมายตัวอย่าง ไดอะแกรม) ไม่ใช่ของผลิตภัณฑ์อื่น: ตรวจจากรายการรูปที่ ANSWER.md อ้างอิง 5 รูป (`a2_flow.png`, `letter_sample_row04/06.png`, ไดอะแกรม A3 2 ภาพ) ซึ่งเป็นงานของคุณเอง

## ไฟล์ในโฟลเดอร์นี้

- `Assignment_2_to_3.pdf` ผลลัพธ์
- `check_submission.py` ตัวตรวจ (รัน: `python check_submission.py <pdf> <as2 ANSWER.md> <as3 ANSWER.md> <USER_GUIDE.md>`)
- `build_submission.patch` การแก้ `as3/tools/build_submission.py` (เส้นทาง Chrome, ตัด A4, รูปแบบรายการ, รายการยืนยัน) ใช้กับ repo ด้วย `patch as3/tools/build_submission.py < build_submission.patch` แล้วแก้เส้นทาง Chrome เป็นของเครื่องคุณ
