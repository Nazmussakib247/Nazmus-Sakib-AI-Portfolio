import 'dotenv/config';
const base = process.env.AI_API_URL.replace(/\/$/, '');
const endpoint = `${base.endsWith('/v1') ? base : `${base}/v1`}/chat/completions`;
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: process.env.AI_MODEL, temperature: 0, max_tokens: 500, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Return JSON only.' }, { role: 'user', content: 'Return exactly {"collections":["projects"],"keywords":["Hirelay"]}.' }] }),
  signal: AbortSignal.timeout(30000),
});
console.log(`status=${response.status}`);
console.log((await response.text()).slice(0, 1800).replace(/\s+/g, ' '));
