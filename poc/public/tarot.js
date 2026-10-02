// Original short interpretations inspired by the Major Arcana.
// Historical reference: A. E. Waite, The Pictorial Key to the Tarot.
export const MAJOR_ARCANA = [
  ['fool','The Fool','new start','A beginning can be explored before every detail is known.'],
  ['magician','The Magician','agency','Use the skills and tools already within reach.'],
  ['priestess','The High Priestess','attention','Give yourself time to notice what is still unclear.'],
  ['empress','The Empress','care','Nurture what needs consistent attention.'],
  ['emperor','The Emperor','structure','Create a clear boundary or practical plan.'],
  ['hierophant','The Hierophant','guidance','A trusted teacher or shared practice may help.'],
  ['lovers','The Lovers','choice','Notice whether your choice fits your values.'],
  ['chariot','The Chariot','direction','Focus your effort on the part you can steer.'],
  ['strength','Strength','patience','Gentle persistence may serve you better than force.'],
  ['hermit','The Hermit','perspective','Step back long enough to hear your own view.'],
  ['wheel','Wheel of Fortune','change','Conditions can shift; prepare for more than one outcome.'],
  ['justice','Justice','fairness','Check the facts and consequences of each option.'],
  ['hanged','The Hanged Man','pause','A different angle may reveal another path.'],
  ['death','Death','transition','One chapter may be ending so another can begin.'],
  ['temperance','Temperance','balance','A measured approach may be more sustainable.'],
  ['devil','The Devil','attachment','Notice which habit or assumption limits your choice.'],
  ['tower','The Tower','disruption','If plans change, focus on your immediate next step.'],
  ['star','The Star','hope','Keep room for renewal while acting on what is real.'],
  ['moon','The Moon','uncertainty','Check impressions against facts before deciding.'],
  ['sun','The Sun','clarity','Name what is working and build on it.'],
  ['judgement','Judgement','review','Review what you have learned before moving forward.'],
  ['world','The World','completion','Recognize what is complete and what comes next.']
].map(([id,name,theme,meaning],number) => ({ id, name, theme, meaning, number }));

const SUITS = [
  { id: 'wands', name: 'Wands', element: 'fire', theme: 'initiative', domain: 'energy, creativity and work', nudge: 'start with a small experiment and review the result' },
  { id: 'cups', name: 'Cups', element: 'water', theme: 'connection', domain: 'feelings and relationships', nudge: 'name what you feel while respecting the other person’s boundaries' },
  { id: 'swords', name: 'Swords', element: 'air', theme: 'clarity', domain: 'thought, communication and challenge', nudge: 'check the facts and communicate one point clearly' },
  { id: 'pentacles', name: 'Pentacles', element: 'earth', theme: 'practice', domain: 'resources, study and everyday work', nudge: 'make a practical plan using the time and resources you have' }
];
const RANKS = [
  ['ace', 'Ace', 'potential', 'A new possibility may be available to explore'],
  ['two', 'Two', 'balance', 'A choice or pairing may need attention'],
  ['three', 'Three', 'collaboration', 'Progress may grow through practice or support'],
  ['four', 'Four', 'stability', 'A stable routine may help, though flexibility still matters'],
  ['five', 'Five', 'friction', 'A disagreement or adjustment may call for care'],
  ['six', 'Six', 'support', 'A helpful exchange or a lesson from experience may matter'],
  ['seven', 'Seven', 'discernment', 'Patience and a careful review may be useful'],
  ['eight', 'Eight', 'effort', 'Repeated effort can shape what happens next'],
  ['nine', 'Nine', 'independence', 'A near-complete effort may need boundaries and rest'],
  ['ten', 'Ten', 'completion', 'A cycle may be reaching a point to review or share its load'],
  ['page', 'Page', 'curiosity', 'A beginner’s question or message may open a useful perspective'],
  ['knight', 'Knight', 'momentum', 'A strong push may help if it is aimed deliberately'],
  ['queen', 'Queen', 'care', 'Steady, attentive leadership may be called for'],
  ['king', 'King', 'responsibility', 'A considered decision may require clear priorities']
];

// Original, compositional summaries informed by common Rider–Waite–Smith
// suit/rank conventions. These are product interpretations, not quotations.
export const MINOR_ARCANA = SUITS.flatMap(suit => RANKS.map(([id, name, rankTheme, rankMeaning], index) => ({
  id: `${id}-of-${suit.id}`, name: `${name} of ${suit.name}`,
  arcana: 'minor', suit: suit.id, element: suit.element, number: index + 1,
  theme: `${rankTheme} · ${suit.theme}`,
  meaning: `${rankMeaning} in ${suit.domain}. Consider whether it would help to ${suit.nudge}.`
})));

export const TAROT_DECK = [...MAJOR_ARCANA.map(card => ({ ...card, arcana: 'major' })), ...MINOR_ARCANA];

export const SPREADS = {
  general: { name: 'One card', roles: ['A perspective for this question'], action: 'Write down one practical next step that fits your situation.' },
  career: { name: 'Opportunity · Obstacle · Action', roles: ['Possible opportunity', 'Possible obstacle', 'What you can control'], action: 'If you are waiting after an interview, send a concise follow-up and keep other options open.' },
  study: { name: 'Focus · Challenge · Practice', roles: ['What deserves focus', 'What may interrupt progress', 'A study action you can take'], action: 'Choose one learning goal, work in a realistic time block and take a short break.' },
  money: { name: 'Resources · Pressure · Next step', roles: ['A resource to notice', 'A cost or pressure to review', 'A practical step'], action: 'Review actual costs and your budget before making a financial choice; this reading is not investment advice.' },
  timeline: { name: 'Past · Present · Direction', roles: ['Past influence', 'Present situation', 'A direction to consider'], action: 'Write one sentence connecting the three cards to your situation, then choose one step you control.' },
  relationship: { name: 'Present · Unresolved · Your choice', roles: ['Present dynamic', 'What may be unresolved', 'What you can control'], action: 'Consider your boundaries and communicate directly if it feels safe and appropriate.' }
};

export function randomIndex(max, cryptoApi = globalThis.crypto) {
  if (!Number.isInteger(max) || max < 1 || max > 0xffffffff) throw new Error('Invalid draw size');
  const limit = Math.floor(0x100000000 / max) * max;
  const value = new Uint32Array(1);
  do { cryptoApi.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % max;
}

export function drawCards(count, cryptoApi = globalThis.crypto, catalog = MAJOR_ARCANA) {
  if (!Array.isArray(catalog) || !Number.isInteger(count) || count < 1 || count > catalog.length) throw new Error('Invalid spread size');
  const available = [...catalog];
  const drawn = [];
  for (let i = 0; i < count; i++) drawn.push(available.splice(randomIndex(available.length, cryptoApi), 1)[0]);
  return drawn;
}
