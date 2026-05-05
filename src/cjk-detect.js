/**
 * Script-only detection for Chinese vs Japanese (no LLM).
 * Returns null for everything else (English, Dutch, Korean, etc.).
 */

const RE_KANA =
  /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF\uFF65-\uFF9F]/; // Hiragana, Katakana, Katakana ext, half-width kana

/** CJK Unified Ideographs + common extension A slice used in email */
const RE_HAN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

const MIN_HAN_FOR_ZH = 2;

/**
 * @param {string} plainText visible text (HTML stripped)
 * @returns {null | 'zh' | 'ja'}
 */
export function detectCjkTarget(plainText) {
  if (typeof plainText !== 'string' || !plainText.trim()) {
    return null;
  }

  if (RE_KANA.test(plainText)) {
    return 'ja';
  }

  let hanCount = 0;
  for (let i = 0; i < plainText.length; i++) {
    const c = plainText[i];
    if (RE_HAN.test(c)) {
      hanCount++;
      if (hanCount >= MIN_HAN_FOR_ZH) {
        return 'zh';
      }
    }
  }

  return null;
}
