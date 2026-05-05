import { MessageViewExtension } from 'mailspring-exports';
import { readIndex } from './mailspring-translation-storage';

/**
 * Applies translations stored in Mailspring’s localStorage keys on every body pass,
 * so new translations appear without reload (core translation keeps an in-memory index only).
 */
export default class LmStudioTranslationMessageExtension extends MessageViewExtension {
  static formatMessageBody({ message }) {
    const entries = readIndex();
    const entry = entries.find((o) => o.id === message.id);
    if (!entry || !entry.enabled) {
      return;
    }
    const html = window.localStorage.getItem(`translated-${message.id}`);
    if (typeof html === 'string' && html.length > 0) {
      message.body = html;
    }
  }
}
