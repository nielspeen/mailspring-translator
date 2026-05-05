"use strict";
/**
 * Script-only detection for Chinese vs Japanese (no LLM).
 * Returns null for everything else (English, Dutch, Korean, etc.).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCjkTarget = void 0;
const RE_KANA = /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF\uFF65-\uFF9F]/; // Hiragana, Katakana, Katakana ext, half-width kana
/** CJK Unified Ideographs + common extension A slice used in email */
const RE_HAN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
const MIN_HAN_FOR_ZH = 2;
/**
 * @param {string} plainText visible text (HTML stripped)
 * @returns {null | 'zh' | 'ja'}
 */
function detectCjkTarget(plainText) {
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
exports.detectCjkTarget = detectCjkTarget;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2prLWRldGVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jamstZGV0ZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQUVILE1BQU0sT0FBTyxHQUNYLHdEQUF3RCxDQUFDLENBQUMsb0RBQW9EO0FBRWhILHNFQUFzRTtBQUN0RSxNQUFNLE1BQU0sR0FBRywyQ0FBMkMsQ0FBQztBQUUzRCxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFFekI7OztHQUdHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLFNBQVM7SUFDdkMsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDdEQsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUMzQixPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3pDLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbEIsUUFBUSxFQUFFLENBQUM7WUFDWCxJQUFJLFFBQVEsSUFBSSxjQUFjLEVBQUU7Z0JBQzlCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtLQUNGO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBckJELDBDQXFCQyJ9