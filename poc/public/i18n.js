// Thai is the default text inside index.html. EN holds the English for every
// static key plus every dynamic key; TH holds only the dynamic keys that are
// not present in the HTML. test/i18n.test.js checks that no key is missing.

export const EN = {
  'nav.main': 'Main', 'nav.home': 'Universe', 'nav.daily': 'Compass', 'nav.ask': 'Ask Oracle', 'nav.tarot': 'Tarot', 'nav.iching': 'I Ching',
  'nav.chart': 'Birth chart', 'nav.life': 'Years ahead', 'nav.ritual': 'Colour & ritual', 'nav.poc': 'INTERACTIVE POC',
  'mnav.daily': 'Today', 'mnav.ask': 'Ask', 'mnav.tarot': 'Tarot', 'mnav.life': 'Years', 'mnav.ritual': 'Ritual',
  'home.eyebrow': 'DAILY COMPASS / CELESTIAL INTELLIGENCE',
  'home.title': 'YOUR UNIVERSE<br>IS ALREADY IN <em>MOTION.</em>',
  'home.lead': 'Read the signals for today, this month and the years ahead through astrology, Tarot and the I Ching, then ask what is on your mind, like talking to an adviser who listens before answering.',
  'home.cta1': 'Read my day', 'home.cta2': 'Ask the Oracle',
  'home.profile': 'Build a birth chart from your birth date, time and place →',
  'home.disclaimer': 'For entertainment and reflection, not a guaranteed prediction. The planet scene is illustrative, not live positions.',
  'home.scroll': 'Scroll to explore',
  's1.idx': '01 / YOUR MAP', 's1.h': 'A map begins<br><em>with you.</em>',
  's1.p': 'Enter birth date, time and a Thai province. The system calculates real planetary positions for a Western chart, or explores experimental Vedic periods. Details are used for that request only and are not stored.',
  's1.cta': 'Build my chart ↗',
  's2.idx': '02 / SIGNALS, THEN MEANING', 's2.h': 'Start with <em>signals,</em><br>then find meaning.',
  's2.p': 'Pick a day, week, month or year and a focus: love, career, money or study. Everything is interpretive observation, never a guaranteed event.',
  's2.cta': "Open today's Compass ↗",
  's3.idx': '03 / YEARS AHEAD', 's3.h': 'The next 1–10 years:<br><em>what themes?</em>',
  's3.p': 'A timeline from Jupiter and Saturn contacts to your birth chart plus Vimshottari periods. It does not name events, but it shows which years may call for pushing ahead and which for review.',
  's3.cta': 'See the years ahead ↗',
  's4.idx': '04 / CARDS AND COINS', 's4.h': 'Draw the cards<br><em>or toss the coins.</em>',
  's4.p': 'Tarot cards are drawn with cryptographic randomness, or cast six I Ching lines. Then connect each meaning to what you can control.',
  's4.cta': 'Open Tarot ↗', 's4.cta2': 'Cast I Ching ↗',
  's5.idx': '05 / COLOUR, RITUAL AND CAUTIONS', 's5.h': 'Small rituals<br><em>that steady the mind.</em>',
  's5.p': 'Weekday colours and Buddha-image postures from Thai tradition, plus practical cautions such as leaving extra travel time or pausing before an argument. No evidence they change luck; use them for comfort only.',
  's5.cta': 'See colours and cautions ↗',
  's6.idx': '06 / DAILY COMPASS', 's6.h': 'Read. Understand. <em>Reflect.</em>',
  's6.p': 'A signal, its source, one small step and your own note: a short daily ritual where you choose every step.',
  'bento.eyebrow': 'QUESTIONS PEOPLE OFTEN ASK', 'bento.h': 'Ask the way you want to ask. <em>We choose the method.</em>',
  'q.interview': 'Will I get the job I just interviewed for?', 'q.interview.h': 'Three cards: opportunity, obstacle, what you control',
  'q.jobmonth': 'Will I find work this month?', 'q.jobmonth.h': '30-day theme plus a preparation plan',
  'q.years': 'What will my life be like in 5 years?', 'q.years.h': 'Multi-year timeline (needs birth details)',
  'q.luck': 'Bad luck lately: what should I do?', 'q.luck.h': 'Real steps plus a small ritual if you like',
  'q.color': 'What colour to wear today? What to watch out for?', 'q.color.h': 'Day colour plus cautions',
  'q.accuracy': 'Which system is most accurate?', 'q.accuracy.h': 'A straight answer, no inflated ranking',
  'q.stress': 'Stressed: I want advice on how to live', 'q.stress.h': 'Small steps now, and when to seek a professional',
  'q.ex': 'Will my ex come back?', 'q.ab': 'A or B: which should I choose?', 'q.belief': 'What should I worship or follow for a better life?',
  'ob.eyebrow': 'YOUR PERSONAL MAP / OPTIONAL', 'ob.h': 'Create your <em>universe.</em>',
  'ob.lead': 'Use birth date, time and place for a Western natal chart, experimental Vedic periods and the years-ahead timeline. This demo stores nothing.',
  'ob.label': 'BIRTH DETAILS', 'ob.date': 'Birth date', 'ob.time': 'Local birth time', 'ob.city': 'Province / birth city', 'ob.tz': 'Timezone',
  'ob.lat': 'Latitude', 'ob.lon': 'Longitude',
  'ob.cityNote': 'City coordinates are approximate, city-centre values and can be edited. Without an exact birth time, the Ascendant and houses will be unreliable.',
  'ob.consent': 'I agree to send these birth details for this calculation.',
  'ob.western': 'Calculate natal chart', 'ob.vedic': 'Vedic periods (experimental)', 'ob.life': 'Years ahead →',
  'ob.fine': 'Time and coordinates affect chart angles. Do not enter details if you do not consent. Requests are processed in memory and birth data is not stored.',
  'ob.guest': 'Continue without birth data →',
  'ld.eyebrow': 'PREPARING YOUR COMPASS', 'ld.h': "Mapping today's <em>signal…</em>", 'ld.p': 'Calculating lunar context and selecting a reading rule.',
  'ask.eyebrow': 'ASK THE ORACLE / CHOOSE YOUR PATH', 'ask.h': "What's on <em>your mind?</em>",
  'ask.sub': 'Ask directly, pick a method, or let the system route by question type. Positions come from calculation; meanings are interpretation.',
  'ask.ph': 'Will I get the job I just interviewed for?', 'ask.method': 'Method', 'ask.m.auto': 'Recommend for me', 'ask.m.western': 'Western astrology',
  'ask.m.tarot': 'Tarot', 'ask.m.iching': 'I Ching', 'ask.go': 'Get perspective',
  'ask.fine': "The system offers interpretive reflection, not guaranteed events or another person's private thoughts. High-stakes questions (medication, law, investing) are redirected to reliable facts and qualified support.",
  'ic.eyebrow': 'I CHING / DECISION COMPASS', 'ic.h': 'A lens for <em>change.</em>',
  'ic.p': 'Hold one question in mind. The system casts six lines with cryptographic coin flips and maps the result to King Wen hexagrams.',
  'ic.q': 'Your question', 'ic.ph': 'What deserves my attention as I choose between these options?', 'ic.cast': 'Cast the coins',
  'ic.fine': 'The result is a symbolic reflection prompt, not a decision or prediction. No classical judgement or translation is shown. Hexagram titles are English with Chinese characters and pinyin.',
  'tr.eyebrow': 'ASK NOW / TAROT', 'tr.h': 'Turn a question into <em>perspective.</em>', 'tr.sub': 'Choose a spread, draw the cards, and reflect on what you can control.',
  'tr.l1': '01 / YOUR QUESTION', 'tr.q': 'What would you like to explore?', 'tr.ph': 'Will I get the job I just interviewed for?',
  'tr.f1': 'Your question is processed for this reading only and is not stored.', 'tr.l2': '02 / CHOOSE A SPREAD',
  'tr.s.career': 'Career', 'tr.s.study': 'Study', 'tr.s.money': 'Money', 'tr.s.love': 'Love & relationships', 'tr.s.one': 'One-card reflection', 'tr.3': '3 cards', 'tr.1': '1 card',
  'tr.draw': 'Draw for me', 'tr.f2': 'Cards are drawn without replacement from 78. Meanings come from a fixed catalog written for this project, not canonical predictions.',
  'tr.empty.h': 'Your cards are waiting.', 'tr.empty.p': 'Each card has a curated meaning. The draw is random; the meaning comes from a fixed catalog.',
  'tr.again': 'Draw again ↻', 'tr.point': 'WHAT THIS COULD POINT TO', 'tr.do': 'WHAT YOU CAN DO',
  'tr.f3': "The cards offer symbolic reflection. They cannot know another person's thoughts or guarantee an outcome.",
  'd.eyebrow': 'YOUR DAILY COMPASS', 'd.h': 'A thought for <em>today.</em>', 'd.sub': "A small invitation, grounded in today's calculated lunar phase.",
  'd.horizon': 'Horizon', 'd.focus': 'Focus', 'd.h.day': 'Today', 'd.h.week': 'Next 7 days', 'd.h.month': 'Next 30 days', 'd.h.year': 'Next 365 days',
  't.general': 'Life overview', 't.love': 'Love', 't.career': 'Career', 't.study': 'Study', 't.money': 'Money',
  'd.explore': 'Explore this period', 'd.orbit': "TODAY'S ORBIT / LUNAR PHASE", 'd.ask': 'Ask anything', 'd.tarot': 'Draw Tarot', 'd.choose': 'CHOOSE A FOCUS',
  'd.t.love': 'Reflect on connection', 'd.t.career': 'Work and direction', 'd.t.study': 'Focus and practice', 'd.t.money': 'Resources and choices',
  'd.step': 'A PRACTICAL STEP', 'd.signal': "TODAY'S SIGNAL", 'd.one': 'ONE SMALL ACTION', 'd.why': 'Why this reading?',
  'd.note.k': 'A NOTE TO REMEMBER', 'd.note.h': 'Take what feels useful. Leave the rest.', 'd.note.p': 'This reading offers a perspective to consider, not a forecast of what must happen.', 'd.reflect': 'Reflect on today',
  'lf.eyebrow': 'YEARS AHEAD / NEEDS BIRTH DETAILS', 'lf.h': 'The years ahead: <em>what themes?</em>',
  'lf.sub': 'A yearly timeline from Jupiter/Saturn contacts to your natal points and your active Vimshottari period. Interpretive themes, not events that will happen.',
  'lf.years': 'Years', 'lf.go': 'Build timeline', 'lf.needs': 'Birth date, time and place are needed first (nothing is stored).', 'lf.fill': 'Fill in birth details →',
  'rt.eyebrow': 'COLOUR · LUCKY OBJECTS · CAUTIONS', 'rt.h': 'Small rituals that <em>steady the mind.</em>',
  'rt.sub': 'Thai tradition plus practical cautions. No evidence they change luck; use them for comfort, the way you like.', 'rt.birth': 'Birth date (optional)', 'rt.go': 'Show colours and cautions',
  'w.eyebrow': 'THE REASON BEHIND THE READING', 'w.h': 'A little more <em>clarity.</em>', 'w.sub': "Here's what shaped today's theme, in plain language.",
  'w.1': '01 / SOURCE', 'w.1h': "Today's sky context", 'w.calc': 'Calculated at', 'w.2': '02 / INTERPRETATION', 'w.2h': 'Our reading rule', 'w.rule': 'Rule',
  'w.3': '03 / YOUR CONTEXT', 'w.3h': 'Personalization level', 'w.mode': 'Mode',
  'w.foot': '<strong>How to read this:</strong> astronomical positions can be calculated; the meaning we assign to them is an astrology-inspired interpretation. It is not scientific prediction.',
  'w.back': '← Back to reading',
  'r.eyebrow': 'THE EVENING CHECK-IN', 'r.h': 'How did today <em>feel?</em>', 'r.lead': "You decide whether today's Compass was useful. A few seconds is enough.",
  'r.form': 'YOUR REFLECTION', 'r.opt': 'OPTIONAL', 'r.rel': 'How relevant did it feel?', 'r.rel3': 'Relevant', 'r.rel2': 'Somewhat', 'r.rel1': 'Not today',
  'r.use': 'Was it useful?', 'r.use3': 'Yes', 'r.use2': 'A little', 'r.use1': 'No', 'r.note': "A private note, if you'd like", 'r.ph': 'What stayed with you today?',
  'r.fine': 'Saved only in this browser. The note is never sent to the reading service.', 'r.save': 'Save reflection', 'r.skip': 'Skip for now',
  'f.home': 'Start again', 'f.clear': 'Clear my local data', 'f.tag': "Reflect. Don't predict.",

  // ---- v2: wizard, thread, fan, guide, ritual tabs ----
  'ob.unknown': "I don't know my birth time (we will say which parts are less reliable)", 'ob.back': '← Back', 'ob.next': 'Next →',
  'tr.s.time': 'Past · Present · Direction', 'tr.l3': '03 / PICK FROM THE DECK', 'ic.reset': 'Start over',
  'd.caution': "TODAY'S CAUTION", 'd.src': 'Why am I seeing this?', 'd.used': 'What is used',
  'd.used.p': 'Your date and timezone, the calculated lunar phase, the focus you chose, and an approximate Sun sign if given.',
  'd.notused': 'What is not used', 'd.notused.p': 'Health or financial data, your location, data from other apps, or notes you wrote. Planet positions come from code.',
  'g.eyebrow': 'SYSTEM GUIDE', 'g.h': 'Which system is <em>most accurate?</em>',
  'g.sub': 'Straight answer: no method has scientific evidence of predicting the future accurately. Each is useful differently as a tool for reflection and pacing, so this site shows no accuracy percentages.',
  'f.guide': 'System guide',

  // ---- dynamic keys (English) ----
  'ob.step': 'Step {n} of 5',
  'ob.t1': 'Start with your birth date', 'ob.s1': 'Used for your sign, life number and yearly rhythm.',
  'ob.t2': 'What time were you born?', 'ob.s2': 'Birth time sharpens the Ascendant. If unknown, tick the box and we will say what is less reliable.',
  'ob.t3': 'Where were you born?', 'ob.s3': 'Used to calculate planet positions for the place and timezone.',
  'ob.t4': 'What do you most want to know?', 'ob.s4': 'Pick any; you can change it later. This only sets which focus shows first.',
  'ob.t5': 'Ready to build your universe', 'ob.s5': 'Confirm consent, then calculate. Nothing is stored.',
  'ob.err.date': 'Please enter your birth date.', 'ob.err.place': 'Please choose a city or enter coordinates.',
  'int.work': 'Career', 'int.love': 'Love', 'int.money': 'Money', 'int.study': 'Study', 'int.health': 'Health (general wellbeing only)', 'int.travel': 'Travel', 'int.growth': 'Personal growth',
  'sum.title': 'YOUR BIRTH DETAILS', 'sum.none': 'Add your birth details for readings that use your chart.', 'sum.add': 'Add birth details', 'sum.edit': 'Edit details',
  'sum.date': 'Date', 'sum.time': 'Time', 'sum.unknown': 'unknown', 'sum.weekday': 'Birth day', 'sum.sun': 'Sun sign', 'sum.moon': 'Moon sign', 'sum.asc': 'Ascendant',
  'sum.life': 'Life number', 'sum.calc': '[calculated once you build the chart]', 'sum.unreliable': 'unreliable without birth time',
  'sum.note': 'Positions are calculated by code. The AI-style reply only explains them; it does not guess positions.',
  'ans.avoid': 'WHAT TO WATCH', 'ans.boost': 'MORALE BOOST', 'ans.conf': 'CONFIDENCE (HOW MUCH YOUR INPUTS SUPPORT THIS)', 'ans.src': 'Where this came from',
  'ans.conf.low': 'Low', 'ans.conf.medium': 'Medium', 'ans.conf.good': 'Good', 'ans.guide': 'Open the system guide',
  'fan.hint': 'Pick {n} card(s) from the deck. Where you click does not change which card you get; the draw is random on the server.', 'fan.pick': 'Card {i}',
  'ic.toss': 'Toss coins (line {n})', 'ic.done': 'All six lines cast', 'ic.status': '{n} of 6 lines', 'ic.tri': 'Lower trigram: {lower} · Upper trigram: {upper}',
  'rt.days': 'PICK A DAY', 'rt.weekday': 'Weekday', 'rt.life': 'Life number {n}: sum of the digits of your birth date, reduced (11, 22, 33 kept).',
  'rt.goals': 'WHAT DO YOU WANT TO SUPPORT?', 'rt.belief': 'Faith is personal. Choose only what matches your beliefs; nothing here is required or needs to be expensive. Items are popular beliefs, not verified facts.',
  'rt.cautions.week': 'CAUTIONS AND HOW TO REDUCE THE RISK', 'rt.fix': 'Lower the risk:', 'rt.remedy': 'WHEN LUCK FEELS BAD: 5 STEPS', 'rt.scam': 'Beware of scams.',
  'g.uses': 'Uses', 'g.good': 'Good for', 'g.limit': 'Limits', 'g.methods': 'Each method, honestly', 'g.pipe': 'How it works: code calculates, rules interpret, AI is optional',
  'g.faq': 'Common questions and how to answer', 'g.safe': 'Safety rules', 'g.do': 'Approach:', 'g.no': 'Never:',
  'ch.sum.w0': 'Birth time unknown: Ascendant and Midheaven are hidden because they are unreliable. Planet signs are shown; Moon sign can change within a day.',
  'ch.timeUnknown': 'Birth time unknown, so angles and houses are not shown.',
  'err.generic': 'The reading could not be generated.', 'err.reading': 'Reading unavailable. Please try again.', 'err.period': 'Period reading unavailable',
  'd.phase': 'At local noon, the Sun–Moon angle was {angle}°, in the {phase} phase range. This is calculated astronomical context.',
  'd.rule': 'Our versioned interpretation maps that phase range to “{theme}.”', 'd.rule.profile': '{id} adds a small action focus.',
  'd.prec.sign': 'Approximate Sun-sign context. The birth date itself is not kept by this app.',
  'd.prec.guest': 'A general reading uses no birth data.', 'd.mode.sign': 'Sun-sign context', 'd.mode.general': 'General', 'd.template': 'approved template',
  'd.dash': 'Calculated Sun–Moon angle: {angle}° · {phase}. This wheel is a schematic view of that angle, not a birth chart.', 'd.calc': 'Calculating sample themes…',
  'r.saved': 'Your reflection is saved on this device.',
  'ask.empty': 'Enter a question first.', 'ask.wait': 'Consulting the selected system…',
  'ans.accuracy': 'About “most accurate”', 'ans.support': 'When stress is high', 'ans.ritual': 'Colour, tradition and cautions', 'ans.life': 'The years ahead',
  'ans.needs': 'Birth details needed', 'ans.safety': 'A safer path for this question', 'ans.belief': 'A question of belief', 'ans.default': 'A perspective for your question',
  'ans.fit': 'WHICH METHOD FITS WHAT', 'ans.steps': 'SMALL STEPS', 'ans.care': 'WHEN TO GET HELP', 'ans.badluck': 'IF LUCK FEELS BAD', 'ans.plan': 'A 30-DAY PREPARATION PLAN',
  'ans.transformed': 'TRANSFORMED HEXAGRAM', 'ans.lines': 'CHANGING LINES', 'ans.linesText': 'Lines {lines} from the bottom.', 'ans.why': 'WHY THIS READING', 'ans.do': 'WHAT YOU CAN DO',
  'rt.colours': "COLOURS (THAI WEEKDAY TRADITION)", 'rt.today': 'Today', 'rt.birthday': 'Your birth day', 'rt.nobirth': 'Add a birth date to see your birth-day colour and Buddha-image posture.',
  'rt.cautions': 'PRACTICAL CAUTIONS', 'rt.cautions.note': 'Everyday habits chosen by the lunar-phase rule, not predictions of accidents or quarrels.',
  'rt.practices': 'CALMING PRACTICES', 'rt.wait': 'Preparing…',
  'lf.e.open': 'Open', 'lf.e.review': 'Review', 'lf.e.quiet': 'Quiet',
  'lf.dasha': 'Vimshottari period: {lord} ({from}–{to}) · {theme}', 'lf.quiet': 'No close Jupiter/Saturn contact sampled this year.', 'lf.wait': 'Calculating the timeline…',
  'ob.city.pick': '— choose a city —', 'ob.city.other': 'Other (enter coordinates)',
  'ob.err.consent': 'Please confirm consent before sending birth details.', 'ob.err.fields': 'Enter birth date, local time, latitude and longitude.',
  'ch.western': 'Your Western chart', 'ch.vedic': 'Vedic timing (experimental)',
  'ch.sum.w': 'Ascendant {asc}; Midheaven {mc}. Tropical geocentric positions with Whole Sign houses.',
  'ch.sum.v': 'Moon in {sign}, {nak} pada {pada}. Current major period: {lord} ({from}–{to}).',
  'ch.aspects': 'Major aspects:', 'ch.wait': 'Calculating from the details you provided…',
  'tr.wait': 'Shuffling and drawing…', 'tr.count': '{n} OF 78 CARDS', 'tr.reveal': 'Reveal {role} card', 'ic.wait': 'Casting six lines…'
};

export const TH = {
  'ob.step': 'ขั้นที่ {n} จาก 5',
  'ob.t1': 'เริ่มจากวันเกิดของคุณ', 'ob.s1': 'ใช้หาราศี เลขชีวิต และจังหวะรายปี',
  'ob.t2': 'เกิดตอนกี่โมง', 'ob.s2': 'เวลาเกิดช่วยให้ลัคนาแม่นขึ้น ถ้าไม่รู้ให้ติ๊กช่อง ระบบจะบอกว่าส่วนไหนแม่นน้อยลง',
  'ob.t3': 'เกิดที่ไหน', 'ob.s3': 'ใช้คำนวณตำแหน่งดาวตามสถานที่และเขตเวลา',
  'ob.t4': 'อยากรู้เรื่องไหนเป็นพิเศษ', 'ob.s4': 'เลือกได้หลายข้อ เปลี่ยนทีหลังได้ ใช้กำหนดว่าจะแสดงหัวข้อไหนก่อนเท่านั้น',
  'ob.t5': 'พร้อมสร้างจักรวาลของคุณ', 'ob.s5': 'ยืนยันความยินยอมแล้วกดคำนวณ ไม่มีการบันทึกข้อมูล',
  'ob.err.date': 'กรุณากรอกวันเกิด', 'ob.err.place': 'กรุณาเลือกเมืองหรือกรอกพิกัด',
  'int.work': 'การงาน', 'int.love': 'ความรัก', 'int.money': 'การเงิน', 'int.study': 'การเรียน', 'int.health': 'สุขภาพ (ภาพรวมความเป็นอยู่เท่านั้น)', 'int.travel': 'การเดินทาง', 'int.growth': 'พัฒนาตนเอง',
  'sum.title': 'ข้อมูลเกิดของคุณ', 'sum.none': 'ใส่ข้อมูลเกิดเพื่อให้การอ่านใช้ดวงของคุณ', 'sum.add': 'ใส่ข้อมูลเกิด', 'sum.edit': 'แก้ไขข้อมูล',
  'sum.date': 'วันเกิด', 'sum.time': 'เวลา', 'sum.unknown': 'ไม่ทราบ', 'sum.weekday': 'วันที่เกิด', 'sum.sun': 'ราศีอาทิตย์', 'sum.moon': 'ราศีจันทร์', 'sum.asc': 'ลัคนา',
  'sum.life': 'เลขชีวิต', 'sum.calc': '[คำนวณเมื่อสร้างดวงกำเนิด]', 'sum.unreliable': 'ไม่แม่นหากไม่ทราบเวลาเกิด',
  'sum.note': 'ตำแหน่งดาวคำนวณด้วยโปรแกรม ส่วนคำตอบมีหน้าที่อธิบาย ไม่ได้เดาตำแหน่งดาวเอง',
  'ans.avoid': 'ควรระวัง', 'ans.boost': 'เสริมกำลังใจ', 'ans.conf': 'ความมั่นใจ (ข้อมูลของคุณรองรับการอ่านนี้แค่ไหน)', 'ans.src': 'คำตอบนี้มาจากอะไร',
  'ans.conf.low': 'ต่ำ', 'ans.conf.medium': 'ปานกลาง', 'ans.conf.good': 'ดี', 'ans.guide': 'เปิดคู่มือระบบ',
  'fan.hint': 'เลือกไพ่ {n} ใบจากกอง ตำแหน่งที่คลิกไม่เปลี่ยนไพ่ที่ได้ การสุ่มทำที่เซิร์ฟเวอร์', 'fan.pick': 'ไพ่ใบที่ {i}',
  'ic.toss': 'โยนเหรียญ (เส้นที่ {n})', 'ic.done': 'ครบ 6 เส้นแล้ว', 'ic.status': 'ได้แล้ว {n} จาก 6 เส้น', 'ic.tri': 'ไตรแกรมล่าง: {lower} · ไตรแกรมบน: {upper}',
  'rt.days': 'เลือกวัน', 'rt.weekday': 'วันในสัปดาห์', 'rt.life': 'เลขชีวิต {n}: รวมเลขทุกหลักของวันเกิดแล้วลดเหลือหลักเดียว (คงเลข 11, 22, 33 ไว้)',
  'rt.goals': 'อยากเสริมเรื่องไหน', 'rt.belief': 'ความศรัทธาเป็นเรื่องส่วนบุคคล เลือกเฉพาะสิ่งที่ตรงกับความเชื่อของคุณ ไม่มีอะไรที่บังคับหรือต้องราคาแพง รายการเป็นความเชื่อที่นิยม ไม่ใช่ข้อเท็จจริงที่ตรวจสอบแล้ว',
  'rt.cautions.week': 'ข้อควรระวังและวิธีลดความเสี่ยง', 'rt.fix': 'วิธีลดความเสี่ยง:', 'rt.remedy': 'เมื่อรู้สึกว่าโชคไม่ดี: 5 ขั้น', 'rt.scam': 'ระวังมิจฉาชีพ',
  'g.uses': 'ใช้ข้อมูล', 'g.good': 'เหมาะกับ', 'g.limit': 'ข้อจำกัด', 'g.methods': 'แต่ละศาสตร์ ตามจริง', 'g.pipe': 'ระบบทำงานอย่างไร: โค้ดคำนวณ กฎตีความ AI เป็นตัวเลือก',
  'g.faq': 'คำถามยอดฮิต ควรตอบแบบไหน', 'g.safe': 'กติกาความปลอดภัย', 'g.do': 'แนวตอบ:', 'g.no': 'ห้าม:',
  'ch.sum.w0': 'ไม่ทราบเวลาเกิด จึงซ่อนลัคนาและจุดกลางฟ้าเพราะไม่แม่นยำ แสดงราศีของดาวต่าง ๆ ราศีจันทร์อาจเปลี่ยนภายในวัน',
  'ch.timeUnknown': 'ไม่ทราบเวลาเกิด จึงไม่แสดงมุมและบ้าน',
  'err.generic': 'ไม่สามารถสร้างคำอ่านได้', 'err.reading': 'ยังอ่านไม่ได้ในตอนนี้ กรุณาลองใหม่', 'err.period': 'ยังอ่านช่วงเวลานี้ไม่ได้',
  'd.phase': 'ณ เที่ยงวันตามเวลาท้องถิ่น มุมระหว่างดวงอาทิตย์กับดวงจันทร์คือ {angle}° อยู่ในช่วงเฟส {phase} นี่คือข้อมูลดาราศาสตร์ที่คำนวณได้',
  'd.rule': 'กฎการตีความของเรา (มีเวอร์ชัน) จับคู่ช่วงเฟสนี้กับธีม “{theme}”', 'd.rule.profile': '{id} เพิ่มจุดเน้นของการลงมือเล็กน้อย การตีความนี้เป็นการเลือกของผลิตภัณฑ์ ไม่ใช่การทำนายทางวิทยาศาสตร์',
  'd.prec.sign': 'ใช้บริบทราศีอาทิตย์โดยประมาณ ตัววันเกิดไม่ถูกเก็บไว้ในแอปนี้',
  'd.prec.guest': 'การอ่านทั่วไปไม่ใช้ข้อมูลวันเกิด', 'd.mode.sign': 'ราศีอาทิตย์', 'd.mode.general': 'ทั่วไป', 'd.template': 'แม่แบบที่อนุมัติแล้ว',
  'd.dash': 'มุมดวงอาทิตย์–ดวงจันทร์ที่คำนวณได้: {angle}° · {phase} วงล้อนี้เป็นภาพแผนผังของมุมดังกล่าว ไม่ใช่ดวงกำเนิด', 'd.calc': 'กำลังคำนวณธีมตัวอย่าง…',
  'r.saved': 'บันทึกความคิดของคุณไว้ในเครื่องนี้แล้ว',
  'ask.empty': 'กรุณาพิมพ์คำถามก่อน', 'ask.wait': 'กำลังปรึกษาศาสตร์ที่เลือก…',
  'ans.accuracy': 'เรื่อง “แม่นที่สุด”', 'ans.support': 'เมื่อความเครียดสูง', 'ans.ritual': 'สี ธรรมเนียม และข้อควรระวัง', 'ans.life': 'เส้นทางหลายปีข้างหน้า',
  'ans.needs': 'ต้องมีข้อมูลการเกิด', 'ans.safety': 'ทางที่ปลอดภัยกว่าสำหรับคำถามนี้', 'ans.belief': 'คำถามเรื่องความเชื่อ', 'ans.default': 'มุมมองสำหรับคำถามของคุณ',
  'ans.fit': 'แต่ละศาสตร์เหมาะกับอะไร', 'ans.steps': 'ก้าวเล็ก ๆ', 'ans.care': 'เมื่อไหร่ควรขอความช่วยเหลือ', 'ans.badluck': 'ถ้ารู้สึกว่าโชคไม่ดี', 'ans.plan': 'แผนเตรียมตัว 30 วัน',
  'ans.transformed': 'เฮกซะแกรมที่เปลี่ยนไป', 'ans.lines': 'เส้นที่เปลี่ยน', 'ans.linesText': 'เส้นที่ {lines} นับจากล่างขึ้นบน', 'ans.why': 'ทำไมอ่านแบบนี้', 'ans.do': 'สิ่งที่คุณทำได้',
  'rt.colours': 'สี (ธรรมเนียมสีประจำวันของไทย)', 'rt.today': 'วันนี้', 'rt.birthday': 'วันเกิดของคุณ', 'rt.nobirth': 'ใส่วันเกิดเพื่อดูสีและปางพระประจำวันเกิด',
  'rt.cautions': 'ข้อควรระวังเชิงปฏิบัติ', 'rt.cautions.note': 'นิสัยในชีวิตประจำวันที่เลือกตามกฎเฟสดวงจันทร์ ไม่ใช่การทำนายอุบัติเหตุหรือการทะเลาะ',
  'rt.practices': 'การปฏิบัติเพื่อให้ใจสงบ', 'rt.wait': 'กำลังเตรียม…',
  'lf.e.open': 'ช่วงเปิดโอกาส', 'lf.e.review': 'ช่วงทบทวน', 'lf.e.quiet': 'ช่วงเงียบ',
  'lf.dasha': 'มหาทศา: {lord} ({from}–{to}) · {theme}', 'lf.quiet': 'ปีนี้ไม่พบมุมใกล้ชิดของพฤหัสบดี/เสาร์ในช่วงที่สุ่มคำนวณ', 'lf.wait': 'กำลังคำนวณเส้นเวลา…',
  'ob.city.pick': '— เลือกเมือง —', 'ob.city.other': 'อื่น ๆ (กรอกพิกัดเอง)',
  'ob.err.consent': 'กรุณายืนยันความยินยอมก่อนส่งข้อมูลการเกิด', 'ob.err.fields': 'กรุณากรอกวันเกิด เวลา ละติจูด และลองจิจูด',
  'ch.western': 'ดวงกำเนิดแบบตะวันตกของคุณ', 'ch.vedic': 'มหาทศาแบบเวทิก (ทดลอง)',
  'ch.sum.w': 'ลัคนาราศี{asc} จุดกลางฟ้าราศี{mc} ตำแหน่งแบบ tropical geocentric และบ้านแบบ Whole Sign',
  'ch.sum.v': 'ดวงจันทร์ราศี{sign} นักษัตร {nak} บาท {pada} มหาทศาปัจจุบัน: {lord} ({from}–{to})',
  'ch.aspects': 'มุมสำคัญ:', 'ch.wait': 'กำลังคำนวณจากข้อมูลที่คุณให้…',
  'tr.wait': 'กำลังสับและจั่วไพ่…', 'tr.count': 'ไพ่ {n} จาก 78 ใบ', 'tr.reveal': 'เปิดไพ่ {role}', 'ic.wait': 'กำลังโยนหกเส้น…'
};

export const QUESTION_EN = {
  'งานที่เพิ่งสัมภาษณ์มาจะได้งานมั้ย': 'Will I get the job I just interviewed for?',
  'จะมีงานทำภายในเดือนนี้ไหม เตรียมตัวยังไงดี': 'Will I get a job this month? How should I prepare?',
  'อีก 5 ปีชีวิตจะเป็นยังไง': 'What will my life be like in the next 5 years?',
  'ช่วงนี้โชคไม่ดี ทำยังไงดี': 'Bad luck lately: any lucky colour or ritual I should try?',
  'วันนี้ควรใส่สีอะไรดี ต้องระวังอะไร': 'What colour should I wear today?',
  'ศาสตร์ไหนแม่นที่สุด': 'Which system is most accurate?',
  'เครียดมาก อยากได้คำแนะนำในการใช้ชีวิต': 'I am very stressed and want advice on how to live',
  'แฟนเก่าจะกลับมาไหม': 'Will my ex come back?',
  'A กับ B ควรเลือกอะไรดี': 'A or B: which should I choose?',
  'ควรบูชาหรือนับถืออะไรแล้วชีวิตดีขึ้น': 'Which deity should I worship for a better life?'
};
export const questionText = thaiQuestion => (lang === 'th' ? thaiQuestion : QUESTION_EN[thaiQuestion] ?? thaiQuestion);

const PHASE_TH = {
  'new-to-first quarter': 'จันทร์ดับถึงครึ่งดวงแรก', 'first quarter-to-full': 'ครึ่งดวงแรกถึงเพ็ญ',
  'full-to-third quarter': 'เพ็ญถึงครึ่งดวงหลัง', 'third quarter-to-new': 'ครึ่งดวงหลังถึงจันทร์ดับ'
};
const PLANETS_TH = {
  Sun: 'อาทิตย์', Moon: 'จันทร์', Mercury: 'พุธ', Venus: 'ศุกร์', Mars: 'อังคาร', Jupiter: 'พฤหัสบดี', Saturn: 'เสาร์', Uranus: 'ยูเรนัส',
  Neptune: 'เนปจูน', Pluto: 'พลูโต', Ascendant: 'ลัคนา', Midheaven: 'จุดกลางฟ้า', Ketu: 'เกตุ', Rahu: 'ราหู'
};
const SIGNS_TH = {
  Aries: 'เมษ', Taurus: 'พฤษภ', Gemini: 'เมถุน', Cancer: 'กรกฎ', Leo: 'สิงห์', Virgo: 'กันย์', Libra: 'ตุลย์', Scorpio: 'พิจิก',
  Sagittarius: 'ธนู', Capricorn: 'มังกร', Aquarius: 'กุมภ์', Pisces: 'มีน'
};

let lang = 'th';
export const getLang = () => lang;

export function t(key, vars = {}) {
  const table = lang === 'th' ? { ...EN, ...TH } : EN;
  let text = table[key] ?? EN[key] ?? key;
  const merged = lang === 'th' && vars.phase ? { ...vars, phase: PHASE_TH[vars.phase] || vars.phase } : vars;
  return text.replace(/\{(\w+)\}/g, (_, name) => (merged[name] ?? `{${name}}`));
}
export const planetName = name => (lang === 'th' ? PLANETS_TH[name] || name : name);
export const signName = name => (lang === 'th' ? SIGNS_TH[name] || name : name);
export const TOPIC_LABEL = topic => t(`t.${topic}`);

function remember(node, prop) {
  const flag = `th${prop}`;
  if (node.dataset[flag] === undefined) node.dataset[flag] = prop === 'Html' ? node.innerHTML : prop === 'Ph' ? node.getAttribute('placeholder') ?? '' : prop === 'Aria' ? node.getAttribute('aria-label') ?? '' : node.textContent;
  return node.dataset[flag];
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(node => { const th = remember(node, 'Text'); node.textContent = lang === 'th' ? th : EN[node.dataset.i18n] ?? th; });
  root.querySelectorAll('[data-i18n-html]').forEach(node => { const th = remember(node, 'Html'); node.innerHTML = lang === 'th' ? th : EN[node.dataset.i18nHtml] ?? th; });
  root.querySelectorAll('[data-i18n-ph]').forEach(node => { const th = remember(node, 'Ph'); node.setAttribute('placeholder', lang === 'th' ? th : EN[node.dataset.i18nPh] ?? th); });
  root.querySelectorAll('[data-i18n-aria]').forEach(node => { const th = remember(node, 'Aria'); node.setAttribute('aria-label', lang === 'th' ? th : EN[node.dataset.i18nAria] ?? th); });
  document.documentElement.lang = lang;
}
export function setLang(next) { lang = next === 'en' ? 'en' : 'th'; applyI18n(); }
export function initI18n(initial) { lang = initial === 'en' ? 'en' : 'th'; applyI18n(); }
