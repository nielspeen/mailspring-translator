import {
  React,
  PropTypes,
  MessageBodyProcessor,
  localized,
} from 'mailspring-exports';
import { detectCjkTarget } from './cjk-detect';
import { hasCurrentTranslation, persistTranslatedBody } from './mailspring-translation-storage';
import { translateBodyHtmlWithLmStudio } from './translate-pipeline';
import { stripHtmlToText } from './html-utils';

const DONE_AUTO_HIDE_MS = 5000;
/** MessageBodyProcessor can fire many times while the HTML body is assembled; aborting on every tick cleared loading before LM finished. */
const PIPELINE_RUN_DEBOUNCE_MS = 400;

/**
 * `message:BodyHeader` — LM translation + minimal status (loading / done / error).
 * Translated HTML is applied via shared localStorage + MessageViewExtension (iframe).
 */
export default class TranslationBodyHeader extends React.Component {
  static displayName = 'TranslationBodyHeader';

  static propTypes = {
    message: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this._abort = null;
    this._mbpUnsub = null;
    this._doneTimer = null;
    this._pipelineDebounceTimer = null;
    this.state = {
      ui: 'idle',
      errorText: null,
    };
  }

  componentDidMount() {
    this._subscribeMessageBodyProcessor();
    this._run();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.message &&
      prevProps.message &&
      this.props.message.id !== prevProps.message.id
    ) {
      this._clearPipelineDebounce();
      this._clearDoneTimer();
      this._abortRun();
      this.setState({ ui: 'idle', errorText: null });
      this._unsubscribeMessageBodyProcessor();
      this._subscribeMessageBodyProcessor();
      this._run();
      return;
    }
    if (
      this.props.message &&
      prevProps.message &&
      this.props.message.id === prevProps.message.id &&
      this.props.message !== prevProps.message &&
      typeof this.props.message.body === 'string' &&
      this.props.message.body !== prevProps.message.body
    ) {
      this._abortRun();
      this._run();
    }
  }

  componentWillUnmount() {
    this._clearPipelineDebounce();
    this._clearDoneTimer();
    this._abortRun();
    this._unsubscribeMessageBodyProcessor();
  }

  _clearDoneTimer() {
    if (this._doneTimer) {
      clearTimeout(this._doneTimer);
      this._doneTimer = null;
    }
  }

  _subscribeMessageBodyProcessor = () => {
    this._unsubscribeMessageBodyProcessor();
    const { message } = this.props;
    if (!message) {
      return;
    }
    this._mbpUnsub = MessageBodyProcessor.subscribe(message, true, () => {
      this._scheduleRunFromPipeline();
    });
  };

  _clearPipelineDebounce() {
    if (this._pipelineDebounceTimer) {
      clearTimeout(this._pipelineDebounceTimer);
      this._pipelineDebounceTimer = null;
    }
  }

  _scheduleRunFromPipeline = () => {
    this._clearPipelineDebounce();
    this._pipelineDebounceTimer = setTimeout(() => {
      this._pipelineDebounceTimer = null;
      this._run();
    }, PIPELINE_RUN_DEBOUNCE_MS);
  };

  _unsubscribeMessageBodyProcessor = () => {
    if (this._mbpUnsub) {
      this._mbpUnsub();
      this._mbpUnsub = null;
    }
  };

  _abortRun() {
    if (this._abort) {
      this._abort.abort();
      this._abort = null;
    }
  }

  _run = async () => {
    const { message } = this.props;
    if (!message) {
      return;
    }
    if (typeof message.body !== 'string') {
      return;
    }

    let plain;
    try {
      plain = stripHtmlToText(message.body).trim();
    } catch (e) {
      const msg = (e && e.message) || String(e);
      this.setState({ ui: 'error', errorText: msg });
      if (AppEnv.reportError) {
        AppEnv.reportError(e);
      }
      return;
    }

    const targetLang = detectCjkTarget(plain);
    if (!targetLang) {
      this.setState({ ui: 'idle', errorText: null });
      return;
    }

    if (hasCurrentTranslation(message, targetLang)) {
      this.setState({ ui: 'idle', errorText: null });
      return;
    }

    this._clearDoneTimer();
    this._abortRun();
    this._abort = new AbortController();
    const signal = this._abort.signal;
    const msgId = message.id;

    this.setState({ ui: 'loading', errorText: null });

    let translatedHtml;
    try {
      translatedHtml = await translateBodyHtmlWithLmStudio(
        targetLang,
        message.body,
        signal
      );
    } catch (err) {
      if (signal.aborted || (err && err.name === 'AbortError')) {
        this.setState({ ui: 'idle', errorText: null });
        return;
      }
      const msg = (err && err.message) || String(err);
      this.setState({ ui: 'error', errorText: msg });
      if (AppEnv.reportError) {
        AppEnv.reportError(err);
      }
      return;
    }

    if (this.props.message.id !== msgId) {
      return;
    }

    if (!translatedHtml || !String(translatedHtml).trim()) {
      const msg = localized('LM Studio returned empty translation.');
      this.setState({ ui: 'error', errorText: msg });
      return;
    }

    persistTranslatedBody(message, translatedHtml, {
      fromLang: targetLang,
      toLang: 'en',
    });

    try {
      MessageBodyProcessor.updateCacheForMessage(message);
    } catch (e) {
      const msg = (e && e.message) || String(e);
      this.setState({ ui: 'error', errorText: msg });
      if (AppEnv.reportError) {
        AppEnv.reportError(e);
      }
      return;
    }

    this.setState({ ui: 'done', errorText: null });
    this._doneTimer = setTimeout(() => {
      this._doneTimer = null;
      if (this.props.message && this.props.message.id === msgId) {
        this.setState({ ui: 'idle' });
      }
    }, DONE_AUTO_HIDE_MS);
  };

  render() {
    const { ui, errorText } = this.state;

    if (ui === 'loading') {
      return (
        <div className="lmstudio-translator lmstudio-translator--loading">
          <span className="lmstudio-translator__label">
            {localized('LM Studio')}
          </span>
          <span className="lmstudio-translator__status">
            {localized('Translating…')}
          </span>
        </div>
      );
    }

    if (ui === 'error' && errorText) {
      return (
        <div className="lmstudio-translator lmstudio-translator--error">
          <span className="lmstudio-translator__label">
            {localized('Translation failed')}
          </span>
          <span className="lmstudio-translator__err">{errorText}</span>
        </div>
      );
    }

    if (ui === 'done') {
      return (
        <div className="lmstudio-translator lmstudio-translator--done">
          <span className="lmstudio-translator__label">
            {localized('Translation applied')}
          </span>
          <span className="lmstudio-translator__status">
            {localized('English version is shown in the message below.')}
          </span>
        </div>
      );
    }

    return null;
  }
}

TranslationBodyHeader.containerStyles = {
  order: 0,
  flexShrink: 0,
};
