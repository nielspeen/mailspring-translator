export function getLmstudioBaseUrl() {
  try {
    const v = AppEnv.config.get('mailspring-lmstudio-translator.lmstudioBaseUrl');
    if (v && typeof v === 'string') {
      return v.replace(/\/$/, '');
    }
  } catch (e) {
    /* ignore */
  }
  return 'http://127.0.0.1:1234';
}

export function getPrefetchConcurrency() {
  try {
    const n = AppEnv.config.get('mailspring-lmstudio-translator.prefetchConcurrency');
    const num = typeof n === 'number' ? n : parseInt(String(n), 10);
    if (num >= 1 && num <= 8) {
      return num;
    }
  } catch (e) {
    /* ignore */
  }
  return 2;
}
