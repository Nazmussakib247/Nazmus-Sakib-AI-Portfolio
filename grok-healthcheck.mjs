import 'dotenv/config';

const apiUrl = process.env.AI_API_URL?.trim();
const apiKey = process.env.AI_API_KEY?.trim();
const model = process.env.AI_MODEL?.trim();
const endpoint = new URL('/v1/chat/completions', apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`).toString();
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, temperature: 0, max_completion_tokens: 80, messages: [{ role: 'user', content: 'Reply with exactly: GROK_OK' }] }),
  signal: AbortSignal.timeout(30000),
});
console.log(`status=${response.status}`);
const body = await response.text();
if (response.ok) {
  try {
    const data = JSON.parse(body);
    console.log(`model=${data.model || 'unknown'}`);
    console.log(`content=${data.choices?.[0]?.message?.content || 'empty'}`);
  } catch {
    console.log('response_parse=failed');
  }
} else {
  console.log(`error=${body.slice(0, 500).replace(/\s+/g, ' ')}`);
}
