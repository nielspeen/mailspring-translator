import { React, PropTypes, localized } from 'mailspring-exports';
import { getDefaultModelId, chat, parseLanguageTag } from './lmstudio-client';

const MAX_CLASSIFY_CHARS = 6000;
const MAX_TRANSLATE_CHARS = 12000;

function getBaseUrl() {
  try {
    const v = AppEnv.config.get('mailspring-lmstudio-translator.lmstudioBaseUrl');
    if (v && typeof v === 'string') {
      return v.replace(/\/$/, '');
    }
  } catch (e) {
    /* config may be unavailable in edge cases */
  }
  return 'http://127.0.0.1:1234';
}

function stripHtmlToText(html) {
  if (typeof html !== 'string' || !html) {
    return '';
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body && doc.body.textContent) || '';
}

function truncate(s, n) {
  if (s.length <= n) {
    return s;
  }
  return s.slice(0, n) + '\n\n[… truncated for translation …]';
}

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
      classification: null,
      translation: null,
      truncated: false,
    };
    this._abort = null;
  }

  componentDidMount() {
    this._run();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.message &&
      prevProps.message &&
      this.props.message.id !== prevProps.message.id
    ) {
      this._abortRun();
      this.setState({
        status: 'idle',
        error: null,
        classification: null,
        translation: null,
        truncated: false,
      });
      this._run();
    }
  }

  componentWillUnmount() {
    this._abortRun();
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
      return;
    }

    const plain = stripHtmlToText(message.body).trim();
    if (!plain) {
      return;
    }

    this._abort = new AbortController();
    const signal = this._abort.signal;

    this.setState({ status: 'loading', error: null });

    const baseUrl = getBaseUrl();
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

    const snippet = truncate(plain, MAX_CLASSIFY_CHARS);
    let classifyAnswer;
    try {
      classifyAnswer = await chat(
        baseUrl,
        modelId,
        [
          {
            role: 'system',
            content:
              'You are a strict language classifier for email text. Reply with exactly one token: EN if the text is English, NL if it is Dutch, or OTHER if it is any other language or strongly mixed non-English/non-Dutch. No punctuation or explanation.',
          },
          {
            role: 'user',
            content: snippet,
          },
        ],
        16,
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

    const tag = parseLanguageTag(classifyAnswer);
    const classification = tag || 'OTHER';

    if (classification === 'EN' || classification === 'NL') {
      this.setState({ status: 'done', classification, translation: null });
      return;
    }

    const toTranslate = truncate(plain, MAX_TRANSLATE_CHARS);
    const wasTruncated = plain.length > MAX_TRANSLATE_CHARS;

    let translation;
    try {
      translation = await chat(
        baseUrl,
        modelId,
        [
          {
            role: 'system',
            content:
              'You translate email text into clear English. Preserve meaning and tone. Reply with only the English translation, no title or quotes.',
          },
          {
            role: 'user',
            content: toTranslate,
          },
        ],
        8192,
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

    this.setState({
      status: 'done',
      classification: 'OTHER',
      translation,
      truncated: wasTruncated,
    });
  };

  render() {
    const { status, error, classification, translation, truncated } = this.state;

    if (status === 'idle' || status === 'loading') {
      return (
        <div className="lmstudio-translator lmstudio-translator--loading">
          <span className="lmstudio-translator__label">
            {localized('Translation')}
          </span>
          <span className="lmstudio-translator__status">
            {status === 'loading'
              ? localized('Checking language via LM Studio…')
              : ''}
          </span>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="lmstudio-translator lmstudio-translator--error">
          <span className="lmstudio-translator__label">
            {localized('Translation')}
          </span>
          <span className="lmstudio-translator__err">{error}</span>
        </div>
      );
    }

    if (classification === 'EN' || classification === 'NL') {
      return null;
    }

    if (!translation) {
      return null;
    }

    return (
      <div className="lmstudio-translator lmstudio-translator--result">
        <div className="lmstudio-translator__title">
          {localized('English translation')}
          {truncated ? (
            <span className="lmstudio-translator__note">
              {' '}
              ({localized('body truncated for API')})
            </span>
          ) : null}
        </div>
        <div className="lmstudio-translator__text">{translation}</div>
      </div>
    );
  }
}

TranslationBodyHeader.containerStyles = {
  order: 0,
  flexShrink: 0,
};
