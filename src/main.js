import { ComponentRegistry } from 'mailspring-exports';
import TranslationBodyHeader from './translation-body-header';

/**
 * Optional config (Preferences uses package name as namespace).
 * Defaults match LM Studio’s local server.
 */
export const config = {
  lmstudioBaseUrl: {
    type: 'string',
    default: 'http://127.0.0.1:1234',
    title: 'LM Studio base URL',
    description:
      'OpenAI-compatible API root (no trailing slash). LM Studio default is http://127.0.0.1:1234',
  },
};

export function activate() {
  ComponentRegistry.register(TranslationBodyHeader, {
    role: 'message:BodyHeader',
  });
}

export function deactivate() {
  ComponentRegistry.unregister(TranslationBodyHeader);
}

export function serialize() {}
