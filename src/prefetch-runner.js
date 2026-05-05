import { stripHtmlToText } from './html-utils';
import { detectCjkTarget } from './cjk-detect';
import { hashMessageBody, hasCurrentTranslation, persistTranslatedBody } from './mailspring-translation-storage';
import { translateBodyHtmlWithLmStudio } from './translate-pipeline';
import { MessageBodyProcessor } from 'mailspring-exports';
import { getPrefetchConcurrency } from './plugin-config';

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
  const concurrency = getPrefetchConcurrency();
  while (_active < concurrency && _queue.length) {
    const job = _queue.shift();
    if (!job) {
      break;
    }
    _active++;
    job()
      .catch(() => {})
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
  if (hasCurrentTranslation(message, targetLang)) {
    return;
  }

  const sanitized = await translateBodyHtmlWithLmStudio(
    targetLang,
    message.body,
    undefined
  );

  persistTranslatedBody(message, sanitized, {
    fromLang: targetLang,
    toLang: 'en',
  });

  try {
    MessageBodyProcessor.updateCacheForMessage(message);
  } catch (e) {
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
export function enqueuePrefetchForMessages(messages) {
  if (!messages || !messages.length) {
    return;
  }
  for (const m of messages) {
    if (!m || typeof m.body !== 'string' || !m.body) {
      continue;
    }
    const plain = stripHtmlToText(m.body).trim();
    const target = detectCjkTarget(plain);
    if (!target) {
      continue;
    }
    if (hasCurrentTranslation(m, target)) {
      continue;
    }
    const inflightKey = `${m.id}:${hashMessageBody(m.body)}`;
    if (_inflight.has(inflightKey)) {
      continue;
    }
    _inflight.add(inflightKey);
    _queue.push(() =>
      runTranslateJob(m, target, inflightKey).finally(() =>
        finishInflight(inflightKey)
      )
    );
  }
  scheduleDrain();
}

export function clearPrefetchQueue() {
  _queue = [];
  _inflight.clear();
}
