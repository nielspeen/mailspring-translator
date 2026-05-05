"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateBodyHtmlWithLmStudio = void 0;
const mailspring_exports_1 = require("mailspring-exports");
const lmstudio_client_1 = require("./lmstudio-client");
const html_utils_1 = require("./html-utils");
const plugin_config_1 = require("./plugin-config");
const MAX_HTML = 120000;
const CHAT_TOKENS = 8192;
/**
 * @param {'zh'|'ja'} targetLang
 * @param {string} bodyHtml
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} sanitized translated HTML
 */
async function translateBodyHtmlWithLmStudio(targetLang, bodyHtml, signal) {
    const baseUrl = (0, plugin_config_1.getLmstudioBaseUrl)();
    const modelId = await (0, lmstudio_client_1.getDefaultModelId)(baseUrl, signal);
    const { html: htmlIn } = (0, html_utils_1.truncateHtml)(bodyHtml, MAX_HTML);
    const raw = await (0, lmstudio_client_1.chat)(baseUrl, modelId, (0, lmstudio_client_1.buildTranslateHtmlMessages)(targetLang, htmlIn), CHAT_TOKENS, signal);
    const stripped = (0, lmstudio_client_1.stripHtmlFences)(raw);
    return mailspring_exports_1.SanitizeTransformer.run(stripped);
}
exports.translateBodyHtmlWithLmStudio = translateBodyHtmlWithLmStudio;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRlLXBpcGVsaW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RyYW5zbGF0ZS1waXBlbGluZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyREFBeUQ7QUFDekQsdURBSzJCO0FBQzNCLDZDQUE0QztBQUM1QyxtREFBcUQ7QUFFckQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDO0FBQ3hCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQztBQUV6Qjs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSw2QkFBNkIsQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU07SUFDOUUsTUFBTSxPQUFPLEdBQUcsSUFBQSxrQ0FBa0IsR0FBRSxDQUFDO0lBQ3JDLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBQSxtQ0FBaUIsRUFBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekQsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFBLHlCQUFZLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSxzQkFBSSxFQUNwQixPQUFPLEVBQ1AsT0FBTyxFQUNQLElBQUEsNENBQTBCLEVBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxFQUM5QyxXQUFXLEVBQ1gsTUFBTSxDQUNQLENBQUM7SUFDRixNQUFNLFFBQVEsR0FBRyxJQUFBLGlDQUFlLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEMsT0FBTyx3Q0FBbUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQWJELHNFQWFDIn0=