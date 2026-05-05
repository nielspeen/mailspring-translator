"use strict";
/**
 * In-memory + localStorage cache for CJK→English HTML translations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCachedTranslation = exports.getCachedTranslation = exports.makeCacheKey = void 0;
const PREFIX = 'mailspring-lmstudio-translator:';
const MAX_ENTRIES = 80;
/** @type {Map<string, { targetLang: string, html: string }>} */
const memory = new Map();
function storageKey(cacheKey) {
    return PREFIX + cacheKey;
}
/**
 * @param {string} messageId
 * @param {string} bodyHtml raw message body for versioning
 */
function makeCacheKey(messageId, bodyHtml) {
    const h = simpleHash(typeof bodyHtml === 'string' ? bodyHtml : '');
    return `${messageId}:${h}`;
}
exports.makeCacheKey = makeCacheKey;
function simpleHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
}
function pruneStorage() {
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(PREFIX)) {
                keys.push(k);
            }
        }
        if (keys.length <= MAX_ENTRIES) {
            return;
        }
        keys.sort();
        const drop = keys.length - MAX_ENTRIES;
        for (let j = 0; j < drop; j++) {
            localStorage.removeItem(keys[j]);
        }
    }
    catch (e) {
        /* quota or disabled */
    }
}
/**
 * @returns {{ targetLang: 'zh'|'ja', html: string } | null}
 */
function getCachedTranslation(cacheKey) {
    if (memory.has(cacheKey)) {
        return memory.get(cacheKey);
    }
    try {
        const raw = localStorage.getItem(storageKey(cacheKey));
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (parsed && parsed.html && (parsed.targetLang === 'zh' || parsed.targetLang === 'ja')) {
            memory.set(cacheKey, parsed);
            return parsed;
        }
    }
    catch (e) {
        /* ignore */
    }
    return null;
}
exports.getCachedTranslation = getCachedTranslation;
/**
 * @param {string} cacheKey
 * @param {'zh'|'ja'} targetLang
 * @param {string} html sanitized translated HTML
 */
function setCachedTranslation(cacheKey, targetLang, html) {
    const rec = { targetLang, html };
    memory.set(cacheKey, rec);
    while (memory.size > MAX_ENTRIES) {
        const first = memory.keys().next().value;
        memory.delete(first);
    }
    try {
        localStorage.setItem(storageKey(cacheKey), JSON.stringify(rec));
        pruneStorage();
    }
    catch (e) {
        /* ignore */
    }
}
exports.setCachedTranslation = setCachedTranslation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb24tY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdHJhbnNsYXRpb24tY2FjaGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFSCxNQUFNLE1BQU0sR0FBRyxpQ0FBaUMsQ0FBQztBQUNqRCxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFFdkIsZ0VBQWdFO0FBQ2hFLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFFekIsU0FBUyxVQUFVLENBQUMsUUFBUTtJQUMxQixPQUFPLE1BQU0sR0FBRyxRQUFRLENBQUM7QUFDM0IsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFlBQVksQ0FBQyxTQUFTLEVBQUUsUUFBUTtJQUM5QyxNQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsT0FBTyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDN0IsQ0FBQztBQUhELG9DQUdDO0FBRUQsU0FBUyxVQUFVLENBQUMsQ0FBQztJQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNqQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzlDO0lBQ0QsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDaEMsQ0FBQztBQUVELFNBQVMsWUFBWTtJQUNuQixJQUFJO1FBQ0Ys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