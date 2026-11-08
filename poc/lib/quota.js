// Free-trial limits for the paid LLM calls. State is in memory: it is correct on one long-running
// process and only approximate on serverless (each instance counts alone), so production needs a
// shared store (see docs/decisions). The OpenAI dashboard spend limit is the real backstop.
const DEVICE_ID = /^[a-zA-Z0-9-]{16,64}$/;

export function createQuota({ perDevice = {}, dailyCalls = 200, now = () => new Date() } = {}) {
  const limits = { 'deep-reading': perDevice['deep-reading'] ?? 1, 'persona-chat': perDevice['persona-chat'] ?? 5 };
  let day = '', global = 0;
  const used = new Map();
  const roll = () => {
    const today = now().toISOString().slice(0, 10);
    if (today !== day) { day = today; global = 0; used.clear(); }
  };
  return {
    limits,
    /** Reserve one AI call. Returns { allowed, reason?, remaining }. Devices without a valid id get no free AI. */
    take(kind, deviceId) {
      roll();
      if (!(kind in limits)) throw new Error('Unknown quota kind');
      if (typeof deviceId !== 'string' || !DEVICE_ID.test(deviceId)) return { allowed: false, reason: 'no-device', remaining: 0 };
      if (global >= dailyCalls) return { allowed: false, reason: 'daily-budget', remaining: 0 };
      const key = `${kind}|${deviceId}`, count = used.get(key) || 0;
      if (count >= limits[kind]) return { allowed: false, reason: 'device-limit', remaining: 0 };
      used.set(key, count + 1); global++;
      return { allowed: true, remaining: limits[kind] - count - 1 };
    },
    /** Give a reservation back when the model was not actually called or its output was rejected. */
    refund(kind, deviceId) {
      const key = `${kind}|${deviceId}`, count = used.get(key) || 0;
      if (count > 0) { used.set(key, count - 1); global = Math.max(0, global - 1); }
    }
  };
}

export const quotaFromEnv = () => createQuota({
  perDevice: { 'deep-reading': Number(process.env.AI_FREE_READINGS) || undefined, 'persona-chat': Number(process.env.AI_FREE_CHAT_TURNS) || undefined },
  dailyCalls: Number(process.env.AI_DAILY_CALLS) || 200
});
