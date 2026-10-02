const unsafe = /\b(will definitely|guaranteed|must (quit|leave|invest|stop)|stop taking|diagnos(?:e|is)|buy stocks?|sell stocks?|die|death|curse|doomed|kill yourself)\b/i;

const unsafeTh = /แน่นอน|รับประกัน|ฟันธง|ตายแน่|ต้อง(?:ลาออก|ลงทุน|หยุดยา|เลิก)|สาปแช่ง|คำสาป|หวย|เลขเด็ด/;
const hedgeTh = /อาจ|ลอง|น่าจะ|สังเกต|พิจารณา|บางที|ค่อย ๆ/;
const questionTh = /[?]$|ไหม|อะไร|อย่างไร|ตรงไหน|หรือไม่|บ้าง/;

/** Thai counterpart of validateNarrative: bounded length, hedged wording, no certainty or high-stakes terms. */
export function validateNarrativeTh(candidate, fallback) {
  if (!candidate || typeof candidate.reading !== 'string' || typeof candidate.reflection_prompt !== 'string') return null;
  const reading = candidate.reading.trim(), prompt = candidate.reflection_prompt.trim();
  if (reading.length < 20 || reading.length > 260 || prompt.length < 8 || prompt.length > 140) return null;
  if (!/[\u0e00-\u0e7f]/.test(reading) || !/[\u0e00-\u0e7f]/.test(prompt)) return null;
  if (unsafeTh.test(`${reading} ${prompt}`)) return null;
  if (!hedgeTh.test(reading) || !questionTh.test(prompt)) return null;
  return { ...fallback, reading, prompt };
}

export function validateNarrative(candidate, fallback) {
  if (!candidate || typeof candidate.reading !== 'string' || typeof candidate.reflection_prompt !== 'string') return null;
  const reading = candidate.reading.trim(), prompt = candidate.reflection_prompt.trim();
  if (reading.length < 20 || reading.length > 230 || prompt.length < 10 || prompt.length > 120) return null;
  if (unsafe.test(`${reading} ${prompt}`)) return null;
  if (!/[?]$/.test(prompt)) return null;
  if (!/\b(may|might|could|consider|perhaps|try|notice)\b/i.test(reading)) return null;
  return { ...fallback, reading, reflectionPrompt: prompt };
}

// The LLM may rephrase the approved text only when this user has switched AI wording on
// (consent === true). Without consent nothing leaves the server, whatever the environment says.
export async function withNarrative(reading, { consent = false, lang = 'en', apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-4o-mini', fetcher = fetch } = {}) {
  if (consent !== true || !apiKey) return { ...reading, narrativeSource: 'approved template' };
  const thai = lang === 'th' && reading.contentTh;
  const fallback = thai ? reading.contentTh : reading.content;
  const input = {
    theme: reading.interpretation.theme,
    rule_id: reading.interpretation.ruleId,
    lunar_phase: reading.source.phase,
    approved_reading: fallback.reading,
    approved_action: fallback.action,
    approved_reflection_prompt: thai ? fallback.prompt : fallback.reflectionPrompt
  };
  try {
    const response = await fetcher('https://api.openai.com/v1/responses', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, store: false,
        instructions: (thai ? 'Write natural, polite Thai. ' : '') + 'You write brief, calm entertainment/reflection text. Rephrase only the approved_reading and approved_reflection_prompt. Preserve their meaning and uncertainty. Do not add any celestial facts, personal claims, predicted events, high-stakes advice, fear, or commands. The action and explanation are fixed by the application. Output the requested JSON fields only.',
        input: JSON.stringify(input),
        text: { format: { type: 'json_schema', name: 'daily_compass_narrative', strict: true, schema: { type: 'object', properties: { reading: { type: 'string' }, reflection_prompt: { type: 'string' } }, required: ['reading','reflection_prompt'], additionalProperties: false } } }
      })
    });
    if (!response.ok) throw new Error('LLM request failed');
    const payload = await response.json();
    if (payload.status !== 'completed') throw new Error('LLM response incomplete');
    const raw = payload.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('');
    const checked = (thai ? validateNarrativeTh : validateNarrative)(JSON.parse(raw), fallback);
    if (!checked) throw new Error('LLM output failed validation');
    return thai ? { ...reading, contentTh: checked, narrativeSource: `OpenAI ${model}` } : { ...reading, content: checked, narrativeSource: `OpenAI ${model}` };
  } catch {
    return { ...reading, narrativeSource: 'approved template fallback' };
  }
}
