import { t, getLang, setLang, initI18n, planetName, signName, TOPIC_LABEL, questionText } from './i18n.js';
import { GOALS, CAUTIONS, REMEDY_STEPS, SCAM_NOTE, GUIDE } from './content.js';

const $ = id => document.getElementById(id);
const storeKey = 'daily-compass-poc-v1';
const READING_KEY_VERSION = 'daily-compass-lunar-v2-th';
let state = readState();
let reading = null;
let profileContext = null;
let lastPeriod = null, lastLife = null, lastRitual = null, lastChart = null, summaryRitual = null;
let thread = [];            // oracle conversation: { question, method, result }
let ichingState = { data: null, shown: 0 };
let ritualDay = null, ritualGoal = 'work';
let obStep = 1;
const INTERESTS = [['work', 'career'], ['love', 'love'], ['money', 'money'], ['study', 'study'], ['health', 'general'], ['travel', 'general'], ['growth', 'general']];
const SPREAD_COUNT = { general: 1 };
const spreadCount = key => SPREAD_COUNT[key] || 3;

// Approximate city-centre coordinates (decimal degrees) for the birth-place picker.
// Values are typed from general knowledge, are city-level only, and stay editable.
const CITIES = [
  ['bangkok', 'กรุงเทพมหานคร', 'Bangkok', 13.7563, 100.5018], ['chiangmai', 'เชียงใหม่', 'Chiang Mai', 18.7883, 98.9853],
  ['chiangrai', 'เชียงราย', 'Chiang Rai', 19.9072, 99.8310], ['phitsanulok', 'พิษณุโลก', 'Phitsanulok', 16.8211, 100.2659],
  ['ayutthaya', 'พระนครศรีอยุธยา', 'Ayutthaya', 14.3532, 100.5689], ['chonburi', 'ชลบุรี', 'Chon Buri', 13.3611, 100.9847],
  ['khonkaen', 'ขอนแก่น', 'Khon Kaen', 16.4419, 102.8350], ['udon', 'อุดรธานี', 'Udon Thani', 17.4138, 102.7870],
  ['korat', 'นครราชสีมา', 'Nakhon Ratchasima', 14.9799, 102.0978], ['ubon', 'อุบลราชธานี', 'Ubon Ratchathani', 15.2448, 104.8473],
  ['suratthani', 'สุราษฎร์ธานี', 'Surat Thani', 9.1382, 99.3215], ['nakhonsi', 'นครศรีธรรมราช', 'Nakhon Si Thammarat', 8.4304, 99.9631],
  ['phuket', 'ภูเก็ต', 'Phuket', 7.8804, 98.3923], ['hatyai', 'หาดใหญ่ / สงขลา', 'Hat Yai / Songkhla', 7.0086, 100.4747]
];

function readState() { try { return JSON.parse(localStorage.getItem(storeKey)) || {}; } catch { return {}; } }
function saveState() { try { localStorage.setItem(storeKey, JSON.stringify(state)); } catch { /* storage unavailable */ } }
const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
const isTh = () => getLang() === 'th';
const pick = (th, en) => (isTh() && th ? th : en);

const SCREEN_NAV = { daily: 'daily', tarot: 'tarot', iching: 'iching', ask: 'ask', life: 'life', ritual: 'ritual', onboard: 'chart' };
const TOPIC_OF = Object.fromEntries(INTERESTS);
function show(screen) {
  document.querySelectorAll('.screen').forEach(node => node.classList.toggle('active', node.id === screen));
  document.querySelectorAll('.nav-links button, .nav-links a').forEach(node => node.removeAttribute('aria-current'));
  $(`nav-${SCREEN_NAV[screen] || 'home'}`)?.setAttribute('aria-current', 'page');
  location.hash = screen;
  window.scrollTo({ top: 0, behavior: 'instant' });
  observeReveals();
  if (screen === 'ask') refreshSummary();
  if (screen === 'guide') renderGuide();
  if (screen === 'tarot') renderFan();
}

// ---- scroll reveal (scrollytelling / kinetic entrance) ----------------------
let revealObserver = null;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function observeReveals() {
  const nodes = document.querySelectorAll('.story-panel:not(.is-visible), .life-row:not(.is-visible), .bento-tile:not(.is-visible), .ritual-card:not(.is-visible)');
  if (!('IntersectionObserver' in window) || reduceMotion) { nodes.forEach(n => n.classList.add('is-visible')); return; }
  revealObserver ||= new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }), { threshold: .14 });
  nodes.forEach(n => revealObserver.observe(n));
}

// ---- helpers ---------------------------------------------------------------
function todayIn(tz) { return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function labelDate(date) { return new Date(`${date}T12:00:00Z`).toLocaleDateString(isTh() ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
function localDate() { return todayIn(localTimezone); }
async function postJson(url, payload) {
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || t('err.generic'));
  return data;
}
function showError(target, error) { target.replaceChildren(); target.textContent = error.message || String(error); target.classList.remove('hidden'); target.classList.add('error-message'); }
function addBlock(parent, label, text, cls = 'answer-block') {
  const block = el('div', cls); block.append(el('span', 'tiny-label', label), el('p', '', text)); parent.append(block); return block;
}
function addList(parent, label, items, cls = 'answer-list') {
  const block = el('div', 'answer-block'); block.append(el('span', 'tiny-label', label));
  const list = el('ul', cls); items.forEach(item => list.append(el('li', '', item))); block.append(list); parent.append(block); return block;
}

// ---- daily reading ----------------------------------------------------------
async function loadReading() {
  const timezone = localTimezone, date = todayIn(timezone);
  const key = `${date}|${timezone}|${state.sign || 'guest'}|${READING_KEY_VERSION}`;
  if (state.readingKey === key && state.reading) reading = state.reading;
  else {
    const params = new URLSearchParams({ date, timezone });
    if (state.sign) params.set('sign', state.sign);
    const response = await fetch(`/api/reading?${params}`);
    if (!response.ok) throw new Error(t('err.reading'));
    reading = await response.json();
    state.readingKey = key; state.reading = reading; state.feedback = null; saveState();
  }
  renderReading(); show('daily'); loadDailyCaution();
}
function renderReading() {
  if (!reading) return;
  const th = isTh() && reading.contentTh;
  const content = th ? reading.contentTh : reading.content;
  $('date-label').textContent = labelDate(reading.date);
  $('signal-title').textContent = content.signal;
  $('reading-copy').textContent = content.reading;
  $('action-copy').textContent = content.action;
  $('phase-copy').textContent = t('d.phase', { angle: reading.source.phaseAngle, phase: reading.source.phase });
  $('instant-copy').textContent = new Date(reading.source.instant).toLocaleString(isTh() ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: reading.timezone });
  const theme = th ? reading.contentTh.signal : reading.interpretation.theme;
  $('rule-copy').textContent = t('d.rule', { theme }) + (reading.interpretation.profileRuleId ? ' ' + t('d.rule.profile', { id: reading.interpretation.profileRuleId }) : '');
  $('rule-id').textContent = `${reading.interpretation.ruleId}${reading.interpretation.profileRuleId ? ` + ${reading.interpretation.profileRuleId}` : ''} · ${reading.interpretation.ruleVersion}`;
  $('precision-copy').textContent = state.sign ? t('d.prec.sign') : t('d.prec.guest');
  $('mode-copy').textContent = state.sign ? t('d.mode.sign') : t('d.mode.general');
  $('reflection-prompt').textContent = th ? reading.contentTh.prompt : reading.content.reflectionPrompt;
  $('narrative-source').textContent = reading.narrativeSource || t('d.template');
  $('dashboard-theme').textContent = theme;
  $('dashboard-phase').textContent = t('d.dash', { angle: reading.source.phaseAngle, phase: reading.source.phase });
  $('wheel-marker').style.setProperty('--phase-angle', `${reading.source.phaseAngle}deg`);
  $('saved-message').textContent = state.feedback ? t('r.saved') : '';
  $('reflection-note').value = state.feedback?.note || '';
  for (const name of ['relevance', 'usefulness']) document.querySelectorAll(`input[name="${name}"]`).forEach(input => { input.checked = state.feedback?.[name] === Number(input.value); });
}
let todayRitual = null;
async function loadDailyCaution() {
  try { todayRitual = await postJson('/api/ritual', { date: localDate(), timezone: localTimezone }); } catch { todayRitual = null; }
  renderDailyCaution();
}
function renderDailyCaution() {
  const list = $('daily-caution-list'); list.replaceChildren();
  (todayRitual?.reminders[getLang()] || []).forEach(item => list.append(el('li', '', item)));
}
async function start(sign = null) {
  state.sign = sign; saveState();
  show('loading');
  try { await loadReading(); } catch (err) { alert(err.message); show('home'); }
}

// ---- period reading ---------------------------------------------------------
async function loadPeriod() {
  const result = $('period-result'); result.classList.remove('hidden', 'error-message');
  $('period-scenario').textContent = t('d.calc');
  const payload = { date: localDate(), timezone: localTimezone, horizon: $('period-horizon').value, topic: $('period-topic').value };
  try {
    lastPeriod = profileContext
      ? await postJson('/api/period', { ...payload, birthProfile: profileContext })
      : await fetch(`/api/period?${new URLSearchParams(payload)}`).then(async response => { const value = await response.json(); if (!response.ok) throw new Error(value.error || t('err.period')); return value; });
    renderPeriod();
  } catch (error) { showError(result, error); }
}
function renderPeriod() {
  if (!lastPeriod) return;
  const d = lastPeriod, th = isTh() && d.th;
  $('period-kicker').textContent = `${t('d.h.' + d.horizon)} / ${TOPIC_LABEL(d.topic)} · ${d.method}`;
  $('period-signal').textContent = th ? d.th.signal : d.signal;
  $('period-scenario').textContent = th ? d.th.scenario : d.scenario;
  $('period-interval').textContent = `${d.interval.start} → ${d.interval.end}`;
  $('period-why').textContent = th ? d.th.why : d.why;
  $('period-action').textContent = th ? d.th.action : d.action;
  const result = $('period-result'); result.classList.remove('hidden', 'error-message');
  result.querySelector('.fineprint')?.remove();
  result.append(el('p', 'fineprint', th ? d.th.limits : d.limits));
}

// ---- Ask the Oracle (conversation thread) ----------------------------------------
async function askOracle(method = $('oracle-method').value) {
  const question = $('oracle-question').value.trim();
  if (!question) { $('oracle-question').focus(); $('oracle-question').setCustomValidity(t('ask.empty')); $('oracle-question').reportValidity(); return; }
  $('oracle-question').setCustomValidity('');
  const entry = { question, method, result: null, pending: true };
  thread.push(entry); renderThread(true);
  $('oracle-question').value = '';
  await fetchTurn(entry);
  renderThread(true);
}
async function fetchTurn(entry) {
  try {
    const body = { question: entry.question, method: entry.method, date: localDate(), timezone: localTimezone, lang: getLang(), birthTimeKnown: !state.timeUnknown, ...(profileContext ? { birthProfile: profileContext } : {}) };
    entry.result = await postJson('/api/ask', body); entry.error = null;
  } catch (error) { entry.error = error; }
  entry.pending = false;
}
const RANDOM_METHODS = new Set(['tarot', 'iching']);
function renderThread(scroll = false) {
  const out = $('oracle-answer'); out.replaceChildren();
  thread.forEach(entry => {
    const user = el('div', 'bubble user', entry.question);
    const ai = el('article', 'bubble ai');
    if (entry.pending) ai.textContent = t('ask.wait');
    else if (entry.error) { ai.classList.add('error-message'); ai.textContent = entry.error.message; }
    else renderAnswer(ai, entry.result);
    out.append(user, ai);
  });
  if (scroll) out.lastElementChild?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
}
async function reaskThread() {
  for (const entry of thread) if (!entry.pending && !entry.error && !RANDOM_METHODS.has(entry.result.route.method)) await fetchTurn(entry);
  renderThread();
}
function confidenceMeter(conf) {
  const box = el('div', 'confidence'); box.append(el('span', 'tiny-label', t('ans.conf')));
  const rank = ['low', 'medium', 'good'].indexOf(conf.level);
  const bar = el('div', 'conf-bar'); bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', t('ans.conf.' + conf.level));
  for (let i = 0; i < 3; i++) bar.append(el('i', i <= rank ? 'on' : ''));
  const head = el('div', 'conf-head'); head.append(bar, el('strong', '', t('ans.conf.' + conf.level)));
  box.append(head);
  const list = el('ul', 'conf-reasons'); conf.reasons.forEach(reason => list.append(el('li', '', reason))); box.append(list);
  return box;
}
function renderAnswer(output, result) {
  const a = result.answer;
  output.replaceChildren(); output.classList.remove('hidden', 'error-message');
  output.append(el('span', 'tiny-label', `${result.route.method} / ${result.route.intent}`.toUpperCase()));
  const titles = { accuracy: 'ans.accuracy', support: 'ans.support', ritual: 'ans.ritual', 'life-timeline': 'ans.life', 'needs-profile': 'ans.needs', safety: 'ans.safety', belief: 'ans.belief' };
  const title = titles[a.type] ? t(titles[a.type]) : (a.type === 'period' ? pick(a.th?.signal, a.signal) : a.signal || a.primaryHexagram?.title || t('ans.default'));
  output.append(el('h2', '', title));
  output.append(el('p', 'oracle-message', a.message || a.scenario || a.reading || ''));

  if (a.type === 'accuracy') {
    const block = el('div', 'answer-block'); block.append(el('span', 'tiny-label', t('ans.fit')));
    const grid = el('div', 'fit-grid'); a.methodFit.forEach(([name, text]) => { const item = el('article', 'mini-card'); item.append(el('h3', '', name), el('p', '', text)); grid.append(item); }); block.append(grid); output.append(block);
    const guide = el('button', 'button outline', t('ans.guide')); guide.addEventListener('click', () => show('guide')); output.append(guide);
  }
  if (a.type === 'support') { addList(output, t('ans.steps'), a.steps); addBlock(output, t('ans.care'), a.care); }
  if (a.type === 'ritual') { renderRitualInto(output, a.ritualGuide); addList(output, t('ans.badluck'), a.steps); }
  if (a.type === 'needs-profile') { const go = el('button', 'button outline', t('lf.fill')); go.addEventListener('click', () => show('onboard')); output.append(go); }
  if (a.type === 'life-timeline') renderLifeInto(output, a);
  if (a.type === 'period' && a.steps) addList(output, t('ans.plan'), a.steps);
  if (a.cards?.length) {
    const cards = el('div', 'oracle-cards');
    a.cards.forEach(card => { const item = el('article', 'mini-card'); item.append(el('h3', '', `${pick(card.roleTh, card.role)}: ${pick(card.nameTh, card.name)}`), el('p', '', pick(card.interpretationTh, card.interpretation))); cards.append(item); });
    output.append(cards);
    if (a.possibleDevelopment && !isTh()) addBlock(output, t('tr.point'), a.possibleDevelopment);
  }
  if (a.primaryHexagram) {
    const badge = el('div', 'hexagram-output'); badge.append(el('span', '', a.primaryHexagram.unicode), el('div', '', `${a.primaryHexagram.hanzi} · ${a.primaryHexagram.pinyin} · ${a.primaryHexagram.title}`)); output.append(badge);
    if (a.primaryHexagram.lowerTrigram) output.append(el('p', 'fineprint', t('ic.tri', { lower: a.primaryHexagram.lowerTrigram, upper: a.primaryHexagram.upperTrigram })));
    if (a.resultingHexagram) addBlock(output, t('ans.transformed'), `${a.resultingHexagram.unicode} ${a.resultingHexagram.hanzi} · ${a.resultingHexagram.title}: ${a.resultingHexagram.theme}`);
    if (a.changingLines?.length) addBlock(output, t('ans.lines'), t('ans.linesText', { lines: a.changingLines.join(', ') }) + ' ' + a.changingLinePrompts.map(line => line.prompt).join(' '));
  }
  if (a.why && a.type !== 'period' && a.type !== 'life-timeline') addBlock(output, t('ans.why'), a.why);
  if (a.action && !['safety', 'belief', 'accuracy', 'needs-profile'].includes(a.type)) addBlock(output, t('ans.do'), isTh() ? (a.actionTh || a.th?.action || a.action) : a.action);
  if (a.guidance) {
    addBlock(output, t('ans.avoid'), a.guidance.avoid, 'answer-block warn');
    if (a.guidance.boost) addBlock(output, t('ans.boost'), a.guidance.boost);
  }
  if (a.confidence) output.append(confidenceMeter(a.confidence));
  if (a.sources) {
    const details = el('details', 'sources'); details.append(el('summary', '', t('ans.src')));
    const list = el('ul', 'answer-list'); a.sources.forEach(src => { const li = el('li'); li.append(el('b', '', src.label + ': '), document.createTextNode(src.detail)); list.append(li); });
    details.append(list); output.append(details);
  }
  if (a.limits) output.append(el('p', 'fineprint', isTh() ? (a.th?.limits || a.limitsTh || a.limits) : a.limits));
}

// ---- birth summary beside the chat ---------------------------------------------------
function approximateSign(date) {
  const m = Number(date.slice(5, 7)), d = Number(date.slice(8, 10));
  const cut = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
  const signs = ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'];
  return signs[(m - 1 + (d >= cut[m - 1] ? 1 : 0)) % 12];
}
async function refreshSummary() {
  const date = $('birth-date').value;
  if (date) { try { summaryRitual = await postJson('/api/ritual', { date: localDate(), timezone: localTimezone, birthDate: date }); } catch { summaryRitual = null; } }
  else summaryRitual = null;
  renderSummary();
}
function renderSummary() {
  const box = $('birth-summary'); box.replaceChildren();
  box.append(el('span', 'tiny-label', t('sum.title')));
  const date = $('birth-date').value;
  if (!date) {
    box.append(el('p', 'fineprint', t('sum.none')));
    const go = el('button', 'button outline', t('sum.add')); go.addEventListener('click', () => show('onboard')); box.append(go); return;
  }
  const chart = lastChart?.kind === 'western' ? lastChart.data.placements : null;
  const place = body => chart?.find(p => p.body === body);
  const known = !state.timeUnknown;
  const rows = [
    [t('sum.date'), labelDate(date)],
    [t('sum.time'), known ? $('birth-time').value : t('sum.unknown')],
    [t('sum.weekday'), summaryRitual?.birthDay ? (isTh() ? `${summaryRitual.birthDay.dayTh} · สี${summaryRitual.birthDay.colorTh}` : `${summaryRitual.birthDay.dayEn} · ${summaryRitual.birthDay.colorEn}`) : '—'],
    [t('sum.sun'), signName(place('Sun')?.sign || approximateSign(date))],
    [t('sum.moon'), place('Moon') ? signName(place('Moon').sign) : t('sum.calc')],
    [t('sum.asc'), !known ? t('sum.unreliable') : place('Ascendant') ? signName(place('Ascendant').sign) : t('sum.calc')],
    [t('sum.life'), summaryRitual?.lifeNumber ?? '—']
  ];
  const list = el('dl', 'summary-list');
  rows.forEach(([k, v]) => { list.append(el('dt', '', k), el('dd', '', String(v))); });
  box.append(list, el('p', 'fineprint', t('sum.note')));
  const edit = el('button', 'button quiet', t('sum.edit')); edit.addEventListener('click', () => show('onboard')); box.append(edit);
}

// ---- ritual (colour, tradition, cautions) -----------------------------------
function swatch(label, day) {
  const card = el('article', 'swatch');
  const dot = el('span', 'swatch-dot'); dot.style.setProperty('--swatch', day.hex);
  const text = el('div'); text.append(el('small', '', label), el('strong', '', isTh() ? `${day.dayTh} · สี${day.colorTh}` : `${day.dayEn} · ${day.colorEn}`), el('em', '', isTh() ? day.postureTh : day.postureEn));
  card.append(dot, text); return card;
}
function listCard(labelKey, items, wide = false) {
  const card = el('section', `ritual-card glass${wide ? ' wide' : ''}`); card.append(el('span', 'tiny-label', t(labelKey)));
  const list = el('ul', 'answer-list'); items.forEach(item => list.append(el('li', '', item))); card.append(list); return card;
}
function renderRitualInto(parent, guide) {
  const grid = el('div', 'ritual-grid');
  const colours = el('section', 'ritual-card glass'); colours.append(el('span', 'tiny-label', t('rt.colours')));
  colours.append(swatch(t('rt.today'), guide.today));
  if (guide.birthDay) colours.append(swatch(t('rt.birthday'), guide.birthDay));
  else colours.append(el('p', 'fineprint', t('rt.nobirth')));
  grid.append(colours);
  const cautions = listCard('rt.cautions', guide.reminders[getLang()]); cautions.append(el('p', 'fineprint', t('rt.cautions.note'))); grid.append(cautions);
  const practices = listCard('rt.practices', guide.practices[getLang()], true); practices.append(el('p', 'fineprint', isTh() ? guide.noteTh : guide.noteEn)); grid.append(practices);
  parent.append(grid); observeReveals();
}
async function loadRitual() {
  const out = $('ritual-result'); out.classList.remove('hidden', 'error-message'); out.textContent = t('rt.wait');
  try {
    lastRitual = await postJson('/api/ritual', { date: localDate(), timezone: localTimezone, ...($('ritual-birth').value ? { birthDate: $('ritual-birth').value } : {}) });
    ritualDay = null; renderRitual();
  } catch (error) { showError(out, error); }
}
function tabRow(labelKey, entries, selected, onPick) {
  const wrap = el('div', 'tabs'); wrap.setAttribute('role', 'tablist'); wrap.setAttribute('aria-label', t(labelKey));
  entries.forEach(([id, label]) => {
    const b = el('button', 'tab', label); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(id === selected));
    b.addEventListener('click', () => onPick(id)); wrap.append(b);
  });
  return wrap;
}
function renderRitual() {
  if (!lastRitual) return;
  const out = $('ritual-result'); out.replaceChildren(); out.classList.remove('hidden', 'error-message');
  const days = lastRitual.allDays;
  ritualDay ??= days.find(d => d.id === lastRitual.today.id).id;

  const colours = el('section', 'ritual-card glass wide'); colours.append(el('span', 'tiny-label', t('rt.days')));
  colours.append(tabRow('rt.days', days.map(d => [d.id, isTh() ? d.dayTh : d.dayEn]), ritualDay, id => { ritualDay = id; renderRitual(); }));
  const day = days.find(d => d.id === ritualDay);
  colours.append(swatch(`${day.id === lastRitual.today.id ? t('rt.today') : ''}${day.id === lastRitual.today.id && lastRitual.birthDay?.id === day.id ? ' · ' : ''}${lastRitual.birthDay?.id === day.id ? t('rt.birthday') : ''}` || t('rt.weekday'), day));
  if (lastRitual.lifeNumber) colours.append(el('p', 'fineprint', t('rt.life', { n: lastRitual.lifeNumber })));
  colours.append(el('p', 'fineprint', isTh() ? lastRitual.noteTh : lastRitual.noteEn));
  out.append(colours);

  const goals = el('section', 'ritual-card glass wide'); goals.append(el('span', 'tiny-label', t('rt.goals')));
  goals.append(tabRow('rt.goals', GOALS.map(g => [g.id, isTh() ? g.th : g.en]), ritualGoal, id => { ritualGoal = id; renderRitual(); }));
  const items = el('div', 'item-grid');
  GOALS.find(g => g.id === ritualGoal).items.forEach(item => {
    const card = el('article', 'mini-card'); card.append(el('h3', '', pick(item.name.th, item.name.en)), el('p', '', pick(item.what.th, item.what.en)), el('p', 'fineprint', pick(item.how.th, item.how.en))); items.append(card);
  });
  goals.append(items, el('p', 'fineprint', t('rt.belief')));
  out.append(goals);

  const cautions = el('section', 'ritual-card glass wide'); cautions.append(el('span', 'tiny-label', t('rt.cautions.week')));
  const grid = el('div', 'item-grid');
  CAUTIONS.forEach(c => { const card = el('article', 'mini-card warn'); const fix = el('p', 'fineprint'); fix.append(el('b', '', t('rt.fix') + ' '), document.createTextNode(pick(c.fix.th, c.fix.en))); card.append(el('h3', '', pick(c.title.th, c.title.en)), el('p', '', pick(c.why.th, c.why.en)), fix); grid.append(card); });
  cautions.append(grid);
  const today = el('ul', 'answer-list'); lastRitual.reminders[getLang()].forEach(item => today.append(el('li', '', item)));
  cautions.append(el('span', 'tiny-label', t('rt.cautions')), today, el('p', 'fineprint', t('rt.cautions.note')));
  out.append(cautions);

  const steps = el('section', 'ritual-card glass wide'); steps.append(el('span', 'tiny-label', t('rt.remedy')));
  const sg = el('ol', 'step-grid'); REMEDY_STEPS.forEach(st => { const li = el('li'); li.append(el('b', '', pick(st.t.th, st.t.en)), el('span', '', pick(st.d.th, st.d.en))); sg.append(li); });
  steps.append(sg);
  out.append(steps);

  const scam = el('section', 'ritual-card glass wide scam'); scam.append(el('b', '', t('rt.scam') + ' '), document.createTextNode(pick(SCAM_NOTE.th, SCAM_NOTE.en)));
  out.append(scam);
  observeReveals();
}

// ---- system guide ---------------------------------------------------------------------
function renderGuide() {
  const body = $('guide-body'); body.replaceChildren();
  const sci = el('div', 'item-grid');
  GUIDE.sciences.forEach(x => { const c = el('article', 'mini-card'); c.append(el('h3', '', pick(x.name.th, x.name.en)), el('p', 'fineprint', `${t('g.uses')}: ${pick(x.input.th, x.input.en)}`), el('p', '', `${t('g.good')}: ${pick(x.good.th, x.good.en)}`), el('p', 'fineprint', `${t('g.limit')}: ${pick(x.limit.th, x.limit.en)}`)); sci.append(c); });
  const s1 = el('section', 'ritual-card glass wide is-visible'); s1.append(el('h2', '', t('g.methods')), sci);
  const pipe = el('ol', 'step-grid five');
  GUIDE.pipeline.forEach(x => { const li = el('li'); li.append(el('small', '', x.k), el('b', '', pick(x.t.th, x.t.en)), el('span', '', pick(x.d.th, x.d.en))); pipe.append(li); });
  const s2 = el('section', 'ritual-card glass wide is-visible'); s2.append(el('h2', '', t('g.pipe')), pipe);
  const faq = el('div', 'item-grid two');
  GUIDE.faq.forEach(x => { const c = el('article', 'mini-card'); const a = el('p'); a.append(el('b', '', t('g.do') + ' '), document.createTextNode(pick(x.a.th, x.a.en))); const n = el('p', 'fineprint'); n.append(el('b', '', t('g.no') + ' '), document.createTextNode(pick(x.no.th, x.no.en))); c.append(el('h3', '', pick(x.q.th, x.q.en)), a, n); faq.append(c); });
  const s3 = el('section', 'ritual-card glass wide is-visible'); s3.append(el('h2', '', t('g.faq')), faq);
  const s4 = el('section', 'ritual-card glass wide is-visible'); s4.append(el('h2', '', t('g.safe')));
  const ul = el('ul', 'answer-list'); GUIDE.safety.forEach(x => ul.append(el('li', '', pick(x.th, x.en)))); s4.append(ul);
  body.append(s1, s2, s3, s4);
}

// ---- life timeline ---------------------------------------------------------
function renderLifeInto(parent, data) {
  const wrap = el('div', 'life-line');
  data.rows.forEach(row => {
    const article = el('article', `life-row emphasis-${row.emphasis}`);
    article.append(el('span', 'life-dot'));
    const head = el('header'); head.append(el('strong', '', `${row.start.slice(0, 4)}–${row.end.slice(0, 4)}`), el('span', 'life-badge', t('lf.e.' + row.emphasis)));
    article.append(head);
    const lord = planetName(row.dasha.lord);
    article.append(el('p', 'life-dasha', t('lf.dasha', { lord, from: row.dasha.start.slice(0, 4), to: row.dasha.end.slice(0, 4), theme: pick(row.dasha.themeTh, row.dasha.themeEn) })));
    if (row.contacts.length) { const list = el('ul', 'answer-list'); row.contacts.forEach(c => list.append(el('li', '', pick(c.textTh, c.textEn)))); article.append(list); }
    else article.append(el('p', 'fineprint', t('lf.quiet')));
    wrap.append(article);
  });
  parent.append(wrap);
  parent.append(el('p', 'fineprint', pick(data.whyTh, data.why)));
  parent.append(el('p', 'fineprint', pick(data.limitsTh, data.limits)));
  observeReveals();
}
function renderLife() {
  const out = $('life-result'); out.replaceChildren();
  if (!lastLife) { out.classList.add('hidden'); return; }
  out.classList.remove('hidden', 'error-message'); renderLifeInto(out, lastLife);
}
async function loadLife() {
  $('life-needs').classList.add('hidden');
  if (!profileContext) { $('life-needs').classList.remove('hidden'); return; }
  const out = $('life-result'); out.classList.remove('hidden', 'error-message'); out.textContent = t('lf.wait');
  try {
    lastLife = await postJson('/api/life-timeline', { birthProfile: profileContext, date: localDate(), timezone: localTimezone, years: Number($('life-years').value), topic: $('life-topic').value });
    renderLife();
  } catch (error) { showError(out, error); }
}

// ---- birth chart -----------------------------------------------------------
function populateCities() {
  const select = $('birth-city'); select.replaceChildren();
  select.append(new Option(t('ob.city.pick'), ''));
  CITIES.forEach(([id, th, en]) => select.append(new Option(isTh() ? th : en, id)));
  select.append(new Option(t('ob.city.other'), 'other'));
  select.value = state.city || '';
}
$('birth-city').addEventListener('change', event => {
  const city = CITIES.find(c => c[0] === event.target.value); state.city = event.target.value; saveState();
  if (city) { $('birth-lat').value = city[3]; $('birth-lon').value = city[4]; $('birth-timezone').value = 'Asia/Bangkok'; }
});
function birthPayload() {
  if (!$('birth-consent').checked) throw new Error(t('ob.err.consent'));
  state.timeUnknown = $('birth-time-unknown').checked; saveState();
  const birthDate = $('birth-date').value, birthTime = state.timeUnknown ? '12:00' : $('birth-time').value;
  const latitude = Number($('birth-lat').value), longitude = Number($('birth-lon').value);
  if (!birthDate || !birthTime || !$('birth-lat').value || !$('birth-lon').value || !Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error(t('ob.err.fields'));
  return { birthDate, birthTime, timezone: $('birth-timezone').value.trim() || localTimezone, latitude, longitude };
}
function renderChartResult() {
  if (!lastChart) return;
  const { data, kind } = lastChart;
  const box = $('profile-result'); box.replaceChildren(); box.classList.remove('hidden', 'error-message');
  const header = el('div', 'chart-result-head'); header.append(el('h2', '', kind === 'western' ? t('ch.western') : t('ch.vedic')), el('span', 'method-badge', data.methodologyVersion)); box.append(header);
  const summary = kind === 'western' && state.timeUnknown ? t('ch.sum.w0') : kind === 'western'
    ? t('ch.sum.w', { asc: signName(data.placements.find(p => p.body === 'Ascendant')?.sign), mc: signName(data.placements.find(p => p.body === 'Midheaven')?.sign) })
    : t('ch.sum.v', { sign: signName(data.natal.moon.sign), nak: data.natal.moon.nakshatra, pada: data.natal.moon.pada, lord: planetName(data.currentMahadasha.lord), from: data.currentMahadasha.start, to: data.currentMahadasha.end });
  box.append(el('p', '', summary));
  const table = el('div', 'placement-grid');
  (kind === 'western' ? data.placements : data.natal.placements).filter(point => !state.timeUnknown || !['Ascendant', 'Midheaven'].includes(point.body)).forEach(point => { const cell = el('div', 'placement'); cell.append(el('span', '', planetName(point.body)), el('strong', '', `${signName(point.sign)} ${point.degree}°`)); table.append(cell); });
  box.append(table);
  if (kind === 'vedic') {
    box.append(el('p', 'period-pill', `${planetName(data.currentMahadasha.lord)}: ${data.currentMahadasha.theme}`));
    const next = el('div', 'upcoming-list'); data.upcomingMahadashas.forEach(p => next.append(el('span', '', `${planetName(p.lord)} · ${p.start}–${p.end}`))); box.append(next);
    box.append(el('p', 'fineprint', data.convention.precisionNote));
  } else if (data.aspects.length) {
    box.append(el('p', 'fineprint', t('ch.aspects') + ' ' + data.aspects.slice(0, 8).map(a => `${planetName(a.first)} ${a.type} ${planetName(a.second)} (${a.orb}°)`).join(' · ')));
  }
  if (state.timeUnknown) box.append(el('p', 'fineprint', t('ch.timeUnknown')));
  box.append(el('p', 'fineprint', (data.limitations || [data.reading]).join(' ')));
  refreshSummary();
}
async function calculateChart(kind) {
  const box = $('profile-result'); box.classList.remove('hidden', 'error-message'); box.textContent = t('ch.wait');
  try {
    profileContext = birthPayload();
    lastChart = { kind, data: await postJson(kind === 'western' ? '/api/natal-chart' : '/api/vedic-timing', profileContext) };
    renderChartResult();
  } catch (error) { showError(box, error); }
}

// ---- Tarot: fan-pick, then a server-side random draw ----------------------------------
let lastTarot = null, fanPicks = [], tarotBusy = false;
const currentSpread = () => document.querySelector('input[name="spread"]:checked')?.value || 'general';
function renderFan() {
  const fan = $('tarot-fan'); if (!fan) return;
  const need = spreadCount(currentSpread());
  $('fan-hint').textContent = t('fan.hint', { n: need });
  fan.replaceChildren();
  for (let i = 0; i < 12; i++) {
    const b = el('button', `fan-card${fanPicks.includes(i) ? ' picked' : ''}`, '✦'); b.type = 'button';
    b.setAttribute('aria-label', t('fan.pick', { i: i + 1 })); b.setAttribute('aria-pressed', String(fanPicks.includes(i)));
    b.addEventListener('click', () => {
      if (tarotBusy) return;
      if (fanPicks.includes(i)) fanPicks = fanPicks.filter(x => x !== i);
      else if (fanPicks.length < need) fanPicks.push(i);
      renderFan();
      if (fanPicks.length === need) renderTarot();
    });
    fan.append(b);
  }
}
async function renderTarot() {
  const key = currentSpread();
  const question = $('tarot-question').value.trim();
  if (!question) { $('tarot-question').focus(); fanPicks = []; renderFan(); return; }
  tarotBusy = true;
  $('tarot-empty').classList.add('hidden'); $('tarot-reading').classList.remove('hidden'); $('tarot-cards').textContent = t('tr.wait');
  try { lastTarot = { key, answer: (await postJson('/api/ask', { question, method: 'tarot', spread: key, date: localDate(), timezone: localTimezone, lang: getLang() })).answer }; }
  catch (error) { $('tarot-cards').textContent = error.message; tarotBusy = false; return; }
  tarotBusy = false; fanPicks = []; renderFan(); paintTarot();
}
function paintTarot() {
  if (!lastTarot) return;
  const { key, answer } = lastTarot, cards = answer.cards;
  $('spread-name').textContent = `03 / ${key.toUpperCase()} · ${t('tr.count', { n: cards.length })}`;
  $('tarot-cards').replaceChildren();
  cards.forEach(card => {
    const button = el('button', 'tarot-card'); button.type = 'button';
    button.setAttribute('aria-label', t('tr.reveal', { role: pick(card.roleTh, card.role) }));
    const back = el('span', 'tarot-card-back', '✶'), face = el('span', 'tarot-card-face');
    face.append(el('small', '', card.id.slice(0, 2).toUpperCase()), el('strong', '', pick(card.nameTh, card.name)), el('em', '', pick(card.interpretationTh, card.interpretation)));
    button.append(back, face);
    const wrapper = el('div', 'tarot-card-wrap'); wrapper.append(button, el('span', 'tarot-role', pick(card.roleTh, card.role))); $('tarot-cards').append(wrapper);
    button.addEventListener('click', () => { button.classList.toggle('revealed'); button.setAttribute('aria-label', `${pick(card.roleTh, card.role)}: ${pick(card.nameTh, card.name)}`); });
  });
  $('tarot-possibility').textContent = answer.message || answer.possibleDevelopment;
  $('tarot-action').textContent = pick(answer.actionTh, answer.action);
}

// ---- I Ching: the cast is fixed first, then revealed one line per toss -----------------
function paintIChing() {
  const { data, shown } = ichingState, box = $('iching-lines'); box.replaceChildren();
  for (let i = 0; i < shown; i++) {
    const line = data.lines[i], row = el('div', `ic-line ${line.kind}${line.changing ? ' changing' : ''}`);
    if (line.kind === 'yang') row.append(el('span', 'bar full')); else row.append(el('span', 'bar half'), el('span', 'bar half'));
    box.append(row);
  }
  $('iching-status').textContent = !data ? '' : shown < 6 ? t('ic.status', { n: shown }) : t('ic.done');
  $('iching-cast-label').textContent = !data ? t('ic.cast') : shown < 6 ? t('ic.toss', { n: shown + 1 }) : t('ic.done');
}
async function castIChing() {
  const question = $('iching-question').value.trim(), result = $('iching-result');
  if (!question) { $('iching-question').focus(); return; }
  if (!ichingState.data) {
    result.classList.remove('hidden', 'error-message'); result.textContent = t('ic.wait');
    try { ichingState = { data: (await postJson('/api/ask', { question, method: 'iching', lang: getLang() })).answer, shown: 0 }; }
    catch (error) { showError(result, error); return; }
    result.classList.add('hidden');
  }
  if (ichingState.shown < 6) ichingState.shown++;
  paintIChing();
  if (ichingState.shown === 6) { result.classList.remove('hidden'); renderAnswer(result, { route: { method: 'iching', intent: 'decision' }, answer: ichingState.data }); }
}
function resetIChing() { ichingState = { data: null, shown: 0 }; $('iching-lines').replaceChildren(); $('iching-status').textContent = ''; $('iching-result').classList.add('hidden'); $('iching-cast-label').textContent = t('ic.cast'); }

// ---- onboarding wizard -------------------------------------------------------------------
function renderInterests() {
  const box = $('interests'); box.replaceChildren();
  const chosen = new Set(state.interests || []);
  INTERESTS.forEach(([id]) => {
    const b = el('button', `chip${chosen.has(id) ? ' on' : ''}`, t('int.' + id)); b.type = 'button'; b.setAttribute('aria-pressed', String(chosen.has(id)));
    b.addEventListener('click', () => { chosen.has(id) ? chosen.delete(id) : chosen.add(id); state.interests = [...chosen]; saveState(); applyInterests(); renderInterests(); });
    box.append(b);
  });
}
function applyInterests() {
  const first = (state.interests || []).map(id => TOPIC_OF[id]).find(topic => topic !== 'general');
  if (first) $('period-topic').value = first;
  document.querySelectorAll('[data-period-topic]').forEach(btn => btn.classList.toggle('is-interest', (state.interests || []).some(id => TOPIC_OF[id] === btn.dataset.periodTopic)));
}
function renderWizard() {
  document.querySelectorAll('.ob-step').forEach(node => node.classList.toggle('active', Number(node.dataset.step) === obStep));
  $('ob-step-label').textContent = t('ob.step', { n: obStep });
  $('ob-title').textContent = t('ob.t' + obStep); $('ob-sub').textContent = t('ob.s' + obStep);
  [...$('ob-dots').children].forEach((dot, i) => dot.classList.toggle('on', i < obStep));
  $('ob-back').style.visibility = obStep === 1 ? 'hidden' : 'visible';
  $('ob-next').style.display = obStep === 5 ? 'none' : '';
  $('birth-time').disabled = $('birth-time-unknown').checked;
}
function nextStep() {
  if (obStep === 1 && !$('birth-date').value) { $('birth-date').focus(); $('birth-date').setCustomValidity(t('ob.err.date')); $('birth-date').reportValidity(); return; }
  $('birth-date').setCustomValidity('');
  if (obStep === 3 && (!$('birth-lat').value || !$('birth-lon').value)) { $('birth-city').focus(); $('birth-city').setCustomValidity(t('ob.err.place')); $('birth-city').reportValidity(); return; }
  $('birth-city').setCustomValidity('');
  obStep = Math.min(5, obStep + 1); renderWizard();
}

// ---- wiring ----------------------------------------------------------------
$('guest-start').addEventListener('click', () => start(null));
$('tarot-start').addEventListener('click', () => show('tarot'));
$('ask-start').addEventListener('click', () => show('ask'));
$('nav-home').addEventListener('click', event => { event.preventDefault(); show('home'); });
$('nav-daily').addEventListener('click', () => start(state.sign || null));
$('nav-tarot').addEventListener('click', () => show('tarot'));
$('nav-ask').addEventListener('click', () => show('ask'));
$('nav-life').addEventListener('click', () => { show('life'); $('life-needs').classList.toggle('hidden', !!profileContext); });
$('nav-ritual').addEventListener('click', () => show('ritual'));
$('story-onboard').addEventListener('click', () => show('onboard'));
$('story-daily').addEventListener('click', () => start(state.sign || null));
$('story-last-daily').addEventListener('click', () => start(state.sign || null));
$('story-iching').addEventListener('click', () => show('iching'));
$('story-life').addEventListener('click', () => { show('life'); $('life-needs').classList.toggle('hidden', !!profileContext); });
$('story-ritual').addEventListener('click', () => show('ritual'));
$('nav-iching').addEventListener('click', () => show('iching'));
$('nav-chart').addEventListener('click', () => show('onboard'));
document.querySelectorAll('.mobile-nav [data-go]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.go === 'daily') { start(state.sign || null); return; }
  show(button.dataset.go); if (button.dataset.go === 'life') $('life-needs').classList.toggle('hidden', !!profileContext);
}));
$('dashboard-ask').addEventListener('click', () => show('ask'));
$('dashboard-tarot').addEventListener('click', () => show('tarot'));
$('onboard-guest').addEventListener('click', () => { profileContext = null; start(null); });
$('profile-toggle').addEventListener('click', () => show('onboard'));
$('western-chart').addEventListener('click', () => calculateChart('western'));
$('vedic-chart').addEventListener('click', () => calculateChart('vedic'));
$('to-life').addEventListener('click', async () => { try { profileContext = birthPayload(); show('life'); await loadLife(); } catch (error) { showError($('profile-result'), error); } });
$('life-load').addEventListener('click', loadLife);
$('life-to-onboard').addEventListener('click', () => show('onboard'));
$('ritual-load').addEventListener('click', loadRitual);
$('oracle-submit').addEventListener('click', () => askOracle());
$('oracle-question').addEventListener('keydown', event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) askOracle(); });
document.querySelectorAll('.ask-suggestions button').forEach(button => button.addEventListener('click', () => { $('oracle-question').value = questionText(button.dataset.question); $('oracle-question').focus(); }));
document.querySelectorAll('.bento-tile').forEach(tile => tile.addEventListener('click', () => { show('ask'); $('oracle-question').value = questionText(tile.dataset.q); askOracle('auto'); }));
$('tarot-question').addEventListener('input', event => {
  const text = event.target.value.toLowerCase();
  const suggested = /\b(interview|job|work|career|study|school|exam)\b|งาน|สัมภาษณ์|เรียน|สอบ/.test(text) ? 'career' : /\b(ex|love|partner|relationship|dating)\b|แฟน|คนเก่า|ความรัก/.test(text) ? 'relationship' : null;
  if (suggested && !document.querySelector('input[name="spread"]:checked')?.dataset.manual) document.querySelector(`input[name="spread"][value="${suggested}"]`).checked = true;
});
document.querySelectorAll('input[name="spread"]').forEach(input => input.addEventListener('change', () => { input.dataset.manual = 'true'; }));
$('why-open').addEventListener('click', () => show('why'));
$('back-daily').addEventListener('click', () => show('daily'));
$('reflect-open').addEventListener('click', () => show('reflect'));
$('skip-reflection').addEventListener('click', () => show('daily'));
$('footer-home').addEventListener('click', () => show('home'));
$('clear-data').addEventListener('click', () => {
  try { localStorage.removeItem(storeKey); } catch { /* ignore */ }
  state = {}; reading = null; profileContext = null; lastPeriod = lastLife = lastRitual = lastChart = lastTarot = summaryRitual = null; thread = []; fanPicks = []; resetIChing(); renderThread(); renderSummary();
  for (const id of ['birth-date', 'birth-lat', 'birth-lon', 'tarot-question', 'oracle-question', 'ritual-birth']) $(id).value = '';
  $('birth-time').value = '12:00'; $('birth-time-unknown').checked = false; $('birth-consent').checked = false; $('birth-city').value = ''; obStep = 1; renderWizard(); renderInterests();
  show('home');
});
$('period-load').addEventListener('click', () => loadPeriod());
document.querySelectorAll('[data-period-topic]').forEach(button => button.addEventListener('click', () => { $('period-topic').value = button.dataset.periodTopic; loadPeriod(); }));
$('draw-tarot').addEventListener('click', renderTarot);
$('draw-again').addEventListener('click', renderTarot);
$('footer-guide').addEventListener('click', () => show('guide'));
$('ob-next').addEventListener('click', nextStep);
$('ob-back').addEventListener('click', () => { obStep = Math.max(1, obStep - 1); renderWizard(); });
$('birth-time-unknown').addEventListener('change', () => { state.timeUnknown = $('birth-time-unknown').checked; saveState(); renderWizard(); });
document.querySelectorAll('input[name="spread"]').forEach(input => input.addEventListener('change', () => { fanPicks = []; renderFan(); }));
$('iching-cast').addEventListener('click', castIChing);
$('iching-reset').addEventListener('click', resetIChing);
$('feedback-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!reading) return;
  state.feedback = { relevance: Number(document.querySelector('input[name="relevance"]:checked')?.value || 0), usefulness: Number(document.querySelector('input[name="usefulness"]:checked')?.value || 0), note: $('reflection-note').value.trim().slice(0, 500), readingKey: state.readingKey };
  saveState(); $('saved-message').textContent = t('r.saved');
});

// ---- language ----------------------------------------------------------------
function rerenderForLanguage() {
  populateCities(); renderReading(); renderPeriod(); renderLife(); renderRitual(); renderChartResult(); paintTarot(); renderFan(); renderWizard(); renderInterests(); renderSummary(); renderGuide(); paintIChing(); renderDailyCaution();
  renderThread(); reaskThread();
  $('birth-timezone').placeholder = localTimezone;
}
function switchLang(lang) {
  setLang(lang);
  $('lang-th').setAttribute('aria-pressed', String(lang === 'th')); $('lang-en').setAttribute('aria-pressed', String(lang === 'en'));
  rerenderForLanguage();
}
$('lang-th').addEventListener('click', () => switchLang('th'));
$('lang-en').addEventListener('click', () => switchLang('en'));

// ---- init ------------------------------------------------------------------
$('birth-timezone').value = localTimezone;
initI18n(state.lang === 'en' ? 'en' : 'th');
$('lang-th').setAttribute('aria-pressed', String(getLang() === 'th')); $('lang-en').setAttribute('aria-pressed', String(getLang() === 'en'));
$('lang-th').addEventListener('click', () => { state.lang = 'th'; saveState(); });
$('lang-en').addEventListener('click', () => { state.lang = 'en'; saveState(); });
populateCities();
if (state.timeUnknown) $('birth-time-unknown').checked = true;
renderWizard(); renderInterests(); applyInterests(); renderFan(); renderSummary();
observeReveals();
if (state.reading && state.readingKey?.endsWith(READING_KEY_VERSION)) { reading = state.reading; renderReading(); }
const hash = location.hash.slice(1);
if (reading && ['daily', 'why', 'reflect'].includes(hash)) show(hash);
else if (['tarot', 'ask', 'iching', 'onboard', 'life', 'ritual'].includes(hash)) show(hash);
