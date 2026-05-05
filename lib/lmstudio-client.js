"use strict";
/**
 * LM Studio OpenAI-compatible API (default: http://127.0.0.1:1234)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripHtmlFences = exports.buildTranslateHtmlMessages = exports.chat = exports.getDefaultModelId = void 0;
let cachedModelId = null;
/**
 * @param {string} baseUrl
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}
 */
async function getDefaultModelId(baseUrl, signal) {
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
exports.getDefaultModelId = getDefaultModelId;
/**
 * @param {string} baseUrl
 * @param {string} modelId
 * @param {Array<{ role: string, content: string }>} messages
 * @param {number} [maxTokens]
 * @param {AbortSignal} [signal]
 */
async function chat(baseUrl, modelId, messages, maxTokens, signal) {
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
exports.chat = chat;
/**
 * @param {'zh' | 'ja'} targetLang
 * @param {string} htmlEmail
 * @returns {Array<{ role: string, content: string }>}
 */
function buildTranslateHtmlMessages(targetLang, htmlEmail) {
    const source = targetLang === 'ja'
        ? 'Japanese'
        : 'Chinese (Simplified, Traditional, or mixed)';
    return [
        {
            role: 'system',
            content: `You translate email HTML from ${source} to English. Preserve the HTML structure: keep all tags and attributes; translate only human-readable text in the body. Do not add html/code markdown fences. Output a single HTML fragment only, with no preamble or explanation.`,
        },
        {
            role: 'user',
            content: htmlEmail,
        },
    ];
}
exports.buildTranslateHtmlMessages = buildTranslateHtmlMessages;
/**
 * Strip markdown code fences if the model adds them.
 * @param {string} raw
 */
function stripHtmlFences(raw) {
    let s = (raw || '').trim();
    if (s.startsWith('```')) {
        s = s.replace(/^```[a-zA-Z]*\n?/, '');
        s = s.replace(/```\s*$/, '');
    }
    return s.trim();
}
exports.stripHtmlFences = stripHtmlFences;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG1zdHVkaW8tY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xtc3R1ZGlvLWNsaWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILElBQUksYUFBYSxHQUFHLElBQUksQ0FBQztBQUV6Qjs7OztHQUlHO0FBQ0ksS0FBSyxVQUFVLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxNQUFNO0lBQ3JELElBQUksYUFBYSxFQUFFO1FBQ2pCLE9BQU8sYUFBYSxDQUFDO0tBQ3RCO0lBQ0QsTUFBTSxDQUFDLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxPQUFPLFlBQVksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUN6RSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUNULE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3pCLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLDBCQUEwQixDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztLQUM1RDtJQUNELE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3pCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUMvQyxJQUFJLENBQUMsRUFBRSxFQUFFO1FBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxnRUFBZ0UsQ0FBQyxDQUFDO0tBQ25GO0lBQ0QsYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUNuQixPQUFPLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFoQkQsOENBZ0JDO0FBRUQ7Ozs7OztHQU1HO0FBQ0ksS0FBSyxVQUFVLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsTUFBTTtJQUN0RSxNQUFNLENBQUMsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLE9BQU8sc0JBQXNCLEVBQUU7UUFDdEQsTUFBTSxFQUFFLE1BQU07UUFDZCxPQUFPLEVBQUUsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUU7UUFDL0MsTUFBTTtRQUNOLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ25CLEtBQUssRUFBRSxPQUFPO1lBQ2QsUUFBUTtZQUNSLFdBQVcsRUFBRSxHQUFHO1lBQ2hCLFVBQVUsRUFBRSxTQUFTLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDaEQsTUFBTSxFQUFFLEtBQUs7U0FDZCxDQUFDO0tBQ0gsQ0FBQyxDQUFDO0lBQ0gsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDVCxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6QixNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7S0FDbEQ7SUFDRCxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN6QixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQ2xHLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDaEMsQ0FBQztBQXBCRCxvQkFvQkM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsMEJBQTBCLENBQUMsVUFBVSxFQUFFLFNBQVM7SUFDOUQsTUFBTSxNQUFNLEdBQ1YsVUFBVSxLQUFLLElBQUk7UUFDakIsQ0FBQyxDQUFDLFVBQVU7UUFDWixDQUFDLENBQUMsNkNBQTZDLENBQUM7SUFDcEQsT0FBTztRQUNMO1lBQ0UsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUUsaUNBQWlDLE1BQU0sb09BQW9PO1NBQ3JSO1FBQ0Q7WUFDRSxJQUFJLEVBQUUsTUFBTTtZQUNaLE9BQU8sRUFBRSxTQUFTO1NBQ25CO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFmRCxnRUFlQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLGVBQWUsQ0FBQyxHQUFHO0lBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzNCLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN2QixDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0QyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDOUI7SUFDRCxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNsQixDQUFDO0FBUEQsMENBT0MifQ==