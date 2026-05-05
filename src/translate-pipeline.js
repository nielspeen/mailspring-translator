import { SanitizeTransformer } from 'mailspring-exports';
import {
  getDefaultModelId,
  chat,
  buildTranslateHtmlMessages,
  stripHtmlFences,
} from './lmstudio-client';
import { truncateHtml } from './html-utils';
import { getLmstudioBaseUrl } from './plugin-config';

const MAX_HTML = 120000;
const CHAT_TOKENS = 8192;

/**
 * @param {'zh'|'ja'} targetLang
 * @param {string} bodyHtml
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} sanitized translated HTML
 */
export async function translateBodyHtmlWithLmStudio(targetLang, bodyHtml, signal) {
  const baseUrl = getLmstudioBaseUrl();
  const modelId = await getDefaultModelId(baseUrl, signal);
  const { html: htmlIn } = truncateHtml(bodyHtml, MAX_HTML);
  const raw = await chat(
    baseUrl,
    modelId,
    buildTranslateHtmlMessages(targetLang, htmlIn),
    CHAT_TOKENS,
    signal
  );
  const stripped = stripHtmlFences(raw);
  return SanitizeTransformer.run(stripped);
}
