/**
 * LM Studio OpenAI-compatible API (default: http://127.0.0.1:1234)
 */

let cachedModelId = null;

/**
 * @param {string} baseUrl
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}
 */
export async function getDefaultModelId(baseUrl, signal) {
  if (cachedModelId) {
    return cachedModelId;
  }
  const r = await fetch(`${baseUrl}/v1/models`, { method: 'GET', signal });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || `GET /v1/models failed: ${r.status}`);
  }
  const j = await r.json();
  const id = j.data && j.data[0] && j.data[0].id;
  if (!id) {
    throw new Error('No model loaded in LM Studio. Load a model in LM Studio first.');
  }
  cachedModelId = id;
  return id;
}

/**
 * @param {string} baseUrl
 * @param {string} modelId
 * @param {Array<{ role: string, content: string }>} messages
 * @param {number} [maxTokens]
 * @param {AbortSignal} [signal]
 */
export async function chat(baseUrl, modelId, messages, maxTokens, signal) {
  const r = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens != null ? maxTokens : 4096,
      stream: false,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || `Chat failed: ${r.status}`);
  }
  const j = await r.json();
  const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  return (content || '').trim();
}

/**
 * @param {string} answer
 * @returns {'EN' | 'NL' | 'OTHER' | null}
 */
export function parseLanguageTag(answer) {
  const m = (answer || '').toUpperCase().match(/\b(EN|NL|OTHER)\b/);
  if (m) {
    return /** @type {'EN' | 'NL' | 'OTHER'} */ (m[1]);
  }
  return null;
}
