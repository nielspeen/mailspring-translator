"use strict";
/**
 * Same contract as Mailspring core translation plugin:
 * - localStorage `translated-<messageId>` — HTML body
 * - localStorage `translated-index` — JSON array of { id, enabled, fromLang, toLang }
 * Max 150 entries; oldest removed from front when over capacity (matches core _onPersistTranslation).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistTranslatedBody = exports.hasCurrentTranslation = exports.hashMessageBody = exports.writeIndex = exports.readIndex = void 0;
const INDEX_KEY = 'translated-index';
const MAX_INDEX = 150;
function readIndex() {
    try {
        const raw = window.localStorage.getItem(INDEX_KEY);
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
    }
    catch (e) {
        return [];
    }
}
exports.readIndex = readIndex;
function writeIndex(entries) {
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}
exports.writeIndex = writeIndex;
/** Same hash as former translation-cache for body-change detection */
function hashMessageBody(bodyHtml) {
    const s = typeof bodyHtml === 'string' ? bodyHtml : '';
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
}
exports.hashMessageBody = hashMessageBody;
/**
 * True if we already have LM-translated HTML for this exact body (same storage as core).
 * @param {{ id: string, body?: string }} message
 * @param {'zh'|'ja'} targetLang
 */
function hasCurrentTranslation(message, targetLang) {
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
exports.hasCurrentTranslation = hasCurrentTranslation;
/**
 * Persist translated HTML using core keys. Optionally stores bodyHash (extra field) for LM plugin invalidation.
 *
 * @param message Mailspring Message (needs id, body)
 * @param {string} translatedHtml sanitized HTML
 * @param {{ fromLang: 'zh'|'ja', toLang: string }} meta toLang usually 'en'
 */
function persistTranslatedBody(message, translatedHtml, meta) {
    const { fromLang, toLang } = meta;
    let list = readIndex().filter((o) => o.id !== message.id);
    if (list.length >= MAX_INDEX) {
        const element = list.shift();
        if (element && element.id) {
            window.localStorage.removeItem(`translated-${element.id}`);
        }
    }
    const body = message && typeof message.body === 'string' ? message.body : '';
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
exports.persistTranslatedBody = persistTranslatedBody;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbHNwcmluZy10cmFuc2xhdGlvbi1zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haWxzcHJpbmctdHJhbnNsYXRpb24tc3RvcmFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7O0dBS0c7OztBQUVILE1BQU0sU0FBUyxHQUFHLGtCQUFrQixDQUFDO0FBQ3JDLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQztBQUV0QixTQUFnQixTQUFTO0lBQ3ZCLElBQUk7UUFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQztRQUN2QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQzVDO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixPQUFPLEVBQUUsQ0FBQztLQUNYO0FBQ0gsQ0FBQztBQVJELDhCQVFDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLE9BQU87SUFDaEMsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNsRSxDQUFDO0FBRkQsZ0NBRUM7QUFFRCxzRUFBc0U7QUFDdEUsU0FBZ0IsZUFBZSxDQUFDLFFBQVE7SUFDdEMsTUFBTSxDQUFDLEdBQUcsT0FBTyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUN2RCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFB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