// King Wen order and upper/lower trigram pairs. English titles and short
// reflection prompts below are original product copy, not quoted translations.
const TRIGRAM = { Qian: 7, Kun: 0, Zhen: 1, Xun: 6, Kan: 2, Li: 5, Gen: 4, Dui: 3 };
const LINE_LENSES = [
  { phase: 'starting conditions', prompt: 'What assumption or resource is shaping the starting point?' },
  { phase: 'early participation', prompt: 'What would a thoughtful first contribution look like?' },
  { phase: 'friction and limits', prompt: 'Where might effort exceed the available support?' },
  { phase: 'adjustment', prompt: 'What feedback could help you change course?' },
  { phase: 'influence and responsibility', prompt: 'How can you use influence with care?' },
  { phase: 'completion or excess', prompt: 'What should be completed, released or kept within bounds?' }
];

const KING_WEN = [
  ['乾','Qian','The Creative','Initiative and sustained effort','Qian','Qian'],
  ['坤','Kun','The Receptive','Patience, support and responsiveness','Kun','Kun'],
  ['屯','Zhun','Difficulty at the Beginning','Early effort and finding support','Kan','Zhen'],
  ['蒙','Meng','Youthful Folly','Learning through questions and guidance','Gen','Kan'],
  ['需','Xu','Waiting','Preparation while conditions develop','Kan','Qian'],
  ['訟','Song','Conflict','Clarify interests and avoid needless escalation','Qian','Kan'],
  ['師','Shi','The Army','Coordination, discipline and shared responsibility','Kun','Kan'],
  ['比','Bi','Holding Together','Trust, cooperation and choosing allies','Kan','Kun'],
  ['小畜','Xiao Chu','Small Taming','Small restraints and gradual accumulation','Xun','Qian'],
  ['履','Lu','Treading','Careful conduct in a delicate situation','Qian','Dui'],
  ['泰','Tai','Peace','Exchange and cooperation between different sides','Kun','Qian'],
  ['否','Pi','Standstill','Limited exchange; conserve effort and reassess','Qian','Kun'],
  ['同人','Tong Ren','Fellowship','Shared purpose and honest collaboration','Qian','Li'],
  ['大有','Da You','Great Possession','Responsibility that comes with resources','Li','Qian'],
  ['謙','Qian','Modesty','Capability expressed with restraint','Kun','Gen'],
  ['豫','Yu','Enthusiasm','Energy that benefits from preparation','Zhen','Kun'],
  ['隨','Sui','Following','Adaptation while keeping considered values','Dui','Zhen'],
  ['蠱','Gu','Work on What Has Been Spoiled','Repairing inherited or neglected problems','Gen','Xun'],
  ['臨','Lin','Approach','Taking responsibility as influence grows','Kun','Dui'],
  ['觀','Guan','Contemplation','Observing before intervening','Xun','Kun'],
  ['噬嗑','Shi He','Biting Through','Addressing an obstacle with clear process','Li','Zhen'],
  ['賁','Bi','Grace','Presentation supported by substance','Gen','Li'],
  ['剝','Bo','Splitting Apart','Recognizing what is weakening and simplifying','Gen','Kun'],
  ['復','Fu','Return','A small renewed effort after a pause','Kun','Zhen'],
  ['無妄','Wu Wang','Innocence','Acting plainly without forcing an outcome','Qian','Zhen'],
  ['大畜','Da Chu','Great Taming','Building capacity before using it','Gen','Qian'],
  ['頤','Yi','Nourishment','Paying attention to what sustains you','Gen','Zhen'],
  ['大過','Da Guo','Great Exceeding','A load or transition that needs support','Dui','Xun'],
  ['坎','Kan','The Abysmal','Moving carefully through uncertainty','Kan','Kan'],
  ['離','Li','The Clinging','Clarity supported by what you depend on','Li','Li'],
  ['咸','Xian','Influence','Mutual responsiveness and respectful connection','Dui','Gen'],
  ['恆','Heng','Duration','Consistency and sustainable commitment','Zhen','Xun'],
  ['遯','Dun','Retreat','Creating space when pressure is rising','Qian','Gen'],
  ['大壯','Da Zhuang','Great Power','Using strength with restraint','Zhen','Qian'],
  ['晉','Jin','Progress','Making progress visible and useful','Li','Kun'],
  ['明夷','Ming Yi','Darkening of the Light','Protecting what matters in difficult conditions','Kun','Li'],
  ['家人','Jia Ren','The Family','Roles, care and clear agreements','Xun','Li'],
  ['睽','Kui','Opposition','Working with differences without erasing them','Li','Dui'],
  ['蹇','Jian','Obstruction','Pausing to find support or another route','Kan','Gen'],
  ['解','Jie','Deliverance','Releasing tension through a practical resolution','Zhen','Kan'],
  ['損','Sun','Decrease','Reducing excess to protect what is essential','Gen','Dui'],
  ['益','Yi','Increase','Adding effort where it can benefit others too','Xun','Zhen'],
  ['夬','Guai','Breakthrough','Making a necessary point clearly and responsibly','Dui','Qian'],
  ['姤','Gou','Coming to Meet','Responding thoughtfully to an unexpected encounter','Qian','Xun'],
  ['萃','Cui','Gathering Together','Organizing people around a shared purpose','Dui','Kun'],
  ['升','Sheng','Pushing Upward','Steady growth through preparation and support','Kun','Xun'],
  ['困','Kun','Oppression','Preserving judgment when resources feel limited','Dui','Kan'],
  ['井','Jing','The Well','Maintaining a shared source of support','Kan','Xun'],
  ['革','Ge','Revolution','Changing a structure when reasons are clear','Dui','Li'],
  ['鼎','Ding','The Cauldron','Transforming resources into something useful','Li','Xun'],
  ['震','Zhen','The Arousing','Responding to a jolt and regaining composure','Zhen','Zhen'],
  ['艮','Gen','Keeping Still','Knowing when to pause and hold a boundary','Gen','Gen'],
  ['漸','Jian','Development','Allowing progress to unfold in stages','Xun','Gen'],
  ['歸妹','Gui Mei','The Marrying Maiden','Examining expectations and unequal roles','Zhen','Dui'],
  ['豐','Feng','Abundance','Using a peak period wisely and noticing its limits','Zhen','Li'],
  ['旅','Lu','The Wanderer','Adapting respectfully in unfamiliar conditions','Li','Gen'],
  ['巽','Xun','The Gentle','Influence through patience and steady communication','Xun','Xun'],
  ['兌','Dui','The Joyous','Shared enjoyment and open exchange','Dui','Dui'],
  ['渙','Huan','Dispersion','Restoring connection when attention is scattered','Xun','Kan'],
  ['節','Jie','Limitation','Setting a useful boundary without excess','Kan','Dui'],
  ['中孚','Zhong Fu','Inner Truth','Building trust through consistency','Xun','Dui'],
  ['小過','Xiao Guo','Small Exceeding','Care with details and modest next steps','Zhen','Gen'],
  ['既濟','Ji Ji','After Completion','Maintaining attention after a task seems finished','Kan','Li'],
  ['未濟','Wei Ji','Before Completion','Staying careful while a transition remains unfinished','Li','Kan']
].map(([hanzi, pinyin, title, theme, upper, lower], index) => ({
  number: index + 1, unicode: String.fromCodePoint(0x4dc0 + index), hanzi, pinyin, title, theme,
  upperTrigram: upper, lowerTrigram: lower,
  key: (TRIGRAM[upper] << 3) | TRIGRAM[lower]
}));

const BY_KEY = new Map(KING_WEN.map(item => [item.key, item]));
if (KING_WEN.length !== 64 || BY_KEY.size !== 64) throw new Error('King Wen table must contain 64 unique trigram pairs');

export function identifyHexagram(lines) {
  if (!Array.isArray(lines) || lines.length !== 6 || lines.some(line => ![6, 7, 8, 9].includes(line))) throw new Error('Six line values of 6, 7, 8 or 9 are required');
  const primaryKey = lines.reduce((key, value, index) => key | ((value % 2 ? 1 : 0) << index), 0);
  const transformed = lines.map(value => value === 6 ? 7 : value === 9 ? 8 : value);
  const transformedKey = transformed.reduce((key, value, index) => key | ((value % 2 ? 1 : 0) << index), 0);
  const primary = BY_KEY.get(primaryKey), resulting = BY_KEY.get(transformedKey);
  if (!primary || !resulting) throw new Error('Hexagram mapping is incomplete');
  return {
    primary, resulting, transformedLines: transformed,
    changingLinePrompts: lines.flatMap((value, index) => value === 6 || value === 9 ? [{ position: index + 1, lens: LINE_LENSES[index].phase, prompt: LINE_LENSES[index].prompt }] : [])
  };
}

export const HEXAGRAMS = KING_WEN;
