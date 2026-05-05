import {
  ComponentRegistry,
  MessageStore,
  DatabaseStore,
  ExtensionRegistry,
} from 'mailspring-exports';
import TranslationBodyHeader from './translation-body-header';
import LmStudioTranslationMessageExtension from './lmstudio-message-extension';
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
};

let _messageStoreUnsubscribe;
let _databaseStoreUnsubscribe;
let _dbPrefetchTimer;

function schedulePrefetchFromDb() {
  clearTimeout(_dbPrefetchTimer);
  _dbPrefetchTimer = setTimeout(() => {
    _dbPrefetchTimer = null;
    try {
      enqueuePrefetchForMessages(MessageStore.items());
    } catch (e) {
      if (AppEnv.reportError) {
        AppEnv.reportError(e);
      }
    }
  }, 350);
}

export function activate() {
  ExtensionRegistry.MessageView.register(LmStudioTranslationMessageExtension);

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

  _databaseStoreUnsubscribe = DatabaseStore.listen(schedulePrefetchFromDb);
}

export function deactivate() {
  clearPrefetchQueue();
  clearTimeout(_dbPrefetchTimer);
  _dbPrefetchTimer = null;
  if (_databaseStoreUnsubscribe) {
    _databaseStoreUnsubscribe();
    _databaseStoreUnsubscribe = null;
  }
  if (_messageStoreUnsubscribe) {
    _messageStoreUnsubscribe();
    _messageStoreUnsubscribe = null;
  }
  ComponentRegistry.unregister(TranslationBodyHeader);
  ExtensionRegistry.MessageView.unregister(LmStudioTranslationMessageExtension);
}

export function serialize() {}
