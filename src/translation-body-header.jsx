import {
  React,
  PropTypes,
  localized,
  SanitizeTransformer,
} from 'mailspring-exports';
import { detectCjkTarget } from './cjk-detect';
import { makeCacheKey, getCachedTranslation, setCachedTranslation } from './translation-cache';
import {
  getDefaultModelId,
  chat,
  buildTranslateHtmlMessages,
  stripHtmlFences,
} from './lmstudio-client';
import { stripHtmlToText, truncateHtml } from './html-utils';
import {
  getLmstudioBaseUrl,
  getHideOriginalIframe,
} from './plugin-config';

const MAX_HTML = 120000;
const CHAT_TOKENS = 8192;

export default class TranslationBodyHeader extends React.Component {
  static displayName = 'TranslationBodyHeader';

  static propTypes = {
    message: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      status: 'idle',
      error: null,
      targetLang: null,
      translationHtml: null,
      originalSanitized: null,
      truncated: false,
      activeTab: 'english',
    };
    this._abort = null;
    this._rootRef = null;
  }

  componentDidMount() {
    this._run();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.message &&
      prevProps.message &&
      this.props.message.id !== prevProps.message.id
    ) {
      this._abortRun();
      this._setIframeVisible(true);
      this.setState({
        status: 'idle',
        error: null,
        targetLang: null,
        translationHtml: null,
        originalSanitized: null,
        truncated: false,
        activeTab: 'english',
      });
      this._run();
    }

    if (
      prevState.activeTab !== this.state.activeTab ||
      prevState.status !== this.state.status
    ) {
      this._syncIframeHide();
    }

    if (this.state.status === 'error') {
      this._setIframeVisible(true);
    }
  }

  componentWillUnmount() {
    this._abortRun();
    this._setIframeVisible(true);
  }

  _syncIframeHide() {
    if (!getHideOriginalIframe()) {
      this._setIframeVisible(true);
      return;
    }
    const hide =
      this.state.status === 'done' && this.state.activeTab === 'english';
    this._setIframeVisible(!hide);
  }

  _setIframeVisible(show) {
    const root = this._rootRef;
    if (!root) {
      return;
    }
    const span = root.parentElement;
    if (!span) {
      return;
    }
    const iframes = span.querySelectorAll('iframe');
    const iframe = iframes.length ? iframes[iframes.length - 1] : null;
    if (!iframe) {
      return;
    }
    const wrap = iframe.parentElement;
    if (!wrap) {
      return;
    }
    if (show) {
      if (wrap.dataset.lmstudioSavedDisplay !== undefined) {
        wrap.style.display = wrap.dataset.lmstudioSavedDisplay;
        delete wrap.dataset.lmstudioSavedDisplay;
      }
    } else {
      if (wrap.dataset.lmstudioSavedDisplay === undefined) {
        wrap.dataset.lmstudioSavedDisplay = wrap.style.display || '';
      }
      wrap.style.display = 'none';
    }
  }

  _abortRun() {
    if (this._abort) {
      this._abort.abort();
      this._abort = null;
    }
  }

  _run = async () => {
    const { message } = this.props;
    if (!message || typeof message.body !== 'string') {
      this.setState({ status: 'skip' });
      return;
    }

    const plain = stripHtmlToText(message.body).trim();
    const targetLang = detectCjkTarget(plain);
    if (!targetLang) {
      this.setState({ status: 'skip' });
      return;
    }

    const cacheKey = makeCacheKey(message.id, message.body);
    const cached = getCachedTranslation(cacheKey);
    const originalPromise = SanitizeTransformer.run(message.body);

    if (cached && cached.targetLang === targetLang) {
      try {
        const originalSanitized = await originalPromise;
        if (this.props.message.id !== message.id) {
          return;
        }
        this.setState({
          status: 'done',
          targetLang,
          translationHtml: cached.html,
          originalSanitized,
          truncated: false,
          error: null,
        });
      } catch (err) {
        if (this.props.message.id !== message.id) {
          return;
        }
        this.setState({ status: 'error', error: err.message || String(err) });
      }
      return;
    }

    this._abort = new AbortController();
    const signal = this._abort.signal;

    this.setState({
      status: 'loading',
      error: null,
      targetLang,
      translationHtml: null,
      originalSanitized: null,
    });

    const baseUrl = getLmstudioBaseUrl();
    let modelId;
    try {
      modelId = await getDefaultModelId(baseUrl, signal);
    } catch (err) {
      if (signal.aborted || (err && err.name === 'AbortError')) {
        return;
      }
      this.setState({ status: 'error', error: err.message || String(err) });
      return;
    }

    const { html: htmlIn, truncated } = truncateHtml(message.body, MAX_HTML);

    let raw;
    try {
      raw = await chat(
        baseUrl,
        modelId,
        buildTranslateHtmlMessages(targetLang, htmlIn),
        CHAT_TOKENS,
        signal
      );
    } catch (err) {
      if (signal.aborted || (err && err.name === 'AbortError')) {
        return;
      }
      this.setState({ status: 'error', error: err.message || String(err) });
      return;
    }

    if (signal.aborted) {
      return;
    }

    let translationHtml;
    let originalSanitized;
    try {
      const stripped = stripHtmlFences(raw);
      translationHtml = await SanitizeTransformer.run(stripped);
      originalSanitized = await originalPromise;
    } catch (err) {
      if (signal.aborted || (err && err.name === 'AbortError')) {
        return;
      }
      this.setState({ status: 'error', error: err.message || String(err) });
      return;
    }

    if (this.props.message.id !== message.id) {
      return;
    }

    setCachedTranslation(cacheKey, targetLang, translationHtml);

    this.setState({
      status: 'done',
      targetLang,
      translationHtml,
      originalSanitized,
      truncated,
      error: null,
    });
  };

  _onTabEnglish = () => {
    this.setState({ activeTab: 'english' });
  };

  _onTabOriginal = () => {
    this.setState({ activeTab: 'original' });
  };

  render() {
    const {
      status,
      error,
      targetLang,
      translationHtml,
      originalSanitized,
      truncated,
      activeTab,
    } = this.state;

    if (status === 'skip' || status === 'idle') {
      return null;
    }

    if (status === 'loading') {
      return (
        <div
          className="lmstudio-translator lmstudio-translator--loading"
          ref={(el) => {
            this._rootRef = el;
          }}
        >
          <span className="lmstudio-translator__label">
            {localized('Translation')}
          </span>
          <span className="lmstudio-translator__status">
            {localized('Translating with LM Studio…')}
          </span>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div
          className="lmstudio-translator lmstudio-translator--error"
          ref={(el) => {
            this._rootRef = el;
          }}
        >
          <span className="lmstudio-translator__label">
            {localized('Translation')}
          </span>
          <span className="lmstudio-translator__err">{error}</span>
        </div>
      );
    }

    if (status !== 'done' || !translationHtml) {
      return null;
    }

    const langLabel =
      targetLang === 'ja' ? localized('Japanese') : localized('Chinese');

    return (
      <div
        className="lmstudio-translator lmstudio-translator--result"
        ref={(el) => {
          this._rootRef = el;
        }}
      >
        <div className="lmstudio-translator__tabs">
          <button
            type="button"
            className={
              activeTab === 'english'
                ? 'lmstudio-translator__tab lmstudio-translator__tab--active'
                : 'lmstudio-translator__tab'
            }
            onClick={this._onTabEnglish}
          >
            {localized('English')}
          </button>
          <button
            type="button"
            className={
              activeTab === 'original'
                ? 'lmstudio-translator__tab lmstudio-translator__tab--active'
                : 'lmstudio-translator__tab'
            }
            onClick={this._onTabOriginal}
          >
            {localized('Original')} ({langLabel})
          </button>
        </div>

        {truncated ? (
          <div className="lmstudio-translator__trunc-note">
            {localized('Message was truncated for translation API')}
          </div>
        ) : null}

        {activeTab === 'english' ? (
          <div
            className="lmstudio-translator__html lmstudio-translator__scroll"
            dangerouslySetInnerHTML={{ __html: translationHtml }}
          />
        ) : (
          <div
            className="lmstudio-translator__html lmstudio-translator__scroll"
            dangerouslySetInnerHTML={{
              __html: originalSanitized || '',
            }}
          />
        )}
      </div>
    );
  }
}

TranslationBodyHeader.containerStyles = {
  order: 0,
  flexShrink: 0,
};
