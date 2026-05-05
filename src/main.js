import { ComponentRegistry, MessageStore } from 'mailspring-exports';
import TranslationBodyHeader from './translation-body-header';
import {
  enqueuePrefetchForMessages,
  clearPrefetchQueue,
} from './prefetch-runner';

/**
 * Optional config (Preferences uses package name as namespace).
 */
export const config = {
  lmstudioBaseUrl: {
    type: 'string',
    default: 'http://127.0.0.1:1234',
    title: 'LM Studio base URL',
    description:
      'OpenAI-compatible API root (no trailing slash). LM Studio default is http://127.0.0.1:1234',
  },
  prefetchConcurrency: {
    type: 'number',
    default: 2,
    minimum: 1,
    maximum: 8,
    title: 'Prefetch concurrency',
    description:
      'Parallel LM Studio translation requests when prefetching the focused thread (Chinese/Japanese only).',
  },
  hideOriginalIframeWhenEnglishTab: {
    type: 'boolean',
    default: false,
    title: 'Hide built-in body when English tab is selected',
    description:
      'When enabled, hides Mailspring’s message iframe while the English translation tab is active (experimental).',
  },
};

let _messageStoreUnsubscribe;

export function activate() {
  ComponentRegistry.register(TranslationBodyHeader, {
    role: 'message:BodyHeader',
  });

  _messageStoreUnsubscribe = MessageStore.listen(() => {
    try {
      enqueuePrefetchForMessages(MessageStore.items());
    } catch (e) {
      if (AppEnv.reportError) {
        AppEnv.reportError(e);
      }
    }
  });

  try {
    enqueuePrefetchForMessages(MessageStore.items());
  } catch (e) {
    /* MessageStore may be empty at activation */
  }
}

export function deactivate() {
  clearPrefetchQueue();
  if (_messageStoreUnsubscribe) {
    _messageStoreUnsubscribe();
    _messageStoreUnsubscribe = null;
  }
  ComponentRegistry.unregister(TranslationBodyHeader);
}

export function serialize() {}
