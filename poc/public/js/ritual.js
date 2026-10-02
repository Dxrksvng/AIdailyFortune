import { api, profile, todayISO, TZ, renderDays } from './common.js';

async function load() {
  const birthDate = profile.get()?.birthDate;
  try { renderDays(await api('/api/ritual', { date: todayISO, timezone: TZ, ...(birthDate ? { birthDate } : {}) })); }
  catch (error) { document.querySelector('#postureLine').textContent = error.message; }
}
load();
addEventListener('dc:wiped', load);
