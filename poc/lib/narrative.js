const unsafe = /\b(will definitely|guaranteed|must (quit|leave|invest|stop)|stop taking|diagnos(?:e|is)|buy stocks?|sell stocks?|die|death|curse|doomed|kill yourself)\b/i;

export function validateNarrative(candidate, fallback) {
  if (!candidate || typeof candidate.reading !== 'string' || typeof candidate.reflection_prompt !== 'string') return null;
  const reading = candidate.reading.trim(), prompt = candidate.reflection_prompt.trim();
  if (reading.length < 20 || reading.length > 230 || prompt.length < 10 || prompt.length > 120) return null;
  if (unsafe.test(`${reading} ${prompt}`)) return null;
  if (!/[?]$/.test(prompt)) return null;
  if (!/\b(may|might|could|consider|perhaps|try|notice)\b/i.test(reading)) return null;
  return { ...fallback, reading, reflectionPrompt: prompt };
}

export async function withNarrative(reading, { apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-4o-mini', fetcher = fetch } = {}) {
  if (!apiKey) return { ...reading, narrativeSource: 'approved template' };
  const fallback = reading.content;
  const input = {
    theme: reading.interpretation.theme,
    rule_id: reading.interpretation.ruleId,
    lunar_phase: reading.source.phase,
    approved_reading: fallback.reading,
    approved_action: fallback.action,
    approved_reflection_prompt: fallback.reflectionPrompt
  };
  try {
    const response = await fetcher('https://api.openai.com/v1/responses', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, store: false,
        instructions: 'You write brief, calm entertainment/reflection text. Rephrase only the approved_reading and approved_reflection_prompt. Preserve their meaning and uncertainty. Do not add any celestial facts, personal claims, predicted events, high-stakes advice, fear, or commands. The action and explanation are fixed by the application. Output the requested JSON fields only.',
        input: JSON.stringify(input),
        text: { format: { type: 'json_schema', name: 'daily_compass_narrative', strict: true, schema: { type: 'object', properties: { reading: { type: 'string' }, reflection_prompt: { type: 'string' } }, required: ['reading','reflection_prompt'], additionalProperties: false } } }
      })
    });
    if (!response.ok) throw new Error('LLM request failed');
    const payload = await response.json();
    if (payload.status !== 'completed') throw new Error('LLM response incomplete');
    const raw = payload.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('');
    const checked = validateNarrative(JSON.parse(raw), fallback);
    if (!checked) throw new Error('LLM output failed validation');
    return { ...reading, content: checked, narrativeSource: `OpenAI ${model}` };
  } catch {
    return { ...reading, narrativeSource: 'approved template fallback' };
  }
}
