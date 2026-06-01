import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function runsAtMostDaily(schedule = '') {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minute, hour] = parts;
  return minute !== '*' && !minute.includes('/') && hour !== '*' && !hour.includes('/');
}

test('vercel cron schedules are compatible with Hobby daily limit', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

  const crons = Array.isArray(config.crons) ? config.crons : [];
  for (const cron of crons) {
    assert.ok(runsAtMostDaily(cron.schedule), `${cron.path} uses ${cron.schedule}`);
  }
});
