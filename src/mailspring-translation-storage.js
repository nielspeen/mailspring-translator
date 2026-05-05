/**
 * Same contract as Mailspring core translation plugin:
 * - localStorage `translated-<messageId>` — HTML body
 * - localStorage `translated-index` — JSON array of { id, enabled, fromLang, toLang }
 * Max 150 entries; oldest removed from front when over capacity (matches core _onPersistTranslation).
 */

const INDEX_KEY = 'translated-index';
const MAX_INDEX = 150;

export function readIndex() {
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function writeIndex(entries) {
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

/** Same hash as former translation-cache for body-change detection */
export function hashMessageBody(bodyHtml) {
  const s = typeof bodyHtml === 'string' ? bodyHtml : '';
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/**
 * True if we already have LM-translated HTML for this exact body (same storage as core).
 * @param {{ id: string, body?: string }} message
 * @param {'zh'|'ja'} targetLang
 */
export function hasCurrentTranslation(message, targetLang) {
  if (!message || !message.id) {
    return false;
  }
  const list = readIndex();
  const entry = list.find((o) => o.id === message.id);
  if (!entry || !entry.enabled) {
    return false;
  }
  if (entry.fromLang !== targetLang) {
    return false;
  }
  const html = window.localStorage.getItem(`translated-${message.id}`);
  if (typeof html !== 'string' || !html.length) {
    return false;
  }
  const body = typeof message.body === 'string' ? message.body : '';
  const h = hashMessageBody(body);
  if (entry.bodyHash != null && entry.bodyHash !== h) {
    return false;
  }
  return true;
}

/**
 * Persist translated HTML using core keys. Optionally stores bodyHash (extra field) for LM plugin invalidation.
 *
 * @param message Mailspring Message (needs id, body)
 * @param {string} translatedHtml sanitized HTML
 * @param {{ fromLang: 'zh'|'ja', toLang: string }} meta toLang usually 'en'
 */
export function persistTranslatedBody(message, translatedHtml, meta) {
  const { fromLang, toLang } = meta;
  let list = readIndex().filter((o) => o.id !== message.id);

  if (list.length >= MAX_INDEX) {
    const element = list.shift();
    if (element && element.id) {
      window.localStorage.removeItem(`translated-${element.id}`);
    }
  }

  const body =
    message && typeof message.body === 'string' ? message.body : '';
  list.push({
    id: message.id,
    enabled: true,
    fromLang,
    toLang,
    bodyHash: hashMessageBody(body),
  });

  window.localStorage.setItem(`translated-${message.id}`, translatedHtml);
  writeIndex(list);
}
