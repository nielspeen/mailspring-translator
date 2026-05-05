"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearPrefetchQueue = exports.enqueuePrefetchForMessages = void 0;
const html_utils_1 = require("./html-utils");
const cjk_detect_1 = require("./cjk-detect");
const mailspring_translation_storage_1 = require("./mailspring-translation-storage");
const translate_pipeline_1 = require("./translate-pipeline");
const mailspring_exports_1 = require("mailspring-exports");
const plugin_config_1 = require("./plugin-config");
let _queue = [];
let _active = 0;
let _runTimer = null;
/** @type {Set<string>} */
const _inflight = new Set();
function scheduleDrain() {
    if (_runTimer) {
        return;
    }
    _runTimer = setTimeout(() => {
        _runTimer = null;
        drain();
    }, 0);
}
async function drain() {
    const concurrency = (0, plugin_config_1.getPrefetchConcurrency)();
    while (_active < concurrency && _queue.length) {
        const job = _queue.shift();
        if (!job) {
            break;
        }
        _active++;
        job()
            .catch(() => { })
            .finally(() => {
            _active--;
            scheduleDrain();
        });
    }
}
/**
 * @param {object} message full Message from MessageStore.items()
 * @param {'zh'|'ja'} targetLang
 * @param {string} inflightKey
 */
async function runTranslateJob(message, targetLang, inflightKey) {
    if ((0, mailspring_translation_storage_1.hasCurrentTranslation)(message, targetLang)) {
        return;
    }
    const sanitized = await (0, translate_pipeline_1.translateBodyHtmlWithLmStudio)(targetLang, message.body, undefined);
    (0, mailspring_translation_storage_1.persistTranslatedBody)(message, sanitized, {
        fromLang: targetLang,
        toLang: 'en',
    });
    try {
        mailspring_exports_1.MessageBodyProcessor.updateCacheForMessage(message);
    }
    catch (e) {
        if (AppEnv.reportError) {
            AppEnv.reportError(e);
        }
    }
}
function finishInflight(key) {
    _inflight.delete(key);
}
/**
 * @param {Array<object>} messages MessageStore.items()
 */
function enqueuePrefetchForMessages(messages) {
    if (!messages || !messages.length) {
        return;
    }
    for (const m of messages) {
        if (!m || typeof m.body !== 'string' || !m.body) {
            continue;
        }
        const plain = (0, html_utils_1.stripHtmlToText)(m.body).trim();
        const target = (0, cjk_detect_1.detectCjkTarget)(plain);
        if (!target) {
            continue;
        }
        if ((0, mailspring_translation_storage_1.hasCurrentTranslation)(m, target)) {
            continue;
        }
        const inflightKey = `${m.id}:${(0, mailspring_translation_storage_1.hashMessageBody)(m.body)}`;
        if (_inflight.has(inflightKey)) {
            continue;
        }
        _inflight.add(inflightKey);
        _queue.push(() => runTranslateJob(m, target, inflightKey).finally(() => finishInflight(inflightKey)));
    }
    scheduleDrain();
}
exports.enqueuePrefetchForMessages = enqueuePrefetchForMessages;
function clearPrefetchQueue() {
    _queue = [];
    _inflight.clear();
}
exports.clearPrefetchQueue = clearPrefetchQueue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmV0Y2gtcnVubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3ByZWZldGNoLXJ1bm5lci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBK0M7QUFDL0MsNkNBQStDO0FBQy9DLHFGQUFpSDtBQUNqSCw2REFBcUU7QUFDckUsMkRBQTBEO0FBQzFELG1EQUF5RDtBQUV6RCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ2hCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQztBQUNyQiwwQkFBMEI7QUFDMUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUU1QixTQUFTLGFBQWE7SUFDcEIsSUFBSSxTQUFTLEVBQUU7UUFDYixPQUFPO0tBQ1I7SUFDRCxTQUFTLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUMxQixTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLEtBQUssRUFBRSxDQUFDO0lBQ1YsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQztBQUVELEtBQUssVUFBVSxLQUFLO0lBQ2xCLE1BQU0sV0FBVyxHQUFHLElBQUEsc0NBQXNCLEdBQUUsQ0FBQztJQUM3QyxPQUFPLE9BQU8sR0FBRyxXQUFXLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtRQUM3QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNSLE1BQU07U0FDUDtRQUNELE9BQU8sRUFBRSxDQUFDO1FBQ1YsR0FBRyxFQUFFO2FBQ0YsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQzthQUNmLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDWixPQUFPLEVBQUUsQ0FBQztZQUNWLGFBQWEsRUFBRSxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUFDO0tBQ047QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILEtBQUssVUFBVSxlQUFlLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXO0lBQzdELElBQUksSUFBQSxzREFBcUIsRUFBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLEVBQUU7UUFDOUMsT0FBTztLQUNSO0lBRUQsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFBLGtEQUE2QixFQUNuRCxVQUFVLEVBQ1YsT0FBTyxDQUFDLElBQUksRUFDWixTQUFTLENBQ1YsQ0FBQztJQUVGLElBQUEsc0RBQXFCLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRTtRQUN4QyxRQUFRLEVBQUUsVUFBVTtRQUNwQixNQUFNLEVBQUUsSUFBSTtLQUNiLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRix5Q0FBb0IsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNyRDtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFO1lBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdkI7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxHQUFHO0lBQ3pCLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsMEJBQTBCLENBQUMsUUFBUTtJQUNqRCxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtRQUNqQyxPQUFPO0tBQ1I7SUFDRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLFFBQVEsRUFBRTtRQUN4QixJQUFJLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFO1lBQy9DLFNBQVM7U0FDVjtRQUNELE1BQU0sS0FBSyxHQUFHLElBQUEsNEJBQWUsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0MsTUFBTSxNQUFNLEdBQUcsSUFBQSw0QkFBZSxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxTQUFTO1NBQ1Y7UUFDRCxJQUFJLElBQUEsc0RBQXFCLEVBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ3BDLFNBQVM7U0FDVjtRQUNELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxJQUFBLGdEQUFlLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDekQsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzlCLFNBQVM7U0FDVjtRQUNELFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FDZixlQUFlLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQ25ELGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FDNUIsQ0FDRixDQUFDO0tBQ0g7SUFDRCxhQUFhLEVBQUUsQ0FBQztBQUNsQixDQUFDO0FBNUJELGdFQTRCQztBQUVELFNBQWdCLGtCQUFrQjtJQUNoQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ1osU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3BCLENBQUM7QUFIRCxnREFHQyJ9